
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Institution } from "@/lib/institutions";


export default function TeachersPage({ institution, loading }: { institution?: Institution | null, loading?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>선생님목록</CardTitle>
      </CardHeader>
      <CardContent>
        <p>선생님목록이 여기에 표시됩니다.</p>
      </CardContent>
    </Card>
  );
}
