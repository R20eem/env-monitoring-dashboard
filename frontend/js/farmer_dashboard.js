/**
 * File: farmer_dashboard.js
 *
 * Purpose:
 * Handles farmer dashboard functionality including site selection,
 * live sensor data display, and risk level visualization.
 *
 * Responsibilities:
 * - Fetch and display sensor readings
 * - Manage site selection and filtering
 * - Render charts and statistics
 * - Handle NASA POWER API integration for weather data
 *
 * Layer:
 * Frontend
 *
 * Related:
 * - index.html
 * - Farmer.css
 * - l18n.js
 */

/* ============================================================
   FARMER DASHBOARD — farmer_dashboard.js
   Live data: FastAPI /api/dashboard/* endpoints
   Fallback:  static data derived from pest_monitoring.csv
   NASA:      POWER API (same pattern as researcher.js)
   ============================================================ */

'use strict';

const API_BASE  = 'http://127.0.0.1:8000';
const NASA_BASE = 'https://power.larc.nasa.gov/api/temporal/daily/point';

/* Coordinates matching researcher.js SITE_COORDS */
const SITE_COORDS = {
  site_maize:    { lat: -17.8, lon: 31.0 },
  site_orchard:  { lat: -17.9, lon: 31.1 },
  site_brassica: { lat: -17.7, lon: 31.2 },
};

/* ── AUTH GUARD ── */
(function () {
  const role  = localStorage.getItem('userRole');
  const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
  if (role === 'researcher' && token) {
    window.location.replace('researcher.html');
  }
})();

/* ══════════════════════════════════════════════════════════
   STATIC FALLBACK DATA (from pest_monitoring.csv last 7 days)
══════════════════════════════════════════════════════════ */
const STATIC = {
  sites: {
    site_maize:    { label:'Maize',    score:74, grade:'attention', gradeLabel:'Attention',
                     desc:'High humidity is driving disease risk. Leaf wetness sustained 3+ days.',
                     color:'#c97c1a' },
    site_orchard:  { label:'Orchard',  score:69, grade:'attention', gradeLabel:'Attention',
                     desc:'Pest trap counts elevated. Outbreak risk rising this week.',
                     color:'#c94040' },
    site_brassica: { label:'Brassica', score:80, grade:'good',      gradeLabel:'Good',
                     desc:'Most stable site. Low pest count, disease risk manageable.',
                     color:'#63a33e' }
  },
  chart: {
    site_maize:    { dates:['Dec 25','Dec 26','Dec 27','Dec 28','Dec 29','Dec 30','Dec 31'],
                     risk:[73.5,67.8,63.1,60.0,54.1,64.5,71.3], temp:[18.3,15.7,16.1,18.8,23.2,24.4,22.1], pest:[2.94,2.46,2.56,2.25,1.71,2.95,3.29] },
    site_orchard:  { dates:['Dec 25','Dec 26','Dec 27','Dec 28','Dec 29','Dec 30','Dec 31'],
                     risk:[73.1,67.4,62.7,60.2,54.6,65.1,71.4], temp:[18.2,15.7,16.0,18.8,23.1,24.5,21.9], pest:[3.82,3.21,2.65,3.33,2.96,4.96,4.25] },
    site_brassica: { dates:['Dec 25','Dec 26','Dec 27','Dec 28','Dec 29','Dec 30','Dec 31'],
                     risk:[70.4,67.6,62.4,59.7,54.2,64.7,71.5], temp:[18.4,15.5,15.9,19.0,23.0,24.4,21.6], pest:[1.22,1.09,0.93,1.11,1.20,1.66,1.65] }
  },
  insights: {
    site_maize:    { color:'#c97c1a', text:'Warm, sticky air (22°C / 79% humidity) is keeping disease risk elevated. Leaf wetness has stayed high for 3+ days — ideal conditions for fungal spread.',
                     temp:'22.1°C', humidity:'78.8%', pest:'3.3 avg', alerts:'63 today' },
    site_orchard:  { color:'#c94040', text:'Pest trap counts have spiked to 4+ this week. Temperature is at pest hatch threshold (>22°C). Check irrigation in the south-east corner — low soil moisture there.',
                     temp:'21.9°C', humidity:'78.3%', pest:'4.3 avg', alerts:'66 today' },
    site_brassica: { color:'#63a33e', text:'Conditions are the most stable of all three sites. Pest count below 2 on average. A good window to apply preventative treatment before the next humidity spike.',
                     temp:'21.6°C', humidity:'78.6%', pest:'1.7 avg', alerts:'56 today' }
  },
  calendar: [
    { dow:'Mon', num:'25', past:true,  events:[{ type:'f-ev-danger',  text:'57 alerts — Maize'     },{ type:'f-ev-danger',  text:'70 alerts — Orchard' }]},
    { dow:'Tue', num:'26', past:true,  events:[{ type:'f-ev-warning', text:'Risk falling all sites' },{ type:'f-ev-info',    text:'24 alerts — Maize'   }]},
    { dow:'Wed', num:'27', past:true,  events:[{ type:'f-ev-success', text:'Lowest pest count week' },{ type:'f-ev-info',    text:'Risk 62–63 all sites' }]},
    { dow:'Thu', num:'28', past:true,  events:[{ type:'f-ev-warning', text:'Humidity climbing again' },{ type:'f-ev-warning', text:'39 alerts — Orchard' }]},
    { dow:'Fri', num:'29', past:true,  events:[{ type:'f-ev-success', text:'Best conditions this week' },{ type:'f-ev-info',  text:'Temp peak: 23°C'    }]},
    { dow:'Sat', num:'30', past:true,  events:[{ type:'f-ev-danger',  text:'Pest spike — Orchard'  },{ type:'f-ev-warning',  text:'62 alerts raised'   }]},
    { dow:'Sun', num:'31', today:true, events:[{ type:'f-ev-danger',  text:'Rain 11.28 mm/hr'      },{ type:'f-ev-warning',  text:'All sites: warning'  },{ type:'f-ev-nasa', text:'NASA: high wind — spray risk' }]}
  ]
};

/* ══════════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════════ */
let currentSite  = 'site_maize';
let riskChart    = null;
let currentView  = 'simple'; // 'simple' | 'detailed'

