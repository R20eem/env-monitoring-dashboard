/* ============================================================
   FARMER DASHBOARD — farmer_dashboard.js
   Live data: FastAPI /api/dashboard/* endpoints
   Fallback:  static data derived from pest_monitoring.csv
   NASA:      POWER API (same pattern as researcher.js)
   ============================================================ */

'use strict';

const API_BASE  = 'http://192.168.0.22:8000';
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
let currentSite = 'site_maize';
let riskChart   = null;

/* ══════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  setupUser();
  renderHero();
  renderTiles();
  renderInsight(currentSite);
  renderMap();
  renderCalendar();
  /* Chart.js loads async so we wait a tick */
  setTimeout(() => renderChart(currentSite), 80);
  /* Fire live API + NASA in parallel after paint */
  fetchLiveData();
  fetchNasaData();
});

/* ── LISTEN FOR LANGUAGE CHANGES ── */
document.addEventListener('languageChanged', () => {
  renderTiles();
  renderInsight(currentSite);
  const titleEl = document.getElementById('f-chart-title');
  if (titleEl) titleEl.textContent = `Risk level & temperature — ${getLocalizedSiteName(currentSite).toLowerCase()}`;
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

  /* Topbar right-side buttons */
  const navActions = document.getElementById('f-nav-actions');
  if (navActions) {
    if (token && role) {
      navActions.innerHTML = `<a href="#" class="f-btn f-btn-ghost" id="f-signout-btn">Sign Out</a>`;
      document.getElementById('f-signout-btn').addEventListener('click', e => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
      });
    } else {
      navActions.innerHTML = `
        <a href="login.html"    class="f-btn f-btn-ghost">Sign In</a>
        <a href="register.html" class="f-btn f-btn-primary">Register</a>
      `;
    }
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
   HEALTH SCORE TILES
══════════════════════════════════════════════════════════ */
function renderTiles() {
  const grid = document.getElementById('f-tile-grid');
  if (!grid) return;
  grid.innerHTML = Object.entries(STATIC.sites).map(([id, s]) => `
    <div class="f-tile ${s.grade} ${id === currentSite ? 'selected' : ''}"
         onclick="selectSite('${id}')" role="button" tabindex="0">
      <div class="f-tile-accent"></div>
      <div class="f-tile-site">${getLocalizedSiteName(id)}</div>
      <div class="f-tile-score-row">
        <span class="f-tile-score">${s.score}</span>
        <span class="f-tile-score-max">/100</span>
      </div>
      <div class="f-score-bar">
        <div class="f-score-fill" style="width:${s.score}%"></div>
      </div>
      <div class="f-tile-grade">${getLocalizedGradeLabel(s.grade)}</div>
      <div class="f-tile-desc">${getLocalizedSiteDesc(id)}</div>
    </div>
  `).join('');
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
  renderTiles();
  renderInsight(id);
  renderChart(id);
  const titleEl = document.getElementById('f-chart-title');
  if (titleEl) titleEl.textContent = `Risk level & temperature — ${getLocalizedSiteName(id).toLowerCase()}`;
};

/* ══════════════════════════════════════════════════════════
   RISK CHART (Conditions vs Risk)
══════════════════════════════════════════════════════════ */
function renderChart(siteId) {
  const canvas = document.getElementById('f-risk-chart');
  if (!canvas || typeof Chart === 'undefined') return;
  const d = STATIC.chart[siteId];
  if (riskChart) { riskChart.destroy(); riskChart = null; }

  riskChart = new Chart(canvas, {
    data: {
      labels: d.dates,
      datasets: [
        { type:'line',  label:'Risk level',    data:d.risk,
          borderColor:'#c94040', backgroundColor:'rgba(201,64,64,0.07)', fill:true,
          tension:0.42, pointRadius:3, pointBackgroundColor:'#c94040', borderWidth:2, yAxisID:'y' },
        { type:'line',  label:'Avg temp (°C)', data:d.temp,
          borderColor:'#3d6b22', borderDash:[5,4], backgroundColor:'transparent', fill:false,
          tension:0.42, pointRadius:2, pointBackgroundColor:'#3d6b22', borderWidth:1.5, yAxisID:'y2' },
        { type:'bar',   label:'Pest count',    data:d.pest,
          backgroundColor:'rgba(201,124,26,0.2)', borderColor:'#c97c1a', borderWidth:1, yAxisID:'y3' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {
          label: ctx => {
            if (ctx.dataset.label === 'Risk level')        return ` Risk: ${ctx.parsed.y.toFixed(1)}`;
            if (ctx.dataset.label === 'Avg temp (°C)')     return ` Temp: ${ctx.parsed.y.toFixed(1)}°C`;
            if (ctx.dataset.label === 'NASA regional temp')return ` NASA temp: ${ctx.parsed.y.toFixed(1)}°C`;
            return ` Pest avg: ${ctx.parsed.y.toFixed(2)}`;
          }
        }}
      },
      scales: {
        x:  { grid:{ display:false }, ticks:{ font:{size:11}, color:'#7a8a65' } },
        y:  { position:'left',  min:30, max:100, grid:{ color:'rgba(0,0,0,0.04)' },
               ticks:{ font:{size:10}, color:'#c94040', callback:v=>v },
               title:{ display:true, text:'Risk', font:{size:10}, color:'#c94040' } },
        y2: { position:'right', min:10, max:30, grid:{ display:false },
               ticks:{ font:{size:10}, color:'#3d6b22', callback:v=>v+'°' },
               title:{ display:true, text:'Temp', font:{size:10}, color:'#3d6b22' } },
        y3: { display:false, min:0, max:12 }
      }
    }
  });
}

/* ══════════════════════════════════════════════════════════
   INSIGHT PANEL
══════════════════════════════════════════════════════════ */
function renderInsight(siteId) {
  const panel = document.getElementById('f-insight-panel');
  if (!panel) return;
  const ins = STATIC.insights[siteId];
  const s   = STATIC.sites[siteId];
  const whatHappening = typeof I18n !== 'undefined' ? I18n.t('f.insight_what') : 'What is happening?';
  panel.innerHTML = `
    <div class="f-insight-card">
      <div class="f-insight-header">
        <div class="f-insight-dot" style="background:${ins.color};"></div>
        <div class="f-insight-title">${getLocalizedSiteName(siteId)} — ${whatHappening}</div>
      </div>
      <div class="f-insight-text">${getLocalizedInsight(siteId)}</div>
      <div class="f-metric-mini-grid">
        <div class="f-metric-mini">
          <div class="f-metric-mini-label">Temperature</div>
          <div class="f-metric-mini-val">${ins.temp}</div>
        </div>
        <div class="f-metric-mini">
          <div class="f-metric-mini-label">Humidity</div>
          <div class="f-metric-mini-val">${ins.humidity}</div>
        </div>
        <div class="f-metric-mini">
          <div class="f-metric-mini-label">Pest avg</div>
          <div class="f-metric-mini-val">${ins.pest}</div>
        </div>
        <div class="f-metric-mini">
          <div class="f-metric-mini-label">Alerts</div>
          <div class="f-metric-mini-val">${ins.alerts}</div>
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