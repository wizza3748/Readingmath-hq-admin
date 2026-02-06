'use client';

import { create } from 'zustand';

// --- Types ---
export interface GroupBuy {
    id: string;
    influencer: string;
    subtitle?: string;
    title: string;
    period: string; // 표기용 (결제 기간)
    subjects: string;
    status: '진행중' | '진행전' | '종료';
    joinCount?: number;
    totalAmount?: string;
    url?: string;
    // 추가 필드 (상세용)
    paymentStartDate?: string;
    paymentEndDate?: string;
    signupStartDate?: string;
    signupEndDate?: string;
    groupBuyCode?: string;
    memo?: string;
    // 고도화 필드
    isEditSignupPeriod?: boolean;
    tickets?: Record<string, {
        applied: boolean;
        days: number;
        price: number;
        extraDays: number;
    }>;
    benefitFreeDays?: number;
    diagProvided?: boolean;
    diagRange?: 'semester' | 'grade' | 'all' | 'count';
    diagCount?: number;
    guideText?: string;
    adminMemo?: string;
    promo_content_enabled?: boolean;
    // 호환용 필드 (선택적)
    contractor?: string;
    subject?: string;
    paymentStartAt?: string;
    paymentEndAt?: string;
    joinStartAt?: string;
    joinEndAt?: string;
    isJoinPeriodEdit?: boolean;
}

interface GroupBuyStore {
    groupBuys: GroupBuy[];
    draftGroupBuy: Partial<GroupBuy> | null;
    addGroupBuy: (item: GroupBuy) => void;
    updateGroupBuy: (id: string, payload: Partial<GroupBuy>) => void;
    updateStatus: (id: string, status: GroupBuy['status']) => void;
    stopGroupBuy: (id: string) => void;
    setDraftGroupBuy: (data: Partial<GroupBuy>) => void;
    clearDraftGroupBuy: () => void;
}

