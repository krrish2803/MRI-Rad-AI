const input = document.querySelector('#scan-files');
const fileList = document.querySelector('#file-list');
const uploadsList = document.querySelector('#uploads-list');
const errorBox = document.querySelector('#error-message');
const uploadButton = document.querySelector('#upload-button');
const analyzeButton = document.querySelector('#analyze-button');
const resultCard = document.querySelector('#result-card');
const uploaded = new Map();
let currentAnalysisId = '';
let pollHandle;
let zonePollHandle;

const sequences = ['T2', 'DWI', 'ADC', 'OTHER'];
const escapeText = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

input.addEventListener('change', () => {
  fileList.replaceChildren();
  const files = [...input.files];
  files.forEach((file, index) => {
    const row = document.createElement('div');
    row.className = 'file-chip upload-row';
    const name = document.createElement('span');
    name.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`;
    const select = document.createElement('select');
    select.dataset.sequence = String(index);
    select.setAttribute('aria-label', `Sequence type for ${file.name}`);
    sequences.forEach((sequence) => {
      const option = document.createElement('option');
      option.value = sequence;
      option.textContent = sequence;
      select.append(option);
    });
    if (index < sequences.length) select.value = sequences[index];
    row.append(name, select);
    fileList.append(row);
  });
  uploadButton.disabled = files.length === 0 || files.length > 3;
  errorBox.textContent = files.length > 3 ? 'Upload up to three files per study.' : '';
});

uploadButton.addEventListener('click', async () => {
  errorBox.textContent = '';
  const files = [...input.files];
  if (!files.length || files.length > 3) return;
  const selected = files.map((file, index) => ({ file, sequence: fileList.querySelector(`[data-sequence="${index}"]`).value }));
  if (new Set(selected.map((item) => item.sequence)).size !== selected.length) {
    errorBox.textContent = 'Choose a different sequence type for each uploaded file.';
    return;
  }
  uploadButton.disabled = true;
  uploadButton.textContent = 'Uploading…';
  try {
    for (const item of selected) {
      const body = new FormData();
      body.append('file', item.file);
      body.append('sequence_type', item.sequence);
      const response = await fetch('/api/v1/uploads', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Upload failed.');
      uploaded.set(data.upload_id, data);
    }
    input.value = '';
    fileList.replaceChildren();
    renderUploads();
  } catch (error) {
    errorBox.textContent = error.message;
  } finally {
    uploadButton.textContent = 'Upload selected files →';
    uploadButton.disabled = input.files.length === 0;
  }
});

function renderUploads() {
  uploadsList.replaceChildren();
  if (!uploaded.size) {
    uploadsList.innerHTML = '<p class="muted">No files uploaded yet.</p>';
    analyzeButton.disabled = true;
    return;
  }
  for (const upload of uploaded.values()) {
    const row = document.createElement('label');
    row.className = 'file-chip ready-upload';
    row.innerHTML = `<span><input type="checkbox" value="${escapeText(upload.upload_id)}" checked /> <b>${escapeText(upload.sequence_type)}</b> · ${escapeText(upload.source_format.toUpperCase())} · ${upload.slice_count} slice${upload.slice_count === 1 ? '' : 's'} · ${upload.width}×${upload.height}</span><button type="button" data-remove="${escapeText(upload.upload_id)}" aria-label="Remove upload">Remove</button>`;
    uploadsList.append(row);
  }
  uploadsList.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => {
    uploaded.delete(button.dataset.remove);
    renderUploads();
  }));
  uploadsList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => checkbox.addEventListener('change', updateAnalyzeButton));
  updateAnalyzeButton();
}

function updateAnalyzeButton() {
  const selected = [...uploadsList.querySelectorAll('input[type="checkbox"]:checked')];
  const seqTypes = selected.map((item) => uploaded.get(item.value)?.sequence_type);
  analyzeButton.disabled = !selected.length || selected.length > 3 || new Set(seqTypes).size !== seqTypes.length;
}

analyzeButton.addEventListener('click', async () => {
  errorBox.textContent = '';
  const uploadIds = [...uploadsList.querySelectorAll('input[type="checkbox"]:checked')].map((item) => item.value);
  if (!uploadIds.length || uploadIds.length > 3) return;
  analyzeButton.disabled = true;
  analyzeButton.textContent = 'Creating analysis…';
  try {
    const response = await fetch('/api/v1/analyses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upload_ids: uploadIds }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Could not start analysis.');
    currentAnalysisId = data.analysis_id;
    resultCard.hidden = false;
    document.querySelector('#analysis-output').hidden = true;
    document.querySelector('#progress-message').textContent = `Reviewing ${data.selected_images} selected images…`;
    showStatus(data.status);
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    clearInterval(pollHandle);
    pollHandle = setInterval(readAnalysis, 2000);
    await readAnalysis();
  } catch (error) {
    errorBox.textContent = error.message;
  } finally {
    analyzeButton.innerHTML = 'Start image-quality review <span>→</span>';
    updateAnalyzeButton();
  }
});

function showStatus(status) {
  const title = document.querySelector('#analysis-status');
  const pill = document.querySelector('#status-pill');
  title.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  pill.textContent = status.toUpperCase();
  pill.classList.toggle('failed', status === 'failed');
}

async function readAnalysis() {
  if (!currentAnalysisId) return;
  try {
    const response = await fetch(`/api/v1/analyses/${currentAnalysisId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Unable to read analysis status.');
    showStatus(data.status);
    if (data.status === 'completed') {
      clearInterval(pollHandle);
      renderAnalysis(data);
    } else if (data.status === 'failed') {
      clearInterval(pollHandle);
      document.querySelector('#progress-message').textContent = data.error_message || 'Analysis failed. Upload the files again to retry.';
    }
  } catch (error) {
    clearInterval(pollHandle);
    document.querySelector('#progress-message').textContent = error.message;
  }
}

function renderAnalysis(data) {
  const output = document.querySelector('#analysis-output');
  const result = data.result;
  document.querySelector('#progress-message').textContent = data.disclaimer;
  document.querySelector('#analysis-summary').textContent = result.summary;
  const quality = document.querySelector('#image-quality');
  quality.innerHTML = `<p><b>Image quality:</b> ${escapeText(result.image_quality.rating)}</p><ul>${result.image_quality.limitations.map((item) => `<li>${escapeText(item)}</li>`).join('')}</ul>`;
  const sliceSelect = document.querySelector('#slice-select');
  sliceSelect.replaceChildren();
  data.selected_slices.forEach((slice, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.dataset.url = slice.preview_url;
    option.textContent = `${slice.sequence_type} · slice ${slice.slice_index}`;
    sliceSelect.append(option);
  });
  function showSlice() {
    const option = sliceSelect.selectedOptions[0];
    document.querySelector('#slice-preview').src = option?.dataset.url || '';
  }
  sliceSelect.onchange = showSlice;
  showSlice();
  document.querySelector('#observation-list').innerHTML = `<h3>Technical observations</h3>${result.image_observations.map((item) => `<article class="observation"><b>${escapeText(item.sequence_type)} · slice ${item.slice_index}</b><p>${escapeText(item.technical_observation)}</p></article>`).join('')}`;
  document.querySelector('#usage-foot').textContent = `Model: ${data.model} · Input tokens: ${data.usage.input_tokens ?? '—'} · Output tokens: ${data.usage.output_tokens ?? '—'} · Cost: ${data.usage.cost_usd == null ? 'not configured' : `$${data.usage.cost_usd}`} · ${data.processing_ms ?? '—'} ms`;
  output.hidden = false;
  loadHistory();
}

document.querySelector('#feedback-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = document.querySelector('#feedback-message');
  const payload = {
    feedback_type: document.querySelector('#feedback-type').value,
    zone_name: document.querySelector('#zone-name').value || null,
    notes: document.querySelector('#feedback-note').value,
  };
  message.textContent = 'Saving…';
  try {
    const response = await fetch(`/api/v1/analyses/${currentAnalysisId}/feedback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Could not save feedback.');
    message.textContent = 'Research feedback saved.';
  } catch (error) { message.textContent = error.message; }
});

async function loadHistory() {
  const history = document.querySelector('#history-list');
  try {
    const response = await fetch('/api/v1/analyses?limit=10');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Unable to load history.');
    if (!data.items.length) { history.textContent = 'No analyses yet.'; return; }
    history.innerHTML = data.items.map((item) => `<article class="history-row"><span>${new Date(item.created_at).toLocaleString()}</span><b>${escapeText(item.status)}</b><button type="button" data-open="${escapeText(item.analysis_id)}">Open</button></article>`).join('');
    history.querySelectorAll('[data-open]').forEach((button) => button.addEventListener('click', async () => {
      currentAnalysisId = button.dataset.open;
      resultCard.hidden = false;
      document.querySelector('#analysis-output').hidden = true;
      await readAnalysis();
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  } catch (error) { history.textContent = error.message; }
}

document.querySelector('#zone-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = document.querySelector('#zone-status');
  const maskLink = document.querySelector('#zone-mask-link');
  maskLink.hidden = true;
  status.textContent = 'Uploading paired volumes…';
  const body = new FormData();
  body.append('t2_file', document.querySelector('#zone-t2').files[0]);
  body.append('adc_file', document.querySelector('#zone-adc').files[0]);
  try {
    const response = await fetch('/api/v1/zone-segmentations', { method: 'POST', body });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Could not start segmentation.');
    const segmentationId = data.segmentation_id;
    status.textContent = 'nnU-Net zone segmentation is processing…';
    clearInterval(zonePollHandle);
    zonePollHandle = setInterval(async () => {
      try {
        const pollResponse = await fetch(`/api/v1/zone-segmentations/${segmentationId}`);
        const poll = await pollResponse.json();
        if (!pollResponse.ok) throw new Error(poll.error?.message || 'Could not read segmentation status.');
        if (poll.status === 'completed') {
          clearInterval(zonePollHandle);
          status.textContent = 'PZ/TZ anatomy mask ready. This mask does not mark cancer lesions.';
          maskLink.href = poll.mask_url;
          maskLink.hidden = false;
        } else if (poll.status === 'failed') {
          clearInterval(zonePollHandle);
          status.textContent = poll.error_message || 'Zone segmentation failed.';
        }
      } catch (error) {
        clearInterval(zonePollHandle);
        status.textContent = error.message;
      }
    }, 2500);
  } catch (error) { status.textContent = error.message; }
});

loadHistory();
