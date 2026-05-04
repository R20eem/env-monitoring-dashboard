/**
 * File: shared-nav.js
 *
 * Purpose:
 * Shared navigation module that handles authentication state,
 * sidebar active links, and topbar buttons across all pages.
 *
 * Responsibilities:
 * - Check user authentication and role
 * - Update sidebar active link based on current page
 * - Inject login/logout buttons into topbar
 * - Handle dashboard routing based on user role
 * - Manage logout functionality
 *
 * Layer:
 * Frontend (Shared Utility)
 *
 * Related:
 * - All HTML pages using shared navigation
 * - l18n.js
 * - login.html
 */

/* ============================================================
   SHARED NAV — shared-nav.js
   Drop this script into every page before </body>
   Handles: auth state, sidebar active link, topbar buttons,
            dashboard routing, logout (sidebar + topbar)
   ============================================================ */

(function () {
  'use strict';

  // ── TOKEN HELPERS ────────────────────────────────────────────
  function getToken() {
    return localStorage.getItem('jwt_token') || localStorage.getItem('token');
  }

  function doLogout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    window.location.href = 'login.html';
  }

  const token    = getToken();
  const role     = localStorage.getItem('userRole');
  const email    = localStorage.getItem('userEmail') || '';
  const isLogged = !!(token && role);

  // ── DASHBOARD URL ────────────────────────────────────────────
  // Researchers go to researcher.html, everyone else to index.html
  const dashUrl = (isLogged && role === 'researcher') ? 'researcher.html' : 'index.html';

  // ── SIDEBAR DASHBOARD LINK ───────────────────────────────────
  // Set href on every element with class sh-dash-link
  document.querySelectorAll('.sh-dash-link').forEach(link => {
    link.href = dashUrl;
  });

  // ── TOPBAR BUTTONS ───────────────────────────────────────────
  // Note: Sign out is only available in the sidebar, not in the topbar
  const navActions = document.getElementById('sh-nav-actions');
  if (navActions) {
    const langToggle = document.getElementById('lang-toggle');
    const hasLangToggle = langToggle && navActions.contains(langToggle);

    // Use i18n if available, else fall back to English
    const _t = (key, fallback) => (typeof I18n !== 'undefined' ? I18n.t(key) : fallback);
    if (isLogged) {
      // Logged in: show dashboard link only, no sign out in topbar
      navActions.innerHTML = `
        <a href="${dashUrl}" class="sh-btn sh-btn-ghost">${_t('sh.dashboard_btn','Dashboard')}</a>
      `;
    } else {
      navActions.innerHTML = `
        <a href="login.html"    class="sh-btn sh-btn-outline">${_t('nav.signin','Sign In')}</a>
        <a href="register.html" class="sh-btn sh-btn-primary">${_t('nav.register','Register')}</a>
      `;
    }

    if (hasLangToggle) {
      navActions.insertBefore(langToggle, navActions.firstChild);
    }
  }

  // ── SIDEBAR USER INFO ────────────────────────────────────────
  const avatarEl  = document.getElementById('sh-avatar');
  const nameEl    = document.getElementById('sh-user-name');
  const roleEl    = document.getElementById('sh-user-role');
  const userRow   = document.getElementById('sh-user-row');
  const loginLink = document.getElementById('sh-login-link');

  if (isLogged) {
    const initials = email
      ? email.slice(0, 2).toUpperCase()
      : role.slice(0, 2).toUpperCase();

    if (avatarEl)  avatarEl.textContent = initials;
    if (nameEl)    nameEl.textContent   = email || (role === 'researcher' ? 'Researcher' : 'Farmer');
    if (roleEl)    roleEl.textContent   = role;
    if (userRow)   userRow.classList.remove('sh-hidden');
    if (loginLink) loginLink.classList.add('sh-hidden');
  } else {
    if (userRow)   userRow.classList.add('sh-hidden');
    if (loginLink) loginLink.classList.remove('sh-hidden');
  }

  // ── SIDEBAR LOGOUT BUTTON ────────────────────────────────────
  const logoutBtn = document.getElementById('sh-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', e => {
      e.preventDefault();
      doLogout();
    });
  }

  // ── ACTIVE NAV LINK ──────────────────────────────────────────
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sh-nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href !== '#' && href.includes(currentPage)) {
      link.classList.add('active');
    }
  });

})();