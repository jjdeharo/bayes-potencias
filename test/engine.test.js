'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');
const bank = require('../questions.js');
const validation = require('../validation-core.js');

test('la escala theta es fija, simétrica y separada por intervalos de 2', () => {
  assert.deepEqual(E.LEVELS.map((level) => level.theta), [-3, -1, 1, 3]);
});

test('las cinco dificultades quedan dentro de la mitad central de theta', () => {
  assert.deepEqual(E.DIFFICULTIES, [-1.5, -0.75, 0, 0.75, 1.5]);
  assert.ok(E.DIFFICULTIES.every((value) => value >= -1.5 && value <= 1.5));
});

test('IRT 3PL conserva el suelo de azar, ordena niveles y aplica el techo 0.95', () => {
  const easy = bank.QUESTIONS.find((question) => question.difficulty === 0);
  const probabilities = E.LEVELS.map((level) => E.probabilityCorrect(level.theta, easy));
  assert.ok(probabilities.every((probability) => probability >= 0.25 && probability <= 0.95));
  assert.ok(probabilities.every((probability, index) => index === 0 || probability >= probabilities[index - 1]));
  assert.equal(probabilities.at(-1), 0.95);
});

test('cada actualización ordinal normaliza y modifica la creencia', () => {
  const question = bank.QUESTIONS[0];
  const correct = E.updateOrdinal(E.UNIFORM_LEVEL_PRIOR, question, 1);
  const wrong = E.updateOrdinal(E.UNIFORM_LEVEL_PRIOR, question, 0);
  assert.ok(Math.abs(correct.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  assert.ok(Math.abs(wrong.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  assert.ok(E.expectedTheta(correct) > E.expectedTheta(E.UNIFORM_LEVEL_PRIOR));
  assert.ok(E.expectedTheta(wrong) < E.expectedTheta(E.UNIFORM_LEVEL_PRIOR));
});

test('la ganancia esperada de información es finita y no negativa', () => {
  bank.QUESTIONS.forEach((question) => {
    const gain = E.expectedInformationGain(E.UNIFORM_LEVEL_PRIOR, question);
    assert.ok(Number.isFinite(gain));
    assert.ok(gain >= 0);
  });
});

test('el prior de error es informativo y exige dos evidencias para decidir', () => {
  assert.deepEqual(E.ERROR_PRIOR, [0.75, 0.25]);
  assert.equal(E.errorState(E.ERROR_PRIOR, 0), 'sin_evidencia');
  assert.equal(E.errorState([0.9, 0.1], 1), 'sin_evidencia');
  assert.equal(E.errorState([0.9, 0.1], 2), 'ausente');
  assert.equal(E.errorState([0.2, 0.8], 2), 'presente');
});

test('el olvido converge hacia el prior informativo, no hacia la uniforme', () => {
  let belief = [0.1, 0.9];
  for (let index = 0; index < 800; index += 1) belief = E.attenuate(belief, E.ERROR_PRIOR, 0.95);
  assert.ok(Math.abs(belief[1] - 0.25) < 1e-6);
});

test('el banco tiene redundancia local y metadatos completos', () => {
  assert.equal(bank.QUESTIONS.length, 36);
  Object.keys(bank.CATEGORIES).forEach((category) => {
    assert.ok(bank.QUESTIONS.filter((question) => question.category === category).length >= 6);
  });
  bank.QUESTIONS.forEach((question) => {
    assert.equal(question.options.length, 4, question.id);
    assert.notEqual(question.correct, question.trap, question.id);
    assert.ok(bank.FACTORS[question.factor], question.id);
    assert.ok(question.explanation && question.hint, question.id);
  });
});

test('la validación es reproducible con la misma semilla', () => {
  const first = validation.runValidation({ iterations: 3, seed: 73 });
  const second = validation.runValidation({ iterations: 3, seed: 73 });
  assert.deepEqual(first.matrix, second.matrix);
  assert.deepEqual(first.factorResults, second.factorResults);
});
