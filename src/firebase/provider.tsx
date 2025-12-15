'use client';

import React, {createContext, useContext} from 'react';
import type {FirebaseApp} from 'firebase/app';
import type {Auth} from 'firebase/auth';
import type {Firestore} from 'firebase/firestore';

export interface FirebaseProviderProps {
  children?: React.ReactNode;
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseProviderProps | null>(null);

export const useFirebase = () => {
  return useContext(FirebaseContext);
};

export const useFirebaseApp = () => {
  const context = useContext(FirebaseContext);
  if (!context || !context.firebaseApp) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }
  return context.firebaseApp;
};

export const useFirestore = () => {
  const context = useContext(FirebaseContext);
  if (!context || !context.firestore) {
    throw new Error('useFirestore must be used within a FirebaseProvider');
  }
  return context.firestore;
};

export const useAuth = () => {
  const context = useContext(FirebaseContext);
  if (!context || !context.auth) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context.auth;
};

export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
}: FirebaseProviderProps) {
  return (
    <FirebaseContext.Provider value={{firebaseApp, auth, firestore}}>
      {children}
    </FirebaseContext.Provider>
  );
}
