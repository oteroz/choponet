// auth-service — login guest (anonymous), registro y login simple (nick + pass).
// Truco: como el usuario solo da nick + pass, lo convertimos a email ficticio
// "<nick>@choponet.local" para satisfacer Firebase Auth.

import {
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { auth, db } from '../firebase-config.js';
import { generateGuestNick } from './nick-generator.js';

const FAKE_EMAIL_DOMAIN = '@choponet.local';

function nickToEmail(nick) {
  const safe = nick.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return `${safe}${FAKE_EMAIL_DOMAIN}`;
}

async function writeUserDoc(uid, nick, isGuest) {
  await setDoc(doc(db, 'choponet_users', uid), {
    nick,
    isGuest,
    createdAt: serverTimestamp()
  }, { merge: true });
}

export async function loginAsGuest() {
  const credential = await signInAnonymously(auth);
  const uid = credential.user.uid;
  const nick = await generateGuestNick();
  await writeUserDoc(uid, nick, true);
  return { uid, nick, isGuest: true };
}

export async function registerUser(nick, password) {
  if (!nick || nick.length < 3) {
    throw new Error('El nick debe tener al menos 3 caracteres');
  }
  if (!password || password.length < 6) {
    throw new Error('La pass debe tener al menos 6 caracteres');
  }
  const email = nickToEmail(nick);
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await writeUserDoc(credential.user.uid, nick, false);
  return { uid: credential.user.uid, nick, isGuest: false };
}

export async function loginUser(nick, password) {
  const email = nickToEmail(nick);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function getCurrentProfile() {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, 'choponet_users', user.uid));
  if (!snap.exists()) return null;
  return { uid: user.uid, ...snap.data() };
}
