#!/usr/bin/env node
'use strict';

const { runValidation } = require('../validation-core.js');
const { LEVELS } = require('../engine.js');
const { FACTORS } = require('../questions.js');

const iterations = Math.max(1, Number(process.argv[2]) || 500);
const seed = Number(process.argv[3]) || 20260710;
const result = runValidation({ iterations, seed });

console.log(`Validación PotenciaLab · ${iterations} simulaciones por estado · semilla ${seed}`);
console.log('');
console.log('Nivel global');
LEVELS.forEach((level, index) => {
  console.log(`- ${level.name}: ${(result.globalRates[index] * 100).toFixed(1)} %`);
});
console.log(`- Exactitud equilibrada: ${(result.balancedAccuracy * 100).toFixed(1)} %`);
console.log(`- Resultados provisionales: ${(result.provisionalRate * 100).toFixed(1)} %`);
console.log(`- Longitud media: ${result.averageGlobalLength.toFixed(2)} preguntas`);
console.log('');
console.log('Factores de error');
Object.entries(result.factorResults).forEach(([id, factor]) => {
  console.log(`- ${FACTORS[id].teacher}`);
  console.log(`  ausencia ${(factor.absentAccuracy * 100).toFixed(1)} % · presencia ${(factor.presentAccuracy * 100).toFixed(1)} % · equilibrada ${(factor.balancedAccuracy * 100).toFixed(1)} % · indeterminados ${(factor.indeterminateRate * 100).toFixed(1)} %`);
});
console.log('');
if (result.alerts.length) {
  console.log('Alertas');
  result.alerts.forEach((alert) => console.log(`- ${alert}`));
  process.exitCode = 2;
} else {
  console.log('Sin alertas: todos los estados superan el umbral orientativo del 70 % bajo el modelo.');
}