/* ══════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  setupUser();
  setupViewToggle();
  renderHero();
  renderView();
  loadScanSummary();
  renderMap();
  renderCalendar();
  setTimeout(() => renderChart(currentSite), 80);
  fetchLiveData();
  fetchNasaData();
});

/* ── LISTEN FOR LANGUAGE CHANGES ── */
document.addEventListener('languageChanged', () => {
  renderView();
  loadScanSummary();
  const titleEl = document.getElementById('f-chart-title');
  if (titleEl) titleEl.textContent = `Risk — ${getLocalizedSiteName(currentSite)}`;
});

/* ══════════════════════════════════════════════════════════
   USER / AUTH UI
══════════════════════════════════════════════════════════ */
function setupUser() {
  const email = localStorage.getItem('userEmail') || '';
  const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
  const role  = localStorage.getItem('userRole') || '';

  const initials = email ? email.slice(0, 2).toUpperCase() : 'FA';
  setText('f-avatar-initials', initials);
  setText('f-user-name-display', email || 'Farmer');

  /* Logout button */
  const logoutBtn = document.getElementById('f-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = 'login.html';
    });
  }

  /* Topbar right-side buttons - NO sign out button here, only sidebar logout */
  const navActions = document.getElementById('f-nav-actions');
  if (navActions) {
    const langToggle = document.getElementById('lang-toggle');
    const viewToggle = document.getElementById('f-view-toggle');
    const hasLangToggle = langToggle && navActions.contains(langToggle);
    const hasViewToggle = viewToggle && navActions.contains(viewToggle);

    if (token && role) {
      // Logged in: show dashboard link only, no sign out in topbar
      navActions.innerHTML = `<a href="index.html" class="f-btn f-btn-ghost">Dashboard</a>`;
    } else {
      // Not logged in: show sign in and register
      navActions.innerHTML = `
        <a href="login.html"    class="f-btn f-btn-ghost">Sign In</a>
        <a href="register.html" class="f-btn f-btn-primary">Register</a>
      `;
    }

    if (hasViewToggle) navActions.insertBefore(viewToggle, navActions.firstChild);
    if (hasLangToggle) navActions.insertBefore(langToggle, navActions.firstChild);
  }
}

/* ══════════════════════════════════════════════════════════
   LIVE API FETCH
   Hits all dashboard endpoints; merges into static data on success.
   Silent fallback to CSV static if API offline.
══════════════════════════════════════════════════════════ */
async function fetchLiveData() {
  const endpoints = {
    temperature:       '/api/dashboard/temperature/latest',
    humidity:          '/api/dashboard/humidity/latest',
    leafWetness:       '/api/dashboard/leaf-wetness/latest',
    pestCount:         '/api/dashboard/pest-count/latest',
    rainfall:          '/api/dashboard/rainfall/latest',
    status:            '/api/dashboard/status/latest',
    alertTriggered:    '/api/dashboard/alert-triggered/latest',
    alertDiseaseHigh:  '/api/dashboard/alert-disease-high/latest',
  };

  try {
    const results = await Promise.allSettled(
      Object.entries(endpoints).map(async ([key, path]) => {
        const res = await fetch(`${API_BASE}${path}`);
        if (!res.ok) throw new Error(res.status);
        return [key, await res.json()];
      })
    );

    const live = {};
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        const [key, data] = r.value;
        live[key] = data;
      }
    });

    if (Object.keys(live).length === 0) return;

    /* Merge live values into insight mini-stats */
    ['site_maize','site_orchard','site_brassica'].forEach(id => {
      const temp  = getForSite(live.temperature,   id, 'latest_temp_c');
      const humid = getForSite(live.humidity,       id, 'latest_humidity_pct');
      const pest  = getForSite(live.pestCount,      id, 'latest_pest_count');
      const alert = getForSite(live.alertTriggered, id, 'latest_alert_triggered');
      const rain  = getForSite(live.rainfall,       id, 'latest_rainfall_mm_hr');

      if (temp !== null) {
        STATIC.insights[id].temp     = `${parseFloat(temp).toFixed(1)}°C`;
        STATIC.insights[id].humidity = `${parseFloat(humid).toFixed(1)}%`;
        STATIC.insights[id].pest     = `${parseFloat(pest).toFixed(1)} avg`;
        STATIC.insights[id].alerts   = alert ? 'Alert active' : 'No alert';
        if (id === currentSite) renderInsight(id);
      }
      /* Update hero rain stat from maize (representative) */
      if (id === 'site_maize' && rain !== null) {
        setText('f-hero-rain', `${parseFloat(rain).toFixed(1)} mm`);
      }
    });

    /* Update live indicator */
    const dot = document.getElementById('f-live-dot');
    if (dot) dot.style.background = '#63a33e';

  } catch (e) {
    console.warn('Farmer dashboard: API unavailable, static data in use.', e);
  }
}

function getForSite(arr, siteId, field) {
  if (!Array.isArray(arr)) return null;
  const row = arr.find(r => r.site_id === siteId);
  return row ? row[field] : null;
}

/* ══════════════════════════════════════════════════════════
   NASA POWER API FETCH
   Exact same pattern as researcher.js fetchNasaData()
══════════════════════════════════════════════════════════ */
function fmtNasaDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

