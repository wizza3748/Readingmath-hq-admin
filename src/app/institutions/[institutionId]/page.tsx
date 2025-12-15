
"use client";

import React from 'react';
import { InstitutionEditForm } from "@/components/app/institutions/edit-form";
import type { Institution } from "@/lib/institutions";

export default function InstitutionInfoPage({ institution, loading }: { institution: Institution | null, loading: boolean }) {
  
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
