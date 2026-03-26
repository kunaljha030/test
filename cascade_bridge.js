/**
 * cascade_bridge.js  v3  —  CreditIQ Dynamic Schema Bridge
 * ═══════════════════════════════════════════════════════════════════
 * FIXES in v3:
 *   - Race condition: type captured before async fetch, verified after
 *   - State reset: switching types clears previous sub-cat selection
 *   - Sub-cat cards show correct color class per type on re-render
 *   - selSubCat uses captured type, not live state.domain (can drift)
 *   - buildSubcatGrid receives explicit type param (no state read)
 * ═══════════════════════════════════════════════════════════════════
 */

/* ─── CONFIG ─────────────────────────────────────────────────────── */
const _BRIDGE_BASE = (() => {
  const s = localStorage.getItem('creditiq.apiBase');
  if (s) return s;
  return (window.location.port === '8000' || window.location.port === '') ? '' : 'http://127.0.0.1:8000';
})();

/* ─── API HELPER ─────────────────────────────────────────────────── */
async function _bridgeFetch(path, opts = {}) {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('creditiq.token');
  const hdrs  = { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) };
  const r     = await fetch(_BRIDGE_BASE + path, { ...opts, headers: { ...hdrs, ...opts.headers } });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || r.statusText); }
  return r.json();
}

/* ─── BRIDGE STATE ───────────────────────────────────────────────── */
const _bridge = {
  metadata:      null,
  cache:         {},    // cache[type][subcat] = full cascade response
  subcats:       {},    // subcats[type] = [{value, label, description}]
  activeBuildId: null,
  currentType:   null,  // ← tracks last committed type (race condition guard)
};

function _setExportAvailability(enabled) {
  const dlSec = document.getElementById('download-code-section');
  if (dlSec) dlSec.style.display = enabled ? 'block' : 'none';
  ['btn-dl-python', 'btn-dl-pyspark'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? '1' : '0.55';
    btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
  });
}

async function _getSavedVariableCount(buildId) {
  if (!buildId) return 0;
  const data = await _bridgeFetch(`/builder/variables?build_id=${encodeURIComponent(buildId)}`);
  return Number(data?.count || data?.variables?.length || 0);
}

async function _syncExportAvailability(buildId = _bridge.activeBuildId) {
  if (!buildId) {
    _setExportAvailability(false);
    return 0;
  }
  try {
    const count = await _getSavedVariableCount(buildId);
    _setExportAvailability(count > 0);
    return count;
  } catch (e) {
    console.warn('[Bridge v3] Export availability check failed:', e.message);
    _setExportAvailability(false);
    return 0;
  }
}

/* ─── LOAD METADATA ─────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', async () => {
  try {
    _bridge.metadata = await _bridgeFetch('/builder/metadata');
    console.log('[Bridge v3] Metadata loaded —', _bridge.metadata.types?.length, 'types');
  } catch (e) {
    console.warn('[Bridge v3] Metadata load failed:', e.message);
  }
});

/* ─── HELPERS ────────────────────────────────────────────────────── */
function _domainToType(domain) {
  return { enquiry:'Enquiry', trade:'Trade', account:'Account', trade_history:'Trade History' }[domain] || 'Enquiry';
}

function _typeToDomain(type) {
  return { Enquiry:'enquiry', Trade:'trade', Account:'account', 'Trade History':'trade_history' }[type] || 'enquiry';
}

function _selClassForType(type) {
  if (type === 'Trade History') return 'tradeh-sel';
  if (type === 'Trade')         return 'trade-sel';
  if (type === 'Account')       return 'account-sel';
  return 'sel';
}

function _selClass() {
  return _selClassForType(_domainToType(typeof state !== 'undefined' ? state?.domain : 'enquiry'));
}

const __origCurrentSchema = window.currentSchema;
window.__origCurrentSchema = __origCurrentSchema;

/* ─────────────────────────────────────────────────────────────────
   currentSchema() — returns API-fetched schema in app.js format
──────────────────────────────────────────────────────────────────── */
window.currentSchema = function () {
  const type    = _domainToType(typeof state !== 'undefined' ? state?.domain : 'enquiry');
  const subcats = _bridge.subcats[type] || [];
  const schema  = {};
  const defWins = _bridge.metadata?.time_windows?.map(tw => tw.value) || ['3m','6m','12m','24m','36m'];
  const fallbackSchema = typeof window.__origCurrentSchema === 'function' ? window.__origCurrentSchema() : {};

  if (!subcats.length) return fallbackSchema;

  subcats.forEach(sc => {
    const full = _bridge.cache[type]?.[sc.value];
    const fallback = fallbackSchema?.[sc.value] || {};
    const measuresObj = {};

    if (full?.measures?.length) {
      full.measures.forEach(m => {
        measuresObj[m.value] = { label: m.label, col: m.col || '', canonical: m.col || '' };
      });
    } else if (fallback.measures) {
      Object.assign(measuresObj, fallback.measures);
    }

    const aggArr = full?.aggregations?.length
      ? full.aggregations.map(a => a.value)
      : (fallback.aggregations || []);

    schema[sc.value] = {
      label: sc.label,
      type: fallback.type || 'aggregation',
      description: sc.description || fallback.description || '',
      measures: measuresObj,
      aggregations: aggArr,
      agg_params: fallback.agg_params || {},
      windows: fallback.windows || defWins,
      multi_window: Boolean(fallback.multi_window),
      needs_window: typeof fallback.needs_window === 'boolean' ? fallback.needs_window : aggArr.length > 0,
      scope_fields: full?.scope_fields?.length ? full.scope_fields : (fallback.scope_fields || []),
      threshold: full?.threshold ?? fallback.threshold ?? null,
      filters: full?.scope_fields?.length ? full.scope_fields : (fallback.filters || fallback.scope_fields || []),
      post: fallback.post || [],
      color: fallback.color || 'ft-vol',
      entity: fallback.entity || 'account',
    };
  });

  if (Object.keys(schema).length === 0 && window.__origCurrentSchema) {
    return window.__origCurrentSchema();
  }
  return schema;
};

