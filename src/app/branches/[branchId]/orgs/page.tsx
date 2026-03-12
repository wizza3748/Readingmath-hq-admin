'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useBranchStore } from '@/lib/branch-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { BranchInstitution, ServiceStatus, ServiceType } from '@/lib/branch-mock';

const INST_DETAIL_URL = '/institutions/zhQ9cSA29ExPK4FlcSDH';

const STATUS_COLORS: Record<ServiceStatus, string> = {
  '정상': 'bg-green-100 text-green-700',
  '무료사용': 'bg-blue-100 text-blue-700',
  '일시정지': 'bg-orange-100 text-orange-700',
  '미납정지': 'bg-red-100 text-red-700',
};

const TYPE_COLORS: Record<string, string> = {
  '가맹전': 'bg-gray-100 text-gray-600',
  '스탠다드': 'bg-indigo-100 text-indigo-700',
  '슬림': 'bg-cyan-100 text-cyan-700',
  '학교': 'bg-yellow-100 text-yellow-700',
};

type SortKey = 'id' | 'name' | 'activeStudents' | 'points' | 'freePoints' | 'registeredAt';
type Dir = 'asc' | 'desc';

function Tag({ text, cls }: { text: string; cls: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{text}</span>;
}

function feeDisplay(inst: BranchInstitution) {
  if (inst.serviceType === '수학+과학') return `${inst.feePerStudent.toLocaleString()}(1과목), ${inst.feePerStudent2.toLocaleString()}(2과목)`;
  return inst.feePerStudent.toLocaleString();
}

export default function BranchOrgsTab() {
  const params = useParams();
  const branchId = Number(params.branchId);
  const { branches } = useBranchStore();
  const branch = useMemo(() => branches.find(b => b.id === branchId), [branches, branchId]);
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<Dir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (!branch) return <p className="text-muted-foreground">지사를 찾을 수 없습니다.</p>;

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const sorted = useMemo(() => {
    const insts = [...branch.institutions];
    return insts.sort((a, b) => {
      const av = sortKey === 'id' ? a.id : sortKey === 'name' ? a.name : sortKey === 'registeredAt' ? a.registeredAt : (a as any)[sortKey];
      const bv = sortKey === 'id' ? b.id : sortKey === 'name' ? b.name : sortKey === 'registeredAt' ? b.registeredAt : (b as any)[sortKey];
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [branch.institutions, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const SortTh = ({ col, label }: { col: SortKey; label: string }) => (
    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground select-none" onClick={() => handleSort(col)}>
      <span className="flex items-center gap-1">{label}
        {col !== sortKey ? <ArrowUpDown className="h-3 w-3 opacity-40" /> : sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      </span>
    </th>
  );

  const pagBtns = () => {
    const s = Math.max(1, page - 2), e = Math.min(totalPages, s + 4);
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  };

  if (branch.institutions.length === 0) {
    return <Card><CardContent className="py-16 text-center text-muted-foreground">등록된 기관이 없습니다.</CardContent></Card>;
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-2.5 border-b">
            <span className="text-sm text-muted-foreground">총 {branch.institutions.length}개 기관</span>
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{[10, 20, 50].map(n => <SelectItem key={n} value={String(n)}>{n}개</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-max">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <SortTh col="id" label="고유번호" />
                  <SortTh col="name" label="기관명" />
                  <SortTh col="activeStudents" label="사용 중 학생 수" />
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">가맹 타입</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">서비스 상태</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">서비스 타입</th>
                  <SortTh col="points" label="포인트" />
                  <SortTh col="freePoints" label="무료 포인트" />
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">최소 이용 금액</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">인당 이용료</th>
                  <SortTh col="registeredAt" label="등록일" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {paged.map(inst => (
                  <tr key={inst.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{inst.id}</td>
                    <td className="px-3 py-2.5">
                      <Link href={INST_DETAIL_URL} className="font-medium hover:underline text-primary">
                        {inst.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-right">{inst.activeStudents.toLocaleString()}명</td>
                    <td className="px-3 py-2.5"><Tag text={inst.memberType} cls={TYPE_COLORS[inst.memberType]} /></td>
                    <td className="px-3 py-2.5"><Tag text={inst.serviceStatus} cls={STATUS_COLORS[inst.serviceStatus]} /></td>
                    <td className="px-3 py-2.5"><Tag text={inst.serviceType} cls="bg-purple-100 text-purple-700" /></td>
                    <td className="px-3 py-2.5 text-right">{inst.points.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right">{inst.freePoints.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right">{inst.minFee.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right text-xs">{feeDisplay(inst)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{inst.registeredAt}</td>
                  </tr>
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
        </CardContent>
      </Card>
    </div>
  );
}
