/**
 * File: researcher.js
 *
 * Purpose:
 * Handles researcher dashboard functionality including data analysis,
 * correlation visualization, and advanced analytics features.
 *
 * Responsibilities:
 * - Fetch and display researcher-specific dashboard data
 * - Render correlation matrices and trend analysis
 * - Manage tab-based navigation between dashboard sections
 * - Handle NASA POWER API integration for environmental data
 *
 * Layer:
 * Frontend
 *
 * Related:
 * - researcher.html
 * - researcher.css
 * - l18n.js
 */

/* ============================================================
   RESEARCHER DASHBOARD — researcher.js
   Wired to: /api/researcher/dashboard/* endpoints
   Fallback: sample data derived from pest_monitoring.csv schema
   NASA: POWER API (lat/lon of site_maize as primary)
   ============================================================ */

'use strict';

// ── CONFIG ──────────────────────────────────────────────────
const API_BASE = "http://localhost:8000";
const TOKEN_KEY  = 'jwt_token';
const NASA_BASE  = 'https://power.larc.nasa.gov/api/temporal/daily/point';

// Approximate coordinates for monitored sites (update if known)
const SITE_COORDS = {
  site_maize:    { lat: -17.8, lon: 31.0 },  // Zimbabwe example
  site_orchard:  { lat: -17.9, lon: 31.1 },
  site_wheat:    { lat: -18.0, lon: 30.9 },
  site_brassica: { lat: -17.7, lon: 31.2 },
  site_soy:      { lat: -17.6, lon: 31.3 },
};

const SITE_COLORS = {
  site_maize:    '#639922',
  site_orchard:  '#378add',
  site_wheat:    '#ef9f27',
  site_brassica: '#e24b4a',
  site_soy:      '#1d9e75',
};

// ── AUTH GUARD ───────────────────────────────────────────────
const role  = localStorage.getItem('userRole');
const token = localStorage.getItem('jwt_token');
console.log("TOKEN:", token);

if (!role || !token || role !== 'researcher') {
  window.location.href = 'login.html';
}

// ── USER INFO ────────────────────────────────────────────────
const userEmail = localStorage.getItem('userEmail') || 'Researcher';
document.getElementById('r-user-email').textContent = userEmail;
document.getElementById('r-avatar-initials').textContent =
  userEmail.slice(0, 2).toUpperCase();

// ── LOGOUT ───────────────────────────────────────────────────
document.getElementById('r-logout-btn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});

// ── TAB SWITCHING ────────────────────────────────────────────
const tabs   = document.querySelectorAll('.r-tab');
const panels = document.querySelectorAll('.r-panel');
const tabInitialized = {};

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const id = tab.dataset.tab;
    document.getElementById(`tab-${id}`).classList.add('active');
    if (!tabInitialized[id]) {
      tabInitialized[id] = true;
      initTab(id);
    }
  });
});

// ── GLOBAL DATA STORE ────────────────────────────────────────
let G = {
  all:      [],   // full trend dataset
  summary:  null, // summary endpoint response
  sites:    [],   // unique site ids
};

// ── CHART REGISTRY ───────────────────────────────────────────
const charts = {};
function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// ── BOOTSTRAP ────────────────────────────────────────────────
(async () => {
  await loadData();
  tabInitialized['overview'] = true;
  initTab('overview');
})();

