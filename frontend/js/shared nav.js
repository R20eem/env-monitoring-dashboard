/* ============================================================
   SHARED NAV — shared-nav.js
   Drop this script into every page before </body>
   It handles: auth state, sidebar active link, topbar buttons
   ============================================================ */

(function() {
  'use strict';

  const token    = localStorage.getItem('jwt_token') || localStorage.getItem('token');
  const role     = localStorage.getItem('userRole');
  const email    = localStorage.getItem('userEmail') || '';
  const isLogged = !!(token && role);

  // ── TOPBAR BUTTONS ──────────────────────────────────────────
  const navActions = document.getElementById('sh-nav-actions');
  if (navActions) {
    if (isLogged) {
      const dashUrl = role === 'researcher' ? 'researcher.html' : 'index.html';
      navActions.innerHTML = `
        <a href="${dashUrl}" class="sh-btn sh-btn-ghost">Dashboard</a>
        <a href="#" class="sh-btn sh-btn-primary" id="sh-signout-btn">Sign Out</a>
      `;
      document.getElementById('sh-signout-btn').addEventListener('click', e => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
      });
    } else {
      navActions.innerHTML = `
        <a href="login.html"    class="sh-btn sh-btn-outline">Sign In</a>
        <a href="register.html" class="sh-btn sh-btn-primary">Register</a>
      `;
    }
  }

  // ── SIDEBAR USER INFO ────────────────────────────────────────
  const avatarEl  = document.getElementById('sh-avatar');
  const nameEl    = document.getElementById('sh-user-name');
  const roleEl    = document.getElementById('sh-user-role');
  const userRow   = document.getElementById('sh-user-row');
  const loginLink = document.getElementById('sh-login-link');

  if (isLogged) {
    if (avatarEl)  avatarEl.textContent  = email ? email.slice(0,2).toUpperCase() : role.slice(0,2).toUpperCase();
    if (nameEl)    nameEl.textContent    = email || (role === 'researcher' ? 'Researcher' : 'Farmer');
    if (roleEl)    roleEl.textContent    = role;
    if (userRow)   userRow.classList.remove('sh-hidden');
    if (loginLink) loginLink.classList.add('sh-hidden');
  } else {
    if (userRow)   userRow.classList.add('sh-hidden');
    if (loginLink) loginLink.classList.remove('sh-hidden');
  }

  // ── DASHBOARD LINK ───────────────────────────────────────────
  const dashLinks = document.querySelectorAll('.sh-dash-link');
  dashLinks.forEach(link => {
    link.href = (isLogged && role === 'researcher') ? 'researcher.html' : 'index.html';
  });

  // ── ACTIVE NAV LINK ──────────────────────────────────────────
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sh-nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(currentPage)) {
      link.classList.add('active');
    }
  });

  // ── LOGOUT BUTTON ────────────────────────────────────────────
  const logoutBtn = document.getElementById('sh-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', e => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = 'login.html';
    });
  }

})();