"use client";

import React, { useState, useEffect, useMemo } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isAfter, startOfToday, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import {
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Search,
    MessageSquare,
    Smartphone,
    ExternalLink,
    Send,
    Eye,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MultiSelect } from "@/components/ui/multi-select";
import { cn } from "@/lib/utils";

type Subject = "math" | "science";
type SendStatus = "unsent" | "done";
type SendCondition = "auto" | "manual";

interface StudentNotification {
    id: string; // Internal unique ID (e.g., studentId + week)
    studentId: string; // Displayed Student ID
    name: string;
    subject: Subject;
    weekStart: string;
    weekEnd: string;
    status: SendStatus;
    teacher: string;
    grade: string;
    term: string;
    sentAt: string | null;
    condition: SendCondition;
}

// Generate 24+ dummy rows across 4 weeks
const generateDummyData = (): StudentNotification[] => {
    const data: StudentNotification[] = [];
    const today = startOfToday();
    const weeks = [
        startOfWeek(today, { weekStartsOn: 1 }),
        subWeeks(startOfWeek(today, { weekStartsOn: 1 }), 1),
        subWeeks(startOfWeek(today, { weekStartsOn: 1 }), 2),
        subWeeks(startOfWeek(today, { weekStartsOn: 1 }), 3),
    ];

    const teachers = ["김선생", "이선생", "박선생"];
    const grades = ["초3", "초4", "초5", "초6", "중1", "중2", "중3"];
    const students = [
        { name: "김철수", id: "S1001" }, { name: "김영희", id: "S1002" }, { name: "박지민", id: "S1003" },
        { name: "최유나", id: "S1004" }, { name: "정우진", id: "S1005" }, { name: "강하니", id: "S1006" },
        { name: "박상준", id: "S1007" }, { name: "윤서연", id: "S1008" }, { name: "한민우", id: "S1009" },
        { name: "오하은", id: "S1010" }, { name: "김동현", id: "S1011" }, { name: "서지수", id: "S1012" },
    ];

    weeks.forEach((weekStart, wIdx) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekStartStr = format(weekStart, "yyyy-MM-dd");
        const weekEndStr = format(weekEnd, "yyyy-MM-dd");

        students.forEach((student, sIdx) => {
            const subject: Subject = sIdx % 2 === 0 ? "math" : "science";
            const status: SendStatus = (wIdx + sIdx) % 3 === 0 ? "unsent" : "done";
            const teacher = teachers[(wIdx + sIdx) % 3];
            const grade = grades[(wIdx + sIdx) % 7];
            const condition: SendCondition = sIdx % 4 === 0 ? "auto" : "manual";

            data.push({
                id: `${student.id}-${wIdx}`,
                studentId: student.id,
                name: student.name,
                subject,
                weekStart: weekStartStr,
                weekEnd: weekEndStr,
                status,
                teacher,
                grade,
                term: sIdx % 3 === 0 ? "2학기" : "1학기",
                sentAt: status === "done" ? format(addWeeks(weekStart, 0), "yyyy-MM-dd HH:mm") : null,
                condition,
            });
        });
    });

    return data;
};

const ALL_DUMMY_DATA = generateDummyData();

const GRADE_OPTIONS = [
    { label: "초3", value: "초3" }, { label: "초4", value: "초4" }, { label: "초5", value: "초5" },
    { label: "초6", value: "초6" }, { label: "중1", value: "중1" }, { label: "중2", value: "중2" },
    { label: "중3", value: "중3" },
];