/* ─────────────────────────────────────────────────────────────────
   OVERRIDE selVarType()
   FIX: capture type before async, verify after — race condition safe
──────────────────────────────────────────────────────────────────── */
const __origSelVarType = window.selVarType;
window.selVarType = async function (type, el) {
  /* 1. Run original (sets state.domain, shows/hides notices, resets chips) */
  if (__origSelVarType) __origSelVarType.call(window, type, el);

  /* 2. Set currentType BEFORE async so we can guard against race */
  _bridge.currentType = type;

  /* 3. Clear previous sub-cat state so old selection doesn't persist */
  if (typeof state !== 'undefined') {
    state.subCat = '';
    state.measure = '';
    state.aggregation = '';
  }

  /* 4. Clear measure/agg chips immediately */
  const mc = document.getElementById('measure-chips');
  const ac = document.getElementById('agg-chips');
  if (mc) mc.innerHTML = '';
  if (ac) ac.innerHTML = '';
  const ms = document.getElementById('measure-section');
  if (ms) ms.style.display = 'none';

  try {
    /* 5. Fetch sub-cats if not cached */
    if (!_bridge.subcats[type] || _bridge.subcats[type].length === 0) {
      const data = await _bridgeFetch(`/builder/cascade?type=${encodeURIComponent(type)}`);
      _bridge.subcats[type] = data.sub_categories || [];
    }

    /* 6. RACE GUARD: only render if user hasn't switched type again */
    if (_bridge.currentType !== type) {
      console.log('[Bridge v3] Type switched during fetch — discarding stale', type);
      return;
    }

    /* 7. Render sub-cat grid with correct type */
    _renderSubcatGrid(type);

  } catch (e) {
    console.warn('[Bridge v3] Sub-cat fetch failed for', type, e.message);
  }
};

/* ─────────────────────────────────────────────────────────────────
   _renderSubcatGrid(type) — always takes explicit type arg
   No state.domain read — avoids stale state bugs
──────────────────────────────────────────────────────────────────── */
function _renderSubcatGrid(type) {
  const subcats = _bridge.subcats[type];
  const grid    = document.getElementById('subcat-grid');
  if (!grid || !subcats || subcats.length === 0) {
    if (window.__origBuildSubcatGrid) window.__origBuildSubcatGrid.call(window);
    return;
  }

  grid.innerHTML = '';
  subcats.forEach(sc => {
    const d       = document.createElement('div');
    d.className   = 'subcat-card';
    d.dataset.key = sc.value;
    d.innerHTML   = `<div class="subcat-name">${sc.label}</div><div class="subcat-type">${sc.description || ''}</div>`;
    d.onclick     = () => _selectSubCat(type, sc.value, d);  // ← pass type explicitly
    grid.appendChild(d);
  });
}

/* ─────────────────────────────────────────────────────────────────
   OVERRIDE buildSubcatGrid()
   Delegates to _renderSubcatGrid with current state type
──────────────────────────────────────────────────────────────────── */
const __origBuildSubcatGrid = window.buildSubcatGrid;
window.buildSubcatGrid = function () {
  const type    = _domainToType(typeof state !== 'undefined' ? state?.domain : 'enquiry');
  const subcats = _bridge.subcats[type];
  if (!subcats || subcats.length === 0) {
    if (__origBuildSubcatGrid) __origBuildSubcatGrid.call(window);
    return;
  }
  _renderSubcatGrid(type);
};

