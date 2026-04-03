const API_BASE = 'http://192.168.0.22:8000';
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

    if (!Array.isArray(data) || data.length === 0) {
      emptyEl.classList.remove('hidden');
      return;
    }

    allPosts = data;
    renderPosts();

  } catch (err) {
    loadingEl.classList.add('hidden');
    listEl.innerHTML = `<p style="color:var(--red-alert);padding:20px 0;">
      Could not load posts. Is the backend running at <strong>${API_BASE}</strong>?
    </p>`;
    console.error(err);
  }
}

// ── RENDER POSTS ───
function renderPosts() {
  const listEl = document.getElementById('posts-list');
  const token  = getToken();
  const user   = token ? decodeToken(token) : null;

  const filtered = currentFilter === 'all'
    ? allPosts
    : allPosts.filter(p => p.author_role === currentFilter);

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
  try {
    const res      = await fetch(`${API_BASE}/posts/${postId}/comments`);
    const comments = await res.json();
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
    listEl.innerHTML = '<p style="color:var(--red-alert);font-size:14px;">Could not load comments.</p>';
    console.error(err);
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