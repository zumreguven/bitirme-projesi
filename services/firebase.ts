/**
 * Firebase yapılandırması ve başlatma
 */
import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCRnER5vcP8fN4MMOXnEZKDduzqjeXfiDI',
  authDomain: 'bitki-sulama-5903b.firebaseapp.com',
  databaseURL:
    'https://bitki-sulama-5903b-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'bitki-sulama-5903b',
  storageBucket: 'bitki-sulama-5903b.firebasestorage.app',
  messagingSenderId: '859972733134',
  appId: '1:859972733134:web:e6da7bdd1338bbcae2289f',
  measurementId: 'G-2MFC1DPV3X',
};

// Firebase App başlatma
const app = initializeApp(firebaseConfig);

// Auth - AsyncStorage ile kalıcı oturum
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore Database
const db = getFirestore(app);

// Realtime Database (IoT haberleşme)
const rtdb = getDatabase(app);

export { app, auth, db, rtdb };
