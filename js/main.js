// Current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('main-nav');

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});

// Close nav when a link is tapped on mobile
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', false);
    toggle.setAttribute('aria-label', 'Open navigation');
  });
});

// Submenu toggle (mobile)
document.querySelectorAll('.submenu-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.has-submenu');
    const open = item.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
});
