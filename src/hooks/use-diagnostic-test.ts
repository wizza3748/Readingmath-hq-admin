
'use client';

import * as React from 'react';
import { useFirestore } from '@/firebase';
import { getDiagnosticTest, type DiagnosticTest } from '@/lib/db';

export function useDiagnosticTest(testId: string) {
  const firestore = useFirestore();
  const [test, setTest] = React.useState<DiagnosticTest | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!firestore || !testId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = getDiagnosticTest(firestore, testId, (data) => {
      setTest(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, testId]);

  return { test, setTest, loading };
}
