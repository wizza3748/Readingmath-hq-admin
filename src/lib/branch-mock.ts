// src/lib/branch-mock.ts
// Branch mock data – No Firebase, no API

export type MemberType = '가맹전' | '스탠다드' | '슬림' | '학교';
export type ServiceStatus = '정상' | '무료사용' | '일시정지' | '미납정지';
export type ServiceType = '수학+과학' | '수학' | '과학';

export interface MonthlySource {
  month: string;
  paidPointsUsed: number;
  freePointsUsed: number;
  freePointsRefund: number;
  membershipFee: number;
  minCharge: number;
  manualAdjustment: number;
}

export interface BranchInstitution {
  id: number;
  name: string;
  activeStudents: number;
  memberType: MemberType;
  serviceStatus: ServiceStatus;
  serviceType: ServiceType;
  points: number;
  freePoints: number;
  minFee: number;
  feePerStudent: number;
  feePerStudent2: number;
  registeredAt: string;
  monthlySources: MonthlySource[];
}

export interface ActivityLog {
  id: number;
  description: string;
  author: string;
  createdAt: string;
  detail: Record<string, unknown>;
}

export interface Branch {
  id: number;
  name: string;
  code: string;
  representative: string;
  phone: string;
  email: string;
  loginId: string;
  password: string;
  bank: string;
  accountHolder: string;
  accountNumber: string;
  memo: string;
  createdAt: string;
  institutions: BranchInstitution[];
  activityLogs: ActivityLog[];
}

export const SETTLEMENT_MONTHS = [
  '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02',
];

// ── Seeded RNG ────────────────────────────────────────────────────────
class RNG {
  private s: number;
  constructor(seed: number) { this.s = (seed + 1) * 12345 >>> 0; }
  next(): number { this.s = (Math.imul(this.s, 1664525) + 1013904223) >>> 0; return this.s / 0x100000000; }
  int(min: number, max: number) { return Math.floor(this.next() * (max - min + 1)) + min; }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)]; }
  pickW<T>(arr: T[], w: number[]): T {
    let r = this.next() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; }
    return arr[arr.length - 1];
  }
  date(s: Date, e: Date): string {
    return new Date(s.getTime() + this.next() * (e.getTime() - s.getTime())).toISOString().split('T')[0];
  }
}

// ── Data pools ────────────────────────────────────────────────────────
const SN = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];
const GN = ['지훈', '민준', '서준', '도윤', '주원', '하준', '지성', '현우', '재원', '수빈', '지은', '채원', '하은', '수아', '지아', '현서', '민지', '서연', '예은', '지원'];
const BANKS = ['국민은행', '신한은행', '하나은행', '우리은행', '기업은행', '농협은행', 'SC제일은행', '카카오뱅크', '케이뱅크', '토스뱅크'];
const AREAS = ['강동', '노원', '마포', '종로', '서초', '용산', '영등포', '동대문', '관악', '구로', '금천', '중랑', '성북', '도봉', '은평', '양천', '화곡', '목동', '신림', '잠실', '송파', '분당', '상계', '중계', '무실', '효자', '팔달', '수정', '명일', '둔촌'];
const SUFX = ['리딩수학학원', '수학과학학원', '리딩과학학원', '영재수학학원', '사고력수학학원', '열린학원', '클래스수학학원', '에듀학원', '과학탐구학원', '창의수학학원'];
const LOG_DESCS = ['지사 등록', '지사 정보 수정', '계좌 정보 수정', '정산 입금 처리', '메모 수정'];
const LOG_TYPES = ['branch_created', 'branch_updated', 'account_updated', 'payment_processed', 'memo_updated'];
const HQ = ['관리자', '김민준', '이서준', '박지호', '최현우', '정수빈'];
const MTYPES: MemberType[] = ['가맹전', '스탠다드', '슬림', '학교'];
const MW = [10, 45, 30, 15];
const SSTATS: ServiceStatus[] = ['정상', '무료사용', '일시정지', '미납정지'];
const SW = [60, 20, 10, 10];
const STYPES: ServiceType[] = ['수학+과학', '수학', '과학'];
const STW = [50, 30, 20];
const MF = [0, 50000, 100000];
const MC = [0, 30000, 50000, 100000];

// ── Counters ──────────────────────────────────────────────────────────
let _instId = 1;
let _logId = 1;

function genName(r: RNG) { return r.pick(SN) + r.pick(GN); }
function genPhone(r: RNG) { return `010-${r.int(1000, 9999)}-${r.int(1000, 9999)}`; }
function genAccount(r: RNG) { return Array.from({ length: r.int(10, 14) }, () => r.int(0, 9)).join(''); }

