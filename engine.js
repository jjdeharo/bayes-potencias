(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BayesEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LEVELS = [
    { id: 'inicial', name: 'Base inicial', theta: -3 },
    { id: 'desarrollo', name: 'En desarrollo', theta: -1 },
    { id: 'consolidado', name: 'Consolidado', theta: 1 },
    { id: 'avanzado', name: 'Avanzado', theta: 3 },
  ];

  const DIFFICULTIES = [-1.5, -0.75, 0, 0.75, 1.5];
  const ERROR_PRIOR = [0.75, 0.25]; // [ausente, presente]
  const UNIFORM_LEVEL_PRIOR = LEVELS.map(() => 1 / LEVELS.length);
  const A_EF = 1.25;
  const MASTERY_CAP = 0.95;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalize(values) {
    const safe = values.map((value) => Number.isFinite(value) && value > 0 ? value : 0);
    const sum = safe.reduce((total, value) => total + value, 0);
    if (!sum) return values.map(() => 1 / values.length);
    return safe.map((value) => value / sum);
  }

  function entropy(distribution) {
    return distribution.reduce((total, probability) => {
      if (probability <= 0) return total;
      return total - probability * Math.log2(probability);
    }, 0);
  }

  function difficultyFor(question) {
    const index = clamp(Number(question.difficulty) || 0, 0, DIFFICULTIES.length - 1);
    return DIFFICULTIES[index];
  }

  function optionCountOf(question) {
    return Math.max(2, Number(question.optionCount || question.options?.length || 4));
  }

  function probabilityCorrect(theta, question) {
    const c = 1 / optionCountOf(question);
    const a = A_EF / (1 - c);
    const b = difficultyFor(question);
    const raw = c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
    return Math.min(MASTERY_CAP, raw);
  }

  function likelihoodFromScore(probability, score) {
    const s = clamp(score, 0, 1);
    return Math.pow(probability, s) * Math.pow(1 - probability, 1 - s);
  }

  function updateOrdinal(prior, question, score) {
    return normalize(prior.map((belief, index) => {
      const probability = probabilityCorrect(LEVELS[index].theta, question);
      return belief * likelihoodFromScore(probability, score);
    }));
  }

  function posteriorForBinaryOutcome(prior, question, correct) {
    return updateOrdinal(prior, question, correct ? 1 : 0);
  }

  function expectedInformationGain(prior, question) {
    const predictiveCorrect = prior.reduce((total, belief, index) => {
      return total + belief * probabilityCorrect(LEVELS[index].theta, question);
    }, 0);
    const posteriorCorrect = posteriorForBinaryOutcome(prior, question, true);
    const posteriorWrong = posteriorForBinaryOutcome(prior, question, false);
    const expectedEntropy = predictiveCorrect * entropy(posteriorCorrect)
      + (1 - predictiveCorrect) * entropy(posteriorWrong);
    return Math.max(0, entropy(prior) - expectedEntropy);
  }

  function expectedTheta(distribution) {
    return distribution.reduce((total, belief, index) => total + belief * LEVELS[index].theta, 0);
  }

  function mapIndex(distribution) {
    let best = 0;
    for (let index = 1; index < distribution.length; index += 1) {
      if (distribution[index] > distribution[best]) best = index;
    }
    return best;
  }

  function errorOptionLikelihoods(question) {
    const length = optionCountOf(question);
    const correctIndex = question.correct;
    const trapIndex = question.trap;
    const difficulty = clamp(Number(question.difficulty) || 0, 0, 4);
    const indices = Array.from({ length }, (_, index) => index);

    // La ausencia del error no equivale a dominio perfecto. La dificultad conserva
    // una probabilidad razonable de fallo por otras causas.
    const absentCorrect = 0.78 - difficulty * 0.07;
    const absentWrong = (1 - absentCorrect) / (length - 1);
    const absent = indices.map((index) => index === correctIndex ? absentCorrect : absentWrong);

    const presentCorrect = Math.max(0.14, absentCorrect * 0.28);
    const presentTrap = 0.68;
    const remaining = (1 - presentCorrect - presentTrap) / Math.max(1, length - 2);
    const present = indices.map((index) => {
      if (index === correctIndex) return presentCorrect;
      if (index === trapIndex) return presentTrap;
      return remaining;
    });

    return { absent: normalize(absent), present: normalize(present) };
  }

  function updateError(prior, question, selectedIndex, evidenceWeight) {
    if (!question.factor || question.trap == null) return prior.slice();
    const tables = errorOptionLikelihoods(question);
    const power = clamp(evidenceWeight == null ? 1 : evidenceWeight, 0, 1);
    return normalize([
      prior[0] * Math.pow(tables.absent[selectedIndex], power),
      prior[1] * Math.pow(tables.present[selectedIndex], power),
    ]);
  }

  function errorInformationGain(prior, question) {
    if (!question.factor || question.trap == null) return 0;
    const tables = errorOptionLikelihoods(question);
    let expectedEntropy = 0;
    for (let option = 0; option < optionCountOf(question); option += 1) {
      const predictive = prior[0] * tables.absent[option] + prior[1] * tables.present[option];
      const posterior = normalize([
        prior[0] * tables.absent[option],
        prior[1] * tables.present[option],
      ]);
      expectedEntropy += predictive * entropy(posterior);
    }
    return Math.max(0, entropy(prior) - expectedEntropy);
  }

  function attenuate(distribution, prior, lambda) {
    return normalize(distribution.map((probability, index) => {
      return Math.pow(Math.max(probability, 1e-12), lambda)
        * Math.pow(Math.max(prior[index], 1e-12), 1 - lambda);
    }));
  }

  function lambdaFor(memory, averageGap) {
    const base = 1 - 1 / memory;
    return Math.pow(base, 1 / Math.max(1, averageGap));
  }

  function recentCount(timestamps, currentStep, lambda) {
    const windowLength = Math.ceil(1 / Math.max(1e-9, 1 - lambda));
    return timestamps.filter((step) => currentStep - step < windowLength).length;
  }

  function seededRandom(seed) {
    let state = (Number(seed) || 1) >>> 0;
    return function random() {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function chooseWeighted(items, weights, random) {
    const rng = random || Math.random;
    const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
    if (!total) return items[Math.floor(rng() * items.length)];
    let cursor = rng() * total;
    for (let index = 0; index < items.length; index += 1) {
      cursor -= Math.max(0, weights[index]);
      if (cursor <= 0) return items[index];
    }
    return items[items.length - 1];
  }

  function pickNearBest(scored, random, tolerance) {
    if (!scored.length) return null;
    const max = Math.max(...scored.map((entry) => entry.score));
    const slack = tolerance == null ? 0.035 : tolerance;
    const candidates = scored.filter((entry) => entry.score >= max - slack);
    const weights = candidates.map((entry) => 1 / (1 + (entry.usage || 0)));
    return chooseWeighted(candidates, weights, random).question;
  }

  function normalizeScores(values) {
    const max = Math.max(...values, 0);
    return values.map((value) => max > 1e-12 ? value / max : 0);
  }

  function selectCombinedDiagnostic(available, state, counts, status, random) {
    if (!available.length) return null;
    if (!state.answered) {
      const starters = available.filter((question) => question.difficulty <= 1);
      const pool = starters.length ? starters : available;
      return pool[Math.floor((random || Math.random)() * pool.length)];
    }

    const globalNorm = normalizeScores(available.map((q) => expectedInformationGain(state.global, q)));
    const categoryNorm = normalizeScores(available.map((q) => expectedInformationGain(state.categories[q.category], q)));
    const errorNorm = normalizeScores(available.map((q) => errorInformationGain(state.factors[q.factor], q)));
    const active = {
      global: status.globalDecided ? 0 : 1,
      categories: status.categoriesSampled ? 0.55 : 1,
      errors: status.errorsDecided ? 0 : 1,
    };
    const weightSum = active.global + active.categories + active.errors;
    Object.keys(active).forEach((key) => { active[key] /= weightSum || 1; });

    const scored = available.map((question, index) => {
      const categoryNeed = 1 / (1 + (counts.categories[question.category] || 0));
      const factorNeed = 1 / (1 + (counts.factors[question.factor] || 0));
      const categoryUtility = 0.72 * categoryNorm[index] + 0.28 * categoryNeed;
      const errorUtility = 0.72 * errorNorm[index] + 0.28 * factorNeed;
      return {
        question,
        score: active.global * globalNorm[index]
          + active.categories * categoryUtility
          + active.errors * errorUtility,
        usage: state.usage?.[question.id] || 0,
      };
    });
    return pickNearBest(scored, random, 0.025);
  }

  function shuffleQuestion(question, random) {
    const rng = random || Math.random;
    const indexed = question.options.map((html, oldIndex) => ({ html, oldIndex }));
    for (let index = indexed.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(rng() * (index + 1));
      [indexed[index], indexed[swap]] = [indexed[swap], indexed[index]];
    }
    const copy = Object.assign({}, question, { options: indexed.map((entry) => entry.html) });
    copy.correct = indexed.findIndex((entry) => entry.oldIndex === question.correct);
    copy.trap = indexed.findIndex((entry) => entry.oldIndex === question.trap);
    return copy;
  }

  function personFit(history, levelIndex) {
    let observed = 0;
    let expected = 0;
    let variance = 0;
    let count = 0;
    const theta = LEVELS[levelIndex].theta;
    history.forEach((entry) => {
      if (entry.hinted || entry.reused || typeof entry.correct !== 'boolean') return;
      const probability = probabilityCorrect(theta, entry.question);
      const failure = 1 - probability;
      const logit = Math.log(probability) - Math.log(failure);
      observed += entry.correct ? Math.log(probability) : Math.log(failure);
      expected += probability * Math.log(probability) + failure * Math.log(failure);
      variance += probability * failure * logit * logit;
      count += 1;
    });
    if (count < 6 || variance < 1e-9) return null;
    const lz = (observed - expected) / Math.sqrt(variance);
    return { lz, count, atypical: lz < -2 };
  }

  function errorState(distribution, evidenceCount) {
    if (evidenceCount < 2) return 'sin_evidencia';
    const probability = distribution[1];
    if (probability >= 0.7) return 'presente';
    if (probability <= 0.3) return 'ausente';
    return 'indeterminado';
  }

  return {
    A_EF,
    DIFFICULTIES,
    ERROR_PRIOR,
    LEVELS,
    MASTERY_CAP,
    UNIFORM_LEVEL_PRIOR,
    attenuate,
    chooseWeighted,
    clamp,
    difficultyFor,
    entropy,
    errorInformationGain,
    errorOptionLikelihoods,
    errorState,
    expectedInformationGain,
    expectedTheta,
    lambdaFor,
    likelihoodFromScore,
    mapIndex,
    normalize,
    normalizeScores,
    optionCountOf,
    personFit,
    pickNearBest,
    probabilityCorrect,
    recentCount,
    seededRandom,
    selectCombinedDiagnostic,
    shuffleQuestion,
    updateError,
    updateOrdinal,
  };
});
