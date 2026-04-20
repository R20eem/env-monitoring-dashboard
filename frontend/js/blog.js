const API_BASE = 'http://127.0.0.1:8000';
const TOKEN_KEY = 'jwt_token';

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

// ── BLOG ACCESS GUARD — only redirect if truly no token
if (!getToken()) {
  window.location.href = 'login.html';
}

// ── STATE ──
let currentFilter = 'all';
let allPosts      = [];
let openPostId    = null;

// -- SAMPLE FALLBACK POSTS-- only used for demo, if there is real post from backend api than these will be used
const SAMPLE_COMMENTS = {
  1001: [
    {
      author_name: "Dr. Sarah Chen",
      author_role: "researcher",
      content: "The early clustering you observed is consistent with rising pest activity after humid mornings. It would be good to compare this with trap counts over the next few days.",
      created_at: "2026-03-03T09:10:00"
    },
    {
      author_name: "Sipho Dlamini",
      author_role: "farmer",
      content: "We saw something similar on our side as well, especially near the lower leaves.",
      created_at: "2026-03-03T12:40:00"
    },
    {
      author_name: "Dr. Michael Jacobs",
      author_role: "researcher",
      content: "Check whether leaf wetness stayed high overnight. That usually strengthens the pattern.",
      created_at: "2026-03-04T08:25:00"
    }
  ],

  1002: [
    {
      author_name: "Thabo Mokoena",
      author_role: "farmer",
      content: "This matches what we are seeing in the field. The warnings usually come after very damp mornings.",
      created_at: "2026-03-29T07:50:00"
    },
    {
      author_name: "Dr. Michael Jacobs",
      author_role: "researcher",
      content: "Yes, the dashboard trend suggests the disease alerts are not random. Humidity and leaf wetness are moving together.",
      created_at: "2026-03-29T10:15:00"
    },
    {
      author_name: "Naledi Khumalo",
      author_role: "farmer",
      content: "Would you recommend earlier spraying if these conditions continue for several days?",
      created_at: "2026-03-29T13:30:00"
    },
    {
      author_name: "Dr. Sarah Chen",
      author_role: "researcher",
      content: "That depends on crop stage, but sustained wetness definitely raises risk. Monitoring should be intensified first.",
      created_at: "2026-03-30T15:05:00"
    },
    {
      author_name: "Dr. Amina Patel",
      author_role: "researcher",
      content: "This is exactly why combining environmental variables in the dashboard is useful for early warning.",
      created_at: "2026-03-30T09:20:00"
    }
  ],

  1003: [
    {
      author_name: "Dr. Kabelo Naidoo",
      author_role: "researcher",
      content: "A 20% reduction is a strong result. It would be useful to compare it with the previous moisture alert frequency.",
      created_at: "2026-03-13T08:10:00"
    },
    {
      author_name: "Lerato Nkosi",
      author_role: "farmer",
      content: "We are considering the same switch. Did it change pest activity at all?",
      created_at: "2026-03-13T11:45:00"
    },
    {
      author_name: "Sipho Dlamini",
      author_role: "farmer",
      content: "So far it also seems to reduce water waste without stressing the plants.",
      created_at: "2026-03-13T16:00:00"
    },
    {
      author_name: "Dr. Sarah Chen",
      author_role: "researcher",
      content: "This would make a useful comparison case for the dashboard if both sites stay monitored.",
      created_at: "2026-03-14T09:35:00"
    }
  ],

  1004: [
    {
      author_name: "Dr. Amina Patel",
      author_role: "researcher",
      content: "This is a good point. Regional weather alone often misses the small field-level changes that actually trigger alerts.",
      created_at: "2026-03-24T11:00:00"
    },
    {
      author_name: "Thabo Mokoena", // used google translater
      author_role: "farmer",
      content: "Ja, dit help baie om plaaslike data te hê wanneer toestande vinnig verander.",
      created_at: "2026-03-29T13:10:00"
    }
  ],

  1005: [
    {
      author_name: "Dr. Michael Jacobs",
      author_role: "researcher",
      content: "That is a very good example of using the warning level as an early intervention point before reaching critical status.",
      created_at: "2026-03-26T09:15:00"
    }
  ],

  1006: [
    {
      author_name: "Dr. Sarah Chen",
      author_role: "researcher",
      content: "High humidity in the early morning is expected, but sustained levels above 90% can increase fungal risk.",
      created_at: "2026-03-27T09:00:00"
    },
    {
      author_name: "Dr. Amina Patel",
      author_role: "researcher",
      content: "I would monitor leaf wetness together with humidity. If both remain high, the risk becomes more significant.",
      created_at: "2026-03-27T11:20:00"
    }
  ],

  1007: [
    {
      author_name: "Dr. Michael Jacobs",
      author_role: "researcher",
      content: "This could be nocturnal pests like cutworms. Check near the soil early in the morning.",
      created_at: "2026-03-28T08:10:00"
    },
    {
      author_name: "Dr. Kabelo Naidoo",
      author_role: "researcher",
      content: "If the damage appears overnight, insect feeding is a stronger possibility than heat stress.",
      created_at: "2026-03-28T10:05:00"
    },
    {
      author_name: "Lerato Nkosi",
      author_role: "farmer",
      content: "We had similar damage last season and it turned out to be cutworms near the base.",
      created_at: "2026-03-28T14:25:00"
    }
  ],

  1008: [
    {
      author_name: "Naledi Khumalo",
      author_role: "farmer",
      content: "This is useful because we also noticed warnings after wetter nights, especially in lower parts of the field.",
      created_at: "2026-03-18T14:00:00"
    },
    {
      author_name: "Dr. Sarah Chen",
      author_role: "researcher",
      content: "Yes, and the maize site appears to show this more clearly than the others.",
      created_at: "2026-03-18T15:25:00"
    },
    {
      author_name: "Dr. Amina Patel",
      author_role: "researcher",
      content: "It may be worth testing whether the timing of irrigation is amplifying that effect.",
      created_at: "2026-03-19T09:40:00"
    },
    {
      author_name: "Sipho Dlamini",
      author_role: "farmer",
      content: "That would be interesting because we irrigate quite late in the afternoon on one section.",
      created_at: "2026-03-19T12:10:00"
    }
  ],

  1009: [
    {
      author_name: "Dr. Michael Jacobs",
      author_role: "researcher",
      content: "This is a good example of how the dashboard can support forecasting rather than only reporting.",
      created_at: "2026-03-21T15:15:00"
    },
    {
      author_name: "Musa Ndlovu",
      author_role: "farmer",
      content: "We often notice more trap activity after the hottest days too.",
      created_at: "2026-03-21T17:00:00"
    },
    {
      author_name: "Dr. Sarah Chen",
      author_role: "researcher",
      content: "It would be useful to compare this with humidity drops during the same periods.",
      created_at: "2026-03-22T08:45:00"
    }
  ],

  1010: [
    {
      author_name: "Thabo Mokoena",
      author_role: "farmer",
      content: "The maize site has definitely been the most concerning one from a field perspective this week.",
      created_at: "2026-03-29T17:10:00"
    },
    {
      author_name: "Dr. Sarah Chen",
      author_role: "researcher",
      content: "The alert concentration there suggests it should be prioritized for inspection and follow-up sampling.",
      created_at: "2026-03-24T18:00:00"
    },
    {
      author_name: "Dr. Amina Patel",
      author_role: "researcher",
      content: "The combination of rainfall, humidity, and leaf wetness makes that conclusion quite reasonable.",
      created_at: "2026-03-25T08:20:00"
    },
    {
      author_name: "Naledi Khumalo",
      author_role: "farmer",
      content: "Would you suggest adjusting irrigation timing there first, or focusing on pest checks?",
      created_at: "2026-03-25T10:50:00"
    },
    {
      author_name: "Dr. Kabelo Naidoo",
      author_role: "researcher",
      content: "I would start with field inspection and trap confirmation, then review irrigation timing immediately after.",
      created_at: "2026-03-25T12:15:00"
    },
    {
      author_name: "Dr. Michael Jacobs",
      author_role: "researcher",
      content: "This is a good candidate site for a case-study summary in the final report.",
      created_at: "2026-03-25T14:30:00"
    }
  ]
};

