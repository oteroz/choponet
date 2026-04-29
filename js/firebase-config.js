// Firebase init — usa la SDK modular vía CDN gstatic (no requiere build).
// Estas credenciales son públicas por diseño en apps frontend; la seguridad
// real va en las Firestore Security Rules (ver README.md).

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAJFwNApjwWFGWJhsSs1Cws4nrxIMhl3gQ',
  authDomain: 'testfire-27c40.firebaseapp.com',
  databaseURL: 'https://testfire-27c40-default-rtdb.firebaseio.com',
  projectId: 'testfire-27c40',
  storageBucket: 'testfire-27c40.firebasestorage.app',
  messagingSenderId: '498841666530',
  appId: '1:498841666530:web:976bb5b607f53d10356fbb',
  measurementId: 'G-2SSKBNMKWE'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
