'use client';

import React, { useMemo } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useBranchStore } from '@/lib/branch-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Building2, Phone, Mail, CreditCard, Calendar, LogIn } from 'lucide-react';

function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value ?? '-'}</span>
    </div>
  );
}

const TABS = [
  { key: '', label: '지사 정보' },
  { key: 'orgs', label: '등록 기관' },
  { key: 'settlements', label: '정산 내역' },
  { key: 'logs', label: '활동 로그' },
];

export default function BranchDetailLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const branchId = Number(params.branchId);
  const { branches } = useBranchStore();
  const branch = useMemo(() => branches.find(b => b.id === branchId), [branches, branchId]);

  // Determine active tab from path
  const segments = pathname.split('/');
  const lastSeg = segments[segments.length - 1];
  const activeTab = ['orgs', 'settlements', 'logs'].includes(lastSeg) ? lastSeg : '';

  if (!branch) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">지사 정보를 찾을 수 없습니다. (ID: {branchId})</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push('/branches')}>목록으로</Button>
      </div>
    );
  }

  const tabHref = (key: string) =>
    key === '' ? `/branches/${branchId}` : `/branches/${branchId}/${key}`;

  return (
    <div className="p-6 space-y-4">
      {/* 상단 정보 카드 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-2xl font-headline">{branch.name} 지사</CardTitle>
            <Button
              variant="outline" size="sm"
              onClick={() => alert('개발 예정입니다!')}
            >
              <LogIn className="h-4 w-4 mr-1.5" /> 지사 로그인
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-x-6 gap-y-4">
            <InfoItem label="대표자" value={branch.representative} />
            <InfoItem label="대표자 연락처" value={branch.phone} />
            <InfoItem label="대표자 이메일" value={branch.email} />
            <InfoItem label="등록 기관 수" value={`${branch.institutions.length}개`} />
            <InfoItem label="은행(예금주)" value={`${branch.bank}(${branch.accountHolder})`} />
            <InfoItem label="계좌번호" value={branch.accountNumber} />
            <InfoItem label="아이디" value={branch.loginId} />
            <InfoItem label="생성일" value={branch.createdAt} />
          </div>
        </CardContent>
      </Card>

      {/* 탭 바 */}
      <div className="sticky top-14 z-20 bg-background pt-1 pb-2">
        <div className="flex gap-1 border-b">
          {TABS.map(tab => (
            <Link
              key={tab.key}
              href={tabHref(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div>{children}</div>
    </div>
  );
}
