console.log("PROFILE JS RUNNING");

// GLOBAL VARIABLES
let currentData = null;

const modal = document.getElementById("edit-modal");
const editFirst = document.getElementById("edit-first");
const editLast = document.getElementById("edit-last");
const closeBtn = document.getElementById("close-btn");
const saveBtn = document.getElementById("save-btn");
const editBtn = document.getElementById("edit-btn");

// LOAD PROFILE DATA
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

    // Safety check
    if (!data || data.detail) {
      localStorage.removeItem("token");
      localStorage.removeItem("jwt_token");
      window.location.href = "login.html";
      return;
    }

    // STORE DATA FOR EDITING
    currentData = data;

    // Basic info
    document.getElementById("profile-email").innerText = data.email || "—";
    document.getElementById("profile-role").innerText = data.role || "—";
    document.getElementById("profile-role-2").innerText = data.role || "—";

    // Full name
    const fullName = `${data.first_name} ${data.last_name}`;
    document.getElementById("profile-name").innerText = fullName;

    // Avatar
    const initials = fullName
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    document.getElementById("profile-avatar").innerText = initials;

    // Researcher fields
    if (data.role === "researcher") {
      document.getElementById("profile-org").innerText = data.org_code || "—";

      document.getElementById("profile-end").innerText =
        data.connection_end
          ? new Date(data.connection_end).toLocaleDateString()
          : "—";
    }

  } catch (err) {
    console.error("ERROR:", err);
  }
}

// RUN ON LOAD
loadProfile();


// =====================
// EDIT BUTTON (OPEN MODAL)
// =====================
if (editBtn) {
  editBtn.addEventListener("click", () => {
    console.log("Edit clicked");

    // Fill inputs with current data
    editFirst.value = currentData?.first_name || "";
    editLast.value = currentData?.last_name || "";

    // Show modal
    modal.style.display = "flex";
  });
}


// =====================
// CLOSE MODAL
// =====================
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
}


// =====================
// SAVE (UI ONLY FOR NOW)
// =====================
if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    const newFirst = editFirst.value;
    const newLast = editLast.value;

    // Update UI
    document.getElementById("profile-name").innerText =
      `${newFirst} ${newLast}`;

    document.getElementById("profile-avatar").innerText =
      (newFirst[0] + newLast[0]).toUpperCase();

    // Close modal
    modal.style.display = "none";

    console.log("Saved locally (not yet backend)");
  });
}