// ── DATA LOADING ─────────────────────────────────────────────
async function loadData() {
  try {
    const [summaryRes, dataRes] = await Promise.all([
      fetch(`${API_BASE}/api/researcher/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${API_BASE}/api/researcher/dashboard/data?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
    ]);

    if (summaryRes.ok) G.summary = await summaryRes.json();
    if (dataRes.ok) G.all = await dataRes.json();

    if (!G.all.length) throw new Error('empty');

    // save last successful data for offline use
    localStorage.setItem('researcher_cached_data', JSON.stringify(G.all));
    localStorage.setItem('researcher_cached_summary', JSON.stringify(G.summary || null));

  } catch (e) {
    console.warn('Backend unavailable — trying cached data', e);

    const cachedData = localStorage.getItem('researcher_cached_data');
    const cachedSummary = localStorage.getItem('researcher_cached_summary');

    if (cachedData) {
      G.all = JSON.parse(cachedData);
      G.summary = cachedSummary ? JSON.parse(cachedSummary) : null;
      console.warn('Using cached dashboard data');
    } else {
      console.warn('No cached data found — using sample data');
      G.all = generateSample(1000);
    }
  }

  G.sites = [...new Set(G.all.map(r => r.site_id))].filter(Boolean).sort();

  // populate all site selects
  document.querySelectorAll('[id$="-site-filter"], [id$="-site"], [id$="-chart-site"]').forEach(sel => {
    sel.innerHTML = '<option value="all">All Sites</option>';
    G.sites.forEach(s => {
      const o = document.createElement('option');
      o.value = s;
      o.textContent = fmtSite(s);
      sel.appendChild(o);
    });
  });

  // data range in topbar
  if (G.all.length) {
    const sorted = [...G.all].sort((a, b) => a.timestamp < b.timestamp ? -1 : 1);
    const t0 = sorted[0].timestamp?.slice(0, 10);
    const t1 = sorted[sorted.length - 1].timestamp?.slice(0, 10);
    document.getElementById('r-data-range').textContent =
      `Dataset: ${t0} → ${t1} · ${G.all.length.toLocaleString()} readings`;
  }
}

// ── TAB INITIALIZERS ─────────────────────────────────────────
function initTab(id) {
  const fn = {
    overview:      initOverview,
    trends:        initTrends,
    correlations:  initCorrelations,
    tables:        initTables,
    advanced:      initAdvanced,
    nasa:          initNasa,
  }[id];
  if (fn) fn();
}

// ════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ════════════════════════════════════════════════════════════
function initOverview() {
  const data = filterBySite(G.all, 'all');
  renderStatCards(data);
  renderAlertDonut(data);
  renderSiteStatus();
  renderOvPestChart(data);

  document.getElementById('ov-site-filter').addEventListener('change', e => {
    const d = filterBySite(G.all, e.target.value);
    renderStatCards(d);
    renderAlertDonut(d);
  });

  document.getElementById('ov-chart-site').addEventListener('change', e => {
    renderOvPestChart(filterBySite(G.all, e.target.value));
  });
}

function renderStatCards(data) {
  const total    = data.length;
  const critical = data.filter(r => r.status === 'critical').length;
  const warning  = data.filter(r => r.status === 'warning').length;
  const avgPest  = mean(data.map(r => parseFloat(r.pest_trap_count) || 0));

  setText('s-total',        total.toLocaleString());
  setText('s-critical',     critical.toLocaleString());
  setText('s-critical-pct', `${pct(critical, total)}% of all readings`);
  setText('s-warning',      warning.toLocaleString());
  setText('s-warning-pct',  `${pct(warning, total)}% of all readings`);
  setText('s-avg-pest',     avgPest.toFixed(1));
}

function renderAlertDonut(data) {
  const counts = {
    'Pest Action':      data.filter(r => parseFloat(r.alert_pest_action)   === 1).length,
    'Pest Outbreak':    data.filter(r => parseFloat(r.alert_pest_outbreak)  === 1).length,
    'Disease Moderate': data.filter(r => parseFloat(r.alert_disease_moderate) === 1).length,
    'Disease High':     data.filter(r => parseFloat(r.alert_disease_high)   === 1).length,
  };
  const colors  = ['#639922','#ef9f27','#378add','#e24b4a'];
  const labels  = Object.keys(counts);
  const vals    = Object.values(counts);
  const total   = vals.reduce((a,b)=>a+b,0);

  destroyChart('alertDonut');
  charts['alertDonut'] = new Chart(document.getElementById('alertDonut'), {
    type: 'doughnut',
    data: { labels, datasets:[{ data: vals, backgroundColor: colors, borderWidth:0, hoverOffset:6 }] },
    options: {
      responsive:true, maintainAspectRatio:false, cutout:'65%',
      plugins:{ legend:{display:false}, tooltip:{ callbacks:{
        label: ctx => ` ${ctx.label}: ${ctx.raw.toLocaleString()} (${pct(ctx.raw, total)}%)`
      }}}
    }
  });

  document.getElementById('donut-legend').innerHTML = labels.map((k,i) => `
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="width:10px;height:10px;border-radius:2px;background:${colors[i]};flex-shrink:0;"></span>
      <span style="font-size:12px;color:var(--r-text-2);">${k}</span>
      <span style="margin-left:auto;font-family:var(--r-font-mono);font-size:11px;font-weight:500;color:var(--r-text-1);">${vals[i].toLocaleString()}</span>
    </div>
  `).join('');
}

function renderSiteStatus() {
  const list = document.getElementById('site-status-list');
  list.innerHTML = '';

  G.sites.forEach(site => {
    const siteData = G.all.filter(r => r.site_id === site);
    if (!siteData.length) return;
    const latest = siteData[siteData.length - 1];
    const status = latest.status || 'normal';
    const color  = SITE_COLORS[site] || '#639922';

    const el = document.createElement('div');
    el.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px;background:var(--r-surface);border-radius:8px;';
    el.innerHTML = `
      <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></div>
      <div style="flex:1;">
        <div style="font-size:12px;font-weight:700;color:var(--r-text-1);">${fmtSite(site)}</div>
        <div style="font-size:11px;color:var(--r-text-3);">Last: ${latest.timestamp?.slice(0,16)||'—'}</div>
      </div>
      <span class="r-badge r-badge-${status}">${status}</span>
      <span style="font-family:var(--r-font-mono);font-size:11px;color:var(--r-text-3);">${parseFloat(latest.pest_trap_count||0).toFixed(0)} traps</span>
    `;
    list.appendChild(el);
  });
}

function renderOvPestChart(data) {
  destroyChart('ovPestChart');
  const {labels, vals} = dailyAvg(data, 'pest_trap_count', 30);
  charts['ovPestChart'] = new Chart(document.getElementById('ovPestChart'), {
    type: 'line',
    data: { labels, datasets:[{
      label: 'Avg pest count',
      data: vals,
      borderColor: '#639922',
      backgroundColor: 'rgba(99,153,34,0.07)',
      borderWidth: 2, pointRadius: 2, pointHoverRadius: 4,
      tension: 0.4, fill: true
    }]},
    options: lineOpts()
  });
}

// ════════════════════════════════════════════════════════════
// EXPORT CARD
// ════════════════════════════════════════════════════════════
function initExportCard() {
  const btn = document.getElementById('exp-download-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const site      = document.getElementById('exp-site').value;
    const status    = document.getElementById('exp-status').value;
    const startRaw  = document.getElementById('exp-start').value;
    const endRaw    = document.getElementById('exp-end').value;
    const msgEl     = document.getElementById('exp-status-msg');

    const params = new URLSearchParams();
    if (site)     params.set('site_id',    site);
    if (status)   params.set('status',     status);

    if (startRaw) params.set('start_date', `${startRaw} 00:00:00`);
    if (endRaw)   params.set('end_date',   `${endRaw} 23:59:59`);

    const url = `${API_BASE}/api/researcher/dashboard/data/export?${params.toString()}`;

    msgEl.textContent = 'Preparing download...';
    msgEl.style.color = 'var(--r-text-3)';

    window.open(url, '_blank');

    setTimeout(() => { msgEl.textContent = ''; }, 3000);
  });
}


// ════════════════════════════════════════════════════════════
// TRENDS TAB
// ════════════════════════════════════════════════════════════
function initTrends() {
  renderTrendCharts();

  ['tr-site-filter','tr-range'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderTrendCharts);
  });
}

function renderTrendCharts() {
  const site  = document.getElementById('tr-site-filter').value;
  const days  = parseInt(document.getElementById('tr-range').value) || 30;
  const data  = filterBySite(G.all, site);

  renderPestTimeSeries(data, days);
  renderDiseaseRainChart(data, days);
  renderTempChart(data, days);
  renderHumidChart(data, days);
}

function renderPestTimeSeries(data, days) {
  // Multi-line by site
  const sitesToPlot = data === G.all ? G.sites : [...new Set(data.map(r=>r.site_id))];
  const legend = document.getElementById('tr-site-legend');
  legend.innerHTML = sitesToPlot.map(s => `
    <div class="r-legend-item">
      <div class="r-legend-dot" style="background:${SITE_COLORS[s]||'#888'};"></div>
      <span>${fmtSite(s)}</span>
    </div>
  `).join('');

  const allDates = uniqueDates(data, days);
  const datasets = sitesToPlot.map(site => {
    const sd = data.filter(r => r.site_id === site);
    const byDay = groupByDay(sd, 'pest_trap_count');
    return {
      label: fmtSite(site),
      data: allDates.map(d => byDay[d] ?? null),
      borderColor: SITE_COLORS[site] || '#888',
      backgroundColor: 'transparent',
      borderWidth: 1.8,
      pointRadius: 1.5,
      tension: 0.3,
      spanGaps: true,
    };
  });

  destroyChart('trPestTimeSeries');
  charts['trPestTimeSeries'] = new Chart(document.getElementById('trPestTimeSeries'), {
    type: 'line',
    data: { labels: allDates.map(fmtDate), datasets },
    options: {
      ...lineOpts(),
      plugins: { legend:{ display:false }, tooltip:{ mode:'index', intersect:false } },
      scales: {
        x: xScale(),
        y: { beginAtZero:true, title:{ display:true, text:'pest_trap_count', font:{size:10} }, ticks:{font:{size:10}}, grid:{color:'rgba(0,0,0,0.04)'} }
      }
    }
  });

  setText('tr-pest-sub', `${data.length.toLocaleString()} readings · ${sitesToPlot.length} sites · last ${days} days`);
}

function renderDiseaseRainChart(data, days) {
  const allDates = uniqueDates(data, days);
  const rainByDay    = groupByDay(data, 'wx_rain_mm_hr');
  const diseaseByDay = groupByDay(data, 'alert_disease_high');

  destroyChart('trDiseaseRain');
  charts['trDiseaseRain'] = new Chart(document.getElementById('trDiseaseRain'), {
    type: 'bar',
    data: {
      labels: allDates.map(fmtDate),
      datasets: [
        {
          type: 'bar',
          label: 'Rainfall (mm/hr)',
          data: allDates.map(d => rainByDay[d] ?? 0),
          backgroundColor: 'rgba(55,138,221,0.35)',
          borderColor: '#378add',
          borderWidth: 0,
          yAxisID: 'y',
          order: 2,
        },
        {
          type: 'line',
          label: 'Disease High alerts',
          data: allDates.map(d => (diseaseByDay[d] ?? 0) * 100),
          borderColor: '#e24b4a',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 2,
          tension: 0.3,
          yAxisID: 'y1',
          order: 1,
        }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins: { legend:{ display:true, labels:{ font:{size:11}, boxWidth:10 } }, tooltip:{mode:'index',intersect:false} },
      scales: {
        x: xScale(),
        y:  { position:'left',  title:{display:true,text:'Rain mm/hr',font:{size:10}}, beginAtZero:true, ticks:{font:{size:10}}, grid:{color:'rgba(0,0,0,0.04)'} },
        y1: { position:'right', title:{display:true,text:'Disease High %',font:{size:10}}, beginAtZero:true, max:100, ticks:{font:{size:10}}, grid:{display:false} },
      }
    }
  });
}

function renderTempChart(data, days) {
  const allDates = uniqueDates(data, days);
  const sitesToPlot = [...new Set(data.map(r=>r.site_id))];

  destroyChart('trTempChart');
  charts['trTempChart'] = new Chart(document.getElementById('trTempChart'), {
    type: 'line',
    data: {
      labels: allDates.map(fmtDate),
      datasets: sitesToPlot.map(site => {
        const sd = data.filter(r=>r.site_id===site);
        const byDay = groupByDay(sd, 'air_temperature_c');
        return {
          label: fmtSite(site),
          data: allDates.map(d => byDay[d] ?? null),
          borderColor: SITE_COLORS[site]||'#888',
          backgroundColor:'transparent',
          borderWidth:1.5, pointRadius:1, tension:0.3, spanGaps:true
        };
      })
    },
    options: { ...lineOpts(), plugins:{ legend:{display:true, labels:{font:{size:10},boxWidth:8}} } }
  });
}

function renderHumidChart(data, days) {
  const allDates = uniqueDates(data, days);
  const sitesToPlot = [...new Set(data.map(r=>r.site_id))];

  destroyChart('trHumidChart');
  charts['trHumidChart'] = new Chart(document.getElementById('trHumidChart'), {
    type: 'line',
    data: {
      labels: allDates.map(fmtDate),
      datasets: sitesToPlot.map(site => {
        const sd = data.filter(r=>r.site_id===site);
        const byDay = groupByDay(sd, 'relative_humidity_pct');
        return {
          label: fmtSite(site),
          data: allDates.map(d => byDay[d] ?? null),
          borderColor: SITE_COLORS[site]||'#888',
          backgroundColor:'transparent',
          borderWidth:1.5, pointRadius:1, tension:0.3, spanGaps:true
        };
      })
    },
    options: { ...lineOpts(), plugins:{ legend:{display:true, labels:{font:{size:10},boxWidth:8}} } }
  });
}

// ════════════════════════════════════════════════════════════
// CORRELATIONS TAB
// ════════════════════════════════════════════════════════════
function initCorrelations() {
  renderScatter();
  renderCorrMatrix();
  renderVibChart();

  document.getElementById('vib-site').addEventListener('change', e => {
    renderVibChart(e.target.value);
  });
}

function renderScatter() {
  const data = G.all.filter(r =>
    r.air_temperature_c != null && r.pest_trap_count != null
  ).slice(0, 2000);

  const datasets = G.sites.map(site => ({
    label: fmtSite(site),
    data: data.filter(r=>r.site_id===site).map(r=>({
      x: parseFloat(r.air_temperature_c),
      y: parseFloat(r.pest_trap_count),
    })),
    backgroundColor: (SITE_COLORS[site]||'#888') + '55',
    borderColor:     SITE_COLORS[site]||'#888',
    borderWidth: 1,
    pointRadius: 3,
    pointHoverRadius: 5,
  }));

  destroyChart('corrScatter');
  charts['corrScatter'] = new Chart(document.getElementById('corrScatter'), {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins: { legend:{ display:true, labels:{ font:{size:10}, boxWidth:8 } }, tooltip:{callbacks:{
        label: ctx => `${fmtSite(ctx.dataset.label)}: ${ctx.parsed.x.toFixed(1)}°C → ${ctx.parsed.y} traps`
      }}},
      scales: {
        x: { title:{display:true, text:'Air Temperature (°C)', font:{size:10}}, ticks:{font:{size:10}}, grid:{color:'rgba(0,0,0,0.05)'} },
        y: { title:{display:true, text:'Pest Trap Count', font:{size:10}}, beginAtZero:true, ticks:{font:{size:10}}, grid:{color:'rgba(0,0,0,0.05)'} }
      }
    }
  });
}

function renderCorrMatrix() {
  const fields = [
    { key:'air_temperature_c',      label:'Temp' },
    { key:'relative_humidity_pct',  label:'Humidity' },
    { key:'leaf_wetness_0_1',       label:'Leaf Wet.' },
    { key:'pest_trap_count',        label:'Pest Count' },
  ];

  const sample = G.all.slice(0, 3000);
  const vecs   = fields.map(f => sample.map(r => parseFloat(r[f.key])).filter(v => !isNaN(v)));

  const corrVal = (a, b) => {
    const n  = Math.min(a.length, b.length);
    const ax = mean(a.slice(0,n)), bx = mean(b.slice(0,n));
    let num=0, da=0, db=0;
    for(let i=0;i<n;i++) { const ai=a[i]-ax, bi=b[i]-bx; num+=ai*bi; da+=ai*ai; db+=bi*bi; }
    return da&&db ? num/Math.sqrt(da*db) : 0;
  };

  const matrix = vecs.map((a,i) => vecs.map((b,j) => corrVal(a,b)));

  const cellColor = v => {
    const abs = Math.abs(v);
    if (v > 0) return `rgba(99,153,34,${0.15 + abs*0.75})`;
    return `rgba(226,75,74,${0.15 + abs*0.75})`;
  };

  const textColor = v => Math.abs(v) > 0.5 ? '#fff' : '#333';

  const wrap = document.getElementById('corr-matrix-wrap');
  let html = `<table class="r-corr-table"><tr><td class="r-corr-header"></td>`;
  fields.forEach(f => { html += `<td class="r-corr-header">${f.label}</td>`; });
  html += '</tr>';
  matrix.forEach((row, i) => {
    html += `<tr><td class="r-corr-header" style="text-align:right;">${fields[i].label}</td>`;
    row.forEach((v,j) => {
      html += `<td class="r-corr-cell" style="background:${cellColor(v)};color:${textColor(v)};" title="${fields[i].label} × ${fields[j].label}: ${v.toFixed(3)}">${v.toFixed(2)}</td>`;
    });
    html += '</tr>';
  });
  html += '</table>';
  html += `<div style="font-size:11px;color:var(--r-text-4);margin-top:8px;">Green = positive correlation · Red = negative · Hover for exact value</div>`;
  wrap.innerHTML = html;
}

function renderVibChart(site='all') {
  const data = filterBySite(G.all, site).slice(-500);
  const labels = data.map(r => r.timestamp?.slice(11,16)||'');
  const vals   = data.map(r => parseFloat(r.vibration_level)||0);
  const pest   = data.map(r => parseFloat(r.pest_trap_count)||0);

  destroyChart('vibChart');
  charts['vibChart'] = new Chart(document.getElementById('vibChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label:'Vibration Level', data:vals, borderColor:'#1d9e75', backgroundColor:'rgba(29,158,117,0.07)', borderWidth:1.5, pointRadius:0, tension:0.3, fill:true, yAxisID:'y' },
        { label:'Pest Count',      data:pest, borderColor:'#ef9f27', backgroundColor:'transparent', borderWidth:1.5, pointRadius:0, tension:0.3, yAxisID:'y1' },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:true, labels:{font:{size:10},boxWidth:8}}, tooltip:{mode:'index',intersect:false} },
      scales: {
        x:  { ticks:{font:{size:9}, maxTicksLimit:12, maxRotation:45}, grid:{display:false} },
        y:  { position:'left',  title:{display:true,text:'Vibration',font:{size:10}}, ticks:{font:{size:10}}, grid:{color:'rgba(0,0,0,0.04)'} },
        y1: { position:'right', title:{display:true,text:'Pest Count',font:{size:10}}, ticks:{font:{size:10}}, grid:{display:false} },
      }
    }
  });
}

// ════════════════════════════════════════════════════════════
// TABLES TAB
// ════════════════════════════════════════════════════════════
function initTables() {
  renderCritTable('all');
  renderRiskTable();
  renderHealthTable();

  document.getElementById('crit-site').addEventListener('change', e => renderCritTable(e.target.value));
  initExportCard();
}

function renderCritTable(site) {
  const data = filterBySite(G.all, site).filter(r => r.status === 'critical');
  const tbody = document.getElementById('crit-table-body');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="padding:20px;text-align:center;color:var(--r-text-4);">No critical events for this filter.</td></tr>';
    return;
  }
  tbody.innerHTML = data.slice(0,200).map(r => `
    <tr>
      <td class="mono">${r.timestamp||'—'}</td>
      <td>${fmtSite(r.site_id)}</td>
      <td><span class="r-badge r-badge-critical">critical</span></td>
      <td class="mono">${fmt(r.pest_trap_count)}</td>
      <td class="mono">${fmtN(r.air_temperature_c,1)}°C</td>
      <td class="mono">${fmtN(r.relative_humidity_pct,1)}%</td>
      <td class="mono">${fmtN(r.leaf_wetness_0_1,3)}</td>
      <td class="mono">${fmtN(r.wx_rain_mm_hr,2)}</td>
      <td><span class="r-badge ${parseFloat(r.alert_pest_outbreak)===1?'r-badge-critical':'r-badge-normal'}">${parseFloat(r.alert_pest_outbreak)===1?'Yes':'No'}</span></td>
      <td><span class="r-badge ${parseFloat(r.alert_disease_high)===1?'r-badge-critical':'r-badge-normal'}">${parseFloat(r.alert_disease_high)===1?'Yes':'No'}</span></td>
    </tr>
  `).join('');
}

function renderRiskTable() {
  const tbody = document.getElementById('risk-table-body');
  const ranks = G.sites.map(site => {
    const sd = G.all.filter(r => r.site_id === site);
    const pests = sd.map(r => parseFloat(r.pest_trap_count)||0);
    return {
      site,
      avg:      mean(pests),
      max:      Math.max(...pests, 0),
      outbreaks: sd.filter(r=>parseFloat(r.alert_pest_outbreak)===1).length,
      disease:   sd.filter(r=>parseFloat(r.alert_disease_high)===1).length,
    };
  }).sort((a,b) => b.outbreaks - a.outbreaks);

  const maxOut = Math.max(...ranks.map(r=>r.outbreaks), 1);

  tbody.innerHTML = ranks.map((r, i) => {
    const riskLevel = r.outbreaks > maxOut*0.6 ? 'critical' : r.outbreaks > maxOut*0.3 ? 'warning' : 'normal';
    const barW = Math.round((r.outbreaks/maxOut)*100);
    return `
      <tr>
        <td style="font-family:var(--r-font-mono);font-weight:700;color:var(--r-text-3);">#${i+1}</td>
        <td style="font-weight:600;">${fmtSite(r.site)}</td>
        <td class="mono">${r.avg.toFixed(2)}</td>
        <td class="mono">${r.max}</td>
        <td class="mono">${r.outbreaks.toLocaleString()}</td>
        <td class="mono">${r.disease.toLocaleString()}</td>
        <td><span class="r-badge r-badge-${riskLevel}">${riskLevel}</span></td>
        <td style="min-width:120px;">
          <span class="r-risk-bar" style="width:${barW}px;background:${SITE_COLORS[r.site]||'#888'};"></span>
          <span style="font-family:var(--r-font-mono);font-size:10px;color:var(--r-text-4);">${barW}%</span>
        </td>
      </tr>
    `;
  }).join('');
}

function renderHealthTable() {
  const tbody = document.getElementById('health-table-body');
  const checkFields = ['air_temperature_c','relative_humidity_pct','leaf_wetness_0_1','pest_trap_count','wx_rain_mm_hr','vibration_level','light_lux'];

  const rows = [];
  G.sites.forEach(site => {
    const sd = G.all.filter(r => r.site_id === site);
    checkFields.forEach(field => {
      const missing = sd.filter(r => r[field] == null || r[field] === '' || isNaN(parseFloat(r[field]))).length;
      const pctMissing = pct(missing, sd.length);
      const health = pctMissing < 1 ? 'normal' : pctMissing < 5 ? 'warning' : 'critical';
      rows.push({ site, field, total:sd.length, missing, pctMissing, health });
    });
  });

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${fmtSite(r.site)}</td>
      <td class="mono">${r.field}</td>
      <td class="mono">${r.total.toLocaleString()}</td>
      <td class="mono">${r.missing.toLocaleString()}</td>
      <td class="mono">${r.pctMissing}%</td>
      <td><span class="r-badge r-badge-${r.health}">${r.health === 'normal' ? 'Healthy' : r.health}</span></td>
    </tr>
  `).join('');
}

// ════════════════════════════════════════════════════════════
// ADVANCED TAB
// ════════════════════════════════════════════════════════════
function initAdvanced() {
  renderDiurnalHeatmap('all');
  renderLWD();
  renderVibScatter();
  renderAlertBreakdown();

  document.getElementById('diurnal-site').addEventListener('change', e => {
    renderDiurnalHeatmap(e.target.value);
  });
}

function renderDiurnalHeatmap(site) {
  const data  = filterBySite(G.all, site);
  const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const hours = Array.from({length:24},(_,i)=>i);

  // Build grid: day × hour → avg pest count
  const grid = {};
  data.forEach(r => {
    if (!r.timestamp) return;
    const d = new Date(r.timestamp.replace(' ','T'));
    const key = `${d.getDay()}-${d.getHours()}`;
    if (!grid[key]) grid[key] = { sum:0, count:0 };
    grid[key].sum   += parseFloat(r.pest_trap_count)||0;
    grid[key].count += 1;
  });

  const cellVals = days.flatMap((day,di) => hours.map(h => {
    const k = `${di}-${h}`;
    return grid[k] ? grid[k].sum/grid[k].count : 0;
  }));

  const maxVal = Math.max(...cellVals, 1);

  const cellColor = v => {
    const t = v / maxVal;
    const r = Math.round(23 + t * (226-23));
    const g = Math.round(60 + (1-t) * (153-60));
    const b = Math.round(34 * (1-t));
    return `rgb(${r},${g},${b})`;
  };

  const wrap = document.getElementById('diurnal-heatmap-wrap');

  let html = `<div style="display:grid;grid-template-columns:40px repeat(24,1fr);gap:2px;font-size:9px;">`;
  // Header row
  html += `<div></div>`;
  hours.forEach(h => { html += `<div style="text-align:center;color:var(--r-text-4);padding:2px 0;">${h}</div>`; });

  // Data rows
  days.forEach((day, di) => {
    html += `<div style="display:flex;align-items:center;color:var(--r-text-3);font-weight:600;">${day}</div>`;
    hours.forEach(h => {
      const k = `${di}-${h}`;
      const v = grid[k] ? grid[k].sum/grid[k].count : 0;
      html += `<div style="aspect-ratio:1;border-radius:3px;background:${cellColor(v)};cursor:default;" title="${day} ${h}:00 — avg ${v.toFixed(1)} traps"></div>`;
    });
  });

  html += '</div>';
  html += `<div style="margin-top:8px;display:flex;align-items:center;gap:8px;font-size:11px;color:var(--r-text-4);">
    <span>Low</span>
    <div style="height:8px;flex:1;border-radius:4px;background:linear-gradient(90deg,#173404,#97c459,#e24b4a);"></div>
    <span>High</span>
    <span style="margin-left:12px;">Max: ${maxVal.toFixed(1)} traps</span>
  </div>`;

  wrap.innerHTML = html;
}

function renderLWD() {
  const wrap = document.getElementById('lwd-bars');
  const results = G.sites.map(site => {
    const sd = G.all.filter(r=>r.site_id===site).sort((a,b)=>a.timestamp<b.timestamp?-1:1);
    let maxRun=0, run=0;
    sd.forEach(r => {
      if (parseFloat(r.leaf_wetness_0_1) >= 0.8) { run++; maxRun=Math.max(maxRun,run); }
      else run = 0;
    });
    // Each reading is 15 mins, so hours = count * 0.25
    return { site, hours: maxRun * 0.25 };
  });

  const maxH = Math.max(...results.map(r=>r.hours), 1);

  wrap.innerHTML = results.map(r => `
    <div class="r-lwd-row">
      <div class="r-lwd-site">${fmtSite(r.site)}</div>
      <div class="r-lwd-bar-bg">
        <div class="r-lwd-bar-fill" style="width:${Math.round((r.hours/maxH)*100)}%;"></div>
      </div>
      <div class="r-lwd-val">${r.hours.toFixed(1)}h</div>
    </div>
  `).join('');
}

function renderVibScatter() {
  const data = G.all.filter(r => r.vibration_level!=null && r.pest_trap_count!=null).slice(0,1500);

  destroyChart('vibScatter');
  charts['vibScatter'] = new Chart(document.getElementById('vibScatter'), {
    type: 'scatter',
    data: {
      datasets: G.sites.map(site => ({
        label: fmtSite(site),
        data: data.filter(r=>r.site_id===site).map(r=>({
          x: parseFloat(r.vibration_level),
          y: parseFloat(r.pest_trap_count),
        })),
        backgroundColor: (SITE_COLORS[site]||'#888')+'55',
        borderColor: SITE_COLORS[site]||'#888',
        borderWidth:1, pointRadius:3,
      }))
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:true, labels:{font:{size:10},boxWidth:8}} },
      scales: {
        x: { title:{display:true,text:'Vibration Level',font:{size:10}}, ticks:{font:{size:10}} },
        y: { title:{display:true,text:'Pest Trap Count',font:{size:10}}, beginAtZero:true, ticks:{font:{size:10}} }
      }
    }
  });
}

function renderAlertBreakdown() {
  const alertTypes = ['alert_pest_action','alert_pest_outbreak','alert_disease_moderate','alert_disease_high'];
  const labels = ['Pest Action','Pest Outbreak','Disease Moderate','Disease High'];
  const colors = ['#639922','#ef9f27','#378add','#e24b4a'];

  const datasets = alertTypes.map((field, i) => ({
    label: labels[i],
    data: G.sites.map(site => G.all.filter(r=>r.site_id===site && parseFloat(r[field])===1).length),
    backgroundColor: colors[i]+'bb',
    borderColor: colors[i],
    borderWidth: 1,
  }));

  destroyChart('alertBreakdown');
  charts['alertBreakdown'] = new Chart(document.getElementById('alertBreakdown'), {
    type: 'bar',
    data: { labels: G.sites.map(fmtSite), datasets },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:true, labels:{font:{size:11},boxWidth:10}} },
      scales: {
        x: { ticks:{font:{size:11}}, grid:{display:false} },
        y: { beginAtZero:true, ticks:{font:{size:10}}, grid:{color:'rgba(0,0,0,0.04)'} }
      }
    }
  });
}

