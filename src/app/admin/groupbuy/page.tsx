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

            {/* 5) 공동구매 통계 모달 (빈 쉘) */}
            <Dialog open={isStatsModalOpen} onOpenChange={setIsStatsModalOpen}>
                <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <BarChart3 className="w-6 h-6 text-primary" /> 공동구매 통계
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            {selectedItem?.title}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedItem && (
                        <div className="space-y-8 py-4">
                            {/* 요약 영역 */}
                            {(() => {
                                const isHQ = selectedItem.id === 'GB-LIVE-HQ-001';
                                return (
                                    <div className="grid grid-cols-4 gap-4">
                                        {[
                                            { label: "가입 인원", value: `${selectedItem.joinCount || 0}명` },
                                            { label: "총 결제 건수", value: isHQ ? "0건" : "156건" },
                                            { label: "총 결제 금액", value: selectedItem.totalAmount || "0원", highlight: true },
                                            { label: "조회 기준 시각", value: isHQ ? "-" : "2026-01-26 17:00", small: true }
                                        ].map((s, i) => (
                                            <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{s.label}</p>
                                                <p className={cn("text-lg font-black", s.highlight ? "text-primary" : "text-gray-900", s.small && "text-sm")}>{s.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}

                            {/* 이용권별 결제 현황 테이블 */}
                            <div className="border rounded-xl overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-gray-50/80">
                                        <TableRow>
                                            <TableHead className="font-bold text-xs">상품구분</TableHead>
                                            <TableHead className="font-bold text-xs">상품금액</TableHead>
                                            <TableHead className="font-bold text-xs text-center">신규 (인원/금액)</TableHead>
                                            <TableHead className="font-bold text-xs text-center">복귀 (인원/금액)</TableHead>
                                            <TableHead className="font-bold text-xs text-center">연장 (인원/금액)</TableHead>
                                            <TableHead className="font-bold text-xs text-center">부분취소 (인원/금액)</TableHead>
                                            <TableHead className="font-bold text-xs text-right">합계 (인원/금액)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(() => {
                                            const isHQ = selectedItem.id === 'GB-LIVE-HQ-001';
                                            return (
                                                <>
                                                    {STATS_DUMMY.DEFAULT.items.map((it: any, i: number) => {
                                                        const totalC = isHQ ? 0 : (it.new.count + it.return.count + it.renew.count);
                                                        const totalA = isHQ ? 0 : (it.new.amount + it.return.amount + it.renew.amount);
                                                        return (
                                                            <TableRow key={i} className="text-[13px]">
                                                                <TableCell className="font-bold">{it.type}</TableCell>
                                                                <TableCell className="text-gray-500">{it.price.toLocaleString()}원</TableCell>
                                                                <TableCell className="text-center">{isHQ ? 0 : it.new.count}명 / {isHQ ? 0 : it.new.amount.toLocaleString()}원</TableCell>
                                                                <TableCell className="text-center">{isHQ ? 0 : it.return.count}명 / {isHQ ? 0 : it.return.amount.toLocaleString()}원</TableCell>
                                                                <TableCell className="text-center text-blue-600">{isHQ ? 0 : it.renew.count}명 / {isHQ ? 0 : it.renew.amount.toLocaleString()}원</TableCell>
                                                                <TableCell className="text-center text-red-500">{isHQ ? 0 : it.partial.count}명 / {isHQ ? 0 : it.partial.amount.toLocaleString()}원</TableCell>
                                                                <TableCell className="text-right font-bold">{totalC}명 / {totalA.toLocaleString()}원</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                    {/* 합계 행 */}
                                                    <TableRow className="bg-primary/5 font-black text-primary">
                                                        <TableCell colSpan={2} className="text-center">합계</TableCell>
                                                        <TableCell className="text-center">{isHQ ? 0 : 80}명 / -</TableCell>
                                                        <TableCell className="text-center">{isHQ ? 0 : 18}명 / -</TableCell>
                                                        <TableCell className="text-center">{isHQ ? 0 : 8}명 / -</TableCell>
                                                        <TableCell className="text-center">{isHQ ? 0 : 3}명 / -</TableCell>
                                                        <TableCell className="text-right">{isHQ ? 0 : 106}명 / {isHQ ? "0원" : "18,134,400원"}</TableCell>
                                                    </TableRow>
                                                    {/* 비율 행 */}
                                                    <TableRow className="bg-gray-50 text-[11px] font-bold text-gray-500">
                                                        <TableCell colSpan={2} className="text-center">결제 비율 (취소 제외)</TableCell>
                                                        <TableCell className="text-center">{isHQ ? "-" : "75%"}</TableCell>
                                                        <TableCell className="text-center">{isHQ ? "-" : "17%"}</TableCell>
                                                        <TableCell className="text-center">{isHQ ? "-" : "8%"}</TableCell>
                                                        <TableCell className="text-center">-</TableCell>
                                                        <TableCell className="text-right">{isHQ ? "-" : "100%"}</TableCell>
                                                    </TableRow>
                                                </>
                                            );
                                        })()}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="pt-4 border-t">
                        <Button className="w-full h-12 font-bold" onClick={() => setIsStatsModalOpen(false)}>
                            닫기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
