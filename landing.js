const dialog = document.querySelector('.demo-dialog');
const closeButton = document.querySelector('.dialog-close');
const menuButton = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

document.querySelectorAll('[data-demo]').forEach((button) => {
  button.addEventListener('click', () => dialog.showModal());
});

function closeDialog() {
  dialog.close();
}

closeButton.addEventListener('click', closeDialog);
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) closeDialog();
});

menuButton.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.textContent = isOpen ? '×' : '☰';
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.textContent = '☰';
  });
});

// A restrained motion cue in the illustrative scan panel.
const sliceCounter = document.querySelector('#slice-count');
let currentSlice = 14;
window.setInterval(() => {
  currentSlice = currentSlice >= 28 ? 1 : currentSlice + 1;
  sliceCounter.textContent = `${String(currentSlice).padStart(2, '0')} / 28`;
}, 1800);

document.querySelectorAll('.faq-list details').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.faq-list details').forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

const landingStatus = document.querySelector('#landing-live-status');
const landingStatusRow = landingStatus?.closest('.snapshot-status');
if (landingStatus) {
  fetch('/api/v1/dashboard/stats', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error('Backend unavailable');
      return response.json();
    })
    .then((stats) => {
      const trainingCases = document.querySelector('#landing-training-cases');
      const meanDice = document.querySelector('#landing-baseline-dice');
      if (trainingCases) trainingCases.textContent = String(stats.dataset?.training_cases ?? 32);
      if (meanDice) meanDice.textContent = Number(stats.baseline?.dice?.mean ?? 0.599).toFixed(3);
      const dbReady = stats.system?.database === 'ok';
      landingStatus.textContent = dbReady
        ? 'Backend and database connected'
        : 'Backend connected · database unavailable';
      landingStatusRow?.classList.add(dbReady ? 'is-ready' : 'is-error');
    })
    .catch(() => {
      landingStatus.textContent = 'Backend unavailable · research baseline is shown';
      landingStatusRow?.classList.add('is-error');
    });
}
