/**
 * File: blog.js
 *
 * Purpose:
 * Handles community blog functionality including post creation,
 * comments, likes, and filtering by user role.
 *
 * Responsibilities:
 * - Fetch and display blog posts from API
 * - Handle post creation and editing
 * - Manage comments and likes functionality
 * - Filter posts by farmer/researcher role
 * - Handle modal interactions for post details
 *
 * Layer:
 * Frontend
 *
 * Related:
 * - blog.html
 * - blog.css
 * - l18n.js
 */

const API_BASE = 'http://127.0.0.1:8000';
const TOKEN_KEY = 'jwt_token';

// Get I18n for translations (if available, otherwise fallback)
// const I18n = window.I18n || { t: (k) => k, getLang: () => 'en' };

// ── STAY LOGGED IN — check all possible token keys
function getToken() {
  return localStorage.getItem('jwt_token') || localStorage.getItem('token');
}
function saveToken(t) {
  localStorage.setItem('jwt_token', t);
  localStorage.setItem('token', t);
}
function clearToken() {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
}

// ── BLOG ACCESS GUARD — removed to allow public access
// Users can view blog without signing in
// if (!getToken()) {
//   window.location.href = 'login.html';
// }

// ── STATE ──
let currentFilter = 'all';
let allPosts      = [];
let openPostId    = null;

// ── LANGUAGE HELPERS ──
function getCurrentLang() {
  return typeof I18n !== 'undefined' ? I18n.getLang() : 'en';
}

function getLocalizedContent(item, field) {
  const lang = getCurrentLang();
  const langField = `${field}_${lang}`;
  return item[langField] || item[field] || '';
}

