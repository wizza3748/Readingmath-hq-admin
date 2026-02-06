'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    RadioGroup,
    RadioGroupItem
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Info,
    Save,
    XCircle,
    Calendar,
    Ticket,
    Gift,
    Hash,
    AlignLeft,
    ShoppingBag
} from "lucide-react";
import { useGroupBuyStore, getGroupBuyStatus } from '@/lib/store';
import { cn } from "@/lib/utils";

// --- Constants & Templates ---
const TICKET_TEMPLATES = [
    { type: '3개월', days: 90, months: 3 },
    { type: '6개월', days: 180, months: 6 },
    { type: '12개월', days: 365, months: 12 },
];

const PRICES = {
    '리딩수학': { '3개월': 210000, '6개월': 420000, '12개월': 840000 },
    '리딩과학': { '3개월': 210000, '6개월': 420000, '12개월': 840000 },
    '리딩수학과학': { '3개월': 420000, '6개월': 840000, '12개월': 1680000 },
};

const INITIAL_GUIDE = `기존 리딩수학과학 회원들인 경우 “기존 회원 참여하기”를 선택하세요!
신규 회원 및 기존 회원 모두 공동구매 기간 동안 할인된 금액으로 이용권 결제가 가능합니다.
공동구매 이벤트 기간은 사정에 따라 변경될 수 있습니다.`;

