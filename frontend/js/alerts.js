const API_BASE = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
  loadAlerts();
  setupFilters();
});

document.addEventListener("languageChanged", () => {
  loadAlerts();
});

function t(key, fallback) {
  return typeof I18n !== 'undefined' ? I18n.t(key) : fallback;
}

/* ===============================
   FILTER BUTTONS
================================ */
function setupFilters() {
  document.querySelectorAll(".alert-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".alert-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const sev = btn.dataset.filter;
      document.querySelectorAll(".alert-pill").forEach(pill => {
        if (sev === "all") {
          // "All" means critical + warning only (not normal)
          pill.style.display = pill.dataset.sev !== "normal" ? "flex" : "none";
        } else {
          pill.style.display = pill.dataset.sev === sev ? "flex" : "none";
        }
      });
    });
  });
}

/* ===============================
   LOAD ALERTS (LOCAL + BACKEND)
================================ */
async function loadAlerts() {
  try {
    const localAlerts = JSON.parse(localStorage.getItem("alerts")) || [];

    let apiAlerts = [];
    try {
      const res  = await fetch(API_BASE + "/api/researcher/dashboard/data");
      const data = await res.json();
      apiAlerts  = Array.isArray(data) ? data : [];
    } catch (err) {
      // backend not available, use local only
    }

    const allAlerts = [...localAlerts, ...apiAlerts];

    // Only show critical and warning — exclude normal
    const filteredAlerts = allAlerts.filter(a => {
    // always exclude normal/healthy — only show actionable alerts
    if (a.status === "normal") return false;

    return (
      a.status === "critical" ||
      a.status === "warning"  ||
      a.type   === "disease_risk" ||
      a.type   === "scan_result"
    );
  });

    updateStats(allAlerts, filteredAlerts);
    renderAlerts(filteredAlerts);

  } catch (error) {
    showError();
  }
}

/* ===============================
   RENDER ALERTS
================================ */
function renderAlerts(alerts) {

  alerts.sort((a, b) =>
    new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
  );

  const mainEl = document.getElementById("main-alert");
  const listEl = document.getElementById("alerts-list");

  mainEl.innerHTML = "";
  listEl.innerHTML = "";

  if (!alerts.length) {
    mainEl.innerHTML = `<div class="alert-empty">${t('alerts.empty_healthy', '✅ No alerts — your crops look healthy!')}</div>`;
    return;
  }

  /* ── LATEST ALERT — featured card ── */
  const first    = alerts[0];
  const firstSev = getStatusClass(first);

  mainEl.innerHTML = `
    <div class="alert-main-card ${firstSev}">
      <div class="alert-main-icon">${getSevIcon(firstSev)}</div>
      <div class="alert-main-body">
        <div class="alert-main-site">${first.site_id || t('alerts.field', 'Field')}</div>
        <div class="alert-main-title">${formatTitle(first)}</div>
        <div class="alert-main-chips">${buildChips(first)}</div>
        <div class="alert-main-note">${getAdvice(first)}</div>
      </div>
      <div class="alert-main-right">
        <span class="badge ${firstSev}">${formatSevLabel(firstSev)}</span>
        <span class="alert-main-time">${formatDate(first.timestamp)}</span>
      </div>
    </div>
  `;

  /* ── ALL OTHER ALERTS — pill rows (hide normal by default) ── */
  const pills = alerts.slice(1).map(a => {
    const sev     = getStatusClass(a);
    const display = sev === "normal" ? "none" : "flex";
    return `
      <div class="alert-pill ${sev}" data-sev="${sev}" style="display:${display}">
        <span class="alert-pill-dot"></span>
        <span class="alert-pill-site">${a.site_id || t('alerts.field', 'Field')}</span>
        <span class="alert-pill-desc">${formatTitle(a)}</span>
        <span class="alert-pill-readings">${buildPillReadings(a)}</span>
        <span class="badge ${sev}">${formatSevLabel(sev)}</span>
        <span class="alert-pill-time">${formatTime(a.timestamp)}</span>
        <span class="alert-pill-arrow">›</span>
      </div>
    `;
  }).join("");

  listEl.innerHTML = pills || `<div class="alert-empty">${t('alerts.empty_other', 'No other alerts to show.')}</div>`;
}

