'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBranchStore, updateBranch } from '@/lib/branch-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

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
  return msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;
}

export default function BranchInfoTab() {
  const params = useParams();
  const router = useRouter();
  const branchId = Number(params.branchId);
  const { branches } = useBranchStore();
  const branch = useMemo(() => branches.find(b => b.id === branchId), [branches, branchId]);

  const [form, setForm] = useState(() => branch ? {
    name: branch.name, loginId: branch.loginId, password: '',
    representative: branch.representative, phone: branch.phone,
    email: branch.email, bank: branch.bank,
    accountHolder: branch.accountHolder, accountNumber: branch.accountNumber,
    memo: branch.memo,
  } : { name:'',loginId:'',password:'',representative:'',phone:'',email:'',bank:'',accountHolder:'',accountNumber:'',memo:'' });

  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [toast, setToast] = useState('');
  const [dirty, setDirty] = useState(false);

  if (!branch) return <p className="text-muted-foreground p-4">지사를 찾을 수 없습니다.</p>;

  const set = (k: keyof typeof form, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
    setDirty(true);
  };

  const formatPhone = (v: string) => {
    const d = v.replace(/[^\d]/g, '');
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0,3)}-${d.slice(3)}`;
    return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7,11)}`;
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = '지사명을 입력하세요.';
    else if (branches.some(b => b.name === form.name.trim() && b.id !== branchId)) e.name = '이미 사용 중인 지사명입니다.';
    if (!form.loginId.trim()) e.loginId = '아이디를 입력하세요.';
    else if (branches.some(b => b.loginId === form.loginId.trim() && b.id !== branchId)) e.loginId = '이미 사용 중인 아이디입니다.';
    if (!form.representative.trim()) e.representative = '대표자를 입력하세요.';
    if (!form.phone.trim()) e.phone = '연락처를 입력하세요.';
    if (!form.email.trim()) e.email = '이메일을 입력하세요.';
    else if (!EMAIL_RE.test(form.email)) e.email = '올바른 이메일 형식이 아닙니다.';
    else if (branches.some(b => b.email === form.email.trim() && b.id !== branchId)) e.email = '이미 사용 중인 이메일입니다.';
    if (!form.bank) e.bank = '은행을 선택하세요.';
    if (!form.accountHolder.trim()) e.accountHolder = '예금주를 입력하세요.';
    if (!form.accountNumber.trim()) e.accountNumber = '계좌번호를 입력하세요.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    updateBranch(branchId, {
      name: form.name.trim(), loginId: form.loginId.trim(),
      representative: form.representative.trim(),
      phone: form.phone, email: form.email.trim(),
      bank: form.bank, accountHolder: form.accountHolder.trim(),
      accountNumber: form.accountNumber.trim(), memo: form.memo,
    });
    setDirty(false);
    showToast('저장되었습니다.');
  };

  const handleCancel = () => {
    if (dirty && !confirm('변경 사항을 저장하지 않고 되돌리겠습니까?')) return;
    setForm({
      name: branch.name, loginId: branch.loginId, password: '',
      representative: branch.representative, phone: branch.phone,
      email: branch.email, bank: branch.bank,
      accountHolder: branch.accountHolder, accountNumber: branch.accountNumber,
      memo: branch.memo,
    });
    setErrors({});
    setDirty(false);
  };

  const handleGoList = () => {
    if (dirty && !confirm('저장되지 않은 변경 사항이 있습니다. 목록으로 이동하겠습니까?')) return;
    router.push('/branches');
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm font-medium px-4 py-2 rounded shadow-lg">
          {toast}
        </div>
      )}
      <Card>
        <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="지사명" required>
            <Input value={form.name} onChange={e => set('name', e.target.value)} />
            <Err msg={errors.name} />
          </Field>
          <Field label="아이디" required>
            <Input value={form.loginId} onChange={e => set('loginId', e.target.value)} />
            <Err msg={errors.loginId} />
          </Field>
          <Field label="비밀번호">
            <Input type="password" value={form.password} placeholder="변경 시에만 입력" onChange={e => set('password', e.target.value)} />
          </Field>
          <Field label="대표자" required>
            <Input value={form.representative} onChange={e => set('representative', e.target.value)} />
            <Err msg={errors.representative} />
          </Field>
          <Field label="대표자 연락처" required>
            <Input value={form.phone} onChange={e => set('phone', formatPhone(e.target.value))} maxLength={13} />
            <Err msg={errors.phone} />
          </Field>
          <Field label="대표자 이메일" required>
            <Input value={form.email} onChange={e => set('email', e.target.value)} />
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
            <Input value={form.accountHolder} onChange={e => set('accountHolder', e.target.value)} />
            <Err msg={errors.accountHolder} />
          </Field>
          <Field label="계좌번호" required>
            <Input value={form.accountNumber} onChange={e => set('accountNumber', e.target.value.replace(/[^\d]/g, ''))} />
            <Err msg={errors.accountNumber} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="메모">
              <Textarea value={form.memo} rows={3} maxLength={500} onChange={e => set('memo', e.target.value)} />
              <p className="text-xs text-right text-muted-foreground mt-1">{form.memo.length}/500</p>
            </Field>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleGoList}>목록</Button>
        <Button variant="outline" onClick={handleCancel} disabled={!dirty}>취소</Button>
        <Button onClick={handleSave}>저장</Button>
      </div>
    </div>
  );
}
