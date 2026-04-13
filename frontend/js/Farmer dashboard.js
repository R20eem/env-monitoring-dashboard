/* ============================================================
   FARMER DASHBOARD — farmer_dashboard.js
   Fetches live data from FastAPI endpoints + falls back to
   baked-in CSV-derived static data when API is unavailable.
   ============================================================ */

const API_BASE = 'http://192.168.0.22:8000';

/* ── AUTH GUARD ── */
(function () {
  const role  = localStorage.getItem('userRole');
  const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
  if (role === 'researcher' && token) {
    window.location.replace('researcher.html');
  }
})();

/* ══════════════════════════════════════════════════════════
   STATIC CSV-DERIVED DATA  (fallback + chart seed)
   Computed from pest_monitoring.csv — last 7 days (Dec 25-31 2023)
══════════════════════════════════════════════════════════ */
const STATIC = {
  sites: {
    site_maize:   { label: 'Maize',    score: 74, grade: 'attention', gradeLabel: 'Attention',
                    desc: 'High humidity is driving disease risk. Leaf wetness sustained for 3+ days.',
                    color: '#e09334', accent: '#e09334' },
    site_orchard: { label: 'Orchard',  score: 69, grade: 'attention', gradeLabel: 'Attention',
                    desc: 'Pest trap counts elevated this week. Outbreak risk rising.',
                    color: '#d94f4f', accent: '#d94f4f' },
    site_brassica:{ label: 'Brassica', score: 80, grade: 'good',      gradeLabel: 'Good',
                    desc: 'Most stable site. Low pest count, moderate humidity.',
                    color: '#12a898', accent: '#12a898' }
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
    site_maize:    { color:'#e09334', text:'Warm, sticky air (22°C / 79% humidity) is keeping disease risk elevated. Leaf wetness has stayed high for 3+ days — ideal conditions for fungal spread.',
                     temp:'22.1°C', humidity:'78.8%', pest:'3.3 avg', alerts:'63 today' },
    site_orchard:  { color:'#d94f4f', text:'Pest trap counts have spiked to 4+ this week. Temperature is hitting pest hatch threshold (>22°C). Check irrigation in the south-east corner — low soil moisture zone detected.',
                     temp:'21.9°C', humidity:'78.3%', pest:'4.3 avg', alerts:'66 today' },
    site_brassica: { color:'#12a898', text:'Conditions are the most stable of all three sites. Pest count below 2 on average. A good window to apply preventative treatment before the next humidity spike.',
                     temp:'21.6°C', humidity:'78.6%', pest:'1.7 avg', alerts:'56 today' }
  },
  calendar: [
    { dow:'Mon', num:'25', past:true,  events:[
      { type:'f-ev-danger',  text:'57 alerts — Maize' },
      { type:'f-ev-danger',  text:'70 alerts — Orchard' }
    ]},
    { dow:'Tue', num:'26', past:true,  events:[
      { type:'f-ev-warning', text:'Risk falling across sites' },
      { type:'f-ev-info',    text:'24 alerts — Maize' }
    ]},
    { dow:'Wed', num:'27', past:true,  events:[
      { type:'f-ev-success', text:'Lowest pest count this week' },
      { type:'f-ev-info',    text:'Risk 62–63 all sites' }
    ]},
    { dow:'Thu', num:'28', past:true,  events:[
      { type:'f-ev-warning', text:'Humidity climbing again' },
      { type:'f-ev-warning', text:'39 alerts — Orchard' }
    ]},
    { dow:'Fri', num:'29', past:true,  events:[
      { type:'f-ev-success', text:'Best conditions this week' },
      { type:'f-ev-info',    text:'Temp peak: 23°C' }
    ]},
    { dow:'Sat', num:'30', past:true,  events:[
      { type:'f-ev-danger',  text:'Pest spike — Orchard 4.96' },
      { type:'f-ev-warning', text:'62 alerts raised' }
    ]},
    { dow:'Sun', num:'31', today:true, events:[
      { type:'f-ev-danger',  text:'Heavy rain: 11.28 mm/hr' },
      { type:'f-ev-warning', text:'All sites on warning' },
      { type:'f-ev-nasa',    text:'NASA: high wind — spray risk' }
    ]}
  ]
};

/* ══════════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════════ */
let currentSite = 'site_maize';
let riskChart   = null;
let liveData    = {}; // populated from API