function genInstitution(r: RNG): BranchInstitution {
  const serviceType = r.pickW(STYPES, STW);
  return {
    id: _instId++,
    name: `${r.pick(AREAS)} ${r.pick(SUFX)}`,
    activeStudents: r.int(5, 120),
    memberType: r.pickW(MTYPES, MW),
    serviceStatus: r.pickW(SSTATS, SW),
    serviceType,
    points: r.int(0, 1000000),
    freePoints: r.int(0, 500000),
    minFee: r.pick([0, 30000, 50000, 100000]),
    feePerStudent: r.pick([8000, 10000, 12000, 15000]),
    feePerStudent2: r.pick([13000, 15000, 18000, 20000]),
    registeredAt: r.date(new Date('2023-01-01'), new Date('2026-03-11')),
    monthlySources: SETTLEMENT_MONTHS.map(month => {
      const paidPointsUsed = r.int(0, 500000);
      const freePointsUsed = r.int(0, 300000);
      return {
        month,
        paidPointsUsed,
        freePointsUsed,
        freePointsRefund: r.int(0, Math.min(100000, freePointsUsed)),
        membershipFee: r.pick(MF),
        minCharge: r.pick(MC),
        manualAdjustment: r.next() < 0.3 ? r.int(-50000, 100000) : 0,
      };
    }),
  };
}

function genLogs(branchId: number, branchName: string, r: RNG): ActivityLog[] {
  const count = r.int(5, 12);
  return Array.from({ length: count }, (_, i) => {
    const idx = r.int(0, LOG_DESCS.length - 1);
    const author = r.pick(HQ);
    const date = r.date(new Date('2023-01-01'), new Date('2026-03-11'));
    const detail: Record<string, unknown> = {
      type: LOG_TYPES[idx], branchId, branchName,
      timestamp: `${date}T${String(r.int(8, 18)).padStart(2, '0')}:${String(r.int(0, 59)).padStart(2, '0')}:00+09:00`,
      author,
    };
    if (LOG_TYPES[idx] === 'branch_updated') detail.changes = { representative: { from: genName(r), to: genName(r) } };
    if (LOG_TYPES[idx] === 'account_updated') detail.changes = { bank: { from: r.pick(BANKS), to: r.pick(BANKS) }, accountNumber: '(변경됨)' };
    if (LOG_TYPES[idx] === 'payment_processed') detail.settlement = { month: r.pick(SETTLEMENT_MONTHS), amount: r.int(100000, 5000000) };
    if (LOG_TYPES[idx] === 'memo_updated') detail.memo = '메모가 업데이트되었습니다.';
    return { id: _logId++, description: LOG_DESCS[idx], author, createdAt: date, detail };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ── Branch definitions ────────────────────────────────────────────────
const DEFS: [string, string][] = [
  ['대구', 'DG'], ['부산', 'BS'], ['전주', 'JJ'], ['대전', 'DJ'],
  ['화성', 'HS'], ['천안', 'CA'], ['안산', 'AS'], ['울산', 'US'],
  ['성남', 'SN'], ['안양', 'AY'], ['제주', 'JZ'], ['강남', 'GN'],
  ['강북', 'GB'], ['인천', 'IC'], ['청주', 'CJ'], ['포항', 'PH'],
  ['구미', 'GM'], ['광주', 'GJ'], ['강원', 'GW'], ['구리', 'GR'],
  ['김포', 'KP'], ['경남', 'KN'], ['교육다움', 'KU'], ['본사', 'HQ'],
  ['공주', 'KJ'], ['평택안성', 'PS'], ['동부', 'DB'], ['동작', 'DZ'],
  ['의정부', 'UJ'], ['강서', 'GS'], ['일산', 'IS'], ['경산', 'KS'],
];

const MEMOS = [
  '정기 미팅: 매월 첫째 주 화요일.',
  '신규 기관 모집 진행 중.',
  '우수 파트너 지사.',
  '담당 관리자 배정 필요.',
  '',
  '계약 갱신 예정.',
  '지역 확장 계획 중.',
];

function generateBranch(idx: number, name: string, code: string): Branch {
  const r = new RNG(idx * 7777 + 13);
  const id = idx + 1;
  const representative = genName(r);
  const instCount = r.int(0, 15);
  return {
    id,
    name,
    code,
    representative,
    phone: genPhone(r),
    email: `${code.toLowerCase()}@readingmath.co.kr`,
    loginId: `branch_${code.toLowerCase()}`,
    password: '●●●●●●●●',
    bank: r.pick(BANKS),
    accountHolder: genName(r),
    accountNumber: genAccount(r),
    memo: r.pick(MEMOS),
    createdAt: r.date(new Date('2022-01-01'), new Date('2024-12-31')),
    institutions: Array.from({ length: instCount }, () => genInstitution(r)),
    activityLogs: genLogs(id, name, r),
  };
}

export const BRANCHES: Branch[] = DEFS.map(([name, code], idx) =>
  generateBranch(idx, name, code)
);
