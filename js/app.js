/* ===== APP.JS ===== */
'use strict';

let currentLang = 'fr';

/* ===== I18N ===== */
function applyLang(code) {
  const t = window.LANGS[code];
  if (!t) return;
  currentLang = code;
  document.documentElement.setAttribute('dir', t.dir);
  document.documentElement.setAttribute('lang', t.htmlLang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.innerHTML = t[key];
  });
  const flagEl = document.getElementById('currentFlag');
  const labelEl = document.getElementById('currentLangLabel');
  if (flagEl)  flagEl.textContent  = t.flag;
  if (labelEl) labelEl.textContent = t.label;
  document.querySelectorAll('.lang-option').forEach(o =>
    o.classList.toggle('active', o.dataset.lang === code)
  );
  document.querySelectorAll('.skill-fill').forEach(f =>
    f.style.transformOrigin = t.dir === 'rtl' ? 'right' : 'left'
  );
  const sendBtn = document.querySelector('[data-i18n="ct_form_send"]');
  if (sendBtn && t.ct_form_send) sendBtn.textContent = t.ct_form_send;
  localStorage.setItem('lang', code);
}

/* ===== LANG DROPDOWN ===== */
const dd = document.getElementById('langDropdown');
const langBtnEl = document.getElementById('langBtn');
if (langBtnEl) langBtnEl.addEventListener('click', () => dd && dd.classList.toggle('open'));
document.addEventListener('click', e => { if (dd && !dd.contains(e.target)) dd.classList.remove('open'); });
document.querySelectorAll('.lang-option').forEach(o =>
  o.addEventListener('click', () => { applyLang(o.dataset.lang); dd && dd.classList.remove('open'); })
);

/* ===== HAMBURGER ===== */
const navDrawer   = document.getElementById('navDrawer');
const hamburgerEl = document.getElementById('hamburger');
const drawerClose = document.getElementById('drawerClose');

function closeDrawer() {
  navDrawer   && navDrawer.classList.remove('open');
  hamburgerEl && hamburgerEl.classList.remove('open');
  document.body.style.overflow = '';
}
window.closeDrawer = closeDrawer;

if (hamburgerEl) {
  hamburgerEl.addEventListener('click', () => {
    const open = navDrawer && navDrawer.classList.contains('open');
    open ? closeDrawer() : (navDrawer && navDrawer.classList.add('open'), hamburgerEl.classList.add('open'), document.body.style.overflow = 'hidden');
  });
}
drawerClose && drawerClose.addEventListener('click', closeDrawer);
navDrawer   && navDrawer.addEventListener('click', e => { if (e.target === navDrawer) closeDrawer(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

/* ===== THEME TOGGLE ===== */
const themeToggleEl = document.getElementById('themeToggle');
if (themeToggleEl) {
  themeToggleEl.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
  document.documentElement.setAttribute('data-theme', 'light');
}

/* ===== SCROLL PROGRESS BAR ===== */
const progressBar = document.getElementById('scrollProgress');
if (progressBar) {
  window.addEventListener('scroll', () => {
    const h   = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = h > 0 ? (window.scrollY / h * 100) + '%' : '0%';
  }, { passive: true });
}

/* ===== BACK TO TOP ===== */
const backTopBtn = document.getElementById('backTop');
if (backTopBtn) {
  window.addEventListener('scroll', () =>
    backTopBtn.classList.toggle('visible', window.scrollY > 400),
    { passive: true }
  );
  backTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ===== SCROLL ANIMATIONS ===== */
const obs = new IntersectionObserver(
  entries => entries.forEach(x => { if (x.isIntersecting) x.target.classList.add('visible'); }),
  { threshold: 0.1 }
);
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));

/* ===== SKILL BARS ===== */
const skillObs = new IntersectionObserver(entries => {
  entries.forEach(x => {
    if (!x.isIntersecting) return;
    x.target.querySelectorAll('.skill-fill').forEach((f, i) => {
      const w = parseFloat(f.dataset.w) || 0.8;
      f.style.transformOrigin = (document.documentElement.getAttribute('dir') || 'ltr') === 'rtl' ? 'right' : 'left';
      setTimeout(() => { f.style.transform = 'scaleX(' + w + ')'; }, i * 75);
    });
  });
}, { threshold: 0.3 });
document.querySelectorAll('.skill-group').forEach(g => skillObs.observe(g));

/* ===== CONTACT FORM (mailto fallback) ===== */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const t       = window.LANGS[currentLang] || window.LANGS.fr;
    const name    = (document.getElementById('formName')    || {}).value || '';
    const email   = (document.getElementById('formEmail')   || {}).value || '';
    const subject = (document.getElementById('formSubject') || {}).value || '';
    const msg     = (document.getElementById('formMsg')     || {}).value || '';
    const budget  = (document.getElementById('formBudget')  || {}).value || '';
    const body    = 'De: ' + name + ' (' + email + ')\nBudget: ' + budget + '\n\n' + msg;
    window.location.href = 'mailto:mouhamethkonate0@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    const ok = document.getElementById('formSuccess');
    if (ok) { ok.textContent = t.ct_form_success || 'Message envoyé !'; ok.style.display = 'block'; setTimeout(() => { ok.style.display = 'none'; }, 5000); }
    contactForm.reset();
  });
}

/* ===== QR CODE — fichier img/qr-contact.png (pré-généré, scannable) ===== */
function initQR() {
  const frame = document.querySelector('.qr-frame');
  if (!frame) return;
  const img   = document.createElement('img');
  img.alt     = 'QR Code — Mouhameth Konaté';
  img.style.cssText = 'width:140px;height:140px;display:block;image-rendering:pixelated;border-radius:2px;';
  /* Essayer img/qr-contact.png d'abord, sinon data URI embarquée */
  img.src = 'img/qr-contact.png';
  img.onerror = () => {
    if (window.QR_FALLBACK_URI) {
      img.src = window.QR_FALLBACK_URI;
      img.onerror = () => { frame.innerHTML = '<p style="font-size:0.7rem;color:var(--accent2);padding:0.5rem;text-align:center">+221 78 523 79 67</p>'; };
    } else {
      frame.innerHTML = '<p style="font-size:0.7rem;color:var(--accent2);padding:0.5rem;text-align:center">+221 78 523 79 67</p>';
    }
  };
  frame.innerHTML = '';
  frame.appendChild(img);
  const dlBtn = document.getElementById('qrDownload');
  if (dlBtn) {
    dlBtn.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = window.QR_FALLBACK_URI || img.src;
      a.download = 'contact-mouhameth-konate.png';
      a.click();
    });
  }
}
initQR();

/* ===== RESTORE LANGUAGE ===== */
const savedLang = localStorage.getItem('lang');
applyLang((savedLang && window.LANGS && window.LANGS[savedLang]) ? savedLang : 'fr');
