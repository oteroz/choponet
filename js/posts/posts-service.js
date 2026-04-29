// posts-service — CRUD de posts y subscripción en tiempo real al feed.

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { db } from '../firebase-config.js';
import { extractHashtags } from '../utils/hashtags.js';

const POSTS_COL = collection(db, 'choponet_posts');
const FEED_LIMIT = 50;

export async function createPost(text, profile) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('El post no puede estar vacío');
  if (trimmed.length > 500) throw new Error('Máximo 500 caracteres');
  if (!profile?.uid) throw new Error('Debes estar autenticado');

  return addDoc(POSTS_COL, {
    text: trimmed,
    authorUid: profile.uid,
    authorNick: profile.nick,
    createdAt: serverTimestamp(),
    reactionCounts: {},
    replyCount: 0,
    hashtags: extractHashtags(trimmed)
  });
}

export function subscribeFeed(callback) {
  const q = query(POSTS_COL, orderBy('createdAt', 'desc'), limit(FEED_LIMIT));
  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(posts);
  }, (err) => {
    console.error('Feed subscription error:', err);
    callback([]);
  });
}

export function subscribeByTag(tag, callback) {
  const normalized = String(tag || '').toLowerCase();
  const q = query(
    POSTS_COL,
    where('hashtags', 'array-contains', normalized),
    orderBy('createdAt', 'desc'),
    limit(FEED_LIMIT)
  );
  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(posts);
  }, (err) => {
    console.error(`Tag subscription error (#${normalized}):`, err);
    callback([]);
  });
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, 'choponet_posts', postId));
}
