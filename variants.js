(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PowersVariants = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function randint(random, min, max) {
    return min + Math.floor(random() * (max - min + 1));
  }

  function pick(random, values) {
    return values[Math.floor(random() * values.length)];
  }

  // Extrae `count` elementos distintos de `values`.
  function pickMany(random, values, count) {
    const pool = values.slice();
    const chosen = [];
    for (let index = 0; index < count; index += 1) {
      chosen.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
    }
    return chosen;
  }

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const rest = a % b;
      a = b;
      b = rest;
    }
    return a || 1;
  }

  // Exponente en LaTeX: entero (`5`, `-3`) o fracción irreducible en línea (`2/5`).
  function expTex(numerator, denominator) {
    if (denominator == null || denominator === 1) return String(numerator);
    const divisor = gcd(numerator, denominator);
    const n = numerator / divisor;
    const d = denominator / divisor;
    return d === 1 ? String(n) : `${n}/${d}`;
  }

  // Potencia en LaTeX, omitiendo el exponente cuando vale 1 y colapsando a `1` cuando vale 0.
  function pw(base, exponent) {
    if (exponent === 1) return String(base);
    if (exponent === 0) return '1';
    return `${base}^{${exponent}}`;
  }

  function fracTex(numerator, denominator) {
    if (String(denominator) === '1') return String(numerator);
    return `\\frac{${numerator}}{${denominator}}`;
  }

  function sqrtTex(index, radicand) {
    return index === 2 ? `\\sqrt{${radicand}}` : `\\sqrt[${index}]{${radicand}}`;
  }

  // Envuelve una expresión en los delimitadores LaTeX que renderiza KaTeX.
  function m(expression) {
    return `\\(${expression}\\)`;
  }

  // Coeficiente delante de una expresión: `1x` se escribe `x` y `-1x` se escribe `-x`.
  function coefTex(coefficient, rest) {
    if (!rest) return String(coefficient);
    if (coefficient === 1) return rest;
    if (coefficient === -1) return `-${rest}`;
    return `${coefficient}${rest}`;
  }

  function signedTerm(coefficient, rest) {
    const sign = coefficient < 0 ? '-' : '+';
    return `${sign}${coefTex(Math.abs(coefficient), rest)}`;
  }

  return {
    coefTex,
    expTex,
    fracTex,
    gcd,
    m,
    pick,
    pickMany,
    pw,
    randint,
    signedTerm,
    sqrtTex,
  };
});
