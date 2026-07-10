(function () {
  'use strict';

  const E = window.BayesEngine;
  const { FACTORS } = window.PowersBank;
  const validator = window.PowersValidation;
  const button = document.getElementById('run-validation');
  const status = document.getElementById('validation-status');

  function percentage(value) {
    return `${(value * 100).toFixed(1).replace('.', ',')} %`;
  }

  function render(result) {
    document.getElementById('metric-accuracy').textContent = percentage(result.balancedAccuracy);
    document.getElementById('metric-provisional').textContent = percentage(result.provisionalRate);
    document.getElementById('metric-length').textContent = `${result.averageGlobalLength.toFixed(1).replace('.', ',')} preg.`;
    document.getElementById('metric-seed').textContent = String(result.seed);

    const alerts = document.getElementById('validation-alerts');
    if (result.alerts.length) {
      alerts.innerHTML = `<ul class="alerts">${result.alerts.map((alert) => `<li>${alert}</li>`).join('')}</ul>`;
    } else {
      alerts.innerHTML = '<p class="ok-notice">Todos los niveles y estados de error superan el umbral orientativo del 70 % bajo el modelo.</p>';
    }

    document.getElementById('matrix-head').innerHTML = `<tr><th>Nivel real</th>${E.LEVELS.map((level) => `<th>${level.name}</th>`).join('')}<th>Provisional</th><th>Acierto</th></tr>`;
    document.getElementById('matrix-body').innerHTML = result.matrix.map((row, truth) => `
      <tr>
        <th scope="row">${E.LEVELS[truth].name}</th>
        ${row.map((count, diagnosis) => `<td class="${diagnosis === truth ? 'hit' : ''}">${count}</td>`).join('')}
        <td><strong>${percentage(result.globalRates[truth])}</strong></td>
      </tr>
    `).join('');

    document.getElementById('factor-body').innerHTML = Object.entries(result.factorResults).map(([id, factor]) => `
      <tr>
        <th scope="row">${FACTORS[id].teacher}</th>
        <td>${percentage(factor.absentAccuracy)}</td>
        <td>${percentage(factor.presentAccuracy)}</td>
        <td><strong>${percentage(factor.balancedAccuracy)}</strong></td>
        <td>${percentage(factor.indeterminateRate)}</td>
      </tr>
    `).join('');

    document.getElementById('validation-results').hidden = false;
    status.textContent = `Validación terminada: ${result.iterations} simulaciones por estado.`;
  }

  button.addEventListener('click', () => {
    button.disabled = true;
    status.textContent = 'Simulando… puede tardar unos segundos.';
    window.setTimeout(() => {
      try {
        render(validator.runValidation({ iterations: 500, seed: 20260710 }));
      } catch (error) {
        status.textContent = `No se pudo completar: ${error.message}`;
      } finally {
        button.disabled = false;
      }
    }, 30);
  });
})();