/* ─────────────────────────────────────────────────────────────────
   _selectSubCat(type, key, el)
   Internal version — takes explicit type, not state.domain
   FIX: type captured at click time, not at async completion time
──────────────────────────────────────────────────────────────────── */
async function _selectSubCat(capturedType, key, el) {
  /* Mark selection on card */
  const grid = document.getElementById('subcat-grid');
  if (grid) {
    grid.querySelectorAll('.subcat-card').forEach(c => {
      c.classList.remove('sel','trade-sel','account-sel','tradeh-sel');
    });
  }
  el.classList.add(_selClassForType(capturedType));

  /* Update state */
  if (typeof state !== 'undefined') {
    state.subCat      = key;
    state.measure     = '';
    state.aggregation = '';
  }

  /* Also call original selSubCat for its side-effects (panels, notices) */
  if (window.__origSelSubCat) window.__origSelSubCat.call(window, key, el);

  try {
    /* Fetch full cascade if not cached */
    if (!_bridge.cache[capturedType]?.[key]) {
      const data = await _bridgeFetch(
        `/builder/cascade?type=${encodeURIComponent(capturedType)}&sub_category=${encodeURIComponent(key)}`
      );
      if (!_bridge.cache[capturedType]) _bridge.cache[capturedType] = {};
      _bridge.cache[capturedType][key] = data;

      const scEntry = (_bridge.subcats[capturedType] || []).find(s => s.value === key);
      if (scEntry) scEntry._full = data;
    }

    /* RACE GUARD: only render if type is still current */
    if (_bridge.currentType !== capturedType) return;

    _renderMeasureChips(capturedType, key);
    _renderAggChips(capturedType, key);
    _applyThreshold(capturedType, key);

    const msEl = document.getElementById('measure-section');
    if (msEl) msEl.style.display = 'block';

    _triggerAutoName();

  } catch (e) {
    console.warn('[Bridge v3] Full cascade failed for', capturedType, '/', key, e.message);
  }
}

/* ─────────────────────────────────────────────────────────────────
   OVERRIDE selSubCat() — redirects to _selectSubCat
──────────────────────────────────────────────────────────────────── */
const __origSelSubCat = window.selSubCat;
window.selSubCat = function (key, el) {
  /* Get current type at click time — passed explicitly to avoid stale state */
  const type = _bridge.currentType || _domainToType(typeof state !== 'undefined' ? state?.domain : 'enquiry');
  _selectSubCat(type, key, el);
};

/* ─────────────────────────────────────────────────────────────────
   OVERRIDE buildMeasureChips()
──────────────────────────────────────────────────────────────────── */
const __origBuildMeasureChips = window.buildMeasureChips;
window.buildMeasureChips = function (key) {
  const type   = _bridge.currentType || _domainToType(typeof state !== 'undefined' ? state?.domain : 'enquiry');
  if (_getMeasureOptions(type, key).length) { _renderMeasureChips(type, key); return; }
  if (__origBuildMeasureChips) __origBuildMeasureChips.call(window, key);
};

function _getMeasureOptions(type, key) {
  const cached = _bridge.cache[type]?.[key];
  if (cached?.measures?.length) return cached.measures;

  const schema = window.currentSchema?.();
  const fallbackMeasures = schema?.[key]?.measures || {};
  return Object.entries(fallbackMeasures).map(([value, meta]) => ({
    value,
    label: meta?.label || value,
    col: meta?.col || meta?.canonical || '',
  }));
}

function _renderMeasureChips(type, key) {
  const options = _getMeasureOptions(type, key);
  if (!options.length) return;
  const mc = document.getElementById('measure-chips');
  if (!mc) return;
  mc.innerHTML = '';
  const selCls = _selClassForType(type);

  options.forEach((m, idx) => {
    const d       = document.createElement('div');
    d.className   = 'chip';
    d.textContent = m.label;
    if (m.col) d.title = `Column: ${m.col}`;
    d.onclick = () => {
      mc.querySelectorAll('.chip').forEach(c => c.classList.remove('sel','trade-sel','account-sel','tradeh-sel'));
      d.classList.add(selCls);
      if (typeof state !== 'undefined') state.measure = m.value;
      _renderAggChips(type, key);
      _triggerAutoName();
    };
    mc.appendChild(d);
    if (idx === 0) { d.classList.add(selCls); if (typeof state !== 'undefined') state.measure = m.value; }
  });
}

/* ─────────────────────────────────────────────────────────────────
   OVERRIDE buildAggChips()
──────────────────────────────────────────────────────────────────── */
const __origBuildAggChips = window.buildAggChips;
window.buildAggChips = function (key) {
  const type   = _bridge.currentType || _domainToType(typeof state !== 'undefined' ? state?.domain : 'enquiry');
  if (_getAggregationOptions(type, key).length) { _renderAggChips(type, key); return; }
  if (__origBuildAggChips) __origBuildAggChips.call(window, key);
};

function _getAggregationOptions(type, key) {
  const cached = _bridge.cache[type]?.[key];
  if (cached?.aggregations?.length) return cached.aggregations;

  const schema = window.currentSchema?.();
  const fallbackAggs = schema?.[key]?.aggregations || [];
  const labels = _bridge.metadata?.aggregation_labels || {};
  return fallbackAggs.map(value => ({
    value,
    label: labels[value] || value,
  }));
}

