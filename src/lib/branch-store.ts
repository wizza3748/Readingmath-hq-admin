'use client';
// src/lib/branch-store.ts
// Module-level singleton store – works across "use client" pages without a Provider

import { useSyncExternalStore } from 'react';
import { BRANCHES, SETTLEMENT_MONTHS, type Branch } from './branch-mock';

export interface PaymentRecord {
  isPaid: boolean;
  paymentDate: string | null;
}

interface StoreState {
  branches: Branch[];
  payments: Record<string, PaymentRecord>;
}

// ── Init payments: older months more likely paid ──────────────────────
function initPayments(): Record<string, PaymentRecord> {
  const probs: Record<string, number> = {
    '2025-09': 0.90, '2025-10': 0.85, '2025-11': 0.80,
    '2025-12': 0.75, '2026-01': 0.70, '2026-02': 0,
  };
  const result: Record<string, PaymentRecord> = {};
  BRANCHES.forEach(b => {
    SETTLEMENT_MONTHS.forEach((month, mi) => {
      const threshold = (probs[month] ?? 0.5) * 10;
      const score = ((b.id * 17 + mi * 7) % 10);
      if (score < threshold) {
        const d = new Date(month + '-01');
        d.setMonth(d.getMonth() + 1);
        d.setDate(10 + (b.id % 15));
        result[`${b.id}-${month}`] = { isPaid: true, paymentDate: d.toISOString().split('T')[0] };
      }
    });
  });
  return result;
}

let _state: StoreState = {
  branches: [...BRANCHES],
  payments: initPayments(),
};

const _listeners = new Set<() => void>();
function _emit() { _listeners.forEach(l => l()); }
function _set(s: StoreState) { _state = s; _emit(); }

const _subscribe = (l: () => void) => { _listeners.add(l); return () => { _listeners.delete(l); }; };
const _snap = () => _state;

// ── Public actions ────────────────────────────────────────────────────
export function addBranch(data: Omit<Branch, 'id' | 'institutions' | 'activityLogs'>) {
  const newId = Math.max(0, ..._state.branches.map(b => b.id)) + 1;
  const newBranch: Branch = {
    ...data,
    id: newId,
    institutions: [],
    activityLogs: [{
      id: newId * 1000,
      description: '지사 등록',
      author: '관리자',
      createdAt: new Date().toISOString().split('T')[0],
      detail: { type: 'branch_created', branchId: newId, branchName: data.name },
    }],
  };
  _set({ ..._state, branches: [..._state.branches, newBranch] });
  return newId;
}

export function updateBranch(id: number, updates: Partial<Branch>) {
  _set({
    ..._state,
    branches: _state.branches.map(b =>
      b.id === id
        ? {
            ...b, ...updates,
            activityLogs: [
              {
                id: Date.now(),
                description: '지사 정보 수정',
                author: '관리자',
                createdAt: new Date().toISOString().split('T')[0],
                detail: { type: 'branch_updated', changes: updates },
              },
              ...b.activityLogs,
            ],
          }
        : b
    ),
  });
}

export function markAsPaid(branchId: number, month: string) {
  const key = `${branchId}-${month}`;
  const today = new Date().toISOString().split('T')[0];
  _set({
    ..._state,
    payments: { ..._state.payments, [key]: { isPaid: true, paymentDate: today } },
  });
  // also log to branch
  _set({
    ..._state,
    payments: { ..._state.payments, [key]: { isPaid: true, paymentDate: today } },
    branches: _state.branches.map(b =>
      b.id === branchId
        ? {
            ...b,
            activityLogs: [
              {
                id: Date.now(),
                description: '정산 입금 처리',
                author: '관리자',
                createdAt: today,
                detail: { type: 'payment_processed', month, paymentDate: today },
              },
              ...b.activityLogs,
            ],
          }
        : b
    ),
  });
}

export function getPayment(branchId: number, month: string): PaymentRecord {
  return _state.payments[`${branchId}-${month}`] ?? { isPaid: false, paymentDate: null };
}

// ── React hook ────────────────────────────────────────────────────────
export function useBranchStore() {
  return useSyncExternalStore(_subscribe, _snap, _snap);
}