export default function WeeklyNotificationPage() {
    const { toast } = useToast();

    // Filter States
    const [subjectTab, setSubjectTab] = useState<Subject>("math");
    const [selectedDate, setSelectedDate] = useState<Date>(subWeeks(startOfWeek(startOfToday(), { weekStartsOn: 1 }), 1));
    const [statusFilter, setStatusFilter] = useState<"all" | SendStatus>("all");
    const [teacherFilter, setTeacherFilter] = useState<string>("all");
    const [gradeFilter, setGradeFilter] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState<string>("");
    const [keywordApplied, setKeywordApplied] = useState<string>("");

    // Data State
    const [notificationData, setNotificationData] = useState<StudentNotification[]>(ALL_DUMMY_DATA);

    // UI States
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentNotification | null>(null);

    // Derived Values
    const weekRangeText = useMemo(() => {
        const start = selectedDate;
        const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        return `${format(start, "yyyy-MM-dd")} ~ ${format(end, "yyyy-MM-dd")}`;
    }, [selectedDate]);

    const isCurrentWeek = useMemo(() => {
        // Note: The user now defines that the "current week" (today's week) is not selectable.
        // However, the original "isCurrentWeek" was used to show/hide the Send button.
        // Since we now only show up to the previous week, we should clarify the button visibility logic.
        // The user said: "발송 컬럼에 [발송] 버튼 미노출 (현재 선택 주가 오늘 포함 주보다 이전인 경우)"
        // Wait, let's re-read the previous requirement (Step 283-8):
        // "현재 선택 주가 오늘 포함 주보다 이전인 경우 -> 발송 버튼 미노출"
        // AND now (Step 315):
        // "오늘 포함 주는 선택 불가", "전주까지만 이동 가능"
        // This seems contradictory or very restrictive. 
        // If we can ONLY select previous weeks, and [발송] button is only shown for the "current week" (today's week),
        // but the "current week" is not selectable... then the Send button would NEVER appear.

        // Let's re-read Step 283-8 carefully: 
        // "현재 선택 주가 오늘 포함 주보다 이전인 경우 - 발송 컬럼에 [발송] 버튼 미노출"
        // This implies that the Send button ONLY appears in the Current week.
        // BUT the new requirement says "오늘 포함 주는 선택 불가". 

        // Hypothesis: Maybe the user wants the Send button to appear for the "target week" (which is the previous week relative to today).
        // Usually, Weekly Reports for "last week" are sent "this week".
        // Let's assume the "target week" for sending is the Previous Week.

        const todayWeekStart = startOfWeek(startOfToday(), { weekStartsOn: 1 });
        return isSameDay(selectedDate, todayWeekStart);
    }, [selectedDate]);

    const isNextDisabled = useMemo(() => {
        const previousWeekStart = subWeeks(startOfWeek(startOfToday(), { weekStartsOn: 1 }), 1);
        return isSameDay(selectedDate, previousWeekStart) || isAfter(selectedDate, previousWeekStart);
    }, [selectedDate]);

    const iframeSrc = useMemo(() => {
        if (subjectTab === "math") {
            return "https://readingmath.co.kr/app/weekly-reports/776b2164-7444-4de1-8462-cd854ecbed3e";
        }
        return "https://readingmath.co.kr/app/weekly-reports/fdf09411-8208-4ca4-ab21-59c3665deee4";
    }, [subjectTab]);

    // Filtering Logic
    const filteredData = useMemo(() => {
        const weekStartStr = format(selectedDate, "yyyy-MM-dd");

        return notificationData.filter(item => {
            // 1. Subject Tab
            if (item.subject !== subjectTab) return false;

            // 2. Week Range
            if (item.weekStart !== weekStartStr) return false;

            // 3. Status
            if (statusFilter !== "all" && item.status !== statusFilter) return false;

            // 4. Teacher
            if (teacherFilter !== "all" && item.teacher !== teacherFilter) return false;

            // 5. Grade
            if (gradeFilter.length > 0 && !gradeFilter.includes(item.grade)) return false;

            // 6. Name (Keyword Applied)
            if (keywordApplied && !item.name.toLowerCase().includes(keywordApplied.toLowerCase())) return false;

            return true;
        });
    }, [subjectTab, selectedDate, statusFilter, teacherFilter, gradeFilter, keywordApplied, notificationData]);

    // Handlers
    const handlePrevWeek = () => setSelectedDate(subWeeks(selectedDate, 1));
    const handleNextWeek = () => {
        if (!isNextDisabled) setSelectedDate(addWeeks(selectedDate, 1));
    };

    const handleSearch = () => {
        setKeywordApplied(keywordInput);
    };

    const handleReset = () => {
        const previousWeekStart = subWeeks(startOfWeek(startOfToday(), { weekStartsOn: 1 }), 1);
        setSelectedDate(previousWeekStart);
        setStatusFilter("all");
        setTeacherFilter("all");
        setGradeFilter([]);
        setKeywordInput("");
        setKeywordApplied("");
    };

    const handleNameClick = () => {
        toast({
            title: "준비 중",
            description: "학생 상세 페이지 이동 기능은 현재 준비 중입니다.",
        });
    };

    const openPreview = (student: StudentNotification) => {
        setSelectedStudent(student);
        setIsPreviewOpen(true);
    };

    const openSendDialog = (student: StudentNotification) => {
        setSelectedStudent(student);
        setIsSendDialogOpen(true);
    };

    const handleSendAction = () => {
        if (!selectedStudent) return;

        // Update local state
        setNotificationData(prev => prev.map(item =>
            item.studentId === selectedStudent.studentId &&
                item.weekStart === selectedStudent.weekStart &&
                item.subject === selectedStudent.subject
                ? { ...item, status: "done", sentAt: format(new Date(), "yyyy-MM-dd HH:mm") }
                : item
        ));

        setIsSendDialogOpen(false);
        toast({
            title: "발송 완료(프로토타입)",
            description: `${selectedStudent?.name} 학생 학부모님께 정상 발송되었습니다.`,
        });
    };

    return (
        <div className="p-6 md:px-10 space-y-8 animate-in fade-in duration-500 max-w-full mx-auto">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">주간학습알림</h1>
            </div>

            {/* 과목 탭 영역 */}
            <Tabs value={subjectTab} onValueChange={(v) => setSubjectTab(v as Subject)} className="w-full">
                <TabsList className="grid w-64 grid-cols-2">
                    <TabsTrigger value="math">수학</TabsTrigger>
                    <TabsTrigger value="science">과학</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* 검색 필터 영역 */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        {/* 주간 선택 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">주간 선택</label>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="flex-1 text-center font-mono py-2 px-4 border rounded-md bg-muted/30 whitespace-nowrap overflow-hidden text-ellipsis">
                                    {weekRangeText}
                                </div>
                                <Button variant="outline" size="icon" onClick={handleNextWeek} disabled={isNextDisabled}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* 발송 상태 (Toggle Group) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">발송상태</label>
                            <div className="flex border rounded-md overflow-hidden bg-background h-10 w-full lg:w-fit">
                                {(["all", "unsent", "done"] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={cn(
                                            "px-4 text-xs font-semibold flex-1 lg:flex-none lg:w-20 transition-colors whitespace-nowrap",
                                            statusFilter === s
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "bg-background text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        {s === "all" ? "전체" : s === "unsent" ? "미발송" : "발송완료"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 담당 선생님 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">담당선생님</label>
                            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="전체" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체</SelectItem>
                                    <SelectItem value="김선생">김선생</SelectItem>
                                    <SelectItem value="이선생">이선생</SelectItem>
                                    <SelectItem value="박선생">박선생</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 학년 (MultiSelect) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">학년</label>
                            <MultiSelect
                                options={GRADE_OPTIONS}
                                onValueChange={setGradeFilter}
                                defaultValue={gradeFilter}
                                placeholder="전체"
                            />
                        </div>

                        {/* 검색어 */}
                        <div className="space-y-2 lg:col-span-2">
                            <label className="text-sm font-medium">학생명 검색</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="학생명 입력"
                                    value={keywordInput}
                                    onChange={(e) => setKeywordInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </div>
                        </div>

                        {/* 버튼 영역 */}
                        <div className="flex gap-2 lg:col-span-2 justify-end">
                            <Button onClick={handleReset} variant="outline" className="gap-2">
                                <RotateCcw className="h-4 w-4" /> 초기화
                            </Button>
                            <Button onClick={handleSearch} className="gap-2 px-8">
                                <Search className="h-4 w-4" /> 검색
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 목록 영역 */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[120px] text-center">학생 고유번호</TableHead>
                                <TableHead className="w-[100px]">학생 이름</TableHead>
                                <TableHead className="w-[120px] text-center">발송조건</TableHead>
                                <TableHead className="w-[80px] text-center">학년</TableHead>
                                <TableHead className="w-[80px] text-center">학기</TableHead>
                                <TableHead className="text-center">주간학습기간</TableHead>
                                <TableHead className="w-[150px] text-center">발송일시</TableHead>
                                <TableHead className="w-[120px] text-center whitespace-nowrap">발송</TableHead>
                                <TableHead className="w-[120px] text-center whitespace-nowrap">미리보기</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.length > 0 ? (
                                filteredData.map((item) => (
                                    <TableRow key={`${item.studentId}-${item.weekStart}-${item.subject}`}>
                                        <TableCell className="text-center font-mono text-xs">{item.studentId}</TableCell>
                                        <TableCell>
                                            <button
                                                onClick={handleNameClick}
                                                className="text-primary font-semibold hover:underline cursor-pointer"
                                            >
                                                {item.name}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-center text-sm">
                                            {item.condition === "auto" ? "자동발송" : "수동발송"}
                                        </TableCell>
                                        <TableCell className="text-center text-sm">{item.grade}</TableCell>
                                        <TableCell className="text-center text-sm">{item.term}</TableCell>
                                        <TableCell className="text-center font-mono text-sm whitespace-nowrap">
                                            {item.weekStart} ~ {item.weekEnd}
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground text-sm">
                                            {item.sentAt || "-"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {item.status === "done" ? (
                                                <Badge variant="outline" className="font-normal border-slate-200 text-slate-500 bg-slate-50">
                                                    발송완료
                                                </Badge>
                                            ) : (
                                                // If it's the most recent selectable week (previous week), show Send button
                                                isNextDisabled ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 gap-1.5 px-3 border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                                                        onClick={() => openSendDialog(item)}
                                                    >
                                                        <Send className="h-3.5 w-3.5" /> 발송
                                                    </Button>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">미발송</span>
                                                )
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 gap-1.5 px-3"
                                                onClick={() => openPreview(item)}
                                            >
                                                <Eye className="h-3.5 w-3.5" /> 미리보기
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                        검색 결과가 없습니다.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* 하단 페이지네이션 영역 */}
            <div className="flex justify-between items-center py-2 px-2">
                <div className="text-sm text-muted-foreground">
                    검색: <span className="font-bold text-foreground">{filteredData.length}</span> / 전체: <span className="text-slate-400">{notificationData.filter(i => i.subject === subjectTab && i.weekStart === format(selectedDate, "yyyy-MM-dd")).length}</span>건
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">페이지당 개수</span>
                        <Select defaultValue="10">
                            <SelectTrigger className="w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex border rounded-md bg-background overflow-hidden">
                        <Button variant="ghost" size="sm" className="rounded-none border-r px-3" disabled>1</Button>
                    </div>
                </div>
            </div>

            {/* 미리보기 모달 */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-[550px] p-0 overflow-hidden bg-slate-900 border-slate-800">
                    <DialogHeader className="p-4 bg-background border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5" /> 주간학습알림 미리보기
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex justify-center p-8 bg-slate-800">
                        {/* iPhone Frame - Width 440px */}
                        <div className="relative w-[440px] h-[700px] bg-black rounded-[40px] border-[8px] border-slate-700 shadow-2xl overflow-hidden ring-4 ring-slate-900">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-2xl z-20 flex items-center justify-center">
                                <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
                            </div>
                            <div className="w-full h-full bg-white pt-6 overflow-hidden">
                                <div className="iframe-container w-full h-full overflow-y-auto">
                                    <iframe
                                        src={iframeSrc}
                                        className="w-full h-full border-none"
                                        title="Weekly Report Preview"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-background border-t">
                        <Button onClick={() => setIsPreviewOpen(false)} variant="secondary">닫기</Button>
                        <Button onClick={() => window.open(iframeSrc, '_blank')} className="gap-2">
                            <ExternalLink className="h-4 w-4" /> 원본 보기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 발송 확인 다이얼로그 */}
            <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>발송</DialogTitle>
                        <DialogDescription className="pt-2 text-base text-foreground font-medium">
                            학부모 전화번호로 발송 하시겠습니까?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>취소</Button>
                        <Button onClick={handleSendAction}>확인</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
