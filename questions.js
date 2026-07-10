(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.PowersBank = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

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
  };

  const QUESTIONS = [
    // Producto y cociente con la misma base
    {
      id: 'mb01', category: 'misma_base', difficulty: 0,
      prompt: 'Simplifica \\(2^{3} \\cdot 2^{5}\\).',
      options: ['\\(2^{8}\\)', '\\(2^{15}\\)', '\\(4^{8}\\)', '\\(2^{2}\\)'],
      correct: 0, factor: 'opera_exponentes', trap: 1,
      hint: 'La base es la misma y las potencias se están multiplicando.',
      explanation: 'En un producto de potencias de la misma base se suman los exponentes: \\(2^{3+5} = 2^{8}\\).',
    },
    {
      id: 'mb02', category: 'misma_base', difficulty: 0,
      prompt: 'Para \\(x \\neq 0\\), ¿a qué equivale \\(x^{9} / x^{4}\\)?',
      options: ['\\(x^{13}\\)', '\\(x^{9/4}\\)', '\\(x^{5}\\)', '\\(x^{-5}\\)'],
      correct: 2, factor: 'opera_exponentes', trap: 1,
      hint: 'En un cociente de la misma base se resta el exponente del denominador.',
      explanation: '\\(x^{9} / x^{4} = x^{9-4} = x^{5}\\). Los exponentes no se dividen.',
    },
    {
      id: 'mb03', category: 'misma_base', difficulty: 1,
      prompt: 'Simplifica \\(a^{-2} \\cdot a^{7}\\).',
      options: ['\\(a^{-14}\\)', '\\(a^{9}\\)', '\\(a^{-5}\\)', '\\(a^{5}\\)'],
      correct: 3, factor: 'opera_exponentes', trap: 0,
      hint: 'Suma los exponentes conservando su signo.',
      explanation: '\\(-2 + 7 = 5\\), por tanto el resultado es \\(a^{5}\\).',
    },
    {
      id: 'mb04', category: 'misma_base', difficulty: 2,
      prompt: 'Simplifica \\((3^{8} \\cdot 3^{-2}) / 3^{3}\\).',
      options: ['\\(3^{3}\\)', '\\(3^{9}\\)', '\\(3^{-48}\\)', '\\(3^{7}\\)'],
      correct: 0, factor: 'opera_exponentes', trap: 1,
      hint: 'En el exponente final aparece una suma y después una resta.',
      explanation: 'Se combinan los exponentes: \\(8 + (-2) - 3 = 3\\).',
    },
    {
      id: 'mb05', category: 'misma_base', difficulty: 2,
      prompt: '¿Qué valor tiene \\(5^{n} \\cdot 5^{2-n}\\)?',
      options: ['\\(5^{2n-2}\\)', '\\(25\\)', '\\(5^{2n}\\)', '\\(1\\)'],
      correct: 1, factor: 'opera_exponentes', trap: 2,
      hint: 'Suma \\(n + (2-n)\\).',
      explanation: '\\(n + 2 - n = 2\\), así que queda \\(5^{2} = 25\\).',
    },
    {
      id: 'mb06', category: 'misma_base', difficulty: 3,
      prompt: 'Para \\(x, y \\neq 0\\), simplifica con exponentes positivos \\(x^{4}y^{3} \\cdot x^{-6}y^{2}\\).',
      options: ['\\(x^{-24}y^{6}\\)', '\\(x^{10}y^{5}\\)', '\\(y^{5}/x^{2}\\)', '\\(x^{-2}y\\)'],
      correct: 2, factor: 'opera_exponentes', trap: 0,
      hint: 'Agrupa por separado las potencias de \\(x\\) y las de \\(y\\).',
      explanation: '\\(x^{4-6}y^{3+2} = x^{-2}y^{5} = y^{5}/x^{2}\\).',
    },

    // Potencia de una potencia
    {
      id: 'pp01', category: 'potencia_potencia', difficulty: 0,
      prompt: 'Simplifica \\((x^{3})^{4}\\).',
      options: ['\\(x^{7}\\)', '\\(x^{12}\\)', '\\(x^{81}\\)', '\\(4x^{3}\\)'],
      correct: 1, factor: 'potencia_incompleta', trap: 0,
      hint: 'En una potencia de otra potencia, los exponentes se multiplican.',
      explanation: '\\((x^{3})^{4} = x^{3 \\cdot 4} = x^{12}\\).',
    },
    {
      id: 'pp02', category: 'potencia_potencia', difficulty: 1,
      prompt: 'Simplifica \\((a^{-2})^{3}\\).',
      options: ['\\(a^{-6}\\)', '\\(a^{1}\\)', '\\(a^{-8}\\)', '\\(-a^{6}\\)'],
      correct: 0, factor: 'potencia_incompleta', trap: 1,
      hint: 'Multiplica \\(-2\\) por \\(3\\).',
      explanation: 'Los exponentes se multiplican: \\(-2 \\cdot 3 = -6\\).',
    },
    {
      id: 'pp03', category: 'potencia_potencia', difficulty: 1,
      prompt: 'Desarrolla la potencia \\((2x^{2})^{3}\\).',
      options: ['\\(6x^{6}\\)', '\\(8x^{5}\\)', '\\(2x^{6}\\)', '\\(8x^{6}\\)'],
      correct: 3, factor: 'potencia_incompleta', trap: 2,
      hint: 'El exponente \\(3\\) afecta al \\(2\\) y a \\(x^{2}\\).',
      explanation: '\\(2^{3}(x^{2})^{3} = 8x^{6}\\).',
    },
    {
      id: 'pp04', category: 'potencia_potencia', difficulty: 2,
      prompt: 'Simplifica \\(((x^{2})^{3})^{4}\\).',
      options: ['\\(x^{9}\\)', '\\(x^{24}\\)', '\\(x^{14}\\)', '\\(x^{64}\\)'],
      correct: 1, factor: 'potencia_incompleta', trap: 0,
      hint: 'Multiplica los tres exponentes.',
      explanation: '\\(2 \\cdot 3 \\cdot 4 = 24\\), luego resulta \\(x^{24}\\).',
    },
    {
      id: 'pp05', category: 'potencia_potencia', difficulty: 3,
      prompt: 'Simplifica \\((x^{m-1})^{3}\\).',
      options: ['\\(x^{m+2}\\)', '\\(x^{3m-1}\\)', '\\(x^{3m-3}\\)', '\\(3x^{m-1}\\)'],
      correct: 2, factor: 'potencia_incompleta', trap: 0,
      hint: 'El \\(3\\) multiplica a todo el exponente \\(m-1\\).',
      explanation: '\\(3(m-1) = 3m-3\\), por eso queda \\(x^{3m-3}\\).',
    },
    {
      id: 'pp06', category: 'potencia_potencia', difficulty: 3,
      prompt: 'Para \\(a \\neq 0\\), expresa con exponente positivo \\((a^{2})^{-3}\\).',
      options: ['\\(1/a^{6}\\)', '\\(-a^{6}\\)', '\\(1/a\\)', '\\(a^{-1}\\)'],
      correct: 0, factor: 'potencia_incompleta', trap: 2,
      hint: 'Primero multiplica los exponentes y luego elimina el exponente negativo.',
      explanation: '\\((a^{2})^{-3} = a^{-6} = 1/a^{6}\\).',
    },

    // Distribución sobre productos, cocientes y sumas
    {
      id: 'di01', category: 'distribucion', difficulty: 0,
      prompt: '¿Cuál de estas igualdades es válida para todos los valores reales?',
      options: ['\\((a+b)^{2} = a^{2}+b^{2}\\)', '\\((ab)^{3} = a^{3}b^{3}\\)', '\\((a-b)^{2} = a^{2}-b^{2}\\)', '\\((a+b)^{3} = a^{3}+b^{3}\\)'],
      correct: 1, factor: 'distribuye_suma', trap: 0,
      hint: 'Una potencia se distribuye sobre un producto, no sobre una suma.',
      explanation: 'La propiedad válida es \\((ab)^{n} = a^{n}b^{n}\\). En una suma aparecen términos cruzados.',
    },
    {
      id: 'di02', category: 'distribucion', difficulty: 1,
      prompt: 'Desarrolla \\((x+2)^{2}\\).',
      options: ['\\(x^{2}+4\\)', '\\(x^{2}+2x+4\\)', '\\(x^{2}+4x+4\\)', '\\(2x^{2}+4\\)'],
      correct: 2, factor: 'distribuye_suma', trap: 0,
      hint: 'Usa \\((a+b)^{2} = a^{2}+2ab+b^{2}\\).',
      explanation: '\\((x+2)^{2} = x^{2} + 2 \\cdot x \\cdot 2 + 2^{2} = x^{2}+4x+4\\).',
    },
    {
      id: 'di03', category: 'distribucion', difficulty: 1,
      prompt: 'Simplifica \\((-3a^{2}b)^{3}\\).',
      options: ['\\(-9a^{6}b^{3}\\)', '\\(-27a^{6}b^{3}\\)', '\\(27a^{5}b^{3}\\)', '\\(-3a^{6}b\\)'],
      correct: 1, factor: 'potencia_incompleta', trap: 3,
      hint: 'Eleva por separado \\(-3\\), \\(a^{2}\\) y \\(b\\).',
      explanation: '\\((-3)^{3}(a^{2})^{3}b^{3} = -27a^{6}b^{3}\\).',
    },
    {
      id: 'di04', category: 'distribucion', difficulty: 2,
      prompt: 'Desarrolla \\((x-3)^{2}\\).',
      options: ['\\(x^{2}-9\\)', '\\(x^{2}+9\\)', '\\(x^{2}-6x+9\\)', '\\(x^{2}-3x+9\\)'],
      correct: 2, factor: 'distribuye_suma', trap: 1,
      hint: 'En \\((a-b)^{2}\\) aparece el término central \\(-2ab\\).',
      explanation: '\\((x-3)^{2} = x^{2}-2 \\cdot x \\cdot 3+9 = x^{2}-6x+9\\).',
    },
    {
      id: 'di05', category: 'distribucion', difficulty: 3,
      prompt: 'Para valores no nulos, simplifica \\((2x/y^{2})^{-2}\\).',
      options: ['\\(-4x^{2}/y^{4}\\)', '\\(y^{4}/(4x^{2})\\)', '\\(y^{2}/(2x)\\)', '\\(4y^{4}/x^{2}\\)'],
      correct: 1, factor: 'potencia_incompleta', trap: 2,
      hint: 'Invierte primero la fracción y después eleva cada factor al cuadrado.',
      explanation: '\\((y^{2}/2x)^{2} = y^{4}/(4x^{2})\\).',
    },
    {
      id: 'di06', category: 'distribucion', difficulty: 4,
      prompt: '¿Cuál es el desarrollo de \\((a+b)^{3}\\)?',
      options: ['\\(a^{3}+b^{3}\\)', '\\(a^{3}+3a^{2}b+3ab^{2}+b^{3}\\)', '\\(a^{3}+3ab+b^{3}\\)', '\\(a^{3}+a^{2}b+ab^{2}+b^{3}\\)'],
      correct: 1, factor: 'distribuye_suma', trap: 0,
      hint: 'Piensa en la fila correspondiente del triángulo de Pascal: \\(1, 3, 3, 1\\).',
      explanation: 'El cubo de una suma contiene cuatro términos: \\(a^{3}+3a^{2}b+3ab^{2}+b^{3}\\).',
    },

    // Exponentes cero y negativos
    {
      id: 'ne01', category: 'negativos', difficulty: 0,
      prompt: 'Para \\(x \\neq 0\\), ¿qué significa \\(x^{-3}\\)?',
      options: ['\\(-x^{3}\\)', '\\(1/x^{3}\\)', '\\(x/3\\)', '\\(3/x\\)'],
      correct: 1, factor: 'exponente_negativo', trap: 0,
      hint: 'Un exponente negativo indica el inverso de la potencia positiva.',
      explanation: '\\(x^{-3} = 1/x^{3}\\). El signo negativo pertenece al exponente, no al valor de la potencia.',
    },
    {
      id: 'ne02', category: 'negativos', difficulty: 0,
      prompt: 'Para \\(a \\neq 0\\), el valor de \\(a^{0}\\) es…',
      options: ['\\(0\\)', '\\(a\\)', '\\(1\\)', '\\(-1\\)'],
      correct: 2, factor: 'exponente_negativo', trap: 0,
      hint: 'Divide \\(a^{m}\\) entre sí misma y aplica la regla del cociente.',
      explanation: '\\(a^{m}/a^{m} = a^{m-m} = a^{0} = 1\\), si \\(a \\neq 0\\).',
    },
    {
      id: 'ne03', category: 'negativos', difficulty: 1,
      prompt: 'Calcula \\(2^{0} + 2^{-1}\\).',
      options: ['\\(-1\\)', '\\(1/2\\)', '\\(3/2\\)', '\\(2\\)'],
      correct: 2, factor: 'exponente_negativo', trap: 0,
      hint: '\\(2^{0} = 1\\) y \\(2^{-1} = 1/2\\).',
      explanation: '\\(1 + 1/2 = 3/2\\).',
    },
    {
      id: 'ne04', category: 'negativos', difficulty: 2,
      prompt: 'Simplifica, con exponentes positivos, \\((x^{-2}y^{3})/(xy^{-1})\\).',
      options: ['\\(y^{2}/x\\)', '\\(x^{3}/y^{4}\\)', '\\(y^{4}/x^{3}\\)', '\\(-y^{3}/x^{2}\\)'],
      correct: 2, factor: 'exponente_negativo', trap: 3,
      hint: 'Al dividir, resta los exponentes de cada letra por separado.',
      explanation: '\\(x^{-2-1}y^{3-(-1)} = x^{-3}y^{4} = y^{4}/x^{3}\\).',
    },
    {
      id: 'ne05', category: 'negativos', difficulty: 2,
      prompt: 'Para \\(a \\neq 0\\), simplifica \\(1/a^{-4}\\).',
      options: ['\\(-a^{4}\\)', '\\(1/a^{4}\\)', '\\(a^{4}\\)', '\\(a^{-5}\\)'],
      correct: 2, factor: 'exponente_negativo', trap: 1,
      hint: '\\(a^{-4} = 1/a^{4}\\); ahora divide \\(1\\) entre esa fracción.',
      explanation: '\\(1/(1/a^{4}) = a^{4}\\).',
    },
    {
      id: 'ne06', category: 'negativos', difficulty: 3,
      prompt: 'Calcula \\((-2)^{-3}\\).',
      options: ['\\(-8\\)', '\\(1/8\\)', '\\(-1/8\\)', '\\(8\\)'],
      correct: 2, factor: 'exponente_negativo', trap: 0,
      hint: 'Invierte la potencia y conserva los paréntesis de la base.',
      explanation: '\\((-2)^{-3} = 1/(-2)^{3} = -1/8\\).',
    },

    // Exponentes racionales
    {
      id: 'ra01', category: 'racionales', difficulty: 0,
      prompt: 'Para \\(x \\geq 0\\), \\(x^{1/2}\\) equivale a…',
      options: ['\\(\\sqrt{x}\\)', '\\(x/2\\)', '\\(2\\sqrt{x}\\)', '\\(\\sqrt{x^{2}}\\)'],
      correct: 0, factor: 'fraccionario', trap: 1,
      hint: 'El denominador del exponente indica el índice de la raíz.',
      explanation: '\\(x^{1/2} = \\sqrt{x}\\).',
    },
    {
      id: 'ra02', category: 'racionales', difficulty: 1,
      prompt: 'Calcula \\(27^{2/3}\\).',
      options: ['\\(6\\)', '\\(9\\)', '\\(18\\)', '\\(81\\)'],
      correct: 1, factor: 'fraccionario', trap: 3,
      hint: 'Toma primero la raíz cúbica de \\(27\\) y después eleva al cuadrado.',
      explanation: '\\(27^{2/3} = (\\sqrt[3]{27})^{2} = 3^{2} = 9\\).',
    },
    {
      id: 'ra03', category: 'racionales', difficulty: 1,
      prompt: 'Escribe \\(\\sqrt[5]{a^{2}}\\) como potencia de base \\(a\\).',
      options: ['\\(a^{5/2}\\)', '\\(a^{2/5}\\)', '\\(a^{1/10}\\)', '\\(a^{3}\\)'],
      correct: 1, factor: 'fraccionario', trap: 0,
      hint: 'El exponente del radicando va en el numerador y el índice en el denominador.',
      explanation: '\\(\\sqrt[5]{a^{2}} = a^{2/5}\\).',
    },
    {
      id: 'ra04', category: 'racionales', difficulty: 2,
      prompt: 'Calcula \\(16^{-3/4}\\).',
      options: ['\\(-8\\)', '\\(1/8\\)', '\\(8\\)', '\\(-1/8\\)'],
      correct: 1, factor: 'fraccionario', trap: 2,
      hint: 'La raíz cuarta de \\(16\\) es \\(2\\); el signo negativo obliga a invertir.',
      explanation: '\\(16^{-3/4} = 1/(\\sqrt[4]{16})^{3} = 1/2^{3} = 1/8\\).',
    },
    {
      id: 'ra05', category: 'racionales', difficulty: 2,
      prompt: 'Para \\(x \\geq 0\\), simplifica \\(x^{3/2}\\).',
      options: ['\\(3\\sqrt{x}\\)', '\\(x\\sqrt{x}\\)', '\\(\\sqrt{3x}\\)', '\\(x^{2/3}\\)'],
      correct: 1, factor: 'fraccionario', trap: 3,
      hint: 'Separa \\(3/2 = 1 + 1/2\\).',
      explanation: '\\(x^{3/2} = x^{1+1/2} = x\\sqrt{x}\\).',
    },
    {
      id: 'ra06', category: 'racionales', difficulty: 3,
      prompt: 'Para \\(x > 0\\), simplifica \\(x^{2/3} \\cdot x^{1/6}\\).',
      options: ['\\(x^{3/9}\\)', '\\(x^{1/9}\\)', '\\(x^{5/6}\\)', '\\(x^{2/18}\\)'],
      correct: 2, factor: 'fraccionario', trap: 0,
      hint: 'Suma las fracciones usando denominador común \\(6\\).',
      explanation: '\\(2/3 + 1/6 = 4/6 + 1/6 = 5/6\\).',
    },

    // Expresiones combinadas
    {
      id: 'co01', category: 'combinadas', difficulty: 2,
      prompt: 'Para \\(x, y \\neq 0\\), simplifica con exponentes positivos \\((x^{3}y^{-2})^{2}/(x^{-1}y)\\).',
      options: ['\\(x^{7}/y^{5}\\)', '\\(x^{5}/y^{3}\\)', '\\(x^{6}/y^{4}\\)', '\\(y^{5}/x^{7}\\)'],
      correct: 0, factor: 'potencia_incompleta', trap: 2,
      hint: 'Aplica primero el cuadrado y luego resta los exponentes del denominador.',
      explanation: '\\(x^{6-(-1)}y^{-4-1} = x^{7}y^{-5} = x^{7}/y^{5}\\).',
    },
    {
      id: 'co02', category: 'combinadas', difficulty: 2,
      prompt: 'Simplifica \\((8x^{6})^{1/3}\\).',
      options: ['\\(8x^{2}\\)', '\\(2x^{2}\\)', '\\(2x^{3}\\)', '\\((8/3)x^{2}\\)'],
      correct: 1, factor: 'fraccionario', trap: 0,
      hint: 'La potencia \\(1/3\\) es una raíz cúbica que afecta a ambos factores.',
      explanation: '\\(\\sqrt[3]{8} \\cdot \\sqrt[3]{x^{6}} = 2x^{2}\\).',
    },
    {
      id: 'co03', category: 'combinadas', difficulty: 3,
      prompt: 'Para valores no nulos, simplifica \\((2a^{-1}b^{2})^{-2}\\).',
      options: ['\\(-4a^{2}/b^{4}\\)', '\\(a^{2}/(4b^{4})\\)', '\\(b^{4}/(4a^{2})\\)', '\\(a/(2b^{2})\\)'],
      correct: 1, factor: 'exponente_negativo', trap: 0,
      hint: 'Invierte toda la expresión y después eleva al cuadrado.',
      explanation: '\\((a/(2b^{2}))^{2} = a^{2}/(4b^{4})\\).',
    },
    {
      id: 'co04', category: 'combinadas', difficulty: 3,
      prompt: 'Para \\(x, y \\neq 0\\), simplifica \\(((x^{2}y^{-1})/(x^{-3}y^{2}))^{-1}\\).',
      options: ['\\(x^{5}/y^{3}\\)', '\\(y^{3}/x^{5}\\)', '\\(x/y\\)', '\\(y/x\\)'],
      correct: 1, factor: 'exponente_negativo', trap: 0,
      hint: 'La fracción interior es \\(x^{5}/y^{3}\\); luego aplica el exponente \\(-1\\).',
      explanation: 'Dentro queda \\(x^{5}y^{-3}\\). El exponente \\(-1\\) invierte la expresión: \\(y^{3}/x^{5}\\).',
    },
    {
      id: 'co05', category: 'combinadas', difficulty: 4,
      prompt: 'Para \\(x \\neq 0\\), simplifica \\((9x^{-4})^{1/2}\\).',
      options: ['\\(3/x^{2}\\)', '\\(9/x^{2}\\)', '\\(3/x^{4}\\)', '\\(-3x^{2}\\)'],
      correct: 0, factor: 'fraccionario', trap: 2,
      hint: 'Toma la raíz cuadrada de \\(9\\) y de \\(x^{-4}\\).',
      explanation: '\\(\\sqrt{9} \\cdot x^{-2} = 3/x^{2}\\).',
    },
    {
      id: 'co06', category: 'combinadas', difficulty: 4,
      prompt: 'Para \\(a, b \\neq 0\\), simplifica con exponentes positivos \\((a^{-2}b)^{3}/(ab^{-2})\\).',
      options: ['\\(b^{5}/a^{7}\\)', '\\(a^{-5}b\\)', '\\(a^{-6}b^{3}\\)', '\\(a^{7}/b^{5}\\)'],
      correct: 0, factor: 'potencia_incompleta', trap: 2,
      hint: 'La potencia del numerador da \\(a^{-6}b^{3}\\); después resta los exponentes del denominador.',
      explanation: '\\(a^{-6-1}b^{3-(-2)} = a^{-7}b^{5} = b^{5}/a^{7}\\).',
    },
  ];

  return { CATEGORIES, FACTORS, QUESTIONS };
});
