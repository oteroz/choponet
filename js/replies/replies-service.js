// replies-service — respuestas anidadas. Estructura plana en Firestore con
// parentReplyId para reconstruir el árbol en cliente.

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  increment,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { db } from '../firebase-config.js';
import { extractHashtags } from '../utils/hashtags.js';

function repliesCol(postId) {
  return collection(db, 'choponet_posts', postId, 'replies');
}

export async function createReply(postId, parentReplyId, text, profile) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('La respuesta no puede estar vacía');
  if (trimmed.length > 300) throw new Error('Máximo 300 caracteres');
  if (!profile?.uid) throw new Error('Debes estar autenticado');

  const replyDoc = await addDoc(repliesCol(postId), {
    text: trimmed,
    authorUid: profile.uid,
    authorNick: profile.nick,
    parentReplyId: parentReplyId || null,
    createdAt: serverTimestamp(),
    reactionCounts: {},
    reactionTotal: 0,
    replyCount: 0,
    hashtags: extractHashtags(trimmed)
  });

  await updateDoc(doc(db, 'choponet_posts', postId), {
    replyCount: increment(1)
  });

  if (parentReplyId) {
    await updateDoc(doc(db, 'choponet_posts', postId, 'replies', parentReplyId), {
      replyCount: increment(1)
    });
  }

  return replyDoc;
}

export function subscribeReplies(postId, callback) {
  const q = query(repliesCol(postId), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const replies = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(replies);
  }, (err) => {
    console.error('Replies subscription error:', err);
    callback([]);
  });
}
