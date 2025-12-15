
"use client";

import { InstitutionEditForm } from "@/components/app/institutions/edit-form";
import type { Institution } from "@/lib/institutions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function InstitutionInfoPage({ institution, loading }: { institution: Institution | null, loading: boolean }) {
  
  if (loading) {
    return <InstitutionEditForm institution={null} loading={true} />;
  }

  if (!institution) {
     return (
        <Card>
            <CardHeader>
                <CardTitle>기관 정보 없음</CardTitle>
            </CardHeader>
            <CardContent>
                <p>해당 기관 정보를 찾을 수 없습니다.</p>
            </CardContent>
        </Card>
     )
  }

  return (
    <InstitutionEditForm institution={institution} loading={false} />
  );
}
