import {initializeApp, getApp, getApps, FirebaseApp} from 'firebase/app';
import {getFirestore, Firestore} from 'firebase/firestore';
import {getAuth, Auth} from 'firebase/auth';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// IMPORTANT: Replace this with your actual Firebase config object
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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