function _renderAggChips(type, key) {
  const options = _getAggregationOptions(type, key);
  if (!options.length) return;
  const ac = document.getElementById('agg-chips');
  if (!ac) return;
  ac.innerHTML = '';
  const selCls = _selClassForType(type);

  options.forEach((a, idx) => {
    const d       = document.createElement('div');
    d.className   = 'chip';
    d.textContent = a.label;
    d.dataset.agg = a.value;
    d.onclick = () => {
      ac.querySelectorAll('.chip').forEach(c => c.classList.remove('sel','trade-sel','account-sel','tradeh-sel'));
      d.classList.add(selCls);
      if (typeof state !== 'undefined') state.aggregation = a.value;
      const pctRow = document.getElementById('pct-row');
      if (pctRow) pctRow.style.display = (a.value === 'percentile' || a.value === 'pct') ? 'block' : 'none';
      _triggerAutoName();
    };
    ac.appendChild(d);
    if (idx === 0) { d.classList.add(selCls); if (typeof state !== 'undefined') state.aggregation = a.value; }
  });
}

/* ─────────────────────────────────────────────────────────────────
   OVERRIDE loadTimeStep()
──────────────────────────────────────────────────────────────────── */
const __origLoadTimeStep = window.loadTimeStep;
window.loadTimeStep = function () {
  const type   = _bridge.currentType || _domainToType(typeof state !== 'undefined' ? state?.domain : 'enquiry');
  const key    = typeof state !== 'undefined' ? state?.subCat : '';
  const cached = _bridge.cache[type]?.[key];

  if (!cached) { if (__origLoadTimeStep) __origLoadTimeStep.call(window); return; }

  const wins   = _bridge.metadata?.time_windows?.map(tw => tw.value) || ['3m','6m','12m','24m','36m'];
  const selCls = _selClassForType(type);
  if (typeof state !== 'undefined') { state.timeWindows = []; state.velPair = null; state.customWindow = ''; }

  const nw = document.getElementById('normal-windows');
  const vw = document.getElementById('velocity-windows');
  const cwRow = document.getElementById('custom-window-row');
  if (nw) nw.style.display = 'block';
  if (vw) vw.style.display = 'none';
  if (cwRow) cwRow.classList.remove('show');

  const twc = document.getElementById('tw-chips');
  if (!twc) return;
  twc.innerHTML = '';
  const multiHint = document.getElementById('multi-hint');
  if (multiHint) multiHint.style.display = 'none';

  wins.forEach(w => {
    const d       = document.createElement('div');
    d.className   = 'tw-chip';
    d.textContent = w;
    d.onclick = () => {
      twc.querySelectorAll('.tw-chip').forEach(c => c.classList.remove('sel','trade-sel','tradeh-sel'));
      d.classList.add(selCls);
      if (typeof state !== 'undefined') state.timeWindows = [w];
      if (cwRow) cwRow.classList.remove('show');
      _triggerAutoName();
    };
    twc.appendChild(d);
  });

  const cw      = document.createElement('div');
  cw.className  = 'tw-chip custom-tw';
  cw.textContent = 'Custom';
  cw.onclick = () => {
    cw.classList.toggle(selCls);
    const on = cw.classList.contains('sel') || cw.classList.contains('trade-sel') || cw.classList.contains('tradeh-sel');
    if (cwRow) cwRow.classList.toggle('show', on);
    if (!on && typeof state !== 'undefined') { state.customWindow = ''; const cwv = document.getElementById('custom-window-val'); if (cwv) cwv.value = ''; }
  };
  twc.appendChild(cw);

  const def = [...twc.querySelectorAll('.tw-chip')].find(x => x.textContent === '12m');
  if (def) { def.classList.add(selCls); if (typeof state !== 'undefined') state.timeWindows = ['12m']; }
};

/* ─────────────────────────────────────────────────────────────────
   THRESHOLD
──────────────────────────────────────────────────────────────────── */
function _applyThreshold(type, key) {
  const cfg    = _bridge.cache[type]?.[key]?.threshold;
  const dpdSec = document.getElementById('cond-trade-dpd');
  const ovdSec = document.getElementById('cond-trade-overdue');
  if (dpdSec) dpdSec.style.display = 'none';
  if (ovdSec) ovdSec.style.display = 'none';
  if (!cfg || !cfg.enabled) return;
  if (cfg.type === 'dpd' && dpdSec) {
    dpdSec.style.display = 'block';
    const opSel = document.getElementById('dpd-op');
    if (opSel && cfg.operators?.length)
      opSel.innerHTML = cfg.operators.map(op => `<option value="${op}">${op}</option>`).join('');
    const hint = dpdSec.querySelector('.hint');
    if (hint) hint.textContent = cfg.placeholder || 'e.g. 30, 60, 90';
  }
  if (cfg.type === 'amount' && ovdSec) ovdSec.style.display = 'block';
}

