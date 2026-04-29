// Genera nicks atómicos tipo "Chopo#N" para guests.
// El contador vive en Firestore: choponet_meta/guestCounter { count: number }.
// Usamos runTransaction para garantizar incrementos atómicos sin colisiones.

import {
  doc,
  runTransaction
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { db } from '../firebase-config.js';

const COUNTER_DOC = doc(db, 'choponet_meta', 'guestCounter');

export async function generateGuestNick() {
  const next = await runTransaction(db, async (tx) => {
    const snap = await tx.get(COUNTER_DOC);
    const current = snap.exists() ? (snap.data().count || 0) : 0;
    const nextValue = current + 1;
    tx.set(COUNTER_DOC, { count: nextValue }, { merge: true });
    return nextValue;
  });
  return `Chopo#${next}`;
}