export default function GroupBuyNewPage() {
    const router = useRouter();
    const { addGroupBuy, draftGroupBuy, clearDraftGroupBuy } = useGroupBuyStore();

    // --- Form State ---
    const [contractor, setContractor] = useState('');
    const [subject, setSubject] = useState<'리딩수학' | '리딩과학' | '리딩수학과학'>('리딩수학');
    const [subtitle, setSubtitle] = useState('');
    const [paymentStartDate, setPaymentStartDate] = useState('');
    const [paymentEndDate, setPaymentEndDate] = useState('');
    const [isEditSignupPeriod, setIsEditSignupPeriod] = useState(false);
    const [signupStartDate, setSignupStartDate] = useState('');
    const [signupEndDate, setSignupEndDate] = useState('');

    // Ticket State: key is "subject_type" (e.g., "수학_3개월")
    const [selectedTickets, setSelectedTickets] = useState<Record<string, {
        applied: boolean;
        days: number;
        price: number;
        extraDays: number;
    }>>({});

    const [benefitFreeDays, setBenefitFreeDays] = useState(5);
    const [diagTestOption, setDiagTestOption] = useState<'none' | 'provided'>('provided');
    const [diagTestRange, setDiagTestRange] = useState<'semester' | 'grade' | 'all' | 'count'>('semester');
    const [diagTestCount, setDiagTestCount] = useState(1);
    const [guideText, setGuideText] = useState(INITIAL_GUIDE);
    const [adminMemo, setAdminMemo] = useState('');
    const [promoContentEnabled, setPromoContentEnabled] = useState(false); // 기본값 OFF

    // --- Draft Logic (복제) ---
    useEffect(() => {
        if (draftGroupBuy) {
            if (draftGroupBuy.subjects) setSubject(draftGroupBuy.subjects as any);
            if (draftGroupBuy.tickets) setSelectedTickets(draftGroupBuy.tickets);
            if (draftGroupBuy.benefitFreeDays) setBenefitFreeDays(draftGroupBuy.benefitFreeDays);
            if (draftGroupBuy.diagProvided !== undefined) setDiagTestOption(draftGroupBuy.diagProvided ? 'provided' : 'none');
            if (draftGroupBuy.diagRange) setDiagTestRange(draftGroupBuy.diagRange as any);
            if (draftGroupBuy.diagCount) setDiagTestCount(draftGroupBuy.diagCount);
            if (draftGroupBuy.guideText) setGuideText(draftGroupBuy.guideText);
            if (draftGroupBuy.adminMemo) setAdminMemo(draftGroupBuy.adminMemo);
            if (draftGroupBuy.promo_content_enabled !== undefined) setPromoContentEnabled(draftGroupBuy.promo_content_enabled);

            // 프리필 후 드래프트 클리어
            clearDraftGroupBuy();
        }
    }, [draftGroupBuy, clearDraftGroupBuy]);

    // --- Computed Values ---
    const groupBuyTitle = useMemo(() => {
        if (!contractor) return "";
        // 명세: 계약자 '본사' 여부에 따른 정교한 자동 생성
        if (contractor === '본사') {
            return `${subject} 공동구매 이벤트!`;
        }
        return `${subject} X ${contractor} 공동구매 이벤트!`;
    }, [contractor, subject]);

    const groupBuyCode = useMemo(() => {
        if (!contractor || !paymentStartDate) return "";
        // 명세: 계약자 문자열 정규화 (+, -, /, 공백 제거)
        const normalizedContractor = contractor.replace(/[+\-\/\s]/g, '');
        const dateStr = paymentStartDate.replace(/[^0-9]/g, '').slice(2, 8); // YYMMDD
        if (dateStr.length < 6) return "";
        // 명세: RM{계약자}{YYMMDD} 포맷 (기호 미사용)
        return `RM${normalizedContractor}${dateStr}`;
    }, [contractor, paymentStartDate]);

    // Initial value for tickets when subject changes
    useEffect(() => {
        setSelectedTickets(prev => {
            const newTickets = { ...prev };
            const subjects = subject === '리딩수학과학' ? ['리딩수학', '리딩과학', '리딩수학과학'] : [subject];

            // Ensure keys exist for relevant subjects
            subjects.forEach(s => {
                TICKET_TEMPLATES.forEach(t => {
                    const key = `${s}_${t.type}`;
                    if (!newTickets[key]) {
                        newTickets[key] = {
                            applied: false,
                            days: t.days,
                            price: 0,
                            extraDays: 0
                        };
                    }
                });
            });
            return newTickets;
        });
    }, [subject]);

    // --- Validation ---
    const isFormValid = useMemo(() => {
        const now = new Date();
        const start = paymentStartDate ? new Date(paymentStartDate) : null;
        const end = paymentEndDate ? new Date(paymentEndDate) : null;

        // 1. Basic required fields
        if (!contractor || !subject || !subtitle || !paymentStartDate || !paymentEndDate || !guideText) return false;
        if (!benefitFreeDays || benefitFreeDays < 1) return false;
        if (diagTestOption === 'provided' && !diagTestRange) return false;

        // 2. Date validations - 연대순 정합성만 확인 (과거 날짜 등록 허용)
        if (end && start && end < start) return false;

        if (isEditSignupPeriod) {
            const sStart = signupStartDate ? new Date(signupStartDate) : null;
            const sEnd = signupEndDate ? new Date(signupEndDate) : null;
            if (!signupStartDate || !signupEndDate) return false;
            if (sEnd && sStart && sEnd < sStart) return false;
        }

        // 3. Ticket validation: At least one ticket applied
        const anyApplied = Object.values(selectedTickets).some(t => t.applied);
        if (!anyApplied) return false;

        // 4. Detailed ticket checks
        for (const key in selectedTickets) {
            const t = selectedTickets[key];
            if (t.applied) {
                if (t.days < 1) return false;
                if (t.price < 0) return false;
                // 할인가 > 정가 체크
                const [s, type] = key.split('_');
                // @ts-ignore
                const standardPrice = PRICES[s][type];
                if (t.price > standardPrice) return false;
            }
        }

        return true;
    }, [contractor, subject, subtitle, paymentStartDate, paymentEndDate, isEditSignupPeriod, signupStartDate, signupEndDate, benefitFreeDays, diagTestOption, diagTestRange, guideText, selectedTickets]);

    // --- Handlers ---
    const autoSetTime = (value: string, type: 'start' | 'end') => {
        if (!value) return "";
        const [datePart] = value.split('T');
        return type === 'start' ? `${datePart}T00:00` : `${datePart}T23:59`;
    };

    const handlePaymentDateChange = (type: 'start' | 'end', value: string) => {
        const finalValue = autoSetTime(value, type);
        if (type === 'start') setPaymentStartDate(finalValue);
        else setPaymentEndDate(finalValue);
    };

    const handleSignupDateChange = (type: 'start' | 'end', value: string) => {
        const finalValue = autoSetTime(value, type);
        if (type === 'start') setSignupStartDate(finalValue);
        else setSignupEndDate(finalValue);
    };

    // 명세: 토글 OFF -> ON 전환 시 초기값 세팅 (사용자 입력 보호 포함)
    const handleToggleEditSignup = (checked: boolean) => {
        setIsEditSignupPeriod(checked);
        if (checked && !signupStartDate && !signupEndDate) {
            setSignupStartDate(autoSetTime(paymentStartDate, 'start'));
            setSignupEndDate(autoSetTime(paymentEndDate, 'end'));
        }
    };

    const handleTicketChange = (key: string, field: string, value: any) => {
        setSelectedTickets(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const handleSave = () => {
        if (!isFormValid) return;

        const newId = `GB-NEW-${Date.now()}`;

        // 1. 임시 데이터 객체 생성 (상태 확인용)
        const partialData: any = {
            id: newId,
            influencer: contractor,
            contractor: contractor, // 호환성
            subtitle: subtitle,
            title: groupBuyTitle,
            subjects: subject,
            subject: subject, // 호환성
            paymentStartDate,
            paymentEndDate,
            paymentStartAt: paymentStartDate,
            paymentEndAt: paymentEndDate,
            isEditSignupPeriod,
            signupStartDate: isEditSignupPeriod ? signupStartDate : paymentStartDate,
            signupEndDate: isEditSignupPeriod ? signupEndDate : paymentEndDate,
            joinStartAt: isEditSignupPeriod ? signupStartDate : paymentStartDate,
            joinEndAt: isEditSignupPeriod ? signupEndDate : paymentEndDate,
            benefitFreeDays,
            tickets: selectedTickets,
            diagProvided: diagTestOption === 'provided',
            diagRange: diagTestRange,
            diagCount: diagTestCount,
            guideText,
            adminMemo,
            promo_content_enabled: promoContentEnabled,
            period: paymentStartDate.split('T')[0].replace(/-/g, '.') + " ~ " + paymentEndDate.split('T')[0].replace(/-/g, '.'),
            groupBuyCode: groupBuyCode,
        };

        // 2. 동적 상태 결정
        const finalStatus = getGroupBuyStatus(partialData);

        // 3. 최종 저장
        addGroupBuy({
            ...partialData,
            status: finalStatus
        });

        alert("공동구매가 등록되었습니다.");
        router.push('/admin/groupbuy');
    };

    // --- Sub-components for Ticket Tables ---
    const renderTicketTable = (s: string) => {
        return (
            <div key={s} className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-bold">{s}</Badge>
                    <span className="text-sm font-bold text-gray-500">이용권 설정</span>
                </div>
                <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-gray-50/80">
                            <TableRow className="h-10 hover:bg-transparent">
                                <TableHead className="w-[50px] text-center font-bold">적용</TableHead>
                                <TableHead className="w-[90px] font-bold">이용권</TableHead>
                                <TableHead className="w-[85px] font-bold">일수</TableHead>
                                <TableHead className="w-[110px] font-bold">정가</TableHead>
                                <TableHead className="w-[145px] font-bold">할인가</TableHead>
                                <TableHead className="w-[80px] text-center font-bold">할인율</TableHead>
                                <TableHead className="w-[110px] text-right font-bold">월 환산가</TableHead>
                                <TableHead className="w-[100px] font-bold">이용기간 추가</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {TICKET_TEMPLATES.map(t => {
                                const key = `${s}_${t.type}`;
                                const data = selectedTickets[key] || { applied: false, days: t.days, price: 0, extraDays: 0 };
                                // @ts-ignore
                                const standardPrice = PRICES[s][t.type];
                                // 할인율: (정가 - 할인가) / 정가 * 100 -> 명세: 반올림(Round)
                                const discountRate = Math.round(((standardPrice - data.price) / standardPrice) * 100);
                                // 월 환산가: 할인가 / 개월수 -> 절사
                                const monthlyPrice = Math.floor(data.price / t.months);

                                return (
                                    <TableRow key={key} className={cn("h-14", !data.applied && "opacity-60 bg-gray-50/50")}>
                                        <TableCell className="text-center">
                                            <Checkbox
                                                checked={data.applied}
                                                onCheckedChange={(checked) => handleTicketChange(key, 'applied', !!checked)}
                                                className="w-5 h-5"
                                            />
                                        </TableCell>
                                        <TableCell className="font-bold text-gray-700">{t.type}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 min-w-[85px]">
                                                <Input
                                                    type="number"
                                                    disabled={!data.applied}
                                                    value={data.days}
                                                    onChange={(e) => handleTicketChange(key, 'days', Number(e.target.value))}
                                                    className={cn(
                                                        "h-9 font-mono font-bold text-right px-2 border-gray-300 w-full",
                                                        data.applied ? "bg-white text-gray-900 ring-1 ring-gray-100 shadow-sm" : "bg-gray-100/50 text-gray-400 border-gray-100"
                                                    )}
                                                />
                                                <span className={cn("text-xs font-bold shrink-0", data.applied ? "text-gray-500" : "text-gray-300")}>일</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-400 font-medium">{standardPrice.toLocaleString()}원</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 min-w-[145px]">
                                                <Input
                                                    type="number"
                                                    disabled={!data.applied}
                                                    placeholder="0"
                                                    value={data.price || ''}
                                                    onChange={(e) => handleTicketChange(key, 'price', Number(e.target.value))}
                                                    className={cn(
                                                        "h-9 font-mono font-bold text-right px-2 border-gray-300 w-full",
                                                        data.applied ? "bg-white text-gray-900 ring-1 ring-gray-100 shadow-sm" : "bg-gray-100/50 text-gray-400 border-gray-100",
                                                        data.price > standardPrice && "border-red-500 text-red-500 focus-visible:ring-red-500"
                                                    )}
                                                />
                                                <span className={cn("text-xs font-bold shrink-0", data.applied ? "text-gray-500" : "text-gray-300")}>원</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-primary">
                                            {data.applied && data.price > 0 ? `${discountRate}%` : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-gray-800">
                                            {data.applied && data.price > 0 ? `${monthlyPrice.toLocaleString()}원` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 min-w-[100px]">
                                                <Input
                                                    type="number"
                                                    disabled={!data.applied}
                                                    value={data.extraDays}
                                                    onChange={(e) => handleTicketChange(key, 'extraDays', Number(e.target.value))}
                                                    className={cn(
                                                        "h-9 font-mono font-bold text-right px-2 border-gray-300 w-full",
                                                        data.applied ? "bg-white text-gray-900 ring-1 ring-gray-100 shadow-sm" : "bg-gray-100/50 text-gray-400 border-gray-100"
                                                    )}
                                                />
                                                <span className={cn("text-xs font-bold shrink-0", data.applied ? "text-gray-500" : "text-gray-300")}>일</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    };

    return (
        <TooltipProvider>
            <div className="p-6 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-[1600px] mx-auto">
                <h1 className="text-2xl font-bold text-gray-900">공동구매 등록</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-8">
                        {/* [3] 기본 정보 영역 */}
                        <Card className="border-none shadow-sm ring-1 ring-gray-100">
                            <CardHeader className="bg-gray-50/50 rounded-t-xl border-b border-gray-100">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Info className="w-4 h-4 text-primary" /> 기본 정보
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold flex items-center gap-1.5">
                                            계약자 (인플루언서) <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            placeholder="인플루언서 이름 입력"
                                            value={contractor}
                                            onChange={(e) => setContractor(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold flex items-center gap-1.5">
                                            적용 과목 <span className="text-red-500">*</span>
                                        </Label>
                                        <RadioGroup
                                            value={subject}
                                            onValueChange={(v: any) => setSubject(v)}
                                            className="flex h-11 items-center gap-4 bg-gray-50 rounded-md px-3"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="리딩수학" id="sub-m" />
                                                <Label htmlFor="sub-m" className="text-sm font-medium cursor-pointer">리딩수학</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="리딩과학" id="sub-s" />
                                                <Label htmlFor="sub-s" className="text-sm font-medium cursor-pointer">리딩과학</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="리딩수학과학" id="sub-ms" />
                                                <Label htmlFor="sub-ms" className="text-sm font-medium cursor-pointer">리딩수학과학</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>

                                <Separator className="bg-gray-100" />

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold flex items-center gap-1.5">
                                            공동구매 제목 (자동 생성) <span className="text-gray-400 font-normal">(계약자와 과목 선택 시 반영)</span>
                                        </Label>
                                        <Input value={groupBuyTitle} readOnly className="h-11 bg-gray-50 border-gray-100 text-gray-700 font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold flex items-center gap-1.5">
                                            공동구매 부제목 <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            placeholder="예: 최대 36% 할인!"
                                            value={subtitle}
                                            onChange={(e) => setSubtitle(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold flex items-center gap-1.5">
                                            공동구매 코드 <span className="text-gray-400 font-normal">(결제 시작일 입력 시 생성)</span>
                                        </Label>
                                        <Input value={groupBuyCode} readOnly className="h-11 bg-gray-50 border-gray-100 text-primary font-mono font-bold tracking-tight" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* [4] 기간 설정 영역 */}
                        <Card className="border-none shadow-sm ring-1 ring-gray-100">
                            <CardHeader className="bg-gray-50/50 rounded-t-xl border-b border-gray-100">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary" /> 기간 설정
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-8">
                                <div className="space-y-4">
                                    <Label className="text-sm font-bold flex items-center gap-1.5 text-gray-700">결제 가능 기간 (공구 진행 기간) <span className="text-red-500">*</span></Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <p className="text-[11px] font-bold text-gray-400 pl-1 uppercase">결제 시작일시</p>
                                            <Input type="datetime-local" value={paymentStartDate} onChange={(e) => handlePaymentDateChange('start', e.target.value)} className="h-11" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[11px] font-bold text-gray-400 pl-1 uppercase">결제 종료일시</p>
                                            <Input type="datetime-local" value={paymentEndDate} onChange={(e) => handlePaymentDateChange('end', e.target.value)} className="h-11" />
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-gray-50" />

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="edit-signup" className="text-sm font-bold cursor-pointer">가입 기간 개별 편집</Label>
                                            <p className="text-xs text-gray-500">결제 기간과 가입 기간을 다르게 설정할 경우 활성화하세요.</p>
                                        </div>
                                        <Switch
                                            id="edit-signup"
                                            checked={isEditSignupPeriod}
                                            onCheckedChange={handleToggleEditSignup}
                                        />
                                    </div>

                                    {isEditSignupPeriod && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                            <div className="space-y-1.5">
                                                <p className="text-[11px] font-bold text-gray-400 pl-1 uppercase">가입 시작일시</p>
                                                <Input type="datetime-local" value={signupStartDate} onChange={(e) => handleSignupDateChange('start', e.target.value)} className="h-11" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-[11px] font-bold text-gray-400 pl-1 uppercase">가입 종료일시</p>
                                                <Input type="datetime-local" value={signupEndDate} onChange={(e) => handleSignupDateChange('end', e.target.value)} className="h-11" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* [5] 이용권 설정 영역 */}
                        <Card className="border-none shadow-sm ring-1 ring-gray-100">
                            <CardHeader className="bg-gray-50/50 rounded-t-xl border-b border-gray-100">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Ticket className="w-4 h-4 text-primary" /> 이용권 설정
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-10">
                                {subject === '리딩수학' && renderTicketTable('리딩수학')}
                                {subject === '리딩과학' && renderTicketTable('리딩과학')}
                                {subject === '리딩수학과학' && (
                                    <>
                                        {renderTicketTable('리딩수학')}
                                        {renderTicketTable('리딩과학')}
                                        {renderTicketTable('리딩수학과학')}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        {/* [6] 혜택 설정 영역 */}
                        <Card className="border-none shadow-sm ring-1 ring-gray-100">
                            <CardHeader className="bg-gray-50/50 rounded-t-xl border-b border-gray-100">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Gift className="w-4 h-4 text-primary" /> 혜택 설정
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold">무료체험 기간 <span className="text-red-500">*</span></Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={benefitFreeDays}
                                            onChange={(e) => setBenefitFreeDays(Number(e.target.value))}
                                            className="h-11 text-center font-bold"
                                        />
                                        <span className="font-bold text-gray-500 w-8">일</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-400">무료체험 과목 (수정 불가)</Label>
                                    <Input value={subject} readOnly className="h-11 bg-gray-50 border-gray-100 text-gray-500 font-medium" />
                                </div>
                                <Separator className="bg-gray-50" />
                                <div className="space-y-4">
                                    <div className="flex items-center gap-1">
                                        <Label className="text-sm font-bold">진단평가 제공 여부 <span className="text-red-500">*</span></Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="max-w-xs p-4 space-y-3">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-xs text-primary">[학생 적용 이전 학기]</p>
                                                    <p className="text-xs leading-relaxed">현재 학기 기준으로 이전 학기의 진단평가만 제공됩니다. 이전 학기가 없는 경우 현재 학기의 진단평가가 제공됩니다.</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-bold text-xs text-primary">[전체 학기]</p>
                                                    <p className="text-xs leading-relaxed">모든 학기의 진단평가를 제한 없이 제공됩니다.</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-bold text-xs text-primary">[선택 횟수]</p>
                                                    <p className="text-xs leading-relaxed">전체 학기 기준으로 입력한 횟수만큼 진단평가가 제공됩니다.</p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <RadioGroup value={diagTestOption} onValueChange={(v: any) => setDiagTestOption(v)} className="flex gap-4">
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="provided" id="diag-on" />
                                            <Label htmlFor="diag-on">제공</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="none" id="diag-none" />
                                            <Label htmlFor="diag-none">없음</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                {diagTestOption === 'provided' && (
                                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-1">
                                        <Label className="text-xs font-bold text-primary pl-0.5 uppercase tracking-wider">진단평가 제공 범위</Label>
                                        <RadioGroup value={diagTestRange} onValueChange={(v: any) => setDiagTestRange(v)} className="flex flex-col gap-2 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="semester" id="range-s" />
                                                <Label htmlFor="range-s">학생 적용 이전 학기</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="all" id="range-a" />
                                                <Label htmlFor="range-a">전체 학기</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="count" id="range-c" />
                                                <Label htmlFor="range-c">선택 횟수</Label>
                                            </div>
                                        </RadioGroup>
                                        {diagTestRange === 'count' && (
                                            <div className="flex items-center gap-2 mt-2 pl-4 animate-in fade-in slide-in-from-top-1">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={diagTestCount}
                                                    onChange={(e) => setDiagTestCount(Number(e.target.value))}
                                                    className="w-20 h-9 text-center font-bold"
                                                />
                                                <span className="text-sm font-bold text-gray-500">회</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* [7] 공동구매 안내 영역 */}
                        <Card className="border-none shadow-sm ring-1 ring-gray-100">
                            <CardHeader className="bg-gray-50/50 rounded-t-xl border-b border-gray-100">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <AlignLeft className="w-4 h-4 text-primary" /> 공동구매 안내 문구
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <Textarea
                                    className="min-h-[160px] text-sm leading-relaxed"
                                    placeholder="회원들에게 노출될 안내 문구를 입력해 주세요."
                                    value={guideText}
                                    onChange={(e) => setGuideText(e.target.value)}
                                />
                            </CardContent>
                        </Card>

                        {/* [7-2] 홍보 콘텐츠 설정 영역 */}
                        <Card className="border-none shadow-sm ring-1 ring-gray-100">
                            <CardHeader className="bg-gray-50/50 rounded-t-xl border-b border-gray-100">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-primary" /> 홍보 콘텐츠 설정
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-center bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="promo-toggle" className="text-sm font-bold cursor-pointer">홍보 콘텐츠 노출</Label>
                                        <p className="text-xs text-gray-500">미리보기 및 결제 페이지에서 상품 상세 이미지를 노출합니다.</p>
                                    </div>
                                    <Switch
                                        id="promo-toggle"
                                        checked={promoContentEnabled}
                                        onCheckedChange={setPromoContentEnabled}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* [8] 메모 영역 */}
                        <Card className="border-none shadow-sm ring-1 ring-gray-100">
                            <CardHeader className="bg-gray-50/50 rounded-t-xl border-b border-gray-100">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-primary" /> 관리자 메모 (비노출)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <Textarea
                                    className="min-h-[100px] bg-gray-50/50 border-gray-100"
                                    placeholder="운영 관리를 위한 메모를 남겨주세요."
                                    value={adminMemo}
                                    onChange={(e) => setAdminMemo(e.target.value)}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* [9] 하단 버튼 영역 */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 flex justify-center gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                    <Button
                        variant="outline"
                        className="w-full max-w-[160px] h-12 font-bold text-gray-500"
                        onClick={() => router.push('/admin/groupbuy')}
                    >
                        취소
                    </Button>
                    <Button
                        className="w-full max-w-[280px] h-12 font-bold bg-primary hover:bg-primary/90 gap-2 shadow-lg shadow-primary/20"
                        disabled={!isFormValid}
                        onClick={handleSave}
                    >
                        <Save className="w-5 h-5" />
                        저장
                    </Button>
                </div>
            </div>
        </TooltipProvider>
    );
}
