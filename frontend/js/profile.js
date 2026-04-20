console.log("PROFILE JS RUNNING");

// GLOBAL VARIABLES
let currentData = null;

const modal = document.getElementById("edit-modal");
const editFirst = document.getElementById("edit-first");
const editLast = document.getElementById("edit-last");
const editOrg = document.getElementById("edit-org");
const editEnd = document.getElementById("edit-end");
const closeBtn = document.getElementById("close-btn");
const saveBtn = document.getElementById("save-btn");
const editBtn = document.getElementById("edit-btn");
const profileName = document.getElementById("profile-name");

// Convert date into format suitable for input type="date"
function formatDateForInput(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);

  // Handle invalid date
  if (Number.isNaN(date.getTime())) return ""; 
  return date.toISOString().split("T")[0];
}

function setAvatar(firstName, lastName) {
  const avatar = document.getElementById("profile-avatar");

  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  const initials = fullName
    ? fullName
        .split(" ")
        .map(n => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  avatar.textContent = initials;
}

// Fill the profile page UI with the data from backend
function fillProfileUI(data) {
  document.getElementById("profile-email").innerText = data.email || "—";
  document.getElementById("profile-role").innerText = data.role || "—";
  document.getElementById("profile-role-2").innerText = data.role || "—";

  const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();
  document.getElementById("profile-name").innerText = fullName || "User";

  // Show extra fields only for researcher
  if (data.role === "researcher") {
    document.getElementById("profile-org").innerText = data.org_code || "—";
    document.getElementById("profile-end").innerText =
      data.connection_end
        ? new Date(data.connection_end).toLocaleDateString()
        : "—";
  }
  // avatar initails 
  setAvatar(data.first_name, data.last_name);
}

// =====================================
// EDIT HANDLING
// =====================================

// Open edit modal and fill inputs with current data
function openEditModal() {
  if (!currentData) return;

  editFirst.value = currentData.first_name || "";
  editLast.value = currentData.last_name || "";
  editOrg.value = currentData.org_code || "";
  editEnd.value = formatDateForInput(currentData.connection_end);

  modal.style.display = "flex";
}

function closeEditModal() {
  modal.style.display = "none";
}

// LOAD PROFILE DATA FROM BACKEND 
async function loadProfile() {
  const API_BASE = `${window.location.protocol}//${window.location.hostname}:8000`;
  const token = localStorage.getItem("token") || localStorage.getItem("jwt_token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  console.log("Calling API...");

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log("DATA:", data);

    if (!data || data.detail) {
      localStorage.removeItem("token");
      localStorage.removeItem("jwt_token");
      window.location.href = "login.html";
      return;
    }

    currentData = data;
    fillProfileUI(data);

  } catch (err) {
    console.error("ERROR:", err);
  }
}

// Open modal from button 
if (editBtn) {
  editBtn.addEventListener("click", openEditModal);
}

// Open modal from name 
if (profileName) {
  profileName.addEventListener("click", openEditModal);
}

// Close modal from button
if (closeBtn) {
  closeBtn.addEventListener("click", closeEditModal);
}

// close modal when clicking outside 
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeEditModal();
    }
  });
}

// SAVE PROFILE
if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const API_BASE = `${window.location.protocol}//${window.location.hostname}:8000`;
    const token = localStorage.getItem("token") || localStorage.getItem("jwt_token");

    const newFirst = editFirst.value.trim();
    const newLast = editLast.value.trim();
    const newOrg = editOrg.value.trim();
    const newEnd = editEnd.value;

    console.log("Sending update to backend...");

    try {
      const res = await fetch(`${API_BASE}/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: newFirst,
          last_name: newLast,
          org_code: newOrg,
          connection_end: newEnd
        })
      });

      console.log("Response status:", res.status);

      const data = await res.json();
      console.log("UPDATED:", data);

      await loadProfile();
      closeEditModal();

    } catch (err) {
      console.error("UPDATE ERROR:", err);
    }
  });
}

// Run on load 
loadProfile();