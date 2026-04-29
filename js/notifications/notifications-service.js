// notifications-service — subcolección choponet_users/{uid}/notifications.
// Cada notificación es un evento ("X respondió tu chisme", "Y reaccionó con 🔥").
//
// Modelo del doc:
//   type: 'reply' | 'reply-to-reply' | 'reaction-post' | 'reaction-reply'
//   actorUid, actorNick   — quien disparó el evento
//   postId                — siempre presente, ruta para navegar
//   replyId               — null si es sobre el post; el id de la respuesta si aplica
//   emoji                 — solo para reactions
//   snippet               — preview corto del contenido al que se reaccionó/respondió
//   createdAt             — server timestamp
//   read                  — boolean, default false

import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  doc,
  getDocs,
  writeBatch,
  where
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { db } from '../firebase-config.js';

const NOTIFS_LIMIT = 50;
const SNIPPET_LEN = 80;

function notifsCol(uid) {
  return collection(db, 'choponet_users', uid, 'notifications');
}

export function snippetOf(text) {
  if (!text) return '';
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > SNIPPET_LEN ? trimmed.slice(0, SNIPPET_LEN) + '…' : trimmed;
}

/**
 * Crea una notificación en la inbox de targetUid.
 * NO lanza si el actor es el mismo target (es no-op, devuelve null).
 */
export async function createNotification({
  targetUid,
  actorProfile,
  type,
  postId,
  replyId = null,
  emoji = null,
  snippet = ''
}) {
  if (!targetUid || !actorProfile?.uid) return null;
  if (targetUid === actorProfile.uid) return null;

  return addDoc(notifsCol(targetUid), {
    type,
    actorUid: actorProfile.uid,
    actorNick: actorProfile.nick,
    postId,
    replyId,
    emoji,
    snippet: snippet || '',
    createdAt: serverTimestamp(),
    read: false
  });
}

export function subscribeNotifications(uid, callback) {
  if (!uid) return () => {};
  const q = query(notifsCol(uid), orderBy('createdAt', 'desc'), limit(NOTIFS_LIMIT));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  }, (err) => {
    console.error('Notifications subscription error:', err);
    callback([]);
  });
}

/**
 * Marca todas las notifs no leídas como leídas. Usa batch para minimizar writes.
 */
export async function markAllAsRead(uid) {
  if (!uid) return 0;
  const q = query(notifsCol(uid), where('read', '==', false), limit(NOTIFS_LIMIT));
  const snap = await getDocs(q);
  if (snap.empty) return 0;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(doc(db, 'choponet_users', uid, 'notifications', d.id), { read: true });
  });
  await batch.commit();
  return snap.size;
}
