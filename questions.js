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
      prompt: 'Simplifica <span class="math">2<sup>3</sup> · 2<sup>5</sup></span>.',
      options: ['<span class="math">2<sup>8</sup></span>', '<span class="math">2<sup>15</sup></span>', '<span class="math">4<sup>8</sup></span>', '<span class="math">2<sup>2</sup></span>'],
      correct: 0, factor: 'opera_exponentes', trap: 1,
      hint: 'La base es la misma y las potencias se están multiplicando.',
      explanation: 'En un producto de potencias de la misma base se suman los exponentes: <span class="math">2<sup>3+5</sup> = 2<sup>8</sup></span>.',
    },
    {
      id: 'mb02', category: 'misma_base', difficulty: 0,
      prompt: 'Para <span class="math">x ≠ 0</span>, ¿a qué equivale <span class="math">x<sup>9</sup> / x<sup>4</sup></span>?',
      options: ['<span class="math">x<sup>13</sup></span>', '<span class="math">x<sup>9/4</sup></span>', '<span class="math">x<sup>5</sup></span>', '<span class="math">x<sup>−5</sup></span>'],
      correct: 2, factor: 'opera_exponentes', trap: 1,
      hint: 'En un cociente de la misma base se resta el exponente del denominador.',
      explanation: '<span class="math">x<sup>9</sup> / x<sup>4</sup> = x<sup>9−4</sup> = x<sup>5</sup></span>. Los exponentes no se dividen.',
    },
    {
      id: 'mb03', category: 'misma_base', difficulty: 1,
      prompt: 'Simplifica <span class="math">a<sup>−2</sup> · a<sup>7</sup></span>.',
      options: ['<span class="math">a<sup>−14</sup></span>', '<span class="math">a<sup>9</sup></span>', '<span class="math">a<sup>−5</sup></span>', '<span class="math">a<sup>5</sup></span>'],
      correct: 3, factor: 'opera_exponentes', trap: 0,
      hint: 'Suma los exponentes conservando su signo.',
      explanation: '<span class="math">−2 + 7 = 5</span>, por tanto el resultado es <span class="math">a<sup>5</sup></span>.',
    },
    {
      id: 'mb04', category: 'misma_base', difficulty: 2,
      prompt: 'Simplifica <span class="math">(3<sup>8</sup> · 3<sup>−2</sup>) / 3<sup>3</sup></span>.',
      options: ['<span class="math">3<sup>3</sup></span>', '<span class="math">3<sup>9</sup></span>', '<span class="math">3<sup>−48</sup></span>', '<span class="math">3<sup>7</sup></span>'],
      correct: 0, factor: 'opera_exponentes', trap: 1,
      hint: 'En el exponente final aparece una suma y después una resta.',
      explanation: 'Se combinan los exponentes: <span class="math">8 + (−2) − 3 = 3</span>.',
    },
    {
      id: 'mb05', category: 'misma_base', difficulty: 2,
      prompt: '¿Qué valor tiene <span class="math">5<sup>n</sup> · 5<sup>2−n</sup></span>?',
      options: ['<span class="math">5<sup>2n−2</sup></span>', '<span class="math">25</span>', '<span class="math">5<sup>2n</sup></span>', '<span class="math">1</span>'],
      correct: 1, factor: 'opera_exponentes', trap: 2,
      hint: 'Suma <span class="math">n + (2−n)</span>.',
      explanation: '<span class="math">n + 2 − n = 2</span>, así que queda <span class="math">5<sup>2</sup> = 25</span>.',
    },
    {
      id: 'mb06', category: 'misma_base', difficulty: 3,
      prompt: 'Para <span class="math">x, y ≠ 0</span>, simplifica con exponentes positivos <span class="math">x<sup>4</sup>y<sup>3</sup> · x<sup>−6</sup>y<sup>2</sup></span>.',
      options: ['<span class="math">x<sup>−24</sup>y<sup>6</sup></span>', '<span class="math">x<sup>10</sup>y<sup>5</sup></span>', '<span class="math">y<sup>5</sup>/x<sup>2</sup></span>', '<span class="math">x<sup>−2</sup>y</span>'],
      correct: 2, factor: 'opera_exponentes', trap: 0,
      hint: 'Agrupa por separado las potencias de <span class="math">x</span> y las de <span class="math">y</span>.',
      explanation: '<span class="math">x<sup>4−6</sup>y<sup>3+2</sup> = x<sup>−2</sup>y<sup>5</sup> = y<sup>5</sup>/x<sup>2</sup></span>.',
    },

    // Potencia de una potencia
    {
      id: 'pp01', category: 'potencia_potencia', difficulty: 0,
      prompt: 'Simplifica <span class="math">(x<sup>3</sup>)<sup>4</sup></span>.',
      options: ['<span class="math">x<sup>7</sup></span>', '<span class="math">x<sup>12</sup></span>', '<span class="math">x<sup>81</sup></span>', '<span class="math">4x<sup>3</sup></span>'],
      correct: 1, factor: 'potencia_incompleta', trap: 0,
      hint: 'En una potencia de otra potencia, los exponentes se multiplican.',
      explanation: '<span class="math">(x<sup>3</sup>)<sup>4</sup> = x<sup>3·4</sup> = x<sup>12</sup></span>.',
    },
    {
      id: 'pp02', category: 'potencia_potencia', difficulty: 1,
      prompt: 'Simplifica <span class="math">(a<sup>−2</sup>)<sup>3</sup></span>.',
      options: ['<span class="math">a<sup>−6</sup></span>', '<span class="math">a<sup>1</sup></span>', '<span class="math">a<sup>−8</sup></span>', '<span class="math">−a<sup>6</sup></span>'],
      correct: 0, factor: 'potencia_incompleta', trap: 1,
      hint: 'Multiplica <span class="math">−2</span> por <span class="math">3</span>.',
      explanation: 'Los exponentes se multiplican: <span class="math">−2 · 3 = −6</span>.',
    },
    {
      id: 'pp03', category: 'potencia_potencia', difficulty: 1,
      prompt: 'Desarrolla la potencia <span class="math">(2x<sup>2</sup>)<sup>3</sup></span>.',
      options: ['<span class="math">6x<sup>6</sup></span>', '<span class="math">8x<sup>5</sup></span>', '<span class="math">2x<sup>6</sup></span>', '<span class="math">8x<sup>6</sup></span>'],
      correct: 3, factor: 'potencia_incompleta', trap: 2,
      hint: 'El exponente <span class="math">3</span> afecta al <span class="math">2</span> y a <span class="math">x<sup>2</sup></span>.',
      explanation: '<span class="math">2<sup>3</sup>(x<sup>2</sup>)<sup>3</sup> = 8x<sup>6</sup></span>.',
    },
    {
      id: 'pp04', category: 'potencia_potencia', difficulty: 2,
      prompt: 'Simplifica <span class="math">((x<sup>2</sup>)<sup>3</sup>)<sup>4</sup></span>.',
      options: ['<span class="math">x<sup>9</sup></span>', '<span class="math">x<sup>24</sup></span>', '<span class="math">x<sup>14</sup></span>', '<span class="math">x<sup>64</sup></span>'],
      correct: 1, factor: 'potencia_incompleta', trap: 0,
      hint: 'Multiplica los tres exponentes.',
      explanation: '<span class="math">2 · 3 · 4 = 24</span>, luego resulta <span class="math">x<sup>24</sup></span>.',
    },
    {
      id: 'pp05', category: 'potencia_potencia', difficulty: 3,
      prompt: 'Simplifica <span class="math">(x<sup>m−1</sup>)<sup>3</sup></span>.',
      options: ['<span class="math">x<sup>m+2</sup></span>', '<span class="math">x<sup>3m−1</sup></span>', '<span class="math">x<sup>3m−3</sup></span>', '<span class="math">3x<sup>m−1</sup></span>'],
      correct: 2, factor: 'potencia_incompleta', trap: 0,
      hint: 'El <span class="math">3</span> multiplica a todo el exponente <span class="math">m−1</span>.',
      explanation: '<span class="math">3(m−1) = 3m−3</span>, por eso queda <span class="math">x<sup>3m−3</sup></span>.',
    },
    {
      id: 'pp06', category: 'potencia_potencia', difficulty: 3,
      prompt: 'Para <span class="math">a ≠ 0</span>, expresa con exponente positivo <span class="math">(a<sup>2</sup>)<sup>−3</sup></span>.',
      options: ['<span class="math">1/a<sup>6</sup></span>', '<span class="math">−a<sup>6</sup></span>', '<span class="math">1/a</span>', '<span class="math">a<sup>−1</sup></span>'],
      correct: 0, factor: 'potencia_incompleta', trap: 2,
      hint: 'Primero multiplica los exponentes y luego elimina el exponente negativo.',
      explanation: '<span class="math">(a<sup>2</sup>)<sup>−3</sup> = a<sup>−6</sup> = 1/a<sup>6</sup></span>.',
    },

    // Distribución sobre productos, cocientes y sumas
    {
      id: 'di01', category: 'distribucion', difficulty: 0,
      prompt: '¿Cuál de estas igualdades es válida para todos los valores reales?',
      options: ['<span class="math">(a+b)<sup>2</sup> = a<sup>2</sup>+b<sup>2</sup></span>', '<span class="math">(ab)<sup>3</sup> = a<sup>3</sup>b<sup>3</sup></span>', '<span class="math">(a−b)<sup>2</sup> = a<sup>2</sup>−b<sup>2</sup></span>', '<span class="math">(a+b)<sup>3</sup> = a<sup>3</sup>+b<sup>3</sup></span>'],
      correct: 1, factor: 'distribuye_suma', trap: 0,
      hint: 'Una potencia se distribuye sobre un producto, no sobre una suma.',
      explanation: 'La propiedad válida es <span class="math">(ab)<sup>n</sup> = a<sup>n</sup>b<sup>n</sup></span>. En una suma aparecen términos cruzados.',
    },
    {
      id: 'di02', category: 'distribucion', difficulty: 1,
      prompt: 'Desarrolla <span class="math">(x+2)<sup>2</sup></span>.',
      options: ['<span class="math">x<sup>2</sup>+4</span>', '<span class="math">x<sup>2</sup>+2x+4</span>', '<span class="math">x<sup>2</sup>+4x+4</span>', '<span class="math">2x<sup>2</sup>+4</span>'],
      correct: 2, factor: 'distribuye_suma', trap: 0,
      hint: 'Usa <span class="math">(a+b)<sup>2</sup> = a<sup>2</sup>+2ab+b<sup>2</sup></span>.',
      explanation: '<span class="math">(x+2)<sup>2</sup> = x<sup>2</sup> + 2·x·2 + 2<sup>2</sup> = x<sup>2</sup>+4x+4</span>.',
    },
    {
      id: 'di03', category: 'distribucion', difficulty: 1,
      prompt: 'Simplifica <span class="math">(−3a<sup>2</sup>b)<sup>3</sup></span>.',
      options: ['<span class="math">−9a<sup>6</sup>b<sup>3</sup></span>', '<span class="math">−27a<sup>6</sup>b<sup>3</sup></span>', '<span class="math">27a<sup>5</sup>b<sup>3</sup></span>', '<span class="math">−3a<sup>6</sup>b</span>'],
      correct: 1, factor: 'potencia_incompleta', trap: 3,
      hint: 'Eleva por separado <span class="math">−3</span>, <span class="math">a<sup>2</sup></span> y <span class="math">b</span>.',
      explanation: '<span class="math">(−3)<sup>3</sup>(a<sup>2</sup>)<sup>3</sup>b<sup>3</sup> = −27a<sup>6</sup>b<sup>3</sup></span>.',
    },
    {
      id: 'di04', category: 'distribucion', difficulty: 2,
      prompt: 'Desarrolla <span class="math">(x−3)<sup>2</sup></span>.',
      options: ['<span class="math">x<sup>2</sup>−9</span>', '<span class="math">x<sup>2</sup>+9</span>', '<span class="math">x<sup>2</sup>−6x+9</span>', '<span class="math">x<sup>2</sup>−3x+9</span>'],
      correct: 2, factor: 'distribuye_suma', trap: 1,
      hint: 'En <span class="math">(a−b)<sup>2</sup></span> aparece el término central <span class="math">−2ab</span>.',
      explanation: '<span class="math">(x−3)<sup>2</sup> = x<sup>2</sup>−2·x·3+9 = x<sup>2</sup>−6x+9</span>.',
    },
    {
      id: 'di05', category: 'distribucion', difficulty: 3,
      prompt: 'Para valores no nulos, simplifica <span class="math">(2x/y<sup>2</sup>)<sup>−2</sup></span>.',
      options: ['<span class="math">−4x<sup>2</sup>/y<sup>4</sup></span>', '<span class="math">y<sup>4</sup>/(4x<sup>2</sup>)</span>', '<span class="math">y<sup>2</sup>/(2x)</span>', '<span class="math">4y<sup>4</sup>/x<sup>2</sup></span>'],
      correct: 1, factor: 'potencia_incompleta', trap: 2,
      hint: 'Invierte primero la fracción y después eleva cada factor al cuadrado.',
      explanation: '<span class="math">(y<sup>2</sup>/2x)<sup>2</sup> = y<sup>4</sup>/(4x<sup>2</sup>)</span>.',
    },
    {
      id: 'di06', category: 'distribucion', difficulty: 4,
      prompt: '¿Cuál es el desarrollo de <span class="math">(a+b)<sup>3</sup></span>?',
      options: ['<span class="math">a<sup>3</sup>+b<sup>3</sup></span>', '<span class="math">a<sup>3</sup>+3a<sup>2</sup>b+3ab<sup>2</sup>+b<sup>3</sup></span>', '<span class="math">a<sup>3</sup>+3ab+b<sup>3</sup></span>', '<span class="math">a<sup>3</sup>+a<sup>2</sup>b+ab<sup>2</sup>+b<sup>3</sup></span>'],
      correct: 1, factor: 'distribuye_suma', trap: 0,
      hint: 'Piensa en la fila correspondiente del triángulo de Pascal: <span class="math">1, 3, 3, 1</span>.',
      explanation: 'El cubo de una suma contiene cuatro términos: <span class="math">a<sup>3</sup>+3a<sup>2</sup>b+3ab<sup>2</sup>+b<sup>3</sup></span>.',
    },

    // Exponentes cero y negativos
    {
      id: 'ne01', category: 'negativos', difficulty: 0,
      prompt: 'Para <span class="math">x ≠ 0</span>, ¿qué significa <span class="math">x<sup>−3</sup></span>?',
      options: ['<span class="math">−x<sup>3</sup></span>', '<span class="math">1/x<sup>3</sup></span>', '<span class="math">x/3</span>', '<span class="math">3/x</span>'],
      correct: 1, factor: 'exponente_negativo', trap: 0,
      hint: 'Un exponente negativo indica el inverso de la potencia positiva.',
      explanation: '<span class="math">x<sup>−3</sup> = 1/x<sup>3</sup></span>. El signo negativo pertenece al exponente, no al valor de la potencia.',
    },
    {
      id: 'ne02', category: 'negativos', difficulty: 0,
      prompt: 'Para <span class="math">a ≠ 0</span>, el valor de <span class="math">a<sup>0</sup></span> es…',
      options: ['<span class="math">0</span>', '<span class="math">a</span>', '<span class="math">1</span>', '<span class="math">−1</span>'],
      correct: 2, factor: 'exponente_negativo', trap: 0,
      hint: 'Divide <span class="math">a<sup>m</sup></span> entre sí misma y aplica la regla del cociente.',
      explanation: '<span class="math">a<sup>m</sup>/a<sup>m</sup> = a<sup>m−m</sup> = a<sup>0</sup> = 1</span>, si <span class="math">a ≠ 0</span>.',
    },
    {
      id: 'ne03', category: 'negativos', difficulty: 1,
      prompt: 'Calcula <span class="math">2<sup>0</sup> + 2<sup>−1</sup></span>.',
      options: ['<span class="math">−1</span>', '<span class="math">1/2</span>', '<span class="math">3/2</span>', '<span class="math">2</span>'],
      correct: 2, factor: 'exponente_negativo', trap: 0,
      hint: '<span class="math">2<sup>0</sup> = 1</span> y <span class="math">2<sup>−1</sup> = 1/2</span>.',
      explanation: '<span class="math">1 + 1/2 = 3/2</span>.',
    },
    {
      id: 'ne04', category: 'negativos', difficulty: 2,
      prompt: 'Simplifica, con exponentes positivos, <span class="math">(x<sup>−2</sup>y<sup>3</sup>)/(xy<sup>−1</sup>)</span>.',
      options: ['<span class="math">y<sup>2</sup>/x</span>', '<span class="math">x<sup>3</sup>/y<sup>4</sup></span>', '<span class="math">y<sup>4</sup>/x<sup>3</sup></span>', '<span class="math">−y<sup>3</sup>/x<sup>2</sup></span>'],
      correct: 2, factor: 'exponente_negativo', trap: 3,
      hint: 'Al dividir, resta los exponentes de cada letra por separado.',
      explanation: '<span class="math">x<sup>−2−1</sup>y<sup>3−(−1)</sup> = x<sup>−3</sup>y<sup>4</sup> = y<sup>4</sup>/x<sup>3</sup></span>.',
    },
    {
      id: 'ne05', category: 'negativos', difficulty: 2,
      prompt: 'Para <span class="math">a ≠ 0</span>, simplifica <span class="math">1/a<sup>−4</sup></span>.',
      options: ['<span class="math">−a<sup>4</sup></span>', '<span class="math">1/a<sup>4</sup></span>', '<span class="math">a<sup>4</sup></span>', '<span class="math">a<sup>−5</sup></span>'],
      correct: 2, factor: 'exponente_negativo', trap: 1,
      hint: '<span class="math">a<sup>−4</sup> = 1/a<sup>4</sup></span>; ahora divide <span class="math">1</span> entre esa fracción.',
      explanation: '<span class="math">1/(1/a<sup>4</sup>) = a<sup>4</sup></span>.',
    },
    {
      id: 'ne06', category: 'negativos', difficulty: 3,
      prompt: 'Calcula <span class="math">(−2)<sup>−3</sup></span>.',
      options: ['<span class="math">−8</span>', '<span class="math">1/8</span>', '<span class="math">−1/8</span>', '<span class="math">8</span>'],
      correct: 2, factor: 'exponente_negativo', trap: 0,
      hint: 'Invierte la potencia y conserva los paréntesis de la base.',
      explanation: '<span class="math">(−2)<sup>−3</sup> = 1/(−2)<sup>3</sup> = −1/8</span>.',
    },

    // Exponentes racionales
    {
      id: 'ra01', category: 'racionales', difficulty: 0,
      prompt: 'Para <span class="math">x ≥ 0</span>, <span class="math">x<sup>1/2</sup></span> equivale a…',
      options: ['<span class="math">√x</span>', '<span class="math">x/2</span>', '<span class="math">2√x</span>', '<span class="math">√(x<sup>2</sup>)</span>'],
      correct: 0, factor: 'fraccionario', trap: 1,
      hint: 'El denominador del exponente indica el índice de la raíz.',
      explanation: '<span class="math">x<sup>1/2</sup> = √x</span>.',
    },
    {
      id: 'ra02', category: 'racionales', difficulty: 1,
      prompt: 'Calcula <span class="math">27<sup>2/3</sup></span>.',
      options: ['<span class="math">6</span>', '<span class="math">9</span>', '<span class="math">18</span>', '<span class="math">81</span>'],
      correct: 1, factor: 'fraccionario', trap: 3,
      hint: 'Toma primero la raíz cúbica de <span class="math">27</span> y después eleva al cuadrado.',
      explanation: '<span class="math">27<sup>2/3</sup> = (∛27)<sup>2</sup> = 3<sup>2</sup> = 9</span>.',
    },
    {
      id: 'ra03', category: 'racionales', difficulty: 1,
      prompt: 'Escribe <span class="math"><sup>5</sup>√(a<sup>2</sup>)</span> como potencia de base <span class="math">a</span>.',
      options: ['<span class="math">a<sup>5/2</sup></span>', '<span class="math">a<sup>2/5</sup></span>', '<span class="math">a<sup>1/10</sup></span>', '<span class="math">a<sup>3</sup></span>'],
      correct: 1, factor: 'fraccionario', trap: 0,
      hint: 'El exponente del radicando va en el numerador y el índice en el denominador.',
      explanation: '<span class="math"><sup>5</sup>√(a<sup>2</sup>) = a<sup>2/5</sup></span>.',
    },
    {
      id: 'ra04', category: 'racionales', difficulty: 2,
      prompt: 'Calcula <span class="math">16<sup>−3/4</sup></span>.',
      options: ['<span class="math">−8</span>', '<span class="math">1/8</span>', '<span class="math">8</span>', '<span class="math">−1/8</span>'],
      correct: 1, factor: 'fraccionario', trap: 2,
      hint: 'La raíz cuarta de <span class="math">16</span> es <span class="math">2</span>; el signo negativo obliga a invertir.',
      explanation: '<span class="math">16<sup>−3/4</sup> = 1/(⁴√16)<sup>3</sup> = 1/2<sup>3</sup> = 1/8</span>.',
    },
    {
      id: 'ra05', category: 'racionales', difficulty: 2,
      prompt: 'Para <span class="math">x ≥ 0</span>, simplifica <span class="math">x<sup>3/2</sup></span>.',
      options: ['<span class="math">3√x</span>', '<span class="math">x√x</span>', '<span class="math">√(3x)</span>', '<span class="math">x<sup>2/3</sup></span>'],
      correct: 1, factor: 'fraccionario', trap: 3,
      hint: 'Separa <span class="math">3/2 = 1 + 1/2</span>.',
      explanation: '<span class="math">x<sup>3/2</sup> = x<sup>1+1/2</sup> = x√x</span>.',
    },
    {
      id: 'ra06', category: 'racionales', difficulty: 3,
      prompt: 'Para <span class="math">x &gt; 0</span>, simplifica <span class="math">x<sup>2/3</sup> · x<sup>1/6</sup></span>.',
      options: ['<span class="math">x<sup>3/9</sup></span>', '<span class="math">x<sup>1/9</sup></span>', '<span class="math">x<sup>5/6</sup></span>', '<span class="math">x<sup>2/18</sup></span>'],
      correct: 2, factor: 'fraccionario', trap: 0,
      hint: 'Suma las fracciones usando denominador común <span class="math">6</span>.',
      explanation: '<span class="math">2/3 + 1/6 = 4/6 + 1/6 = 5/6</span>.',
    },

    // Expresiones combinadas
    {
      id: 'co01', category: 'combinadas', difficulty: 2,
      prompt: 'Para <span class="math">x, y ≠ 0</span>, simplifica con exponentes positivos <span class="math">(x<sup>3</sup>y<sup>−2</sup>)<sup>2</sup>/(x<sup>−1</sup>y)</span>.',
      options: ['<span class="math">x<sup>7</sup>/y<sup>5</sup></span>', '<span class="math">x<sup>5</sup>/y<sup>3</sup></span>', '<span class="math">x<sup>6</sup>/y<sup>4</sup></span>', '<span class="math">y<sup>5</sup>/x<sup>7</sup></span>'],
      correct: 0, factor: 'potencia_incompleta', trap: 2,
      hint: 'Aplica primero el cuadrado y luego resta los exponentes del denominador.',
      explanation: '<span class="math">x<sup>6−(−1)</sup>y<sup>−4−1</sup> = x<sup>7</sup>y<sup>−5</sup> = x<sup>7</sup>/y<sup>5</sup></span>.',
    },
    {
      id: 'co02', category: 'combinadas', difficulty: 2,
      prompt: 'Simplifica <span class="math">(8x<sup>6</sup>)<sup>1/3</sup></span>.',
      options: ['<span class="math">8x<sup>2</sup></span>', '<span class="math">2x<sup>2</sup></span>', '<span class="math">2x<sup>3</sup></span>', '<span class="math">(8/3)x<sup>2</sup></span>'],
      correct: 1, factor: 'fraccionario', trap: 0,
      hint: 'La potencia <span class="math">1/3</span> es una raíz cúbica que afecta a ambos factores.',
      explanation: '<span class="math">∛8 · ∛(x<sup>6</sup>) = 2x<sup>2</sup></span>.',
    },
    {
      id: 'co03', category: 'combinadas', difficulty: 3,
      prompt: 'Para valores no nulos, simplifica <span class="math">(2a<sup>−1</sup>b<sup>2</sup>)<sup>−2</sup></span>.',
      options: ['<span class="math">−4a<sup>2</sup>/b<sup>4</sup></span>', '<span class="math">a<sup>2</sup>/(4b<sup>4</sup>)</span>', '<span class="math">b<sup>4</sup>/(4a<sup>2</sup>)</span>', '<span class="math">a/(2b<sup>2</sup>)</span>'],
      correct: 1, factor: 'exponente_negativo', trap: 0,
      hint: 'Invierte toda la expresión y después eleva al cuadrado.',
      explanation: '<span class="math">(a/(2b<sup>2</sup>))<sup>2</sup> = a<sup>2</sup>/(4b<sup>4</sup>)</span>.',
    },
    {
      id: 'co04', category: 'combinadas', difficulty: 3,
      prompt: 'Para <span class="math">x, y ≠ 0</span>, simplifica <span class="math">((x<sup>2</sup>y<sup>−1</sup>)/(x<sup>−3</sup>y<sup>2</sup>))<sup>−1</sup></span>.',
      options: ['<span class="math">x<sup>5</sup>/y<sup>3</sup></span>', '<span class="math">y<sup>3</sup>/x<sup>5</sup></span>', '<span class="math">x/y</span>', '<span class="math">y/x</span>'],
      correct: 1, factor: 'exponente_negativo', trap: 0,
      hint: 'La fracción interior es <span class="math">x<sup>5</sup>/y<sup>3</sup></span>; luego aplica el exponente <span class="math">−1</span>.',
      explanation: 'Dentro queda <span class="math">x<sup>5</sup>y<sup>−3</sup></span>. El exponente <span class="math">−1</span> invierte la expresión: <span class="math">y<sup>3</sup>/x<sup>5</sup></span>.',
    },
    {
      id: 'co05', category: 'combinadas', difficulty: 4,
      prompt: 'Para <span class="math">x ≠ 0</span>, simplifica <span class="math">(9x<sup>−4</sup>)<sup>1/2</sup></span>.',
      options: ['<span class="math">3/x<sup>2</sup></span>', '<span class="math">9/x<sup>2</sup></span>', '<span class="math">3/x<sup>4</sup></span>', '<span class="math">−3x<sup>2</sup></span>'],
      correct: 0, factor: 'fraccionario', trap: 2,
      hint: 'Toma la raíz cuadrada de <span class="math">9</span> y de <span class="math">x<sup>−4</sup></span>.',
      explanation: '<span class="math">√9 · x<sup>−2</sup> = 3/x<sup>2</sup></span>.',
    },
    {
      id: 'co06', category: 'combinadas', difficulty: 4,
      prompt: 'Para <span class="math">a, b ≠ 0</span>, simplifica con exponentes positivos <span class="math">(a<sup>−2</sup>b)<sup>3</sup>/(ab<sup>−2</sup>)</span>.',
      options: ['<span class="math">b<sup>5</sup>/a<sup>7</sup></span>', '<span class="math">a<sup>−5</sup>b</span>', '<span class="math">a<sup>−6</sup>b<sup>3</sup></span>', '<span class="math">a<sup>7</sup>/b<sup>5</sup></span>'],
      correct: 0, factor: 'potencia_incompleta', trap: 2,
      hint: 'La potencia del numerador da <span class="math">a<sup>−6</sup>b<sup>3</sup></span>; después resta los exponentes del denominador.',
      explanation: '<span class="math">a<sup>−6−1</sup>b<sup>3−(−2)</sup> = a<sup>−7</sup>b<sup>5</sup> = b<sup>5</sup>/a<sup>7</sup></span>.',
    },
  ];

  return { CATEGORIES, FACTORS, QUESTIONS };
});
