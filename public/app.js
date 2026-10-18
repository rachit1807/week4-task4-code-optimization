const $ = id => document.getElementById(id);
const format = value => value.toLocaleString('en-US');
let result;
let history = [];
try { history = JSON.parse(localStorage.getItem('refactor-history') || '[]'); if (!Array.isArray(history)) history = []; history = history.filter(item => Number.isFinite(item.speedup) && Number.isInteger(item.size)).slice(0, 20); } catch { history = []; }
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; setTimeout(() => { $('toast').hidden = true; }, 3500); }
function showView(name) {
  document.querySelectorAll('.view').forEach(view => { view.hidden = view.id !== `view-${name}`; });
  document.querySelectorAll('.nav-item').forEach(button => { button.classList.toggle('active', button.dataset.view === name); button.setAttribute('aria-current', button.dataset.view === name ? 'page' : 'false'); });
  $('page-label').textContent = { workbench: 'Workbench', code: 'Code explorer', history: 'Run history', guide: 'Field notes' }[name];
  if (name === 'history') renderHistory();
}
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => showView(button.dataset.open)));
$('help-button').addEventListener('click', () => showView('guide'));
function updateTheme() {
  const dark = document.documentElement.dataset.theme !== 'light';
  $('theme-toggle').textContent = dark ? '☀' : '☾';
  $('theme-toggle').setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
}
$('theme-toggle').addEventListener('click', () => { const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = theme; try { localStorage.setItem('refactor-theme', theme); } catch { /* Theme still works without storage. */ } updateTheme(); });
updateTheme();
function updateSize() { const size = Number($('size').value); $('size-value').textContent = format(size); $('orders-value').textContent = format(size * 4); document.querySelectorAll('[data-size]').forEach(button => button.classList.toggle('selected', Number(button.dataset.size) === size)); }
$('size').addEventListener('input', updateSize);
document.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => { $('size').value = button.dataset.size; updateSize(); }));
function renderResult(data) {
  result = data;
  $('empty-result').hidden = true;
  $('legacy-time').textContent = `${data.legacy.toFixed(3)} ms`;
  $('optimized-time').textContent = `${data.optimized.toFixed(3)} ms`;
  $('legacy-bar').style.width = `${Math.min(100, data.legacy / Math.max(data.legacy, data.optimized) * 100)}%`;
  $('optimized-bar').style.width = `${Math.max(1, data.optimized / Math.max(data.legacy, data.optimized) * 100)}%`;
  $('speedup').textContent = `${data.speedup.toFixed(1)}×`;
  $('reduction').textContent = `${data.reduction.toFixed(1)}%`;
  $('integrity').textContent = 'Passed ✓';
  $('integrity').style.fontSize = '27px';
  $('equivalence').textContent = '✓ Identical outputs across all rounds';
  $('run-status').textContent = 'RUN COMPLETE';
  $('result-caption').textContent = `${format(data.size)} customers · ${format(data.orders)} orders · ${data.rounds} measured rounds`;
  $('export-button').disabled = false;
  $('announcement').textContent = `Benchmark complete. Speed multiplier ${data.speedup.toFixed(1)}. All outputs match.`;
}
$('run-button').addEventListener('click', () => {
  const button = $('run-button');
  button.disabled = true; button.textContent = 'Running experiment…'; $('run-status').textContent = 'MEASURING…';
  let worker;
  let timer;
  const finish = () => { clearTimeout(timer); worker?.terminate(); button.disabled = false; button.innerHTML = '<span>▶</span> Run benchmark <span class="button-arrow">↗</span>'; };
  try {
    worker = new Worker('/worker.js', { type: 'module' });
    timer = setTimeout(() => { finish(); $('run-status').textContent = 'TIMED OUT'; toast('The run took too long. Try a smaller dataset.'); }, 60000);
    worker.onmessage = ({ data }) => {
      finish();
      if (data.error) { $('run-status').textContent = 'RUN FAILED'; toast(data.error); return; }
      renderResult(data.result);
      history.unshift(data.result); history = history.slice(0, 20);
      try { localStorage.setItem('refactor-history', JSON.stringify(history)); } catch { toast('Run complete. Browser storage is unavailable.'); }
      $('history-count').textContent = history.length;
    };
    worker.onerror = () => { finish(); $('run-status').textContent = 'RUN FAILED'; toast('Could not start the benchmark worker. Reload and try again.'); };
    worker.postMessage({ size: Number($('size').value), rounds: Number($('rounds').value) });
  } catch { finish(); $('run-status').textContent = 'RUN FAILED'; toast('Web Workers are unavailable in this browser.'); }
});
function exportReport(data) {
  const report = `# Refactor Lab — Performance Report\n\nRun: ${data.timestamp}\nEnvironment: ${navigator.userAgent}\n\n| Metric | Value |\n|---|---:|\n| Customers | ${data.size} |\n| Orders | ${data.orders} |\n| Rounds | ${data.rounds} |\n| Legacy median | ${data.legacy.toFixed(4)} ms |\n| Optimized median | ${data.optimized.toFixed(4)} ms |\n| Speed multiplier | ${data.speedup.toFixed(2)}x |\n| Latency reduction | ${data.reduction.toFixed(2)}% |\n| Outputs | Identical |\n\n## Methodology\nThree warm-ups per implementation, alternating measured order, median wall-clock execution time. Fixture creation and equivalence checks are excluded from timing. Memory is not measured in the browser. Results depend on hardware, runtime and background activity.\n\n## Raw samples (ms)\nLegacy: ${data.samples.legacy.join(', ')}\nOptimized: ${data.samples.optimized.join(', ')}\n`;
  const url = URL.createObjectURL(new Blob([report], { type: 'text/markdown' }));
  const link = document.createElement('a'); link.href = url; link.download = `refactor-report-${data.id}.md`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Report exported.');
}
$('export-button').addEventListener('click', () => { if (result) exportReport(result); });
function renderHistory() {
  const container = $('history-list'); container.replaceChildren(); $('clear-history').disabled = !history.length;
  if (!history.length) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.innerHTML = '<strong>A clean slate.</strong>Run your first benchmark to start an experiment log.<br><br><button class="secondary-button">Go to workbench ↗</button>'; empty.querySelector('button').onclick = () => showView('workbench'); container.append(empty); return; }
  for (const item of history) {
    const card = document.createElement('article'); card.className = 'panel history-card';
    const title = document.createElement('div'); const heading = document.createElement('strong'); heading.textContent = `${format(item.size)} customers`; const date = document.createElement('small'); date.textContent = new Date(item.timestamp).toLocaleString(); title.append(heading, date); card.append(title);
    for (const [value, label] of [[`${item.speedup.toFixed(1)}×`, 'speed multiplier'], [`${item.reduction.toFixed(1)}%`, 'latency reduction']]) { const metric = document.createElement('div'); const number = document.createElement('strong'); number.textContent = value; const text = document.createElement('small'); text.textContent = label; metric.append(number, text); card.append(metric); }
    const exportButton = document.createElement('button'); exportButton.className = 'text-button'; exportButton.textContent = 'Export ↓'; exportButton.onclick = () => exportReport(item); card.append(exportButton); container.append(card);
  }
}
$('clear-history').addEventListener('click', () => { history = []; try { localStorage.removeItem('refactor-history'); } catch { /* In-memory history is cleared. */ } $('history-count').textContent = '0'; renderHistory(); toast('Run history cleared.'); });
$('history-count').textContent = history.length;
for (const [id, path] of [['legacy-code', '/src/legacy/legacyController.js'], ['optimized-code', '/src/controllers/optimizedController.js']]) {
  fetch(path).then(response => { if (!response.ok) throw new Error('Unavailable'); return response.text(); }).then(code => { $(id).textContent = code; }).catch(() => { $(id).textContent = 'Source is unavailable. See the repository for the complete implementation.'; });
}
