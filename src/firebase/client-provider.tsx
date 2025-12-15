'use client';

import React, {createContext, useContext, useEffect, useMemo} from 'react';
import {FirebaseApp} from 'firebase/app';
import {Auth} from 'firebase/auth';
import {Firestore} from 'firebase/firestore';

import {FirebaseProvider, type FirebaseProviderProps} from '@/firebase/provider';
import {initializeFirebase} from '@/firebase';

const FirebaseClientContext = createContext<FirebaseProviderProps | null>(null);

export const useFirebaseClient = () => {
  const context = useContext(FirebaseClientContext);
  if (!context) {
    throw new Error(
      'useFirebaseClient must be used within a FirebaseClientProvider'
    );
  }
  return context;
};

export function FirebaseClientProvider({children}: {children: React.ReactNode}) {
  const [firebaseApp, setFirebaseApp] = React.useState<FirebaseApp | null>(null);
  const [firestore, setFirestore] = React.useState<Firestore | null>(null);
  const [auth, setAuth] = React.useState<Auth | null>(null);

  useEffect(() => {
    const {firebaseApp, firestore, auth} = initializeFirebase();
    setFirebaseApp(firebaseApp);
    setFirestore(firestore);
    setAuth(auth);
  }, []);

  const value = useMemo(
    () => ({
      firebaseApp,
      firestore,
      auth,
    }),
    [firebaseApp, firestore, auth]
  );

  return (
    <FirebaseClientContext.Provider value={value}>
      <FirebaseProvider
        firebaseApp={firebaseApp}
        firestore={firestore}
        auth={auth}
      >
        {children}
      </FirebaseProvider>
    </FirebaseClientContext.Provider>
  );
}
