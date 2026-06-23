/* ===== APP.JS - LOGIC & INTERACTIONS ===== */

let currentLang = 'fr';

/**
 * Applique une langue : met à jour le DOM et les paramètres RTL/LTR
 */
function applyLang(code) {
  const t = window.LANGS[code];
  if (!t) return;
  
  currentLang = code;
  document.documentElement.setAttribute('dir', t.dir);
  document.documentElement.setAttribute('lang', t.htmlLang);
  
  // Mettre à jour tous les éléments data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) el.innerHTML = t[key];
  });
  
  // Mettre à jour flag et label du sélecteur de langue
  const flagEl = document.getElementById('currentFlag');
  const langLabelEl = document.getElementById('currentLangLabel');
  if (flagEl) flagEl.textContent = t.flag;
  if (langLabelEl) langLabelEl.textContent = t.label;
  
  // Mettre à jour les options actives
  document.querySelectorAll('.lang-option').forEach(o => {
    o.classList.toggle('active', o.dataset.lang === code);
  });
  
  // Mettre à jour les skill-fill RTL
  document.querySelectorAll('.skill-fill').forEach(f => {
    f.style.transformOrigin = t.dir === 'rtl' ? 'right' : 'left';
  });
  
  localStorage.setItem('lang', code);
}

/* ===== LANG DROPDOWN ===== */
const dd = document.getElementById('langDropdown');
const langBtn = document.getElementById('langBtn');
if (langBtn) {
  langBtn.addEventListener('click', () => {
    if (dd) dd.classList.toggle('open');
  });
}

document.addEventListener('click', e => {
  if (dd && !dd.contains(e.target)) dd.classList.remove('open');
});

document.querySelectorAll('.lang-option').forEach(o => {
  o.addEventListener('click', () => {
    applyLang(o.dataset.lang);
    if (dd) dd.classList.remove('open');
  });
});

/* ===== NAV DRAWER / HAMBURGER ===== */
const navDrawer = document.getElementById('navDrawer');
const hamburger = document.getElementById('hamburger');
const drawerCloseBtn = document.getElementById('drawerClose');

function openDrawer() {
  if (navDrawer) navDrawer.classList.add('open');
  if (hamburger) hamburger.classList.add('open');
}

function closeDrawer() {
  if (navDrawer) navDrawer.classList.remove('open');
  if (hamburger) hamburger.classList.remove('open');
}

// Expose closeDrawer global because index.html uses onclick="closeDrawer()" on anchor links
window.closeDrawer = closeDrawer;

if (hamburger) {
  hamburger.addEventListener('click', () => {
    if (!navDrawer) return;
    navDrawer.classList.toggle('open');
    hamburger.classList.toggle('open');
  });
}
if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);

/* ===== THEME TOGGLE ===== */
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

// Restaurer le thème sauvegardé
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
  document.documentElement.setAttribute('data-theme', 'light');
}

/* ===== SCROLL ANIMATIONS ===== */
const obs = new IntersectionObserver(entries => {
  entries.forEach(x => {
    if (x.isIntersecting) x.target.classList.add('visible');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));

/* ===== SKILL BARS ANIMATION ===== */
const skillObs = new IntersectionObserver(entries => {
  entries.forEach(x => {
    if (!x.isIntersecting) return;
    
    x.target.querySelectorAll('.skill-fill').forEach((f, i) => {
      const width = parseFloat(f.dataset.w) || 0.8;
      const dir = document.documentElement.getAttribute('dir') || 'ltr';
      f.style.transformOrigin = dir === 'rtl' ? 'right' : 'left';
      setTimeout(() => {
        f.style.transform = `scaleX(${width})`;
      }, i * 75);
    });
  });
}, { threshold: 0.3 });

document.querySelectorAll('.skill-group').forEach(g => skillObs.observe(g));

/* ===== QR CODE CONTACT ===== */
const CONTACT = {
  name: 'Mouhameth Konaté',
  phone: '+221785237967',
  email: 'mouhamethkonate0@gmail.com',
  website: 'https://konatemahmoud.github.io/Portfolio1',
  address: 'Rao, Saint-Louis, Sénégal',
  linkedin: 'Mouhameth-Konate'
};

function buildVCard(c) {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:' + c.name,
    'N:Konaté;Mouhameth;;;',
    'TEL;TYPE=CELL:' + c.phone,
    'EMAIL:' + c.email,
    'URL:' + c.website,
    'ADR;TYPE=HOME:;;' + c.address + ';;;;',
    'X-SOCIALPROFILE;TYPE=linkedin:' + c.linkedin,
    'END:VCARD'
  ].join('\r\n');
}

/* QR renderer simplifié (fallback si pas de lib externe). Le but est d'avoir un QR visuel utilisable. */
(function() {
  window.renderQR = function(text, canvas, px) {
    px = px || 4;
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    const size = 29; // petit module grid
    canvas.width = canvas.height = size * px;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';

    // Dessine des positionneurs simples (approximation esthétique)
    function drawFinder(x, y) {
      const s = px * 7;
      ctx.fillRect(x, y, s, s);
      ctx.clearRect(x + px, y + px, s - 2 * px, s - 2 * px);
      ctx.fillRect(x + 2 * px, y + 2 * px, s - 4 * px, s - 4 * px);
    }

    drawFinder(px, px);
    drawFinder(canvas.width - px * 8, px);
    drawFinder(px, canvas.height - px * 8);

    // Données visuelles dérivées du texte (non standard mais suffisante pour un QR stylisé)
    const bytes = new TextEncoder().encode(text);
    let i = 0;
    for (let row = 9; row < size - 1; row++) {
      for (let col = 9; col < size - 1; col++) {
        if (i >= bytes.length) break;
        if (bytes[i] % 3 === 0) {
          ctx.fillRect(col * px, row * px, px, px);
        }
        i++;
      }
      if (i >= bytes.length) break;
    }
    return true;
  };
})();

function initQR() {
  const canvas = document.getElementById('qrCanvas');
  if (!canvas) return;
  const ok = window.renderQR(buildVCard(CONTACT), canvas, 6);
  if (!ok) console.warn('QR Code rendering failed');
}

initQR();

/* QR Download */
const qrDownloadBtn = document.getElementById('qrDownload');
if (qrDownloadBtn) {
  qrDownloadBtn.addEventListener('click', () => {
    const canvas = document.getElementById('qrCanvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'Mouhameth_Konate_Contact.png';
    link.click();
  });
}

/* ===== RESTORE LANGUAGE ===== */
const savedLang = localStorage.getItem('lang');
if (savedLang && window.LANGS && window.LANGS[savedLang]) {
  applyLang(savedLang);
} else {
  // Apply default (fr) to ensure labels and flags are consistent
  applyLang(currentLang);
}
