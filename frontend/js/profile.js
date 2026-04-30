// GLOBAL
let currentData = null;

const API_BASE = `${window.location.protocol}//${window.location.hostname}:8000`;

const modal      = document.getElementById("edit-modal");
const editFirst  = document.getElementById("edit-first");
const editLast   = document.getElementById("edit-last");
const editEnd    = document.getElementById("edit-end");
const editEndGrp = document.getElementById("edit-end-group");
const closeBtn   = document.getElementById("close-btn");
const cancelBtn  = document.getElementById("cancel-btn");
const saveBtn    = document.getElementById("save-btn");
const editBtn    = document.getElementById("edit-btn");
const feedback   = document.getElementById("edit-feedback");

/* ── format date for <input type="date"> ── */
function formatDateForInput(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

/* ── format date for display ── */
function formatDateDisplay(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

/* ── avatar initials ── */
function setAvatar(firstName, lastName) {
  const avatar = document.getElementById("profile-avatar");
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  const initials = fullName
    ? fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  avatar.textContent = initials;
}

/* ── build profile fields based on role ── */
function buildFields(data) {
  const container = document.getElementById("profile-fields");
  const role = data.role || "farmer";
  const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();

  let html = `
    <div class="prof-field">
      <span class="prof-field-label">Full Name</span>
      <span class="prof-field-value">${fullName || "—"}</span>
    </div>
    <div class="prof-field">
      <span class="prof-field-label">Email</span>
      <span class="prof-field-value">${data.email || "—"}</span>
    </div>
  `;

  // Researcher-only fields
  if (role === "researcher") {
    html += `
      <div class="prof-field">
        <span class="prof-field-label">Organization Code</span>
        <span class="prof-field-value">
          ${data.org_code || "—"}
          <span class="prof-readonly-tag">read only</span>
        </span>
      </div>
      <div class="prof-field">
        <span class="prof-field-label">Research End Date</span>
        <span class="prof-field-value">${formatDateDisplay(data.connection_end)}</span>
      </div>
    `;
  }

  html += `
    <div class="prof-field" style="border-bottom:none;">
      <span class="prof-field-label">Member since</span>
      <span class="prof-field-value">2026</span>
    </div>
  `;

  container.innerHTML = html;
}

/* ── fill full UI ── */
function fillProfileUI(data) {
  const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();
  document.getElementById("profile-name").textContent       = fullName || "User";
  document.getElementById("profile-role-badge").textContent = data.role || "—";
  setAvatar(data.first_name, data.last_name);
  buildFields(data);

  // show research end date field in modal only for researchers
  if (editEndGrp) {
    editEndGrp.style.display = data.role === "researcher" ? "block" : "none";
  }
}

/* ── open edit modal ── */
function openEditModal() {
  if (!currentData) return;
  editFirst.value = currentData.first_name || "";
  editLast.value  = currentData.last_name  || "";
  if (editEnd) editEnd.value = formatDateForInput(currentData.connection_end);
  if (feedback) {
    feedback.textContent = "";
    feedback.className   = "prof-feedback";
  }
  modal.style.display = "flex";
}

/* ── close edit modal ── */
function closeEditModal() {
  modal.style.display = "none";
}

/* ── load profile from backend ── */
async function loadProfile() {
  const token = localStorage.getItem("token") || localStorage.getItem("jwt_token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res  = await fetch(`${API_BASE}/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data || data.detail) {
      localStorage.removeItem("token");
      localStorage.removeItem("jwt_token");
      window.location.href = "login.html";
      return;
    }

    currentData = data;
    fillProfileUI(data);

  } catch (err) {
    console.error("Profile load error:", err);
  }
}

/* ── save profile ── */
async function saveProfile() {
  const token = localStorage.getItem("token") || localStorage.getItem("jwt_token");

  const newFirst = editFirst.value.trim();
  const newLast  = editLast.value.trim();

  if (!newFirst || !newLast) {
    showFeedback("Please fill in your first and last name.", "error");
    return;
  }

  saveBtn.textContent = "Saving...";
  saveBtn.disabled    = true;

  try {
    const payload = {
      first_name: newFirst,
      last_name:  newLast,
    };

    // only send connection_end for researchers
    if (currentData.role === "researcher" && editEnd && editEnd.value) {
      payload.connection_end = editEnd.value;
    }

    const res  = await fetch(`${API_BASE}/auth/update-profile`, {
      method:  "PUT",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      showFeedback(data.detail || "Update failed. Please try again.", "error");
      return;
    }

    showFeedback("Profile updated successfully!", "success");
    await loadProfile();
    setTimeout(() => closeEditModal(), 1200);

  } catch (err) {
    showFeedback("Could not connect. Please try again.", "error");
  } finally {
    saveBtn.textContent = "Save changes";
    saveBtn.disabled    = false;
  }
}

/* ── feedback message ── */
function showFeedback(msg, type) {
  if (!feedback) return;
  feedback.textContent = msg;
  feedback.className   = `prof-feedback prof-feedback--${type}`;
}

/* ── event listeners ── */
if (editBtn)   editBtn.addEventListener("click", openEditModal);
if (closeBtn)  closeBtn.addEventListener("click", closeEditModal);
if (cancelBtn) cancelBtn.addEventListener("click", closeEditModal);
if (saveBtn)   saveBtn.addEventListener("click", saveProfile);

if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeEditModal();
  });
}

// run on load
loadProfile();