
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CalendarDays,
    MessageSquareText,
    User,
    FileText,
    History,
    Clock,
    ChevronLeft,
    GraduationCap,
    Beaker,
    CalendarCheck,
    HelpCircle,
    Info
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Mock Data
const studentInfo = {
    name: "김선우",
    grade: "초등 3학년",
    learningPeriod: "2026-01-01 ~ 2026-01-31",
};

const monthlyCategories = [
    {
        title: "기본안내",
        tooltip: (
            <div className="space-y-1 text-[11px]">
                <p>• 주간학습알림: 생성일 10시 자동발송</p>
                <p>• 학습보고서: 생성일 다음날 10시 자동발송</p>
            </div>
        ),
        items: [
            { id: "base-1", label: "학습 관리방법을 안내했어요" },
            { id: "base-2", label: "주간학습알림과 학습보고서 발송일정을 안내했어요" },
        ]
    },
    {
        title: "종합점수",
        tooltip: "학습보고서 종합점수 참고",
        items: [
            { id: "score-1", label: "종합점수가 유지되고 있어요" },
            { id: "score-2", label: "종합점수가 내려가고 있어요" },
            { id: "score-3", label: "종합점수가 올라가고 있어요" },
        ]
    },
    {
        title: "학습시간",
        tooltip: (
            <div className="space-y-1 text-[11px]">
                <p>• 출석 현황 참고</p>
                <p>• 권장 출석일: 주 3일</p>
                <p>• 권장 1일 학습시간: 40분</p>
            </div>
        ),
        items: [
            { id: "time-1", label: "규칙적으로 출석하여 학습하고 있어요" },
            { id: "time-2", label: "규칙적으로 출석하여 학습하도록 안내했어요" },
            { id: "time-3", label: "1일 학습시간이 적절해요" },
            { id: "time-4", label: "1일 학습시간이 부족해요" },
        ]
    },
    {
        title: "학습량",
        tooltip: (
            <div className="space-y-1 text-[11px]">
                <p>• 학습보고서 참고</p>
                <p>• 권장 학습량: 훈련 12개, 소단원 4개</p>
                <p>• 특정 훈련 제외 여부 확인 후 안내</p>
                <p>• 소단원 1개 = 훈련 3개</p>
            </div>
        ),
        items: [
            { id: "amount-1", label: "현재의 학습량을 유지하도록 당부했어요" },
            { id: "amount-2", label: "권장 학습량을 채워서 하도록 안내했어요" },
            { id: "amount-3", label: "소단원의 모든 훈련을 학습하도록 안내했어요" },
        ]
    },
    {
        title: "학습지도",
        tooltip: (
            <div className="space-y-1 text-[11px]">
                <p>• 학습보고서 참고</p>
                <p>• 우수 훈련: 96~100</p>
                <p>• 권장 훈련: 71~95</p>
                <p>• 취약 훈련: 0~70</p>
            </div>
        ),
        items: [
            { id: "guide-1", label: "우수 학습은 오답노트를 하도록 안내했어요" },
            { id: "guide-2", label: "권장 학습은 복습 또는 오답노트를 하도록 안내했어요" },
            { id: "guide-3", label: "취약 학습은 복습과 오답노트 모두 하도록 안내했어요" },
            { id: "guide-4", label: "당일 복습보다는 2~3일 뒤 복습하도록 안내했어요" },
        ]
    },
    {
        title: "결제/환불",
        items: [
            { id: "payment-1", label: "학습 중단을 희망해요" },
            { id: "payment-2", label: "환불을 문의했어요" },
        ]
    }
];