const INITIAL_DATA: GroupBuy[] = [
    {
        id: "GB-ONGOING-001",
        contractor: "진순이",
        influencer: "진순이",
        subtitle: "최대 50% 할인!",
        title: "리딩수학과학 X 진순이 공동구매 이벤트!",
        period: "2026.01.27 ~ 2026.02.27",
        subjects: "리딩수학과학",
        status: "진행중",
        joinCount: 120,
        totalAmount: "18,134,400원",
        url: "https://example.com/groupbuy/jinsoon",
        paymentStartAt: "2026-01-27T00:00:00+09:00",
        paymentEndAt: "2026-02-27T23:59:00+09:00",
        paymentStartDate: "2026-01-27T00:00:00+09:00",
        paymentEndDate: "2026-02-27T23:59:00+09:00",
        joinStartAt: "2026-01-27T00:00:00+09:00",
        joinEndAt: "2026-02-27T23:59:00+09:00",
        signupStartDate: "2026-01-27T00:00:00+09:00",
        signupEndDate: "2026-02-27T23:59:00+09:00",
        isJoinPeriodEdit: false,
        benefitFreeDays: 5,
        diagProvided: true,
        diagRange: 'all',
        promo_content_enabled: false,
        guideText: "기존 리딩수학과학 회원들인 경우 “기존 회원 참여하기”를 선택하세요!\n신규 회원 및 기존 회원 모두 공동구매 기간 동안 할인된 금액으로 이용권 결제가 가능합니다.\n공동구매 이벤트 기간은 사정에 따라 변경될 수 있습니다.",
        tickets: {
            '리딩수학_3개월': { applied: true, days: 90, price: 180000, extraDays: 0 },
            '리딩수학_6개월': { applied: true, days: 180, price: 300000, extraDays: 0 },
            '리딩수학_12개월': { applied: true, days: 365, price: 540000, extraDays: 0 },
            '리딩과학_3개월': { applied: true, days: 90, price: 180000, extraDays: 0 },
            '리딩과학_6개월': { applied: true, days: 180, price: 300000, extraDays: 0 },
            '리딩과학_12개월': { applied: true, days: 365, price: 540000, extraDays: 0 },
            '리딩수학과학_3개월': { applied: true, days: 90, price: 300000, extraDays: 0 },
            '리딩수학과학_6개월': { applied: true, days: 180, price: 540000, extraDays: 0 },
            '리딩수학과학_12개월': { applied: true, days: 365, price: 840000, extraDays: 0 },
        }
    },
    {
        id: "GB-LIVE-HQ-001",
        contractor: "본사",
        influencer: "본사",
        subtitle: "최대 36% 할인",
        title: "리딩과학 공동구매 이벤트!",
        period: "2026.01.28 ~ 2026.03.31",
        subjects: "리딩과학",
        status: "진행중",
        joinCount: 0,
        totalAmount: "0원",
        paymentStartAt: "2026-01-28T00:00:00+09:00",
        paymentEndAt: "2026-03-31T23:59:00+09:00",
        paymentStartDate: "2026-01-28T00:00:00+09:00",
        paymentEndDate: "2026-03-31T23:59:00+09:00",
        joinStartAt: "2026-01-27T00:00:00+09:00",
        joinEndAt: "2026-03-31T23:59:00+09:00",
        signupStartDate: "2026-01-27T00:00:00+09:00",
        signupEndDate: "2026-03-31T23:59:00+09:00",
        isJoinPeriodEdit: true,
        benefitFreeDays: 5,
        diagProvided: true,
        diagRange: 'grade',
        promo_content_enabled: true,
        guideText: "기존 리딩과학 회원들인 경우 “기존 회원 참여하기”를 선택하세요!\n신규 회원 및 기존 회원 모두 공동구매 기간 동안 할인된 금액으로 이용권 결제가 가능합니다.\n공동구매 이벤트 기간은 사정에 따라 변경될 수 있습니다.",
        tickets: {
            '리딩과학_3개월': { applied: true, days: 90, price: 180000, extraDays: 0 },
            '리딩과학_6개월': { applied: true, days: 180, price: 300000, extraDays: 0 },
            '리딩과학_12개월': { applied: true, days: 365, price: 540000, extraDays: 0 },
        }
    },
    {
        id: "GB-UPCOMING-001",
        influencer: "미래",
        title: "리딩과학 X 미래 공동구매 이벤트!",
        period: "2월 10일(화) ~ 2월 17일(화)",
        subjects: "리딩과학",
        status: "진행전",
        paymentStartDate: "2026-02-10T00:00:00.000Z",
        paymentEndDate: "2026-02-17T23:59:59.000Z",
        benefitFreeDays: 7,
        diagProvided: true,
        diagRange: 'all',
        promo_content_enabled: false,
        guideText: "리딩과학 공동구매가 곧 시작됩니다!"
    },
    {
        id: "GB-UPCOMING-002",
        influencer: "지혜",
        title: "리딩수학과학 X 지혜 공동구매 이벤트!",
        period: "3월 1일(일) ~ 3월 8일(일)",
        subjects: "리딩수학과학",
        status: "진행전",
        paymentStartDate: "2026-03-01T00:00:00.000Z",
        paymentEndDate: "2026-03-08T23:59:59.000Z",
        benefitFreeDays: 10,
        diagProvided: true,
        diagRange: 'semester',
        promo_content_enabled: false,
        guideText: "리딩수학과학 공동구매가 3월에 시작됩니다!"
    },
    {
        id: "GB-FINISHED-001",
        influencer: "성장",
        title: "리딩과학 X 성장 공동구매 이벤트!",
        period: "1월 1일(목) ~ 1월 8일(목)",
        subjects: "리딩과학",
        status: "종료",
        paymentStartDate: "2026-01-01T00:00:00.000Z",
        paymentEndDate: "2026-01-08T23:59:59.000Z",
        joinCount: 45,
        totalAmount: "4,050,000원",
        promo_content_enabled: false
    },
    {
        id: "GB-FINISHED-002",
        influencer: "꿈나무",
        title: "리딩과학 X 꿈나무 공동구매 이벤트!",
        period: "2024년 12월 15일(일) ~ 12월 22일(일)",
        subjects: "리딩과학",
        status: "종료",
        promo_content_enabled: false
    }
];

import { persist } from 'zustand/middleware';

