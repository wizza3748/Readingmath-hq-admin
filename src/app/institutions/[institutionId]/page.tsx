
"use client";

import { InstitutionEditForm } from "@/components/app/institutions/edit-form";
import type { Institution } from "@/lib/institutions";

export default function InstitutionInfoPage({ institution, loading }: { institution: Institution | null, loading: boolean }) {
  return (
    <InstitutionEditForm institution={institution} loading={loading} />
  );
}
