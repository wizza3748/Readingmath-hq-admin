
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PaymentsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>결제내역</CardTitle>
      </CardHeader>
      <CardContent>
        <p>결제내역이 여기에 표시됩니다.</p>
      </CardContent>
    </Card>
  );
}
