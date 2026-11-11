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
