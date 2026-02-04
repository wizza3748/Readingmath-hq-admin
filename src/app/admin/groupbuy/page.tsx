'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ExternalLink,
    FileText,
    BarChart3,
    Edit,
    StopCircle,
    Copy,
    PlusCircle,
    ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useGroupBuyStore, type GroupBuy, mapGroupBuyData, getGroupBuyStatus } from '@/lib/store';

// --- Dummy Statistics Data ---
const STATS_DUMMY: Record<string, any> = {
    "DEFAULT": {
        summary: { joinCount: 120, totalOrders: 156, totalAmount: "18,134,400원", baseTime: "2026-01-26 17:00:00" },
        items: [
            { type: "리딩수학 3개월", price: 180000, new: { count: 40, amount: 7200000 }, return: { count: 10, amount: 1800000 }, renew: { count: 5, amount: 900000 }, partial: { count: 2, amount: 360000 } },
            { type: "리딩과학 3개월", price: 180000, new: { count: 30, amount: 5400000 }, return: { count: 5, amount: 900000 }, renew: { count: 2, amount: 360000 }, partial: { count: 1, amount: 180000 } },
            { type: "리딩수학과학 12개월", price: 540000, new: { count: 10, amount: 3400000 }, return: { count: 3, amount: 1620000 }, renew: { count: 1, amount: 540000 }, partial: { count: 0, amount: 0 } },
        ]
    }
};

