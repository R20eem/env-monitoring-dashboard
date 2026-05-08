/**
 * File: password-toggle.js
 *
 * Purpose:
 * Handles password visibility toggling for password input fields.
 *
 * Responsibilities:
 * - Toggle password input visibility between hidden and visible states
 * - Update accessibility attributes for screen readers
 * - Bind toggle functionality to password field wrappers
 * - Prevent duplicate event bindings on toggle buttons
 * - Initialize password toggle functionality after page load
 *
 * Layer:
 * Frontend (JavaScript)
 *
 * Related:
 * - auth.css
 * - profile.css
 * - login.html
 * - register.html
 * - profile.html
 */

// Password show/hide button for .password-field wrappers
(function () {
  function syncState(input, btn) {
    var visible = input.type === "text";
    btn.setAttribute("aria-pressed", visible ? "true" : "false");
    var showLabel = btn.getAttribute("data-label-show") || "Show password";
    var hideLabel = btn.getAttribute("data-label-hide") || "Hide password";
    btn.setAttribute("aria-label", visible ? hideLabel : showLabel);
  }

  function bind(wrap) {
    var input = wrap.querySelector(".password-field-input");
    var btn = wrap.querySelector(".password-toggle");
    if (!input || !btn || btn.dataset.ptBound === "1") return;
    btn.dataset.ptBound = "1";

    var controls = input.id;
    if (controls) btn.setAttribute("aria-controls", controls);

    btn.addEventListener("click", function () {
      input.type = input.type === "password" ? "text" : "password";
      syncState(input, btn);
    });

    syncState(input, btn);
  }

  function init() {
    document.querySelectorAll(".password-field").forEach(bind);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