/* ─────────────────────────────────────────────────────────────────
   AUTO-NAME
──────────────────────────────────────────────────────────────────── */
async function _triggerAutoName() {
  if (typeof state === 'undefined') return;
  if (!state?.varType || !state?.subCat) return;
  const p = new URLSearchParams({
    variable_type: state.varType,
    sub_category:  state.subCat,
    aggregation:   state.aggregation || 'count',
    time_window:   _getEffectiveWindow(),
    measure:       state.measure     || '',
  });
  const dpdVal = document.getElementById('dpd-val')?.value;
  const dpdOp  = document.getElementById('dpd-op')?.value;
  if (dpdVal) { p.set('dpd_val', dpdVal); p.set('dpd_op', dpdOp || '>='); }
  try {
    const data = await _bridgeFetch(`/builder/auto-name?${p}`);
    const inp  = document.getElementById('feat-name-override');
    if (inp && !inp.value.trim()) inp.value = data.name;
    const ffn  = document.getElementById('final-feat-name');
    if (ffn) ffn.textContent = data.name;
    if (window.updateLiveJSON) window.updateLiveJSON();
  } catch (_) {}
}

/* ─────────────────────────────────────────────────────────────────
   PERSIST variable → /builder/variable
──────────────────────────────────────────────────────────────────── */
const __origAddVariable = window.addVariable;
window.addVariable = async function () {
  if (__origAddVariable) __origAddVariable.call(window);

  const buildName = document.getElementById('build-name')?.value?.trim()
    || (typeof state !== 'undefined' ? state?.buildName : '');
  const owner = window.getCurrentOwner?.() || 'guest';
  if (!buildName) return;

  const featureName = document.getElementById('feat-name-override')?.value?.trim()
    || document.getElementById('final-feat-name')?.textContent?.trim()
    || _makeDefaultName();

  try {
    const res = await _bridgeFetch('/builder/variable', {
      method: 'POST',
      body: JSON.stringify({
        build_name: buildName, owner,
        bureau: typeof state !== 'undefined' ? state?.bureau : null,
        variable: {
          name:           featureName,
          variable_type:  typeof state !== 'undefined' ? state?.varType     : 'Enquiry',
          sub_category:   typeof state !== 'undefined' ? state?.subCat      : '',
          measure:        typeof state !== 'undefined' ? state?.measure      : '',
          aggregation:    typeof state !== 'undefined' ? state?.aggregation  : 'count',
          time_window:    _getEffectiveWindow(),
          loan_types:     _getLoanTypes(),
          secured:        _getSecured(),
          account_status: _getAccountStatus(),
          ownership:      _getOwnership(),
          dpd_op:    document.getElementById('dpd-op')?.value || null,
          dpd_val:   document.getElementById('dpd-val')?.value ? parseInt(document.getElementById('dpd-val').value) : null,
          amount_op: document.getElementById('overdue-op')?.value || null,
          amount_val:document.getElementById('overdue-val')?.value ? parseFloat(document.getElementById('overdue-val').value) : null,
        },
        auto_config: true,
      }),
    });
    _bridge.activeBuildId = res.build?.id || _bridge.activeBuildId;
    if (_bridge.activeBuildId) sessionStorage.setItem('creditiq.activeBuildId', _bridge.activeBuildId);
    _setExportAvailability(true);
  } catch (e) {
    console.warn('[Bridge v3] API persist failed (local state OK):', e.message);
  }
};

/* ─────────────────────────────────────────────────────────────────
   downloadBuildCode()
──────────────────────────────────────────────────────────────────── */
window.downloadBuildCode = async function (format) {
  if (!_bridge.activeBuildId) {
    const saved = sessionStorage.getItem('creditiq.activeBuildId');
    if (saved) _bridge.activeBuildId = parseInt(saved);
  }
  if (!_bridge.activeBuildId) {
    _setExportAvailability(false);
    _toast('Save at least one variable in the current build before downloading code.');
    return;
  }
  try {
    const savedCount = await _syncExportAvailability(_bridge.activeBuildId);
    if (!savedCount) {
      _toast('Save at least one variable in the current build before downloading code.');
      return;
    }
    const r    = await fetch(_BRIDGE_BASE + `/builder/export/${format}?build_id=${_bridge.activeBuildId}`);
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || r.statusText);
    }
    const code = await r.text();
    const name = ((typeof state !== 'undefined' ? state?.buildName : null) || 'build').replace(/\s+/g,'_')
      + (format === 'python' ? '.py' : '_spark.py');
    Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([code],{type:'text/plain'})),
      download: name
    }).click();
    _toast('✓ ' + (format === 'python' ? 'Python' : 'PySpark') + ' code exported!');
  } catch (e) { _toast('Export failed: ' + e.message); }
};

/* ─────────────────────────────────────────────────────────────────
   Wire goBuilderScreen → create build in DB
──────────────────────────────────────────────────────────────────── */
const __origGoBuilderScreen = window.goBuilderScreen;
window.goBuilderScreen = async function () {
  if (__origGoBuilderScreen) await __origGoBuilderScreen.call(window);
  const buildName = document.getElementById('build-name')?.value?.trim()
    || (typeof state !== 'undefined' ? state?.buildName : '');
  const owner = window.getCurrentOwner?.() || 'guest';
  if (!buildName) return;
  try {
    const res = await _bridgeFetch('/builder/build', {
      method: 'POST',
      body: JSON.stringify({ name: buildName, owner, bureau: typeof state !== 'undefined' ? state?.bureau : null }),
    });
    _bridge.activeBuildId = res.build?.id;
    sessionStorage.setItem('creditiq.activeBuildId', _bridge.activeBuildId);
    await _syncExportAvailability(_bridge.activeBuildId);
    /* Pre-fetch Enquiry sub-cats (default type) */
    if (!_bridge.subcats['Enquiry']?.length) {
      const data = await _bridgeFetch('/builder/cascade?type=Enquiry');
      _bridge.subcats['Enquiry'] = data.sub_categories || [];
    }
    _bridge.currentType = 'Enquiry';
    _renderSubcatGrid('Enquiry');
  } catch (e) {
    console.warn('[Bridge v3] Build create failed:', e.message);
  }
};

