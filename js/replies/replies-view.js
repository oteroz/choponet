// replies-view — convierte el array plano de respuestas en un árbol anidado.

import { renderReactionBar } from '../reactions/reactions-view.js';

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
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function buildTree(replies) {
  const byId = new Map();
  const roots = [];
  for (const r of replies) {
    byId.set(r.id, { ...r, children: [] });
  }
  for (const r of replies) {
    const node = byId.get(r.id);
    if (r.parentReplyId && byId.has(r.parentReplyId)) {
      byId.get(r.parentReplyId).children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function buildReplyEl(reply, profile, postId, depth) {
  const cappedDepth = Math.min(depth, 4);
  const el = document.createElement('article');
  el.className = `reply reply-depth-${cappedDepth}`;
  el.dataset.replyId = reply.id;

  el.innerHTML = `
    <header class="reply-header">
      <span class="reply-author">${escapeHtml(reply.authorNick || 'Anónimo')}</span>
      <span class="reply-time">${formatTime(reply.createdAt)}</span>
    </header>
    <div class="reply-body">${escapeHtml(reply.text)}</div>
    <footer class="reply-footer">
      <div class="reactions-slot"></div>
      <button class="reply-respond-btn" type="button">Responder</button>
    </footer>
    <div class="reply-children"></div>
  `;

  const reactionsSlot = el.querySelector('.reactions-slot');
  renderReactionBar(reactionsSlot, {
    type: 'reply',
    postId,
    replyId: reply.id,
    counts: reply.reactionCounts || {},
    profile
  });

  el.querySelector('.reply-respond-btn').addEventListener('click', () => {
    document.getElementById('reply-parent').value = reply.id;
    const ta = document.getElementById('reply-text');
    ta.placeholder = `Respondiéndole a ${reply.authorNick}…`;
    ta.focus();
  });

  const childrenContainer = el.querySelector('.reply-children');
  for (const child of (reply.children || [])) {
    childrenContainer.appendChild(buildReplyEl(child, profile, postId, depth + 1));
  }

  return el;
}

export function renderRepliesTree(replies, container, profile, postId) {
  if (!container) return;
  container.innerHTML = '';

  if (!replies || replies.length === 0) {
    container.innerHTML = '<p class="empty-state">Sé el primero en responder.</p>';
    return;
  }

  const roots = buildTree(replies);
  for (const root of roots) {
    container.appendChild(buildReplyEl(root, profile, postId, 0));
  }
}
