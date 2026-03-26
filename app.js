/* ═══════════════════════════════════════════════════════════════════
   app.js — CreditIQ · Login + Dashboard + Variable Builder
   ═══════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════
   PAGE ROUTER — switch between 3 pages
   ══════════════════════════════════════════ */
function showPage(id) {
  // Hide all pages
  const pages = ['page-login', 'page-dashboard', 'page-builder'];
  pages.forEach(pageId => {
    const el = document.getElementById(pageId);
    if (el) el.style.display = 'none';
  });
  
  // Show the requested page
  const targetPage = document.getElementById(id);
  if (targetPage) {
    targetPage.style.display = 'block';
    if (id === 'page-builder') requestAnimationFrame(syncBeneficiaryScrollbar);
  } else {
    console.warn(`Page not found: ${id}`);
  }
}

let beneficiaryScrollbarBound = false;

function syncBeneficiaryScrollbar() {
  const list = document.getElementById('beneficiaryList');
  const thumb = document.getElementById('scrollThumb');
  if (!list || !thumb) return;

  const visible = list.clientHeight;
  const total = list.scrollHeight;
  const track = thumb.parentElement?.clientHeight || 292;

  if (!visible || total <= visible) {
    thumb.style.height = track + 'px';
    thumb.style.top = '0px';
    return;
  }

  const thumbHeight = Math.max((visible / total) * track, 56);
  const maxScroll = total - visible;
  const maxTop = track - thumbHeight;
  const top = maxScroll > 0 ? (list.scrollTop / maxScroll) * maxTop : 0;

  thumb.style.height = thumbHeight + 'px';
  thumb.style.top = top + 'px';
}

function initBeneficiaryScrollbar() {
  const list = document.getElementById('beneficiaryList');
  if (!list || beneficiaryScrollbarBound) return;

  list.addEventListener('scroll', syncBeneficiaryScrollbar);
  window.addEventListener('load', syncBeneficiaryScrollbar);
  window.addEventListener('resize', syncBeneficiaryScrollbar);
  beneficiaryScrollbarBound = true;
  syncBeneficiaryScrollbar();
}

function updateIntermediateVariableVisibility() {
  const card = document.getElementById('intermediate-variable-card');
  if (!card) return;

  const shouldShow = wizStep >= 2;
  card.style.display = shouldShow ? 'block' : 'none';

  if (shouldShow) requestAnimationFrame(syncBeneficiaryScrollbar);
}

/* ══════════════════════════════════════════
   1. LOGIN PAGE LOGIC
   ══════════════════════════════════════════ */

// ── Animated background ──
const canvas = document.getElementById('bg');
const ctx = canvas ? canvas.getContext('2d') : null;
let W, H, bubbles = [];

function resize() {
  if (!canvas) return;
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

class Bubble {
  constructor() { this.reset(true); }
  reset(init) {
    this.x = Math.random() * W;
    this.y = init ? Math.random() * H : H + 100;
    this.r = Math.random() * 70 + 20;
    this.speed = Math.random() * 0.3 + 0.1;
    this.drift = (Math.random() - 0.5) * 0.25;
    this.alpha = Math.random() * 0.055 + 0.018;
    this.color = Math.random() > 0.5 ? '139,126,248' : '99,130,241';
  }
  update() {
    this.y -= this.speed;
    this.x += this.drift;
    if (this.y + this.r < 0) this.reset(false);
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
    ctx.fill();
  }
}

function initBubbles() {
  bubbles = [];
  const n = Math.min(Math.floor(W * H / 18000), 22);
  for (let i = 0; i < n; i++) bubbles.push(new Bubble());
}

function drawBg() {
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#f8f7ff');
  g.addColorStop(0.5, '#f5f4ff');
  g.addColorStop(1, '#f0effe');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  bubbles.forEach(b => { b.update(); b.draw(); });
  requestAnimationFrame(drawBg);
}

resize(); initBubbles(); drawBg();
window.addEventListener('resize', () => { resize(); initBubbles(); });

// ── Tabs ──
document.querySelectorAll('.login-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.login-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ['signin', 'signup'].forEach(id => {
      document.getElementById('f-' + id).classList.toggle('active', id === btn.dataset.tab);
    });
  });
});

// ── Eye toggle ──
document.querySelectorAll('.eye-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const inp = document.getElementById(btn.dataset.t);
    const ico = btn.querySelector('.material-icons-round');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    ico.textContent = inp.type === 'password' ? 'visibility_off' : 'visibility';
  });
});

// ── Password strength ──
const suPass = document.getElementById('su-pass');
if (suPass) {
  suPass.addEventListener('input', function() {
    const v = this.value;
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    const c = ['', 'w', 'm', 'g', 'g'];
    const l = ['', 'Weak', 'Medium', 'Strong', 'Very Strong'];
    [1, 2, 3, 4].forEach(i => {
      const el = document.getElementById('b' + i);
      if (el) el.className = 's-bar' + (i <= s ? ' ' + c[s] : '');
    });
    const lbl = document.getElementById('s-lbl');
    if (lbl) lbl.textContent = v ? (l[s] || 'Weak') : 'Strength';
  });
}

// ── Message helper ──
function loginMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<div class="msg ${type === 'error' ? 'err' : 'ok'}">
    <span class="material-icons-round">${type === 'error' ? 'error_outline' : 'check_circle_outline'}</span>
    ${text}
  </div>`;
}

function clearLoginMsg(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
}

// ── Sign In ──
// ── Sign In → calls POST /login ──
const fSignin = document.getElementById('f-signin');
if (fSignin) {
  fSignin.addEventListener('submit', async e => {
    e.preventDefault();
    const u = document.getElementById('si-user').value.trim();
    const p = document.getElementById('si-pass').value;
    if (!u || !p) return loginMsg('msg-si', 'Please fill in all fields.', 'error');
    const btn = e.target.querySelector('.login-btn');
    btn.disabled = true;
    btn.innerHTML = 'Signing in… <span class="material-icons-round" style="font-size:18px">hourglass_top</span>';
    try {
      const res = await fetch(buildApiUrl('/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        loginMsg('msg-si', data.detail || 'Login failed.', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Sign In <span class="material-icons-round">arrow_forward</span>';
        return;
      }
      const user = data.user;
      sessionStorage.setItem('creditiq.user', JSON.stringify(user));
      sessionStorage.setItem('creditiq.token', data.access_token);
      clearLoginMsg('msg-si');
      setTimeout(() => { bootDashboard(user); showPage('page-dashboard'); }, 900);
    } catch (err) {
      loginMsg('msg-si', '⚠ Backend not reachable. Start backend: cd backend && uvicorn main:app --reload', 'error');
      btn.disabled = false;
      btn.innerHTML = 'Sign In <span class="material-icons-round">arrow_forward</span>';
    }
  });
}

// ── Sign Up → calls POST /signup ──
const fSignup = document.getElementById('f-signup');
if (fSignup) {
  fSignup.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('su-email').value.trim();
    const user  = document.getElementById('su-user').value.trim();
    const pass  = document.getElementById('su-pass').value;
    const conf  = document.getElementById('su-conf').value;
    const terms = document.getElementById('su-terms').checked;
    if (!email || !user || !pass || !conf) return loginMsg('msg-su', 'All fields are required.', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return loginMsg('msg-su', 'Enter a valid email.', 'error');
    if (pass.length < 8) return loginMsg('msg-su', 'Password must be 8+ characters.', 'error');
    if (pass !== conf) return loginMsg('msg-su', 'Passwords do not match.', 'error');
    if (!terms) return loginMsg('msg-su', 'Please accept the Terms.', 'error');
    const btn = e.target.querySelector('.login-btn');
    btn.disabled = true;
    btn.innerHTML = 'Creating… <span class="material-icons-round" style="font-size:18px">hourglass_top</span>';
    try {
      const res = await fetch(buildApiUrl('/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username: user, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        loginMsg('msg-su', data.detail || 'Signup failed.', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Create Account <span class="material-icons-round">arrow_forward</span>';
        return;
      }
      loginMsg('msg-su', 'Account created! Please sign in.', 'success');
      setTimeout(() => {
        document.querySelector('.login-tab[data-tab="signin"]')?.click();
      }, 1200);
      btn.disabled = false;
      btn.innerHTML = 'Create Account <span class="material-icons-round">arrow_forward</span>';
    } catch (err) {
      loginMsg('msg-su', 'Network error. Is the backend running?', 'error');
      btn.disabled = false;
      btn.innerHTML = 'Create Account <span class="material-icons-round">arrow_forward</span>';
    }
  });
}

// ── Typewriter for right panel ──
const features = [
  { card: 'fc1', title: 'ft1', sub: 'fs1', titleText: 'Lightning Fast', subText: 'Build variables instantly', delay: 600 },
  { card: 'fc2', title: 'ft2', sub: 'fs2', titleText: 'Easy to Use', subText: 'Intuitive interface', delay: 1800 },
  { card: 'fc3', title: 'ft3', sub: 'fs3', titleText: 'Multi-Bureau Ingestion', subText: 'CIBIL · Equifax · Experian · TransUnion', delay: 3000 }
];

function typeWriter(el, text, speed, onDone) {
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  el.appendChild(cursor);
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) { cursor.insertAdjacentText('beforebegin', text[i]); i++; }
    else { clearInterval(interval); cursor.remove(); if (onDone) onDone(); }
  }, speed);
}

features.forEach(({ card, title, sub, titleText, subText, delay }) => {
  setTimeout(() => {
    const cardEl = document.getElementById(card);
    if (cardEl) cardEl.classList.add('visible');
    const titleEl = document.getElementById(title);
    if (titleEl) typeWriter(titleEl, titleText, 45, () => {
      setTimeout(() => {
        const subEl = document.getElementById(sub);
        if (subEl) typeWriter(subEl, subText, 30, null);
      }, 120);
    });
  }, delay);
});

/* ══════════════════════════════════════════
   2. DASHBOARD PAGE LOGIC
   ══════════════════════════════════════════ */

// ── Config ──
// API_BASE — auto-detect: if served from backend use same origin, else localhost:8000
const API_BASE = (() => {
  const stored = localStorage.getItem('creditiq.apiBase');
  if (stored) return stored.replace(/\/$/, '');
  // If running from http://localhost:8000 (served by backend)
  if (typeof window !== 'undefined' && window.location.protocol !== 'file:') {
    const port = window.location.port;
    if (port === '8000' || window.location.hostname === 'localhost') {
      return window.location.origin.replace(/\/$/, '');
    }
  }
  return 'http://127.0.0.1:8000';
})();

const VARIABLE_TYPE_LABELS = { trade: 'Trade', trade_hist: 'Trade history', enquiry: 'Enquiry', demog: 'Demographics' };

function buildApiUrl(path) {
  return path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/${path}`;
}

// ── DOM refs ──
const navHome              = document.getElementById('nav-home');
const landingSection       = document.getElementById('landing-page');
const builderSection       = document.getElementById('builder-page');
const landingPriorName     = document.getElementById('landing-prior-name') || document.getElementById('dash-prev-name');
const landingPriorMeta     = document.getElementById('landing-prior-meta') || document.getElementById('dash-prev-meta');
const landingPriorHint     = document.getElementById('landing-prior-hint') || document.getElementById('dash-prev-hint');
const landingOpenBuildBtn  = document.getElementById('landing-open-build') || document.getElementById('dash-open-prev');
const landingBuildList     = document.getElementById('landing-build-list') || document.getElementById('dash-build-grid');
const landingBuildsHint    = document.getElementById('landing-builds-hint') || document.getElementById('dash-builds-hint') || document.getElementById('dash-builds-hint');
const landingBuildTemplate = document.getElementById('landing-build-template');
const builderHeading       = document.getElementById('builder-heading');
const builderSubheading    = document.getElementById('builder-subheading');
const builderSetupShell    = document.getElementById('builder-setup-shell');
const activeBuildPill      = document.getElementById('active-build-pill');
const backToLandingBtn     = document.getElementById('back-to-landing');
const refreshLandingBtn    = document.getElementById('refresh-landing');
const startNewBuildButtons = document.querySelectorAll('[data-action="start-new-build"]');
const userMenuButtons      = Array.from(document.querySelectorAll('[data-user-menu-trigger]'));
const userMenuDropdowns    = Array.from(document.querySelectorAll('[data-user-menu-dropdown]'));
const logoutAction         = null; // Handled via onclick
const settingsAction       = null; // Handled via onclick
const userNameEls          = Array.from(document.querySelectorAll('[data-user-display]'));
const userAvatarEls        = Array.from(document.querySelectorAll('[data-user-avatar]'));
const cancelEditBtn        = document.getElementById('cancel-edit');

const form                 = document.getElementById('create-variable-form');
const statusEl             = document.getElementById('form-status');
const buildCardTemplate    = document.getElementById('build-card-template');
const variableCardTemplate = document.getElementById('variable-card-template');
const stageStartButton     = document.getElementById('stage-one-start');
const stageOneFieldset     = document.getElementById('stage-one');
const stageOneBody         = document.getElementById('stage-one-body');
const stageOneSummary      = document.getElementById('stage-one-summary');
const stageOneSummaryText  = document.getElementById('stage-one-summary-text');
const stageOneEditButton   = document.getElementById('stage-one-edit');
const buildNameInput       = document.getElementById('dash-build-name');
const buildBureauSelect    = document.getElementById('dash-build-bureau');
const buildFileTypeSelect  = document.getElementById('dash-build-file-type');
const buildFileIdWrapper   = document.getElementById('dash-build-file-id-wrapper');
const buildFileIdInput     = document.getElementById('dash-build-file-identifier');
const runBatchBtn          = document.getElementById('run-batch');
const openVBBtn            = document.getElementById('open-variable-builder');
const beneficiaryListEl    = document.getElementById('beneficiaryList');
const beneficiaryPageNavEl = document.getElementById('beneficiaryPageNav');
const beneficiaryPageInfoEl = document.getElementById('beneficiaryPageInfo');
const beneficiaryPrevBtn   = document.getElementById('beneficiaryPrevBtn');
const beneficiaryNextBtn   = document.getElementById('beneficiaryNextBtn');
const intermediateVariableSubtitleEl = document.getElementById('intermediate-variable-subtitle');

// ── State ──
let currentUser = { username: 'guest' };
let buildsCache = [];
let variableMetadata = null;
let activeBuild = null;
let openUserMenu = null;
let stageDetailsUnlocked = false;
let isEditingVariable = false;
let editingVariableOriginalName = null;
let beneficiaryItems = [];
let beneficiaryActiveId = null;
let beneficiaryMenuOpenId = null;
let beneficiaryPage = 0;
const BENEFICIARY_PAGE_SIZE = 5;
const INTERMEDIATE_SUBTYPE_PAGE_SIZE = 5;
const INTERMEDIATE_PRODUCT_CONFIG = {
  PL: {
    label: 'Personal Loan',
    description: 'Loan On Credit Card, Personal Loan, Microfinance Personal Loan',
    avatar_color: 'avatar-blue',
    subtypes: [
      'Loan On Credit Card',
      'Loan To Professional',
      'Microfinance Personal Loan',
      'Personal Loan',
      'Microfinance Others',
      'P2P Personal Loan',
    ],
  },
  CC: {
    label: 'Credit Card',
    description: 'Credit Card, Corporate Card, Kisan Credit Card, Secured Credit Card',
    avatar_color: 'avatar-red',
    subtypes: [
      'Corporate Credit Card',
      'Credit Card',
      'Fleet Card',
      'Kisan Credit Card',
      'Loan Against Bank Deposits',
      'Secured Credit Card',
    ],
  },
  HL: {
    label: 'Housing Loan',
    description: 'Housing and housing-linked enquiry purposes',
    avatar_color: 'avatar-teal',
    subtypes: [
      'Housing Loan',
      'Microfinance - Housing Loan',
      'Pradhan Mantri Awas Yojana - Credit Link Subsidy Scheme MAY CLSS',
    ],
  },
  AL: {
    label: 'Auto Loan',
    description: 'Vehicle and tractor-related enquiry purposes',
    avatar_color: 'avatar-orange',
    subtypes: [
      'Tractor Loan',
      'Used Car Loan',
      'P2P Auto Loan',
      'Auto Loan (Personal)',
    ],
  },
  BL: {
    label: 'Business Loan',
    description: 'Secured, unsecured, GECL and priority-sector business enquiry purposes',
    avatar_color: 'avatar-purple',
    subtypes: [
      'Business Loan - Secured',
      'Business Loan - General',
      'Business Loan - Priority Sector - Small Business',
      'Business Loan - Priority Sector - Agriculture',
      'Business Loan - Priority Sector - Others',
      'Business Non-Funded Credit Facility - General',
      'Business Non - Funded Credit Facility - Priority Sector - Small Business',
      'Business Non - Funded Credit Facility - Priority Sector - Agriculture',
      'Business Non - Funded Credit Facility - Priority Sector - Others',
      'Business Loan Against Bank Deposits',
      'Business Loan - Unsecured',
      'Mudra Loans - Shishu/Kishor/Tarun',
      'GECL Loan Unsecured',
      'GECL Loan Secured',
      'Microfinance Business Loan',
    ],
  },
  GL: {
    label: 'Gold Loan',
    description: 'Gold-backed enquiry purposes',
    avatar_color: 'avatar-gold',
    subtypes: ['Gold Loan'],
  },
  OD: {
    label: 'Overdraft',
    description: 'Overdraft and PMJDY overdraft enquiry purposes',
    avatar_color: 'avatar-darkred',
    subtypes: [
      'Overdraft',
      'Prime Minister Jaan Dhan Yojana - Overdraft',
    ],
  },
  LAP: {
    label: 'Loan Against Property',
    description: 'Property-backed enquiry purposes',
    avatar_color: 'avatar-blue',
    subtypes: ['Property Loan'],
  },
  LAS: {
    label: 'Loan Against Shares/Securities',
    description: 'Investment-backed enquiry purposes',
    avatar_color: 'avatar-teal',
    subtypes: ['Loan Against Shares/Securities'],
  },
  CD: {
    label: 'Consumer Loan',
    description: 'Consumer loan enquiry purposes',
    avatar_color: 'avatar-orange',
    subtypes: ['Consumer Loan'],
  },
  TW: {
    label: 'Two Wheeler Loan',
    description: 'Two-wheeler enquiry purposes',
    avatar_color: 'avatar-purple',
    subtypes: ['Two - Wheeler Loan'],
  },
  CV: {
    label: 'Commercial Vehicle Loan',
    description: 'Commercial vehicle enquiry purposes',
    avatar_color: 'avatar-red',
    subtypes: ['Commercial Vehicle Loan'],
  },
  EL: {
    label: 'Education Loan',
    description: 'Education and P2P education enquiry purposes',
    avatar_color: 'avatar-teal',
    subtypes: [
      'Education Loan',
      'P2P Education Loan',
    ],
  },
  CE: {
    label: 'Construction Equipment Loan',
    description: 'Construction equipment enquiry purposes',
    avatar_color: 'avatar-gold',
    subtypes: ['Construction Equipment Loan'],
  },
  Other: {
    label: 'Other Product',
    description: 'Fallback bucket for uncategorized enquiry purposes from the mapping code',
    avatar_color: 'avatar-darkred',
    note: 'Mapped by fallback / uncategorized logic',
    subtypes: [
      'Leasing',
      'Non - Funded Credit Facility',
      'Other',
      'Priority Sector - Gold Loan',
    ],
  },
};

const INTERMEDIATE_VARIABLE_PRODUCTS = Object.entries(INTERMEDIATE_PRODUCT_CONFIG).map(([id, cfg]) => ({
  id,
  name: id,
  bank_name: cfg.label,
  account_number: cfg.description,
  note: cfg.note || '',
  avatar_color: cfg.avatar_color,
}));

const INTERMEDIATE_PRODUCT_SUBTYPES = Object.fromEntries(
  Object.entries(INTERMEDIATE_PRODUCT_CONFIG).map(([id, cfg]) => [id, cfg.subtypes.slice()])
);

function getIntermediateSubtypeOptions(productId) {
  const key = String(productId || '').trim();
  if (!key) return [];
  return (INTERMEDIATE_PRODUCT_SUBTYPES[key] || []).slice();
}

function getSelectedIntermediateProductForBuild() {
  const explicitProduct = String(state.intermediateSelection?.product || '').trim();
  if (explicitProduct) return explicitProduct;

  const selectedCodes = getSelectedIntermediateProductCodes();
  return selectedCodes.length === 1 ? String(selectedCodes[0]).trim() : '';
}

function getSelectedIntermediateSubtypeForBuild() {
  const productId = getSelectedIntermediateProductForBuild();
  const subtype = String(state.intermediateSelection?.subtype || '').trim();
  if (!productId || !subtype) return '';
  return getIntermediateSubtypeOptions(productId).includes(subtype) ? subtype : '';
}

const INTERMEDIATE_SUBTYPE_STOP_WORDS = new Set([
  'loan', 'against', 'and', 'the', 'to', 'of', 'on', 'general', 'priority', 'sector',
  'link', 'subsidy', 'scheme', 'may', 'clss', 'minister', 'mantri', 'pradhan', 'prime',
  'jaan', 'dhan', 'yojana', 'bank', 'deposits', 'deposits', 'funded', 'facility',
]);

const INTERMEDIATE_SUBTYPE_TOKEN_MAP = {
  microfinance: 'mfi',
  housing: 'housing',
  personal: 'personal',
  professional: 'prof',
  business: 'biz',
  secured: 'sec',
  unsecured: 'unsec',
  education: 'edu',
  credit: 'credit',
  card: 'card',
  overdraft: 'od',
  commercial: 'comm',
  vehicle: 'veh',
  two: 'two',
  wheeler: 'wheel',
  property: 'prop',
  shares: 'shares',
  securities: 'sec',
  construction: 'const',
  equipment: 'equip',
  gold: 'gold',
  consumer: 'consumer',
  durable: 'durable',
  used: 'used',
  auto: 'auto',
  tractor: 'tractor',
  others: 'others',
  other: 'other',
  kisan: 'kisan',
  corporate: 'corp',
  fleet: 'fleet',
  mudra: 'mudra',
  shishu: 'shishu',
  kishor: 'kishor',
  tarun: 'tarun',
  gecl: 'gecl',
  p2p: 'p2p',
};

function getIntermediateSubtypeToken() {
  const subtype = getSelectedIntermediateSubtypeForBuild();
  if (!subtype) return '';

  const tokens = String(subtype)
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter(token => !INTERMEDIATE_SUBTYPE_STOP_WORDS.has(token))
    .map(token => INTERMEDIATE_SUBTYPE_TOKEN_MAP[token] || token);

  if (!tokens.length) return '';
  return tokens.slice(0, 2).join('_');
}

function buildIntermediateSubtypeMarkup(item) {
  const subtypeOptions = getIntermediateSubtypeOptions(item?.id);
  if (!subtypeOptions.length || item?.id !== beneficiaryActiveId) return '';

  const totalPages = Math.max(1, Math.ceil(subtypeOptions.length / INTERMEDIATE_SUBTYPE_PAGE_SIZE));
  const currentPage = Math.min(Math.max(Number(state.intermediateSelection?.page || 0), 0), totalPages - 1);
  const start = currentPage * INTERMEDIATE_SUBTYPE_PAGE_SIZE;
  const end = Math.min(start + INTERMEDIATE_SUBTYPE_PAGE_SIZE, subtypeOptions.length);
  const selectedSubtype = getSelectedIntermediateSubtypeForBuild();
  const cards = subtypeOptions.slice(start, end).map(option => {
    const isSelected = option === selectedSubtype;
    return `
      <button
        type="button"
        data-subtype-value="${escapeHtml(option)}"
        class="beneficiary-subtype-card ${isSelected ? 'selected' : ''}"
      >
        <span class="beneficiary-subtype-card-title">${escapeHtml(option)}</span>
      </button>
    `;
  }).join('');

  return `
    <div class="beneficiary-subtypes">
      <div class="beneficiary-subtypes-head">
        <div class="beneficiary-subtypes-title">${escapeHtml(item.id)} Sub-Categories</div>
        ${totalPages > 1 ? `
          <div class="beneficiary-subtypes-page">
            <button type="button" class="beneficiary-subtypes-nav" data-subtype-page-dir="-1" ${currentPage === 0 ? 'disabled' : ''}>&lsaquo;</button>
            <span class="beneficiary-subtypes-page-info">${start + 1}-${end} of ${subtypeOptions.length}</span>
            <button type="button" class="beneficiary-subtypes-nav" data-subtype-page-dir="1" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>&rsaquo;</button>
          </div>
        ` : ''}
      </div>
      <div class="beneficiary-subtypes-grid">${cards}</div>
    </div>
  `;
}

// ── Boot dashboard with logged-in user ──

// ── localStorage fallback for builds ─────────────────────────────────────
function _getLocalBuilds() {
  try {
    const raw = localStorage.getItem('creditiq.builds');
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

function _saveLocalBuild(build) {
  try {
    const builds = _getLocalBuilds();
    const idx = builds.findIndex(b => b.name === build.name && b.owner === build.owner);
    if (idx >= 0) builds[idx] = { ...builds[idx], ...build };
    else builds.unshift(build);
    localStorage.setItem('creditiq.builds', JSON.stringify(builds));
  } catch(e) { console.warn('localStorage save failed:', e); }
}

function _deleteLocalBuild(buildName) {
  try {
    const builds = _getLocalBuilds().filter(b => b.name !== buildName);
    localStorage.setItem('creditiq.builds', JSON.stringify(builds));
  } catch(e) {}
}

function bootDashboard(user) {
  currentUser = user || { username: 'guest' };
  const displayName = (currentUser.username || 'Guest');
  const cap = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  userNameEls.forEach(el => { el.textContent = cap; });
  userAvatarEls.forEach(el => { el.textContent = cap.charAt(0).toUpperCase(); });
  resetVariableForm();
  loadVariableMetadata();
  updateActiveBuildUI({ prefillForm: false });
  loadBuilds();
}

// ── Helpers ──
function showStatus(message, type = '') {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.remove('error', 'success');
  if (type) statusEl.classList.add(type);
}

function getCurrentOwner() {
  const username = currentUser?.username;
  return (username && username.trim()) ? username.trim() : 'guest';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getCurrentBeneficiaryBuildName() {
  const legacyBuildName = document.getElementById('build-name')?.value?.trim();
  const wizardBuildName = (typeof state !== 'undefined' && state?.buildName) ? String(state.buildName).trim() : '';
  return activeBuild?.name?.trim() || buildNameInput?.value?.trim() || legacyBuildName || wizardBuildName || '';
}

function renderBeneficiaries() {
  if (!beneficiaryListEl) return;
  if (!beneficiaryItems.length) {
    beneficiaryListEl.innerHTML = '<div class="beneficiary-empty">No product mapped for the current selection.</div>';
    if (beneficiaryPageNavEl) beneficiaryPageNavEl.style.display = 'none';
    syncBeneficiaryScrollbar();
    return;
  }

  const totalPages = Math.max(1, Math.ceil(beneficiaryItems.length / BENEFICIARY_PAGE_SIZE));
  if (beneficiaryPage >= totalPages) beneficiaryPage = totalPages - 1;

  if (!beneficiaryItems.some(item => item.id === beneficiaryActiveId)) {
    beneficiaryActiveId = null;
  }

  const start = beneficiaryPage * BENEFICIARY_PAGE_SIZE;
  const end = Math.min(start + BENEFICIARY_PAGE_SIZE, beneficiaryItems.length);
  const pageItems = beneficiaryItems.slice(start, end);

  beneficiaryListEl.innerHTML = pageItems.map(item => `
    <article class="beneficiary-item ${item.id === beneficiaryActiveId ? 'active' : ''}" data-beneficiary-id="${item.id}">
      <div class="beneficiary-row">
        <div class="beneficiary-left">
          <div class="beneficiary-avatar product-code-pill ${escapeHtml(item.avatar_color || 'avatar-blue')}">${escapeHtml(item.name)}</div>
          <div class="beneficiary-text">
            <div class="beneficiary-name">${escapeHtml(item.bank_name)}</div>
            <div class="beneficiary-bank">${escapeHtml(item.account_number)}</div>
            ${item.note ? `<div class="beneficiary-note">${escapeHtml(item.note)}</div>` : ''}
          </div>
        </div>
        <div class="beneficiary-card-meta">
          <span class="beneficiary-card-tag">PRD</span>
        </div>
      </div>
      ${buildIntermediateSubtypeMarkup(item)}
    </article>
  `).join('');

  if (beneficiaryPageNavEl && beneficiaryPageInfoEl && beneficiaryPrevBtn && beneficiaryNextBtn) {
    beneficiaryPageNavEl.style.display = totalPages > 1 ? 'flex' : 'none';
    beneficiaryPageInfoEl.textContent = `${start + 1}-${end} of ${beneficiaryItems.length}`;
    beneficiaryPrevBtn.disabled = beneficiaryPage === 0;
    beneficiaryNextBtn.disabled = beneficiaryPage >= totalPages - 1;
  }

  updateIntermediateVariableSubtitle();
  requestAnimationFrame(syncBeneficiaryScrollbar);
}

function getSelectedIntermediateProductCodes() {
  const isTradeFlow = state.domain === 'trade' || state.domain === 'trade_history';
  if (isTradeFlow && Array.isArray(state.tradeScope?.loanType) && state.tradeScope.loanType.length) {
    return state.tradeScope.loanType.slice();
  }
  if (state.domain === 'account' && Array.isArray(state.accScope?.loanType) && state.accScope.loanType.length) {
    return state.accScope.loanType.slice();
  }
  if (state.domain === 'enquiry' && Array.isArray(state.filters?.product) && state.filters.product.length) {
    return state.filters.product.slice();
  }
  return [];
}

function getIntermediateProductsForCurrentFlow() {
  const selectedCodes = getSelectedIntermediateProductCodes();
  if (!selectedCodes.length) return INTERMEDIATE_VARIABLE_PRODUCTS.slice();

  const productMap = new Map(
    INTERMEDIATE_VARIABLE_PRODUCTS.map(item => [String(item.id).toUpperCase(), item])
  );

  return selectedCodes
    .map(code => productMap.get(String(code).toUpperCase()))
    .filter(Boolean);
}

function updateIntermediateVariableSubtitle() {
  if (!intermediateVariableSubtitleEl) return;

  const selectedCodes = getSelectedIntermediateProductCodes();
  const subcatLabel = state.subCat && currentSchema()?.[state.subCat]?.label
    ? currentSchema()[state.subCat].label
    : '';
  const selectedProduct = getSelectedIntermediateProductForBuild();
  const selectedSubtype = getSelectedIntermediateSubtypeForBuild();

  if (selectedProduct && selectedSubtype) {
    intermediateVariableSubtitleEl.textContent = `Selected product ${selectedProduct} -> ${selectedSubtype}`;
    return;
  }

  if (selectedProduct) {
    intermediateVariableSubtitleEl.textContent = `Selected product ${selectedProduct} - choose a sub-category`;
    return;
  }

  if (selectedCodes.length) {
    intermediateVariableSubtitleEl.textContent = `Selected products for ${subcatLabel || state.varType}: ${selectedCodes.join(', ')}`;
    return;
  }

  if (subcatLabel) {
    intermediateVariableSubtitleEl.textContent = `Available product codes for ${state.varType} -> ${subcatLabel}`;
    return;
  }

  intermediateVariableSubtitleEl.textContent = 'All product codes with full form and short description';
}

function promptBeneficiaryInput(existing = {}) {
  const name = window.prompt('Beneficiary name', existing.name || '');
  if (name === null) return null;
  if (!name.trim()) { window.alert('Beneficiary name is required.'); return null; }

  const bankName = window.prompt('Bank name', existing.bank_name || '');
  if (bankName === null) return null;
  if (!bankName.trim()) { window.alert('Bank name is required.'); return null; }

  const accountNumber = window.prompt('Account number', existing.account_number || '');
  if (accountNumber === null) return null;
  if (!accountNumber.trim()) { window.alert('Account number is required.'); return null; }

  return {
    name: name.trim(),
    bank_name: bankName.trim(),
    account_number: accountNumber.trim(),
  };
}

async function loadBeneficiaries() {
  if (!beneficiaryListEl) return;
  beneficiaryItems = getIntermediateProductsForCurrentFlow();
  beneficiaryMenuOpenId = null;
  beneficiaryPage = 0;
  const explicitProduct = String(state.intermediateSelection?.product || '').trim();
  if (explicitProduct && beneficiaryItems.some(item => item.id === explicitProduct)) {
    beneficiaryActiveId = explicitProduct;
  } else if (!beneficiaryItems.some(item => item.id === beneficiaryActiveId)) {
    beneficiaryActiveId = null;
  }
  if (!beneficiaryItems.some(item => item.id === explicitProduct)) {
    state.intermediateSelection.product = '';
    state.intermediateSelection.subtype = '';
    state.intermediateSelection.page = 0;
  }
  renderBeneficiaries();
}

async function createBeneficiaryFromPrompt() {
  const payload = promptBeneficiaryInput();
  if (!payload) return;

  try {
    const data = await fetchJSON(buildApiUrl('/beneficiaries'), {
      method: 'POST',
      body: JSON.stringify({
        owner: getCurrentOwner(),
        build_name: getCurrentBeneficiaryBuildName() || null,
        ...payload,
      }),
    });
    beneficiaryActiveId = data?.beneficiary?.id ?? beneficiaryActiveId;
    await loadBeneficiaries();
    showToast('Beneficiary added');
  } catch (error) {
    window.alert(`Failed to add beneficiary: ${error.message}`);
  }
}

async function editBeneficiaryFromPrompt(beneficiaryId) {
  const existing = beneficiaryItems.find(item => item.id === beneficiaryId);
  if (!existing) return;
  const payload = promptBeneficiaryInput(existing);
  if (!payload) return;

  try {
    await fetchJSON(buildApiUrl(`/beneficiaries/${beneficiaryId}`), {
      method: 'PUT',
      body: JSON.stringify({
        owner: getCurrentOwner(),
        build_name: getCurrentBeneficiaryBuildName() || null,
        ...payload,
      }),
    });
    beneficiaryActiveId = beneficiaryId;
    await loadBeneficiaries();
    showToast('Beneficiary updated');
  } catch (error) {
    window.alert(`Failed to update beneficiary: ${error.message}`);
  }
}

async function deleteBeneficiaryById(beneficiaryId) {
  const existing = beneficiaryItems.find(item => item.id === beneficiaryId);
  if (!existing) return;
  if (!window.confirm(`Delete beneficiary "${existing.name}"?`)) return;

  try {
    const url = new URL(buildApiUrl(`/beneficiaries/${beneficiaryId}`));
    url.searchParams.set('owner', getCurrentOwner());
    await fetchJSON(url.toString(), { method: 'DELETE' });
    if (beneficiaryActiveId === beneficiaryId) beneficiaryActiveId = null;
    await loadBeneficiaries();
    showToast('Beneficiary deleted');
  } catch (error) {
    window.alert(`Failed to delete beneficiary: ${error.message}`);
  }
}

async function fetchJSON(url, options) {
  const token = sessionStorage.getItem('creditiq.token');
  const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...authHeader }, ...options });
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      const message = (typeof data?.detail === 'string' && data.detail.trim()) || (typeof data?.message === 'string' && data.message.trim()) || '';
      if (message && !detail.toLowerCase().includes(message.toLowerCase())) detail = `${detail}: ${message}`;
    } catch (_) {}
    throw new Error(detail);
  }
  if (response.status === 204) return null;
  return response.json();
}

function cloneVariable(variable, variableType) {
  const type = String(variableType || variable?.variable_type || 'unspecified');
  return { ...variable, variable_type: type };
}

function normalizeVariableBuckets(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const buckets = {};
  const source = raw.variables_by_type;
  if (source && typeof source === 'object') {
    Object.entries(source).forEach(([typeName, list]) => {
      if (!Array.isArray(list) || !list.length) return;
      const cleanedType = String(typeName || 'unspecified');
      const normalizedList = list.filter(item => item && typeof item === 'object').map(item => cloneVariable(item, cleanedType));
      if (normalizedList.length) buckets[cleanedType] = normalizedList;
    });
    return buckets;
  }
  if (Array.isArray(raw.variables)) {
    raw.variables.filter(item => item && typeof item === 'object').forEach(item => {
      const typeName = String(item.variable_type || 'unspecified');
      const bucket = buckets[typeName] || [];
      bucket.push(cloneVariable(item, typeName));
      buckets[typeName] = bucket;
    });
  }
  return buckets;
}

function flattenVariableBuckets(buckets) {
  const flat = [];
  Object.entries(buckets).forEach(([typeName, list]) => {
    if (!Array.isArray(list)) return;
    list.forEach(item => { if (item && typeof item === 'object') flat.push(cloneVariable(item, typeName)); });
  });
  return flat;
}

function sanitizeVariableForSave(feature, normalized) {
  const dropKeys = new Set([
    'feature_name',
    '_from_catalog',
    '_source',
    '_vc',
    '_vc_var',
    'time_window_str',
    'label',
    'custom',
  ]);

  const out = {};
  Object.entries(feature || {}).forEach(([key, value]) => {
    if (dropKeys.has(key)) return;
    if (value === undefined) return;
    out[key] = value;
  });

  Object.entries(normalized || {}).forEach(([key, value]) => {
    if (value === undefined) return;
    out[key] = value;
  });

  return out;
}

function getVariableCountFromBuckets(buckets) {
  return Object.values(buckets).reduce((total, list) => total + (Array.isArray(list) ? list.length : 0), 0);
}

function normalizeBuildRecord(raw) {
  if (!raw || typeof raw !== 'object') return { name: '', bureau: null, file_type: 'batch', file_identifier: null, created_at: new Date().toISOString(), variables_by_type: {}, variables: [], variable_count: 0 };
  const buckets = normalizeVariableBuckets(raw);
  const flatVariables = flattenVariableBuckets(buckets);
  const variableCount = getVariableCountFromBuckets(buckets);
  return {
    ...raw,
    created_at:      raw.created_at || new Date().toISOString(),
    variables_by_type: buckets,
    variables:       flatVariables,
    variable_count:  variableCount,
  };
}

function getVariableCount(build) {
  if (!build || typeof build !== 'object') return 0;
  if (typeof build.variable_count === 'number') return build.variable_count;
  return getVariableCountFromBuckets(build.variables_by_type || {});
}

function formatVariableTypeLabel(typeName) {
  if (!typeName) return 'Unspecified';
  const normalized = String(typeName).toLowerCase();
  if (VARIABLE_TYPE_LABELS[normalized]) return VARIABLE_TYPE_LABELS[normalized];
  const cleaned = normalized.replace(/[_-]+/g, ' ');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function formatBuildMeta(build) {
  const scope = build.bureau ?? 'Generic build';
  const typeLabel = build.file_type === 'single' ? 'Single FID' : 'Batch';
  const segments = [scope, typeLabel];
  if (build.file_type === 'single' && build.file_identifier) segments.push(`FID ${build.file_identifier}`);
  const variableCount = getVariableCount(build);
  segments.push(variableCount === 1 ? '1 variable' : `${variableCount} variables`);
  return segments.join(' • ');
}

// ── Stage 1 ──
function updateStageOneSummary() {
  if (!stageOneSummaryText) return;
  const buildName = buildNameInput.value.trim() || 'Untitled build';
  const bureauLabel = buildBureauSelect.options[buildBureauSelect.selectedIndex]?.textContent.trim() || 'Generic';
  const type = buildFileTypeSelect.value === 'single' ? 'Single FID' : 'Batch';
  const summaryParts = [buildName, bureauLabel, type];
  if (buildFileTypeSelect.value === 'single') {
    const fid = buildFileIdInput.value.trim();
    if (fid) summaryParts.push(`FID ${fid}`);
  }
  stageOneSummaryText.textContent = summaryParts.join(' • ');
}

function applyStageState() {
  if (!stageStartButton) return;
  if (stageDetailsUnlocked) {
    stageOneFieldset?.classList.add('collapsed');
    stageOneBody?.classList.add('hidden');
    stageOneSummary?.classList.remove('hidden');
    stageStartButton.textContent = 'Stage 1 ready';
    stageStartButton.classList.add('ghost');
    stageStartButton.classList.remove('primary');
    stageStartButton.disabled = true;
    if (openVBBtn) openVBBtn.disabled = false;
    updateStageOneSummary();
  } else {
    stageOneFieldset?.classList.remove('collapsed');
    stageOneBody?.classList.remove('hidden');
    stageOneSummary?.classList.add('hidden');
    stageStartButton.textContent = 'Start variable setup';
    stageStartButton.classList.add('primary');
    stageStartButton.classList.remove('ghost');
    stageStartButton.disabled = false;
    if (openVBBtn) openVBBtn.disabled = true;
  }
  if (runBatchBtn) runBatchBtn.disabled = !stageDetailsUnlocked;
}

function setStageDetailsUnlocked(unlocked) {
  stageDetailsUnlocked = unlocked;
  applyStageState();
}

function validateStageOne() {
  if (!buildNameInput) return false;
  const buildName = buildNameInput.value.trim();
  if (!buildName) { showStatus('Please enter a build name before continuing.', 'error'); buildNameInput.focus(); return false; }
  const normalizedBuildName = buildName.toLowerCase();
  if (!activeBuild && buildsCache.some(b => (b?.name ?? '').trim().toLowerCase() === normalizedBuildName)) {
    showStatus(`A build named "${buildName}" already exists. Choose a different name or open it from the list.`, 'error');
    buildNameInput.focus(); return false;
  }
  if (!buildFileTypeSelect) return true;
  const fileType = buildFileTypeSelect.value;
  if (!fileType) { showStatus('Select the build file type before continuing.', 'error'); buildFileTypeSelect.focus(); return false; }
  if (fileType === 'single' && buildFileIdInput && !buildFileIdInput.value.trim()) { showStatus('Provide the file identifier for single file builds.', 'error'); buildFileIdInput.focus(); return false; }
  return true;
}

function updateFileIdentifierState() {
  if (!buildFileTypeSelect) return;
  if (buildFileTypeSelect.value === 'single') {
    buildFileIdWrapper?.classList.remove('hidden');
    if (buildFileIdInput) buildFileIdInput.required = true;
  } else {
    buildFileIdWrapper?.classList.add('hidden');
    if (buildFileIdInput) { buildFileIdInput.required = false; buildFileIdInput.value = ''; }
  }
}

function resetVariableForm() {
  if (form) form.reset();
  updateFileIdentifierState();
  showStatus('');
  applyStageState();
}

function populateFormFromBuild(build) {
  resetVariableForm();
  if (buildNameInput) buildNameInput.value = build.name ?? '';
  if (buildBureauSelect) buildBureauSelect.value = build.bureau ?? '';
  if (buildFileTypeSelect) buildFileTypeSelect.value = build.file_type ?? '';
  updateFileIdentifierState();
  if (build.file_type === 'single' && buildFileIdInput) buildFileIdInput.value = build.file_identifier ?? '';
  updateStageOneSummary();
}

// ── Navigation helpers ──
function showDashboardLanding() {
  landingSection?.classList.remove('hidden');
  builderSection?.classList.add('hidden');
}

function showDashboardBuilder() {
  landingSection?.classList.add('hidden');
  builderSection?.classList.remove('hidden');
}

function goToDashboard() {
  setUserMenuVisibility(null, false);
  showPage('page-dashboard');
  showDashboardLanding();
  loadBuilds();  // always refresh so previous build + grid are up to date
}

function renderDashboard() {
  loadBuilds();
}

function openPreviousBuild() {
  const buildName = document.getElementById('dash-open-prev')?.dataset.buildName;
  if (!buildName) return;
  const build = buildsCache.find(item => item.name === buildName);
  if (build) {
    activeBuild = build;
    openBuildInVB(build);
  }
}

function startNewBuildFlow() {
  setUserMenuVisibility(null, false);
  // Reset VB state and go directly to Variable Builder page (Screen 0)
  activeBuild = null;
  beneficiaryActiveId = null;
  beneficiaryMenuOpenId = null;
  // Reset VB state object
  if (typeof state !== 'undefined') {
    state.buildName = '';
    state.bureau = '';
    state.fileType = '';
    state.features = [];
    state.intermediateSelection = { product:'', subtype:'', page:0 };
  }
  // Clear VB crumbs
  const crumbBuild = document.getElementById('crumb-build');
  const crumbBureau = document.getElementById('crumb-bureau');
  const crumbMode = document.getElementById('crumb-mode');
  if (crumbBuild) crumbBuild.textContent = '—';
  if (crumbBureau) crumbBureau.textContent = '—';
  if (crumbMode) crumbMode.textContent = '—';
  // Update header feature count
  const hdrFeatCount = document.getElementById('hdr-feat-count');
  if (hdrFeatCount) hdrFeatCount.textContent = '0 variables';
  // Go to VB page, Screen 0
  showPage('page-builder');
  loadBeneficiaries();
  if (typeof goScreen === 'function') goScreen(0);
  renderLandingHighlight();
}

// Alias for onclick handlers
function startNewBuild() {
  startNewBuildFlow();
}

// ── Landing highlights ──
function getMostRecentBuild() {
  if (!buildsCache.length) return null;
  // activeBuild ko priority do — yahi most recent shown hona chahiye
  if (activeBuild) {
    const inCache = buildsCache.find(b => b.name === activeBuild.name);
    if (inCache) return inCache;
    return activeBuild;
  }
  return buildsCache.slice().sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at) : new Date(0);
    const db2 = b.created_at ? new Date(b.created_at) : new Date(0);
    return db2 - da;
  })[0];
}

function setLandingHighlight({ name, meta = '', hint = '', buildName = null, showButton = false }) {
  if (landingPriorName) landingPriorName.textContent = name;
  if (landingPriorMeta) { landingPriorMeta.textContent = meta; landingPriorMeta.classList.toggle('hidden', !meta); }
  if (landingPriorHint) landingPriorHint.textContent = hint;
  if (landingOpenBuildBtn) {
    if (showButton && buildName) {
      landingOpenBuildBtn.classList.remove('hidden');
      landingOpenBuildBtn.dataset.buildName = buildName;
      landingOpenBuildBtn.disabled = false;
    } else {
      landingOpenBuildBtn.classList.add('hidden');
      landingOpenBuildBtn.dataset.buildName = '';
    }
  }
}

function renderLandingHighlight() {
  const highlight = activeBuild || getMostRecentBuild();
  if (highlight) {
    setLandingHighlight({ name: highlight.name, meta: formatBuildMeta(highlight), hint: `Created ${new Date(highlight.created_at).toLocaleString()}`, buildName: highlight.name, showButton: true });
  } else {
    setLandingHighlight({ name: 'No builds yet', meta: '', hint: 'Start a new build to see it here.', showButton: false });
  }
}

function renderLandingBuildList() {
  if (!landingBuildList) return;
  landingBuildList.innerHTML = '';
  if (!currentUser) { if (landingBuildsHint) landingBuildsHint.textContent = 'Sign in to load your saved builds.'; return; }
  const builds = buildsCache.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (!builds.length) {
    if (landingBuildsHint) landingBuildsHint.textContent = 'No builds yet. Start a new build to see it here.';
    const emptyCard = document.createElement('div');
    emptyCard.className = 'build-card';
    emptyCard.innerHTML = '<div class="landing-build-main"><p class="build-name">No builds yet</p><p class="build-meta">Start your first build and it will appear here.</p></div>';
    landingBuildList.appendChild(emptyCard);
    return;
  }
  if (landingBuildsHint) landingBuildsHint.textContent = `Showing ${builds.length} ${builds.length === 1 ? 'build' : 'builds'}.`;
  builds.forEach(build => {
    const card = document.createElement('article');
    card.className = 'landing-build-card';
    card.dataset.buildName = build.name;
    const metaText = formatBuildMeta(build);
    card.innerHTML = `
      <div class="landing-build-main">
        <p class="build-name"></p>
        <p class="build-meta"></p>
        <p class="build-created"></p>
      </div>
      <div class="landing-build-actions">
        <button class="btn-open-build" type="button" data-action="open-build">Open</button>
        <button class="btn-delete-build" type="button" data-action="delete-build">Delete</button>
      </div>
    `;
    card.querySelector('.build-name').textContent = build.name;
    const metaEl = card.querySelector('.build-meta');
    if (metaEl) { metaEl.textContent = metaText; metaEl.classList.toggle('hidden', !metaText); }
    const createdEl = card.querySelector('.build-created');
    const variableCount = getVariableCount(build);
    const variableLabel = variableCount === 1 ? 'variable' : 'variables';
    const createdAt = build.created_at ? new Date(build.created_at).toLocaleString() : 'Unknown';
    if (createdEl) createdEl.textContent = `${variableCount} ${variableLabel} • Created ${createdAt}`;
    if (createdEl) createdEl.textContent = `${variableCount} ${variableLabel} | Created ${createdAt}`;
    landingBuildList.appendChild(card);
  });
}

function updateActiveBuildUI({ prefillForm = false } = {}) {
  if (activeBuild) {
    if (builderHeading) builderHeading.textContent = activeBuild.name;
    if (builderSubheading) builderSubheading.textContent = formatBuildMeta(activeBuild);
    if (activeBuildPill) activeBuildPill.textContent = activeBuild.name;
    if (prefillForm) populateFormFromBuild(activeBuild);
    setStageDetailsUnlocked(true);
  } else {
    if (builderHeading) builderHeading.textContent = 'New Build';
    if (builderSubheading) builderSubheading.textContent = 'Start a fresh configuration and add your first variable.';
    if (activeBuildPill) activeBuildPill.textContent = 'New Build';
    if (prefillForm) resetVariableForm();
    else applyStageState();
  }
  renderLandingHighlight();
  renderLandingBuildList();
}

// ── API calls ──
async function loadBuilds() {
  if (!currentUser) { buildsCache = []; renderLandingHighlight(); renderLandingBuildList(); return; }
  try {
    const owner = getCurrentOwner();
    const url = new URL(buildApiUrl('/builds'));
    url.searchParams.set('owner', owner);
    const data = await fetchJSON(url.toString());
    const builds = Array.isArray(data.builds) ? data.builds : (Array.isArray(data) ? data : []);
    buildsCache = builds.map(b => normalizeBuildRecord(b));
    if (activeBuild) { const refreshed = buildsCache.find(b => b.name === activeBuild.name); activeBuild = refreshed || null; }
    updateActiveBuildUI({ prefillForm: false });
  } catch (error) {
    console.error('[loadBuilds]', error.message);
    // Use localStorage fallback when backend is not running
    const localBuilds = _getLocalBuilds().filter(b => b.owner === getCurrentOwner());
    if (localBuilds.length) {
      buildsCache = localBuilds.map(b => ({ ...b, variables_by_type: {}, variable_count: b.variable_count || 0 }));
      updateActiveBuildUI({ prefillForm: false });
      if (landingBuildsHint) landingBuildsHint.textContent = `${localBuilds.length} locally saved build(s) — start backend to sync with DB.`;
    } else {
      setLandingHighlight({ name: 'Backend not connected', meta: '', hint: 'cd backend && uvicorn main:app --reload', showButton: false });
      if (landingBuildsHint) landingBuildsHint.textContent = '⚠ Backend not running — start it to load your builds.';
      if (landingBuildList) landingBuildList.innerHTML = '';
    }
  }
}

async function deleteBuild(buildName) {
  if (!buildName || !currentUser) return;
  try {
    const owner = getCurrentOwner();
    const url = new URL(buildApiUrl(`/builds/${encodeURIComponent(buildName)}`));
    url.searchParams.set('owner', owner);
    const data = await fetchJSON(url.toString(), { method: 'DELETE' });
    if (activeBuild?.name === buildName) activeBuild = null;
    await loadBuilds();
    showStatus(data?.message || `Deleted ${buildName}`, 'success');
  } catch (error) {
    console.error(error);
    showStatus(`Failed to delete build: ${error.message}`, 'error');
  }
  // Always remove from localStorage too
  _deleteLocalBuild(buildName);
  loadBuilds();
}

async function deleteVariable(buildName, variableName) {
  if (!buildName || !variableName) return;
  try {
    const owner = getCurrentOwner();
    const url = buildApiUrl(`/builds/${encodeURIComponent(buildName)}/variable/${encodeURIComponent(variableName)}?owner=${encodeURIComponent(owner)}`);
    const data = await fetchJSON(url, { method: 'DELETE' });
    showStatus(data.message, 'success');
    await loadBuilds();
  } catch (error) { console.error('Variable delete failed:', error); showStatus(`Failed to delete variable: ${error.message}`, 'error'); }
}

async function loadVariableMetadata() {
  try {
    const response = await fetch(buildApiUrl('/variableMetadata'));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    variableMetadata = await response.json();
  } catch (error) { console.error('Failed to load variable metadata:', error); variableMetadata = {}; }
}

// ── Variable card ──
function startVariableEdit(variable) {
  isEditingVariable = true;
  editingVariableOriginalName = variable.name;
  showStatus(`Editing variable "${variable.name}"`, 'success');
  cancelEditBtn?.classList.remove('hidden');
}

function renderVariableCard(variable) {
  const fragment = variableCardTemplate.content.cloneNode(true);
  const card = fragment.querySelector('.variable-card');
  const summary = fragment.querySelector('.variable-card-summary');
  fragment.querySelector('.variable-name').textContent = variable.name;
  const typeLabel = formatVariableTypeLabel(variable.variable_type);
  const createdAt = variable.created_at ? (() => { const p = new Date(variable.created_at); return Number.isNaN(p.getTime()) ? null : p; })() : null;
  const tags = Array.isArray(variable.tags) ? variable.tags.filter(Boolean) : [];
  const tagText = tags.length ? ` • Tags: ${tags.join(', ')}` : '';
  const createdLabel = createdAt ? ` • Created ${createdAt.toLocaleString()}` : '';
  const metaText = `${typeLabel}${createdLabel}${tagText}`.trim();
  fragment.querySelector('.variable-meta').textContent = metaText;
  summary.setAttribute('title', `${variable.name} (${typeLabel}${createdLabel}${tagText})`);
  summary.setAttribute('aria-label', `Toggle ${variable.name} details`);
  card.dataset.variableType = variable.variable_type;
  const descriptionEl = fragment.querySelector('.variable-description');
  if (variable.description) descriptionEl.textContent = variable.description;
  else descriptionEl.remove();
  const configuration = variable.configuration && typeof variable.configuration === 'object' ? variable.configuration : {};
  fragment.querySelector('.variable-config').textContent = JSON.stringify(configuration, null, 2);
  fragment.querySelector("[data-action='edit-variable']")?.addEventListener('click', e => { e.stopPropagation(); startVariableEdit(variable); });
  fragment.querySelector('.delete-variable-btn')?.addEventListener('click', async e => {
    e.stopPropagation();
    if (!window.confirm(`Delete variable "${variable.name}"? This action cannot be undone.`)) return;
    await deleteVariable(activeBuild?.name, variable.name);
  });
  return fragment;
}

// ── User menu ──
function getUserMenuRefs(menuName) {
  return {
    button: document.querySelector(`[data-user-menu-trigger="${menuName}"]`),
    dropdown: document.querySelector(`[data-user-menu-dropdown="${menuName}"]`),
  };
}

function setUserMenuVisibility(menuName, show) {
  userMenuDropdowns.forEach(dropdown => dropdown.classList.add('hidden'));
  userMenuButtons.forEach(button => button.setAttribute('aria-expanded', 'false'));
  if (!show || !menuName) {
    openUserMenu = null;
    return;
  }
  const { button, dropdown } = getUserMenuRefs(menuName);
  dropdown?.classList.remove('hidden');
  button?.setAttribute('aria-expanded', 'true');
  openUserMenu = menuName;
}

// ── Dashboard Event Listeners ──
navHome?.addEventListener('click', showDashboardLanding);
backToLandingBtn?.addEventListener('click', showDashboardLanding);
refreshLandingBtn?.addEventListener('click', loadBuilds);
startNewBuildButtons.forEach(btn => btn.addEventListener('click', startNewBuildFlow));

function openBuildInVB(build) {
  setUserMenuVisibility(null, false);
  activeBuild = build;
  beneficiaryActiveId = null;
  beneficiaryMenuOpenId = null;
  if (typeof state !== 'undefined') {
    state.buildName = build.name || '';
    state.bureau    = build.bureau || '';
    state.fileType  = build.file_type || '';
    state.intermediateSelection = { product:'', subtype:'', page:0 };
  }
  const crumbBuild  = document.getElementById('crumb-build');
  const crumbBureau = document.getElementById('crumb-bureau');
  const crumbMode   = document.getElementById('crumb-mode');
  if (crumbBuild)  crumbBuild.textContent  = build.name       || '—';
  if (crumbBureau) crumbBureau.textContent = build.bureau     || 'Generic';
  if (crumbMode)   crumbMode.textContent   = build.file_type  || '—';
  const ovBuild  = document.getElementById('ov-build');
  const ovBureau = document.getElementById('ov-bureau');
  const ovMode   = document.getElementById('ov-mode');
  if (ovBuild)  ovBuild.textContent  = build.name       || '';
  if (ovBureau) ovBureau.textContent = build.bureau     || '';
  if (ovMode)   ovMode.textContent   = build.file_type  || '';
  renderLandingHighlight();
  showPage('page-builder');
  loadBeneficiaries();
  if (typeof goScreen === 'function') goScreen(2);
  if (typeof wizStep !== 'undefined') wizStep = 1;
  if (typeof updateWizUI === 'function') updateWizUI();
  if (typeof buildSubcatGrid === 'function') buildSubcatGrid();
  if (typeof buildPredefList === 'function') buildPredefList();
}

landingOpenBuildBtn?.addEventListener('click', () => {
  const buildName = landingOpenBuildBtn.dataset.buildName;
  if (!buildName) return;
  const build = buildsCache.find(item => item.name === buildName);
  if (!build) return;
  openBuildInVB(build);
});

landingBuildList?.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const card = button.closest('.landing-build-card');
  const buildName = card?.dataset.buildName;
  if (!buildName) return;
  if (button.dataset.action === 'open-build') {
    const build = buildsCache.find(item => item.name === buildName);
    if (!build) return;
    openBuildInVB(build);
  } else if (button.dataset.action === 'delete-build') {
    if (!window.confirm(`Delete the build "${buildName}"? This action cannot be undone.`)) return;
    deleteBuild(buildName);
  }
});

// ── User menu functions ──
beneficiaryPrevBtn?.addEventListener('click', () => {
  if (beneficiaryPage <= 0) return;
  beneficiaryPage -= 1;
  renderBeneficiaries();
});

beneficiaryNextBtn?.addEventListener('click', () => {
  const totalPages = Math.ceil(beneficiaryItems.length / BENEFICIARY_PAGE_SIZE);
  if (beneficiaryPage >= totalPages - 1) return;
  beneficiaryPage += 1;
  renderBeneficiaries();
});
beneficiaryListEl?.addEventListener('click', event => {
  const subtypePageButton = event.target.closest('[data-subtype-page-dir]');
  if (subtypePageButton) {
    const pageDir = Number(subtypePageButton.dataset.subtypePageDir || 0);
    const activeProduct = subtypePageButton.closest('[data-beneficiary-id]')?.dataset.beneficiaryId || beneficiaryActiveId || '';
    const subtypeOptions = getIntermediateSubtypeOptions(activeProduct);
    const totalPages = Math.max(1, Math.ceil(subtypeOptions.length / INTERMEDIATE_SUBTYPE_PAGE_SIZE));
    const currentPage = Math.min(Math.max(Number(state.intermediateSelection?.page || 0), 0), totalPages - 1);
    state.intermediateSelection.product = activeProduct;
    state.intermediateSelection.page = Math.min(Math.max(currentPage + pageDir, 0), totalPages - 1);
    beneficiaryActiveId = activeProduct;
    renderBeneficiaries();
    return;
  }

  const subtypeButton = event.target.closest('[data-subtype-value]');
  if (subtypeButton) {
    const beneficiaryId = subtypeButton.closest('[data-beneficiary-id]')?.dataset.beneficiaryId || beneficiaryActiveId || '';
    const subtypeValue = subtypeButton.dataset.subtypeValue || '';
    beneficiaryActiveId = beneficiaryId;
    state.intermediateSelection.product = beneficiaryId;
    state.intermediateSelection.subtype = subtypeValue;
    const subtypeOptions = getIntermediateSubtypeOptions(beneficiaryId);
    const subtypeIndex = subtypeOptions.indexOf(subtypeValue);
    state.intermediateSelection.page = subtypeIndex >= 0 ? Math.floor(subtypeIndex / INTERMEDIATE_SUBTYPE_PAGE_SIZE) : 0;
    beneficiaryMenuOpenId = null;
    renderBeneficiaries();
    if (typeof updateLiveJSON === 'function') updateLiveJSON();
    return;
  }

  const row = event.target.closest('[data-beneficiary-id]');
  if (!row) return;
  const beneficiaryId = row.dataset.beneficiaryId;
  const action = event.target.closest('[data-action]')?.dataset.action;

  if (action === 'toggle-beneficiary-menu') {
    event.stopPropagation();
    beneficiaryMenuOpenId = beneficiaryMenuOpenId === beneficiaryId ? null : beneficiaryId;
    renderBeneficiaries();
    return;
  }

  if (action === 'edit-beneficiary') {
    event.stopPropagation();
    beneficiaryMenuOpenId = null;
    editBeneficiaryFromPrompt(beneficiaryId);
    return;
  }

  if (action === 'delete-beneficiary') {
    event.stopPropagation();
    beneficiaryMenuOpenId = null;
    deleteBeneficiaryById(beneficiaryId);
    return;
  }

  const isSameCard = beneficiaryActiveId === beneficiaryId;
  beneficiaryActiveId = isSameCard ? null : beneficiaryId;
  if (isSameCard) {
    state.intermediateSelection.product = '';
    state.intermediateSelection.subtype = '';
    state.intermediateSelection.page = 0;
  } else {
    state.intermediateSelection.product = beneficiaryId;
    if (!getIntermediateSubtypeOptions(beneficiaryId).includes(state.intermediateSelection.subtype || '')) {
      state.intermediateSelection.subtype = '';
      state.intermediateSelection.page = 0;
    }
    state.intermediateSelection.page = 0;
  }
  beneficiaryMenuOpenId = null;
  renderBeneficiaries();
  if (typeof updateLiveJSON === 'function') updateLiveJSON();
});

document.addEventListener('click', event => {
  if (!beneficiaryMenuOpenId) return;
  if (event.target.closest('#beneficiaryList')) return;
  beneficiaryMenuOpenId = null;
  renderBeneficiaries();
});

function toggleDashboardUserMenu(event, menuName = 'dashboard') {
  event.stopPropagation();
  setUserMenuVisibility(menuName, openUserMenu !== menuName);
}

function openDashboardSettings() {
  setUserMenuVisibility(null, false);
  window.alert('Settings are coming soon to this workspace!');
}

async function doLogout() {
  setUserMenuVisibility(null, false);
  try { await fetch(buildApiUrl('/logout'), { method: 'POST' }); } catch (_) {}
  sessionStorage.removeItem('creditiq.user');
  sessionStorage.removeItem('creditiq.token');
  showPage('page-login');
}

document.addEventListener('click', e => {
  if (!openUserMenu) return;
  const { button, dropdown } = getUserMenuRefs(openUserMenu);
  if (!dropdown?.contains(e.target) && !button?.contains(e.target)) setUserMenuVisibility(null, false);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && openUserMenu) setUserMenuVisibility(null, false); });

stageStartButton?.addEventListener('click', () => {
  if (!validateStageOne()) return;
  setStageDetailsUnlocked(true);
  showStatus('Stage 1 ready. Continue with variable setup.', 'success');
});

stageOneEditButton?.addEventListener('click', () => {
  setStageDetailsUnlocked(false);
  showStatus('Stage 1 unlocked for edits. Confirm to continue.');
  stageStartButton?.focus();
});

buildFileTypeSelect?.addEventListener('change', updateFileIdentifierState);

cancelEditBtn?.addEventListener('click', () => {
  isEditingVariable = false;
  editingVariableOriginalName = null;
  cancelEditBtn.classList.add('hidden');
  resetVariableForm();
  showStatus('');
});

// ── Open Variable Builder ──
// ── VB back to dashboard ──
document.getElementById('vb-back-btn')?.addEventListener('click', () => {
  showPage('page-dashboard');
  showDashboardLanding();
  loadBuilds();  // refresh from DB so latest builds show
});

form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!currentUser) { showStatus('Sign in before saving variables.', 'error'); return; }
  const payload = {
    build_name: buildNameInput.value.trim(),
    owner: getCurrentOwner(),
    bureau: buildBureauSelect.value || null,
    file_type: buildFileTypeSelect.value,
    file_identifier: buildFileTypeSelect.value === 'single' ? buildFileIdInput.value.trim() || null : null,
    variable: builtFeatures.length ? (() => {
      const f = builtFeatures[builtFeatures.length - 1];
      const tw = f.time_window ? (typeof f.time_window === 'object' ? f.time_window.value + 'm' : f.time_window) : null;
      return { ...f, name: f.feature_name || f.name, variable_type: f.variable_type || 'Other', sub_category: f.sub_category || f.sub || null, time_window: tw };
    })() : {},
  };
  if (!validateStageOne()) return;
  try {
    showStatus('Saving variable...');
    const preservedBuild = { name: buildNameInput.value, bureau: buildBureauSelect.value, fileType: buildFileTypeSelect.value, fileIdentifier: buildFileIdInput.value };
    if (isEditingVariable && editingVariableOriginalName) {
      await deleteVariable(payload.build_name, editingVariableOriginalName);
      isEditingVariable = false; editingVariableOriginalName = null;
      cancelEditBtn?.classList.add('hidden');
    }
    const data = await fetchJSON(buildApiUrl('/addVariable'), { method: 'POST', body: JSON.stringify(payload) });
    showStatus(data.message, 'success');
    form.reset();
    if (buildNameInput) buildNameInput.value = preservedBuild.name;
    if (buildBureauSelect) buildBureauSelect.value = preservedBuild.bureau;
    if (buildFileTypeSelect) buildFileTypeSelect.value = preservedBuild.fileType;
    updateFileIdentifierState();
    if (preservedBuild.fileType === 'single' && buildFileIdInput) buildFileIdInput.value = preservedBuild.fileIdentifier;
    updateStageOneSummary();
    if (data.build) activeBuild = normalizeBuildRecord(data.build);
    loadBuilds();
  } catch (error) { console.error(error); showStatus(`Failed to save variable: ${error.message}`, 'error'); }
});

runBatchBtn?.addEventListener('click', async () => {
  const buildName = buildNameInput.value.trim();
  if (!buildName) { showStatus('Enter a build name before running the batch.', 'error'); return; }
  try {
    showStatus('Running batch...');
    const owner = getCurrentOwner();
    const data = await fetchJSON(buildApiUrl('/runBatch'), { method: 'POST', body: JSON.stringify({ build_name: buildName, owner }) });
    showStatus(data?.message || 'Batch triggered successfully.', 'success');
  } catch (error) { console.error(error); showStatus(`Batch failed: ${error.message}`, 'error'); }
});

// ── Init: check if user already logged in ──
(function init() {
  initBeneficiaryScrollbar();
  const storedUser = sessionStorage.getItem('creditiq.user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      bootDashboard(user);
      showPage('page-dashboard');
      return;
    } catch (_) {}
  }
  showPage('page-login');
})();

/* ══════════════════════════════════════════
   3. VARIABLE BUILDER LOGIC (original)
   ══════════════════════════════════════════ */

// ══════════════════════════════════════════
// ENQUIRY SCHEMA
// ══════════════════════════════════════════
const INQ_SCHEMA = {
  volume:       { label:"Volume",       type:"aggregation",          measures:{ count:{label:"Count"} }, aggregations:["count","ratio_to_total","flag"], agg_params:{flag:{needs_threshold:true}}, filters:["product","secured","amount","lender"], windows:["1m","3m","6m","12m","24m","36m"], multi_window:true,  needs_window:true,  post:["log","cap","bucket"], color:"ft-vol", entity:"inquiry" },
  amount:       { label:"Amount",       type:"aggregation",          measures:{ inquiry_amount:{label:"Inquiry Amount"} }, aggregations:["sum","avg","max","min","median","std","variance","cv","skew","kurtosis","percentile"], agg_params:{percentile:{needs_pct:true},std:{min_rec:2},cv:{min_rec:2},skew:{min_rec:3},kurtosis:{min_rec:4},variance:{min_rec:2}}, filters:["product","secured","lender"], windows:["1m","3m","6m","12m","24m","36m"], multi_window:true,  needs_window:true,  post:["log","cap","bucket"], color:"ft-amt", entity:"inquiry" },
  gap:          { label:"Gap",          type:"derived_time_series",  measures:{ days_between:{label:"Days Between Inquiries",derived:"sorted_date_diff"} }, aggregations:["avg","median","min","max","std","cv","skew","percentile"], agg_params:{percentile:{needs_pct:true},std:{min_rec:2},cv:{min_rec:2},skew:{min_rec:3}}, filters:["product","secured"], windows:["3m","6m","12m","24m","36m"], multi_window:false, needs_window:true,  post:["log"], color:"ft-gap", entity:"inquiry" },
  recency:      { label:"Recency",      type:"point_in_time",        measures:{ months_since_last:{label:"Months Since Last Inquiry"},months_since_oldest:{label:"Months Since Oldest Inquiry"} }, aggregations:["value"], agg_params:{}, filters:["product","secured"], windows:[], multi_window:false, needs_window:false, post:["cap","bucket"], color:"ft-rec", entity:"inquiry" },
  concentration:{ label:"Concentration",type:"categorical_distribution",measures:{ distinct_lenders:{label:"Distinct Lenders",derived:"count_distinct"},top_lender_share:{label:"Top Lender Share",derived:"max_share"},hhi_index:{label:"HHI Index",derived:"herfindahl_index"} }, aggregations:["count","ratio","index"], agg_params:{}, filters:["product","secured"], windows:["3m","6m","12m","24m"], multi_window:false, needs_window:true,  post:[], color:"ft-con", entity:"inquiry" },
  velocity:     { label:"Velocity",     type:"window_comparison",    measures:{ count_change:{label:"Count Change (diff)"},count_ratio:{label:"Count Ratio"},growth_rate:{label:"Growth Rate %"},slope:{label:"Linear Trend Slope"} }, aggregations:["difference","ratio","growth_rate","slope"], agg_params:{}, filters:["product","secured"], windows:[], window_pairs:[["3m","6m"],["6m","12m"],["3m","12m"]], multi_window:false, needs_window:true,  post:[], color:"ft-vel", entity:"inquiry" },
  mix:          { label:"Mix",          type:"segment_ratio",        measures:{ secured_unsecured_ratio:{label:"Secured/Unsecured Ratio"} }, aggregations:["ratio"], agg_params:{}, filters:["product"], windows:["3m","6m","12m"], multi_window:false, needs_window:true,  post:[], color:"ft-mix", entity:"inquiry" },
  threshold:    { label:"Threshold",    type:"conditional_flag",     measures:{ count_threshold:{label:"Count above/below threshold"},amount_threshold:{label:"Amount above/below threshold"} }, aggregations:["flag","count"], agg_params:{}, required_filters:["amount_operator","amount_value"], filters:["product","secured","amount"], windows:["1m","3m","6m","12m"], multi_window:false, needs_window:true,  post:[], color:"ft-thr", entity:"inquiry" },
  distribution:        { label:"Distribution",        type:"shape_metric",           measures:{ amount_distribution:{label:"Amount Distribution Stats"},gap_distribution:{label:"Gap Distribution Stats"} }, aggregations:["std","cv","skew","kurtosis","percentile"], agg_params:{percentile:{needs_pct:true},std:{min_rec:2},cv:{min_rec:2},skew:{min_rec:3},kurtosis:{min_rec:4}}, filters:["product","secured"], windows:["6m","12m","24m"], multi_window:false, needs_window:true,  post:[], color:"ft-dis", entity:"inquiry" },
  product_diversity:   { label:"Product Diversity",   type:"categorical_distribution",measures:{ distinct_products:{label:"Distinct Product Types",derived:"count_distinct"}, product_hhi:{label:"Product HHI Index",derived:"herfindahl_index"}, dominant_product_share:{label:"Top Product Share",derived:"max_share"} }, aggregations:["count","index","ratio"], agg_params:{}, filters:["secured"], windows:["3m","6m","12m","24m"], multi_window:false, needs_window:true,  post:[], color:"ft-prd", entity:"inquiry" },
  secured_split:       { label:"Secured Split",       type:"segment_ratio",           measures:{ secured_count:{label:"Secured Inquiry Count"}, unsecured_count:{label:"Unsecured Inquiry Count"}, secured_ratio:{label:"Secured Ratio"}, secured_flag:{label:"Has Secured Inquiry Flag"} }, aggregations:["count","ratio","flag"], agg_params:{}, filters:["product"], windows:["3m","6m","12m","24m"], multi_window:false, needs_window:true,  post:[], color:"ft-sec", entity:"inquiry" },
  amount_bucket:       { label:"Amount Bucket",       type:"conditional_flag",        measures:{ bucket_lt_25k:{label:"Count < 25K"}, bucket_25k_1l:{label:"Count 25K–1L"}, bucket_1l_5l:{label:"Count 1L–5L"}, bucket_gt_5l:{label:"Count > 5L"} }, aggregations:["count"], agg_params:{}, filters:["product","secured"], windows:["3m","6m","12m","24m"], multi_window:false, needs_window:true,  post:[], color:"ft-bkt", entity:"inquiry" },
  inter_enquiry_timing:{ label:"Inter-Enquiry Timing",type:"derived_time_series",     measures:{ enquiry_span_months:{label:"Enquiry Span (months)",derived:"date_spread"}, burst_count_30d:{label:"Burst Count (≤30d)",derived:"burst_count"}, burst_flag:{label:"Burst Flag (3+ in 30d)",derived:"burst_flag"} }, aggregations:["value","count","flag"], agg_params:{}, filters:["product","secured"], windows:["3m","6m","12m","24m"], multi_window:false, needs_window:true,  post:[], color:"ft-tim", entity:"inquiry" }
};

// ══════════════════════════════════════════
// ACCOUNT SCHEMA — 7-DIMENSION FEATURE ENGINE
// Point-in-time portfolio snapshot features
// Bureau: CIBIL / CRIF / Equifax (canonical mapped)
// ══════════════════════════════════════════
const ACT_SCHEMA = {

  portfolio_count: {
    label: "Portfolio Count",
    type: "aggregation",
    isNew: false,
    measures: {
      total_accounts:     { label: "Total Accounts",             col: "account_id",     canonical: "account_id" },
      active_accounts:    { label: "Active Accounts",            col: "AccountStatus",  canonical: "status" },
      closed_accounts:    { label: "Closed Accounts",            col: "AccountStatus",  canonical: "status" },
      npa_accounts:       { label: "NPA Accounts",               col: "AccountStatus",  canonical: "status" },
      written_off:        { label: "Written Off Accounts",        col: "writeoff_flag",  canonical: "writeoff_flag" },
      settled_accounts:   { label: "Settled Accounts",           col: "settlement_amt", canonical: "settled_flag" },
      suit_filed:         { label: "Suit Filed Accounts",         col: "SuitFiled_Flag", canonical: "suit_flag" },
      sma_accounts:       { label: "SMA Accounts",               col: "AccountStatus",  canonical: "status" },
      restructured:       { label: "Restructured Accounts",      col: "AccountStatus",  canonical: "restructured_flag" },
      delinquent_accounts:{ label: "Delinquent Accounts (DPD>0)",col: "DPD",           canonical: "dpd" }
    },
    aggregations: ["count", "ratio_to_total"],
    agg_params: {},
    filters: ["loan_type", "secured", "ownership"],
    windows: ["3m", "6m", "12m", "24m", "36m"],
    multi_window: true, needs_window: false, time_context: true,
    post: ["log"], color: "ft-vol", entity: "account"
  },

  portfolio_exposure: {
    label: "Portfolio Exposure",
    type: "aggregation",
    isNew: false,
    measures: {
      total_outstanding:    { label: "Total Outstanding Balance",  col: "Outstanding_Balance",  canonical: "current_balance" },
      total_sanctioned:     { label: "Total Sanctioned Amount",    col: "Sanction_Amount",      canonical: "sanction_amount" },
      total_overdue:        { label: "Total Overdue Amount",       col: "Over_due_amount",      canonical: "overdue_amount" },
      total_credit_limit:   { label: "Total Credit Limit",         col: "CreditLimit",          canonical: "credit_limit" },
      total_writeoff:       { label: "Total Writeoff Amount",      col: "writeoff_amt_tot",     canonical: "writeoff_amount" },
      total_emi:            { label: "Total EMI Obligation",        col: "EMI",                  canonical: "emi_amount" },
      total_settlement:     { label: "Total Settlement Amount",    col: "settlement_amt",       canonical: "settlement_amount" },
      avg_balance:          { label: "Avg Outstanding Balance",    col: "Outstanding_Balance",  canonical: "current_balance" },
      max_balance:          { label: "Max Outstanding Balance",    col: "Outstanding_Balance",  canonical: "current_balance" },
      largest_exposure:     { label: "Largest Single Exposure",    col: "Sanction_Amount",      canonical: "sanction_amount" }
    },
    aggregations: ["sum", "avg", "max", "min", "median", "std", "cv", "percentile"],
    agg_params: { std: { min_rec: 2 }, cv: { min_rec: 2 }, percentile: { needs_pct: true } },
    filters: ["loan_type", "secured", "ownership", "status"],
    windows: ["3m", "6m", "12m", "24m", "36m"],
    multi_window: false, needs_window: false, time_context: true,
    post: ["log", "cap"], color: "ft-exp", entity: "account"
  },

  credit_age: {
    label: "Credit Age",
    type: "point_in_time",
    isNew: false,
    measures: {
      age_oldest:           { label: "Age of Oldest Account (months)",     col: "DateOpened", canonical: "open_date" },
      age_newest:           { label: "Age of Newest Account (months)",     col: "DateOpened", canonical: "open_date" },
      credit_history_len:   { label: "Credit History Length (months)",     col: "DateOpened", canonical: "open_date" },
      months_since_opened:  { label: "Months Since Last Account Opened",   col: "DateOpened", canonical: "open_date" },
      months_since_closed:  { label: "Months Since Last Account Closed",   col: "DateClosed", canonical: "close_date" },
      avg_account_age:      { label: "Average Account Age (months)",       col: "DateOpened", canonical: "open_date" }
    },
    aggregations: ["value", "min", "max", "avg"],
    agg_params: {},
    filters: ["loan_type"],
    windows: [],
    multi_window: false, needs_window: false, time_context: false,
    post: ["cap"], color: "ft-vint", entity: "account"
  },

  account_mix: {
    label: "Account Mix",
    type: "categorical_distribution",
    isNew: false,
    measures: {
      secured_unsecured_ratio: { label: "Secured / Unsecured Count Ratio",   col: "secured_flag",      canonical: "secured_flag" },
      secured_exposure_ratio:  { label: "Secured Exposure Ratio (Amt)",       col: "Sanction_Amount",   canonical: "sanction_amount" },
      loan_type_hhi:           { label: "Loan Type HHI (Concentration Index)",col: "AccountType",       canonical: "loan_type" },
      num_distinct_lenders:    { label: "Number of Distinct Lenders",          col: "MemberShortName",   canonical: "lender_id" },
      top_lender_share:        { label: "Top Lender Share (Count %)",           col: "MemberShortName",   canonical: "lender_id" },
      num_distinct_types:      { label: "Number of Distinct Loan Types",        col: "AccountType",       canonical: "loan_type" },
      pl_share:                { label: "PL Share of Total Exposure",            col: "AccountType",       canonical: "loan_type" },
      cc_share:                { label: "CC Share of Total Exposure",            col: "AccountType",       canonical: "loan_type" },
      unsecured_exposure_ratio:{ label: "Unsecured Exposure Ratio (%)",          col: "Sanction_Amount",   canonical: "sanction_amount" },
      closed_to_open_ratio:    { label: "Closed to Open Account Ratio",          col: "AccountStatus",     canonical: "status" }
    },
    aggregations: ["ratio", "count", "index"],
    agg_params: {},
    filters: ["status"],
    windows: ["6m", "12m"],
    multi_window: false, needs_window: false, time_context: false,
    post: [], color: "ft-mix", entity: "account"
  },

  delinquency_profile: {
    label: "Delinquency Profile",
    type: "aggregation",
    isNew: false,
    measures: {
      current_dpd:         { label: "Current DPD (latest)",                   col: "DPD",            canonical: "dpd" },
      max_dpd_ever:        { label: "Max DPD Ever",                            col: "DPD",            canonical: "dpd" },
      max_dpd_12m:         { label: "Max DPD in Last 12 Months",               col: "DPD",            canonical: "dpd" },
      count_dpd30:         { label: "Count of 30+ DPD Accounts",               col: "DPD",            canonical: "dpd" },
      count_dpd60:         { label: "Count of 60+ DPD Accounts",               col: "DPD",            canonical: "dpd" },
      count_dpd90:         { label: "Count of 90+ DPD Accounts",               col: "DPD",            canonical: "dpd" },
      ever_npa_flag:       { label: "Ever NPA Flag",                            col: "AccountStatus",  canonical: "status" },
      ever_wo_flag:        { label: "Ever Written Off Flag",                    col: "writeoff_flag",  canonical: "writeoff_flag" },
      ever_settled_flag:   { label: "Ever Settled Flag",                        col: "settlement_amt", canonical: "settled_flag" },
      ever_suit_flag:      { label: "Ever Suit Filed Flag",                     col: "SuitFiled_Flag", canonical: "suit_flag" },
      first_delq_month:    { label: "Months Since First Delinquency",           col: "DateReported",   canonical: "dpd" },
      last_delq_month:     { label: "Months Since Last Delinquency",            col: "DateReported",   canonical: "dpd" },
      consec_delq_streak:  { label: "Max Consecutive Delinquency Streak",       col: "DPD",            canonical: "dpd" }
    },
    aggregations: ["flag", "count", "max", "avg", "ratio"],
    agg_params: {},
    filters: ["loan_type", "secured"],
    windows: ["6m", "12m", "24m", "36m"],
    multi_window: false, needs_window: false, time_context: true,
    post: [], color: "ft-del", entity: "account"
  },

  utilization_profile: {
    label: "Utilization Profile",
    type: "derived_ratio",
    isNew: false,
    measures: {
      cc_utilization:       { label: "CC Utilization (Balance / CreditLimit)",    col: "CreditLimit",           canonical: "credit_limit" },
      revolving_util:       { label: "Revolving Line Utilization",                 col: "Outstanding_Balance",   canonical: "current_balance" },
      avg_util_all_cards:   { label: "Avg Utilization Across Cards",              col: "CreditLimit",           canonical: "credit_limit" },
      max_util_single_card: { label: "Max Utilization (Single Card)",              col: "CreditLimit",           canonical: "credit_limit" },
      high_util_count:      { label: "Count of High Utilization Accounts (>75%)", col: "CreditLimit",           canonical: "credit_limit" },
      high_util_flag:       { label: "High Utilization Flag (any card >80%)",      col: "CreditLimit",           canonical: "credit_limit" },
      util_above_90:        { label: "Count of Maxed-Out Accounts (>90%)",         col: "CreditLimit",           canonical: "credit_limit" }
    },
    aggregations: ["avg", "max", "ratio", "flag", "count"],
    agg_params: {},
    filters: ["loan_type"],
    windows: ["3m", "6m", "12m"],
    multi_window: false, needs_window: false, time_context: false,
    post: ["cap"], color: "ft-util", entity: "account"
  },

  account_flags: {
    label: "Account Flags",
    type: "conditional_flag",
    isNew: false,
    measures: {
      has_npa:            { label: "Has Any NPA Account",           col: "AccountStatus",  canonical: "status" },
      has_writeoff:       { label: "Has Any Written Off Account",    col: "writeoff_flag",  canonical: "writeoff_flag" },
      has_settled:        { label: "Has Any Settled Account",        col: "settlement_amt", canonical: "settled_flag" },
      has_suit_filed:     { label: "Has Any Suit Filed Account",     col: "SuitFiled_Flag", canonical: "suit_flag" },
      has_overdue:        { label: "Has Any Overdue Account",        col: "Over_due_amount",canonical: "overdue_amount" },
      has_sma:            { label: "Has Any SMA Account",            col: "AccountStatus",  canonical: "status" },
      has_restructured:   { label: "Has Restructured Account",       col: "AccountStatus",  canonical: "restructured_flag" },
      has_any_stress:     { label: "Has Any Stress Account (NPA/WO/Suit/Settled)", col: "AccountStatus", canonical: "status" },
      has_dpd30:          { label: "Has Account with DPD ≥ 30",     col: "DPD",            canonical: "dpd" },
      has_dpd90:          { label: "Has Account with DPD ≥ 90",     col: "DPD",            canonical: "dpd" }
    },
    aggregations: ["flag"],
    agg_params: {},
    filters: ["loan_type", "secured"],
    windows: ["6m", "12m", "24m"],
    multi_window: false, needs_window: false, time_context: true,
    post: [], color: "ft-thr", entity: "account"
  },

  derived_ratios: {
    label: "Derived Ratios",
    type: "derived_ratio",
    isNew: true,
    measures: {
      foir:                    { label: "FOIR (Total EMI / Reported Income)",              col: "EMI",                  canonical: "emi_amount" },
      active_account_ratio:    { label: "Active Account Ratio (Active / Total)",            col: "AccountStatus",        canonical: "status" },
      delinquent_ratio:        { label: "Delinquent Account Ratio (DPD>0 / Total)",         col: "DPD",                  canonical: "dpd" },
      npa_ratio:               { label: "NPA Ratio (NPA / Total)",                          col: "AccountStatus",        canonical: "status" },
      unsecured_ratio:         { label: "Unsecured Exposure Ratio",                          col: "Sanction_Amount",      canonical: "sanction_amount" },
      pl_exposure_share:       { label: "PL Share of Total Exposure (%)",                    col: "Sanction_Amount",      canonical: "sanction_amount" },
      top3_exposure_ratio:     { label: "Top 3 Account Exposure Concentration",              col: "Outstanding_Balance",  canonical: "current_balance" },
      overdue_to_outstanding:  { label: "Overdue to Outstanding Ratio",                      col: "Over_due_amount",      canonical: "overdue_amount" },
      emi_to_sanction:         { label: "EMI to Sanction Amount Ratio (debt burden)",        col: "EMI",                  canonical: "emi_amount" },
      writeoff_to_sanctioned:  { label: "Writeoff to Total Sanctioned (loss rate)",          col: "writeoff_amt_tot",     canonical: "writeoff_amount" }
    },
    aggregations: ["ratio", "percentage", "avg"],
    agg_params: {},
    filters: ["loan_type", "secured"],
    windows: [],
    multi_window: false, needs_window: false, time_context: false,
    post: ["cap"], color: "ft-mix", entity: "account"
  },

  behavioral: {
    label: "Behavioral",
    type: "behavioral_sequence",
    isNew: true,
    measures: {
      ever_90dpd:              { label: "Ever Had 90+ DPD",                          col: "DPD",           canonical: "dpd" },
      ever_120dpd:             { label: "Ever Had 120+ DPD",                         col: "DPD",           canonical: "dpd" },
      months_since_last_delq:  { label: "Months Since Last Delinquency",             col: "DateReported",  canonical: "dpd" },
      dpd_spike_indicator:     { label: "DPD Spike Indicator (sudden ≥30 DPD jump)", col: "DPD",           canonical: "dpd" },
      credit_seeking_accel:    { label: "Credit Seeking Acceleration (new accounts opened rapidly)", col: "DateOpened", canonical: "open_date" },
      payment_consistency:     { label: "Payment Consistency Score (% on-time payments)",            col: "DPD",           canonical: "dpd" },
      balance_paydown_rate:    { label: "Balance Paydown Rate (balance reduction trend)",            col: "Outstanding_Balance", canonical: "current_balance" },
      account_closure_rate:    { label: "Account Closure Rate (closed / opened in period)",          col: "DateClosed",    canonical: "close_date" }
    },
    aggregations: ["flag", "count", "ratio", "value"],
    agg_params: {},
    filters: ["loan_type", "secured"],
    windows: ["6m", "12m", "24m", "36m"],
    multi_window: false, needs_window: false, time_context: true,
    post: [], color: "ft-vel", entity: "account"
  },

  velocity: {
    label: "Velocity",
    type: "window_comparison",
    isNew: true,
    measures: {
      new_accounts_opened:    { label: "New Accounts Opened in Period",              col: "DateOpened",         canonical: "open_date" },
      accounts_closed:        { label: "Accounts Closed in Period",                  col: "DateClosed",         canonical: "close_date" },
      balance_growth:         { label: "Balance Change (recent vs prior)",           col: "Outstanding_Balance",canonical: "current_balance" },
      overdue_acceleration:   { label: "Overdue Amount Acceleration",                col: "Over_due_amount",    canonical: "overdue_amount" },
      dpd_frequency_change:   { label: "Change in DPD Frequency",                   col: "DPD",               canonical: "dpd" },
      lender_count_change:    { label: "Change in Number of Lenders",               col: "MemberShortName",   canonical: "lender_id" }
    },
    aggregations: ["difference", "ratio", "growth_rate"],
    agg_params: {},
    filters: ["loan_type", "secured"],
    windows: [],
    window_pairs: [["3m","6m"],["6m","12m"],["3m","12m"],["12m","24m"]],
    multi_window: false, needs_window: true, time_context: false,
    post: [], color: "ft-vel", entity: "account"
  },

  // ── ✅ NEW: Recency ──────────────────────────────────────────────
  recency: {
    label: "Recency",
    type: "time_since",
    isNew: true,
    measures: {
      months_since_last_acc_open:    { label: "Months Since Last Account Opened",     col: "DateOpened",      canonical: "open_date" },
      months_since_last_acc_close:   { label: "Months Since Last Account Closed",     col: "DateClosed",      canonical: "close_date" },
      months_since_last_acc_delq:    { label: "Months Since Last Delinquency",         col: "DateReported",    canonical: "dpd" },
      months_since_last_acc_wo:      { label: "Months Since Last Write-Off",           col: "writeoff_flag",   canonical: "writeoff_flag" },
      months_since_last_acc_npa:     { label: "Months Since Last NPA Status",          col: "AccountStatus",   canonical: "status" },
      months_since_last_acc_settled: { label: "Months Since Last Settlement",          col: "settlement_amt",  canonical: "settled_flag" },
      months_since_last_acc_overdue: { label: "Months Since Last Overdue Event",       col: "Over_due_amount", canonical: "overdue_amount" },
      months_since_oldest_acc:       { label: "Months Since Oldest Account Opened",    col: "DateOpened",      canonical: "open_date" },
      months_since_newest_acc:       { label: "Months Since Newest Account Opened",    col: "DateOpened",      canonical: "open_date" }
    },
    aggregations: ["value", "min", "max"],
    agg_params: {},
    filters: ["loan_type", "secured"],
    windows: [],
    multi_window: false, needs_window: false, time_context: false,
    post: ["cap"], color: "ft-rec", entity: "account"
  },

  // ── ✅ NEW: Trend ────────────────────────────────────────────────
  trend: {
    label: "Trend",
    type: "window_comparison",
    isNew: true,
    measures: {
      balance_change:          { label: "Balance Change (Window vs Prior)",              col: "Outstanding_Balance", canonical: "current_balance" },
      overdue_change:          { label: "Overdue Amount Change",                          col: "Over_due_amount",     canonical: "overdue_amount" },
      account_count_change:    { label: "Account Count Change",                           col: "account_id",          canonical: "account_id" },
      lender_count_chg:        { label: "Lender Count Change",                            col: "MemberShortName",     canonical: "lender_id" },
      dpd_change:              { label: "DPD Level Change",                               col: "DPD",                 canonical: "dpd" },
      utilization_change_acc:  { label: "Utilization Change (Balance / Sanction)",        col: "CreditLimit",         canonical: "credit_limit" },
      emi_change:              { label: "EMI Obligation Change",                          col: "EMI",                 canonical: "emi_amount" }
    },
    aggregations: ["difference", "growth_rate", "ratio", "slope"],
    agg_params: {},
    filters: ["loan_type", "secured"],
    windows: [],
    window_pairs: [["3m","6m"],["3m","12m"],["6m","12m"],["6m","24m"],["12m","24m"]],
    multi_window: false, needs_window: true, time_context: false,
    post: [], color: "ft-trend", entity: "account"
  },

  // ── ✅ NEW: Distribution ─────────────────────────────────────────
  distribution: {
    label: "Distribution",
    type: "shape_metric",
    isNew: true,
    named_output: true,
    measures: {
      balance_distribution:      { label: "Outstanding Balance",     col: "Outstanding_Balance", canonical: "current_balance", out_stem: "balance" },
      credit_limit_distribution: { label: "Credit Limit",            col: "CreditLimit",         canonical: "credit_limit",    out_stem: "credit_limit" },
      sanction_distribution:     { label: "Sanctioned Amount",       col: "Sanction_Amount",     canonical: "sanction_amount", out_stem: "exposure" },
      overdue_distribution:      { label: "Overdue Amount",          col: "Over_due_amount",     canonical: "overdue_amount",  out_stem: "overdue" },
      emi_distribution:          { label: "EMI Amount",              col: "EMI",                 canonical: "emi_amount",      out_stem: "emi" },
      dpd_distribution:          { label: "DPD (Across Accounts)",   col: "DPD",                 canonical: "dpd",             out_stem: "dpd" }
    },
    agg_out_suffix: { std:"stddev", variance:"variance", cv:"cv", percentile:"p{PCT}", iqr:"iqr", median:"median", skew:"skew" },
    aggregations: ["std", "variance", "cv", "percentile", "iqr", "median", "skew"],
    agg_params: { std:{ min_rec:2 }, variance:{ min_rec:2 }, cv:{ min_rec:2 }, percentile:{ needs_pct:true }, skew:{ min_rec:5 }, iqr:{ min_rec:2 } },
    filters: ["loan_type", "secured", "status"],
    windows: ["6m","12m","24m"],
    multi_window: false, needs_window: false, time_context: true,
    post: [], color: "ft-dis", entity: "account"
  },

  // ── ✅ NEW: Concentration ────────────────────────────────────────
  concentration: {
    label: "Concentration",
    type: "concentration",
    isNew: true,
    named_output: true,
    measures: {
      top_lender_exposure_ratio: { label: "Top Lender Exposure Ratio",      col: "Outstanding_Balance", canonical: "current_balance", formula: "MAX_LENDER_SHARE(balance)",         out_name: "top_lender_exposure_ratio" },
      top_3_lender_share:        { label: "Top 3 Lenders Share",            col: "Outstanding_Balance", canonical: "current_balance", formula: "SUM_TOP3_LENDER_SHARE(balance)",   out_name: "top_3_lender_share" },
      lender_concentration_index:{ label: "Lender Concentration Index (HHI)",col: "Sanction_Amount",    canonical: "sanction_amount", formula: "HHI(lender_exposure_shares)",      out_name: "lender_concentration_index" },
      top_lender_count_share:    { label: "Top Lender Account Count Share", col: "MemberShortName",    canonical: "lender_id",       formula: "MAX_LENDER_CNT_SHARE(accounts)",   out_name: "top_lender_count_share" },
      loan_type_concentration:   { label: "Loan Type Concentration (HHI)",  col: "AccountType",        canonical: "loan_type",       formula: "HHI(loan_type_balance_shares)",    out_name: "loan_type_concentration" },
      single_lender_flag:        { label: "Single Lender Dominance (>80%)", col: "MemberShortName",    canonical: "lender_id",       formula: "FLAG: top_lender_share > 0.8",     out_name: "single_lender_flag" }
    },
    aggregations: ["ratio", "index", "count", "flag"],
    agg_params: {},
    filters: ["loan_type", "secured", "status"],
    windows: ["6m","12m","24m"],
    multi_window: false, needs_window: false, time_context: false,
    post: [], color: "ft-con", entity: "account"
  },

  // ── ✅ NEW: Vintage / Age ────────────────────────────────────────
  vintage: {
    label: "Vintage / Age",
    type: "age_metric",
    isNew: true,
    named_output: true,
    measures: {
      avg_account_age:         { label: "Average Account Age (months)",          col: "DateOpened", canonical: "open_date", formula: "AVG(months_since_open)",         out_name: "avg_account_age" },
      oldest_account_age:      { label: "Oldest Account Age (months)",           col: "DateOpened", canonical: "open_date", formula: "MAX(months_since_open)",         out_name: "oldest_account_age" },
      newest_account_age:      { label: "Newest Account Age (months)",           col: "DateOpened", canonical: "open_date", formula: "MIN(months_since_open)",         out_name: "newest_account_age" },
      account_age_avg:         { label: "Account Age Avg (all products)",        col: "DateOpened", canonical: "open_date", formula: "AVG(tenure_months)",             out_name: "account_age_avg" },
      new_accounts_last_6m:    { label: "New Accounts Opened (Last 6m)",         col: "DateOpened", canonical: "open_date", formula: "COUNT(open_date >= T-6m)",       out_name: "new_accounts_last_6m" },
      new_accounts_last_12m:   { label: "New Accounts Opened (Last 12m)",        col: "DateOpened", canonical: "open_date", formula: "COUNT(open_date >= T-12m)",      out_name: "new_accounts_last_12m" },
      closed_accounts_last_12m:{ label: "Closed Accounts (Last 12m)",            col: "CloseDate",  canonical: "close_date",formula: "COUNT(close_date >= T-12m)",     out_name: "closed_accounts_last_12m" },
      closed_accounts_last_6m: { label: "Closed Accounts (Last 6m)",             col: "CloseDate",  canonical: "close_date",formula: "COUNT(close_date >= T-6m)",      out_name: "closed_accounts_last_6m" },
      weighted_avg_age:        { label: "Weighted Avg Age (by Balance)",          col: "DateOpened", canonical: "open_date", formula: "Σ(balance × tenure) / Σbalance", out_name: "weighted_avg_age" }
    },
    aggregations: ["avg", "max", "min", "count", "median"],
    agg_params: {},
    filters: ["loan_type", "secured", "status"],
    windows: ["6m","12m","24m","36m"],
    multi_window: false, needs_window: false, time_context: false,
    post: ["cap"], color: "ft-vint", entity: "account"
  },

  // ── ✅ NEW: Utilization (Balance vs Sanction) ────────────────────
  utilization: {
    label: "Utilization",
    type: "ratio",
    isNew: true,
    named_output: true,
    measures: {
      acc_credit_utilization:  { label: "Portfolio Credit Utilization (SUM bal / SUM limit)", col: "CreditLimit", canonical: "credit_limit", formula: "SUM(Outstanding_Balance) / SUM(CreditLimit)", out_name: "acc_credit_utilization" },
      credit_utilization_ratio:{ label: "Credit Utilization Ratio (Avg per account)",          col: "CreditLimit", canonical: "credit_limit", formula: "AVG(Outstanding_Balance / CreditLimit)",      out_name: "credit_utilization_ratio" },
      balance_to_limit_ratio:  { label: "Balance to Credit Limit Ratio (per account avg)",     col: "CreditLimit", canonical: "credit_limit", formula: "AVG(balance / credit_limit) per account",    out_name: "balance_to_limit_ratio" },
      max_util_single_account: { label: "Max Utilization (Worst Single Account)",              col: "CreditLimit", canonical: "credit_limit", formula: "MAX(balance / credit_limit)",                out_name: "max_util_single_account" },
      high_util_accounts_ratio:{ label: "High Utilization Account Ratio (>75%)",               col: "CreditLimit", canonical: "credit_limit", formula: "COUNT(util>0.75) / COUNT(all)",              out_name: "high_util_accounts_ratio" },
      util_above_80_count:     { label: "Count Accounts Util > 80%",                           col: "CreditLimit", canonical: "credit_limit", formula: "COUNT WHERE balance/limit > 0.80",           out_name: "util_above_80_count" },
      util_above_90_count:     { label: "Count Accounts Util > 90% (maxed out)",               col: "CreditLimit", canonical: "credit_limit", formula: "COUNT WHERE balance/limit > 0.90",           out_name: "util_above_90_count" },
      balance_to_sanction_ratio:{ label: "Balance to Sanction Ratio (Portfolio)",              col: "Sanction_Amount", canonical: "sanction_amount", formula: "SUM(balance) / SUM(sanction)",       out_name: "balance_to_sanction_ratio" },
      overdue_to_outstanding:  { label: "Overdue to Outstanding Ratio",                         col: "Over_due_amount", canonical: "overdue_amount",  formula: "SUM(overdue) / SUM(outstanding)",    out_name: "overdue_to_outstanding" },
      emi_to_outstanding:      { label: "Total EMI to Total Outstanding Ratio",                 col: "EMI", canonical: "emi_amount",                    formula: "SUM(EMI) / SUM(outstanding)",        out_name: "emi_to_outstanding" }
    },
    aggregations: ["ratio", "avg", "max", "flag", "count"],
    agg_params: {},
    filters: ["loan_type", "secured"],
    windows: ["3m","6m","12m"],
    multi_window: false, needs_window: false, time_context: false,
    post: ["cap"], color: "ft-util", entity: "account"
  },

  // ── ✅ NEW: Product Mix ──────────────────────────────────────────
  product_mix: {
    label: "Product Mix",
    type: "diversity_metric",
    isNew: true,
    measures: {
      product_mix_score:        { label: "Product Mix Score (diversity index)",          col: "AccountType",         canonical: "loan_type" },
      unique_product_count:     { label: "Unique Product / Loan Type Count",             col: "AccountType",         canonical: "loan_type" },
      product_hhi:              { label: "Product HHI (portfolio concentration)",        col: "AccountType",         canonical: "loan_type" },
      secured_product_share:    { label: "Secured Product Share (% of portfolio)",       col: "Sanction_Amount",     canonical: "sanction_amount" },
      revolving_product_share:  { label: "Revolving Product Share (CC/OD)",              col: "AccountType",         canonical: "loan_type" },
      installment_product_share:{ label: "Installment Product Share (HL/AL/PL)",         col: "AccountType",         canonical: "loan_type" },
      cc_to_total_ratio:        { label: "Credit Card to Total Accounts Ratio",           col: "AccountType",         canonical: "loan_type" },
      hl_to_total_ratio:        { label: "Home Loan to Total Exposure Ratio",             col: "Sanction_Amount",     canonical: "sanction_amount" },
      unsecured_product_count:  { label: "Unsecured Product Count",                       col: "AccountType",         canonical: "loan_type" }
    },
    aggregations: ["ratio", "count", "index", "avg"],
    agg_params: {},
    filters: ["status"],
    windows: ["6m","12m","24m"],
    multi_window: false, needs_window: false, time_context: false,
    post: [], color: "ft-mix", entity: "account"
  },

  // ── ✅ NEW: Account Lifecycle ────────────────────────────────────
  lifecycle: {
    label: "Account Lifecycle",
    type: "temporal_count",
    isNew: true,
    measures: {
      new_accounts_opened:      { label: "New Accounts Opened in Period",                col: "DateOpened",          canonical: "open_date" },
      accounts_closed_period:   { label: "Accounts Closed in Period",                    col: "DateClosed",          canonical: "close_date" },
      net_account_change:       { label: "Net Account Change (Opened − Closed)",          col: "DateOpened",          canonical: "open_date" },
      newly_opened_balance:     { label: "Total Balance of Newly Opened Accounts",        col: "Outstanding_Balance", canonical: "current_balance" },
      newly_closed_balance:     { label: "Total Balance of Closed Accounts",              col: "Outstanding_Balance", canonical: "current_balance" },
      new_to_total_ratio:       { label: "New Accounts / Total Accounts Ratio",            col: "DateOpened",          canonical: "open_date" },
      churned_account_ratio:    { label: "Churned Account Ratio (Closed / All)",           col: "DateClosed",          canonical: "close_date" },
      first_account_age:        { label: "Age of First Account (months from opening)",    col: "DateOpened",          canonical: "open_date" },
      avg_age_new_accounts:     { label: "Avg Age of Accounts Opened in Period",          col: "DateOpened",          canonical: "open_date" }
    },
    aggregations: ["count", "sum", "ratio", "avg"],
    agg_params: {},
    filters: ["loan_type", "secured"],
    windows: ["3m","6m","12m","24m","36m"],
    multi_window: true, needs_window: true, time_context: true,
    post: ["log"], color: "ft-vol", entity: "account"
  },

  // ── ✅ NEW: Delinquency Severity ─────────────────────────────────
  delinquency_severity: {
    label: "Delinquency Severity",
    type: "severity_metric",
    isNew: true,
    measures: {
      dpd_90plus_accounts:      { label: "Count of Accounts with DPD ≥ 90",              col: "DPD",                 canonical: "dpd" },
      dpd_60plus_accounts:      { label: "Count of Accounts with DPD ≥ 60",              col: "DPD",                 canonical: "dpd" },
      dpd_30plus_accounts:      { label: "Count of Accounts with DPD ≥ 30",              col: "DPD",                 canonical: "dpd" },
      dpd_severity_index:       { label: "DPD Severity Index (weighted bucket score)",    col: "DPD",                 canonical: "dpd" },
      max_dpd_across_accounts:  { label: "Maximum DPD Across All Accounts",               col: "DPD",                 canonical: "dpd" },
      avg_dpd_delinquent:       { label: "Average DPD (Delinquent Accounts Only)",        col: "DPD",                 canonical: "dpd" },
      dpd_bucket_score:         { label: "DPD Bucket Score (0=clean … 5=NPA)",            col: "DPD",                 canonical: "dpd" },
      severe_delinquency_ratio: { label: "Severe Delinquency Ratio (90+ DPD / Total)",   col: "DPD",                 canonical: "dpd" },
      overdue_severity_amount:  { label: "Overdue Amount in Severely Delinquent Accounts",col: "Over_due_amount",     canonical: "overdue_amount" },
      npa_exposure_ratio:       { label: "NPA Exposure as % of Total Outstanding",        col: "Outstanding_Balance", canonical: "current_balance" }
    },
    aggregations: ["count", "ratio", "max", "avg", "index", "flag"],
    agg_params: {},
    filters: ["loan_type", "secured", "status"],
    windows: ["6m","12m","24m","36m"],
    multi_window: false, needs_window: false, time_context: true,
    post: [], color: "ft-del", entity: "account"
  },

  // ── ✅ NEW: Cross Entity ─────────────────────────────────────────
  cross_entity: {
    label: "Cross Entity",
    type: "entity_join",
    isNew: true,
    measures: {
      accounts_with_inquiry_last_30d:  { label: "Accounts with Inquiry in Last 30 Days",   col: "CustomerID",          canonical: "account_id" },
      accounts_with_inquiry_last_90d:  { label: "Accounts with Inquiry in Last 90 Days",   col: "CustomerID",          canonical: "account_id" },
      inquiry_count_on_active_accs:    { label: "Inquiry Count on Active Accounts",          col: "CustomerID",          canonical: "account_id" },
      inquiry_to_account_ratio:        { label: "Inquiry to Account Count Ratio",             col: "CustomerID",          canonical: "account_id" },
      trade_to_account_balance_ratio:  { label: "Trade Balance / Account Balance Ratio",     col: "Outstanding_Balance", canonical: "current_balance" },
      accounts_with_trade_dpd:         { label: "Accounts Matched to Trade DPD Event",       col: "DPD",                 canonical: "dpd" },
      cross_entity_util_rate:          { label: "Cross-Entity Utilization Rate",              col: "CreditLimit",         canonical: "credit_limit" },
      inq_count_per_active_lender:     { label: "Inquiry Count per Active Lender",            col: "MemberShortName",     canonical: "lender_id" },
      trade_overdue_on_acc_portfolio:  { label: "Trade Overdue Matched to Account Portfolio", col: "Over_due_amount",     canonical: "overdue_amount" }
    },
    aggregations: ["count", "ratio", "flag", "avg"],
    agg_params: {},
    filters: ["loan_type", "secured"],
    windows: ["1m","3m","6m","12m"],
    multi_window: false, needs_window: true, time_context: true,
    post: [], color: "ft-con", entity: "account",
    cross_entity_join: true
  },

  // ── ✅ NEW: Utilization Engine (formula-driven) ───────────────────
  utilization_engine: {
    label: "Utilization Engine",
    type: "formula_ratio",
    isNew: true,
    utilization_engine: true,
    measures: {
      credit_utilization_ratio:   { label: "Credit Utilization Ratio (Balance ÷ Credit Limit)",       col: "CreditLimit",           canonical: "credit_limit",    formula: "Outstanding_Balance / CreditLimit" },
      balance_to_sanction_ratio:  { label: "Balance to Sanction Ratio (Balance ÷ Sanction Amount)",   col: "Sanction_Amount",       canonical: "sanction_amount", formula: "Outstanding_Balance / Sanction_Amount" },
      overdue_to_balance_ratio:   { label: "Overdue to Balance Ratio (Overdue ÷ Outstanding)",        col: "Over_due_amount",       canonical: "overdue_amount",  formula: "Over_due_amount / Outstanding_Balance" },
      emi_to_limit_ratio:         { label: "EMI to Credit Limit Ratio",                               col: "CreditLimit",           canonical: "credit_limit",    formula: "EMI / CreditLimit" },
      avg_utilization:            { label: "Average Utilization (All Accounts)",                       col: "CreditLimit",           canonical: "credit_limit",    formula: "AVG(Outstanding_Balance / CreditLimit) across accounts" },
      max_utilization_account:    { label: "Max Utilization (Worst Single Account)",                   col: "CreditLimit",           canonical: "credit_limit",    formula: "MAX(Outstanding_Balance / CreditLimit)" },
      high_util_accounts:         { label: "Count of High Utilization Accounts (>75%)",                col: "CreditLimit",           canonical: "credit_limit",    formula: "COUNT WHERE Outstanding_Balance / CreditLimit > 0.75" },
      high_util_accounts_ratio:   { label: "High Utilization Account Ratio (>75% / Total)",           col: "CreditLimit",           canonical: "credit_limit",    formula: "COUNT(util>0.75) / COUNT(total)" },
      util_above_80:              { label: "Count of Accounts with Utilization > 80%",                 col: "CreditLimit",           canonical: "credit_limit",    formula: "COUNT WHERE Outstanding_Balance / CreditLimit > 0.80" },
      util_above_90:              { label: "Count of Maxed-Out Accounts (>90%)",                       col: "CreditLimit",           canonical: "credit_limit",    formula: "COUNT WHERE Outstanding_Balance / CreditLimit > 0.90" },
      avg_utilization_12m:        { label: "Average Utilization (Last 12 Months)",                    col: "CreditLimit",           canonical: "credit_limit",    formula: "AVG_MONTHLY(Outstanding_Balance / CreditLimit, 12m)" },
      max_utilization_12m:        { label: "Max Utilization (Last 12 Months)",                        col: "CreditLimit",           canonical: "credit_limit",    formula: "MAX_MONTHLY(Outstanding_Balance / CreditLimit, 12m)" },
      utilization_trend:          { label: "Utilization Trend (Change in Ratio)",                     col: "CreditLimit",           canonical: "credit_limit",    formula: "util_ratio_recent - util_ratio_prior" },
      utilization_volatility:     { label: "Utilization Volatility (StdDev across months)",           col: "CreditLimit",           canonical: "credit_limit",    formula: "STDDEV(Monthly_Util_Ratio) over window" },
      weighted_util:              { label: "Balance-Weighted Average Utilization",                    col: "CreditLimit",           canonical: "credit_limit",    formula: "Σ(balance_i × util_i) / Σ(balance_i)" }
    },
    aggregations: ["ratio", "avg", "max", "count", "flag", "std", "percentile"],
    agg_params: { percentile:{ needs_pct:true }, std:{ min_rec:3, note:"Requires ≥3 monthly observations" } },
    filters: ["loan_type", "secured", "status"],
    windows: ["3m","6m","12m","24m"],
    multi_window: true, needs_window: true, time_context: true,
    post: ["cap"], color: "ft-util", entity: "account"
  },

  // ── ✅ NEW: Payment Behavior ─────────────────────────────────────
  payment_behavior: {
    label: "Payment Behavior",
    type: "behavioral_sequence",
    isNew: true,
    measures: {
      on_time_payment_ratio:      { label: "On-Time Payment Ratio (DPD=0 months / Total)",           col: "DPD",                   canonical: "dpd",             formula: "COUNT(DPD=0) / COUNT(all months) in window" },
      missed_payment_count:       { label: "Missed Payment Count (DPD>0 events)",                     col: "DPD",                   canonical: "dpd",             formula: "COUNT(months WHERE DPD > 0)" },
      dpd_transition_rate:        { label: "DPD Transition Rate (clean→delinquent)",                  col: "DPD",                   canonical: "dpd",             formula: "COUNT(DPD(t)=0 AND DPD(t+1)>0) / COUNT(DPD(t)=0)" },
      rolling_dpd_trend:          { label: "Rolling DPD Trend (slope of DPD over window)",            col: "DPD",                   canonical: "dpd",             formula: "OLS_slope(DPD(t), window)" },
      consecutive_clean_months:   { label: "Consecutive Clean Months (DPD=0 streak)",                 col: "DPD",                   canonical: "dpd",             formula: "MAX consecutive months WHERE DPD=0" },
      consecutive_dpd_months:     { label: "Consecutive DPD Months (delinquency streak)",             col: "DPD",                   canonical: "dpd",             formula: "MAX consecutive months WHERE DPD > 0" },
      payment_consistency_score:  { label: "Payment Consistency Score (0–100)",                       col: "DPD",                   canonical: "dpd",             formula: "(1 - missed_ratio) × 100, normalized" },
      ever_missed_12m:            { label: "Ever Missed Payment in Last 12m (flag)",                  col: "DPD",                   canonical: "dpd",             formula: "FLAG: any DPD > 0 in last 12 months" },
      avg_dpd_when_delinquent:    { label: "Average DPD When Delinquent",                             col: "DPD",                   canonical: "dpd",             formula: "AVG(DPD) WHERE DPD > 0" },
      improvement_indicator:      { label: "Payment Improvement Indicator (DPD falling trend)",       col: "DPD",                   canonical: "dpd",             formula: "FLAG: rolling_dpd_slope < 0 AND recent_dpd < prior_dpd" },
      delinquency_frequency:      { label: "Delinquency Frequency (DPD events / window months)",      col: "DPD",                   canonical: "dpd",             formula: "COUNT(DPD>0 months) / window_months" }
    },
    aggregations: ["ratio", "count", "avg", "flag", "slope", "value"],
    agg_params: { slope:{ min_rec:6, note:"Trend slope requires ≥6 monthly observations" } },
    filters: ["loan_type", "secured", "status"],
    windows: ["3m","6m","12m","24m","36m"],
    multi_window: false, needs_window: true, time_context: true,
    post: ["cap"], color: "ft-del", entity: "account"
  },

  // ── ✅ NEW: Credit Mix ───────────────────────────────────────────
  credit_mix: {
    label: "Credit Mix",
    type: "diversity_score",
    isNew: true,
    measures: {
      credit_mix_score:           { label: "Credit Mix Score (composite diversity index)",             col: "AccountType",           canonical: "loan_type",       formula: "Weighted score: secured + revolving + installment diversity" },
      secured_to_unsecured_ratio: { label: "Secured to Unsecured Ratio (count-based)",               col: "Sanction_Amount",       canonical: "sanction_amount", formula: "COUNT(secured) / COUNT(unsecured)" },
      secured_exposure_ratio:     { label: "Secured Exposure Ratio (balance-based)",                  col: "Outstanding_Balance",   canonical: "current_balance", formula: "SUM(bal, secured) / SUM(bal, all)" },
      loan_type_diversity:        { label: "Loan Type Diversity Index (Shannon entropy)",              col: "AccountType",           canonical: "loan_type",       formula: "-Σ(p_i × log(p_i)) across loan types" },
      revolving_to_installment:   { label: "Revolving to Installment Count Ratio",                    col: "AccountType",           canonical: "loan_type",       formula: "COUNT(CC+OD) / COUNT(HL+AL+PL+GL)" },
      has_both_types:             { label: "Has Both Secured and Unsecured (flag)",                   col: "Sanction_Amount",       canonical: "sanction_amount", formula: "FLAG: COUNT(secured)>0 AND COUNT(unsecured)>0" },
      unsecured_exposure_share:   { label: "Unsecured Exposure Share (% of total balance)",           col: "Outstanding_Balance",   canonical: "current_balance", formula: "SUM(bal, unsecured) / SUM(bal, all)" },
      dominant_product_share:     { label: "Dominant Product Share (top loan type %)",                col: "AccountType",           canonical: "loan_type",       formula: "MAX(count_per_type) / COUNT(all)" },
      cc_exposure_share:          { label: "CC Exposure Share (% of total balance)",                  col: "Outstanding_Balance",   canonical: "current_balance", formula: "SUM(bal, CC) / SUM(bal, all)" },
      hl_exposure_share:          { label: "HL Exposure Share (% of total balance)",                  col: "Outstanding_Balance",   canonical: "current_balance", formula: "SUM(bal, HL) / SUM(bal, all)" },
      pl_unsecured_dominance:     { label: "PL + CC Unsecured Dominance Ratio",                       col: "AccountType",           canonical: "loan_type",       formula: "COUNT(PL+CC) / COUNT(all)" }
    },
    aggregations: ["ratio", "index", "count", "flag", "avg"],
    agg_params: {},
    filters: ["status"],
    windows: ["6m","12m","24m"],
    multi_window: false, needs_window: false, time_context: false,
    post: [], color: "ft-mix", entity: "account"
  }
};

// Bureau Canonical Mapping
const BUREAU_CANON_MAP = {
  CIBIL: {
    account_id: "AccountNumber", loan_type: "AccountType", status: "AccountStatus",
    open_date: "OpenDate", close_date: "CloseDate", sanction_amount: "SanctionAmt",
    current_balance: "CurrentBalance", credit_limit: "CreditLimit",
    overdue_amount: "AmountOverdue", dpd: "DPD", emi_amount: "EMIAmount",
    secured_flag: "CollateralType", ownership_type: "OwnershipIndicator",
    lender_id: "MemberShortName", writeoff_flag: "WriteOffAmount",
    settled_flag: "SettlementAmount", suit_flag: "SuitFiledStatus"
  },
  CRIF: {
    account_id: "account_number", loan_type: "product_code", status: "account_status",
    open_date: "open_date", close_date: "close_date", sanction_amount: "sanctioned_amount",
    current_balance: "current_balance", credit_limit: "credit_limit",
    overdue_amount: "overdue_amount", dpd: "days_past_due", emi_amount: "emi",
    secured_flag: "secured_indicator", ownership_type: "account_type_ind",
    lender_id: "subscriber_name", writeoff_flag: "write_off_amount",
    settled_flag: "settlement_amount", suit_flag: "suit_filed"
  },
  Equifax: {
    account_id: "ACCT_NUMBER", loan_type: "ACCT_TYPE", status: "ACCT_STATUS",
    open_date: "OPEN_DT", close_date: "CLOSE_DT", sanction_amount: "HIGHEST_CREDIT",
    current_balance: "CUR_BAL", credit_limit: "CREDIT_LIMIT",
    overdue_amount: "AMOUNT_PAST_DUE", dpd: "DPD", emi_amount: "INSTALLMENT_AMT",
    secured_flag: "COLLATERAL_TYPE", ownership_type: "ACCT_OWNERSHIP",
    lender_id: "MEMBER_NAME", writeoff_flag: "CHARGE_OFF_AMT",
    settled_flag: "SETTLEMENT_AMT", suit_flag: "SUIT_FILED"
  }
};
// All missing sub-cats + full distribution stats + balance types + date columns
// ══════════════════════════════════════════
const TRD_SCHEMA = {

  exposure: {
    label:"Exposure",
    type:"aggregation",
    isNew: false,
    measures:{
      sanctioned_amount: { label:"Sanctioned Amount",   col:"Sanction_Amount" },
      current_balance:   { label:"Outstanding Balance", col:"Outstanding_Balance" },
      overdue_amount:    { label:"Overdue Amount",       col:"Over_due_amount" },
      credit_limit:      { label:"Credit Limit",         col:"CreditLimit" },
      emi_amount:        { label:"EMI Amount",            col:"EMI" },
      high_credit:       { label:"High Credit Amount",   col:"High_Credit_Amount" },
      writeoff_amount:   { label:"Writeoff Amount",      col:"writeoff_amt_tot" },
      settlement_amount: { label:"Settlement Amount",    col:"settlement_amt" }
    },
    // ✅ Distribution stats: median, std, variance, cv, skew, kurtosis, IQR, outlier_count
    aggregations:["sum","avg","max","min","count","median","std","variance","cv","skew","kurtosis","iqr","outlier_count","percentile"],
    agg_params:{std:{min_rec:2},variance:{min_rec:2},cv:{min_rec:2},skew:{min_rec:3},kurtosis:{min_rec:4},iqr:{min_rec:4},outlier_count:{min_rec:5},percentile:{needs_pct_multi:true}},
    filters:["dpd","overdue","flag","lender"],
    windows:["1m","3m","6m","12m","24m","36m"], // ✅ Full time range
    time_based:true, multi_window:true, needs_window:true,
    post:["log","cap"], color:"ft-exp", entity:"tradeline"
  },

  volume: {
    label:"Volume",
    type:"aggregation",
    isNew: false,
    measures:{
      active_count:    { label:"Active Account Count",  col:"AccountStatus" },
      closed_count:    { label:"Closed Account Count",  col:"AccountStatus" },
      total_count:     { label:"Total Account Count",   col:"AccountStatus" },
      disbursed_count: { label:"Disbursed Count",        col:"DateDisbursed" },
      writeoff_count:  { label:"Writeoff Count",         col:"writeoff_amt_tot" },
      settled_count:   { label:"Settled Count",          col:"settlement_amt" },
      suitfiled_count: { label:"Suit Filed Count",        col:"SuitFiled_Flag" }
    },
    aggregations:["count","sum"],
    agg_params:{},
    filters:["lender","product"],
    windows:["1m","3m","6m","12m","24m","36m"], // ✅ Full time range
    time_based:true, multi_window:true, needs_window:true,
    post:[], color:"ft-vol", entity:"tradeline"
  },

  delinquency: {
    label:"Delinquency",
    type:"aggregation",
    isNew: false,
    measures:{
      dpd:            { label:"Days Past Due (DPD)",       col:"DPD" },
      overdue_amount: { label:"Overdue Amount",             col:"Over_due_amount" },
      dpd_30:         { label:"DPD 30+ Count (SMA)",        col:"DPD" },
      dpd_60:         { label:"DPD 60+ Count (Sub-std)",    col:"DPD" },
      dpd_90:         { label:"DPD 90+ / NPA Count",        col:"DPD" },
      delinquent_flag:{ label:"Ever Delinquent Flag",       col:"DPD" }
    },
    // ✅ Distribution stats: full set
    aggregations:["count","max","avg","ratio","flag","median","std","variance","cv","skew","kurtosis","iqr","outlier_count"],
    agg_params:{std:{min_rec:2},variance:{min_rec:2},cv:{min_rec:2},skew:{min_rec:3},kurtosis:{min_rec:4},iqr:{min_rec:4},outlier_count:{min_rec:5}},
    filters:["dpd","overdue","flag","lender"],
    windows:["3m","6m","12m","24m","36m"],
    time_based:true, multi_window:true, needs_window:true,
    binary_measures:["ever_dpd90_flag"], binary_agg_restriction:["count","ratio","flag"],
    post:[], color:"ft-del", entity:"tradeline"
  },

  utilization: {
    label:"Utilization",
    type:"derived_ratio",
    isNew: false,
    measures:{
      utilization_ratio:  { label:"Balance / Credit Limit",      col:"Outstanding_Balance / CreditLimit" },
      high_util_flag:     { label:"High Utilization Flag",       col:"CreditLimit" },
      avg_utilization:    { label:"Average Utilization (6m)",    col:"CreditLimit" },
      max_utilization:    { label:"Max Utilization (peak)",      col:"CreditLimit" }
    },
    // ✅ Distribution stats added: median, std, cv
    aggregations:["avg","max","min","median","std","cv","ratio","flag"],
    agg_params:{std:{min_rec:2},cv:{min_rec:2}},
    filters:["util","lender"],
    windows:["1m","3m","6m","12m","24m"], // ✅ Added 1m, 3m
    time_based:true, multi_window:false, needs_window:true,
    post:["cap"], color:"ft-util", entity:"tradeline"
  },

  vintage: {
    label:"Vintage",
    type:"point_in_time",
    isNew: false,
    measures:{
      account_age:         { label:"Account Age (months)",         col:"DateOpened" },
      months_since_oldest: { label:"Months Since Oldest Account",  col:"DateOpened" },
      months_since_newest: { label:"Months Since Newest Account",  col:"DateOpened" },
      months_since_first_delq:{ label:"Months Since First Delinquency", col:"DateReported" }
    },
    aggregations:["avg","min","max","value"],
    agg_params:{},
    filters:[],
    windows:[], multi_window:false, needs_window:false,
    post:["cap"], color:"ft-vint", entity:"tradeline"
  },

  // ✅ FULLY IMPLEMENTED: Recency Sub-Category — Event-Recency Engine + DPD-Threshold Builder
  recency: {
    label:"Recency",
    type:"point_in_time",
    isNew: true,
    measures:{
      // DPD Threshold-Specific (most requested)
      months_since_last_dpd30:       { label:"Months Since Last DPD ≥ 30",          col:"DPD", event_filter:{field:"DPD", op:">=", val:30}, group:"dpd" },
      months_since_last_dpd60:       { label:"Months Since Last DPD ≥ 60",          col:"DPD", event_filter:{field:"DPD", op:">=", val:60}, group:"dpd" },
      months_since_last_dpd90:       { label:"Months Since Last DPD ≥ 90 (NPA)",    col:"DPD", event_filter:{field:"DPD", op:">=", val:90}, group:"dpd" },
      months_since_last_dpd_custom:  { label:"Months Since Last DPD (Custom Threshold)", col:"DPD", event_filter:{field:"DPD", op:">=", val:"custom"}, group:"dpd" },
      // Writeoff
      months_since_last_writeoff:    { label:"Months Since Last Writeoff",           col:"writeoff_amt_tot", event_filter:{field:"writeoff_amt_tot", op:">", val:0}, group:"stress" },
      months_since_writeoff_gt:      { label:"Months Since Writeoff > Amount",       col:"writeoff_amt_tot", event_filter:{field:"writeoff_amt_tot", op:">", val:"custom"}, group:"stress" },
      // Payment & Settlement
      months_since_last_payment:     { label:"Months Since Last Payment",            col:"LastPaymentDate", group:"payment" },
      months_since_last_settled:     { label:"Months Since Last Settled Account",    col:"settlement_amt",  event_filter:{field:"settlement_amt", op:">", val:0}, group:"stress" },
      // Account events
      months_since_last_open:        { label:"Months Since Last Account Opened",     col:"DateOpened", group:"account" },
      months_since_last_closed:      { label:"Months Since Last Account Closed",     col:"DateClosed", group:"account" },
      months_since_last_delinquency: { label:"Months Since Last Delinquency",        col:"DateReported", group:"dpd" },
      months_since_last_npa:         { label:"Months Since Last NPA Status",         col:"AccountStatus", event_filter:{field:"AccountStatus", op:"=", val:"NPA"}, group:"stress" },
      months_since_last_suit:        { label:"Months Since Last Suit Filed",         col:"SuitFiled_Flag", event_filter:{field:"SuitFiled_Flag", op:"=", val:1}, group:"stress" },
      months_since_peak_exposure:    { label:"Months Since Peak Exposure",           col:"Outstanding_Balance", event_filter:{field:"Outstanding_Balance", op:"=", val:"peak"}, group:"balance" },
      recency_of_transition:         { label:"Months Since Last Status Transition",  col:"AccountStatus", group:"account" },
    },
    date_column_map:{
      months_since_last_dpd30:       "DPD", months_since_last_dpd60:"DPD", months_since_last_dpd90:"DPD",
      months_since_last_dpd_custom:  "DPD", months_since_last_delinquency:"DateReported",
      months_since_last_writeoff:    "DateReported", months_since_writeoff_gt:"DateReported",
      months_since_last_payment:     "LastPaymentDate", months_since_last_settled:"DateClosed",
      months_since_last_open:        "DateOpened", months_since_last_closed:"DateClosed",
      months_since_last_npa:         "DateReported", months_since_last_suit:"DateReported",
      months_since_peak_exposure:    "DateReported", recency_of_transition:"DateReported",
    },
    recency_formulas:{
      months_since_last_dpd30:      "FLOOR((CurrentDate − MAX(DateReported WHERE DPD >= 30)) / 30)",
      months_since_last_dpd60:      "FLOOR((CurrentDate − MAX(DateReported WHERE DPD >= 60)) / 30)",
      months_since_last_dpd90:      "FLOOR((CurrentDate − MAX(DateReported WHERE DPD >= 90)) / 30)",
      months_since_last_dpd_custom: "FLOOR((CurrentDate − MAX(DateReported WHERE DPD >= {threshold})) / 30)",
      months_since_last_writeoff:   "FLOOR((CurrentDate − MAX(DateReported WHERE writeoff_amt_tot > 0)) / 30)",
      months_since_writeoff_gt:     "FLOOR((CurrentDate − MAX(DateReported WHERE writeoff_amt_tot > {amount})) / 30)",
      months_since_last_settled:    "FLOOR((CurrentDate − MAX(DateClosed WHERE settlement_amt > 0)) / 30)",
      months_since_last_npa:        "FLOOR((CurrentDate − MAX(DateReported WHERE AccountStatus = 'NPA')) / 30)",
      months_since_peak_exposure:   "FLOOR((CurrentDate − DateReported[Outstanding_Balance = MAX(Outstanding_Balance)]) / 30)",
      months_since_last_suit:       "FLOOR((CurrentDate − MAX(DateReported WHERE SuitFiled_Flag = 1)) / 30)",
      recency_of_transition:        "FLOOR((CurrentDate − MAX(StatusChangeDate)) / 30)",
    },
    // Groups for UI grouping in measure picker
    measure_groups:{ dpd:"DPD / Delinquency Events", stress:"Stress Events", payment:"Payment Events", account:"Account Events", balance:"Balance Events" },
    aggregations:["value","min","max"],
    agg_params:{},
    filters:["event_filter"],  // trigger event filter builder
    windows:[], multi_window:false, needs_window:false,
    post:["cap","bucket"], color:"ft-rec", entity:"tradeline",
    supports_acceleration: true
  },

  // ✅ FULLY IMPLEMENTED: Trend Sub-Category — Full Time-Series Engine
  trend: {
    label:"Trend",
    type:"window_comparison",
    isNew: true,
    // Trend computation modes
    trend_modes: {
      window_diff:  { label:"Window Difference",     desc:"Value(recent window) − Value(prior window)",          icon:"⬆️" },
      rolling_slope:{ label:"Rolling OLS Slope",     desc:"Linear regression slope of monthly values in window", icon:"📈" },
      volatility:   { label:"Volatility Trend",      desc:"Std dev of month-over-month changes in window",       icon:"〰️" },
      regression:   { label:"Time-Series Regression",desc:"Full OLS: slope + intercept + R² over window",        icon:"📊" },
      acceleration: { label:"Acceleration",          desc:"Rate-of-change of trend (2nd derivative, 3-window)",  icon:"⚡" },
      classification:{ label:"Behavioral Class",     desc:"Labels trend: improving / deteriorating / stable / volatile", icon:"🏷️" },
    },
    measures:{
      balance_growth:         { label:"Outstanding Balance",             col:"Outstanding_Balance" },
      utilization_change:     { label:"Utilization Rate",                col:"CreditLimit" },
      dpd_trend:              { label:"DPD (Days Past Due)",             col:"DPD" },
      overdue_trend:          { label:"Overdue Amount",                  col:"Over_due_amount" },
      emi_trend:              { label:"EMI Amount",                      col:"EMI" },
      account_count_trend:    { label:"Active Account Count",            col:"AccountStatus" },
      emi_to_bal_trend:       { label:"EMI-to-Balance Ratio",            col:"EMI / Outstanding_Balance" },
      active_count_slope:     { label:"Active Account Slope",            col:"AccountStatus" },
      overdue_volatility:     { label:"Overdue Volatility",             col:"Over_due_amount" },
      balance_volatility_trend:{ label:"Balance Volatility Trend",       col:"Outstanding_Balance" },
    },
    aggregations:["difference","growth_rate","ratio","slope","acceleration","volatility","regression","classification"],
    agg_params:{
      slope:        { needs_rolling_window:true, description:"OLS slope of monthly values within rolling window" },
      volatility:   { needs_rolling_window:true, description:"Std dev of month-over-month changes in window" },
      regression:   { needs_rolling_window:true, description:"Full OLS regression: slope + R² + intercept" },
      acceleration: { needs_triple_window:true,  description:"Rate-of-change of trend (2nd derivative)" },
      classification:{ description:"Labels trend as: improving / deteriorating / stable / volatile" }
    },
    filters:["dpd","overdue"],
    windows:[],
    window_pairs:[["1m","3m"],["1m","6m"],["3m","6m"],["6m","12m"],["3m","12m"],["6m","24m"],["12m","24m"],["12m","36m"]],
    rolling_windows:["3m","6m","12m","24m","36m"],  // for rolling slope / volatility / regression
    window_triples:[["1m","3m","6m"],["3m","6m","12m"],["6m","12m","24m"],["3m","6m","24m"]],
    multi_window:false, needs_window:true,
    post:[], color:"ft-trend", entity:"tradeline"
  },

  // ✅ FULLY IMPLEMENTED: Balance Dynamics Sub-Category — Full Dynamic Balance Engine
  balance_dynamics: {
    label:"Balance Dynamics",
    type:"time_series_balance",
    isNew: true,
    // Balance history computation modes
    balance_modes: {
      point_in_time: { label:"Point-in-Time",      desc:"Balance value at end of window",                      icon:"📍" },
      monthly_series:{ label:"Monthly History",    desc:"Aggregate across all monthly snapshots in window",     icon:"📅" },
      time_weighted: { label:"Time-Weighted Avg",  desc:"Weighted mean (recent months get higher weight)",      icon:"⚖️" },
      rolling_vol:   { label:"Rolling Volatility", desc:"Std dev of month-over-month balance changes",          icon:"〰️" },
      peak_detect:   { label:"Peak Detection",     desc:"Find peak, trough, date of peak in window",           icon:"🏔️" },
      trajectory:    { label:"Trajectory Class",   desc:"Classify as rising / falling / stable / volatile",    icon:"🏷️" },
    },
    measures:{
      outstanding_balance:     { label:"Outstanding Balance",           col:"Outstanding_Balance" },
      overdue_amount:          { label:"Overdue Amount",                col:"Over_due_amount" },
      emi_amount:              { label:"EMI Amount",                    col:"EMI" },
      credit_limit:            { label:"Credit Limit",                  col:"CreditLimit" },
      utilization_rate:        { label:"Utilization Rate",              col:"Outstanding_Balance/CreditLimit" },
      peak_balance:            { label:"Peak Balance (Max in Window)",  col:"Outstanding_Balance" },
      trough_balance:          { label:"Trough Balance (Min in Window)",col:"Outstanding_Balance" },
      avg_monthly_balance:     { label:"Avg Monthly Balance",           col:"Outstanding_Balance" },
      balance_volatility:      { label:"Balance Volatility (Std Dev)",  col:"Outstanding_Balance" },
      balance_cv:              { label:"Balance CV (Volatility/Mean)",  col:"Outstanding_Balance" },
      balance_range:           { label:"Balance Range (Peak−Trough)",   col:"Outstanding_Balance" },
      time_weighted_balance:   { label:"Time-Weighted Avg Balance",     col:"Outstanding_Balance" },
      rolling_balance_vol:     { label:"Rolling Balance Volatility",    col:"Outstanding_Balance" },
      overdue_peak:            { label:"Peak Overdue (Max in Window)",  col:"Over_due_amount" },
      avg_overdue:             { label:"Avg Monthly Overdue",           col:"Over_due_amount" },
      emi_coverage_ratio:      { label:"EMI Coverage Ratio",            col:"EMI/Outstanding_Balance" },
    },
    balance_snapshot_types:["monthly_series","peak","trough","avg_monthly","time_weighted","rolling_volatility","trajectory"],
    aggregations:["max","min","avg","std","cv","value","ratio","slope"],
    agg_params:{std:{min_rec:3},cv:{min_rec:3},slope:{min_rec:4,description:"Trend slope of monthly balance series"}},
    time_weighted_options:{ decay:["linear","exponential","custom"], default:"linear" },
    filters:["dpd","overdue","lender"],
    windows:["3m","6m","12m","24m","36m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["log","cap"], color:"ft-bal", entity:"tradeline"
  },

  writeoff: {
    label:"WriteOff",
    type:"conditional_flag",
    isNew: false,
    measures:{
      writeoff_amount:{ label:"Write-off Amount", col:"writeoff_amt_tot" },
      writeoff_count: { label:"Write-off Count",  col:"writeoff_amt_tot" }
    },
    aggregations:["sum","count","flag","avg"],
    agg_params:{},
    filters:["flag","lender"],
    windows:["6m","12m","24m","36m"],
    time_based:true, multi_window:false, needs_window:true,
    post:[], color:"ft-rest", entity:"tradeline"
  },

  settlement: {
    label:"Settlement",
    type:"conditional_flag",
    isNew: false,
    measures:{
      settlement_amount:{ label:"Settlement Amount", col:"settlement_amt" },
      settlement_count: { label:"Settlement Count",  col:"settlement_amt" }
    },
    aggregations:["sum","count","flag","avg"],
    agg_params:{},
    filters:["flag","lender"],
    windows:["6m","12m","24m","36m"],
    time_based:true, multi_window:false, needs_window:true,
    post:[], color:"ft-rest", entity:"tradeline"
  },

  portfolio_mix: {
    label:"Portfolio Mix",
    type:"segment_ratio",
    isNew: false,
    measures:{
      pl_share:             { label:"PL Exposure Share",           col:"Sanction_Amount" },
      unsecured_share:      { label:"Unsecured Exposure Share",    col:"Sanction_Amount" }, // ✅ Added
      secured_share:        { label:"Secured Exposure Share",      col:"Sanction_Amount" }, // ✅ Added
      cc_share:             { label:"CC Exposure Share",           col:"Sanction_Amount" },
      closed_to_open_ratio: { label:"Closed to Open Ratio",        col:"AccountStatus" },   // ✅ Added
      loan_type_hhi:        { label:"Loan Type HHI",               col:"AccountType" }
    },
    aggregations:["ratio","index","avg"],
    agg_params:{},
    filters:[],
    windows:["6m","12m","24m","36m","48m"],
    multi_window:false, needs_window:true,
    post:[], color:"ft-pmix", entity:"tradeline"
  },

  risk_ratio: {
    label:"Risk Ratio",
    type:"derived_ratio",
    isNew: false,
    measures:{
      foir:                 { label:"FOIR (EMI / Income)",               col:"EMI" },
      lvr:                  { label:"LVR (Loan / Value)",                col:"Sanction_Amount" },
      db_ratio:             { label:"Debt Burden Ratio",                 col:"Outstanding_Balance" },
      delinquent_ratio:     { label:"Delinquent Account Ratio",          col:"DPD" },
      high_utilization_ratio:{ label:"High Utilization Ratio (≥80%)",   col:"CreditLimit" }
    },
    aggregations:["avg","max","min","ratio"],
    agg_params:{},
    filters:["lender","util"],
    windows:["3m","6m","12m","24m","36m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["cap"], color:"ft-util", entity:"tradeline"
  },

  // ════════════════════════════════════════════════════
  // ENTERPRISE ANALYTICS LAYER — NEW SUB-CATEGORIES
  // ════════════════════════════════════════════════════

  transition_matrix: {
    label:"Transition Matrix",
    type:"state_transition",
    isNew: true,
    enterprise: true,
    description: "Tracks status transitions (cure/default) between DPD bands over time",
    measures:{
      dpd_to_dpd0:       { label:"DPD>0 → DPD0 (Cure Rate)",           col:"DPD", transition:{from:"DPD>0", to:"DPD=0"} },
      dpd0_to_dpd30:     { label:"DPD0 → DPD30+ (Default Rate)",       col:"DPD", transition:{from:"DPD=0", to:"DPD>=30"} },
      dpd30_to_dpd90:    { label:"DPD30 → DPD90+ (Worsening)",         col:"DPD", transition:{from:"DPD>=30", to:"DPD>=90"} },
      dpd90_to_dpd0:     { label:"DPD90 → DPD0 (Recovery)",            col:"DPD", transition:{from:"DPD>=90", to:"DPD=0"} },
      active_to_closed:  { label:"Active → Closed (Closure Rate)",     col:"AccountStatus", transition:{from:"Active", to:"Closed"} },
      active_to_npa:     { label:"Active → NPA (NPA Rate)",            col:"AccountStatus", transition:{from:"Active", to:"NPA"} },
      npa_to_active:     { label:"NPA → Active (NPA Cure Rate)",       col:"AccountStatus", transition:{from:"NPA", to:"Active"} },
      upgrade_count:     { label:"DPD Band Upgrade Count",             col:"DPD" },
      downgrade_count:   { label:"DPD Band Downgrade Count",           col:"DPD" },
      net_transition:    { label:"Net Transition Score (upgrades − downgrades)", col:"DPD" },
    },
    transition_windows:["3m","6m","12m","24m","36m"],
    aggregations:["count","ratio","flag","avg"],
    agg_params:{},
    filters:["lender","product"],
    windows:["3m","6m","12m","24m","36m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["bucket"], color:"ft-trans", entity:"tradeline",
    output_type:"transition_matrix"
  },

  vintage_cohort: {
    label:"Vintage Cohort",
    type:"cohort_analysis",
    isNew: true,
    enterprise: true,
    description: "Groups accounts by origination period and tracks performance by age (months-on-books)",
    measures:{
      mob_bucket:           { label:"Months-on-Book Band",                col:"DateOpened" },
      vintage_dpd_rate:     { label:"DPD30+ Rate at MOB",                col:"DPD" },
      vintage_npa_rate:     { label:"NPA Rate at MOB",                   col:"AccountStatus" },
      cumulative_default:   { label:"Cumulative Default Rate",           col:"DPD" },
      early_delinquency:    { label:"Early Delinquency (MOB 1–3)",       col:"DPD" },
      vintage_cohort_size:  { label:"Cohort Account Count",              col:"DateOpened" },
      vintage_avg_balance:  { label:"Cohort Avg Outstanding Balance",    col:"Outstanding_Balance" },
      vintage_survival_rate:{ label:"Cohort Survival Rate",             col:"AccountStatus" },
    },
    mob_bands:[ [0,3,"MOB_0_3"], [4,6,"MOB_4_6"], [7,12,"MOB_7_12"], [13,24,"MOB_13_24"], [25,36,"MOB_25_36"] ],
    cohort_by:["origination_quarter","origination_year","product_type"],
    aggregations:["ratio","count","avg"],
    agg_params:{},
    filters:["lender","product"],
    windows:["12m","24m","36m","48m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["bucket"], color:"ft-vint", entity:"tradeline",
    output_type:"cohort_table"
  },

  stability_score: {
    label:"Stability Score",
    type:"population_stability",
    isNew: true,
    enterprise: true,
    description: "Measures feature stability (PSI) and rank-order stability over time windows",
    measures:{
      psi_score:            { label:"Population Stability Index (PSI)",     col:"multiple", psi_threshold:{low:0.1, high:0.25} },
      rank_correlation:     { label:"Rank-Order Stability (Spearman ρ)",    col:"multiple" },
      gini_stability:       { label:"Gini Coefficient Stability",           col:"multiple" },
      feature_drift:        { label:"Feature Distribution Drift",           col:"multiple" },
      value_volatility:     { label:"Feature Value Volatility Index",       col:"multiple" },
      monotonicity_score:   { label:"Monotonicity Score (WoE bins)",        col:"multiple" },
    },
    psi_bands:["<0.10 (Stable)","0.10–0.25 (Moderate)","≥0.25 (Unstable)"],
    aggregations:["value","flag"],
    agg_params:{},
    filters:[],
    windows:["6m","12m","24m","36m"],
    time_based:true, multi_window:false, needs_window:true,
    post:[], color:"ft-stab", entity:"tradeline",
    output_type:"stability_report"
  }

};

// ══════════════════════════════════════════════════════════════════
// TRADE HISTORY SCHEMA — Payment History / Monthly DPD Engine
// Operates on month-by-month payment history data from bureau files
// Columns: DPD_String (48m), Balance_History, Status_History, etc.
// ══════════════════════════════════════════════════════════════════
const TRD_HIST_SCHEMA = {

  exposure: {
    label:"Exposure",
    type:"aggregation",
    isNew: false,
    description:"Monthly balance and amount aggregations from payment history",
    measures:{
      hist_avg_balance:      { label:"Avg Monthly Balance (History)",     col:"Balance_History" },
      hist_max_balance:      { label:"Peak Monthly Balance (History)",    col:"Balance_History" },
      hist_sum_balance:      { label:"Sum of Monthly Balances",           col:"Balance_History" },
      hist_avg_overdue:      { label:"Avg Monthly Overdue (History)",     col:"Overdue_History" },
      hist_max_overdue:      { label:"Peak Overdue Amount (History)",     col:"Overdue_History" },
      hist_avg_credit_limit: { label:"Avg Credit Limit (History)",        col:"CreditLimit_History" },
      hist_avg_emi:          { label:"Avg EMI Amount (History)",          col:"EMI_History" },
      hist_sanction_amount:  { label:"Sanctioned Amount (Static)",        col:"Sanction_Amount" }
    },
    aggregations:["sum","avg","max","min","count","median","std","variance","cv","skew","kurtosis","iqr","outlier_count","percentile"],
    agg_params:{std:{min_rec:2},variance:{min_rec:2},cv:{min_rec:2},skew:{min_rec:3},kurtosis:{min_rec:4},iqr:{min_rec:4},outlier_count:{min_rec:5},percentile:{needs_pct_multi:true}},
    filters:["dpd","overdue","flag","lender"],
    windows:["3m","6m","12m","24m","36m","48m"],
    time_based:true, multi_window:true, needs_window:true,
    post:["log","cap"], color:"ft-exp", entity:"tradeline"
  },

  volume: {
    label:"Volume",
    type:"aggregation",
    isNew: false,
    description:"Count of months in various states from history string",
    measures:{
      months_with_dpd:        { label:"Months with Any DPD (>0)",         col:"DPD_String" },
      months_with_overdue:    { label:"Months with Overdue Amount",        col:"Overdue_History" },
      total_history_months:   { label:"Total History Length (months)",     col:"DPD_String" },
      months_as_active:       { label:"Months in Active Status",           col:"Status_History" },
      months_as_closed:       { label:"Months in Closed Status",           col:"Status_History" },
      months_as_npa:          { label:"Months in NPA / Written-Off",       col:"Status_History" },
      months_ever_delinquent: { label:"Total Delinquent Months (ever)",    col:"DPD_String" }
    },
    aggregations:["count","sum","ratio","flag"],
    agg_params:{},
    filters:["lender","product"],
    windows:["3m","6m","12m","24m","36m","48m"],
    time_based:true, multi_window:true, needs_window:true,
    post:[], color:"ft-vol", entity:"tradeline"
  },

  delinquency: {
    label:"Delinquency",
    type:"aggregation",
    isNew: false,
    description:"DPD-based measures extracted from payment history string",
    measures:{
      max_dpd_in_history:      { label:"Max DPD in History Window",        col:"DPD_String" },
      count_dpd30_months:      { label:"Count of DPD 30+ Months",          col:"DPD_String" },
      count_dpd60_months:      { label:"Count of DPD 60+ Months",          col:"DPD_String" },
      count_dpd90_months:      { label:"Count of DPD 90+ (NPA) Months",    col:"DPD_String" },
      avg_dpd_history:         { label:"Avg DPD Over History Window",      col:"DPD_String" },
      ever_dpd90_flag:         { label:"Ever DPD 90+ Flag (in window)",    col:"DPD_String" }
    },
    aggregations:["count","max","avg","ratio","flag","median","std","variance","cv","skew","kurtosis","iqr","outlier_count"],
    agg_params:{std:{min_rec:2},variance:{min_rec:2},cv:{min_rec:2},skew:{min_rec:3},kurtosis:{min_rec:4},iqr:{min_rec:4},outlier_count:{min_rec:5}},
    filters:["dpd","overdue","flag","lender"],
    windows:["3m","6m","12m","24m","36m","48m"],
    time_based:true, multi_window:false, needs_window:true,
    post:[], color:"ft-del", entity:"tradeline"
  },

  utilization: {
    label:"Utilization",
    type:"derived_ratio",
    isNew: false,
    description:"Historical utilization ratio derived from balance and credit limit history",
    measures:{
      avg_util_history:       { label:"Avg Utilization Over History",      col:"Balance_History / CreditLimit_History" },
      max_util_history:       { label:"Peak Utilization in History",       col:"Balance_History / CreditLimit_History" },
      min_util_history:       { label:"Trough Utilization in History",     col:"Balance_History / CreditLimit_History" },
      util_above_80_months:   { label:"Months with Utilization ≥ 80%",    col:"Balance_History / CreditLimit_History" }
    },
    aggregations:["avg","max","min","median","std","cv","ratio","flag","count"],
    agg_params:{std:{min_rec:2},cv:{min_rec:2}},
    filters:["util","lender"],
    windows:["3m","6m","12m","24m","36m","48m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["cap"], color:"ft-util", entity:"tradeline"
  },

  vintage: {
    label:"Vintage",
    type:"point_in_time",
    isNew: false,
    description:"Account age and history-length based time features",
    measures:{
      account_age_months:       { label:"Account Age (months)",             col:"DateOpened" },
      hist_months_on_books:     { label:"Months on Books (History Length)", col:"DPD_String" },
      months_since_first_delq:  { label:"Months Since First Delinquency",  col:"DPD_String" },
      months_since_first_dpd90: { label:"Months Since First DPD 90+",      col:"DPD_String" }
    },
    aggregations:["avg","min","max","value"],
    agg_params:{},
    filters:[],
    windows:[], multi_window:false, needs_window:false,
    post:["cap"], color:"ft-vint", entity:"tradeline"
  },

  recency: {
    label:"Recency",
    type:"point_in_time",
    isNew: true,
    description:"Event-recency measures — months elapsed since last occurrence in payment history",
    measures:{
      months_since_last_dpd30:       { label:"Months Since Last DPD ≥ 30",          col:"DPD_String", event_filter:{field:"DPD",op:">=",val:30}, group:"dpd" },
      months_since_last_dpd60:       { label:"Months Since Last DPD ≥ 60",          col:"DPD_String", event_filter:{field:"DPD",op:">=",val:60}, group:"dpd" },
      months_since_last_dpd90:       { label:"Months Since Last DPD ≥ 90 (NPA)",    col:"DPD_String", event_filter:{field:"DPD",op:">=",val:90}, group:"dpd" },
      months_since_last_dpd_custom:  { label:"Months Since Last DPD (Custom)",      col:"DPD_String", event_filter:{field:"DPD",op:">=",val:"custom"}, group:"dpd" },
      months_since_last_writeoff:    { label:"Months Since Last Writeoff",           col:"writeoff_amt_tot", event_filter:{field:"writeoff_amt_tot",op:">",val:0}, group:"stress" },
      months_since_writeoff_gt:      { label:"Months Since Writeoff > Amount",       col:"writeoff_amt_tot", event_filter:{field:"writeoff_amt_tot",op:">",val:"custom"}, group:"stress" },
      months_since_last_payment:     { label:"Months Since Last Payment",            col:"LastPaymentDate", group:"payment" },
      months_since_last_settled:     { label:"Months Since Last Settled",            col:"settlement_amt", event_filter:{field:"settlement_amt",op:">",val:0}, group:"stress" },
      months_since_last_open:        { label:"Months Since Last Account Opened",     col:"DateOpened", group:"account" },
      months_since_last_closed:      { label:"Months Since Last Account Closed",     col:"DateClosed", group:"account" },
      months_since_last_delinquency: { label:"Months Since Last Delinquency",        col:"DPD_String", group:"dpd" },
      months_since_last_npa:         { label:"Months Since Last NPA Status",         col:"Status_History", event_filter:{field:"AccountStatus",op:"=",val:"NPA"}, group:"stress" },
      months_since_last_suit:        { label:"Months Since Last Suit Filed",         col:"SuitFiled_Flag", event_filter:{field:"SuitFiled_Flag",op:"=",val:1}, group:"stress" },
      months_since_peak_balance:     { label:"Months Since Peak Balance (History)",  col:"Balance_History", event_filter:{field:"Balance_History",op:"=",val:"peak"}, group:"balance" },
      recency_of_transition:         { label:"Months Since Last Status Transition",  col:"Status_History", group:"account" },
    },
    date_column_map:{
      months_since_last_dpd30:"DPD_String", months_since_last_dpd60:"DPD_String", months_since_last_dpd90:"DPD_String",
      months_since_last_dpd_custom:"DPD_String", months_since_last_delinquency:"DPD_String",
      months_since_last_writeoff:"DateReported", months_since_writeoff_gt:"DateReported",
      months_since_last_payment:"LastPaymentDate", months_since_last_settled:"DateClosed",
      months_since_last_open:"DateOpened", months_since_last_closed:"DateClosed",
      months_since_last_npa:"DateReported", months_since_last_suit:"DateReported",
      months_since_peak_balance:"DateReported", recency_of_transition:"DateReported",
    },
    recency_formulas:{
      months_since_last_dpd30:      "HISTORY_POS(DPD_String, DPD >= 30, last_occurrence)",
      months_since_last_dpd60:      "HISTORY_POS(DPD_String, DPD >= 60, last_occurrence)",
      months_since_last_dpd90:      "HISTORY_POS(DPD_String, DPD >= 90, last_occurrence)",
      months_since_last_dpd_custom: "HISTORY_POS(DPD_String, DPD >= {threshold}, last_occurrence)",
      months_since_last_writeoff:   "FLOOR((CurrentDate − MAX(DateReported WHERE writeoff_amt_tot > 0)) / 30)",
      months_since_writeoff_gt:     "FLOOR((CurrentDate − MAX(DateReported WHERE writeoff_amt_tot > {amount})) / 30)",
      months_since_last_settled:    "FLOOR((CurrentDate − MAX(DateClosed WHERE settlement_amt > 0)) / 30)",
      months_since_last_npa:        "HISTORY_POS(Status_History, Status = NPA, last_occurrence)",
      months_since_peak_balance:    "HISTORY_POS(Balance_History, Balance = MAX(Balance_History), occurrence)",
      months_since_last_suit:       "FLOOR((CurrentDate − MAX(DateReported WHERE SuitFiled_Flag = 1)) / 30)",
      recency_of_transition:        "HISTORY_POS(Status_History, status_change = true, last_occurrence)",
    },
    measure_groups:{ dpd:"DPD / Delinquency Events", stress:"Stress Events", payment:"Payment Events", account:"Account Events", balance:"Balance Events" },
    aggregations:["value","min","max"],
    agg_params:{},
    filters:["event_filter"],
    windows:[], multi_window:false, needs_window:false,
    post:["cap","bucket"], color:"ft-rec", entity:"tradeline",
    supports_acceleration: true
  },

  trend: {
    label:"Trend",
    type:"window_comparison",
    isNew: true,
    description:"Trend and directional change in payment history metrics across window pairs",
    trend_modes: {
      window_diff:   { label:"Window Difference",      desc:"Value(recent window) − Value(prior window)",          icon:"⬆️" },
      rolling_slope: { label:"Rolling OLS Slope",      desc:"Linear regression slope of monthly values in window", icon:"📈" },
      volatility:    { label:"Volatility Trend",       desc:"Std dev of month-over-month changes in window",       icon:"〰️" },
      regression:    { label:"Time-Series Regression", desc:"Full OLS: slope + intercept + R² over window",        icon:"📊" },
      acceleration:  { label:"Acceleration",           desc:"Rate-of-change of trend (2nd derivative, 3-window)",  icon:"⚡" },
      classification:{ label:"Behavioral Class",       desc:"Labels trend: improving / deteriorating / stable / volatile", icon:"🏷️" },
    },
    measures:{
      hist_dpd_trend:              { label:"DPD Trend (History Window)",        col:"DPD_String", growth_rate_guard:"floor_val=1" },
      hist_balance_trend:          { label:"Balance Trend (History Window)",    col:"Balance_History" },
      hist_overdue_trend:          { label:"Overdue Amount Trend",              col:"Overdue_History" },
      hist_utilization_trend:      { label:"Utilization Rate Trend",            col:"Balance_History / CreditLimit_History" },
      hist_dpd_volatility:         { label:"DPD Volatility (Std Dev History)",  col:"DPD_String" },
      hist_overdue_volatility:     { label:"Overdue Volatility (Std Dev)",      col:"Overdue_History" },
      hist_balance_volatility:     { label:"Balance Volatility Trend",          col:"Balance_History" },
      hist_emi_trend:              { label:"EMI Amount Trend",                  col:"EMI_History" },
      hist_emi_to_bal_trend:       { label:"EMI-to-Balance Ratio Trend",        col:"EMI_History / Balance_History" },
      hist_status_transition_rate: { label:"Monthly Status Transition Rate",    col:"Status_History" }
    },
    aggregations:["difference","growth_rate","ratio","slope","acceleration","volatility","regression","classification"],
    agg_params:{
      slope:         { needs_rolling_window:true, description:"OLS slope of monthly values within rolling window" },
      volatility:    { needs_rolling_window:true, description:"Std dev of month-over-month changes in window" },
      regression:    { needs_rolling_window:true, description:"Full OLS regression: slope + R² + intercept" },
      acceleration:  { needs_triple_window:true,  description:"Rate-of-change of trend (2nd derivative)" },
      classification:{ description:"Labels trend as: improving / deteriorating / stable / volatile" }
    },
    filters:["dpd","overdue"],
    windows:[],
    window_pairs:[["1m","3m"],["1m","6m"],["3m","6m"],["6m","12m"],["3m","12m"],["6m","24m"],["12m","24m"],["12m","36m"],["24m","36m"],["12m","48m"]],
    rolling_windows:["3m","6m","12m","24m","36m","48m"],
    window_triples:[["1m","3m","6m"],["3m","6m","12m"],["6m","12m","24m"],["3m","6m","24m"]],
    multi_window:false, needs_window:true,
    post:[], color:"ft-trend", entity:"tradeline"
  },

  balance_dynamics: {
    label:"Balance Dynamics",
    type:"aggregation",
    isNew: true,
    description:"Dynamic balance evolution from monthly history — peaks, troughs, weighted averages",
    balance_modes: {
      point_in_time: { label:"Point-in-Time",      desc:"Balance value at position in history",                    icon:"📍" },
      monthly_series:{ label:"Monthly History",    desc:"Aggregate across all monthly balance snapshots",           icon:"📅" },
      time_weighted: { label:"Time-Weighted Avg",  desc:"Weighted mean (recent months get higher weight)",          icon:"⚖️" },
      rolling_vol:   { label:"Rolling Volatility", desc:"Std dev of month-over-month balance changes",              icon:"〰️" },
      peak_detect:   { label:"Peak Detection",     desc:"Find peak, trough, date of peak in history",              icon:"🏔️" },
      trajectory:    { label:"Trajectory Class",   desc:"Classify as rising / falling / stable / volatile",         icon:"🏷️" },
    },
    measures:{
      hist_outstanding_balance:   { label:"Hist Avg Outstanding Balance",      col:"Balance_History" },
      hist_peak_balance:          { label:"Hist Peak Balance (Max)",            col:"Balance_History" },
      hist_trough_balance:        { label:"Hist Trough Balance (Min)",          col:"Balance_History" },
      hist_avg_monthly_balance:   { label:"Avg Monthly Balance (Window)",       col:"Balance_History" },
      hist_balance_volatility:    { label:"Balance Volatility (Std Dev)",       col:"Balance_History", restrict_aggs:["value","ratio"] },
      hist_balance_cv:            { label:"Balance CV (Volatility / Mean)",     col:"Balance_History", restrict_aggs:["value","ratio"] },
      hist_balance_range:         { label:"Balance Range (Peak − Trough)",      col:"Balance_History" },
      hist_time_weighted_balance: { label:"Time-Weighted Avg Balance",          col:"Balance_History" },
      hist_rolling_balance_vol:   { label:"Rolling Balance Volatility",         col:"Balance_History", restrict_aggs:["value","slope"] },
      hist_overdue_amount:        { label:"Hist Avg Overdue Amount",            col:"Overdue_History" },
      hist_overdue_peak:          { label:"Hist Peak Overdue (Max)",            col:"Overdue_History" },
      hist_avg_overdue:           { label:"Avg Monthly Overdue (Window)",       col:"Overdue_History" },
      hist_emi_amount:            { label:"Hist Avg EMI Amount",                col:"EMI_History" },
      hist_credit_limit:          { label:"Hist Avg Credit Limit",              col:"CreditLimit_History" },
      hist_utilization_rate:      { label:"Hist Avg Utilization Rate",          col:"Balance_History/CreditLimit_History" },
      hist_emi_coverage_ratio:    { label:"EMI Coverage Ratio (EMI/Balance)",   col:"EMI_History/Balance_History", null_guard:"denominator=0" }
    },
    balance_snapshot_types:["monthly_series","peak","trough","avg_monthly","time_weighted","rolling_volatility","trajectory"],
    aggregations:["max","min","avg","std","cv","value","ratio","slope"],
    agg_params:{std:{min_rec:3},cv:{min_rec:3},slope:{min_rec:4,description:"Trend slope of monthly balance series"}},
    time_weighted_options:{ decay:["linear","exponential","custom"], default:"linear" },
    filters:["dpd","overdue","lender"],
    windows:["3m","6m","12m","24m","36m","48m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["log","cap"], color:"ft-bal", entity:"tradeline"
  },

  writeoff: {
    label:"Write-Off",
    type:"conditional_flag",
    isNew: false,
    description:"Write-off event detection from payment history",
    measures:{
      hist_writeoff_amount:{ label:"Write-off Amount (History)",  col:"writeoff_amt_tot" },
      hist_writeoff_count: { label:"Write-off Count (History)",   col:"writeoff_amt_tot" }
    },
    aggregations:["sum","count","flag","avg"],
    agg_params:{},
    filters:["flag","lender"],
    windows:["6m","12m","24m","36m","48m"],
    time_based:true, multi_window:false, needs_window:true,
    post:[], color:"ft-rest", entity:"tradeline"
  },

  settlement: {
    label:"Settlement",
    type:"conditional_flag",
    isNew: false,
    description:"Settlement event detection from payment history",
    measures:{
      hist_settlement_amount:{ label:"Settlement Amount (History)", col:"settlement_amt" },
      hist_settlement_count: { label:"Settlement Count (History)",  col:"settlement_amt" }
    },
    aggregations:["sum","count","flag","avg"],
    agg_params:{},
    filters:["flag","lender"],
    windows:["6m","12m","24m","36m","48m"],
    time_based:true, multi_window:false, needs_window:true,
    post:[], color:"ft-rest", entity:"tradeline"
  },

  portfolio_mix: {
    label:"Portfolio Mix",
    type:"segment_ratio",
    isNew: false,
    description:"Historical product and account-type composition over time",
    measures:{
      hist_pl_share:             { label:"PL Balance Share (History)",        col:"Balance_History" },
      hist_unsecured_share:      { label:"Unsecured Balance Share (History)", col:"Balance_History" },
      hist_secured_share:        { label:"Secured Balance Share (History)",   col:"Balance_History" },
      hist_cc_share:             { label:"CC Balance Share (History)",        col:"Balance_History" },
      hist_closed_to_open_ratio: { label:"Closed-to-Open Month Ratio",       col:"Status_History" },
      hist_loan_type_hhi:        { label:"Loan Type HHI (History)",          col:"AccountType", is_static:true, needs_window:false }
    },
    aggregations:["ratio","index"],
    agg_params:{},
    filters:[],
    windows:["6m","12m","24m","36m"],
    multi_window:false, needs_window:true,
    post:[], color:"ft-pmix", entity:"tradeline"
  },

  risk_ratio: {
    label:"Risk Ratio",
    type:"derived_ratio",
    isNew: false,
    description:"Historical risk ratios computed from payment history data",
    measures:{
      hist_emi_obligation_ratio:   { label:"EMI Obligation Ratio (Avg EMI / Avg Balance)", col:"EMI_History / Balance_History" },
      hist_dpd_rate:               { label:"DPD Month Rate (DPD>0 / Total Months)",col:"DPD_String" },
      hist_stress_rate:            { label:"Stress Rate (NPA+WO Months / Total)", col:"Status_History" },
      hist_overdue_to_balance:     { label:"Avg Overdue-to-Balance Ratio (Hist)", col:"Overdue_History / Balance_History" },
      hist_high_utilization_ratio: { label:"High Util Month Ratio (≥80% months)", col:"Balance_History / CreditLimit_History" }
    },
    aggregations:["avg","max","min","std","cv"],
    agg_params:{std:{min_rec:2},cv:{min_rec:2}},
    ratio_measures_note:"hist_dpd_rate and hist_stress_rate are already ratios — ratio aggregation excluded to prevent double-ratio",
    filters:["lender","util"],
    windows:["3m","6m","12m","24m","36m","48m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["cap"], color:"ft-util", entity:"tradeline"
  },

  transition_matrix: {
    label:"Transition Matrix",
    type:"state_transition",
    isNew: true,
    enterprise: true,
    description:"DPD-band state transitions computed from month-by-month payment history string",
    measures:{
      hist_dpd_to_dpd0:        { label:"DPD>0 → DPD0 (Cure Rate, History)",      col:"DPD_String", transition:{from:"DPD>0",  to:"DPD=0"} },
      hist_dpd0_to_dpd30:      { label:"DPD0 → DPD30+ (Default Rate, History)",  col:"DPD_String", transition:{from:"DPD=0",  to:"DPD>=30"} },
      hist_dpd30_to_dpd90:     { label:"DPD30 → DPD90+ (Worsening, History)",    col:"DPD_String", transition:{from:"DPD>=30",to:"DPD>=90"} },
      hist_dpd90_to_dpd0:      { label:"DPD90 → DPD0 (Recovery, History)",       col:"DPD_String", transition:{from:"DPD>=90",to:"DPD=0"} },
      hist_active_to_npa:      { label:"Active → NPA Rate (History)",             col:"Status_History", transition:{from:"Active",to:"NPA"} },
      hist_npa_to_active:      { label:"NPA → Active (Cure Rate, History)",       col:"Status_History", transition:{from:"NPA",to:"Active"} },
      hist_active_to_closed:   { label:"Active → Closed (Closure Rate, Hist)",   col:"Status_History", transition:{from:"Active",to:"Closed"} },
      hist_upgrade_count:      { label:"DPD Band Upgrade Count (History)",        col:"DPD_String" },
      hist_downgrade_count:    { label:"DPD Band Downgrade Count (History)",      col:"DPD_String" },
      hist_net_transition:     { label:"Net Transition Score (Upgrades − Downgrades)", col:"DPD_String" },
    },
    transition_windows:["3m","6m","12m","24m"],
    aggregations:["count","ratio","flag","avg"],
    agg_params:{},
    filters:["lender","product"],
    windows:["3m","6m","12m","24m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["bucket"], color:"ft-trans", entity:"tradeline",
    output_type:"transition_matrix"
  },

  vintage_cohort: {
    label:"Vintage Cohort",
    type:"cohort_analysis",
    isNew: true,
    enterprise: true,
    description:"Groups accounts by origination cohort and tracks performance from payment history by MOB",
    measures:{
      hist_mob_bucket:            { label:"Months-on-Book Band (History)",       col:"DateOpened" },
      hist_vintage_dpd_rate:      { label:"DPD30+ Rate at MOB (History)",        col:"DPD_String" },
      hist_vintage_npa_rate:      { label:"NPA Rate at MOB (History)",           col:"Status_History" },
      hist_cumulative_default:    { label:"Cumulative Default Rate (History)",   col:"DPD_String" },
      hist_early_delinquency:     { label:"Early Delinquency MOB 1–3 (History)",col:"DPD_String" },
      hist_cohort_size:           { label:"Cohort Account Count (History)",      col:"DateOpened" },
      hist_cohort_avg_balance:    { label:"Cohort Avg Balance (History)",        col:"Balance_History" },
      hist_cohort_survival_rate:  { label:"Cohort Survival Rate (History)",      col:"Status_History" },
    },
    mob_bands:[ [0,3,"MOB_0_3"], [4,6,"MOB_4_6"], [7,12,"MOB_7_12"], [13,24,"MOB_13_24"], [25,36,"MOB_25_36"] ],
    cohort_by:["origination_quarter","origination_year","product_type"],
    aggregations:["ratio","count","avg","rate"],
    agg_params:{},
    filters:["lender","product"],
    windows:["12m","24m","36m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["bucket"], color:"ft-vint", entity:"tradeline",
    output_type:"cohort_table"
  },

  stability_score: {
    label:"Stability Score",
    type:"population_stability",
    isNew: true,
    enterprise: true,
    description:"Stability of history-derived features — PSI, rank-order, and behavioral drift measured from history",
    measures:{
      hist_psi_score:           { label:"History PSI (Population Stability Index)", col:"multiple", psi_threshold:{low:0.1,high:0.25} },
      hist_rank_correlation:    { label:"Rank-Order Stability (Spearman ρ)",        col:"multiple" },
      hist_gini_stability:      { label:"Gini Coefficient Stability",               col:"multiple" },
      hist_feature_drift:       { label:"History Feature Distribution Drift",       col:"multiple" },
      hist_value_volatility:    { label:"History Feature Value Volatility Index",   col:"multiple" },
      hist_monotonicity_score:  { label:"Monotonicity Score (WoE History Bins)",    col:"multiple" },
    },
    psi_bands:["<0.10 (Stable)","0.10–0.25 (Moderate)","≥0.25 (Unstable)"],
    aggregations:["value","flag"],
    agg_params:{},
    filters:[],
    windows:["6m","12m","24m"],
    time_based:true, multi_window:false, needs_window:true,
    post:[], color:"ft-stab", entity:"tradeline",
    output_type:"stability_report"
  },

  // ══════════════════════════════════════════════════════════════
  // NEW SUB-CATEGORIES — v12
  // ══════════════════════════════════════════════════════════════

  payment_behaviour: {
    label:"Payment Behaviour",
    type:"sequence_analysis",
    isNew: true,
    description:"On-time, late, missed, partial payment patterns — ratios, streaks, recovery from payment history",
    measures:{
      hist_on_time_payment_count:    { label:"On-Time Payment Count (History)",          col:"DPD_String",        formula:"COUNT(DPD_String[i]=0)" },
      hist_on_time_payment_ratio:    { label:"On-Time Payment Ratio (History)",          col:"DPD_String",        formula:"COUNT(DPD=0) / Total_Months" },
      hist_late_payment_count:       { label:"Late Payment Count (DPD 1–29, History)",  col:"DPD_String",        formula:"COUNT(1 <= DPD <= 29)" },
      hist_late_payment_ratio:       { label:"Late Payment Ratio (History)",             col:"DPD_String",        formula:"COUNT(DPD 1-29) / Total_Months" },
      hist_missed_payment_count:     { label:"Missed Payment Count (DPD 30+, History)", col:"DPD_String",        formula:"COUNT(DPD >= 30)" },
      hist_missed_payment_ratio:     { label:"Missed Payment Ratio (History)",           col:"DPD_String",        formula:"COUNT(DPD>=30) / Total_Months" },
      hist_partial_payment_count:    { label:"Partial Payment Count (History)",          col:"Overdue_History",   formula:"COUNT(Overdue>0 AND DPD<30)" },
      hist_partial_payment_ratio:    { label:"Partial Payment Ratio (History)",          col:"Overdue_History",   formula:"COUNT(partial) / Total_Months" },
      hist_max_consecutive_on_time:  { label:"Max Consecutive On-Time Payments",         col:"DPD_String",        formula:"MAX_STREAK(DPD=0)" },
      hist_max_consecutive_late:     { label:"Max Consecutive Late Payments (streak)",   col:"DPD_String",        formula:"MAX_STREAK(DPD>=1)" },
      hist_max_consecutive_missed:   { label:"Max Consecutive Missed Payments (streak)", col:"DPD_String",        formula:"MAX_STREAK(DPD>=30)" },
      hist_payment_recovery_rate:    { label:"Payment Recovery Rate (after missed)",     col:"DPD_String",        formula:"RECOVERY_RATE(DPD_String)" },
      hist_payment_regularity_score: { label:"Payment Regularity Score (0–100)",         col:"DPD_String",        formula:"REGULARITY_SCORE(DPD_String)" },
    },
    aggregations:["count","ratio","max_streak","avg","flag","trend","velocity"],
    agg_params:{
      ratio:       { description:"Proportion of months in that payment state over window" },
      max_streak:  { description:"Longest consecutive run of that payment state" },
      trend:       { description:"Direction of change in ratio over rolling window" },
      velocity:    { description:"Rate of change in payment state proportion" },
    },
    filters:["dpd_bucket","payment_status","product","lender"],
    windows:["3m","6m","12m","24m","36m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["bucket"], color:"ft-pay", entity:"tradeline"
  },

  payment_gap_analysis: {
    label:"Payment Gap Analysis",
    type:"time_series_gap",
    isNew: true,
    description:"Days between payments, payment timing irregularity, gap distribution statistics",
    measures:{
      hist_avg_days_bw_payments:    { label:"Avg Days Between Payments (History)",   col:"LastPaymentDate",    formula:"AVG(DIFF(payment_dates))" },
      hist_median_payment_gap:      { label:"Median Payment Gap (History)",           col:"LastPaymentDate",    formula:"MEDIAN(payment_gaps)" },
      hist_max_payment_gap:         { label:"Max Payment Gap in Window",              col:"LastPaymentDate",    formula:"MAX(payment_gaps)" },
      hist_payment_gap_std:         { label:"Payment Gap Std Dev (Irregularity)",     col:"LastPaymentDate",    formula:"STD(payment_gaps)" },
      hist_payment_gap_skew:        { label:"Payment Gap Skewness",                   col:"LastPaymentDate",    formula:"SKEW(payment_gaps)" },
      hist_payment_gap_cv:          { label:"Payment Gap CV (Consistency Score)",     col:"LastPaymentDate",    formula:"STD/MEAN(payment_gaps)" },
      hist_days_since_last_payment: { label:"Days Since Last Payment",                col:"LastPaymentDate",    formula:"FLOOR((CurrentDate − LastPaymentDate))" },
      hist_payment_timeliness_idx:  { label:"Payment Timeliness Index (0–100)",       col:"LastPaymentDate",    formula:"TIMELINESS_INDEX(payment_dates)" },
    },
    aggregations:["avg","median","max","std","skew","cv"],
    agg_params:{
      skew:   { description:"Positive skew = occasional very large gaps (sporadic payer)" },
      cv:     { description:"High CV = inconsistent payment timing = higher risk" },
    },
    filters:["payment_status","product","lender"],
    windows:["3m","6m","12m","24m","36m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["cap","bucket"], color:"ft-pgap", entity:"tradeline"
  },

  risk_momentum: {
    label:"Risk Momentum",
    type:"window_comparison",
    isNew: true,
    description:"Velocity and acceleration of risk signals — DPD, overdue, utilization directional change rate",
    measures:{
      hist_dpd_velocity:            { label:"DPD Velocity (rate of DPD change)",          col:"DPD_String",                   formula:"DIFF(AVG_DPD[w1], AVG_DPD[w2]) / months" },
      hist_dpd_acceleration:        { label:"DPD Acceleration (2nd derivative)",           col:"DPD_String",                   formula:"ACCEL(DPD_velocity, 3-window)" },
      hist_overdue_velocity:        { label:"Overdue Velocity (monthly change rate)",      col:"Overdue_History",              formula:"DIFF(AVG_OVR[w1], AVG_OVR[w2]) / months" },
      hist_overdue_acceleration:    { label:"Overdue Acceleration",                         col:"Overdue_History",              formula:"ACCEL(overdue_velocity, 3-window)" },
      hist_util_velocity:           { label:"Utilization Velocity (change rate)",           col:"Balance_History/CreditLimit",  formula:"DIFF(AVG_UTIL[w1], AVG_UTIL[w2]) / months" },
      hist_util_acceleration:       { label:"Utilization Acceleration",                     col:"Balance_History/CreditLimit",  formula:"ACCEL(util_velocity, 3-window)" },
      hist_balance_velocity:        { label:"Balance Velocity (growth rate of balance)",    col:"Balance_History",              formula:"(Balance[w1] − Balance[w2]) / Balance[w2]" },
      hist_balance_acceleration:    { label:"Balance Acceleration",                          col:"Balance_History",              formula:"ACCEL(balance_velocity, 3-window)" },
      hist_risk_momentum_score:     { label:"Composite Risk Momentum Score",                col:"multiple",                     formula:"COMPOSITE(dpd_vel, ovr_vel, util_vel)" },
      hist_stress_trajectory:       { label:"Stress Trajectory (improving/deteriorating)",  col:"multiple",                     formula:"CLASSIFY(momentum_signals)" },
    },
    aggregations:["velocity","acceleration","trend","slope","difference","classification"],
    agg_params:{
      velocity:      { description:"Rate of change: (value_recent − value_prior) / n_months" },
      acceleration:  { needs_triple_window:true, description:"Rate of change of velocity (2nd derivative)" },
      slope:         { needs_rolling_window:true, description:"OLS slope of monthly values in window" },
      classification:{ description:"Classifies as: accelerating / decelerating / stable / reversing" },
    },
    window_pairs:[["1m","3m"],["1m","6m"],["3m","6m"],["3m","12m"],["6m","12m"],["6m","24m"],["12m","24m"],["12m","36m"]],
    window_triples:[["1m","3m","6m"],["3m","6m","12m"],["6m","12m","24m"]],
    rolling_windows:["3m","6m","12m","24m","36m"],
    filters:["dpd_bucket","utilization_band","product"],
    windows:[],
    multi_window:false, needs_window:true,
    post:[], color:"ft-mom", entity:"tradeline"
  },

  delinquency_severity_seq: {
    label:"Delinquency Severity",
    type:"sequence_analysis",
    isNew: true,
    description:"DPD sequence analytics — severity score, streaks, recovery patterns from DPD_String month sequence",
    measures:{
      hist_dpd_severity_score:      { label:"DPD Severity Score (weighted)",          col:"DPD_String",  formula:"SUM(DPD[i] × weight_i) / Total_Months" },
      hist_max_dpd_streak:          { label:"Max Consecutive DPD 30+ Months",         col:"DPD_String",  formula:"MAX_STREAK(DPD >= 30)" },
      hist_max_dpd90_streak:        { label:"Max Consecutive DPD 90+ Streak",         col:"DPD_String",  formula:"MAX_STREAK(DPD >= 90)" },
      hist_dpd_streak_current:      { label:"Current DPD Streak Length",              col:"DPD_String",  formula:"CURRENT_STREAK(DPD >= 30)" },
      hist_dpd_volatility_seq:      { label:"DPD Volatility (Std Dev of DPD values)", col:"DPD_String",  formula:"STD(DPD_series_in_window)" },
      hist_recovery_pattern:        { label:"Recovery Pattern Score (post-DPD)",      col:"DPD_String",  formula:"RECOVERY_SCORE(DPD_sequence)" },
      hist_dpd_band_entropy:        { label:"DPD Band Entropy (distribution spread)",  col:"DPD_String",  formula:"ENTROPY(DPD_band_distribution)" },
      hist_cure_rate:               { label:"Cure Rate (DPD→0 within window)",         col:"DPD_String",  formula:"COUNT(transition_to_DPD0) / COUNT(DPD>0)" },
      hist_relapse_rate:            { label:"Relapse Rate (DPD0→DPD30+ count)",        col:"DPD_String",  formula:"COUNT(DPD30_after_DPD0) / COUNT(clean_months)" },
      hist_delinquency_persistence: { label:"Delinquency Persistence Index",           col:"DPD_String",  formula:"AVG_CONSECUTIVE_DPD_LENGTH / Total_DPD_Episodes" },
    },
    aggregations:["value","count","max_streak","ratio","entropy","std","flag"],
    agg_params:{
      entropy:    { description:"Higher entropy = DPD values spread across multiple bands = complex risk" },
      max_streak: { description:"Longest unbroken sequence of delinquent months" },
    },
    filters:["dpd_bucket","mob_bucket","product","lender"],
    windows:["3m","6m","12m","24m","36m","48m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["bucket"], color:"ft-dsev", entity:"tradeline"
  },

  credit_line_dynamics: {
    label:"Credit Line Dynamics",
    type:"time_series_balance",
    isNew: true,
    description:"Credit limit changes, increases, decreases, utilization spikes — from CreditLimit_History array",
    measures:{
      hist_credit_limit_avg:         { label:"Avg Credit Limit (History)",             col:"CreditLimit_History", formula:"AVG(CreditLimit_History)" },
      hist_credit_limit_max:         { label:"Max Credit Limit in Window",              col:"CreditLimit_History", formula:"MAX(CreditLimit_History)" },
      hist_credit_limit_change:      { label:"Credit Limit Change (net change)",        col:"CreditLimit_History", formula:"CL_end − CL_start" },
      hist_credit_limit_change_rate: { label:"Credit Limit Change Rate",                col:"CreditLimit_History", formula:"(CL_end − CL_start) / CL_start" },
      hist_limit_increase_count:     { label:"Count of Limit Increases",               col:"CreditLimit_History", formula:"COUNT(CL[i] > CL[i-1])" },
      hist_limit_decrease_count:     { label:"Count of Limit Decreases",               col:"CreditLimit_History", formula:"COUNT(CL[i] < CL[i-1])" },
      hist_limit_increase_freq:      { label:"Limit Increase Frequency (per year)",    col:"CreditLimit_History", formula:"COUNT(increases) / (window_months/12)" },
      hist_limit_decrease_freq:      { label:"Limit Decrease Frequency",               col:"CreditLimit_History", formula:"COUNT(decreases) / (window_months/12)" },
      hist_util_spike_post_increase: { label:"Utilization Spike after Limit Increase", col:"Balance/CreditLimit", formula:"UTIL_SPIKE(after_CL_increase)" },
      hist_limit_growth_trend:       { label:"Credit Limit Growth Trend",              col:"CreditLimit_History", formula:"SLOPE(CreditLimit_History)" },
      hist_credit_limit_volatility:  { label:"Credit Limit Volatility",                col:"CreditLimit_History", formula:"STD(CreditLimit_History)" },
    },
    aggregations:["avg","max","min","count","trend","slope","velocity","ratio"],
    agg_params:{
      slope:    { needs_rolling_window:true, description:"OLS slope of credit limit series" },
      velocity: { description:"Rate of change in credit limit month-over-month" },
    },
    filters:["utilization_band","account_age","product","lender"],
    windows:["6m","12m","24m","36m","48m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["cap","log"], color:"ft-cl", entity:"tradeline"
  },

  account_stability_idx: {
    label:"Account Stability Index",
    type:"statistical_dispersion",
    isNew: true,
    description:"Statistical stability of time-series features — CV, std, variance, IQR, entropy for risk volatility scoring",
    measures:{
      hist_balance_cv:              { label:"Balance CV (Std/Mean — Stability)",         col:"Balance_History",              formula:"STD(Balance) / MEAN(Balance)" },
      hist_utilization_std:         { label:"Utilization Std Dev (Consistency)",          col:"Balance/CreditLimit",          formula:"STD(util_monthly_series)" },
      hist_dpd_variance:            { label:"DPD Variance (Predictability)",              col:"DPD_String",                   formula:"VAR(DPD_series)" },
      hist_balance_iqr:             { label:"Balance IQR (Spread Without Outliers)",      col:"Balance_History",              formula:"IQR(Balance_History)" },
      hist_payment_stress_index:    { label:"Payment Stress Index (composite)",           col:"multiple",                     formula:"COMPOSITE(missed_ratio, dpd_vol, gap_std)" },
      hist_delinquency_volatility:  { label:"Delinquency Volatility (DPD CV)",            col:"DPD_String",                   formula:"STD(DPD) / (MEAN(DPD)+1)" },
      hist_utilization_stress_score:{ label:"Utilization Stress Score",                   col:"Balance/CreditLimit",          formula:"COMPOSITE(avg_util, util_vol, util_trend)" },
      hist_overdue_cv:              { label:"Overdue CV (Instability of Overdues)",        col:"Overdue_History",              formula:"STD(Overdue) / MEAN(Overdue)" },
      hist_emi_stability:           { label:"EMI Stability Index",                         col:"EMI_History",                  formula:"1 − STD(EMI) / MEAN(EMI)" },
      hist_behavioral_entropy:      { label:"Behavioral Entropy (overall unpredictability)",col:"multiple",                   formula:"ENTROPY(payment_state_distribution)" },
    },
    aggregations:["cv","std","variance","iqr","entropy","lag_corr","value"],
    agg_params:{
      entropy:   { description:"Higher entropy = more unpredictable payment states = higher model uncertainty" },
      lag_corr:  { description:"Lag-1 autocorrelation — measures behavioral persistence" },
      cv:        { description:"Coefficient of variation: lower = more stable" },
    },
    filters:["dpd_bucket","utilization_band","mob_bucket","account_age"],
    windows:["6m","12m","24m","36m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["bucket"], color:"ft-stab", entity:"tradeline"
  },

  // ══════════════════════════════════════════════════════════════
  // v14 — 5 NEW BEHAVIOUR / SEQUENCE FEATURE CATEGORIES
  // ══════════════════════════════════════════════════════════════

  streak_features: {
    label: "Payment Streak",
    type: "sequence_streak",
    isNew: true,
    description: "Consecutive run analysis on DPD_String — detects persistent delinquency. [0 0 30 30 30 0 60] → max_consecutive_dpd30 = 3",
    measures: {
      hist_max_consec_clean:    { label:"Max Consecutive Clean Months (DPD=0)",         col:"DPD_String", formula:"MAX_STREAK(DPD=0)" },
      hist_max_consec_dpd30:    { label:"Max Consecutive DPD 30+ Months",               col:"DPD_String", formula:"MAX_STREAK(DPD≥30)" },
      hist_max_consec_dpd60:    { label:"Max Consecutive DPD 60+ Months",               col:"DPD_String", formula:"MAX_STREAK(DPD≥60)" },
      hist_max_consec_dpd90:    { label:"Max Consecutive DPD 90+ Months",               col:"DPD_String", formula:"MAX_STREAK(DPD≥90)" },
      hist_cur_clean_streak:    { label:"Current Clean Streak (months to date)",        col:"DPD_String", formula:"CURRENT_STREAK_HEAD(DPD=0)" },
      hist_cur_delq_streak:     { label:"Current Delinquency Streak (ongoing)",         col:"DPD_String", formula:"CURRENT_STREAK_HEAD(DPD≥30)" },
      hist_delq_streak_count:   { label:"Count of Delinquency Streak Episodes",         col:"DPD_String", formula:"COUNT_STREAKS(DPD≥30)" },
      hist_avg_delq_streak_len: { label:"Avg Delinquency Streak Length",                col:"DPD_String", formula:"AVG(len_of_all_delq_streaks)" },
      hist_streak_ratio:        { label:"Clean/Delinquent Streak Ratio",               col:"DPD_String", formula:"max_clean_streak / (max_delq_streak+1)" },
    },
    aggregations: ["value","max","count","avg","ratio"],
    agg_params: {
      value: { description:"Point-in-time streak — current streak length as of last month" },
      max:   { description:"Longest streak episode in selected window" },
      count: { description:"Number of distinct streak episodes in window" },
      avg:   { description:"Average length across all streak episodes in window" },
      ratio: { description:"Clean streak months / delinquent streak months" },
    },
    filters: ["dpd_bucket","mob_bucket","product","lender"],
    windows: ["6m","12m","24m","36m","48m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["bucket"], color:"ft-streak", entity:"tradeline"
  },

  behaviour_trend: {
    label: "Behaviour Trend",
    type: "window_comparison",
    isNew: true,
    description: "Compares recent window vs historical window. Positive = WORSENING. avg_dpd_3m − avg_dpd_12m > 0 → borrower deteriorating.",
    measures: {
      hist_dpd_trend_3v12:     { label:"DPD Trend: 3m vs 12m (core signal)",        col:"DPD_String",          formula:"AVG_DPD[3m] − AVG_DPD[12m]" },
      hist_dpd_trend_6v24:     { label:"DPD Trend: 6m vs 24m",                      col:"DPD_String",          formula:"AVG_DPD[6m] − AVG_DPD[24m]" },
      hist_dpd_trend_12v36:    { label:"DPD Trend: 12m vs 36m",                     col:"DPD_String",          formula:"AVG_DPD[12m] − AVG_DPD[36m]" },
      hist_overdue_trend_3v12: { label:"Overdue Trend: 3m vs 12m",                  col:"Overdue_History",     formula:"AVG_OVR[3m] − AVG_OVR[12m]" },
      hist_overdue_trend_6v24: { label:"Overdue Trend: 6m vs 24m",                  col:"Overdue_History",     formula:"AVG_OVR[6m] − AVG_OVR[24m]" },
      hist_balance_trend_3v12: { label:"Balance Trend: 3m vs 12m",                  col:"Balance_History",     formula:"AVG_BAL[3m] − AVG_BAL[12m]" },
      hist_util_trend_3v12:    { label:"Utilization Trend: 3m vs 12m",              col:"Balance/CreditLimit", formula:"AVG_UTIL[3m] − AVG_UTIL[12m]" },
      hist_missed_trend_3v12:  { label:"Missed Payment Rate Trend: 3m vs 12m",      col:"DPD_String",          formula:"MISS_RATE[3m] − MISS_RATE[12m]" },
      hist_beh_direction:      { label:"Behaviour Direction Flag (+1/0/−1)",         col:"multiple",            formula:"SIGN(dpd_trend_3v12): +1=worsening,−1=improving" },
    },
    aggregations: ["difference","ratio","slope","flag"],
    agg_params: {
      difference: { description:"(+ve) = recent window is worse than historical window. (−ve) = improving." },
      ratio:      { description:"recent_avg / historical_avg — >1 worsening, <1 improving" },
      slope:      { description:"OLS slope across the two window averages" },
      flag:       { description:"1 = worsening (diff > 0), 0 = stable, −1 = improving" },
    },
    filters: ["dpd_bucket","product","lender"],
    windows: ["3m","6m","12m","24m","36m"],
    time_based:true, multi_window:true, needs_window:true,
    post:["bucket"], color:"ft-btrend", entity:"tradeline"
  },

  cure_behaviour: {
    label: "Cure Behaviour",
    type: "event_sequence",
    isNew: true,
    description: "Measures recovery time after delinquency. [0 30 60 30 0] → months_to_cure = 2. Separates temporary vs persistent defaulters.",
    measures: {
      hist_months_to_cure_dpd30: { label:"Months to Cure After DPD 30+ (avg)",      col:"DPD_String", formula:"AVG(months: DPD≥30 → DPD=0)" },
      hist_months_to_cure_dpd60: { label:"Months to Cure After DPD 60+ (avg)",      col:"DPD_String", formula:"AVG(months: DPD≥60 → DPD=0)" },
      hist_months_to_cure_dpd90: { label:"Months to Cure After DPD 90+ (avg)",      col:"DPD_String", formula:"AVG(months: DPD≥90 → DPD=0)" },
      hist_min_months_to_cure:   { label:"Min Months to Cure (fastest recovery)",   col:"DPD_String", formula:"MIN(cure_durations_in_window)" },
      hist_max_months_to_cure:   { label:"Max Months to Cure (slowest recovery)",   col:"DPD_String", formula:"MAX(cure_durations_in_window)" },
      hist_cure_success_rate:    { label:"Cure Success Rate (% events cured)",      col:"DPD_String", formula:"COUNT(cured_events) / COUNT(delinquency_events)" },
      hist_relapse_after_cure:   { label:"Relapse Rate (DPD30+ within 6m of cure)",col:"DPD_String", formula:"COUNT(relapse_6m) / COUNT(cure_events)" },
      hist_cure_episode_count:   { label:"Cure Episode Count in Window",            col:"DPD_String", formula:"COUNT(DPD>0 → DPD=0 transitions)" },
      hist_persistent_delq_flag: { label:"Persistent Delinquency Flag (never cured)",col:"DPD_String",formula:"FLAG(DPD>0 exists AND no_cure_event)" },
      hist_cure_speed_index:     { label:"Cure Speed Index (1 / avg cure time)",    col:"DPD_String", formula:"1 / (avg_months_to_cure + 1)" },
    },
    aggregations: ["value","avg","min","max","count","ratio","flag"],
    agg_params: {
      avg:   { description:"Average cure duration across all delinquency episodes in window" },
      ratio: { description:"Proportion of delinquency episodes that resulted in a cure" },
      flag:  { description:"1 if borrower has at least one cure event in window" },
      count: { description:"Number of distinct cure events in window" },
    },
    filters: ["dpd_bucket","mob_bucket","product","lender"],
    windows: ["6m","12m","24m","36m","48m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["bucket"], color:"ft-cure", entity:"tradeline"
  },

  roll_rate: {
    label: "Roll Rate",
    type: "state_transition_rate",
    isNew: true,
    description: "DPD bucket-to-bucket transition rates. Formula: count(A→B) / count(months in A). Core bank risk monitoring metric.",
    measures: {
      hist_roll_clean_to_dpd30:  { label:"Roll Rate: Clean → DPD 30+ (0→30)",      col:"DPD_String", formula:"COUNT(DPD[t-1]=0 → DPD[t]≥30) / COUNT(DPD=0 months)" },
      hist_roll_clean_to_late:   { label:"Roll Rate: Clean → Late 1-29 (0→late)",  col:"DPD_String", formula:"COUNT(DPD[t-1]=0 → 1≤DPD[t]≤29) / COUNT(DPD=0 months)" },
      hist_roll_dpd30_to_dpd60:  { label:"Roll Rate: DPD30→DPD60 (30→60)",         col:"DPD_String", formula:"COUNT(30≤DPD[t-1]≤59 → DPD[t]≥60) / COUNT(DPD 30-59)" },
      hist_roll_dpd60_to_dpd90:  { label:"Roll Rate: DPD60→DPD90 (60→90)",         col:"DPD_String", formula:"COUNT(60≤DPD[t-1]≤89 → DPD[t]≥90) / COUNT(DPD 60-89)" },
      hist_roll_dpd30_to_clean:  { label:"Cure Roll: DPD30→Clean (30→0)",           col:"DPD_String", formula:"COUNT(DPD[t-1]≥30 → DPD[t]=0) / COUNT(DPD≥30 months)" },
      hist_roll_dpd60_to_clean:  { label:"Cure Roll: DPD60→Clean (60→0)",           col:"DPD_String", formula:"COUNT(DPD[t-1]≥60 → DPD[t]=0) / COUNT(DPD≥60 months)" },
      hist_roll_dpd90_to_clean:  { label:"Cure Roll: DPD90→Clean (90→0)",           col:"DPD_String", formula:"COUNT(DPD[t-1]≥90 → DPD[t]=0) / COUNT(DPD≥90 months)" },
      hist_net_roll_score:       { label:"Net Roll Score (forward − backward rolls)",col:"DPD_String", formula:"COUNT(forward_rolls) − COUNT(backward_rolls)" },
      hist_forward_roll_count:   { label:"Total Forward Rolls (worsening moves)",   col:"DPD_String", formula:"COUNT(any DPD band increase month-over-month)" },
      hist_backward_roll_count:  { label:"Total Backward Rolls (improving moves)",  col:"DPD_String", formula:"COUNT(any DPD band decrease month-over-month)" },
      hist_stay_rate_clean:      { label:"Stay Rate in Clean Bucket (0→0)",          col:"DPD_String", formula:"COUNT(DPD[t-1]=0 AND DPD[t]=0) / COUNT(DPD=0 months)" },
      hist_composite_roll_idx:   { label:"Composite Roll Risk Index (weighted)",     col:"DPD_String", formula:"WEIGHTED_SUM(roll_30, roll_60, roll_90, severity_weights)" },
    },
    aggregations: ["ratio","count","difference","value"],
    agg_params: {
      ratio:      { description:"Transition rate = count(A→B transitions) / count(months in bucket A)" },
      count:      { description:"Raw count of A→B transitions in selected window" },
      difference: { description:"Net roll = forward roll count minus backward roll count" },
      value:      { description:"Composite roll index value in selected window" },
    },
    filters: ["mob_bucket","product","lender","dpd_bucket"],
    windows: ["3m","6m","12m","24m","36m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["bucket"], color:"ft-roll", entity:"tradeline"
  },

  payment_stability: {
    label: "Payment Stability",
    type: "statistical_volatility",
    isNew: true,
    description: "Measures erratic payment behaviour. Formula: std(DPD_history) / avg(DPD_history). Higher = more unstable borrower.",
    measures: {
      hist_payment_irr_idx:      { label:"Payment Irregularity Index — std/avg DPD",       col:"DPD_String",          formula:"STD(DPD_series) / (AVG(DPD_series)+1)" },
      hist_dpd_cv:               { label:"DPD Coefficient of Variation (std/mean)",        col:"DPD_String",          formula:"STD(DPD) / (MEAN(DPD)+1)" },
      hist_dpd_std_window:       { label:"DPD Std Dev in Window",                          col:"DPD_String",          formula:"STD(DPD_monthly_values_in_window)" },
      hist_overdue_irr_idx:      { label:"Overdue Irregularity Index",                     col:"Overdue_History",     formula:"STD(Overdue) / (AVG(Overdue)+1)" },
      hist_balance_irr_idx:      { label:"Balance Irregularity Index",                     col:"Balance_History",     formula:"STD(Balance) / (AVG(Balance)+1)" },
      hist_util_irr_idx:         { label:"Utilization Irregularity Index",                 col:"Balance/CreditLimit", formula:"STD(util_series) / (AVG(util_series)+1)" },
      hist_payment_swing:        { label:"Payment Swing Index — max minus min DPD",        col:"DPD_String",          formula:"MAX(DPD_series_in_window) − MIN(DPD_series_in_window)" },
      hist_mom_dpd_std:          { label:"Month-over-Month DPD Change Std Dev",            col:"DPD_String",          formula:"STD(DIFF(DPD_series))" },
      hist_payment_pattern_entr: { label:"Payment Pattern Entropy (DPD state diversity)",  col:"DPD_String",          formula:"ENTROPY(DPD_band_distribution_in_window)" },
      hist_composite_stab_score: { label:"Composite Stability Score (0=stable, 100=erratic)", col:"multiple",        formula:"COMPOSITE(dpd_irr, ovr_irr, bal_irr, entropy)" },
    },
    aggregations: ["value","cv","std","ratio","entropy"],
    agg_params: {
      cv:      { description:"Coefficient of variation — core instability signal. Higher = more erratic payment behaviour" },
      entropy: { description:"Higher entropy = more diverse DPD state distribution = unpredictable payer" },
      ratio:   { description:"Stability ratio vs a reference historical window" },
      std:     { description:"Standard deviation of DPD values in window — absolute volatility measure" },
    },
    filters: ["dpd_bucket","utilization_band","mob_bucket","product"],
    windows: ["6m","12m","24m","36m"],
    time_based:true, multi_window:false, needs_window:true,
    post:["bucket"], color:"ft-vstab", entity:"tradeline"
  }

};

// ══════════════════════════════════════════════════════════════════
// MASTER REGISTRY — Single Source of Truth
// Centralises: naming token · column · compatible_aggs · data_type
//              leakage_risk · feature_tags · incompatible_with
// ══════════════════════════════════════════════════════════════════
const MASTER_REGISTRY = {
  // ── Enquiry ──────────────────────────────────────────────────────
  count:               { token:"cnt",            col:"N/A",                data_type:"count",      leakage:"none",  tags:["volume"],                    compat_aggs:["count","ratio_to_total","flag"] },
  inquiry_amount:      { token:"amt",            col:"InquiryAmount",      data_type:"continuous", leakage:"none",  tags:["exposure"],                   compat_aggs:["sum","avg","max","min","median","std","cv","skew","kurtosis","percentile"] },
  days_between:        { token:"gap",            col:"derived",            data_type:"continuous", leakage:"none",  tags:["behavioral","temporal"],      compat_aggs:["avg","median","min","max","std","cv","skew","percentile"] },
  months_since_last:   { token:"rec_last",       col:"DateReported",       data_type:"count",      leakage:"none",  tags:["recency"],                    compat_aggs:["value"] },
  months_since_oldest: { token:"rec_oldest",     col:"DateOpened",         data_type:"count",      leakage:"none",  tags:["recency","vintage"],          compat_aggs:["value"] },
  distinct_lenders:    { token:"lndr_cnt",       col:"MemberID",           data_type:"count",      leakage:"none",  tags:["concentration"],              compat_aggs:["count","ratio","index"] },
  hhi_index:           { token:"hhi",            col:"MemberID",           data_type:"continuous", leakage:"none",  tags:["concentration"],              compat_aggs:["index"] },
  // ── Trade: Exposure ───────────────────────────────────────────────
  outstanding_balance: { token:"out_bal",        col:"Outstanding_Balance", data_type:"continuous", leakage:"low",   tags:["balance","exposure"],         compat_aggs:["sum","avg","max","min","median","std","cv","skew","kurtosis","percentile","ratio"] },
  sanctioned_amount:   { token:"sanc_amt",       col:"Sanction_Amount",     data_type:"continuous", leakage:"none",  tags:["exposure"],                   compat_aggs:["sum","avg","max","min","percentile"] },
  overdue_amount:      { token:"ovr_amt",        col:"Over_due_amount",     data_type:"continuous", leakage:"high",  tags:["delinquency","stress"],       compat_aggs:["sum","avg","max","min","median","percentile","ratio"] },
  credit_limit:        { token:"crd_lmt",        col:"CreditLimit",         data_type:"continuous", leakage:"none",  tags:["exposure"],                   compat_aggs:["sum","avg","max","min"] },
  emi_amount:          { token:"emi",            col:"EMI",                 data_type:"continuous", leakage:"none",  tags:["repayment"],                  compat_aggs:["sum","avg","max","min","ratio"] },
  // ── Trade: Delinquency ───────────────────────────────────────────
  dpd:                 { token:"dpd",            col:"DPD",                 data_type:"continuous", leakage:"high",  tags:["delinquency"],                compat_aggs:["count","max","avg","ratio","flag","median","std","variance","cv","skew","kurtosis","iqr","outlier_count"] },
  dpd_30:              { token:"dpd30",          col:"DPD",                 data_type:"binary",     leakage:"high",  tags:["delinquency"],                compat_aggs:["count","ratio","flag"], filter_on:{field:"DPD",op:">=",val:30} },
  dpd_60:              { token:"dpd60",          col:"DPD",                 data_type:"binary",     leakage:"high",  tags:["delinquency"],                compat_aggs:["count","ratio","flag"], filter_on:{field:"DPD",op:">=",val:60} },
  dpd_90:              { token:"dpd90",          col:"DPD",                 data_type:"binary",     leakage:"high",  tags:["delinquency","stress"],       compat_aggs:["count","ratio","flag"], filter_on:{field:"DPD",op:">=",val:90} },
  delinquent_flag:     { token:"delq_flag",      col:"DPD",                 data_type:"binary",     leakage:"high",  tags:["delinquency"],                compat_aggs:["flag","count"] },
  // ── Recency (event-based) ────────────────────────────────────────
  months_since_last_dpd30:      { token:"rec_dpd30",  col:"DPD",            data_type:"count",      leakage:"high",  tags:["recency","delinquency"],     compat_aggs:["value","min","max"], event_filter:{field:"DPD",op:">=",val:30} },
  months_since_last_dpd60:      { token:"rec_dpd60",  col:"DPD",            data_type:"count",      leakage:"high",  tags:["recency","delinquency"],     compat_aggs:["value","min","max"] },
  months_since_last_dpd90:      { token:"rec_dpd90",  col:"DPD",            data_type:"count",      leakage:"high",  tags:["recency","delinquency"],     compat_aggs:["value","min","max"] },
  months_since_last_dpd_custom: { token:"rec_dpd_cus",col:"DPD",            data_type:"count",      leakage:"high",  tags:["recency","delinquency"],     compat_aggs:["value","min","max"] },
  months_since_last_writeoff:   { token:"rec_wo",     col:"DateReported",   data_type:"count",      leakage:"high",  tags:["recency","stress"],          compat_aggs:["value","min","max"] },
  months_since_writeoff_gt:     { token:"rec_wo_gt",  col:"DateReported",   data_type:"count",      leakage:"high",  tags:["recency","stress"],          compat_aggs:["value","min","max"] },
  months_since_last_payment:    { token:"rec_pmt",    col:"LastPaymentDate",data_type:"count",      leakage:"none",  tags:["recency","payment"],         compat_aggs:["value","min","max"] },
  months_since_last_settled:    { token:"rec_sttl",   col:"DateClosed",     data_type:"count",      leakage:"none",  tags:["recency","stress"],          compat_aggs:["value","min","max"] },
  months_since_last_npa:        { token:"rec_npa",    col:"DateReported",   data_type:"count",      leakage:"high",  tags:["recency","stress"],          compat_aggs:["value","min","max"] },
  months_since_last_suit:       { token:"rec_suit",   col:"DateReported",   data_type:"count",      leakage:"high",  tags:["recency","stress"],          compat_aggs:["value","min","max"] },
  months_since_peak_exposure:   { token:"rec_pk_exp", col:"DateReported",   data_type:"count",      leakage:"none",  tags:["recency","balance"],         compat_aggs:["value"] },
  months_since_last_open:       { token:"rec_open",   col:"DateOpened",     data_type:"count",      leakage:"none",  tags:["recency","account"],         compat_aggs:["value","min","max"] },
  months_since_last_closed:     { token:"rec_clos",   col:"DateClosed",     data_type:"count",      leakage:"none",  tags:["recency","account"],         compat_aggs:["value","min","max"] },
  months_since_last_delinquency:{ token:"rec_delq",   col:"DateReported",   data_type:"count",      leakage:"high",  tags:["recency","delinquency"],     compat_aggs:["value","min","max"] },
  recency_of_transition:        { token:"rec_trans",  col:"DateReported",   data_type:"count",      leakage:"none",  tags:["recency","transition"],      compat_aggs:["value","min","max"] },
  // ── Trend ────────────────────────────────────────────────────────
  balance_growth:      { token:"bal_grw",        col:"Outstanding_Balance", data_type:"continuous", leakage:"low",   tags:["trend","balance"],            compat_aggs:["difference","ratio","slope","growth_rate","acceleration","volatility","regression","classification"] },
  dpd_trend:           { token:"dpd_trnd",       col:"DPD",                 data_type:"continuous", leakage:"high",  tags:["trend","delinquency"],        compat_aggs:["difference","slope","acceleration","volatility","classification"] },
  overdue_trend:       { token:"ovr_trnd",       col:"Over_due_amount",     data_type:"continuous", leakage:"high",  tags:["trend","delinquency"],        compat_aggs:["difference","slope","acceleration","volatility"] },
  utilization_change:  { token:"util_chg",       col:"CreditLimit",         data_type:"continuous", leakage:"low",   tags:["trend","utilization"],        compat_aggs:["difference","ratio","slope","classification"] },
  emi_trend:           { token:"emi_trnd",       col:"EMI",                 data_type:"continuous", leakage:"none",  tags:["trend","repayment"],          compat_aggs:["difference","ratio"] },
  account_count_trend: { token:"acc_trnd",       col:"AccountStatus",       data_type:"count",      leakage:"none",  tags:["trend","volume"],             compat_aggs:["difference","ratio"] },
  emi_to_bal_trend:    { token:"emi_bal_trnd",   col:"EMI/Outstanding_Balance",data_type:"ratio",  leakage:"low",   tags:["trend","derived"],            compat_aggs:["difference","ratio","slope"] },
  active_count_slope:  { token:"act_slp",        col:"AccountStatus",       data_type:"continuous", leakage:"none",  tags:["trend","volume"],             compat_aggs:["slope","difference"] },
  // ── Balance Dynamics ─────────────────────────────────────────────
  outstanding_balance_dyn:{ token:"out_bal_dyn",  col:"Outstanding_Balance", data_type:"continuous", leakage:"low",  tags:["balance","dynamics"],         compat_aggs:["max","min","avg","std","cv","value","ratio","slope"] },
  overdue_amount_dyn:  { token:"ovr_amt_dyn",    col:"Over_due_amount",     data_type:"continuous", leakage:"high",  tags:["delinquency","dynamics"],     compat_aggs:["max","min","avg","std","cv","value","ratio"] },
  peak_balance:        { token:"pk_bal",          col:"Outstanding_Balance", data_type:"continuous", leakage:"low",   tags:["balance","peak"],             compat_aggs:["max","value"] },
  trough_balance:      { token:"tr_bal",          col:"Outstanding_Balance", data_type:"continuous", leakage:"low",   tags:["balance","peak"],             compat_aggs:["min","value"] },
  avg_monthly_balance: { token:"avg_mo_bal",      col:"Outstanding_Balance", data_type:"continuous", leakage:"low",   tags:["balance","dynamics"],         compat_aggs:["avg","value"] },
  balance_volatility:  { token:"bal_vol",         col:"Outstanding_Balance", data_type:"continuous", leakage:"low",   tags:["balance","stability"],        compat_aggs:["std","cv","value"] },
  time_weighted_balance:{ token:"tw_bal",         col:"Outstanding_Balance", data_type:"continuous", leakage:"low",   tags:["balance","derived"],          compat_aggs:["value"] },
  rolling_balance_vol: { token:"roll_bal_vol",    col:"Outstanding_Balance", data_type:"continuous", leakage:"low",   tags:["balance","stability"],        compat_aggs:["value","std"] },
  emi_coverage_ratio:  { token:"emi_cov",         col:"EMI/Outstanding_Balance",data_type:"ratio",  leakage:"none",  tags:["ratio","repayment"],          compat_aggs:["ratio","avg"] },
  // ── Transition Matrix ────────────────────────────────────────────
  dpd_to_dpd0:         { token:"cure_dpd",        col:"DPD",                 data_type:"binary",     leakage:"high",  tags:["transition","delinquency"],   compat_aggs:["count","ratio","flag"] },
  dpd0_to_dpd30:       { token:"dflt_rate",       col:"DPD",                 data_type:"binary",     leakage:"high",  tags:["transition","delinquency"],   compat_aggs:["count","ratio"] },
  dpd30_to_dpd90:      { token:"worsen",          col:"DPD",                 data_type:"binary",     leakage:"high",  tags:["transition","delinquency"],   compat_aggs:["count","ratio"] },
  upgrade_count:       { token:"upg_cnt",         col:"DPD",                 data_type:"count",      leakage:"high",  tags:["transition"],                 compat_aggs:["count","avg"] },
  downgrade_count:     { token:"dwg_cnt",         col:"DPD",                 data_type:"count",      leakage:"high",  tags:["transition","delinquency"],   compat_aggs:["count","avg"] },
  net_transition:      { token:"net_trans",       col:"DPD",                 data_type:"continuous", leakage:"high",  tags:["transition","derived"],       compat_aggs:["value","avg"] },
  // ── Vintage Cohort ───────────────────────────────────────────────
  mob_bucket:          { token:"mob",             col:"DateOpened",          data_type:"categorical",leakage:"none",  tags:["vintage","temporal"],         compat_aggs:["count","ratio"] },
  vintage_dpd_rate:    { token:"vint_dpd",        col:"DPD",                 data_type:"ratio",      leakage:"none",  tags:["vintage","delinquency"],      compat_aggs:["ratio","avg"] },
  vintage_npa_rate:    { token:"vint_npa",        col:"AccountStatus",       data_type:"ratio",      leakage:"none",  tags:["vintage","stress"],           compat_aggs:["ratio"] },
  cumulative_default:  { token:"cum_dflt",        col:"DPD",                 data_type:"ratio",      leakage:"none",  tags:["vintage","delinquency"],      compat_aggs:["ratio"] },
  early_delinquency:   { token:"early_delq",      col:"DPD",                 data_type:"binary",     leakage:"none",  tags:["vintage","delinquency"],      compat_aggs:["flag","ratio"] },
  // ── Stability ────────────────────────────────────────────────────
  psi_score:           { token:"psi",             col:"multiple",            data_type:"continuous", leakage:"none",  tags:["stability","monitoring"],     compat_aggs:["value","flag"] },
  rank_correlation:    { token:"rank_corr",       col:"multiple",            data_type:"continuous", leakage:"none",  tags:["stability","monitoring"],     compat_aggs:["value"] },
  gini_stability:      { token:"gini_stab",       col:"multiple",            data_type:"continuous", leakage:"none",  tags:["stability","monitoring"],     compat_aggs:["value"] },
  feature_drift:       { token:"feat_drift",      col:"multiple",            data_type:"flag",       leakage:"none",  tags:["stability","monitoring"],     compat_aggs:["value","flag"] },
};

// ══════════════════════════════════════════════════════════════════
// COMPATIBILITY ENGINE — Validation Rules
// Fires on wizNext() to catch incompatible selections
// ══════════════════════════════════════════════════════════════════
const COMPATIBILITY_RULES = {
  // Aggregation × Measure incompatibilities
  agg_measure_conflicts: {
    "flag": { requires_binary: true, note: "flag aggregation only valid for binary/event measures" },
    "kurtosis": { min_rec: 4, note: "kurtosis requires ≥4 non-null records per group" },
    "iqr": { min_rec: 4, note: "IQR requires ≥4 records" },
    "outlier_count": { min_rec: 5, note: "outlier detection requires ≥5 records" },
    "skew": { min_rec: 3, note: "skewness requires ≥3 records" },
    "acceleration": { requires_triple_window: true, note: "acceleration needs triple window (3-window diff)" },
    "slope": { requires_rolling_window: true, note: "slope requires rolling window specification" },
    "regression": { requires_rolling_window: true, min_rec: 6, note: "regression needs ≥6 monthly observations" },
    "classification": { requires_window_pair: true, note: "classification requires window pair for comparison" },
  },
  // Sub-category × Aggregation type mismatches
  subcat_agg_conflicts: [
    { subcat:"recency", agg:"sum",  error:"Recency measures represent time elapsed — sum has no meaning" },
    { subcat:"recency", agg:"count",error:"Recency measures yield single time-elapsed value, not a count" },
    { subcat:"vintage", agg:"ratio", warn:"Vintage ratio requires careful cohort denominator definition" },
    { subcat:"stability_score", agg:"sum", error:"Stability scores are derived metrics — sum is not valid" },
    { subcat:"transition_matrix", agg:"avg", warn:"Averaging transition flags — ensure this is intentional" },
  ],
  // Leakage risk rules
  leakage_rules: [
    { tag:"stress",      risk:"high",   note:"Stress indicators (NPA/writeoff/suit) are highly target-correlated — risk of data leakage if target=default. Use with care for live scoring." },
    { tag:"delinquency", risk:"high",   note:"DPD-based features are target-correlated with most default prediction targets." },
    { tag:"transition",  risk:"high",   note:"Transition matrix features derived from the same period as the target variable can cause look-ahead bias." },
    { tag:"balance",     risk:"low",    note:"Balance features are generally safe, but peak/trough measures that include the observation window end-date require care." },
    { tag:"temporal",    risk:"none",   note:"Temporal features are generally leakage-safe." },
  ],
  // Window incompatibilities
  window_rules: [
    { condition:"multi_window AND aggregation=ratio", error:"Cannot compute a single ratio across multiple windows — select one window" },
    { condition:"subcat=recency AND window_selected", warn:"Recency measures do not use time windows (they compute elapsed time to event). Window selection will be ignored." },
    { condition:"trendMode=rolling_slope AND !rolling_window", error:"Rolling slope mode requires a rolling window specification" },
    { condition:"balanceMode=time_weighted AND !decay_type", error:"Time-weighted mode requires decay type selection" },
  ],
  // Naming collision — enforced in generateName()
  name_collision_warning: "A variable with this name already exists in the current build. The generated name will be suffixed with a version number.",
};

// ══════════════════════════════════════════════════════════════════
// VALIDATION ENGINE — Real-time + Pre-Submit
// ══════════════════════════════════════════════════════════════════
let validationState = { errors: [], warnings: [], leakage_flags: [], info: [] };

function runCompatibilityValidation() {
  validationState = { errors: [], warnings: [], leakage_flags: [], info: [] };
  const sc = currentSchema ? currentSchema()[state.subCat] : null;
  const reg = MASTER_REGISTRY[state.measure] || null;

  // ── Aggregation × Sub-category conflicts ──
  COMPATIBILITY_RULES.subcat_agg_conflicts.forEach(rule => {
    if (rule.subcat === state.subCat && rule.agg === state.aggregation) {
      if (rule.error) validationState.errors.push(rule.error);
      if (rule.warn)  validationState.warnings.push(rule.warn);
    }
  });

  // ── Window rules ──
  if (state.subCat === 'recency' && (state.timeWindows.length > 0)) {
    validationState.info.push("Recency measures compute time-to-event and do not use window filtering. Window selection will be ignored.");
  }
  if (state.aggregation === 'slope' && trendMode === 'window_diff') {
    validationState.warnings.push("Slope aggregation works best in Rolling Slope mode (Step 5 → Trend Mode). Window Diff mode will give a simple two-point slope.");
  }
  if (state.aggregation === 'acceleration' && !document.getElementById('accel-w1')) {
    validationState.errors.push("Acceleration requires triple window configuration.");
  }

  // ── Min records checks ──
  if (sc && sc.agg_params && sc.agg_params[state.aggregation]) {
    const p = sc.agg_params[state.aggregation];
    if (p.min_rec) validationState.warnings.push(`${state.aggregation.toUpperCase()} requires at least ${p.min_rec} records per group. Features with sparse data will return null.`);
  }

  // ── Leakage flags from MASTER_REGISTRY ──
  if (reg) {
    const tags = reg.tags || [];
    COMPATIBILITY_RULES.leakage_rules.forEach(lr => {
      if (tags.includes(lr.tag)) {
        validationState.leakage_flags.push({ risk: lr.risk, note: lr.note, tag: lr.tag });
      }
    });
  }

  // ── Enterprise sub-cat info ──
  if (sc && sc.enterprise) {
    validationState.info.push(`Enterprise feature: ${sc.description}`);
  }

  // ── Name collision check ──
  const proposedName = generateName();
  const existing = (window.currentFeatures || []).map(f => f.feature_name);
  if (existing.includes(proposedName)) {
    validationState.warnings.push(`Name collision: "${proposedName}" already exists in build. Will be auto-versioned.`);
  }

  renderValidationPanel();
  return validationState.errors.length === 0;
}

function renderValidationPanel() {
  const panel = document.getElementById('validation-panel');
  if (!panel) return;
  const { errors, warnings, leakage_flags, info } = validationState;
  const total = errors.length + warnings.length + leakage_flags.length + info.length;
  if (total === 0) {
    panel.style.display = 'none';
    return;
  }
  panel.style.display = 'block';
  let html = '';
  errors.forEach(e => { html += `<div class="val-row val-error"><span class="val-icon">✖</span><span>${e}</span></div>`; });
  warnings.forEach(w => { html += `<div class="val-row val-warn"><span class="val-icon">⚠</span><span>${w}</span></div>`; });
  const riskColors = { high:'#dc2626', low:'#d97706', none:'#059669' };
  leakage_flags.forEach(l => {
    html += `<div class="val-row val-leak" style="border-left-color:${riskColors[l.risk]||'#d97706'}"><span class="val-icon" style="color:${riskColors[l.risk]}">${l.risk==='high'?'🔴':'🟡'} Leakage ${l.risk.toUpperCase()}</span><span>${l.note}</span></div>`;
  });
  info.forEach(i => { html += `<div class="val-row val-info"><span class="val-icon">ℹ</span><span>${i}</span></div>`; });
  panel.innerHTML = `<div class="val-header"><span>${errors.length?'❌ Fix before proceeding':'✅ Validation'}</span><span style="font-size:10px;color:var(--text3);">${errors.length} error · ${warnings.length} warn · ${leakage_flags.length} leakage</span></div>${html}`;
  panel.className = 'validation-panel' + (errors.length ? ' has-errors' : '');
}

// ══════════════════════════════════════════════════════════════════
// DETERMINISTIC NAMING ENGINE — Centralized, Consistent
// Single source of truth for all name generation
// Pattern: {prefix}_{scope}_{measure_token}_{mode_token}_{window}_{filters}
// ══════════════════════════════════════════════════════════════════
const AGG_TOKEN = {
  difference:'diff', ratio:'rat', growth_rate:'grw', slope:'slp', avg:'avg', max:'max',
  min:'min', sum:'sum', count:'cnt', flag:'flg', median:'med', std:'std', cv:'cv',
  skew:'skw', kurtosis:'kurt', iqr:'iqr', outlier_count:'outl', percentile:'pct',
  value:'val', acceleration:'accel', volatility:'vol', regression:'reg',
  classification:'cls', rate:'rate', index:'idx', ratio_to_total:'pct_tot',
  entropy:'entr', lag_corr:'lagcr', variance:'var',
};
const MODE_TOKEN = {
  window_diff:'wdiff', rolling_slope:'rslp', volatility:'vol', regression:'reg',
  acceleration:'accel', classification:'cls', point_in_time:'pit', monthly_series:'mseries',
  time_weighted:'twavg', rolling_vol:'rvol', peak_detect:'pk', trajectory:'traj',
};
const RECENCY_DPD_TOKEN = { 30:'dpd30', 60:'dpd60', 90:'dpd90', custom:'dpd_cus' };

function deterministic_name() {
  if (state.featNameOverride && state.featNameOverride.trim()) return state.featNameOverride.trim();
  if (state.aggregationType === 'ratio') return deterministic_ratio_name();

  const isTrade = state.domain === 'trade';
  const isTradeHist = state.domain === 'trade_history';
  const prefix = isTrade ? 'trd' : isTradeHist ? 'trh' : 'inq';
  const parts = [prefix];

  // Scope: loan type + secured + status
  if (isTrade || isTradeHist) {
    const lt = state.tradeScope.loanType;
    if (lt.length === 1) parts.push(lt[0].toLowerCase());
    else if (lt.length > 1 && lt.length <= 3) parts.push(lt.map(x=>x[0].toLowerCase()).join(''));
    const sec = state.tradeScope.secured;
    if (sec === 'secured') parts.push('sec');
    else if (sec === 'unsecured') parts.push('uns');
    const sts = state.tradeScope.status;
    const stsMap = { active:'act', closed:'cls', written_off:'wo', settled:'sttl', suit_filed:'suit', npa:'npa' };
    if (sts && sts !== 'all') parts.push(stsMap[sts] || sts);
  } else {
    const prods = state.filters.product || [];
    if (prods.length === 1) parts.push(prods[0].toLowerCase());
    else if (prods.length > 1) parts.push(prods.map(p=>p[0].toLowerCase()).join(''));
    const subtypeTok = getIntermediateSubtypeToken();
    if (subtypeTok) parts.push(subtypeTok);
  }

  // Measure token — prefer MASTER_REGISTRY, fall back to MMAP
  const reg = MASTER_REGISTRY[state.measure];
  const measureTok = reg ? reg.token : (MMAP[state.measure] || state.measure);
  parts.push(measureTok);

  // Mode token for special sub-categories
  if (state.subCat === 'trend' && trendMode && trendMode !== 'window_diff') {
    parts.push(MODE_TOKEN[trendMode] || trendMode);
  }
  if (state.subCat === 'balance_dynamics' && balanceMode && balanceMode !== 'point_in_time') {
    parts.push(MODE_TOKEN[balanceMode] || balanceMode);
  }
  // Enterprise sub-category mode tokens
  if (state.subCat === 'transition_matrix') {
    // Encode from→to in name: cure_dpd0_30 = DPD0→DPD30
    const fromTok = transitionFrom.replace(/[>=\s]/g,'').replace('DPD','dpd').replace('NPA','npa').replace('Active','act').toLowerCase();
    const toTok   = transitionTo.replace(/[>=\s]/g,'').replace('DPD','dpd').replace('NPA','npa').replace('Closed','clos').toLowerCase();
    parts.push(`${fromTok}_to_${toTok}`);
  }
  if (state.subCat === 'vintage_cohort') {
    const cohortTok = { origination_quarter:'oq', origination_year:'oy', product_type:'pt', sanction_band:'sb' }[vintageCohortBy] || 'coh';
    const mobTok = vintageMOBBand.toLowerCase().replace('mob_','').replace('_','-');
    parts.push(`vint_${cohortTok}_mob${mobTok}`);
  }
  if (state.subCat === 'stability_score') {
    const refTok = (document.getElementById('stability-ref-period')?.value || '12m').replace('m','');
    parts.push(`stab_ref${refTok}`);
  }
  if (state.subCat === 'recency') {
    // Include event filter in token
    const mv = TRD_SCHEMA.recency && TRD_SCHEMA.recency.measures[state.measure];
    if (mv && mv.event_filter && mv.event_filter.field === 'DPD') {
      const dpd = recencyDPDThreshold;
      parts.push(RECENCY_DPD_TOKEN[dpd] || `dpd${dpd}`);
    } else if (mv && mv.event_filter && mv.event_filter.field === 'writeoff_amt_tot') {
      parts.push(recencyWOAmount === 'custom' ? 'wo_cus' : `wo${recencyWOAmount||0}`);
    }
  }

  // Aggregation token
  const agg = state.aggregation;
  if (agg && agg !== 'value') {
    const aggTok = AGG_TOKEN[agg] || agg;
    // Skip if already implied by mode
    if (!(state.subCat === 'trend' && trendMode !== 'window_diff')) parts.push(aggTok);
  }

  // Window token
  if (state.velPair) {
    parts.push(`${state.velPair[0].replace('m','')}_${state.velPair[1].replace('m','')}`);
  } else if (state.subCat === 'trend' && ['rolling_slope','volatility','regression'].includes(trendMode)) {
    const winMap = { rolling_slope: trendRollingWin.slope, volatility: trendRollingWin.vol, regression: trendRollingWin.reg };
    parts.push(winMap[trendMode] || '12m');
  } else if (state.timeWindows.length > 0 && state.subCat !== 'recency') {
    state.timeWindows.forEach(w => {
      parts.push((w === 'custom' && state.customWindow) ? state.customWindow + 'm' : w);
    });
  } else if (state.subCat === 'trend' && trendMode === 'acceleration') {
    const w1 = document.getElementById('accel-w1')?.value || '3m';
    const w2 = document.getElementById('accel-w3')?.value || '12m';
    parts.push(`${w1.replace('m','')}_${w2.replace('m','')}`);
  }

  // DPD condition suffix (for delinquency variables)
  const dpdEl = document.getElementById('dpd-val');
  if (dpdEl && dpdEl.value && isTrade && state.subCat !== 'recency') {
    parts.push(`dpd${dpdEl.value}`);
  }

  // Collision detection — append version if needed
  const base = parts.join('_');
  const existing = (window.currentFeatures || []).map(f => f.feature_name);
  if (existing.includes(base)) {
    let v = 2;
    while (existing.includes(`${base}_v${v}`)) v++;
    return `${base}_v${v}`;
  }
  return base;
}

function deterministic_ratio_name() {
  if (state.featNameOverride && state.featNameOverride.trim()) return state.featNameOverride.trim();
  const isTradeHist = state.domain === 'trade_history';
  const prefix = state.domain === 'trade' ? 'trd' : isTradeHist ? 'trh' : 'inq';
  const parts = [prefix];
  const prods = (state.domain === 'trade' || isTradeHist) ? state.tradeScope.loanType : (state.filters.product || []);
  if (prods.length === 1) parts.push(prods[0].toLowerCase());

  if (ratioState.type === 'w2w') {
    const reg = MASTER_REGISTRY[ratioState.w2w.metric];
    const tok = reg ? reg.token : (MMAP[ratioState.w2w.metric] || ratioState.w2w.metric);
    parts.push(`${tok}_w2w_${ratioState.w2w.numerator.replace('m','')}_${ratioState.w2w.denominator.replace('m','')}`);
  } else if (ratioState.type === 'cross') {
    const num = (document.getElementById('cm-numerator-metric')?.value||'num').replace(/_/g,'').toLowerCase().slice(0,8);
    const den = (document.getElementById('cm-denominator-metric')?.value||'den').replace(/_/g,'').toLowerCase().slice(0,8);
    parts.push(`xm_${num}_by_${den}`);
    if (ratioState.cross.window) parts.push(ratioState.cross.window);
  } else if (ratioState.type === 'norm') {
    const m = ratioState.norm.metric.replace(/_/g,'').slice(0,8);
    const b = ratioState.norm.by.replace(/per_/,'').replace(/_/g,'').slice(0,6);
    parts.push(`norm_${m}_per_${b}_${ratioState.norm.window||'12m'}`);
  } else if (ratioState.type === 'p2p') {
    const mTok = {balance:'bal',count:'cnt',sanction:'sanc',emi:'emi'}[ratioState.p2p.metric] || 'met';
    parts.push(`p2p_${(ratioState.p2p.num||'na').toLowerCase()}_${(ratioState.p2p.den||'all').toLowerCase()}_${mTok}`);
    if (ratioState.p2p.window) parts.push(ratioState.p2p.window);
  } else {
    parts.push(state.subCat || 'ratio');
    parts.push(state.ratioMethod || 'simple');
    if (state.timeWindows.length) parts.push(state.timeWindows[0]);
  }

  const base = parts.join('_');
  const existing = (window.currentFeatures || []).map(f => f.feature_name);
  if (existing.includes(base)) {
    let v = 2; while (existing.includes(`${base}_v${v}`)) v++;
    return `${base}_v${v}`;
  }
  return base;
}

// Override legacy generateName() to use deterministic engine
function generateName() { return deterministic_name(); }
function generateRatioName() { return deterministic_ratio_name(); }

// ══════════════════════════════════════════════════════════════════
// FEATURE TAGGING ENGINE
// Auto-generates feature metadata tags on every variable
// ══════════════════════════════════════════════════════════════════
const TAG_CONFIG = {
  // Visual display
  delinquency: { color:'#dc2626', bg:'rgba(220,38,38,0.08)', icon:'⚠' },
  stress:      { color:'#b45309', bg:'rgba(180,83,9,0.08)',  icon:'🔴' },
  balance:     { color:'#0f766e', bg:'rgba(15,118,110,0.08)',icon:'💰' },
  recency:     { color:'#7c3aed', bg:'rgba(124,58,237,0.08)',icon:'🕐' },
  trend:       { color:'#2563eb', bg:'rgba(37,99,235,0.08)', icon:'📈' },
  ratio:       { color:'#059669', bg:'rgba(5,150,105,0.08)', icon:'÷' },
  vintage:     { color:'#d97706', bg:'rgba(217,119,6,0.08)', icon:'📅' },
  transition:  { color:'#6366f1', bg:'rgba(99,102,241,0.08)',icon:'↔' },
  stability:   { color:'#0891b2', bg:'rgba(8,145,178,0.08)', icon:'📊' },
  exposure:    { color:'#0f766e', bg:'rgba(15,118,110,0.08)',icon:'🏦' },
  volume:      { color:'#6366f1', bg:'rgba(99,102,241,0.08)',icon:'#' },
  behavioral:  { color:'#7c3aed', bg:'rgba(124,58,237,0.08)',icon:'🧠' },
  derived:     { color:'#8898b4', bg:'rgba(136,152,180,0.08)',icon:'∫' },
  concentration:{ color:'#d97706', bg:'rgba(217,119,6,0.08)',icon:'⬤' },
};

function computeFeatureTags(feature) {
  const tags = new Set();
  // From MASTER_REGISTRY
  const reg = MASTER_REGISTRY[feature.measure];
  if (reg && reg.tags) reg.tags.forEach(t => tags.add(t));
  // From sub-category
  const subTagMap = {
    recency:'recency', trend:'trend', balance_dynamics:'balance', transition_matrix:'transition',
    vintage_cohort:'vintage', stability_score:'stability', delinquency:'delinquency',
    utilization:'ratio', risk_ratio:'ratio', portfolio_mix:'ratio', exposure:'exposure',
    volume:'volume', vintage:'vintage',
    // Account sub-categories (new)
    distribution:'behavioral', concentration:'ratio', utilization_profile:'ratio',
    delinquency_profile:'delinquency', portfolio_count:'volume', portfolio_exposure:'exposure',
    account_mix:'ratio', derived_ratios:'ratio', behavioral:'behavioral', velocity:'trend',
  };
  if (subTagMap[feature.sub]) tags.add(subTagMap[feature.sub]);
  // Trend mode tags
  if (feature.trend_mode) {
    if (['rolling_slope','regression'].includes(feature.trend_mode)) tags.add('behavioral');
    if (feature.trend_mode === 'volatility') tags.add('behavioral');
    if (feature.trend_mode === 'acceleration') tags.add('derived');
  }
  // Balance mode tags
  if (feature.balance_mode && feature.balance_mode !== 'point_in_time') tags.add('behavioral');
  if (feature.balance_mode === 'time_weighted') tags.add('derived');
  return [...tags].filter(t => TAG_CONFIG[t]);
}

function computeLeakageRisk(feature) {
  const reg = MASTER_REGISTRY[feature.measure];
  if (!reg) return { risk: 'unknown', color: '#8898b4' };
  const leakage = reg.leakage || 'none';
  const colors = { none:'#059669', low:'#d97706', high:'#dc2626', unknown:'#8898b4' };
  return { risk: leakage, color: colors[leakage] };
}

function renderFeatureTags(feature) {
  const tags = computeFeatureTags(feature);
  const leakage = computeLeakageRisk(feature);
  let html = '';
  tags.slice(0,4).forEach(t => {
    const cfg = TAG_CONFIG[t] || {};
    html += `<span class="ftag" style="color:${cfg.color};background:${cfg.bg};">${cfg.icon||''} ${t}</span>`;
  });
  if (leakage.risk === 'high') {
    html += `<span class="ftag ftag-leak" style="color:#dc2626;background:rgba(220,38,38,0.08);">🔴 leakage</span>`;
  } else if (leakage.risk === 'low') {
    html += `<span class="ftag ftag-leak" style="color:#d97706;background:rgba(217,119,6,0.08);">🟡 low-leak</span>`;
  }
  return html;
}

// ══════════════════════════════════════════════════════════════════
// ADVANCED RULE BUILDER — DSL
// Multi-condition grouping: (A AND B) OR (C AND D)
// ══════════════════════════════════════════════════════════════════
let ruleGroups = [];  // Array of condition groups; groups are OR'd; conditions within are AND'd

const RULE_FIELDS = [
  { key:'DPD',              label:'DPD',                 type:'number' },
  { key:'Over_due_amount',  label:'Overdue Amount',      type:'number' },
  { key:'Outstanding_Balance', label:'Outstanding Balance', type:'number' },
  { key:'AccountStatus',    label:'Account Status',      type:'select', options:['Active','Closed','NPA','Written-Off','Settled','Suit-Filed'] },
  { key:'AccountType',      label:'Account Type',        type:'select', options:['PL','CC','HL','AL','BL','GL','OD','LAP'] },
  { key:'writeoff_amt_tot', label:'Writeoff Amount',     type:'number' },
  { key:'CreditLimit',      label:'Credit Limit',        type:'number' },
  { key:'EMI',              label:'EMI',                 type:'number' },
  { key:'SuitFiled_Flag',   label:'Suit Filed',          type:'flag' },
  { key:'Sanction_Amount',  label:'Sanction Amount',     type:'number' },
  { key:'MOB',              label:'Months on Book',      type:'number' },
  { key:'LenderCount',      label:'Lender Count',        type:'number' },
];

function addRuleGroup() {
  const gid = Date.now();
  ruleGroups.push({ id: gid, conditions: [], operator:'AND' });
  renderRuleBuilder();
}

function addConditionToGroup(gid) {
  const g = ruleGroups.find(g => g.id === gid);
  if (!g) return;
  const cid = Date.now() + Math.random();
  g.conditions.push({ id: cid, field: 'DPD', op: '>=', value: '', value_type: 'static' });
  renderRuleBuilder();
}

function removeCondition(gid, cid) {
  const g = ruleGroups.find(g => g.id === gid);
  if (!g) return;
  g.conditions = g.conditions.filter(c => c.id !== cid);
  if (g.conditions.length === 0) ruleGroups = ruleGroups.filter(x => x.id !== gid);
  renderRuleBuilder();
  updateLiveJSON();
}

function updateConditionField(gid, cid, key, val) {
  const g = ruleGroups.find(g => g.id === gid);
  if (!g) return;
  const c = g.conditions.find(c => c.id === cid);
  if (!c) return;
  c[key] = val;
  renderRuleBuilder();
  updateLiveJSON();
}

function toggleGroupOperator(gid) {
  const g = ruleGroups.find(g => g.id === gid);
  if (!g) return;
  g.operator = g.operator === 'AND' ? 'OR' : 'AND';
  renderRuleBuilder();
  updateLiveJSON();
}

function buildRuleDSL() {
  // Returns structured filter_rules JSON for schema output
  if (!ruleGroups.length) return null;
  return {
    logic: "OR",
    groups: ruleGroups.map(g => ({
      logic: g.operator,
      conditions: g.conditions.map(c => ({
        field: c.field,
        operator: c.op,
        value: isNaN(Number(c.value)) ? c.value : Number(c.value),
      })).filter(c => c.value !== '' && c.value !== null)
    })).filter(g => g.conditions.length > 0)
  };
}

function renderRuleBuilder() {
  const container = document.getElementById('rule-builder-groups');
  if (!container) return;
  if (!ruleGroups.length) {
    container.innerHTML = '<div style="font-size:12px;color:var(--text3);text-align:center;padding:16px;">No conditions added. Click "+ Add Condition Group" to begin.</div>';
    return;
  }

  container.innerHTML = ruleGroups.map((g, gi) => {
    const conds = g.conditions.map((c, ci) => {
      const fieldOpts = RULE_FIELDS.map(f => `<option value="${f.key}" ${c.field===f.key?'selected':''}>${f.label}</option>`).join('');
      const fd = RULE_FIELDS.find(f => f.key === c.field) || {};
      const ops = (fd.type === 'select' || fd.type === 'flag')
        ? ['=','!='].map(op => `<option value="${op}" ${c.op===op?'selected':''}>${op}</option>`).join('')
        : ['>=','>','<=','<','=','!='].map(op => `<option value="${op}" ${c.op===op?'selected':''}>${op}</option>`).join('');
      const valInput = fd.type === 'select'
        ? `<select class="rule-val" onchange="updateConditionField(${g.id},${c.id},'value',this.value)">${fd.options.map(o=>`<option ${c.value===o?'selected':''}>${o}</option>`).join('')}</select>`
        : fd.type === 'flag'
        ? `<select class="rule-val" onchange="updateConditionField(${g.id},${c.id},'value',this.value)"><option value="1" ${c.value==='1'?'selected':''}>Yes (1)</option><option value="0" ${c.value==='0'?'selected':''}>No (0)</option></select>`
        : `<input type="number" class="rule-val" value="${c.value}" placeholder="value" onchange="updateConditionField(${g.id},${c.id},'value',this.value)" oninput="updateConditionField(${g.id},${c.id},'value',this.value)">`;

      return `<div class="rule-cond-row" id="rcond-${c.id}">
        ${ci > 0 ? `<div class="rule-logic-badge" onclick="toggleGroupOperator(${g.id})" title="Click to toggle AND/OR">${g.operator}</div>` : '<div class="rule-logic-first">IF</div>'}
        <select class="rule-field" onchange="updateConditionField(${g.id},${c.id},'field',this.value)">${fieldOpts}</select>
        <select class="rule-op" onchange="updateConditionField(${g.id},${c.id},'op',this.value)">${ops}</select>
        ${valInput}
        <button class="rule-del-btn" onclick="removeCondition(${g.id},${c.id})" title="Remove condition">✕</button>
      </div>`;
    }).join('');

    const orBadge = gi > 0 ? '<div class="rule-group-or">OR</div>' : '';
    return `${orBadge}<div class="rule-group" id="rg-${g.id}">
      <div class="rule-group-header">
        <span class="rule-group-label">Group ${gi+1} <span class="rule-group-op-badge">${g.operator}</span></span>
        <div style="display:flex;gap:6px;">
          <button class="rule-act-btn" onclick="addConditionToGroup(${g.id})">+ Condition</button>
          <button class="rule-act-btn" onclick="removeRuleGroup(${g.id})" style="color:var(--danger);">✕ Group</button>
        </div>
      </div>
      <div class="rule-conds">${conds || '<div style="font-size:11px;color:var(--text3);padding:6px 0;">Click "+ Condition" to add</div>'}</div>
    </div>`;
  }).join('');

  // Update DSL preview
  const dslEl = document.getElementById('rule-dsl-preview');
  if (dslEl) {
    const dsl = buildRuleDSL();
    dslEl.textContent = dsl ? JSON.stringify(dsl, null, 2) : '(no conditions)';
  }
}

function removeRuleGroup(gid) {
  ruleGroups = ruleGroups.filter(g => g.id !== gid);
  renderRuleBuilder();
  updateLiveJSON();
}

function clearRuleBuilder() {
  ruleGroups = [];
  renderRuleBuilder();
  updateLiveJSON();
}

// ══════════════════════════════════════════════════════════════════
// VINTAGE COHORT ENGINE STATE
// ══════════════════════════════════════════════════════════════════
let vintageCohortBy = 'origination_quarter';
let vintageMOBBand = 'MOB_7_12';
let vintageMetric = 'vintage_dpd_rate';

function selVintageCohortBy(el, val) {
  vintageCohortBy = val;
  el.parentElement.querySelectorAll('.vchip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  updateLiveJSON();
}

function selVintageMOB(el, val) {
  vintageMOBBand = val;
  el.parentElement.querySelectorAll('.vchip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  updateLiveJSON();
}

// ══════════════════════════════════════════════════════════════════
// TRANSITION MATRIX ENGINE STATE
// ══════════════════════════════════════════════════════════════════
let transitionFrom = 'DPD=0';
let transitionTo   = 'DPD>=30';

function selTransitionFrom(el, val) {
  transitionFrom = val;
  el.parentElement.querySelectorAll('.trans-chip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  updateTransitionPreview();
  updateLiveJSON();
}

function selTransitionTo(el, val) {
  transitionTo = val;
  el.parentElement.querySelectorAll('.trans-chip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  updateTransitionPreview();
  updateLiveJSON();
}

function updateTransitionPreview() {
  const el = document.getElementById('transition-formula-preview');
  if (!el) return;
  el.innerHTML = `<span style="color:#7cb9e8;">transition</span>: accounts where state changed from [<span style="color:#79e9a4;">${transitionFrom}</span>] → [<span style="color:#f8c8a0;">${transitionTo}</span>]\n<span style="color:#7cb9e8;">window</span>: consecutive months in selected time window\n<span style="color:#f8c8a0;">output</span>: count or rate of accounts making this transition`;
}

// Measure → allowed aggregation overrides
const MEASURE_AGG_MAP = {
  count_change:["difference"], count_ratio:["ratio"], growth_rate:["growth_rate"], slope:["slope"],
  utilization_ratio:["avg","max","ratio","flag"], high_util_flag:["flag"],
  delinquent_flag:["flag","count"], closure_rate:["ratio"], loan_type_hhi:["index"],
  high_utilization_ratio:["ratio"],delinquent_ratio:["ratio"],
  months_since_last_open:["value","min","max"], months_since_last_closed:["value","min","max"],
  months_since_last_delinquency:["value","min","max"], months_since_last_writeoff:["value","min","max"],
  months_since_last_dpd:["value","min","max"], months_since_last_npa:["value","min","max"],
  months_since_peak_exposure:["value"], recency_of_transition:["value","min","max"],
  months_since_last_suit:["value","min","max"],
  balance_acceleration:["acceleration"], dpd_acceleration:["acceleration"],
  balance_trajectory:["classification"],
  peak_balance:["max","value"], trough_balance:["min","value"],
  avg_monthly_balance:["avg","value"], balance_volatility:["std","cv","value"],
  balance_range:["value"], months_at_peak:["value"], balance_cv:["cv","value"],
  overdue_peak:["max","value"], avg_overdue:["avg","value"], emi_coverage_ratio:["ratio","avg"],
  months_since_last_payment:["value","min","max"], months_since_last_settled:["value","min","max"],
  balance_growth:["difference","ratio","slope","growth_rate"],
  utilization_change:["difference","ratio","slope"],
  dpd_trend:["difference","slope"], overdue_trend:["difference","slope"],
  emi_trend:["difference","ratio"], account_count_trend:["difference","ratio"],
  emi_to_bal_trend:["difference","ratio","slope"], active_count_slope:["slope","difference"],
  // Enterprise: Transition Matrix
  dpd_to_dpd0:["count","ratio","flag"], dpd0_to_dpd30:["count","ratio"],
  dpd30_to_dpd90:["count","ratio"], dpd90_to_dpd0:["count","ratio"],
  active_to_closed:["count","ratio","flag"], active_to_npa:["count","ratio","flag"],
  npa_to_active:["count","ratio"], upgrade_count:["count","avg"],
  downgrade_count:["count","avg"], net_transition:["value","avg"],
  // Enterprise: Vintage Cohort
  mob_bucket:["count","ratio"], vintage_dpd_rate:["ratio","avg"],
  vintage_npa_rate:["ratio"], cumulative_default:["ratio"],
  early_delinquency:["flag","ratio"], vintage_cohort_size:["count"],
  vintage_avg_balance:["avg","value"], vintage_survival_rate:["ratio"],
  // Enterprise: Stability
  psi_score:["value","flag"], rank_correlation:["value"],
  gini_stability:["value"], feature_drift:["value","flag"],
  value_volatility:["value","std"], monotonicity_score:["value"],
  // Account: Recency
  months_since_last_acc_open:["value","min","max"], months_since_last_acc_close:["value","min","max"],
  months_since_last_acc_delq:["value","min","max"], months_since_last_acc_wo:["value","min","max"],
  months_since_last_acc_npa:["value","min","max"], months_since_last_acc_settled:["value","min","max"],
  months_since_last_acc_overdue:["value","min","max"], months_since_oldest_acc:["value"],
  months_since_newest_acc:["value"],
  // Account: Trend
  balance_change:["difference","growth_rate","ratio","slope"], overdue_change:["difference","growth_rate","ratio"],
  account_count_change:["difference","growth_rate"], lender_count_chg:["difference"],
  dpd_change:["difference","ratio"], utilization_change_acc:["difference","ratio"],
  emi_change:["difference","ratio"],
  // Account: Distribution
  balance_distribution:["std","cv","skew","percentile","iqr","median"],
  overdue_distribution:["std","cv","skew","percentile","iqr","median"],
  sanction_distribution:["std","cv","skew","percentile","iqr","median"],
  emi_distribution:["std","cv","percentile","median"],
  dpd_distribution:["std","cv","skew","percentile","iqr","median"],
  // Account: Concentration
  top_lender_exposure:["ratio"], top_lender_count:["ratio"],
  lender_hhi:["index"], loan_type_hhi_conc:["index"],
  single_lender_ratio:["ratio"], top3_lender_share:["ratio"],
  // Account: Vintage
  avg_account_age_mth:["avg","value"], oldest_account_age:["max","value"],
  newest_account_age:["min","value"], median_account_age:["median"],
  vintage_band_count:["count"], weighted_avg_age:["avg","value"],
  // Account: Utilization (balance/sanction)
  balance_utilization:["ratio","avg","max"], overdue_utilization:["ratio","avg","max"],
  avg_util_all_accs:["avg","ratio"], max_single_util:["max","ratio"],
  util_above_80_count:["count"], util_above_90_flag:["flag"],
  emi_to_outstanding:["ratio","avg"],
  credit_utilization:["ratio","avg","max"], high_util_ratio:["ratio"],
  // Account: Product Mix (NEW)
  product_mix_score:["index","avg"], unique_product_count:["count"],
  product_hhi:["index"], secured_product_share:["ratio"],
  revolving_product_share:["ratio"], installment_product_share:["ratio"],
  cc_to_total_ratio:["ratio"], hl_to_total_ratio:["ratio"],
  unsecured_product_count:["count"],
  // Account: Lifecycle (NEW)
  new_accounts_opened:["count","ratio"], accounts_closed_period:["count","ratio"],
  net_account_change:["count"], newly_opened_balance:["sum","avg"],
  newly_closed_balance:["sum","avg"], new_to_total_ratio:["ratio"],
  churned_account_ratio:["ratio"], first_account_age:["avg","value"],
  avg_age_new_accounts:["avg","value"],
  // Account: Delinquency Severity (NEW)
  dpd_90plus_accounts:["count","ratio"], dpd_60plus_accounts:["count","ratio"],
  dpd_30plus_accounts:["count","ratio"], dpd_severity_index:["index","value"],
  max_dpd_across_accounts:["max","value"], avg_dpd_delinquent:["avg","value"],
  dpd_bucket_score:["index","value"], severe_delinquency_ratio:["ratio"],
  overdue_severity_amount:["sum","avg"], npa_exposure_ratio:["ratio"],
  // Account: Cross Entity (NEW)
  accounts_with_inquiry_last_30d:["count","flag"], accounts_with_inquiry_last_90d:["count","flag"],
  inquiry_count_on_active_accs:["count","avg"], inquiry_to_account_ratio:["ratio"],
  trade_to_account_balance_ratio:["ratio"], accounts_with_trade_dpd:["count","flag"],
  cross_entity_util_rate:["ratio","avg"], inq_count_per_active_lender:["avg","ratio"],
  trade_overdue_on_acc_portfolio:["sum","ratio"],
  // Account: Utilization Engine
  credit_utilization_ratio:["ratio","avg","max"], balance_to_sanction_ratio:["ratio","avg","max"],
  overdue_to_balance_ratio:["ratio","avg"], emi_to_limit_ratio:["ratio","avg"],
  avg_utilization:["avg"], max_utilization_account:["max"],
  high_util_accounts:["count"], high_util_accounts_ratio:["ratio"],
  util_above_80:["count"], util_above_90:["count"],
  avg_utilization_12m:["avg"], max_utilization_12m:["max"],
  utilization_trend:["slope","difference"], utilization_volatility:["std","value"],
  weighted_util:["value","avg"],
  // Account: Payment Behavior
  on_time_payment_ratio:["ratio","avg"], missed_payment_count:["count","avg"],
  dpd_transition_rate:["ratio"], rolling_dpd_trend:["slope","value"],
  consecutive_clean_months:["value","max"], consecutive_dpd_months:["value","max"],
  payment_consistency_score:["value","avg"], ever_missed_12m:["flag"],
  avg_dpd_when_delinquent:["avg","value"], improvement_indicator:["flag"],
  delinquency_frequency:["ratio","avg"],
  // Account: Credit Mix
  credit_mix_score:["index","value"], secured_to_unsecured_ratio:["ratio"],
  secured_exposure_ratio:["ratio"], loan_type_diversity:["index"],
  revolving_to_installment:["ratio"], has_both_types:["flag"],
  unsecured_exposure_share:["ratio"], dominant_product_share:["ratio"],
  cc_exposure_share:["ratio"], hl_exposure_share:["ratio"],
  pl_unsecured_dominance:["ratio"],
};

// ══════════════════════════════════════════
// PRE-DEFINED TEMPLATES — EXPANDED
// ══════════════════════════════════════════
const PREDEF_LIBRARY = [
  // ── Enquiry ──
  {name:"Total Enquiries (Last 6m)",      domain:"enquiry", sub:"volume",  measure:"count",             agg:"count",      product:[],     window:"6m",   type:"volume"},
  {name:"PL Enquiries (Last 3m)",          domain:"enquiry", sub:"volume",  measure:"count",             agg:"count",      product:["PL"], window:"3m",   type:"volume"},
  {name:"CC Enquiries (Last 12m)",         domain:"enquiry", sub:"volume",  measure:"count",             agg:"count",      product:["CC"], window:"12m",  type:"volume"},
  {name:"Avg Inq Amount (6m)",             domain:"enquiry", sub:"amount",  measure:"inquiry_amount",    agg:"avg",        product:[],     window:"6m",   type:"amount"},
  {name:"Max Inq Amount (12m)",            domain:"enquiry", sub:"amount",  measure:"inquiry_amount",    agg:"max",        product:[],     window:"12m",  type:"amount"},
  {name:"Months Since Last Inq",           domain:"enquiry", sub:"recency", measure:"months_since_last", agg:"value",      product:[],     window:null,   type:"recency"},
  {name:"Avg Days Between Inq 6m",         domain:"enquiry", sub:"gap",     measure:"days_between",      agg:"avg",        product:[],     window:"6m",   type:"gap"},
  {name:"Inq Count Growth 3m→12m",         domain:"enquiry", sub:"velocity",measure:"count_change",      agg:"difference", product:[],     window_pair:["3m","12m"], type:"velocity"},
  {name:"Secured/Unsec Ratio 6m",          domain:"enquiry", sub:"mix",     measure:"secured_unsecured_ratio", agg:"ratio", product:[],  window:"6m",   type:"mix"},
  {name:"Distinct Lenders 12m",            domain:"enquiry", sub:"concentration",     measure:"distinct_lenders",     agg:"count", product:[], window:"12m", type:"concentration"},
  // ── Enquiry: Product Diversity ──
  {name:"Distinct Products 6m",            domain:"enquiry", sub:"product_diversity",  measure:"distinct_products",      agg:"count", product:[], window:"6m",  type:"product_diversity"},
  {name:"Product HHI 12m",                 domain:"enquiry", sub:"product_diversity",  measure:"product_hhi",             agg:"index", product:[], window:"12m", type:"product_diversity"},
  {name:"Top Product Share 6m",            domain:"enquiry", sub:"product_diversity",  measure:"dominant_product_share",  agg:"ratio", product:[], window:"6m",  type:"product_diversity"},
  // ── Enquiry: Secured Split ──
  {name:"Secured Inq Count 6m",            domain:"enquiry", sub:"secured_split",      measure:"secured_count",           agg:"count", product:[], window:"6m",  type:"secured_split"},
  {name:"Secured Inq Ratio 6m",            domain:"enquiry", sub:"secured_split",      measure:"secured_ratio",           agg:"ratio", product:[], window:"6m",  type:"secured_split"},
  {name:"Unsecured Inq Count 12m",         domain:"enquiry", sub:"secured_split",      measure:"unsecured_count",         agg:"count", product:[], window:"12m", type:"secured_split"},
  // ── Enquiry: Amount Bucket ──
  {name:"Inq Count lt 25K (6m)",           domain:"enquiry", sub:"amount_bucket",      measure:"bucket_lt_25k",           agg:"count", product:[], window:"6m",  type:"amount_bucket"},
  {name:"Inq Count 25K-1L (6m)",           domain:"enquiry", sub:"amount_bucket",      measure:"bucket_25k_1l",           agg:"count", product:[], window:"6m",  type:"amount_bucket"},
  {name:"Inq Count 1L-5L (12m)",           domain:"enquiry", sub:"amount_bucket",      measure:"bucket_1l_5l",            agg:"count", product:[], window:"12m", type:"amount_bucket"},
  {name:"Inq Count gt 5L (12m)",           domain:"enquiry", sub:"amount_bucket",      measure:"bucket_gt_5l",            agg:"count", product:[], window:"12m", type:"amount_bucket"},
  // ── Enquiry: Inter-Enquiry Timing ──
  {name:"Enquiry Span Months 12m",         domain:"enquiry", sub:"inter_enquiry_timing",measure:"enquiry_span_months",    agg:"value", product:[], window:"12m", type:"inter_enquiry_timing"},
  {name:"Burst Count 30d (6m)",            domain:"enquiry", sub:"inter_enquiry_timing",measure:"burst_count_30d",        agg:"count", product:[], window:"6m",  type:"inter_enquiry_timing"},
  {name:"Burst Flag 30d (3m)",             domain:"enquiry", sub:"inter_enquiry_timing",measure:"burst_flag",             agg:"flag",  product:[], window:"3m",  type:"inter_enquiry_timing"},
  // ── Trade: Volume ──
  {name:"Active Account Count (12m)",      domain:"trade",   sub:"volume",  measure:"active_count",      agg:"count",      loanType:[], secured:"all", status:"active",  window:"12m",  type:"volume"},
  {name:"Total Account Count (All)",       domain:"trade",   sub:"volume",  measure:"total_count",       agg:"count",      loanType:[], secured:"all", status:"all",     window:"12m",  type:"volume"},
  {name:"Closed Account Count (24m)",      domain:"trade",   sub:"volume",  measure:"closed_count",      agg:"count",      loanType:[], secured:"all", status:"closed",  window:"24m",  type:"volume"},
  {name:"Writeoff Count (24m)",            domain:"trade",   sub:"volume",  measure:"writeoff_count",    agg:"count",      loanType:[], secured:"all", status:"all",     window:"24m",  type:"volume"},
  // ── Trade: Exposure / Balance Type ──
  {name:"Sum Active Balance (12m)",        domain:"trade",   sub:"exposure",measure:"current_balance",   agg:"sum",        loanType:[], secured:"all", status:"active",  window:"12m",  type:"amount"},
  {name:"Sum Sanction Amount (12m)",       domain:"trade",   sub:"exposure",measure:"sanctioned_amount", agg:"sum",        loanType:[], secured:"all", status:"all",     window:"12m",  type:"amount"},
  {name:"Avg EMI Amount (Active)",         domain:"trade",   sub:"exposure",measure:"emi_amount",        agg:"avg",        loanType:[], secured:"all", status:"active",  window:"12m",  type:"amount"},
  {name:"Sum Overdue Amount (12m)",        domain:"trade",   sub:"exposure",measure:"overdue_amount",    agg:"sum",        loanType:[], secured:"all", status:"all",     window:"12m",  type:"amount"},
  {name:"Max Writeoff Amount (36m)",       domain:"trade",   sub:"exposure",measure:"writeoff_amount",   agg:"max",        loanType:[], secured:"all", status:"all",     window:"36m",  type:"amount"},
  {name:"Avg Settlement Amount (36m)",     domain:"trade",   sub:"exposure",measure:"settlement_amount", agg:"avg",        loanType:[], secured:"all", status:"all",     window:"36m",  type:"amount"},
  // ── Trade: Distribution Stats ── ✅ NEW
  {name:"StdDev of Outstanding (12m)",     domain:"trade",   sub:"exposure",measure:"current_balance",   agg:"std",        loanType:[], secured:"all", status:"active",  window:"12m",  type:"distribution"},
  {name:"CV of Outstanding (12m)",         domain:"trade",   sub:"exposure",measure:"current_balance",   agg:"cv",         loanType:[], secured:"all", status:"active",  window:"12m",  type:"distribution"},
  {name:"Median EMI Amount (Active)",      domain:"trade",   sub:"exposure",measure:"emi_amount",        agg:"median",     loanType:[], secured:"all", status:"active",  window:"12m",  type:"distribution"},
  {name:"Skewness of DPD (12m)",           domain:"trade",   sub:"delinquency",measure:"dpd",           agg:"skew",       loanType:[], secured:"all", status:"all",     window:"12m",  type:"distribution"},
  {name:"Variance of Utilization (6m)",    domain:"trade",   sub:"utilization",measure:"utilization_ratio",agg:"cv",       loanType:["CC"], secured:"all", status:"active", window:"6m", type:"distribution"},
  // ── Trade: Delinquency ──
  {name:"Max DPD (12m)",                   domain:"trade",   sub:"delinquency",measure:"dpd",           agg:"max",        loanType:[], secured:"all", status:"all",     window:"12m",  type:"trade"},
  {name:"DPD 90+ Count (24m)",             domain:"trade",   sub:"delinquency",measure:"dpd_90",        agg:"count",      loanType:[], secured:"all", status:"all",     window:"24m",  type:"trade"},
  {name:"Avg CC Utilization (6m)",         domain:"trade",   sub:"utilization",measure:"utilization_ratio",agg:"avg",      loanType:["CC"], secured:"all", status:"active", window:"6m", type:"trade"},
  {name:"Months Since Oldest Account",     domain:"trade",   sub:"vintage", measure:"months_since_oldest",agg:"value",     loanType:[], secured:"all", status:"all",     window:null,   type:"trade"},
  // ── Trade: Recency ── ✅ NEW
  {name:"Months Since Last Delinquency",   domain:"trade",   sub:"recency", measure:"months_since_last_delinquency", agg:"value", loanType:[], secured:"all", status:"all", window:null, type:"recency"},
  {name:"Months Since Last Open",          domain:"trade",   sub:"recency", measure:"months_since_last_open",        agg:"value", loanType:[], secured:"all", status:"all", window:null, type:"recency"},
  {name:"Months Since Last Payment",       domain:"trade",   sub:"recency", measure:"months_since_last_payment",     agg:"value", loanType:[], secured:"all", status:"all", window:null, type:"recency"},
  {name:"Months Since Last Writeoff",      domain:"trade",   sub:"recency", measure:"months_since_last_writeoff",    agg:"value", loanType:[], secured:"all", status:"all", window:null, type:"recency"},
  {name:"Months Since Last Closed",        domain:"trade",   sub:"recency", measure:"months_since_last_closed",      agg:"value", loanType:[], secured:"all", status:"all", window:null, type:"recency"},
  {name:"Months Since Last Settled",       domain:"trade",   sub:"recency", measure:"months_since_last_settled",     agg:"value", loanType:[], secured:"all", status:"all", window:null, type:"recency"},
  // ── Trade: Trend ── ✅ FULL
  {name:"Balance Growth (6m→12m)",         domain:"trade",   sub:"trend",   measure:"balance_growth",    agg:"difference", loanType:[], secured:"all", status:"active",  window_pair:["6m","12m"],  type:"trend"},
  {name:"Balance Growth (12m→24m)",        domain:"trade",   sub:"trend",   measure:"balance_growth",    agg:"slope",      loanType:[], secured:"all", status:"active",  window_pair:["12m","24m"], type:"trend"},
  {name:"Balance Acceleration (3-6-12m)",  domain:"trade",   sub:"trend",   measure:"balance_acceleration",agg:"acceleration",loanType:[],secured:"all",status:"active", window_triple:["3m","6m","12m"], type:"trend"},
  {name:"DPD Acceleration (6-12-24m)",     domain:"trade",   sub:"trend",   measure:"dpd_acceleration",  agg:"acceleration",loanType:[],secured:"all", status:"all",    window_triple:["6m","12m","24m"], type:"trend"},
  {name:"Balance Trajectory (12m)",        domain:"trade",   sub:"trend",   measure:"balance_trajectory", agg:"classification",loanType:[],secured:"all",status:"active",window_pair:["6m","12m"], type:"trend"},
  {name:"Utilization Change (3m→6m)",      domain:"trade",   sub:"trend",   measure:"utilization_change",agg:"difference", loanType:["CC"], secured:"all", status:"active", window_pair:["3m","6m"], type:"trend"},
  {name:"DPD Trend (6m→12m)",              domain:"trade",   sub:"trend",   measure:"dpd_trend",         agg:"difference", loanType:[], secured:"all", status:"all",     window_pair:["6m","12m"],  type:"trend"},
  {name:"DPD Slope (12m→24m)",             domain:"trade",   sub:"trend",   measure:"dpd_trend",         agg:"slope",      loanType:[], secured:"all", status:"all",     window_pair:["12m","24m"], type:"trend"},
  {name:"Account Count Trend (6m→12m)",    domain:"trade",   sub:"trend",   measure:"account_count_trend",agg:"difference",loanType:[], secured:"all", status:"all",     window_pair:["6m","12m"],  type:"trend"},
  {name:"Overdue Trend (6m→12m)",          domain:"trade",   sub:"trend",   measure:"overdue_trend",     agg:"difference", loanType:[], secured:"all", status:"all",     window_pair:["6m","12m"],  type:"trend"},
  // ── Trade: Recency ── ✅ FULL EVENT-RECENCY
  {name:"Months Since Last DPD > 0",       domain:"trade",   sub:"recency", measure:"months_since_last_dpd",        agg:"value", loanType:[], secured:"all", status:"all", window:null, type:"recency"},
  {name:"Months Since Last Open",          domain:"trade",   sub:"recency", measure:"months_since_last_open",       agg:"value", loanType:[], secured:"all", status:"all", window:null, type:"recency"},
  {name:"Months Since Last Delinquency",   domain:"trade",   sub:"recency", measure:"months_since_last_delinquency",agg:"value", loanType:[], secured:"all", status:"all", window:null, type:"recency"},
  {name:"Months Since Last Writeoff",      domain:"trade",   sub:"recency", measure:"months_since_last_writeoff",   agg:"value", loanType:[], secured:"all", status:"all", window:null, type:"recency"},
  {name:"Months Since Last Closed",        domain:"trade",   sub:"recency", measure:"months_since_last_closed",     agg:"value", loanType:[], secured:"all", status:"all", window:null, type:"recency"},
  {name:"Months Since Last NPA",           domain:"trade",   sub:"recency", measure:"months_since_last_npa",        agg:"value", loanType:[], secured:"all", status:"all", window:null, type:"recency"},
  {name:"Months Since Peak Exposure",      domain:"trade",   sub:"recency", measure:"months_since_peak_exposure",   agg:"value", loanType:[], secured:"all", status:"all", window:null, type:"recency"},
  {name:"Months Since Status Transition",  domain:"trade",   sub:"recency", measure:"recency_of_transition",        agg:"value", loanType:[], secured:"all", status:"all", window:null, type:"recency"},
  // ── Trade: Balance Dynamics ── ✅ NEW
  {name:"Peak Outstanding Balance (12m)",  domain:"trade",   sub:"balance_dynamics",measure:"peak_balance",       agg:"max",   loanType:[], secured:"all", status:"all", window:"12m", type:"trade"},
  {name:"Avg Monthly Balance (12m)",       domain:"trade",   sub:"balance_dynamics",measure:"avg_monthly_balance",agg:"avg",   loanType:[], secured:"all", status:"active", window:"12m", type:"trade"},
  {name:"Balance Volatility (12m)",        domain:"trade",   sub:"balance_dynamics",measure:"balance_volatility", agg:"std",   loanType:[], secured:"all", status:"all", window:"12m", type:"trade"},
  {name:"Balance Volatility CV (24m)",     domain:"trade",   sub:"balance_dynamics",measure:"balance_cv",         agg:"cv",    loanType:[], secured:"all", status:"all", window:"24m", type:"trade"},
  {name:"Peak Overdue Amount (24m)",       domain:"trade",   sub:"balance_dynamics",measure:"overdue_peak",       agg:"max",   loanType:[], secured:"all", status:"all", window:"24m", type:"trade"},
  {name:"EMI Coverage Ratio (12m)",        domain:"trade",   sub:"balance_dynamics",measure:"emi_coverage_ratio", agg:"ratio", loanType:[], secured:"all", status:"active", window:"12m", type:"trade"},
  // ── Trade: Ratio ── ✅ FULL
  {name:"Delinquent Account Ratio (12m)",  domain:"trade",   sub:"risk_ratio",measure:"delinquent_ratio",agg:"ratio",      loanType:[], secured:"all", status:"all",     window:"12m",  type:"ratio"},
  {name:"High Utilization Ratio (6m)",     domain:"trade",   sub:"risk_ratio",measure:"high_utilization_ratio",agg:"ratio",loanType:["CC"], secured:"all", status:"active", window:"6m", type:"ratio"},
  {name:"Unsecured Exposure Share (12m)",  domain:"trade",   sub:"portfolio_mix",measure:"unsecured_share",agg:"ratio",    loanType:[], secured:"all", status:"all",     window:"12m",  type:"ratio"},
  {name:"Secured Exposure Share (12m)",    domain:"trade",   sub:"portfolio_mix",measure:"secured_share", agg:"ratio",    loanType:[], secured:"all", status:"all",     window:"12m",  type:"ratio"},
  {name:"Closed to Open Ratio (12m)",      domain:"trade",   sub:"portfolio_mix",measure:"closed_to_open_ratio",agg:"ratio",loanType:[], secured:"all", status:"all",   window:"12m",  type:"ratio"},
  {name:"PL Exposure Share (12m)",         domain:"trade",   sub:"portfolio_mix",measure:"pl_share",      agg:"ratio",    loanType:[], secured:"all", status:"all",     window:"12m",  type:"trade"},
  {name:"Writeoff Count (24m)",            domain:"trade",   sub:"writeoff",measure:"writeoff_count",     agg:"count",    loanType:[], secured:"all", status:"all",     window:"24m",  type:"trade"},
  {name:"Settlement Amount Sum (36m)",     domain:"trade",   sub:"settlement",measure:"settlement_amount",agg:"sum",      loanType:[], secured:"all", status:"all",     window:"36m",  type:"trade"},
  // ── Account: Recency (NEW) ──
  {name:"Months Since Last Account Opened",   domain:"account", sub:"recency", measure:"months_since_last_acc_open",    agg:"value", loanType:[], secured:"all", status:[], window:null, type:"recency"},
  {name:"Months Since Last Account Closed",   domain:"account", sub:"recency", measure:"months_since_last_acc_close",   agg:"value", loanType:[], secured:"all", status:[], window:null, type:"recency"},
  {name:"Months Since Last Delinquency (Acc)",domain:"account", sub:"recency", measure:"months_since_last_acc_delq",    agg:"value", loanType:[], secured:"all", status:[], window:null, type:"recency"},
  {name:"Months Since Last Write-Off (Acc)",  domain:"account", sub:"recency", measure:"months_since_last_acc_wo",      agg:"value", loanType:[], secured:"all", status:[], window:null, type:"recency"},
  {name:"Months Since Last NPA",              domain:"account", sub:"recency", measure:"months_since_last_acc_npa",     agg:"value", loanType:[], secured:"all", status:[], window:null, type:"recency"},
  // ── Account: Trend (NEW) ──
  {name:"Balance Change 3m→12m",              domain:"account", sub:"trend",   measure:"balance_change",       agg:"difference", loanType:[], secured:"all", status:[], window_pair:["3m","12m"],  type:"trend"},
  {name:"Balance Growth Rate 6m→12m",         domain:"account", sub:"trend",   measure:"balance_change",       agg:"growth_rate",loanType:[], secured:"all", status:[], window_pair:["6m","12m"],  type:"trend"},
  {name:"Overdue Change 3m→6m",               domain:"account", sub:"trend",   measure:"overdue_change",       agg:"difference", loanType:[], secured:"all", status:[], window_pair:["3m","6m"],   type:"trend"},
  {name:"Account Count Change 6m→12m",        domain:"account", sub:"trend",   measure:"account_count_change", agg:"difference", loanType:[], secured:"all", status:[], window_pair:["6m","12m"],  type:"trend"},
  {name:"DPD Change 3m→12m",                  domain:"account", sub:"trend",   measure:"dpd_change",           agg:"difference", loanType:[], secured:"all", status:[], window_pair:["3m","12m"],  type:"trend"},
  // ── Account: Distribution (NEW) ──
  // ── Account: Distribution (FIXED — credit_limit + variance added) ──
  {name:"balance_stddev",              domain:"account", sub:"distribution", measure:"balance_distribution",       agg:"std",        loanType:[], secured:"all", status:[], window:"12m", type:"distribution"},
  {name:"balance_variance",            domain:"account", sub:"distribution", measure:"balance_distribution",       agg:"variance",   loanType:[], secured:"all", status:[], window:"12m", type:"distribution"},
  {name:"balance_p90",                 domain:"account", sub:"distribution", measure:"balance_distribution",       agg:"percentile", loanType:[], secured:"all", status:[], window:"12m", type:"distribution"},
  {name:"credit_limit_p90",            domain:"account", sub:"distribution", measure:"credit_limit_distribution",  agg:"percentile", loanType:[], secured:"all", status:[], window:"12m", type:"distribution"},
  {name:"credit_limit_stddev",         domain:"account", sub:"distribution", measure:"credit_limit_distribution",  agg:"std",        loanType:[], secured:"all", status:[], window:"12m", type:"distribution"},
  {name:"exposure_variance",           domain:"account", sub:"distribution", measure:"sanction_distribution",      agg:"variance",   loanType:[], secured:"all", status:[], window:"12m", type:"distribution"},
  {name:"balance_cv",                  domain:"account", sub:"distribution", measure:"balance_distribution",       agg:"cv",         loanType:[], secured:"all", status:[], window:"12m", type:"distribution"},
  {name:"overdue_iqr",                 domain:"account", sub:"distribution", measure:"overdue_distribution",       agg:"iqr",        loanType:[], secured:"all", status:[], window:"12m", type:"distribution"},
  {name:"dpd_stddev",                  domain:"account", sub:"distribution", measure:"dpd_distribution",           agg:"std",        loanType:[], secured:"all", status:[], window:"12m", type:"distribution"},
  // ── Account: Concentration (FIXED — renamed to exact expected keys) ──
  {name:"top_lender_exposure_ratio",   domain:"account", sub:"concentration", measure:"top_lender_exposure_ratio",  agg:"ratio", loanType:[], secured:"all", status:[], window:null, type:"concentration"},
  {name:"top_3_lender_share",          domain:"account", sub:"concentration", measure:"top_3_lender_share",         agg:"ratio", loanType:[], secured:"all", status:[], window:null, type:"concentration"},
  {name:"lender_concentration_index",  domain:"account", sub:"concentration", measure:"lender_concentration_index", agg:"index", loanType:[], secured:"all", status:[], window:null, type:"concentration"},
  {name:"loan_type_concentration",     domain:"account", sub:"concentration", measure:"loan_type_concentration",    agg:"index", loanType:[], secured:"all", status:[], window:null, type:"concentration"},
  {name:"single_lender_flag",          domain:"account", sub:"concentration", measure:"single_lender_flag",         agg:"flag",  loanType:[], secured:"all", status:[], window:null, type:"concentration"},
  // ── Account: Vintage / Age (FIXED — new_accounts_last_6m, closed_accounts_last_12m) ──
  {name:"avg_account_age",             domain:"account", sub:"vintage", measure:"avg_account_age",          agg:"avg",   loanType:[], secured:"all", status:[], window:null,  type:"vintage"},
  {name:"oldest_account_age",          domain:"account", sub:"vintage", measure:"oldest_account_age",       agg:"max",   loanType:[], secured:"all", status:[], window:null,  type:"vintage"},
  {name:"newest_account_age",          domain:"account", sub:"vintage", measure:"newest_account_age",       agg:"min",   loanType:[], secured:"all", status:[], window:null,  type:"vintage"},
  {name:"account_age_avg",             domain:"account", sub:"vintage", measure:"account_age_avg",          agg:"avg",   loanType:[], secured:"all", status:[], window:null,  type:"vintage"},
  {name:"new_accounts_last_6m",        domain:"account", sub:"vintage", measure:"new_accounts_last_6m",     agg:"count", loanType:[], secured:"all", status:[], window:"6m",  type:"vintage"},
  {name:"new_accounts_last_12m",       domain:"account", sub:"vintage", measure:"new_accounts_last_12m",    agg:"count", loanType:[], secured:"all", status:[], window:"12m", type:"vintage"},
  {name:"closed_accounts_last_12m",    domain:"account", sub:"vintage", measure:"closed_accounts_last_12m", agg:"count", loanType:[], secured:"all", status:[], window:"12m", type:"vintage"},
  {name:"closed_accounts_last_6m",     domain:"account", sub:"vintage", measure:"closed_accounts_last_6m",  agg:"count", loanType:[], secured:"all", status:[], window:"6m",  type:"vintage"},
  {name:"weighted_avg_age",            domain:"account", sub:"vintage", measure:"weighted_avg_age",         agg:"avg",   loanType:[], secured:"all", status:[], window:null,  type:"vintage"},
  // ── Account: Utilization (FIXED — acc_credit_utilization, balance_to_limit_ratio) ──
  {name:"acc_credit_utilization",      domain:"account", sub:"utilization", measure:"acc_credit_utilization",   agg:"ratio", loanType:[], secured:"all", status:[], window:null, type:"utilization"},
  {name:"credit_utilization_ratio",    domain:"account", sub:"utilization", measure:"credit_utilization_ratio", agg:"ratio", loanType:[], secured:"all", status:[], window:null, type:"utilization"},
  {name:"balance_to_limit_ratio",      domain:"account", sub:"utilization", measure:"balance_to_limit_ratio",   agg:"ratio", loanType:[], secured:"all", status:[], window:null, type:"utilization"},
  {name:"max_util_single_account",     domain:"account", sub:"utilization", measure:"max_util_single_account",  agg:"max",   loanType:[], secured:"all", status:[], window:null, type:"utilization"},
  {name:"high_util_accounts_ratio",    domain:"account", sub:"utilization", measure:"high_util_accounts_ratio", agg:"ratio", loanType:[], secured:"all", status:[], window:null, type:"utilization"},
  {name:"util_above_80_count",         domain:"account", sub:"utilization", measure:"util_above_80_count",      agg:"count", loanType:[], secured:"all", status:[], window:null, type:"utilization"},
  {name:"overdue_to_outstanding",      domain:"account", sub:"utilization", measure:"overdue_to_outstanding",   agg:"ratio", loanType:[], secured:"all", status:[], window:null, type:"utilization"},
  {name:"emi_to_outstanding",          domain:"account", sub:"utilization", measure:"emi_to_outstanding",       agg:"ratio", loanType:[], secured:"all", status:[], window:null, type:"utilization"},
  // ── Account: Product Mix (NEW) ──
  {name:"Product Mix Score",                  domain:"account", sub:"product_mix", measure:"product_mix_score",       agg:"index", loanType:[], secured:"all", status:[], window:null,  type:"distribution"},
  {name:"Unique Loan Type Count",             domain:"account", sub:"product_mix", measure:"unique_product_count",    agg:"count", loanType:[], secured:"all", status:[], window:null,  type:"volume"},
  {name:"Product HHI (Concentration)",        domain:"account", sub:"product_mix", measure:"product_hhi",             agg:"index", loanType:[], secured:"all", status:[], window:null,  type:"concentration"},
  {name:"Secured Product Share",              domain:"account", sub:"product_mix", measure:"secured_product_share",   agg:"ratio", loanType:[], secured:"all", status:[], window:null,  type:"ratio"},
  {name:"CC to Total Accounts Ratio",         domain:"account", sub:"product_mix", measure:"cc_to_total_ratio",       agg:"ratio", loanType:[], secured:"all", status:[], window:null,  type:"ratio"},
  {name:"Revolving Product Share",            domain:"account", sub:"product_mix", measure:"revolving_product_share", agg:"ratio", loanType:[], secured:"all", status:[], window:null,  type:"ratio"},
  // ── Account: Lifecycle (NEW) ──
  {name:"New Accounts Opened (Last 6m)",      domain:"account", sub:"lifecycle", measure:"new_accounts_opened",     agg:"count", loanType:[], secured:"all", status:[], window:"6m",  type:"volume"},
  {name:"New Accounts Opened (Last 12m)",     domain:"account", sub:"lifecycle", measure:"new_accounts_opened",     agg:"count", loanType:[], secured:"all", status:[], window:"12m", type:"volume"},
  {name:"Accounts Closed (Last 12m)",         domain:"account", sub:"lifecycle", measure:"accounts_closed_period",  agg:"count", loanType:[], secured:"all", status:[], window:"12m", type:"volume"},
  {name:"Net Account Change (6m)",            domain:"account", sub:"lifecycle", measure:"net_account_change",      agg:"count", loanType:[], secured:"all", status:[], window:"6m",  type:"volume"},
  {name:"New Account to Total Ratio (12m)",   domain:"account", sub:"lifecycle", measure:"new_to_total_ratio",      agg:"ratio", loanType:[], secured:"all", status:[], window:"12m", type:"ratio"},
  {name:"Churned Account Ratio (24m)",        domain:"account", sub:"lifecycle", measure:"churned_account_ratio",   agg:"ratio", loanType:[], secured:"all", status:[], window:"24m", type:"ratio"},
  {name:"Balance of New Accounts (6m)",       domain:"account", sub:"lifecycle", measure:"newly_opened_balance",    agg:"sum",   loanType:[], secured:"all", status:[], window:"6m",  type:"amount"},
  // ── Account: Delinquency Severity (NEW) ──
  {name:"Accounts with DPD ≥ 90",            domain:"account", sub:"delinquency_severity", measure:"dpd_90plus_accounts",     agg:"count",  loanType:[], secured:"all", status:[], window:null,  type:"trade"},
  {name:"Accounts with DPD ≥ 60",            domain:"account", sub:"delinquency_severity", measure:"dpd_60plus_accounts",     agg:"count",  loanType:[], secured:"all", status:[], window:null,  type:"trade"},
  {name:"Accounts with DPD ≥ 30",            domain:"account", sub:"delinquency_severity", measure:"dpd_30plus_accounts",     agg:"count",  loanType:[], secured:"all", status:[], window:null,  type:"trade"},
  {name:"DPD Severity Index",                 domain:"account", sub:"delinquency_severity", measure:"dpd_severity_index",      agg:"index",  loanType:[], secured:"all", status:[], window:null,  type:"trade"},
  {name:"Severe Delinquency Ratio (90+)",     domain:"account", sub:"delinquency_severity", measure:"severe_delinquency_ratio",agg:"ratio",  loanType:[], secured:"all", status:[], window:"12m", type:"ratio"},
  {name:"Max DPD Across All Accounts",        domain:"account", sub:"delinquency_severity", measure:"max_dpd_across_accounts", agg:"max",    loanType:[], secured:"all", status:[], window:null,  type:"trade"},
  {name:"NPA Exposure Ratio",                 domain:"account", sub:"delinquency_severity", measure:"npa_exposure_ratio",      agg:"ratio",  loanType:[], secured:"all", status:[], window:null,  type:"ratio"},
  {name:"Overdue Amount (Severely Delinquent)",domain:"account", sub:"delinquency_severity", measure:"overdue_severity_amount",agg:"sum",    loanType:[], secured:"all", status:[], window:"12m", type:"amount"},
  // ── Account: Cross Entity (NEW) ──
  {name:"Accounts with Inquiry (Last 30d)",   domain:"account", sub:"cross_entity", measure:"accounts_with_inquiry_last_30d", agg:"count", loanType:[], secured:"all", status:[], window:"1m",  type:"volume"},
  {name:"Accounts with Inquiry (Last 90d)",   domain:"account", sub:"cross_entity", measure:"accounts_with_inquiry_last_90d", agg:"count", loanType:[], secured:"all", status:[], window:"3m",  type:"volume"},
  {name:"Inquiry to Account Ratio (6m)",      domain:"account", sub:"cross_entity", measure:"inquiry_to_account_ratio",       agg:"ratio", loanType:[], secured:"all", status:[], window:"6m",  type:"ratio"},
  {name:"Inquiry Count per Active Lender",    domain:"account", sub:"cross_entity", measure:"inq_count_per_active_lender",    agg:"avg",   loanType:[], secured:"all", status:[], window:"6m",  type:"ratio"},
  {name:"Trade Overdue on Account Portfolio", domain:"account", sub:"cross_entity", measure:"trade_overdue_on_acc_portfolio",  agg:"sum",   loanType:[], secured:"all", status:[], window:"12m", type:"amount"},
  {name:"Accounts with Trade DPD Event",      domain:"account", sub:"cross_entity", measure:"accounts_with_trade_dpd",        agg:"count", loanType:[], secured:"all", status:[], window:"12m", type:"trade"},
  // ── Account: Utilization Engine (NEW — Top Credit Scoring Variables) ──
  {name:"Credit Utilization Ratio (12m)",     domain:"account", sub:"utilization_engine", measure:"credit_utilization_ratio",   agg:"ratio", loanType:[], secured:"all", status:[], window:"12m", type:"utilization"},
  {name:"Avg Credit Utilization (12m)",       domain:"account", sub:"utilization_engine", measure:"avg_utilization_12m",        agg:"avg",   loanType:[], secured:"all", status:[], window:"12m", type:"utilization"},
  {name:"Max Credit Utilization (12m)",       domain:"account", sub:"utilization_engine", measure:"max_utilization_12m",        agg:"max",   loanType:[], secured:"all", status:[], window:"12m", type:"utilization"},
  {name:"Avg Utilization (All Accounts)",     domain:"account", sub:"utilization_engine", measure:"avg_utilization",            agg:"avg",   loanType:[], secured:"all", status:[], window:"6m",  type:"utilization"},
  {name:"Max Utilization (Single Account)",   domain:"account", sub:"utilization_engine", measure:"max_utilization_account",    agg:"max",   loanType:[], secured:"all", status:[], window:"6m",  type:"utilization"},
  {name:"High Util Accounts Count (>75%)",    domain:"account", sub:"utilization_engine", measure:"high_util_accounts",         agg:"count", loanType:[], secured:"all", status:[], window:"6m",  type:"utilization"},
  {name:"High Util Accounts Ratio (>75%)",    domain:"account", sub:"utilization_engine", measure:"high_util_accounts_ratio",   agg:"ratio", loanType:[], secured:"all", status:[], window:"12m", type:"utilization"},
  {name:"Maxed-Out Accounts Count (>90%)",    domain:"account", sub:"utilization_engine", measure:"util_above_90",              agg:"count", loanType:[], secured:"all", status:[], window:"6m",  type:"utilization"},
  {name:"Balance to Sanction Ratio",          domain:"account", sub:"utilization_engine", measure:"balance_to_sanction_ratio",  agg:"ratio", loanType:[], secured:"all", status:[], window:"12m", type:"ratio"},
  {name:"Utilization Trend (Change)",         domain:"account", sub:"utilization_engine", measure:"utilization_trend",          agg:"slope", loanType:[], secured:"all", status:[], window:"12m", type:"trend"},
  {name:"Utilization Volatility (StdDev)",    domain:"account", sub:"utilization_engine", measure:"utilization_volatility",     agg:"std",   loanType:[], secured:"all", status:[], window:"12m", type:"distribution"},
  // ── Account: Payment Behavior (NEW) ──
  {name:"On-Time Payment Ratio (12m)",        domain:"account", sub:"payment_behavior", measure:"on_time_payment_ratio",      agg:"ratio", loanType:[], secured:"all", status:[], window:"12m", type:"ratio"},
  {name:"Missed Payment Count (12m)",         domain:"account", sub:"payment_behavior", measure:"missed_payment_count",       agg:"count", loanType:[], secured:"all", status:[], window:"12m", type:"volume"},
  {name:"DPD Transition Rate (clean→delq)",   domain:"account", sub:"payment_behavior", measure:"dpd_transition_rate",        agg:"ratio", loanType:[], secured:"all", status:[], window:"12m", type:"ratio"},
  {name:"Rolling DPD Trend Slope (12m)",      domain:"account", sub:"payment_behavior", measure:"rolling_dpd_trend",          agg:"slope", loanType:[], secured:"all", status:[], window:"12m", type:"trend"},
  {name:"Consecutive Clean Months",           domain:"account", sub:"payment_behavior", measure:"consecutive_clean_months",   agg:"value", loanType:[], secured:"all", status:[], window:"12m", type:"recency"},
  {name:"Payment Consistency Score",          domain:"account", sub:"payment_behavior", measure:"payment_consistency_score",  agg:"value", loanType:[], secured:"all", status:[], window:"12m", type:"ratio"},
  {name:"Ever Missed Payment (Last 12m)",     domain:"account", sub:"payment_behavior", measure:"ever_missed_12m",            agg:"flag",  loanType:[], secured:"all", status:[], window:"12m", type:"ratio"},
  {name:"Delinquency Frequency (12m)",        domain:"account", sub:"payment_behavior", measure:"delinquency_frequency",      agg:"ratio", loanType:[], secured:"all", status:[], window:"12m", type:"ratio"},
  {name:"Payment Improvement Indicator",      domain:"account", sub:"payment_behavior", measure:"improvement_indicator",      agg:"flag",  loanType:[], secured:"all", status:[], window:"6m",  type:"ratio"},
  // ── Account: Credit Mix (NEW) ──
  {name:"Credit Mix Score",                   domain:"account", sub:"credit_mix", measure:"credit_mix_score",           agg:"index", loanType:[], secured:"all", status:[], window:null,  type:"ratio"},
  {name:"Secured to Unsecured Ratio",         domain:"account", sub:"credit_mix", measure:"secured_to_unsecured_ratio", agg:"ratio", loanType:[], secured:"all", status:[], window:null,  type:"ratio"},
  {name:"Loan Type Diversity Index",          domain:"account", sub:"credit_mix", measure:"loan_type_diversity",        agg:"index", loanType:[], secured:"all", status:[], window:null,  type:"distribution"},
  {name:"Secured Exposure Ratio (Balance)",   domain:"account", sub:"credit_mix", measure:"secured_exposure_ratio",     agg:"ratio", loanType:[], secured:"all", status:[], window:null,  type:"ratio"},
  {name:"Has Both Secured & Unsecured",       domain:"account", sub:"credit_mix", measure:"has_both_types",             agg:"flag",  loanType:[], secured:"all", status:[], window:null,  type:"ratio"},
  {name:"Revolving to Installment Ratio",     domain:"account", sub:"credit_mix", measure:"revolving_to_installment",   agg:"ratio", loanType:[], secured:"all", status:[], window:null,  type:"ratio"},
  {name:"CC Exposure Share",                  domain:"account", sub:"credit_mix", measure:"cc_exposure_share",          agg:"ratio", loanType:["CC"], secured:"all", status:[], window:null, type:"ratio"},
  {name:"Unsecured Exposure Share",           domain:"account", sub:"credit_mix", measure:"unsecured_exposure_share",   agg:"ratio", loanType:[], secured:"all", status:[], window:null,  type:"ratio"},
];

// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════
let state = {
  buildName:"", buildDesc:"", bureau:"", fileType:"", customDate:"",
  domain:"enquiry",
  varType:"Enquiry",
  aggregationType:"simple",
  ratioMethod:"count",
  ratioParams:{ numerator:{}, denominator:{} },
  tradeScope:{ loanType:[], secured:"all", status:"all", ownership:"all" },
  accScope:{ loanType:[], secured:"all", status:[], ownership:"all", timeCtx:"snapshot", period:"6" },
  subCat:"", measure:"", aggregation:"",
  timeWindows:[], velPair:null, timeBased:"reporting_date",
  customWindow:"",
  filters:{ product:[], secured:"all", lender:[], tradeFlags:[] },
  intermediateSelection:{ product:"", subtype:"", page:0 },
  dpdCond:{op:">=", val:""},
  overdueCond:{op:">", val:""},
  utilCond:{op:">=", val:""},
  threshold:{op:">",val:""},
  amtCond:{op:"<",val:""},
  postProcessing:[], pctValue:90,
  capMin:"",capMax:"",bucketBins:"",
  featNameOverride:""
};
let builtFeatures = [];
let wizStep = 1;
let pdCurrentPage = 0;
let pdFilter = "all";
let pdFieldFilter = "all";

// ══════════════════════════════════════════
// SCREEN NAVIGATION
// ══════════════════════════════════════════
function goScreen(n) {
  const screenIds = ['screen-0', 'screen-1', 'screen-builder'];
  screenIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active');
    el.style.display = 'none';
  });

  const targetId = screenIds[n];
  const target = targetId ? document.getElementById(targetId) : null;
  if (target) {
    target.classList.add('active');
    target.style.display = 'block';
  }

  const crossMap = document.getElementById('screen-crossmap');
  if (crossMap) crossMap.style.display = 'none';
  if (builderSetupShell) builderSetupShell.classList.toggle('hidden', n === 2);

  requestAnimationFrame(() => {
    if (n === 2) {
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (builderSetupShell) {
      builderSetupShell.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

function showBuilderSetupScreen(targetId) {
  showPage('page-builder');

  const setupIds = ['screen-0', 'screen-1'];
  setupIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const isTarget = id === targetId;
    el.classList.toggle('active', isTarget);
    el.style.display = isTarget ? 'block' : 'none';
  });

  const builderScreen = document.getElementById('screen-builder');
  if (builderScreen) {
    builderScreen.classList.remove('active');
    builderScreen.style.display = 'none';
  }

  const crossMap = document.getElementById('screen-crossmap');
  if (crossMap) crossMap.style.display = 'none';

  if (builderSetupShell) {
    builderSetupShell.classList.remove('hidden');
    requestAnimationFrame(() => builderSetupShell.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function refreshBuilderAfterBack(clearVariableFlow = false) {
  beneficiaryActiveId = null;
  beneficiaryMenuOpenId = null;
  state.intermediateSelection = { product:'', subtype:'', page:0 };

  if (clearVariableFlow) {
    state.subCat = '';
    state.measure = '';
    state.aggregation = '';
    state.aggregationType = 'simple';
    state.timeWindows = [];
    state.velPair = null;
    initRatioParams();
  }

  const measureSection = document.getElementById('measure-section');
  const measureChips = document.getElementById('measure-chips');
  const aggChips = document.getElementById('agg-chips');

  if (typeof buildSubcatGrid === 'function') buildSubcatGrid();

  if (!clearVariableFlow && state.subCat) {
    if (typeof buildMeasureChips === 'function') buildMeasureChips(state.subCat);
    if (measureSection) measureSection.style.display = 'block';
  } else {
    if (measureSection) measureSection.style.display = 'none';
    if (measureChips) measureChips.innerHTML = '';
    if (aggChips) aggChips.innerHTML = '';
  }

  if (typeof loadBeneficiaries === 'function') loadBeneficiaries();
  if (typeof buildPredefList === 'function') buildPredefList();
  if (typeof updatePackCardVisibility === 'function') updatePackCardVisibility();
}

function backToBuildDetails() {
  refreshBuilderAfterBack(true);
  showBuilderSetupScreen('screen-0');
}

function backToBuildScope() {
  refreshBuilderAfterBack(true);
  showBuilderSetupScreen('screen-1');
}

function goBureauScreen() {
  const name = document.getElementById('build-name').value.trim();
  if (!name) { showToast("Enter a build name first."); return; }
  state.buildName = name;
  state.buildDesc = document.getElementById('build-desc').value.trim();
  goScreen(1);
}
async function goBuilderScreen() {
  if (!state.bureau) { showToast("Select a bureau."); return; }
  if (!state.fileType) { showToast("Select a file type."); return; }
  const customDateEl = document.getElementById('custom-date');
  state.customDate = customDateEl ? customDateEl.value : '';
  document.getElementById('ov-build').textContent = state.buildName;
  document.getElementById('ov-bureau').textContent = state.bureau;
  document.getElementById('ov-mode').textContent = state.fileType;
  document.getElementById('crumb-build').textContent = state.buildName;
  document.getElementById('crumb-bureau').textContent = state.bureau;
  document.getElementById('crumb-mode').textContent = state.fileType;

  // ── Create build in DB immediately so it shows on dashboard ──
  // Always save to localStorage immediately (works even without backend)
  _saveLocalBuild({
    name: state.buildName,
    owner: getCurrentOwner(),
    bureau: state.bureau,
    file_type: state.fileType,
    created_at: new Date().toISOString(),
    variable_count: 0,
  });

  try {
    await fetchJSON(buildApiUrl('/builds'), {
      method: 'POST',
      body: JSON.stringify({
        name:      state.buildName,
        owner:     getCurrentOwner(),
        bureau:    state.bureau,
        file_type: state.fileType,
      }),
    });
    loadBuilds();
  } catch(e) {
    console.warn('[goBuilderScreen] Backend not available, using local storage');
    loadBuilds(); // will use localStorage fallback
  }

  goScreen(2);
  beneficiaryActiveId = null;
  beneficiaryMenuOpenId = null;
  state.intermediateSelection = { product:'', subtype:'', page:0 };
  loadBeneficiaries();
  buildSubcatGrid();
  buildPredefList();
  wizStep = 1; updateWizUI();
}
function selBureau(name, el) {
  state.bureau = name;
  document.querySelectorAll('.bureau-card').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
}
function selFileType(name, el) {
  state.fileType = name;
  document.querySelectorAll('.ft-card').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
}
function currentSchema() {
  if (state.domain === 'trade') return TRD_SCHEMA;
  if (state.domain === 'trade_history') return TRD_HIST_SCHEMA;
  if (state.domain === 'account') return ACT_SCHEMA;
  return INQ_SCHEMA;
}

// ══════════════════════════════════════════
// TRADE SCOPE CONTROLS
// ══════════════════════════════════════════
function toggleTradeScope(el, field, val) {
  el.classList.toggle('sel');
  const arr = state.tradeScope[field] || [];
  if (el.classList.contains('sel')) { if(!arr.includes(val)) arr.push(val); }
  else { const i=arr.indexOf(val); if(i>-1) arr.splice(i,1); }
  state.tradeScope[field] = arr;
  loadBeneficiaries();
}
function selTradeSecured(val, el) {
  state.tradeScope.secured = val;
  ['tsec-all','tsec-sec','tsec-unsec'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('sel');});
  el.classList.add('sel');
}
function selTradeStatus(val, el) {
  state.tradeScope.status = val;
  // ✅ Full status list including new options
  ['tstat-all','tstat-active','tstat-closed','tstat-wo','tstat-settled','tstat-suit'].forEach(id=>{
    const e=document.getElementById(id); if(e) e.classList.remove('sel');
  });
  el.classList.add('sel');
}
function selTradeOwn(val, el) {
  state.tradeScope.ownership = val;
  ['town-all','town-ind','town-joint','town-guar'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('sel');});
  el.classList.add('sel');
}

// ══════════════════════════════════════════
// ACCOUNT SCOPE CONTROLS
// ══════════════════════════════════════════
function toggleAccScope(el, field, val) {
  el.classList.toggle('sel');
  const arr = state.accScope[field] || [];
  if (el.classList.contains('sel')) { if (!arr.includes(val)) arr.push(val); }
  else { const i=arr.indexOf(val); if(i>-1) arr.splice(i,1); }
  state.accScope[field] = arr;
  loadBeneficiaries();
}
function selAccSecured(val, el) {
  state.accScope.secured = val;
  ['asec-all','asec-sec','asec-unsec','asec-rev','asec-inst'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('sel');});
  el.classList.add('sel');
}
function toggleAccStatus(el, val) {
  // deselect 'All' when picking specific status
  document.getElementById('astat-all').classList.remove('sel');
  el.classList.toggle('sel');
  const arr = state.accScope.status || [];
  if (el.classList.contains('sel')) { if (!arr.includes(val)) arr.push(val); }
  else { const i=arr.indexOf(val); if(i>-1) arr.splice(i,1); }
  if (arr.length === 0) { document.getElementById('astat-all').classList.add('sel'); }
  state.accScope.status = arr;
}
function selAccStatus(val, el) {
  // 'All' button — clear specific selections
  state.accScope.status = [];
  ['astat-all','astat-active','astat-closed','astat-wo','astat-settled','astat-suit','astat-npa','astat-sma','astat-rest'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('sel');});
  el.classList.add('sel');
}
function selAccOwnership(val, el) {
  state.accScope.ownership = val;
  ['aown-all','aown-ind','aown-joint','aown-guar'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('sel');});
  el.classList.add('sel');
}
function selAccTimeCtx(ctx, el) {
  state.accScope.timeCtx = ctx;
  ['atctx-snapshot','atctx-opened','atctx-active','atctx-closed','atctx-dpd','atctx-ever'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('sel');});
  el.classList.add('sel');
  const showPeriod = ctx !== 'snapshot' && ctx !== 'ever';
  document.getElementById('acc-time-period').style.display = showPeriod ? 'block' : 'none';
}
function selAccPeriod(el, val) {
  state.accScope.period = val;
  document.querySelectorAll('#acc-period-chips .fchip').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
}

// ══════════════════════════════════════════
// UTILIZATION ENGINE STATE + FUNCTIONS
// ══════════════════════════════════════════
let utilEngineState = {
  numerator: 'Outstanding_Balance',
  numeratorLabel: 'Balance',
  denominator: 'Sanction_Amount',
  denominatorLabel: 'SanctionAmt',
  thresholds: [0.8, 0.9],
  activeThresholds: new Set([0.8, 0.9])
};

function selUtilField(part, col, label, el) {
  if (part === 'num') {
    utilEngineState.numerator = col;
    utilEngineState.numeratorLabel = label;
    document.querySelectorAll('#util-num-chips .fchip').forEach(c => c.classList.remove('sel'));
  } else {
    utilEngineState.denominator = col;
    utilEngineState.denominatorLabel = label;
    document.querySelectorAll('#util-den-chips .fchip').forEach(c => c.classList.remove('sel'));
  }
  el.classList.add('sel');
  updateUtilFormulaBox();
  updateLiveJSON();
}

function toggleUtilThresh(el, val) {
  el.classList.toggle('sel');
  if (el.classList.contains('sel')) { utilEngineState.activeThresholds.add(val); }
  else { utilEngineState.activeThresholds.delete(val); }
  updateUtilFormulaBox();
  updateLiveJSON();
}

function updateUtilFormulaBox() {
  const el = document.getElementById('util-formula-box');
  if (!el) return;
  const n = utilEngineState.numeratorLabel;
  const d = utilEngineState.denominatorLabel;
  const threshArr = [...utilEngineState.activeThresholds].sort();
  const threshStr = threshArr.map(t => `${Math.round(t*100)}%`).join(', ');
  el.innerHTML =
    `<span style="color:#7cb9e8;">base_ratio</span>  = ${n} / ${d}<br>` +
    `<span style="color:#7cb9e8;">avg_util</span>     = AVG(base_ratio) across accounts<br>` +
    `<span style="color:#7cb9e8;">max_util</span>     = MAX(base_ratio) across accounts<br>` +
    (threshArr.length ? `<span style="color:#f8c8a0;">high_util_cnt</span> = COUNT WHERE ratio > {${threshStr}}<br>` : '') +
    `<span style="color:#79e9a4;">window</span>       = applied over selected time window`;

  // Quick variables
  const qv = document.getElementById('util-quick-vars');
  if (qv) {
    const existing = qv.querySelectorAll('.util-quick-btn');
    existing.forEach(b => b.remove());
    const quickVars = [
      { label:`avg_util_12m`, win:'12m', agg:'avg' },
      { label:`max_util_12m`, win:'12m', agg:'max' },
      { label:`high_util_ratio_6m`, win:'6m', agg:'ratio' },
    ];
    quickVars.forEach(qvItem => {
      const btn = document.createElement('div');
      btn.className = 'fchip util-quick-btn';
      btn.style.cssText = 'font-size:10px;background:rgba(180,83,9,0.06);border-color:rgba(180,83,9,0.3);color:var(--account);';
      btn.textContent = `📌 ${qvItem.label}`;
      btn.title = `Auto-select: agg=${qvItem.agg}, window=${qvItem.win}`;
      btn.onclick = () => {
        state.subCat = 'utilization_engine';
        state.aggregation = qvItem.agg;
        state.timeWindows = [qvItem.win];
        updateLiveJSON();
        showToast(`✓ Quick var pre-filled: ${qvItem.label}`);
      };
      qv.appendChild(btn);
    });
  }
}

// ══════════════════════════════════════════
// PAYMENT BEHAVIOR ENGINE STATE
// ══════════════════════════════════════════
let pbEngineState = { dpdThresh: 0, slopeWin: '12m' };

function selPBThresh(val, el) {
  pbEngineState.dpdThresh = val;
  document.querySelectorAll('#pb-dpd-thresh .fchip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  updatePBFormulaBox();
  updateLiveJSON();
}
function selPBSlopeWin(val, el) {
  pbEngineState.slopeWin = val;
  document.querySelectorAll('#pb-slope-win .fchip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  updatePBFormulaBox();
  updateLiveJSON();
}
function updatePBFormulaBox() {
  const el = document.getElementById('pb-formula-box');
  if (!el) return;
  const thresh = pbEngineState.dpdThresh;
  const threshLabel = thresh === 0 ? 'DPD > 0' : `DPD ≥ ${thresh}`;
  el.innerHTML =
    `<span style="color:#7cb9e8;">on_time_ratio</span>   = COUNT(DPD=0) / COUNT(all months)<br>` +
    `<span style="color:#7cb9e8;">missed_count</span>    = COUNT(months WHERE ${threshLabel})<br>` +
    `<span style="color:#7cb9e8;">consec_clean</span>    = MAX streak of DPD=0 months<br>` +
    `<span style="color:#f8c8a0;">dpd_slope</span>       = OLS_β(DPD over ${pbEngineState.slopeWin}) → +ve=worsening<br>` +
    `<span style="color:#79e9a4;">transition_rate</span> = P(clean→delinquent in next month)`;
}

// ══════════════════════════════════════════
// CREDIT MIX ENGINE STATE
// ══════════════════════════════════════════
let cmEngineState = {
  components: new Set(['has_secured','has_unsecured','has_revolving']),
  output: 'composite_score'
};

function toggleCMComp(el, comp) {
  el.classList.toggle('sel');
  if (el.classList.contains('sel')) cmEngineState.components.add(comp);
  else cmEngineState.components.delete(comp);
  updateCMFormulaBox();
  updateLiveJSON();
}
function selCMOutput(val, el) {
  cmEngineState.output = val;
  ['cm-out-score','cm-out-flag','cm-out-count','cm-out-hhi'].forEach(id=>{ const e=document.getElementById(id); if(e) e.classList.remove('sel'); });
  el.classList.add('sel');
  updateCMFormulaBox();
  updateLiveJSON();
}
function updateCMFormulaBox() {
  const el = document.getElementById('cm-formula-box');
  if (!el) return;
  const comps = [...cmEngineState.components];
  const compStr = comps.length ? comps.map(c => c.replace('has_','').replace('_',' ')).join(' + ') : 'none';
  const outFormulas = {
    composite_score: `score = (${comps.map(c=>`flag_${c.replace('has_','')}`).join(' + ')}) × ${comps.length ? Math.round(100/comps.length) : 0}`,
    binary_flag: `flag = 1 IF COUNT(met_components) ≥ 2, ELSE 0`,
    component_count: `count = ${comps.length ? comps.map(c=>`flag(${c})`).join(' + ') : '0'}`,
    hhi: `HHI = Σ(share_i²) across loan type groups`
  };
  el.innerHTML =
    `<span style="color:#7cb9e8;">components</span>  = [${compStr || 'none selected'}]<br>` +
    `<span style="color:#f8c8a0;">output</span>      = ${cmEngineState.output}<br>` +
    `<span style="color:#79e9a4;">formula</span>     = ${outFormulas[cmEngineState.output] || outFormulas.composite_score}`;
}

// ══════════════════════════════════════════
// CROSS ENTITY JOIN BUILDER STATE + FUNCTIONS
// ══════════════════════════════════════════
let crossEntityState = {
  joinEntity: 'inquiry',
  joinKey: 'customer_id',
  joinWindow: '90d',
  inqFilter: '',
  accFilter: ''
};

function selCrossEntity(val, el) {
  crossEntityState.joinEntity = val;
  ['xent-inquiry','xent-trade','xent-both'].forEach(id=>{ const e=document.getElementById(id); if(e) e.classList.remove('sel'); });
  el.classList.add('sel');
  updateCrossEntityPreview();
  updateLiveJSON();
}
function selCrossKey(val, el) {
  crossEntityState.joinKey = val;
  ['xkey-cid','xkey-acc','xkey-lndr'].forEach(id=>{ const e=document.getElementById(id); if(e) e.classList.remove('sel'); });
  el.classList.add('sel');
  updateCrossEntityPreview();
  updateLiveJSON();
}
function selCrossWindow(val, el) {
  crossEntityState.joinWindow = val;
  document.querySelectorAll('#xent-window-chips .fchip').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
  updateCrossEntityPreview();
  updateLiveJSON();
}
function updateCrossEntityPreview() {
  const el = document.getElementById('xent-formula-preview');
  if (!el) return;
  const inqF = document.getElementById('xent-inq-filter')?.value || '';
  const accF = document.getElementById('xent-acc-filter')?.value || '';
  crossEntityState.inqFilter = inqF;
  crossEntityState.accFilter = accF;
  const entityLabel = crossEntityState.joinEntity === 'both' ? 'Inquiry + Trade' :
                      crossEntityState.joinEntity === 'inquiry' ? 'Inquiry' : 'Trade';
  const inqFLabel = inqF ? ` WHERE inquiry_type IN [${inqF}]` : '';
  const accFLabel = accF ? ` WHERE status IN [${accF}]` : '';
  el.innerHTML =
    `<span style="color:#7cb9e8;">JOIN</span>: Account ← ${entityLabel} ON ${crossEntityState.joinKey}<br>` +
    `<span style="color:#7cb9e8;">WINDOW</span>: ${crossEntityState.joinWindow} lookback<br>` +
    `<span style="color:#f8c8a0;">INQUIRY FILTER</span>: ${inqFLabel || 'none'}<br>` +
    `<span style="color:#f8c8a0;">ACCOUNT FILTER</span>: ${accFLabel || 'none'}<br>` +
    `<span style="color:#79e9a4;">OUTPUT</span>: ${state.measure || 'selected_measure'} aggregated post-join`;
  updateLiveJSON();
}

// ══════════════════════════════════════════
// RATIO FEATURE UI
// ══════════════════════════════════════════
function initRatioParams() {
  const base = { status:'all', dpdCond:{op:'>=',val:''}, overdueCond:{op:'>',val:''}, utilCond:{op:'>=',val:''}, tradeFlags:[], amtCond:{op:'<=',val:''} };
  state.ratioParams = { numerator: JSON.parse(JSON.stringify(base)), denominator: JSON.parse(JSON.stringify(base)) };
}
function selectAggType(type, el) {
  state.aggregationType = type;
  document.querySelectorAll('#agg-type-simple, #agg-type-ratio').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
  const isRatio = type === 'ratio';
  document.getElementById('simple-agg-panel').style.display = isRatio ? 'none' : 'block';
  document.getElementById('ratio-agg-panel').style.display  = isRatio ? 'block' : 'none';
  if (isRatio) {
    state.aggregation = 'ratio';
    buildRatioConditionUI('ratio-num-conditions','numerator');
    buildRatioConditionUI('ratio-den-conditions','denominator');
    buildRatioAggChips();
    buildW2WMetricChips();
  } else {
    state.aggregation = '';
    const sel = document.querySelector('#agg-chips .chip.sel, #agg-chips .chip.trade-sel');
    if (sel) state.aggregation = sel.textContent;
  }
}

// ══════════════════════════════════════════
// RATIO ENGINE — 4 TYPES
// ══════════════════════════════════════════
let ratioState = {
  type:'simple',
  w2w: { metric:'', numerator:'3m', denominator:'12m' },
  cross: { numerator:'', denominator:'', window:'12m' },
  norm: { metric:'', by:'per_trade', window:'12m' },
  p2p: { num:'', den:'ALL', metric:'balance', window:'12m' }
};

function selRatioType(type, el) {
  ratioState.type = type;
  document.querySelectorAll('.ratio-type-tab').forEach(t=>t.classList.remove('sel'));
  el.classList.add('sel');
  document.querySelectorAll('.ratio-type-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById(`rpanel-${type}`).classList.add('active');
}

function buildW2WMetricChips() {
  const sc = currentSchema()[state.subCat];
  if (!sc) return;
  const mc = document.getElementById('w2w-metric-chips');
  if (!mc) return;
  mc.innerHTML = '';
  const isTrade = state.domain==='trade'||state.domain==='trade_history';
  const measures = Object.entries(sc.measures||{}).slice(0,6);
  measures.forEach(([key,mv])=>{
    const d = document.createElement('div');
    d.className='chip'; d.textContent=mv.label||key;
    d.onclick=()=>{
      selChipSingle(mc,d,isTrade);
      ratioState.w2w.metric = key;
      updateW2WFormula();
    };
    mc.appendChild(d);
  });
}

function selW2W(side, win, el) {
  ratioState.w2w[side] = win;
  const group = el.parentElement;
  group.querySelectorAll('.w2w-metric-chip').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
  updateW2WFormula();
}

function updateW2WFormula() {
  const {metric, numerator, denominator} = ratioState.w2w;
  const metricLabel = metric ? (currentSchema()[state.subCat]?.measures[metric]?.label || metric) : '[metric]';
  const box = document.getElementById('w2w-formula-text');
  if (box) box.textContent = `${metricLabel}(${numerator}) ÷ ${metricLabel}(${denominator})`;
}

function selCMWindow(el, win) {
  ratioState.cross.window = win;
  document.querySelectorAll('#cm-window-chips .chip').forEach(c=>c.classList.remove('sel','trade-sel'));
  el.classList.add('sel');
  updateCrossMetricFormula();
}

function updateCrossMetricFormula() {
  const num = document.getElementById('cm-numerator-metric')?.value || '[numerator]';
  const den = document.getElementById('cm-denominator-metric')?.value || '[denominator]';
  ratioState.cross.numerator = num; ratioState.cross.denominator = den;
  const box = document.getElementById('cm-formula-text');
  if (box) box.textContent = `SUM(${num}) ÷ SUM(${den}) over last ${ratioState.cross.window}`;
}

function selNorm(el, key, val) {
  ratioState.norm[key] = val;
  const groupId = key==='metric' ? 'norm-metric-chips' : 'norm-by-chips';
  const group = document.getElementById(groupId);
  if (group) group.querySelectorAll('.chip,.norm-chip').forEach(c=>c.classList.remove('sel','trade-sel'));
  el.classList.add('sel');
  updateNormFormula();
}

function selNormWindow(el, win) {
  ratioState.norm.window = win;
  document.querySelectorAll('#norm-window-chips .chip').forEach(c=>c.classList.remove('sel','trade-sel'));
  el.classList.add('sel');
  updateNormFormula();
}

function updateNormFormula() {
  const {metric, by, window: win} = ratioState.norm;
  const metricLabel = metric.replace(/_/g,' ');
  const byLabel = by.replace(/_/g,' ');
  const box = document.getElementById('norm-formula-text');
  if (box) box.textContent = `${metricLabel || '[metric]'} ÷ ${byLabel} — last ${win}`;
}

function selP2P(el, key, val) {
  ratioState.p2p[key] = val;
  const groupId = {num:'p2p-num-chips', den:'p2p-den-chips', metric:'p2p-metric-chips'}[key];
  const group = document.getElementById(groupId);
  if (group) group.querySelectorAll('.chip').forEach(c=>c.classList.remove('sel','trade-sel'));
  el.classList.add('sel');
  updateP2PFormula();
}

function selP2PWindow(el, win) {
  ratioState.p2p.window = win;
  document.querySelectorAll('#p2p-window-chips .chip').forEach(c=>c.classList.remove('sel','trade-sel'));
  el.classList.add('sel');
  updateP2PFormula();
}

function updateP2PFormula() {
  const {num, den, metric, window: win} = ratioState.p2p;
  const mLabel = {balance:'Outstanding_Balance', count:'Count', sanction:'Sanction_Amount', emi:'EMI_Amount'}[metric]||metric;
  const box = document.getElementById('p2p-formula-text');
  if (box) box.textContent = `${mLabel}[${num||'[product]'}] ÷ ${mLabel}[${den}] — last ${win}`;
}

// ══════════════════════════════════════════
// PERCENTILE MULTI-SELECT
// ══════════════════════════════════════════
let selectedPercentiles = [75, 90];
function togglePctChip(el, val) {
  el.classList.toggle('sel');
  if (el.classList.contains('sel')) { if(!selectedPercentiles.includes(val)) selectedPercentiles.push(val); }
  else { selectedPercentiles = selectedPercentiles.filter(x=>x!==val); }
  selectedPercentiles.sort((a,b)=>a-b);
}

// ══════════════════════════════════════════
// RECENCY ACCELERATION
// ══════════════════════════════════════════
let recencyAccelWindow = null;
function toggleRecencyAccel(enabled) {
  document.getElementById('recency-accel-section').style.display = enabled ? 'block' : 'none';
  if (!enabled) recencyAccelWindow = null;
}
function selRecAccelWin(el, win) {
  recencyAccelWindow = win;
  document.querySelectorAll('.rec-accel-row .chip').forEach(c=>c.classList.remove('sel','trade-sel'));
  el.classList.add('sel');
}

// ══════════════════════════════════════════
// TREND ACCELERATION
// ══════════════════════════════════════════
function updateAccelFormula() {
  const w1 = document.getElementById('accel-w1')?.value || '3m';
  const w2 = document.getElementById('accel-w2')?.value || '6m';
  const w3 = document.getElementById('accel-w3')?.value || '12m';
  const m = state.measure ? (currentSchema().trend?.measures[state.measure]?.label || state.measure) : '[metric]';
  const box = document.getElementById('accel-formula-box');
  if (box) box.innerHTML =
    `<strong>Acceleration Formula:</strong><br>` +
    `Δ1 = ${m}[${w1}] − ${m}[${w2}]<br>` +
    `Δ2 = ${m}[${w2}] − ${m}[${w3}]<br>` +
    `<strong>Acceleration = Δ1 − Δ2</strong>`;
}

// Balance dynamics snapshot state
// ══ BALANCE DYNAMICS ENGINE STATE ══
let balanceMode = 'point_in_time';
let balMonthlyAgg = 'avg';
let balDecayType = 'linear';
let balVolNorm = 'absolute';
let balPeakOut = 'peak_value';

const BAL_MODES = [
  { key:'point_in_time',  icon:'📍', name:'Point-in-Time',     desc:'Balance at window end' },
  { key:'monthly_series', icon:'📅', name:'Monthly History',   desc:'Aggregate all monthly snapshots' },
  { key:'time_weighted',  icon:'⚖️', name:'Time-Weighted',     desc:'Weighted avg (recent = higher weight)' },
  { key:'rolling_vol',    icon:'〰️', name:'Rolling Volatility',desc:'Std dev of monthly Δ changes' },
  { key:'peak_detect',    icon:'🏔️', name:'Peak Detection',    desc:'Find peak, trough, dates' },
  { key:'trajectory',     icon:'🏷️', name:'Trajectory',        desc:'Rising / Falling / Stable / Volatile' },
];

function initBalanceModes() {
  const grid = document.getElementById('balance-mode-grid');
  if (!grid || grid.hasChildNodes()) return;
  BAL_MODES.forEach(m => {
    const el = document.createElement('div');
    el.className = 'bmode-card' + (m.key === balanceMode ? ' sel' : '');
    el.innerHTML = `<div class="bmode-icon">${m.icon}</div><div class="bmode-name">${m.name}</div><div class="bmode-desc">${m.desc}</div>`;
    el.onclick = () => selBalanceMode(m.key, el);
    grid.appendChild(el);
  });
}

function selBalanceMode(mkey, el) {
  balanceMode = mkey;
  document.querySelectorAll('#balance-mode-grid .bmode-card').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  // Show correct panel
  document.querySelectorAll('.bmode-panel').forEach(p => p.style.display = 'none');
  const active = document.getElementById(`bpanel-${mkey}`);
  if (active) active.style.display = 'block';
  updateLiveJSON();
}

function selBalSnapshot(el, type) {
  // Legacy support — map to new mode names
  const legacyMap = { peak:'peak_detect', trough:'peak_detect', avg_monthly:'monthly_series', volatility:'rolling_vol', trajectory:'trajectory', point_in_time:'point_in_time' };
  selBalanceMode(legacyMap[type] || type, el);
}

function selMonthlyAgg(el, val) {
  balMonthlyAgg = val;
  document.querySelectorAll('#monthly-agg-chips .magg-chip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  const outEl = document.getElementById('monthly-agg-out');
  if (outEl) outEl.textContent = val;
  updateLiveJSON();
}

function selDecay(el, val) {
  balDecayType = val;
  document.querySelectorAll('#decay-type-chips .decay-chip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  const lambdaRow = document.getElementById('decay-lambda-row');
  const wlabel = document.getElementById('tw-weight-label');
  const labels = { linear:'w(t) = t/T (linear decay)', exponential:'w(t) = exp(λ·t) (exp decay)', uniform:'w(t) = 1 (uniform weight)' };
  if (wlabel) wlabel.textContent = labels[val] || val;
  if (lambdaRow) lambdaRow.style.display = val === 'exponential' ? 'block' : 'none';
  updateLiveJSON();
}

function selVolNorm(el, val) {
  balVolNorm = val;
  document.querySelectorAll('#vol-norm-chips .vnorm-chip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  const outLabels = { absolute:'STD(Δ values)', relative_mean:'STD(Δ) / MEAN(balance) — CV', vs_sanction:'STD(Δ) / Sanction_Amount' };
  const outEl = document.getElementById('vol-norm-out');
  if (outEl) outEl.textContent = outLabels[val] || val;
  updateLiveJSON();
}

function selPeakOut(el, val) {
  balPeakOut = val;
  document.querySelectorAll('#peak-output-chips .pout-chip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  const labels = {
    peak_value:'MAX(balance) over window',
    trough_value:'MIN(balance) over window',
    range:'MAX(balance) − MIN(balance)',
    months_since_peak:'FLOOR((CurrentDate − date_of_peak) / 30)',
    months_since_trough:'FLOOR((CurrentDate − date_of_trough) / 30)',
    peak_to_current:'MAX(balance) / balance_at_window_end',
  };
  const lblEl = document.getElementById('peak-out-label');
  if (lblEl) lblEl.textContent = labels[val] || val;
  updateLiveJSON();
}
function buildRatioAggChips() {
  const sc = currentSchema()[state.subCat];
  if (!sc) return;
  const allowed = ['count','sum'];
  const ac = document.getElementById('ratio-agg-chips');
  ac.innerHTML='';
  const isTrade = state.domain==='trade'||state.domain==='trade_history';
  allowed.forEach(a => {
    if (sc.aggregations.includes(a)) {
      const d = document.createElement('div');
      d.className='chip'; d.textContent=a;
      d.onclick = () => { selChipSingle(ac,d,isTrade); state.ratioMethod=a; };
      ac.appendChild(d);
    }
  });
  if (ac.firstChild) ac.firstChild.click();
}
function buildRatioConditionUI(containerId, prefix) {
  const container = document.getElementById(containerId);
  container.innerHTML='';
  const isTrade = state.domain==='trade'||state.domain==='trade_history';
  const sc = currentSchema()[state.subCat];
  if (!sc) return;
  const f = sc.filters||[];
  let html = '';
  const fchip = (p,type,val) => {
    const isSel = (state.ratioParams[p][type]||[]).includes(val);
    return `<div class="fchip ${isSel?'sel':''}" onclick="toggleRatioFChip(this,'${p}','${type}','${val}')">${val}</div>`;
  };
  const fchipSingle = (p,type,val,label,isSel) => `<div class="fchip ${isSel?'sel':''}" onclick="selRatioFilter('${p}','${type}','${val}',this)">${label||val}</div>`;
  if (isTrade) {
    const s = state.ratioParams[prefix].status;
    // ✅ Full status list in ratio UI
    html += `<div class="sdiv" style="margin-top:0;">Account Status</div>
             <div class="filter-chips" id="${prefix}-st">
               ${fchipSingle(prefix,'status','all','All',s==='all')}
               ${fchipSingle(prefix,'status','active','Active',s==='active')}
               ${fchipSingle(prefix,'status','closed','Closed',s==='closed')}
               ${fchipSingle(prefix,'status','written_off','Written Off',s==='written_off')}
               ${fchipSingle(prefix,'status','settled','Settled',s==='settled')}
               ${fchipSingle(prefix,'status','suit_filed','Suit Filed',s==='suit_filed')}
             </div>`;
    if (f.includes('dpd')) {
      html += `<div class="sdiv">DPD Condition</div>
               <div class="thresh-row">
                 <select class="thresh-op" id="${prefix}-dpd-op" onchange="updateRatioInputState('${prefix}','dpdCond')"><option>&gt;=</option><option>&gt;</option><option>=</option><option>&lt;</option></select>
                 <input type="number" class="thresh-val" id="${prefix}-dpd-val" placeholder="e.g. 30" oninput="updateRatioInputState('${prefix}','dpdCond')">
               </div>`;
    }
    if (f.includes('overdue')) {
      html += `<div class="sdiv">Overdue Amount</div>
               <div class="thresh-row">
                 <select class="thresh-op" id="${prefix}-overdue-op" onchange="updateRatioInputState('${prefix}','overdueCond')"><option>&gt;</option><option>&gt;=</option><option>=</option></select>
                 <input type="number" class="thresh-val" id="${prefix}-overdue-val" placeholder="e.g. 1000" oninput="updateRatioInputState('${prefix}','overdueCond')">
               </div>`;
    }
    if (f.includes('util')) {
      html += `<div class="sdiv">Utilization Threshold</div>
               <div class="thresh-row">
                 <select class="thresh-op" id="${prefix}-util-op" onchange="updateRatioInputState('${prefix}','utilCond')"><option>&gt;=</option><option>&gt;</option><option>&lt;=</option></select>
                 <input type="number" class="thresh-val" id="${prefix}-util-val" placeholder="e.g. 0.8" step="0.01" max="1" oninput="updateRatioInputState('${prefix}','utilCond')">
               </div>`;
    }
    if (f.includes('flag')) {
      html += `<div class="sdiv">Distress Flags</div>
               <div class="filter-chips">${fchip(prefix,'tradeFlags','writeoff')}${fchip(prefix,'tradeFlags','restructured')}${fchip(prefix,'tradeFlags','settled')}${fchip(prefix,'tradeFlags','npa')}</div>`;
    }
  } else {
    if (f.includes('amount')) {
      html += `<div class="sdiv" style="margin-top:0;">Amount Condition</div>
               <div class="thresh-row">
                 <select class="thresh-op" id="${prefix}-amt-op" onchange="updateRatioInputState('${prefix}','amtCond')"><option value="<=">&lt;=</option><option value="<">&lt;</option><option value=">=">&gt;=</option><option value=">">&gt;</option></select>
                 <input type="number" class="thresh-val" id="${prefix}-amt-val" placeholder="e.g. 50000" oninput="updateRatioInputState('${prefix}','amtCond')">
               </div>`;
    }
  }
  if (!html) html = `<div style="font-size:12px;color:var(--text3);padding:8px 0;">No specific conditions for this sub-category.</div>`;
  container.innerHTML = html;
}
function selRatioFilter(prefix, type, val, el) {
  state.ratioParams[prefix][type] = val;
  el.parentElement.querySelectorAll('.fchip').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
}
function toggleRatioFChip(el, prefix, type, val) {
  el.classList.toggle('sel');
  const arr = state.ratioParams[prefix][type]||[];
  if (el.classList.contains('sel')) { if(!arr.includes(val)) arr.push(val); }
  else { const i=arr.indexOf(val); if(i>-1) arr.splice(i,1); }
  state.ratioParams[prefix][type]=arr;
}
function updateRatioInputState(prefix, key) {
  const k = key.replace('Cond','');
  const opEl = document.getElementById(`${prefix}-${k}-op`);
  const valEl = document.getElementById(`${prefix}-${k}-val`);
  if (opEl && valEl) state.ratioParams[prefix][key]={op:opEl.value, val:valEl.value};
}

// ══════════════════════════════════════════
// WIZARD STEPS
// ══════════════════════════════════════════
function updateWizUI() {
  const isTrade = state.domain==='trade'||state.domain==='trade_history';
  const isTradeHist = state.domain==='trade_history';
  const isAccount = state.domain==='account';
  for (let i=1; i<=6; i++) {
    const si=document.getElementById(`s${i}`); const sn=document.getElementById(`sn${i}`);
    si.className='step-item';
    if (i<wizStep)        { si.classList.add('done'); sn.textContent='✓'; }
    else if (i===wizStep) { si.className='step-item active'; sn.textContent=i; }
    else                  { sn.textContent=i; }
    document.getElementById(`sp${i}`).className='substep-panel'+(i===wizStep?' active':'');
  }
  const backBtn=document.getElementById('btn-back');
  backBtn.style.display='inline-flex';
  backBtn.onclick = wizStep===1 ? backToBuildScope : wizBack;
  document.getElementById('btn-next').style.display=wizStep===6?'none':'inline-flex';
  document.getElementById('btn-add').style.display=wizStep===6?'inline-flex':'none';
  // Catalog button: only for enquiry domain, only after type is selected (step >= 2)
  const catalogBtn = document.getElementById('btn-catalog');
  if (catalogBtn) catalogBtn.style.display = (!isTrade && !isTradeHist && !isAccount && wizStep >= 2) ? 'inline-flex' : 'none';
  updateIntermediateVariableVisibility();
  if (wizStep===6) buildFinalPreview();
  if (wizStep===3) {
    const sp3Enquiry = document.getElementById('sp3-enquiry');
    if (sp3Enquiry) sp3Enquiry.style.display=(isTrade||isTradeHist||isAccount)?'none':'block';
    const sp3Trade = document.getElementById('sp3-trade');
    if (sp3Trade) sp3Trade.style.display=(isTrade||isTradeHist)?'block':'none';
    const sp3Account = document.getElementById('sp3-account');
    if (sp3Account) sp3Account.style.display=isAccount?'block':'none';
    const sc=currentSchema()[state.subCat];
    const showLender=sc&&sc.filters&&sc.filters.includes('lender');
    if (!isTrade && !isTradeHist && !isAccount) {
      const enqLenderSection = document.getElementById('enq-lender-section');
      if (enqLenderSection) enqLenderSection.style.display=showLender?'block':'none';
    }
    // Swap notice colour for trade history
    const tradeNotice = document.getElementById('trade-notice');
    if (tradeNotice && isTradeHist) {
      tradeNotice.style.background='var(--tradeh-light)';
      tradeNotice.style.borderColor='rgba(3,105,161,0.25)';
      tradeNotice.style.color='var(--tradeh)';
      tradeNotice.innerHTML='🕐 Trade History variables operate on the payment history string — month-by-month DPD / balance data. Ensure history columns (DPD_String, Balance_History) are present.';
      tradeNotice.className='trade-notice show';
    } else if (tradeNotice && isTrade) {
      tradeNotice.style.background='';tradeNotice.style.borderColor='';tradeNotice.style.color='';
      tradeNotice.innerHTML='⚠️ Trade variables are built on tradeline data — account-level. Ensure tradeline data is part of your bureau file.';
    }
  }
  if (wizStep===2) {
    const banner=document.getElementById('domain-context-banner');
    const thColor = 'rgba(3,105,161,0.08)';
    const thBorder = '1px solid rgba(3,105,161,0.2)';
    banner.style.background=isTrade?'rgba(15,118,110,0.08)':isTradeHist?thColor:isAccount?'rgba(180,83,9,0.07)':'rgba(91,76,245,0.07)';
    banner.style.border=isTrade?'1px solid rgba(15,118,110,0.2)':isTradeHist?thBorder:isAccount?'1px solid rgba(180,83,9,0.2)':'1px solid rgba(91,76,245,0.15)';
    banner.style.color=isTrade?'var(--trade)':isTradeHist?'var(--tradeh)':isAccount?'var(--account)':'var(--accent)';
    const labels=Object.values(currentSchema()).map(s=>s.label).join(', ');
    banner.innerHTML=`<span>${isTrade?'⇌':isTradeHist?'🕐':isAccount?'👤':'🔍'}</span><strong>${state.varType}</strong><span style="font-weight:400;opacity:0.65;font-size:11px;margin-left:4px;">→ ${labels}</span>`;
  }
}

function wizNext() {
  const isTrade=state.domain==='trade'||state.domain==='trade_history';
  const sc=currentSchema()[state.subCat];
  if (wizStep===1) { if (!state.varType) { showToast("Select a variable type."); return; } }
  if (wizStep===2) {
    if (!state.subCat) { showToast("Select a sub-category."); return; }
    if (!state.aggregation) { showToast("Select an aggregation."); return; }
    loadTimeStep();
  }
  if (wizStep===4) {
    if (sc && sc.needs_window && sc.type!=='window_comparison' && state.timeWindows.length===0 && sc.windows&&sc.windows.length>0) {
      showToast("Select at least one time window."); return;
    }
    if (sc && sc.type==='window_comparison' && !state.velPair) {
      showToast("Select a window pair."); return;
    }
    loadConditionsStep();
  }
  if (wizStep===5) {
    // Run compatibility validation before proceeding to review
    const valid = runCompatibilityValidation();
    if (!valid) {
      showToast("⚠ Fix validation errors before continuing.");
      return; // block progression on errors
    }
    // Show rule builder active badge if rules exist
    const badge = document.getElementById('rule-builder-badge');
    if (badge) badge.style.display = ruleGroups.length > 0 ? 'inline-block' : 'none';
    // Init rule builder
    const ruleBuilderGroups = document.getElementById('rule-builder-groups');
    if (ruleBuilderGroups && !ruleBuilderGroups.hasChildNodes()) renderRuleBuilder();
    const dslSection = document.getElementById('rule-dsl-section');
    if (dslSection) dslSection.style.display = ruleGroups.length > 0 ? 'block' : 'none';
  }
  if (wizStep<6) { wizStep++; updateWizUI(); }
}
function wizBack() {
  if (wizStep>1) {
    const clearVariableFlow = wizStep === 2;
    wizStep--;
    refreshBuilderAfterBack(clearVariableFlow);
    updateWizUI();
  }
}

// ══════════════════════════════════════════
// STEP 1: VAR TYPE
// ══════════════════════════════════════════
function selVarType(type, el) {
  state.varType=type;
  const isTrade=type==='Trade';
  const isAccount=type==='Account';
  const isTradeHist=type==='Trade History';
  state.domain=isTrade?'trade':isAccount?'account':isTradeHist?'trade_history':'enquiry';
  document.querySelectorAll('.vt-card').forEach(c=>{c.classList.remove('sel');c.classList.remove('trade-sel');c.classList.remove('account-sel');c.classList.remove('tradeh-sel');});
  el.classList.add(isTrade?'trade-sel':isAccount?'account-sel':isTradeHist?'tradeh-sel':'sel');
  document.getElementById('trade-notice').className='trade-notice'+(isTrade?' show':'');
  document.getElementById('account-notice').className='account-notice'+(isAccount?' show':'');
  const thNotice = document.getElementById('tradeh-notice');
  if (thNotice) thNotice.className='trade-notice'+(isTradeHist?' show':'');
  if (!isTrade && !isAccount && !isTradeHist) {
    state.tradeScope={loanType:[],secured:'all',status:'all',ownership:'all'};
    document.querySelectorAll('#trade-loan-type .fchip').forEach(c=>c.classList.remove('sel'));
    ['tsec-all','tstat-all','town-all'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.add('sel');});
    ['tsec-sec','tsec-unsec','tstat-active','tstat-closed','tstat-wo','tstat-settled','tstat-suit','town-ind','town-joint','town-guar'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('sel');});
  }
  if (!isAccount) {
    state.accScope={loanType:[],secured:'all',status:[],ownership:'all',timeCtx:'snapshot',period:'6'};
  }
  state.intermediateSelection = { product:'', subtype:'', page:0 };
  state.subCat=''; state.measure=''; state.aggregation='';
  state.timeWindows=[]; state.velPair=null;
  buildSubcatGrid();
  document.getElementById('measure-section').style.display='none';
  document.getElementById('measure-chips').innerHTML='';
  document.getElementById('agg-chips').innerHTML='';
  loadBeneficiaries();
  buildPredefList();
  updatePackCardVisibility();
}

// ══════════════════════════════════════════
// STEP 2: SUBCAT + MEASURE + AGG
// ══════════════════════════════════════════
function buildSubcatGrid() {
  const grid=document.getElementById('subcat-grid');
  grid.innerHTML='';
  const schema=currentSchema();
  Object.entries(schema).forEach(([key,sc])=>{
    const d=document.createElement('div');
    d.className='subcat-card'; d.onclick=()=>selSubCat(key,d); d.dataset.key=key;
    const newBadge = sc.isNew ? '<span class="subcat-new">NEW</span>' : '';
    const entBadge = sc.enterprise ? '<span class="subcat-new" style="background:rgba(99,102,241,0.12);color:#6366f1;border-color:rgba(99,102,241,0.25);">ENT</span>' : '';
    const joinBadge = sc.cross_entity_join ? '<span class="subcat-new" style="background:rgba(37,99,235,0.12);color:#2563eb;">JOIN</span>' : '';
    // Show measure count
    const mCount = sc.measures ? Object.keys(sc.measures).length : 0;
    const mHint = mCount > 0 ? `<div class="subcat-type">${sc.type} · ${mCount} measures</div>` : `<div class="subcat-type">${sc.type}</div>`;
    d.innerHTML=`<div class="subcat-name">${sc.label}${newBadge}${entBadge}${joinBadge}</div>${mHint}`;
    if (sc.enterprise) d.style.borderColor='rgba(99,102,241,0.25)';
    grid.appendChild(d);
  });
}

function selSubCat(key, el) {
  state.subCat=key; state.measure=''; state.aggregation='';
  state.aggregationType='simple'; initRatioParams();
  document.querySelectorAll('.subcat-card').forEach(c=>{c.classList.remove('sel');c.classList.remove('trade-sel');c.classList.remove('account-sel');c.classList.remove('tradeh-sel');});
  el.classList.add(state.domain==='trade'?'trade-sel':state.domain==='trade_history'?'tradeh-sel':state.domain==='account'?'account-sel':'sel');

  // Balance type hint for exposure and balance_dynamics
  const sc=currentSchema()[key];
  const showBalHint = key==='exposure' || key==='balance_dynamics';
  document.getElementById('balance-type-section').style.display=showBalHint?'block':'none';
  if (showBalHint && key==='balance_dynamics') {
    document.querySelector('#balance-type-section .info-box').innerHTML =
      '📊 <strong>Balance Dynamics</strong> captures how the balance evolves over time — select a measure above to define the balance field, then configure the snapshot type in the Conditions step.';
  } else if (showBalHint) {
    document.querySelector('#balance-type-section .info-box').innerHTML =
      '💰 <strong>Balance Type</strong> maps directly to a dataset column. Select the measure above to auto-select the relevant balance field.';
  }

  // Show/hide Cross Entity join builder panel
  const crossPanel = document.getElementById('acc-cross-entity-panel');
  if (crossPanel) {
    crossPanel.style.display = (key === 'cross_entity' && state.domain === 'account') ? 'block' : 'none';
    if (key === 'cross_entity') updateCrossEntityPreview();
  }

  // Show/hide Utilization Engine panel
  const utilPanel = document.getElementById('acc-util-engine-panel');
  if (utilPanel) {
    utilPanel.style.display = (key === 'utilization_engine' && state.domain === 'account') ? 'block' : 'none';
    if (key === 'utilization_engine') { updateUtilFormulaBox(); }
  }

  // Show/hide Payment Behavior panel
  const pbPanel = document.getElementById('acc-payment-engine-panel');
  if (pbPanel) {
    pbPanel.style.display = (key === 'payment_behavior' && state.domain === 'account') ? 'block' : 'none';
    if (key === 'payment_behavior') updatePBFormulaBox();
  }

  // Show/hide Credit Mix panel
  const cmPanel = document.getElementById('acc-creditmix-panel');
  if (cmPanel) {
    cmPanel.style.display = (key === 'credit_mix' && state.domain === 'account') ? 'block' : 'none';
    if (key === 'credit_mix') updateCMFormulaBox();
  }

  buildMeasureChips(key);
  document.getElementById('measure-section').style.display='block';
  selectAggType('simple', document.getElementById('agg-type-simple'));
  loadBeneficiaries();
  buildPredefList();
}

function buildMeasureChips(key) {
  const sc=currentSchema()[key];
  const mc=document.getElementById('measure-chips');
  mc.innerHTML='';
  const isTrade=state.domain==='trade'||state.domain==='trade_history';
  Object.entries(sc.measures).forEach(([mkey,mv])=>{
    const d=document.createElement('div');
    d.className='chip';
    // Show column mapping if available
    const colHint = mv.col ? ` [${mv.col}]` : '';
    d.textContent=mv.label||mkey;
    if (mv.col) d.title=`Column: ${mv.col}`;
    d.onclick=()=>{
      selChipSingle(mc,d,isTrade);
      state.measure=mkey;
      buildAggChips(key);
      // Update recency date hint in real-time if on step 5
      if (wizStep===5&&state.subCat==='recency') showRecencyInfo();
    };
    mc.appendChild(d);
  });
  buildAggChips(key);
}

function buildAggChips(key) {
  const sc=currentSchema()[key];
  let allowed=sc.aggregations;
  if (state.measure&&MEASURE_AGG_MAP[state.measure]) allowed=MEASURE_AGG_MAP[state.measure];
  const ac=document.getElementById('agg-chips');
  ac.innerHTML='';
  const isTrade=state.domain==='trade'||state.domain==='trade_history';
  // Distribution stats — purple tint
  const distStats=['median','std','variance','cv','skew','kurtosis','iqr','outlier_count'];
  // Velocity/momentum family — amber tint
  const velStats=['trend','slope','velocity','acceleration','momentum','lag_corr','entropy','max_streak','classification','regression'];
  allowed.forEach(a=>{
    const isVel = velStats.includes(a);
    const isDist = distStats.includes(a);
    const d=document.createElement('div');
    d.className='chip'+(isDist?' stat-chip':isVel?' vel-chip':'');
    d.textContent=a;
    const params=sc.agg_params&&sc.agg_params[a]||{};
    if (params.min_rec) d.title=`⚠ Requires ≥${params.min_rec} records`;
    if (params.description) d.title=(d.title?d.title+' | ':'')+params.description;
    d.onclick=()=>{
      selChipSingle(ac,d,isTrade);
      state.aggregation=a;
      // Percentile: show single or multi selector
      const isPct = a==='percentile';
      const isPctMulti = params.needs_pct_multi;
      document.getElementById('pct-row').style.display=isPct?'block':'none';
      document.getElementById('pct-multi-row').style.display=isPctMulti?'block':'none';
      // Acceleration: show triple window selector
      const isAccel = a==='acceleration';
      const trendAccelSec = document.getElementById('trend-accel-section');
      if (trendAccelSec) { trendAccelSec.style.display = (isAccel&&(key==='trend'||key==='risk_momentum')) ? 'block' : 'none'; if(isAccel) updateAccelFormula(); }
      // Classification: show class section
      const isClass = a==='classification';
      const trendClassSec = document.getElementById('trend-class-section');
      if (trendClassSec) trendClassSec.style.display = (isClass&&(key==='trend'||key==='risk_momentum')) ? 'block' : 'none';
      const hint=document.getElementById('stat-min-rec-hint');
      if (params.min_rec) { hint.textContent=`⚠ ${a.toUpperCase()} requires ≥${params.min_rec} records per group`; hint.style.display='block'; }
      else hint.style.display='none';
    };
    ac.appendChild(d);
  });
}

function selChipSingle(container, el, isTrade) {
  const isTradeHist = state.domain==='trade_history';
  container.querySelectorAll('.chip').forEach(c=>{c.classList.remove('sel');c.classList.remove('trade-sel');c.classList.remove('tradeh-sel');});
  el.classList.add(isTradeHist?'tradeh-sel':isTrade?'trade-sel':'sel');
}

// ══════════════════════════════════════════
// STEP 4: TIME WINDOW — DYNAMIC
// ══════════════════════════════════════════
function loadTimeStep() {
  const sc=currentSchema()[state.subCat];
  const isTrade=state.domain==='trade'||state.domain==='trade_history';
  const isTradeHist=state.domain==='trade_history';
  const twSelClass=isTradeHist?'tradeh-sel':isTrade?'trade-sel':'sel';
  const vpSelClass=isTradeHist?'tradeh-trend-sel':isTrade?'trade-trend-sel':'sel';
  state.timeWindows=[]; state.velPair=null; state.customWindow='';
  const nw=document.getElementById('normal-windows');
  const vw=document.getElementById('velocity-windows');
  const tbs=document.getElementById('time-based-on-section');
  const cwRow=document.getElementById('custom-window-row');

  if (tbs) tbs.style.display=(isTrade&&sc.time_based)?'block':'none';
  if (cwRow) cwRow.classList.remove('show');

  if (sc.type==='window_comparison') {
    if (nw) nw.style.display='none'; 
    if (vw) vw.style.display='block';
    const vpc=document.getElementById('velpair-chips');
    if (vpc) {
      vpc.innerHTML='';
      const pairs=sc.window_pairs||[["3m","6m"],["6m","12m"],["3m","12m"]];
      pairs.forEach(([w1,w2])=>{
        const d=document.createElement('div');
        d.className='vp-chip';
        d.textContent=`${w1} → ${w2}`;
        d.onclick=()=>{
          document.querySelectorAll('.vp-chip').forEach(c=>{c.classList.remove('sel');c.classList.remove('trade-trend-sel');c.classList.remove('tradeh-trend-sel');});
          d.classList.add(vpSelClass);
          state.velPair=[w1,w2];
        };
        vpc.appendChild(d);
      });
    }
  } else {
    if (nw) nw.style.display='block'; 
    if (vw) vw.style.display='none';
    const twc=document.getElementById('tw-chips');
    if (twc) {
      twc.innerHTML='';
      if (!sc.needs_window||!sc.windows||sc.windows.length===0) {
        twc.innerHTML='<span style="font-size:13px;color:var(--text3)">No time window required for this sub-category.</span>';
        return;
      }
      const multiHint=document.getElementById('multi-hint');
      if (multiHint) multiHint.style.display=sc.multi_window?'block':'none';
      sc.windows.forEach(w=>{
        const d=document.createElement('div');
        d.className='tw-chip'; d.textContent=w;
        d.onclick=()=>{
          // Always single-select
          twc.querySelectorAll('.tw-chip').forEach(c=>{c.classList.remove('sel');c.classList.remove('trade-sel');c.classList.remove('tradeh-sel');});
          d.classList.add(twSelClass);
          state.timeWindows=[w];
          if (cwRow) cwRow.classList.remove('show');
          if (typeof updateLiveJSON === 'function') updateLiveJSON();
        };
        twc.appendChild(d);
      });
      const cw=document.createElement('div');
      cw.className='tw-chip custom-tw'; cw.textContent='Custom';
      cw.onclick=()=>{
        if (!sc.multi_window) {
          twc.querySelectorAll('.tw-chip').forEach(c=>{c.classList.remove('sel');c.classList.remove('trade-sel');c.classList.remove('tradeh-sel');});
        }
        cw.classList.toggle(twSelClass);
        const isActive=cw.classList.contains('sel')||cw.classList.contains('trade-sel')||cw.classList.contains('tradeh-sel');
        if (cwRow) cwRow.classList.toggle('show', isActive);
        if (!isActive) { state.customWindow=''; const cwVal=document.getElementById('custom-window-val'); if (cwVal) cwVal.value=''; }
      };
      twc.appendChild(cw);
    }
  }
}

function selTimeBased(el, val) {
  state.timeBased=val;
  document.querySelectorAll('#time-based-chips .chip').forEach(c=>{c.classList.remove('sel');c.classList.remove('trade-sel');c.classList.remove('tradeh-sel');});
  el.classList.add(state.domain==='trade_history'?'tradeh-sel':state.domain==='trade'?'trade-sel':'sel');
}

// ══════════════════════════════════════════
// STEP 5: CONDITIONS
// ══════════════════════════════════════════
function loadConditionsStep() {
  const sc=currentSchema()[state.subCat];
  const isTrade=state.domain==='trade'||state.domain==='trade_history';
  const f=sc?sc.filters:[];
  // Hide all condition blocks (including new v12 ones)
  const allCondIds = [
    'cond-enq-amount','cond-enq-threshold',
    'cond-trade-dpd','cond-trade-overdue','cond-trade-util','cond-trade-flags','cond-trade-lender',
    'cond-recency-info','cond-trend-info','cond-balance-dynamics-info',
    'cond-transition-info','cond-vintage-info','cond-stability-info',
    // v12 new filter panels
    'cond-dpd-bucket','cond-utilization-band','cond-account-age','cond-mob-bucket','cond-payment-status',
    // v12 new sub-category info panels
    'cond-payment-behaviour-info','cond-payment-gap-info','cond-risk-momentum-info',
    'cond-delinquency-severity-info','cond-credit-line-info','cond-account-stability-info',
    // v14 new sub-category info panels
    'cond-streak-info','cond-btrend-info','cond-cure-info','cond-roll-info','cond-vstab-info'
  ];
  allCondIds.forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='none'; });
  let anyVisible=false;

  // Helper: show new filter panels based on filters array
  function showNewFilters(filterList) {
    if (filterList.includes('dpd_bucket'))      { const el=document.getElementById('cond-dpd-bucket');       if(el){el.style.display='block'; anyVisible=true;} }
    if (filterList.includes('utilization_band')){ const el=document.getElementById('cond-utilization-band'); if(el){el.style.display='block'; anyVisible=true;} }
    if (filterList.includes('account_age'))     { const el=document.getElementById('cond-account-age');      if(el){el.style.display='block'; anyVisible=true;} }
    if (filterList.includes('mob_bucket'))      { const el=document.getElementById('cond-mob-bucket');       if(el){el.style.display='block'; anyVisible=true;} }
    if (filterList.includes('payment_status'))  { const el=document.getElementById('cond-payment-status');   if(el){el.style.display='block'; anyVisible=true;} }
  }

  // Recency info block
  if (state.subCat==='recency') {
    document.getElementById('cond-recency-info').style.display='block';
    showRecencyInfo();
    anyVisible=true;
  }
  // Trend info block — init mode grid on first open
  if (state.subCat==='trend') {
    document.getElementById('cond-trend-info').style.display='block';
    showTrendInfo();
    anyVisible=true;
    if (f.includes('dpd')) { document.getElementById('cond-trade-dpd').style.display='block'; anyVisible=true; }
    if (f.includes('overdue')) { document.getElementById('cond-trade-overdue').style.display='block'; anyVisible=true; }
  }

  // Balance dynamics — init mode grid on first open
  if (state.subCat==='balance_dynamics') {
    document.getElementById('cond-balance-dynamics-info').style.display='block';
    initBalanceModes();
    anyVisible=true;
    if (f.includes('dpd')) { document.getElementById('cond-trade-dpd').style.display='block'; anyVisible=true; }
    if (f.includes('overdue')) { document.getElementById('cond-trade-overdue').style.display='block'; anyVisible=true; }
    if (f.includes('lender')) { document.getElementById('cond-trade-lender').style.display='block'; anyVisible=true; }
  }

  // Enterprise: Transition Matrix
  if (state.subCat==='transition_matrix') {
    const el = document.getElementById('cond-transition-info');
    if (el) { el.style.display='block'; anyVisible=true; }
    updateTransitionPreview();
    if (f.includes('lender')) { document.getElementById('cond-trade-lender').style.display='block'; anyVisible=true; }
  }

  // Enterprise: Vintage Cohort
  if (state.subCat==='vintage_cohort') {
    const el = document.getElementById('cond-vintage-info');
    if (el) { el.style.display='block'; anyVisible=true; }
  }

  // Enterprise: Stability Score
  if (state.subCat==='stability_score') {
    const el = document.getElementById('cond-stability-info');
    if (el) { el.style.display='block'; anyVisible=true; }
  }

  // ── v12 NEW SUB-CATEGORIES ──────────────────────────────────────

  // Payment Behaviour
  if (state.subCat==='payment_behaviour') {
    showInlineInfo('cond-payment-behaviour-info',
      '💳', 'Payment Behaviour',
      'Aggregates on-time, late, missed, partial payment months from DPD_String. ' +
      'ratio = proportion of months in that state · max_streak = longest consecutive run · ' +
      'trend = direction of change in ratio over rolling window.',
      [
        ['on_time_payment_ratio','COUNT(DPD=0) / Total_Months'],
        ['late_payment_count','COUNT(1 ≤ DPD ≤ 29)'],
        ['missed_payment_ratio','COUNT(DPD≥30) / Total_Months'],
        ['max_consecutive_missed','MAX_STREAK(DPD≥30)']
      ]
    );
    anyVisible=true;
    showNewFilters(f);
    if (f.includes('lender')) { document.getElementById('cond-trade-lender').style.display='block'; anyVisible=true; }
  }

  // Payment Gap Analysis
  if (state.subCat==='payment_gap_analysis') {
    showInlineInfo('cond-payment-gap-info',
      '⏱️', 'Payment Gap Analysis',
      'Computes intervals between consecutive payment dates. ' +
      'Skewed distribution = sporadic payer. High CV = inconsistent timing = elevated risk.',
      [
        ['avg_days_between_payments','AVG(DIFF(payment_dates))'],
        ['max_payment_gap','MAX(gap_series)'],
        ['payment_gap_skew','SKEW(gap_series) — +ve = occasional large gaps'],
        ['payment_gap_cv','STD/MEAN(gaps) — high = inconsistent payer']
      ]
    );
    anyVisible=true;
    showNewFilters(f);
  }

  // Risk Momentum
  if (state.subCat==='risk_momentum') {
    showInlineInfo('cond-risk-momentum-info',
      '📉', 'Risk Momentum',
      'Velocity = rate of change of a metric over window pair. ' +
      'Acceleration = rate of change of velocity (2nd derivative — 3 windows needed). ' +
      'Positive acceleration in DPD = stress accelerating = high risk.',
      [
        ['dpd_velocity','(AVG_DPD[w1] − AVG_DPD[w2]) / months'],
        ['dpd_acceleration','ACCEL(dpd_velocity, 3-window triple)'],
        ['util_velocity','(AVG_UTIL[w1] − AVG_UTIL[w2]) / months'],
        ['risk_momentum_score','COMPOSITE(dpd_vel, ovr_vel, util_vel)']
      ]
    );
    anyVisible=true;
    showNewFilters(f);
    // Risk momentum uses window pairs — show velocity window section
    const vw=document.getElementById('velocity-windows');
    if (vw) vw.style.display='block';
  }

  // Delinquency Severity (sequence)
  if (state.subCat==='delinquency_severity_seq') {
    showInlineInfo('cond-delinquency-severity-info',
      '🔥', 'Delinquency Severity Sequence',
      'Sequence-level analysis of DPD_String — severity score, streak analysis, entropy, cure/relapse rates. ' +
      'entropy = higher spread across DPD bands = complex risk profile.',
      [
        ['dpd_severity_score','SUM(DPD[i] × weight_i) / Total_Months'],
        ['max_dpd_streak','MAX_STREAK(DPD≥30) — longest consecutive delinquent run'],
        ['dpd_band_entropy','ENTROPY(DPD_band_distribution)'],
        ['cure_rate','COUNT(transition_to_DPD0) / COUNT(DPD>0)'],
        ['relapse_rate','COUNT(DPD30_after_DPD0) / COUNT(clean_months)']
      ]
    );
    anyVisible=true;
    showNewFilters(f);
    if (f.includes('lender')) { document.getElementById('cond-trade-lender').style.display='block'; anyVisible=true; }
  }

  // Credit Line Dynamics
  if (state.subCat==='credit_line_dynamics') {
    showInlineInfo('cond-credit-line-info',
      '📈', 'Credit Line Dynamics',
      'Tracks CreditLimit_History array — count of increases/decreases, change rate, utilization spikes post-increase. ' +
      'Frequent decreases = lender-initiated limit cuts = early stress signal.',
      [
        ['credit_limit_change_rate','(CL_end − CL_start) / CL_start'],
        ['limit_increase_count','COUNT(CL[i] > CL[i-1])'],
        ['limit_decrease_freq','COUNT(decreases) / (window_months/12)'],
        ['util_spike_post_increase','UTIL[after_increase] − UTIL[before_increase]']
      ]
    );
    anyVisible=true;
    showNewFilters(f);
    if (f.includes('lender')) { document.getElementById('cond-trade-lender').style.display='block'; anyVisible=true; }
  }

  // Account Stability Index
  if (state.subCat==='account_stability_idx') {
    showInlineInfo('cond-account-stability-info',
      '🏛️', 'Account Stability Index',
      'Statistical dispersion measures — lower CV/std = stable credit behaviour = lower risk. ' +
      'Entropy measures spread of payment states. lag_corr = autocorrelation = behavioral persistence.',
      [
        ['balance_cv','STD(Balance) / MEAN(Balance) — lower = more stable'],
        ['utilization_std','STD(util_monthly_series)'],
        ['dpd_variance','VAR(DPD_series_in_window)'],
        ['behavioral_entropy','ENTROPY(payment_state_distribution)'],
        ['lag_corr_1','LAG_CORR(metric_series, lag=1) — persistence score']
      ]
    );
    anyVisible=true;
    showNewFilters(f);
  }

  // ── v14 NEW SUB-CATEGORIES ──────────────────────────────────────

  // Payment Streak
  if (state.subCat==='streak_features') {
    showInlineInfo('cond-streak-info',
      '🔁', 'Payment Streak Features',
      'Consecutive run analysis on DPD_String. Detects persistent vs sporadic delinquency. ' +
      'Example: [0 0 30 30 30 0 60] → max_consecutive_dpd30 = 3.',
      [
        ['max_consecutive_dpd30', 'MAX_STREAK(DPD≥30) — e.g. [0 0 30 30 30 0 60] = 3'],
        ['max_consecutive_clean', 'MAX_STREAK(DPD=0)'],
        ['current_clean_streak',  'CURRENT_STREAK_HEAD(DPD=0) — streak as of last month'],
        ['current_delq_streak',   'CURRENT_STREAK_HEAD(DPD≥30) — if currently delinquent'],
        ['streak_ratio',          'max_clean_streak / (max_delq_streak + 1)']
      ]
    );
    anyVisible=true;
    showNewFilters(f);
    if (f.includes('lender')) { document.getElementById('cond-trade-lender').style.display='block'; anyVisible=true; }
  }

  // Behaviour Trend
  if (state.subCat==='behaviour_trend') {
    showInlineInfo('cond-btrend-info',
      '📊', 'Behaviour Trend Features',
      'Compares recent window vs historical window. (+ve) result = WORSENING. ' +
      'Example: avg_dpd_last_3m − avg_dpd_last_12m > 0 → borrower deteriorating.',
      [
        ['dpd_trend_3m_vs_12m',   'AVG_DPD[3m] − AVG_DPD[12m] → +ve = worsening'],
        ['dpd_trend_6m_vs_24m',   'AVG_DPD[6m] − AVG_DPD[24m]'],
        ['overdue_trend_3m_vs_12m','AVG_OVR[3m] − AVG_OVR[12m]'],
        ['util_trend_3m_vs_12m',  'AVG_UTIL[3m] − AVG_UTIL[12m]'],
        ['behaviour_direction',   'SIGN(diff): +1=worsening, 0=stable, −1=improving']
      ]
    );
    anyVisible=true;
    showNewFilters(f);
    if (f.includes('lender')) { document.getElementById('cond-trade-lender').style.display='block'; anyVisible=true; }
  }

  // Cure Behaviour
  if (state.subCat==='cure_behaviour') {
    showInlineInfo('cond-cure-info',
      '💊', 'Cure Behaviour Features',
      'Measures recovery time after delinquency episodes. ' +
      'Example: [0 30 60 30 0] → months_to_cure_after_dpd30 = 2. Separates temporary vs persistent defaulters.',
      [
        ['months_to_cure_after_dpd30', 'AVG(months from DPD≥30 → DPD=0)'],
        ['months_to_cure_after_dpd60', 'AVG(months from DPD≥60 → DPD=0)'],
        ['cure_success_rate',          'COUNT(cured) / COUNT(delinquency events)'],
        ['relapse_after_cure',         'COUNT(DPD30+ within 6m of cure) / COUNT(cures)'],
        ['cure_speed_index',           '1 / (avg_months_to_cure + 1) — higher = faster recovery']
      ]
    );
    anyVisible=true;
    showNewFilters(f);
    if (f.includes('lender')) { document.getElementById('cond-trade-lender').style.display='block'; anyVisible=true; }
  }

  // Roll Rate
  if (state.subCat==='roll_rate') {
    showInlineInfo('cond-roll-info',
      '🎲', 'Roll Rate / Transition Features',
      'DPD bucket-to-bucket transition rates. Core bank risk monitoring metric. ' +
      'Formula: count(A→B transitions) / count(months in bucket A).',
      [
        ['dpd30_to_60_roll_rate',  'COUNT(30→60) / COUNT(months with DPD 30-59)'],
        ['dpd60_to_90_roll_rate',  'COUNT(60→90) / COUNT(months with DPD 60-89)'],
        ['clean_to_dpd30_rate',    'COUNT(0→30+) / COUNT(clean months) — entry rate'],
        ['cure_roll_dpd30_to_0',   'COUNT(30+→0) / COUNT(DPD30+ months) — cure rate'],
        ['net_roll_score',         'forward_rolls − backward_rolls — positive = worsening']
      ]
    );
    anyVisible=true;
    showNewFilters(f);
    if (f.includes('lender')) { document.getElementById('cond-trade-lender').style.display='block'; anyVisible=true; }
  }

  // Payment Stability
  if (state.subCat==='payment_stability') {
    showInlineInfo('cond-vstab-info',
      '📉', 'Payment Stability / Volatility',
      'Measures erratic payment behaviour. Higher irregularity index = unstable borrower. ' +
      'Formula: std(DPD_history) / avg(DPD_history).',
      [
        ['payment_irregularity_index', 'STD(DPD_series) / (AVG(DPD_series)+1) — core metric'],
        ['dpd_cv',                     'STD(DPD) / (MEAN(DPD)+1) — coefficient of variation'],
        ['payment_swing_index',        'MAX(DPD_window) − MIN(DPD_window) — range spread'],
        ['payment_pattern_entropy',    'ENTROPY(DPD_band_distribution) — state diversity'],
        ['composite_stability_score',  'COMPOSITE(dpd_irr, ovr_irr, bal_irr, entropy) → 0-100']
      ]
    );
    anyVisible=true;
    showNewFilters(f);
    if (f.includes('lender')) { document.getElementById('cond-trade-lender').style.display='block'; anyVisible=true; }
  }

  // ── STANDARD FILTER HANDLING ────────────────────────────────────
  if (!isTrade) {
    if (f.includes('amount')) {
      const el = document.getElementById('cond-enq-amount');
      if (el) { el.style.display='block'; anyVisible=true; }
    }
    if (sc && sc.type === 'conditional_flag') {
      const el = document.getElementById('cond-enq-threshold');
      if (el) { el.style.display='block'; anyVisible=true; }
    }
  } else if (!['recency','trend','balance_dynamics','transition_matrix','vintage_cohort','stability_score',
               'payment_behaviour','payment_gap_analysis','risk_momentum','delinquency_severity_seq',
               'credit_line_dynamics','account_stability_idx',
               'streak_features','behaviour_trend','cure_behaviour','roll_rate','payment_stability'].includes(state.subCat)) {
    if (f.includes('dpd'))     { document.getElementById('cond-trade-dpd').style.display='block';     anyVisible=true; }
    if (f.includes('overdue')) { document.getElementById('cond-trade-overdue').style.display='block'; anyVisible=true; }
    if (f.includes('util'))    { document.getElementById('cond-trade-util').style.display='block';    anyVisible=true; }
    if (f.includes('flag'))    { document.getElementById('cond-trade-flags').style.display='block';   anyVisible=true; }
    if (f.includes('lender'))  { document.getElementById('cond-trade-lender').style.display='block';  anyVisible=true; }
    showNewFilters(f);
  }

  document.getElementById('no-conditions-msg').style.display=anyVisible?'none':'block';

  // Run initial passive validation (no blocking here, just show panel)
  runCompatibilityValidation();

  // Init rule builder if not yet done
  const rbg = document.getElementById('rule-builder-groups');
  if (rbg && !rbg.hasChildNodes()) renderRuleBuilder();

  // Post-processing
  const ppSection=document.getElementById('pp-section');
  const ppCards=document.getElementById('pp-cards');
  ppCards.innerHTML=''; state.postProcessing=[];
  if (sc&&sc.post&&sc.post.length>0) {
    ppSection.style.display='block';
    sc.post.forEach(pp=>{
      const d=document.createElement('div'); d.className='pp-card';
      d.innerHTML=`<div class="pp-name">${pp}</div><div class="pp-sub">${ppDesc(pp)}</div>`;
      d.onclick=()=>{
        d.classList.toggle('sel');
        if (d.classList.contains('sel')) { if(!state.postProcessing.includes(pp)) state.postProcessing.push(pp); }
        else state.postProcessing=state.postProcessing.filter(x=>x!==pp);
        document.getElementById('cap-params').style.display=state.postProcessing.includes('cap')?'block':'none';
        document.getElementById('bucket-params').style.display=state.postProcessing.includes('bucket')?'block':'none';
      };
      ppCards.appendChild(d);
    });
  } else ppSection.style.display='none';
}

// Helper: render inline info box for new sub-categories
function showInlineInfo(panelId, icon, title, desc, formulaRows) {
  let el = document.getElementById(panelId);
  if (!el) {
    el = document.createElement('div');
    el.id = panelId;
    el.style.marginTop = '14px';
    document.getElementById('no-conditions-msg').parentNode.insertBefore(el, document.getElementById('no-conditions-msg'));
  }
  el.style.display = 'block';
  const rowsHtml = formulaRows.map(([name, formula]) =>
    `<div style="display:flex;justify-content:space-between;padding:4px 8px;border-bottom:1px solid var(--border);font-size:10px;">
      <span style="font-family:var(--mono);color:var(--tradeh);font-weight:600;">${name}</span>
      <span style="color:var(--text3);font-family:var(--mono);">${formula}</span>
    </div>`
  ).join('');
  el.innerHTML = `
    <div style="background:var(--tradeh-light);border-radius:8px;border:1px solid rgba(3,105,161,0.2);overflow:hidden;">
      <div style="padding:10px 12px;background:rgba(3,105,161,0.08);border-bottom:1px solid rgba(3,105,161,0.15);display:flex;align-items:center;gap:8px;">
        <span style="font-size:16px;">${icon}</span>
        <div>
          <div style="font-size:12px;font-weight:800;color:var(--tradeh);">${title}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:1px;">${desc}</div>
        </div>
      </div>
      <div style="padding:6px 0;">${rowsHtml}</div>
    </div>`;
}

// ══ RECENCY ENGINE STATE ══
let recencyDPDThreshold = 30;   // default DPD30
let recencyWOAmount = 0;        // default any writeoff

// Recency: build grouped measure chips + show event builder if needed
function showRecencyInfo() {
  const sc = TRD_SCHEMA.recency;
  if (!sc) return;

  // Build grouped chips
  const container = document.getElementById('rec-group-container');
  if (container) {
    const groups = sc.measure_groups || {};
    let html = '';
    Object.entries(groups).forEach(([gkey, glabel]) => {
      const measuresInGroup = Object.entries(sc.measures).filter(([mk, mv]) => mv.group === gkey);
      if (!measuresInGroup.length) return;
      html += `<div style="margin-bottom:12px;">
        <div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;padding:3px 8px;background:var(--bg);border-radius:4px;display:inline-block;">${glabel}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">`;
      measuresInGroup.forEach(([mk, mv]) => {
        const isSel = state.measure === mk;
        html += `<div class="rpre-chip${isSel?' sel':''}" onclick="selRecMeasure('${mk}',this)">${mv.label}</div>`;
      });
      html += `</div></div>`;
    });
    // Ungrouped measures
    const ungrouped = Object.entries(sc.measures).filter(([mk, mv]) => !mv.group);
    if (ungrouped.length) {
      html += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">`;
      ungrouped.forEach(([mk, mv]) => {
        const isSel = state.measure === mk;
        html += `<div class="rpre-chip${isSel?' sel':''}" onclick="selRecMeasure('${mk}',this)">${mv.label}</div>`;
      });
      html += `</div>`;
    }
    container.innerHTML = html;
  }

  updateRecencyConditions();
}

function selRecMeasure(mkey, el) {
  state.measure = mkey;
  // Update chip selection in group container
  document.querySelectorAll('#rec-group-container .rpre-chip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  updateRecencyConditions();
  // Also update agg chips
  buildAggChips(state.subCat);
  updateLiveJSON();
}

function updateRecencyConditions() {
  const sc = TRD_SCHEMA.recency;
  if (!sc || !state.measure) return;
  const mv = sc.measures[state.measure];
  const dateCol = sc.date_column_map[state.measure] || 'DateReported';
  const specialFormula = sc.recency_formulas && sc.recency_formulas[state.measure];

  // Show/hide event builder
  const builder = document.getElementById('rec-event-builder');
  const dpdBuilder = document.getElementById('rec-dpd-builder');
  const woBuilder = document.getElementById('rec-wo-builder');
  if (builder && mv) {
    const hasDPD = mv.group === 'dpd' && mv.event_filter && mv.event_filter.field === 'DPD';
    const hasWO  = mv.event_filter && mv.event_filter.field === 'writeoff_amt_tot';
    builder.style.display = (hasDPD || hasWO) ? 'block' : 'none';
    if (dpdBuilder) dpdBuilder.style.display = hasDPD ? 'block' : 'none';
    if (woBuilder)  woBuilder.style.display  = hasWO  ? 'block' : 'none';
    // Pre-select DPD preset from measure name
    if (hasDPD) {
      const presetMap = { months_since_last_dpd30:30, months_since_last_dpd60:60, months_since_last_dpd90:90 };
      if (presetMap[state.measure]) selDPDPreset(null, presetMap[state.measure], true);
    }
  } else if (builder) builder.style.display = 'none';

  // Update formula preview
  const formula = specialFormula || `FLOOR( (CurrentDate − MAX(${dateCol})) / 30 )`;
  const infoEl = document.getElementById('recency-date-info');
  if (infoEl) infoEl.innerHTML =
    `📅 <strong>Measure:</strong> ${mv ? mv.label : state.measure}<br>` +
    `<strong>Date Column:</strong> <span style="font-family:var(--mono)">${dateCol}</span><br>` +
    `<strong>Formula:</strong> <span style="font-family:var(--mono);font-size:11px;">${formula}</span>`;
  updateRecFormula();
}

function selDPDPreset(el, val, silent) {
  recencyDPDThreshold = val;
  if (!silent) {
    document.querySelectorAll('#rec-dpd-preset-row .rpre-chip').forEach(c => c.classList.remove('sel'));
    if (el) el.classList.add('sel');
  }
  const customRow = document.getElementById('rec-dpd-custom-row');
  if (customRow) customRow.style.display = (val === 'custom') ? 'block' : 'none';
  updateRecFormula();
}

function selWOPreset(el, val) {
  recencyWOAmount = val;
  document.querySelectorAll('#rec-wo-builder .rpre-chip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  const customRow = document.getElementById('rec-wo-custom-row');
  if (customRow) customRow.style.display = (val === 'custom') ? 'block' : 'none';
  updateRecFormula();
}

function updateRecFormula() {
  const liveEl = document.getElementById('rec-formula-live');
  if (!liveEl || !state.measure) return;
  const sc = TRD_SCHEMA.recency;
  const mv = sc && sc.measures[state.measure];
  if (!mv) return;
  const dateCol = sc.date_column_map[state.measure] || 'DateReported';
  let cond = '';
  if (mv.event_filter && mv.event_filter.field === 'DPD') {
    const thresh = recencyDPDThreshold === 'custom'
      ? (document.getElementById('rec-dpd-val') ? document.getElementById('rec-dpd-val').value || '?' : '?') : recencyDPDThreshold;
    const op = recencyDPDThreshold === 'custom'
      ? (document.getElementById('rec-dpd-op') ? document.getElementById('rec-dpd-op').value : '>=') : '>=';
    cond = ` WHERE DPD ${op} ${thresh}`;
  } else if (mv.event_filter && mv.event_filter.field === 'writeoff_amt_tot') {
    const amt = recencyWOAmount === 'custom'
      ? (document.getElementById('rec-wo-val') ? document.getElementById('rec-wo-val').value || '?' : '?') : recencyWOAmount;
    const op = document.getElementById('rec-wo-op') ? document.getElementById('rec-wo-op').value : '>';
    cond = ` WHERE writeoff_amt_tot ${op} ${amt}`;
  }
  liveEl.innerHTML =
    `<span style="color:#7cb9e8;">event_date</span>  = MAX(${dateCol}${cond})\n` +
    `<span style="color:#7cb9e8;">formula</span>     = FLOOR( (CurrentDate − event_date) / 30 )\n` +
    `<span style="color:#f8c8a0;">output</span>      = months since last qualifying event`;
}

// ══ TREND ENGINE STATE ══
let trendMode = 'window_diff';   // active trend mode
let trendRollingWin = { slope:'12m', vol:'12m', reg:'12m' };
let trendRegOutputs = ['slope','r_squared'];

const TREND_MODES = [
  { key:'window_diff',   icon:'⬆️',  name:'Window Diff',    desc:'Recent vs Prior window (diff/growth/ratio)' },
  { key:'rolling_slope', icon:'📈',  name:'Rolling Slope',   desc:'OLS linear slope over monthly values' },
  { key:'volatility',    icon:'〰️', name:'Volatility',      desc:'Std dev of month-over-month changes' },
  { key:'regression',    icon:'📊',  name:'Regression',      desc:'Full OLS: slope + R² + intercept' },
  { key:'acceleration',  icon:'⚡',  name:'Acceleration',    desc:'2nd derivative (rate-of-change of trend)' },
  { key:'classification',icon:'🏷️', name:'Behavioural',     desc:'Classify: improving / stable / volatile' },
];

function showTrendInfo() {
  // Build mode grid
  const grid = document.getElementById('trend-mode-grid');
  if (grid && !grid.hasChildNodes()) {
    TREND_MODES.forEach(m => {
      const el = document.createElement('div');
      el.className = 'tmode-card' + (m.key === trendMode ? ' sel' : '');
      el.innerHTML = `<div class="tmode-icon">${m.icon}</div><div class="tmode-name">${m.name}</div><div class="tmode-desc">${m.desc}</div>`;
      el.onclick = () => selTrendMode(m.key, el);
      grid.appendChild(el);
    });
  }
  // Sync active panels
  syncTrendPanel(trendMode);
  // Update calc info
  updateTrendCalcInfo();
  // Init acceleration formula
  updateAccelFormula();
}

function selTrendMode(mkey, el) {
  trendMode = mkey;
  document.querySelectorAll('#trend-mode-grid .tmode-card').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  syncTrendPanel(mkey);
  updateTrendCalcInfo();
  updateLiveJSON();
}

function syncTrendPanel(mkey) {
  document.querySelectorAll('.tmode-panel').forEach(p => p.style.display = 'none');
  const active = document.getElementById(`tpanel-${mkey}`);
  if (active) active.style.display = 'block';
  if (mkey === 'acceleration') updateAccelFormula();
}

function updateTrendCalcInfo() {
  const el = document.getElementById('trend-calc-info');
  if (!el) return;
  const trendSc = currentSchema().trend;
  const mLabel = state.measure ? (trendSc?.measures[state.measure] ? trendSc.measures[state.measure].label : state.measure) : '(select measure)';
  const pairStr = state.velPair ? `${state.velPair[0]} → ${state.velPair[1]}` : '(select in Step 4)';
  const aggMap = { difference:'Difference (Recent − Prior)', ratio:'Ratio (Recent / Prior)', growth_rate:'Growth % ((R−P)/P × 100)', slope:'Linear Slope', acceleration:'2nd Derivative (Acceleration)', volatility:'Std Dev of Changes', regression:'OLS Regression', classification:'Behavioural Classification' };
  el.innerHTML = `📈 <strong>Measure:</strong> ${mLabel}<br><strong>Mode:</strong> ${aggMap[trendMode]||trendMode}<br><strong>Window:</strong> ${pairStr}`;
}

function selRollingWin(el, type, win) {
  trendRollingWin[type] = win;
  const chips = el.parentElement.querySelectorAll('.rwin-chip');
  chips.forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  // Update formula labels
  const labels = { slope:'slope-win-label', vol:'vol-win-label', reg:'reg-win-label' };
  const lbl = document.getElementById(labels[type]);
  if (lbl) lbl.textContent = win;
  updateLiveJSON();
}

function toggleRegOut(el, key) {
  el.classList.toggle('sel');
  if (el.classList.contains('sel')) { if (!trendRegOutputs.includes(key)) trendRegOutputs.push(key); }
  else trendRegOutputs = trendRegOutputs.filter(x => x !== key);
  const outLbl = document.getElementById('reg-outs-label');
  if (outLbl) outLbl.textContent = trendRegOutputs.join(', ') || 'none';
  updateLiveJSON();
}

function ppDesc(pp) { return {log:"Apply log transform",cap:"Clip min/max values",bucket:"Bin into ranges"}[pp]||""; }

function toggleFChip(el, type, val) {
  el.classList.toggle('sel');
  const arr=state.filters[type]||[];
  if(el.classList.contains('sel')){ if(!arr.includes(val)) arr.push(val); }
  else { const i=arr.indexOf(val); if(i>-1) arr.splice(i,1); }
  state.filters[type]=arr;
}
function selSecured(val, el) {
  state.filters.secured=val;
  ['sec-all','sec-secured','sec-unsecured'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('sel');});
  el.classList.add('sel');
}

// toggleFilter — single-select: ek time pe sirf ek product/lender
function toggleFilter(el, type, val) {
  const container = el.parentElement;
  if (container) container.querySelectorAll('.fchip').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  state.filters[type] = [val];
  if (typeof updateLiveJSON === 'function') updateLiveJSON();
}

// selProduct — "All" chip handler
function selProduct(val, el) {
  if (val === 'all') {
    state.filters.product = [];
    document.querySelectorAll('#filter-product .fchip').forEach(c => c.classList.remove('sel'));
    el.classList.add('sel');
  } else {
    document.querySelectorAll('#filter-product .fchip').forEach(c => c.classList.remove('sel'));
    el.classList.add('sel');
    state.filters.product = [val];
  }
  if (typeof updateLiveJSON === 'function') updateLiveJSON();
}

// ══════════════════════════════════════════
// NAMING ENGINE — FULL MEASURE MAP
// ══════════════════════════════════════════
const MMAP = {
  // Enquiry
  count:'cnt', inquiry_amount:'amt', days_between:'gap',
  months_since_last:'rec_last', months_since_oldest:'rec_old',
  count_change:'cnt_chg', count_ratio:'cnt_rat', growth_rate:'grw', slope:'slp',
  secured_unsecured_ratio:'sec_rat', distinct_lenders:'lndrs', top_lender_share:'top_lndr',
  hhi_index:'hhi', count_threshold:'cnt_thr', amount_threshold:'amt_thr',
  amount_distribution:'amt_dist', gap_distribution:'gap_dist',
  // Trade: exposure / balance types
  sanctioned_amount:'sanc_amt', current_balance:'cur_bal', overdue_amount:'ovr_amt',
  credit_limit:'crd_lmt', emi_amount:'emi', high_credit:'hi_crd',
  writeoff_amount:'wo_amt', settlement_amount:'sttl_amt',
  // Trade: volume
  active_count:'act_cnt', closed_count:'clos_cnt', total_count:'tot_cnt',
  disbursed_count:'disb_cnt', writeoff_count:'wo_cnt', settled_count:'sttl_cnt', suitfiled_count:'suit_cnt',
  // Trade: delinquency
  dpd:'dpd', dpd_30:'dpd30', dpd_60:'dpd60', dpd_90:'dpd90', delinquent_flag:'delq_flag',
  // Trade: utilization
  utilization_ratio:'util', high_util_flag:'hi_util', avg_utilization:'avg_util', max_utilization:'max_util',
  // Trade: vintage
  account_age:'age', months_since_newest:'rec_new', months_since_first_delq:'rec_fst_delq',
  // Recency — Full Event Engine
  months_since_last_open:'rec_open', months_since_last_closed:'rec_clos',
  months_since_last_delinquency:'rec_delq', months_since_last_writeoff:'rec_wo',
  months_since_last_payment:'rec_pmt', months_since_last_settled:'rec_sttl',
  months_since_last_dpd:'rec_dpd', months_since_last_npa:'rec_npa',
  months_since_peak_exposure:'rec_pk_exp', months_since_last_suit:'rec_suit',
  recency_of_transition:'rec_trans',
  // Trend — Full Engine
  balance_growth:'bal_grw', utilization_change:'util_chg', dpd_trend:'dpd_trnd',
  overdue_trend:'ovr_trnd', emi_trend:'emi_trnd', account_count_trend:'acc_trnd',
  balance_acceleration:'bal_accel', dpd_acceleration:'dpd_accel',
  balance_trajectory:'bal_traj', emi_to_bal_trend:'emi_bal_trnd', active_count_slope:'act_slp',
  // Balance dynamics
  peak_balance:'pk_bal', trough_balance:'tr_bal', avg_monthly_balance:'avg_mo_bal',
  balance_volatility:'bal_vol', balance_range:'bal_rng', months_at_peak:'mo_pk',
  balance_cv:'bal_cv', overdue_peak:'ovr_pk', avg_overdue:'avg_ovr',
  sanction_to_bal_gap:'sanc_bal_gap', emi_coverage_ratio:'emi_cov',
  // Portfolio mix
  pl_share:'pl_shr', unsecured_share:'unsec_shr', secured_share:'sec_shr',
  cc_share:'cc_shr', closed_to_open_ratio:'cls_opn_rat', loan_type_hhi:'lt_hhi',
  // Risk ratio
  foir:'foir', lvr:'lvr', db_ratio:'db_rat', delinquent_ratio:'delq_rat',
  high_utilization_ratio:'hi_util_rat',
  // Writeoff / settlement
  settlement_count:'sttl_cnt',
  // Enterprise: Transition Matrix
  dpd_to_dpd0:'cure_dpd', dpd0_to_dpd30:'dflt_rate', dpd30_to_dpd90:'worsen',
  dpd90_to_dpd0:'npa_cure', active_to_closed:'clos_rate', active_to_npa:'npa_rate',
  npa_to_active:'npa_cure_act', upgrade_count:'upg_cnt', downgrade_count:'dwg_cnt',
  net_transition:'net_trans',
  // Enterprise: Vintage Cohort
  mob_bucket:'mob', vintage_dpd_rate:'vint_dpd', vintage_npa_rate:'vint_npa',
  cumulative_default:'cum_dflt', early_delinquency:'early_delq',
  vintage_cohort_size:'vint_sz', vintage_avg_balance:'vint_avg_bal',
  vintage_survival_rate:'vint_surv',
  // Enterprise: Stability Score
  psi_score:'psi', rank_correlation:'rank_corr', gini_stability:'gini_stab',
  feature_drift:'feat_drift', value_volatility:'val_vol', monotonicity_score:'mono_scr',
  // Account: Portfolio Count
  total_accounts:'tot_acc', active_accounts:'act_acc', closed_accounts:'clos_acc',
  npa_accounts:'npa_acc', written_off:'wo_acc', settled_accounts:'sttl_acc',
  suit_filed:'suit_acc', sma_accounts:'sma_acc', restructured:'rest_acc',
  delinquent_accounts:'delq_acc',
  // Account: Portfolio Exposure
  total_outstanding:'tot_out', total_sanctioned:'tot_sanc', total_overdue:'tot_ovr',
  total_credit_limit:'tot_crl', total_writeoff:'tot_wo', total_emi:'tot_emi',
  total_settlement:'tot_sttl', avg_balance:'avg_bal', max_balance:'max_bal',
  largest_exposure:'lrg_exp',
  // Account: Credit Age
  age_oldest:'age_old', age_newest:'age_new', credit_history_len:'crd_hist',
  months_since_opened:'ms_open', months_since_closed:'ms_clos', avg_account_age:'avg_age',
  // Account: Mix
  secured_unsecured_ratio:'sec_unsec_rat', secured_exposure_ratio:'sec_exp_rat',
  loan_type_hhi:'lt_hhi', num_distinct_lenders:'n_lndr', top_lender_share:'top_lndr_shr',
  num_distinct_types:'n_lt', pl_share:'pl_shr', cc_share:'cc_shr',
  unsecured_exposure_ratio:'unsec_exp_rat', closed_to_open_ratio:'cls_opn',
  // Account: Delinquency Profile
  current_dpd:'cur_dpd', max_dpd_ever:'max_dpd_ev', max_dpd_12m:'max_dpd_12',
  count_dpd30:'cnt_dpd30', count_dpd60:'cnt_dpd60', count_dpd90:'cnt_dpd90',
  ever_npa_flag:'ev_npa', ever_wo_flag:'ev_wo', ever_settled_flag:'ev_sttl',
  ever_suit_flag:'ev_suit', first_delq_month:'ms_fst_delq', last_delq_month:'ms_lst_delq',
  consec_delq_streak:'consec_delq',
  // Account: Utilization
  cc_utilization:'cc_util', revolving_util:'rev_util', avg_util_all_cards:'avg_util',
  max_util_single_card:'max_util', high_util_count:'hi_util_cnt',
  high_util_flag:'hi_util_flg', util_above_90:'maxd_util',
  // Account: Flags
  has_npa:'flg_npa', has_writeoff:'flg_wo', has_settled:'flg_sttl',
  has_suit_filed:'flg_suit', has_overdue:'flg_ovr', has_sma:'flg_sma',
  has_restructured:'flg_rest', has_any_stress:'flg_stress',
  has_dpd30:'flg_dpd30', has_dpd90:'flg_dpd90',
  // Account: Derived Ratios
  foir:'foir', active_account_ratio:'act_rat', delinquent_ratio:'delq_rat',
  npa_ratio:'npa_rat', unsecured_ratio:'unsec_rat', pl_exposure_share:'pl_exp_shr',
  top3_exposure_ratio:'top3_exp', overdue_to_outstanding:'ovr_out_rat',
  emi_to_sanction:'emi_sanc', writeoff_to_sanctioned:'wo_sanc',
  // Account: Behavioral
  ever_90dpd:'ev_dpd90', ever_120dpd:'ev_dpd120', months_since_last_delq:'ms_delq',
  dpd_spike_indicator:'dpd_spike', credit_seeking_accel:'crd_accel',
  payment_consistency:'pmt_cons', balance_paydown_rate:'bal_pdn', account_closure_rate:'clos_rt',
  // Account: Velocity
  new_accounts_opened:'n_open', accounts_closed:'n_clos', balance_growth:'bal_grw',
  overdue_acceleration:'ovr_accel', dpd_frequency_change:'dpd_freq_chg', lender_count_change:'lndr_chg',
  // Account: Recency (NEW)
  months_since_last_acc_open:'ms_acc_open', months_since_last_acc_close:'ms_acc_clos',
  months_since_last_acc_delq:'ms_acc_delq', months_since_last_acc_wo:'ms_acc_wo',
  months_since_last_acc_npa:'ms_acc_npa', months_since_last_acc_settled:'ms_acc_sttl',
  months_since_last_acc_overdue:'ms_acc_ovr', months_since_oldest_acc:'ms_oldest',
  months_since_newest_acc:'ms_newest',
  // Account: Trend (NEW)
  balance_change:'bal_chg', overdue_change:'ovr_chg', account_count_change:'acc_cnt_chg',
  lender_count_chg:'lndr_cnt_chg', dpd_change:'dpd_chg',
  utilization_change_acc:'util_chg_acc', emi_change:'emi_chg',
  // Account: Distribution (NEW)
  balance_distribution:'bal_dist', overdue_distribution:'ovr_dist',
  sanction_distribution:'sanc_dist', emi_distribution:'emi_dist', dpd_distribution:'dpd_dist',
  // Account: Concentration (NEW)
  top_lender_exposure:'top_lndr_exp', top_lender_count:'top_lndr_cnt', lender_hhi:'lndr_hhi',
  loan_type_hhi_conc:'lt_hhi_conc', single_lender_ratio:'sngl_lndr', top3_lender_share:'top3_lndr_shr',
  // Account: Vintage (NEW)
  avg_account_age_mth:'avg_acc_age', oldest_account_age:'oldest_age', newest_account_age:'newest_age',
  median_account_age:'med_acc_age', vintage_band_count:'vint_cnt', weighted_avg_age:'wt_avg_age',
  // Account: Utilization / Balance-Sanction (NEW)
  balance_utilization:'bal_util_rat', overdue_utilization:'ovr_util_rat',
  avg_util_all_accs:'avg_util_all', max_single_util:'max_sngl_util',
  util_above_80_count:'util80_cnt', util_above_90_flag:'util90_flg', emi_to_outstanding:'emi_out_rat',
  // Account: Utilization — extended
  credit_utilization:'crd_util', high_util_ratio:'hi_util_rat',
  // Fixed utilization measure keys
  acc_credit_utilization:'crd_util_pf', credit_utilization_ratio:'crd_util_rat',
  balance_to_limit_ratio:'bal_lim_rat', max_util_single_account:'max_util_acc',
  high_util_accounts_ratio:'hi_util_rat', util_above_80_count:'util80_cnt',
  util_above_90_count:'util90_cnt', balance_to_sanction_ratio:'bal_sanc_rat',
  overdue_to_outstanding:'ovr_out_rat', emi_to_outstanding:'emi_out_rat',
  // Fixed distribution measure keys
  balance_distribution:'bal_dist', credit_limit_distribution:'crl_dist',
  sanction_distribution:'exp_dist', overdue_distribution:'ovr_dist',
  emi_distribution:'emi_dist', dpd_distribution:'dpd_dist',
  // Fixed concentration measure keys
  top_lender_exposure_ratio:'top1_lndr_exp', top_3_lender_share:'top3_lndr_shr',
  lender_concentration_index:'lndr_hhi', top_lender_count_share:'top1_lndr_cnt',
  loan_type_concentration:'lt_hhi', single_lender_flag:'sngl_lndr_flg',
  // Fixed vintage/age measure keys
  avg_account_age:'avg_acc_age', oldest_account_age:'old_acc_age',
  newest_account_age:'new_acc_age', account_age_avg:'acc_age_avg',
  new_accounts_last_6m:'new_acc_6m', new_accounts_last_12m:'new_acc_12m',
  closed_accounts_last_12m:'clos_acc_12m', closed_accounts_last_6m:'clos_acc_6m',
  weighted_avg_age:'wt_avg_age',
  // Account: Product Mix (NEW)
  product_mix_score:'prd_mix_scr', unique_product_count:'uniq_prd_cnt', product_hhi:'prd_hhi',
  secured_product_share:'sec_prd_shr', revolving_product_share:'rev_prd_shr',
  installment_product_share:'inst_prd_shr', cc_to_total_ratio:'cc_tot_rat',
  hl_to_total_ratio:'hl_tot_rat', unsecured_product_count:'unsec_prd_cnt',
  // Account: Lifecycle (NEW)
  new_accounts_opened:'n_acc_open', accounts_closed_period:'n_acc_clos',
  net_account_change:'net_acc_chg', newly_opened_balance:'new_open_bal',
  newly_closed_balance:'new_clos_bal', new_to_total_ratio:'new_tot_rat',
  churned_account_ratio:'churn_rat', first_account_age:'fst_acc_age',
  avg_age_new_accounts:'avg_age_new',
  // Account: Delinquency Severity (NEW)
  dpd_90plus_accounts:'dpd90_cnt', dpd_60plus_accounts:'dpd60_cnt',
  dpd_30plus_accounts:'dpd30_cnt', dpd_severity_index:'dpd_sev_idx',
  max_dpd_across_accounts:'max_dpd_acc', avg_dpd_delinquent:'avg_dpd_delq',
  dpd_bucket_score:'dpd_bkt_scr', severe_delinquency_ratio:'sev_delq_rat',
  overdue_severity_amount:'ovr_sev_amt', npa_exposure_ratio:'npa_exp_rat',
  // Account: Cross Entity (NEW)
  accounts_with_inquiry_last_30d:'acc_inq_30d', accounts_with_inquiry_last_90d:'acc_inq_90d',
  inquiry_count_on_active_accs:'inq_act_cnt', inquiry_to_account_ratio:'inq_acc_rat',
  trade_to_account_balance_ratio:'trd_acc_bal', accounts_with_trade_dpd:'acc_trd_dpd',
  cross_entity_util_rate:'xent_util', inq_count_per_active_lender:'inq_lndr_cnt',
  trade_overdue_on_acc_portfolio:'trd_ovr_acc',
  // Account: Utilization Engine (NEW)
  credit_utilization_ratio:'crd_util_rat', balance_to_sanction_ratio:'bal_sanc_rat',
  overdue_to_balance_ratio:'ovr_bal_rat', emi_to_limit_ratio:'emi_lim_rat',
  avg_utilization:'avg_util', max_utilization_account:'max_util_acc',
  high_util_accounts:'hi_util_acc', high_util_accounts_ratio:'hi_util_acc_rat',
  util_above_80:'util80_cnt', util_above_90:'util90_cnt',
  avg_utilization_12m:'avg_util_12m', max_utilization_12m:'max_util_12m',
  utilization_trend:'util_trnd', utilization_volatility:'util_vol',
  weighted_util:'wt_util',
  // Account: Payment Behavior (NEW)
  on_time_payment_ratio:'ot_pmt_rat', missed_payment_count:'miss_pmt_cnt',
  dpd_transition_rate:'dpd_trans_rt', rolling_dpd_trend:'roll_dpd_trnd',
  consecutive_clean_months:'consec_clean', consecutive_dpd_months:'consec_dpd',
  payment_consistency_score:'pmt_cons_scr', ever_missed_12m:'ev_miss_12m',
  avg_dpd_when_delinquent:'avg_dpd_delq', improvement_indicator:'pmt_imprv',
  delinquency_frequency:'delq_freq',
  // Account: Credit Mix (NEW)
  credit_mix_score:'crd_mix_scr', secured_to_unsecured_ratio:'sec_unsec_rat',
  secured_exposure_ratio:'sec_exp_rat2', loan_type_diversity:'lt_div_idx',
  revolving_to_installment:'rev_inst_rat', has_both_types:'flg_both_typ',
  unsecured_exposure_share:'unsec_exp_shr', dominant_product_share:'dom_prd_shr',
  cc_exposure_share:'cc_exp_shr', hl_exposure_share:'hl_exp_shr',
  pl_unsecured_dominance:'pl_unsec_dom',
  // v14 — streak_features measure tokens
  hist_max_consec_clean:'mxclean', hist_max_consec_dpd30:'mxdpd30', hist_max_consec_dpd60:'mxdpd60',
  hist_max_consec_dpd90:'mxdpd90', hist_cur_clean_streak:'curclean', hist_cur_delq_streak:'curdelq',
  hist_delq_streak_count:'dstrkcnt', hist_avg_delq_streak_len:'avgstrk', hist_streak_ratio:'strkrat',
  // v14 — behaviour_trend measure tokens
  hist_dpd_trend_3v12:'dpdtrnd3_12', hist_dpd_trend_6v24:'dpdtrnd6_24', hist_dpd_trend_12v36:'dpdtrnd12_36',
  hist_overdue_trend_3v12:'ovrtrnd3_12', hist_overdue_trend_6v24:'ovrtrnd6_24',
  hist_balance_trend_3v12:'baltrnd3_12', hist_util_trend_3v12:'utiltrnd3_12',
  hist_missed_trend_3v12:'misstrnd3_12', hist_beh_direction:'behdir',
  // v14 — cure_behaviour measure tokens
  hist_months_to_cure_dpd30:'cure30', hist_months_to_cure_dpd60:'cure60', hist_months_to_cure_dpd90:'cure90',
  hist_min_months_to_cure:'min_cure', hist_max_months_to_cure:'max_cure',
  hist_cure_success_rate:'cure_rate', hist_relapse_after_cure:'relapse', hist_cure_episode_count:'cure_cnt',
  hist_persistent_delq_flag:'persist_flg', hist_cure_speed_index:'cure_spd',
  // v14 — roll_rate measure tokens
  hist_roll_clean_to_dpd30:'roll0_30', hist_roll_clean_to_late:'roll0_late',
  hist_roll_dpd30_to_dpd60:'roll30_60', hist_roll_dpd60_to_dpd90:'roll60_90',
  hist_roll_dpd30_to_clean:'cure30_0', hist_roll_dpd60_to_clean:'cure60_0', hist_roll_dpd90_to_clean:'cure90_0',
  hist_net_roll_score:'net_roll', hist_forward_roll_count:'fwd_roll', hist_backward_roll_count:'bwd_roll',
  hist_stay_rate_clean:'stay_0', hist_composite_roll_idx:'roll_idx',
  // v14 — payment_stability measure tokens
  hist_payment_irr_idx:'pay_irr', hist_dpd_cv:'dpd_cv', hist_dpd_std_window:'dpd_std',
  hist_overdue_irr_idx:'ovr_irr', hist_balance_irr_idx:'bal_irr', hist_util_irr_idx:'util_irr',
  hist_payment_swing:'pay_swng', hist_mom_dpd_std:'mom_dpd_std',
  hist_payment_pattern_entr:'pay_entr', hist_composite_stab_score:'stab_scr',
};

function generateName() {
  if (state.aggregationType==='ratio') return generateRatioName();
  if (state.featNameOverride.trim()) return state.featNameOverride.trim();
  const isTrade=state.domain==='trade'||state.domain==='trade_history';
  const isAccount=state.domain==='account';

  // ── NAMED OUTPUT: for sub-cats with named_output:true, use out_name or build from out_stem+agg_out_suffix ──
  if (isAccount && state.subCat && state.measure) {
    const sc = ACT_SCHEMA[state.subCat];
    if (sc && sc.named_output) {
      const mv = sc.measures[state.measure];
      if (mv) {
        // Direct out_name → use as-is (no suffix)
        if (mv.out_name) return mv.out_name;
        // out_stem + agg suffix (distribution pattern: balance_stddev, credit_limit_p90)
        if (mv.out_stem && sc.agg_out_suffix && state.aggregation) {
          let aggSfx = sc.agg_out_suffix[state.aggregation] || state.aggregation;
          // replace {PCT} placeholder for percentile
          const pct = document.getElementById('pct-input') ? document.getElementById('pct-input').value : '90';
          aggSfx = aggSfx.replace('{PCT}', pct || '90');
          // Add loan type suffix if filtered
          const lt = state.accScope && state.accScope.loanType;
          const ltSfx = lt && lt.length===1 ? '_'+lt[0].toLowerCase() : '';
          return mv.out_stem + '_' + aggSfx + ltSfx;
        }
      }
    }
  }

  const prefix=isTrade?'trd':isAccount?'acc':'inq';
  const parts=[prefix];
  if (isTrade) {
    const lt=state.tradeScope.loanType;
    if (lt.length===1) parts.push(lt[0].toLowerCase());
    else if (lt.length>1) parts.push(lt.map(x=>x.toLowerCase()).join(''));
    const sec=state.tradeScope.secured;
    if (sec&&sec!=='all') parts.push(sec==='secured'?'sec':'unsec');
    const sts=state.tradeScope.status;
    if (sts&&sts!=='all') parts.push({active:'act',closed:'clos',written_off:'wo',settled:'sttl',suit_filed:'suit'}[sts]||sts);
  } else if (isAccount) {
    const lt=state.accScope.loanType;
    if (lt.length===1) parts.push(lt[0].toLowerCase());
    else if (lt.length>1) parts.push(lt.map(x=>x.toLowerCase()).join(''));
    const sec=state.accScope.secured;
    if (sec&&sec!=='all') parts.push(sec==='secured'?'sec':sec==='unsecured'?'unsec':sec==='revolving'?'rev':'inst');
    const sts=state.accScope.status;
    if (sts&&sts.length===1) parts.push({Active:'act',Closed:'clos','Written-Off':'wo',Settled:'sttl','Suit-Filed':'suit',NPA:'npa',SMA:'sma',Restructured:'rest'}[sts[0]]||sts[0].toLowerCase());
    else if (sts&&sts.length>1) parts.push('multi_sts');
    const ctx=state.accScope.timeCtx;
    if (ctx&&ctx!=='snapshot') parts.push({opened_in:'open',active_in:'actv',closed_in:'clos',dpd_in:'dpd',ever:'ever'}[ctx]||ctx);
    if (ctx&&ctx!=='snapshot'&&ctx!=='ever') parts.push(`${state.accScope.period}m`);
  } else {
    const prods=state.filters.product;
    if (prods.length===1) parts.push(prods[0].toLowerCase());
    else if (prods.length>1) parts.push(prods.map(p=>p.toLowerCase()).join('_'));
    const sec=state.filters.secured;
    if (sec&&sec!=='all') parts.push(sec==='secured'?'sec':'unsec');
    const subtypeTok = getIntermediateSubtypeToken();
    if (subtypeTok) parts.push(subtypeTok);
  }
  if (state.measure) parts.push(MMAP[state.measure]||state.measure);
  if (state.aggregation&&state.aggregation!=='value') {
    const aggMap={ratio_to_total:'perc_total',count_distinct:'cnt_dst',growth_rate:'grw_rt',difference:'diff',slope:'slp',flag:'flg'};
    parts.push(aggMap[state.aggregation]||state.aggregation);
  }
  if (state.velPair) parts.push(`${state.velPair[0]}_${state.velPair[1]}`);
  else if (state.timeWindows.length>0) {
    state.timeWindows.forEach(w=>{
      const v=w==='custom'&&state.customWindow?state.customWindow+'m':w;
      parts.push(`last_${v}`);
    });
  }
  const dpd=document.getElementById('dpd-val')?document.getElementById('dpd-val').value:'';
  if (dpd&&isTrade) parts.push(`dpd${dpd}`);
  return parts.join('_');
}

function generateRatioName() {
  if (state.featNameOverride.trim()) return state.featNameOverride.trim();
  const isTrade=state.domain==='trade'||state.domain==='trade_history';
  const prefix=isTrade?'trd_var':'inq_var';
  const parts=[prefix];
  const prods=isTrade?state.tradeScope.loanType:state.filters.product;
  if (prods&&prods.length===1) parts.push(prods[0].toLowerCase());

  if (ratioState.type==='w2w') {
    const m=MMAP[ratioState.w2w.metric]||ratioState.w2w.metric||'metric';
    parts.push(`${m}_w2w_${ratioState.w2w.numerator}_vs_${ratioState.w2w.denominator}`);
  } else if (ratioState.type==='cross') {
    const numV=document.getElementById('cm-numerator-metric')?.value||'num';
    const denV=document.getElementById('cm-denominator-metric')?.value||'den';
    parts.push(`xm_${numV.toLowerCase().replace(/_/g,'')}_by_${denV.toLowerCase().replace(/_/g,'')}_${ratioState.cross.window}`);
  } else if (ratioState.type==='norm') {
    const m=ratioState.norm.metric.replace(/_/g,'');
    const b=ratioState.norm.by.replace(/per_/,'').replace(/_/g,'');
    parts.push(`norm_${m}_per_${b}_${ratioState.norm.window}`);
  } else if (ratioState.type==='p2p') {
    const mLabel={balance:'bal',count:'cnt',sanction:'sanc',emi:'emi'}[ratioState.p2p.metric]||ratioState.p2p.metric;
    parts.push(`p2p_${(ratioState.p2p.num||'na').toLowerCase()}_vs_${(ratioState.p2p.den||'all').toLowerCase()}_${mLabel}_${ratioState.p2p.window}`);
  } else {
    // Simple ratio
    parts.push(state.subCat);
    parts.push(state.ratioMethod);
    const condName=(params)=>{
      const cp=[];
      if (params.status&&params.status!=='all') cp.push({active:'act',closed:'clos',written_off:'wo',settled:'sttl',suit_filed:'suit'}[params.status]||params.status);
      if (params.dpdCond&&params.dpdCond.val) cp.push(`dpd${params.dpdCond.op}${params.dpdCond.val}`.replace(/>=/g,'gte').replace(/<=/g,'lte').replace(/>/g,'gt').replace(/</g,'lt'));
      return cp.length?cp.join('_'):'all';
    };
    parts.push(condName(state.ratioParams.numerator));
    parts.push('by');
    parts.push(condName(state.ratioParams.denominator)||'total');
    if (state.timeWindows.length>0) parts.push(`last_${state.timeWindows[0]}`);
  }
  return parts.join('_');
}

// ══════════════════════════════════════════
// SCHEMA BUILDER — FULL
// ══════════════════════════════════════════
function buildSchema() {
  const buildRatioFilter=(params)=>{
    const filters={};
    const isTrade=state.domain==='trade'||state.domain==='trade_history';
    if (isTrade) {
      if (params.status&&params.status!=='all') filters.account_status=params.status;
      if (params.dpdCond&&params.dpdCond.val) filters.dpd_condition={operator:params.dpdCond.op,value:Number(params.dpdCond.val)};
      if (params.overdueCond&&params.overdueCond.val) filters.overdue_amount_condition={operator:params.overdueCond.op,value:Number(params.overdueCond.val)};
      if (params.utilCond&&params.utilCond.val) filters.utilization_condition={operator:params.utilCond.op,value:Number(params.utilCond.val)};
      if (params.tradeFlags&&params.tradeFlags.length) params.tradeFlags.forEach(f=>{filters[f+'_flag']=true;});
    } else {
      if (params.amtCond&&params.amtCond.val) filters.amount_condition={operator:params.amtCond.op,value:Number(params.amtCond.val)};
    }
    return Object.keys(filters).length?filters:undefined;
  };

  const isTrade=state.domain==='trade'||state.domain==='trade_history';
  const isAccount=state.domain==='account';
  const sc=currentSchema()[state.subCat];
  const _domainTypeMap = {
    'enquiry':'Enquiry', 'trade':'Trade',
    'trade_history':'Trade History', 'account':'Account'
  };
  const schema={
    bureau:state.bureau,
    file_type:state.fileType,
    entity:isTrade?"tradeline":isAccount?"account":"inquiry",
    domain:state.domain,
    variable_type:_domainTypeMap[state.domain]||'Other',
    feature_name:generateName(),
    sub_category:state.subCat||undefined,
    measure:state.measure||undefined,
    aggregation:state.aggregation||undefined,
  };

  // ── ACCOUNT SCHEMA ──
  if (isAccount) {
    const accSc = ACT_SCHEMA[state.subCat] || {};
    const mv = accSc.measures && accSc.measures[state.measure];
    // Bureau canonical mapping
    const canonMap = BUREAU_CANON_MAP[state.bureau] || {};
    const canonField = mv ? mv.canonical : null;
    schema.canonical_field = canonField || undefined;
    schema.bureau_column = canonField ? (canonMap[canonField] || mv?.col) : undefined;
    // Inject formula if measure has one
    if (mv && mv.formula) schema.formula = mv.formula;
    // For distribution: show agg-specific computation
    if (accSc.named_output && accSc.agg_out_suffix && state.aggregation) {
      const pct = document.getElementById('pct-input') ? document.getElementById('pct-input').value : '90';
      const aggLabel = accSc.agg_out_suffix[state.aggregation] || state.aggregation;
      schema.computation = `${aggLabel.replace('{PCT}', pct || '90').toUpperCase()}(${mv?.col || state.measure}) across all matching accounts`;
    }
    // Scope filters
    const acc = state.accScope;
    schema.filters = {};
    if (acc.loanType && acc.loanType.length) schema.filters.loan_type = acc.loanType;
    if (acc.secured && acc.secured !== 'all') schema.filters.secured = acc.secured;
    if (acc.status && acc.status.length) schema.filters.account_status = acc.status;
    if (acc.ownership && acc.ownership !== 'all') schema.filters.ownership = acc.ownership;
    if (!Object.keys(schema.filters).length) delete schema.filters;
    // Time context
    if (acc.timeCtx && acc.timeCtx !== 'snapshot') {
      const timeTypeMap = { opened_in:'opened_in_period', active_in:'active_during_period', closed_in:'closed_in_period', dpd_in:'had_dpd_event_in_period', ever:'all_time' };
      schema.time_context = { type: timeTypeMap[acc.timeCtx] || acc.timeCtx };
      if (acc.timeCtx !== 'ever') schema.time_context.months = Number(acc.period);
    }
    // Threshold condition
    const thField = document.getElementById('acc-thresh-field')?.value;
    const thOp = document.getElementById('acc-thresh-op')?.value;
    const thVal = document.getElementById('acc-thresh-val')?.value;
    if (thField && thVal) {
      schema.threshold = { field: thField, operator: thOp, value: Number(thVal) };
    }
    // DSL formula
    const segStr = acc.loanType.length ? `loan_type IN [${acc.loanType.join(',')}]` : 'ALL';
    const stsStr = acc.status.length ? `status IN [${acc.status.join(',')}]` : 'ALL_STATUS';
    const timeStr = acc.timeCtx === 'snapshot' ? 'CURRENT_SNAPSHOT' : acc.timeCtx === 'ever' ? 'EVER' : `${acc.timeCtx.toUpperCase().replace('_',' ')} T-${acc.period}M`;
    const thrStr = thField && thVal ? ` AND ${thField} ${thOp} ${thVal}` : '';
    schema.dsl_formula = `${(state.aggregation||'COUNT').toUpperCase()}(account WHERE segment=${segStr} AND ${stsStr}${thrStr} DURING ${timeStr})`;
    return schema;
  }

  // Recency: add date_column from map + special formula — REMOVED (handled below by full recency block)

  // ── RECENCY SCHEMA ──
  if (state.subCat==='recency'&&isTrade) {
    const sc=currentSchema().recency;
    const mv=sc&&sc.measures[state.measure];
    schema.date_column = sc.date_column_map[state.measure]||'DateReported';
    // Event filter
    if (mv && mv.event_filter) {
      const ef = { ...mv.event_filter };
      if (ef.field === 'DPD') {
        ef.val = recencyDPDThreshold === 'custom'
          ? Number(document.getElementById('rec-dpd-val')?.value||30)
          : recencyDPDThreshold;
        ef.op = recencyDPDThreshold === 'custom'
          ? (document.getElementById('rec-dpd-op')?.value||'>=') : '>=';
      }
      if (ef.field === 'writeoff_amt_tot') {
        ef.val = recencyWOAmount === 'custom'
          ? Number(document.getElementById('rec-wo-val')?.value||0)
          : recencyWOAmount;
        ef.op = document.getElementById('rec-wo-op')?.value||'>';
      }
      schema.event_filter = ef;
    }
    // Special formula
    const fml = sc.recency_formulas && sc.recency_formulas[state.measure];
    schema.formula = fml || `FLOOR((CurrentDate − MAX(${schema.date_column})) / 30)`;
    if (recencyAccelWindow) {
      schema.recency_acceleration = {
        compare_at_period: recencyAccelWindow,
        formula: `recency_delta = months_since_event(now) − months_since_event(${recencyAccelWindow}_prior)`
      };
    }
    delete schema.time_window;
  }

  // ── TREND SCHEMA ──
  if (state.subCat==='trend'&&isTrade) {
    schema.trend_mode = trendMode;
    if (trendMode==='window_diff' && state.velPair) {
      schema.comparison_windows={ recent_window:state.velPair[0], prior_window:state.velPair[1] };
    }
    if (trendMode==='rolling_slope') {
      schema.rolling_window = trendRollingWin.slope;
      schema.formula = `OLS_slope(Metric, window=${trendRollingWin.slope}) → β in units/month`;
    }
    if (trendMode==='volatility') {
      schema.rolling_window = trendRollingWin.vol;
      schema.formula = `STD(Δ(t)) where Δ(t)=Metric(t)−Metric(t−1), window=${trendRollingWin.vol}`;
    }
    if (trendMode==='regression') {
      schema.rolling_window = trendRollingWin.reg;
      schema.regression_outputs = [...trendRegOutputs];
      schema.formula = `OLS: Metric(t)=β·t+α, window=${trendRollingWin.reg}, outputs=[${trendRegOutputs.join(',')}]`;
    }
    if (trendMode==='acceleration') {
      const w1=document.getElementById('accel-w1')?.value||'3m';
      const w2=document.getElementById('accel-w2')?.value||'6m';
      const w3=document.getElementById('accel-w3')?.value||'12m';
      schema.window_triple={short:w1,mid:w2,long:w3};
      schema.formula=`Accel=(Metric[${w1}]−Metric[${w2}])−(Metric[${w2}]−Metric[${w3}])`;
      delete schema.comparison_windows;
    }
    if (trendMode==='classification') {
      const sb=document.getElementById('class-stable-band')?.value||5;
      const vt=document.getElementById('class-volatile-thresh')?.value||20;
      schema.classification_thresholds={stable_band_pct:Number(sb),volatile_cv_pct:Number(vt)};
      if (state.velPair) schema.comparison_windows={recent_window:state.velPair[0],prior_window:state.velPair[1]};
    }
  }

  // ── BALANCE DYNAMICS SCHEMA ──
  if (state.subCat==='balance_dynamics'&&isTrade) {
    schema.balance_mode = balanceMode;
    if (balanceMode==='monthly_series') {
      schema.monthly_aggregation = balMonthlyAgg;
      schema.formula = `${balMonthlyAgg}(all monthly balance snapshots in window)`;
    }
    if (balanceMode==='time_weighted') {
      schema.decay_type = balDecayType;
      if (balDecayType==='exponential') schema.decay_lambda = Number(document.getElementById('decay-lambda')?.value||0.5);
      schema.formula = balDecayType==='linear' ? 'Σ(t/T · Balance(t)) / Σ(t/T)' : balDecayType==='exponential' ? 'Σ(exp(λ·t) · Balance(t)) / Σ(exp(λ·t))' : 'AVG(Balance)';
    }
    if (balanceMode==='rolling_vol') {
      schema.volatility_normalisation = balVolNorm;
      schema.formula = balVolNorm==='absolute' ? 'STD(Balance(t)−Balance(t−1))' : balVolNorm==='relative_mean' ? 'STD(Δ)/MEAN(Balance)' : 'STD(Δ)/Sanction_Amount';
    }
    if (balanceMode==='peak_detect') {
      schema.peak_output = balPeakOut;
    }
    if (balanceMode==='trajectory') {
      schema.trajectory_thresholds = {
        stable_band_pct: Number(document.getElementById('traj-stable-band')?.value||5),
        volatile_cv_pct: Number(document.getElementById('traj-volatile-thresh')?.value||20),
        rising_delta_pct: Number(document.getElementById('traj-rising-thresh')?.value||0),
      };
    }
  }

  // ── TRANSITION MATRIX SCHEMA ──
  if (state.subCat==='transition_matrix'&&isTrade) {
    const sc = TRD_SCHEMA.transition_matrix;
    const mv = sc && sc.measures[state.measure];
    schema.output_type = 'transition_matrix';
    // Use UI state if explicitly set, else fall back to measure's built-in transition definition
    schema.transition = (mv && mv.transition) || { from: transitionFrom, to: transitionTo };
    schema.transition_window = state.timeWindows.length > 0 ? state.timeWindows[0] : '12m';
    schema.formula = `COUNT(accounts where state transitioned from [${schema.transition.from}] → [${schema.transition.to}] within ${schema.transition_window})`;
    if (state.aggregation === 'ratio') {
      schema.formula_ratio = `COUNT(transitioned) / COUNT(accounts in [${schema.transition.from}] at window start)`;
    }
    schema.method = 'consecutive_month_comparison';
  }

  // ── VINTAGE COHORT SCHEMA ──
  if (state.subCat==='vintage_cohort'&&isTrade) {
    const sc = TRD_SCHEMA.vintage_cohort;
    const mv = sc && sc.measures[state.measure];
    schema.output_type = 'cohort_table';
    schema.cohort_definition = {
      group_by: vintageCohortBy,
      mob_band: vintageMOBBand,
      mob_band_range: (() => {
        const bandMap = { MOB_0_3:[0,3], MOB_4_6:[4,6], MOB_7_12:[7,12], MOB_13_24:[13,24], MOB_25_36:[25,36], all:[0,999] };
        const r = bandMap[vintageMOBBand] || [0,12];
        return { min_mob: r[0], max_mob: r[1] };
      })(),
    };
    schema.metric = state.measure || 'vintage_dpd_rate';
    schema.formula = `For each ${vintageCohortBy} cohort: compute ${state.measure} for accounts at ${vintageMOBBand}`;
    schema.requires_panel_data = true;
  }

  // ── STABILITY SCORE SCHEMA ──
  if (state.subCat==='stability_score'&&isTrade) {
    const refPeriod = document.getElementById('stability-ref-period')?.value || '12m';
    const binCount = Number(document.getElementById('stability-bins')?.value || 10);
    schema.output_type = 'stability_report';
    schema.stability_metric = state.measure || 'psi_score';
    schema.reference_period = refPeriod;
    schema.psi_bins = binCount;
    schema.interpretation = {
      stable: 'PSI < 0.10',
      moderate: '0.10 ≤ PSI < 0.25',
      unstable: 'PSI ≥ 0.25 (trigger review)',
    };
    if (state.measure === 'psi_score') {
      schema.formula = `PSI = Σ((Actual% - Expected%) × ln(Actual% / Expected%)) across ${binCount} bins`;
      schema.baseline_window = refPeriod;
      schema.current_window = '1m';
    }
    if (state.measure === 'rank_correlation') {
      schema.formula = `Spearman ρ between rank-ordered feature values at baseline vs current period`;
    }
    if (state.measure === 'gini_stability') {
      schema.formula = `|Gini(current) − Gini(baseline)| / Gini(baseline)`;
    }
  }

  // ── UTILIZATION ENGINE SCHEMA ──
  if (state.subCat === 'utilization_engine' && state.domain === 'account') {
    schema.utilization_definition = {
      numerator: utilEngineState.numerator,
      denominator: utilEngineState.denominator,
      formula: `${utilEngineState.numeratorLabel} / ${utilEngineState.denominatorLabel}`,
      thresholds: [...utilEngineState.activeThresholds].sort(),
    };
    schema.formula = `${utilEngineState.numerator} / ${utilEngineState.denominator} → then ${state.aggregation || 'avg'} across accounts`;
  }

  // ── PAYMENT BEHAVIOR SCHEMA ──
  if (state.subCat === 'payment_behavior' && state.domain === 'account') {
    schema.payment_behavior_params = {
      missed_payment_threshold: { op: '>', val: pbEngineState.dpdThresh },
      slope_window: pbEngineState.slopeWin,
      on_time_definition: `DPD = 0`,
    };
    if (state.measure === 'rolling_dpd_trend') {
      schema.formula = `OLS_slope(DPD(t), window=${pbEngineState.slopeWin}) — positive=worsening`;
    }
    if (state.measure === 'dpd_transition_rate') {
      schema.formula = `P(DPD(t)=0 AND DPD(t+1)>${pbEngineState.dpdThresh}) / COUNT(clean months)`;
    }
  }

  // ── CREDIT MIX SCHEMA ──
  if (state.subCat === 'credit_mix' && state.domain === 'account') {
    schema.credit_mix_definition = {
      components: [...cmEngineState.components],
      output_type: cmEngineState.output,
      diversity_method: 'weighted_component_score',
    };
    if (state.measure === 'loan_type_diversity') {
      schema.formula = `-Σ(p_i × log(p_i)) where p_i = share of loan type i (Shannon entropy)`;
    }
    if (state.measure === 'credit_mix_score') {
      schema.formula = `Composite: ${[...cmEngineState.components].join(' + ') || 'defined components'} → normalized 0–100`;
    }
  }

  // ── CROSS ENTITY SCHEMA (Account domain) ──
  if (state.subCat === 'cross_entity' && state.domain === 'account') {
    schema.cross_entity_join = {
      join_entity: crossEntityState.joinEntity,
      join_key: crossEntityState.joinKey,
      join_window: crossEntityState.joinWindow,
      inquiry_filter: crossEntityState.inqFilter || 'all',
      account_filter: crossEntityState.accFilter || 'all',
      join_type: 'left',
    };
    schema.formula = `JOIN Account ON ${crossEntityState.joinKey} ← ${crossEntityState.joinEntity} WITHIN ${crossEntityState.joinWindow}`;
    schema.requires_tables = crossEntityState.joinEntity === 'both'
      ? ['account_snapshot', 'inquiry_history', 'tradeline_history']
      : crossEntityState.joinEntity === 'inquiry'
      ? ['account_snapshot', 'inquiry_history']
      : ['account_snapshot', 'tradeline_history'];
  }

  if (state.aggregationType==='ratio') {
    schema.aggregation='ratio';
    if (ratioState.type==='simple') {
      schema.ratio_definition={
        type:'simple', method:state.ratioMethod,
        numerator_conditions:buildRatioFilter(state.ratioParams.numerator),
        denominator_conditions:buildRatioFilter(state.ratioParams.denominator)
      };
    } else if (ratioState.type==='w2w') {
      schema.ratio_definition={
        type:'window_to_window',
        metric:ratioState.w2w.metric,
        numerator_window:ratioState.w2w.numerator,
        denominator_window:ratioState.w2w.denominator,
        formula:`${ratioState.w2w.metric}[${ratioState.w2w.numerator}] / ${ratioState.w2w.metric}[${ratioState.w2w.denominator}]`
      };
    } else if (ratioState.type==='cross') {
      const numV=document.getElementById('cm-numerator-metric')?.value;
      const denV=document.getElementById('cm-denominator-metric')?.value;
      schema.ratio_definition={
        type:'cross_metric',
        numerator_metric:numV, denominator_metric:denV,
        window:ratioState.cross.window,
        formula:`SUM(${numV}) / SUM(${denV}) over last ${ratioState.cross.window}`
      };
    } else if (ratioState.type==='norm') {
      schema.ratio_definition={
        type:'normalized',
        metric:ratioState.norm.metric,
        normalize_by:ratioState.norm.by,
        window:ratioState.norm.window,
        formula:`${ratioState.norm.metric} / ${ratioState.norm.by} over last ${ratioState.norm.window}`
      };
    } else if (ratioState.type==='p2p') {
      const mLabel={balance:'Outstanding_Balance',count:'Count',sanction:'Sanction_Amount',emi:'EMI_Amount'}[ratioState.p2p.metric]||ratioState.p2p.metric;
      schema.ratio_definition={
        type:'product_to_product',
        numerator_product:ratioState.p2p.num,
        denominator_product:ratioState.p2p.den,
        metric:mLabel,
        window:ratioState.p2p.window,
        formula:`${mLabel}[${ratioState.p2p.num}] / ${mLabel}[${ratioState.p2p.den}] over last ${ratioState.p2p.window}`
      };
    }
  }

  if (isTrade) {
    const scope={};
    if (state.tradeScope.loanType.length) scope.loan_type=state.tradeScope.loanType;
    if (state.tradeScope.secured!=='all') scope.secured_flag=state.tradeScope.secured;
    if (state.tradeScope.status!=='all') scope.account_status=state.tradeScope.status;
    if (state.tradeScope.ownership!=='all') scope.ownership_type=state.tradeScope.ownership;
    if (Object.keys(scope).length) schema.portfolio_scope=scope;

    if (state.aggregationType!=='ratio'&&state.subCat!=='recency') {
      const dpd=document.getElementById('dpd-val')?.value||'';
      const ovr=document.getElementById('overdue-val')?.value||'';
      const util=document.getElementById('util-val')?.value||'';
      const tfilters={};
      if (dpd) tfilters.dpd_condition={operator:document.getElementById('dpd-op')?.value||'>=',value:Number(dpd)};
      if (ovr) tfilters.overdue_amount_condition={operator:document.getElementById('overdue-op')?.value||'>',value:Number(ovr)};
      if (util) tfilters.utilization_condition={operator:document.getElementById('util-op')?.value||'>=',value:Number(util)};
      if (state.filters.tradeFlags&&state.filters.tradeFlags.length) state.filters.tradeFlags.forEach(f=>{tfilters[f+'_flag']=true;});
      if (Object.keys(tfilters).length) schema.filters=tfilters;
    }

    // ✅ Resolve time windows (including custom)
    if (state.subCat!=='recency'&&state.subCat!=='trend') {
      const resolveW=(w)=>w==='custom'&&state.customWindow?parseInt(state.customWindow):parseInt(w);
      if (state.timeWindows.length===1) schema.time_window={type:"rolling",value:resolveW(state.timeWindows[0]),unit:"month",based_on:state.timeBased};
      else if (state.timeWindows.length>1) schema.time_windows=state.timeWindows.map(w=>({value:resolveW(w),unit:"month",based_on:state.timeBased}));
    }

  } else {
    if (state.aggregationType!=='ratio') {
      const selectedIntermediateProduct = getSelectedIntermediateProductForBuild();
      const selectedIntermediateSubtype = getSelectedIntermediateSubtypeForBuild();
      const hasFilt=state.filters.product.length||state.filters.secured!=='all'||state.filters.lender.length||!!selectedIntermediateProduct||!!selectedIntermediateSubtype;
      const amtVal=document.getElementById('amt-val')?.value||'';
      if (hasFilt||amtVal) {
        schema.filters={};
        if (selectedIntermediateProduct) schema.filters.product=[selectedIntermediateProduct];
        else if (state.filters.product.length) schema.filters.product=state.filters.product;
        if (state.filters.secured!=='all') schema.filters.secured=state.filters.secured;
        if (state.filters.lender.length) schema.filters.lender=state.filters.lender;
        if (selectedIntermediateSubtype) {
          schema.filters.inquiry_purpose=[selectedIntermediateSubtype];
          schema.filters.product_subtype=[selectedIntermediateSubtype];
        }
        if (amtVal) schema.filters.amount_condition={operator:document.getElementById('amt-op')?.value||'>=',value:Number(amtVal)};
      }
    }
    if (state.velPair) schema.time_windows=state.velPair.map(w=>({value:parseInt(w),unit:"month"}));
    else if (state.timeWindows.length>1) schema.time_windows=state.timeWindows.map(w=>({value:parseInt(w),unit:"month"}));
    else if (state.timeWindows.length===1) {
      const v=state.timeWindows[0]==='custom'&&state.customWindow?parseInt(state.customWindow):parseInt(state.timeWindows[0]);
      schema.time_window={type:"rolling",value:v,unit:"month"};
    }
    const threshVal=document.getElementById('thresh-val')?.value||'';
    if (threshVal) schema.threshold={operator:document.getElementById('thresh-op')?.value||'>=',value:Number(threshVal)};
    const selectedIntermediateProduct = getSelectedIntermediateProductForBuild();
    const selectedIntermediateSubtype = getSelectedIntermediateSubtypeForBuild();
    if (selectedIntermediateProduct || selectedIntermediateSubtype) {
      schema.intermediate_variable = {};
      if (selectedIntermediateProduct) schema.intermediate_variable.product = selectedIntermediateProduct;
      if (selectedIntermediateSubtype) schema.intermediate_variable.sub_category = selectedIntermediateSubtype;
    }
  }

  const sc2=currentSchema()[state.subCat];
  const pctParams=sc2&&sc2.agg_params&&sc2.agg_params[state.aggregation]||{};
  if (state.aggregation==='percentile') {
    if (pctParams.needs_pct_multi && selectedPercentiles.length>0) {
      schema.percentile_values = selectedPercentiles;
      schema.generates_multiple_features = true;
    } else {
      schema.percentile_value=Number(document.getElementById('pct-val')?.value||90);
    }
  }
  if (state.postProcessing.length) {
    const capMin=document.getElementById('cap-min')?.value||'';
    const capMax=document.getElementById('cap-max')?.value||'';
    const bins=document.getElementById('bucket-bins')?.value||'';
    schema.post_processing=state.postProcessing.map(pp=>{
      const o={type:pp};
      if (pp==='cap'&&(capMin||capMax)) { if(capMin) o.min=Number(capMin); if(capMax) o.max=Number(capMax); }
      if (pp==='bucket'&&bins) o.bins=bins.split(',').map(x=>Number(x.trim())).filter(x=>!isNaN(x));
      return o;
    });
  }
  return schema;
}

// ══════════════════════════════════════════
// FINAL PREVIEW — with feature metadata
// ══════════════════════════════════════════
function buildFinalPreview() {
  const schema = buildSchema();
  const isTrade = state.domain === 'trade'||state.domain==='trade_history';
  const isTradeHist = state.domain === 'trade_history';
  const featName = deterministic_name();

  // Feature name
  const fnEl = document.getElementById('final-feat-name');
  if (fnEl) { fnEl.textContent = featName; fnEl.style.color = isTradeHist?'var(--tradeh)':isTrade ? 'var(--trade)' : 'var(--accent)'; }

  // Feature tags
  const fakeFeature = { measure: state.measure, sub: state.subCat, trend_mode: trendMode, balance_mode: balanceMode };
  const tagsHtml = renderFeatureTags(fakeFeature);
  const tagsEl = document.getElementById('review-feature-tags');
  if (tagsEl) tagsEl.innerHTML = tagsHtml;

  // Leakage badge
  const leakage = computeLeakageRisk(fakeFeature);
  const leakBadge = document.getElementById('review-leakage-badge');
  if (leakBadge) {
    const lColors = { none:'#059669', low:'#d97706', high:'#dc2626', unknown:'#8898b4' };
    const lLabels = { none:'✅ No Leakage Risk', low:'🟡 Low Leakage Risk', high:'🔴 High Leakage Risk', unknown:'⬜ Unknown Risk' };
    leakBadge.textContent = lLabels[leakage.risk] || leakage.risk;
    leakBadge.style.color = leakage.color;
    leakBadge.style.background = `${leakage.color}18`;
  }

  // Validation summary in review panel
  const rvs = document.getElementById('review-validation-summary');
  if (rvs) {
    const { warnings, leakage_flags } = validationState;
    const total = warnings.length + leakage_flags.length;
    if (total > 0) {
      rvs.style.display = 'block';
      rvs.innerHTML = `<div style="font-size:11px;color:var(--text3);font-weight:600;margin-bottom:6px;">REVIEW CHECKLIST (${total} note${total>1?'s':''})</div>` +
        warnings.map(w => `<div style="font-size:11px;color:var(--warn);padding:3px 0;">⚠ ${w}</div>`).join('') +
        leakage_flags.map(l => `<div style="font-size:11px;color:${l.risk==='high'?'var(--danger)':'var(--warn)'};padding:3px 0;">${l.risk==='high'?'🔴':'🟡'} ${l.note}</div>`).join('');
    } else {
      rvs.style.display = 'none';
    }
  }

  // JSON preview — include rule DSL if any
  const ruleDSL = buildRuleDSL();
  if (ruleDSL) schema.filter_rules = ruleDSL;
  document.getElementById('final-json-preview').innerHTML = syntaxHL(JSON.stringify(schema, null, 2));
}
function updateLiveJSON() { if (wizStep===6) buildFinalPreview(); }

// ══════════════════════════════════════════
// ADD VARIABLE — with full metadata
// ══════════════════════════════════════════
function addVariable() {
  const schema = buildSchema();
  // Attach filter_rules
  const ruleDSL = buildRuleDSL();
  if (ruleDSL) schema.filter_rules = ruleDSL;
  // Attach feature metadata
  const fakeFeature = { measure: state.measure, sub: state.subCat, trend_mode: trendMode, balance_mode: balanceMode };
  schema._meta = {
    feature_tags: computeFeatureTags(fakeFeature),
    leakage_risk: computeLeakageRisk(fakeFeature).risk,
    validation_warnings: validationState.warnings,
    generated_at: new Date().toISOString().slice(0,16).replace('T',' '),
  };
  schema._source = 'wizard';
  schema.source  = 'wizard';
  builtFeatures.push(schema);
  window.currentFeatures = builtFeatures.map(f => ({ feature_name: f.feature_name }));
  renderBuildList(); updateHdrCount();
  showToast(`✓ Added: ${schema.feature_name}`);
  document.getElementById('status-bar').classList.add('show');
  resetWizard();
}

function delFeature(idx) {
  builtFeatures.splice(idx, 1);
  window.currentFeatures = builtFeatures.map(f => ({ feature_name: f.feature_name }));
  renderBuildList(); updateHdrCount();
  showToast('Variable removed');
}

function updateCurrentBuildDownloadVisibility() {
  const section = document.getElementById('download-code-section');
  if (!section) return;
  section.style.display = builtFeatures.length > 0 ? 'block' : 'none';
}

function renderBuildList() {
  const list = document.getElementById('build-feat-list');
  const empty = document.getElementById('build-empty');
  document.getElementById('sb-count').textContent = builtFeatures.length;
  updateCurrentBuildDownloadVisibility();
  if (!builtFeatures.length) { empty.style.display='block'; list.innerHTML=''; return; }
  empty.style.display='none'; list.innerHTML='';
  builtFeatures.forEach((f,i) => {
    const schema = f.domain==='trade' ? TRD_SCHEMA : f.domain==='trade_history' ? TRD_HIST_SCHEMA : f.domain==='account' ? ACT_SCHEMA : INQ_SCHEMA;
    const sc = schema[f.sub_category] || {};
    const isTrade = f.domain === 'trade';
    const isTradeHist = f.domain === 'trade_history';
    const isAccount = f.domain === 'account';
    const div = document.createElement('div'); div.className = 'feat-item';

    // Base badges
    const badges = [];
    const domainColor = isTrade ? 'background:rgba(15,118,110,0.1);color:var(--trade)' : isTradeHist ? 'background:rgba(3,105,161,0.1);color:var(--tradeh)' : isAccount ? 'background:rgba(180,83,9,0.1);color:var(--account)' : 'background:var(--accent-light);color:var(--accent)';
    if (f.domain) badges.push(`<span class="feat-tag" style="${domainColor}">${f.domain}</span>`);
    if (f.sub_category) badges.push(`<span class="feat-tag ${sc.color||'ft-vol'}">${f.sub_category}</span>`);
    if (f.aggregation) badges.push(`<span class="feat-tag" style="background:var(--bg);border:1px solid var(--border)">${f.aggregation}</span>`);
    const win = f.time_window?`${f.time_window.value}m`:(f.time_windows?f.time_windows.map(w=>typeof w==='object'?w.value+'m':w).join('+'):'');
    if (win) badges.push(`<span class="feat-tag" style="background:var(--bg);border:1px solid var(--border)">${win}</span>`);
    if (f.time_context) badges.push(`<span class="feat-tag" style="background:rgba(180,83,9,0.08);color:var(--account);">${f.time_context.type?.replace(/_/g,' ')}</span>`);

    // Feature tags from metadata
    let tagsHtml = '';
    const meta = f._meta;
    if (meta && meta.feature_tags && meta.feature_tags.length) {
      tagsHtml = `<div class="feat-tags-row" style="margin-top:4px;">` +
        meta.feature_tags.slice(0,3).map(t => {
          const cfg = TAG_CONFIG[t] || {};
          return `<span class="ftag" style="color:${cfg.color||'#8898b4'};background:${cfg.bg||'#f4f6fb'};">${cfg.icon||''} ${t}</span>`;
        }).join('') +
        (meta.leakage_risk === 'high' ? `<span class="ftag" style="color:#dc2626;background:rgba(220,38,38,0.08);">🔴 leakage</span>` :
         meta.leakage_risk === 'low'  ? `<span class="ftag" style="color:#d97706;background:rgba(217,119,6,0.08);">🟡 low-leak</span>` : '') +
        `</div>`;
    }
    // Filter rules badge
    const hasRules = f.filter_rules && f.filter_rules.groups && f.filter_rules.groups.length;
    if (hasRules) badges.push(`<span class="feat-tag" style="background:rgba(99,102,241,0.1);color:#6366f1;">⚙ ${f.filter_rules.groups.length} rule${f.filter_rules.groups.length>1?'s':''}</span>`);

    div.innerHTML = `<div class="feat-name ${isTrade?'trade-name':isAccount?'account-name':''}">${f.feature_name}</div><div class="mini-badges">${badges.join('')}</div>${tagsHtml}<button class="feat-del-btn" onclick="delFeature(${i})">✕</button>`;
    list.appendChild(div);
  });
  // Update cross-map button visibility
  const btn = document.getElementById('btn-crossmap');
  if (btn) btn.style.display = builtFeatures.length >= 2 ? 'inline-flex' : 'none';
}

function resetWizard() {
  state.domain='enquiry'; state.varType='Enquiry';
  state.aggregationType='simple'; state.ratioMethod='count'; initRatioParams();
  state.subCat=''; state.measure=''; state.aggregation='';
  state.timeWindows=[]; state.velPair=null; state.customWindow='';
  state.filters={product:[],secured:'all',lender:[],tradeFlags:[]};
  state.intermediateSelection={product:'',subtype:'',page:0};
  state.tradeScope={loanType:[],secured:'all',status:'all',ownership:'all'};
  state.accScope={loanType:[],secured:'all',status:[],ownership:'all',timeCtx:'snapshot',period:'6'};
  state.threshold={op:'>',val:''}; state.postProcessing=[];
  state.featNameOverride='';
  // Reset new state
  ratioState={type:'simple',w2w:{metric:'',numerator:'3m',denominator:'12m'},cross:{numerator:'',denominator:'',window:'12m'},norm:{metric:'',by:'per_trade',window:'12m'},p2p:{num:'',den:'ALL',metric:'balance',window:'12m'}};
  selectedPercentiles=[75,90]; recencyAccelWindow=null; balanceMode='point_in_time'; trendMode='window_diff'; recencyDPDThreshold=30; recencyWOAmount=0;
  // Reset enterprise state
  ruleGroups=[]; validationState={errors:[],warnings:[],leakage_flags:[],info:[]};
  transitionFrom='DPD=0'; transitionTo='DPD>=30';
  vintageCohortBy='origination_quarter'; vintageMOBBand='MOB_7_12';
  trendRollingWin={slope:'12m',vol:'12m',reg:'12m'}; trendRegOutputs=['slope','r_squared'];
  balMonthlyAgg='avg'; balDecayType='linear'; balVolNorm='absolute'; balPeakOut='peak_value';
  // Reset rule builder UI
  const rbg = document.getElementById('rule-builder-groups');
  if (rbg) rbg.innerHTML='';
  const vp = document.getElementById('validation-panel');
  if (vp) { vp.style.display='none'; vp.innerHTML=''; }
  // Reset trend/balance mode grids
  const tmg = document.getElementById('trend-mode-grid');
  if (tmg) tmg.innerHTML='';
  const bmg = document.getElementById('balance-mode-grid');
  if (bmg) bmg.innerHTML='';
  // Reset ratio tabs
  document.querySelectorAll('.ratio-type-tab').forEach(t=>t.classList.remove('sel'));
  const rtabSimple=document.getElementById('rtab-simple'); if(rtabSimple) rtabSimple.classList.add('sel');
  document.querySelectorAll('.ratio-type-panel').forEach(p=>p.classList.remove('active'));
  const rpanelSimple=document.getElementById('rpanel-simple'); if(rpanelSimple) rpanelSimple.classList.add('active');
  document.getElementById('feat-name-override').value='';
  const _msec = document.getElementById('measure-section'); if(_msec) _msec.style.display='none';
  const _mc = document.getElementById('measure-chips'); if(_mc) _mc.innerHTML='';
  const _ac = document.getElementById('agg-chips'); if(_ac) _ac.innerHTML='';
  const _cwr = document.getElementById('custom-window-row'); if(_cwr) _cwr.classList.remove('show');
  selectAggType('simple', document.getElementById('agg-type-simple'));
  document.querySelectorAll('.vt-card').forEach(c=>{c.classList.remove('sel');c.classList.remove('trade-sel');});
  const _vte = document.getElementById('vt-enquiry'); if(_vte) _vte.classList.add('sel');
  const _tn = document.getElementById('trade-notice'); if(_tn) _tn.className='trade-notice';
  const _an = document.getElementById('account-notice'); if(_an) _an.className='account-notice';
  buildSubcatGrid();
  document.querySelectorAll('.subcat-card').forEach(c=>{c.classList.remove('sel');c.classList.remove('trade-sel');});
  document.querySelectorAll('#filter-product .fchip').forEach(c=>c.classList.remove('sel'));
  document.querySelectorAll('#trade-loan-type .fchip').forEach(c=>c.classList.remove('sel'));
  ['sec-all'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.add('sel');});
  ['sec-secured','sec-unsecured'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('sel');});
  ['tsec-all','tstat-all','town-all'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.add('sel');});
  ['tsec-sec','tsec-unsec','tstat-active','tstat-closed','tstat-wo','tstat-settled','tstat-suit','town-ind','town-joint','town-guar'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('sel');});
  ['tsec-sec','tsec-unsec','tstat-active','tstat-closed','tstat-wo','tstat-settled','tstat-suit','town-ind','town-joint','town-guar'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.remove('sel');});
  ['thresh-val','amt-val','dpd-val','overdue-val','util-val'].forEach(id=>{const el=document.getElementById(id);if(el) el.value='';});
  document.getElementById('balance-type-section').style.display='none';
  wizStep=1; updateWizUI();
}
function updateHdrCount() {
  document.getElementById('hdr-feat-count').textContent=`${builtFeatures.length} variable${builtFeatures.length!==1?'s':''}`;
}

// ══════════════════════════════════════════
// PRE-DEFINED LIBRARY
// ══════════════════════════════════════════
const PAGE_SIZE=6;
function buildPredefList() { renderPD(); }
function filterPD(type, el) {
  pdFilter=type; pdFieldFilter='all'; pdCurrentPage=0;
  document.querySelectorAll('.pd-filter').forEach(f=>f.classList.remove('sel'));
  el.classList.add('sel');
  renderPD();
}
function filterPDCondition(value) {
  pdFieldFilter = value;
  pdCurrentPage = 0;
  renderPD();
}
function pdPageNav(dir) {
  const filtered=getPDFiltered();
  const maxPage=Math.max(0,Math.ceil(filtered.length/PAGE_SIZE)-1);
  pdCurrentPage=Math.max(0,Math.min(pdCurrentPage+dir,maxPage));
  renderPD();
}
function isPDProductBased(item) {
  const hasExplicitProduct = Array.isArray(item.product) && item.product.length > 0;
  const hasExplicitLoanType = Array.isArray(item.loanType) && item.loanType.length > 0;
  const productSubcats = new Set(['mix','product_diversity','secured_split','credit_mix','portfolio_mix']);
  const productTerms = /(product|loan type|secured|unsecured|revolving|installment|dominant_product|share|diversity|cc|pl|hl|al|gl|lap|las|cd|tw|cv|el|ce)/i;
  return hasExplicitProduct
    || hasExplicitLoanType
    || productSubcats.has(item.sub)
    || productTerms.test(`${item.name || ''} ${item.measure || ''} ${item.sub || ''}`);
}
function isPDTimeBased(item) {
  const timeSubcats = new Set(['recency','trend','vintage','lifecycle','gap','velocity','inter_enquiry_timing','balance_dynamics']);
  const hasWindow = !!item.window || !!item.window_pair || !!item.window_triple;
  return hasWindow || timeSubcats.has(item.sub) || ['recency','trend','vintage','lifecycle','velocity'].includes(item.type);
}
function getPDBaseFiltered() {
  let flowLibrary = PREDEF_LIBRARY.slice();

  if (state.domain) {
    flowLibrary = flowLibrary.filter(item => item.domain === state.domain);
  }

  if (state.subCat) {
    flowLibrary = flowLibrary.filter(item => item.sub === state.subCat);
  }

  if (pdFilter==='all') return flowLibrary;
  if (pdFilter==='product_based') return flowLibrary.filter(isPDProductBased);
  if (pdFilter==='time_based') return flowLibrary.filter(isPDTimeBased);
  if (pdFilter==='all_other') return flowLibrary.filter(x=>!isPDProductBased(x) && !isPDTimeBased(x));
  return flowLibrary;
}
function getPDProductOptions(baseFiltered) {
  const opts = new Set();
  baseFiltered.forEach(item => {
    (item.product || []).forEach(p => opts.add(p));
    (item.loanType || []).forEach(p => opts.add(p));
    const text = `${item.name || ''} ${item.measure || ''}`;
    ['PL','CC','HL','AL','BL','GL','OD','LAP','LAS','CD','TW','CV','EL','CE'].forEach(code => {
      if (new RegExp(`\\b${code}\\b`, 'i').test(text)) opts.add(code);
    });
  });
  return [...opts].sort((a, b) => a.localeCompare(b));
}
function itemMatchesPDProduct(item, value) {
  if (value === 'all') return true;
  const explicitProducts = [...(item.product || []), ...(item.loanType || [])];
  if (explicitProducts.includes(value)) return true;
  const text = `${item.name || ''} ${item.measure || ''}`;
  return new RegExp(`\\b${value}\\b`, 'i').test(text);
}
function getPDTimeOptions(baseFiltered) {
  const opts = new Set();
  baseFiltered.forEach(item => {
    if (item.window) opts.add(item.window);
    (item.window_pair || []).forEach(w => opts.add(w));
    (item.window_triple || []).forEach(w => opts.add(w));
    if (!item.window && !item.window_pair && !item.window_triple) opts.add('no_window');
  });
  return [...opts].sort((a, b) => {
    if (a === 'no_window') return 1;
    if (b === 'no_window') return -1;
    return parseInt(a) - parseInt(b);
  });
}
function getPDTimeLabel(value) {
  return value === 'no_window' ? 'No Window' : value;
}
function itemMatchesPDTime(item, value) {
  if (value === 'all') return true;
  if (value === 'no_window') return !item.window && !item.window_pair && !item.window_triple;
  if (item.window === value) return true;
  if ((item.window_pair || []).includes(value)) return true;
  if ((item.window_triple || []).includes(value)) return true;
  return false;
}
function renderPDFieldFilters(baseFiltered) {
  const wrap = document.getElementById('pd-field-filters');
  const label = document.getElementById('pd-field-label');
  const select = document.getElementById('pd-field-select');
  if (!wrap || !label || !select) return;

  if (pdFilter !== 'product_based' && pdFilter !== 'time_based') {
    wrap.style.display = 'none';
    return;
  }

  const options = pdFilter === 'product_based'
    ? getPDProductOptions(baseFiltered)
    : getPDTimeOptions(baseFiltered);

  if (!options.length) {
    wrap.style.display = 'none';
    select.innerHTML = '<option value="all">All</option>';
    return;
  }

  if (pdFieldFilter !== 'all' && !options.includes(pdFieldFilter)) pdFieldFilter = 'all';

  wrap.style.display = 'flex';
  label.textContent = pdFilter === 'product_based' ? 'Product' : 'Time';
  select.innerHTML = [
    `<option value="all">${pdFilter === 'product_based' ? 'All Products' : 'All Time'}</option>`,
    ...options.map(value => `<option value="${value}">${pdFilter === 'product_based' ? value : getPDTimeLabel(value)}</option>`)
  ].join('');
  select.value = pdFieldFilter;
}
function getPDFiltered() {
  const baseFiltered = getPDBaseFiltered();
  renderPDFieldFilters(baseFiltered);
  if (pdFieldFilter === 'all') return baseFiltered;
  if (pdFilter === 'product_based') return baseFiltered.filter(item => itemMatchesPDProduct(item, pdFieldFilter));
  if (pdFilter === 'time_based') return baseFiltered.filter(item => itemMatchesPDTime(item, pdFieldFilter));
  return baseFiltered;
}
function renderPD() {
  const filtered=getPDFiltered();
  const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const paged=filtered.slice(pdCurrentPage*PAGE_SIZE,(pdCurrentPage+1)*PAGE_SIZE);
  document.getElementById('pd-page-info').textContent=`${pdCurrentPage+1} / ${totalPages}`;
  const list=document.getElementById('pd-list');
  list.innerHTML='';
  if (!filtered.length) {
    list.innerHTML = '<div class="beneficiary-empty">No templates available for the current type / sub-category.</div>';
    return;
  }
  paged.forEach(item=>{
    const isTrade=item.domain==='trade';
    const isAccount=item.domain==='account';
    const d=document.createElement('div');
    d.className='pd-item'+(isTrade?' trade-item':'');
    const itemStr=JSON.stringify(item).replace(/"/g,'&quot;');
    const badgeCls = isTrade ? 'pd-domain-trd' : isAccount ? '' : 'pd-domain-inq';
    const badgeTxt = isTrade ? 'TRD' : isAccount ? 'ACT' : 'INQ';
    const badgeStyle = isAccount ? 'background:var(--account-light);color:var(--account);' : '';
    const typeTag=`<span class="pd-domain-badge ${badgeCls}" style="${badgeStyle}">${badgeTxt}</span>`;
    d.innerHTML=`<span>${item.name}</span><div style="display:flex;align-items:center;gap:4px;">${typeTag}<span class="pd-add-btn" onclick='addPredef(${itemStr})'>+</span></div>`;
    list.appendChild(d);
  });
}

function addPredef(item) {
  const isTrade=item.domain==='trade';
  const isTradeHist=item.domain==='trade_history';
  const isAccount=item.domain==='account';
  const schema=isTrade?TRD_SCHEMA:isTradeHist?TRD_HIST_SCHEMA:isAccount?ACT_SCHEMA:INQ_SCHEMA;
  const sc=schema[item.sub];
  if (!sc) return;
  const feat={
    bureau:state.bureau||"—",
    entity:isTrade?"tradeline":isAccount?"account":"inquiry",
    domain:item.domain,
    feature_name:item.name.toLowerCase().replace(/[^a-z0-9]+/g,'_'),
    sub_category:item.sub, measure:item.measure, aggregation:item.agg,
  };
  // Recency: add date_column and formula
  if (item.sub==='recency'&&isTrade) {
    const dcMap=TRD_SCHEMA.recency.date_column_map;
    const fmlMap=TRD_SCHEMA.recency.recency_formulas||{};
    feat.date_column=dcMap[item.measure]||'DateReported';
    feat.formula=fmlMap[item.measure]||'FLOOR((CurrentDate - MAX(date_column)) / 30)';
  }
  // Account recency: add formula
  if (item.sub==='recency'&&isAccount) {
    const mv=ACT_SCHEMA.recency.measures[item.measure];
    feat.date_column=mv?mv.col:'DateReported';
    feat.formula=`FLOOR((ReportingDate − MAX(${feat.date_column})) / 30)`;
  }
  // Account trend/velocity: add window pairs
  if ((item.sub==='trend'||item.sub==='velocity')&&isAccount&&item.window_pair) {
    feat.comparison_windows={recent_window:item.window_pair[0],prior_window:item.window_pair[1]};
    feat.formula=`${item.measure.replace(/_/g,' ')} [${item.window_pair[0]}] ${item.agg==='growth_rate'?'growth vs':'diff vs'} [${item.window_pair[1]}]`;
  }
  // Account distribution: note shape
  if (item.sub==='distribution'&&isAccount) {
    feat.shape_type=item.agg;
    feat.formula=`${item.agg.toUpperCase()}(${item.measure.replace(/_/g,' ')}) across accounts in portfolio snapshot`;
  }
  // Account concentration: add formula
  if (item.sub==='concentration'&&isAccount) {
    feat.formula=item.agg==='index'
      ? 'HHI = Σ(share_i²) where share_i = exposure_i / total_exposure'
      : 'TOP_N_SHARE = Σ(top_N_exposures) / total_exposure';
  }
  // Account vintage: add formula
  if (item.sub==='vintage'&&isAccount) {
    feat.date_column='DateOpened';
    feat.formula=`${item.agg.toUpperCase()}(FLOOR((ReportingDate − DateOpened) / 30) FOR each account)`;
  }
  // Account utilization: add formula
  if (item.sub==='utilization'&&isAccount) {
    const fmlMap={
      balance_utilization:'Outstanding_Balance / Sanction_Amount',
      overdue_utilization:'Over_due_amount / Outstanding_Balance',
      avg_util_all_accs:'AVG(Outstanding_Balance / Sanction_Amount) across all accounts',
      max_single_util:'MAX(Outstanding_Balance / Sanction_Amount)',
      util_above_80_count:'COUNT(accounts WHERE Outstanding_Balance / Sanction_Amount > 0.80)',
      util_above_90_flag:'FLAG: ANY(Outstanding_Balance / Sanction_Amount > 0.90)',
      emi_to_outstanding:'SUM(EMI) / SUM(Outstanding_Balance)',
    };
    feat.formula=fmlMap[item.measure]||`${item.agg}(utilization)`;
  }
  // Trend: add comparison windows; acceleration: add triple windows
  if (item.sub==='trend'&&isTrade&&item.window_triple) {
    feat.window_triple={short:item.window_triple[0],mid:item.window_triple[1],long:item.window_triple[2]};
    feat.formula=`Accel = (Metric[${item.window_triple[0]}] - Metric[${item.window_triple[1]}]) - (Metric[${item.window_triple[1]}] - Metric[${item.window_triple[2]}])`;
  } else if (item.sub==='trend'&&isTrade&&item.window_pair) {
    feat.comparison_windows={recent_window:item.window_pair[0],prior_window:item.window_pair[1]};
  }
  // Balance dynamics: add snapshot_type
  if (item.sub==='balance_dynamics') {
    feat.snapshot_type=item.snapshot_type||'point_in_time';
  }
  if (item.window) feat.time_window={type:"rolling",value:parseInt(item.window),unit:"month"};
  if (item.window_pair&&item.sub!=='trend'&&!isAccount) feat.time_windows=item.window_pair.map(w=>({value:parseInt(w),unit:"month"}));
  if (!isTrade&&!isAccount&&item.product&&item.product.length) feat.filters={product:item.product};
  if (isTrade) {
    const scope={};
    if(item.loanType&&item.loanType.length) scope.loan_type=item.loanType;
    if(item.secured&&item.secured!=='all') scope.secured_flag=item.secured;
    if(item.status&&item.status!=='all') scope.account_status=item.status;
    if(Object.keys(scope).length) feat.portfolio_scope=scope;
  }
  if (isAccount) {
    const scope={};
    if(item.loanType&&item.loanType.length) scope.loan_type=item.loanType;
    if(item.secured&&item.secured!=='all') scope.secured=item.secured;
    if(item.status&&item.status.length) scope.account_status=item.status;
    if(Object.keys(scope).length) feat.filters=scope;
  }
  builtFeatures.push(feat);
  renderBuildList(); updateHdrCount();
  showToast(`✓ Added: ${feat.feature_name}`);
  document.getElementById('status-bar').classList.add('show');
}

// ══════════════════════════════════════════════════════════════════
// VARIABLE CATALOG ENGINE  — v4  (Feature Factory Upgrade)
//
// Naming template:
//   {agg}_{measure}_{threshold}_last_{window}_{product}_{security}
//
// Combinatorial math (exact from spec):
//   2 measure × 4 agg × 5 window × 4 product × 3 security × 3 threshold
//   = 2 × 4 × 5 × 4 × 3 × 3 = 1440 core features
//   + ~500 derived (ratio, trend, mix, concentration) = ~1940+ total
//
// Architecture:
// ══════════════════════════════════════════════════════════════════
// VARIABLE CATALOG ENGINE  —  v10
// 78,753 auto-generated variables across 5 types, 77 sub-categories
//
// Auto-generates on first open — no "Generate" button needed.
// Variables breakdown:
//   Enquiry:       7,292  (13 sub-cats × measures × aggs × windows × product/secured)
//   Trade:        30,360  (15 sub-cats × full stat aggs × all products)
//   Account:      12,959  (16 sub-cats × measures × aggs)
//   Trade Hist:   27,275  (13 sub-cats × dist aggs × product filters)
//   Cross Product:   867  (7 sub-cats × per-loan-type ratios)
//   Total:        78,753  unique, zero duplicates
// ══════════════════════════════════════════════════════════════════

// ─── DIMENSION TABLES ────────────────────────────────────────────
const VC_LOAN_TYPES   = ["PL","CC","HL","AL","BL","GL","OD","LAP","LAS","CD","TW","CV","EL","CE","Other"];
const VC_ALL_WINS     = [1,3,6,12,24,36];
const VC_STD_WINS     = [1,3,6,12];
const VC_GAP_WINS     = [3,6,12,24,36];
const VC_LONG_WINS    = [6,12,24,36];
const VC_HIST_WINS    = [3,6,12,24,36,48];
const VC_STAT_AGGS    = ["count","sum","avg","max","min","median","std","variance","cv","skew","kurtosis","percentile"];
const VC_DIST_AGGS    = ["avg","median","max","min","std","variance","cv","skew","kurtosis","percentile","iqr"];
const VC_BOOL_AGGS    = ["count","flag","ratio"];
const VC_RATIO_AGGS   = ["ratio","index","count"];

// ─── RUNTIME STATE ───────────────────────────────────────────────
let vcCatalog     = [];          // full generated library
let vcFiltered    = [];          // after filters applied
let vcCustom      = [];          // manual custom vars
let vcSelected    = new Set();
let vcActiveType  = 'all';       // type-tab filter
let vcPage        = 0;
let vcGenerating  = false;
let vcCatalogGenerated = false;
const VC_PAGE_SZ  = 15;

// ─── OPEN / CLOSE ────────────────────────────────────────────────
function openVarCatalog() {
  document.getElementById('vc-overlay').classList.add('open');
  vcSyncGenerateUI();
  vcApplyFilters();
}
function closeVarCatalog() {
  document.getElementById('vc-overlay').classList.remove('open');
}

function vcSyncGenerateUI() {
  const btn = document.getElementById('vc-generate-btn');
  if (btn) {
    btn.disabled = vcGenerating || vcCatalogGenerated;
    btn.textContent = vcGenerating
      ? 'Generating...'
      : vcCatalogGenerated
        ? 'Generated'
        : '⚡ Generate';
    btn.classList.toggle('generated', vcCatalogGenerated && !vcGenerating);
  }

  const loadMsg = document.getElementById('vc-loading-msg');
  if (loadMsg) loadMsg.style.display = vcGenerating ? 'inline' : 'none';

  const meta = document.getElementById('vc-title-meta');
  if (meta) {
    meta.textContent = 'Auto-generated variables';
  }
}

function vcGenerateCatalog() {
  if (vcGenerating || vcCatalogGenerated) return;

  vcGenerating = true;
  vcSyncGenerateUI();
  vcRenderCatalog();

  setTimeout(() => {
    vcExplode();
    vcGenerating = false;
    vcCatalogGenerated = true;
    vcSyncGenerateUI();
    vcRenderCatalog();
    vcUpdateStats();
  }, 30);
}

// ─── EXPLOSION ENGINE — generates all 78,753 variables ───────────
function vcExplode() {
  vcCatalog = [];
  const seen = new Set();

  // Helper: push a variable if name not seen
  function push(name, type, sub, measure, agg, window, product, secured) {
    if (seen.has(name)) return;
    seen.add(name);
    vcCatalog.push({ id:name, name, type, sub_category:sub, measure, agg, window, product, secured });
  }

  // Name builder
  function nm(...parts) {
    return parts.filter(p => p && p !== 'all' && p !== '0m')
      .join('_').toLowerCase().replace(/[^a-z0-9_]/g,'_').replace(/_+/g,'_');
  }

  // ══ ENQUIRY (7,292) ══════════════════════════════════════════
  for (const w of VC_ALL_WINS) {
    for (const agg of VC_BOOL_AGGS) {
      push(nm('enq','vol',agg,w+'m'),'Enquiry','volume','count',agg,w+'m','all','all');
      for (const lt of VC_LOAN_TYPES)
        push(nm('enq','vol',lt,agg,w+'m'),'Enquiry','volume','count',agg,w+'m',lt,'all');
      for (const sec of ['secured','unsecured'])
        push(nm('enq','vol',sec,agg,w+'m'),'Enquiry','volume','count',agg,w+'m','all',sec);
    }
  }
  for (const w of VC_ALL_WINS) {
    for (const agg of VC_STAT_AGGS) {
      push(nm('enq','amt',agg,w+'m'),'Enquiry','amount','inquiry_amount',agg,w+'m','all','all');
      for (const lt of VC_LOAN_TYPES)
        push(nm('enq','amt',lt,agg,w+'m'),'Enquiry','amount','inquiry_amount',agg,w+'m',lt,'all');
      for (const sec of ['secured','unsecured'])
        push(nm('enq','amt',sec,agg,w+'m'),'Enquiry','amount','inquiry_amount',agg,w+'m','all',sec);
    }
  }
  for (const w of VC_GAP_WINS) {
    for (const agg of VC_DIST_AGGS) {
      push(nm('enq','gap',agg,w+'m'),'Enquiry','gap','days_between',agg,w+'m','all','all');
      for (const lt of VC_LOAN_TYPES)
        push(nm('enq','gap',lt,agg,w+'m'),'Enquiry','gap','days_between',agg,w+'m',lt,'all');
    }
  }
  for (const [m,ms] of [['months_since_last','msl'],['months_since_oldest','mso']]) {
    push(nm('enq','rec',ms),'Enquiry','recency',m,'value','0m','all','all');
    for (const lt of VC_LOAN_TYPES) push(nm('enq','rec',lt,ms),'Enquiry','recency',m,'value','0m',lt,'all');
    for (const sec of ['secured','unsecured']) push(nm('enq','rec',sec,ms),'Enquiry','recency',m,'value','0m','all',sec);
  }
  for (const w of [3,6,12,24]) {
    for (const [m,ms] of [['distinct_lenders','dlnd'],['top_lender_share','tls'],['hhi_index','hhi']]) {
      for (const agg of VC_RATIO_AGGS) push(nm('enq','con',ms,agg,w+'m'),'Enquiry','concentration',m,agg,w+'m','all','all');
      for (const lt of VC_LOAN_TYPES) push(nm('enq','con',lt,ms,w+'m'),'Enquiry','concentration',m,'count',w+'m',lt,'all');
    }
  }
  for (const [w1,w2] of [[1,3],[3,6],[6,12],[3,12],[12,24]]) {
    const pair = w1+'m_'+w2+'m';
    for (const [m,ms] of [['count_change','chg'],['count_ratio','rat'],['growth_rate','grw'],['slope','slp']]) {
      for (const agg of ['difference','ratio','growth_rate','slope'])
        push(nm('enq','vel',ms,agg,pair),'Enquiry','velocity',m,agg,w2+'m','all','all');
      for (const lt of VC_LOAN_TYPES) push(nm('enq','vel',lt,ms,pair),'Enquiry','velocity',m,'difference',w2+'m',lt,'all');
    }
  }
  const BUCKETS=[['0_1k',0,1000],['1k_10k',1000,10000],['10k_50k',10000,50000],['50k_1l',50000,100000],['1l_5l',100000,500000],['5l_10l',500000,1000000],['above_10l',1000000,null]];
  for (const [bn] of BUCKETS) {
    for (const w of VC_STD_WINS) {
      for (const agg of VC_BOOL_AGGS) {
        push(nm('enq','bkt',bn,agg,w+'m'),'Enquiry','amount_bucket','bucket_'+bn,agg,w+'m','all','all');
        for (const lt of VC_LOAN_TYPES) push(nm('enq','bkt',lt,bn,agg,w+'m'),'Enquiry','amount_bucket','bucket_'+bn,agg,w+'m',lt,'all');
        for (const sec of ['secured','unsecured']) push(nm('enq','bkt',sec,bn,agg,w+'m'),'Enquiry','amount_bucket','bucket_'+bn,agg,w+'m','all',sec);
      }
    }
  }
  for (const w of [3,6,12,24]) {
    for (const [m,ms] of [['secured_count','seccnt'],['unsecured_count','ucnt'],['secured_ratio','srat'],['unsecured_ratio','urat'],['secured_amt_share','samt'],['unsecured_amt_share','uamt']]) {
      for (const agg of VC_BOOL_AGGS) push(nm('enq','spl',ms,agg,w+'m'),'Enquiry','secured_split',m,agg,w+'m','all','all');
    }
  }
  for (const [m,ms] of [['distinct_product_types','dptype'],['product_type_hhi','phhi'],['top_product_share','tpsh'],['pl_inq_share','plsh'],['cc_inq_share','ccsh'],['hl_inq_share','hlsh'],['bl_inq_share','blsh']]) {
    for (const w of VC_ALL_WINS)
      for (const agg of VC_RATIO_AGGS)
        push(nm('enq','pmx',ms,agg,w+'m'),'Enquiry','product_mix',m,agg,w+'m','all','all');
  }
  for (const w of VC_LONG_WINS) {
    for (const [m,ms] of [['amount_distribution','adist'],['gap_distribution','gdist']]) {
      for (const agg of VC_DIST_AGGS) push(nm('enq','dist',ms,agg,w+'m'),'Enquiry','distribution',m,agg,w+'m','all','all');
    }
  }
  for (const [m,ms] of [['inq_last_30d','i30d'],['inq_last_7d','i7d'],['distinct_products_30d','dp30d'],['burst_flag_3inq_30d','bf3'],['burst_flag_5inq_30d','bf5'],['max_inq_single_day','maxd'],['avg_inq_per_week','avgw']]) {
    for (const w of [1,3]) {
      for (const agg of VC_BOOL_AGGS) {
        push(nm('enq','bst',ms,agg,w+'m'),'Enquiry','burst',m,agg,w+'m','all','all');
        for (const lt of VC_LOAN_TYPES) push(nm('enq','bst',lt,ms,w+'m'),'Enquiry','burst',m,'count',w+'m',lt,'all');
      }
    }
  }

  // ══ TRADE (30,360) ═══════════════════════════════════════════
  const TRD = {
    exposure:    {m:["current_balance","sanction_amount","overdue_amount","emi_amount","credit_limit","writeoff_amount","settlement_amount"],a:VC_STAT_AGGS,w:VC_ALL_WINS,p:true,s:true},
    volume:      {m:["active_count","closed_count","total_count","writeoff_count","settled_count"],a:["count","sum","ratio","flag"],w:VC_ALL_WINS,p:true,s:true},
    delinquency: {m:["dpd","overdue_amount","dpd_30","dpd_60","dpd_90","delinquent_flag"],a:VC_STAT_AGGS,w:VC_STD_WINS,p:true,s:true},
    utilization: {m:["utilization_ratio","avg_utilization","max_utilization","high_util_flag"],a:VC_DIST_AGGS,w:VC_STD_WINS,p:true,s:false},
    vintage:     {m:["account_age","months_since_oldest","months_since_newest","months_since_first_delq"],a:["value","avg","min","max"],w:[0],p:true,s:false},
    recency:     {m:["months_since_last_dpd30","months_since_last_dpd60","months_since_last_dpd90","months_since_last_writeoff","months_since_last_npa"],a:["value","min","max"],w:[0],p:true,s:false},
    trend:       {m:["balance_growth","utilization_change","dpd_trend","overdue_trend","emi_trend"],a:["difference","growth_rate","ratio","slope"],w:[3,6,12],p:true,s:false},
    balance_dynamics:{m:["outstanding_balance","peak_balance","avg_monthly_balance","balance_volatility","time_weighted_balance"],a:VC_DIST_AGGS,w:VC_STD_WINS,p:true,s:false},
    writeoff:    {m:["writeoff_amount","writeoff_count"],a:["sum","count","flag","avg","max"],w:VC_LONG_WINS,p:true,s:false},
    settlement:  {m:["settlement_amount","settlement_count"],a:["sum","count","flag","avg"],w:VC_LONG_WINS,p:true,s:false},
    portfolio_mix:{m:["pl_share","unsecured_share","secured_share","cc_share","loan_type_hhi"],a:VC_RATIO_AGGS,w:VC_STD_WINS,p:false,s:false},
    risk_ratio:  {m:["foir","delinquent_ratio","npa_ratio","high_utilization_ratio","db_ratio"],a:["avg","max","min","ratio"],w:VC_STD_WINS,p:true,s:false},
    transition_matrix:{m:["dpd_to_dpd0","dpd0_to_dpd30","dpd30_to_dpd90","upgrade_count","downgrade_count","net_transition"],a:["count","ratio","flag","avg"],w:[3,6,12],p:true,s:false},
    vintage_cohort:{m:["vintage_dpd_rate","vintage_npa_rate","cumulative_default","early_delinquency"],a:["ratio","count","avg"],w:[6,12,24],p:true,s:false},
    stability_score:{m:["psi_score","rank_correlation","gini_stability"],a:["value","flag"],w:[6,12],p:false,s:false},
  };
  for (const [sc,cfg] of Object.entries(TRD)) {
    for (const m of cfg.m) {
      for (const w of cfg.w) {
        const wstr = w===0?'0m':w+'m';
        for (const agg of cfg.a) {
          push(nm('trd',sc,m,agg,wstr),'Trade',sc,m,agg,wstr,'all','all');
          if (cfg.p) for (const lt of VC_LOAN_TYPES) push(nm('trd',sc,lt,m,agg,wstr),'Trade',sc,m,agg,wstr,lt,'all');
          if (cfg.s) for (const sec of ['secured','unsecured']) push(nm('trd',sc,sec,m,agg,wstr),'Trade',sc,m,agg,wstr,'all',sec);
        }
      }
    }
  }

  // ══ ACCOUNT (12,959) ═════════════════════════════════════════
  const ACC = {
    portfolio_count:    {m:["total_accounts","active_accounts","closed_accounts","npa_accounts","delinquent_accounts"],a:["count","ratio","flag"],w:VC_STD_WINS,p:true,s:true},
    portfolio_exposure: {m:["total_outstanding","total_sanctioned","total_overdue","total_emi","avg_balance","max_balance"],a:VC_STAT_AGGS.slice(0,8),w:VC_STD_WINS,p:true,s:true},
    delinquency_profile:{m:["current_dpd","max_dpd_ever","count_dpd30","count_dpd60","count_dpd90"],a:["count","max","avg","flag","ratio"],w:VC_STD_WINS,p:true,s:false},
    utilization_profile:{m:["cc_utilization","avg_util_all_cards","max_util_single_card","high_util_count"],a:VC_DIST_AGGS,w:VC_STD_WINS,p:false,s:false},
    credit_age:         {m:["age_oldest","credit_history_len","avg_account_age"],a:["value","avg","max"],w:[0],p:false,s:false},
    account_flags:      {m:["has_npa","has_writeoff","has_overdue","has_dpd30","has_dpd90"],a:["flag"],w:VC_STD_WINS,p:true,s:false},
    derived_ratios:     {m:["foir","active_account_ratio","delinquent_ratio","npa_ratio","overdue_to_outstanding"],a:["ratio","avg","max"],w:[0],p:false,s:false},
    behavioral:         {m:["payment_consistency","balance_paydown_rate","account_closure_rate"],a:["flag","count","avg","ratio"],w:VC_STD_WINS,p:true,s:false},
    vintage:            {m:["avg_account_age","oldest_account_age","new_accounts_last_6m","weighted_avg_age"],a:["avg","max","min","count"],w:VC_LONG_WINS,p:true,s:false},
    product_mix:        {m:["product_mix_score","unique_product_count","product_hhi","secured_product_share"],a:VC_RATIO_AGGS,w:[0],p:false,s:false},
    lifecycle:          {m:["new_accounts_opened","accounts_closed_period","net_account_change","new_to_total_ratio"],a:["count","sum","ratio"],w:VC_STD_WINS,p:true,s:false},
    delinquency_severity:{m:["dpd_severity_index","max_dpd_across_accounts","severe_delinquency_ratio","avg_dpd_delinquent"],a:["count","ratio","max","avg","flag"],w:VC_STD_WINS,p:true,s:false},
    payment_behavior:   {m:["on_time_payment_ratio","missed_payment_count","consecutive_clean_months","ever_missed_12m"],a:["ratio","count","avg","flag","slope"],w:VC_STD_WINS,p:true,s:false},
    credit_mix:         {m:["credit_mix_score","secured_to_unsecured_ratio","loan_type_diversity","revolving_to_installment"],a:["ratio","index","count","flag"],w:[0],p:false,s:false},
    concentration:      {m:["top_lender_exposure_ratio","lender_concentration_index","loan_type_concentration"],a:VC_RATIO_AGGS,w:[0],p:false,s:false},
    utilization:        {m:["acc_credit_utilization","credit_utilization_ratio","max_util_single_account","util_above_80_count"],a:VC_DIST_AGGS,w:VC_STD_WINS,p:false,s:false},
  };
  for (const [sc,cfg] of Object.entries(ACC)) {
    for (const m of cfg.m) {
      for (const w of cfg.w) {
        const wstr = w===0?'0m':w+'m';
        for (const agg of cfg.a) {
          push(nm('acc',sc,m,agg,wstr),'Account',sc,m,agg,wstr,'all','all');
          if (cfg.p) for (const lt of VC_LOAN_TYPES) push(nm('acc',sc,lt,m,agg,wstr),'Account',sc,m,agg,wstr,lt,'all');
          if (cfg.s) for (const sec of ['secured','unsecured']) push(nm('acc',sc,sec,m,agg,wstr),'Account',sc,m,agg,wstr,'all',sec);
        }
      }
    }
  }

  // ══ TRADE HISTORY (27,275) ════════════════════════════════════
  const TH = {
    delinquency:         {m:["max_dpd_in_history","count_dpd30_months","count_dpd60_months","count_dpd90_months","avg_dpd_history","ever_dpd90_flag"],a:VC_STAT_AGGS,w:VC_HIST_WINS,p:true},
    exposure:            {m:["hist_avg_balance","hist_max_balance","hist_avg_overdue","hist_avg_emi"],a:VC_STAT_AGGS,w:VC_HIST_WINS,p:true},
    volume:              {m:["months_with_dpd","total_history_months","months_ever_delinquent"],a:["count","sum","ratio","flag"],w:VC_HIST_WINS,p:true},
    payment_behaviour:   {m:["hist_on_time_payment_ratio","hist_missed_payment_count","hist_max_consecutive_on_time","hist_payment_regularity_score"],a:["count","ratio","avg","flag","slope"],w:VC_HIST_WINS,p:true},
    risk_momentum:       {m:["hist_dpd_velocity","hist_dpd_acceleration","hist_overdue_velocity","hist_risk_momentum_score"],a:["velocity","acceleration","trend","slope","difference"],w:[3,6,12,24],p:true},
    streak_features:     {m:["hist_max_consec_clean","hist_max_consec_dpd30","hist_cur_clean_streak","hist_delq_streak_count"],a:["value","max","count","avg","ratio"],w:VC_HIST_WINS,p:true},
    behaviour_trend:     {m:["hist_dpd_trend_3v12","hist_dpd_trend_6v24","hist_overdue_trend_3v12","hist_balance_trend_3v12"],a:["difference","ratio","slope","flag"],w:[12,24],p:true},
    cure_behaviour:      {m:["hist_months_to_cure_dpd30","hist_cure_success_rate","hist_relapse_after_cure","hist_cure_speed_index"],a:["value","avg","min","max","ratio","flag"],w:[12,24,36],p:true},
    roll_rate:           {m:["hist_roll_clean_to_dpd30","hist_roll_dpd30_to_dpd60","hist_net_roll_score","hist_forward_roll_count"],a:["ratio","count","difference","value"],w:[6,12,24],p:true},
    balance_dynamics:    {m:["hist_outstanding_balance","hist_peak_balance","hist_avg_monthly_balance","hist_balance_volatility","hist_balance_cv"],a:VC_DIST_AGGS,w:[6,12,24],p:true},
    delinquency_severity_seq:{m:["hist_dpd_severity_score","hist_max_dpd_streak","hist_dpd_streak_current","hist_cure_rate","hist_relapse_rate"],a:["value","count","ratio","std","flag"],w:[6,12,24],p:true},
    account_stability_idx:{m:["hist_balance_cv","hist_utilization_std","hist_dpd_variance","hist_balance_iqr"],a:["cv","std","variance","iqr","value"],w:[6,12,24],p:false},
    payment_stability:   {m:["hist_dpd_cv","hist_dpd_std_window","hist_payment_swing","hist_composite_stab_score"],a:["value","cv","std","ratio"],w:[6,12,24],p:false},
  };
  for (const [sc,cfg] of Object.entries(TH)) {
    for (const m of cfg.m) {
      for (const w of cfg.w) {
        const wstr = w+'m';
        for (const agg of cfg.a) {
          push(nm('th',sc,m,agg,wstr),'Trade History',sc,m,agg,wstr,'all','all');
          if (cfg.p) for (const lt of VC_LOAN_TYPES) push(nm('th',sc,lt,m,agg,wstr),'Trade History',sc,m,agg,wstr,lt,'all');
        }
      }
    }
  }

  // ══ CROSS PRODUCT (867) ═════════════════════════════════════
  for (const w of [3,6,12,24]) {
    for (const m of ["enq_per_active_trade","trade_per_enquiry","inq_to_account_ratio","inq_count_per_active_lender"])
      for (const agg of ["count","ratio","avg","flag"])
        push(nm('cxp','envol',m,agg,w+'m'),'Cross Product','enquiry_vs_trade',m,agg,w+'m','all','all');
    for (const lt of VC_LOAN_TYPES)
      push(nm('cxp','envol',lt,'ratio',w+'m'),'Cross Product','enquiry_vs_trade','inq_to_account_ratio','ratio',w+'m',lt,'all');
  }
  for (const w of [6,12,24]) {
    for (const m of ["max_inq_vs_max_trade","avg_inq_vs_avg_trade","total_inq_exposure","exposure_increase_ratio"])
      for (const agg of VC_STAT_AGGS.slice(0,8))
        push(nm('cxp','amtcmp',m,agg,w+'m'),'Cross Product','amount_comparison',m,agg,w+'m','all','all');
    for (const m of ["hhi_ratio","enquiry_hhi","trade_hhi","distinct_inq_lenders","distinct_trade_lenders"])
      for (const agg of [...VC_RATIO_AGGS,"avg","max"])
        push(nm('cxp','con',m,agg,w+'m'),'Cross Product','concentration_comparison',m,agg,w+'m','all','all');
  }
  for (const lt of VC_LOAN_TYPES) {
    for (const w of [3,6,12]) {
      for (const m of ["inq_per_trade","new_inq_no_trade","inq_count"])
        for (const agg of ["ratio","count","flag"])
          push(nm('cxp','ltr',lt,m,agg,w+'m'),'Cross Product','loan_type_ratios',m,agg,w+'m',lt,'all');
    }
  }

  // Update subcategory dropdown now that catalog is built
  vcBuildSubDropdown();

  // Apply filters and render
  vcApplyFilters();

  // Update stats
  vcUpdateStats();
  console.log(`Variable Catalog: ${vcCatalog.length} variables generated`);
}

// ─── SUBCATEGORY DROPDOWN ─────────────────────────────────────────
function vcBuildSubDropdown() {
  const type = document.getElementById('vc-dd-type')?.value || 'all';
  const subDd = document.getElementById('vc-dd-sub');
  if (!subDd) return;
  const subs = [...new Set(
    vcCatalog
      .filter(v => type === 'all' || v.type === type)
      .map(v => v.sub_category)
  )].sort();
  subDd.innerHTML = '<option value="all">sub-cat: all</option>' +
    subs.map(s => `<option value="${s}">${s}</option>`).join('');
}

// ─── FILTER LOGIC ────────────────────────────────────────────────
function vcApplyFilters() {
  const type    = document.getElementById('vc-dd-type')?.value    || 'all';
  const agg     = document.getElementById('vc-dd-agg')?.value     || 'all';
  const window  = document.getElementById('vc-dd-window')?.value  || 'all';
  const product = document.getElementById('vc-dd-product')?.value || 'all';
  const query   = (document.getElementById('vc-search')?.value || '').toLowerCase().trim();

  vcFiltered = [...vcCatalog, ...vcCustom].filter(v => {
    if (type    !== 'all' && v.type         !== type)    return false;
    if (agg     !== 'all' && v.agg          !== agg)     return false;
    if (window  !== 'all' && v.window       !== window)  return false;
    if (product !== 'all' && v.product      !== product) return false;
    if (query && !v.name.includes(query))                return false;
    return true;
  });

  vcPage = 0;
  vcRenderCatalog();
  vcUpdateStats();
}

function vcSetTypeTab(type, el) {
  vcActiveType = type;
  document.querySelectorAll('.vc-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  // Sync type dropdown
  const dd = document.getElementById('vc-dd-type');
  if (dd) dd.value = type;
  vcApplyFilters();
}

function vcClearFilters() {
  const typeDd = document.getElementById('vc-dd-type');
  if (typeDd) typeDd.value = 'all';

  ['vc-dd-agg','vc-dd-window','vc-dd-product'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = 'all';
  });

  const searchEl = document.getElementById('vc-search');
  if (searchEl) searchEl.value = '';

  vcActiveType = 'all';
  document.querySelectorAll('.vc-tab').forEach(t => t.classList.remove('active'));
  const allTab = document.querySelector('.vc-tab[data-type="all"]');
  if (allTab) allTab.classList.add('active');
  vcPage = 0;
  vcApplyFilters();
}

// Backward compat stubs
function vcDropdownFilter() { vcApplyFilters(); }
function vcClearDropdowns() { vcClearFilters(); }

// ─── RENDER ──────────────────────────────────────────────────────
function vcRenderCatalog() {
  const wrap = document.getElementById('vc-catalog');
  if (!wrap) return;

  if (vcGenerating) {
    wrap.innerHTML = `<div class="vc-empty"><div class="vc-empty-icon">⏳</div><div class="vc-empty-title">Generating variables...</div><div class="vc-empty-sub">Building the Variable Catalog from the selected templates</div></div>`;
    vcUpdatePagination(0, 0);
    return;
  }

  if (!vcCatalogGenerated && vcCatalog.length === 0 && vcCustom.length === 0) {
    wrap.innerHTML = `<div class="vc-empty"><div class="vc-empty-icon">⚡</div><div class="vc-empty-title">No variables generated yet</div><div class="vc-empty-sub">Click Generate in the filter bar to load the Variable Catalog</div></div>`;
    vcUpdatePagination(0, 0);
    return;
  }

  const total   = vcFiltered.length;
  const pageVars = vcFiltered.slice(vcPage * VC_PAGE_SZ, (vcPage + 1) * VC_PAGE_SZ);
  const totalPages = Math.ceil(total / VC_PAGE_SZ);

  if (!total) {
    wrap.innerHTML = `<div class="vc-empty"><div class="vc-empty-icon">🔍</div><div class="vc-empty-title">No matches</div><div class="vc-empty-sub">Adjust filters or search term</div></div>`;
    vcUpdatePagination(0, 0); return;
  }

  // Group by sub_category for readability
  const groups = {};
  pageVars.forEach(v => {
    const g = v.type + ' › ' + v.sub_category;
    (groups[g] = groups[g] || []).push(v);
  });

  let html = '';

  for (const [group, vars] of Object.entries(groups)) {
    html += `<div class="vc-group-hdr"><span>${escapeHtml(group)}</span><span class="vc-group-cnt">${vars.length}</span></div>`;
    for (const v of vars) {
      const isSel   = vcSelected.has(v.id);
      const inBuild = (typeof builtFeatures !== 'undefined') && builtFeatures.find(f => f.feature_name === v.id);
      let tags = '';
      if (v.agg && v.agg !== 'all')     tags += `<span class="vc-vtag vc-vtag-agg">${escapeHtml(v.agg)}</span>`;
      if (v.window && v.window !== '0m') tags += `<span class="vc-vtag vc-vtag-win">${escapeHtml(v.window)}</span>`;
      if (v.product && v.product !== 'all') tags += `<span class="vc-vtag vc-vtag-seg">${escapeHtml(v.product)}</span>`;
      if (v.secured && v.secured !== 'all') tags += `<span class="vc-vtag vc-vtag-sec">${escapeHtml(v.secured)}</span>`;
      if (v.custom) tags += `<span class="vc-vtag vc-vtag-cust">CUSTOM</span>`;
      if (inBuild)  tags += `<span class="vc-vtag vc-vtag-build">✓ build</span>`;
      const subline = [v.measure, v.sub_category, v.id].filter(Boolean).join(' · ');
      html += `<div class="vc-var-row${isSel?' checked':''}" onclick="vcToggleVar('${v.id}')">
        <div class="vc-chk">${isSel?'✓':''}</div>
        <div class="vc-var-copy">
          <div class="vc-var-name">${escapeHtml(v.name)}</div>
          <div class="vc-var-sub">${escapeHtml(subline)}</div>
        </div>
        <div class="vc-vtags">${tags}</div>
      </div>`;
    }
  }
  wrap.innerHTML = html;
  vcUpdatePagination(vcPage, totalPages);
}

// ─── PAGINATION ──────────────────────────────────────────────────
function vcUpdatePagination(page, totalPages) {
  const pag = document.getElementById('vc-pagination');
  if (!pag) return;
  if (totalPages <= 1) { pag.style.display='none'; return; }
  pag.style.display = 'flex';
  document.getElementById('vc-page-info').textContent = `Page ${page+1} of ${totalPages}`;
  document.getElementById('vc-prev-btn').disabled = page === 0;
  document.getElementById('vc-next-btn').disabled = page >= totalPages - 1;
}
function vcPrevPage() { if (vcPage > 0) { vcPage--; vcRenderCatalog(); } }
function vcNextPage() { vcPage++; vcRenderCatalog(); }

// ─── SELECTION ───────────────────────────────────────────────────
function vcToggleVar(id) {
  if (vcSelected.has(id)) vcSelected.delete(id); else vcSelected.add(id);
  vcRenderCatalog(); vcRenderSelList(); vcUpdateStats();
}
function vcSelectAllShown() {
  const pageVars = vcFiltered.slice(vcPage * VC_PAGE_SZ, (vcPage + 1) * VC_PAGE_SZ);
  pageVars.forEach(v => vcSelected.add(v.id));
  vcRenderCatalog(); vcRenderSelList(); vcUpdateStats();
}
function vcSelectAllFiltered() {
  vcFiltered.forEach(v => vcSelected.add(v.id));
  vcRenderCatalog(); vcRenderSelList(); vcUpdateStats();
  showToast(`☑ ${vcSelected.size.toLocaleString()} variables selected`);
}
function vcSelectAll() { vcSelectAllFiltered(); }
function vcClearAll() {
  vcSelected.clear();
  vcRenderCatalog(); vcRenderSelList(); vcUpdateStats();
}
function vcSelectAllShown(ids) {   // backward compat overload
  if (Array.isArray(ids)) ids.forEach(id => vcSelected.add(id));
  else vcSelectAllShown();
  vcRenderCatalog(); vcRenderSelList(); vcUpdateStats();
}

function vcUpdateStats() {
  const total = vcCatalog.length + vcCustom.length;
  const el = document.getElementById('vc-stat-catalog');
  if (el) el.textContent = (vcCatalogGenerated || total > 0) ? total.toLocaleString() : '—';
  const addBtn = document.getElementById('vc-add-build-btn');
  if (addBtn) addBtn.disabled = !vcSelected.size;
  const footerEl = document.getElementById('vc-footer-info');
  if (footerEl) {
    footerEl.textContent = vcSelected.size
      ? `${vcSelected.size.toLocaleString()} variable${vcSelected.size>1?'s':''} selected — click Add to push into Current Build`
      : vcGenerating
        ? 'Generating catalog...'
        : !vcCatalogGenerated && vcCatalog.length === 0 && vcCustom.length === 0
          ? 'No generated variables yet · click Generate to load catalog'
          : `${total.toLocaleString()} variables · filter → select → Add to Build`;
  }
}

function vcRenderSelList() {
  const wrap = document.getElementById('vc-sel-list');
  if (!wrap) return;
  if (!vcSelected.size) { wrap.innerHTML = `<div class="vc-sel-empty">Nothing selected yet</div>`; return; }
  const all = [...vcCatalog,...vcCustom];
  wrap.innerHTML = [...vcSelected].slice(0,200).map(id => {
    const v = all.find(x => x.id === id); if (!v) return '';
    return `<div class="vc-sel-item">
      <div class="vc-sel-copy">
        <span class="vc-sel-name" title="${escapeHtml(v.name)}">${escapeHtml(v.name)}</span>
        <span class="vc-sel-meta">${escapeHtml([v.type, v.sub_category].filter(Boolean).join(' · '))}</span>
      </div>
      <button class="vc-sel-rem" onclick="vcToggleVar('${v.id}');event.stopPropagation()">✕</button>
    </div>`;
  }).join('') + (vcSelected.size > 200 ? `<div class="vc-sel-more">...and ${vcSelected.size-200} more</div>` : '');
}



// ─── CUSTOM VARIABLE BUILDER ─────────────────────────────────────
function vcToggleCustomWin() {
  const isCustom = document.getElementById('vc-c-win-type').value === 'custom';
  document.getElementById('vc-c-win-preset').style.display   = isCustom ? 'none' : '';
  document.getElementById('vc-c-win-custom').style.display   = isCustom ? '' : 'none';
  document.getElementById('vc-c-win-unit-row').style.display = isCustom ? '' : 'none';
  vcUpdatePreview();
}
function vcGetWinInfo() {
  if (document.getElementById('vc-c-win-type').value === 'custom') {
    const v = document.getElementById('vc-c-win-custom').value;
    const u = document.getElementById('vc-c-win-unit').value;
    return { value:parseInt(v)||0, unit:u, label:`${v||'?'}${u==='days'?'d':'m'}` };
  }
  const v = document.getElementById('vc-c-win-preset').value;
  return { value:parseInt(v), unit:'months', label:`${v}m` };
}

const VC_COND_COLS = ['inquiry_amount','bureau_score','product_type','lender_name','secured_flag','months_ago'];
const VC_COND_OPS  = ['>','>=','<','<=','==','!='];

function vcAddCondition() { vcConditions.push({col:'inquiry_amount',op:'>',val:'',logic:'AND'}); vcRenderConditions(); }
function vcRemoveCondition(i) { vcConditions.splice(i,1); vcRenderConditions(); }
function vcToggleLogic(i) { vcConditions[i].logic = vcConditions[i].logic==='AND'?'OR':'AND'; vcRenderConditions(); }
function vcRenderConditions() {
  const wrap = document.getElementById('vc-cond-list');
  if (!vcConditions.length) { wrap.innerHTML=''; vcUpdatePreview(); return; }
  wrap.innerHTML = vcConditions.map((c,i) => `
    <div class="vc-cond-row">
      ${i===0
        ? `<span class="vc-cond-logic" style="cursor:default;opacity:0.4">IF</span>`
        : `<span class="vc-cond-logic" onclick="vcToggleLogic(${i})">${c.logic}</span>`}
      <select class="vc-cond-sel" onchange="vcConditions[${i}].col=this.value;vcUpdatePreview()">
        ${VC_COND_COLS.map(col=>`<option ${col===c.col?'selected':''}>${col}</option>`).join('')}
      </select>
      <select class="vc-cond-sel vc-cond-op" onchange="vcConditions[${i}].op=this.value;vcUpdatePreview()">
        ${VC_COND_OPS.map(op=>`<option ${op===c.op?'selected':''}>${op}</option>`).join('')}
      </select>
      <input class="vc-cond-inp" value="${c.val}" placeholder="value" oninput="vcConditions[${i}].val=this.value;vcUpdatePreview()">
      <button class="vc-cond-del" onclick="vcRemoveCondition(${i})">✕</button>
    </div>`).join('');
  vcUpdatePreview();
}
function vcUpdatePreview() {
  const agg  = document.getElementById('vc-c-agg')?.value      || 'count';
  const meas = document.getElementById('vc-c-measure')?.value  || 'inq';
  const prod = document.getElementById('vc-c-product')?.value  || 'all';
  const sec  = document.getElementById('vc-c-security')?.value || 'all';
  const thr  = document.getElementById('vc-c-threshold')?.value|| 'none';
  const win  = vcGetWinInfo();
  const parts = [agg, meas];
  if (thr !== 'none') parts.push(thr);
  parts.push('last', win.label);
  if (prod !== 'all') parts.push(prod.toLowerCase());
  if (sec  !== 'all') parts.push(sec);
  vcConditions.filter(c=>c.val).forEach((c,i) => {
    parts.push(`${i>0?c.logic.toLowerCase()+'_':''}${c.col}_${c.op.replace(/[<>=!]/g,m=>({'<':'lt','>':'gt','=':'eq','!':'ne'}[m]||m))}${c.val}`);
  });
  const el = document.getElementById('vc-preview');
  if (el) el.textContent = parts.join('_');
}
function vcAddCustomVar() {
  const agg  = document.getElementById('vc-c-agg').value;
  const meas = document.getElementById('vc-c-measure').value;
  const prod = document.getElementById('vc-c-product').value;
  const sec  = document.getElementById('vc-c-security').value;
  const thr  = document.getElementById('vc-c-threshold').value;
  const win  = vcGetWinInfo();
  const name = document.getElementById('vc-preview').textContent;
  if (!name || name==='—') { showToast('⚠ Fill in the form first'); return; }
  if ([...vcCatalog,...vcCustom].find(v=>v.id===name)) { showToast('⚠ Variable already exists'); return; }

  const thrObj  = VC_CONFIG.threshold.find(t=>t.k===thr)  || VC_CONFIG.threshold[0];
  const measObj = VC_CONFIG.measure.find(m=>m.k===meas)   || { k:meas, col:meas, dtype:'numeric', validAgg:[] };
  const prodObj = VC_CONFIG.product.find(p=>p.k===prod)   || { k:prod, label:prod };
  const secObj  = VC_CONFIG.security.find(s=>s.k===sec)   || { k:sec,  label:sec  };

  vcCustom.push({
    id:name, name, type: vcConditions.length?'custom_condition':'custom_window',
    agg:{ k:agg }, measure:measObj, threshold:thrObj,
    window:win, window2:null,
    product:prodObj, security:secObj,
    conditions:vcConditions.map(c=>({...c})),
    custom:true,
  });
  vcConditions=[]; vcRenderConditions();
  document.getElementById('vc-ec-cust').textContent = vcCustom.length;
  document.getElementById('vc-ec-tot').textContent  = vcCatalog.length+vcCustom.length;
  document.getElementById('vc-summary-box').style.display='block';
  vcRenderCatalog(); vcUpdateStats();
  showToast(`✦ Custom variable added: ${name}`);
}

// ─── 6. ADD SELECTED → CURRENT BUILD ─────────────────────────────
// ─── MANUAL VARS PANEL ───────────────────────────────────────────
// Shows variables built via Stage 1–3 (not from catalog) in vc-right
function vcRenderManualVars() {
  const list  = document.getElementById('vc-manual-list');
  const empty = document.getElementById('vc-manual-empty');
  const count = document.getElementById('vc-manual-count');
  if (!list) return;

  const manual = builtFeatures.filter(f => !f._from_catalog);
  count.textContent = `${manual.length} variable${manual.length !== 1 ? 's' : ''}`;

  if (!manual.length) {
    if (empty) empty.style.display = 'block';
    // Remove all items except empty placeholder
    [...list.querySelectorAll('.vc-manual-item')].forEach(el => el.remove());
    return;
  }
  if (empty) empty.style.display = 'none';

  list.innerHTML = manual.map(f => {
    const domain = f.domain || f.entity || '—';
    const agg    = f.aggregation ? `<span class="vc-manual-tag">${f.aggregation}</span>` : '';
    const win    = f.time_window ? `<span class="vc-manual-tag">${f.time_window.value}${f.time_window.unit === 'day' ? 'd' : 'm'}</span>` : '';
    return `<div class="vc-manual-item">
      <div class="vc-manual-name" title="${f.feature_name}">${f.feature_name}</div>
      ${agg}${win}
      <span class="vc-manual-in-build">✓ built</span>
    </div>`;
  }).join('');
}

function vcCatalogDomain(type) {
  const map = {
    'Enquiry': 'enquiry',
    'Trade': 'trade',
    'Account': 'account',
    'Trade History': 'trade_history',
    'Cross Product': 'cross_product',
  };
  return map[type] || 'enquiry';
}

function vcCatalogEntity(domain) {
  const map = {
    enquiry: 'inquiry',
    trade: 'trade',
    account: 'account',
    trade_history: 'trade_history',
    cross_product: 'cross_product',
  };
  return map[domain] || domain || 'inquiry';
}

function vcCatalogVal(val, fallback = null) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val.k ?? val.value ?? val.label ?? fallback;
  return val;
}

function vcCatalogWindow(win) {
  if (!win) return null;
  if (typeof win === 'string') {
    const match = win.match(/^(\d+)\s*(m|month|months|d|day|days)$/i);
    if (!match) return null;
    return {
      type: 'rolling',
      value: parseInt(match[1], 10),
      unit: match[2].toLowerCase().startsWith('d') ? 'day' : 'month',
    };
  }
  const rawVal = win.value;
  if (rawVal == null || Number.isNaN(Number(rawVal))) return null;
  const rawUnit = String(win.unit || 'month').toLowerCase();
  return {
    type: win.type || 'rolling',
    value: Number(rawVal),
    unit: rawUnit.startsWith('d') ? 'day' : 'month',
  };
}

function vcBuildFeatureName(baseName, domain, product = '', secured = 'all') {
  const base = String(baseName || '').trim();
  if (!base) return base;

  if (domain !== 'enquiry') return base;

  const productTok = String(product || '').trim().toLowerCase();
  const securityTok = secured === 'secured' ? 'sec' : secured === 'unsecured' ? 'unsec' : '';
  const subtypeTok = domain === 'enquiry' ? getIntermediateSubtypeToken() : '';
  const knownProducts = new Set(Object.keys(INTERMEDIATE_PRODUCT_SUBTYPES).map(key => key.toLowerCase()));
  let suffix = '';

  if (base.toLowerCase().startsWith('inq_')) {
    const match = base.match(/^inq_([a-z0-9]+)(?:_(sec|unsec))?(.*)$/i);
    if (match && knownProducts.has(String(match[1] || '').toLowerCase())) suffix = match[3] || '';
    else suffix = base.slice(3);
  }

  if (!productTok && !securityTok && !subtypeTok) return base;

  const escapedSubtype = subtypeTok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (subtypeTok && new RegExp(`(?:^|_)${escapedSubtype}(?:_|$)`, 'i').test(base) && !productTok && !securityTok) return base;

  const nextName = base.toLowerCase().startsWith('inq_')
    ? ['inq', productTok, securityTok, subtypeTok, suffix.replace(/^_+/, '')].filter(Boolean).join('_')
    : `${base}${subtypeTok ? `_${subtypeTok}` : ''}`;

  return nextName
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function vcBuildEffectiveCatalogVar(v) {
  const domain = vcCatalogDomain(v.type);
  const baseProduct = vcCatalogVal(v.product);
  const baseSecured = vcCatalogVal(v.security ?? v.secured, 'all');
  const selectedProduct = domain === 'enquiry' ? getSelectedIntermediateProductForBuild() : '';
  const selectedSubtype = domain === 'enquiry' ? getSelectedIntermediateSubtypeForBuild() : '';
  const selectedSecured = state.filters.secured !== 'all' ? state.filters.secured : '';
  const finalProduct = domain === 'enquiry' ? (selectedProduct || baseProduct) : baseProduct;
  const finalSecured = domain === 'enquiry'
    ? (selectedSecured || baseSecured || 'all')
    : (baseSecured || 'all');
  const featureName = vcBuildFeatureName(v.name || v.id, domain, finalProduct, finalSecured);

  const nextVar = {
    ...v,
    name: featureName,
    product: finalProduct || v.product,
    security: finalSecured,
    secured: finalSecured,
  };

  if (selectedSubtype) {
    nextVar.inquiry_purpose = selectedSubtype;
    nextVar.product_subtype = selectedSubtype;
  }

  return {
    domain,
    featureName,
    product: finalProduct,
    secured: finalSecured,
    subtype: selectedSubtype,
    variable: nextVar,
  };
}

async function vcAddToBuild() {
  if (!vcSelected.size) { showToast('Select at least 1 variable'); return; }
  const all = [...vcCatalog, ...vcCustom];
  let added=0, skipped=0;

  vcSelected.forEach(id => {
    const v = all.find(x=>x.id===id); if (!v) return;
    const effective = vcBuildEffectiveCatalogVar(v);
    if (builtFeatures.find(f=>f.feature_name===effective.featureName)) { skipped++; return; }
    const measure = vcCatalogVal(v.measure);
    const aggregation = vcCatalogVal(v.agg);
    const timeWindow = vcCatalogWindow(v.window);
    const filters = {
      product:  effective.product && effective.product !== 'all' ? [effective.product] : [],
      secured:  effective.secured && effective.secured !== 'all' ? effective.secured : 'all',
      lender:[], tradeFlags:[]
    };
    if (effective.domain === 'enquiry' && effective.subtype) {
      filters.inquiry_purpose = [effective.subtype];
      filters.product_subtype = [effective.subtype];
    }

    builtFeatures.push({
      bureau:        state.bureau || '—',
      entity:        vcCatalogEntity(effective.domain),
      domain:        effective.domain,
      variable_type: v.type || 'Other',
      feature_name:  effective.featureName,
      sub_category:  vcGetSub(v),
      measure:       measure || 'inq',
      aggregation:   aggregation || null,
      _from_catalog: true,
      _source:       'catalog',
      _vc:           v,
      _vc_var:       effective.variable,
      time_window:   timeWindow,
      filters,
      ...(effective.domain === 'enquiry' && (effective.product || effective.subtype) ? {
        intermediate_variable: {
          ...(effective.product ? { product: effective.product } : {}),
          ...(effective.subtype ? { sub_category: effective.subtype } : {}),
        },
      } : {}),
    });
    added++;
  });

  renderBuildList(); updateHdrCount();
  document.getElementById('status-bar').classList.add('show');
  vcRenderCatalog();
  showToast(`✅ Added ${added} variable${added>1?'s':''}${skipped?` · ${skipped} already in build`:''}`);
  if (added>0) {
    closeVarCatalog();
    await _saveFeaturesToDB();  // must await — async function
  }
}

function vcGetSub(v) {
  if (v.sub_category) return v.sub_category;
  const tmap = { recency:'recency', count_total:'volume', gap:'gap', velocity:'velocity', mix:'mix', concentration:'concentration' };
  if (tmap[v.type]) return tmap[v.type];
  const amap = { count:'volume', sum:'amount', avg:'amount', max:'amount', min:'amount', nunique:'concentration', ratio:'mix' };
  return amap[vcCatalogVal(v.agg)] || 'volume';
}

// ─── 7. PYTHON SNIPPET — object → code (no name parsing) ─────────
function vcBuildSnippet(v) {
  const fn  = v.name;
  const ind = '    ';
  const win = vcCatalogWindow(v.window);
  const win2 = vcCatalogWindow(v.window2);
  const aggK = vcCatalogVal(v.agg);
  const measureKey = vcCatalogVal(v.measure);
  const measureCol = typeof v.measure === 'object' ? v.measure.col : measureKey;
  const product = vcCatalogVal(v.product);
  const security = vcCatalogVal(v.security ?? v.secured);
  const inquiryPurpose = vcCatalogVal(v.inquiry_purpose ?? v.product_subtype);

  // Build filter mask from stored dimension objects
  const filters = [];

  // Time window
  if (win) {
    const col = win.unit === 'day' ? `df['days_ago']` : `df['months_ago']`;
    filters.push(`(${col} <= ${win.value})`);
  }
  // Threshold (first-class dimension — direct from stored object, no parsing)
  if (v.threshold && v.threshold.k !== 'none' && v.threshold.col) {
    filters.push(`(df['${v.threshold.col}'] ${v.threshold.op} ${v.threshold.val})`);
  }
  // Product
  if (product && product !== 'all') {
    filters.push(`(df['product_type'] == '${product}')`);
  }
  // Security
  if (security && security !== 'all') {
    filters.push(`(df['secured_flag'] == '${security}')`);
  }
  // Inquiry subtype
  if (inquiryPurpose && inquiryPurpose !== 'all') {
    filters.push(`(df['inquiry_purpose'] == '${inquiryPurpose}')`);
  }
  // Custom conditions
  if (v.conditions?.length) {
    v.conditions.filter(c=>c.val).forEach((c,i) => {
      const val  = isNaN(c.val)?`'${c.val}'`:c.val;
      const expr = `(df['${c.col}'] ${c.op} ${val})`;
      if (i===0) filters.push(expr);
      else {
        const prev = filters[filters.length-1];
        filters[filters.length-1] = c.logic==='OR' ? `(${prev} | ${expr})` : `(${prev} & ${expr})`;
      }
    });
  }

  const masked = filters.length
    ? `_m  = (${filters.join(')\n' + ind + '        & (')})\n${ind}_df = df[_m]`
    : `_df = df`;

  // Aggregation line — reads v.agg.k, v.measure.col directly
  let aggLine;
  const col  = measureCol;

  if (v.type === 'recency') {
    aggLine = `result['${fn}'] = df.groupby('customer_id')['months_ago'].min().round(0).astype('Int64')`;
  } else if (v.type === 'count_total') {
    aggLine = `result['${fn}'] = df.groupby('customer_id').size()`;
  } else if (v.type === 'gap') {
    aggLine = [`_gap = (`,`${ind}        _df.sort_values('enquiry_date')`,`${ind}        .groupby('customer_id')['enquiry_date']`,`${ind}        .apply(lambda x: x.diff().dt.days.mean())`,`${ind}    )`,`${ind}result['${fn}'] = _gap`].join('\n');
  } else if (v.type === 'velocity' && win && win2) {
    const c1 = win.unit === 'day' ? 'days_ago' : 'months_ago';
    const c2 = win2.unit === 'day' ? 'days_ago' : 'months_ago';
    aggLine = [`_cs = df[df['${c1}'] <= ${win.value}].groupby('customer_id').size()`,`${ind}_cl = df[df['${c2}'] <= ${win2.value}].groupby('customer_id').size()`,`${ind}result['${fn}'] = _cs.subtract(_cl, fill_value=0)`].join('\n');
  } else if (v.type === 'mix') {
    const wf = win ? `df[df['${win.unit === 'day' ? 'days_ago' : 'months_ago'}'] <= ${win.value}]` : 'df';
    aggLine = [`_sec = ${wf}[${wf}['secured_flag']=='secured'].groupby('customer_id').size()`,`${ind}_uns = ${wf}[${wf}['secured_flag']=='unsecured'].groupby('customer_id').size()`,`${ind}result['${fn}'] = (_sec / _uns.replace(0, np.nan)).round(4)`].join('\n');
  } else if (v.type === 'concentration' && col) {
    aggLine = `result['${fn}'] = _df.groupby('customer_id')['${col}'].nunique()`;
  } else if (!col || aggK === 'count') {
    aggLine = `result['${fn}'] = _df.groupby('customer_id').size()`;
  } else if (aggK === 'ratio') {
    aggLine = [`_num = _df.groupby('customer_id').size()`,`${ind}_den = df.groupby('customer_id').size()`,`${ind}result['${fn}'] = (_num / _den.replace(0, np.nan)).round(4)`].join('\n');
  } else {
    const fnMap = { sum:'sum', avg:'mean', max:'max', min:'min' };
    aggLine = `result['${fn}'] = _df.groupby('customer_id')['${col}'].${fnMap[aggK]||'sum'}()`;
  }

  // Dimension comment (human-readable; dimensions stored in object, not in name)
  const dimStr = [
    aggK                                    ? `agg=${aggK}`              : null,
    measureKey                              ? `meas=${measureKey}`       : null,
    v.threshold && v.threshold.k!=='none'   ? `thr=${v.threshold.k}`     : null,
    win                                     ? `win=${win.value}${win.unit === 'day' ? 'd' : 'm'}` : null,
    product && product !== 'all'            ? `prod=${product}`          : null,
    security && security !== 'all'          ? `sec=${security}`          : null,
  ].filter(Boolean).join(', ');

  return [
    `${ind}# ── ${fn}`,
    `${ind}# [${dimStr}]`,
    `${ind}${masked}`,
    `${ind}${aggLine}`,
    `${ind}result['${fn}'] = result.get('${fn}', pd.Series(dtype=float)).reindex(result.index).fillna(0)`,
  ].join('\n');
}

// ─── 7. DSL NATURAL LANGUAGE PARSER ─────────────────────────────
// Step 14 from spec: User types natural language → auto-generates variable name
// Syntax:  {agg}(inquiry) last {window} [where product={P}] [and amount>{N}]
// Example: count(inquiry) last 6m where product=PL and amount>50000
//          → count_inq_amt_gt_50000_last_6m_pl
function vcParseDSL(query) {
  if (!query || !query.trim()) return null;
  const q = query.toLowerCase().trim();

  // Extract aggregation
  const aggMatch = q.match(/^(count|sum|avg|average|max|min)\s*\(/);
  const aggRaw   = aggMatch?.[1] || 'count';
  const aggMap   = { count:'count', sum:'sum', avg:'avg', average:'avg', max:'max', min:'min' };
  const agg      = aggMap[aggRaw] || 'count';

  // Extract measure
  const measMatch = q.match(/\((inquiry|inq)\s*(amount|amt)?\)/);
  const meas      = measMatch?.[2] ? 'inq_amt' : 'inq';

  // Extract window
  const winMatch  = q.match(/last\s*(\d+)\s*(m|months?|d|days?)/);
  const winVal    = winMatch?.[1] || '6';
  const winUnit   = winMatch?.[2]?.startsWith('d') ? 'd' : 'm';
  const winLabel  = `${winVal}${winUnit}`;

  // Extract product
  const prodMatch = q.match(/product\s*[=:]\s*(pl|cc|hl|al|bl|gl|all)/i);
  const prod      = prodMatch?.[1]?.toUpperCase() || 'all';

  // Extract security
  const secMatch  = q.match(/(secured|unsecured)/i);
  const sec       = secMatch?.[1]?.toLowerCase() || 'all';

  // Extract amount threshold
  const amtMatch  = q.match(/amount\s*[>]\s*(\d[\d,]*)/);
  let   thr       = 'none';
  if (amtMatch) {
    const amtVal = parseInt(amtMatch[1].replace(/,/g,''));
    if      (amtVal >= 50000)  thr = 'gt_50000';
    else if (amtVal >= 10000)  thr = 'gt_10000';
  }

  // Build name using the spec template
  const parts = [agg, meas];
  if (thr !== 'none') parts.push(thr);
  parts.push('last', winLabel);
  if (prod !== 'all') parts.push(prod.toLowerCase());
  if (sec  !== 'all') parts.push(sec);
  const name = parts.join('_');

  return {
    name,
    parsed: { agg, measure:meas, threshold:thr, window:winLabel, product:prod, security:sec },
    matchInCatalog: [...vcCatalog, ...vcCustom].find(v => v.id === name) || null
  };
}

// DSL input handler — called from the DSL input field in the UI
function vcHandleDSL() {
  const inp  = document.getElementById('vc-dsl-input');
  const outEl = document.getElementById('vc-dsl-result');
  if (!inp || !outEl) return;
  const result = vcParseDSL(inp.value);
  if (!result) { outEl.innerHTML = ''; return; }

  const inCatalog = result.matchInCatalog;
  const isSelected = vcSelected.has(result.name);

  const statusColor = inCatalog ? 'var(--success)' : 'var(--warn)';
  const statusIcon  = inCatalog ? '✓' : '⚠';
  const statusText  = inCatalog
    ? (isSelected ? 'In catalog · already selected' : 'Found in catalog')
    : 'Not in catalog — add as custom';

  outEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg);border-radius:8px;border:1px solid var(--border);">
      <span style="font-size:16px;">${statusIcon}</span>
      <div style="flex:1;">
        <div style="font-family:var(--mono);font-size:11px;font-weight:700;color:var(--text);">${result.name}</div>
        <div style="font-size:10px;color:${statusColor};margin-top:1px;">${statusText}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">
          agg: ${result.parsed.agg} · meas: ${result.parsed.measure} · win: ${result.parsed.window}
          ${result.parsed.product!=='all'?` · prod: ${result.parsed.product}`:''}
          ${result.parsed.security!=='all'?` · sec: ${result.parsed.security}`:''}
          ${result.parsed.threshold!=='none'?` · thr: ${result.parsed.threshold}`:''}
        </div>
      </div>
      ${inCatalog && !isSelected
        ? `<button style="font-size:10px;font-weight:700;padding:4px 10px;border-radius:6px;border:1px solid var(--tradeh);background:var(--tradeh-light);color:var(--tradeh);cursor:pointer;" onclick="vcSelectFromDSL('${result.name}')">+ Select</button>`
        : inCatalog && isSelected
          ? `<span style="font-size:10px;color:var(--success);font-weight:700;">✓ Selected</span>`
          : `<button style="font-size:10px;font-weight:700;padding:4px 10px;border-radius:6px;border:1px solid var(--warn);background:var(--warn-light);color:var(--warn);cursor:pointer;" onclick="vcAddFromDSL('${result.name}')">+ Add Custom</button>`
      }
    </div>`;
}
function vcSelectFromDSL(name) {
  vcSelected.add(name);
  vcHandleDSL();
  vcRenderCatalog(); vcRenderSelList(); vcUpdateStats();
  showToast(`✓ Selected: ${name}`);
}
function vcAddFromDSL(name) {
  const dslResult = vcParseDSL(document.getElementById('vc-dsl-input')?.value || '');
  if (!dslResult) return;
  const p = dslResult.parsed;
  const thrObj  = VC_CONFIG.threshold.find(t=>t.k===p.threshold)  || VC_CONFIG.threshold[0];
  const measObj = VC_CONFIG.measure.find(m=>m.k===p.measure)      || VC_CONFIG.measure[0];
  const prodObj = VC_CONFIG.product.find(pr=>pr.k===p.product)    || VC_CONFIG.product[0];
  const secObj  = VC_CONFIG.security.find(s=>s.k===p.security)    || VC_CONFIG.security[0];
  const winVal  = parseInt(p.window);
  const winUnit = p.window.endsWith('d') ? 'days' : 'months';
  const winObj  = { k:p.window, value:winVal, unit:winUnit, label:p.window };
  vcCustom.push({ id:name, name, type:'custom_dsl', agg:{k:p.agg}, measure:measObj, threshold:thrObj,
    window:winObj, window2:null, product:prodObj, security:secObj, conditions:[], custom:true });
  vcSelected.add(name);
  document.getElementById('vc-ec-cust').textContent = vcCustom.length;
  document.getElementById('vc-ec-tot').textContent  = vcCatalog.length + vcCustom.length;
  document.getElementById('vc-summary-box').style.display = 'block';
  vcHandleDSL();
  vcRenderCatalog(); vcRenderSelList(); vcUpdateStats();
  showToast(`✦ DSL variable added: ${name}`);
}

// ══════════════════════════════════════════
// SAVE & RUN
// ══════════════════════════════════════════

// ── Shared: save builtFeatures to DB ──────────────────────────────────────
async function _saveFeaturesToDB(features) {
  const list = features || builtFeatures;
  if (!list.length) return { saved: 0, failed: 0 };
  // Try to get buildName from state or DOM
  const _buildName = state.buildName
    || document.getElementById('build-name')?.value?.trim()
    || document.getElementById('crumb-build')?.textContent?.trim();
  if (!_buildName || _buildName === '—') {
    showToast('⚠ Build name missing — enter build name first');
    return { saved:0, failed:0 };
  }
  if (!state.buildName) state.buildName = _buildName;

  // Always update localStorage immediately
  _saveLocalBuild({
    name: state.buildName,
    owner: getCurrentOwner(),
    bureau: state.bureau,
    file_type: state.fileType,
    created_at: new Date().toISOString(),
    variable_count: list.length,
    variables: list.map(f => ({ name: f.feature_name || f.name, variable_type: f.variable_type || 'Other' })),
  });

  let saved = 0, failed = 0;
  for (const feature of list) {
    // time_window: keep original object in config_json, also store string for DB column
    const tw = feature.time_window
      ? (typeof feature.time_window === 'object' ? feature.time_window.value + 'm' : feature.time_window)
      : null;

    const vtype = feature.variable_type
      || (feature.domain === 'enquiry' ? 'Enquiry'
        : feature.domain === 'trade' ? 'Trade'
        : feature.domain === 'trade_history' ? 'Trade History'
        : feature.domain === 'account' ? 'Account' : 'Other');

    // Build complete variable object — preserve ALL fields from buildSchema()
    const varObj = sanitizeVariableForSave(feature, {
      name:          feature.feature_name || feature.name,
      variable_type: vtype,
      sub_category:  feature.sub_category || feature.sub || null,
      measure:       feature.measure || feature.agg?.k || null,
      aggregation:   feature.aggregation || feature.agg?.k || null,
      time_window:   feature.time_window || null,
      source:        feature._source || feature.source || 'wizard',
      bureau:        state.bureau || feature.bureau || null,
      file_type:     state.fileType || feature.file_type || 'Batch',
    });

    // Always store filters (even if empty — so feature engine knows nothing was filtered)
    if (!varObj.filters) {
      varObj.filters = { product: [], secured: 'all', lender: [] };
    }
    // For trade/trade_history: ensure trade_scope stored
    if ((varObj.domain === 'trade' || varObj.domain === 'trade_history') && !varObj.trade_scope) {
      varObj.trade_scope = {
        loanType:  varObj.portfolio_scope?.loan_type  || [],
        secured:   varObj.portfolio_scope?.secured_flag || 'all',
        status:    varObj.portfolio_scope?.account_status || 'all',
        ownership: varObj.portfolio_scope?.ownership_type || 'all',
      };
    }

    const payload = {
      build_name:      state.buildName,
      owner:           getCurrentOwner(),
      bureau:          state.bureau || null,
      file_type:       state.fileType || 'Batch',
      file_identifier: state.fileType === 'single' ? (state.customDate || null) : null,
      variable:        varObj,
    };
    try {
      await fetchJSON(buildApiUrl('/addVariable'), { method: 'POST', body: JSON.stringify(payload) });
      saved++;
    } catch (e) {
      console.error('Save failed for ' + (feature.feature_name || 'variable') + ':', e);
      failed++;
    }
  }
  if (saved > 0) loadBuilds();
  return { saved, failed };
}

async function saveBuild() {
  if (!builtFeatures.length) { showToast("No variables to save."); return; }
  const _bn = state.buildName
    || document.getElementById('build-name')?.value?.trim()
    || document.getElementById('crumb-build')?.textContent?.trim();
  if (!_bn || _bn === '—') { showToast('⚠ Build name missing — enter build name first'); return; }
  if (!state.buildName) state.buildName = _bn;

  const { saved, failed } = await _saveFeaturesToDB();

  if (saved > 0) {
    showToast('✓ ' + saved + ' variable' + (saved > 1 ? 's' : '') + " saved to build '" + state.buildName + "'");
    // Set activeBuild so dashboard shows it in previous build section immediately
    activeBuild = {
      name:       state.buildName,
      bureau:     state.bureau,
      file_type:  state.fileType,
      created_at: new Date().toISOString(),
      variable_count: builtFeatures.length,
      variables_by_type: {},
    };
    const pyCode = generatePythonCode(builtFeatures, state.buildName, state.bureau, state.fileType);
    const blob = new Blob([pyCode], { type: 'text/x-python' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (state.buildName.replace(/\s+/g,'_')) + '_features.py';
    a.click();
  }
  if (failed > 0) showToast('⚠ ' + failed + ' variable' + (failed > 1 ? 's' : '') + ' failed to save');

  if (saved === 0) showToast('âš  Save at least one variable before downloading code');
}

// ══════════════════════════════════════════
// PYTHON BATCH CODE GENERATOR
// ══════════════════════════════════════════
function generatePythonCode(features, buildName, bureau, fileType) {
  const now      = new Date().toISOString();
  const safeName = buildName.replace(/\s+/g, '_');
  const exportType = fileType || 'Batch';
  const usageTail = exportType === 'Single FID' ? " \\\n      --file-id  CUSTOMER_001" : "";

  // ── Partition by domain ──────────────────────────────────────────
  const enqFeats  = features.filter(f => f.domain === 'enquiry');
  const trdFeats  = features.filter(f => f.domain === 'trade');
  const trhFeats  = features.filter(f => f.domain === 'trade_history');
  const accFeats  = features.filter(f => f.domain === 'account');

  // ── Helper: build a pandas filter expr string ────────────────────
  function filterExpr(f, dfVar) {
    const conditions = [];
    if (f.time_window) {
      conditions.push(`${dfVar}['months_ago'] <= ${f.time_window.value}`);
    }
    if (f.filters && f.filters.product && f.filters.product.length) {
      const pl = f.filters.product.map(p => `'${p}'`).join(', ');
      conditions.push(`${dfVar}['product_type'].isin([${pl}])`);
    }
    if (f.portfolio_scope) {
      if (f.portfolio_scope.loan_type && f.portfolio_scope.loan_type.length) {
        const lt = f.portfolio_scope.loan_type.map(x => `'${x}'`).join(', ');
        conditions.push(`${dfVar}['loan_type'].isin([${lt}])`);
      }
      if (f.portfolio_scope.secured_flag && f.portfolio_scope.secured_flag !== 'all') {
        conditions.push(`${dfVar}['secured_flag'] == '${f.portfolio_scope.secured_flag}'`);
      }
      if (f.portfolio_scope.account_status && f.portfolio_scope.account_status !== 'all') {
        conditions.push(`${dfVar}['account_status'] == '${f.portfolio_scope.account_status}'`);
      }
    }
    if (!conditions.length) return dfVar;
    return `${dfVar}[${conditions.join(' & ')}]`;
  }

  // ── Enquiry feature snippet generator ───────────────────────────
  function enqSnippet(f) {
    const fx  = filterExpr(f, 'enq');
    const fn  = f.feature_name;
    const agg = f.aggregation;
    const sub = f.sub_category;
    let lines = [`    # ${fn}  [domain=enquiry, sub=${sub}, agg=${agg}]`];

    if (sub === 'volume') {
      lines.push(`    result['${fn}'] = ${fx}.groupby('customer_id')['enquiry_date'].count()`);

    } else if (sub === 'amount') {
      const aggFn = agg === 'avg' ? 'mean' : agg === 'max' ? 'max' : agg === 'sum' ? 'sum' : 'mean';
      lines.push(`    result['${fn}'] = ${fx}.groupby('customer_id')['inquiry_amount'].${aggFn}()`);

    } else if (sub === 'recency') {
      lines.push(`    result['${fn}'] = enq.groupby('customer_id')['months_ago'].min().round(0).astype('Int64')`);

    } else if (sub === 'gap') {
      lines.push(`    _gap_tmp = (`);
      lines.push(`        ${fx}`);
      lines.push(`        .sort_values('enquiry_date')`);
      lines.push(`        .groupby('customer_id')['enquiry_date']`);
      lines.push(`        .apply(lambda x: x.diff().dt.days.mean())`);
      lines.push(`    )`);
      lines.push(`    result['${fn}'] = _gap_tmp`);

    } else if (sub === 'velocity') {
      if (f.time_windows && f.time_windows.length === 2) {
        const w1 = f.time_windows[0].value;
        const w2 = f.time_windows[1].value;
        lines.push(`    _v1 = enq[enq['months_ago'] <= ${w1}].groupby('customer_id')['enquiry_date'].count()`);
        lines.push(`    _v2 = enq[enq['months_ago'] <= ${w2}].groupby('customer_id')['enquiry_date'].count()`);
        lines.push(`    result['${fn}'] = _v1.subtract(_v2, fill_value=0)`);
      } else {
        lines.push(`    # TODO: velocity window pair not resolved for ${fn}`);
      }

    } else if (sub === 'mix') {
      lines.push(`    _sec_cnt = enq[enq['secured_flag'] == 'secured'].groupby('customer_id')['enquiry_date'].count()`);
      lines.push(`    _uns_cnt = enq[enq['secured_flag'] == 'unsecured'].groupby('customer_id')['enquiry_date'].count()`);
      lines.push(`    result['${fn}'] = (_sec_cnt / _uns_cnt.replace(0, np.nan)).round(4)`);

    } else if (sub === 'concentration') {
      lines.push(`    result['${fn}'] = ${fx}.groupby('customer_id')['lender_name'].nunique()`);

    } else {
      lines.push(`    # TODO: sub_category '${sub}' not auto-mapped — implement manually`);
    }

    lines.push(`    result['${fn}'] = result.get('${fn}', pd.Series(dtype=float)).reindex(result.index).fillna(0)`);
    return lines.join('\n');
  }

  // ── Trade feature snippet generator ─────────────────────────────
  function trdSnippet(f, dfVar) {
    const fx  = filterExpr(f, dfVar);
    const fn  = f.feature_name;
    const agg = f.aggregation;
    const sub = f.sub_category;
    let lines = [`    # ${fn}  [domain=${f.domain}, sub=${sub}, agg=${agg}]`];

    const COL_MAP = {
      dpd: 'max_dpd', balance: 'outstanding_balance', limit: 'credit_limit',
      overdue: 'overdue_amount', emi: 'emi_amount', utilization: 'utilization_pct',
    };
    const rawCol = COL_MAP[f.measure] || f.measure || 'outstanding_balance';

    if (sub === 'recency') {
      lines.push(`    result['${fn}'] = ${dfVar}.groupby('customer_id')['months_ago'].min().round(0).astype('Int64')`);
    } else if (sub === 'trend' || sub === 'velocity') {
      if (f.comparison_windows) {
        const rw = parseInt(f.comparison_windows.recent_window);
        const pw = parseInt(f.comparison_windows.prior_window);
        lines.push(`    _tr1 = ${dfVar}[${dfVar}['months_ago'] <= ${rw}].groupby('customer_id')['${rawCol}'].mean()`);
        lines.push(`    _tr2 = ${dfVar}[${dfVar}['months_ago'] <= ${pw}].groupby('customer_id')['${rawCol}'].mean()`);
        if (agg === 'growth_rate') {
          lines.push(`    result['${fn}'] = ((_tr1 - _tr2) / _tr2.replace(0, np.nan)).round(4)`);
        } else {
          lines.push(`    result['${fn}'] = (_tr1 - _tr2).round(4)`);
        }
      } else {
        lines.push(`    # TODO: trend windows not resolved for ${fn}`);
      }
    } else if (sub === 'balance_dynamics') {
      const aggFn = agg === 'avg' ? 'mean' : agg === 'max' ? 'max' : agg === 'min' ? 'min' : 'sum';
      lines.push(`    result['${fn}'] = ${fx}.groupby('customer_id')['${rawCol}'].${aggFn}()`);
    } else {
      const aggMap = { count:'count', sum:'sum', max:'max', min:'min', avg:'mean', mean:'mean', ratio:'mean' };
      const aggFn = aggMap[agg] || 'sum';
      const col = ['count','nunique'].includes(agg) ? `'${rawCol}'` : `'${rawCol}'`;
      if (agg === 'count') {
        lines.push(`    result['${fn}'] = ${fx}.groupby('customer_id')[${col}].count()`);
      } else {
        lines.push(`    result['${fn}'] = ${fx}.groupby('customer_id')[${col}].${aggFn}()`);
      }
    }
    lines.push(`    result['${fn}'] = result.get('${fn}', pd.Series(dtype=float)).reindex(result.index).fillna(0)`);
    return lines.join('\n');
  }

  // ── Account feature snippet generator ───────────────────────────
  function accSnippet(f) {
    const fn  = f.feature_name;
    const agg = f.aggregation;
    const sub = f.sub_category;
    let lines = [`    # ${fn}  [domain=account, sub=${sub}, agg=${agg}]`];

    if (sub === 'recency') {
      lines.push(`    result['${fn}'] = acc.groupby('customer_id')['months_ago'].min().round(0).astype('Int64')`);
    } else if (sub === 'utilization') {
      lines.push(`    acc['_util'] = acc['outstanding_balance'] / acc['sanction_amount'].replace(0, np.nan)`);
      if (agg === 'avg') {
        lines.push(`    result['${fn}'] = acc.groupby('customer_id')['_util'].mean().round(4)`);
      } else if (agg === 'max') {
        lines.push(`    result['${fn}'] = acc.groupby('customer_id')['_util'].max().round(4)`);
      } else {
        lines.push(`    result['${fn}'] = acc.groupby('customer_id')['_util'].mean().round(4)`);
      }
    } else if (sub === 'concentration') {
      lines.push(`    result['${fn}'] = acc.groupby('customer_id')['lender_name'].nunique()`);
    } else if (sub === 'vintage') {
      lines.push(`    result['${fn}'] = acc.groupby('customer_id')['months_since_open'].${agg === 'avg' ? 'mean' : agg === 'max' ? 'max' : 'min'}().round(0).astype('Int64')`);
    } else {
      const col = f.measure || 'outstanding_balance';
      const aggMap = { count:'count', sum:'sum', max:'max', min:'min', avg:'mean', mean:'mean' };
      const aggFn = aggMap[agg] || 'sum';
      lines.push(`    result['${fn}'] = acc.groupby('customer_id')['${col}'].${aggFn}()`);
    }
    lines.push(`    result['${fn}'] = result.get('${fn}', pd.Series(dtype=float)).reindex(result.index).fillna(0)`);
    return lines.join('\n');
  }

  // ─────────────────────────────────────────────────────────────────
  // ASSEMBLE PYTHON FILE
  // ─────────────────────────────────────────────────────────────────
  let py = `"""
╔══════════════════════════════════════════════════════════════════╗
║  AUTO-GENERATED BATCH FEATURE SCRIPT                            ║
║  Build       : ${buildName}
║  Bureau      : ${bureau}
║  File Type   : Batch
║  Generated   : ${now}
║  Variables   : ${features.length} total
║                  Enquiry      : ${enqFeats.length}
║                  Trade        : ${trdFeats.length}
║                  Trade Hist   : ${trhFeats.length}
║                  Account      : ${accFeats.length}
╚══════════════════════════════════════════════════════════════════╝

USAGE
-----
  python ${safeName}_features.py \\
      --enquiry  enquiry_data.csv \\
      --trade    trade_data.csv \\
      --output   ${safeName}_features.csv \\
      --date     2024-03-31${usageTail}

EXPECTED INPUT COLUMNS
----------------------
  enquiry  : customer_id, enquiry_date, product_type,
             inquiry_amount, lender_name, secured_flag
  trade    : customer_id, report_date, loan_type, secured_flag,
             outstanding_balance, credit_limit, max_dpd,
             overdue_amount, emi_amount, account_status
  account  : customer_id, account_open_date, loan_type,
             outstanding_balance, sanction_amount, lender_name
"""

import argparse
import pandas as pd
import numpy as np
from pathlib import Path


# ══════════════════════════════════════════════════════════════════
# ENQUIRY FEATURES  (${enqFeats.length} variable${enqFeats.length !== 1 ? 's' : ''})
# ══════════════════════════════════════════════════════════════════
def compute_enquiry_features(enq: pd.DataFrame, reporting_date: pd.Timestamp) -> pd.DataFrame:
    """Compute enquiry-domain features.

    Parameters
    ----------
    enq : pd.DataFrame
        Raw enquiry rows — one row per enquiry event.
    reporting_date : pd.Timestamp
        Reference date for rolling time windows.

    Returns
    -------
    pd.DataFrame  (customer_id × feature columns)
    """
    enq = enq.copy()
    enq['enquiry_date'] = pd.to_datetime(enq['enquiry_date'])
    enq['months_ago']   = ((reporting_date - enq['enquiry_date']).dt.days / 30.44).round(2)

    # Seed result with all unique customer_ids
    result = pd.DataFrame(index=enq['customer_id'].unique())
    result.index.name = 'customer_id'

`;

  for (const f of enqFeats) {
    // Catalog-added vars have the original vc var object — use purpose-built snippet
    if (f._from_catalog && f._vc_var) {
      py += vcBuildSnippet(f._vc_var, 'df') + '\n\n';
    } else {
      py += enqSnippet(f) + '\n\n';
    }
  }

  if (!enqFeats.length) {
    py += `    # No enquiry variables in this build\n`;
  }

  py += `    return result.reset_index()


`;

  // ── Trade block ───────────────────────────────────────────────────
  py += `# ══════════════════════════════════════════════════════════════════
# TRADE FEATURES  (${trdFeats.length} variable${trdFeats.length !== 1 ? 's' : ''})
# ══════════════════════════════════════════════════════════════════
def compute_trade_features(trd: pd.DataFrame, reporting_date: pd.Timestamp) -> pd.DataFrame:
    """Compute trade-domain features.

    Parameters
    ----------
    trd : pd.DataFrame
        Raw trade / tradeline rows.
    reporting_date : pd.Timestamp
        Reference date for rolling time windows.

    Returns
    -------
    pd.DataFrame  (customer_id × feature columns)
    """
    trd = trd.copy()
    trd['report_date'] = pd.to_datetime(trd['report_date'])
    trd['months_ago']  = ((reporting_date - trd['report_date']).dt.days / 30.44).round(2)

    result = pd.DataFrame(index=trd['customer_id'].unique())
    result.index.name = 'customer_id'

`;

  for (const f of trdFeats) {
    py += trdSnippet(f, 'trd') + '\n\n';
  }
  for (const f of trhFeats) {
    py += trdSnippet(f, 'trd') + '\n\n';
  }

  if (!trdFeats.length && !trhFeats.length) {
    py += `    # No trade variables in this build\n`;
  }

  py += `    return result.reset_index()


`;

  // ── Account block ─────────────────────────────────────────────────
  py += `# ══════════════════════════════════════════════════════════════════
# ACCOUNT FEATURES  (${accFeats.length} variable${accFeats.length !== 1 ? 's' : ''})
# ══════════════════════════════════════════════════════════════════
def compute_account_features(acc: pd.DataFrame, reporting_date: pd.Timestamp) -> pd.DataFrame:
    """Compute account-snapshot-domain features.

    Parameters
    ----------
    acc : pd.DataFrame
        Raw account snapshot rows.
    reporting_date : pd.Timestamp
        Reference date for recency calculations.

    Returns
    -------
    pd.DataFrame  (customer_id × feature columns)
    """
    acc = acc.copy()
    acc['account_open_date'] = pd.to_datetime(acc['account_open_date'])
    acc['months_since_open'] = ((reporting_date - acc['account_open_date']).dt.days / 30.44).round(2)
    acc['months_ago']        = acc['months_since_open']   # alias

    result = pd.DataFrame(index=acc['customer_id'].unique())
    result.index.name = 'customer_id'

`;

  for (const f of accFeats) {
    py += accSnippet(f) + '\n\n';
  }

  if (!accFeats.length) {
    py += `    # No account variables in this build\n`;
  }

  py += `    return result.reset_index()


`;

  // ── Master pipeline ────────────────────────────────────────────────
  py += `# ══════════════════════════════════════════════════════════════════
# MASTER PIPELINE
# ══════════════════════════════════════════════════════════════════
def run_pipeline(
    enquiry_path: str | None  = None,
    trade_path:   str | None  = None,
    account_path: str | None  = None,
    output_path:  str         = "${safeName}_features.csv",
    reporting_date            = None,
    chunk_size:   int         = 50_000,
) -> pd.DataFrame:
    """
    Load input files, compute all domain features, merge on customer_id,
    and write output to CSV.

    Parameters
    ----------
    enquiry_path   : Path to enquiry CSV / Parquet (None to skip).
    trade_path     : Path to trade CSV / Parquet (None to skip).
    account_path   : Path to account CSV / Parquet (None to skip).
    output_path    : Destination for merged output CSV.
    reporting_date : Reference date string 'YYYY-MM-DD' (default: today).
    chunk_size     : Rows per chunk when reading CSVs.
    """
    rdate = pd.Timestamp(reporting_date) if reporting_date else pd.Timestamp.today().normalize()
    print(f"[pipeline] Reporting date : {rdate.date()}")

    def _load(path: str) -> pd.DataFrame:
        ext = Path(path).suffix.lower()
        if ext == '.parquet':
            return pd.read_parquet(path)
        chunks = list(pd.read_csv(path, chunksize=chunk_size))
        return pd.concat(chunks, ignore_index=True)

    frames = []

    if enquiry_path:
        print(f"[enquiry]  Loading  → {enquiry_path}")
        enq_raw = _load(enquiry_path)
        enq_feat = compute_enquiry_features(enq_raw, rdate)
        print(f"[enquiry]  Features → {enq_feat.shape[1]-1} cols, {len(enq_feat):,} customers")
        frames.append(enq_feat)

    if trade_path:
        print(f"[trade]    Loading  → {trade_path}")
        trd_raw = _load(trade_path)
        trd_feat = compute_trade_features(trd_raw, rdate)
        print(f"[trade]    Features → {trd_feat.shape[1]-1} cols, {len(trd_feat):,} customers")
        frames.append(trd_feat)

    if account_path:
        print(f"[account]  Loading  → {account_path}")
        acc_raw = _load(account_path)
        acc_feat = compute_account_features(acc_raw, rdate)
        print(f"[account]  Features → {acc_feat.shape[1]-1} cols, {len(acc_feat):,} customers")
        frames.append(acc_feat)

    if not frames:
        print("[pipeline] No input files provided — nothing to compute.")
        return pd.DataFrame()

    # Outer-join on customer_id so all customers appear
    merged = frames[0]
    for f in frames[1:]:
        merged = merged.merge(f, on='customer_id', how='outer')

    merged = merged.fillna(0)
    merged.to_csv(output_path, index=False)
    print(f"[pipeline] Output    → {output_path}  ({len(merged):,} rows × {merged.shape[1]} cols)")
    return merged


# ══════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ══════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Batch feature computation — Build: ${buildName}"
    )
    parser.add_argument('--enquiry',  default=None,  help='Path to enquiry input file (.csv/.parquet)')
    parser.add_argument('--trade',    default=None,  help='Path to trade input file (.csv/.parquet)')
    parser.add_argument('--account',  default=None,  help='Path to account input file (.csv/.parquet)')
    parser.add_argument('--output',   default='${safeName}_features.csv', help='Output CSV path')
    parser.add_argument('--date',     default=None,  help='Reporting date YYYY-MM-DD (default: today)')
    parser.add_argument('--chunk',    type=int, default=50_000, help='CSV chunk size (default 50000)')
    args = parser.parse_args()

    run_pipeline(
        enquiry_path  = args.enquiry,
        trade_path    = args.trade,
        account_path  = args.account,
        output_path   = args.output,
        reporting_date = args.date,
        chunk_size    = args.chunk,
    )
`;

  return py;
}
function runBatch() {
  if (!builtFeatures.length) { showToast("Add variables before running batch."); return; }
  const inq=builtFeatures.filter(f=>f.domain==='enquiry').length;
  const trd=builtFeatures.filter(f=>f.domain==='trade').length;
  const trh=builtFeatures.filter(f=>f.domain==='trade_history').length;
  const rec=builtFeatures.filter(f=>f.sub_category==='recency').length;
  const trnd=builtFeatures.filter(f=>f.sub_category==='trend').length;
  const bal=builtFeatures.filter(f=>f.sub_category==='balance_dynamics').length;
  const ratio=builtFeatures.filter(f=>f.aggregation==='ratio').length;
  showToast(`🚀 Batch queued: ${state.buildName} · ${inq} inq + ${trd} trd + ${trh} trh (${rec} recency · ${trnd} trend · ${bal} balance · ${ratio} ratio)`);
}

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════
function syntaxHL(json) {
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,match=>{
    if(/^"/.test(match)){ if(/:$/.test(match)) return `<span class="jk">${match}</span>`; return `<span class="jv-s">${match}</span>`; }
    if(/true|false/.test(match)) return `<span class="jv-b">${match}</span>`;
    return `<span class="jv-n">${match}</span>`;
  });
}
function showToast(msg) {
  const t=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

// ══════════════════════════════════════════════════════════════════
// CROSS-MAPPING ENGINE
// ══════════════════════════════════════════════════════════════════

let xmapSelected = new Set();     // indices of selected features
let xmapActiveTab = 'matrix';

// Relationship type definitions
const REL_TYPES = {
  redundant:      { icon:'🔴', label:'Highly Redundant',   css:'rel-redundant',   desc:'Same column + same aggregation + overlapping window. Strong candidate for removal.' },
  same_col:       { icon:'🟠', label:'Shared Column',      css:'rel-same-col',    desc:'Computed from the same raw data column. Correlated by definition.' },
  same_win:       { icon:'🔵', label:'Same Window',        css:'rel-same-win',    desc:'Same time window applied to different measures. Consistent temporal scope.' },
  same_agg:       { icon:'🟡', label:'Same Aggregation',   css:'rel-same-agg',    desc:'Same aggregation method on different columns or windows.' },
  trend_base:     { icon:'🟣', label:'Trend + Base',       css:'rel-trend-base',  desc:'One feature is a trend/velocity of the other. Natural pair — consider keeping both.' },
  complementary:  { icon:'🟢', label:'Complementary',      css:'rel-complementary',desc:'Different domain, aggregation, and window. Low correlation expected — safe to combine.' },
  none:           { icon:'⬜', label:'Independent',        css:'rel-none',        desc:'No detected overlap in column, aggregation, or window.' },
};

// ── OPEN / CLOSE ──────────────────────────────────────────────────
function openCrossMap() {
  if (!builtFeatures.length) { showToast('Add at least 2 features first.'); return; }
  document.getElementById('screen-builder').style.display = 'none';
  document.getElementById('screen-crossmap').style.display = 'block';
  xmapSelected = new Set(builtFeatures.map((_,i) => i)); // select all by default
  buildCrossMapUI();
}

function closeCrossMap() {
  document.getElementById('screen-crossmap').style.display = 'none';
  document.getElementById('screen-builder').style.display = 'block';
}

// ── MAIN BUILD ────────────────────────────────────────────────────
function buildCrossMapUI() {
  buildXmapSummaryBar();
  buildXmapFeatureCheckboxes();
  buildXmapLegend();
  refreshXmapContent();
  buildXmapInsights();
  buildCompositeSelects();
  buildSuggestedComposites();
}

function refreshXmapContent() {
  const tab = xmapActiveTab;
  if (tab === 'matrix')    buildXmapMatrix();
  if (tab === 'column')    buildColumnGroups();
  if (tab === 'window')    buildWindowChart();
  if (tab === 'redundancy') buildRedundancyList();
  if (tab === 'composite') updateCompositePreview();
}

// ── SUMMARY BAR ───────────────────────────────────────────────────
function buildXmapSummaryBar() {
  const feats = builtFeatures;
  const cols = new Set(feats.map(f => getFeatureCol(f)));
  const pairs = computeAllPairs();
  const redundant = pairs.filter(p => p.rel === 'redundant').length;
  const leakHigh = feats.filter(f => (f._meta && f._meta.leakage_risk === 'high')).length;
  const domainCount = { enquiry: feats.filter(f => f.domain==='enquiry').length, trade: feats.filter(f => f.domain==='trade').length };
  const stats = [
    { val: feats.length,        label: 'Total Features',    color:'var(--accent)' },
    { val: cols.size,           label: 'Unique Columns',    color:'var(--trade)' },
    { val: pairs.length,        label: 'Feature Pairs',     color:'var(--text2)' },
    { val: redundant,           label: 'Redundant Pairs',   color: redundant > 0 ? 'var(--danger)' : 'var(--success)' },
    { val: leakHigh,            label: 'High Leakage Risk', color: leakHigh > 0 ? 'var(--warn)' : 'var(--success)' },
  ];
  document.getElementById('xmap-summary-bar').innerHTML = stats.map(s =>
    `<div class="xmap-stat"><div class="xmap-stat-val" style="color:${s.color}">${s.val}</div><div class="xmap-stat-label">${s.label}</div></div>`
  ).join('');
}

// ── FEATURE CHECKBOXES ────────────────────────────────────────────
function buildXmapFeatureCheckboxes() {
  const container = document.getElementById('xmap-feat-checkboxes');
  container.innerHTML = builtFeatures.map((f, i) => {
    const isSel = xmapSelected.has(i);
    const isTrade = f.domain === 'trade';
    const isTradeHist = f.domain === 'trade_history';
    const dotColor = isTradeHist ? 'var(--tradeh)' : isTrade ? 'var(--trade)' : 'var(--accent)';
    return `<label style="display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:7px;cursor:pointer;transition:background 0.12s;${isSel?'background:var(--bg)':''}" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='${isSel?'var(--bg)':'transparent'}'">
      <input type="checkbox" ${isSel?'checked':''} onchange="xmapToggle(${i})" style="width:13px;height:13px;cursor:pointer;accent-color:var(--accent);">
      <span style="width:7px;height:7px;border-radius:50%;background:${dotColor};flex-shrink:0;"></span>
      <span style="font-size:10px;font-weight:600;color:var(--text);font-family:var(--mono);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${f.feature_name}">${f.feature_name}</span>
    </label>`;
  }).join('');
}

function xmapToggle(i) {
  if (xmapSelected.has(i)) xmapSelected.delete(i);
  else xmapSelected.add(i);
  buildXmapSummaryBar();
  refreshXmapContent();
  buildXmapInsights();
}

function xmapSelectAll()  { xmapSelected = new Set(builtFeatures.map((_,i)=>i)); buildXmapFeatureCheckboxes(); buildXmapSummaryBar(); refreshXmapContent(); }
function xmapSelectNone() { xmapSelected = new Set(); buildXmapFeatureCheckboxes(); buildXmapSummaryBar(); refreshXmapContent(); }

// ── RELATIONSHIP COMPUTATION ──────────────────────────────────────
function getFeatureCol(f) {
  const reg = MASTER_REGISTRY[f.measure];
  if (reg && reg.col && reg.col !== 'N/A') return reg.col;
  // Fallback from schema
  if (f.date_column) return f.date_column;
  const sc = f.domain === 'trade' ? TRD_SCHEMA : f.domain === 'trade_history' ? TRD_HIST_SCHEMA : f.domain === 'account' ? ACT_SCHEMA : INQ_SCHEMA;
  const subSc = sc[f.sub_category];
  if (subSc && subSc.measures && subSc.measures[f.measure]) return subSc.measures[f.measure].col || 'unknown';
  return 'unknown';
}

function getFeatureWindow(f) {
  if (f.time_window) return f.time_window.value;
  if (f.time_windows && f.time_windows.length) return f.time_windows[0].value || parseInt(f.time_windows[0]);
  if (f.rolling_window) return parseInt(f.rolling_window);
  if (f.transition_window) return parseInt(f.transition_window);
  return null;
}

function classifyRelationship(a, b) {
  const colA = getFeatureCol(a), colB = getFeatureCol(b);
  const winA = getFeatureWindow(a), winB = getFeatureWindow(b);
  const aggA = a.aggregation, aggB = b.aggregation;
  const subA = a.sub_category, subB = b.sub_category;

  const sameCol = colA !== 'unknown' && colA === colB && colA !== 'multiple';
  const sameAgg = aggA && aggB && aggA === aggB;
  const sameWin = winA && winB && winA === winB;
  const overlapping = winA && winB && winA !== winB && (Math.min(winA,winB) / Math.max(winA,winB) > 0.5);

  // Trend + Base pair detection
  const trendSubs = ['trend','velocity','balance_dynamics','transition_matrix'];
  const isTrendBase = (trendSubs.includes(subA) && !trendSubs.includes(subB) && sameCol) ||
                      (trendSubs.includes(subB) && !trendSubs.includes(subA) && sameCol);

  if (sameCol && sameAgg && (sameWin || overlapping)) return 'redundant';
  if (isTrendBase) return 'trend_base';
  if (sameCol) return 'same_col';
  if (sameWin && sameAgg) return 'same_win';
  if (sameAgg) return 'same_agg';
  if (!sameCol && !sameWin) return 'complementary';
  return 'none';
}

function computeAllPairs() {
  const sel = [...xmapSelected];
  const pairs = [];
  for (let i = 0; i < sel.length; i++) {
    for (let j = i + 1; j < sel.length; j++) {
      const a = builtFeatures[sel[i]], b = builtFeatures[sel[j]];
      const rel = classifyRelationship(a, b);
      pairs.push({ i: sel[i], j: sel[j], a, b, rel });
    }
  }
  return pairs;
}

// ── MATRIX TAB ────────────────────────────────────────────────────
function buildXmapMatrix() {
  const sel = [...xmapSelected];
  const container = document.getElementById('xmap-matrix-container');
  if (sel.length < 2) {
    container.innerHTML = '<div style="text-align:center;color:var(--text3);padding:40px;font-size:13px;">Select at least 2 features to build the matrix.</div>';
    return;
  }
  if (sel.length > 15) {
    container.innerHTML = '<div style="text-align:center;color:var(--text3);padding:24px;font-size:13px;">⚠ Select ≤15 features for the matrix view. Use tabs for larger builds.</div>';
    return;
  }

  const feats = sel.map(i => builtFeatures[i]);
  const shortName = f => f.feature_name.length > 14 ? f.feature_name.slice(0,13)+'…' : f.feature_name;

  let html = `<table class="xmap-matrix"><thead><tr><th style="background:var(--white);border:none;"></th>`;
  feats.forEach(f => { html += `<th title="${f.feature_name}" style="writing-mode:vertical-rl;text-orientation:mixed;padding:6px 3px;min-width:30px;">${shortName(f)}</th>`; });
  html += `</tr></thead><tbody>`;
  feats.forEach((fa, ai) => {
    html += `<tr><td style="padding:4px 8px;font-size:9px;font-weight:600;color:var(--text2);white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis;background:var(--bg);border:1px solid var(--border);" title="${fa.feature_name}">${shortName(fa)}</td>`;
    feats.forEach((fb, bi) => {
      if (ai === bi) {
        html += `<td class="diag" style="background:var(--bg);border:1px solid var(--border);"><div class="cell-icon" style="background:repeating-linear-gradient(45deg,var(--border),var(--border) 1px,transparent 1px,transparent 6px);width:40px;height:40px;"></div></td>`;
      } else {
        const rel = classifyRelationship(fa, fb);
        const rt = REL_TYPES[rel] || REL_TYPES.none;
        html += `<td class="${rt.css}" onclick="showMatrixCellDetail(${sel[ai]},${sel[bi]},'${rel}')" title="${rt.label}: ${fa.feature_name} × ${fb.feature_name}"><div class="cell-icon">${rt.icon}</div></td>`;
      }
    });
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}

function showMatrixCellDetail(ai, bi, rel) {
  const a = builtFeatures[ai], b = builtFeatures[bi];
  const rt = REL_TYPES[rel] || REL_TYPES.none;
  const colA = getFeatureCol(a), colB = getFeatureCol(b);
  const winA = getFeatureWindow(a), winB = getFeatureWindow(b);
  const detail = document.getElementById('xmap-cell-detail');
  detail.style.display = 'block';
  detail.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <span style="font-size:20px;">${rt.icon}</span>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text);">${rt.label}</div>
        <div style="font-size:11px;color:var(--text3);">${rt.desc}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div style="padding:10px;background:var(--bg);border-radius:8px;font-size:11px;">
        <div style="font-weight:700;color:var(--text);margin-bottom:4px;font-family:var(--mono);">${a.feature_name}</div>
        <div style="color:var(--text3);">Domain: <strong>${a.domain}</strong></div>
        <div style="color:var(--text3);">Column: <strong>${colA}</strong></div>
        <div style="color:var(--text3);">Agg: <strong>${a.aggregation||'—'}</strong></div>
        <div style="color:var(--text3);">Window: <strong>${winA ? winA+'m' : '—'}</strong></div>
      </div>
      <div style="padding:10px;background:var(--bg);border-radius:8px;font-size:11px;">
        <div style="font-weight:700;color:var(--text);margin-bottom:4px;font-family:var(--mono);">${b.feature_name}</div>
        <div style="color:var(--text3);">Domain: <strong>${b.domain}</strong></div>
        <div style="color:var(--text3);">Column: <strong>${colB}</strong></div>
        <div style="color:var(--text3);">Agg: <strong>${b.aggregation||'—'}</strong></div>
        <div style="color:var(--text3);">Window: <strong>${winB ? winB+'m' : '—'}</strong></div>
      </div>
    </div>
    ${rel === 'redundant' ? `<div style="margin-top:10px;padding:8px 12px;background:rgba(220,38,38,0.06);border-radius:7px;font-size:11px;color:var(--danger);">⚠ Consider removing one of these features — they are likely to produce highly correlated model inputs.</div>` : ''}
    ${rel === 'trend_base' ? `<div style="margin-top:10px;padding:8px 12px;background:rgba(124,58,237,0.06);border-radius:7px;font-size:11px;color:#7c3aed;">💡 These features are complementary — the trend adds directional signal beyond the base level. Both are often worth keeping.</div>` : ''}
    ${rel === 'complementary' ? `<div style="margin-top:10px;padding:8px 12px;background:rgba(5,150,105,0.06);border-radius:7px;font-size:11px;color:var(--success);">✅ These features measure different aspects of borrower behaviour. Good combination for a model feature set.</div>` : ''}
  `;
}

// ── COLUMN GROUPS TAB ─────────────────────────────────────────────
function buildColumnGroups() {
  const sel = [...xmapSelected];
  const groups = {};
  sel.forEach(i => {
    const f = builtFeatures[i];
    const col = getFeatureCol(f);
    if (!groups[col]) groups[col] = [];
    groups[col].push(f);
  });
  const sorted = Object.entries(groups).sort((a,b) => b[1].length - a[1].length);
  const container = document.getElementById('xmap-column-groups');
  const colors = ['var(--accent)','var(--trade)','var(--trade2)','var(--warn)','#7c3aed','var(--danger)'];
  container.innerHTML = sorted.map(([col, feats], ci) => {
    const colColor = colors[ci % colors.length];
    return `<div class="col-group-card">
      <div class="col-group-header">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="width:9px;height:9px;border-radius:50%;background:${colColor};flex-shrink:0;"></span>
          <span style="font-family:var(--mono);">${col}</span>
        </div>
        <span style="font-size:10px;font-weight:700;color:var(--text3);">${feats.length} feature${feats.length>1?'s':''}</span>
      </div>
      <div class="col-group-body">
        ${feats.map(f => `<div class="col-feat-tag" style="border-color:${colColor}20;color:${colColor};" title="${f.feature_name}">${f.feature_name.length>22?f.feature_name.slice(0,21)+'…':f.feature_name}</div>`).join('')}
        ${feats.length > 1 ? `<div style="font-size:10px;color:var(--text3);width:100%;margin-top:4px;">⚠ ${feats.length} features share this column — expect correlation</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ── WINDOW ALIGNMENT TAB ──────────────────────────────────────────
function buildWindowChart() {
  const sel = [...xmapSelected];
  const MAX_WIN = 36;
  const COLORS = ['#5b4cf5','#0f766e','#2563eb','#d97706','#7c3aed','#dc2626','#059669','#0891b2'];
  
  const featsWithWin = sel.map(i => ({ f: builtFeatures[i], win: getFeatureWindow(builtFeatures[i]) }))
    .filter(x => x.win).sort((a,b) => a.win - b.win);

  const alerts = [];
  // Detect duplicate windows
  const winCounts = {};
  featsWithWin.forEach(x => { winCounts[x.win] = (winCounts[x.win]||0) + 1; });
  Object.entries(winCounts).filter(([w,c]) => c > 2).forEach(([w,c]) => {
    alerts.push({ type:'warn', msg:`${c} features share a ${w}m window — consider diversifying time horizons` });
  });
  // Detect missing short/long windows
  const wins = featsWithWin.map(x => x.win);
  if (wins.length > 0 && !wins.some(w => w <= 3)) alerts.push({ type:'info', msg:'No short-horizon features (≤3m). Consider adding 1m or 3m features for early-warning signals.' });
  if (wins.length > 0 && !wins.some(w => w >= 24)) alerts.push({ type:'info', msg:'No long-horizon features (≥24m). Consider adding 24m or 36m features for cycle/vintage effects.' });

  const chartHTML = featsWithWin.map((x, ci) => {
    const pct = (x.win / MAX_WIN) * 100;
    const color = COLORS[ci % COLORS.length];
    const shortName = x.f.feature_name.length > 26 ? x.f.feature_name.slice(0,25)+'…' : x.f.feature_name;
    return `<div class="win-row">
      <div class="win-label" title="${x.f.feature_name}">${shortName}</div>
      <div class="win-bar-wrap">
        <div class="win-bar" style="width:${pct}%;background:${color};opacity:0.85;">${x.win}m</div>
      </div>
    </div>`;
  }).join('') || '<div style="color:var(--text3);font-size:12px;padding:20px;text-align:center;">No windowed features in selection</div>';

  document.getElementById('xmap-window-chart').innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:0 0 6px;border-bottom:1px solid var(--border);">
      <span style="font-size:10px;font-weight:600;color:var(--text3);">←</span>
      ${[1,3,6,12,24,36].map(w => `<div style="font-size:9px;color:var(--text3);position:absolute;left:calc(170px + ${(w/MAX_WIN)*100}% * 0.65);">${w}m</div>`).join('')}
    </div>
    ${chartHTML}
  `;

  document.getElementById('xmap-window-alerts').innerHTML = alerts.map(a =>
    `<div class="insight-row ${a.type==='warn'?'insight-warn':'insight-info'}">${a.type==='warn'?'⚠':'ℹ'} ${a.msg}</div>`
  ).join('');
}

// ── REDUNDANCY TAB ────────────────────────────────────────────────
function buildRedundancyList() {
  const pairs = computeAllPairs().filter(p => p.rel === 'redundant' || p.rel === 'same_col');
  const container = document.getElementById('xmap-redundancy-list');
  if (!pairs.length) {
    container.innerHTML = `<div style="text-align:center;padding:32px;color:var(--success);font-size:14px;font-weight:600;">✅ No redundant feature pairs detected</div>`;
    return;
  }
  container.innerHTML = pairs.map(p => {
    const rt = REL_TYPES[p.rel];
    const winA = getFeatureWindow(p.a), winB = getFeatureWindow(p.b);
    let reason = '';
    if (p.rel === 'redundant') reason = `Both use <strong>${getFeatureCol(p.a)}</strong> with <strong>${p.a.aggregation}</strong> aggregation on overlapping windows (${winA||'?'}m / ${winB||'?'}m).`;
    else reason = `Both computed from <strong>${getFeatureCol(p.a)}</strong>. Different aggregations, but high base correlation expected.`;
    return `<div class="red-item">
      <div class="red-pair">
        ${rt.icon}
        <span style="font-family:var(--mono);color:var(--text);">${p.a.feature_name}</span>
        <span style="color:var(--text3);">×</span>
        <span style="font-family:var(--mono);color:var(--text);">${p.b.feature_name}</span>
      </div>
      <div class="red-reason">${reason}</div>
      <div class="red-actions">
        <button class="red-action-btn" onclick="removeRedundantFeature(${p.i})">Remove #${p.i+1}</button>
        <button class="red-action-btn" onclick="removeRedundantFeature(${p.j})">Remove #${p.j+1}</button>
        <button class="red-action-btn" style="color:var(--text3);" onclick="xmapDeselect(${p.i},${p.j})">Deselect pair</button>
      </div>
    </div>`;
  }).join('');
}

function removeRedundantFeature(idx) {
  builtFeatures.splice(idx, 1);
  window.currentFeatures = builtFeatures.map(f => ({ feature_name: f.feature_name }));
  renderBuildList(); updateHdrCount();
  xmapSelected = new Set(builtFeatures.map((_,i)=>i));
  buildCrossMapUI();
  showToast('Feature removed from build');
}

function xmapDeselect(i, j) {
  xmapSelected.delete(i); xmapSelected.delete(j);
  buildXmapFeatureCheckboxes(); refreshXmapContent();
}

// ── COMPOSITE BUILDER TAB ─────────────────────────────────────────
function buildCompositeSelects() {
  const opts = builtFeatures.map((f,i) => `<option value="${i}">${f.feature_name}</option>`).join('');
  ['comp-feat-a','comp-feat-b'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<option value="">— Select Feature —</option>' + opts;
  });
}

function updateCompositePreview() {
  const ai = document.getElementById('comp-feat-a').value;
  const bi = document.getElementById('comp-feat-b').value;
  const op = document.getElementById('comp-op').value;
  const prev = document.getElementById('comp-preview');

  if (ai === '' || bi === '') { prev.innerHTML = '(select features to preview)'; return; }
  const a = builtFeatures[ai], b = builtFeatures[bi];
  const opLabel = { divide:'÷', subtract:'−', add:'+', multiply:'×', delta_pct:'Δ%' }[op];
  const opDesc = { divide:'Ratio: A / B', subtract:'Difference: A − B', add:'Sum: A + B', multiply:'Product: A × B', delta_pct:'Relative change: (A − B) / B × 100' }[op];
  const autoName = buildCompositeName(a, b, op);
  document.getElementById('comp-name-override').value = autoName;

  prev.innerHTML =
    `<span style="color:#7cb9e8;">feature_a</span>: ${a.feature_name}\n` +
    `<span style="color:#7cb9e8;">feature_b</span>: ${b.feature_name}\n` +
    `<span style="color:#7cb9e8;">operation</span>: ${opLabel} — ${opDesc}\n` +
    `<span style="color:#f8c8a0;">output</span>: ${autoName}`;
}

function buildCompositeName(a, b, op) {
  const ta = (MASTER_REGISTRY[a.measure] || {}).token || a.measure;
  const tb = (MASTER_REGISTRY[b.measure] || {}).token || b.measure;
  const opTok = { divide:'by', subtract:'minus', add:'plus', multiply:'x', delta_pct:'dpct' }[op];
  return `comp_${ta}_${opTok}_${tb}`.slice(0,55);
}

function buildSuggestedComposites() {
  const container = document.getElementById('xmap-suggested-composites');
  if (!container) return;
  const sugg = detectSuggestedComposites();
  if (!sugg.length) { container.innerHTML = ''; return; }
  container.innerHTML = `
    <div class="sdiv" style="margin-top:0;">💡 Suggested Composites</div>
    ${sugg.map(s => `<div class="sugg-card" onclick="applyCompositeTemplate(${s.ai},${s.bi},'${s.op}')">
      <div class="sugg-card-name">${s.name}</div>
      <div class="sugg-card-desc">${s.desc}</div>
      <div class="sugg-card-formula">${s.formula}</div>
    </div>`).join('')}
  `;
}

function detectSuggestedComposites() {
  const suggestions = [];
  const feats = builtFeatures;
  feats.forEach((a, ai) => {
    feats.forEach((b, bi) => {
      if (ai >= bi) return;
      const tagA = (MASTER_REGISTRY[a.measure] || {}).tags || [];
      const tagB = (MASTER_REGISTRY[b.measure] || {}).tags || [];
      // Overdue / Balance → Overdue ratio
      if (tagA.includes('delinquency') && (tagB.includes('balance') || tagB.includes('exposure'))) {
        suggestions.push({ ai, bi, op:'divide', name:`overdue_ratio: ${a.feature_name} ÷ ${b.feature_name}`, desc:'Overdue as % of outstanding — a powerful stress signal', formula:`Overdue / Balance (rolling)` });
      }
      // Recency + Trend = pair signal
      if (tagA.includes('recency') && tagB.includes('trend')) {
        suggestions.push({ ai, bi, op:'subtract', name:`stress_combo: ${a.feature_name} − ${b.feature_name}`, desc:'Recency minus trend: time-elapsed adjusted for trajectory', formula:`months_since_event − trend_slope` });
      }
      // Balance + Sanction → utilisation
      if ((a.measure||'').includes('balance') && (b.measure||'').includes('sanction')) {
        suggestions.push({ ai, bi, op:'divide', name:`util_composite: ${a.feature_name} ÷ ${b.feature_name}`, desc:'Utilisation proxy: outstanding / sanction', formula:`Balance / Sanction_Amount` });
      }
    });
  });
  return suggestions.slice(0, 5);
}

function applyCompositeTemplate(ai, bi, op) {
  document.getElementById('comp-feat-a').value = ai;
  document.getElementById('comp-feat-b').value = bi;
  document.getElementById('comp-op').value = op;
  updateCompositePreview();
  xmapTab('composite', document.querySelector('.xmap-tab:last-child'));
}

function applyCompositeFeatures() {
  const ai = document.getElementById('comp-feat-a').value;
  const bi = document.getElementById('comp-feat-b').value;
  const op = document.getElementById('comp-op').value;
  const nameOverride = document.getElementById('comp-name-override').value.trim();
  if (ai === '' || bi === '') { showToast('Select both features to create composite.'); return; }
  const a = builtFeatures[ai], b = builtFeatures[bi];
  const opLabel = { divide:'÷', subtract:'−', add:'+', multiply:'×', delta_pct:'Δ%' }[op];
  const compositeName = nameOverride || buildCompositeName(a, b, op);
  const compositeSchema = {
    bureau: a.bureau || b.bureau,
    entity: 'composite',
    domain: a.domain === b.domain ? a.domain : 'mixed',
    feature_name: compositeName,
    sub_category: 'composite',
    measure: 'derived',
    aggregation: op,
    composite_definition: {
      type: 'binary_operation',
      operation: op,
      formula: `${a.feature_name} ${opLabel} ${b.feature_name}`,
      feature_a: a.feature_name,
      feature_b: b.feature_name,
      null_handling: 'propagate',
    },
    _meta: {
      feature_tags: ['derived'],
      leakage_risk: (a._meta?.leakage_risk === 'high' || b._meta?.leakage_risk === 'high') ? 'high' : 'low',
      generated_at: new Date().toISOString().slice(0,16).replace('T',' '),
    }
  };
  builtFeatures.push(compositeSchema);
  window.currentFeatures = builtFeatures.map(f => ({ feature_name: f.feature_name }));
  renderBuildList(); updateHdrCount();
  xmapSelected.add(builtFeatures.length - 1);
  buildCrossMapUI();
  showToast(`✓ Composite added: ${compositeName}`);
}

// ── LEGEND ────────────────────────────────────────────────────────
function buildXmapLegend() {
  const el = document.getElementById('xmap-legend');
  el.innerHTML = Object.values(REL_TYPES).map(rt =>
    `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <div style="width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;">${rt.icon}</div>
      <span style="font-size:11px;font-weight:600;color:var(--text2);">${rt.label}</span>
    </div>`
  ).join('');
}

// ── INSIGHTS ──────────────────────────────────────────────────────
function buildXmapInsights() {
  const sel = [...xmapSelected];
  const feats = sel.map(i => builtFeatures[i]);
  const pairs = computeAllPairs();
  const insights = [];

  const redundant = pairs.filter(p => p.rel === 'redundant');
  const complementary = pairs.filter(p => p.rel === 'complementary');
  const sameCol = pairs.filter(p => p.rel === 'same_col' || p.rel === 'redundant');
  const leakHigh = feats.filter(f => f._meta?.leakage_risk === 'high');
  const trendFeats = feats.filter(f => f.sub_category === 'trend' || f.sub_category === 'balance_dynamics' || f.sub_category === 'velocity');
  const recencyFeats = feats.filter(f => f.sub_category === 'recency');

  if (redundant.length) insights.push({ type:'alert', msg:`${redundant.length} redundant pair${redundant.length>1?'s':''} detected — review in the Redundancy tab` });
  if (leakHigh.length) insights.push({ type:'warn', msg:`${leakHigh.length} feature${leakHigh.length>1?'s':''} have high leakage risk. Validate target variable alignment.` });
  if (trendFeats.length > 0 && recencyFeats.length > 0) insights.push({ type:'good', msg:`Build has both trend (${trendFeats.length}) and recency (${recencyFeats.length}) features — good temporal diversity.` });
  if (complementary.length > redundant.length) insights.push({ type:'good', msg:`${complementary.length} complementary pairs — diverse feature set expected.` });
  const cols = new Set(feats.map(f => getFeatureCol(f)));
  if (cols.size < feats.length * 0.5) insights.push({ type:'warn', msg:`Many features share source columns (${cols.size} unique from ${feats.length} features). High multicollinearity risk.` });
  const wins = feats.map(f => getFeatureWindow(f)).filter(Boolean);
  const uniqueWins = new Set(wins);
  if (uniqueWins.size >= 3) insights.push({ type:'good', msg:`${uniqueWins.size} distinct time windows — good multi-horizon coverage.` });
  if (!feats.some(f => f.sub_category === 'ratio' || f.aggregation === 'ratio')) insights.push({ type:'info', msg:`No ratio features in build. Consider adding a utilisation or delinquency ratio.` });
  // Account-specific insights
  const distFeats = feats.filter(f => f.sub_category === 'distribution');
  const concFeats = feats.filter(f => f.sub_category === 'concentration');
  const vintFeats = feats.filter(f => f.sub_category === 'vintage' || f.sub_category === 'credit_age');
  const utilFeats = feats.filter(f => f.sub_category === 'utilization' || f.sub_category === 'utilization_profile');
  if (distFeats.length > 0) insights.push({ type:'good', msg:`${distFeats.length} distribution feature${distFeats.length>1?'s':''} (std/cv/skew) — captures portfolio shape, not just central tendency.` });
  if (concFeats.length > 0) insights.push({ type:'good', msg:`${concFeats.length} concentration metric${concFeats.length>1?'s':''} (HHI/top-lender) — lender dependency risk captured.` });
  if (vintFeats.length === 0 && feats.some(f => f.domain === 'account')) insights.push({ type:'info', msg:`No vintage/age features in account build. Consider adding avg or oldest account age.` });
  if (utilFeats.length === 0 && feats.some(f => f.domain === 'account')) insights.push({ type:'info', msg:`No utilization ratio in account build. Balance / Sanction ratio can be a strong predictor.` });

  // New sub-category insights
  const prodMixFeats = feats.filter(f => f.sub_category === 'product_mix');
  const lifecycleFeats = feats.filter(f => f.sub_category === 'lifecycle');
  const sevFeats = feats.filter(f => f.sub_category === 'delinquency_severity');
  const crossFeats = feats.filter(f => f.sub_category === 'cross_entity');
  if (prodMixFeats.length > 0) insights.push({ type:'good', msg:`${prodMixFeats.length} product mix feature${prodMixFeats.length>1?'s':''} — portfolio diversity captured across loan types.` });
  if (lifecycleFeats.length > 0) insights.push({ type:'good', msg:`${lifecycleFeats.length} lifecycle feature${lifecycleFeats.length>1?'s':''} — account opening/closing dynamics included.` });
  if (sevFeats.length > 0) insights.push({ type:'good', msg:`${sevFeats.length} delinquency severity feature${sevFeats.length>1?'s':''} — DPD bucket scoring included; strong predictor of default.` });
  if (crossFeats.length > 0) insights.push({ type:'good', msg:`${crossFeats.length} cross-entity feature${crossFeats.length>1?'s':''} (Account+Inquiry/Trade join) — captures multi-table signal.` });
  if (feats.some(f => f.domain === 'account') && lifecycleFeats.length === 0) insights.push({ type:'info', msg:`No lifecycle features. Consider adding "New Accounts Opened (6m/12m)".` });
  if (feats.some(f => f.domain === 'account') && sevFeats.length === 0) insights.push({ type:'info', msg:`No delinquency severity features. Consider DPD 90+ count — highly predictive of NPA.` });

  // New engine insights
  const utilEngFeats = feats.filter(f => f.sub_category === 'utilization_engine');
  const pbFeats = feats.filter(f => f.sub_category === 'payment_behavior');
  const cmFeats = feats.filter(f => f.sub_category === 'credit_mix');
  if (utilEngFeats.length > 0) insights.push({ type:'good', msg:`${utilEngFeats.length} utilization engine feature${utilEngFeats.length>1?'s':''} — top-10 credit scoring variable type (Balance/Limit ratio).` });
  if (pbFeats.length > 0) insights.push({ type:'good', msg:`${pbFeats.length} payment behavior feature${pbFeats.length>1?'s':''} — on-time ratios and DPD trend slopes included.` });
  if (cmFeats.length > 0) insights.push({ type:'good', msg:`${cmFeats.length} credit mix feature${cmFeats.length>1?'s':''} — loan type diversity captured.` });
  if (feats.some(f => f.domain === 'account') && utilEngFeats.length === 0 && utilFeats.length === 0) {
    insights.push({ type:'alert', msg:`No utilization features in account build. avg_utilization and high_util_ratio are top-10 credit scoring variables.` });
  }
  if (feats.some(f => f.domain === 'account') && pbFeats.length === 0) {
    insights.push({ type:'info', msg:`No payment behavior features. on_time_payment_ratio and rolling_dpd_trend are strong predictors of future default.` });
  }
  if (feats.some(f => f.domain === 'account') && cmFeats.length === 0) {
    insights.push({ type:'info', msg:`No credit mix features. secured_to_unsecured_ratio and loan_type_diversity are standard bureau scorecard variables.` });
  }

  const el = document.getElementById('xmap-insights');
  el.innerHTML = insights.length
    ? insights.map(i => `<div class="insight-row insight-${i.type}">${{alert:'❌',warn:'⚠',good:'✅',info:'ℹ'}[i.type]} ${i.msg}</div>`).join('')
    : '<div style="font-size:11px;color:var(--text3);padding:8px 0;">Select features above to see insights.</div>';
}

// ── TAB SWITCHER ──────────────────────────────────────────────────
function xmapTab(tab, el) {
  xmapActiveTab = tab;
  document.querySelectorAll('.xmap-tab').forEach(t => t.classList.remove('sel'));
  if (el) el.classList.add('sel');
  document.querySelectorAll('.xmap-panel').forEach(p => p.style.display = 'none');
  const panel = document.getElementById(`xpanel-${tab}`);
  if (panel) panel.style.display = 'block';
  refreshXmapContent();
  if (tab === 'composite') buildCompositeSelects();
}

// ── EXPORT ────────────────────────────────────────────────────────
function exportCrossMap() {
  const pairs = computeAllPairs();
  const payload = {
    generated_at: new Date().toISOString(),
    total_features: builtFeatures.length,
    selected_features: [...xmapSelected].length,
    pairs_analysed: pairs.length,
    summary: {
      redundant: pairs.filter(p=>p.rel==='redundant').length,
      same_column: pairs.filter(p=>p.rel==='same_col').length,
      complementary: pairs.filter(p=>p.rel==='complementary').length,
      trend_base_pairs: pairs.filter(p=>p.rel==='trend_base').length,
    },
    feature_map: builtFeatures.map(f => ({
      name: f.feature_name,
      domain: f.domain,
      sub_category: f.sub_category,
      measure: f.measure,
      aggregation: f.aggregation,
      source_column: getFeatureCol(f),
      window_months: getFeatureWindow(f),
      leakage_risk: f._meta?.leakage_risk || 'unknown',
      tags: f._meta?.feature_tags || [],
    })),
    relationship_pairs: pairs.map(p => ({
      feature_a: p.a.feature_name, feature_b: p.b.feature_name,
      relationship: p.rel, label: REL_TYPES[p.rel]?.label || p.rel,
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'feature_cross_map.json';
  a.click();
  showToast('Cross-map JSON exported');
}

// Cross-map button visibility is handled inside renderBuildList directly

document.addEventListener('DOMContentLoaded',()=>{
  const elements = [
    { id: 'sec-all', selector: '#sec-all' },
    { id: 'tsec-all', selector: '#tsec-all' },
    { id: 'tstat-all', selector: '#tstat-all' },
    { id: 'town-all', selector: '#town-all' }
  ];
  elements.forEach(el => {
    const elem = document.getElementById(el.id);
    if (elem) elem.classList.add('sel');
  });
});

// ════════════════════════════════════════════════════════════════
// SCHEMA CHANGE #1 — MEASURE GROUPS
// One selection → multiple derived measures auto-expanded
// ════════════════════════════════════════════════════════════════
// ── Measure Group Categories (for tab navigation in factory) ──
const MEASURE_GROUP_CATEGORIES = {
  core:       { label:"Core",           icon:"📦", groups:["balance_metrics","dpd_metrics","utilization_metrics","overdue_metrics","risk_metrics","recency_metrics"] },
  velocity:   { label:"Velocity",       icon:"⚡", groups:["balance_velocity","risk_momentum","behavioral_velocity"] },
  behaviour:  { label:"Payment Bhvr",   icon:"💳", groups:["payment_behaviour","payment_gap_analysis"] },
  severity:   { label:"Severity",       icon:"🔥", groups:["delinquency_severity","account_stability"] },
  credit_line:{ label:"Credit Line",    icon:"📈", groups:["credit_line_dynamics"] },
};

const MEASURE_GROUPS = {

  // ── CATEGORY: CORE ──────────────────────────────────────────────
  balance_metrics: {
    label: "Balance Metrics",   icon: "💰", category: "core",
    desc: "Avg balance, change, growth rate, volatility, trend from Balance_History",
    measures: [
      { key:"hist_avg_balance",        short:"avg_bal",  label:"Avg Balance" },
      { key:"hist_balance_change",     short:"bal_chg",  label:"Balance Change" },
      { key:"hist_balance_growth",     short:"bal_grw",  label:"Balance Growth Rate" },
      { key:"hist_balance_volatility", short:"bal_vol",  label:"Balance Volatility" },
      { key:"hist_balance_trend",      short:"bal_trnd", label:"Balance Trend" },
    ]
  },
  dpd_metrics: {
    label: "DPD Metrics",   icon: "⚠️", category: "core",
    desc: "Max DPD, avg DPD, DPD30/60/90 counts, ever-flag from DPD_String",
    measures: [
      { key:"max_dpd_in_history",  short:"max_dpd",  label:"Max DPD" },
      { key:"avg_dpd_history",     short:"avg_dpd",  label:"Avg DPD" },
      { key:"count_dpd30_months",  short:"n_dpd30",  label:"DPD 30+ Count" },
      { key:"count_dpd60_months",  short:"n_dpd60",  label:"DPD 60+ Count" },
      { key:"count_dpd90_months",  short:"n_dpd90",  label:"DPD 90+ Count" },
      { key:"ever_dpd90_flag",     short:"ever90",   label:"Ever DPD 90+" },
    ]
  },
  utilization_metrics: {
    label: "Utilization Metrics",   icon: "📊", category: "core",
    desc: "Avg, peak, trough, std dev, cv, high-util months from Balance/CreditLimit",
    measures: [
      { key:"avg_util_history",      short:"avg_util",  label:"Avg Utilization" },
      { key:"max_util_history",      short:"max_util",  label:"Peak Utilization" },
      { key:"min_util_history",      short:"min_util",  label:"Min Utilization" },
      { key:"hist_util_volatility",  short:"util_vol",  label:"Util Volatility" },
      { key:"util_above_80_months",  short:"util80",    label:"High-Util Months" },
    ]
  },
  overdue_metrics: {
    label: "Overdue Metrics",   icon: "🔴", category: "core",
    desc: "Avg overdue, peak overdue, overdue rate, overdue-to-balance ratio",
    measures: [
      { key:"hist_avg_overdue",        short:"avg_ovr",    label:"Avg Overdue" },
      { key:"hist_max_overdue",        short:"max_ovr",    label:"Peak Overdue" },
      { key:"hist_overdue_to_balance", short:"ovr_bal_rt", label:"Overdue-to-Balance" },
      { key:"hist_overdue_rate",       short:"ovr_rt",     label:"Overdue Rate" },
    ]
  },
  risk_metrics: {
    label: "Risk Score Metrics",   icon: "🎯", category: "core",
    desc: "DPD rate, stress rate, high-util ratio, overdue ratio",
    measures: [
      { key:"hist_dpd_rate",               short:"dpd_rt",    label:"DPD Month Rate" },
      { key:"hist_stress_rate",            short:"strs_rt",   label:"Stress Rate" },
      { key:"hist_high_utilization_ratio", short:"hiutil_rt", label:"High-Util Ratio" },
      { key:"hist_overdue_to_balance",     short:"ovr_bal_rt",label:"Overdue Ratio" },
    ]
  },
  recency_metrics: {
    label: "Recency Metrics",   icon: "🕐", category: "core",
    desc: "Months since last event: DPD30/60/90, NPA, write-off, delinquency",
    measures: [
      { key:"months_since_last_dpd30",       short:"rec_dpd30", label:"Since DPD 30+" },
      { key:"months_since_last_dpd60",       short:"rec_dpd60", label:"Since DPD 60+" },
      { key:"months_since_last_dpd90",       short:"rec_dpd90", label:"Since DPD 90+" },
      { key:"months_since_last_delinquency", short:"rec_delq",  label:"Since Delinquency" },
      { key:"months_since_last_npa",         short:"rec_npa",   label:"Since NPA" },
      { key:"months_since_last_writeoff",    short:"rec_wo",    label:"Since Write-Off" },
    ]
  },

  // ── CATEGORY: VELOCITY ──────────────────────────────────────────
  balance_velocity: {
    label: "Balance Velocity",   icon: "🚀", category: "velocity",
    desc: "Rate of change in balance: growth, drop, acceleration from Balance_History series",
    measures: [
      { key:"hist_balance_chg_rate",   short:"bal_chg_rt",  label:"Balance Change Rate" },
      { key:"hist_balance_growth_vel", short:"bal_grw_vel", label:"Balance Growth Velocity" },
      { key:"hist_balance_drop_amt",   short:"bal_drop",    label:"Balance Drop Amount" },
      { key:"hist_balance_accel",      short:"bal_accel",   label:"Balance Acceleration" },
    ]
  },
  risk_momentum: {
    label: "Risk Momentum",   icon: "📉", category: "velocity",
    desc: "Directional momentum of DPD, overdue, utilization — rising/falling risk signal",
    measures: [
      { key:"hist_dpd_change_rate",    short:"dpd_chg_rt",  label:"DPD Change Rate" },
      { key:"hist_overdue_change",     short:"ovr_chg",     label:"Overdue Change" },
      { key:"hist_util_change_rate",   short:"util_chg_rt", label:"Util Change Rate" },
      { key:"hist_dpd_velocity",       short:"dpd_vel",     label:"DPD Velocity" },
      { key:"hist_util_acceleration",  short:"util_accel",  label:"Util Acceleration" },
      { key:"hist_overdue_trend_vel",  short:"ovr_trnd_v",  label:"Overdue Trend Velocity" },
    ]
  },
  behavioral_velocity: {
    label: "Behavioral Velocity",   icon: "🌊", category: "velocity",
    desc: "Composite velocity signals: payment momentum, stress acceleration, risk trajectory",
    measures: [
      { key:"hist_payment_momentum",   short:"pay_mom",     label:"Payment Momentum" },
      { key:"hist_stress_acceleration",short:"strs_accel",  label:"Stress Acceleration" },
      { key:"hist_risk_trajectory",    short:"risk_traj",   label:"Risk Trajectory Score" },
      { key:"hist_delinq_velocity",    short:"delq_vel",    label:"Delinquency Velocity" },
    ]
  },

  // ── CATEGORY: PAYMENT BEHAVIOUR ─────────────────────────────────
  payment_behaviour: {
    label: "Payment Behaviour",   icon: "💳", category: "behaviour",
    desc: "On-time, late, missed, partial payments — ratio & streak patterns from payment history",
    measures: [
      { key:"hist_on_time_payment",    short:"otm_pay",    label:"On-Time Payment" },
      { key:"hist_late_payment",       short:"late_pay",   label:"Late Payment" },
      { key:"hist_missed_payment",     short:"msd_pay",    label:"Missed Payment" },
      { key:"hist_partial_payment",    short:"prt_pay",    label:"Partial Payment" },
      { key:"hist_consec_late_pay",    short:"con_late",   label:"Consecutive Late Pays" },
      { key:"hist_pay_recovery",       short:"pay_rcv",    label:"Payment Recovery Rate" },
    ]
  },
  payment_gap_analysis: {
    label: "Payment Gap Analysis",   icon: "⏱️", category: "behaviour",
    desc: "Days between payments, payment gaps, timing irregularity from date fields",
    measures: [
      { key:"hist_days_bw_payments",   short:"d_bw_pay",   label:"Days Between Payments" },
      { key:"hist_days_since_pay",     short:"d_since_pay",label:"Days Since Last Payment" },
      { key:"hist_payment_gap",        short:"pay_gap",    label:"Payment Gap" },
      { key:"hist_payment_irregularity",short:"pay_irreg", label:"Payment Irregularity" },
    ]
  },

  // ── CATEGORY: SEVERITY ──────────────────────────────────────────
  delinquency_severity: {
    label: "Delinquency Severity",   icon: "🔥", category: "severity",
    desc: "DPD severity score, volatility, max streak, recovery from DPD_String sequence",
    measures: [
      { key:"hist_dpd_severity_score", short:"dpd_sev",    label:"DPD Severity Score" },
      { key:"hist_dpd_volatility",     short:"dpd_vol",    label:"DPD Volatility" },
      { key:"hist_max_consec_dpd",     short:"max_con_dpd",label:"Max Consecutive DPD" },
      { key:"hist_dpd_streak_len",     short:"dpd_strk",   label:"DPD Streak Length" },
      { key:"hist_recovery_pattern",   short:"rcv_ptn",    label:"Recovery Pattern Score" },
    ]
  },
  account_stability: {
    label: "Account Stability",   icon: "🏛️", category: "severity",
    desc: "Stability indices: balance CV, util std, DPD variance, IQR — low = stable credit",
    measures: [
      { key:"hist_balance_cv",         short:"bal_cv",     label:"Balance CV" },
      { key:"hist_util_std",           short:"util_std",   label:"Utilization Std Dev" },
      { key:"hist_dpd_variance",       short:"dpd_var",    label:"DPD Variance" },
      { key:"hist_balance_iqr",        short:"bal_iqr",    label:"Balance IQR" },
      { key:"hist_payment_stress_idx", short:"pay_strs",   label:"Payment Stress Index" },
      { key:"hist_delinq_volatility",  short:"delq_vol",   label:"Delinquency Volatility" },
      { key:"hist_util_stress_score",  short:"util_strs",  label:"Util Stress Score" },
    ]
  },

  // ── CATEGORY: CREDIT LINE ────────────────────────────────────────
  credit_line_dynamics: {
    label: "Credit Line Dynamics",   icon: "📈", category: "credit_line",
    desc: "Credit limit changes, increases, decreases, utilization spikes from limit history",
    measures: [
      { key:"hist_credit_limit",         short:"cl",        label:"Credit Limit" },
      { key:"hist_credit_limit_change",  short:"cl_chg",    label:"Limit Change" },
      { key:"hist_limit_increase",       short:"cl_inc",    label:"Limit Increase" },
      { key:"hist_limit_decrease",       short:"cl_dec",    label:"Limit Decrease" },
      { key:"hist_limit_change_rate",    short:"cl_chg_rt", label:"Limit Change Rate" },
      { key:"hist_limit_inc_freq",       short:"cl_inc_frq",label:"Limit Increase Freq" },
      { key:"hist_util_spike",           short:"util_spk",  label:"Util Spike (post-limit)" },
    ]
  },
};

// ════════════════════════════════════════════════════════════════
// SCHEMA CHANGE #2 — WINDOW GROUPS
// One group selection → multiple time windows auto-expanded
// ════════════════════════════════════════════════════════════════
const WINDOW_GROUPS = {
  short_term: {
    label: "Short Term",
    icon: "⚡",
    desc: "1m, 3m, 6m — captures recent stress signals",
    windows: ["1m","3m","6m"]
  },
  medium_term: {
    label: "Medium Term",
    icon: "📅",
    desc: "9m, 12m, 18m — behavioral baseline",
    windows: ["9m","12m","18m"]
  },
  long_term: {
    label: "Long Term",
    icon: "🗓️",
    desc: "24m, 36m, 48m — credit history depth",
    windows: ["24m","36m","48m"]
  },
  all_windows: {
    label: "All Windows",
    icon: "🌐",
    desc: "3m, 6m, 12m, 24m, 36m — comprehensive coverage",
    windows: ["3m","6m","12m","24m","36m"]
  },
  scorecard_standard: {
    label: "Scorecard Std",
    icon: "📋",
    desc: "6m, 12m, 24m — industry standard scorecard windows",
    windows: ["6m","12m","24m"]
  },
};

// ════════════════════════════════════════════════════════════════
// SCHEMA CHANGE #3 — SEGMENT GROUPS
// One group selection → multiple loan-type segments auto-expanded
// ════════════════════════════════════════════════════════════════
const SEGMENT_GROUPS = {
  all_trades: {
    label: "All Trades (Portfolio)",
    icon: "🏦",
    desc: "Portfolio-level — no segment filter",
    segments: [{ key:"all", code:"", label:"All" }]
  },
  retail_products: {
    label: "Retail Products",
    icon: "🛒",
    desc: "CC, PL, CD, TW — unsecured retail",
    segments: [
      { key:"cc",  code:"_cc", label:"CC"  },
      { key:"pl",  code:"_pl", label:"PL"  },
      { key:"cd",  code:"_cd", label:"CD"  },
      { key:"tw",  code:"_tw", label:"TW"  },
    ]
  },
  secured_products: {
    label: "Secured Products",
    icon: "🏠",
    desc: "HL, AL — secured products",
    segments: [
      { key:"hl",  code:"_hl", label:"HL"  },
      { key:"al",  code:"_al", label:"AL"  },
    ]
  },
  all_loan_types: {
    label: "All Loan Types",
    icon: "🌐",
    desc: "CC, PL, HL, AL, CD, TW — full product split",
    segments: [
      { key:"cc",  code:"_cc", label:"CC"  },
      { key:"pl",  code:"_pl", label:"PL"  },
      { key:"hl",  code:"_hl", label:"HL"  },
      { key:"al",  code:"_al", label:"AL"  },
      { key:"cd",  code:"_cd", label:"CD"  },
      { key:"tw",  code:"_tw", label:"TW"  },
    ]
  },
  sec_unsec_split: {
    label: "Sec / Unsec Split",
    icon: "⚖️",
    desc: "Secured vs Unsecured comparison",
    segments: [
      { key:"secured",   code:"_sec",   label:"Secured"   },
      { key:"unsecured", code:"_unsec", label:"Unsecured"  },
    ]
  },
};

// ════════════════════════════════════════════════════════════════
// FEATURE FACTORY ENGINE
// Expansion: Measure Group × Aggregation × Window Group × Segment Group
// ════════════════════════════════════════════════════════════════

// Standard aggregations available per measure type
const FACTORY_AGGS = {
  balance:      [{ key:"avg",short:"avg" },{ key:"max",short:"max" },{ key:"min",short:"min" },{ key:"std",short:"std" }],
  dpd:          [{ key:"max",short:"max" },{ key:"avg",short:"avg" },{ key:"count",short:"cnt" }],
  util:         [{ key:"avg",short:"avg" },{ key:"max",short:"max" },{ key:"std",short:"std" }],
  overdue:      [{ key:"avg",short:"avg" },{ key:"max",short:"max" }],
  risk:         [{ key:"avg",short:"avg" },{ key:"std",short:"std" }],
  recency:      [{ key:"value",short:"val" }],
  // v11+ families
  velocity:     [{ key:"avg",short:"avg" },{ key:"max",short:"max" },{ key:"trend",short:"trnd" },{ key:"velocity",short:"vel" }],
  momentum:     [{ key:"trend",short:"trnd" },{ key:"velocity",short:"vel" },{ key:"acceleration",short:"accel" }],
  beh_velocity: [{ key:"avg",short:"avg" },{ key:"trend",short:"trnd" },{ key:"velocity",short:"vel" },{ key:"momentum",short:"mom" }],
  payment:      [{ key:"count",short:"cnt" },{ key:"ratio",short:"rat" },{ key:"max_streak",short:"mxstrk" },{ key:"avg_gap",short:"avg_gap" }],
  gap:          [{ key:"avg",short:"avg" },{ key:"median",short:"med" },{ key:"max",short:"max" },{ key:"skew",short:"skw" }],
  severity:     [{ key:"max",short:"max" },{ key:"avg",short:"avg" },{ key:"severity_score",short:"sev" },{ key:"entropy",short:"entr" }],
  stability:    [{ key:"cv",short:"cv" },{ key:"std",short:"std" },{ key:"variance",short:"var" },{ key:"entropy",short:"entr" },{ key:"lag_corr",short:"lagcr" }],
  credit_line:  [{ key:"count",short:"cnt" },{ key:"avg",short:"avg" },{ key:"trend",short:"trnd" },{ key:"velocity",short:"vel" }],
};

// Map measure group key → agg family
const MEASURE_GROUP_AGG_FAMILY = {
  balance_metrics:       "balance",
  dpd_metrics:           "dpd",
  utilization_metrics:   "util",
  overdue_metrics:       "overdue",
  risk_metrics:          "risk",
  recency_metrics:       "recency",
  // NEW
  balance_velocity:      "velocity",
  risk_momentum:         "momentum",
  behavioral_velocity:   "beh_velocity",
  payment_behaviour:     "payment",
  payment_gap_analysis:  "gap",
  delinquency_severity:  "severity",
  account_stability:     "stability",
  credit_line_dynamics:  "credit_line",
};

let factoryState = {
  measureGroups: [],
  windowGroup: "scorecard_standard",
  segmentGroup: "all_trades",
  aggKeys: [],
  activeCategory: "core",   // NEW: category tab
  previewItems: [],
  selectedIds: new Set(),
};

function buildFactoryPreview() {
  const items = [];
  let id = 0;

  const winGroup  = WINDOW_GROUPS[factoryState.windowGroup];
  const segGroup  = SEGMENT_GROUPS[factoryState.segmentGroup];

  factoryState.measureGroups.forEach(mgKey => {
    const mg    = MEASURE_GROUPS[mgKey];
    if (!mg) return;
    const aggFamily = MEASURE_GROUP_AGG_FAMILY[mgKey];
    const aggs  = (factoryState.aggKeys.length ? FACTORY_AGGS[aggFamily].filter(a => factoryState.aggKeys.includes(a.key)) : FACTORY_AGGS[aggFamily]) || FACTORY_AGGS.balance;

    mg.measures.forEach(measure => {
      segGroup.segments.forEach(seg => {
        aggs.forEach(agg => {
          // Recency: no windows needed
          if (aggFamily === "recency") {
            const name = `trh_${agg.short}_${measure.short}${seg.code}`;
            items.push({ id: id++, name, measure: measure.label, agg: agg.key, window: "—", segment: seg.label, measureGroup: mg.label });
          } else {
            winGroup.windows.forEach(win => {
              const winShort = win.replace("m","");
              const name = `trh_${seg.code ? seg.code.slice(1)+"_" : ""}${agg.short}_${measure.short}_${winShort}m`;
              items.push({ id: id++, name, measure: measure.label, agg: agg.key, window: win, segment: seg.label, measureGroup: mg.label });
            });
          }
        });
      });
    });
  });

  factoryState.previewItems = items;
  factoryState.selectedIds  = new Set(items.map(i => i.id));
  return items;
}

function openFeatureFactory() {
  factoryState = {
    measureGroups: [],
    windowGroup: "scorecard_standard",
    segmentGroup: "all_trades",
    aggKeys: [],
    activeCategory: "core",
    previewItems: [],
    selectedIds: new Set(),
  };
  document.getElementById('factory-overlay').classList.add('open');
  renderFactoryMeasureGrid();
  renderFactoryWindowGroup();
  renderFactorySegmentGroup();
  renderFactoryAggChips();
  renderFactoryPreview();
}

function closeFeatureFactory(e) {
  if (e && e.target !== document.getElementById('factory-overlay')) return;
  document.getElementById('factory-overlay').classList.remove('open');
}

// ── Category-level select helpers ──
function factorySelectCatAll() {
  const cat = MEASURE_GROUP_CATEGORIES[factoryState.activeCategory];
  cat.groups.forEach(k => { if (!factoryState.measureGroups.includes(k)) factoryState.measureGroups.push(k); });
  renderFactoryMeasureGrid(); renderFactoryPreview();
}
function factorySelectCatNone() {
  const cat = MEASURE_GROUP_CATEGORIES[factoryState.activeCategory];
  factoryState.measureGroups = factoryState.measureGroups.filter(k => !cat.groups.includes(k));
  renderFactoryMeasureGrid(); renderFactoryPreview();
}
function factorySelectAllGroups() {
  factoryState.measureGroups = Object.keys(MEASURE_GROUPS);
  renderFactoryMeasureGrid(); renderFactoryPreview();
}
function factoryClearAll() {
  factoryState.measureGroups = [];
  renderFactoryMeasureGrid(); renderFactoryPreview();
}

// ── Quick Presets ──
function applyFactoryPreset(preset) {
  const presets = {
    scorecard: {
      measureGroups: ["balance_metrics","dpd_metrics","utilization_metrics","overdue_metrics"],
      windowGroup: "scorecard_standard",
      segmentGroup: "all_trades",
    },
    velocity_pack: {
      measureGroups: ["balance_velocity","risk_momentum","behavioral_velocity","dpd_metrics"],
      windowGroup: "medium_term",
      segmentGroup: "all_trades",
    },
    payment_deep: {
      measureGroups: ["payment_behaviour","payment_gap_analysis","delinquency_severity","account_stability"],
      windowGroup: "scorecard_standard",
      segmentGroup: "sec_unsec_split",
    },
    full_enterprise: {
      measureGroups: Object.keys(MEASURE_GROUPS),
      windowGroup: "all_windows",
      segmentGroup: "all_loan_types",
    },
  };
  const p = presets[preset];
  if (!p) return;
  factoryState.measureGroups = [...p.measureGroups];
  factoryState.windowGroup   = p.windowGroup;
  factoryState.segmentGroup  = p.segmentGroup;
  factoryState.aggKeys       = [];
  renderFactoryMeasureGrid();
  renderFactoryWindowGroup();
  renderFactorySegmentGroup();
  renderFactoryPreview();
}

function renderFactoryMeasureGrid() {
  // Render category tabs
  const tabWrap = document.getElementById('factory-cat-tabs');
  tabWrap.innerHTML = '';
  Object.entries(MEASURE_GROUP_CATEGORIES).forEach(([catKey, cat]) => {
    const selCount = cat.groups.filter(g => factoryState.measureGroups.includes(g)).length;
    const isActive = factoryState.activeCategory === catKey;
    const d = document.createElement('div');
    d.className = 'fac-cat-tab' + (isActive ? ' active' : '');
    d.innerHTML = `${cat.icon} ${cat.label}${selCount ? ` <span class="fac-cat-badge">${selCount}</span>` : ''}`;
    d.onclick = () => {
      factoryState.activeCategory = catKey;
      renderFactoryMeasureGrid();
    };
    tabWrap.appendChild(d);
  });

  // Render tile grid for active category
  const grid = document.getElementById('factory-measure-grid');
  grid.innerHTML = '';
  const cat = MEASURE_GROUP_CATEGORIES[factoryState.activeCategory];
  cat.groups.forEach(key => {
    const mg = MEASURE_GROUPS[key];
    if (!mg) return;
    const sel = factoryState.measureGroups.includes(key);
    const d = document.createElement('div');
    d.className = 'fac-mg-tile' + (sel ? ' sel' : '');
    d.innerHTML = `
      <div class="fac-mg-icon">${mg.icon}</div>
      <div class="fac-mg-name">${mg.label}</div>
      <div class="fac-mg-count">${mg.measures.length} measures · ${(FACTORY_AGGS[MEASURE_GROUP_AGG_FAMILY[key]]||[]).length} aggs</div>
      <div class="fac-mg-desc">${mg.desc}</div>`;
    d.onclick = () => {
      const idx = factoryState.measureGroups.indexOf(key);
      if (idx > -1) factoryState.measureGroups.splice(idx, 1);
      else factoryState.measureGroups.push(key);
      d.classList.toggle('sel');
      renderFactoryMeasureGrid(); // refresh badge counts on tabs
      renderFactoryPreview();
    };
    grid.appendChild(d);
  });
}

function renderFactoryWindowGroup() {
  const grid = document.getElementById('factory-window-grid');
  grid.innerHTML = '';
  Object.entries(WINDOW_GROUPS).forEach(([key, wg]) => {
    const sel = factoryState.windowGroup === key;
    const d = document.createElement('div');
    d.className = 'fac-wg-chip' + (sel ? ' sel' : '');
    d.innerHTML = `${wg.icon} ${wg.label} <span class="fac-wg-wins">${wg.windows.join(', ')}</span>`;
    d.onclick = () => {
      factoryState.windowGroup = key;
      document.querySelectorAll('.fac-wg-chip').forEach(c => c.classList.remove('sel'));
      d.classList.add('sel');
      renderFactoryPreview();
    };
    grid.appendChild(d);
  });
}

function renderFactorySegmentGroup() {
  const grid = document.getElementById('factory-segment-grid');
  grid.innerHTML = '';
  Object.entries(SEGMENT_GROUPS).forEach(([key, sg]) => {
    const sel = factoryState.segmentGroup === key;
    const d = document.createElement('div');
    d.className = 'fac-sg-chip' + (sel ? ' sel' : '');
    d.innerHTML = `${sg.icon} ${sg.label} <span class="fac-sg-segs">${sg.segments.map(s=>s.label).join(', ')}</span>`;
    d.onclick = () => {
      factoryState.segmentGroup = key;
      document.querySelectorAll('.fac-sg-chip').forEach(c => c.classList.remove('sel'));
      d.classList.add('sel');
      renderFactoryPreview();
    };
    grid.appendChild(d);
  });
}

function renderFactoryAggChips() {
  const wrap = document.getElementById('factory-agg-chips');
  wrap.innerHTML = '';
  const allAggs = ['avg','max','min','std','count','value','difference','slope'];
  allAggs.forEach(ak => {
    const d = document.createElement('div');
    d.className = 'fac-agg-chip';
    d.textContent = ak;
    d.onclick = () => {
      d.classList.toggle('sel');
      if (d.classList.contains('sel')) { if(!factoryState.aggKeys.includes(ak)) factoryState.aggKeys.push(ak); }
      else factoryState.aggKeys = factoryState.aggKeys.filter(x => x !== ak);
      renderFactoryPreview();
    };
    wrap.appendChild(d);
  });
}

function renderFactoryPreview() {
  const items = buildFactoryPreview();
  const list  = document.getElementById('factory-preview-list');
  const countEl = document.getElementById('factory-count');
  const matEl   = document.getElementById('factory-matrix');

  // Count display
  const total = items.length;
  countEl.innerHTML = total === 0
    ? '<span style="color:var(--text3)">Select measure groups above</span>'
    : `<strong style="color:var(--tradeh);font-size:22px;">${total.toLocaleString()}</strong> <span style="color:var(--text3);font-size:12px;">features will be generated</span>`;

  // Matrix breakdown
  if (factoryState.measureGroups.length > 0) {
    const mg  = factoryState.measureGroups;
    const wg  = WINDOW_GROUPS[factoryState.windowGroup];
    const sg  = SEGMENT_GROUPS[factoryState.segmentGroup];
    const totalMeasures = mg.reduce((s,k)=>(MEASURE_GROUPS[k]?s+MEASURE_GROUPS[k].measures.length:s),0);
    // Per-family agg count (weighted average across families)
    let totalAggSlots = 0;
    mg.forEach(k => {
      const fam = MEASURE_GROUP_AGG_FAMILY[k];
      const allAggs = FACTORY_AGGS[fam] || [];
      const filtered = factoryState.aggKeys.length ? allAggs.filter(a=>factoryState.aggKeys.includes(a.key)) : allAggs;
      const nMeasures = (MEASURE_GROUPS[k]||{measures:[]}).measures.length;
      totalAggSlots += filtered.length * nMeasures;
    });
    const avgAggs = totalMeasures > 0 ? (totalAggSlots / totalMeasures).toFixed(1) : 0;
    const nWin = wg.windows.length;
    const nSeg = sg.segments.length;

    // Group badges
    const groupBadges = mg.map(k => {
      const g = MEASURE_GROUPS[k];
      return `<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:var(--tradeh-light);color:var(--tradeh);font-weight:700;">${g.icon} ${g.label}</span>`;
    }).join(' ');

    matEl.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;padding:8px;background:var(--bg);border-radius:6px;">${groupBadges}</div>
      <div class="fac-mat-row"><span class="fac-mat-label">📐 Total Measures</span><span class="fac-mat-val">${totalMeasures}</span></div>
      <div class="fac-mat-op">×</div>
      <div class="fac-mat-row"><span class="fac-mat-label">🔢 Avg Aggs/Measure</span><span class="fac-mat-val">~${avgAggs}</span></div>
      <div class="fac-mat-op">×</div>
      <div class="fac-mat-row"><span class="fac-mat-label">🕐 Windows</span><span class="fac-mat-val">${nWin} <span style="font-size:9px;color:var(--text3);">(${wg.windows.join(', ')})</span></span></div>
      <div class="fac-mat-op">×</div>
      <div class="fac-mat-row"><span class="fac-mat-label">🏷 Segments</span><span class="fac-mat-val">${nSeg} <span style="font-size:9px;color:var(--text3);">(${sg.segments.map(s=>s.label).join(', ')})</span></span></div>
      <div class="fac-mat-op">=</div>
      <div class="fac-mat-row fac-mat-total"><span class="fac-mat-label">⚡ Total Features</span><span class="fac-mat-val" style="font-size:18px;">${total.toLocaleString()}</span></div>`;
    matEl.style.display = 'flex';
  } else {
    matEl.style.display = 'none';
  }

  // Preview list (show first 200)
  list.innerHTML = '';
  const shown = items.slice(0, 200);
  shown.forEach(row => {
    const div = document.createElement('div');
    div.className = 'expl-item';
    const isSel = factoryState.selectedIds.has(row.id);
    div.innerHTML = `
      <input type="checkbox" id="fac-cb-${row.id}" ${isSel?'checked':''} onchange="factoryToggle(${row.id},this.checked)">
      <label for="fac-cb-${row.id}" class="expl-item-name" style="cursor:pointer;">${row.name}</label>
      <div class="expl-item-meta">
        <span class="expl-tag" style="background:var(--tradeh-light);color:var(--tradeh);">${row.segment}</span>
        <span class="expl-tag agg">${row.agg}</span>
        <span class="expl-tag win">${row.window}</span>
      </div>`;
    list.appendChild(div);
  });
  if (items.length > 200) {
    const more = document.createElement('div');
    more.className = 'expl-empty';
    more.style.color = 'var(--tradeh)';
    more.textContent = `... and ${(items.length-200).toLocaleString()} more features (showing first 200 in preview)`;
    list.appendChild(more);
  }
  if (!items.length) {
    list.innerHTML = '<div class="expl-empty">Select measure groups to preview generated features</div>';
  }
  document.getElementById('factory-add-btn').disabled = (total === 0);
  document.getElementById('factory-add-btn').textContent = total > 0 ? `⚡ Add All ${total.toLocaleString()} Features` : '⚡ Add Features';
}

function factoryToggle(id, checked) {
  if (checked) factoryState.selectedIds.add(id);
  else factoryState.selectedIds.delete(id);
}

function factorySelectAll()  { factoryState.selectedIds = new Set(factoryState.previewItems.map(i=>i.id)); document.querySelectorAll('#factory-preview-list input[type=checkbox]').forEach(c=>c.checked=true); }
function factorySelectNone() { factoryState.selectedIds.clear(); document.querySelectorAll('#factory-preview-list input[type=checkbox]').forEach(c=>c.checked=false); }

function factoryAddFeatures() {
  const segGroup = SEGMENT_GROUPS[factoryState.segmentGroup];
  const winGroup = WINDOW_GROUPS[factoryState.windowGroup];
  let added = 0;
  const toAdd = factoryState.previewItems.filter(i => factoryState.selectedIds.has(i.id));
  toAdd.forEach(row => {
    if (builtFeatures.find(f => f.feature_name === row.name)) return;
    const seg = segGroup.segments.find(s => s.label === row.segment) || segGroup.segments[0];
    const feat = {
      bureau: state.bureau || "—",
      entity: "tradeline",
      domain: "trade_history",
      feature_name: row.name,
      sub_category: "factory_generated",
      measure: row.name,
      aggregation: row.agg,
      label: `${row.measure} [${row.segment}] ${row.agg} ${row.window}`,
      _meta: { feature_tags:["factory","auto_generated"], generated_by:"Feature Factory Engine" }
    };
    if (row.window && row.window !== "—") {
      feat.time_window = { type:"rolling", value:parseInt(row.window), unit:"month" };
    }
    if (seg.key !== "all") {
      feat.portfolio_scope = { loan_type: [seg.key.toUpperCase()] };
    }
    builtFeatures.push(feat);
    added++;
  });
  renderBuildList(); updateHdrCount();
  document.getElementById('factory-overlay').classList.remove('open');
  showToast(`⚡ Feature Factory: Added ${added.toLocaleString()} variables!`);
}

// ════════════════════════════════════════════════════════════════
// HISTORY PACK GENERATOR — Guided Explosion Framework
// ════════════════════════════════════════════════════════════════

const HISTORY_PACK_DEFS = {
  balance: {
    label:"Balance History", icon:"💰",
    desc:"Avg, peak, sum & volatility of monthly balance and overdue amounts from Balance_History.",
    sub:"exposure",
    items:[
      { measure:"hist_avg_balance",   agg:"avg",    windows:["6m","12m","24m","36m"], label:"Avg Monthly Balance" },
      { measure:"hist_max_balance",   agg:"max",    windows:["6m","12m","24m"],       label:"Peak Monthly Balance" },
      { measure:"hist_sum_balance",   agg:"sum",    windows:["12m","24m"],            label:"Sum of Monthly Balances" },
      { measure:"hist_avg_balance",   agg:"std",    windows:["12m","24m"],            label:"Balance Std Dev (Volatility)" },
      { measure:"hist_avg_balance",   agg:"cv",     windows:["12m"],                  label:"Balance CV (Stability)" },
      { measure:"hist_avg_overdue",   agg:"avg",    windows:["6m","12m","24m"],       label:"Avg Monthly Overdue" },
      { measure:"hist_max_overdue",   agg:"max",    windows:["6m","12m"],             label:"Peak Overdue Amount" },
    ]
  },
  delinquency: {
    label:"Delinquency History", icon:"⚠️",
    desc:"Max DPD, DPD-band month counts, avg DPD, and ever-delinquency flags from DPD_String.",
    sub:"delinquency",
    items:[
      { measure:"max_dpd_in_history", agg:"max",   windows:["3m","6m","12m","24m"],  label:"Max DPD in Window" },
      { measure:"avg_dpd_history",    agg:"avg",   windows:["6m","12m","24m"],       label:"Avg DPD in Window" },
      { measure:"count_dpd30_months", agg:"count", windows:["6m","12m","24m"],       label:"DPD 30+ Month Count" },
      { measure:"count_dpd60_months", agg:"count", windows:["12m","24m","36m"],      label:"DPD 60+ Month Count" },
      { measure:"count_dpd90_months", agg:"count", windows:["12m","24m","36m"],      label:"DPD 90+ Month Count" },
      { measure:"ever_dpd90_flag",    agg:"flag",  windows:["12m","24m"],            label:"Ever DPD 90+ Flag (Window)" },
    ]
  },
  utilization: {
    label:"Utilization History", icon:"📊",
    desc:"Monthly utilization ratios (Balance / CreditLimit) from history arrays — avg, peak, stability.",
    sub:"utilization",
    items:[
      { measure:"avg_util_history",     agg:"avg",   windows:["3m","6m","12m","24m"], label:"Avg Utilization" },
      { measure:"max_util_history",     agg:"max",   windows:["6m","12m","24m"],      label:"Peak Utilization" },
      { measure:"min_util_history",     agg:"min",   windows:["6m","12m"],            label:"Trough Utilization" },
      { measure:"avg_util_history",     agg:"std",   windows:["12m","24m"],           label:"Utilization Std Dev" },
      { measure:"avg_util_history",     agg:"cv",    windows:["12m"],                 label:"Utilization CV (Stability)" },
      { measure:"util_above_80_months", agg:"count", windows:["6m","12m","24m"],      label:"Months Util ≥ 80%" },
    ]
  },
  recency: {
    label:"Recency Events", icon:"🕐",
    desc:"Months elapsed since last key delinquency events — sourced from DPD_String and status fields.",
    sub:"recency",
    items:[
      { measure:"months_since_last_dpd30",       agg:"value", windows:[null], label:"Since Last DPD 30+" },
      { measure:"months_since_last_dpd60",       agg:"value", windows:[null], label:"Since Last DPD 60+" },
      { measure:"months_since_last_dpd90",       agg:"value", windows:[null], label:"Since Last DPD 90+" },
      { measure:"months_since_last_delinquency", agg:"value", windows:[null], label:"Since Last Delinquency" },
      { measure:"months_since_last_npa",         agg:"value", windows:[null], label:"Since Last NPA Status" },
      { measure:"months_since_last_writeoff",    agg:"value", windows:[null], label:"Since Last Write-Off" },
    ]
  },
  volume: {
    label:"Volume History", icon:"🔢",
    desc:"Count of months spent in various DPD / status states from DPD_String and Status_History.",
    sub:"volume",
    items:[
      { measure:"months_with_dpd",        agg:"count", windows:["6m","12m","24m"],  label:"Months with Any DPD" },
      { measure:"months_as_npa",          agg:"count", windows:["12m","24m","36m"], label:"Months as NPA" },
      { measure:"months_ever_delinquent", agg:"count", windows:["12m","24m"],       label:"Total Delinquent Months" },
      { measure:"months_with_overdue",    agg:"count", windows:["6m","12m"],        label:"Months with Overdue" },
      { measure:"months_as_npa",          agg:"flag",  windows:["12m","24m"],       label:"Ever NPA Flag (Window)" },
    ]
  },
  trend: {
    label:"Trend Analysis", icon:"📈",
    desc:"Directional change across window pairs — difference, slope, and volatility of key metrics.",
    sub:"trend",
    items:[
      { measure:"hist_balance_trend",     agg:"difference", window_pairs:[["3m","6m"],["6m","12m"],["3m","12m"],["12m","24m"]], label:"Balance Trend" },
      { measure:"hist_dpd_trend",         agg:"difference", window_pairs:[["3m","6m"],["6m","12m"],["12m","24m"]],             label:"DPD Trend" },
      { measure:"hist_utilization_trend", agg:"difference", window_pairs:[["3m","6m"],["6m","12m"],["12m","24m"]],             label:"Utilization Trend" },
      { measure:"hist_overdue_trend",     agg:"difference", window_pairs:[["6m","12m"],["12m","24m"]],                         label:"Overdue Trend" },
      { measure:"hist_balance_trend",     agg:"slope",      rolling_windows:["6m","12m","24m"],                                label:"Balance Slope (OLS)" },
      { measure:"hist_dpd_trend",         agg:"volatility", rolling_windows:["12m","24m"],                                     label:"DPD Volatility" },
    ]
  },
  balance_dynamics: {
    label:"Balance Dynamics", icon:"⚖️",
    desc:"Peak, trough, time-weighted averages, and rolling volatility from monthly balance series.",
    sub:"balance_dynamics",
    items:[
      { measure:"hist_peak_balance",          agg:"max",   windows:["12m","24m","36m"], label:"Peak Balance" },
      { measure:"hist_trough_balance",        agg:"min",   windows:["12m","24m"],       label:"Trough Balance" },
      { measure:"hist_avg_monthly_balance",   agg:"avg",   windows:["6m","12m","24m"],  label:"Avg Monthly Balance" },
      { measure:"hist_time_weighted_balance", agg:"value", windows:["12m","24m"],       label:"Time-Weighted Avg Balance" },
      { measure:"hist_balance_volatility",    agg:"value", windows:["12m","24m"],       label:"Balance Volatility Score" },
      { measure:"hist_balance_cv",            agg:"value", windows:["12m"],             label:"Balance CV" },
      { measure:"hist_balance_range",         agg:"value", windows:["12m","24m"],       label:"Balance Range (Peak−Trough)" },
      { measure:"hist_overdue_amount",        agg:"avg",   windows:["6m","12m"],        label:"Avg Overdue (Dynamics)" },
    ]
  },
  risk_ratio: {
    label:"Risk Ratios", icon:"🎯",
    desc:"Historical risk ratios — DPD rate, stress rate, overdue-to-balance, high-utilisation month ratio.",
    sub:"risk_ratio",
    items:[
      { measure:"hist_dpd_rate",               agg:"avg", windows:["6m","12m","24m"], label:"DPD Month Rate" },
      { measure:"hist_stress_rate",            agg:"avg", windows:["12m","24m","36m"], label:"Stress Rate (NPA+WO)" },
      { measure:"hist_overdue_to_balance",     agg:"avg", windows:["6m","12m","24m"], label:"Overdue-to-Balance Ratio" },
      { measure:"hist_high_utilization_ratio", agg:"avg", windows:["12m","24m"],      label:"High-Util Month Ratio" },
      { measure:"hist_dpd_rate",               agg:"std", windows:["12m","24m"],      label:"DPD Rate Volatility" },
      { measure:"hist_overdue_to_balance",     agg:"std", windows:["12m"],            label:"Overdue-Balance Volatility" },
    ]
  }
};

const SEGMENT_SCOPE = {
  all:       { loanType:[], secured:"all",      label:"All" },
  cc:        { loanType:["CC"], secured:"all",  label:"CC" },
  pl:        { loanType:["PL"], secured:"all",  label:"PL" },
  hl:        { loanType:["HL"], secured:"all",  label:"HL" },
  al:        { loanType:["AL"], secured:"all",  label:"AL" },
  secured:   { loanType:[], secured:"secured",  label:"Secured" },
  unsecured: { loanType:[], secured:"unsecured",label:"Unsecured" },
};

const MEASURE_SHORT = {
  hist_avg_balance:"avg_bal",   hist_max_balance:"max_bal",   hist_sum_balance:"sum_bal",
  hist_avg_overdue:"avg_ovr",   hist_max_overdue:"max_ovr",
  max_dpd_in_history:"max_dpd", avg_dpd_history:"avg_dpd",
  count_dpd30_months:"n_dpd30", count_dpd60_months:"n_dpd60", count_dpd90_months:"n_dpd90",
  ever_dpd90_flag:"ever_dpd90",
  avg_util_history:"avg_util",  max_util_history:"max_util",  min_util_history:"min_util",
  util_above_80_months:"util80",
  months_since_last_dpd30:"rec_dpd30",  months_since_last_dpd60:"rec_dpd60",
  months_since_last_dpd90:"rec_dpd90",  months_since_last_delinquency:"rec_delq",
  months_since_last_npa:"rec_npa",      months_since_last_writeoff:"rec_wo",
  months_with_dpd:"mo_dpd", months_as_npa:"mo_npa", months_ever_delinquent:"mo_delq",
  months_with_overdue:"mo_ovr",
  hist_balance_trend:"bal_trnd", hist_dpd_trend:"dpd_trnd",
  hist_utilization_trend:"util_trnd", hist_overdue_trend:"ovr_trnd",
  hist_peak_balance:"pk_bal",   hist_trough_balance:"tr_bal",
  hist_avg_monthly_balance:"avg_mo_bal", hist_time_weighted_balance:"tw_bal",
  hist_balance_volatility:"bal_vol", hist_balance_cv:"bal_cv",
  hist_balance_range:"bal_rng", hist_overdue_amount:"ovr_amt",
  hist_dpd_rate:"dpd_rt", hist_stress_rate:"strs_rt",
  hist_overdue_to_balance:"ovr_bal_rt", hist_high_utilization_ratio:"hiutil_rt",
};

const AGG_SHORT = {
  avg:"avg", max:"max", min:"min", sum:"sum", std:"std", cv:"cv",
  count:"cnt", flag:"flg", value:"val", difference:"dff", slope:"slp",
  volatility:"vol", ratio:"rat", growth_rate:"grw",
  // v12 new aggregations
  trend:"trnd", velocity:"vel", acceleration:"accel",
  lag_corr:"lagcr", entropy:"entr", median:"med",
  max_streak:"mxstrk", classification:"cls", regression:"reg",
  skew:"skw", variance:"var", iqr:"iqr", momentum:"mom",
};

let explState = { pack:null, segment:"all" };
let explPreviewItems = []; // flat list of {id, name, item, window, wpair, rwin, packKey}

function packFeatureName(packKey, item, window, wpair, rwin, segment) {
  const seg = SEGMENT_SCOPE[segment] || SEGMENT_SCOPE.all;
  const segCode = seg.loanType.length ? "_"+seg.loanType[0].toLowerCase()
                : (seg.secured!=="all" ? "_"+seg.secured.slice(0,3) : "");
  const ms = MEASURE_SHORT[item.measure] || item.measure.replace(/^hist_/,"").slice(0,12);
  const ag = AGG_SHORT[item.agg] || item.agg.slice(0,4);
  if (wpair)  return `trh_${ag}_${ms}${segCode}_${wpair[0]}_${wpair[1]}`;
  if (rwin)   return `trh_${ag}_${ms}${segCode}_${rwin}`;
  if (window) return `trh_${ag}_${ms}${segCode}_${window}`;
  return `trh_${ag}_${ms}${segCode}`;
}

function generatePackPreview(packKey, segment) {
  const pack = HISTORY_PACK_DEFS[packKey];
  if (!pack) return [];
  const rows = [];
  let id = 0;
  pack.items.forEach(item => {
    if (item.window_pairs) {
      item.window_pairs.forEach(wp => {
        rows.push({ id: id++, item, packKey, window:null, wpair:wp, rwin:null,
          name: packFeatureName(packKey, item, null, wp, null, segment),
          winLabel: wp[0]+" vs "+wp[1] });
      });
    } else if (item.rolling_windows) {
      item.rolling_windows.forEach(rw => {
        rows.push({ id: id++, item, packKey, window:null, wpair:null, rwin:rw,
          name: packFeatureName(packKey, item, null, null, rw, segment),
          winLabel: rw+" rolling" });
      });
    } else {
      item.windows.forEach(w => {
        rows.push({ id: id++, item, packKey, window:w, wpair:null, rwin:null,
          name: packFeatureName(packKey, item, w, null, null, segment),
          winLabel: w || "—" });
      });
    }
  });
  return rows;
}

function openExplosionModal() {
  explState = { pack:null, segment:"all" };
  explPreviewItems = [];
  document.getElementById('expl-overlay').classList.add('open');
  // Reset UI
  document.querySelectorAll('.pack-tile').forEach(t=>t.classList.remove('sel'));
  document.querySelectorAll('.seg-chip').forEach(c=>c.classList.remove('sel'));
  document.querySelector('.seg-chip').classList.add('sel'); // "All"
  document.getElementById('expl-seg-section').style.display='none';
  document.getElementById('expl-preview-section').style.display='none';
  document.getElementById('expl-pack-desc').style.display='none';
  document.getElementById('expl-preview-list').innerHTML='<div class="expl-empty">Select a pack above to see variables</div>';
  document.getElementById('expl-add-btn').disabled=true;
  document.getElementById('expl-sel-count').textContent='0';
  document.getElementById('expl-footer-info').textContent='Select a pack to begin';
}

function closeExplosionModal(e) {
  if (e && e.target!==document.getElementById('expl-overlay')) return;
  document.getElementById('expl-overlay').classList.remove('open');
}

function selectPack(packKey, el) {
  document.querySelectorAll('.pack-tile').forEach(t=>t.classList.remove('sel'));
  el.classList.add('sel');
  explState.pack = packKey;
  const pack = HISTORY_PACK_DEFS[packKey];
  // Show desc
  const desc = document.getElementById('expl-pack-desc');
  desc.textContent = pack.desc;
  desc.style.display='block';
  // Show segment
  document.getElementById('expl-seg-section').style.display='block';
  renderExplosionPreview();
}

function selectSegment(seg, el) {
  document.querySelectorAll('.seg-chip').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
  explState.segment = seg;
  if (explState.pack) renderExplosionPreview();
}

function renderExplosionPreview() {
  if (!explState.pack) return;
  explPreviewItems = generatePackPreview(explState.pack, explState.segment);
  const list = document.getElementById('expl-preview-list');
  const pack = HISTORY_PACK_DEFS[explState.pack];
  list.innerHTML = '';
  explPreviewItems.forEach(row => {
    const div = document.createElement('div');
    div.className='expl-item';
    div.innerHTML=`
      <input type="checkbox" id="expl-cb-${row.id}" checked onchange="updateExplCount()">
      <label for="expl-cb-${row.id}" class="expl-item-name" style="cursor:pointer;">${row.name}</label>
      <div class="expl-item-meta">
        <span class="expl-tag">${pack.sub}</span>
        <span class="expl-tag agg">${row.item.agg}</span>
        <span class="expl-tag win">${row.winLabel}</span>
      </div>`;
    list.appendChild(div);
  });
  document.getElementById('expl-preview-section').style.display='block';
  updateExplCount();
}

function updateExplCount() {
  const checked = document.querySelectorAll('#expl-preview-list input[type=checkbox]:checked').length;
  const total = explPreviewItems.length;
  document.getElementById('expl-sel-count').textContent = checked;
  document.getElementById('expl-footer-info').textContent = `${total} variables in pack · ${checked} selected`;
  document.getElementById('expl-add-btn').disabled = checked===0;
  document.getElementById('expl-add-btn').textContent = checked>0 ? `+ Add Selected (${checked})` : '+ Add Selected';
}

function explSelectAll()  { document.querySelectorAll('#expl-preview-list input[type=checkbox]').forEach(c=>c.checked=true);  updateExplCount(); }
function explSelectNone() { document.querySelectorAll('#expl-preview-list input[type=checkbox]').forEach(c=>c.checked=false); updateExplCount(); }

function explAddSelected() {
  const pack = HISTORY_PACK_DEFS[explState.pack];
  if (!pack) return;
  let added = 0;
  explPreviewItems.forEach(row => {
    const cb = document.getElementById(`expl-cb-${row.id}`);
    if (!cb || !cb.checked) return;
    const segScope = SEGMENT_SCOPE[explState.segment] || SEGMENT_SCOPE.all;
    const feat = {
      bureau: state.bureau || "—",
      entity: "tradeline",
      domain: "trade_history",
      feature_name: row.name,
      sub_category: pack.sub,
      measure: row.item.measure,
      aggregation: row.item.agg,
      pack_source: explState.pack,
      label: row.item.label,
    };
    // time window
    if (row.window) feat.time_window = { type:"rolling", value:parseInt(row.window), unit:"month" };
    if (row.rwin)   feat.time_window = { type:"rolling", value:parseInt(row.rwin), unit:"month" };
    // trend/comparison
    if (row.wpair) feat.comparison_windows = { recent_window:row.wpair[0], prior_window:row.wpair[1] };
    // portfolio scope
    const scope = {};
    if (segScope.loanType && segScope.loanType.length) scope.loan_type = segScope.loanType;
    if (segScope.secured && segScope.secured !== "all") scope.secured_flag = segScope.secured;
    if (Object.keys(scope).length) feat.portfolio_scope = scope;
    // deduplicate
    if (!builtFeatures.find(f=>f.feature_name===feat.feature_name)) {
      builtFeatures.push(feat);
      added++;
    }
  });
  renderBuildList(); updateHdrCount();
  document.getElementById('status-bar').classList.add('show');
  closeExplosionModal();
  showToast(`✓ Added ${added} Trade History variables from ${pack.label} pack`);
}

// Show/hide the pack card based on varType
function updatePackCardVisibility() {
  return;
}




/* ══════════════════════════════════════════════════════
   BUREAU WORKFLOW — Frontend JS
   Handles: Upload → Parse → Normalize → Execute → Export
   ══════════════════════════════════════════════════════ */

let currentBureauRunId = null;

// ── Show/hide bureau panel when build is active ──
function toggleBureauPanel(show) {
  const panel = document.getElementById('bureau-upload-panel');
  if (panel) panel.style.display = show ? 'block' : 'none';
}

// ── Step indicator helpers ──
function setBureauStep(stepNum) {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById('bstep-' + i);
    if (!el) continue;
    if (i < stepNum)       el.className = 'bureau-step done';
    else if (i === stepNum) el.className = 'bureau-step active';
    else                   el.className = 'bureau-step';
  }
}

function bureauStatus(msg, type) {
  const el = document.getElementById('bureau-upload-status');
  if (!el) return;
  const colors = { success: '#059669', error: '#dc2626', info: '#0369a1', warn: '#d97706' };
  el.style.color = colors[type] || '#475569';
  el.textContent = msg;
}

// ── Upload & Parse Bureau File ──
async function uploadBureauFile() {
  const buildName = document.getElementById('dash-build-name')?.value?.trim()
                 || document.getElementById('build-name')?.value?.trim();
  const bureau    = document.getElementById('bureau-select')?.value;
  const fileInput = document.getElementById('bureau-file-input');
  const file      = fileInput?.files?.[0];

  if (!buildName) return bureauStatus('Please enter a build name first.', 'error');
  if (!bureau)    return bureauStatus('Please select a bureau.', 'error');
  if (!file)      return bureauStatus('Please select a bureau file.', 'error');

  const btn = document.getElementById('bureau-upload-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Uploading…'; }
  setBureauStep(1);
  bureauStatus('Uploading file…', 'info');

  const formData = new FormData();
  formData.append('build_name', buildName);
  formData.append('owner', getCurrentOwner());
  formData.append('bureau', bureau);
  formData.append('file', file);

  try {
    setBureauStep(2);
    bureauStatus('Parsing ' + bureau + ' file…', 'info');

    const res = await fetch(buildApiUrl('/bureau/upload'), {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) {
      bureauStatus('Parse error: ' + (data.detail || 'Unknown error'), 'error');
      setBureauStep(1);
      return;
    }

    currentBureauRunId = data.run_id;
    setBureauStep(3);
    bureauStatus('Normalized! ' + data.normalized_accounts + ' accounts, ' + data.normalized_inquiries + ' inquiries.', 'success');

    // Show stats
    const statsEl = document.getElementById('bureau-norm-stats');
    if (statsEl) {
      statsEl.innerHTML = [
        { num: data.normalized_applicants || 0, lbl: 'Applicants' },
        { num: data.normalized_accounts || 0,   lbl: 'Accounts' },
        { num: data.normalized_inquiries || 0,  lbl: 'Inquiries' },
      ].map(s => `
        <div class="bureau-stat-card">
          <div class="bureau-stat-num">${s.num}</div>
          <div class="bureau-stat-lbl">${s.lbl}</div>
        </div>
      `).join('');
    }

    document.getElementById('bureau-normalized-preview')?.style && 
      (document.getElementById('bureau-normalized-preview').style.display = 'block');

    setBureauStep(4);
    bureauStatus('Ready to run features! Click "Run Batch" to execute.', 'success');

  } catch (err) {
    bureauStatus('Network error: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-icons-round" style="font-size:16px;vertical-align:middle;">upload</span> Upload & Parse Bureau File'; }
  }
}

// ── Export Code ──
async function exportBureauCode(format) {
  if (!currentBureauRunId) return bureauStatus('Upload a bureau file first.', 'error');
  const url = buildApiUrl('/bureau/runs/' + currentBureauRunId + '/export/' + format);
  setBureauStep(5);
  bureauStatus('Generating ' + format + ' code…', 'info');
  try {
    const res  = await fetch(url);
    const code = await res.text();
    const blob = new Blob([code], { type: 'text/plain' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'creditiq_features_' + format + '.py';
    a.click();
    bureauStatus(format + ' code exported!', 'success');
  } catch (err) {
    bureauStatus('Export failed: ' + err.message, 'error');
  }
}

// ── View Feature Outputs ──
async function viewBureauOutputs() {
  if (!currentBureauRunId) return;
  const container = document.getElementById('bureau-outputs-table');
  if (!container) return;

  try {
    const res  = await fetch(buildApiUrl('/bureau/runs/' + currentBureauRunId + '/outputs?limit=50'));
    const data = await res.json();
    if (!data.items?.length) {
      container.style.display = 'block';
      container.innerHTML = '<p style="padding:12px;color:#64748b;font-size:12px;">No outputs yet. Run the batch first.</p>';
      return;
    }
    const rows = data.items.map(o =>
      '<tr>' +
      '<td style="padding:5px 10px;font-size:11px;font-family:monospace;border-bottom:1px solid #f1f5f9;">' + o.customer_id + '</td>' +
      '<td style="padding:5px 10px;font-size:11px;font-family:monospace;border-bottom:1px solid #f1f5f9;">' + o.feature_name + '</td>' +
      '<td style="padding:5px 10px;font-size:11px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#0369a1;">' + (o.feature_value ?? '—') + '</td>' +
      '<td style="padding:5px 10px;font-size:10px;border-bottom:1px solid #f1f5f9;color:' + (o.status === 'ready' ? '#059669' : '#d97706') + ';">' + o.status + '</td>' +
      '</tr>'
    ).join('');

    container.style.display = 'block';
    container.innerHTML = '<table style="width:100%;border-collapse:collapse;">' +
      '<thead><tr>' +
      '<th style="padding:6px 10px;font-size:10px;font-weight:800;color:#64748b;text-align:left;background:#f8fafc;border-bottom:1.5px solid #e2e8f0;text-transform:uppercase;">Customer</th>' +
      '<th style="padding:6px 10px;font-size:10px;font-weight:800;color:#64748b;text-align:left;background:#f8fafc;border-bottom:1.5px solid #e2e8f0;text-transform:uppercase;">Feature</th>' +
      '<th style="padding:6px 10px;font-size:10px;font-weight:800;color:#64748b;text-align:left;background:#f8fafc;border-bottom:1.5px solid #e2e8f0;text-transform:uppercase;">Value</th>' +
      '<th style="padding:6px 10px;font-size:10px;font-weight:800;color:#64748b;text-align:left;background:#f8fafc;border-bottom:1.5px solid #e2e8f0;text-transform:uppercase;">Status</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';
  } catch (err) {
    container.style.display = 'block';
    container.innerHTML = '<p style="padding:12px;color:#dc2626;font-size:12px;">Failed to load: ' + err.message + '</p>';
  }
}

// Show bureau panel when build name is set
function _maybeShowBureauPanel() {
  const name = document.getElementById('dash-build-name')?.value?.trim();
  const stageUnlocked = stageDetailsUnlocked;
  toggleBureauPanel(!!(name && stageUnlocked));
}

// Hook into existing stage unlock
const _origSetStageDetailsUnlocked = typeof setStageDetailsUnlocked === 'function' ? setStageDetailsUnlocked : null;
if (_origSetStageDetailsUnlocked) {
  window.setStageDetailsUnlocked = function(v) {
    _origSetStageDetailsUnlocked(v);
    _maybeShowBureauPanel();
  };
}