// ════════════════════════════════════════════════════════════
// NASA TAB
// ════════════════════════════════════════════════════════════
function initNasa() {
  fetchNasaData();
  document.getElementById('nasa-refresh-btn').addEventListener('click', fetchNasaData);
}

async function fetchNasaData() {
  const coords = SITE_COORDS['site_maize'] || { lat:-17.8, lon:31.0 };
  const today  = new Date();
  const end    = fmtNasaDate(today);
  const start  = fmtNasaDate(new Date(today - 30 * 86400000));
  const clean  = v => (v == null || v <= -990) ? null : v;

  const params = new URLSearchParams({
    parameters: 'T2M,ALLSKY_SFC_SW_DWN,PRECTOTCORR,WS10M,RH2M',
    community: 'AG',
    longitude: coords.lon,
    latitude:  coords.lat,
    start,
    end,
    format: 'JSON',
  });

  try {
    const res  = await fetch(`${NASA_BASE}?${params}`);
    if (!res.ok) throw new Error('NASA API failed');
    const json = await res.json();
    const props = json.properties?.parameter || {};

    const dates  = Object.keys(props.T2M || {}).sort();
    const latest = dates[dates.length - 1];

    const t2m    = clean(props.T2M?.[latest]);
    const allsky = clean(props.ALLSKY_SFC_SW_DWN?.[latest]);
    const prec   = clean(props.PRECTOTCORR?.[latest]);
    const ws10m  = clean(props.WS10M?.[latest]);
    const rh2m   = clean(props.RH2M?.[latest]);
    const gdd    = t2m != null ? Math.max(0, t2m - 10).toFixed(1) : null;
    const ndvi   = allsky != null ? Math.min(0.95, Math.max(0.1, 0.3 + allsky/1000 * 0.5 - (prec||0)/50)).toFixed(2) : null;

    // If all values are null, fall back to illustrative
    if (!t2m && !allsky && !prec) throw new Error('all null');

    setText('nasa-t2m',    t2m    != null ? t2m.toFixed(1)   : '—');
    setText('nasa-allsky', allsky != null ? allsky.toFixed(0) : '—');
    setText('nasa-prectot',prec   != null ? prec.toFixed(2)  : '—');
    setText('nasa-gdd',    gdd    ?? '—');
    setText('nasa-wind',   ws10m  != null ? ws10m.toFixed(1) : '—');
    setText('nasa-rh2m',   rh2m   != null ? rh2m.toFixed(1)  : '—');
    setText('nasa-ndvi',   ndvi   ?? '—');

    const cleanArr = arr => arr.map(v => clean(v));
    renderNasaTempOverlay(props.T2M||{}, dates, clean);
    renderNasaGdd(props.T2M||{}, dates, clean);
    renderNasaRiskTable(t2m, prec, ndvi);

  } catch(e) {
    console.warn('NASA API unavailable — using illustrative data', e);
    renderNasaFallback();
  }
}