// -- SAMPLE FALLBACK POSTS-- only used for demo, if there is real post from backend api than these will be used
const SAMPLE_COMMENTS = {
  1001: [
    {
      author_name: "Dr. Sarah Chen",
      author_role: "researcher",
      content_en: "The early clustering you observed is consistent with rising pest activity after humid mornings. It would be good to compare this with trap counts over the next few days.",
      content_af: "Die vroeë groepering wat jy waargeneem het, stem ooreen met stygende plaagaktiwiteit na vogtige oggende. Dit sou goed wees om dit te vergelyk met lokvaltellings oor die volgende paar dae.",
      created_at: "2026-03-03T09:10:00"
    },
    {
      author_name: "Sipho Dlamini",
      author_role: "farmer",
      content_en: "We saw something similar on our side as well, especially near the lower leaves.",
      content_af: "Ons het iets soortgelyks aan ons kant ook gesien, veral naby die onderste blare.",
      created_at: "2026-03-03T12:40:00"
    },
    {
      author_name: "Dr. Michael Jacobs",
      author_role: "researcher",
      content_en: "Check whether leaf wetness stayed high overnight. That usually strengthens the pattern.",
      content_af: "Kontroleer of blaarvogtigheid hoog gebly het oornag. Dit versterk gewoonlik die patroon.",
      created_at: "2026-03-04T08:25:00"
    }
  ],

  1002: [
    {
      author_name: "Thabo Mokoena",
      author_role: "farmer",
      content_en: "This matches what we are seeing in the field. The warnings usually come after very damp mornings.",
      content_af: "Dit stem ooreen met wat ons in die veld sien. Die waarskuwings kom gewoonlik na baie nat oggende.",
      created_at: "2026-03-29T07:50:00"
    },
    {
      author_name: "Dr. Michael Jacobs",
      author_role: "researcher",
      content_en: "Yes, the dashboard trend suggests the disease alerts are not random. Humidity and leaf wetness are moving together.",
      content_af: "Ja, die paneelbordtendens dui daarop dat die siektewaarskuwings nie ewekansig is nie. Humiditeit en blaarvogtigheid beweeg saam.",
      created_at: "2026-03-29T10:15:00"
    },
    {
      author_name: "Naledi Khumalo",
      author_role: "farmer",
      content_en: "Would you recommend earlier spraying if these conditions continue for several days?",
      content_af: "Sou jy vroeër spuiting aanbeveel as hierdie toestande vir verskeie dae voortduur?",
      created_at: "2026-03-29T13:30:00"
    },
    {
      author_name: "Dr. Sarah Chen",
      author_role: "researcher",
      content_en: "That depends on crop stage, but sustained wetness definitely raises risk. Monitoring should be intensified first.",
      content_af: "Dit hang af van gewasstadium, maar volgehoue nattigheid verhoog beslis risiko. Monitering moet eerste geïntensiveer word.",
      created_at: "2026-03-30T15:05:00"
    },
    {
      author_name: "Dr. Amina Patel",
      author_role: "researcher",
      content_en: "This is exactly why combining environmental variables in the dashboard is useful for early warning.",
      content_af: "Dit is presies waarom die kombinasie van omgewingsveranderlikes in die paneelbord nuttig is vir vroeë waarskuwing.",
      created_at: "2026-03-30T09:20:00"
    }
  ],

  1003: [
    {
      author_name: "Dr. Kabelo Naidoo",
      author_role: "researcher",
      content_en: "A 20% reduction is a strong result. It would be useful to compare it with the previous moisture alert frequency.",
      content_af: "'n 20% vermindering is 'n sterk resultaat. Dit sou nuttig wees om dit te vergelyk met die vorige vogwaarskuwingsfrekwensie.",
      created_at: "2026-03-13T08:10:00"
    },
    {
      author_name: "Lerato Nkosi",
      author_role: "farmer",
      content_en: "We are considering the same switch. Did it change pest activity at all?",
      content_af: "Ons oorweeg dieselfde verandering. Het dit plaagaktiwiteit hoegenaamd verander?",
      created_at: "2026-03-13T11:45:00"
    },
    {
      author_name: "Sipho Dlamini",
      author_role: "farmer",
      content_en: "So far it also seems to reduce water waste without stressing the plants.",
      content_af: "Tot dusver lyk dit ook asof dit watervermorsing verminder sonder om die plante te stres.",
      created_at: "2026-03-13T16:00:00"
    },
    {
      author_name: "Dr. Sarah Chen",
      author_role: "researcher",
      content_en: "This would make a useful comparison case for the dashboard if both sites stay monitored.",
      content_af: "Dit sou 'n nuttige vergelykingsgeval vir die paneelbord maak as beide terreine gemonitor bly.",
      created_at: "2026-03-14T09:35:00"
    }
  ],

  1004: [
    {
      author_name: "Dr. Amina Patel",
      author_role: "researcher",
      content_en: "This is a good point. Regional weather alone often misses the small field-level changes that actually trigger alerts.",
      content_af: "Dit is 'n goeie punt. Streeksweer alleen mis dikwels die klein veldvlakveranderinge wat werklik waarskuwings aktiveer.",
      created_at: "2026-03-24T11:00:00"
    },
    {
      author_name: "Thabo Mokoena",
      author_role: "farmer",
      content_en: "Yes, it helps a lot to have local data when conditions change quickly.",
      content_af: "Ja, dit help baie om plaaslike data te hê wanneer toestande vinnig verander.",
      created_at: "2026-03-29T13:10:00"
    }
  ],

  1005: [
    {
      author_name: "Dr. Michael Jacobs",
      author_role: "researcher",
      content_en: "That is a very good example of using the warning level as an early intervention point before reaching critical status.",
      content_af: "Dit is 'n baie goeie voorbeeld van die gebruik van die waarskuwingsvlak as 'n vroeë intervensiepunt voordat kritiese status bereik word.",
      created_at: "2026-03-26T09:15:00"
    }
  ],

  1006: [
    {
      author_name: "Dr. Sarah Chen",
      author_role: "researcher",
      content_en: "High humidity in the early morning is expected, but sustained levels above 90% can increase fungal risk.",
      content_af: "Hoë humiditeit in die vroeë oggend word verwag, maar volgehoue vlakke bo 90% kan swamrisiko verhoog.",
      created_at: "2026-03-27T09:00:00"
    },
    {
      author_name: "Dr. Amina Patel",
      author_role: "researcher",
      content_en: "I would monitor leaf wetness together with humidity. If both remain high, the risk becomes more significant.",
      content_af: "Ek sou blaarvogtigheid saam met humiditeit monitor. As beide hoog bly, word die risiko meer betekenisvol.",
      created_at: "2026-03-27T11:20:00"
    }
  ],

  1007: [
    {
      author_name: "Dr. Michael Jacobs",
      author_role: "researcher",
      content_en: "This could be nocturnal pests like cutworms. Check near the soil early in the morning.",
      content_af: "Dit kan nagtelike plae soos snywurms wees. Kontroleer naby die grond vroeg in die oggend.",
      created_at: "2026-03-28T08:10:00"
    },
    {
      author_name: "Dr. Kabelo Naidoo",
      author_role: "researcher",
      content_en: "If the damage appears overnight, insect feeding is a stronger possibility than heat stress.",
      content_af: "As die beskadiging oornag verskyn, is insekvoeding 'n sterker moontlikheid as hitte-stres.",
      created_at: "2026-03-28T10:05:00"
    },
    {
      author_name: "Lerato Nkosi",
      author_role: "farmer",
      content_en: "We had similar damage last season and it turned out to be cutworms near the base.",
      content_af: "Ons het soortgelyke beskadiging verlede seisoen gehad en dit het uitgekom dat dit snywurms naby die basis was.",
      created_at: "2026-03-28T14:25:00"
    }
  ],

  1008: [
    {
      author_name: "Naledi Khumalo",
      author_role: "farmer",
      content_en: "This is useful because we also noticed warnings after wetter nights, especially in lower parts of the field.",
      content_af: "Dit is nuttig omdat ons ook waarskuwings opgemerk het na natter nagte, veral in laer dele van die veld.",
      created_at: "2026-03-18T14:00:00"
    },
    {
      author_name: "Dr. Sarah Chen",
      author_role: "researcher",
      content_en: "Yes, and the maize site appears to show this more clearly than the others.",
      content_af: "Ja, en die mielie-terrein blyk dit duideliker te toon as die ander.",
      created_at: "2026-03-18T15:25:00"
    },
    {
      author_name: "Dr. Amina Patel",
      author_role: "researcher",
      content_en: "It may be worth testing whether the timing of irrigation is amplifying that effect.",
      content_af: "Dit mag die moeite werd wees om te toets of die tydsberekening van besproeiing daardie effek versterk.",
      created_at: "2026-03-19T09:40:00"
    },
    {
      author_name: "Sipho Dlamini",
      author_role: "farmer",
      content_en: "That would be interesting because we irrigate quite late in the afternoon on one section.",
      content_af: "Dit sou interessant wees omdat ons redelik laat in die middag op een afdeling besproei.",
      created_at: "2026-03-19T12:10:00"
    }
  ],

  1009: [
    {
      author_name: "Dr. Michael Jacobs",
      author_role: "researcher",
      content_en: "This is a good example of how the dashboard can support forecasting rather than only reporting.",
      content_af: "Dit is 'n goeie voorbeeld van hoe die paneelbord voorspelling kan ondersteun eerder as net verslagdoening.",
      created_at: "2026-03-21T15:15:00"
    },
    {
      author_name: "Musa Ndlovu",
      author_role: "farmer",
      content_en: "We often notice more trap activity after the hottest days too.",
      content_af: "Ons merk dikwels meer valaktiwiteit op na die warmste dae ook.",
      created_at: "2026-03-21T17:00:00"
    },
    {
      author_name: "Dr. Sarah Chen",
      author_role: "researcher",
      content_en: "It would be useful to compare this with humidity drops during the same periods.",
      content_af: "Dit sou nuttig wees om dit te vergelyk met humiditeitsdruppels gedurende dieselfde periodes.",
      created_at: "2026-03-22T08:45:00"
    }
  ],

  1010: [
    {
      author_name: "Thabo Mokoena",
      author_role: "farmer",
      content_en: "The maize site has definitely been the most concerning one from a field perspective this week.",
      content_af: "Die mielie-terrein was beslis die mees kommerwekkende een vanuit 'n veldperspektief vanjaar.",
      created_at: "2026-03-29T17:10:00"
    },
    {
      author_name: "Dr. Sarah Chen",
      author_role: "researcher",
      content_en: "The alert concentration there suggests it should be prioritized for inspection and follow-up sampling.",
      content_af: "Die waarskuwingskonsentrasie daar stel voor dat dit geprioritiseer moet word vir inspeksie en opvolgmonstering.",
      created_at: "2026-03-24T18:00:00"
    },
    {
      author_name: "Dr. Amina Patel",
      author_role: "researcher",
      content_en: "The combination of rainfall, humidity, and leaf wetness makes that conclusion quite reasonable.",
      content_af: "Die kombinasie van reënval, humiditeit en blaarvogtigheid maak daardie gevolgtrekking redelik.",
      created_at: "2026-03-25T08:20:00"
    },
    {
      author_name: "Naledi Khumalo",
      author_role: "farmer",
      content_en: "Would you suggest adjusting irrigation timing there first, or focusing on pest checks?",
      content_af: "Sou jy voorstel om besproeiingstydsberekening daar eerste aan te pas, of om op plaagkontroles te fokus?",
      created_at: "2026-03-25T10:50:00"
    },
    {
      author_name: "Dr. Kabelo Naidoo",
      author_role: "researcher",
      content_en: "I would start with field inspection and trap confirmation, then review irrigation timing immediately after.",
      content_af: "Ek sou begin met veldinspeksie en valbevestiging, dan besproeiingstydsberekening onmiddellik daarna hersien.",
      created_at: "2026-03-25T12:15:00"
    },
    {
      author_name: "Dr. Michael Jacobs",
      author_role: "researcher",
      content_en: "This is a good candidate site for a case-study summary in the final report.",
      content_af: "Dit is 'n goeie kandidaatterrein vir 'n gevallestudie-opsomming in die finale verslag.",
      created_at: "2026-03-25T14:30:00"
    }
  ]
};