/* ===============================
   BUILD CHIPS (main card)
================================ */
function buildChips(a) {
  if (a.type === "scan_result") {
    const conf = a.confidence != null ? `${Math.round(a.confidence * 100)}%` : "–";
    return `
      <span class="alert-main-chip">🌿 ${a.crop_type || t('alerts.unknown_crop', 'Unknown crop')}</span>
      <span class="alert-main-chip">🔍 ${a.prediction || "–"}</span>
      <span class="alert-main-chip">📊 ${conf} ${t('alerts.confidence', 'confidence')}</span>
    `;
  }
  return `
    <span class="alert-main-chip">🌡 ${a.air_temperature_c ?? "–"}°C</span>
    <span class="alert-main-chip">💧 ${a.relative_humidity_pct ?? "–"}% ${t('alerts.humidity', 'humidity')}</span>
  `;
}

/* ===============================
   BUILD READINGS (pill row)
================================ */
function buildPillReadings(a) {
  if (a.type === "scan_result") {
    const conf = a.confidence != null ? `${Math.round(a.confidence * 100)}%` : "–";
    return `🌿 ${a.crop_type || "–"} · 📊 ${conf}`;
  }
  return `🌡 ${a.air_temperature_c ?? "–"}°C · 💧 ${a.relative_humidity_pct ?? "–"}%`;
}

/* ===============================
   STATS
================================ */
function updateStats(allAlerts, filteredAlerts) {
  const total    = allAlerts.length;
  const critical = filteredAlerts.filter(a =>
    a.status === "critical" || a.type === "disease_risk"
  ).length;
  const warning  = filteredAlerts.filter(a => a.status === "warning").length;

  document.getElementById("stat-total").textContent    = total;
  document.getElementById("stat-critical").textContent = critical;
  document.getElementById("stat-warning").textContent  = warning;
}

/* ===============================
   HELPERS
================================ */
function getStatusClass(a) {
  if (a.status === "critical" || a.type === "disease_risk") return "critical";
  if (a.status === "warning")  return "warning";
  return "normal";
}

function getSevIcon(sev) {
  if (sev === "critical") return "🔴";
  if (sev === "warning")  return "🟡";
  return "🟢";
}

function formatSevLabel(sev) {
  if (sev === "critical") return t('alerts.critical', 'Critical');
  if (sev === "warning")  return t('alerts.filter_warning', 'Warning');
  return t('alerts.normal', 'Normal');
}

function formatTitle(a) {
  if (a.type === "scan_result") {
    if (a.status === "normal")   return `${t('alerts.healthy_plant', 'Healthy Plant')} — ${a.prediction || ""}`;
    if (a.status === "critical") return `${t('alerts.disease_detected', 'Disease Detected')} — ${a.prediction || ""}`;
    return `${t('alerts.scan_result', 'Scan Result')} — ${a.prediction || ""}`;
  }
  if (a.type === "disease_risk") return t('alerts.disease_risk', 'Disease Risk');
  if (a.status === "critical")   return t('alerts.high_risk', 'High Risk Detected');
  if (a.status === "warning")    return t('alerts.warning_condition', 'Warning Condition');
  return t('alerts.normal_condition', 'Normal Condition');
}

function getAdvice(a) {
  if (a.type === "scan_result") {
    if (a.status === "critical") return `👉 ${a.reason || t('alerts.advice_disease_critical', 'Your plant may be diseased. Please inspect it immediately.')}`;
    if (a.status === "warning")  return `👉 ${a.reason || t('alerts.advice_disease_warning', 'Monitor your plant closely over the next few days.')}`;
    return `✅ ${a.reason || t('alerts.advice_disease_healthy', 'Your plant looks healthy. Keep up good care.')}`;
  }
  if (a.type === "disease_risk") return `👉 ${t('alerts.advice_unhealthy', 'Your plant may be unhealthy. Please check it and take action.')}`;
  if (a.status === "critical")   return `👉 ${t('alerts.advice_critical', 'Immediate attention required.')}`;
  if (a.status === "warning")    return `👉 ${t('alerts.advice_warning', 'Monitor conditions closely.')}`;
  return `✅ ${t('alerts.advice_normal', 'Everything looks fine.')}`;
}

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleString();
}

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function showError() {
  document.getElementById("main-alert").innerHTML =
    `<div class="alert-empty">${t('alerts.failed', '❌ Failed to load alerts. Please try again.')}</div>`;
}