function renderNasaTempOverlay(t2mData, dates, clean = v => v) {
  const last30 = dates.slice(-30);

  // Get local sensor avg temp per day
  const localByDay = groupByDay(G.all, 'air_temperature_c');

  destroyChart('nasaTempOverlay');
  charts['nasaTempOverlay'] = new Chart(document.getElementById('nasaTempOverlay'), {
    type: 'line',
    data: {
      labels: last30.map(d => new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'})),
      datasets: [
        {
          label: 'Local sensor avg',
          data: last30.map(d => {
            const k = d.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            return localByDay[k] ?? null;
          }),
          borderColor: '#97c459', backgroundColor:'rgba(151,196,89,0.1)',
          borderWidth:2, pointRadius:3, tension:0.3, fill:true, spanGaps:true,
        },
        {
          label: 'NASA T2M (regional)',
          data: last30.map(d => clean(t2mData[d])),
          borderColor: '#378add', backgroundColor:'transparent',
          borderWidth:2, pointRadius:3, tension:0.3, spanGaps:true,
          borderDash: [4,3],
        }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{ display:true, labels:{ color:'rgba(255,255,255,0.6)', font:{size:10}, boxWidth:10 } },
        tooltip:{mode:'index',intersect:false}
      },
      scales: {
        x: { ticks:{color:'rgba(255,255,255,0.4)',font:{size:9}}, grid:{color:'rgba(255,255,255,0.05)'} },
        y: { ticks:{color:'rgba(255,255,255,0.4)',font:{size:9}}, grid:{color:'rgba(255,255,255,0.05)'} }
      }
    }
  });
}

function renderNasaGdd(t2mData, dates, clean = v => v) {
  const last30 = dates.slice(-30);
  let cumulative = 0;
  const gddVals = last30.map(d => {
    const t = clean(t2mData[d]);
    cumulative += t != null ? Math.max(0, t - 10) : 0;
    return parseFloat(cumulative.toFixed(1));
  });

  destroyChart('nasaGddChart');
  charts['nasaGddChart'] = new Chart(document.getElementById('nasaGddChart'), {
    type: 'line',
    data: {
      labels: last30.map(d => new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'})),
      datasets:[{
        label: 'Cumulative GDD',
        data: gddVals,
        borderColor:'#ef9f27', backgroundColor:'rgba(239,159,39,0.1)',
        borderWidth:2, pointRadius:2, tension:0.4, fill:true,
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false} },
      scales: {
        x: { ticks:{color:'rgba(255,255,255,0.4)',font:{size:9}}, grid:{color:'rgba(255,255,255,0.05)'} },
        y: { title:{display:true,text:'GDD (°C·days)',color:'rgba(255,255,255,0.4)',font:{size:10}},
             ticks:{color:'rgba(255,255,255,0.4)',font:{size:9}}, grid:{color:'rgba(255,255,255,0.05)'} }
      }
    }
  });
}

function renderNasaRiskTable(t2m, prec, ndvi) {
  const wrap = document.getElementById('nasa-risk-table');
  const rows = G.sites.map(site => {
    const sd = G.all.filter(r=>r.site_id===site);
    const latest = sd[sd.length-1];
    const sensorStatus = latest?.status || 'normal';
    const ndviVal = ndvi ? parseFloat(ndvi) : 0.6;
    const soilMoist = prec != null ? (prec > 5 ? 'High' : prec > 2 ? 'Moderate' : 'Low') : '—';

    let combined = 'Low';
    if (sensorStatus==='critical' && ndviVal<0.4) combined = 'Extreme';
    else if (sensorStatus==='critical' || (sensorStatus==='warning' && ndviVal<0.5)) combined = 'High';
    else if (sensorStatus==='warning') combined = 'Moderate';

    const badgeColor = {Extreme:'r-badge-critical',High:'r-badge-critical',Moderate:'r-badge-warning',Low:'r-badge-normal'}[combined];

    return `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:11px;align-items:center;">
        <div style="color:rgba(255,255,255,0.7);font-weight:600;">${fmtSite(site)}</div>
        <div><span class="r-badge r-badge-${sensorStatus}">${sensorStatus}</span></div>
        <div style="color:rgba(255,255,255,0.5);">NDVI ${ndviVal.toFixed(2)}</div>
        <div><span class="r-badge ${badgeColor}">${combined}</span></div>
      </div>
    `;
  });

  wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;padding:0 0 6px;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.3);">
      <div>Site</div><div>Sensor</div><div>NDVI</div><div>Combined Risk</div>
    </div>
    ${rows.join('')}
  `;
}

function renderNasaFallback() {
  // Illustrative data when NASA API is unreachable
  const t2m = 22.4, allsky = 285, prec = 3.2, ws = 4.1, rh = 74.5, gdd = 12.4, ndvi = 0.61;
  setText('nasa-t2m',    t2m.toFixed(1));
  setText('nasa-allsky', allsky.toFixed(0));
  setText('nasa-prectot',prec.toFixed(2));
  setText('nasa-gdd',    gdd.toFixed(1));
  setText('nasa-wind',   ws.toFixed(1));
  setText('nasa-rh2m',   rh.toFixed(1));
  setText('nasa-ndvi',   ndvi.toFixed(2));

  // Illustrative chart
  const labels = Array.from({length:30},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-29+i);
    return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
  });

  const localTemps = labels.map((_,i) => parseFloat((18+Math.sin(i*0.3)*5+Math.random()*2).toFixed(1)));
  const nasaTemps  = localTemps.map(t => parseFloat((t + (Math.random()-0.5)*3).toFixed(1)));

  destroyChart('nasaTempOverlay');
  charts['nasaTempOverlay'] = new Chart(document.getElementById('nasaTempOverlay'), {
    type:'line',
    data:{ labels, datasets:[
      { label:'Local sensor avg', data:localTemps, borderColor:'#97c459', backgroundColor:'rgba(151,196,89,0.1)', borderWidth:2, pointRadius:2, tension:0.4, fill:true },
      { label:'NASA T2M (regional)', data:nasaTemps, borderColor:'#378add', backgroundColor:'transparent', borderWidth:2, pointRadius:2, tension:0.4, borderDash:[4,3] }
    ]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:true,labels:{color:'rgba(255,255,255,0.6)',font:{size:10},boxWidth:10}}, tooltip:{mode:'index',intersect:false} },
      scales:{
        x:{ticks:{color:'rgba(255,255,255,0.4)',font:{size:9}},grid:{color:'rgba(255,255,255,0.05)'}},
        y:{ticks:{color:'rgba(255,255,255,0.4)',font:{size:9}},grid:{color:'rgba(255,255,255,0.05)'}}
      }
    }
  });

  const cumGdd = [];
  let acc=0;
  localTemps.forEach(t => { acc += Math.max(0,t-10); cumGdd.push(parseFloat(acc.toFixed(1))); });

  destroyChart('nasaGddChart');
  charts['nasaGddChart'] = new Chart(document.getElementById('nasaGddChart'), {
    type:'line',
    data:{ labels, datasets:[{ label:'Cumulative GDD', data:cumGdd, borderColor:'#ef9f27', backgroundColor:'rgba(239,159,39,0.1)', borderWidth:2, pointRadius:2, tension:0.4, fill:true }]},
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{
        x:{ticks:{color:'rgba(255,255,255,0.4)',font:{size:9}},grid:{color:'rgba(255,255,255,0.05)'}},
        y:{ticks:{color:'rgba(255,255,255,0.4)',font:{size:9}},grid:{color:'rgba(255,255,255,0.05)'}}
      }
    }
  });

  renderNasaRiskTable(t2m, prec, ndvi);
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════
function filterBySite(data, site) {
  return site === 'all' ? data : data.filter(r => r.site_id === site);
}

function uniqueDates(data, days) {
  const all = [...new Set(data.map(r => r.timestamp?.slice(0,10)).filter(Boolean))].sort();
  return all.slice(-days);
}

function groupByDay(data, field) {
  const map = {};
  data.forEach(r => {
    const day = r.timestamp?.slice(0,10);
    if (!day) return;
    const v = parseFloat(r[field]);
    if (isNaN(v)) return;
    if (!map[day]) map[day] = { sum:0, count:0 };
    map[day].sum   += v;
    map[day].count += 1;
  });
  const result = {};
  Object.keys(map).forEach(k => { result[k] = parseFloat((map[k].sum/map[k].count).toFixed(2)); });
  return result;
}

function dailyAvg(data, field, days) {
  const byDay = groupByDay(data, field);
  const labels = Object.keys(byDay).sort().slice(-days);
  const vals   = labels.map(d => byDay[d]);
  return { labels: labels.map(fmtDate), vals };
}

function mean(arr) {
  return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
}

function pct(n, d) {
  return d ? ((n/d)*100).toFixed(1) : '0.0';
}

function fmtSite(s) {
  return (s||'').replace('site_','').replace(/^\w/,c=>c.toUpperCase());
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
}

function fmtN(v, decimals=1) {
  const n = parseFloat(v);
  return isNaN(n) ? '—' : n.toFixed(decimals);
}

function fmt(v) {
  const n = parseFloat(v);
  return isNaN(n) ? '—' : n.toString();
}

function fmtNasaDate(d) {
  return d.getFullYear().toString() +
    String(d.getMonth()+1).padStart(2,'0') +
    String(d.getDate()).padStart(2,'0');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function lineOpts(extra={}) {
  return {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false}, tooltip:{mode:'index',intersect:false} },
    scales: {
      x: xScale(),
      y: { beginAtZero:true, ticks:{font:{size:10}}, grid:{color:'rgba(0,0,0,0.04)'} }
    },
    ...extra
  };
}

function xScale() {
  return { ticks:{font:{size:10}, maxRotation:45, autoSkip:true, maxTicksLimit:12}, grid:{display:false} };
}

function downloadCSV(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const rows = [keys.join(','), ...data.map(r => keys.map(k => JSON.stringify(r[k]??'')).join(','))];
  const blob = new Blob([rows.join('\n')], {type:'text/csv'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── SAMPLE DATA GENERATOR ────────────────────────────────────
function generateSample(n) {
  const sites   = ['site_maize','site_orchard','site_wheat','site_brassica'];
  const pool    = ['normal','normal','normal','warning','warning','critical'];
  const rows    = [];
  const base    = new Date('2023-01-01');

  for (let i=0; i<n; i++) {
    const d      = new Date(base);
    d.setMinutes(d.getMinutes() + i*15);
    const site   = sites[i % sites.length];
    const status = pool[Math.floor(Math.random()*pool.length)];
    const temp   = parseFloat((15+Math.sin(i*0.05)*9+Math.random()*3).toFixed(1));
    const humid  = parseFloat((68+Math.sin(i*0.08)*18+Math.random()*4).toFixed(1));
    const lw     = parseFloat((0.4+Math.sin(i*0.1)*0.5).toFixed(3)).toFixed(3);
    const vib    = parseFloat((Math.random()*0.9).toFixed(3));
    const rain   = parseFloat((Math.random()*5).toFixed(3));
    const pest   = status==='critical' ? Math.floor(Math.random()*20+10)
                 : status==='warning'  ? Math.floor(Math.random()*9+2)
                 : Math.floor(Math.random()*4);
    const pa = status!=='normal' && Math.random()>0.4 ? 1 : 0;
    const po = status==='critical' && Math.random()>0.5 ? 1 : 0;
    const dm = status!=='normal' && humid>80 && Math.random()>0.5 ? 1 : 0;
    const dh = status==='critical' && humid>85 && parseFloat(lw)>0.7 ? 1 : 0;

    rows.push({
      timestamp:              d.toISOString().replace('T',' ').slice(0,19),
      site_id:                site,
      air_temperature_c:      temp,
      relative_humidity_pct:  humid,
      leaf_wetness_0_1:       parseFloat(lw),
      pest_trap_count:        pest,
      wx_rain_mm_hr:          rain,
      vibration_level:        vib,
      status,
      alert_triggered:        status!=='normal'?1:0,
      alert_pest_action:      pa,
      alert_pest_outbreak:    po,
      alert_disease_moderate: dm,
      alert_disease_high:     dh,
    });
  }
  return rows;
}