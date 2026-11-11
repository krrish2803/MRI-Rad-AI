const form = document.querySelector('#analysis-form');
const input = document.querySelector('#scan-files');
const list = document.querySelector('#file-list');
const errorBox = document.querySelector('#error-message');
const resultCard = document.querySelector('#result-card');
const statusTitle = document.querySelector('#analysis-status');
const statusPill = document.querySelector('#status-pill');
const resultText = document.querySelector('#analysis-result');
const feedbackBox = document.querySelector('#feedback-box');
let currentId = '';
let pollTimer;

input.addEventListener('change', () => {
  list.replaceChildren();
  [...input.files].forEach((file) => {
    const row = document.createElement('div');
    row.className = 'file-chip';
    const name = document.createElement('span');
    name.textContent = file.name;
    const size = document.createElement('span');
    size.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    row.append(name, size);
    list.append(row);
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';
  if (!input.files.length || input.files.length > 3) {
    errorBox.textContent = 'Choose between one and three images.';
    return;
  }
  const body = new FormData();
  [...input.files].forEach((file, i) => {
    body.append('files', file);
    body.append('sequence_types', ['T2', 'DWI', 'ADC'][i] || 'OTHER');
  });
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'Uploading images…';
  try {
    const response = await fetch('/api/analyses', { method: 'POST', body });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Upload failed. Is the API running?');
    currentId = data.analysis_id;
    resultCard.hidden = false;
    feedbackBox.hidden = true;
    resultText.textContent = 'Waiting for the NVIDIA API…';
    showStatus('queued');
    clearInterval(pollTimer);
    pollTimer = setInterval(readStatus, 1800);
    await readStatus();
  } catch (error) {
    errorBox.textContent = error.message;
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Start research analysis <span>→</span>';
  }
});

function showStatus(status) {
  const label = status.toUpperCase();
  statusTitle.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  statusPill.textContent = label;
  statusPill.classList.toggle('failed', status === 'failed');
}

async function readStatus() {
  if (!currentId) return;
  try {
    const response = await fetch(`/api/analyses/${currentId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Unable to load status.');
    showStatus(data.status);
    if (data.status === 'completed') {
      resultText.textContent = typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2);
      feedbackBox.hidden = false;
      clearInterval(pollTimer);
    } else if (data.status === 'failed') {
      resultText.textContent = data.error || 'The analysis failed.';
      clearInterval(pollTimer);
    }
  } catch (error) {
    resultText.textContent = error.message;
    clearInterval(pollTimer);
  }
}

document.querySelectorAll('[data-feedback]').forEach((button) => {
  button.addEventListener('click', async () => {
    const message = document.querySelector('#feedback-message');
    message.textContent = 'Saving…';
    try {
      const response = await fetch(`/api/analyses/${currentId}/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: button.dataset.feedback, note: document.querySelector('#feedback-note').value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Could not save feedback.');
      message.textContent = 'Research feedback saved.';
    } catch (error) { message.textContent = error.message; }
  });
});
