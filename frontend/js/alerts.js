const API_BASE = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
  loadAlerts();
});

async function loadAlerts() {
  try {
    // 🔹 ACTIVE (latest alerts)
    const endpoints = [
      "/api/dashboard/alert-triggered/latest",
      "/api/dashboard/alert-pest-action/latest",
      "/api/dashboard/alert-pest-outbreak/latest",
      "/api/dashboard/alert-disease-moderate/latest",
      "/api/dashboard/alert-disease-high/latest"
    ];

    const latest = await Promise.all(
      endpoints.map(url =>
        fetch(API_BASE + url)
          .then(res => res.json())
          .catch(() => null)
      )
    );

    displayActiveAlerts(latest);

    // 🔹 HISTORY (ALL alerts)
    const res = await fetch(API_BASE + "/api/dashboard/alerts");
    const allAlerts = await res.json();

    displayAlertHistory(allAlerts);

  } catch (error) {
    console.error("Error loading alerts:", error);
    showError();
  }
}

function displayActiveAlerts(alerts) {
  const container = document.getElementById("alerts-container");
  container.innerHTML = "";

  const valid = alerts.filter(a => a && Object.keys(a).length > 0);

  if (valid.length === 0) {
    container.innerHTML = `<div class="alert-empty">✅ No active alerts</div>`;
    return;
  }

  valid.forEach(alert => {
    const div = document.createElement("div");

    let level = "Normal";
    let cls = "normal";

    const text = JSON.stringify(alert).toLowerCase();

    if (text.includes("high") || text.includes("critical")) {
      level = "Critical";
      cls = "critical";
    } else if (text.includes("moderate")) {
      level = "Warning";
      cls = "warning";
    }

    div.className = `alert-card ${cls}`;

    div.innerHTML = `
      <div class="alert-header">
        <strong>${alert.type || "Alert"}</strong>
        <span class="alert-badge">${level}</span>
      </div>

      <div class="alert-message">
        🌡 ${alert.temperature ?? "-"}°C | 💧 ${alert.humidity ?? "-"}%
      </div>

      <div class="alert-site">
        📍 ${alert.site || "Field"}
      </div>
    `;

    container.appendChild(div);
  });
}

function displayAlertHistory(alerts) {
  const container = document.getElementById("alerts-history");

  if (!alerts || alerts.length === 0) {
    container.innerHTML = "<p>No history available</p>";
    return;
  }

  const recent = alerts.slice(0, 10);

  container.innerHTML = recent.map(a => {
    const status = getStatusText(a);

    return `
      <div class="history-item">
        <span>${a.site || "Field"} — ${status}</span>
        <span class="history-time">${a.timestamp || ""}</span>
      </div>
    `;
  }).join("");
}

function getStatusText(alert) {
  const text = JSON.stringify(alert).toLowerCase();

  if (text.includes("critical") || text.includes("high")) return "Critical";
  if (text.includes("moderate")) return "Warning";
  return "Normal";
}

function showError() {
  document.getElementById("alerts-container").innerHTML =
    "<p>❌ Failed to load alerts</p>";
}