async function fetchNasaData() {
  const coords = SITE_COORDS['site_maize'];
  const today  = new Date();
  const end    = fmtNasaDate(today);
  const start  = fmtNasaDate(new Date(today - 30 * 86400000));
  const clean  = v => (v == null || v <= -990) ? null : v;

  const params = new URLSearchParams({
    parameters: 'T2M,ALLSKY_SFC_SW_DWN,PRECTOTCORR,WS10M,RH2M',
    community:  'AG',
    longitude:  coords.lon,
    latitude:   coords.lat,
    start, end,
    format: 'JSON',
  });

  try {
    const res  = await fetch(`${NASA_BASE}?${params}`);
    if (!res.ok) throw new Error('NASA API failed');
    const json  = await res.json();
    const props = json.properties?.parameter || {};
    const dates  = Object.keys(props.T2M || {}).sort();
    const latest = dates[dates.length - 1];

    const t2m    = clean(props.T2M?.[latest]);
    const allsky = clean(props.ALLSKY_SFC_SW_DWN?.[latest]);
    const prec   = clean(props.PRECTOTCORR?.[latest]);
    const ws10m  = clean(props.WS10M?.[latest]);
    const rh2m   = clean(props.RH2M?.[latest]);

    if (!t2m && !allsky && !prec) throw new Error('all null');

    const gdd  = t2m   != null ? Math.max(0, t2m - 10).toFixed(1) : null;
    const ndvi = allsky != null
      ? Math.min(0.95, Math.max(0.1, 0.3 + allsky/1000 * 0.5 - (prec||0)/50)).toFixed(2)
      : null;

    /* Inject NASA values into the last calendar day (today) */
    if (t2m !== null) {
      const todayEntry = STATIC.calendar[STATIC.calendar.length - 1];
      todayEntry.events = todayEntry.events.filter(e => e.type !== 'f-ev-nasa');
      const windStr = ws10m != null ? `${parseFloat(ws10m).toFixed(1)} m/s` : '';
      todayEntry.events.push({ type:'f-ev-nasa', text: `NASA: ${t2m.toFixed(1)}°C · ${windStr ? 'Wind '+windStr : ''}` });

      /* Add a risk line to the chart for NASA regional temp */
      injectNasaRegionalLine(props.T2M, dates, clean);
    }

    /* Update NASA pill colour to confirm live */
    const pill = document.querySelector('.f-nasa-pill');
    if (pill) pill.style.background = 'rgba(45,125,214,0.15)';

    /* Update insight text for the current site with NASA context */
    if (ndvi !== null) {
      const ndviFlt = parseFloat(ndvi);
      const s = STATIC.sites[currentSite];
      const ndviNote = ndviFlt > 0.55
        ? `NASA satellite shows strong crop greenness (NDVI ${ndvi}) — plants are holding up despite sensor alerts.`
        : `NASA satellite NDVI is ${ndvi} — crop greenness is below healthy threshold. Consider field inspection.`;
      STATIC.insights[currentSite].text += ` ${ndviNote}`;
      renderInsight(currentSite);
    }

    renderCalendar();

  } catch (e) {
    console.warn('NASA API unavailable — static calendar used.', e);
  }
}

