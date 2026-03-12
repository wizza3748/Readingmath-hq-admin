'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useBranchStore } from '@/lib/branch-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Plus, ArrowUpDown, ArrowUp, ArrowDown, Search, RotateCcw } from 'lucide-react';
import { Branch } from '@/lib/branch-mock';
import Link from 'next/link';

type SortKey = 'id' | 'name' | 'institutionCount' | 'createdAt';
type SortDir = 'asc' | 'desc';

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

export default function BranchListPage() {
  const router = useRouter();
  const { branches } = useBranchStore();
  const [query, setQuery] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const handleSearch = () => {
    const q = inputVal.trim();
    if (q.length < 2) return;
    setQuery(q); setPage(1);
  };

  const handleReset = () => { setInputVal(''); setQuery(''); setPage(1); };

  const filtered = useMemo(() => {
    const q = query.replace(/\s/g, '').toLowerCase();
    if (!q) return branches;
    return branches.filter(b =>
      b.name.replace(/\s/g, '').toLowerCase().includes(q) ||
      b.representative.replace(/\s/g, '').toLowerCase().includes(q) ||
      b.phone.replace(/[-\s]/g, '').includes(q.replace(/[-\s]/g, ''))
    );
  }, [branches, query]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortKey === 'id') { av = a.id; bv = b.id; }
      else if (sortKey === 'name') { av = a.name; bv = b.name; }
      else if (sortKey === 'institutionCount') { av = a.institutions.length; bv = b.institutions.length; }
      else { av = a.createdAt; bv = b.createdAt; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const SortTh = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-foreground select-none"
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon col={col} sortKey={sortKey} dir={sortDir} />
      </span>
    </th>
  );

  const pagBtns = () => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">지사 목록</h1>
        <Button onClick={() => router.push('/branches/new')} size="sm">
          <Plus className="h-4 w-4 mr-1" /> 지사 등록
        </Button>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2">
            <Input
              className="max-w-xs"
              placeholder="지사명 / 대표자 / 연락처 검색 (2자 이상)"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <Button size="sm" onClick={handleSearch} disabled={inputVal.trim().length < 2}>
              <Search className="h-4 w-4 mr-1" /> 검색
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" /> 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 테이블 */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-2.5 border-b">
            <span className="text-sm text-muted-foreground">총 {filtered.length}개 지사</span>
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map(n => (
                  <SelectItem key={n} value={String(n)}>{n}개</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <SortTh col="id" label="고유번호" />
                  <SortTh col="name" label="지사명" />
                  <SortTh col="institutionCount" label="등록 기관 수" />
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">대표자</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">대표자 연락처</th>
                  <SortTh col="createdAt" label="생성일" />
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">편집</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paged.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">검색 결과가 없습니다.</td></tr>
                )}
                {paged.map((b: Branch) => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{b.id}</td>
                    <td className="px-3 py-2.5">
                      <Link href={`/branches/${b.id}`} className="font-medium hover:underline text-primary">
                        {b.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">{b.institutions.length}개</td>
                    <td className="px-3 py-2.5">{b.representative}</td>
                    <td className="px-3 py-2.5 font-mono text-sm">{b.phone}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{b.createdAt}</td>
                    <td className="px-3 py-2.5">
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => router.push(`/branches/${b.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 페이징 */}
          <div className="flex items-center justify-center gap-1 p-3 border-t">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</Button>
            {pagBtns().map(p => (
              <Button
                key={p} size="sm"
                variant={p === page ? 'default' : 'outline'}
                onClick={() => setPage(p)}
              >{p}</Button>
            ))}
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
