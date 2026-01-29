'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { Badge } from "@/components/ui/badge";
import {
    Info,
    Save,
    Calendar,
    Ticket,
    Gift,
    Hash,
    AlignLeft,
    List,
    Eye,
    AlertCircle,
    ShoppingBag
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useGroupBuyStore, mapGroupBuyData, getGroupBuyStatus } from '@/lib/store';
import { cn } from "@/lib/utils";

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

const ONGOING_GUIDE = `기존 리딩수학과학 회원들인 경우 “기존 회원 참여하기”를 선택하세요!
신규 회원 및 기존 회원 모두 공동구매 기간 동안 할인된 금액으로 이용권 결제가 가능합니다.
공동구매 이벤트 기간은 사정에 따라 변경될 수 있습니다.`;

export default function GroupBuyDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { groupBuys, updateGroupBuy } = useGroupBuyStore();

    const existingData = useMemo(() => groupBuys.find(item => item.id === id), [groupBuys, id]);

    // --- Status Calculation (명세 기준) ---
    const calcStatus = useMemo(() => {
        if (!existingData) return '종료';
        return getGroupBuyStatus(existingData);
    }, [existingData]);

    const isFixedDataTarget = id === 'GB-ONGOING-001'; // 명세상 고정 주입 대상

    // --- Form State ---
    const [contractor, setContractor] = useState('');
    const [subject, setSubject] = useState<'리딩수학' | '리딩과학' | '리딩수학과학'>('리딩수학');
    const [subtitle, setSubtitle] = useState('');
    const [paymentStartDate, setPaymentStartDate] = useState('');
    const [paymentEndDate, setPaymentEndDate] = useState('');
    const [isEditSignupPeriod, setIsEditSignupPeriod] = useState(false);
    const [signupStartDate, setSignupStartDate] = useState('');
    const [signupEndDate, setSignupEndDate] = useState('');
    const [selectedTickets, setSelectedTickets] = useState<Record<string, any>>({});
    const [benefitFreeDays, setBenefitFreeDays] = useState(5);
    const [diagTestOption, setDiagTestOption] = useState<'none' | 'provided'>('none');
    const [diagTestRange, setDiagTestRange] = useState<'semester' | 'grade' | 'all'>('semester');
    const [guideText, setGuideText] = useState('');
    const [adminMemo, setAdminMemo] = useState('');
    const [promoContentEnabled, setPromoContentEnabled] = useState(false);

    useEffect(() => {
        if (existingData) {
            const data = mapGroupBuyData(existingData);

            // 1. 공통 필드 로드
            setSubtitle(data.subtitle || '');
            setAdminMemo(data.adminMemo || '');
            setPromoContentEnabled(data.promo_content_enabled ?? false);
            setGuideText(data.guideText || '');
            setBenefitFreeDays(data.benefitFreeDays || 5);
            setDiagTestOption(data.diagProvided ? 'provided' : 'none');
            setDiagTestRange(data.diagRange || 'semester');

            // 2. 기간 로드 (도메인 필드 우선 - datetime-local 입력 포맷 대응)
            const formatForInput = (d?: string) => {
                if (!d) return '';
                const clean = d.replace(/\./g, '-');
                return clean.includes('T') ? clean.slice(0, 16) : `${clean}T00:00`.slice(0, 16);
            };

            setPaymentStartDate(formatForInput(data.paymentStartAt));
            setPaymentEndDate(formatForInput(data.paymentEndAt));
            setIsEditSignupPeriod(data.isJoinPeriodEdit || false);
            setSignupStartDate(formatForInput(data.joinStartAt));
            setSignupEndDate(formatForInput(data.joinEndAt));

            setContractor(data.contractor || '');
            setSubject(data.subject as any);
            setSelectedTickets(data.tickets || {});
        }
    }, [existingData]);

    const isReadOnly = calcStatus === '종료';
    const isOngoing = calcStatus === '진행중';
    const isUpcoming = calcStatus === '진행전';

    // --- Computed ---
    const groupBuyTitle = useMemo(() => {
        if (!contractor) return "";
        if (contractor === '본사') return `${subject} 공동구매 이벤트!`;
        return `${subject} X ${contractor} 공동구매 이벤트!`;
    }, [contractor, subject]);

    const groupBuyCode = existingData?.groupBuyCode || "";

    const isFormValid = useMemo(() => {
        if (isReadOnly) return false;
        if (!contractor || !subject || !subtitle || !paymentStartDate || !paymentEndDate || !guideText) return false;
        return true;
    }, [contractor, subject, subtitle, paymentStartDate, paymentEndDate, guideText, isReadOnly]);

    // --- Handlers ---
    const autoSetTime = (value: string, type: 'start' | 'end') => {
        if (!value) return "";
        return type === 'start' ? `${value.split('T')[0]}T00:00` : `${value.split('T')[0]}T23:59`;
    };

    const handleSave = () => {
        if (!isFormValid) return;

        const data = mapGroupBuyData(existingData || {});

        const finalJoinStart = isEditSignupPeriod ? signupStartDate : paymentStartDate;
        const finalJoinEnd = isEditSignupPeriod ? signupEndDate : paymentEndDate;

        const updatePayload: any = {
            // 도메인 필드 우선 저장
            contractor,
            subject,
            paymentStartAt: paymentStartDate,
            paymentEndAt: paymentEndDate,
            joinStartAt: finalJoinStart,
            joinEndAt: finalJoinEnd,
            isJoinPeriodEdit: isEditSignupPeriod,

            // 호환용 레거시 필드도 함께 업데이트 (안전성 보장)
            influencer: contractor,
            subjects: subject,
            paymentStartDate,
            paymentEndDate,
            signupStartDate: finalJoinStart,
            signupEndDate: finalJoinEnd,
            isEditSignupPeriod,

            subtitle,
            title: groupBuyTitle,
            tickets: selectedTickets,
            benefitFreeDays,
            diagProvided: diagTestOption === 'provided',
            diagRange: diagTestRange,
            guideText,
            adminMemo,
            promo_content_enabled: promoContentEnabled,
            period: `${paymentStartDate.split('T')[0].replace(/-/g, '.')} ~ ${paymentEndDate.split('T')[0].replace(/-/g, '.')}`
        };

        // 상태 실시간 재계산하여 반영
        updatePayload.status = getGroupBuyStatus(updatePayload);

        updateGroupBuy(id, updatePayload);
        alert("저장되었습니다.");
        router.push('/admin/groupbuy');
    };

    const renderTicketTable = (s: string) => {
        return (
            <div key={s} className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-bold">{s}</Badge>
                    <span className="text-sm font-bold text-gray-500">이용권 설정</span>
                </div>
                <div className="border rounded-lg overflow-hidden bg-white">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="w-12 text-center">적용</TableHead>
                                <TableHead className="font-bold">이용권</TableHead>
                                <TableHead className="font-bold text-right pr-4">일수</TableHead>
                                <TableHead className="font-bold">정가</TableHead>
                                <TableHead className="font-bold">할인가</TableHead>
                                <TableHead className="font-bold text-center">할인율</TableHead>
                                <TableHead className="font-bold text-right pr-6">월 환산가</TableHead>
                                <TableHead className="font-bold text-right pr-4">이용기간 추가</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {TICKET_TEMPLATES.map(t => {
                                const key = `${s}_${t.type}`;
                                const data = selectedTickets[key] || { applied: false, days: t.days, price: 0, extraDays: 0 };
                                const standardPrice = PRICES[s as keyof typeof PRICES]?.[t.type as '3개월'] || 0;
                                const discountRate = (data.price > 0 && standardPrice > 0) ? Math.round(((standardPrice - data.price) / standardPrice) * 100) : 0;
                                const monthlyPrice = t.months > 0 ? Math.floor(data.price / t.months) : 0;

                                return (
                                    <TableRow key={key} className={cn(!data.applied && "opacity-60 bg-gray-50/30")}>
                                        <TableCell className="text-center">
                                            <Checkbox checked={data.applied} onCheckedChange={(c) => !isReadOnly && setSelectedTickets({ ...selectedTickets, [key]: { ...data, applied: !!c } })} disabled={isReadOnly} />
                                        </TableCell>
                                        <TableCell className="font-bold">{t.type}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                <Input type="number" value={data.days} onChange={e => setSelectedTickets({ ...selectedTickets, [key]: { ...data, days: Number(e.target.value) } })} disabled={isReadOnly} className="h-9 w-16 text-right font-bold" />
                                                <span className="text-xs font-bold text-gray-400">일</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-400 text-xs">{standardPrice.toLocaleString()}원</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Input type="number" value={data.price} onChange={e => setSelectedTickets({ ...selectedTickets, [key]: { ...data, price: Number(e.target.value) } })} disabled={isReadOnly} className="h-9 w-24 text-right font-bold" />
                                                <span className="text-xs font-bold text-gray-400">원</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center text-primary font-bold">{discountRate}%</TableCell>
                                        <TableCell className="text-right pr-6 font-bold">{monthlyPrice.toLocaleString()}원</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                <Input type="number" value={data.extraDays} onChange={e => setSelectedTickets({ ...selectedTickets, [key]: { ...data, extraDays: Number(e.target.value) } })} disabled={isReadOnly} className="h-9 w-16 text-right font-bold" />
                                                <span className="text-xs font-bold text-gray-400">일</span>
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

    if (!existingData) return <div className="p-10 text-center">데이터를 찾을 수 없습니다.</div>;

    return (
        <div className="p-6 pb-40 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">공동구매 상세/수정</h1>
                    <Badge className={cn(
                        "font-bold",
                        calcStatus === '진행중' ? "bg-primary text-white" :
                            calcStatus === '진행전' ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                    )}>
                        {calcStatus}
                    </Badge>
                </div>
                <div className="flex gap-2">
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    {/* 기본 정보 */}
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Info className="w-4 h-4 text-primary" /> 기본 정보
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-400 pl-1 uppercase tracking-wider">계약자 (인플루언서) *</Label>
                                    <Input value={contractor} onChange={(e) => setContractor(e.target.value)} disabled={isReadOnly} className="h-11" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-400 pl-1 uppercase tracking-wider">적용 과목 *</Label>
                                    <RadioGroup value={subject} onValueChange={(v: any) => setSubject(v)} disabled={isReadOnly} className="flex gap-4 h-11 items-center px-4 bg-gray-50/50 rounded-md border border-gray-100">
                                        {(['리딩수학', '리딩과학', '리딩수학과학'] as const).map(s => (
                                            <div key={s} className="flex items-center space-x-2">
                                                <RadioGroupItem value={s} id={`s-${s}`} />
                                                <Label htmlFor={`s-${s}`} className="text-sm font-bold text-gray-700 cursor-pointer">{s}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 pl-1 uppercase tracking-wider">공동구매 제목 (자동 생성)</Label>
                                <Input value={groupBuyTitle} readOnly className="h-11 bg-gray-50 font-bold text-gray-700 shadow-inner" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-400 pl-1 uppercase tracking-wider">공동구매 부제목 *</Label>
                                    <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} disabled={isReadOnly} placeholder="예: 최대 35% 할인" className="h-11" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] font-bold text-gray-400 pl-1 uppercase tracking-wider">공동구매 코드</Label>
                                    <Input value={groupBuyCode} readOnly className="h-11 bg-gray-50 font-bold text-primary font-mono" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 기간 설정 */}
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" /> 기간 설정
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-gray-800">결제 가능 기간 (공구 진행 기간) *</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input type="datetime-local" value={paymentStartDate} onChange={(e) => setPaymentStartDate(autoSetTime(e.target.value, 'start'))} disabled={isReadOnly} className="h-11" />
                                    <Input type="datetime-local" value={paymentEndDate} onChange={(e) => setPaymentEndDate(autoSetTime(e.target.value, 'end'))} disabled={isReadOnly} className="h-11" />
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-6">
                                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold">가입 기간 개별 편집</Label>
                                        <p className="text-xs text-gray-500">실제 기간과 가입 기간을 다르게 설정할 경우 활성화하세요.</p>
                                    </div>
                                    <Switch checked={isEditSignupPeriod} onCheckedChange={setIsEditSignupPeriod} disabled={isReadOnly} />
                                </div>
                                {isEditSignupPeriod && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                        <Input type="datetime-local" value={signupStartDate} onChange={(e) => setSignupStartDate(autoSetTime(e.target.value, 'start'))} disabled={isReadOnly} className="h-11" />
                                        <Input type="datetime-local" value={signupEndDate} onChange={(e) => setSignupEndDate(autoSetTime(e.target.value, 'end'))} disabled={isReadOnly} className="h-11" />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 이용권 설정 */}
                    <Card className="shadow-sm border-gray-100 overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
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
                    {/* 상태 요약 */}
                    <Card className="shadow-sm border-gray-100 bg-gray-50/30">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-600">
                                <List className="w-4 h-4" /> 상세 요약
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableBody>
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableCell className="text-xs font-bold text-gray-500 py-3 px-4">공동구매 상태</TableCell>
                                        <TableCell className="text-right py-3 px-4">
                                            <Badge variant="outline" className={cn(
                                                "font-bold text-[11px]",
                                                calcStatus === '진행중' ? "bg-primary/10 text-primary border-primary/20" :
                                                    calcStatus === '진행전' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-100 text-gray-500 border-gray-200"
                                            )}>
                                                {calcStatus}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* 혜택 설정 */}
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Gift className="w-4 h-4 text-primary" /> 혜택 설정
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">무료체험 기간 *</Label>
                                <div className="flex items-center gap-2">
                                    <Input type="number" value={benefitFreeDays} onChange={e => setBenefitFreeDays(Number(e.target.value))} disabled={isReadOnly} className="h-11 font-bold text-right" />
                                    <span className="text-sm font-bold text-gray-500">일</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 진단평가 설정 */}
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-primary" /> 진단평가 설정
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">진단평가 제공 여부</Label>
                                <RadioGroup value={diagTestOption} onValueChange={(v: any) => setDiagTestOption(v)} disabled={isReadOnly} className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="provided" id="d-provided" />
                                        <Label htmlFor="d-provided" className="text-sm font-medium">제공</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="none" id="d-none" />
                                        <Label htmlFor="d-none" className="text-sm font-medium">없음</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <Separator className="bg-gray-100" />

                            <div className="space-y-3">
                                <Label className="text-[11px] font-bold text-gray-400 uppercase">제공 설정 (학생 적용 학기)</Label>
                                {diagTestOption === 'provided' ? (
                                    <RadioGroup value={diagTestRange} onValueChange={(v: any) => setDiagTestRange(v)} disabled={isReadOnly} className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'semester', label: '학생 적용 학기' },
                                            { id: 'grade', label: '학생 적용 학년' },
                                            { id: 'all', label: '전체' }
                                        ].map(opt => (
                                            <div key={opt.id} className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <RadioGroupItem value={opt.id} id={`dr-${opt.id}`} />
                                                <Label htmlFor={`dr-${opt.id}`} className="text-sm font-medium cursor-pointer w-full">{opt.label}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">없음</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 안내 문구 */}
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <AlignLeft className="w-4 h-4 text-primary" /> 공동구매 안내 문구
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Textarea value={guideText} onChange={e => setGuideText(e.target.value)} disabled={isReadOnly} rows={10} className="resize-none leading-relaxed text-sm p-4 bg-gray-50/50 border-gray-100" />
                        </CardContent>
                    </Card>

                    {/* 홍보 콘텐츠 설정 영역 */}
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-primary" /> 홍보 콘텐츠 설정
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                <div className="space-y-0.5">
                                    <Label htmlFor="promo-toggle" className="text-sm font-bold cursor-pointer">홍보 콘텐츠 노출</Label>
                                    <p className="text-xs text-gray-500">미리보기 및 결제 페이지에서 상품 상세 이미지를 노출합니다.</p>
                                </div>
                                <Switch
                                    id="promo-toggle"
                                    checked={promoContentEnabled}
                                    onCheckedChange={setPromoContentEnabled}
                                    disabled={isReadOnly}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 관리 메모 */}
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Hash className="w-4 h-4 text-primary" /> 관리자 메모 (비노출)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Textarea value={adminMemo} onChange={e => setAdminMemo(e.target.value)} disabled={isReadOnly} rows={4} className="resize-none text-sm bg-gray-50/50 border-gray-100" />
                        </CardContent>
                    </Card>
                </div >
            </div >

            {/* 하단 버튼 */}
            < div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 flex justify-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" >
                <Button variant="outline" className="h-12 px-10 font-bold text-gray-500 bg-gray-50 border-gray-200" onClick={() => router.push('/admin/groupbuy')}>목록</Button>
                {
                    !isReadOnly && (
                        <>
                            <Button variant="outline" className="h-12 px-10 font-bold border-primary text-primary shadow-sm" onClick={() => window.open(`/admin/groupbuy/preview/${id}`, '_blank')}>
                                <Eye className="w-4 h-4 mr-2" /> 미리보기
                            </Button>
                            <Button
                                className="h-12 px-16 font-bold bg-primary hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20"
                                disabled={!isFormValid}
                                onClick={handleSave}
                            >
                                <Save className="w-5 h-5 mr-2" /> 저장
                            </Button>
                        </>
                    )
                }
            </div >
        </div >
    );
}
