const fallback = {
  system: { api: 'offline', database: 'unknown', image_quality_model: 'unknown', zone_model: 'unknown' },
  dataset: { training_cases: 32, challenge_cases: 16 },
  baseline: {
    dice: { pz: 0.485, tz: 0.714, mean: 0.599 },
    history: [
      { epoch: 1, pz: 0.312, tz: 0.526, mean: 0.419 },
      { epoch: 2, pz: 0.070, tz: 0.346, mean: 0.208 },
      { epoch: 3, pz: 0.274, tz: 0.499, mean: 0.387 },
      { epoch: 4, pz: 0.360, tz: 0.561, mean: 0.460 },
      { epoch: 5, pz: 0.353, tz: 0.639, mean: 0.496 },
      { epoch: 6, pz: 0.441, tz: 0.625, mean: 0.533 },
      { epoch: 7, pz: 0.407, tz: 0.683, mean: 0.545 },
      { epoch: 8, pz: 0.485, tz: 0.714, mean: 0.599 },
    ],
  },
  activity: {},
};

const statusLabels = {
  ok: ['Ready', 'ready'],
  configured: ['Configured', 'ready'],
  not_configured: ['Not configured', 'warning'],
  predictor_not_installed: ['Predictor missing', 'error'],
  results_path_missing: ['Results path missing', 'error'],
  trained_model_missing: ['Model not trained', 'warning'],
  fold_checkpoints_missing: ['Fold checkpoints missing', 'warning'],
  unknown: ['Unavailable', 'error'],
  offline: ['Offline', 'error'],
  error: ['Unavailable', 'error'],
};

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function updateService(key, rawStatus, note) {
  const status = rawStatus || 'unknown';
  const [label, tone] = statusLabels[status] || [status.replaceAll('_', ' '), 'warning'];
  const card = document.querySelector(`[data-service-card="${key}"]`);
  const strong = document.getElementById(`service-${key.replaceAll('_', '-')}`);
  const noteNode = document.getElementById(`service-${key.replaceAll('_', '-')}-note`);
  if (strong) strong.textContent = label;
  if (note && noteNode) noteNode.textContent = note;
  if (card) {
    card.classList.remove('is-ready', 'is-warning', 'is-error');
    card.classList.add(`is-${tone}`);
  }
}

function renderTrainingChart(history) {
  const svg = document.getElementById('training-chart');
  if (!svg || !Array.isArray(history) || history.length === 0) return;
  const width = 720;
  const height = 290;
  const left = 44;
  const right = 14;
  const top = 14;
  const bottom = 34;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxY = 0.8;
  const x = (index) => left + (history.length === 1 ? 0 : (index / (history.length - 1)) * plotWidth);
  const y = (value) => top + plotHeight - (Number(value) / maxY) * plotHeight;
  const lines = [
    { key: 'pz', line: 'line-pz', point: 'point-pz' },
    { key: 'tz', line: 'line-tz', point: 'point-tz' },
    { key: 'mean', line: 'line-mean', point: 'point-mean' },
  ];
  const grid = [0, 0.2, 0.4, 0.6, 0.8].map((value) => {
    const py = y(value);
    return `<line class="chart-grid-line" x1="${left}" y1="${py}" x2="${width - right}" y2="${py}" /><text class="chart-axis-text" x="${left - 10}" y="${py + 3}" text-anchor="end">${value.toFixed(1)}</text>`;
  }).join('');
  const epochLabels = history.map((point, index) => `<text class="chart-axis-text" x="${x(index)}" y="${height - 9}" text-anchor="middle">${point.epoch}</text>`).join('');
  const series = lines.map(({ key, line, point }) => {
    const points = history.map((item, index) => `${x(index)},${y(item[key])}`).join(' ');
    const circles = history.map((item, index) => `<circle class="chart-point ${point}" cx="${x(index)}" cy="${y(item[key])}" r="3.5"><title>Epoch ${item.epoch}: ${key.toUpperCase()} Dice ${Number(item[key]).toFixed(3)}</title></circle>`).join('');
    return `<polyline class="chart-line ${line}" points="${points}" />${circles}`;
  }).join('');
  svg.innerHTML = `${grid}${epochLabels}<text class="chart-axis-text" x="${left}" y="${height - 9}" text-anchor="start">EPOCH</text>${series}`;
}

function renderStats(data, connected) {
  const system = data.system || fallback.system;
  const dataset = data.dataset || fallback.dataset;
  const baseline = data.baseline || fallback.baseline;
  const activity = data.activity || {};
  updateService('api', connected ? 'ok' : 'offline', connected ? 'Dashboard endpoint responding' : 'Start the FastAPI backend');
  updateService('database', system.database || 'unknown', system.database === 'ok' ? 'Counts are live' : 'Activity counts need MongoDB');
  updateService('image_quality_model', system.image_quality_model || 'unknown', 'NVIDIA vision service');
  updateService('zone_model', system.zone_model || 'unknown', 'nnU-Net v2 · 5 folds');

  const connection = document.getElementById('connection-label');
  if (connection) {
    connection.classList.toggle('is-ready', connected && system.database === 'ok');
    connection.classList.toggle('is-error', !connected || system.database !== 'ok');
    connection.innerHTML = `<i></i> ${connected ? (system.database === 'ok' ? 'Backend connected' : 'Backend connected · database unavailable') : 'Backend unavailable'}`;
  }

  setText('training-cases', dataset.training_cases ?? 32);
  setText('challenge-cases', dataset.challenge_cases ?? 16);
  setText('mean-dice', Number(baseline.dice?.mean ?? 0.599).toFixed(3));
  setText('baseline-mean-score', Number(baseline.dice?.mean ?? 0.599).toFixed(3));
  setText('pz-dice', Number(baseline.dice?.pz ?? 0.485).toFixed(3));
  setText('tz-dice', Number(baseline.dice?.tz ?? 0.714).toFixed(3));
  setText('completed-reviews', activity.completed_image_reviews == null ? '—' : activity.completed_image_reviews);
  setText('completed-zone-jobs', `Zone jobs: ${activity.completed_zone_jobs == null ? '—' : activity.completed_zone_jobs}`);
  setText('review-count-note', system.database === 'ok' ? `${activity.image_reviews ?? 0} total image reviews` : 'Connect database for live counts');
  renderTrainingChart(baseline.history || fallback.baseline.history);

  const generatedAt = data.generated_at ? new Date(data.generated_at) : new Date();
  setText('last-updated', `Updated ${generatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
}

async function refreshDashboard() {
  const button = document.getElementById('refresh-dashboard');
  if (button) button.disabled = true;
  try {
    const response = await fetch('/api/v1/dashboard/stats', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Dashboard API returned ${response.status}`);
    renderStats(await response.json(), true);
  } catch {
    renderStats(fallback, false);
    setText('last-updated', 'Showing saved research baseline');
  } finally {
    if (button) button.disabled = false;
  }
}

document.getElementById('refresh-dashboard')?.addEventListener('click', refreshDashboard);
void refreshDashboard();
window.setInterval(refreshDashboard, 30000);