/* ─── bootDashboard → restore build ID ──────────────────────────── */
const __origBootDashboard = window.bootDashboard;
window.bootDashboard = async function (user) {
  if (__origBootDashboard) __origBootDashboard.call(window, user);
  const saved = sessionStorage.getItem('creditiq.activeBuildId');
  if (saved) {
    _bridge.activeBuildId = parseInt(saved);
    await _syncExportAvailability(_bridge.activeBuildId);
  } else {
    _setExportAvailability(false);
  }
};

/* ─── Live input listeners ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  ['dpd-val','dpd-op','overdue-val','overdue-op','custom-window-val'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', _triggerAutoName);
  });
});

/* ─── HELPERS ────────────────────────────────────────────────────── */
function _getEffectiveWindow() {
  if (typeof state === 'undefined') return '12m';
  if (state.customWindow) return state.customWindow + 'm';
  if (state.timeWindows?.length) {
    const w = state.timeWindows[0];
    return typeof w === 'object' ? w.value + 'm' : String(w);
  }
  return '12m';
}
function _getLoanTypes() {
  if (typeof state === 'undefined') return [];
  return state?.tradeScope?.loanType?.length ? state.tradeScope.loanType
       : state?.accScope?.loanType?.length   ? state.accScope.loanType
       : state?.filters?.product?.length     ? state.filters.product : [];
}
function _getSecured() {
  if (typeof state === 'undefined') return 'all';
  return state?.tradeScope?.secured || state?.accScope?.secured || state?.filters?.secured || 'all';
}
function _getAccountStatus() {
  if (typeof state === 'undefined') return [];
  if (Array.isArray(state?.accScope?.status) && state.accScope.status.length) return state.accScope.status;
  if (state?.tradeScope?.status && state.tradeScope.status !== 'all') return [state.tradeScope.status];
  return [];
}
function _getOwnership() {
  if (typeof state === 'undefined') return 'all';
  return state?.tradeScope?.ownership || state?.accScope?.ownership || 'all';
}
function _makeDefaultName() {
  if (typeof state === 'undefined') return 'feature_' + Date.now();
  return [
    _domainToType(state?.domain || 'enquiry').toLowerCase().slice(0,3),
    (state?.subCat || '').slice(0,4),
    (state?.aggregation || 'cnt').slice(0,3),
    _getEffectiveWindow().replace('m','') + 'm',
  ].filter(Boolean).join('_');
}
function _toast(msg) {
  if (window.showToast) window.showToast(msg); else console.log('[Bridge v3]', msg);
}

console.log('[CascadeBridge] v3 loaded ✓ — Race condition fixed, state management clean');


/* ═══════════════════════════════════════════════════════════════════
   SP3 + SP4 HTML INJECTION
   sp3-content aur sp4-content khali div hain — inke andar
   scope aur time-window HTML inject karo taaki
   loadTimeStep() aur updateWizUI() ke getElementById calls kaam karein
═══════════════════════════════════════════════════════════════════ */

