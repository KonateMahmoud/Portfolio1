/* ===== APP.JS — LOGIC & INTERACTIONS ===== */

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
  const langLabelEl = document.getElementById('currentLangLabel');
  if (flagEl) flagEl.textContent = t.flag;
  if (langLabelEl) langLabelEl.textContent = t.label;
  document.querySelectorAll('.lang-option').forEach(o => {
    o.classList.toggle('active', o.dataset.lang === code);
  });
  document.querySelectorAll('.skill-fill').forEach(f => {
    f.style.transformOrigin = t.dir === 'rtl' ? 'right' : 'left';
  });
  localStorage.setItem('lang', code);
}

/* ===== LANG DROPDOWN ===== */
const dd = document.getElementById('langDropdown');
const langBtn = document.getElementById('langBtn');
if (langBtn) {
  langBtn.addEventListener('click', () => { if (dd) dd.classList.toggle('open'); });
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

/* ===== HAMBURGER / NAV DRAWER ===== */
const navDrawer   = document.getElementById('navDrawer');
const hamburger   = document.getElementById('hamburger');
const drawerClose = document.getElementById('drawerClose');

function closeDrawer() {
  if (navDrawer)  navDrawer.classList.remove('open');
  if (hamburger)  hamburger.classList.remove('open');
  document.body.style.overflow = '';
}
/* Exposed globally because drawer links use onclick="closeDrawer()" */
window.closeDrawer = closeDrawer;

if (hamburger) {
  hamburger.addEventListener('click', () => {
    const isOpen = navDrawer && navDrawer.classList.contains('open');
    if (isOpen) {
      closeDrawer();
    } else {
      if (navDrawer)  navDrawer.classList.add('open');
      hamburger.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  });
}
if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
if (navDrawer)   navDrawer.addEventListener('click', e => { if (e.target === navDrawer) closeDrawer(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

/* ===== THEME TOGGLE ===== */
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
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

/* ===== SCROLL ANIMATIONS ===== */
const obs = new IntersectionObserver(entries => {
  entries.forEach(x => { if (x.isIntersecting) x.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));

/* ===== SKILL BARS ===== */
const skillObs = new IntersectionObserver(entries => {
  entries.forEach(x => {
    if (!x.isIntersecting) return;
    x.target.querySelectorAll('.skill-fill').forEach((f, i) => {
      const w   = parseFloat(f.dataset.w) || 0.8;
      const dir = document.documentElement.getAttribute('dir') || 'ltr';
      f.style.transformOrigin = dir === 'rtl' ? 'right' : 'left';
      setTimeout(() => { f.style.transform = `scaleX(${w})`; }, i * 75);
    });
  });
}, { threshold: 0.3 });
document.querySelectorAll('.skill-group').forEach(g => skillObs.observe(g));

/* ===================================================================
   QR CODE — GÉNÉRATEUR NATIF SCANNABLE
   BUG CORRIGÉ: vCard simplifiée (151 bytes) → version 8-M (154 max)
   L'ancien renderQR était une approximation esthétique non scannable.
   =================================================================== */

/* Coordonnées — BUG CORRIGÉ: vCard simplifiée pour tenir en 154 bytes */
const CONTACT = {
  name:    'Mouhameth Konate',     // sans accent pour éviter multi-byte UTF-8
  phone:   '+221785237967',
  email:   'mouhamethkonate0@gmail.com',
  website: 'https://konatemahmoud.github.io/Portfolio1'
};

function buildVCard(c) {
  /* Format minimal — 151 bytes UTF-8, compatible version 8-M */
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:'  + c.name,
    'TEL:' + c.phone,
    'EMAIL:' + c.email,
    'URL:' + c.website,
    'END:VCARD'
  ].join('\n');
}

/* ---- GF(256) & Reed-Solomon ---- */
(function () {
  const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x; LOG[x] = i;
      x = (x << 1) ^ (x & 128 ? 285 : 0);
    }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();

  const mul = (a, b) => a && b ? EXP[(LOG[a] + LOG[b]) % 255] : 0;

  function genPoly(n) {
    let p = [1];
    for (let i = 0; i < n; i++) {
      const q = [0, ...p];
      for (let j = 0; j < q.length; j++) q[j] ^= mul(p[j] || 0, EXP[i]);
      p = q;
    }
    return p.slice(1);
  }

  function reedSolomon(data, n) {
    const g = genPoly(n), msg = [...data, ...new Array(n).fill(0)];
    for (let i = 0; i < data.length; i++) {
      const c = msg[i];
      if (c) for (let j = 0; j < n; j++) msg[i + 1 + j] ^= mul(c, g[j]);
    }
    return msg.slice(data.length);
  }

  /* ---- QR encoder (versions 1-10, ECC-M) ---- */
  // Capacity table: max data bytes per version at ECC-M
  const DC_CAP  = [0, 16, 28, 44, 64, 86, 108, 124, 154, 182, 216];
  // ECC codewords per block and number of blocks
  const ECC_CFG = {
    1:  { ecpb: 10, nb: 1 },
    2:  { ecpb: 16, nb: 1 },
    3:  { ecpb: 26, nb: 1 },
    4:  { ecpb: 18, nb: 2 },
    5:  { ecpb: 24, nb: 2 },
    6:  { ecpb: 16, nb: 4 },
    7:  { ecpb: 18, nb: 4 },
    8:  { ecpb: 22, nb: 2 },
    9:  { ecpb: 22, nb: 3 },
    10: { ecpb: 26, nb: 4 }
  };
  // Alignment pattern centres per version
  const ALIGN = {
    1: [], 2: [6,18], 3: [6,22], 4: [6,26], 5: [6,30],
    6: [6,34], 7: [6,22,38], 8: [6,24,42], 9: [6,28,46], 10: [6,26,46]
  };
  // Precomputed format strings: ECC-M (bits 13-12 = 00), mask 0-7
  // Format = data_bits XOR mask_pattern XOR 101010000010010
  const FMT_STRINGS = [
    0b101010000010010, // mask 0
    0b101000100100101, // mask 1
    0b101111001111100, // mask 2
    0b101101101001011, // mask 3
    0b100010111111001, // mask 4
    0b100000011001110, // mask 5
    0b100111110010111, // mask 6
    0b100101010100000  // mask 7
  ];
  const MASK_FNS = [
    (r,c) => (r+c)%2 === 0,
    (r,c) => r%2 === 0,
    (r,c) => c%3 === 0,
    (r,c) => (r+c)%3 === 0,
    (r,c) => (Math.floor(r/2)+Math.floor(c/3))%2 === 0,
    (r,c) => (r*c)%2+(r*c)%3 === 0,
    (r,c) => ((r*c)%2+(r*c)%3)%2 === 0,
    (r,c) => ((r+c)%2+(r*c)%3)%2 === 0
  ];

  function encodeQR(text) {
    const bytes = new TextEncoder().encode(text);
    const len   = bytes.length;

    // Pick version
    let ver = 0;
    for (let v = 1; v <= 10; v++) { if (DC_CAP[v] >= len) { ver = v; break; } }
    if (!ver) throw new Error('Data too large (' + len + ' bytes)');

    const sz   = ver * 4 + 17;
    const dcap = DC_CAP[ver];
    const { ecpb, nb } = ECC_CFG[ver];
    const dcPerBlock   = Math.floor(dcap / nb);
    const extraBlocks  = dcap - dcPerBlock * nb; // blocks with one extra data cw

    // 1. Encode bits
    const bits = [];
    const push = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >> i) & 1); };
    push(0b0100, 4);
    push(len, 8);
    bytes.forEach(b => push(b, 8));
    for (let i = 0; i < 4 && bits.length < dcap * 8; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    const pads = [0xEC, 0x11]; let pi = 0;
    while (bits.length < dcap * 8) push(pads[pi++ % 2], 8);

    // 2. To codewords
    const dcAll = [];
    for (let i = 0; i < bits.length; i += 8) {
      let v = 0; for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j]; dcAll.push(v);
    }

    // 3. Split blocks & ECC
    const dataB = [], eccB = [];
    let pos = 0;
    for (let b = 0; b < nb; b++) {
      const bLen = dcPerBlock + (b < extraBlocks ? 1 : 0);
      const blk  = dcAll.slice(pos, pos + bLen); pos += bLen;
      dataB.push(blk);
      eccB.push(reedSolomon(blk, ecpb));
    }

    // 4. Interleave
    const allCW = [];
    const maxDC = Math.max(...dataB.map(b => b.length));
    for (let i = 0; i < maxDC; i++) dataB.forEach(b => { if (i < b.length) allCW.push(b[i]); });
    const maxEC = Math.max(...eccB.map(b => b.length));
    for (let i = 0; i < maxEC; i++) eccB.forEach(b => { if (i < b.length) allCW.push(b[i]); });

    // 5. Build matrix
    const M = Array.from({ length: sz }, () => new Int8Array(sz).fill(-1));

    function setFinder(tr, tc) {
      for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
        if (tr + r < 0 || tr + r >= sz || tc + c < 0 || tc + c >= sz) continue;
        M[tr + r][tc + c] = (
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) ? 1 : 0;
      }
    }
    setFinder(0, 0); setFinder(0, sz - 7); setFinder(sz - 7, 0);

    // Alignment patterns
    const ap = ALIGN[ver] || [];
    for (let i = 0; i < ap.length; i++) for (let j = 0; j < ap.length; j++) {
      const r = ap[i], c = ap[j];
      if (M[r][c] !== -1) continue;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        M[r + dr][c + dc] = (Math.abs(dr) === 2 || Math.abs(dc) === 2 || (!dr && !dc)) ? 1 : 0;
      }
    }

    // Timing
    for (let i = 8; i < sz - 8; i++) {
      if (M[6][i] === -1) M[6][i] = i % 2 === 0 ? 1 : 0;
      if (M[i][6] === -1) M[i][6] = i % 2 === 0 ? 1 : 0;
    }

    // Dark module
    M[4 * ver + 9][8] = 1;

    // Format placeholders (set to 0 temporarily)
    [0,1,2,3,4,5,7].forEach(i => { M[8][i] = 0; M[i][8] = 0; });
    M[8][8] = 0; M[7][8] = 0;
    for (let i = 0; i < 8; i++) { M[sz - 1 - i][8] = 0; M[8][sz - 8 + i] = 0; }

    // 6. Place data
    const allBits = allCW.flatMap(cw => Array.from({ length: 8 }, (_, i) => (cw >> (7 - i)) & 1));
    let bit = 0, upward = true;
    for (let col = sz - 1; col >= 0; col -= 2) {
      if (col === 6) col--;
      for (let row = 0; row < sz; row++) {
        const r = upward ? sz - 1 - row : row;
        for (let d = 0; d < 2; d++) {
          const c = col - d;
          if (c < 0 || M[r][c] !== -1) continue;
          M[r][c] = bit < allBits.length ? allBits[bit++] : 0;
        }
      }
      upward = !upward;
    }
    for (let r = 0; r < sz; r++) for (let c = 0; c < sz; c++) if (M[r][c] === -1) M[r][c] = 0;

    // 7. Choose best mask (evaluate penalty — simplified: use mask 0)
    const MASK_ID = 0;
    const maskFn  = MASK_FNS[MASK_ID];

    // Apply mask (skip function modules)
    function isFunctionModule(r, c) {
      if (r < 9 && c < 9) return true;
      if (r < 9 && c >= sz - 8) return true;
      if (r >= sz - 8 && c < 9) return true;
      if (r === 6 || c === 6) return true;
      if (ver >= 7 && r < 6 && c >= sz - 11) return true;
      if (ver >= 7 && r >= sz - 11 && c < 6) return true;
      for (let i = 0; i < ap.length; i++) for (let j = 0; j < ap.length; j++) {
        if (Math.abs(r - ap[i]) <= 2 && Math.abs(c - ap[j]) <= 2) {
          if (ap[i] !== 6 && ap[j] !== 6) return true;
        }
      }
      return false;
    }

    for (let r = 0; r < sz; r++) for (let c = 0; c < sz; c++) {
      if (!isFunctionModule(r, c) && maskFn(r, c)) M[r][c] ^= 1;
    }

    // 8. Write format string
    function writeFormat(fmt) {
      const fb = fmt.toString(2).padStart(15, '0').split('').map(Number);
      [0,1,2,3,4,5,7].forEach((c, i) => { M[8][c] = fb[i]; M[c][8] = fb[i]; });
      M[8][8] = fb[7]; M[7][8] = fb[6];
      [sz-1,sz-2,sz-3,sz-4,sz-5,sz-6,sz-7].forEach((r, i) => { M[r][8] = fb[i + 8]; });
      [sz-8,sz-7,sz-6,sz-5,sz-4,sz-3,sz-2].forEach((c, i) => { M[8][c] = fb[i + 8]; });
      M[sz - 8][8] = 1; // dark module
    }
    writeFormat(FMT_STRINGS[MASK_ID]);

    return M;
  }

  function drawMatrix(M, canvas, px) {
    const sz    = M.length;
    const quiet = 4;
    const side  = (sz + quiet * 2) * px;
    canvas.width  = side;
    canvas.height = side;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, side, side);
    ctx.fillStyle = '#000000';
    for (let r = 0; r < sz; r++) {
      for (let c = 0; c < sz; c++) {
        if (M[r][c]) ctx.fillRect((quiet + c) * px, (quiet + r) * px, px, px);
      }
    }
  }

  window.renderQR = function (text, canvas, px) {
    px = px || 4;
    if (!canvas) return false;
    try {
      drawMatrix(encodeQR(text), canvas, px);
      return true;
    } catch (e) {
      console.error('QR error:', e.message);
      return false;
    }
  };

})();

/* ===== QR INIT ===== */
function initQR() {
  const canvas = document.getElementById('qrCanvas');
  if (!canvas) return;
  const vcard = buildVCard(CONTACT);
  if (!window.renderQR(vcard, canvas, 4)) {
    const frame = document.querySelector('.qr-frame');
    if (frame) frame.innerHTML = '<div style="font-size:0.7rem;color:var(--accent2);padding:1rem;text-align:center">QR non disponible</div>';
  }
}
initQR();

/* ===== QR DOWNLOAD ===== */
const qrDownloadBtn = document.getElementById('qrDownload');
if (qrDownloadBtn) {
  qrDownloadBtn.addEventListener('click', () => {
    const canvas = document.getElementById('qrCanvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href     = canvas.toDataURL('image/png');
    link.download = 'Mouhameth_Konate_Contact.png';
    link.click();
  });
}

/* ===== RESTORE LANGUAGE ===== */
const savedLang = localStorage.getItem('lang');
if (savedLang && window.LANGS && window.LANGS[savedLang]) {
  applyLang(savedLang);
} else {
  applyLang(currentLang);
}