export default function GroupBuyAdminPage() {
    const router = useRouter();
    const { groupBuys, stopGroupBuy, setDraftGroupBuy } = useGroupBuyStore();

    const formatPeriod = (start?: string, end?: string) => {
        if (!start || !end) return "-";
        const clean = (s: string) => s.split('T')[0].replace(/-/g, '.');
        return `${clean(start)} ~ ${clean(end)}`;
    };

    // Modals State
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<GroupBuy | null>(null);

    // --- Handlers ---
    const handleStop = (id: string, title: string) => {
        if (window.confirm(`[${title}] 공동구매를 중지하시겠습니까?\n중지 시 즉시 종료 상태로 변경됩니다.`)) {
            stopGroupBuy(id);
        }
    };

    const openCloneModal = (item: GroupBuy) => {
        setSelectedItem(item);
        setIsCloneModalOpen(true);
    };

    const openStatsModal = (item: GroupBuy) => {
        setSelectedItem(item);
        setIsStatsModalOpen(true);
    };

    // Filtered Data (Dynamic Status)
    const ongoingItems = groupBuys.filter(item => getGroupBuyStatus(item) === '진행중');
    const listItems = groupBuys.filter(item => getGroupBuyStatus(item) !== '진행중');

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* 1) 상단 버튼 영역 */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">공동구매 관리</h1>
                <Button
                    className="bg-primary hover:bg-primary/90 gap-2 h-11 px-6 font-bold shadow-md shadow-primary/20"
                    onClick={() => router.push('/admin/groupbuy/new')}
                >
                    <PlusCircle className="w-5 h-5" />
                    공동구매 등록
                </Button>
            </div>

            {/* 2) 진행중 공동구매 영역 */}
            {ongoingItems.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-5 bg-primary rounded-full" />
                        <h2 className="text-lg font-bold text-gray-800">진행중 공동구매</h2>
                    </div>
                    <div className="grid gap-4">
                        {ongoingItems.map((item: GroupBuy) => {
                            const data = mapGroupBuyData(item);
                            return (
                                <Card key={item.id} className="border-primary/20 bg-primary/[0.02] shadow-sm hover:shadow-md transition-shadow">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row items-stretch">
                                            {/* 카드 주요 정보 */}
                                            <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                                                <div className="md:col-span-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-primary text-white font-bold h-5 px-1.5 flex items-center justify-center">진행중</Badge>
                                                        <span className="text-xs font-bold text-gray-500">{data.contractor}</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900">{data.title}</h3>
                                                    <p className="text-sm font-medium text-primary">{data.subtitle}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">적용 과목 / 결제 가능 기간</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="h-5 px-1.5 text-[11px] border-gray-200 text-gray-600 bg-white">{data.subject}</Badge>
                                                        <p className="text-sm font-semibold text-gray-700">{formatPeriod(data.paymentStartAt, data.paymentEndAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">가입 인원</p>
                                                    <p className="text-lg font-bold text-gray-900">{item.joinCount?.toLocaleString()}명</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">총 결제 금액</p>
                                                    <p className="text-lg font-bold text-primary">{item.totalAmount}</p>
                                                </div>
                                            </div>
                                            {/* 카드 기능 버튼 영역 */}
                                            <div className="bg-gray-50/50 border-t md:border-t-0 md:border-l border-gray-100 p-4 flex md:flex-col gap-2 justify-center items-center md:min-w-[140px]">
                                                <Button variant="outline" size="sm" className="w-full h-9 gap-1.5 bg-white font-bold text-gray-600 border-gray-200" onClick={() => window.open(`/admin/groupbuy/preview/${item.id}`, '_blank')}>
                                                    <ShoppingBag className="w-3.5 h-3.5" /> URL 바로가기
                                                </Button>
                                                <div className="flex gap-2 w-full">
                                                    <Button variant="outline" size="sm" className="flex-1 h-9 gap-1 bg-white font-bold text-gray-600" onClick={() => router.push(`/admin/groupbuy/${item.id}`)}>
                                                        <FileText className="w-3.5 h-3.5" /> 상세
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="flex-1 h-9 gap-1 bg-white font-bold text-gray-600" onClick={() => openCloneModal(item)}>
                                                        <Copy className="w-3.5 h-3.5" /> 복제
                                                    </Button>
                                                </div>
                                                <div className="flex gap-2 w-full">
                                                    <Button variant="outline" size="sm" className="flex-1 h-9 gap-1 bg-white font-bold text-gray-600" onClick={() => openStatsModal(item)}>
                                                        <BarChart3 className="w-3.5 h-3.5" /> 통계
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="flex-1 h-9 gap-1 bg-white font-bold text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600" onClick={() => handleStop(item.id, item.title)}>
                                                        <StopCircle className="w-3.5 h-3.5" /> 중지
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </section>
            )}

            {/* 3) 공동구매 목록 영역 */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-gray-400 rounded-full" />
                    <h2 className="text-lg font-bold text-gray-800">공동구매 목록</h2>
                </div>
                <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[300px] font-bold text-gray-700 h-12">공동구매 제목</TableHead>
                                <TableHead className="font-bold text-gray-700">계약자</TableHead>
                                <TableHead className="font-bold text-gray-700">적용 과목</TableHead>
                                <TableHead className="font-bold text-gray-700">결제 가능 기간</TableHead>
                                <TableHead className="font-bold text-gray-700 text-center">상태</TableHead>
                                <TableHead className="font-bold text-gray-700 text-center">통계</TableHead>
                                <TableHead className="font-bold text-gray-700 text-center">관리</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {listItems.map((item: GroupBuy) => {
                                const data = mapGroupBuyData(item);
                                const status = getGroupBuyStatus(item);
                                return (
                                    <TableRow key={item.id} className="hover:bg-gray-50/50 group h-14">
                                        <TableCell className="font-bold text-gray-900">{data.title}</TableCell>
                                        <TableCell className="text-gray-600">{data.contractor}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="h-5 px-1.5 border-gray-200 text-gray-500 font-medium">{data.subject}</Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-600 text-[13px]">{formatPeriod(data.paymentStartAt, data.paymentEndAt)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={cn(
                                                "font-bold",
                                                status === '진행중' ? "bg-primary text-white border-none px-2" :
                                                    status === '진행전' ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-2" : "bg-gray-100 text-gray-500 hover:bg-gray-100 border-none px-2"
                                            )}>
                                                {status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {status !== '진행전' && (
                                                <Button variant="outline" size="sm" className="h-8 gap-1 bg-white font-bold text-gray-600 border-gray-100" onClick={() => openStatsModal(item)}>
                                                    <BarChart3 className="w-3.5 h-3.5" /> 통계
                                                </Button>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button variant="outline" size="sm" className="h-8 gap-1 bg-white font-bold text-gray-600 border-gray-100" onClick={() => router.push(`/admin/groupbuy/${item.id}`)}>
                                                    <FileText className="w-3.5 h-3.5" /> 상세
                                                </Button>
                                                <Button variant="outline" size="sm" className="h-8 gap-1 bg-white font-bold text-gray-600 border-gray-100" onClick={() => openCloneModal(item)}>
                                                    <Copy className="w-3.5 h-3.5" /> 복제
                                                </Button>
                                                {status !== '종료' && (
                                                    <Button variant="outline" size="sm" className="h-8 gap-1 bg-white font-bold text-gray-600 border-gray-100" onClick={() => window.open(`/admin/groupbuy/preview/${item.id}`, '_blank')}>
                                                        <ShoppingBag className="w-3.5 h-3.5" /> 미리보기
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </section>

            {/* 4) 공동구매 복제 확인 모달 */}
            <Dialog open={isCloneModalOpen} onOpenChange={setIsCloneModalOpen}>
                <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-6 bg-gray-900 text-white">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Copy className="w-5 h-5 text-primary" /> 공동구매 복제 확인
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-0.5">기준 공동구매 정보</p>
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4">
                                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400">공동구매 제목</p>
                                        <p className="text-sm font-bold text-gray-800">{selectedItem?.title}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400">계약자</p>
                                        <p className="text-sm font-bold text-gray-800">{selectedItem?.influencer}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400">적용 과목</p>
                                        <p className="text-sm font-bold text-gray-800">{selectedItem?.subjects}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-400">결제 가능 기간</p>
                                        <p className="text-sm font-bold text-gray-800">{selectedItem?.period}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
                            <div className="bg-blue-500 rounded-full p-1 mt-0.5">
                                <PlusCircle className="w-3 h-3 text-white" />
                            </div>
                            <p className="text-[13px] font-medium text-blue-800 leading-relaxed">
                                선택한 공동구매를 복제하여 새 공동구매를 등록합니다.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-0 flex gap-3">
                        <Button variant="outline" className="flex-1 h-12 font-bold text-gray-500" onClick={() => setIsCloneModalOpen(false)}>
                            취소
                        </Button>
                        <Button className="flex-1 h-12 font-bold bg-primary hover:bg-primary/90" onClick={() => {
                            if (selectedItem) {
                                setDraftGroupBuy({
                                    subjects: selectedItem.subjects,
                                    tickets: selectedItem.tickets,
                                    benefitFreeDays: selectedItem.benefitFreeDays,
                                    diagProvided: selectedItem.diagProvided,
                                    diagRange: selectedItem.diagRange,
                                    guideText: selectedItem.guideText,
                                    adminMemo: selectedItem.adminMemo,
                                    promo_content_enabled: selectedItem.promo_content_enabled
                                });
                                router.push('/admin/groupbuy/new');
                            }
                        }}>
                            복제하여 등록
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 5) 공동구매 통계 모달 */}
            <Dialog open={isStatsModalOpen} onOpenChange={setIsStatsModalOpen}>
                <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto p-8 border-none shadow-2xl">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
                            <div className="w-2 h-8 bg-primary rounded-full" />
                            공동구매 통계
                        </DialogTitle>
                        {selectedItem && (
                            <DialogDescription className="text-sm font-bold text-gray-500 mt-2 pl-5">
                                {(() => {
                                    const data = mapGroupBuyData(selectedItem);
                                    return `${data.subject} X ${data.contractor} 공동구매 이벤트!`;
                                })()}
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    {selectedItem && (
                        <div className="space-y-10">
                            {/* 요약 영역 */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-5 gap-4">
                                    {[
                                        { label: "순매출 인원", value: "183명", unit: "" },
                                        { label: "순 매출액", value: "117,580,500원", unit: "" },
                                        {
                                            label: "순 신규 유입",
                                            value: "131명",
                                            subValue: "(71.6%)",
                                            color: "text-blue-600"
                                        },
                                        {
                                            label: "취소/환불",
                                            value: "3명",
                                            subValue: "(1.6%)",
                                            color: "text-green-600"
                                        },
                                        {
                                            label: "객단가",
                                            value: "644,976원",
                                            subText: "1인당 평균 결제 금액"
                                        }
                                    ].map((s, i) => (
                                        <div key={i} className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm text-center h-[140px]">
                                            <p className="text-[13px] font-bold text-gray-500 mb-2">{s.label}</p>
                                            <div className="flex flex-col items-center">
                                                <p className={cn("text-2xl font-black", s.color || "text-gray-900")}>
                                                    {s.value}
                                                    {s.subValue && <span className="text-sm ml-1 font-bold opacity-80">{s.subValue}</span>}
                                                </p>
                                                {s.subText && <p className="text-[11px] font-bold text-gray-400 mt-1">{s.subText}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end pr-2">
                                    <p className="text-[12px] font-medium text-gray-400 flex items-center gap-1">
                                        <span className="w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center text-[10px]">i</span>
                                        순 매출액 기준이며, 객단가는 환불 전 결제금액 기준입니다.
                                    </p>
                                </div>
                            </div>

                            {/* 상품별 판매 금액 영역 */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-5 bg-blue-600 rounded-full" />
                                    <h3 className="text-lg font-bold text-gray-900">상품별 판매 금액</h3>
                                </div>
                                <div className="border rounded-xl overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-gray-50/50 border-b">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="font-bold text-xs text-center py-4">상품명</TableHead>
                                                <TableHead className="font-bold text-xs text-center">상품 금액</TableHead>
                                                <TableHead className="font-bold text-xs text-center">결제 인원</TableHead>
                                                <TableHead className="font-bold text-xs text-center">결제 금액</TableHead>
                                                <TableHead className="font-bold text-xs text-center">취소/환불 인원</TableHead>
                                                <TableHead className="font-bold text-xs text-center">취소/환불 금액</TableHead>
                                                <TableHead className="font-bold text-xs text-center">순매출 인원</TableHead>
                                                <TableHead className="font-bold text-xs text-center">순매출액</TableHead>
                                                <TableHead className="font-bold text-xs text-center">판매 비중</TableHead>
                                                <TableHead className="font-bold text-xs text-center">환불율</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[
                                                { name: "3개월 이용권", price: "238,500원", pCount: "31명", pAmount: "7,393,500원", rCount: "0명", rAmount: "0원", sCount: "31명", sAmount: "7,393,500원", share: "6.3%", refund: "0.0%" },
                                                { name: "6개월 이용권", price: "477,000원", pCount: "74명", pAmount: "35,298,000원", rCount: "1명", rAmount: "477,000원", sCount: "73명", sAmount: "34,821,000원", share: "29.6%", refund: "1.4%" },
                                                { name: "12개월 이용권", price: "954,000원", pCount: "81명", pAmount: "77,274,000원", rCount: "2명", rAmount: "1,908,000원", sCount: "79명", sAmount: "75,366,000원", share: "64.1%", refund: "2.5%" },
                                            ].map((row, i) => (
                                                <TableRow key={i} className="text-[13px] h-12">
                                                    <TableCell className="text-gray-700 font-medium px-4">{row.name}</TableCell>
                                                    <TableCell className="text-center text-gray-600">{row.price}</TableCell>
                                                    <TableCell className="text-center text-gray-600">{row.pCount}</TableCell>
                                                    <TableCell className="text-center text-gray-600">{row.pAmount}</TableCell>
                                                    <TableCell className="text-center text-red-500 font-medium">{row.rCount}</TableCell>
                                                    <TableCell className="text-center text-red-500 font-medium">{row.rAmount}</TableCell>
                                                    <TableCell className="text-center font-bold text-gray-900">{row.sCount}</TableCell>
                                                    <TableCell className="text-center font-bold text-gray-900">{row.sAmount}</TableCell>
                                                    <TableCell className="text-center text-gray-600">{row.share}</TableCell>
                                                    <TableCell className="text-center text-red-500 font-medium">{row.refund}</TableCell>
                                                </TableRow>
                                            ))}
                                            {/* 합계 행 */}
                                            <TableRow className="bg-blue-50/30 font-bold border-t h-12">
                                                <TableCell className="px-4">합계</TableCell>
                                                <TableCell className="text-center">-</TableCell>
                                                <TableCell className="text-center">186명</TableCell>
                                                <TableCell className="text-center">119,965,500원</TableCell>
                                                <TableCell className="text-center text-red-500">3명</TableCell>
                                                <TableCell className="text-center text-red-500">2,385,000원</TableCell>
                                                <TableCell className="text-center text-gray-900 underline underline-offset-4 decoration-2 decoration-blue-200">183명</TableCell>
                                                <TableCell className="text-center text-gray-900 underline underline-offset-4 decoration-2 decoration-blue-200">117,580,500원</TableCell>
                                                <TableCell className="text-center">100%</TableCell>
                                                <TableCell className="text-center text-red-500">1.6%</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* 회원 유형별 판매 금액 영역 */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-5 bg-blue-600 rounded-full" />
                                    <h3 className="text-lg font-bold text-gray-900">회원 유형별 판매 금액</h3>
                                </div>
                                <div className="border rounded-xl overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-gray-50/50 border-b">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="font-bold text-xs text-center py-4">회원 구분</TableHead>
                                                <TableHead className="font-bold text-xs text-center">결제 인원</TableHead>
                                                <TableHead className="font-bold text-xs text-center">결제 금액</TableHead>
                                                <TableHead className="font-bold text-xs text-center">취소/환불 인원</TableHead>
                                                <TableHead className="font-bold text-xs text-center">취소/환불 금액</TableHead>
                                                <TableHead className="font-bold text-xs text-center">순매출 인원</TableHead>
                                                <TableHead className="font-bold text-xs text-center">순매출액</TableHead>
                                                <TableHead className="font-bold text-xs text-center">판매 비중</TableHead>
                                                <TableHead className="font-bold text-xs text-center">환불율</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[
                                                { type: "신규 회원", pCount: "133명", pAmount: "85,781,782원", rCount: "2명", rAmount: "1,289,952원", sCount: "131명", sAmount: "84,491,830원", share: "71.9%", refund: "1.5%" },
                                                { type: "재결제 회원", pCount: "53명", pAmount: "34,183,718원", rCount: "1명", rAmount: "1,095,048원", sCount: "52명", sAmount: "33,088,670원", share: "28.1%", refund: "1.9%" },
                                            ].map((row, i) => (
                                                <TableRow key={i} className="text-[13px] h-12">
                                                    <TableCell className="text-gray-700 font-medium px-4">{row.type}</TableCell>
                                                    <TableCell className="text-center text-gray-600">{row.pCount}</TableCell>
                                                    <TableCell className="text-center text-gray-600">{row.pAmount}</TableCell>
                                                    <TableCell className="text-center text-red-500 font-medium">{row.rCount}</TableCell>
                                                    <TableCell className="text-center text-red-500 font-medium">{row.rAmount}</TableCell>
                                                    <TableCell className="text-center font-bold text-gray-900">{row.sCount}</TableCell>
                                                    <TableCell className="text-center font-bold text-gray-900">{row.sAmount}</TableCell>
                                                    <TableCell className="text-center text-gray-600">{row.share}</TableCell>
                                                    <TableCell className="text-center text-red-500 font-medium">{row.refund}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-blue-50/30 font-bold border-t h-12">
                                                <TableCell className="px-4">합계</TableCell>
                                                <TableCell className="text-center">186명</TableCell>
                                                <TableCell className="text-center">119,965,500원</TableCell>
                                                <TableCell className="text-center text-red-500">3명</TableCell>
                                                <TableCell className="text-center text-red-500">2,385,000원</TableCell>
                                                <TableCell className="text-center text-gray-900 underline underline-offset-4 decoration-2 decoration-blue-200">183명</TableCell>
                                                <TableCell className="text-center text-gray-900 underline underline-offset-4 decoration-2 decoration-blue-200">117,580,500원</TableCell>
                                                <TableCell className="text-center">100%</TableCell>
                                                <TableCell className="text-center text-red-500">1.6%</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}
