// main.js — bootstrap de la app: SW, auth listener, routing y wiring de forms.

import { registerRoute, startRouter, navigate } from './router.js';
import { showView, setUserTag, setBottomNavVisible } from './ui/view-manager.js';
import { showToast } from './ui/toast.js';
import {
  onAuthChange,
  loginAsGuest,
  registerUser,
  loginUser,
  logout,
  getCurrentProfile
} from './auth/auth-service.js';
import { subscribeFeed, subscribeFeedHot, subscribeByTag, createPost } from './posts/posts-service.js';
import { renderFeed, renderPostDetail } from './posts/posts-view.js';
import { subscribeReplies, createReply } from './replies/replies-service.js';
import { renderRepliesTree } from './replies/replies-view.js';

let currentProfile = null;
let unsubFeed = null;
let unsubPostDetail = null;
let unsubReplies = null;
let activePostId = null;

const SORT_KEY = 'choponet:feed-sort';
function getFeedSort() {
  return localStorage.getItem(SORT_KEY) === 'hot' ? 'hot' : 'recent';
}
function setFeedSort(sort) {
  localStorage.setItem(SORT_KEY, sort);
}

// ---- Service Worker (PWA) ----

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      // Silenciar — el sitio funciona sin SW, solo no será instalable offline
    });
  });
}

// ---- Routes ----

registerRoute('/login', () => {
  cleanupSubscriptions();
  setBottomNavVisible(false);
  showView('login');
});

function subscribeFeedBySort(sort, feedEl) {
  feedEl.innerHTML = '<div class="loading-state"><span class="spinner"></span><span>Cargando chismes…</span></div>';
  const subscriber = sort === 'hot' ? subscribeFeedHot : subscribeFeed;
  return subscriber((posts) => {
    renderFeed(posts, feedEl, currentProfile);
  });
}

function applySortToToggle(sort) {
  document.querySelectorAll('.feed-sort-btn').forEach((btn) => {
    btn.setAttribute('aria-selected', btn.dataset.sort === sort ? 'true' : 'false');
  });
}

registerRoute('/feed', () => {
  if (!currentProfile) {
    navigate('#/login');
    return;
  }
  cleanupSubscriptions();
  setBottomNavVisible(true);
  showView('feed');

  const sort = getFeedSort();
  applySortToToggle(sort);

  const feedEl = document.getElementById('posts-feed');
  unsubFeed = subscribeFeedBySort(sort, feedEl);
});

registerRoute('/tag/:name', ({ name }) => {
  if (!currentProfile) {
    navigate('#/login');
    return;
  }
  cleanupSubscriptions();
  setBottomNavVisible(true);
  showView('tag');

  const tag = String(name || '').toLowerCase();
  document.getElementById('tag-name').textContent = tag;

  const feedEl = document.getElementById('tag-feed');
  feedEl.innerHTML = '<div class="loading-state"><span class="spinner"></span><span>Cargando…</span></div>';

  unsubFeed = subscribeByTag(tag, (posts) => {
    if (!posts || posts.length === 0) {
      const safe = document.createElement('p');
      safe.className = 'empty-state';
      safe.textContent = `Aún no hay chismes con #${tag}. ¡Sé el primero!`;
      feedEl.innerHTML = '';
      feedEl.appendChild(safe);
      return;
    }
    renderFeed(posts, feedEl, currentProfile);
  });
});

registerRoute('/post/:id', ({ id }) => {
  if (!currentProfile) {
    navigate('#/login');
    return;
  }
  cleanupSubscriptions();
  setBottomNavVisible(true);
  showView('post');
  activePostId = id;
  document.getElementById('reply-parent').value = '';

  const detailEl = document.getElementById('post-detail');
  const treeEl = document.getElementById('replies-tree');
  detailEl.innerHTML = '<div class="loading-state"><span class="spinner"></span><span>Cargando chisme…</span></div>';
  treeEl.innerHTML = '<div class="loading-state"><span class="spinner"></span><span>Cargando respuestas…</span></div>';

  unsubPostDetail = subscribeFeed((posts) => {
    const post = posts.find((p) => p.id === id);
    if (post) {
      renderPostDetail(post, detailEl, currentProfile);
    } else {
      detailEl.innerHTML = '<p class="empty-state">Este chisme se borró o no existe.</p>';
    }
  });

  unsubReplies = subscribeReplies(id, (replies) => {
    renderRepliesTree(replies, treeEl, currentProfile, id);
  });
});

registerRoute('/logout', async () => {
  await logout();
  showToast('Hasta luego, chopo', 'success');
  navigate('#/login');
});

function cleanupSubscriptions() {
  if (unsubFeed) { unsubFeed(); unsubFeed = null; }
  if (unsubPostDetail) { unsubPostDetail(); unsubPostDetail = null; }
  if (unsubReplies) { unsubReplies(); unsubReplies = null; }
  activePostId = null;
}