async function loadScanSummary() {
  const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
  const card  = document.getElementById('scan-summary-card');
  if (!card) return;

  // Show skeleton while loading
  card.innerHTML = `<div style="color:#a8b89a;font-size:13px;padding:8px 0;">Loading your scan data...</div>`;

  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/scanner/my-summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();

    const total   = data.total_scans ?? 0;
    const healthy = data.healthy_count ?? 0;
    const disease = data.disease_risk_count ?? 0;
    const pest    = data.pest_risk_count ?? 0;
    const latest  = data.latest_scan?.prediction ?? '-';
    const pct     = n => total ? Math.round(n / total * 100) : 0;

    const T = k => (typeof I18n !== 'undefined') ? I18n.t(k) : k;
    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
        <div>
          <div class="f-card-title">🔍 ${T('f.scan_title')}</div>
          <div class="f-card-sub">${T('f.scan_sub')}</div>
        </div>
        <a href="scanner.html" style="font-size:12px;color:#4f8730;font-weight:600;text-decoration:none;padding:6px 14px;border:1px solid #b3d996;border-radius:20px;">
          ${T('scan.btn')} →
        </a>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">

        <div style="grid-column:1/-1;background:linear-gradient(135deg,#1a2e10,#3d6b22);border-radius:12px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">${T('f.scan_total')}</div>
            <div style="font-size:36px;font-weight:800;color:#fff;line-height:1;">${total}</div>
          </div>
          <div style="font-size:48px;opacity:0.25;">🌿</div>
        </div>

        <div style="background:#eaf5d8;border:2px solid #b3d996;border-radius:12px;padding:14px 16px;">
          <div style="font-size:11px;color:#3d6b22;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px;">✅ ${T('f.scan_healthy')}</div>
          <div style="font-size:30px;font-weight:800;color:#3d6b22;line-height:1;">${healthy}</div>
          <div style="margin-top:8px;height:4px;background:rgba(0,0,0,0.07);border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:${pct(healthy)}%;background:#63a33e;border-radius:99px;transition:width 0.6s;"></div>
          </div>
          <div style="font-size:10px;color:#89c064;margin-top:4px;">${pct(healthy)}%</div>
        </div>

        <div style="background:#fdf0f0;border:2px solid #f5c0c0;border-radius:12px;padding:14px 16px;">
          <div style="font-size:11px;color:#c94040;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px;">🦠 ${T('f.scan_disease')}</div>
          <div style="font-size:30px;font-weight:800;color:#c94040;line-height:1;">${disease}</div>
          <div style="margin-top:8px;height:4px;background:rgba(0,0,0,0.07);border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:${pct(disease)}%;background:#c94040;border-radius:99px;transition:width 0.6s;"></div>
          </div>
          <div style="font-size:10px;color:#e08080;margin-top:4px;">${pct(disease)}%</div>
        </div>

        <div style="background:#fdf3e3;border:2px solid #f0d898;border-radius:12px;padding:14px 16px;">
          <div style="font-size:11px;color:#c97c1a;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px;">🪲 ${T('f.scan_pest')}</div>
          <div style="font-size:30px;font-weight:800;color:#c97c1a;line-height:1;">${pest}</div>
          <div style="margin-top:8px;height:4px;background:rgba(0,0,0,0.07);border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:${pct(pest)}%;background:#c97c1a;border-radius:99px;transition:width 0.6s;"></div>
          </div>
          <div style="font-size:10px;color:#d4a840;margin-top:4px;">${pct(pest)}%</div>
        </div>

        <div style="background:#fff;border:1px solid rgba(0,0,0,0.1);border-radius:12px;padding:14px 16px;">
          <div style="font-size:11px;color:#a8b89a;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px;">🕐 ${T('f.scan_latest')}</div>
          <div style="font-size:15px;font-weight:700;color:#111a08;font-family:monospace;">${latest}</div>
          <a href="alerts.html" style="display:inline-block;margin-top:8px;font-size:11px;color:#4f8730;font-weight:600;text-decoration:none;">${T('alerts.all')} →</a>
        </div>

      </div>
    `;

  } catch (err) {
    console.error("error loading scan summary:", err);
  }
}

/* Adds a dashed NASA regional temperature line to the risk chart */
function injectNasaRegionalLine(t2mObj, dates, clean) {
  if (!riskChart || !t2mObj) return;
  /* Use last 7 dates that overlap with chart */
  const last7 = dates.slice(-7);
  const nasaTemps = last7.map(d => {
    const v = clean(t2mObj[d]);
    return v !== null ? parseFloat(v.toFixed(1)) : null;
  });

  /* Check if NASA dataset already added */
  const exists = riskChart.data.datasets.find(ds => ds.label === 'NASA regional temp');
  if (!exists) {
    riskChart.data.datasets.push({
      type: 'line',
      label: 'NASA regional temp',
      data: nasaTemps,
      borderColor: '#2d7dd6',
      borderDash: [6, 3],
      borderWidth: 1.5,
      backgroundColor: 'transparent',
      pointRadius: 0,
      tension: 0.4,
      yAxisID: 'y2',
    });
    riskChart.update();
  }
}

/* ══════════════════════════════════════════════════════════
   VIEW TOGGLE
══════════════════════════════════════════════════════════ */
function setupViewToggle() {
  const topbar = document.getElementById('f-nav-actions');
  if (!topbar) return;

  const toggle = document.createElement('div');
  toggle.id = 'f-view-toggle';
  toggle.style.cssText = 'display:flex;align-items:center;gap:4px;background:rgba(0,0,0,0.06);border-radius:8px;padding:3px;';
  toggle.innerHTML = `
    <button id="btn-simple"   onclick="setView('simple')"
      style="padding:5px 12px;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;background:#fff;color:#3b6d11;box-shadow:0 1px 3px rgba(0,0,0,0.12);">
      🌱 Simple
    </button>
    <button id="btn-detailed" onclick="setView('detailed')"
      style="padding:5px 12px;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.15s;background:transparent;color:#7a8a65;box-shadow:none;">
      📊 Detailed
    </button>
  `;
  topbar.prepend(toggle);
}

window.setView = function(view) {
  currentView = view;
  const btnSimple   = document.getElementById('btn-simple');
  const btnDetailed = document.getElementById('btn-detailed');
  if (btnSimple && btnDetailed) {
    if (view === 'simple') {
      btnSimple.style.cssText   += ';background:#fff;color:#3b6d11;box-shadow:0 1px 3px rgba(0,0,0,0.12);';
      btnDetailed.style.cssText += ';background:transparent;color:#7a8a65;box-shadow:none;';
    } else {
      btnDetailed.style.cssText += ';background:#fff;color:#3b6d11;box-shadow:0 1px 3px rgba(0,0,0,0.12);';
      btnSimple.style.cssText   += ';background:transparent;color:#7a8a65;box-shadow:none;';
    }
  }
  renderView();
  // re-render chart only in detailed view
  if (view === 'detailed') setTimeout(() => renderChart(currentSite), 80);
};

function renderView() {
  const simpleSection   = document.getElementById('f-simple-view');
  const detailedSection = document.getElementById('f-detailed-view');
  if (!simpleSection || !detailedSection) {
    renderTiles();
    renderInsight(currentSite);
    return;
  }
  // Simple view is ALWAYS rendered and visible
  simpleSection.style.display = 'block';
  renderSimpleView();
  
  // Detailed extras only show in detailed mode
  if (currentView === 'detailed') {
    detailedSection.style.display = 'block';
    renderTiles();
    renderInsight(currentSite);
  } else {
    detailedSection.style.display = 'none';
  }
}

/* ── SIMPLE VIEW ── */
function renderSimpleView() {
  const container = document.getElementById('f-simple-view');
  if (!container) return;

  const T = k => (typeof I18n !== 'undefined') ? I18n.t(k) : k;

  const siteData = {
    site_maize: {
      emoji: '🌽', name: T('sv.site_maize'),
      status: 'warning', statusLabel: T('sv.status_warning'),
      statusColor: '#c97c1a', statusBg: '#fff8ee',
      message: T('sv.msg_maize'),
      action: T('sv.action_maize'),
      temp: '22°C', rain: '11mm', pestLevel: 2, alerts: 63
    },
    site_orchard: {
      emoji: '🍎', name: T('sv.site_orchard'),
      status: 'danger', statusLabel: T('sv.status_danger'),
      statusColor: '#c94040', statusBg: '#fff0f0',
      message: T('sv.msg_orchard'),
      action: T('sv.action_orchard'),
      temp: '22°C', rain: '11mm', pestLevel: 4, alerts: 66
    },
    site_brassica: {
      emoji: '🥦', name: T('sv.site_brassica'),
      status: 'good', statusLabel: T('sv.status_good'),
      statusColor: '#3d6b22', statusBg: '#f0f8ea',
      message: T('sv.msg_brassica'),
      action: T('sv.action_brassica'),
      temp: '22°C', rain: '11mm', pestLevel: 1, alerts: 56
    }
  };

  // Today's weather summary
  const weatherBlock = `
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.07);border-radius:14px;padding:20px 24px;margin-bottom:20px;display:flex;gap:24px;flex-wrap:wrap;align-items:center;">
      <div style="font-size:36px;">🌦️</div>
      <div style="flex:1;min-width:160px;">
        <div style="font-size:17px;font-weight:700;color:#111a08;margin-bottom:4px;">${T('sv.today_title')}</div>
        <div style="font-size:13px;color:#7a8a65;">December 31, 2023</div>
      </div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;">
        <div style="text-align:center;">
          <div style="font-size:26px;">🌡️</div>
          <div style="font-size:16px;font-weight:700;color:#111a08;">22°C</div>
          <div style="font-size:11px;color:#7a8a65;">${T('sv.temperature')}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:26px;">💧</div>
          <div style="font-size:16px;font-weight:700;color:#111a08;">79%</div>
          <div style="font-size:11px;color:#7a8a65;">${T('sv.humidity')}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:26px;">🌧️</div>
          <div style="font-size:16px;font-weight:700;color:#111a08;">11 mm</div>
          <div style="font-size:11px;color:#7a8a65;">${T('sv.rain_today')}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:26px;">🚨</div>
          <div style="font-size:16px;font-weight:700;color:#c94040;">185</div>
          <div style="font-size:11px;color:#7a8a65;">${T('sv.alerts_today')}</div>
        </div>
      </div>
    </div>
  `;

  // Per-site simple cards
  const siteCards = Object.entries(siteData).map(([id, s]) => {
    const pestDots = Array(5).fill(0).map((_, i) =>
      `<span style="width:14px;height:14px;border-radius:50%;display:inline-block;margin-right:3px;background:${i < s.pestLevel ? s.statusColor : '#e5e5e5'};"></span>`
    ).join('');

    return `
      <div style="background:${s.statusBg};border:2px solid ${s.statusColor}33;border-radius:14px;padding:20px 22px;cursor:pointer;"
           onclick="window.setView('detailed');window.selectSite('${id}')">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
          <div style="font-size:40px;line-height:1;">${s.emoji}</div>
          <div style="flex:1;">
            <div style="font-size:17px;font-weight:700;color:#111a08;">${s.name}</div>
            <div style="display:inline-block;margin-top:4px;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;background:${s.statusColor};color:#fff;">
              ${s.statusLabel}
            </div>
          </div>
        </div>
        <div style="font-size:14px;color:#3d4a2a;line-height:1.6;margin-bottom:14px;">${s.message}</div>
        <div style="background:rgba(0,0,0,0.04);border-radius:8px;padding:10px 14px;font-size:13px;color:#3d4a2a;margin-bottom:14px;">
          <strong>${T('sv.action_label')}</strong> ${s.action}
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#7a8a65;">
          <span>${T('sv.pest_activity')}</span>${pestDots}
        </div>
        <div style="margin-top:10px;font-size:11px;color:#a8b89a;">${T('sv.tap_details')}</div>
      </div>
    `;
  }).join('');

  // 7-day simple summary
  const weekDays = [
    {key:'sv.day_mon', emoji:'🔴', noteKey:'sv.note_alerts_high'},
    {key:'sv.day_tue', emoji:'🟡', noteKey:'sv.note_better'},
    {key:'sv.day_wed', emoji:'🟢', noteKey:'sv.note_best'},
    {key:'sv.day_thu', emoji:'🟡', noteKey:'sv.note_humidity'},
    {key:'sv.day_fri', emoji:'🟢', noteKey:'sv.note_nice'},
    {key:'sv.day_sat', emoji:'🔴', noteKey:'sv.note_pests'},
    {key:'sv.day_sun', emoji:'🔴', noteKey:'sv.note_today'},
  ];

  const weekSummary = `
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.07);border-radius:14px;padding:20px 24px;margin-top:20px;">
      <div style="font-size:15px;font-weight:700;color:#111a08;margin-bottom:14px;">${T('sv.week_title')}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;text-align:center;">
        ${weekDays.map(d => `
          <div style="background:#f4f9ed;border-radius:8px;padding:8px 4px;">
            <div style="font-size:11px;color:#7a8a65;font-weight:600;">${T(d.key)}</div>
            <div style="font-size:20px;margin:4px 0;">${d.emoji}</div>
            <div style="font-size:10px;color:#7a8a65;">${T(d.noteKey)}</div>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:10px;font-size:12px;color:#7a8a65;">${T('sv.week_legend')}</div>
    </div>
  `;

  container.innerHTML = weatherBlock +
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;">${siteCards}</div>` +
    weekSummary;
}

/* ══════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════ */
function renderHero() {
  const avgScore = Math.round(
    Object.values(STATIC.sites).reduce((a, s) => a + s.score, 0) / 3
  );
  setText('f-hero-score',  `${avgScore}/100`);
  setText('f-hero-alerts', '63');
  setText('f-hero-rain',   '11.3 mm');

  const email = localStorage.getItem('userEmail') || '';
  const first = email ? email.split('@')[0].split('.')[0] : '';
  const cap   = first ? first.charAt(0).toUpperCase() + first.slice(1) : 'Farmer';
  setText('f-hero-name', `Good day, ${cap}`);
}

/* ── LOCALIZATION HELPERS ── */
function getLocalizedSiteName(siteId) {
  const siteMap = { 'site_maize': 'f.site_maize', 'site_orchard': 'f.site_orchard', 'site_brassica': 'f.site_brassica' };
  return typeof I18n !== 'undefined' ? I18n.t(siteMap[siteId]) : STATIC.sites[siteId].label;
}
function getLocalizedGradeLabel(grade) {
  const gradeMap = { 'attention': 'f.grade_attention', 'good': 'f.grade_good', 'critical': 'f.grade_critical' };
  return typeof I18n !== 'undefined' ? I18n.t(gradeMap[grade]) : grade;
}
function getLocalizedSiteDesc(siteId) {
  const descMap = { 'site_maize': 'f.desc_maize', 'site_orchard': 'f.desc_orchard', 'site_brassica': 'f.desc_brassica' };
  return typeof I18n !== 'undefined' ? I18n.t(descMap[siteId]) : STATIC.sites[siteId].desc;
}
function getLocalizedInsight(siteId) {
  const insightMap = { 'site_maize': 'f.insight_maize', 'site_orchard': 'f.insight_orchard', 'site_brassica': 'f.insight_brassica' };
  return typeof I18n !== 'undefined' ? I18n.t(insightMap[siteId]) : STATIC.insights[siteId].text;
}

/* ══════════════════════════════════════════════════════════
   HEALTH SCORE TILES  (detailed view)
══════════════════════════════════════════════════════════ */
function renderTiles() {
  const grid = document.getElementById('f-tile-grid');
  if (!grid) return;

  const tileExtras = {
    site_maize:    { icon:'🌽', trendDir:'up',   trendKey:'dv.trend_rising',  temp:'22.1°C', humidity:'78.8%', pest:'3.3',  rain:'11mm' },
    site_orchard:  { icon:'🍎', trendDir:'up',   trendKey:'dv.trend_spiking', temp:'21.9°C', humidity:'78.3%', pest:'4.3',  rain:'11mm' },
    site_brassica: { icon:'🥦', trendDir:'flat', trendKey:'dv.trend_stable',  temp:'21.6°C', humidity:'78.6%', pest:'1.7',  rain:'11mm' }
  };

  const gradeConfig = {
    good:      { color:'#3d6b22', bg:'#f0f8ea', border:'#97c459', bar:'#63a33e', badgeKey:'dv.badge_good' },
    attention: { color:'#854f0b', bg:'#fff8ee', border:'#ef9f27', bar:'#c97c1a', badgeKey:'dv.badge_watch' },
    critical:  { color:'#a32d2d', bg:'#fff0f0', border:'#e24b4a', bar:'#c94040', badgeKey:'dv.badge_alert' }
  };

  const T = k => (typeof I18n !== 'undefined') ? I18n.t(k) : k;

  grid.innerHTML = Object.entries(STATIC.sites).map(([id, s]) => {
    const ex = tileExtras[id];
    const gc = gradeConfig[s.grade];
    const isActive = id === currentSite;
    const trendColor = ex.trendDir === 'up' ? '#c94040' : ex.trendDir === 'down' ? '#3d6b22' : '#c97c1a';
    const trendLabel = T(ex.trendKey);
    const badge      = T(gc.badgeKey);

    // Mini sparkline SVG from chart data
    const pts = STATIC.chart[id].risk;
    const minV = Math.min(...pts), maxV = Math.max(...pts);
    const sparkW = 80, sparkH = 28;
    const coords = pts.map((v, i) => {
      const x = (i / (pts.length - 1)) * sparkW;
      const y = sparkH - ((v - minV) / (maxV - minV || 1)) * sparkH;
      return `${x},${y}`;
    }).join(' ');
    const sparkline = `<svg width="${sparkW}" height="${sparkH}" viewBox="0 0 ${sparkW} ${sparkH}" style="display:block;">
      <polyline points="${coords}" fill="none" stroke="${gc.bar}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${(pts.length-1)/(pts.length-1)*sparkW}" cy="${sparkH - ((pts[pts.length-1]-minV)/(maxV-minV||1))*sparkH}" r="3" fill="${gc.bar}"/>
    </svg>`;

    return `
    <div onclick="selectSite('${id}')" role="button" tabindex="0"
      style="background:${isActive ? gc.bg : '#fff'};border:2px solid ${isActive ? gc.border : 'rgba(0,0,0,0.07)'};
             border-radius:14px;padding:18px 20px;cursor:pointer;transition:all 0.18s;position:relative;overflow:hidden;">

      <!-- top row: icon + name + badge -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="font-size:28px;line-height:1;">${ex.icon}</div>
          <div>
            <div style="font-size:14px;font-weight:700;color:#111a08;">${getLocalizedSiteName(id)}</div>
            <div style="font-size:11px;color:${trendColor};font-weight:600;margin-top:2px;">${trendLabel}</div>
          </div>
        </div>
        <div style="padding:3px 9px;border-radius:20px;background:${gc.bar};color:#fff;font-size:11px;font-weight:700;white-space:nowrap;">
          ${badge}
        </div>
      </div>

      <!-- score + sparkline -->
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:10px;">
        <div>
          <div style="font-size:36px;font-weight:800;color:${gc.color};line-height:1;">${s.score}</div>
          <div style="font-size:11px;color:#a8b89a;font-weight:500;">${T('dv.score_label')}</div>
        </div>
        <div style="text-align:right;">
          ${sparkline}
          <div style="font-size:10px;color:#a8b89a;margin-top:3px;">${T('dv.7day_risk')}</div>
        </div>
      </div>

      <!-- score bar -->
      <div style="height:5px;background:#e8ede0;border-radius:99px;margin-bottom:12px;overflow:hidden;">
        <div style="height:100%;width:${s.score}%;background:${gc.bar};border-radius:99px;transition:width 0.6s ease;"></div>
      </div>

      <!-- 4 micro-stats -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:10px;">
        ${[
          { label: T('dv.temp'),     val: ex.temp,     icon:'🌡️' },
          { label: T('dv.humidity'), val: ex.humidity, icon:'💧' },
          { label: T('dv.pests'),    val: ex.pest,     icon:'🪲' },
          { label: T('dv.rain'),     val: ex.rain,     icon:'🌧️' }
        ].map(m => `
          <div style="background:rgba(0,0,0,0.03);border-radius:7px;padding:5px 4px;text-align:center;">
            <div style="font-size:13px;">${m.icon}</div>
            <div style="font-size:11px;font-weight:700;color:#111a08;">${m.val}</div>
            <div style="font-size:9px;color:#a8b89a;">${m.label}</div>
          </div>
        `).join('')}
      </div>

      <!-- desc -->
      <div style="font-size:12px;color:#7a8a65;line-height:1.5;border-top:1px solid rgba(0,0,0,0.05);padding-top:10px;">
        ${getLocalizedSiteDesc(id)}
      </div>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════
   SITE SELECTION
══════════════════════════════════════════════════════════ */
window.selectSite = function (id) {
  currentSite = id;
  document.querySelectorAll('.f-site-btn').forEach((b, i) => {
    const ids = ['site_maize','site_orchard','site_brassica'];
    b.classList.toggle('active', ids[i] === id);
  });
  renderView();
  renderChart(id);
  const titleEl = document.getElementById('f-chart-title');
  if (titleEl) titleEl.textContent = `Risk — ${getLocalizedSiteName(id)}`;
};

/* ══════════════════════════════════════════════════════════
   RISK CHART — dual line: risk level + temperature
══════════════════════════════════════════════════════════ */
function renderChart(siteId) {
  const canvas = document.getElementById('f-risk-chart');
  if (!canvas || typeof Chart === 'undefined') return;
  const d = STATIC.chart[siteId];
  if (riskChart) { riskChart.destroy(); riskChart = null; }

  // Make canvas fill its container
  canvas.style.position = 'absolute';
  canvas.style.inset = '0';

  riskChart = new Chart(canvas, {
    data: {
      labels: d.dates,
      datasets: [
        {
          type: 'line',
          label: 'Risk level',
          data: d.risk,
          borderColor: '#c94040',
          backgroundColor: 'rgba(201,64,64,0.07)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: d.risk.map(v => v >= 70 ? '#c94040' : v >= 55 ? '#c97c1a' : '#63a33e'),
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          borderWidth: 2.5,
          yAxisID: 'yRisk'
        },
        {
          type: 'line',
          label: 'Temperature (°C)',
          data: d.temp,
          borderColor: '#3d6b22',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#3d6b22',
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
          borderWidth: 1.8,
          borderDash: [5, 4],
          yAxisID: 'yTemp'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#fff',
          borderColor: '#e5e5e5',
          borderWidth: 1,
          titleColor: '#111a08',
          bodyColor: '#3d4a2a',
          padding: 12,
          titleFont: { size: 12, weight: '700' },
          bodyFont: { size: 13 },
          callbacks: {
            label: ctx => {
              if (ctx.dataset.label === 'Risk level') {
                const v = ctx.parsed.y;
                const level = v >= 70 ? '🔴 High' : v >= 55 ? '🟡 Medium' : '🟢 Low';
                return `  Risk: ${v.toFixed(0)}  ${level}`;
              }
              return `  Temp: ${ctx.parsed.y.toFixed(1)}°C`;
            }
          }
        },
        // Draw coloured zone bands
        beforeDraw: chart => {
          const { ctx, chartArea, scales } = chart;
          if (!chartArea) return;
          const y = scales.yRisk;
          const zones = [
            { from: 70, to: 100, color: 'rgba(201,64,64,0.04)' },
            { from: 55, to: 70,  color: 'rgba(201,124,26,0.05)' },
            { from: 30, to: 55,  color: 'rgba(99,163,62,0.04)' }
          ];
          zones.forEach(z => {
            const yTop = y.getPixelForValue(z.to);
            const yBot = y.getPixelForValue(z.from);
            ctx.fillStyle = z.color;
            ctx.fillRect(chartArea.left, yTop, chartArea.width, yBot - yTop);
          });
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12 }, color: '#7a8a65' },
          border: { display: false }
        },
        yRisk: {
          position: 'left',
          min: 30, max: 100,
          grid: { color: 'rgba(0,0,0,0.05)' },
          border: { display: false },
          ticks: {
            font: { size: 11 },
            color: '#c94040',
            stepSize: 20,
            callback: v => {
              if (v === 70) return '70 ⚠';
              return `${v}`;
            }
          }
        },
        yTemp: {
          position: 'right',
          min: 10, max: 30,
          grid: { display: false },
          border: { display: false },
          ticks: {
            font: { size: 11 },
            color: '#3d6b22',
            callback: v => `${v}°`
          }
        }
      }
    }
  });
}

/* ══════════════════════════════════════════════════════════
   INSIGHT PANEL  (detailed view)
══════════════════════════════════════════════════════════ */
function renderInsight(siteId) {
  const panel = document.getElementById('f-insight-panel');
  if (!panel) return;
  const ins = STATIC.insights[siteId];
  const s   = STATIC.sites[siteId];

  // Risk gauge arc (SVG)
  const score = s.score;
  const R = 44, cx = 56, cy = 56;
  const startAngle = Math.PI * 0.75;
  const sweep      = Math.PI * 1.5;
  const angle      = startAngle + (score / 100) * sweep;
  const arcX = cx + R * Math.cos(angle);
  const arcY = cy + R * Math.sin(angle);
  const bgX  = cx + R * Math.cos(startAngle + sweep);
  const bgY  = cy + R * Math.sin(startAngle + sweep);
  const trackPath = `M ${cx + R * Math.cos(startAngle)} ${cy + R * Math.sin(startAngle)}
    A ${R} ${R} 0 1 1 ${bgX} ${bgY}`;
  const fillPath  = `M ${cx + R * Math.cos(startAngle)} ${cy + R * Math.sin(startAngle)}
    A ${R} ${R} 0 ${score > 50 ? 1 : 0} 1 ${arcX} ${arcY}`;
  const gaugeColor = score >= 75 ? '#63a33e' : score >= 60 ? '#c97c1a' : '#c94040';

  // Recommendations per site using i18n
  const T = k => (typeof I18n !== 'undefined') ? I18n.t(k) : k;
  const recs = {
    site_maize: [
      { icon:'👀', text: T('dv.rec_maize_1') },
      { icon:'🌬️', text: T('dv.rec_maize_2') },
      { icon:'📅', text: T('dv.rec_maize_3') }
    ],
    site_orchard: [
      { icon:'🪤', text: T('dv.rec_orchard_1') },
      { icon:'💧', text: T('dv.rec_orchard_2') },
      { icon:'🚿', text: T('dv.rec_orchard_3') }
    ],
    site_brassica: [
      { icon:'✅', text: T('dv.rec_brassica_1') },
      { icon:'🛡️', text: T('dv.rec_brassica_2') },
      { icon:'📊', text: T('dv.rec_brassica_3') }
    ]
  };

  const whatHappening = T('dv.insight_what');

  panel.innerHTML = `
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.07);border-radius:14px;padding:20px;height:100%;display:flex;flex-direction:column;gap:14px;box-sizing:border-box;">

      <!-- header -->
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:10px;height:10px;border-radius:50%;background:${ins.color};flex-shrink:0;"></div>
        <div style="font-size:14px;font-weight:700;color:#111a08;">${getLocalizedSiteName(siteId)} — ${whatHappening}</div>
      </div>

      <!-- gauge + 4 stats -->
      <div style="display:flex;align-items:center;gap:16px;">
        <svg width="112" height="80" viewBox="0 0 112 80" style="flex-shrink:0;">
          <path d="${trackPath}" fill="none" stroke="#e8ede0" stroke-width="8" stroke-linecap="round"/>
          <path d="${fillPath}"  fill="none" stroke="${gaugeColor}" stroke-width="8" stroke-linecap="round"/>
          <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="20" font-weight="800" fill="${gaugeColor}">${score}</text>
          <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="9" fill="#a8b89a">${T('dv.gauge_label')}</text>
        </svg>
        <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${[
            { label: T('dv.temp_label'),     val: ins.temp,     icon:'🌡️' },
            { label: T('dv.humidity_label'), val: ins.humidity, icon:'💧' },
            { label: T('dv.pest_label'),     val: ins.pest,     icon:'🪲' },
            { label: T('dv.alerts_label'),   val: ins.alerts,   icon:'🚨' }
          ].map(m => `
            <div style="background:#f8faf5;border-radius:8px;padding:8px 10px;">
              <div style="font-size:11px;color:#a8b89a;margin-bottom:2px;">${m.icon} ${m.label}</div>
              <div style="font-size:14px;font-weight:700;color:#111a08;">${m.val}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- insight text -->
      <div style="font-size:13px;color:#3d4a2a;line-height:1.65;background:#f8faf5;border-radius:10px;padding:12px 14px;border-left:3px solid ${ins.color};">
        ${getLocalizedInsight(siteId)}
      </div>

      <!-- recommendations -->
      <div style="flex:1;display:flex;flex-direction:column;">
        <div style="font-size:11px;font-weight:700;color:#a8b89a;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">${T('dv.rec_title')}</div>
        <div style="display:flex;flex-direction:column;gap:6px;flex:1;">
          ${recs[siteId].map((r, i) => `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 12px;background:${i === 0 ? '#fff8ee' : '#f8faf5'};border-radius:8px;${i === 0 ? `border-left:3px solid ${ins.color};` : ''}flex:1;">
              <span style="font-size:16px;flex-shrink:0;">${r.icon}</span>
              <span style="font-size:12.5px;color:#3d4a2a;line-height:1.4;">${r.text}</span>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;
}

/* ══════════════════════════════════════════════════════════
   MAP
══════════════════════════════════════════════════════════ */
function renderMap() {
  const svg = document.getElementById('f-farm-map');
  if (!svg) return;

  svg.innerHTML = `
    <defs>
      <pattern id="fg" width="28" height="28" patternUnits="userSpaceOnUse">
        <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(61,107,34,0.06)" stroke-width="0.5"/>
      </pattern>
    </defs>
    <rect width="600" height="250" fill="#f0f3ee"/>
    <rect width="600" height="250" fill="url(#fg)"/>

    <rect x="18"  y="18"  width="168" height="214" rx="5" fill="rgba(99,163,62,0.08)"  stroke="rgba(99,163,62,0.25)"  stroke-width="1"/>
    <text x="102" y="138" text-anchor="middle" font-size="9" fill="rgba(61,107,34,0.35)" font-family="DM Mono,monospace">MAIZE FIELD</text>
    <rect x="212" y="24"  width="158" height="202" rx="5" fill="rgba(201,64,64,0.07)"  stroke="rgba(201,64,64,0.22)"  stroke-width="1"/>
    <text x="291" y="135" text-anchor="middle" font-size="9" fill="rgba(140,50,50,0.35)" font-family="DM Mono,monospace">ORCHARD</text>
    <rect x="396" y="14"  width="188" height="222" rx="5" fill="rgba(201,124,26,0.07)" stroke="rgba(201,124,26,0.22)" stroke-width="1"/>
    <text x="490" y="135" text-anchor="middle" font-size="9" fill="rgba(130,80,10,0.35)" font-family="DM Mono,monospace">BRASSICA</text>

    <ellipse cx="455" cy="195" rx="55" ry="25"
             fill="rgba(100,100,100,0.07)" stroke="rgba(100,100,100,0.18)"
             stroke-width="1" stroke-dasharray="5,3"/>
    <text x="455" y="213" text-anchor="middle" font-size="9" fill="#a8b89a" font-family="DM Sans,sans-serif">low moisture (NASA)</text>

    <text x="102" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="#111a08" font-family="Syne,sans-serif">Maize</text>
    <text x="102" y="93" text-anchor="middle" font-size="10" fill="#8f5a0a" font-family="DM Mono,monospace">74/100</text>
    <text x="291" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="#111a08" font-family="Syne,sans-serif">Orchard</text>
    <text x="291" y="93" text-anchor="middle" font-size="10" fill="#c94040" font-family="DM Mono,monospace">69/100 !</text>
    <text x="490" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="#111a08" font-family="Syne,sans-serif">Brassica</text>
    <text x="490" y="93" text-anchor="middle" font-size="10" fill="#3d6b22" font-family="DM Mono,monospace">80/100</text>

    <circle cx="291" cy="110" r="14" fill="rgba(201,64,64,0.1)" stroke="rgba(201,64,64,0.35)" stroke-width="1"/>

    <circle cx="102" cy="110" r="8" fill="#c97c1a" stroke="#fff" stroke-width="2" class="f-dot-click" data-site="site_maize"    style="cursor:pointer"/>
    <circle cx="291" cy="110" r="9" fill="#c94040" stroke="#fff" stroke-width="2" class="f-dot-click f-site-pulse" data-site="site_orchard"  style="cursor:pointer"/>
    <circle cx="490" cy="110" r="8" fill="#63a33e" stroke="#fff" stroke-width="2" class="f-dot-click" data-site="site_brassica" style="cursor:pointer"/>
  `;

  const tooltip = document.getElementById('f-map-tooltip');
  const tips = {
    site_maize:    '<strong>Maize</strong><br>Score: 74/100 — Attention<br>Pest avg: 3.3 · Alerts: 63<br>Humidity: 78.8%',
    site_orchard:  '<strong>Orchard</strong><br>Score: 69/100 — Attention<br>Pest avg: 4.3 · Alerts: 66<br>Near NASA low-moisture zone',
    site_brassica: '<strong>Brassica</strong><br>Score: 80/100 — Good<br>Pest avg: 1.7 · Alerts: 56<br>Stable conditions'
  };

  svg.querySelectorAll('.f-dot-click').forEach(dot => {
    dot.addEventListener('mouseenter', e => {
      if (!tooltip) return;
      tooltip.innerHTML = tips[dot.dataset.site] || '';
      tooltip.style.display = 'block';
      const base = svg.getBoundingClientRect();
      tooltip.style.left = (e.clientX - base.left + 12) + 'px';
      tooltip.style.top  = (e.clientY - base.top  - 10) + 'px';
    });
    dot.addEventListener('mouseleave', () => { if (tooltip) tooltip.style.display = 'none'; });
    dot.addEventListener('click', () => {
      selectSite(dot.dataset.site);
      document.getElementById('f-tile-grid')?.scrollIntoView({ behavior:'smooth', block:'nearest' });
    });
  });
}

/* ══════════════════════════════════════════════════════════
   CALENDAR
══════════════════════════════════════════════════════════ */
function renderCalendar() {
  const grid = document.getElementById('f-cal-grid');
  if (!grid) return;
  grid.innerHTML = STATIC.calendar.map(day => `
    <div class="f-cal-day ${day.today ? 'today' : ''} ${!day.past && !day.today ? 'future' : ''}">
      <div class="f-cal-dow">${day.dow}</div>
      <div class="f-cal-num">${day.num}</div>
      ${day.events.map(ev => `<div class="f-cal-event ${ev.type}">${ev.text}</div>`).join('')}
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}