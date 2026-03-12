'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useBranchStore } from '@/lib/branch-store';
import SettlementTable from '@/components/app/branches/settlement-table';

export default function BranchSettlementsTab() {
  const params = useParams();
  const branchId = Number(params.branchId);
  const { branches } = useBranchStore();
  const branch = useMemo(() => branches.find(b => b.id === branchId), [branches, branchId]);

  if (!branch) return <p className="text-muted-foreground">지사를 찾을 수 없습니다.</p>;

  return (
    <SettlementTable
      fixedBranchId={branchId}
      showBranchCol={false}
      showSearch={true}
      showExcel={false}
    />
  );
}