// ---- Auth state ----
// onAuthChange maneja dos casos: logout (limpiar y volver al login), y reload
// con sesión existente (restaurar profile). Los handlers explícitos de login
// hacen su propia navegación tras escribir el profile, para evitar race conditions
// donde onAuthChange dispararía antes de que se cree el doc en choponet_users.

onAuthChange(async (user) => {
  if (!user) {
    currentProfile = null;
    setUserTag(null);
    cleanupSubscriptions();
    setBottomNavVisible(false);
    navigate('#/login');
    return;
  }

  const profile = await getCurrentProfile();

  if (profile) {
    currentProfile = profile;
    setUserTag(profile.nick);
    setBottomNavVisible(true);
    if (!window.location.hash || window.location.hash === '#/login' || window.location.hash === '#/') {
      navigate('#/feed');
    }
  }
  // Si no hay profile pero hay user auth, los handlers explícitos completarán
  // el flujo (loginAsGuest/registerUser escriben el profile y navegan).
});

// ---- Form handlers ----

async function applyProfileAndGoToFeed(profile, welcomeMsg) {
  currentProfile = profile;
  setUserTag(profile.nick);
  setBottomNavVisible(true);
  showToast(welcomeMsg, 'success');
  navigate('#/feed');
}

async function withLoading(btn, fn) {
  btn.dataset.loading = 'true';
  try {
    return await fn();
  } finally {
    delete btn.dataset.loading;
  }
}

document.getElementById('btn-guest').addEventListener('click', async (e) => {
  await withLoading(e.currentTarget, async () => {
    try {
      const profile = await loginAsGuest();
      await applyProfileAndGoToFeed(profile, `Bienvenido, ${profile.nick}`);
    } catch (err) {
      console.error(err);
      showToast('No pudimos entrarte como guest', 'error');
    }
  });
});

document.getElementById('form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nick = document.getElementById('reg-nick').value.trim();
  const pass = document.getElementById('reg-pass').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  await withLoading(submitBtn, async () => {
    try {
      const profile = await registerUser(nick, pass);
      await applyProfileAndGoToFeed(profile, `¡Bienvenido, ${nick}!`);
    } catch (err) {
      showToast(err.message || 'No pudimos registrarte', 'error');
    }
  });
});

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nick = document.getElementById('log-nick').value.trim();
  const pass = document.getElementById('log-pass').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  await withLoading(submitBtn, async () => {
    try {
      await loginUser(nick, pass);
      const profile = await getCurrentProfile();
      if (!profile) throw new Error('No se encontró perfil de choponet');
      await applyProfileAndGoToFeed(profile, `Hola de nuevo, ${nick}`);
    } catch (err) {
      showToast('Nick o pass incorrectos', 'error');
    }
  });
});

document.getElementById('form-post').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentProfile) return;
  const textEl = document.getElementById('post-text');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const text = textEl.value.trim();
  if (!text) return;
  submitBtn.dataset.loading = 'true';
  try {
    await createPost(text, currentProfile);
    textEl.value = '';
    document.getElementById('char-count').textContent = '0 / 500';
    showToast('Chisme publicado', 'success');
  } catch (err) {
    console.error(err);
    showToast('No pudimos publicar', 'error');
  } finally {
    delete submitBtn.dataset.loading;
  }
});

document.getElementById('post-text').addEventListener('input', (e) => {
  document.getElementById('char-count').textContent = `${e.target.value.length} / 500`;
});

document.getElementById('btn-back').addEventListener('click', () => navigate('#/feed'));
document.getElementById('btn-tag-back').addEventListener('click', () => navigate('#/feed'));

document.getElementById('form-reply').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentProfile || !activePostId) return;
  const textEl = document.getElementById('reply-text');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const text = textEl.value.trim();
  const parentReplyId = document.getElementById('reply-parent').value || null;
  if (!text) return;
  submitBtn.dataset.loading = 'true';
  try {
    await createReply(activePostId, parentReplyId, text, currentProfile);
    textEl.value = '';
    document.getElementById('reply-parent').value = '';
    document.getElementById('reply-text').placeholder = 'Responde al chisme…';
    showToast('Respuesta enviada', 'success');
  } catch (err) {
    console.error(err);
    showToast('No pudimos enviar la respuesta', 'error');
  } finally {
    delete submitBtn.dataset.loading;
  }
});

// Bottom nav clicks
document.querySelectorAll('#bottom-nav .nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const route = btn.dataset.route;
    if (route) navigate(route);
  });
});

// Feed sort toggle clicks
document.querySelectorAll('.feed-sort-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const sort = btn.dataset.sort;
    if (!sort || getFeedSort() === sort) return;
    setFeedSort(sort);
    applySortToToggle(sort);
    if (unsubFeed) { unsubFeed(); unsubFeed = null; }
    const feedEl = document.getElementById('posts-feed');
    unsubFeed = subscribeFeedBySort(sort, feedEl);
  });
});

// ---- Start ----

startRouter('#/login');
