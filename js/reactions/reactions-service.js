// reactions-service — toggle de reacciones con emoji.
// Doc ID determinista: `${uid}_${emoji}` para garantizar 1 emoji por user/target.

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { db } from '../firebase-config.js';

// Set de emojis con sabor "choperia": fuego, drama, risa, escándalo,
// chisme/voyeur, payasería, verdad cruda, chisme con popcorn, palmada en la
// frente, ojos de fisgón, silencio cómplice, piedra (deadpan), reacciones
// dominicanas clásicas en redes.
export const CHOPONET_EMOJIS = [
  '🔥', '💀', '😂', '🤣', '😱', '😳',
  '👀', '🤡', '💯', '🍿', '🤦', '🙄',
  '🤫', '🗿', '😏', '🙊', '👏', '💅',
  '🫦', '🤨', '🥲', '😮‍💨'
];

function getTargetDocRef({ postId, replyId }) {
  if (replyId) return doc(db, 'choponet_posts', postId, 'replies', replyId);
  return doc(db, 'choponet_posts', postId);
}

function getReactionDocRef({ postId, replyId, uid, emoji }) {
  const id = `${uid}_${encodeURIComponent(emoji)}`;
  if (replyId) return doc(db, 'choponet_posts', postId, 'replies', replyId, 'reactions', id);
  return doc(db, 'choponet_posts', postId, 'reactions', id);
}

/**
 * Alterna una reacción. Si el user ya reaccionó con ese emoji, la quita.
 * Si no, la añade. Devuelve el nuevo estado: true=activa, false=removida.
 */
export async function toggleReaction({ postId, replyId = null, emoji, profile }) {
  if (!profile?.uid) throw new Error('Debes estar autenticado');
  if (!emoji) throw new Error('Falta el emoji');

  const targetRef = getTargetDocRef({ postId, replyId });
  const reactionRef = getReactionDocRef({ postId, replyId, uid: profile.uid, emoji });

  const existing = await getDoc(reactionRef);
  const fieldKey = `reactionCounts.${emoji}`;

  if (existing.exists()) {
    await deleteDoc(reactionRef);
    await updateDoc(targetRef, {
      [fieldKey]: increment(-1),
      reactionTotal: increment(-1)
    });
    return false;
  } else {
    await setDoc(reactionRef, {
      uid: profile.uid,
      emoji,
      createdAt: serverTimestamp()
    });
    await updateDoc(targetRef, {
      [fieldKey]: increment(1),
      reactionTotal: increment(1)
    });
    return true;
  }
}