// -- SAMPLE FALLBACK COMMENTS
const SAMPLE_POSTS = [
  {
    id: 1001,
    title_en: "Early signs of aphid activity in maize plots",
    title_af: "Vroeë tekens van luisaktiwiteit in mieliepersele",
    content_en: "We noticed a sharp increase in pest activity in the eastern maize plots after two humid mornings. Trap counts were still moderate, but leaf inspection showed early aphid clustering near the lower canopy. Farmers may want to inspect fields earlier in the day before the temperature rises.",
    content_af: "Ons het 'n skerp toename in plaagaktiwiteit in die oostelike mieliepersele opgemerk na twee vogtige oggende. Lokvaltellings was steeds matig, maar blaarinspeksie het vroeë luisgroepering naby die onderste blaredak getoon. Boere wil dalk velde vroeër in die dag inspekteer voordat die temperatuur styg.",
    author_id: 1,
    author_role: "farmer",
    author_name: "Thabo Mokoena",
    likes_count: 12,
    comments_count: 3,
    created_at: "2026-03-02T08:30:00"
  },
  {
    id: 1002,
    title_en: "Humidity and leaf wetness are strongly aligning with disease alerts",
    title_af: "Vogtigheid en blaarvogtigheid stem sterk ooreen met siektewaarskuwings",
    content_en: "After reviewing recent sensor logs, we found that high humidity combined with persistent leaf wetness closely matched disease-risk warnings. This suggests the system is performing well as an early indicator for fungal risk, especially during cooler overnight periods.",
    content_af: "Na hersiening van onlangse sensorlogs, het ons gevind dat hoë humiditeit gekombineer met aanhoudende blaarvogtigheid naby siekte-risiko waarskuwings ooreengestem het. Dit dui daarop dat die stelsel goed presteer as 'n vroeë aanwyser vir swamrisiko, veral tydens koeler oornagperiodes.",
    author_id: 2,
    author_role: "researcher",
    author_name: "Dr. Sarah Chen",
    likes_count: 21,
    comments_count: 5,
    created_at: "2026-03-29T06:10:00"
  },
  {
    id: 1003,
    title_en: "Drip irrigation reduced water use on our test field",
    title_af: "Drupbesproeiing het watergebruik op ons toetsveld verminder",
    content_en: "We switched one section of the farm to drip irrigation after repeated moisture-related alerts. Over two weeks, the soil stayed more stable and overall water use dropped noticeably. We are planning to extend the setup to a second site next month.",
    content_af: "Ons het een deel van die plaas na drupbesproeiing oorgeskakel na herhaalde vogverwante waarskuwings. Oor twee weke het die grond meer stabiel gebly en algehele watergebruik merkbaar gedaal. Ons beplan om die opstelling volgende maand na 'n tweede terrein uit te brei.",
    author_id: 3,
    author_role: "farmer",
    author_name: "Sipho Dlamini",
    likes_count: 17,
    comments_count: 4,
    created_at: "2026-03-12T10:45:00"
  },
  {
    id: 1004,
    title_en: "Comparison of local sensor readings with weather data",
    title_af: "Vergelyking van plaaslike sensorlesings met weerdata",
    content_en: "We compared local temperature and rainfall data with regional weather patterns. The local sensors show faster changes, which is important because it directly affects pest activity and disease risk. This helps farmers make decisions faster.",
    content_af: "Ons het plaaslike temperatuur- en reënvaldata vergelyk met streeksweerpatrone. Die plaaslike sensors wys vinniger veranderinge, wat belangrik is omdat dit plaagaktiwiteit en siekterisiko direk beïnvloed. Dit help boere om vinniger besluite te neem.",
    author_id: 4,
    author_role: "farmer",
    author_name: "Johan van der Merwe",
    likes_count: 9,
    comments_count: 2,
    created_at: "2026-03-29T09:20:00"
  },
  {
    id: 1005,
    title_en: "Brassica site recovered after warning spike",
    title_af: "Brasika-terrein herstel na waarskuwingsgolf",
    content_en: "The brassica site showed a warning spike earlier this week, mainly linked to humidity and leaf wetness. After improving airflow and adjusting irrigation timing, the latest readings look much healthier. This was a good example of using the dashboard to act before the issue became critical.",
    content_af: "Die brasika-terrein het 'n waarskuwingsgolf vroeër vanjaar getoon, hoofsaaklik gekoppel aan humiditeit en blaarvogtigheid. Na verbetering van lugvloei en aanpassing van besproeiingstydsberekening, lyk die nuutste lesings baie gesonder. Dit was 'n goeie voorbeeld van die gebruik van die paneelbord om op te tree voordat die probleem kritiek geword het.",
    author_id: 5,
    author_role: "farmer",
    author_name: "Naledi Khumalo",
    likes_count: 14,
    comments_count: 1,
    created_at: "2026-03-25T16:00:00"
  },
  {
    id: 1006,
    title_en: "Is this level of humidity normal for this season?",
    title_af: "Is hierdie vlak van humiditeit normaal vir hierdie seisoen?",
    content_en: "Over the past few mornings, humidity has been above 90% on my maize field. Is this something to worry about, or is it normal for March conditions?",
    content_af: "Oor die afgelope paar oggende was humiditeit bo 90% op my mielieveld. Is dit iets om oor bekommerd te wees, of is dit normaal vir Maart-toestande?",
    author_id: 6,
    author_role: "farmer",
    author_name: "Lerato Nkosi",
    likes_count: 5,
    comments_count: 2,
    created_at: "2026-03-27T07:15:00"
  },
  {
    id: 1007,
    title_en: "What pest could cause sudden leaf damage overnight?",
    title_af: "Watter plaag kan skielike blaarbeskadiging oornag veroorsaak?",
    content_en: "Yesterday evening the plants looked fine, but this morning I noticed several leaves with damage. Could this be insects or something else?",
    content_af: "Gisteraand het die plante goed gelyk, maar vanoggend het ek verskeie blare met beskadiging opgemerk. Kan dit insekte of iets anders wees?",
    author_id: 7,
    author_role: "farmer",
    author_name: "Musa Ndlovu",
    likes_count: 7,
    comments_count: 3,
    created_at: "2026-03-28T06:40:00"
  },
  {
    id: 1008,
    title_en: "Research note: warning spikes are clustering after wet leaf periods",
    title_af: "Navorsingsnota: waarskuwingsgolwe groeper na nat blaarperiodes",
    content_en: "A review of March dashboard data shows that warning events tend to appear after extended periods of high leaf wetness and elevated humidity. This pattern is especially visible in the maize and brassica sites, suggesting the alerts are responding to meaningful environmental changes rather than random fluctuations.",
    content_af: "''n Hersiening van Maart-paneelborddata toon dat waarskuwingsgebeurtenisse geneig is om te verskyn na verlengde periodes van hoë blaarvogtigheid en verhoogde humiditeit. Hierdie patroon is veral sigbaar in die mielie- en brasika-terreine, wat daarop dui dat die waarskuwings reageer op betekenisvolle omgewingsveranderinge eerder as ewekansige fluktuasies.",
    author_id: 8,
    author_role: "researcher",
    author_name: "Dr. Michael Jacobs",
    likes_count: 16,
    comments_count: 4,
    created_at: "2026-03-18T11:30:00"
  },
  {
    id: 1009,
    title_en: "Pest trap count increases matched warmer afternoon readings",
    title_af: "Toename in plaagvaltelling stem ooreen met warmer middaglesings",
    content_en: "When comparing daily sensor trends, we observed that higher afternoon temperatures were often followed by increased pest trap counts. This does not prove causation on its own, but it is a useful signal for forecasting periods of higher pest activity on the dashboard.",
    content_af: "Wanneer daaglikse sensorneigings vergelyk word, het ons waargeneem dat hoër middagtemperature dikwels gevolg word deur verhoogde plaagvaltellings. Dit bewys nie oorsaaklikheid op sigself nie, maar dit is 'n nuttige sein vir die voorspelling van periodes van hoër plaagaktiwiteit op die paneelbord.",
    author_id: 9,
    author_role: "researcher",
    author_name: "Dr. Amina Patel",
    likes_count: 13,
    comments_count: 3,
    created_at: "2026-03-21T13:05:00"
  },
  {
    id: 1010,
    title_en: "Field dashboard insight: maize site showed the highest alert concentration this week",
    title_af: "Veldpaneelbord-insig: mielie-terrein het die hoogste waarskuwingskonsentrasie vanjaar getoon",
    content_en: "Based on the latest dashboard review, the maize site recorded the highest concentration of warning and alert-triggered readings during the week. The combination of humidity, leaf wetness, and rainfall suggests this site should be prioritized for close field inspection.",
    content_af: "Gebaseer op die nuutste paneelbordhersiening, het die mielie-terrein die hoogste konsentrasie van waarskuwing- en waarskuwing-geaktiveerde lesings gedurende die week aangeteken. Die kombinasie van humiditeit, blaarvogtigheid en reënval dui daarop dat hierdie terrein geprioritiseer moet word vir noukeurige veldinspeksie.",
    author_id: 10,
    author_role: "researcher",
    author_name: "Dr. Kabelo Naidoo",
    likes_count: 18,
    comments_count: 6,
    created_at: "2026-03-24T15:20:00"
  }
];
function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { email: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

// ── AUTH UI ───
function updateAuthUI() {
  const token = getToken();
  const user  = token ? decodeToken(token) : null;

  const authForm      = document.getElementById('auth-form');
  const loggedInInfo  = document.getElementById('logged-in-info');
  const authCardTitle = document.getElementById('auth-card-title');
  const userBadge     = document.getElementById('user-badge');
  const createBox     = document.getElementById('create-post-box');

  if (user) {
    authForm.classList.add('hidden');
    loggedInInfo.classList.remove('hidden');
    createBox.classList.remove('hidden');
    authCardTitle.textContent = I18n.t('blog.welcome');
    const icon = user.role === 'farmer' ? '🌾' : '🔬';
    const roleLabel = user.role === 'farmer' ? I18n.t('blog.farmer') : I18n.t('blog.researcher');
    userBadge.textContent = `${icon} ${I18n.t('blog.signed_in')} ${roleLabel}`;
  } else {
    authForm.classList.remove('hidden');
    loggedInInfo.classList.add('hidden');
    createBox.classList.add('hidden');
    authCardTitle.textContent = I18n.t('blog.signin_post');
  }
}

document.getElementById('login-role').addEventListener('change', function () {
  const orgField = document.getElementById('login-orgcode');
  if (this.value === 'researcher') {
    orgField.classList.remove('hidden');
  } else {
    orgField.classList.add('hidden');
  }
});

// ── LOGIN ───
document.getElementById('login-btn').addEventListener('click', async () => {
  const role     = document.getElementById('login-role').value;
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const orgCode  = document.getElementById('login-orgcode').value.trim();
  const errEl    = document.getElementById('login-error');

  errEl.textContent = '';

  if (!email || !password) {
    errEl.textContent = I18n.t('blog.fill_fields');
    return;
  }

  try {
    const url  = role === 'farmer'
      ? `${API_BASE}/auth/farmers/login`
      : `${API_BASE}/auth/researchers/login`;

    const body = role === 'farmer'
      ? { email, password }
      : { email, password, org_code: orgCode };

    const res  = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.detail || I18n.t('blog.login_err');
      return;
    }

    saveToken(data.access_token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email);

    // Researchers go straight to their dashboard — farmers stay on the blog
    if (role === 'researcher') {
      window.location.href = 'researcher.html';
      return;
    }

    updateAuthUI();
    loadPosts();

  } catch (err) {
    errEl.textContent = I18n.t('blog.server_unreachable');
    console.error(err);
  }
});

