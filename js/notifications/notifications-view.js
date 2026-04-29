// notifications-view — render de la inbox de notificaciones.

import { navigate } from '../router.js';

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
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
}

function describe(notif) {
  const actor = escapeHtml(notif.actorNick || 'Alguien');
  switch (notif.type) {
    case 'reply':
      return `<strong>${actor}</strong> respondió tu chisme`;
    case 'reply-to-reply':
      return `<strong>${actor}</strong> respondió tu comentario`;
    case 'reaction-post':
      return `<strong>${actor}</strong> reaccionó con <span class="notif-emoji">${escapeHtml(notif.emoji || '')}</span> a tu chisme`;
    case 'reaction-reply':
      return `<strong>${actor}</strong> reaccionó con <span class="notif-emoji">${escapeHtml(notif.emoji || '')}</span> a tu comentario`;
    default:
      return `<strong>${actor}</strong> hizo algo`;
  }
}

function buildNotifEl(notif) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `notif${notif.read ? '' : ' notif-unread'}`;
  el.dataset.notifId = notif.id;

  const snippet = notif.snippet ? `<div class="notif-snippet">"${escapeHtml(notif.snippet)}"</div>` : '';

  el.innerHTML = `
    <div class="notif-main">
      <div class="notif-text">${describe(notif)}</div>
      ${snippet}
    </div>
    <div class="notif-meta">
      ${notif.read ? '' : '<span class="notif-dot" aria-label="No leída"></span>'}
      <span class="notif-time">${formatTime(notif.createdAt)}</span>
    </div>
  `;

  el.addEventListener('click', () => {
    if (notif.postId) navigate(`#/post/${notif.postId}`);
  });

  return el;
}

export function renderNotifications(notifs, container) {
  if (!container) return;
  container.innerHTML = '';
  if (!notifs || notifs.length === 0) {
    container.innerHTML = '<p class="empty-state">Aún no tienes notificaciones. Cuando alguien reaccione o responda algo tuyo, aparecerá aquí.</p>';
    return;
  }
  for (const n of notifs) {
    container.appendChild(buildNotifEl(n));
  }
}