export const useGroupBuyStore = create<GroupBuyStore>()(
    persist(
        (set) => ({
            groupBuys: INITIAL_DATA,
            draftGroupBuy: null,
            addGroupBuy: (item: GroupBuy) => set((state: GroupBuyStore) => ({
                groupBuys: [item, ...state.groupBuys]
            })),
            updateGroupBuy: (id: string, payload: Partial<GroupBuy>) => set((state: GroupBuyStore) => ({
                groupBuys: state.groupBuys.map((item: GroupBuy) =>
                    item.id === id ? { ...item, ...payload } : item
                )
            })),
            updateStatus: (id: string, status: GroupBuy['status']) => set((state: GroupBuyStore) => ({
                groupBuys: state.groupBuys.map((item: GroupBuy) =>
                    item.id === id ? { ...item, status } : item
                )
            })),
            stopGroupBuy: (id: string) => set((state: GroupBuyStore) => ({
                groupBuys: state.groupBuys.map((item: GroupBuy) =>
                    item.id === id ? { ...item, status: '종료' } : item
                )
            })),
            setDraftGroupBuy: (data: Partial<GroupBuy>) => set({ draftGroupBuy: data }),
            clearDraftGroupBuy: () => set({ draftGroupBuy: null }),
        }),
        {
            name: 'readingmath-groupbuy-storage',
        }
    )
);

/**
 * [RM-226] 데이터 매핑 호환 레이어
 * 기존 필드(influencer, subjects 등)를 도메인 필드(contractor, subject 등)로 매핑
 */
export const mapGroupBuyData = (item: GroupBuy | Partial<GroupBuy>) => {
    return {
        ...item,
        id: item.id || '',
        title: item.title || '',
        subtitle: item.subtitle || '',
        contractor: item.contractor || item.influencer || '본사',
        subject: item.subject || item.subjects || '리딩수학',
        paymentStartAt: item.paymentStartAt || item.paymentStartDate || '',
        paymentEndAt: item.paymentEndAt || item.paymentEndDate || '',
        joinStartAt: (item.isJoinPeriodEdit ?? item.isEditSignupPeriod ?? false)
            ? (item.joinStartAt || item.signupStartDate || '')
            : (item.paymentStartAt || item.paymentStartDate || ''),
        joinEndAt: (item.isJoinPeriodEdit ?? item.isEditSignupPeriod ?? false)
            ? (item.joinEndAt || item.signupEndDate || '')
            : (item.paymentEndAt || item.paymentEndDate || ''),
        isJoinPeriodEdit: item.isJoinPeriodEdit ?? item.isEditSignupPeriod ?? false,
        benefitFreeDays: item.benefitFreeDays ?? 0,
        diagProvided: item.diagProvided ?? false,
        diagRange: (item.diagRange as any) || 'semester',
        diagCount: item.diagCount ?? 1,
        promo_content_enabled: item.promo_content_enabled ?? false,
    };
};

/**
 * [RM-226] 공동구매 상태 판별 유틸리티
 * 수정 작업 3 규칙 적용:
 * - startAt = min(joinStartAt, paymentStartAt)
 * - endAt = max(joinEndAt, paymentEndAt)
 * - 종료: (수동 종료) OR (endAt < now)
 * - 진행중: (startAt <= now) AND (NOT 종료)
 */
export const getGroupBuyStatus = (item: any): GroupBuy['status'] => {
    if (item.status === '종료') return '종료';

    const data = mapGroupBuyData(item);
    const now = new Date().getTime();

    const parseDate = (d: string) => {
        if (!d) return null;
        // ISO 형식(T 또는 : 포함)이 아닌 경우에만 마침표(.)를 하이픈(-)으로 변환
        const normalized = (d.includes('T') || d.includes(':')) ? d : d.replace(/\./g, '-');
        const t = new Date(normalized).getTime();
        return isNaN(t) ? null : t;
    };

    const s1 = parseDate(data.joinStartAt);
    const s2 = parseDate(data.paymentStartAt);
    const e1 = parseDate(data.joinEndAt);
    const e2 = parseDate(data.paymentEndAt);

    const startCandidates = [s1, s2].filter((t): t is number => t !== null);
    const endCandidates = [e1, e2].filter((t): t is number => t !== null);

    const minStart = startCandidates.length > 0 ? Math.min(...startCandidates) : Infinity;
    const maxEnd = endCandidates.length > 0 ? Math.max(...endCandidates) : -Infinity;

    if (maxEnd !== -Infinity && maxEnd < now) return '종료';
    if (minStart !== Infinity && minStart <= now) return '진행중';

    return '진행전';
};
