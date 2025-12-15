
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Institution } from "@/lib/institutions";


export default function InquiriesPage({ institution, loading }: { institution: Institution | null, loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>문의내역</CardTitle>
      </CardHeader>
      <CardContent>
        <p>문의내역이 여기에 표시됩니다.</p>
      </CardContent>
    </Card>
  );
}
