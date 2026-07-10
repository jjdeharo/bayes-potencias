'use strict';

// Comprueba el generador de variantes: por cada plantilla genera muchas variantes y
// verifica que la respuesta correcta coincide numéricamente con la expresión del
// enunciado, que las cuatro opciones son distintas y que todo el LaTeX es válido.
//
//   node scripts/verify-variants.js [variantes-por-plantilla]

const E = require('../engine.js');
const bank = require('../questions.js');
const katex = require('../vendor/katex/katex.min.js');

const SAMPLES = Number(process.argv[2]) || 300;
const TOLERANCE = 1e-9;

// Valores de prueba para las letras: lejos de 0 y de 1, donde muchas igualdades
// falsas se cumplirían por casualidad.
const LETTER_VALUES = {
  x: 1.7, y: 2.3, a: 1.9, b: 2.7, t: 1.4, u: 2.1, m: 3.4, n: 1.6,
};

function valueOf(letter) {
  const value = LETTER_VALUES[letter];
  if (value == null) throw new Error(`Falta un valor de prueba para «${letter}»`);
  return value;
}

function mathFragments(text) {
  const fragments = [];
  const pattern = /\\\((.+?)\\\)/gs;
  let match = pattern.exec(text);
  while (match) {
    fragments.push(match[1]);
    match = pattern.exec(text);
  }
  return fragments;
}

function relativeError(left, right) {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) / scale;
}

const failures = [];
let checkedVariants = 0;
let checkedFragments = 0;

bank.TEMPLATES.forEach((template) => {
  const random = E.seededRandom(0x5eed ^ template.id.split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 7));
  const seenKeys = new Set();

  for (let sample = 0; sample < SAMPLES; sample += 1) {
    let question;
    try {
      question = bank.instantiate(template, random);
    } catch (error) {
      failures.push(`${template.id}: ${error.message}`);
      break;
    }
    checkedVariants += 1;
    seenKeys.add(question.variantKey);

    if (question.options.length !== 4) failures.push(`${template.id}: no tiene 4 opciones`);
    if (new Set(question.options).size !== 4) {
      failures.push(`${template.id}: opciones repetidas → ${JSON.stringify(question.options)}`);
    }
    if (question.correct === question.trap) failures.push(`${template.id}: correcta y distractor coinciden`);
    [question.correct, question.trap].forEach((index) => {
      if (!(index >= 0 && index < 4)) failures.push(`${template.id}: índice fuera de rango (${index})`);
    });
    if (!question.prompt || !question.hint || !question.explanation) {
      failures.push(`${template.id}: falta enunciado, pista o explicación`);
    }

    // El LaTeX de enunciado, opciones, pista y explicación debe compilar.
    const texts = [question.prompt, question.hint, question.explanation, ...question.options];
    texts.forEach((text) => {
      mathFragments(text).forEach((fragment) => {
        checkedFragments += 1;
        try {
          katex.renderToString(fragment, { throwOnError: true });
        } catch (error) {
          failures.push(`${template.id}: LaTeX inválido «${fragment}» (${error.message})`);
        }
      });
    });

    // La respuesta correcta debe reproducir el valor de la expresión del enunciado.
    if (typeof template.check === 'function') {
      const [expression, answer] = template.check(question.params, valueOf);
      if (!Number.isFinite(expression) || !Number.isFinite(answer)) {
        failures.push(`${template.id}: la comprobación numérica no es finita (${expression}, ${answer})`);
      } else if (relativeError(expression, answer) > TOLERANCE) {
        failures.push(`${template.id}: la respuesta no coincide con la expresión (${expression} ≠ ${answer}) con ${JSON.stringify(question.params)}`);
      }
    } else {
      failures.push(`${template.id}: sin comprobación numérica`);
    }
  }

  const label = template.id.padEnd(6);
  process.stdout.write(`${label} variantes distintas: ${String(seenKeys.size).padStart(4)} de ${SAMPLES} intentos\n`);
});

process.stdout.write(`\n${checkedVariants} variantes y ${checkedFragments} fragmentos LaTeX comprobados.\n`);

if (failures.length) {
  const unique = [...new Set(failures)];
  process.stdout.write(`\n${unique.length} problemas:\n`);
  unique.slice(0, 40).forEach((failure) => process.stdout.write(`  - ${failure}\n`));
  process.exit(1);
}

process.stdout.write('Sin problemas: todas las variantes son correctas, distintas y renderizables.\n');
