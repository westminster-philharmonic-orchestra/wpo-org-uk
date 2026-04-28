// Current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('main-nav');
const subNavBar = document.querySelector('.header-subnav-bar');

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  subNavBar.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});

function closeNav() {
  nav.classList.remove('open');
  subNavBar.classList.remove('open');
  toggle.setAttribute('aria-expanded', false);
  toggle.setAttribute('aria-label', 'Open navigation');
}

nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
subNavBar.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