/* ══════════════════════════════════════════════════════════
   BOOT
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  setupUser();
  renderHero();
  renderTiles();
  renderInsight(currentSite);
  renderMap();
  renderCalendar();
  setTimeout(() => renderChart(currentSite), 80);
  await fetchLiveData();
});

/* ══════════════════════════════════════════════════════════
   USER / AUTH
══════════════════════════════════════════════════════════ */
function setupUser() {
  const email = localStorage.getItem('userEmail') || '';
  const role  = localStorage.getItem('userRole')  || 'farmer';
  const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');

  const initials = email ? email.slice(0, 2).toUpperCase() : 'FA';
  const name     = email || 'Farmer';

  setEl('f-avatar-initials', initials);
  setEl('f-user-email', name);

  const logoutBtn = document.getElementById('f-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.href = 'login.html';
    });
  }

  // Topbar right: if logged in show sign-out, else sign-in/register
  const navActions = document.getElementById('f-nav-actions');
  if (navActions) {
    if (token && role) {
      navActions.innerHTML = `
        <a href="#" class="f-btn f-btn-ghost" id="f-signout-topbar">Sign Out</a>
      `;
      document.getElementById('f-signout-topbar').addEventListener('click', e => {
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
   Hits all dashboard endpoints; on success merges into liveData
   and refreshes tiles. Silently falls back to static if offline.
══════════════════════════════════════════════════════════ */
async function fetchLiveData() {
  const endpoints = {
    temperature:      '/api/dashboard/temperature/latest',
    humidity:         '/api/dashboard/humidity/latest',
    leafWetness:      '/api/dashboard/leaf-wetness/latest',
    pestCount:        '/api/dashboard/pest-count/latest',
    rainfall:         '/api/dashboard/rainfall/latest',
    status:           '/api/dashboard/status/latest',
    alertTriggered:   '/api/dashboard/alert-triggered/latest',
    alertPestAction:  '/api/dashboard/alert-pest-action/latest',
    alertPestOutbreak:'/api/dashboard/alert-pest-outbreak/latest',
    alertDiseaseHigh: '/api/dashboard/alert-disease-high/latest',
  };

  try {
    const results = await Promise.allSettled(
      Object.entries(endpoints).map(async ([key, path]) => {
        const res = await fetch(`${API_BASE}${path}`);
        if (!res.ok) throw new Error(res.status);
        return [key, await res.json()];
      })
    );

    results.forEach(r => {
      if (r.status === 'fulfilled') {
        const [key, data] = r.value;
        liveData[key] = data;
      }
    });

    if (Object.keys(liveData).length > 0) {
      mergeLiveIntoScores();
      updateLiveIndicator(true);
    }
  } catch (e) {
    console.warn('Farmer dashboard: API unavailable, using static data.', e);
  }
}

/* Recalculate health scores from live API data */
function mergeLiveIntoScores() {
  const sites = ['site_maize', 'site_orchard', 'site_brassica'];
  sites.forEach(siteId => {
    const temp   = getLatestForSite(liveData.temperature,      siteId, 'latest_temp_c');
    const humid  = getLatestForSite(liveData.humidity,         siteId, 'latest_humidity_pct');
    const pest   = getLatestForSite(liveData.pestCount,        siteId, 'latest_pest_count');
    const alert  = getLatestForSite(liveData.alertTriggered,   siteId, 'latest_alert_triggered');
    const disHigh= getLatestForSite(liveData.alertDiseaseHigh, siteId, 'latest_alert_disease_high');
    const status = getLatestForSite(liveData.status,           siteId, 'latest_status');
    const rain   = getLatestForSite(liveData.rainfall,         siteId, 'latest_rainfall_mm_hr');

    if (temp !== null) {
      // Update insight mini-stats with live values
      STATIC.insights[siteId].temp     = `${parseFloat(temp).toFixed(1)}°C`;
      STATIC.insights[siteId].humidity = `${parseFloat(humid).toFixed(1)}%`;
      STATIC.insights[siteId].pest     = `${parseFloat(pest).toFixed(1)} avg`;
      STATIC.insights[siteId].alerts   = alert ? 'Alert active' : 'No alert';

      // Refresh displayed insight if this is the current site
      if (siteId === currentSite) renderInsight(siteId);

      // Update hero rain stat
      if (siteId === 'site_maize' && rain !== null) {
        const rainEl = document.getElementById('f-hero-rain');
        if (rainEl) rainEl.textContent = `${parseFloat(rain).toFixed(1)} mm/hr`;
      }
    }
  });

  renderTiles();
}

function getLatestForSite(dataArr, siteId, field) {
  if (!Array.isArray(dataArr)) return null;
  const row = dataArr.find(r => r.site_id === siteId);
  return row ? row[field] : null;
}

function updateLiveIndicator(isLive) {
  const dot = document.getElementById('f-live-dot');
  const txt = document.getElementById('f-live-txt');
  if (dot && txt) {
    dot.style.background = isLive ? '#12a898' : '#888';
    txt.textContent      = isLive ? 'Live' : 'Static';
  }
}

/* ══════════════════════════════════════════════════════════
   HERO BANNER
══════════════════════════════════════════════════════════ */
function renderHero() {
  const totalAlerts = 63; // from last day in CSV
  const avgScore    = Math.round(Object.values(STATIC.sites).reduce((a,s) => a + s.score, 0) / 3);
  setEl('f-hero-alerts', totalAlerts);
  setEl('f-hero-score',  `${avgScore}/100`);
  setEl('f-hero-rain',   '11.3 mm/hr');

  const email = localStorage.getItem('userEmail') || '';
  const first = email ? email.split('@')[0].split('.')[0] : 'Farmer';
  const cap   = first.charAt(0).toUpperCase() + first.slice(1);
  setEl('f-hero-name', `Good day, ${cap}`);
}

/* ══════════════════════════════════════════════════════════
   HEALTH SCORE TILES
══════════════════════════════════════════════════════════ */
function renderTiles() {
  const grid = document.getElementById('f-tile-grid');
  if (!grid) return;
  grid.innerHTML = Object.entries(STATIC.sites).map(([id, s]) => `
    <div class="f-tile ${s.grade} ${id === currentSite ? 'selected' : ''}"
         onclick="selectSite('${id}', null)" role="button" tabindex="0"
         aria-label="${s.label} field health score ${s.score} out of 100">
      <div class="f-tile-accent"></div>
      <div class="f-tile-site">${s.label}</div>
      <div class="f-tile-score-row">
        <span class="f-tile-score">${s.score}</span>
        <span class="f-tile-score-max">/100</span>
      </div>
      <div class="f-score-bar">
        <div class="f-score-fill" style="width:${s.score}%"></div>
      </div>
      <div class="f-tile-grade">${s.gradeLabel}</div>
      <div class="f-tile-desc">${s.desc}</div>
    </div>
  `).join('');
}

/* ══════════════════════════════════════════════════════════
   SITE SELECTION (tiles, map dots, tab buttons)
══════════════════════════════════════════════════════════ */
window.selectSite = function (id, btnEl) {
  currentSite = id;

  // Update tab buttons
  document.querySelectorAll('.f-site-btn').forEach((b, i) => {
    const ids = ['site_maize', 'site_orchard', 'site_brassica'];
    b.classList.toggle('active', ids[i] === id);
  });

  renderTiles();
  renderInsight(id);
  renderChart(id);

  // Update chart title
  const titleEl = document.getElementById('f-chart-title');
  if (titleEl) titleEl.textContent = `Risk level & temperature — ${STATIC.sites[id].label.toLowerCase()}`;
};

/* ══════════════════════════════════════════════════════════
   CHART — Conditions vs Risk (last 7 days)
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
        {
          type: 'line',
          label: 'Risk level',
          data: d.risk,
          borderColor: '#d94f4f',
          backgroundColor: 'rgba(217,79,79,0.07)',
          fill: true,
          tension: 0.42,
          pointRadius: 3,
          pointBackgroundColor: '#d94f4f',
          borderWidth: 2,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: 'Avg temp (°C)',
          data: d.temp,
          borderColor: '#378add',
          borderDash: [5, 4],
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.42,
          pointRadius: 2,
          pointBackgroundColor: '#378add',
          borderWidth: 1.5,
          yAxisID: 'y2'
        },
        {
          type: 'bar',
          label: 'Pest count',
          data: d.pest,
          backgroundColor: 'rgba(224,147,52,0.22)',
          borderColor: '#e09334',
          borderWidth: 1,
          yAxisID: 'y3'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              if (ctx.dataset.label === 'Risk level')    return ` Risk: ${ctx.parsed.y.toFixed(1)}`;
              if (ctx.dataset.label === 'Avg temp (°C)') return ` Temp: ${ctx.parsed.y.toFixed(1)}°C`;
              return ` Pest avg: ${ctx.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x:  { grid: { display: false }, ticks: { font: { size: 11 }, color: '#6a8e8b' } },
        y:  { position: 'left',  min: 30, max: 100, grid: { color: 'rgba(0,0,0,0.04)' },
               ticks: { font: { size: 10 }, color: '#d94f4f', callback: v => v },
               title: { display: true, text: 'Risk', font: { size: 10 }, color: '#d94f4f' } },
        y2: { position: 'right', min: 10, max: 30,  grid: { display: false },
               ticks: { font: { size: 10 }, color: '#378add', callback: v => v + '°' },
               title: { display: true, text: 'Temp', font: { size: 10 }, color: '#378add' } },
        y3: { display: false, min: 0, max: 12 }
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

  panel.innerHTML = `
    <div class="f-insight-card">
      <div class="f-insight-header">
        <div class="f-insight-dot" style="background:${ins.color};"></div>
        <div class="f-insight-title">${s.label} — What is happening?</div>
      </div>
      <div class="f-insight-text">${ins.text}</div>
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
      <pattern id="farmgrid" width="28" height="28" patternUnits="userSpaceOnUse">
        <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(13,107,99,0.06)" stroke-width="0.5"/>
      </pattern>
    </defs>
    <rect width="600" height="250" fill="var(--f-surface)"/>
    <rect width="600" height="250" fill="url(#farmgrid)"/>

    <!-- Field zones -->
    <rect x="18" y="18" width="168" height="214" rx="6" fill="rgba(18,168,152,0.08)" stroke="rgba(18,168,152,0.3)" stroke-width="1"/>
    <text x="102" y="135" text-anchor="middle" font-size="10" fill="rgba(13,107,99,0.4)" font-family="DM Mono,monospace">MAIZE FIELD</text>
    <rect x="212" y="24" width="158" height="202" rx="6" fill="rgba(217,79,79,0.07)" stroke="rgba(217,79,79,0.25)" stroke-width="1"/>
    <text x="291" y="132" text-anchor="middle" font-size="10" fill="rgba(140,50,50,0.4)" font-family="DM Mono,monospace">ORCHARD</text>
    <rect x="396" y="14" width="188" height="222" rx="6" fill="rgba(224,147,52,0.07)" stroke="rgba(224,147,52,0.25)" stroke-width="1"/>
    <text x="490" y="132" text-anchor="middle" font-size="10" fill="rgba(140,100,20,0.4)" font-family="DM Mono,monospace">BRASSICA</text>

    <!-- Low moisture zone (NASA) -->
    <ellipse cx="455" cy="195" rx="55" ry="25" fill="rgba(100,100,100,0.07)" stroke="rgba(100,100,100,0.2)" stroke-width="1" stroke-dasharray="5,3"/>
    <text x="455" y="212" text-anchor="middle" font-size="9" fill="#a0bfbd" font-family="DM Sans,sans-serif">low moisture (NASA)</text>

    <!-- Score labels -->
    <text x="102" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="#0a2422" font-family="Fraunces,serif">Maize</text>
    <text x="102" y="91" text-anchor="middle" font-size="10" fill="#b07020" font-family="DM Mono,monospace">74/100</text>
    <text x="291" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="#0a2422" font-family="Fraunces,serif">Orchard</text>
    <text x="291" y="91" text-anchor="middle" font-size="10" fill="#d94f4f" font-family="DM Mono,monospace">69/100 !</text>
    <text x="490" y="76" text-anchor="middle" font-size="11" font-weight="600" fill="#0a2422" font-family="Fraunces,serif">Brassica</text>
    <text x="490" y="91" text-anchor="middle" font-size="10" fill="#0d6b63" font-family="DM Mono,monospace">80/100</text>

    <!-- Pulse ring — orchard critical -->
    <circle cx="291" cy="108" r="14" fill="rgba(217,79,79,0.12)" stroke="rgba(217,79,79,0.4)" stroke-width="1"/>

    <!-- Site dots -->
    <circle cx="102" cy="108" r="8"  fill="#e09334" stroke="#fff" stroke-width="2"
            class="f-map-dot-click" data-site="site_maize"   style="cursor:pointer;"/>
    <circle cx="291" cy="108" r="9"  fill="#d94f4f" stroke="#fff" stroke-width="2"
            class="f-map-dot-click f-pulse" data-site="site_orchard"  style="cursor:pointer;"/>
    <circle cx="490" cy="108" r="8"  fill="#12a898" stroke="#fff" stroke-width="2"
            class="f-map-dot-click" data-site="site_brassica" style="cursor:pointer;"/>
  `;

  const tooltip = document.getElementById('f-map-tooltip');
  const tooltipData = {
    site_maize:    '<strong>Maize</strong><br>Score: 74/100 — Attention<br>Pest avg: 3.3 · Alerts: 63<br>Humidity: 78.8%',
    site_orchard:  '<strong>Orchard</strong><br>Score: 69/100 — Attention<br>Pest avg: 4.3 · Alerts: 66<br>Near low-moisture zone',
    site_brassica: '<strong>Brassica</strong><br>Score: 80/100 — Good<br>Pest avg: 1.7 · Alerts: 56<br>Stable conditions'
  };

  svg.querySelectorAll('.f-map-dot-click').forEach(dot => {
    dot.addEventListener('mouseenter', e => {
      if (!tooltip) return;
      tooltip.innerHTML = tooltipData[dot.dataset.site] || '';
      tooltip.style.display = 'block';
      const rect = svg.closest('.f-map-area').getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      tooltip.style.left = (e.clientX - svgRect.left + 12) + 'px';
      tooltip.style.top  = (e.clientY - svgRect.top  - 10) + 'px';
    });
    dot.addEventListener('mouseleave', () => {
      if (tooltip) tooltip.style.display = 'none';
    });
    dot.addEventListener('click', () => {
      selectSite(dot.dataset.site, null);
      document.getElementById('f-tile-grid').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}