'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addBranch, useBranchStore } from '@/lib/branch-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ChevronLeft } from 'lucide-react';

const BANKS = ['국민은행', '신한은행', '하나은행', '우리은행', '기업은행', '농협은행', 'SC제일은행', '카카오뱅크', '케이뱅크', '토스뱅크'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

export default function BranchNewPage() {
  const router = useRouter();
  const { branches } = useBranchStore();

  const [form, setForm] = useState({
    name: '', loginId: '', password: '', representative: '',
    phone: '', email: '', bank: '', accountHolder: '',
    accountNumber: '', memo: '',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [toast, setToast] = useState('');

  const set = (k: keyof typeof form, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const formatPhone = (v: string) => {
    const digits = v.replace(/[^\d]/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = '지사명을 입력하세요.';
    else if (branches.some(b => b.name === form.name.trim())) e.name = '이미 사용 중인 지사명입니다.';
    if (!form.loginId.trim()) e.loginId = '아이디를 입력하세요.';
    else if (branches.some(b => b.loginId === form.loginId.trim())) e.loginId = '이미 사용 중인 아이디입니다.';
    if (!form.password) e.password = '비밀번호를 입력하세요.';
    if (!form.representative.trim()) e.representative = '대표자를 입력하세요.';
    if (!form.phone.trim()) e.phone = '연락처를 입력하세요.';
    if (!form.email.trim()) e.email = '이메일을 입력하세요.';
    else if (!EMAIL_RE.test(form.email)) e.email = '올바른 이메일 형식이 아닙니다.';
    else if (branches.some(b => b.email === form.email.trim())) e.email = '이미 사용 중인 이메일입니다.';
    if (!form.bank) e.bank = '은행을 선택하세요.';
    if (!form.accountHolder.trim()) e.accountHolder = '예금주를 입력하세요.';
    if (!form.accountNumber.trim()) e.accountNumber = '계좌번호를 입력하세요.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const newId = addBranch({
      name: form.name.trim(), code: form.name.trim().slice(0, 2).toUpperCase(),
      representative: form.representative.trim(),
      phone: form.phone, email: form.email.trim(),
      loginId: form.loginId.trim(), password: form.password,
      bank: form.bank, accountHolder: form.accountHolder.trim(),
      accountNumber: form.accountNumber.trim(), memo: form.memo,
      createdAt: new Date().toISOString().split('T')[0],
    });
    setToast('저장되었습니다.');
    setTimeout(() => { router.push('/branches'); }, 1200);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded shadow-lg">
          {toast}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push('/branches')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold font-headline">지사 등록</h1>
      </div>

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="지사명" required>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="지사명" />
            <Err msg={errors.name} />
          </Field>
          <Field label="아이디" required>
            <Input value={form.loginId} onChange={e => set('loginId', e.target.value)} placeholder="branch_xx" />
            <Err msg={errors.loginId} />
          </Field>
          <Field label="비밀번호" required>
            <Input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="비밀번호" />
            <Err msg={errors.password} />
          </Field>
          <Field label="대표자" required>
            <Input value={form.representative} onChange={e => set('representative', e.target.value)} placeholder="대표자" />
            <Err msg={errors.representative} />
          </Field>
          <Field label="대표자 연락처" required>
            <Input
              value={form.phone}
              onChange={e => set('phone', formatPhone(e.target.value))}
              placeholder="010-0000-0000" maxLength={13}
            />
            <Err msg={errors.phone} />
          </Field>
          <Field label="대표자 이메일" required>
            <Input value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            <Err msg={errors.email} />
          </Field>
          <Field label="은행" required>
            <Select value={form.bank} onValueChange={v => set('bank', v)}>
              <SelectTrigger><SelectValue placeholder="은행 선택" /></SelectTrigger>
              <SelectContent>{BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
            <Err msg={errors.bank} />
          </Field>
          <Field label="예금주" required>
            <Input value={form.accountHolder} onChange={e => set('accountHolder', e.target.value)} placeholder="예금주" />
            <Err msg={errors.accountHolder} />
          </Field>
          <Field label="계좌번호" required>
            <Input
              value={form.accountNumber}
              onChange={e => set('accountNumber', e.target.value.replace(/[^\d]/g, ''))}
              placeholder="숫자만 입력"
            />
            <Err msg={errors.accountNumber} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="메모">
              <Textarea
                value={form.memo} rows={3} maxLength={500}
                onChange={e => set('memo', e.target.value)}
                placeholder="메모 (최대 500자)"
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{form.memo.length}/500</p>
            </Field>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => router.push('/branches')}>취소</Button>
        <Button onClick={handleSave}>저장</Button>
      </div>
    </div>
  );
}
