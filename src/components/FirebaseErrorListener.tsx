'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';

// This component is responsible for listening to Firestore permission errors
// and throwing them as uncaught exceptions to be displayed in the Next.js
// development error overlay. This is only active in development.
export function FirebaseErrorListener() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const handlePermissionError = (error: FirestorePermissionError) => {
      // Throwing the error here will cause it to be displayed in the Next.js
      // development error overlay.
      throw error;
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  return null;
}