// ── LOGOUT ────
document.getElementById('logout-btn').addEventListener('click', () => {
  clearToken();
  localStorage.removeItem('userRole');
  window.location.href = 'login.html';
});

// ── LOAD POSTS ────
async function loadPosts() {
  console.log('Blog: loadPosts called');
  const loadingEl = document.getElementById('feed-loading');
  const emptyEl   = document.getElementById('feed-empty');
  const listEl    = document.getElementById('posts-list');

  if (!loadingEl || !listEl) {
    console.error('Blog: loadPosts - Missing loading or list elements');
    return;
  }
  
  console.log('Blog: Showing loading spinner');
  loadingEl.classList.remove('hidden');
  emptyEl.classList.add('hidden');
  listEl.innerHTML = '';

  try {
    console.log('Blog: Fetching from API_BASE:', API_BASE);
    const res  = await fetch(`${API_BASE}/posts`);
    console.log('Blog: API response status:', res.status);
    const data = await res.json();
    console.log('Blog: API response data:', data);

    loadingEl.classList.add('hidden');

    if (Array.isArray(data) && data.length > 0) {
      // Merge translations from SAMPLE_POSTS for matching API posts
      allPosts = data.map(apiPost => {
        const samplePost = SAMPLE_POSTS.find(sp => sp.title_en === apiPost.title || sp.title_af === apiPost.title);
        if (samplePost) {
          return {
            ...apiPost,
            title_en: samplePost.title_en,
            title_af: samplePost.title_af,
            content_en: samplePost.content_en,
            content_af: samplePost.content_af
          };
        }
        return apiPost;
      });
      console.log('Blog: Using posts from API, count:', data.length);
    } else {
      allPosts = SAMPLE_POSTS;
      console.log('Blog: Using SAMPLE_POSTS fallback, count:', SAMPLE_POSTS.length);
    }

    renderPosts();

  } catch (err) {
    console.error('Blog: Error loading posts:', err);
    loadingEl.classList.add('hidden');
    allPosts = SAMPLE_POSTS;
    renderPosts();
    console.warn('Using sample blog posts because backend posts could not be loaded.', err);
  }
}

