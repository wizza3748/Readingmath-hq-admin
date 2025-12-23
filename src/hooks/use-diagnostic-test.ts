
'use client';

import * as React from 'react';
import { type Firestore } from 'firebase/firestore';
import { getDiagnosticTest, type DiagnosticTest } from '@/lib/db';

export function useDiagnosticTest(firestore: Firestore | null, testId: string) {
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
