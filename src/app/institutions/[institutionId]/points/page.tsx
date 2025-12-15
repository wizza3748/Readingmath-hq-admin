
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PointsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>포인트내역</CardTitle>
      </CardHeader>
      <CardContent>
        <p>포인트내역이 여기에 표시됩니다.</p>
      </CardContent>
    </Card>
  );
}