// -- SAMPLE FALLBACK COMMENTS
const SAMPLE_POSTS = [
  {
    id: 1001,
    title: "Early signs of aphid activity in maize plots",
    content: "We noticed a sharp increase in pest activity in the eastern maize plots after two humid mornings. Trap counts were still moderate, but leaf inspection showed early aphid clustering near the lower canopy. Farmers may want to inspect fields earlier in the day before the temperature rises.",
    author_id: 1,
    author_role: "farmer",
    author_name: "Thabo Mokoena",
    likes_count: 12,
    comments_count: 3,
    created_at: "2026-03-02T08:30:00"
  },
  {
    id: 1002,
    title: "Humidity and leaf wetness are strongly aligning with disease alerts",
    content: "After reviewing recent sensor logs, we found that high humidity combined with persistent leaf wetness closely matched disease-risk warnings. This suggests the system is performing well as an early indicator for fungal risk, especially during cooler overnight periods.",
    author_id: 2,
    author_role: "researcher",
    author_name: "Dr. Sarah Chen",
    likes_count: 21,
    comments_count: 5,
    created_at: "2026-03-29T06:10:00"
  },
  {
    id: 1003,
    title: "Drip irrigation reduced water use on our test field",
    content: "We switched one section of the farm to drip irrigation after repeated moisture-related alerts. Over two weeks, the soil stayed more stable and overall water use dropped noticeably. We are planning to extend the setup to a second site next month.",
    author_id: 3,
    author_role: "farmer",
    author_name: "Sipho Dlamini",
    likes_count: 17,
    comments_count: 4,
    created_at: "2026-03-12T10:45:00"
  },
  {
    id: 1004, // used google translater
    title: "Vergelyking van plaaslike sensorlesings met weerdata",
    content: "Ons het plaaslike temperatuur- en reënvaldata vergelyk met streeksweerpatrone. Die plaaslike sensors wys vinniger veranderinge, wat belangrik is omdat dit plaagaktiwiteit en siekterisiko direk beïnvloed. Dit help boere om vinniger besluite te neem.",
    author_id: 4,
    author_role: "farmer",
    author_name: "Johan van der Merwe",
    likes_count: 9,
    comments_count: 2,
    created_at: "2026-03-29T09:20:00"
  },
  {
    id: 1005,
    title: "Brassica site recovered after warning spike",
    content: "The brassica site showed a warning spike earlier this week, mainly linked to humidity and leaf wetness. After improving airflow and adjusting irrigation timing, the latest readings look much healthier. This was a good example of using the dashboard to act before the issue became critical.",
    author_id: 5,
    author_role: "farmer",
    author_name: "Naledi Khumalo",
    likes_count: 14,
    comments_count: 1,
    created_at: "2026-03-25T16:00:00"
  },
  {
    id: 1006,
    title: "Is this level of humidity normal for this season?",
    content: "Over the past few mornings, humidity has been above 90% on my maize field. Is this something to worry about, or is it normal for March conditions?",
    author_id: 6,
    author_role: "farmer",
    author_name: "Lerato Nkosi",
    likes_count: 5,
    comments_count: 2,
    created_at: "2026-03-27T07:15:00"
  },
  {
    id: 1007,
    title: "What pest could cause sudden leaf damage overnight?",
    content: "Yesterday evening the plants looked fine, but this morning I noticed several leaves with damage. Could this be insects or something else?",
    author_id: 7,
    author_role: "farmer",
    author_name: "Musa Ndlovu",
    likes_count: 7,
    comments_count: 3,
    created_at: "2026-03-28T06:40:00"
  },
  {
    id: 1008,
    title: "Research note: warning spikes are clustering after wet leaf periods",
    content: "A review of March dashboard data shows that warning events tend to appear after extended periods of high leaf wetness and elevated humidity. This pattern is especially visible in the maize and brassica sites, suggesting the alerts are responding to meaningful environmental changes rather than random fluctuations.",
    author_id: 8,
    author_role: "researcher",
    author_name: "Dr. Michael Jacobs",
    likes_count: 16,
    comments_count: 4,
    created_at: "2026-03-18T11:30:00"
  },
  {
    id: 1009,
    title: "Pest trap count increases matched warmer afternoon readings",
    content: "When comparing daily sensor trends, we observed that higher afternoon temperatures were often followed by increased pest trap counts. This does not prove causation on its own, but it is a useful signal for forecasting periods of higher pest activity on the dashboard.",
    author_id: 9,
    author_role: "researcher",
    author_name: "Dr. Amina Patel",
    likes_count: 13,
    comments_count: 3,
    created_at: "2026-03-21T13:05:00"
  },
  {
    id: 1010,
    title: "Field dashboard insight: maize site showed the highest alert concentration this week",
    content: "Based on the latest dashboard review, the maize site recorded the highest concentration of warning and alert-triggered readings during the week. The combination of humidity, leaf wetness, and rainfall suggests this site should be prioritized for close field inspection.",
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
    authCardTitle.textContent = 'Welcome back!';
    const icon = user.role === 'farmer' ? '🌾' : '🔬';
    userBadge.textContent = `${icon} Signed in as ${user.role}`;
  } else {
    authForm.classList.remove('hidden');
    loggedInInfo.classList.add('hidden');
    createBox.classList.add('hidden');
    authCardTitle.textContent = 'Sign in to post';
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
    errEl.textContent = 'Please fill in all fields.';
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
      errEl.textContent = data.detail || 'Login failed.';
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
    errEl.textContent = 'Could not reach the server. Is the backend running?';
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
  const loadingEl = document.getElementById('feed-loading');
  const emptyEl   = document.getElementById('feed-empty');
  const listEl    = document.getElementById('posts-list');

  loadingEl.classList.remove('hidden');
  emptyEl.classList.add('hidden');
  listEl.innerHTML = '';

  try {
    const res  = await fetch(`${API_BASE}/posts`);
    const data = await res.json();

    loadingEl.classList.add('hidden');

    if (Array.isArray(data) && data.length > 0) {
      allPosts = data;
    } else {
      allPosts = SAMPLE_POSTS;
    }

    renderPosts();

  } catch (err) {
    loadingEl.classList.add('hidden');
    allPosts = SAMPLE_POSTS;
    renderPosts();
    console.warn('Using sample blog posts because backend posts could not be loaded.', err);
  }
}

// ── RENDER POSTS ───
function renderPosts() {
  const listEl = document.getElementById('posts-list');
  const token  = getToken();
  const user   = token ? decodeToken(token) : null;

  let postsToRender = [...allPosts];

  // Sort by likes first, then newest
  postsToRender.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filtered = currentFilter === 'all'
    ? postsToRender
    : postsToRender.filter(p => p.author_role === currentFilter);

  if (filtered.length === 0) {
    listEl.innerHTML = `<p style="color:var(--text-mid);padding:20px 0;">No ${currentFilter} posts yet.</p>`;
    return;
  }

  listEl.innerHTML = '';

  filtered.forEach((post, i) => {
    const card = document.createElement('div');
    card.className = `post-card ${post.author_role}-post`;
    card.style.animationDelay = `${i * 0.06}s`;

    const badgeClass = post.author_role === 'farmer' ? 'badge-farmer' : 'badge-researcher';
    const badgeLabel = post.author_role === 'farmer' ? '🌾 Farmer' : '🔬 Researcher';
    const dateStr    = new Date(post.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    const likeDisabled = !user ? 'disabled' : '';

    card.innerHTML = `
      <div class="post-card-header">
        <h2 class="post-title-link">${escHtml(post.title)}</h2>
        <span class="role-badge ${badgeClass}">${badgeLabel}</span>
      </div>
      <div class="post-meta">
        By <span class="author-link" data-role="${post.author_role}" data-id="${post.author_id}">
          ${escHtml(post.author_name)}
        </span> · ${dateStr}
      </div>
      <p class="post-preview">${escHtml(post.content)}</p>
      <div class="post-card-footer">
        <button class="action-btn like-btn" data-id="${post.id}" ${likeDisabled}>
          👍 <span class="like-count">${post.likes_count}</span>
        </button>
        <button class="action-btn comment-btn" data-id="${post.id}">
          💬 ${post.comments_count}
        </button>
        <button class="read-more-btn" data-id="${post.id}">Read more →</button>
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
  if (!title)   { errEl.textContent = 'Title is required.'; return; }
  if (!content) { errEl.textContent = 'Content is required.'; return; }
  if (!token)   { errEl.textContent = 'Please sign in first.'; return; }

  const btn = document.getElementById('submit-post');
  btn.disabled = true;
  btn.textContent = 'Posting…';

  try {
    const res  = await fetch(`${API_BASE}/posts`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, content }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.detail || 'Could not create post.'; return; }
    document.getElementById('post-title').value   = '';
    document.getElementById('post-content').value = '';
    await loadPosts();
  } catch (err) {
    errEl.textContent = 'Server error. Please try again.';
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Post';
  }
});

// ── MODAL ───
function openModal(post) {
  openPostId = post.id;
  const token = getToken();
  const user  = token ? decodeToken(token) : null;

  document.getElementById('modal-post-title').textContent   = post.title;
  document.getElementById('modal-post-content').textContent = post.content;

  const dateStr = new Date(post.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('modal-post-meta').textContent =
    `By ${post.author_name} (${post.author_role}) · ${dateStr}`;

  const addCommentDiv = document.getElementById('modal-add-comment');
  const loginPrompt   = document.getElementById('modal-login-prompt');
  if (user) {
    addCommentDiv.classList.remove('hidden');
    loginPrompt.textContent = '';
  } else {
    addCommentDiv.classList.add('hidden');
    loginPrompt.textContent = 'Sign in to leave a comment.';
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
  listEl.innerHTML = '<div class="spinner small"></div>';

  let comments = [];

  try {
    const res = await fetch(`${API_BASE}/posts/${postId}/comments`);

    if (res.ok) {
      comments = await res.json();
    }

    if (!comments || comments.length === 0) {
      comments = SAMPLE_COMMENTS[postId] || [];
    }

    if (!Array.isArray(comments) || comments.length === 0) {
      listEl.innerHTML = '<p style="color:#888;font-size:14px;">No comments yet. Be the first!</p>';
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
        <div class="comment-content">${escHtml(c.content)}</div>
      `;

      listEl.appendChild(div);
    });

  } catch (err) {
    comments = SAMPLE_COMMENTS[postId] || [];

    if (!comments.length) {
      listEl.innerHTML = '<p style="color:var(--red-alert);font-size:14px;">Could not load comments.</p>';
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
        <div class="comment-content">${escHtml(c.content)}</div>
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
  if (!content) { errEl.textContent = 'Comment cannot be empty.'; return; }
  if (!token)   { errEl.textContent = 'Please sign in first.'; return; }

  const btn = document.getElementById('submit-comment');
  btn.disabled    = true;
  btn.textContent = 'Posting…';

  try {
    const res  = await fetch(`${API_BASE}/posts/${openPostId}/comments`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.detail || 'Could not post comment.'; return; }
    document.getElementById('modal-comment-input').value = '';
    await loadComments(openPostId);
    const p = allPosts.find(p => p.id === openPostId);
    if (p) p.comments_count += 1;
    renderPosts();
  } catch (err) {
    errEl.textContent = 'Server error.';
    console.error(err);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Add Comment';
  }
});

// ── ESCAPE HTML ─
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// ── INIT ─
updateAuthUI();
loadPosts();

