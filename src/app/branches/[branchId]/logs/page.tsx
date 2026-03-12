'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useBranchStore } from '@/lib/branch-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, RotateCcw, Eye, X } from 'lucide-react';
import { ActivityLog } from '@/lib/branch-mock';

type SortKey = 'id' | 'createdAt';
type Dir = 'asc' | 'desc';

export default function BranchLogsTab() {
  const params = useParams();
  const branchId = Number(params.branchId);
  const { branches } = useBranchStore();
  const branch = useMemo(() => branches.find(b => b.id === branchId), [branches, branchId]);

  const [descQuery, setDescQuery] = useState('');
  const [descInput, setDescInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateErr, setDateErr] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<Dir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modal, setModal] = useState<ActivityLog | null>(null);

  if (!branch) return <p className="text-muted-foreground">지사를 찾을 수 없습니다.</p>;

  const handleSearch = () => {
    if (descInput.trim().length > 0 && descInput.trim().replace(/\s/g, '').length < 2) return;
    if (dateFrom && dateTo && dateFrom > dateTo) { setDateErr('시작일은 종료일보다 이전이어야 합니다.'); return; }
    setDateErr('');
    setDescQuery(descInput.trim());
    setPage(1);
  };

  const handleReset = () => { setDescInput(''); setDescQuery(''); setDateFrom(''); setDateTo(''); setDateErr(''); setPage(1); };

  const filtered = useMemo(() => {
    return branch.activityLogs.filter(log => {
      if (descQuery && !log.description.includes(descQuery)) return false;
      if (dateFrom && log.createdAt < dateFrom) return false;
      if (dateTo && log.createdAt > dateTo) return false;
      return true;
    });
  }, [branch.activityLogs, descQuery, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = sortKey === 'id' ? a.id : a.createdAt;
      const bv = sortKey === 'id' ? b.id : b.createdAt;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  };

  const SortTh = ({ col, label }: { col: SortKey; label: string }) => (
    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground select-none" onClick={() => handleSort(col)}>
      <span className="flex items-center gap-1">{label}
        {col !== sortKey ? <ArrowUpDown className="h-3 w-3 opacity-40" /> : sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      </span>
    </th>
  );

  const pagBtns = () => { const s = Math.max(1, page - 2), e = Math.min(totalPages, s + 4); return Array.from({ length: e - s + 1 }, (_, i) => s + i); };

  return (
    <div className="space-y-3">
      {/* Search */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-44">
              <Input
                placeholder="설명 검색 (2자 이상)"
                value={descInput}
                onChange={e => setDescInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" className="w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <span className="text-muted-foreground text-sm">~</span>
              <Input type="date" className="w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <Button size="sm" onClick={handleSearch}><Search className="h-4 w-4 mr-1" />검색</Button>
            <Button size="sm" variant="outline" onClick={handleReset}><RotateCcw className="h-4 w-4 mr-1" />초기화</Button>
          </div>
          {dateErr && <p className="text-xs text-destructive mt-2">{dateErr}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-2.5 border-b">
            <span className="text-sm text-muted-foreground">총 {filtered.length}건</span>
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{[10, 20, 50].map(n => <SelectItem key={n} value={String(n)}>{n}개</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <SortTh col="id" label="고유번호" />
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">설명</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">작성자</th>
                  <SortTh col="createdAt" label="등록일" />
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paged.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">검색 결과가 없습니다.</td></tr>}
                {paged.map(log => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-muted-foreground text-xs">{log.id}</td>
                    <td className="px-3 py-2.5">{log.description}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{log.author}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{log.createdAt}</td>
                    <td className="px-3 py-2.5">
                      <Button variant="ghost" size="icon" onClick={() => setModal(log)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
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

      {/* 상세 모달 */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">{modal.description} — 로그 상세</h3>
              <Button variant="ghost" size="icon" onClick={() => setModal(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="overflow-auto flex-1 p-4">
              <pre className="text-xs font-mono bg-muted rounded p-4 whitespace-pre-wrap break-all">
                {JSON.stringify(modal.detail, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end p-4 border-t">
              <Button onClick={() => setModal(null)}>확인</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
