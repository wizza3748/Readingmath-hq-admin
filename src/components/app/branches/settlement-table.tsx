'use client';
/**
 * 공유 정산 테이블 컴포넌트
 * - /branches/[branchId]/settlements  (지사 고정, 검색 없음)
 * - /branch-settlements               (전체 지사, 검색 있음, CSV 다운로드)
 */
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useBranchStore, markAsPaid, getPayment } from '@/lib/branch-store';
import { calcBranchMonthly, calcAllSettlements, formatKRW } from '@/lib/branch-settlement-utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Download, X } from 'lucide-react';
import { SETTLEMENT_MONTHS } from '@/lib/branch-mock';
import { BranchMonthlySettlement } from '@/lib/branch-settlement-utils';
import Link from 'next/link';

interface Props {
  fixedBranchId?: number; // 지사 상세 탭에서 사용 시 지사 ID 고정
  showBranchCol?: boolean;
  showSearch?: boolean;
  showExcel?: boolean;
}

type SortKey = 'seq' | 'month';
type Dir = 'asc' | 'desc';

const SMONTHS_DISPLAY: Record<string, string> = {
  '2025-09': '2025년 9월', '2025-10': '2025년 10월', '2025-11': '2025년 11월',
  '2025-12': '2025년 12월', '2026-01': '2026년 1월', '2026-02': '2026년 2월',
};

/** 현재 날짜 기준 이전달을 'YYYY-MM' 형식으로 반환 */
function getPrevMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  // SETTLEMENT_MONTHS에 없으면 마지막 월로 fallback
  return SETTLEMENT_MONTHS.includes(m) ? m : SETTLEMENT_MONTHS[SETTLEMENT_MONTHS.length - 1];
}

