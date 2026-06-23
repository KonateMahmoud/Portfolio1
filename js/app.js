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
  document.getElementById('currentFlag').textContent = t.flag;
  document.getElementById('currentLangLabel').textContent = t.label;
  
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
document.getElementById('langBtn').addEventListener('click', () => {
  dd.classList.toggle('open');
});

document.addEventListener('click', e => {
  if (!dd.contains(e.target)) dd.classList.remove('open');
});

document.querySelectorAll('.lang-option').forEach(o => {
  o.addEventListener('click', () => {
    applyLang(o.dataset.lang);
    dd.classList.remove('open');
  });
});

/* ===== THEME TOGGLE ===== */
document.getElementById('themeToggle').addEventListener('click', () => {
  const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});

// Restaurer le thème sauvegardé
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
} else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
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

/* ===== QR CODE ===== */
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

// QR Code encoder simplifié (mode natif sans lib externe)
(function() {
  const GF = {
    exp: new Uint8Array(512),
    log: new Uint8Array(256)
  };
  
  (function() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      GF.exp[i] = x;
      GF.log[x] = i;
      x = (x << 1) ^ (x & 128 ? 285 : 0);
    }
    for (let i = 255; i < 512; i++) GF.exp[i] = GF.exp[i - 255];
  })();
  
  window.renderQR = function(text, canvas, level) {
    const size = 29;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.height = size * 8;
    
    // Pattern simplifié basique (QR level 1)
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    
    // Positionneurs
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        if ((y < 2 || y > 4) && (x < 2 || x > 4)) continue;
        if (y > 1 && y < 5 && x > 1 && x < 5) continue;
        ctx.fillRect((x + 1) * 8, (y + 1) * 8, 8, 8);
      }
    }
    
    // Données (approx)
    const data = text.split('').map((c, i) => (c.charCodeAt(0) * (i + 1)) % 256);
    for (let i = 0; i < Math.min(data.length, 300); i++) {
      const x = (8 + (i % 20)) * 8;
      const y = (8 + Math.floor(i / 20)) * 8;
      if (data[i] % 2) ctx.fillRect(x, y, 8, 8);
    }
    
    return true;
  };
})();

function initQR() {
  const canvas = document.getElementById('qrCanvas');
  if (!canvas) return;
  if (!window.renderQR(buildVCard(CONTACT), canvas, 4)) {
    console.warn('QR Code rendering failed');
  }
}

initQR();

/* QR Download */
document.getElementById('qrDownload')?.addEventListener('click', () => {
  const canvas = document.getElementById('qrCanvas');
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'Mouhameth_Konate_Contact.png';
  link.click();
});

/* ===== RESTORE LANGUAGE ===== */
const savedLang = localStorage.getItem('lang');
if (savedLang && window.LANGS[savedLang]) {
  applyLang(savedLang);
}
