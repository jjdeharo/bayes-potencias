(function (root, factory) {
  let variants = root.PowersVariants;
  if (typeof module === 'object' && module.exports) {
    variants = require('./variants.js');
    module.exports = factory(variants);
  } else {
    root.PowersBank = factory(variants);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (V) {
  'use strict';

  const { coefTex, expTex, fracTex, gcd, m, pick, pickMany, pw, randint, sqrtTex } = V;

  const CATEGORIES = {
    misma_base: {
      name: 'Misma base', short: 'Misma base',
      description: 'Producto y cociente de potencias con la misma base.',
      nextStep: 'combinar primero los exponentes y conservar la base',
    },
    potencia_potencia: {
      name: 'Potencia de una potencia', short: 'Potencia de potencia',
      description: 'Potencias encadenadas y exponentes algebraicos.',
      nextStep: 'multiplicar los exponentes en las potencias encadenadas',
    },
    distribucion: {
      name: 'Producto, cociente y suma', short: 'Distribución',
      description: 'Cuándo se puede distribuir un exponente y cuándo no.',
      nextStep: 'distinguir productos de sumas antes de distribuir el exponente',
    },
    negativos: {
      name: 'Exponente cero y negativo', short: 'Cero y negativos',
      description: 'Inversos, exponentes nulos y signos.',
      nextStep: 'convertir los exponentes negativos en inversos antes de operar',
    },
    racionales: {
      name: 'Exponentes racionales', short: 'Racionales y raíces',
      description: 'Relación entre potencias fraccionarias y radicales.',
      nextStep: 'leer el denominador como índice de la raíz y el numerador como potencia',
    },
    combinadas: {
      name: 'Expresiones combinadas', short: 'Combinadas',
      description: 'Uso coordinado de varias propiedades.',
      nextStep: 'ordenar la simplificación propiedad por propiedad',
    },
  };

  const FACTORS = {
    opera_exponentes: {
      teacher: 'Opera los exponentes como si la operación exterior fuese la misma.',
      student: 'Comprobemos cuándo hay que sumar o restar exponentes y cuándo no.',
      repair: 'Escribe primero una sola base y decide la operación entre exponentes mirando si fuera hay producto o cociente.',
    },
    potencia_incompleta: {
      teacher: 'Suma exponentes en una potencia de potencia o no aplica la potencia a todos los factores.',
      student: 'Comprobemos si el exponente exterior se aplica a toda la expresión y multiplica los exponentes interiores.',
      repair: 'Rodea la expresión afectada por el exponente exterior; todos sus factores quedan elevados y los exponentes encadenados se multiplican.',
    },
    distribuye_suma: {
      teacher: 'Distribuye una potencia sobre una suma o una resta.',
      student: 'Comprobemos la diferencia entre elevar un producto y elevar una suma.',
      repair: 'La potencia se distribuye sobre productos y cocientes, pero una suma o resta requiere desarrollar el producto notable.',
    },
    exponente_negativo: {
      teacher: 'Interpreta el exponente negativo como signo negativo, no como inverso.',
      student: 'Comprobemos si un exponente negativo está indicando un inverso.',
      repair: 'Cambia la potencia de lado en la fracción para volver positivo el exponente; no cambies el signo de la base.',
    },
    fraccionario: {
      teacher: 'Intercambia el índice de la raíz y la potencia en un exponente racional.',
      student: 'Comprobemos cómo se leen el numerador y el denominador de un exponente fraccionario.',
      repair: 'En a^(m/n), el denominador n es el índice de la raíz y el numerador m es la potencia.',
    },
    signo_paridad: {
      teacher: 'No distingue (−a)^n de −a^n ni tiene en cuenta la paridad del exponente al fijar el signo.',
      student: 'Comprobemos qué le pasa al signo según dónde esté el paréntesis y si el exponente es par o impar.',
      repair: 'Mira si el signo está dentro del paréntesis: en (−a)^n el signo también se eleva y con exponente par el resultado queda positivo; en −a^n el signo se queda fuera de la potencia.',
    },
  };

  const ONE_VAR = ['x', 'y', 'a', 'b', 't', 'u'];
  const TWO_VARS = ['x', 'y', 'a', 'b'];

  // Cada plantilla genera ejercicios equivalentes con datos distintos. Los metadatos
  // (dificultad, factor, índices de la opción correcta y del distractor) son fijos:
  // toda variante comparte el mismo modelo IRT, así que la validación sigue siendo válida.
  // `build` deriva la respuesta correcta aplicando la propia regla que el ítem enseña,
  // y `check` la contrasta numéricamente contra la expresión original.
  const TEMPLATES = [
    // Producto y cociente con la misma base
    {
      id: 'mb01', category: 'misma_base', difficulty: 0,
      factor: 'opera_exponentes', correct: 0, trap: 1,
      params(random) {
        let p;
        do {
          p = { b: pick(random, [2, 3, 5, 7]), m: randint(random, 2, 5), n: randint(random, 2, 6) };
        } while (p.m === p.n || p.m * p.n === p.m + p.n);
        return p;
      },
      build(p) {
        return {
          prompt: `Simplifica ${m(`${pw(p.b, p.m)} \\cdot ${pw(p.b, p.n)}`)}.`,
          options: [
            m(pw(p.b, p.m + p.n)),
            m(pw(p.b, p.m * p.n)),
            m(pw(p.b * p.b, p.m + p.n)),
            m(pw(p.b, Math.abs(p.n - p.m))),
          ],
          hint: 'La base es la misma y las potencias se están multiplicando.',
          explanation: `En un producto de potencias de la misma base se suman los exponentes: ${m(`${p.b}^{${p.m}+${p.n}} = ${pw(p.b, p.m + p.n)}`)}.`,
        };
      },
      check(p) {
        return [Math.pow(p.b, p.m) * Math.pow(p.b, p.n), Math.pow(p.b, p.m + p.n)];
      },
    },
    {
      id: 'mb02', category: 'misma_base', difficulty: 0,
      factor: 'opera_exponentes', correct: 2, trap: 1,
      params(random) {
        let p;
        do {
          p = { x: pick(random, ONE_VAR), p: randint(random, 5, 12), q: randint(random, 2, 5) };
        } while (p.p - p.q < 2 || p.p % p.q === 0);
        return p;
      },
      build(p) {
        return {
          prompt: `Para ${m(`${p.x} \\neq 0`)}, ¿a qué equivale ${m(`${pw(p.x, p.p)} / ${pw(p.x, p.q)}`)}?`,
          options: [
            m(pw(p.x, p.p + p.q)),
            m(`${p.x}^{${expTex(p.p, p.q)}}`),
            m(pw(p.x, p.p - p.q)),
            m(pw(p.x, -(p.p - p.q))),
          ],
          hint: 'En un cociente de la misma base se resta el exponente del denominador.',
          explanation: `${m(`${pw(p.x, p.p)} / ${pw(p.x, p.q)} = ${p.x}^{${p.p}-${p.q}} = ${pw(p.x, p.p - p.q)}`)}. Los exponentes no se dividen.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        return [Math.pow(x, p.p) / Math.pow(x, p.q), Math.pow(x, p.p - p.q)];
      },
    },
    {
      id: 'mb03', category: 'misma_base', difficulty: 1,
      factor: 'opera_exponentes', correct: 3, trap: 0,
      params(random) {
        const mm = randint(random, 2, 4);
        return { a: pick(random, ONE_VAR), m: mm, n: randint(random, mm + 2, 8) };
      },
      build(p) {
        return {
          prompt: `Simplifica ${m(`${pw(p.a, -p.m)} \\cdot ${pw(p.a, p.n)}`)}.`,
          options: [
            m(pw(p.a, -(p.m * p.n))),
            m(pw(p.a, p.m + p.n)),
            m(pw(p.a, -(p.n - p.m))),
            m(pw(p.a, p.n - p.m)),
          ],
          hint: 'Suma los exponentes conservando su signo.',
          explanation: `${m(`-${p.m} + ${p.n} = ${p.n - p.m}`)}, por tanto el resultado es ${m(pw(p.a, p.n - p.m))}.`,
        };
      },
      check(p, val) {
        const a = val(p.a);
        return [Math.pow(a, -p.m) * Math.pow(a, p.n), Math.pow(a, p.n - p.m)];
      },
    },
    {
      id: 'mb04', category: 'misma_base', difficulty: 2,
      factor: 'opera_exponentes', correct: 0, trap: 1,
      params(random) {
        let p;
        do {
          p = {
            b: pick(random, [2, 3, 5]), p: randint(random, 6, 10),
            q: randint(random, 2, 4), r: randint(random, 2, 4),
          };
        } while (p.q === p.r || p.p - p.q - p.r < 1);
        return p;
      },
      build(p) {
        const result = p.p - p.q - p.r;
        return {
          prompt: `Simplifica ${m(`(${pw(p.b, p.p)} \\cdot ${pw(p.b, -p.q)}) / ${pw(p.b, p.r)}`)}.`,
          options: [
            m(pw(p.b, result)),
            m(pw(p.b, p.p - p.q + p.r)),
            m(pw(p.b, -(p.p * p.q * p.r))),
            m(pw(p.b, p.p + p.q - p.r)),
          ],
          hint: 'En el exponente final aparece una suma y después una resta.',
          explanation: `Se combinan los exponentes: ${m(`${p.p} + (-${p.q}) - ${p.r} = ${result}`)}.`,
        };
      },
      check(p) {
        const value = Math.pow(p.b, p.p) * Math.pow(p.b, -p.q) / Math.pow(p.b, p.r);
        return [value, Math.pow(p.b, p.p - p.q - p.r)];
      },
    },
    {
      id: 'mb05', category: 'misma_base', difficulty: 2,
      factor: 'opera_exponentes', correct: 1, trap: 2,
      params(random) {
        return { b: pick(random, [2, 3, 5]), k: randint(random, 2, 4) };
      },
      build(p) {
        return {
          prompt: `¿Qué valor tiene ${m(`${p.b}^{n} \\cdot ${p.b}^{${p.k}-n}`)}?`,
          options: [
            m(`${p.b}^{2n-${p.k}}`),
            m(String(Math.pow(p.b, p.k))),
            m(`${p.b}^{2n}`),
            m('1'),
          ],
          hint: `Suma ${m(`n + (${p.k}-n)`)}.`,
          explanation: `${m(`n + ${p.k} - n = ${p.k}`)}, así que queda ${m(`${pw(p.b, p.k)} = ${Math.pow(p.b, p.k)}`)}.`,
        };
      },
      check(p, val) {
        const n = val('n');
        return [Math.pow(p.b, n) * Math.pow(p.b, p.k - n), Math.pow(p.b, p.k)];
      },
    },
    {
      id: 'mb06', category: 'misma_base', difficulty: 3,
      factor: 'opera_exponentes', correct: 2, trap: 0,
      params(random) {
        const [x, y] = pickMany(random, TWO_VARS, 2);
        const pp = randint(random, 2, 4);
        return { x, y, p: pp, q: randint(random, 2, 4), r: randint(random, pp + 1, 7), s: randint(random, 2, 4) };
      },
      build(p) {
        const correct = fracTex(pw(p.y, p.q + p.s), pw(p.x, p.r - p.p));
        return {
          prompt: `Para ${m(`${p.x}, ${p.y} \\neq 0`)}, simplifica con exponentes positivos ${m(`${pw(p.x, p.p)}${pw(p.y, p.q)} \\cdot ${pw(p.x, -p.r)}${pw(p.y, p.s)}`)}.`,
          options: [
            m(`${pw(p.x, -(p.p * p.r))}${pw(p.y, p.q * p.s)}`),
            m(`${pw(p.x, p.p + p.r)}${pw(p.y, p.q + p.s)}`),
            m(correct),
            m(fracTex(pw(p.x, p.r - p.p), pw(p.y, p.q + p.s))),
          ],
          hint: `Agrupa por separado las potencias de ${m(p.x)} y las de ${m(p.y)}.`,
          explanation: `${m(`${p.x}^{${p.p}-${p.r}}${p.y}^{${p.q}+${p.s}} = ${pw(p.x, p.p - p.r)}${pw(p.y, p.q + p.s)} = ${correct}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        const y = val(p.y);
        const expr = Math.pow(x, p.p) * Math.pow(y, p.q) * Math.pow(x, -p.r) * Math.pow(y, p.s);
        return [expr, Math.pow(y, p.q + p.s) / Math.pow(x, p.r - p.p)];
      },
    },

    // Potencia de una potencia
    {
      id: 'pp01', category: 'potencia_potencia', difficulty: 0,
      factor: 'potencia_incompleta', correct: 1, trap: 0,
      params(random) {
        let p;
        do {
          p = { x: pick(random, ONE_VAR), m: randint(random, 2, 4), n: randint(random, 2, 4) };
        } while (p.m === p.n || p.m + p.n === p.m * p.n);
        return p;
      },
      build(p) {
        return {
          prompt: `Simplifica ${m(`(${pw(p.x, p.m)})^{${p.n}}`)}.`,
          options: [
            m(pw(p.x, p.m + p.n)),
            m(pw(p.x, p.m * p.n)),
            m(pw(p.x, Math.pow(p.m, p.n))),
            m(coefTex(p.n, pw(p.x, p.m))),
          ],
          hint: 'En una potencia de otra potencia, los exponentes se multiplican.',
          explanation: `${m(`(${pw(p.x, p.m)})^{${p.n}} = ${p.x}^{${p.m} \\cdot ${p.n}} = ${pw(p.x, p.m * p.n)}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        return [Math.pow(Math.pow(x, p.m), p.n), Math.pow(x, p.m * p.n)];
      },
    },
    {
      id: 'pp02', category: 'potencia_potencia', difficulty: 1,
      factor: 'potencia_incompleta', correct: 0, trap: 1,
      params(random) {
        let p;
        do {
          p = { a: pick(random, ONE_VAR), m: randint(random, 2, 4), n: randint(random, 2, 4) };
        } while (p.m === p.n);
        return p;
      },
      build(p) {
        return {
          prompt: `Simplifica ${m(`(${pw(p.a, -p.m)})^{${p.n}}`)}.`,
          options: [
            m(pw(p.a, -(p.m * p.n))),
            m(pw(p.a, p.n - p.m)),
            m(pw(p.a, -Math.pow(p.m, p.n))),
            m(`-${pw(p.a, p.m * p.n)}`),
          ],
          hint: `Multiplica ${m(`-${p.m}`)} por ${m(String(p.n))}.`,
          explanation: `Los exponentes se multiplican: ${m(`-${p.m} \\cdot ${p.n} = ${-(p.m * p.n)}`)}.`,
        };
      },
      check(p, val) {
        const a = val(p.a);
        return [Math.pow(Math.pow(a, -p.m), p.n), Math.pow(a, -(p.m * p.n))];
      },
    },
    {
      id: 'pp03', category: 'potencia_potencia', difficulty: 1,
      factor: 'potencia_incompleta', correct: 3, trap: 2,
      params(random) {
        let p;
        do {
          p = {
            x: pick(random, ONE_VAR), k: pick(random, [2, 3]),
            m: randint(random, 2, 3), n: randint(random, 2, 3),
          };
        } while ((p.k === 2 && p.n === 2) || (p.m === 2 && p.n === 2));
        return p;
      },
      build(p) {
        const power = Math.pow(p.k, p.n);
        return {
          prompt: `Desarrolla la potencia ${m(`(${coefTex(p.k, pw(p.x, p.m))})^{${p.n}}`)}.`,
          options: [
            m(coefTex(p.k * p.n, pw(p.x, p.m * p.n))),
            m(coefTex(power, pw(p.x, p.m + p.n))),
            m(coefTex(p.k, pw(p.x, p.m * p.n))),
            m(coefTex(power, pw(p.x, p.m * p.n))),
          ],
          hint: `El exponente ${m(String(p.n))} afecta al ${m(String(p.k))} y a ${m(pw(p.x, p.m))}.`,
          explanation: `${m(`${pw(p.k, p.n)}(${pw(p.x, p.m)})^{${p.n}} = ${coefTex(power, pw(p.x, p.m * p.n))}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        const expr = Math.pow(p.k * Math.pow(x, p.m), p.n);
        return [expr, Math.pow(p.k, p.n) * Math.pow(x, p.m * p.n)];
      },
    },
    {
      id: 'pp04', category: 'potencia_potencia', difficulty: 2,
      factor: 'potencia_incompleta', correct: 1, trap: 0,
      params(random) {
        return {
          x: pick(random, ONE_VAR), a: randint(random, 2, 4),
          b: randint(random, 2, 4), c: randint(random, 2, 4),
        };
      },
      build(p) {
        const product = p.a * p.b * p.c;
        return {
          prompt: `Simplifica ${m(`((${pw(p.x, p.a)})^{${p.b}})^{${p.c}}`)}.`,
          options: [
            m(pw(p.x, p.a + p.b + p.c)),
            m(pw(p.x, product)),
            m(pw(p.x, p.a + p.b * p.c)),
            m(pw(p.x, Math.pow(p.c, p.b))),
          ],
          hint: 'Multiplica los tres exponentes.',
          explanation: `${m(`${p.a} \\cdot ${p.b} \\cdot ${p.c} = ${product}`)}, luego resulta ${m(pw(p.x, product))}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        return [Math.pow(Math.pow(Math.pow(x, p.a), p.b), p.c), Math.pow(x, p.a * p.b * p.c)];
      },
    },
    {
      id: 'pp05', category: 'potencia_potencia', difficulty: 3,
      factor: 'potencia_incompleta', correct: 2, trap: 0,
      params(random) {
        let p;
        do {
          p = { x: pick(random, ['x', 'y', 'a', 'b']), k: randint(random, 1, 3), n: randint(random, 2, 4) };
        } while (p.n <= p.k);
        return p;
      },
      build(p) {
        const inner = p.k === 1 ? 'm-1' : `m-${p.k}`;
        const correct = `${p.x}^{${p.n}m-${p.n * p.k}}`;
        return {
          prompt: `Simplifica ${m(`(${p.x}^{${inner}})^{${p.n}}`)}.`,
          options: [
            m(`${p.x}^{m+${p.n - p.k}}`),
            m(`${p.x}^{${p.n}m-${p.k}}`),
            m(correct),
            m(`${p.n}${p.x}^{${inner}}`),
          ],
          hint: `El ${m(String(p.n))} multiplica a todo el exponente ${m(inner)}.`,
          explanation: `${m(`${p.n}(${inner}) = ${p.n}m-${p.n * p.k}`)}, por eso queda ${m(correct)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        const exponent = val('m');
        return [Math.pow(Math.pow(x, exponent - p.k), p.n), Math.pow(x, p.n * exponent - p.n * p.k)];
      },
    },
    {
      id: 'pp06', category: 'potencia_potencia', difficulty: 3,
      factor: 'potencia_incompleta', correct: 0, trap: 2,
      params(random) {
        let p;
        do {
          p = { a: pick(random, ONE_VAR), m: randint(random, 2, 4), n: randint(random, 2, 4) };
        } while (p.m === p.n || p.m + p.n === p.m * p.n);
        return p;
      },
      build(p) {
        const product = p.m * p.n;
        return {
          prompt: `Para ${m(`${p.a} \\neq 0`)}, expresa con exponente positivo ${m(`(${pw(p.a, p.m)})^{${-p.n}}`)}.`,
          options: [
            m(fracTex(1, pw(p.a, product))),
            m(`-${pw(p.a, product)}`),
            m(fracTex(1, pw(p.a, Math.abs(p.n - p.m)))),
            m(fracTex(1, pw(p.a, p.m + p.n))),
          ],
          hint: 'Primero multiplica los exponentes y luego elimina el exponente negativo.',
          explanation: `${m(`(${pw(p.a, p.m)})^{${-p.n}} = ${pw(p.a, -product)} = ${fracTex(1, pw(p.a, product))}`)}.`,
        };
      },
      check(p, val) {
        const a = val(p.a);
        return [Math.pow(Math.pow(a, p.m), -p.n), 1 / Math.pow(a, p.m * p.n)];
      },
    },

    // Distribución sobre productos, cocientes y sumas
    {
      id: 'di01', category: 'distribucion', difficulty: 0,
      factor: 'distribuye_suma', correct: 1, trap: 0,
      params(random) {
        const [a, b] = pickMany(random, TWO_VARS, 2);
        return { a, b, n: pick(random, [2, 3, 4]) };
      },
      build(p) {
        const { a, b, n } = p;
        return {
          prompt: '¿Cuál de estas igualdades es válida para todos los valores reales?',
          options: [
            m(`(${a}+${b})^{${n}} = ${pw(a, n)}+${pw(b, n)}`),
            m(`(${a}${b})^{${n}} = ${pw(a, n)}${pw(b, n)}`),
            m(`(${a}-${b})^{${n}} = ${pw(a, n)}-${pw(b, n)}`),
            m(`\\left(\\frac{${a}}{${b}}\\right)^{${n}} = \\frac{${pw(a, n)}}{${b}}`),
          ],
          hint: 'Una potencia se distribuye sobre un producto, no sobre una suma.',
          explanation: `La propiedad válida es ${m(`(${a}${b})^{n} = ${a}^{n}${b}^{n}`)}. En una suma aparecen términos cruzados.`,
        };
      },
      check(p, val) {
        const a = val(p.a);
        const b = val(p.b);
        return [Math.pow(a * b, p.n), Math.pow(a, p.n) * Math.pow(b, p.n)];
      },
    },
    {
      id: 'di02', category: 'distribucion', difficulty: 1,
      factor: 'distribuye_suma', correct: 2, trap: 0,
      params(random) {
        return { x: pick(random, ONE_VAR), k: randint(random, 2, 6) };
      },
      build(p) {
        const square = p.k * p.k;
        const correct = `${pw(p.x, 2)}+${2 * p.k}${p.x}+${square}`;
        return {
          prompt: `Desarrolla ${m(`(${p.x}+${p.k})^{2}`)}.`,
          options: [
            m(`${pw(p.x, 2)}+${square}`),
            m(`${pw(p.x, 2)}+${p.k}${p.x}+${square}`),
            m(correct),
            m(`2${pw(p.x, 2)}+${square}`),
          ],
          hint: `Usa ${m('(a+b)^{2} = a^{2}+2ab+b^{2}')}.`,
          explanation: `${m(`(${p.x}+${p.k})^{2} = ${pw(p.x, 2)} + 2 \\cdot ${p.x} \\cdot ${p.k} + ${pw(p.k, 2)} = ${correct}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        return [Math.pow(x + p.k, 2), x * x + 2 * p.k * x + p.k * p.k];
      },
    },
    {
      id: 'di03', category: 'distribucion', difficulty: 1,
      factor: 'potencia_incompleta', correct: 1, trap: 3,
      params(random) {
        let p;
        do {
          const [a, b] = pickMany(random, TWO_VARS, 2);
          p = { a, b, c: -pick(random, [2, 3]), m: randint(random, 2, 3), n: randint(random, 2, 3) };
        } while (p.m === 2 && p.n === 2);
        return p;
      },
      build(p) {
        const power = Math.pow(p.c, p.n);
        const vars = `${pw(p.a, p.m * p.n)}${pw(p.b, p.n)}`;
        return {
          prompt: `Simplifica ${m(`(${coefTex(p.c, `${pw(p.a, p.m)}${p.b}`)})^{${p.n}}`)}.`,
          options: [
            m(coefTex(p.c * p.n, vars)),
            m(coefTex(power, vars)),
            m(coefTex(Math.abs(power), `${pw(p.a, p.m + p.n)}${pw(p.b, p.n)}`)),
            m(coefTex(p.c, `${pw(p.a, p.m * p.n)}${p.b}`)),
          ],
          hint: `Eleva por separado ${m(String(p.c))}, ${m(pw(p.a, p.m))} y ${m(p.b)}.`,
          explanation: `${m(`(${p.c})^{${p.n}}(${pw(p.a, p.m)})^{${p.n}}${pw(p.b, p.n)} = ${coefTex(power, vars)}`)}.`,
        };
      },
      check(p, val) {
        const a = val(p.a);
        const b = val(p.b);
        const expr = Math.pow(p.c * Math.pow(a, p.m) * b, p.n);
        return [expr, Math.pow(p.c, p.n) * Math.pow(a, p.m * p.n) * Math.pow(b, p.n)];
      },
    },
    {
      id: 'di04', category: 'distribucion', difficulty: 2,
      factor: 'distribuye_suma', correct: 2, trap: 1,
      params(random) {
        return { x: pick(random, ONE_VAR), k: randint(random, 2, 6) };
      },
      build(p) {
        const square = p.k * p.k;
        const correct = `${pw(p.x, 2)}-${2 * p.k}${p.x}+${square}`;
        return {
          prompt: `Desarrolla ${m(`(${p.x}-${p.k})^{2}`)}.`,
          options: [
            m(`${pw(p.x, 2)}-${square}`),
            m(`${pw(p.x, 2)}+${square}`),
            m(correct),
            m(`${pw(p.x, 2)}-${p.k}${p.x}+${square}`),
          ],
          hint: `En ${m('(a-b)^{2}')} aparece el término central ${m('-2ab')}.`,
          explanation: `${m(`(${p.x}-${p.k})^{2} = ${pw(p.x, 2)}-2 \\cdot ${p.x} \\cdot ${p.k}+${square} = ${correct}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        return [Math.pow(x - p.k, 2), x * x - 2 * p.k * x + p.k * p.k];
      },
    },
    {
      id: 'di05', category: 'distribucion', difficulty: 3,
      factor: 'potencia_incompleta', correct: 1, trap: 2,
      params(random) {
        const [x, y] = pickMany(random, TWO_VARS, 2);
        return { x, y, c: pick(random, [2, 3]), m: randint(random, 2, 3), n: 2 };
      },
      build(p) {
        const power = Math.pow(p.c, p.n);
        const denominator = coefTex(power, pw(p.x, p.n));
        const correct = fracTex(pw(p.y, p.m * p.n), denominator);
        return {
          prompt: `Para valores no nulos, simplifica ${m(`\\left(\\frac{${coefTex(p.c, p.x)}}{${pw(p.y, p.m)}}\\right)^{${-p.n}}`)}.`,
          options: [
            m(`-${fracTex(coefTex(power, pw(p.x, p.n)), pw(p.y, p.m * p.n))}`),
            m(correct),
            m(fracTex(pw(p.y, p.m), coefTex(p.c, p.x))),
            m(fracTex(coefTex(power, pw(p.y, p.m * p.n)), pw(p.x, p.n))),
          ],
          hint: 'Invierte primero la fracción y después eleva cada factor.',
          explanation: `${m(`\\left(\\frac{${pw(p.y, p.m)}}{${coefTex(p.c, p.x)}}\\right)^{${p.n}} = ${correct}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        const y = val(p.y);
        const expr = Math.pow(p.c * x / Math.pow(y, p.m), -p.n);
        return [expr, Math.pow(y, p.m * p.n) / (Math.pow(p.c, p.n) * Math.pow(x, p.n))];
      },
    },
    {
      id: 'di06', category: 'distribucion', difficulty: 4,
      factor: 'distribuye_suma', correct: 1, trap: 0,
      params(random) {
        const [a, b] = pickMany(random, TWO_VARS, 2);
        return { a, b };
      },
      build(p) {
        const { a, b } = p;
        const correct = `${pw(a, 3)}+3${pw(a, 2)}${b}+3${a}${pw(b, 2)}+${pw(b, 3)}`;
        return {
          prompt: `¿Cuál es el desarrollo de ${m(`(${a}+${b})^{3}`)}?`,
          options: [
            m(`${pw(a, 3)}+${pw(b, 3)}`),
            m(correct),
            m(`${pw(a, 3)}+3${a}${b}+${pw(b, 3)}`),
            m(`${pw(a, 3)}+${pw(a, 2)}${b}+${a}${pw(b, 2)}+${pw(b, 3)}`),
          ],
          hint: `Piensa en la fila correspondiente del triángulo de Pascal: ${m('1, 3, 3, 1')}.`,
          explanation: `El cubo de una suma contiene cuatro términos: ${m(correct)}.`,
        };
      },
      check(p, val) {
        const a = val(p.a);
        const b = val(p.b);
        const expansion = Math.pow(a, 3) + 3 * a * a * b + 3 * a * b * b + Math.pow(b, 3);
        return [Math.pow(a + b, 3), expansion];
      },
    },

    // Exponentes cero y negativos
    {
      id: 'ne01', category: 'negativos', difficulty: 0,
      factor: 'exponente_negativo', correct: 1, trap: 0,
      params(random) {
        return { x: pick(random, ONE_VAR), n: randint(random, 2, 5) };
      },
      build(p) {
        return {
          prompt: `Para ${m(`${p.x} \\neq 0`)}, ¿qué significa ${m(pw(p.x, -p.n))}?`,
          options: [
            m(`-${pw(p.x, p.n)}`),
            m(fracTex(1, pw(p.x, p.n))),
            m(fracTex(p.x, p.n)),
            m(fracTex(p.n, p.x)),
          ],
          hint: 'Un exponente negativo indica el inverso de la potencia positiva.',
          explanation: `${m(`${pw(p.x, -p.n)} = ${fracTex(1, pw(p.x, p.n))}`)}. El signo negativo pertenece al exponente, no al valor de la potencia.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        return [Math.pow(x, -p.n), 1 / Math.pow(x, p.n)];
      },
    },
    {
      id: 'ne02', category: 'negativos', difficulty: 0,
      factor: 'exponente_negativo', correct: 2, trap: 0,
      params(random) {
        return { a: pick(random, ONE_VAR) };
      },
      build(p) {
        return {
          prompt: `Para ${m(`${p.a} \\neq 0`)}, el valor de ${m(`${p.a}^{0}`)} es…`,
          options: [m('0'), m(p.a), m('1'), m('-1')],
          hint: `Divide ${m(`${p.a}^{m}`)} entre sí misma y aplica la regla del cociente.`,
          explanation: `${m(`${p.a}^{m}/${p.a}^{m} = ${p.a}^{m-m} = ${p.a}^{0} = 1`)}, si ${m(`${p.a} \\neq 0`)}.`,
        };
      },
      check(p, val) {
        return [Math.pow(val(p.a), 0), 1];
      },
    },
    {
      id: 'ne03', category: 'negativos', difficulty: 1,
      factor: 'exponente_negativo', correct: 2, trap: 0,
      params(random) {
        return { b: randint(random, 2, 9) };
      },
      build(p) {
        return {
          prompt: `Calcula ${m(`${p.b}^{0} + ${pw(p.b, -1)}`)}.`,
          options: [
            m('-1'),
            m(fracTex(1, p.b)),
            m(fracTex(p.b + 1, p.b)),
            m(String(p.b)),
          ],
          hint: `${m(`${p.b}^{0} = 1`)} y ${m(`${pw(p.b, -1)} = ${fracTex(1, p.b)}`)}.`,
          explanation: `${m(`1 + ${fracTex(1, p.b)} = ${fracTex(p.b + 1, p.b)}`)}.`,
        };
      },
      check(p) {
        return [Math.pow(p.b, 0) + Math.pow(p.b, -1), (p.b + 1) / p.b];
      },
    },
    {
      id: 'ne04', category: 'negativos', difficulty: 2,
      factor: 'exponente_negativo', correct: 2, trap: 3,
      params(random) {
        const [x, y] = pickMany(random, TWO_VARS, 2);
        return { x, y, p: randint(random, 2, 4), q: randint(random, 2, 4), r: randint(random, 1, 3) };
      },
      build(p) {
        const correct = fracTex(pw(p.y, p.q + p.r), pw(p.x, p.p + 1));
        return {
          prompt: `Simplifica, con exponentes positivos, ${m(`\\frac{${pw(p.x, -p.p)}${pw(p.y, p.q)}}{${p.x}${pw(p.y, -p.r)}}`)}.`,
          options: [
            m(fracTex(pw(p.y, p.q), p.x)),
            m(fracTex(pw(p.x, p.p + 1), pw(p.y, p.q + p.r))),
            m(correct),
            m(`-${fracTex(pw(p.y, p.q), pw(p.x, p.p))}`),
          ],
          hint: 'Al dividir, resta los exponentes de cada letra por separado.',
          explanation: `${m(`${p.x}^{-${p.p}-1}${p.y}^{${p.q}-(-${p.r})} = ${pw(p.x, -(p.p + 1))}${pw(p.y, p.q + p.r)} = ${correct}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        const y = val(p.y);
        const expr = (Math.pow(x, -p.p) * Math.pow(y, p.q)) / (x * Math.pow(y, -p.r));
        return [expr, Math.pow(y, p.q + p.r) / Math.pow(x, p.p + 1)];
      },
    },
    {
      id: 'ne05', category: 'negativos', difficulty: 2,
      factor: 'exponente_negativo', correct: 2, trap: 1,
      params(random) {
        return { a: pick(random, ONE_VAR), n: randint(random, 2, 5) };
      },
      build(p) {
        return {
          prompt: `Para ${m(`${p.a} \\neq 0`)}, simplifica ${m(fracTex(1, pw(p.a, -p.n)))}.`,
          options: [
            m(`-${pw(p.a, p.n)}`),
            m(fracTex(1, pw(p.a, p.n))),
            m(pw(p.a, p.n)),
            m(pw(p.a, -(p.n + 1))),
          ],
          hint: `${m(`${pw(p.a, -p.n)} = ${fracTex(1, pw(p.a, p.n))}`)}; ahora divide ${m('1')} entre esa fracción.`,
          explanation: `${m(`\\frac{1}{${fracTex(1, pw(p.a, p.n))}} = ${pw(p.a, p.n)}`)}.`,
        };
      },
      check(p, val) {
        const a = val(p.a);
        return [1 / Math.pow(a, -p.n), Math.pow(a, p.n)];
      },
    },
    {
      id: 'ne06', category: 'negativos', difficulty: 3,
      factor: 'exponente_negativo', correct: 2, trap: 0,
      params(random) {
        let p;
        do {
          p = { b: pick(random, [2, 3, 5]), n: pick(random, [3, 5]) };
        } while (p.b === 5 && p.n === 5);
        return p;
      },
      build(p) {
        const power = Math.pow(p.b, p.n);
        return {
          prompt: `Calcula ${m(`(-${p.b})^{${-p.n}}`)}.`,
          options: [
            m(`-${power}`),
            m(fracTex(1, power)),
            m(`-${fracTex(1, power)}`),
            m(String(power)),
          ],
          hint: 'Invierte la potencia y conserva los paréntesis de la base.',
          explanation: `${m(`(-${p.b})^{${-p.n}} = \\frac{1}{(-${p.b})^{${p.n}}} = -${fracTex(1, power)}`)}.`,
        };
      },
      check(p) {
        return [Math.pow(-p.b, -p.n), -1 / Math.pow(p.b, p.n)];
      },
    },

    // Exponentes racionales
    {
      id: 'ra01', category: 'racionales', difficulty: 0,
      factor: 'fraccionario', correct: 0, trap: 1,
      params(random) {
        return { x: pick(random, ONE_VAR), n: pick(random, [2, 3, 4, 5]) };
      },
      build(p) {
        return {
          prompt: `Para ${m(`${p.x} \\geq 0`)}, ${m(`${p.x}^{${expTex(1, p.n)}}`)} equivale a…`,
          options: [
            m(sqrtTex(p.n, p.x)),
            m(fracTex(p.x, p.n)),
            m(coefTex(p.n, sqrtTex(2, p.x))),
            m(sqrtTex(p.n, pw(p.x, p.n))),
          ],
          hint: 'El denominador del exponente indica el índice de la raíz.',
          explanation: `${m(`${p.x}^{${expTex(1, p.n)}} = ${sqrtTex(p.n, p.x)}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        return [Math.pow(x, 1 / p.n), Math.pow(x, 1 / p.n)];
      },
    },
    {
      id: 'ra02', category: 'racionales', difficulty: 1,
      factor: 'fraccionario', correct: 1, trap: 3,
      params(random) {
        let p;
        do {
          const [mm, nn] = pick(random, [[2, 3], [3, 2]]);
          p = { k: pick(random, [2, 3, 4]), m: mm, n: nn };
        } while (p.k === 2 && p.m === 2);
        return p;
      },
      build(p) {
        const base = Math.pow(p.k, p.n);
        const correct = Math.pow(p.k, p.m);
        return {
          prompt: `Calcula ${m(`${base}^{${expTex(p.m, p.n)}}`)}.`,
          options: [
            m(String(p.k * p.m)),
            m(String(correct)),
            m(String(p.k * p.m * p.n)),
            m(String(Math.pow(p.k, p.m + p.n))),
          ],
          hint: `Toma primero la raíz de índice ${m(String(p.n))} de ${m(String(base))} y después eleva a ${m(String(p.m))}.`,
          explanation: `${m(`${base}^{${expTex(p.m, p.n)}} = (${sqrtTex(p.n, base)})^{${p.m}} = ${pw(p.k, p.m)} = ${correct}`)}.`,
        };
      },
      check(p) {
        return [Math.pow(Math.pow(p.k, p.n), p.m / p.n), Math.pow(p.k, p.m)];
      },
    },
    {
      id: 'ra03', category: 'racionales', difficulty: 1,
      factor: 'fraccionario', correct: 1, trap: 0,
      params(random) {
        let p;
        do {
          const nn = pick(random, [3, 4, 5]);
          p = { a: pick(random, ONE_VAR), n: nn, m: randint(random, 2, nn - 1) };
        } while (gcd(p.m, p.n) !== 1);
        return p;
      },
      build(p) {
        return {
          prompt: `Escribe ${m(sqrtTex(p.n, pw(p.a, p.m)))} como potencia de base ${m(p.a)}.`,
          options: [
            m(`${p.a}^{${expTex(p.n, p.m)}}`),
            m(`${p.a}^{${expTex(p.m, p.n)}}`),
            m(`${p.a}^{${expTex(1, p.m * p.n)}}`),
            m(pw(p.a, p.n - p.m)),
          ],
          hint: 'El exponente del radicando va en el numerador y el índice en el denominador.',
          explanation: `${m(`${sqrtTex(p.n, pw(p.a, p.m))} = ${p.a}^{${expTex(p.m, p.n)}}`)}.`,
        };
      },
      check(p, val) {
        const a = val(p.a);
        return [Math.pow(Math.pow(a, p.m), 1 / p.n), Math.pow(a, p.m / p.n)];
      },
    },
    {
      id: 'ra04', category: 'racionales', difficulty: 2,
      factor: 'fraccionario', correct: 1, trap: 2,
      params(random) {
        const nn = pick(random, [3, 4]);
        return { k: pick(random, [2, 3]), n: nn, m: randint(random, 2, nn - 1) };
      },
      build(p) {
        const base = Math.pow(p.k, p.n);
        const power = Math.pow(p.k, p.m);
        return {
          prompt: `Calcula ${m(`${base}^{-${expTex(p.m, p.n)}}`)}.`,
          options: [
            m(`-${power}`),
            m(fracTex(1, power)),
            m(String(power)),
            m(`-${fracTex(1, power)}`),
          ],
          hint: `La raíz de índice ${m(String(p.n))} de ${m(String(base))} es ${m(String(p.k))}; el signo negativo obliga a invertir.`,
          explanation: `${m(`${base}^{-${expTex(p.m, p.n)}} = \\frac{1}{(${sqrtTex(p.n, base)})^{${p.m}}} = \\frac{1}{${pw(p.k, p.m)}} = ${fracTex(1, power)}`)}.`,
        };
      },
      check(p) {
        return [Math.pow(Math.pow(p.k, p.n), -p.m / p.n), 1 / Math.pow(p.k, p.m)];
      },
    },
    {
      id: 'ra05', category: 'racionales', difficulty: 2,
      factor: 'fraccionario', correct: 1, trap: 3,
      params(random) {
        return { x: pick(random, ONE_VAR), n: pick(random, [2, 3, 4]) };
      },
      build(p) {
        const correct = `${p.x}${sqrtTex(p.n, p.x)}`;
        return {
          prompt: `Para ${m(`${p.x} \\geq 0`)}, simplifica ${m(`${p.x}^{${expTex(p.n + 1, p.n)}}`)}.`,
          options: [
            m(coefTex(p.n + 1, sqrtTex(p.n, p.x))),
            m(correct),
            m(sqrtTex(p.n, coefTex(p.n + 1, p.x))),
            m(`${p.x}^{${expTex(p.n, p.n + 1)}}`),
          ],
          hint: `Separa ${m(`${expTex(p.n + 1, p.n)} = 1 + ${expTex(1, p.n)}`)}.`,
          explanation: `${m(`${p.x}^{${expTex(p.n + 1, p.n)}} = ${p.x}^{1+${expTex(1, p.n)}} = ${correct}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        return [Math.pow(x, (p.n + 1) / p.n), x * Math.pow(x, 1 / p.n)];
      },
    },
    {
      id: 'ra06', category: 'racionales', difficulty: 3,
      factor: 'fraccionario', correct: 2, trap: 0,
      params(random) {
        let p;
        do {
          const b = pick(random, [2, 3, 4, 6]);
          const d = pick(random, [2, 3, 4, 6]);
          p = { x: pick(random, ONE_VAR), a: randint(random, 1, b - 1), b, c: randint(random, 1, d - 1), d };
        } while (p.b === p.d || gcd(p.a, p.b) !== 1 || gcd(p.c, p.d) !== 1);
        return p;
      },
      build(p) {
        const numerator = p.a * p.d + p.c * p.b;
        const denominator = p.b * p.d;
        return {
          prompt: `Para ${m(`${p.x} > 0`)}, simplifica ${m(`${p.x}^{${expTex(p.a, p.b)}} \\cdot ${p.x}^{${expTex(p.c, p.d)}}`)}.`,
          options: [
            m(`${p.x}^{${expTex(p.a + p.c, p.b + p.d)}}`),
            m(`${p.x}^{${expTex(p.a * p.c, denominator)}}`),
            m(`${p.x}^{${expTex(numerator, denominator)}}`),
            m(`${p.x}^{${expTex(p.a + p.c, denominator)}}`),
          ],
          hint: `Suma las fracciones usando denominador común ${m(String(denominator))}.`,
          explanation: `${m(`${expTex(p.a, p.b)} + ${expTex(p.c, p.d)} = ${expTex(p.a * p.d, denominator)} + ${expTex(p.c * p.b, denominator)} = ${expTex(numerator, denominator)}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        const expr = Math.pow(x, p.a / p.b) * Math.pow(x, p.c / p.d);
        return [expr, Math.pow(x, (p.a * p.d + p.c * p.b) / (p.b * p.d))];
      },
    },

    // Expresiones combinadas
    {
      id: 'co01', category: 'combinadas', difficulty: 2,
      factor: 'potencia_incompleta', correct: 0, trap: 2,
      params(random) {
        let p;
        do {
          const [x, y] = pickMany(random, TWO_VARS, 2);
          p = {
            x, y, p: randint(random, 2, 4), q: randint(random, 1, 3),
            n: randint(random, 2, 3), r: randint(random, 1, 2), s: randint(random, 1, 2),
          };
        } while (p.q * p.n - p.s < 1);
        return p;
      },
      build(p) {
        const xUp = p.p * p.n + p.r;
        const yUp = p.q * p.n + p.s;
        const correct = fracTex(pw(p.x, xUp), pw(p.y, yUp));
        return {
          prompt: `Para ${m(`${p.x}, ${p.y} \\neq 0`)}, simplifica con exponentes positivos ${m(`\\frac{(${pw(p.x, p.p)}${pw(p.y, -p.q)})^{${p.n}}}{${pw(p.x, -p.r)}${pw(p.y, p.s)}}`)}.`,
          options: [
            m(correct),
            m(fracTex(pw(p.x, p.p * p.n - p.r), pw(p.y, p.q * p.n - p.s))),
            m(fracTex(pw(p.x, p.p * p.n), pw(p.y, p.q * p.n))),
            m(fracTex(pw(p.y, yUp), pw(p.x, xUp))),
          ],
          hint: 'Aplica primero la potencia exterior y luego resta los exponentes del denominador.',
          explanation: `${m(`${p.x}^{${p.p * p.n}-(-${p.r})}${p.y}^{-${p.q * p.n}-${p.s}} = ${pw(p.x, xUp)}${pw(p.y, -yUp)} = ${correct}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        const y = val(p.y);
        const expr = Math.pow(Math.pow(x, p.p) * Math.pow(y, -p.q), p.n) / (Math.pow(x, -p.r) * Math.pow(y, p.s));
        return [expr, Math.pow(x, p.p * p.n + p.r) / Math.pow(y, p.q * p.n + p.s)];
      },
    },
    {
      id: 'co02', category: 'combinadas', difficulty: 2,
      factor: 'fraccionario', correct: 1, trap: 0,
      params(random) {
        let p;
        do {
          p = {
            x: pick(random, ONE_VAR), j: pick(random, [2, 3]),
            n: pick(random, [2, 3]), t: randint(random, 2, 3),
          };
        } while (p.n === p.t);
        return p;
      },
      build(p) {
        const coefficient = Math.pow(p.j, p.n);
        const exponent = p.n * p.t;
        return {
          prompt: `Simplifica ${m(`(${coefTex(coefficient, pw(p.x, exponent))})^{${expTex(1, p.n)}}`)}.`,
          options: [
            m(coefTex(coefficient, pw(p.x, p.t))),
            m(coefTex(p.j, pw(p.x, p.t))),
            m(coefTex(p.j, pw(p.x, p.n))),
            m(`${fracTex(coefficient, p.n)}${pw(p.x, p.t)}`),
          ],
          hint: `La potencia ${m(expTex(1, p.n))} es una raíz de índice ${m(String(p.n))} que afecta a ambos factores.`,
          explanation: `${m(`${sqrtTex(p.n, coefficient)} \\cdot ${sqrtTex(p.n, pw(p.x, exponent))} = ${coefTex(p.j, pw(p.x, p.t))}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        const expr = Math.pow(Math.pow(p.j, p.n) * Math.pow(x, p.n * p.t), 1 / p.n);
        return [expr, p.j * Math.pow(x, p.t)];
      },
    },
    {
      id: 'co03', category: 'combinadas', difficulty: 3,
      factor: 'exponente_negativo', correct: 1, trap: 0,
      params(random) {
        const [a, b] = pickMany(random, TWO_VARS, 2);
        return { a, b, c: pick(random, [2, 3]), p: randint(random, 1, 2), q: randint(random, 2, 3), n: 2 };
      },
      build(p) {
        const coefficient = Math.pow(p.c, p.n);
        const aUp = p.p * p.n;
        const bUp = p.q * p.n;
        const correct = fracTex(pw(p.a, aUp), coefTex(coefficient, pw(p.b, bUp)));
        return {
          prompt: `Para valores no nulos, simplifica ${m(`(${coefTex(p.c, `${pw(p.a, -p.p)}${pw(p.b, p.q)}`)})^{${-p.n}}`)}.`,
          options: [
            m(`-${fracTex(coefTex(coefficient, pw(p.a, aUp)), pw(p.b, bUp))}`),
            m(correct),
            m(fracTex(pw(p.b, bUp), coefTex(coefficient, pw(p.a, aUp)))),
            m(fracTex(pw(p.a, p.p), coefTex(p.c, pw(p.b, p.q)))),
          ],
          hint: 'Invierte toda la expresión y después eleva al cuadrado.',
          explanation: `${m(`\\left(${fracTex(pw(p.a, p.p), coefTex(p.c, pw(p.b, p.q)))}\\right)^{${p.n}} = ${correct}`)}.`,
        };
      },
      check(p, val) {
        const a = val(p.a);
        const b = val(p.b);
        const expr = Math.pow(p.c * Math.pow(a, -p.p) * Math.pow(b, p.q), -p.n);
        return [expr, Math.pow(a, p.p * p.n) / (Math.pow(p.c, p.n) * Math.pow(b, p.q * p.n))];
      },
    },
    {
      id: 'co04', category: 'combinadas', difficulty: 3,
      factor: 'exponente_negativo', correct: 1, trap: 0,
      params(random) {
        const [x, y] = pickMany(random, TWO_VARS, 2);
        return { x, y, p: randint(random, 2, 3), q: randint(random, 1, 2), r: randint(random, 2, 3), s: randint(random, 2, 3) };
      },
      build(p) {
        const xUp = p.p + p.r;
        const yUp = p.q + p.s;
        const correct = fracTex(pw(p.y, yUp), pw(p.x, xUp));
        return {
          prompt: `Para ${m(`${p.x}, ${p.y} \\neq 0`)}, simplifica ${m(`\\left(\\frac{${pw(p.x, p.p)}${pw(p.y, -p.q)}}{${pw(p.x, -p.r)}${pw(p.y, p.s)}}\\right)^{-1}`)}.`,
          options: [
            m(fracTex(pw(p.x, xUp), pw(p.y, yUp))),
            m(correct),
            m(fracTex(p.x, p.y)),
            m(fracTex(p.y, p.x)),
          ],
          hint: `La fracción interior es ${m(fracTex(pw(p.x, xUp), pw(p.y, yUp)))}; luego aplica el exponente ${m('-1')}.`,
          explanation: `Dentro queda ${m(`${pw(p.x, xUp)}${pw(p.y, -yUp)}`)}. El exponente ${m('-1')} invierte la expresión: ${m(correct)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        const y = val(p.y);
        const inner = (Math.pow(x, p.p) * Math.pow(y, -p.q)) / (Math.pow(x, -p.r) * Math.pow(y, p.s));
        return [Math.pow(inner, -1), Math.pow(y, p.q + p.s) / Math.pow(x, p.p + p.r)];
      },
    },
    {
      id: 'co05', category: 'combinadas', difficulty: 4,
      factor: 'fraccionario', correct: 0, trap: 2,
      params(random) {
        return { x: pick(random, ONE_VAR), j: pick(random, [2, 3, 4]), t: randint(random, 2, 3) };
      },
      build(p) {
        const coefficient = p.j * p.j;
        const exponent = 2 * p.t;
        const correct = fracTex(p.j, pw(p.x, p.t));
        return {
          prompt: `Para ${m(`${p.x} \\neq 0`)}, simplifica ${m(`(${coefTex(coefficient, pw(p.x, -exponent))})^{${expTex(1, 2)}}`)}.`,
          options: [
            m(correct),
            m(fracTex(coefficient, pw(p.x, p.t))),
            m(fracTex(p.j, pw(p.x, exponent))),
            m(`-${coefTex(p.j, pw(p.x, p.t))}`),
          ],
          hint: `Toma la raíz cuadrada de ${m(String(coefficient))} y de ${m(pw(p.x, -exponent))}.`,
          explanation: `${m(`${sqrtTex(2, coefficient)} \\cdot ${pw(p.x, -p.t)} = ${correct}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        const expr = Math.pow(p.j * p.j * Math.pow(x, -2 * p.t), 1 / 2);
        return [expr, p.j / Math.pow(x, p.t)];
      },
    },
    {
      id: 'co06', category: 'combinadas', difficulty: 4,
      factor: 'potencia_incompleta', correct: 0, trap: 2,
      params(random) {
        const [a, b] = pickMany(random, TWO_VARS, 2);
        return { a, b, p: randint(random, 2, 3), q: randint(random, 2, 3), n: randint(random, 2, 3) };
      },
      build(p) {
        const aUp = p.p * p.n + 1;
        const bUp = p.n + p.q;
        const correct = fracTex(pw(p.b, bUp), pw(p.a, aUp));
        return {
          prompt: `Para ${m(`${p.a}, ${p.b} \\neq 0`)}, simplifica con exponentes positivos ${m(`\\frac{(${pw(p.a, -p.p)}${p.b})^{${p.n}}}{${p.a}${pw(p.b, -p.q)}}`)}.`,
          options: [
            m(correct),
            m(`${pw(p.a, -(p.p * p.n - 1))}${p.b}`),
            m(`${pw(p.a, -(p.p * p.n))}${pw(p.b, p.n)}`),
            m(fracTex(pw(p.a, aUp), pw(p.b, bUp))),
          ],
          hint: `La potencia del numerador da ${m(`${pw(p.a, -(p.p * p.n))}${pw(p.b, p.n)}`)}; después resta los exponentes del denominador.`,
          explanation: `${m(`${p.a}^{-${p.p * p.n}-1}${p.b}^{${p.n}-(-${p.q})} = ${pw(p.a, -aUp)}${pw(p.b, bUp)} = ${correct}`)}.`,
        };
      },
      check(p, val) {
        const a = val(p.a);
        const b = val(p.b);
        const expr = Math.pow(Math.pow(a, -p.p) * b, p.n) / (a * Math.pow(b, -p.q));
        return [expr, Math.pow(b, p.n + p.q) / Math.pow(a, p.p * p.n + 1)];
      },
    },

    // Suma de potencias iguales: la operación exterior no es un producto.
    {
      id: 'mb07', category: 'misma_base', difficulty: 3,
      factor: 'opera_exponentes', correct: 0, trap: 1,
      params(random) {
        return { k: randint(random, 2, 10) };
      },
      build(p) {
        return {
          prompt: `Calcula ${m(`${pw(2, p.k)} + ${pw(2, p.k)}`)}.`,
          options: [
            m(pw(2, p.k + 1)),
            m(pw(2, 2 * p.k)),
            m(pw(4, p.k)),
            m(pw(2, p.k)),
          ],
          hint: 'Aquí las potencias se suman, no se multiplican: saca factor común.',
          explanation: `${m(`${pw(2, p.k)} + ${pw(2, p.k)} = 2 \\cdot ${pw(2, p.k)} = ${pw(2, p.k + 1)}`)}. Los exponentes solo se suman cuando se multiplican las potencias.`,
        };
      },
      check(p) {
        return [Math.pow(2, p.k) + Math.pow(2, p.k), Math.pow(2, p.k + 1)];
      },
    },
    // Techo de la familia: exponentes algebraicos que se cancelan.
    {
      id: 'mb08', category: 'misma_base', difficulty: 4,
      factor: 'opera_exponentes', correct: 0, trap: 1,
      params(random) {
        let p;
        do {
          p = { x: pick(random, ONE_VAR), p: randint(random, 1, 3), q: randint(random, 1, 4) };
        } while (p.p === p.q);
        return p;
      },
      build(p) {
        const rest = p.p - p.q;
        const tail = `3n${rest < 0 ? '' : '+'}${rest}`;
        return {
          prompt: `Para ${m(`${p.x} \\neq 0`)}, simplifica ${m(`\\frac{${p.x}^{2n+${p.p}} \\cdot ${p.x}^{n-${p.q}}}{${p.x}^{3n}}`)}.`,
          options: [
            m(pw(p.x, rest)),
            m(pw(p.x, p.p + p.q)),
            m(pw(p.x, -rest)),
            m(`${p.x}^{${tail}}`),
          ],
          hint: `Suma los exponentes del numerador y resta el del denominador: los términos con ${m('n')} se cancelan.`,
          explanation: `${m(`(2n+${p.p}) + (n-${p.q}) - 3n = ${rest}`)}, así que queda ${m(pw(p.x, rest))}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        const n = val('n');
        const expr = Math.pow(x, 2 * n + p.p) * Math.pow(x, n - p.q) / Math.pow(x, 3 * n);
        return [expr, Math.pow(x, p.p - p.q)];
      },
    },

    // Techo de la familia: producto notable en el exponente.
    {
      id: 'pp07', category: 'potencia_potencia', difficulty: 4,
      factor: 'potencia_incompleta', correct: 0, trap: 1,
      params(random) {
        return { x: pick(random, ['x', 'y', 'a', 'b']), k: randint(random, 1, 3) };
      },
      build(p) {
        const square = p.k * p.k;
        const correct = `${p.x}^{n^{2}-${square}}`;
        return {
          prompt: `Simplifica ${m(`(${p.x}^{n+${p.k}})^{n-${p.k}}`)}.`,
          options: [
            m(correct),
            m(`${p.x}^{2n}`),
            m(`${p.x}^{n^{2}+${square}}`),
            m(`${p.x}^{n^{2}-${2 * p.k}n+${square}}`),
          ],
          hint: 'Los exponentes se multiplican, y su producto es una suma por diferencia.',
          explanation: `${m(`(n+${p.k})(n-${p.k}) = n^{2}-${square}`)}, por eso queda ${m(correct)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        const n = val('n');
        return [Math.pow(Math.pow(x, n + p.k), n - p.k), Math.pow(x, n * n - p.k * p.k)];
      },
    },
    // El signo dentro del paréntesis también se eleva.
    {
      id: 'pp08', category: 'potencia_potencia', difficulty: 2,
      factor: 'signo_paridad', correct: 0, trap: 1,
      params(random) {
        let p;
        do {
          p = { x: pick(random, ONE_VAR), k: randint(random, 2, 3), n: pick(random, [2, 4]) };
        } while (p.k + p.n === p.k * p.n);
        return p;
      },
      build(p) {
        const product = p.k * p.n;
        return {
          prompt: `Simplifica ${m(`(-${pw(p.x, p.k)})^{${p.n}}`)}.`,
          options: [
            m(pw(p.x, product)),
            m(`-${pw(p.x, product)}`),
            m(pw(p.x, p.k + p.n)),
            m(`-${pw(p.x, p.k + p.n)}`),
          ],
          hint: `El signo está dentro del paréntesis, así que también se eleva a ${m(String(p.n))}.`,
          explanation: `${m(`(-1)^{${p.n}} = 1`)} porque el exponente es par, y ${m(`(${pw(p.x, p.k)})^{${p.n}} = ${pw(p.x, product)}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        return [Math.pow(-Math.pow(x, p.k), p.n), Math.pow(x, p.k * p.n)];
      },
    },

    // Potencia de un cociente: el exponente llega también al denominador.
    {
      id: 'di07', category: 'distribucion', difficulty: 1,
      factor: 'potencia_incompleta', correct: 0, trap: 1,
      params(random) {
        const [a, b] = pickMany(random, TWO_VARS, 2);
        return { a, b, n: randint(random, 2, 4) };
      },
      build(p) {
        const correct = fracTex(pw(p.a, p.n), pw(p.b, p.n));
        return {
          prompt: `Para ${m(`${p.b} \\neq 0`)}, desarrolla ${m(`\\left(\\frac{${p.a}}{${p.b}}\\right)^{${p.n}}`)}.`,
          options: [
            m(correct),
            m(fracTex(pw(p.a, p.n), p.b)),
            m(fracTex(p.a, pw(p.b, p.n))),
            m(`${pw(p.a, p.n)}${pw(p.b, p.n)}`),
          ],
          hint: 'La potencia de un cociente afecta al numerador y al denominador.',
          explanation: `${m(`\\left(\\frac{${p.a}}{${p.b}}\\right)^{${p.n}} = ${correct}`)}.`,
        };
      },
      check(p, val) {
        const a = val(p.a);
        const b = val(p.b);
        return [Math.pow(a / b, p.n), Math.pow(a, p.n) / Math.pow(b, p.n)];
      },
    },
    // Diferencia de cuadrados de dos binomios: el error de distribuir se ve al restar.
    {
      id: 'di08', category: 'distribucion', difficulty: 3,
      factor: 'distribuye_suma', correct: 0, trap: 1,
      params(random) {
        const [x, y] = pickMany(random, TWO_VARS, 2);
        return { x, y };
      },
      build(p) {
        const { x, y } = p;
        return {
          prompt: `Simplifica ${m(`(${x}+${y})^{2} - (${x}-${y})^{2}`)}.`,
          options: [
            m(`4${x}${y}`),
            m(`2${pw(y, 2)}`),
            m('0'),
            m(`2${pw(x, 2)}+2${pw(y, 2)}`),
          ],
          hint: 'Desarrolla los dos cuadrados por separado; los términos centrales no se cancelan.',
          explanation: `${m(`(${pw(x, 2)}+2${x}${y}+${pw(y, 2)}) - (${pw(x, 2)}-2${x}${y}+${pw(y, 2)}) = 4${x}${y}`)}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        const y = val(p.y);
        return [Math.pow(x + y, 2) - Math.pow(x - y, 2), 4 * x * y];
      },
    },

    // Base negativa con exponente par: el paréntesis decide el signo.
    {
      id: 'ne07', category: 'negativos', difficulty: 1,
      factor: 'signo_paridad', correct: 1, trap: 0,
      params(random) {
        let p;
        do {
          p = { b: randint(random, 2, 6), n: pick(random, [2, 4]) };
        } while (Math.pow(p.b, p.n) === p.b * p.n);
        return p;
      },
      build(p) {
        const power = Math.pow(p.b, p.n);
        return {
          prompt: `Calcula ${m(`(-${p.b})^{${p.n}}`)}.`,
          options: [
            m(`-${power}`),
            m(String(power)),
            m(String(p.b * p.n)),
            m(`-${p.b * p.n}`),
          ],
          hint: `El exponente ${m(String(p.n))} es par y la base entera es ${m(`-${p.b}`)}.`,
          explanation: `${m(`(-${p.b})^{${p.n}} = ${power}`)}: un exponente par deja el resultado positivo. En cambio ${m(`-${p.b}^{${p.n}} = -${power}`)}, porque ahí el signo queda fuera de la potencia.`,
        };
      },
      check(p) {
        return [Math.pow(-p.b, p.n), Math.pow(p.b, p.n)];
      },
    },
    // Techo de la familia: signo fuera y dentro del paréntesis en la misma expresión.
    {
      id: 'ne08', category: 'negativos', difficulty: 4,
      factor: 'signo_paridad', correct: 0, trap: 1,
      params(random) {
        let p;
        do {
          p = { x: pick(random, ONE_VAR), a: randint(random, 2, 4), b: pick(random, [3, 5]) };
        } while (p.a + p.b === p.a * p.b);
        return p;
      },
      build(p) {
        const total = p.a + p.b;
        const product = p.a * p.b;
        return {
          prompt: `Simplifica ${m(`-${pw(p.x, p.a)} \\cdot (-${p.x})^{${p.b}}`)}.`,
          options: [
            m(pw(p.x, total)),
            m(`-${pw(p.x, total)}`),
            m(pw(p.x, product)),
            m(`-${pw(p.x, product)}`),
          ],
          hint: `En el primer factor el signo está fuera de la potencia; en el segundo, dentro, y ${m(String(p.b))} es impar.`,
          explanation: `${m(`(-${p.x})^{${p.b}} = -${pw(p.x, p.b)}`)} porque el exponente es impar, así que ${m(`-${pw(p.x, p.a)} \\cdot (-${pw(p.x, p.b)}) = ${pw(p.x, total)}`)}: los dos signos se cancelan.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        return [-Math.pow(x, p.a) * Math.pow(-x, p.b), Math.pow(x, p.a + p.b)];
      },
    },
    // Fracción elevada a un exponente negativo: se invierte, no cambia de signo.
    {
      id: 'ne09', category: 'negativos', difficulty: 2,
      factor: 'exponente_negativo', correct: 0, trap: 1,
      params(random) {
        let p;
        do {
          p = { a: randint(random, 2, 5), b: randint(random, 2, 5), n: pick(random, [2, 3]) };
        } while (p.a === p.b || gcd(p.a, p.b) !== 1);
        return p;
      },
      build(p) {
        const top = Math.pow(p.b, p.n);
        const bottom = Math.pow(p.a, p.n);
        const correct = fracTex(top, bottom);
        return {
          prompt: `Calcula ${m(`\\left(\\frac{${p.a}}{${p.b}}\\right)^{${-p.n}}`)}.`,
          options: [
            m(correct),
            m(`-${fracTex(bottom, top)}`),
            m(fracTex(bottom, top)),
            m(fracTex(p.b, p.a)),
          ],
          hint: 'Un exponente negativo invierte la fracción; el signo de la base no cambia.',
          explanation: `${m(`\\left(\\frac{${p.a}}{${p.b}}\\right)^{${-p.n}} = \\left(\\frac{${p.b}}{${p.a}}\\right)^{${p.n}} = ${correct}`)}.`,
        };
      },
      check(p) {
        return [Math.pow(p.a / p.b, -p.n), Math.pow(p.b, p.n) / Math.pow(p.a, p.n)];
      },
    },

    // Techo de la familia: raíz de una raíz.
    {
      id: 'ra07', category: 'racionales', difficulty: 4,
      factor: 'fraccionario', correct: 0, trap: 1,
      params(random) {
        let p;
        do {
          p = { a: pick(random, ONE_VAR), m: randint(random, 2, 4), n: randint(random, 2, 4) };
        } while (p.m === p.n);
        return p;
      },
      build(p) {
        const product = p.m * p.n;
        const correct = `${p.a}^{${expTex(1, product)}}`;
        return {
          prompt: `Para ${m(`${p.a} \\geq 0`)}, escribe ${m(sqrtTex(p.m, sqrtTex(p.n, p.a)))} como potencia de base ${m(p.a)}.`,
          options: [
            m(correct),
            m(`${p.a}^{${expTex(1, p.m + p.n)}}`),
            m(`${p.a}^{${expTex(p.m, p.n)}}`),
            m(pw(p.a, product)),
          ],
          hint: 'Escribe cada raíz como potencia de exponente fraccionario y multiplica los exponentes.',
          explanation: `${m(`${sqrtTex(p.m, sqrtTex(p.n, p.a))} = (${p.a}^{${expTex(1, p.n)}})^{${expTex(1, p.m)}} = ${correct}`)}: los índices se multiplican.`,
        };
      },
      check(p, val) {
        const a = val(p.a);
        return [Math.pow(Math.pow(a, 1 / p.n), 1 / p.m), Math.pow(a, 1 / (p.m * p.n))];
      },
    },

    // Suelo de la familia: dos propiedades encadenadas, con números pequeños.
    {
      id: 'co07', category: 'combinadas', difficulty: 0,
      factor: 'potencia_incompleta', correct: 0, trap: 1,
      params(random) {
        return { x: pick(random, ONE_VAR), k: pick(random, [3, 4]), m: pick(random, [1, 3]) };
      },
      build(p) {
        const square = p.k * p.k;
        const exponent = p.m + 2;
        return {
          prompt: `Simplifica ${m(`(${coefTex(p.k, p.x)})^{2} \\cdot ${pw(p.x, p.m)}`)}.`,
          options: [
            m(coefTex(square, pw(p.x, exponent))),
            m(coefTex(p.k, pw(p.x, exponent))),
            m(coefTex(square, pw(p.x, 2 * p.m))),
            m(coefTex(2 * p.k, pw(p.x, exponent))),
          ],
          hint: `El cuadrado afecta al ${m(String(p.k))} y a ${m(p.x)}; después suma los exponentes de la misma base.`,
          explanation: `${m(`(${coefTex(p.k, p.x)})^{2} = ${coefTex(square, pw(p.x, 2))}`)}, y al multiplicar por ${m(pw(p.x, p.m))} queda ${m(coefTex(square, pw(p.x, exponent)))}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        const expr = Math.pow(p.k * x, 2) * Math.pow(x, p.m);
        return [expr, p.k * p.k * Math.pow(x, p.m + 2)];
      },
    },
    {
      id: 'co08', category: 'combinadas', difficulty: 1,
      factor: 'opera_exponentes', correct: 0, trap: 1,
      params(random) {
        let p;
        do {
          p = {
            a: pick(random, ONE_VAR), p: randint(random, 2, 3),
            q: randint(random, 2, 3), r: randint(random, 2, 4),
          };
        } while (p.p + p.q === p.p * p.q || p.p * p.q - p.r < 1 || p.p + p.q <= p.r);
        return p;
      },
      build(p) {
        const product = p.p * p.q;
        const rest = product - p.r;
        return {
          prompt: `Para ${m(`${p.a} \\neq 0`)}, simplifica ${m(`\\frac{(${pw(p.a, p.p)})^{${p.q}}}{${pw(p.a, p.r)}}`)}.`,
          options: [
            m(pw(p.a, rest)),
            m(pw(p.a, p.p + p.q - p.r)),
            m(pw(p.a, product + p.r)),
            m(pw(p.a, -rest)),
          ],
          hint: 'Primero multiplica los exponentes encadenados; después resta el del denominador.',
          explanation: `${m(`(${pw(p.a, p.p)})^{${p.q}} = ${pw(p.a, product)}`)}, y al dividir queda ${m(`${p.a}^{${product}-${p.r}} = ${pw(p.a, rest)}`)}.`,
        };
      },
      check(p, val) {
        const a = val(p.a);
        const expr = Math.pow(Math.pow(a, p.p), p.q) / Math.pow(a, p.r);
        return [expr, Math.pow(a, p.p * p.q - p.r)];
      },
    },

    // Sin paréntesis el signo se queda fuera de la potencia.
    {
      id: 'ne10', category: 'negativos', difficulty: 0,
      factor: 'signo_paridad', correct: 0, trap: 1,
      params(random) {
        let p;
        do {
          p = { b: randint(random, 2, 5), n: pick(random, [2, 4]) };
        } while (Math.pow(p.b, p.n) === p.b * p.n);
        return p;
      },
      build(p) {
        const power = Math.pow(p.b, p.n);
        return {
          prompt: `Calcula ${m(`-${p.b}^{${p.n}}`)}.`,
          options: [
            m(`-${power}`),
            m(String(power)),
            m(`-${p.b * p.n}`),
            m(String(p.b * p.n)),
          ],
          hint: 'No hay paréntesis: la potencia afecta solo a la base, no al signo.',
          explanation: `${m(`-${p.b}^{${p.n}} = -(${pw(p.b, p.n)}) = -${power}`)}. Sería ${m(String(power))} si el signo estuviera dentro del paréntesis: ${m(`(-${p.b})^{${p.n}}`)}.`,
        };
      },
      check(p) {
        return [-Math.pow(p.b, p.n), -Math.pow(p.b, p.n)];
      },
    },
    // Contraste explícito entre (−x)^n y −x^n.
    {
      id: 'di09', category: 'distribucion', difficulty: 2,
      factor: 'signo_paridad', correct: 0, trap: 1,
      params(random) {
        return { x: pick(random, ONE_VAR), n: pick(random, [2, 4]), k: pick(random, [3, 5]) };
      },
      build(p) {
        const { x, n, k } = p;
        return {
          prompt: `¿Cuál de estas igualdades se cumple para todo valor real?`,
          options: [
            m(`(-${x})^{${n}} = ${pw(x, n)}`),
            m(`-${x}^{${n}} = ${pw(x, n)}`),
            m(`(-${x})^{${k}} = ${pw(x, k)}`),
            m(`(-${x})^{${n}} = -${pw(x, n)}`),
          ],
          hint: `Fíjate en si el signo queda dentro del paréntesis y en si el exponente es par o impar.`,
          explanation: `${m(`(-${x})^{${n}} = ${pw(x, n)}`)} porque ${m(String(n))} es par y el signo entra en la potencia. En cambio ${m(`-${x}^{${n}}`)} es el opuesto de ${m(pw(x, n))}, y ${m(`(-${x})^{${k}} = -${pw(x, k)}`)} porque ${m(String(k))} es impar.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        return [Math.pow(-x, p.n), Math.pow(x, p.n)];
      },
    },
    // Los dos signos a la vez en un cociente.
    {
      id: 'co09', category: 'combinadas', difficulty: 3,
      factor: 'signo_paridad', correct: 0, trap: 1,
      params(random) {
        return { x: pick(random, ONE_VAR), n: pick(random, [2, 4]) };
      },
      build(p) {
        return {
          prompt: `Para ${m(`${p.x} \\neq 0`)}, simplifica ${m(`\\frac{(-${p.x})^{${p.n}}}{-${p.x}^{${p.n}}}`)}.`,
          options: [
            m('-1'),
            m('1'),
            m(`-${pw(p.x, p.n)}`),
            m(pw(p.x, p.n)),
          ],
          hint: `El numerador es positivo porque ${m(String(p.n))} es par; el denominador lleva el signo fuera de la potencia.`,
          explanation: `${m(`(-${p.x})^{${p.n}} = ${pw(p.x, p.n)}`)} y ${m(`-${p.x}^{${p.n}} = -${pw(p.x, p.n)}`)}, así que el cociente vale ${m('-1')}.`,
        };
      },
      check(p, val) {
        const x = val(p.x);
        return [Math.pow(-x, p.n) / -Math.pow(x, p.n), -1];
      },
    },
  ];

  const OPTION_COUNT = 4;

  // Las plantillas se usan tal cual en la selección adaptativa, antes de generar la
  // variante, así que necesitan el número de opciones para el suelo de azar del 3PL.
  TEMPLATES.forEach((template) => { template.optionCount = OPTION_COUNT; });

  function distinctOptions(options) {
    return new Set(options).size === options.length;
  }

  // Genera una variante concreta de la plantilla. Reintenta si los parámetros
  // sorteados producen dos opciones idénticas, que dejarían la pregunta ambigua.
  function instantiate(template, random) {
    let params = null;
    let built = null;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      params = template.params(random);
      built = template.build(params);
      if (distinctOptions(built.options)) break;
      built = null;
    }
    if (!built) throw new Error(`No se pudo generar una variante válida de ${template.id}`);
    return {
      id: template.id,
      category: template.category,
      difficulty: template.difficulty,
      factor: template.factor,
      correct: template.correct,
      trap: template.trap,
      optionCount: OPTION_COUNT,
      variantKey: `${template.id}|${JSON.stringify(params)}`,
      params,
      prompt: built.prompt,
      options: built.options,
      hint: built.hint,
      explanation: built.explanation,
    };
  }

  // Instancia de referencia de cada plantilla, con semilla fija. Da a los tests y a la
  // validación Monte Carlo un banco estable con los mismos metadatos que las variantes.
  function referenceBank(seed) {
    let state = (Number(seed) || 20260710) >>> 0;
    const random = function random() {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
    return TEMPLATES.map((template) => instantiate(template, random));
  }

  const QUESTIONS = referenceBank(20260710);

  return { CATEGORIES, FACTORS, TEMPLATES, QUESTIONS, instantiate, referenceBank };
});
