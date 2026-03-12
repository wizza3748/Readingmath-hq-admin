'use client';

import React from 'react';
import SettlementTable from '@/components/app/branches/settlement-table';

export default function BranchSettlementsPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold font-headline">정산 내역</h1>
      <SettlementTable
        showBranchCol={true}
        showSearch={true}
        showExcel={true}
      />
    </div>
  );
}
