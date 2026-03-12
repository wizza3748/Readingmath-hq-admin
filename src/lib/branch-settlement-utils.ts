// src/lib/branch-settlement-utils.ts
// Pure calculation functions – no side effects

import type { Branch, BranchInstitution, MonthlySource } from './branch-mock';

export interface InstitutionSettlement {
  institutionId: number;
  institutionName: string;
  status: string;
  paidPointsUsed: number;
  freePointsUsed: number;
  freePointsRefund: number;
  membershipFee: number;
  minCharge: number;
  manualAdjustment: number;
  usageFeeSettlement: number;    // 유료포인트 사용 + 최소이용과금 + 수동지급/차감
  membershipFeeSettlement: number; // = 가맹비
  totalSettlement: number;         // = 이용료 + 가맹비
}

export interface BranchMonthlySettlement {
  id: string; // `${branchId}-${month}`
  branchId: number;
  branchName: string;
  month: string;
  institutionCount: number;
  institutions: InstitutionSettlement[];
  totalPaidPointsUsed: number;
  totalFreePointsUsed: number;
  totalFreePointsRefund: number;
  totalMembershipFee: number;
  totalMinCharge: number;
  totalUsageFeeSettlement: number;
  totalMembershipFeeSettlement: number;
  totalSettlement: number;
  isPaid: boolean;
  paymentDate: string | null;
}

export function calcInstSettlement(
  inst: BranchInstitution,
  src: MonthlySource
): InstitutionSettlement {
  const usageFeeSettlement = src.paidPointsUsed + src.minCharge + src.manualAdjustment;
  const membershipFeeSettlement = src.membershipFee;
  return {
    institutionId: inst.id,
    institutionName: inst.name,
    status: inst.serviceStatus,
    paidPointsUsed: src.paidPointsUsed,
    freePointsUsed: src.freePointsUsed,
    freePointsRefund: src.freePointsRefund,
    membershipFee: src.membershipFee,
    minCharge: src.minCharge,
    manualAdjustment: src.manualAdjustment,
    usageFeeSettlement,
    membershipFeeSettlement,
    totalSettlement: usageFeeSettlement + membershipFeeSettlement,
  };
}

export function calcBranchMonthly(
  branch: Branch,
  month: string,
  isPaid: boolean,
  paymentDate: string | null
): BranchMonthlySettlement {
  const institutions: InstitutionSettlement[] = branch.institutions
    .map(inst => {
      const src = inst.monthlySources.find(s => s.month === month);
      return src ? calcInstSettlement(inst, src) : null;
    })
    .filter(Boolean) as InstitutionSettlement[];

  const sumN = (key: keyof InstitutionSettlement) =>
    institutions.reduce((a, s) => a + (s[key] as number), 0);

  return {
    id: `${branch.id}-${month}`,
    branchId: branch.id,
    branchName: branch.name,
    month,
    institutionCount: branch.institutions.length,
    institutions,
    totalPaidPointsUsed: sumN('paidPointsUsed'),
    totalFreePointsUsed: sumN('freePointsUsed'),
    totalFreePointsRefund: sumN('freePointsRefund'),
    totalMembershipFee: sumN('membershipFee'),
    totalMinCharge: sumN('minCharge'),
    totalUsageFeeSettlement: sumN('usageFeeSettlement'),
    totalMembershipFeeSettlement: sumN('membershipFeeSettlement'),
    totalSettlement: sumN('totalSettlement'),
    isPaid,
    paymentDate,
  };
}

export function calcAllSettlements(
  branches: Branch[],
  payments: Record<string, { isPaid: boolean; paymentDate: string | null }>
): BranchMonthlySettlement[] {
  const result: BranchMonthlySettlement[] = [];
  let seq = 1;
  // Descending: newest month first, then by branchId
  for (const month of [...['2025-09','2025-10','2025-11','2025-12','2026-01','2026-02']].reverse()) {
    for (const branch of branches) {
      const key = `${branch.id}-${month}`;
      const p = payments[key] ?? { isPaid: false, paymentDate: null };
      const s = calcBranchMonthly(branch, month, p.isPaid, p.paymentDate);
      (s as any).seq = seq++;
      result.push(s);
    }
  }
  return result;
}

export function formatKRW(n: number): string {
  return n.toLocaleString('ko-KR');
}