// ── RENDER POSTS ───
function renderPosts() {
  console.log('Blog: renderPosts called, allPosts length:', allPosts ? allPosts.length : 0);
  const listEl = document.getElementById('posts-list');
  const token  = getToken();
  const user   = token ? decodeToken(token) : null;

  if (!listEl) {
    console.error('Blog: renderPosts - posts-list element not found');
    return;
  }
  
  if (!allPosts || allPosts.length === 0) {
    console.log('Blog: No posts to render');
    listEl.innerHTML = `<p style="color:var(--text-mid);padding:20px 0;">${I18n.t('blog.no_posts')}</p>`;
    return;
  }

  let postsToRender = [...allPosts];

  // Sort by likes first, then newest
  postsToRender.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filtered = currentFilter === 'all'
    ? postsToRender
    : postsToRender.filter(p => p.author_role === currentFilter);

  console.log('Blog: Rendering', filtered.length, 'posts after filter');

  if (filtered.length === 0) {
    const filterLabel = currentFilter === 'all' ? I18n.t('blog.filter_all') : (currentFilter === 'farmer' ? I18n.t('blog.filter_farmer') : I18n.t('blog.filter_res'));
    listEl.innerHTML = `<p style="color:var(--text-mid);padding:20px 0;">${I18n.t('blog.no_posts')} (${filterLabel})</p>`;
    return;
  }

  listEl.innerHTML = '';

  filtered.forEach((post, i) => {
    const card = document.createElement('div');
    card.className = `post-card ${post.author_role}-post`;
    card.style.animationDelay = `${i * 0.06}s`;

    const badgeClass = post.author_role === 'farmer' ? 'badge-farmer' : 'badge-researcher';
    const badgeLabel = post.author_role === 'farmer' ? I18n.t('auth.farmer') : I18n.t('auth.researcher');
    const dateStr    = new Date(post.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    const likeDisabled = !user ? 'disabled' : '';

    card.innerHTML = `
      <div class="post-card-header">
        <h2 class="post-title-link">${escHtml(getLocalizedContent(post, 'title'))}</h2>
        <span class="role-badge ${badgeClass}">${badgeLabel}</span>
      </div>
      <div class="post-meta">
        ${I18n.t('blog.by')} <span class="author-link" data-role="${post.author_role}" data-id="${post.author_id}">
          ${escHtml(post.author_name)}
        </span> · ${dateStr}
      </div>
      <p class="post-preview">${escHtml(getLocalizedContent(post, 'content'))}</p>
      <div class="post-card-footer">
        <button class="action-btn like-btn" data-id="${post.id}" ${likeDisabled}>
          👍 <span class="like-count">${post.likes_count}</span>
        </button>
        <button class="action-btn comment-btn" data-id="${post.id}">
          💬 ${post.comments_count}
        </button>
        <button class="read-more-btn" data-id="${post.id}">${I18n.t('blog.read_more')}</button>
      </div>
    `;

    card.querySelector('.post-title-link').addEventListener('click', () => openModal(post));
    card.querySelector('.read-more-btn').addEventListener('click', () => openModal(post));
    card.querySelector('.like-btn').addEventListener('click', (e) => handleLike(e, post.id));
    card.querySelector('.comment-btn').addEventListener('click', () => openModal(post));

    listEl.appendChild(card);
  });
}

// ── LIKE / UNLIKE ──
async function handleLike(e, postId) {
  const btn     = e.currentTarget;
  const countEl = btn.querySelector('.like-count');
  const token   = getToken();
  if (!token) return;

  const isLiked = btn.classList.contains('liked');
  const method  = isLiked ? 'DELETE' : 'POST';
  btn.disabled  = true;

  try {
    const res  = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method,
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      countEl.textContent = data.likes_count;
      btn.classList.toggle('liked', !isLiked);
      const p = allPosts.find(p => p.id === postId);
      if (p) p.likes_count = data.likes_count;
    }
  } catch (err) {
    console.error('Like error:', err);
  } finally {
    btn.disabled = false;
  }
}