export default function SettlementTable({ fixedBranchId, showBranchCol = true, showSearch = true, showExcel = true }: Props) {
  const router = useRouter();
  const { branches, payments } = useBranchStore();
  const [filterBranch, setFilterBranch] = useState('__all_branch__');
  const [filterMonth, setFilterMonth] = useState('__all_month__');
  const [sortKey, setSortKey] = useState<SortKey>('month');
  const [sortDir, setSortDir] = useState<Dir>('desc');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [payModal, setPayModal] = useState<{ branchId: number; month: string } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  // Build all settlement records (computed)
  const allSettlements = useMemo(() => {
    let list: (BranchMonthlySettlement & { seq: number })[] = [];
    let seq = 1;
    // 오래된 달부터 seq 부여 → 최신 달이 높은 번호
    for (const month of SETTLEMENT_MONTHS) {
      for (const branch of branches) {
        const key = `${branch.id}-${month}`;
        const p = payments[key] ?? { isPaid: false, paymentDate: null };
        const s = calcBranchMonthly(branch, month, p.isPaid, p.paymentDate);
        list.push({ ...s, seq: seq++ });
      }
    }
    return list;
  }, [branches, payments]);

  const filtered = useMemo(() => {
    return allSettlements.filter(s => {
      if (fixedBranchId !== undefined && s.branchId !== fixedBranchId) return false;
      if (filterBranch !== '__all_branch__' && !fixedBranchId && s.branchId !== Number(filterBranch)) return false;
      if (filterMonth !== '__all_month__' && s.month !== filterMonth) return false;
      return true;
    });
  }, [allSettlements, fixedBranchId, filterBranch, filterMonth]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = sortKey === 'seq' ? a.seq : a.month;
      const bv = sortKey === 'seq' ? b.seq : b.month;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  };

  const handlePay = () => {
    if (!payModal) return;
    markAsPaid(payModal.branchId, payModal.month);
    setPayModal(null);
    showToast('입금 처리가 완료되었습니다.');
  };

  const handleCsvDownload = () => {
    const rows = [
      ['고유번호', '정산월', '지사명', '기관수', '유료포인트사용', '무료포인트사용', '가맹비', '최소이용과금', '이용료정산', '가맹비정산', '총정산금액', '지급일'],
      ...sorted.map((s, i) => [
        i + 1, s.month, s.branchName, s.institutionCount,
        s.totalPaidPointsUsed, s.totalFreePointsUsed, s.totalMembershipFee, s.totalMinCharge,
        s.totalUsageFeeSettlement, s.totalMembershipFeeSettlement, s.totalSettlement,
        s.paymentDate ?? '미입금',
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'settlements.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const SortTh = ({ col, label, right }: { col: SortKey; label: string; right?: boolean }) => (
    <th className={`px-3 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground select-none ${right ? 'text-right' : 'text-left'}`} onClick={() => handleSort(col)}>
      <span className={`flex items-center gap-1 ${right ? 'justify-end' : ''}`}>{label}
        {col !== sortKey ? <ArrowUpDown className="h-3 w-3 opacity-40" /> : sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      </span>
    </th>
  );

  const pagBtns = () => { const s = Math.max(1, page - 2), e = Math.min(totalPages, s + 4); return Array.from({ length: e - s + 1 }, (_, i) => s + i); };

  return (
    <div className="space-y-3">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded shadow-lg">{toast}</div>}

      {/* 검색 영역 */}
      {showSearch && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border">
          {!fixedBranchId && (
            <Select value={filterBranch} onValueChange={v => { setFilterBranch(v); setPage(1); }}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="전체 지사" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all_branch__">전체 지사</SelectItem>
                {branches.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={filterMonth} onValueChange={v => { setFilterMonth(v); setPage(1); }}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="전체 연월" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all_month__">전체 연월</SelectItem>
              {SETTLEMENT_MONTHS.map(m => <SelectItem key={m} value={m}>{SMONTHS_DISPLAY[m]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => { setFilterBranch('__all_branch__'); setFilterMonth('__all_month__'); setPage(1); }}>초기화</Button>
          {showExcel && (
            <Button size="sm" className="ml-auto gap-1.5" onClick={handleCsvDownload}>
              <Download className="h-4 w-4" /> 엑셀 다운로드
            </Button>
          )}
        </div>
      )}

      {/* 테이블 */}
      <div className="rounded-lg border overflow-hidden bg-card">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="text-sm text-muted-foreground">총 {filtered.length}건</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-max">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-2 py-2.5 w-8"></th>
                <SortTh col="seq" label="고유번호" />
                <SortTh col="month" label="정산월" />
                {showBranchCol && <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">지사명</th>}
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">기관수</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">유료포인트 사용</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">무료포인트 사용</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">무료포인트 환불</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">가맹비</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">최소이용과금</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">이용료 정산</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">가맹비 정산</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap font-semibold">총 정산금액</th>
                <th className="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">지급일</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.length === 0 && <tr><td colSpan={14} className="text-center py-10 text-muted-foreground">데이터가 없습니다.</td></tr>}
              {paged.map((s, idx) => (
                <React.Fragment key={s.id}>
                  <tr className={`hover:bg-muted/20 transition-colors ${expandedIds.has(s.id) ? 'bg-muted/10' : ''}`}>
                    <td className="px-2 py-2.5">
                      {s.institutionCount > 0 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpand(s.id)}>
                          {expandedIds.has(s.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground text-xs">{s.seq}</td>
                    <td className="px-3 py-2.5">{SMONTHS_DISPLAY[s.month] ?? s.month}</td>
                    {showBranchCol && (
                      <td className="px-3 py-2.5">
                        <Link href={`/branches/${s.branchId}`} className="font-medium hover:underline text-primary">{s.branchName}</Link>
                      </td>
                    )}
                    <td className="px-3 py-2.5 text-right">{s.institutionCount}</td>
                    <td className="px-3 py-2.5 text-right">{formatKRW(s.totalPaidPointsUsed)}</td>
                    <td className="px-3 py-2.5 text-right">{formatKRW(s.totalFreePointsUsed)}</td>
                    <td className="px-3 py-2.5 text-right">{formatKRW(s.totalFreePointsRefund)}</td>
                    <td className="px-3 py-2.5 text-right">{formatKRW(s.totalMembershipFee)}</td>
                    <td className="px-3 py-2.5 text-right">{formatKRW(s.totalMinCharge)}</td>
                    <td className="px-3 py-2.5 text-right">{formatKRW(s.totalUsageFeeSettlement)}</td>
                    <td className="px-3 py-2.5 text-right">{formatKRW(s.totalMembershipFeeSettlement)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{formatKRW(s.totalSettlement)}</td>
                    <td className="px-3 py-2.5 text-center">
                      {s.isPaid ? (
                        <span className="text-xs text-muted-foreground">{s.paymentDate}</span>
                      ) : (
                        <Button size="sm" variant="default" className="h-6 text-xs px-2 py-0" onClick={() => setPayModal({ branchId: s.branchId, month: s.month })}>
                          입금
                        </Button>
                      )}
                    </td>
                  </tr>

                  {/* 행 확장: 기관 정산 상세 */}
                  {expandedIds.has(s.id) && (
                    <tr>
                      <td colSpan={showBranchCol ? 15 : 14} className="p-0 bg-muted/20">
                        <div className="p-3 pl-10">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">기관별 정산 상세</p>
                          <table className="w-full text-xs min-w-max">
                            <thead className="bg-muted border-b">
                              <tr>
                                {['기관명','상태','유료포인트','무료포인트','무료포인트환불','가맹비','최소이용과금','수동지급/차감','이용료 정산','가맹비 정산','총 정산금액'].map(h => (
                                  <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {s.institutions.map(inst => (
                                <tr key={inst.institutionId} className="hover:bg-muted/30">
                                  <td className="px-2 py-1.5">{inst.institutionName}</td>
                                  <td className="px-2 py-1.5"><span className="bg-card px-1.5 py-0.5 rounded text-xs border">{inst.status}</span></td>
                                  <td className="px-2 py-1.5 text-right">{formatKRW(inst.paidPointsUsed)}</td>
                                  <td className="px-2 py-1.5 text-right">{formatKRW(inst.freePointsUsed)}</td>
                                  <td className="px-2 py-1.5 text-right">{formatKRW(inst.freePointsRefund)}</td>
                                  <td className="px-2 py-1.5 text-right">{formatKRW(inst.membershipFee)}</td>
                                  <td className="px-2 py-1.5 text-right">{formatKRW(inst.minCharge)}</td>
                                  <td className={`px-2 py-1.5 text-right ${inst.manualAdjustment < 0 ? 'text-red-600' : ''}`}>{formatKRW(inst.manualAdjustment)}</td>
                                  <td className="px-2 py-1.5 text-right font-medium">{formatKRW(inst.usageFeeSettlement)}</td>
                                  <td className="px-2 py-1.5 text-right font-medium">{formatKRW(inst.membershipFeeSettlement)}</td>
                                  <td className="px-2 py-1.5 text-right font-bold">{formatKRW(inst.totalSettlement)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center gap-1 p-3 border-t">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</Button>
          {pagBtns().map(p => <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)}>{p}</Button>)}
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</Button>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</Button>
        </div>
      </div>

      {/* 입금 처리 모달 */}
      {payModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPayModal(null)}>
          <div className="bg-background rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">정산 입금처리</h3>
              <Button variant="ghost" size="icon" onClick={() => setPayModal(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-6 text-sm text-muted-foreground">입금완료 하시겠습니까?</div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <Button variant="outline" onClick={() => setPayModal(null)}>취소</Button>
              <Button onClick={handlePay}>확인</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