function _injectScopePanelHTML() {
  const sp3 = document.getElementById('sp3-content');
  if (!sp3 || sp3.dataset.injected) return;
  sp3.dataset.injected = '1';
  sp3.innerHTML = `
    <!-- Enquiry Scope -->
    <div id="sp3-enquiry">
      <div class="sdiv" style="margin-top:0;">Product / Loan Type <span style="font-weight:400;color:var(--text3)">(none = all)</span></div>
      <div class="filter-chips" id="filter-product">
        <div class="fchip sel" id="prod-all" onclick="selProduct('all',this)">All</div>
        <div class="fchip" onclick="toggleFilter(this,'product','PL')">PL</div>
        <div class="fchip" onclick="toggleFilter(this,'product','CC')">CC</div>
        <div class="fchip" onclick="toggleFilter(this,'product','HL')">HL</div>
        <div class="fchip" onclick="toggleFilter(this,'product','AL')">AL</div>
        <div class="fchip" onclick="toggleFilter(this,'product','BL')">BL</div>
        <div class="fchip" onclick="toggleFilter(this,'product','GL')">GL</div>
        <div class="fchip" onclick="toggleFilter(this,'product','OD')">OD</div>
        <div class="fchip" onclick="toggleFilter(this,'product','LAP')">LAP</div>
        <div class="fchip" onclick="toggleFilter(this,'product','CD')">CD</div>
      </div>
      <div class="hint">Leave blank = All loan types</div>
      <div class="sdiv" style="margin-top:14px;">Secured / Unsecured</div>
      <div class="filter-chips">
        <div class="fchip sel" id="sec-all"       onclick="selSecured('all',this)">All</div>
        <div class="fchip"     id="sec-secured"   onclick="selSecured('secured',this)">Secured</div>
        <div class="fchip"     id="sec-unsecured" onclick="selSecured('unsecured',this)">Unsecured</div>
      </div>
      <div id="enq-lender-section" style="display:none;margin-top:14px;">
        <div class="sdiv">Lender Filter</div>
        <div class="filter-chips" id="filter-lender-enq">
          <div class="fchip" onclick="toggleFilter(this,'lender','HDFC')">HDFC</div>
          <div class="fchip" onclick="toggleFilter(this,'lender','ICICI')">ICICI</div>
          <div class="fchip" onclick="toggleFilter(this,'lender','SBI')">SBI</div>
          <div class="fchip" onclick="toggleFilter(this,'lender','AXIS')">AXIS</div>
          <div class="fchip" onclick="toggleFilter(this,'lender','KOTAK')">KOTAK</div>
        </div>
      </div>
    </div>

    <!-- Trade / Trade History Scope -->
    <div id="sp3-trade" style="display:none;">
      <div class="sdiv" style="margin-top:0;">Loan Type <span style="font-weight:400;color:var(--text3)">(none = all)</span></div>
      <div class="filter-chips" id="trade-loan-type">
        <div class="fchip" onclick="toggleTradeScope(this,'loanType','PL')">PL</div>
        <div class="fchip" onclick="toggleTradeScope(this,'loanType','CC')">CC</div>
        <div class="fchip" onclick="toggleTradeScope(this,'loanType','HL')">HL</div>
        <div class="fchip" onclick="toggleTradeScope(this,'loanType','AL')">AL</div>
        <div class="fchip" onclick="toggleTradeScope(this,'loanType','BL')">BL</div>
        <div class="fchip" onclick="toggleTradeScope(this,'loanType','GL')">GL</div>
        <div class="fchip" onclick="toggleTradeScope(this,'loanType','OD')">OD</div>
        <div class="fchip" onclick="toggleTradeScope(this,'loanType','LAP')">LAP</div>
      </div>
      <div class="hint">Leave blank = All loan types</div>
      <div class="sdiv" style="margin-top:14px;">Secured / Unsecured</div>
      <div class="filter-chips">
        <div class="fchip sel" id="tsec-all"  onclick="selTradeSecured('all',this)">All</div>
        <div class="fchip"     id="tsec-sec"  onclick="selTradeSecured('secured',this)">Secured</div>
        <div class="fchip"     id="tsec-unsec" onclick="selTradeSecured('unsecured',this)">Unsecured</div>
      </div>
      <div class="sdiv" style="margin-top:14px;">Account Status</div>
      <div class="filter-chips">
        <div class="fchip sel" id="tstat-all"     onclick="selTradeStatus('all',this)">All</div>
        <div class="fchip"     id="tstat-active"  onclick="selTradeStatus('Active',this)">Active</div>
        <div class="fchip"     id="tstat-closed"  onclick="selTradeStatus('Closed',this)">Closed</div>
        <div class="fchip status-wo"     id="tstat-wo"      onclick="selTradeStatus('Written-Off',this)">Written Off</div>
        <div class="fchip status-settled" id="tstat-settled" onclick="selTradeStatus('Settled',this)">Settled</div>
        <div class="fchip status-suit"   id="tstat-suit"    onclick="selTradeStatus('Suit-Filed',this)">Suit Filed</div>
      </div>
      <div class="sdiv" style="margin-top:14px;">Ownership</div>
      <div class="filter-chips">
        <div class="fchip sel" id="town-all"  onclick="selTradeOwn('all',this)">All</div>
        <div class="fchip"     id="town-ind"  onclick="selTradeOwn('individual',this)">Individual</div>
        <div class="fchip"     id="town-joint" onclick="selTradeOwn('joint',this)">Joint</div>
        <div class="fchip"     id="town-guar" onclick="selTradeOwn('guarantor',this)">Guarantor</div>
      </div>
    </div>

    <!-- Account Scope -->
    <div id="sp3-account" style="display:none;">
      <div class="sdiv" style="margin-top:0;">Product Scope <span style="font-weight:400;color:var(--text3)">(none = all)</span></div>
      <div class="filter-chips" id="acc-product-chips-scope">
        <div class="fchip sel" id="aprod-all-s" onclick="selAccProduct('all',this)">All Products</div>
        <div class="fchip" onclick="toggleAccScope(this,'loanType','HL')">HL</div>
        <div class="fchip" onclick="toggleAccScope(this,'loanType','AL')">AL</div>
        <div class="fchip" onclick="toggleAccScope(this,'loanType','PL')">PL</div>
        <div class="fchip" onclick="toggleAccScope(this,'loanType','BL')">BL</div>
        <div class="fchip" onclick="toggleAccScope(this,'loanType','CC')">CC</div>
        <div class="fchip" onclick="toggleAccScope(this,'loanType','GL')">GL</div>
        <div class="fchip" onclick="toggleAccScope(this,'loanType','LAP')">LAP</div>
      </div>
      <div class="hint" style="margin-top:4px;">Leave blank = All loan types</div>
      <div class="sdiv" style="margin-top:14px;">Secured / Unsecured</div>
      <div class="filter-chips">
        <div class="fchip sel" id="asec-all-s"  onclick="selAccSecured('all',this)">All</div>
        <div class="fchip"     id="asec-sec-s"  onclick="selAccSecured('secured',this)">Secured</div>
        <div class="fchip"     id="asec-unsec-s" onclick="selAccSecured('unsecured',this)">Unsecured</div>
      </div>
      <div class="sdiv" style="margin-top:14px;">Account Status <span style="font-weight:400;color:var(--text3)">(multi-select)</span></div>
      <div class="filter-chips">
        <div class="fchip sel" id="astat-all-s"  onclick="selAccStatus('all',this)">All</div>
        <div class="fchip" id="astat-active-s"   onclick="toggleAccStatus(this,'Active')">Active</div>
        <div class="fchip" id="astat-closed-s"   onclick="toggleAccStatus(this,'Closed')">Closed</div>
        <div class="fchip status-wo" id="astat-wo-s"       onclick="toggleAccStatus(this,'Written-Off')">Written Off</div>
        <div class="fchip status-settled" id="astat-settled-s" onclick="toggleAccStatus(this,'Settled')">Settled</div>
        <div class="fchip" id="astat-npa-s"      onclick="toggleAccStatus(this,'NPA')">NPA</div>
        <div class="fchip" id="astat-sma-s"      onclick="toggleAccStatus(this,'SMA')">SMA</div>
      </div>
      <div class="sdiv" style="margin-top:14px;">Ownership</div>
      <div class="filter-chips">
        <div class="fchip sel" id="aown-all-s"  onclick="selAccOwnership('all',this)">All</div>
        <div class="fchip"     id="aown-ind-s"  onclick="selAccOwnership('individual',this)">Individual</div>
        <div class="fchip"     id="aown-joint-s" onclick="selAccOwnership('joint',this)">Joint</div>
        <div class="fchip"     id="aown-guar-s" onclick="selAccOwnership('guarantor',this)">Guarantor</div>
      </div>
    </div>
  `;
}