// ── FILTER PILLS ───
document.querySelectorAll('.pill').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
    currentFilter = this.dataset.filter;
    renderPosts();
  });
});

// ── CREATE POST ───
document.getElementById('submit-post').addEventListener('click', async () => {
  const title   = document.getElementById('post-title').value.trim();
  const content = document.getElementById('post-content').value.trim();
  const errEl   = document.getElementById('post-error');
  const token   = getToken();

  errEl.textContent = '';
    if (!title)   { errEl.textContent = I18n.t('blog.title_req'); return; }
    if (!content) { errEl.textContent = I18n.t('blog.content_req'); return; }
  if (!token)   { errEl.textContent = I18n.t('blog.signin_first'); return; }

  const btn = document.getElementById('submit-post');
  btn.disabled = true;
  btn.textContent = I18n.t('blog.posting');

  try {
    const res  = await fetch(`${API_BASE}/posts`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, content }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.detail || I18n.t('blog.create_err'); return; }
    document.getElementById('post-title').value   = '';
    document.getElementById('post-content').value = '';
    await loadPosts();
  } catch (err) {
    errEl.textContent = I18n.t('blog.server_err');
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = I18n.t('blog.post_btn');
  }
});

// ── MODAL ───
function openModal(post) {
  openPostId = post.id;
  const token = getToken();
  const user  = token ? decodeToken(token) : null;

  document.getElementById('modal-post-title').textContent   = getLocalizedContent(post, 'title');
  document.getElementById('modal-post-content').textContent = getLocalizedContent(post, 'content');

  const dateStr = new Date(post.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('modal-post-meta').textContent =
    `${I18n.t('blog.by')} ${post.author_name} (${post.author_role === 'farmer' ? I18n.t('blog.farmer') : I18n.t('blog.researcher')}) · ${dateStr}`;

  const addCommentDiv = document.getElementById('modal-add-comment');
  const loginPrompt   = document.getElementById('modal-login-prompt');
  if (user) {
    addCommentDiv.classList.remove('hidden');
    loginPrompt.textContent = '';
  } else {
    addCommentDiv.classList.add('hidden');
    loginPrompt.textContent = I18n.t('blog.signin_comment');
  }

  document.getElementById('modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  loadComments(post.id);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  openPostId = null;
  document.getElementById('modal-comment-input').value = '';
  document.getElementById('comment-error').textContent = '';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
// ── LOAD COMMENTS ──
async function loadComments(postId) {
  const listEl = document.getElementById('modal-comments-list');
  listEl.innerHTML = `<div class="spinner small"></div><p style="color:#888;font-size:14px;">${I18n.t('blog.loading')}</p>`;

  let comments = [];

  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`);

    if (res.ok) {
      comments = await res.json();

      // Flatten sample comments and merge translations for backend-loaded comments
      const allSampleComments = Object.values(SAMPLE_COMMENTS).flat();
      comments = comments.map(apiComment => {
        const sample = allSampleComments.find(c => c.content_en === apiComment.content || c.content_af === apiComment.content);
        if (sample) {
          return {
            ...apiComment,
            content_en: sample.content_en,
            content_af: sample.content_af
          };
        }
        return apiComment;
      });
    }

    if (!comments || comments.length === 0) {
      comments = SAMPLE_COMMENTS[postId] || [];
    }

    if (!Array.isArray(comments) || comments.length === 0) {
      listEl.innerHTML = `<p style="color:#888;font-size:14px;">${I18n.t('blog.no_comments')}</p>`;
      return;
    }

    listEl.innerHTML = '';

    comments.forEach(c => {
      const div = document.createElement('div');
      div.className = `comment-item ${c.author_role === 'researcher' ? 'researcher-comment' : ''}`;

      const dateStr = new Date(c.created_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });

      div.innerHTML = `
        <div class="comment-author ${c.author_role === 'researcher' ? 'researcher' : ''}">
          ${c.author_role === 'farmer' ? '🌾' : '🔬'} ${escHtml(c.author_name)} · ${dateStr}
        </div>
        <div class="comment-content">${escHtml(getLocalizedContent(c, 'content'))}</div>
      `;

      listEl.appendChild(div);
    });

  } catch (err) {
    comments = SAMPLE_COMMENTS[postId] || [];

    if (!comments.length) {
      listEl.innerHTML = `<p style="color:var(--red-alert);font-size:14px;">${I18n.t('blog.load_err')}</p>`;
      console.error(err);
      return;
    }

    listEl.innerHTML = '';

    comments.forEach(c => {
      const div = document.createElement('div');
      div.className = `comment-item ${c.author_role === 'researcher' ? 'researcher-comment' : ''}`;

      const dateStr = new Date(c.created_at).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });

      div.innerHTML = `
        <div class="comment-author ${c.author_role === 'researcher' ? 'researcher' : ''}">
          ${c.author_role === 'farmer' ? '🌾' : '🔬'} ${escHtml(c.author_name)} · ${dateStr}
        </div>
        <div class="comment-content">${escHtml(getLocalizedContent(c, 'content'))}</div>
      `;

      listEl.appendChild(div);
    });
  }
}

// ── SUBMIT COMMENT ───
document.getElementById('submit-comment').addEventListener('click', async () => {
  const content = document.getElementById('modal-comment-input').value.trim();
  const errEl   = document.getElementById('comment-error');
  const token   = getToken();

  errEl.textContent = '';
  if (!content) { errEl.textContent = I18n.t('blog.comment_empty'); return; }
  if (!token)   { errEl.textContent = I18n.t('blog.signin_first'); return; }

  const btn = document.getElementById('submit-comment');
  btn.disabled    = true;
  btn.textContent = I18n.t('blog.posting');

  try {
    const res  = await fetch(`${API_BASE}/posts/${openPostId}/comments`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.detail || I18n.t('blog.comment_err'); return; }
    document.getElementById('modal-comment-input').value = '';
    await loadComments(openPostId);
    const p = allPosts.find(p => p.id === openPostId);
    if (p) p.comments_count += 1;
    renderPosts();
  } catch (err) {
    errEl.textContent = I18n.t('blog.server_err_short');
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = I18n.t('blog.comment_btn');
  }
});

// ── ESCAPE HTML ─
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}



// ── LISTEN FOR LANGUAGE CHANGES ──
document.addEventListener('languageChanged', () => {
  renderPosts(); // Re-render posts with new language
  updateAuthUI(); // Update auth card title
  if (openPostId) {
    loadComments(openPostId); // Re-render comments if modal is open
  }
});

// ── INIT ─
document.addEventListener('DOMContentLoaded', () => {
  console.log('Blog: DOMContentLoaded fired');
  console.log('Blog: Checking required elements...');
  
  // Check if required elements exist
  const feedLoading = document.getElementById('feed-loading');
  const postsList = document.getElementById('posts-list');
  const authForm = document.getElementById('auth-form');
  
  console.log('Blog: feed-loading element:', feedLoading ? 'found' : 'NOT FOUND');
  console.log('Blog: posts-list element:', postsList ? 'found' : 'NOT FOUND');
  console.log('Blog: auth-form element:', authForm ? 'found' : 'NOT FOUND');
  
  if (!feedLoading || !postsList || !authForm) {
    console.error('Blog: Missing required DOM elements!');
    return;
  }
  
  updateAuthUI();
  loadPosts();
});
