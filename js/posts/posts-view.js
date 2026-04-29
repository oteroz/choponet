// posts-view — render del feed y del detalle de un post.

import { renderReactionBar } from '../reactions/reactions-view.js';
import { navigate } from '../router.js';
import { escapeAndLinkifyHashtags } from '../utils/hashtags.js';

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTime(ts) {
  if (!ts?.toDate) return '';
  const date = ts.toDate();
  const now = new Date();
  const diff = (now - date) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
}

const HOT_THRESHOLD = 5;

function buildPostCard(post, profile, { detail = false } = {}) {
  const card = document.createElement('article');
  card.className = detail ? 'post post-detail-card' : 'post';
  card.dataset.postId = post.id;

  const isHot = (post.reactionTotal || 0) >= HOT_THRESHOLD;
  const hotBadge = isHot
    ? `<span class="hot-badge" title="Este chisme está caliente">🔥 ${post.reactionTotal}</span>`
    : '';

  card.innerHTML = `
    <header class="post-header">
      <span class="post-author">${escapeHtml(post.authorNick || 'Anónimo')}</span>
      <div class="post-header-right">
        ${hotBadge}
        <span class="post-time">${formatTime(post.createdAt)}</span>
      </div>
    </header>
    <div class="post-body">${escapeAndLinkifyHashtags(post.text)}</div>
    <footer class="post-footer">
      <div class="reactions-slot"></div>
      <button class="post-reply-btn" type="button">
        <span aria-hidden="true">💬</span>
        <span>${post.replyCount || 0}</span>
      </button>
    </footer>
  `;

  const reactionsSlot = card.querySelector('.reactions-slot');
  renderReactionBar(reactionsSlot, {
    type: 'post',
    postId: post.id,
    replyId: null,
    counts: post.reactionCounts || {},
    profile
  });

  const replyBtn = card.querySelector('.post-reply-btn');
  if (detail) {
    replyBtn.addEventListener('click', () => {
      document.getElementById('reply-parent').value = '';
      document.getElementById('reply-text').focus();
    });
  } else {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.reactions-slot')) return;
      if (e.target.closest('a')) return; // dejar que hashtags y otros links funcionen
      navigate(`#/post/${post.id}`);
    });
    card.style.cursor = 'pointer';
  }

  return card;
}

export function renderFeed(posts, container, profile) {
  if (!container) return;
  container.innerHTML = '';
  if (!posts || posts.length === 0) {
    container.innerHTML = '<p class="empty-state">Aún no hay chismes. Sé el primero.</p>';
    return;
  }
  for (const post of posts) {
    container.appendChild(buildPostCard(post, profile, { detail: false }));
  }
}

export function renderPostDetail(post, container, profile) {
  if (!container) return;
  container.innerHTML = '';
  container.appendChild(buildPostCard(post, profile, { detail: true }));
}