export default function LearningCounselingDetailPage() {
    const [activeTab, setActiveTab] = useState('monthly');
    const [monthlyStatus, setMonthlyStatus] = useState<'pending' | 'completed'>('pending');
    const [isExpanded, setIsExpanded] = useState(true);

    // Monthly Counseling Form States
    const [callStatus, setCallStatus] = useState('call');
    const [counselingDate, setCounselingDate] = useState('2025-01-21');
    const [counselingTime, setCounselingTime] = useState('14:30');
    const [additionalContent, setAdditionalContent] = useState('');
    const [checkedItems, setCheckedItems] = useState<string[]>([]);

    const handleSaveMonthly = () => {
        setMonthlyStatus('completed');
        setIsExpanded(false);
    };

    const toggleCheckItem = (id: string) => {
        setCheckedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // 일반상담 이력 상태 관리
    const [generalHistory, setGeneralHistory] = useState([
        {
            id: 1,
            type: "일반상담",
            date: "2025-01-15 15:20",
            author: "관리자(홍길동)",
            content: "부모님께서 결제 관련하여 문의 주심. 자동 결제일 변경 요청 접수 후 담당 팀 전달 예정."
        },
        {
            id: 2,
            type: "일반상담",
            date: "2025-01-05 09:40",
            author: "본사(김철수)",
            content: "학습 기기 오작동으로 인한 초기화 안내 진행 및 확인. 현재 정상 작동 중."
        }
    ]);

    // 편집 모드 상태 관리
    const [editingHistoryId, setEditingHistoryId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState("");

    const handleEditStart = (id: number, currentContent: string) => {
        setEditingHistoryId(id);
        setEditContent(currentContent);
    };

    const handleEditSave = (id: number) => {
        setGeneralHistory(prev => prev.map(item =>
            item.id === id ? { ...item, content: editContent } : item
        ));
        setEditingHistoryId(null);
        setEditContent("");
    };

    const handleEditCancel = () => {
        setEditingHistoryId(null);
        setEditContent("");
    };

    return (
        <TooltipProvider>
            <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">

                {/* 1. 학생 기본 정보 영역 (간소화됨) */}
                <section className="bg-white border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-1">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">학습기간</p>
                            <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-primary" />
                                {studentInfo.learningPeriod}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5 h-9 bg-blue-50/30 border-blue-100 hover:bg-blue-50 hover:text-blue-700">
                            <GraduationCap className="w-4 h-4" /> 수학 학습보고서
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 h-9 bg-green-50/30 border-green-100 hover:bg-green-50 hover:text-green-700">
                            <Beaker className="w-4 h-4" /> 과학 학습보고서
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 h-9">
                            <CalendarCheck className="w-4 h-4" /> 출석현황 보기
                        </Button>
                    </div>
                </section>

                {/* 2. 상담 등록 영역 (탭) */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <MessageSquareText className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-bold text-gray-800">상담 등록</h2>
                        </div>
                        {monthlyStatus === 'completed' && activeTab === 'monthly' && (
                            <Badge className="bg-green-500 hover:bg-green-600 animate-in zoom-in-50 duration-300">
                                <Clock className="w-3 h-3 mr-1" /> 상담완료
                            </Badge>
                        )}
                        {monthlyStatus === 'pending' && activeTab === 'monthly' && (
                            <Badge variant="outline" className="text-gray-400 border-gray-200">
                                상담전
                            </Badge>
                        )}
                    </div>

                    <Tabs defaultValue="monthly" className="w-full" onValueChange={setActiveTab} value={activeTab}>
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
                            <TabsTrigger value="monthly">월간상담</TabsTrigger>
                            <TabsTrigger value="general">일반상담</TabsTrigger>
                        </TabsList>

                        <Card className="shadow-none border-gray-200 overflow-hidden">
                            <TabsContent value="monthly" className="m-0 animate-in slide-in-from-left-2 duration-300">
                                {!isExpanded && monthlyStatus === 'completed' ? (
                                    /* 요약 카드 (접힘 상태) */
                                    <div
                                        className="p-6 cursor-pointer bg-gray-50/30 hover:bg-gray-50 transition-colors flex items-center justify-between group border-b last:border-0"
                                        onClick={() => setIsExpanded(true)}
                                    >
                                        <div className="flex items-center gap-8">
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">학습기간</p>
                                                <p className="text-sm font-semibold text-gray-700">{studentInfo.learningPeriod}</p>
                                            </div>
                                            <Separator orientation="vertical" className="h-8" />
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">상담일시</p>
                                                <p className="text-sm font-semibold text-gray-700">{counselingDate} {counselingTime}</p>
                                            </div>
                                            <Separator orientation="vertical" className="h-8" />
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">작성자</p>
                                                <p className="text-sm font-semibold text-gray-700">본사관리자(선생님)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-primary font-bold transition-all group-hover:translate-x-1">
                                            <span className="text-xs">상세보기</span>
                                            <ChevronLeft className="w-4 h-4 rotate-180" />
                                        </div>
                                    </div>
                                ) : (
                                    /* 입력 폼 (펼침 상태) */
                                    <div className="p-6 space-y-8 animate-in fade-in duration-500">
                                        <div className="grid md:grid-cols-2 gap-8 items-stretch">
                                            <div className="space-y-8 flex flex-col h-full">
                                                <div className="space-y-4">
                                                    <Label className="text-[14px] font-bold text-gray-800">통화 상태</Label>
                                                    <RadioGroup
                                                        value={callStatus}
                                                        onValueChange={setCallStatus}
                                                        className="space-y-3"
                                                    >
                                                        <div
                                                            className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${callStatus === 'call' ? 'bg-green-50/50 border-green-200 ring-1 ring-green-100' : 'hover:bg-gray-50 border-gray-100'}`}
                                                            onClick={() => setCallStatus('call')}
                                                        >
                                                            <RadioGroupItem value="call" id="call" className="text-green-600 border-green-300" />
                                                            <div className="flex gap-3 items-center">
                                                                <Badge className="bg-green-500 hover:bg-green-500 font-bold border-none h-6 px-2 min-w-[64px] justify-center">유선상담</Badge>
                                                                <Label htmlFor="call" className="text-[13px] font-medium text-gray-600 cursor-pointer">정상적으로 상담 통화를 완료했어요</Label>
                                                            </div>
                                                        </div>

                                                        <div
                                                            className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${callStatus === 'katalk' ? 'bg-yellow-50/50 border-yellow-200 ring-1 ring-yellow-100' : 'hover:bg-gray-50 border-gray-100'}`}
                                                            onClick={() => setCallStatus('katalk')}
                                                        >
                                                            <RadioGroupItem value="katalk" id="katalk" className="text-yellow-600 border-yellow-300" />
                                                            <div className="flex gap-3 items-center">
                                                                <Badge className="bg-yellow-400 hover:bg-yellow-400 text-yellow-900 font-bold border-none h-6 px-2 min-w-[64px] justify-center text-white">카톡상담</Badge>
                                                                <Label htmlFor="katalk" className="text-[13px] font-medium text-gray-600 cursor-pointer">통화는 못했지만 상담 내용을 메시지로 남겼어요</Label>
                                                            </div>
                                                        </div>

                                                        <div
                                                            className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${callStatus === 'no-response' ? 'bg-gray-100/50 border-gray-200 ring-1 ring-gray-100' : 'hover:bg-gray-50 border-gray-100'}`}
                                                            onClick={() => setCallStatus('no-response')}
                                                        >
                                                            <RadioGroupItem value="no-response" id="no-response" className="text-gray-600 border-gray-300" />
                                                            <div className="flex gap-3 items-center">
                                                                <Badge className="bg-gray-500 hover:bg-gray-500 font-bold border-none h-6 px-2 min-w-[64px] justify-center">응답없음</Badge>
                                                                <Label htmlFor="no-response" className="text-[13px] font-medium text-gray-600 cursor-pointer">전화와 메시지 모두 응답이 없었어요</Label>
                                                            </div>
                                                        </div>
                                                    </RadioGroup>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-[13px] font-bold text-gray-700">상담일시</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="date"
                                                            value={counselingDate}
                                                            onChange={(e) => setCounselingDate(e.target.value)}
                                                            className="flex-1"
                                                        />
                                                        <Input
                                                            type="time"
                                                            value={counselingTime}
                                                            onChange={(e) => setCounselingTime(e.target.value)}
                                                            className="w-[120px]"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3 flex flex-col">
                                                    <Label className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">추가 상담내용</Label>
                                                    <Textarea
                                                        placeholder="추가할 상담 내용이 있다면 입력해주세요."
                                                        className="h-[150px] resize-none overflow-y-auto focus-visible:ring-primary/30"
                                                        value={additionalContent}
                                                        onChange={(e) => setAdditionalContent(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-6 flex flex-col h-0 min-h-full">
                                                <Label className="text-[13px] font-bold text-gray-700 flex items-center gap-2 mb-2">
                                                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                                                    상담 체크리스트
                                                </Label>

                                                <div className="space-y-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 border rounded-lg p-4 bg-gray-50/30 flex-1 min-h-0">
                                                    {monthlyCategories.map((category) => (
                                                        <div key={category.title} className="space-y-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                                            <div className="flex items-center gap-1.5 px-0.5">
                                                                <span className="text-sm font-bold text-gray-800">{category.title}</span>
                                                                {category.tooltip && (
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <button type="button" className="text-gray-400 hover:text-primary transition-colors">
                                                                                <HelpCircle className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="right" className="bg-gray-800 text-white border-none p-3 shadow-xl">
                                                                            {category.tooltip}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2.5 pl-1">
                                                                {category.items.map((item) => (
                                                                    <div key={item.id} className="flex items-start space-x-2.5 group">
                                                                        <Checkbox
                                                                            id={item.id}
                                                                            className="mt-0.5 border-gray-300"
                                                                            checked={checkedItems.includes(item.id)}
                                                                            onCheckedChange={() => toggleCheckItem(item.id)}
                                                                        />
                                                                        <label
                                                                            htmlFor={item.id}
                                                                            className="text-[13px] font-medium leading-relaxed cursor-pointer text-gray-600 group-hover:text-primary transition-colors"
                                                                        >
                                                                            {item.label}
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4 border-t border-gray-100 gap-2">
                                            {monthlyStatus === 'completed' && (
                                                <Button
                                                    variant="outline"
                                                    className="w-full md:w-32 h-11 font-bold text-gray-400"
                                                    onClick={() => setIsExpanded(false)}
                                                >
                                                    취소
                                                </Button>
                                            )}
                                            <Button
                                                className="w-full md:w-40 h-11 font-bold bg-primary hover:bg-primary/90 text-md shadow-md shadow-primary/20"
                                                onClick={handleSaveMonthly}
                                            >
                                                {monthlyStatus === 'completed' ? '수정저장' : '저장하기'}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="general" className="m-0 p-6 space-y-6 animate-in slide-in-from-right-2 duration-300">
                                <div className="space-y-3">
                                    <Label className="text-[13px] font-bold text-gray-700">상담내용</Label>
                                    <Textarea
                                        placeholder="상담 내용을 자유롭게 입력해주세요. (줄바꿈 가능)"
                                        className="min-h-[180px] resize-none focus-visible:ring-primary/30"
                                    />
                                </div>

                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                    <div className="space-y-3 w-full md:w-auto">
                                        <Label className="text-[13px] font-bold text-gray-700">상담일시</Label>
                                        <div className="flex gap-2">
                                            <Input type="date" defaultValue="2025-01-21" />
                                            <Input type="time" defaultValue="14:35" className="w-[120px]" />
                                        </div>
                                    </div>
                                    <Button className="w-full md:w-32 h-10 font-bold bg-primary hover:bg-primary/90">등록</Button>
                                </div>
                            </TabsContent>
                        </Card>
                    </Tabs>
                </section>

                {/* 3. 상담 이력 영역 */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 px-1">
                        <History className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold text-gray-800">상담 이력</h2>
                    </div>

                    <div className="space-y-10 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-100 before:to-transparent text-left">

                        {/* 일반상담 이력 섹션 */}
                        <div className="relative pl-12 space-y-4">
                            <div className="absolute left-0 top-1 p-1 bg-white border-2 border-gray-300 rounded-full z-10">
                                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            </div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">일반상담 내역</h3>

                            <div className="space-y-4">
                                {generalHistory.map((item) => (
                                    <Card key={item.id} className="hover:border-gray-300 transition-colors duration-300 shadow-none">
                                        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={cn("border-gray-200", item.id === 1 ? "text-gray-500" : "text-gray-400")}>{item.type}</Badge>
                                                <span className="text-xs text-gray-500 font-mono">{item.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span>작성자: {item.author}</span>
                                                <Separator orientation="vertical" className="h-3" />
                                                {editingHistoryId === item.id ? (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-primary font-bold hover:bg-primary/10"
                                                            onClick={() => handleEditSave(item.id)}
                                                        >
                                                            저장
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-gray-400 hover:text-gray-600"
                                                            onClick={handleEditCancel}
                                                        >
                                                            취소
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 p-1 text-gray-400 hover:text-primary"
                                                        onClick={() => handleEditStart(item.id, item.content)}
                                                    >
                                                        수정
                                                    </Button>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-0">
                                            {editingHistoryId === item.id ? (
                                                <div className="space-y-3 pt-2">
                                                    <Textarea
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        className="min-h-[100px] text-sm leading-relaxed resize-none focus-visible:ring-primary/30"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                                                    {item.content}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. 하단 버튼 영역 */}
                <Separator />
                <div className="flex justify-center pb-12">
                    <Button variant="outline" size="lg" className="w-full max-w-[200px] gap-2 text-gray-500 py-6">
                        <ChevronLeft className="w-4 h-4" /> 목록
                    </Button>
                </div>

            </div>
        </TooltipProvider>
    );
}
