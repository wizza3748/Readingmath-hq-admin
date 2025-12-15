'use client';
import {initializeApp, getApp, getApps, FirebaseApp} from 'firebase/app';
import {getFirestore, Firestore} from 'firebase/firestore';
import {getAuth, Auth} from 'firebase/auth';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// IMPORTANT: Replace this with your actual Firebase config object
const firebaseConfig = {
  projectId: 'eduview-thyg6',
  appId: '1:507190045435:web:ef72be433f750e4274de5e',
  apiKey: 'AIzaSyD4q-CmMqNhpgbyFzopNprbGw5kRK6J604',
  authDomain: 'eduview-thyg6.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '507190045435',
};

function initializeFirebase() {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  } else {
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }

  return {firebaseApp, auth, firestore};
}

export {initializeFirebase};
export * from './provider';
