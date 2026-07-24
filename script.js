// ===== AI Contribution Assessment =====
// Build the task dropdown and the per-phase AI / Human selectors.
const t = document.getElementById('task');
CONFIG.tasks.forEach(x => t.add(new Option(x, x)));

const p = document.getElementById('phases');
CONFIG.phases.forEach((ph, i) => {
  p.innerHTML +=
    `<div class='phase'><h3>${ph.name} (${ph.weight}%)</h3>` +
    `AI <select id='a${i}'>${CONFIG.ai.map((v, j) => `<option value='${j}'>${v}</option>`).join('')}</select> ` +
    `Human <select id='r${i}'>${CONFIG.rw.map((v, j) => `<option value='${j}'>${v}</option>`).join('')}</select></div>`;
});

const STORE_KEY = 'aca_assessments';
let lastResult = null;

// ---- Per-task calculation: split the score into what AI PROVIDED vs what the human ACCEPTED ----
function calculate() {
  let provided = 0; // Σ weight × AI-offered         -> what AI put on the table
  let net = 0;      // Σ weight × AI-offered × kept   -> what survived human rework

  let rows = '<h2>Calculation Details</h2><table>' +
    '<tr><th>Phase</th><th>Weight</th><th>AI Provided</th><th>Human Kept</th><th>Net</th></tr>';

  CONFIG.phases.forEach((ph, i) => {
    const af = document.getElementById('a' + i).value / 4;         // AI level 0..1
    const rf = CONFIG.rwf[document.getElementById('r' + i).value]; // kept fraction 0..1
    const prov = ph.weight * af;
    const s = prov * rf;
    provided += prov;
    net += s;
    rows += `<tr><td>${ph.name}</td><td>${ph.weight}</td><td>${prov.toFixed(2)}</td>` +
            `<td>${(rf * 100).toFixed(0)}%</td><td>${s.toFixed(2)}</td></tr>`;
  });

  // AI Accept % = of everything AI offered, how much the developer kept.
  const accept = provided > 0 ? (net / provided) * 100 : null;
  rows += `<tr><th colspan='2'>Total</th><th>${provided.toFixed(2)}</th><th></th>` +
          `<th>${net.toFixed(2)}</th></tr></table>`;

  lastResult = { task: t.value, provided, net, accept: accept || 0 };

  document.getElementById('result').innerHTML =
    '<h2>Results</h2><div class="metrics">' +
      metricCard('AI Provided %', provided, 'How much AI offered across the workflow') +
      metricCard('AI Accept %', accept, 'Of what AI offered, how much you kept') +
      metricCard('Net AI Contribution %', net, "Provided × Accepted — AI's real share") +
    '</div><button onclick="saveAssessment()">Save assessment</button>';

  document.getElementById('details').innerHTML = rows;
}

function metricCard(label, value, help) {
  const shown = value === null ? '—' : value.toFixed(2) + '%';
  return `<div class='metric'><div class='metric-val'>${shown}</div>` +
         `<div class='metric-lbl'>${label}</div><div class='metric-help'>${help}</div></div>`;
}

// ---- Save assessments and aggregate Accept % across all of them ----
function loadAssessments() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch { return []; }
}

function saveAssessment() {
  if (!lastResult) return;
  const list = loadAssessments();
  list.push({ ...lastResult, at: new Date().toISOString() });
  localStorage.setItem(STORE_KEY, JSON.stringify(list));
  renderAggregate();
}

function clearAssessments() {
  if (confirm('Delete all saved assessments?')) {
    localStorage.removeItem(STORE_KEY);
    renderAggregate();
  }
}

function renderAggregate() {
  const list = loadAssessments();
  const box = document.getElementById('aggregate');
  if (!list.length) {
    box.innerHTML = '<h2>Saved Assessments</h2><p>No saved assessments yet.</p>';
    return;
  }

  const sumProvided = list.reduce((a, x) => a + x.provided, 0);
  const sumNet = list.reduce((a, x) => a + x.net, 0);
  // Volume-weighted Accept %: total kept ÷ total provided (correct way to combine rates).
  const aggAccept = sumProvided > 0 ? (sumNet / sumProvided) * 100 : null;
  const avgNet = sumNet / list.length;

  let html = `<h2>Saved Assessments (${list.length})</h2><div class='metrics'>` +
      metricCard('Overall AI Accept %', aggAccept, 'Total kept ÷ total provided, all tasks') +
      metricCard('Avg Net Contribution %', avgNet, 'Mean net AI contribution per task') +
    '</div><table><tr><th>#</th><th>Task</th><th>Provided</th><th>Accept</th><th>Net</th><th>When</th></tr>';

  list.forEach((x, i) => {
    html += `<tr><td>${i + 1}</td><td>${x.task}</td><td>${x.provided.toFixed(1)}</td>` +
            `<td>${x.accept.toFixed(1)}%</td><td>${x.net.toFixed(1)}</td>` +
            `<td>${new Date(x.at).toLocaleString()}</td></tr>`;
  });
  html += '</table><button onclick="clearAssessments()">Clear all</button>';
  box.innerHTML = html;
}

renderAggregate();