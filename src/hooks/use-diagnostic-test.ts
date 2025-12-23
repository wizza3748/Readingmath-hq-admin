
'use client';

import * as React from 'react';
import { type Firestore, onSnapshot } from 'firebase/firestore';
import { getDiagnosticTestDoc, type DiagnosticTest } from '@/lib/db';

export function useDiagnosticTest(firestore: Firestore | null, testId: string) {
  const [test, setTest] = React.useState<DiagnosticTest | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!firestore || !testId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = getDiagnosticTestDoc(firestore, testId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setTest({ id: parseInt(docSnap.id), ...docSnap.data() } as DiagnosticTest);
      } else {
        setTest(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching diagnostic test:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [firestore, testId]);

  return { test, setTest, loading };
}
