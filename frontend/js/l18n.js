/**
 * File: l18n.js
 *
 * Purpose:
 * Internationalization (i18n) module for bilingual support (English/Afrikaans).
 * Fully offline - no server calls required for translations.
 *
 * Responsibilities:
 * - Provide translation table for all UI text
 * - Apply translations to HTML elements with data-i18n attributes
 * - Handle language toggle and persistence in localStorage
 * - Inject language toggle button into topbar sections
 *
 * Layer:
 * Frontend (Utility Module)
 *
 * Related:
 * - All HTML pages using data-i18n attributes
 * - shared-nav.js
 */

/* ============================================================
   ECO LEAF — i18n.js
   Fully offline bilingual module: English (en) / Afrikaans (af)
   Afrikaans is the mother tongue of the majority of South African
   commercial farmers and is widely spoken among emerging farmers.

   HOW IT WORKS
   ─────────────
   1. Add  data-i18n="key"  to any HTML element whose TEXT you
      want translated.
   2. For placeholder attributes add  data-i18n-ph="key".
   3. Call  I18n.apply()  after the DOM is ready (already done
      at the bottom of this file via DOMContentLoaded).
   4. The language toggle button (id="lang-toggle") is injected
      automatically into every topbar's .sh-topbar-right,
      .f-topbar-right, or .r-topbar-right.

   The chosen language is saved to localStorage so the preference
   persists across pages without any server call.
   ============================================================ */

'use strict';

