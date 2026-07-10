(function (root, factory) {
  let engine = root.BayesEngine;
  let bank = root.PowersBank;
  if (typeof module === 'object' && module.exports) {
    engine = require('./engine.js');
    bank = require('./questions.js');
    module.exports = factory(engine, bank);
  } else {
    root.PowersValidation = factory(engine, bank);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E, bank) {
  'use strict';

  const { QUESTIONS, CATEGORIES, FACTORS } = bank;
  const CATEGORY_IDS = Object.keys(CATEGORIES);
  const FACTOR_IDS = Object.keys(FACTORS);
  const MIN_QUESTIONS = 10;
  const MAX_QUESTIONS = 18;

  function freshState() {
    return {
      global: E.UNIFORM_LEVEL_PRIOR.slice(),
      categories: Object.fromEntries(CATEGORY_IDS.map((id) => [id, E.UNIFORM_LEVEL_PRIOR.slice()])),
      factors: Object.fromEntries(FACTOR_IDS.map((id) => [id, E.ERROR_PRIOR.slice()])),
      categoryCounts: Object.fromEntries(CATEGORY_IDS.map((id) => [id, 0])),
      factorCounts: Object.fromEntries(FACTOR_IDS.map((id) => [id, 0])),
      asked: new Set(),
      usage: {},
      answered: 0,
    };
  }

  function errorState(state, id) {
    return E.errorState(state.factors[id], state.factorCounts[id]);
  }

  function globalDecided(state) {
    return state.answered >= 6 && Math.max(...state.global) >= 0.8;
  }

  function errorsDecided(state) {
    return FACTOR_IDS.every((id) => ['presente', 'ausente'].includes(errorState(state, id)));
  }

  function categoriesSampled(state) {
    return CATEGORY_IDS.every((id) => state.categoryCounts[id] >= 2);
  }

  function selectQuestion(state, random) {
    const available = QUESTIONS.filter((question) => !state.asked.has(question.id));
    return E.selectCombinedDiagnostic(available, state, {
      categories: state.categoryCounts,
      factors: state.factorCounts,
    }, {
      globalDecided: globalDecided(state),
      errorsDecided: errorsDecided(state),
      categoriesSampled: categoriesSampled(state),
    }, random);
  }

  function sampleIndex(probabilities, random) {
    let cursor = random();
    for (let index = 0; index < probabilities.length; index += 1) {
      cursor -= probabilities[index];
      if (cursor <= 0) return index;
    }
    return probabilities.length - 1;
  }

  function irtOptionDistribution(levelIndex, question) {
    const correctProbability = E.probabilityCorrect(E.LEVELS[levelIndex].theta, question);
    const wrongProbability = (1 - correctProbability) / (question.options.length - 1);
    return question.options.map((_, index) => index === question.correct ? correctProbability : wrongProbability);
  }

  function applyResponse(state, question, selectedIndex) {
    const score = selectedIndex === question.correct ? 1 : 0;
    state.global = E.updateOrdinal(state.global, question, score);
    state.categories[question.category] = E.updateOrdinal(state.categories[question.category], question, score);
    state.factors[question.factor] = E.updateError(state.factors[question.factor], question, selectedIndex, 1);
    state.answered += 1;
    state.asked.add(question.id);
    state.usage[question.id] = 1;
    state.categoryCounts[question.category] += 1;
    state.factorCounts[question.factor] += 1;
  }

  function shouldStop(state) {
    if (state.answered >= MAX_QUESTIONS) return true;
    return state.answered >= MIN_QUESTIONS
      && globalDecided(state)
      && errorsDecided(state)
      && categoriesSampled(state);
  }

  function simulateGlobalStudent(levelIndex, random) {
    const state = freshState();
    while (!shouldStop(state)) {
      const question = selectQuestion(state, random);
      if (!question) break;
      const selected = sampleIndex(irtOptionDistribution(levelIndex, question), random);
      applyResponse(state, question, selected);
    }
    const confident = Math.max(...state.global) >= 0.8;
    return {
      diagnosis: confident ? E.mapIndex(state.global) : E.LEVELS.length,
      length: state.answered,
      confidence: Math.max(...state.global),
    };
  }

  function simulateFactorStudent(targetFactor, present, random) {
    const state = freshState();
    while (!shouldStop(state)) {
      const question = selectQuestion(state, random);
      if (!question) break;
      const tables = E.errorOptionLikelihoods(question);
      const distribution = question.factor === targetFactor && present ? tables.present : tables.absent;
      const selected = sampleIndex(distribution, random);
      applyResponse(state, question, selected);
    }
    return {
      diagnosis: errorState(state, targetFactor),
      length: state.answered,
    };
  }

  function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  }

  function runValidation(options) {
    const settings = Object.assign({ iterations: 1000, seed: 20260710 }, options);
    const random = E.seededRandom(settings.seed);
    const size = E.LEVELS.length + 1;
    const matrix = Array.from({ length: E.LEVELS.length }, () => Array(size).fill(0));
    const globalLengths = [];

    for (let truth = 0; truth < E.LEVELS.length; truth += 1) {
      for (let iteration = 0; iteration < settings.iterations; iteration += 1) {
        const result = simulateGlobalStudent(truth, random);
        matrix[truth][result.diagnosis] += 1;
        globalLengths.push(result.length);
      }
    }

    const globalRates = matrix.map((row, index) => row[index] / settings.iterations);
    const provisionalRate = matrix.reduce((sum, row) => sum + row[size - 1], 0)
      / (settings.iterations * E.LEVELS.length);

    const factorResults = {};
    const factorLengths = [];
    FACTOR_IDS.forEach((factorId) => {
      const result = {
        absent: { ausente: 0, presente: 0, indeterminado: 0, sin_evidencia: 0 },
        present: { ausente: 0, presente: 0, indeterminado: 0, sin_evidencia: 0 },
      };
      for (const present of [false, true]) {
        const key = present ? 'present' : 'absent';
        for (let iteration = 0; iteration < settings.iterations; iteration += 1) {
          const simulation = simulateFactorStudent(factorId, present, random);
          result[key][simulation.diagnosis] += 1;
          factorLengths.push(simulation.length);
        }
      }
      result.absentAccuracy = result.absent.ausente / settings.iterations;
      result.presentAccuracy = result.present.presente / settings.iterations;
      result.balancedAccuracy = (result.absentAccuracy + result.presentAccuracy) / 2;
      result.indeterminateRate = (
        result.absent.indeterminado + result.absent.sin_evidencia
        + result.present.indeterminado + result.present.sin_evidencia
      ) / (settings.iterations * 2);
      factorResults[factorId] = result;
    });

    const alerts = [];
    globalRates.forEach((rate, index) => {
      if (rate < 0.7) alerts.push(`El nivel «${E.LEVELS[index].name}» queda por debajo del 70 % (${Math.round(rate * 100)} %).`);
    });
    FACTOR_IDS.forEach((id) => {
      const result = factorResults[id];
      if (result.absentAccuracy < 0.7 || result.presentAccuracy < 0.7) {
        alerts.push(`El factor «${FACTORS[id].teacher}» no separa ambos estados por encima del 70 %.`);
      }
    });

    return {
      iterations: settings.iterations,
      seed: settings.seed,
      matrix,
      globalRates,
      balancedAccuracy: average(globalRates),
      provisionalRate,
      averageGlobalLength: average(globalLengths),
      averageFactorLength: average(factorLengths),
      factorResults,
      alerts,
    };
  }

  return { runValidation, simulateGlobalStudent, simulateFactorStudent };
});
