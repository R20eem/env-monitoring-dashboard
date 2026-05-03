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
    'nav.alerts':         { en: 'Alerts',          af: 'Waarskuwings' },
    'nav.scanner':        { en: 'Plant Scanner',   af: 'Plant Skandeerder' },
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
    'blog.loading':       { en: 'Loading...',            af: 'Laai...' },
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
    'blog.no_posts':       { en: 'No posts yet.', af: 'Nog geen plasings nie.' },
    'blog.no_comments':   { en: 'No comments yet. Be the first!', af: 'Nog geen opmerkings nie. Wees die eerste!' },
    'blog.load_err':      { en: 'Could not load comments.', af: 'Kon nie opmerkings laai nie.' },
    'blog.farmer':         { en: 'farmer',                af: 'boer' },
    'blog.researcher':    { en: 'researcher',            af: 'navorser' },
    'blog.by':             { en: 'By',                    af: 'Deur' },
    'blog.read_more':      { en: 'Read more →',           af: 'Lees meer →' },
    'blog.signin_comment': { en: 'Sign in to leave a comment.', af: 'Teken in om \'n opmerking te los.' },
    'blog.signin_post':    { en: 'Sign in to post',           af: 'Teken in om te plaas' },
    'blog.welcome':        { en: 'Welcome back!',              af: 'Welkom terug!' },
    'blog.fill_fields':    { en: 'Please fill in all fields.', af: 'Vul asseblief alle velde in.' },
    'blog.login_err':      { en: 'Login failed.',              af: 'Teken in het misluk.' },
    'blog.title_req':      { en: 'Title is required.',         af: 'Titel is nodig.' },
    'blog.content_req':    { en: 'Content is required.',       af: 'Inhoud is nodig.' },
    'blog.signin_first':   { en: 'Please sign in first.',     af: 'Teken asseblief eers in.' },
    'blog.create_err':     { en: 'Could not create post.',     af: 'Kon nie plasings skep nie.' },
    'blog.server_err':     { en: 'Server error. Please try again.', af: 'Bediener fout. Probeer asseblief weer.' },
    'blog.comment_empty':  { en: 'Comment cannot be empty.',   af: 'Opmerking mag nie leeg wees nie.' },
    'blog.comment_err':    { en: 'Could not post comment.',    af: 'Kon nie opmerking plaas nie.' },
    'blog.server_err_short': { en: 'Server error.',            af: 'Bediener fout.' },
    'blog.posting': { en: 'Posting...', af: 'Plaas tans...' },
    'blog.server_unreachable': { en: 'Could not reach the server. Is the backend running?', af: 'Kon nie die bediener bereik nie. Loop die backend?' },

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

    /* ── VIEW TOGGLE ── */
    'view.simple':        { en: '🌱 Simple',   af: '🌱 Eenvoudig' },
    'view.detailed':      { en: '📊 Detailed', af: '📊 Gedetailleerd' },

    /* ── SIMPLE VIEW — weather strip ── */
    'sv.today_title':     { en: 'Today on your farm',    af: 'Vandag op jou plaas' },
    'sv.temperature':     { en: 'Temperature',           af: 'Temperatuur' },
    'sv.humidity':        { en: 'Humidity',              af: 'Humiditeit' },
    'sv.rain_today':      { en: 'Rain today',            af: 'Reën vandag' },
    'sv.alerts_today':    { en: 'Alerts today',          af: 'Waarskuwings vandag' },

    /* ── SIMPLE VIEW — site cards ── */
    'sv.site_maize':      { en: 'Maize Field',           af: 'Mielie Land' },
    'sv.site_orchard':    { en: 'Orchard',               af: 'Boord' },
    'sv.site_brassica':   { en: 'Brassica Field',        af: 'Brassika Land' },

    'sv.status_good':     { en: '✅ Looking Good',       af: '✅ Lyk Goed' },
    'sv.status_warning':  { en: 'Needs Attention',       af: 'Benodig Aandag' },
    'sv.status_danger':   { en: '⚠️ Act Now',            af: '⚠️ Tree Nou Op' },

    'sv.msg_maize':       { en: 'Your maize field has high humidity right now. This can cause disease to spread. Check your plants soon.',
                            af: 'Jou mielie land het tans hoë humiditeit. Dit kan siektes laat versprei. Gaan kyk jou plante binnekort.' },
    'sv.msg_orchard':     { en: 'Your orchard has the most pest activity this week. Pest numbers are climbing and conditions are warm — pests love this weather.',
                            af: 'Jou boord het hierdie week die meeste plaagaktiwiteit. Plaagtalle styg en toestande is warm — plae is lief vir hierdie weer.' },
    'sv.msg_brassica':    { en: 'Your brassica field is your healthiest field right now. Pest numbers are low and conditions are stable.',
                            af: 'Jou brassika land is tans jou gesondste land. Plaagtalle is laag en toestande is stabiel.' },

    'sv.action_label':    { en: 'What to do:',           af: 'Wat om te doen:' },
    'sv.action_maize':    { en: '👀 Walk the field and look for yellow or spotted leaves.',
                            af: '👀 Loop die land en soek geel of gevlekte blare.' },
    'sv.action_orchard':  { en: '🪤 Check your pest traps today. Consider spraying if traps are full.',
                            af: '🪤 Gaan kyk jou plaagvalle vandag. Oorweeg bespuiting as valle vol is.' },
    'sv.action_brassica': { en: '💧 Good time to apply preventative treatment before weather changes.',
                            af: '💧 Goeie tyd om voorkomende behandeling toe te pas voor die weer verander.' },

    'sv.pest_activity':   { en: 'Pest activity:',        af: 'Plaagaktiwiteit:' },
    'sv.tap_details':     { en: 'Tap to see full details →', af: 'Tik om volle besonderhede te sien →' },

    /* ── SIMPLE VIEW — week strip ── */
    'sv.week_title':      { en: '📅 This week at a glance', af: '📅 Hierdie week op \'n oogopslag' },
    'sv.week_legend':     { en: '🟢 Good day   🟡 Watch out   🔴 Take action',
                            af: '🟢 Goeie dag   🟡 Pas op   🔴 Tree op' },
    'sv.day_mon':         { en: 'Mon', af: 'Maa' },
    'sv.day_tue':         { en: 'Tue', af: 'Din' },
    'sv.day_wed':         { en: 'Wed', af: 'Woe' },
    'sv.day_thu':         { en: 'Thu', af: 'Don' },
    'sv.day_fri':         { en: 'Fri', af: 'Vry' },
    'sv.day_sat':         { en: 'Sat', af: 'Sat' },
    'sv.day_sun':         { en: 'Sun', af: 'Son' },
    'sv.note_alerts_high':  { en: 'Alerts high',      af: 'Waarskuwings hoog' },
    'sv.note_better':       { en: 'Getting better',   af: 'Word beter' },
    'sv.note_best':         { en: 'Best day',          af: 'Beste dag' },
    'sv.note_humidity':     { en: 'Humidity up',       af: 'Humiditeit op' },
    'sv.note_nice':         { en: 'Nice day',           af: 'Lekker dag' },
    'sv.note_pests':        { en: 'Pests up',           af: 'Plae op' },
    'sv.note_today':        { en: 'Today',              af: 'Vandag' },

    /* ── DETAILED VIEW — tile trend labels ── */
    'dv.trend_rising':    { en: '↑ Risk rising',   af: '↑ Risiko styg' },
    'dv.trend_spiking':   { en: '↑ Pest spiking',  af: '↑ Plae styg' },
    'dv.trend_stable':    { en: '→ Stable',         af: '→ Stabiel' },
    'dv.score_label':     { en: '/ 100 health score', af: '/ 100 gesondheidstelling' },
    'dv.7day_risk':       { en: '7-day risk',       af: '7-dag risiko' },
    'dv.badge_good':      { en: 'Good ✓',           af: 'Goed ✓' },
    'dv.badge_watch':     { en: 'Watch',             af: 'Dophou' },
    'dv.badge_alert':     { en: 'Alert !',           af: 'Waarskuwing !' },

    /* ── DETAILED VIEW — tile micro-stats ── */
    'dv.temp':            { en: 'Temp',      af: 'Temp' },
    'dv.humidity':        { en: 'Humidity',  af: 'Humiditeit' },
    'dv.pests':           { en: 'Pests',     af: 'Plae' },
    'dv.rain':            { en: 'Rain',      af: 'Reën' },

    /* ── DETAILED VIEW — chart ── */
    'dv.chart_section':   { en: 'Risk level — last 7 days',  af: 'Risiko vlak — laaste 7 dae' },
    'dv.legend_risk':     { en: 'Risk',                       af: 'Risiko' },
    'dv.legend_low':      { en: 'low',                        af: 'laag' },
    'dv.legend_mid':      { en: 'mid',                        af: 'mid' },
    'dv.legend_high':     { en: 'high',                       af: 'hoog' },
    'dv.legend_temp':     { en: 'Temperature (right axis)',   af: 'Temperatuur (regteras)' },

    /* ── DETAILED VIEW — insight panel ── */
    'dv.insight_what':    { en: 'Site Analysis',              af: 'Perseel Analise' },
    'dv.gauge_label':     { en: '/100',                       af: '/100' },
    'dv.temp_label':      { en: 'Temperature',                af: 'Temperatuur' },
    'dv.humidity_label':  { en: 'Humidity',                   af: 'Humiditeit' },
    'dv.pest_label':      { en: 'Pest avg',                   af: 'Plaag gem.' },
    'dv.alerts_label':    { en: 'Alerts',                     af: 'Waarskuwings' },
    'dv.rec_title':       { en: 'Recommended Actions',        af: 'Aanbevole Aksies' },

    /* ── DETAILED VIEW — recommendations ── */
    'dv.rec_maize_1':     { en: 'Walk the field — look for yellow or spotted leaves',
                            af: 'Loop die land — soek geel of gevlekte blare' },
    'dv.rec_maize_2':     { en: 'Improve air circulation to reduce leaf wetness',
                            af: 'Verbeter lugsirkulasie om blaarvogtigheid te verminder' },
    'dv.rec_maize_3':     { en: 'Consider fungicide if wetness continues 48hrs more',
                            af: 'Oorweeg swamdoder as vogtigheid nog 48 uur voortduur' },
    'dv.rec_orchard_1':   { en: 'Check all pest traps — replace if full',
                            af: 'Gaan alle plaagvalle na — vervang as vol' },
    'dv.rec_orchard_2':   { en: 'Check irrigation in south-east corner (low moisture)',
                            af: 'Gaan besproeiing in suidoos-hoek na (lae vog)' },
    'dv.rec_orchard_3':   { en: 'Consider targeted spray before next warm day',
                            af: 'Oorweeg geteikende bespuiting voor volgende warm dag' },
    'dv.rec_brassica_1':  { en: 'Conditions are stable — good window for treatment',
                            af: 'Toestande is stabiel — goeie venster vir behandeling' },
    'dv.rec_brassica_2':  { en: 'Apply preventative spray before next humidity spike',
                            af: 'Pas voorkomende bespuiting toe voor volgende humiditeits piek' },
    'dv.rec_brassica_3':  { en: 'Monitor weekly — lowest risk of three sites',
                            af: 'Monitor weekliks — laagste risiko van drie persele' },

    /* ── ALERTS PAGE ── */
    'alerts.title':         { en: 'Alerts Overview', af: 'Waarskuwings Oorsig' },
    'alerts.hero_p':        { en: 'Monitor important warnings and protect your crops in real time', af: 'Monitor belangrike waarskuwings en beskerm jou gewasse in real time' },
    'alerts.total':         { en: 'Total alerts', af: 'Totale waarskuwings' },
    'alerts.critical':      { en: 'Critical', af: 'Krities' },
    'alerts.warnings':      { en: 'Warnings', af: 'Waarskuwings' },
    'alerts.latest':        { en: 'Latest Alert', af: 'Nuutste Waarskuwing' },
    'alerts.all':           { en: 'All Alerts', af: 'Alle Waarskuwings' },
    'alerts.filter_all':    { en: 'All', af: 'Alle' },
    'alerts.filter_critical': { en: 'Critical', af: 'Krities' },
    'alerts.filter_warning': { en: 'Warning', af: 'Waarskuwing' },
    'alerts.loading':       { en: 'Loading latest alert...', af: 'Laai nuutste waarskuwing...' },
    'alerts.topbar_sub':    { en: 'Simple warnings to protect your crops', af: 'Eenvoudige waarskuwings om jou gewasse te beskerm' },
    'alerts.loading_alerts':{ en: 'Loading alerts...', af: 'Laai waarskuwings...' },
    'alerts.empty_healthy': { en: '✅ No alerts — your crops look healthy!', af: '✅ Geen waarskuwings — jou gewasse lyk gesond!' },
    'alerts.empty_other':   { en: 'No other alerts to show.', af: 'Geen ander waarskuwings om te wys nie.' },
    'alerts.failed':        { en: '❌ Failed to load alerts. Please try again.', af: '❌ Kon nie waarskuwings laai nie. Probeer asseblief weer.' },
    'alerts.normal':        { en: 'Normal', af: 'Normaal' },
    'alerts.field': { en: 'Field', af: 'Veld' },
    'alerts.unknown_crop': { en: 'Unknown crop', af: 'Onbekende gewas' },
    'alerts.confidence': { en: 'confidence', af: 'sekerheid' },
    'alerts.humidity': { en: 'humidity', af: 'humiditeit' },
    'alerts.healthy_plant': { en: 'Healthy Plant', af: 'Gesonde Plant' },
    'alerts.disease_detected': { en: 'Disease Detected', af: 'Siekte Bespeur' },
    'alerts.scan_result': { en: 'Scan Result', af: 'Skandeer Uitslag' },
    'alerts.disease_risk': { en: 'Disease Risk', af: 'Siekterisiko' },
    'alerts.high_risk': { en: 'High Risk Detected', af: 'Hoë Risiko Bespeur' },
    'alerts.warning_condition': { en: 'Warning Condition', af: 'Waarskuwingstoestand' },
    'alerts.normal_condition': { en: 'Normal Condition', af: 'Normale Toestand' },
    'alerts.advice_disease_critical': { en: 'Your plant may be diseased. Please inspect it immediately.', af: 'Jou plant mag siek wees. Ondersoek dit asseblief onmiddellik.' },
    'alerts.advice_disease_warning': { en: 'Monitor your plant closely over the next few days.', af: 'Monitor jou plant noukeurig oor die volgende paar dae.' },
    'alerts.advice_disease_healthy': { en: 'Your plant looks healthy. Keep up good care.', af: 'Jou plant lyk gesond. Hou aan met goeie sorg.' },
    'alerts.advice_unhealthy': { en: 'Your plant may be unhealthy. Please check it and take action.', af: 'Jou plant mag ongesond wees. Gaan dit na en neem aksie.' },
    'alerts.advice_critical': { en: 'Immediate attention required.', af: 'Onmiddellike aandag word vereis.' },
    'alerts.advice_warning': { en: 'Monitor conditions closely.', af: 'Monitor toestande noukeurig.' },
    'alerts.advice_normal': { en: 'Everything looks fine.', af: 'Alles lyk reg.' },
    'scan.hero_h':        { en: 'Scan a Plant',               af: 'Skandeer \'n Plant' },
    'scan.hero_p':        { en: 'Upload a plant image, choose crop type, and get a health prediction',
                            af: 'Laai \'n plantfoto op, kies gewastipe, en kry \'n gesondheidvoorspelling' },
    'scan.upload_title':  { en: 'Upload Plant Image',         af: 'Laai Plantfoto Op' },
    'scan.select_crop':   { en: 'Select crop',                af: 'Kies gewas' },
    'scan.site_id_ph':    { en: 'Site ID',                    af: 'Perseel ID' },
    'scan.choose_image':  { en: 'Choose Image',               af: 'Kies Foto' },
    'scan.btn':           { en: 'Scan Plant',                 af: 'Skandeer Plant' },
    'scan.result_title':  { en: 'Scan Result',                af: 'Skandeer Uitslag' },
    'scan.prediction':    { en: 'Prediction:',                af: 'Voorspelling:' },
    'scan.confidence':    { en: 'Confidence:',                af: 'Sekerheid:' },
    'scan.crop':          { en: 'Crop:',                      af: 'Gewas:' },
    'scan.site':          { en: 'Site:',                      af: 'Perseel:' },
    'scan.reason':        { en: 'Reason',                     af: 'Rede' },
    'scan.how_title':     { en: 'How it works',               af: 'Hoe dit werk' },
    'scan.how_1':         { en: 'Select the crop type',       af: 'Kies die gewastipe' },
    'scan.how_2':         { en: 'Upload a clear plant or leaf image', af: 'Laai \'n duidelike plant- of bladfoto op' },
    'scan.how_3':         { en: 'The system checks the image using ML', af: 'Die stelsel kontroleer die foto met ML' },
    'scan.how_4':         { en: 'The result is saved and shown below', af: 'Die uitslag word gestoor en hieronder gewys' },
    'scan.recent_title':  { en: 'My Recent Scans',            af: 'My Onlangse Skanderings' },
    'scan.no_scans':      { en: 'No scans yet',               af: 'Nog geen skanderings nie' },
    'scan.login_history': { en: 'Log in to see your scan history', af: 'Teken in om jou skandeergeskiedenis te sien' },
    'scan.load_err':      { en: 'Could not load your scans',       af: 'Kon nie jou skanderings laai nie' },
    'scan.scanning':      { en: 'Scanning...', af: 'Skandeer tans...' },
    'scan.err_fields':    { en: 'Please complete all fields and choose an image.', af: 'Voltooi asseblief alle velde en kies \'n foto.' },
    'scan.err_login':     { en: 'You need to log in first before scanning.', af: 'Jy moet eers inteken voor jy kan skandeer.' },
    'scan.err_failed':    { en: 'Scan failed.', af: 'Skandering het misluk.' },
    'scan.err_conn':      { en: 'Could not connect to the scanner service.', af: 'Kon nie met die skandeerdiens koppel nie.' },
    'scan.image_alt':     { en: 'Scan image', af: 'Skandeerfoto' },

    /* ── SCAN INSIGHTS (farmer dashboard) ── */
    'f.scan_title':       { en: 'your plant scans',           af: 'jou plant skanderings' },
    'f.scan_sub':         { en: 'live results from your recent plant scans', af: 'regstreekse uitslae van jou onlangse plant skanderings' },
    'f.scan_total':       { en: 'total scans',                af: 'totale skanderings' },
    'f.scan_healthy':     { en: 'healthy',                    af: 'gesond' },
    'f.scan_disease':     { en: 'disease',                    af: 'siekte' },
    'f.scan_pest':        { en: 'pest',                       af: 'plaag' },
    'f.scan_latest':      { en: 'latest',                     af: 'nuutste' },
    'f.scan_section':     { en: 'my scan insights',           af: 'my skandeer insigte' },

    /* ── MOBILE NAV ── */
    'mob.dashboard':      { en: 'Dashboard',  af: 'Paneelbord' },
    'mob.alerts':         { en: 'Alerts',     af: 'Waarskuwings' },
    'mob.scanner':        { en: 'Scanner',    af: 'Skandeerder' },
    'mob.blog':           { en: 'Blog',       af: 'Blog' },
    'mob.about':          { en: 'About',      af: 'Oor' },
    'mob.profile':        { en: 'Profile',    af: 'Profiel' },
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
    Injects a pill button into the page topbar.
    Works for farmer, researcher, and shared layouts.
    Prefer an explicit placeholder if available.
  */
  function injectToggleBtn() {
    const selectors = [
      '#lang-toggle-target',
      '.f-topbar-right',
      '.r-topbar-right',
      '.sh-topbar-right',
      '.f-topbar',
      '.r-topbar',
      '.sh-topbar',
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
      'gap:6px',
      'padding:6px 13px',
      'border-radius:20px',
      'cursor:pointer',
      'font-size:12px',
      'font-weight:700',
      'letter-spacing:0.04em',
      'transition:background 0.18s, color 0.18s',
      'white-space:nowrap',
      'font-family:inherit',
    ].join(';');

    /* Detect green topbar by checking if the PAGE has a farmer/green topbar,
       not by traversing ancestors of the container (which fails for target divs) */
    const isGreenTopbar = !!document.querySelector('.f-topbar');
    const isWhiteTopbar = !!document.querySelector('.sh-topbar') || !!document.querySelector('.r-topbar');

    btn.style.color      = isGreenTopbar ? '#fff'                        : 'var(--sh-green-800,#27500a)';
    btn.style.background = isGreenTopbar ? 'rgba(255,255,255,0.18)'      : 'var(--sh-green-100,#eaf3de)';
    btn.style.border     = isGreenTopbar ? '1.5px solid rgba(255,255,255,0.4)' : '1.5px solid var(--sh-green-400,#97c459)';

    btn.addEventListener('mouseenter', () => {
      btn.style.background = isGreenTopbar ? 'rgba(255,255,255,0.30)' : 'var(--sh-green-200,#c0dd97)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = isGreenTopbar ? 'rgba(255,255,255,0.18)' : 'var(--sh-green-100,#eaf3de)';
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
  function init() {
    injectToggleBtn();
    apply();
  }

  /* Call init immediately if DOM is ready, otherwise wait for DOMContentLoaded */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { t, setLang, getLang, apply };

})();