function _injectTimeWindowHTML() {
  const sp4 = document.getElementById('sp4-content');
  if (!sp4 || sp4.dataset.injected) return;
  sp4.dataset.injected = '1';
  sp4.innerHTML = `
    <div id="time-based-on-section" style="display:none;margin-bottom:12px;">
      <div class="sdiv" style="margin-top:0;">Time Based On</div>
      <div class="filter-chips" id="time-based-chips">
        <div class="chip sel" onclick="selTimeBased(this,'date_reported')">Date Reported</div>
        <div class="chip" onclick="selTimeBased(this,'date_opened')">Date Opened</div>
        <div class="chip" onclick="selTimeBased(this,'date_closed')">Date Closed</div>
      </div>
    </div>

    <div id="normal-windows">
      <div class="sdiv" style="margin-top:0;">Time Window</div>
      <div id="multi-hint" class="hint" style="display:none;margin-bottom:8px;">Multi-select: hold to pick multiple windows</div>
      <div class="option-chips" id="tw-chips"></div>
      <div id="custom-window-row" style="display:none;margin-top:10px;display:none;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:13px;color:var(--text2);font-weight:500;">Custom (months):</span>
          <input type="number" class="thresh-val" id="custom-window-val" placeholder="e.g. 18" min="1" max="120" style="width:90px;">
        </div>
      </div>
    </div>

    <div id="velocity-windows" style="display:none;">
      <div class="sdiv" style="margin-top:0;">Window Pair</div>
      <div class="option-chips" id="velpair-chips"></div>
      <div id="trend-accel-section" style="display:none;margin-top:12px;">
        <div class="sdiv">Triple Window (Acceleration)</div>
        <div class="option-chips" id="accel-chips"></div>
      </div>
      <div id="trend-class-section" style="display:none;margin-top:12px;">
        <div class="sdiv">Classification Output</div>
        <div class="hint">Labels: improving / deteriorating / stable / volatile</div>
      </div>
    </div>
  `;
}

/* Inject HTML as soon as DOM is ready, and also hook into goBuilderScreen */
document.addEventListener('DOMContentLoaded', () => {
  _injectScopePanelHTML();
  _injectTimeWindowHTML();
});

/* Also inject when builder screen opens (in case DOM wasn't ready earlier) */
const __origGoBuilderScreen_inject = window.goBuilderScreen;
window.goBuilderScreen = async function () {
  if (__origGoBuilderScreen_inject) await __origGoBuilderScreen_inject.apply(window, arguments);
  setTimeout(() => {
    _injectScopePanelHTML();
    _injectTimeWindowHTML();
  }, 100);
};

console.log('[Bridge v3] Scope + TimeWindow HTML injection ready');