const I18n = (() => {

  /* ── TRANSLATION TABLE ──────────────────────────────────── */
  const TRANSLATIONS = {

    /* ── NAVIGATION (shared sidebar + topbar) ── */
    'nav.dashboard':      { en: 'Dashboard',       af: 'Paneelbord' },
    'nav.blog':           { en: 'Community Blog',  af: 'Gemeenskapsblog' },
    'nav.profile':        { en: 'Profile',         af: 'Profiel' },
    'nav.signin':         { en: 'Sign In',         af: 'Teken In' },
    'nav.logout':         { en: 'Logout',          af: 'Meld Af' },
    'nav.signout':        { en: 'Sign Out',        af: 'Teken Uit' },
    'nav.register':       { en: 'Register',        af: 'Registreer' },
    'nav.about':          { en: 'ℹ About Us',      af: 'ℹ Oor Ons' },
    'nav.about_short':    { en: 'ℹ About',         af: 'ℹ Oor' },
    'nav.navigation':     { en: 'Navigation',      af: 'Navigasie' },

    /* ── FARMER DASHBOARD (index.html) ── */
    'f.brand_sub':        { en: 'Field Dashboard',       af: 'Veld Paneelbord' },
    'f.topbar_title':     { en: 'Field Health Dashboard', af: 'Veld Gesondheids Paneelbord' },
    'f.topbar_sub':       { en: 'Dec 25 – Dec 31, 2023 · 3 active sites', af: 'Des 25 – Des 31, 2023 · 3 aktiewe persele' },
    'f.nasa_pill':        { en: 'NASA POWER',            af: 'NASA POWER' },
    'f.live_pill':        { en: 'Live',                  af: 'Lewendig' },
    'f.hero_p':           { en: 'Here is your field health summary. Sites monitored every 15 minutes.',
                            af: 'Hier is jou veld gesondheidsopsomming. Persele elke 15 minute gemonitor.' },
    'f.alerts_label':     { en: 'Alerts today',   af: 'Waarskuwings vandag' },
    'f.health_label':     { en: 'Avg health',      af: 'Gem. gesondheid' },
    'f.rain_label':       { en: 'Rainfall today',  af: 'Reënval vandag' },
    'f.section_tiles':    { en: 'Field health scores — click a tile to explore that site',
                            af: 'Veld gesondheids tellings — klik \'n teël om die perseel te verken' },
    'f.chart_sub':        { en: 'Local risk (humidity + leaf wetness + temp) vs temperature and pest count. Dashed line = NASA regional when available.',
                            af: 'Plaaslike risiko (humiditeit + blaarnat + temp) vs temperatuur en plaagtelling. Stippellyn = NASA streeks wanneer beskikbaar.' },
    'f.btn_maize':        { en: 'Maize',    af: 'Mielies' },
    'f.btn_orchard':      { en: 'Orchard',  af: 'Boord' },
    'f.btn_brassica':     { en: 'Brassica', af: 'Brassika' },
    'f.legend_risk':      { en: 'Local risk level',    af: 'Plaaslike risiko vlak' },
    'f.legend_temp':      { en: 'Avg temperature',     af: 'Gem. temperatuur' },
    'f.legend_pest':      { en: 'Pest count',          af: 'Plaagtelling' },
    'f.legend_nasa':      { en: 'NASA regional temp',  af: 'NASA streeks temp' },
    'f.section_map':      { en: 'Satellite scouting map — click a dot to explore a site',
                            af: 'Satelliet verkenningskaart — klik \'n kolletjie om \'n perseel te verken' },
    'f.map_title':        { en: 'Farm site overview',  af: 'Plaas perseel oorsig' },
    'f.map_sub':          { en: 'Pulsing dot = elevated pest or alert risk · Dashed ellipse = NASA low soil-moisture zone',
                            af: 'Pulserende kolletjie = verhoogde plaag of waarskuwingsrisiko · Stippelellips = NASA lae grondvog sone' },
    'f.map_good':         { en: 'Good (80+)',              af: 'Goed (80+)' },
    'f.map_attention':    { en: 'Attention (65–79)',        af: 'Aandag (65–79)' },
    'f.map_critical':     { en: 'Critical / alert active', af: 'Krities / waarskuwing aktief' },

    /* ── DASHBOARD SITE NAMES & LABELS ── */
    'f.site_maize':       { en: 'Maize',    af: 'Mielies' },
    'f.site_orchard':     { en: 'Orchard',  af: 'Boord' },
    'f.site_brassica':    { en: 'Brassica', af: 'Brassika' },
    'f.grade_attention':  { en: 'Attention', af: 'Aandag' },
    'f.grade_good':       { en: 'Good',      af: 'Goed' },
    'f.grade_critical':   { en: 'Critical',  af: 'Krities' },

    /* ── DASHBOARD SITE DESCRIPTIONS ── */
    'f.desc_maize':       { en: 'High humidity is driving disease risk. Leaf wetness sustained 3+ days.',
                            af: 'Hoë humiditeit dryf siekterisiko. Blaarvogtigheid volgehou 3+ dae.' },
    'f.desc_orchard':     { en: 'Pest trap counts elevated. Outbreak risk rising this week.',
                            af: 'Plaagvaltellings verhoog. Uitbraakrisiko styg hierdie week.' },
    'f.desc_brassica':    { en: 'Most stable site. Low pest count, disease risk manageable.',
                            af: 'Mees stabiele perseel. Lae plaagtelling, siekterisiko beheerbaar.' },

    /* ── DASHBOARD INSIGHTS ── */
    'f.insight_maize':    { en: 'Warm, sticky air (22°C / 79% humidity) is keeping disease risk elevated. Leaf wetness has stayed high for 3+ days — ideal conditions for fungal spread.',
                            af: 'Warm, plakkerige lug (22°C / 79% humiditeit) hou siekterisiko verhoog. Blaarvogtigheid het 3+ dae hoog gebly — ideale toestande vir swamverspreiding.' },
    'f.insight_orchard':  { en: 'Pest trap counts have spiked to 4+ this week. Temperature is at pest hatch threshold (>22°C). Check irrigation in the south-east corner — low soil moisture there.',
                            af: 'Plaagvaltellings het hierdie week tot 4+ gespruit. Temperatuur is by plaag-broeitempel (>22°C). Kontroleer besproeiing in die suidoost-hoek — lae grondvog daar.' },
    'f.insight_brassica': { en: 'Conditions are the most stable of all three sites. Pest count below 2 on average. A good window to apply preventative treatment before the next humidity spike.',
                            af: 'Toestande is die mees stabiel van al drie persele. Plaagtelling gemiddeld onder 2. \'n Goeie venster om voorkomende behandeling toe te pas voor die volgende humiditeits piek.' },
    'f.insight_what':     { en: 'What is happening?', af: 'Wat gebeur?' },
    'f.map_nasa':         { en: 'Low soil moisture (NASA)', af: 'Lae grondvog (NASA)' },
    'f.section_cal':      { en: 'Smart action calendar — Dec 25 to Dec 31',
                            af: 'Slim aksie kalender — Des 25 tot Des 31' },

    /* ── RESEARCHER DASHBOARD (researcher.html) ── */
    'r.brand_sub':        { en: 'Research Portal',                 af: 'Navorsings Portaal' },
    'r.topbar_title':     { en: 'Pest & Environmental Monitoring', af: 'Plaag- & Omgewingsonitoring' },
    'r.about':            { en: 'ℹ About Us',  af: 'ℹ Oor Ons' },
    'r.live':             { en: 'Live',         af: 'Lewendig' },
    'r.export':           { en: 'Export',       af: 'Uitvoer' },
    'r.tab_overview':     { en: 'Overview',          af: 'Oorsig' },
    'r.tab_trends':       { en: 'Trend Analysis',    af: 'Neiging Analise' },
    'r.tab_correlations': { en: 'Correlations',      af: 'Korrelasies' },
    'r.tab_tables':       { en: 'Data Tables',       af: 'Data Tabelle' },
    'r.tab_advanced':     { en: 'Advanced',          af: 'Gevorderd' },
    'r.tab_nasa':         { en: 'NASA Integration',  af: 'NASA Integrasie' },

    /* ── ABOUT PAGE ── */
    'about.title':        { en: 'About Us',        af: 'Oor Ons' },
    'about.h1':           { en: 'About Eco Leaf 🌱', af: 'Oor Eco Leaf 🌱' },
    'about.hero_p':       { en: 'Building technology that helps farmers and researchers make better decisions through real-time environmental monitoring and data-driven insights.',
                            af: 'Tegnologie wat boere en navorsers help om beter besluite te neem deur intydse omgewingsmonitoring en data-gedrewe insigte.' },
    'about.what_title':   { en: '🌍 What Is This?',  af: '🌍 Wat Is Dit?' },
    'about.what_body':    { en: 'The Environmental Monitoring Dashboard is a web application designed to help farmers — including those new to the field — monitor their crops and make informed decisions based on real-time environmental data. Researchers can analyse trends across multiple sites using advanced visualisations and NASA satellite data.',
                            af: 'Die Omgewingsmoniteringspaneelbord is \'n webtoepassing wat ontwerp is om boere — insluitend dié wat nuut is op die gebied — te help om hul gewasse te monitor en ingeligte besluite te neem op grond van intydse omgewingsdata. Navorsers kan neigings oor verskeie persele ontleed met gevorderde visualisasies en NASA satelietdata.' },
    'about.mission_title':{ en: '🎯 Our Mission',   af: '🎯 Ons Missie' },
    'about.mission_body': { en: 'We believe every farmer deserves access to the same quality of environmental intelligence that large agribusinesses use. By combining local sensor networks with satellite data and community knowledge sharing, we level the playing field.',
                            af: 'Ons glo dat elke boer toegang verdien tot dieselfde kwaliteit omgewingsintelligensie wat groot landboubesighede gebruik. Deur plaaslike sensornetwerke te kombineer met satelietdata en gemeenskapskennisdeling, maak ons die speelveld gelyk.' },
    'about.sensors_title':{ en: 'Real-Time Sensors', af: 'Intydse Sensors' },
    'about.sensors_body': { en: 'Temperature, humidity, leaf wetness, pest traps and rainfall — monitored every 15 minutes across all sites.',
                            af: 'Temperatuur, humiditeit, blaarnat, plagval en reënval — elke 15 minute oor alle persele gemonitor.' },
    'about.nasa_title':   { en: 'NASA Integration',  af: 'NASA Integrasie' },
    'about.nasa_body':    { en: 'Regional satellite data from NASA POWER provides context beyond what ground sensors can capture — including NDVI and Growing Degree Days.',
                            af: 'Streeks satelietdata van NASA POWER bied konteks buite wat grondensors kan vasvang — insluitend NDVI en Groeigraaddae.' },
    'about.community_title': { en: 'Community Knowledge', af: 'Gemeenskapskennis' },
    'about.community_body':  { en: 'Farmers and researchers share field experience through the community blog — combining local knowledge with scientific analysis.',
                                af: 'Boere en navorsers deel veld ervaring deur die gemeenskapsblog — plaaslike kennis word gekombineer met wetenskaplike analise.' },
    'about.sites_title':  { en: '📊 Monitored Sites', af: '📊 Gemonitorde Persele' },
    'about.start_title':  { en: '🚀 Get Started',     af: '🚀 Begin Nou' },
    'about.start_body':   { en: 'Register as a farmer to access the community blog and public dashboard. Researchers with an organisation code get full access to advanced analytics, NASA integration and raw data exports.',
                            af: 'Registreer as \'n boer om toegang te kry tot die gemeenskapsblog en openbare paneelbord. Navorsers met \'n organisasiekode kry volledige toegang tot gevorderde analise, NASA integrasie en rou data uitvoere.' },
    'about.register_btn': { en: 'Register Now',  af: 'Registreer Nou' },
    'about.signin_btn':   { en: 'Sign In',        af: 'Teken In' },

    /* ── BLOG PAGE ── */
    'blog.title':         { en: 'Community Blog',  af: 'Gemeenskapsblog' },
    'blog.h1':            { en: 'Community Blog',  af: 'Gemeenskapsblog' },
    'blog.hero_p':        { en: 'Farmers and researchers sharing knowledge from the field.', af: 'Boere en navorsers deel kennis uit die veld.' },
    'blog.filter_all':    { en: 'All Posts',    af: 'Alle Plasings' },
    'blog.filter_farmer': { en: '🌾 Farmers',   af: '🌾 Boere' },
    'blog.filter_res':    { en: '🔬 Researchers', af: '🔬 Navorsers' },
    'blog.share_title':   { en: 'Share something with the community', af: 'Deel iets met die gemeenskap' },
    'blog.post_ph_title': { en: 'Title',               af: 'Titel' },
    'blog.post_ph_body':  { en: "What's on your mind?", af: 'Wat dink jy?' },
    'blog.post_btn':      { en: 'Post',                 af: 'Plaas' },
    'blog.loading':       { en: 'Loading posts…',       af: 'Plasings laai…' },
    'blog.empty':         { en: 'No posts yet. Be the first to share something!', af: 'Nog geen plasings nie. Wees die eerste om iets te deel!' },
    'blog.auth_title':    { en: 'Sign in to post',       af: 'Teken in om te plaas' },
    'blog.login_btn':     { en: 'Sign In',               af: 'Teken In' },
    'blog.no_account':    { en: "Don't have an account?", af: 'Het jy nie \'n rekening nie?' },
    'blog.register_link': { en: 'Register',              af: 'Registreer' },
    'blog.signout_btn':   { en: 'Sign Out',              af: 'Teken Uit' },
    'blog.community_h':   { en: 'Community',             af: 'Gemeenskap' },
    'blog.stats_farmer':  { en: 'Farmers sharing field experience',    af: 'Boere deel veld ervaring' },
    'blog.stats_res':     { en: 'Researchers sharing findings',        af: 'Navorsers deel bevindinge' },
    'blog.sort_note':     { en: 'Posts are sorted by most recent. Like posts to show appreciation!',
                            af: 'Plasings is gesorteer na die mees onlangse. Like plasings om waardering te toon!' },
    'blog.comment_ph':    { en: 'Write a comment…',      af: 'Skryf \'n opmerking…' },
    'blog.comment_btn':   { en: 'Add Comment',           af: 'Voeg Opmerking By' },
    'blog.comments_h':    { en: 'Comments',              af: 'Opmerkings' },

    /* ── PROFILE PAGE ── */
    'profile.title':      { en: 'Profile',      af: 'Profiel' },
    'profile.h1':         { en: 'My Profile',   af: 'My Profiel' },
    'profile.hero_p':     { en: 'Manage your account details and preferences.', af: 'Bestuur jou rekeningbesonderhede en voorkeure.' },
    'profile.email':      { en: 'Email',        af: 'E-pos' },
    'profile.role':       { en: 'Role',         af: 'Rol' },
    'profile.org':        { en: 'Organization Code', af: 'Organisasiekode' },
    'profile.end':        { en: 'Research End Date',  af: 'Navorsing Einddatum' },
    'profile.member':     { en: 'Member since', af: 'Lid sedert' },
    'profile.edit_btn':   { en: 'Edit Profile', af: 'Wysig Profiel' },
    'profile.modal_h':    { en: 'Edit Profile', af: 'Wysig Profiel' },
    'profile.save_btn':   { en: 'Save',         af: 'Stoor' },
    'profile.cancel_btn': { en: 'Cancel',       af: 'Kanselleer' },
    'profile.first_ph':   { en: 'First Name',   af: 'Voornaam' },
    'profile.last_ph':    { en: 'Last Name',     af: 'Van' },
    'profile.org_ph':     { en: 'Organization Code', af: 'Organisasiekode' },

    /* ── AUTH PAGES (login / register) ── */
    'auth.signin_title':  { en: 'Sign In',      af: 'Teken In' },
    'auth.signin_sub':    { en: 'to continue to your dashboard', af: 'om voort te gaan na jou paneelbord' },
    'auth.iam':           { en: 'I am a...',    af: 'Ek is \'n...' },
    'auth.farmer':        { en: '🌾 Farmer',    af: '🌾 Boer' },
    'auth.researcher':    { en: '🔬 Researcher', af: '🔬 Navorser' },
    'auth.email_label':   { en: 'Email Address', af: 'E-posadres' },
    'auth.org_label':     { en: 'Organization Code', af: 'Organisasiekode' },
    'auth.password_label':{ en: 'Password',     af: 'Wagwoord' },
    'auth.signin_btn':    { en: 'Sign In',       af: 'Teken In' },
    'auth.no_account':    { en: "Don't have an account?", af: 'Het jy nie \'n rekening nie?' },
    'auth.register_now':  { en: 'Register Now',  af: 'Registreer Nou' },
    'auth.register_title':{ en: 'Create an Account', af: 'Skep \'n Rekening' },
    'auth.first_ph':      { en: 'First Name',    af: 'Voornaam' },
    'auth.last_ph':       { en: 'Last Name',     af: 'Van' },
    'auth.email_ph':      { en: 'Email Address', af: 'E-posadres' },
    'auth.password_ph':   { en: 'Create Password', af: 'Skep Wagwoord' },
    'auth.location_ph':   { en: 'Farm Location', af: 'Plaas Ligging' },
    'auth.org_ph':        { en: 'Organization Code (e.g. ECO-123)', af: 'Organisasiekode (bv. ECO-123)' },
    'auth.experience':    { en: 'Years of Experience', af: 'Jare Ondervinding' },
    'auth.exp_0_1':       { en: '0-1 years',    af: '0-1 jaar' },
    'auth.exp_1_3':       { en: '1-3 years',    af: '1-3 jaar' },
    'auth.exp_3_5':       { en: '3-5 years',    af: '3-5 jaar' },
    'auth.exp_5plus':     { en: '5+ years',      af: '5+ jaar' },
    'auth.register_btn':  { en: 'Register',      af: 'Registreer' },
    'auth.have_account':  { en: 'Already have an account?', af: 'Het jy reeds \'n rekening?' },
    'auth.login_link':    { en: 'Log in',         af: 'Meld aan' },

    /* ── SHARED NAV BUTTON LABELS ── */
    'sh.dashboard_btn':   { en: 'Dashboard',  af: 'Paneelbord' },
  };

  /* ── STATE ─────────────────────────────────────────────── */
  let currentLang = localStorage.getItem('ecoLeafLang') || 'en';

  /* ── PUBLIC API ─────────────────────────────────────────── */
  function t(key) {
    const entry = TRANSLATIONS[key];
    if (!entry) return key;
    return entry[currentLang] || entry['en'] || key;
  }

  function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('ecoLeafLang', lang);
    apply();
    updateToggleBtn();
    // Dispatch custom event for components that need to re-render
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  function getLang() { return currentLang; }

  /* Apply translations to the current DOM */
  function apply() {
    /* Text content */
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val !== key) el.textContent = val;
    });

    /* Placeholder attributes */
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      const val = t(key);
      if (val !== key) el.placeholder = val;
    });

    /* HTML lang attribute */
    document.documentElement.lang = currentLang;
  }

  /* ── TOGGLE BUTTON ──────────────────────────────────────── */
  /*
    Injects a pill button into whichever topbar-right exists on the page.
    Works for farmer (f-topbar-right), researcher (r-topbar-right),
    and shared-layout (sh-topbar-right) pages.
  */
  function injectToggleBtn() {
    const selectors = [
      '.f-topbar-right',
      '.r-topbar-right',
      '.sh-topbar-right',
    ];

    let container = null;
    for (const sel of selectors) {
      container = document.querySelector(sel);
      if (container) break;
    }
    if (!container) return;

    /* Don't double-inject */
    if (document.getElementById('lang-toggle')) return;

    const btn = document.createElement('button');
    btn.id = 'lang-toggle';
    btn.setAttribute('aria-label', 'Switch language / Wissel taal');
    btn.setAttribute('title', 'Switch language / Wissel taal');
    btn.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'gap:5px',
      'padding:6px 13px',
      'border-radius:20px',
      'border:1.5px solid currentColor',
      'background:transparent',
      'cursor:pointer',
      'font-size:12px',
      'font-weight:700',
      'letter-spacing:0.04em',
      'transition:background 0.18s, color 0.18s',
      'white-space:nowrap',
      'font-family:inherit',
    ].join(';');

    /* Style the button to match whatever topbar it lives in */
    const isGreenTopbar = !!container.closest('.f-topbar, .r-topbar');
    btn.style.color  = isGreenTopbar ? 'rgba(255,255,255,0.75)' : 'var(--sh-text-3, #7a8a65)';

    btn.addEventListener('mouseenter', () => {
      btn.style.background = isGreenTopbar ? 'rgba(255,255,255,0.12)' : 'var(--sh-green-50,#f4f9ed)';
      btn.style.color = isGreenTopbar ? '#fff' : 'var(--sh-green-700,#3b6d11)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
      btn.style.color = isGreenTopbar ? 'rgba(255,255,255,0.75)' : 'var(--sh-text-3,#7a8a65)';
    });

    btn.addEventListener('click', () => {
      setLang(currentLang === 'en' ? 'af' : 'en');
    });

    /* Insert BEFORE the first child so it's prominently on the left of topbar-right */
    container.insertBefore(btn, container.firstChild);
    updateToggleBtn();
  }

  function updateToggleBtn() {
    const btn = document.getElementById('lang-toggle');
    if (!btn) return;
    if (currentLang === 'en') {
      btn.innerHTML = `<span style="font-size:14px;">🇿🇦</span> Afrikaans`;
      btn.setAttribute('title', 'Switch to Afrikaans');
    } else {
      btn.innerHTML = `<span style="font-size:14px;">🇬🇧</span> English`;
      btn.setAttribute('title', 'Switch to English');
    }
  }

  /* ── INIT ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    injectToggleBtn();
    apply();
  });

  return { t, setLang, getLang, apply };

})();