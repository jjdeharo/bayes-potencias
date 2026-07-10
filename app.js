(function () {
  'use strict';

  const E = window.BayesEngine;
  const { CATEGORIES, FACTORS, QUESTIONS } = window.PowersBank;
  const CATEGORY_IDS = Object.keys(CATEGORIES);
  const FACTOR_IDS = Object.keys(FACTORS);
  const DIAGNOSTIC_MIN = 10;
  const DIAGNOSTIC_MAX = 18;
  const PRACTICE_MIN_PER_CATEGORY = 2;
  const MEMORY = 20;
  const CATEGORY_LAMBDA = E.lambdaFor(MEMORY, CATEGORY_IDS.length);
  const FACTOR_LAMBDA = E.lambdaFor(MEMORY, FACTOR_IDS.length);
  const GLOBAL_LAMBDA = E.lambdaFor(MEMORY, 1);

  let state = null;
  let currentQuestion = null;
  let feedbackOpen = false;
  let random = E.seededRandom(Date.now());

  const byId = (id) => document.getElementById(id);

  function freshLevelDistribution() {
    return E.UNIFORM_LEVEL_PRIOR.slice();
  }

  function freshErrorDistribution() {
    return E.ERROR_PRIOR.slice();
  }

  function newState(mode) {
    const categories = {};
    const categoryEvidence = {};
    const factors = {};
    const factorEvidence = {};
    CATEGORY_IDS.forEach((id) => {
      categories[id] = freshLevelDistribution();
      categoryEvidence[id] = [];
    });
    FACTOR_IDS.forEach((id) => {
      factors[id] = freshErrorDistribution();
      factorEvidence[id] = [];
    });
    return {
      mode,
      global: freshLevelDistribution(),
      categories,
      categoryEvidence,
      factors,
      factorEvidence,
      history: [],
      usage: {},
      recent: [],
      answered: 0,
      correct: 0,
      lastPauseAt: -99,
      stopReason: null,
      confidentStop: false,
      startedAt: new Date().toISOString(),
    };
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((screen) => {
      screen.hidden = screen.id !== id;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function start(mode) {
    state = newState(mode);
    currentQuestion = null;
    feedbackOpen = false;
    random = E.seededRandom(Date.now() ^ (mode === 'practice' ? 0x51f15e : 0xa11ce));
    showScreen('session-screen');
    byId('session-mode').textContent = mode === 'diagnostic' ? 'Diagnóstico' : 'Práctica adaptativa';
    byId('finish-practice').hidden = mode !== 'practice';
    byId('session-map-title').textContent = mode === 'diagnostic' ? 'Mapa provisional' : 'Tu mapa reciente';
    nextQuestion();
  }

  function evidenceCount(categoryId) {
    const timestamps = state.categoryEvidence[categoryId];
    if (state.mode === 'practice') {
      return E.recentCount(timestamps, state.answered, CATEGORY_LAMBDA);
    }
    return timestamps.length;
  }

  function factorCount(factorId) {
    const timestamps = state.factorEvidence[factorId];
    if (state.mode === 'practice') {
      return E.recentCount(timestamps, state.answered, FACTOR_LAMBDA);
    }
    return timestamps.length;
  }

  function globalDecided() {
    return state.answered >= 6 && Math.max(...state.global) >= 0.8;
  }

  function errorsDecided() {
    return FACTOR_IDS.every((id) => E.errorState(state.factors[id], factorCount(id)) !== 'indeterminado'
      && E.errorState(state.factors[id], factorCount(id)) !== 'sin_evidencia');
  }

  function categoriesSampled() {
    return CATEGORY_IDS.every((id) => evidenceCount(id) >= 2);
  }

  function selectDiagnostic() {
    const asked = new Set(state.history.map((entry) => entry.id));
    const available = QUESTIONS.filter((question) => !asked.has(question.id));
    if (!available.length) return null;
    return E.selectCombinedDiagnostic(available, state, {
      categories: Object.fromEntries(CATEGORY_IDS.map((id) => [id, evidenceCount(id)])),
      factors: Object.fromEntries(FACTOR_IDS.map((id) => [id, factorCount(id)])),
    }, {
      globalDecided: globalDecided(),
      categoriesSampled: categoriesSampled(),
      errorsDecided: errorsDecided(),
    }, random);
  }

  function selectPractice() {
    let available = QUESTIONS.filter((question) => !state.recent.includes(question.id));
    if (!available.length) available = QUESTIONS.slice();

    const counts = Object.fromEntries(CATEGORY_IDS.map((id) => [id, evidenceCount(id)]));
    const underSampled = CATEGORY_IDS.filter((id) => counts[id] < PRACTICE_MIN_PER_CATEGORY);
    let targetCategory;
    let phase;

    if (underSampled.length) {
      const minimum = Math.min(...underSampled.map((id) => counts[id]));
      const tied = underSampled.filter((id) => counts[id] === minimum);
      targetCategory = tied[Math.floor(random() * tied.length)];
      phase = 'Exploración inicial';
    } else {
      const thetaValues = CATEGORY_IDS.map((id) => ({ id, theta: E.expectedTheta(state.categories[id]) }));
      const weakest = Math.min(...thetaValues.map((entry) => entry.theta));
      const tied = thetaValues.filter((entry) => entry.theta <= weakest + 0.2);
      targetCategory = tied[Math.floor(random() * tied.length)].id;
      phase = `Refuerzo · ${CATEGORIES[targetCategory].short}`;
    }

    let pool = available.filter((question) => question.category === targetCategory);
    if (!pool.length) pool = QUESTIONS.filter((question) => question.category === targetCategory);
    const unseen = pool.filter((question) => !(state.usage[question.id] > 0));
    if (unseen.length) pool = unseen;

    const gains = pool.map((question) => E.expectedInformationGain(state.categories[targetCategory], question));
    const gainNorm = E.normalizeScores(gains);
    const theta = E.expectedTheta(state.categories[targetCategory]);
    const scored = pool.map((question, index) => {
      const fit = Math.max(0, 1 - Math.abs(E.difficultyFor(question) - theta) / 2);
      const factorState = E.errorState(state.factors[question.factor], factorCount(question.factor));
      const repairBonus = factorState === 'presente' ? 0.12 : factorState === 'indeterminado' ? 0.04 : 0;
      return {
        question,
        score: 0.65 * gainNorm[index] + 0.35 * fit + repairBonus,
        usage: state.usage[question.id] || 0,
      };
    });
    return { question: E.pickNearBest(scored, random, 0.04), phase };
  }

  function nextQuestion() {
    feedbackOpen = false;
    let selected;
    let phase = '';
    if (state.mode === 'diagnostic') {
      selected = selectDiagnostic();
    } else {
      const practiceSelection = selectPractice();
      selected = practiceSelection.question;
      phase = practiceSelection.phase;
    }

    if (!selected) {
      state.stopReason = 'banco_agotado';
      finishSession();
      return;
    }

    currentQuestion = E.shuffleQuestion(selected, random);
    currentQuestion.reused = (state.usage[selected.id] || 0) > 0;
    byId('practice-phase').textContent = phase;
    renderQuestion();
    renderMap();
    renderProgress();
  }

  function renderProgress() {
    if (state.mode === 'diagnostic') {
      const percent = Math.min(100, state.answered / DIAGNOSTIC_MAX * 100);
      byId('progress-label').textContent = `${state.answered} de un máximo de ${DIAGNOSTIC_MAX}`;
      byId('progress-fill').style.width = `${percent}%`;
      byId('progress-fill').setAttribute('aria-valuenow', String(state.answered));
      byId('progress-fill').setAttribute('aria-valuemax', String(DIAGNOSTIC_MAX));
    } else {
      const sampled = CATEGORY_IDS.filter((id) => evidenceCount(id) >= PRACTICE_MIN_PER_CATEGORY).length;
      byId('progress-label').textContent = `${state.answered} ejercicios · ${sampled}/${CATEGORY_IDS.length} familias exploradas`;
      byId('progress-fill').style.width = `${sampled / CATEGORY_IDS.length * 100}%`;
      byId('progress-fill').setAttribute('aria-valuenow', String(sampled));
      byId('progress-fill').setAttribute('aria-valuemax', String(CATEGORY_IDS.length));
    }
  }

  function renderQuestion() {
    const category = CATEGORIES[currentQuestion.category];
    byId('question-number').textContent = `Ejercicio ${state.answered + 1}`;
    byId('question-category').textContent = category.name;
    byId('question-prompt').innerHTML = currentQuestion.prompt;
    byId('hint-text').innerHTML = currentQuestion.hint;
    byId('hint-panel').hidden = true;
    byId('hint-button').hidden = false;
    byId('hint-button').disabled = false;
    byId('hint-button').setAttribute('aria-expanded', 'false');
    byId('reused-note').hidden = !currentQuestion.reused;
    byId('answer-error').hidden = true;
    byId('submit-answer').hidden = false;
    byId('submit-answer').disabled = false;
    byId('feedback').hidden = true;

    const options = byId('options');
    options.innerHTML = currentQuestion.options.map((option, index) => `
      <label class="option" data-index="${index}">
        <input type="radio" name="answer" value="${index}">
        <span class="option-letter" aria-hidden="true">${String.fromCharCode(65 + index)}</span>
        <span class="option-text">${option}</span>
      </label>
    `).join('');
    options.querySelectorAll('input').forEach((input) => {
      input.addEventListener('change', () => {
        options.querySelectorAll('.option').forEach((label) => label.classList.remove('selected'));
        input.closest('.option').classList.add('selected');
        byId('answer-error').hidden = true;
      });
    });
    byId('question-card').focus({ preventScroll: true });
  }

  function showHint() {
    byId('hint-panel').hidden = false;
    byId('hint-button').hidden = true;
    byId('hint-button').setAttribute('aria-expanded', 'true');
  }

  function applyForgetting() {
    state.global = E.attenuate(state.global, E.UNIFORM_LEVEL_PRIOR, GLOBAL_LAMBDA);
    CATEGORY_IDS.forEach((id) => {
      state.categories[id] = E.attenuate(state.categories[id], E.UNIFORM_LEVEL_PRIOR, CATEGORY_LAMBDA);
    });
    FACTOR_IDS.forEach((id) => {
      state.factors[id] = E.attenuate(state.factors[id], E.ERROR_PRIOR, FACTOR_LAMBDA);
    });
  }

  function submitAnswer(event) {
    event.preventDefault();
    if (feedbackOpen) return;
    const selected = document.querySelector('input[name="answer"]:checked');
    if (!selected) {
      byId('answer-error').hidden = false;
      byId('answer-error').focus();
      return;
    }

    feedbackOpen = true;
    const selectedIndex = Number(selected.value);
    const correct = selectedIndex === currentQuestion.correct;
    const hinted = !byId('hint-panel').hidden;
    const reused = currentQuestion.reused;
    const score = correct ? (hinted ? 0.55 : 1) : 0;

    if (state.mode === 'practice') applyForgetting();

    if (!reused) {
      state.global = E.updateOrdinal(state.global, currentQuestion, score);
      state.categories[currentQuestion.category] = E.updateOrdinal(
        state.categories[currentQuestion.category], currentQuestion, score,
      );
      const errorWeight = hinted && correct ? 0.45 : 1;
      state.factors[currentQuestion.factor] = E.updateError(
        state.factors[currentQuestion.factor], currentQuestion, selectedIndex, errorWeight,
      );
    }

    state.answered += 1;
    if (correct) state.correct += 1;
    state.usage[currentQuestion.id] = (state.usage[currentQuestion.id] || 0) + 1;
    state.recent.push(currentQuestion.id);
    state.recent = state.recent.slice(-4);
    if (!reused) {
      state.categoryEvidence[currentQuestion.category].push(state.answered);
      state.factorEvidence[currentQuestion.factor].push(state.answered);
    }

    const historyEntry = {
      id: currentQuestion.id,
      category: currentQuestion.category,
      factor: currentQuestion.factor,
      selected: selectedIndex,
      correct,
      hinted,
      reused,
      score,
      question: Object.assign({}, currentQuestion),
    };
    state.history.push(historyEntry);

    renderFeedback(historyEntry);
    renderMap();
    renderProgress();
  }

  function renderFeedback(entry) {
    const options = byId('options');
    options.querySelectorAll('input').forEach((input) => { input.disabled = true; });
    options.querySelectorAll('.option').forEach((label) => {
      const index = Number(label.dataset.index);
      if (index === currentQuestion.correct) label.classList.add('correct');
      if (index === entry.selected && !entry.correct) label.classList.add('wrong');
    });
    byId('submit-answer').hidden = true;
    byId('hint-button').disabled = true;

    const feedback = byId('feedback');
    feedback.hidden = false;
    byId('feedback-title').textContent = entry.correct ? 'Bien razonado' : 'Vamos a revisar la propiedad';
    byId('feedback-title').className = entry.correct ? 'feedback-title success' : 'feedback-title review';
    byId('feedback-explanation').innerHTML = currentQuestion.explanation;

    let note = '';
    if (entry.hinted && entry.correct) {
      note = 'La pista te ha ayudado: el acierto cuenta como evidencia parcial y volveremos sobre esta idea más adelante.';
    } else if (entry.reused) {
      note = 'Este era un ejercicio de repaso ya visto. Sirve para practicar, pero no modifica tu estimación.';
    } else if (!entry.correct && entry.selected === currentQuestion.trap) {
      note = FACTORS[currentQuestion.factor].repair;
    }
    byId('feedback-note').textContent = note;
    byId('feedback-note').hidden = !note;

    const fit = E.personFit(state.history, E.mapIndex(state.global));
    const livePause = fit && fit.atypical && state.answered - state.lastPauseAt >= 5;
    byId('calm-note').hidden = !livePause;
    if (livePause) state.lastPauseAt = state.answered;

    const shouldFinish = state.mode === 'diagnostic' && diagnosticShouldStop();
    byId('next-question').textContent = shouldFinish ? 'Ver mi orientación' : 'Siguiente ejercicio';
    byId('next-question').onclick = shouldFinish ? finishSession : nextQuestion;
    byId('next-question').focus({ preventScroll: true });
  }

  function diagnosticShouldStop() {
    if (state.answered >= DIAGNOSTIC_MAX) {
      state.stopReason = 'maximo';
      state.confidentStop = globalDecided() && errorsDecided() && categoriesSampled();
      return true;
    }
    if (state.answered >= DIAGNOSTIC_MIN && globalDecided() && errorsDecided() && categoriesSampled()) {
      state.stopReason = 'confianza';
      state.confidentStop = true;
      return true;
    }
    if (state.history.length >= QUESTIONS.length) {
      state.stopReason = 'banco_agotado';
      return true;
    }
    return false;
  }

  function masteryLabel(distribution, count) {
    if (!count) return { text: 'Sin datos', className: 'empty' };
    const theta = E.expectedTheta(distribution);
    if (count < 2) return { text: 'Primer indicio', className: 'early' };
    if (theta < -1.2) return { text: 'Necesita refuerzo', className: 'needs' };
    if (theta < 0.5) return { text: 'En proceso', className: 'progress' };
    if (theta < 2) return { text: 'Sólido', className: 'solid' };
    return { text: 'Reto superado', className: 'strong' };
  }

  function masteryPercent(distribution, count) {
    if (!count) return 0;
    return E.clamp((E.expectedTheta(distribution) + 3) / 6 * 100, 4, 100);
  }

  function renderMap() {
    if (!state) return;
    byId('session-map').innerHTML = CATEGORY_IDS.map((id) => {
      const count = evidenceCount(id);
      const label = masteryLabel(state.categories[id], count);
      const percent = masteryPercent(state.categories[id], count);
      return `
        <div class="map-row">
          <div class="map-copy"><span>${CATEGORIES[id].short}</span><small>${label.text}</small></div>
          <div class="map-track" role="meter" aria-label="${CATEGORIES[id].name}: ${label.text}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent)}">
            <span class="map-fill ${label.className}" style="width:${percent}%"></span>
          </div>
        </div>
      `;
    }).join('');
  }

  function finishSession() {
    if (!state || !state.answered) return;
    if (state.mode === 'practice' && !state.stopReason) state.stopReason = 'alumno';
    renderResult();
    showScreen('result-screen');
  }

  function sortedCategoriesWithEvidence() {
    return CATEGORY_IDS
      .map((id) => ({ id, count: evidenceCount(id), theta: E.expectedTheta(state.categories[id]) }))
      .filter((entry) => entry.count >= 2)
      .sort((a, b) => a.theta - b.theta);
  }

  function confidenceText() {
    const confidence = Math.max(...state.global);
    if (state.mode === 'practice') return state.answered >= 12 ? 'Mapa reciente con evidencia suficiente' : 'Mapa todavía en construcción';
    if (state.confidentStop && confidence >= 0.8) return 'Orientación consistente';
    return 'Orientación provisional';
  }

  function renderResult() {
    const sorted = sortedCategoriesWithEvidence();
    const weakest = sorted[0];
    const strongest = sorted.filter((entry) => entry.theta >= 0.5).slice(-2).reverse();
    const map = E.mapIndex(state.global);
    const fit = E.personFit(state.history, map);
    const provisional = state.mode === 'diagnostic' && (!state.confidentStop || (fit && fit.atypical));
    const next = weakest ? CATEGORIES[weakest.id] : CATEGORIES.misma_base;

    byId('result-kicker').textContent = confidenceText();
    byId('result-title').textContent = weakest
      ? `Tu siguiente paso: ${next.nextStep}`
      : 'Tu siguiente paso: reunir algo más de evidencia';
    byId('result-recommendation').textContent = weakest
      ? `Empieza con ${next.name.toLowerCase()}. Haz dos o tres ejercicios centrados en ${next.nextStep}; después vuelve a una expresión combinada para comprobar la transferencia.`
      : 'Continúa la práctica hasta haber trabajado al menos dos ejercicios de cada familia.';

    byId('provisional-note').hidden = !provisional;
    byId('result-level').textContent = E.LEVELS[map].name;
    byId('result-confidence').textContent = confidenceText();
    byId('result-stats').textContent = `${state.answered} ejercicios · ${state.correct} resueltos sin contar el grado de ayuda`;

    byId('strengths').innerHTML = strongest.length
      ? strongest.map((entry) => `<li>${CATEGORIES[entry.id].name}: ${masteryLabel(state.categories[entry.id], entry.count).text.toLowerCase()}.</li>`).join('')
      : '<li>Aún no hay una fortaleza con evidencia suficiente; eso no significa que no exista.</li>';

    const presentErrors = FACTOR_IDS.filter((id) => E.errorState(state.factors[id], factorCount(id)) === 'presente');
    byId('hypotheses-card').hidden = !presentErrors.length;
    byId('error-hypotheses').innerHTML = presentErrors.map((id) => `<li>${FACTORS[id].student}</li>`).join('');

    const ordered = state.global.slice().sort((a, b) => b - a);
    const closeLevels = ordered[0] - ordered[1] < 0.15;
    byId('student-distribution-card').hidden = !closeLevels;
    byId('student-posterior-bars').innerHTML = closeLevels ? probabilityBars(state.global) : '';

    renderTeacherDetails(fit);
  }

  function probabilityBars(distribution) {
    return distribution.map((probability, index) => `
      <div class="posterior-row">
        <span>${E.LEVELS[index].name}</span>
        <span class="posterior-track"><i style="width:${probability * 100}%"></i></span>
        <strong>${Math.round(probability * 100)} %</strong>
      </div>
    `).join('');
  }

  function renderTeacherDetails(fit) {
    byId('posterior-bars').innerHTML = probabilityBars(state.global);
    byId('teacher-categories').innerHTML = CATEGORY_IDS.map((id) => {
      const count = evidenceCount(id);
      const label = masteryLabel(state.categories[id], count).text;
      return `<tr><th scope="row">${CATEGORIES[id].name}</th><td>${count}</td><td>${label}</td><td>${E.expectedTheta(state.categories[id]).toFixed(2)}</td></tr>`;
    }).join('');
    byId('teacher-errors').innerHTML = FACTOR_IDS.map((id) => {
      const probability = state.factors[id][1];
      const status = E.errorState(state.factors[id], factorCount(id));
      const labels = {
        presente: 'Hipótesis a revisar',
        ausente: 'Ausencia confirmada',
        indeterminado: 'Indeterminado',
        sin_evidencia: 'Sin evidencia suficiente',
      };
      return `<tr><th scope="row">${FACTORS[id].teacher}</th><td>${factorCount(id)}</td><td>${labels[status]}</td><td>${Math.round(probability * 100)} %</td></tr>`;
    }).join('');
    byId('person-fit').textContent = fit
      ? `${fit.lz.toFixed(2)} (${fit.count} respuestas sin pista)${fit.atypical ? ' · patrón atípico: interpretar con cautela' : ' · patrón compatible con el nivel estimado'}`
      : 'No calculado: hacen falta al menos 6 respuestas sin pista y no repetidas.';
    byId('stop-reason').textContent = {
      confianza: 'Confianza alcanzada tras cumplir el mínimo.',
      maximo: 'Máximo práctico alcanzado.',
      banco_agotado: 'Banco útil agotado.',
      alumno: 'Práctica finalizada por el alumno.',
    }[state.stopReason] || 'Sesión finalizada.';
  }

  function exportSummary() {
    const payload = {
      recurso: 'PotenciaLab',
      fecha: new Date().toISOString(),
      modo: state.mode,
      intentos: state.answered,
      nivel: {
        distribucion: Object.fromEntries(E.LEVELS.map((level, index) => [level.name, Number(state.global[index].toFixed(4))])),
        estimado: E.LEVELS[E.mapIndex(state.global)].name,
      },
      categorias: Object.fromEntries(CATEGORY_IDS.map((id) => [id, {
        intentos_con_evidencia: evidenceCount(id),
        theta_esperada: Number(E.expectedTheta(state.categories[id]).toFixed(3)),
      }])),
      factores: Object.fromEntries(FACTOR_IDS.map((id) => [id, {
        evidencia: factorCount(id),
        probabilidad: Number(state.factors[id][1].toFixed(4)),
        estado: E.errorState(state.factors[id], factorCount(id)),
      }])),
      privacidad: 'Archivo generado localmente; no se ha enviado información fuera del navegador.',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `potencialab-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function confirmRestart() {
    if (!state || !state.answered || window.confirm('¿Quieres abandonar esta sesión y volver al inicio?')) {
      state = null;
      currentQuestion = null;
      showScreen('welcome-screen');
    }
  }

  byId('start-diagnostic').addEventListener('click', () => start('diagnostic'));
  byId('start-practice').addEventListener('click', () => start('practice'));
  byId('hint-button').addEventListener('click', showHint);
  byId('answer-form').addEventListener('submit', submitAnswer);
  byId('finish-practice').addEventListener('click', finishSession);
  byId('session-home').addEventListener('click', confirmRestart);
  byId('result-home').addEventListener('click', () => showScreen('welcome-screen'));
  byId('practice-weakness').addEventListener('click', () => start('practice'));
  byId('export-summary').addEventListener('click', exportSummary);
})();
