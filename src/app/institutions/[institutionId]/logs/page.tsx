
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Institution } from "@/lib/institutions";


export default function LogsPage({ institution, loading }: { institution?: Institution | null, loading?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>활동로그</CardTitle>
      </CardHeader>
      <CardContent>
        <p>활동로그가 여기에 표시됩니다.</p>
      </CardContent>
    </Card>
  );
}
