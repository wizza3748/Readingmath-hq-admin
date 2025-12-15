
"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { InstitutionEditForm } from "@/components/app/institutions/edit-form";
import { getInstitution, type Institution } from "@/lib/institutions";
import { useFirebase } from '@/firebase';

export default function InstitutionInfoPage() {
  const params = useParams();
  const institutionId = params.institutionId as string;
  const { firestore } = useFirebase() ?? {};
  const [institution, setInstitution] = React.useState<Institution | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!firestore || !institutionId) {
      if(!institutionId) setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = getInstitution(firestore, institutionId, (data) => {
      setInstitution(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, institutionId]);

  
  if (loading) {
    return <InstitutionEditForm institution={null} loading={true} />;
  }

  if (!institution) {
     return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold font-headline tracking-tight">
                기관 정보 없음
            </h1>
            <p className="text-muted-foreground mt-2">
                해당 기관 정보를 찾을 수 없습니다.
            </p>
        </div>
     )
  }

  return (
    <InstitutionEditForm institution={institution} loading={false} />
  );
}
