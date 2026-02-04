"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Search,
    User,
    Clock,
    CheckCircle2,
    LayoutGrid,
    Maximize2,
    X,
    BookOpen,
    HelpCircle,
    FileText,
    Search as SearchIcon,
    ArrowUp,
    ArrowDown
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isFuture,
    getDaysInMonth,
    addDays,
    subDays,
    isAfter,
    parseISO
} from "date-fns";
import { ko } from "date-fns/locale";

// --- Design Constants ---
const ACHIEVEMENT_COLORS = {
    GRADE1: "#2563EB", // 96-100 (파랑)
    GRADE2: "#16A34A", // 86-95 (초록)
    GRADE3: "#CA8A04", // 71-85 (노랑)
    GRADE4: "#F97316", // 51-70 (주황)
    GRADE5: "#DC2626", // 0-50 (빨강)
};

const getAchievementColor = (score: number | null) => {
    if (score === null) return "transparent";
    if (score >= 96) return ACHIEVEMENT_COLORS.GRADE1;
    if (score >= 86) return ACHIEVEMENT_COLORS.GRADE2;
    if (score >= 71) return ACHIEVEMENT_COLORS.GRADE3;
    if (score >= 51) return ACHIEVEMENT_COLORS.GRADE4;
    return ACHIEVEMENT_COLORS.GRADE5;
};

import {
    MOCK_STUDENTS,
    MOCK_MONTHLY_SCORES,
    MOCK_DAILY_DETAILS,
    MATH_UNITS,
    SCIENCE_UNITS
} from "./mockData";

// --- Types ---
interface Student {
    id: string;
    name: string;
    status: "active" | "stopped" | "free";
}

interface TrainingDetail {
    title: string;
    path: string;
    tag: string;
    type: string;
    studyType: string;
    steps: { name: string; correct: number; total: number; rate: number }[];
    score: number;
    timestamp: string;
}


// --- Components ---

const AchievementLegend = () => (
    <div className="flex items-center gap-4 text-[11px] text-muted-foreground overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACHIEVEMENT_COLORS.GRADE1 }} /> 96–100 1등급</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACHIEVEMENT_COLORS.GRADE2 }} /> 86–95 2등급</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACHIEVEMENT_COLORS.GRADE3 }} /> 71–85 3등급</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACHIEVEMENT_COLORS.GRADE4 }} /> 51–70 4등급</div>
        <div className="flex items-center gap-1 shrink-0"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACHIEVEMENT_COLORS.GRADE5 }} /> 0–50 5등급</div>
    </div>
);

const TrainingModal = ({
    training,
    onClose
}: {
    training: TrainingDetail;
    onClose: () => void;
}) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-700">훈련 상세 정보</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-full">
                    <X className="h-5 w-5" />
                </Button>
            </div>
            <div className="p-10">
                <div className="border border-slate-200 rounded-sm overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                        <tbody>
                            <tr className="border-b border-slate-200">
                                <th className="w-1/3 p-4 bg-slate-50 text-slate-600 font-bold text-left border-r border-slate-200">소단원</th>
                                <td className="p-4 text-slate-700">{training.title}</td>
                            </tr>
                            <tr className="border-b border-slate-200">
                                <th className="p-4 bg-slate-50 text-slate-600 font-bold text-left border-r border-slate-200">훈련</th>
                                <td className="p-4 text-slate-700">{training.type}</td>
                            </tr>
                            <tr className="border-b border-slate-200">
                                <th className="p-4 bg-slate-50 text-slate-600 font-bold text-left border-r border-slate-200">학습구분</th>
                                <td className="p-4 text-slate-700">{training.studyType}</td>
                            </tr>
                            <tr className="border-b border-slate-200">
                                <th className="p-4 bg-slate-50 text-slate-600 font-bold text-left border-r border-slate-200 align-middle">
                                    정답수/문제수(정답률)
                                </th>
                                <td className="p-4">
                                    <table className="w-full text-xs border border-slate-200 border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="p-2 border-r border-slate-200 font-bold text-slate-500">단계</th>
                                                <th className="p-2 border-r border-slate-200 font-bold text-slate-500">정답수/문제수</th>
                                                <th className="p-2 font-bold text-slate-500">정답률(%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {training.steps.map((step, idx) => (
                                                <tr key={idx} className="border-b border-slate-100 last:border-0 text-center">
                                                    <td className="p-2 border-r border-slate-200 text-slate-600">{step.name}</td>
                                                    <td className="p-2 border-r border-slate-200 text-slate-600">{step.correct}/{step.total}</td>
                                                    <td className="p-2 text-slate-600">{step.rate}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-50/50 text-center font-bold">
                                                <td className="p-2 border-r border-slate-200 text-slate-700">합계</td>
                                                <td className="p-2 border-r border-slate-200 text-slate-700">
                                                    {training.steps.reduce((acc, s) => acc + s.correct, 0)}/{training.steps.reduce((acc, s) => acc + s.total, 0)}
                                                </td>
                                                <td className="p-2 text-slate-700">
                                                    {training.steps.length > 0 ? Math.round(training.steps.reduce((acc, s) => acc + s.correct, 0) / training.steps.reduce((acc, s) => acc + s.total, 0) * 100) : 0}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr className="border-b border-slate-200">
                                <th className="p-4 bg-slate-50 text-slate-600 font-bold text-left border-r border-slate-200">점수</th>
                                <td className="p-4 text-slate-700 font-bold">{training.score}점</td>
                            </tr>
                            <tr className="border-b border-slate-200 last:border-0">
                                <th className="p-4 bg-slate-50 text-slate-600 font-bold text-left border-r border-slate-200">학습일시</th>
                                <td className="p-4 text-slate-700">{training.timestamp}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
);

const MonthPickerLayer = ({
    currentDate,
    onSelect,
    onClose
}: {
    currentDate: Date;
    onSelect: (date: Date) => void;
    onClose: () => void;
}) => {
    const layerRef = useRef<HTMLDivElement>(null);
    const currentYear = currentDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (layerRef.current && !layerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div ref={layerRef} className="absolute top-12 right-0 z-50 bg-white border rounded-xl shadow-xl p-4 w-64 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4 px-2">
                <span className="font-bold text-lg">{currentYear}년</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {months.map((m) => {
                    const date = new Date(currentYear, m, 1);
                    const isSelected = isSameMonth(date, currentDate);
                    const disabled = isFuture(date);

                    return (
                        <Button
                            key={m}
                            variant={isSelected ? "default" : "ghost"}
                            className={cn(
                                "h-12 text-sm",
                                isSelected && "bg-primary text-primary-foreground font-bold",
                                disabled && "opacity-30 cursor-not-allowed"
                            )}
                            onClick={() => {
                                if (!disabled) {
                                    onSelect(date);
                                    onClose();
                                }
                            }}
                            disabled={disabled}
                        >
                            {m + 1}월
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};

export default function LearningHistoryPage() {
    const [subject, setSubject] = useState<"math" | "science">("math");
    const [viewType, setViewType] = useState<"monthly" | "daily">("monthly");
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
    const [hoveredDay, setHoveredDay] = useState<number | null>(null);
    const [hoveredStudentId, setHoveredStudentId] = useState<string | null>(null);
    const [selectedTraining, setSelectedTraining] = useState<TrainingDetail | null>(null);
    const [showStopped, setShowStopped] = useState(false);
    const [expandedStudentIds, setExpandedStudentIds] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ field: 'name' | 'grade', order: 'asc' | 'desc' }>({ field: 'name', order: 'asc' });

    const toggleExpandStudent = (id: string) => {
        setExpandedStudentIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const daysInMonth = useMemo(() => {
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        return eachDayOfInterval({ start, end });
    }, [selectedDate]);

    const handleSort = (field: 'name' | 'grade') => {
        if (sortConfig.field === field) {
            setSortConfig({ field, order: sortConfig.order === 'asc' ? 'desc' : 'asc' });
        } else {
            setSortConfig({ field, order: 'asc' });
        }
    };

    const activeStudents = useMemo(() => {
        let filtered = MOCK_STUDENTS.filter(s => {
            if (s.status === "free") return false;
            if (s.status === "stopped" && !showStopped) return false;
            return true;
        });

        // Helper to parse grade strings like "초3-1", "중1-2"
        const parseGrade = (gradeStr: string) => {
            const schoolLevel = gradeStr.startsWith("초") ? 0 : 1;
            const match = gradeStr.match(/\d+/g);
            const grade = match ? parseInt(match[0]) : 0;
            const semester = match && match[1] ? parseInt(match[1]) : 1;
            return { schoolLevel, grade, semester };
        };

        return [...filtered].sort((a, b) => {
            if (sortConfig.field === 'grade') {
                const gradeA = parseGrade(a.grade);
                const gradeB = parseGrade(b.grade);

                // Priority 1: School Level (초=0 < 중=1)
                if (gradeA.schoolLevel !== gradeB.schoolLevel) {
                    return sortConfig.order === 'asc'
                        ? gradeA.schoolLevel - gradeB.schoolLevel
                        : gradeB.schoolLevel - gradeA.schoolLevel;
                }
                // Priority 2: Grade Number (ASC: 1 < 6)
                if (gradeA.grade !== gradeB.grade) {
                    return sortConfig.order === 'asc'
                        ? gradeA.grade - gradeB.grade
                        : gradeB.grade - gradeA.grade;
                }
                // Priority 3: Semester Number (ASC: 1 < 2)
                if (gradeA.semester !== gradeB.semester) {
                    return sortConfig.order === 'asc'
                        ? gradeA.semester - gradeB.semester
                        : gradeB.semester - gradeA.semester;
                }
                // Priority 4: Name (Tie-break)
                return a.name.localeCompare(b.name, 'ko');
            } else {
                // Name sort
                const valA = a.name || "";
                const valB = b.name || "";

                if (sortConfig.order === 'asc') {
                    return valA.localeCompare(valB, 'ko');
                } else {
                    return valB.localeCompare(valA, 'ko');
                }
            }
        });
    }, [showStopped, sortConfig]);

    const monthlySummaries = useMemo(() => {
        const summaries: Record<string, { count: number; avgScore: number }> = {};

        daysInMonth.forEach(day => {
            const mKey = format(day, "yyyy-MM");
            const dKey = format(day, "dd");
            let totalScore = 0;
            let count = 0;

            MOCK_STUDENTS.forEach(s => {
                const score = (MOCK_MONTHLY_SCORES as any)[subject]?.[mKey]?.[s.id]?.[dKey];
                if (score !== undefined && score !== null) {
                    totalScore += score;
                    count++;
                }
            });

            summaries[format(day, "yyyy-MM-dd")] = {
                count,
                avgScore: count > 0 ? totalScore / count : 0
            };
        });

        return summaries;
    }, [daysInMonth, subject]);

    const matrixRows = useMemo(() => {
        return [
            { type: 'summary-count' as const, id: 'summary-count', label: '참여 학생' },
            { type: 'summary-avg' as const, id: 'summary-avg', label: '평균 성취도' },
            ...activeStudents.map(s => ({ type: 'student' as const, id: s.id, data: s }))
        ];
    }, [activeStudents]);

    const handlePrevMonth = () => {
        const prev = subMonths(selectedDate, 1);
        setSelectedDate(startOfMonth(prev));
    };

    const handleNextMonth = () => {
        const next = addMonths(selectedDate, 1);
        if (!isFuture(next)) {
            setSelectedDate(startOfMonth(next));
        }
    };

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setViewType("daily");
    };

    // --- Daily View Specific ---
    const dailyDataForDate = useMemo(() => {
        const dateKey = format(selectedDate, "yyyy-MM-dd");
        return (MOCK_DAILY_DETAILS as any)[subject]?.[dateKey];
    }, [selectedDate, subject]);

    const dailyStudents = useMemo(() => {
        if (!dailyDataForDate) return [];

        return dailyDataForDate.students.map((ds: any) => {
            const student = MOCK_STUDENTS.find(s => s.id === ds.id);
            const units = subject === "math" ? MATH_UNITS : SCIENCE_UNITS;

            return {
                ...student,
                score: ds.s,
                studyTime: ds.m,
                correctCount: ds.c,
                totalQuestions: ds.t,
                trainingCount: ds.n,
                trainings: ds.ti.map((idx: number) => ({
                    ...units[idx],
                    studyType: "1R",
                    steps: [{ name: "기본", correct: Math.round(ds.s / 10), total: 10, rate: ds.s }],
                    score: ds.s,
                    timestamp: `${format(selectedDate, "yyyy-MM-dd")} 10:00:00`
                }))
            };
        });
    }, [dailyDataForDate, subject, selectedDate]);

    const dailySummary = useMemo(() => {
        if (!dailyDataForDate || !dailyDataForDate.summary) return null;
        const s = dailyDataForDate.summary;
        return {
            avgScore: s.as,
            count: s.p,
            totalStudents: s.ts,
            avgTime: s.at,
            totalTime: s.tt,
            avgCorrect: s.ac,
            avgTotal: s.atq,
            totalCorrect: s.tc,
            totalQuestions: s.ttq,
            avgTraining: s.art,
            totalTraining: s.tr
        };
    }, [dailyDataForDate]);

    // --- Scroll Logic for DateStrip ---
    const dateStripRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (viewType === "daily" && dateStripRef.current) {
            const selectedEl = dateStripRef.current.querySelector('[data-selected="true"]');
            if (selectedEl) {
                selectedEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }
        }
    }, [selectedDate, viewType]);

    return (
        <div className="flex flex-col bg-[#F8F9FA]">
            {/* Header Selection */}
            <div className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-40">
                <Tabs value={subject} onValueChange={(v) => setSubject(v as any)} className="w-fit">
                    <TabsList className="bg-slate-100 rounded-lg p-1">
                        <TabsTrigger value="math" className="px-6 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">수학</TabsTrigger>
                        <TabsTrigger value="science" className="px-6 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">과학</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 relative">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="rounded-full">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div
                        className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                    >
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="font-bold text-lg">{format(selectedDate, "yyyy년 MM월")}</span>
                        <ChevronRight className={cn("h-4 w-4 text-slate-400 transition-transform", isMonthPickerOpen && "rotate-90")} />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextMonth}
                        disabled={isFuture(addMonths(selectedDate, 1))}
                        className="rounded-full disabled:opacity-20"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>

                    {isMonthPickerOpen && (
                        <MonthPickerLayer
                            currentDate={selectedDate}
                            onSelect={(date) => setSelectedDate(startOfMonth(date))}
                            onClose={() => setIsMonthPickerOpen(false)}
                        />
                    )}
                </div>
            </div>

            <div className="p-6 w-full flex-1 flex flex-col">
                {viewType === "monthly" ? (
                    /* --- Monthly View --- */
                    <Card className="border-none shadow-sm rounded-2xl overflow-hidden flex flex-col bg-white">
                        <CardHeader className="border-b bg-white py-4 px-6 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold">학습내역</CardTitle>
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Maximize2 className="h-3 w-3" />
                                    <span>날짜 클릭 시 일별 상세로 이동합니다.</span>
                                </div>
                            </div>
                            <div className="hidden lg:block">
                                <AchievementLegend />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex flex-col relative overflow-hidden">
                            <div className="overflow-x-auto no-scrollbar scroll-smooth">
                                <div className="w-full min-w-full flex flex-col">
                                    {/* Unified Header Row */}
                                    <div className="flex h-10 border-b bg-slate-50/50 sticky top-0 z-40">
                                        {/* Sticky Header Labels */}
                                        <div className="w-56 sticky left-0 z-50 bg-slate-50 border-r border-slate-100 flex shrink-0">
                                            <div
                                                className="flex-1 flex items-center justify-between px-4 cursor-pointer hover:bg-slate-100/50 transition-colors"
                                                onClick={() => handleSort('name')}
                                            >
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">학생명</span>
                                                {sortConfig.field === 'name' && (
                                                    sortConfig.order === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                                )}
                                            </div>
                                            <div
                                                className="w-28 flex items-center justify-between px-3 border-l border-slate-100 cursor-pointer hover:bg-slate-100/50 transition-colors"
                                                onClick={() => handleSort('grade')}
                                            >
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">학년/학기</span>
                                                {sortConfig.field === 'grade' && (
                                                    sortConfig.order === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                                )}
                                            </div>
                                        </div>
                                        {/* Matrix Header Days */}
                                        <div
                                            className="grid divide-x divide-slate-100/50 flex-1"
                                            style={{ gridTemplateColumns: `repeat(${daysInMonth.length}, 1fr)` }}
                                        >
                                            {daysInMonth.map((day) => (
                                                <div
                                                    key={day.toString()}
                                                    className={cn(
                                                        "h-full flex flex-col items-center justify-center cursor-pointer transition-colors",
                                                        hoveredDay === day.getDate() && "bg-slate-200",
                                                        isSameDay(day, selectedDate) && "bg-primary/5",
                                                        isFuture(day) && "opacity-20 cursor-default"
                                                    )}
                                                    onMouseEnter={() => !isFuture(day) && setHoveredDay(day.getDate())}
                                                    onMouseLeave={() => setHoveredDay(null)}
                                                    onClick={() => !isFuture(day) && handleDayClick(day)}
                                                >
                                                    <span className="text-[9px] text-slate-400 font-medium leading-none mb-0.5">{format(day, "eee", { locale: ko })}</span>
                                                    <span className={cn(
                                                        "text-xs font-bold leading-none",
                                                        isSameDay(day, new Date()) ? "text-primary" : "text-slate-600"
                                                    )}>{format(day, "d")}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Data Rows */}
                                    {matrixRows.map((row) => (
                                        <div
                                            key={row.id}
                                            className={cn(
                                                "flex h-12 border-b transition-colors",
                                                row.type === 'student' ? "group hover:bg-slate-50/80" : "bg-slate-50/30",
                                                row.type === 'summary-avg' && "border-b-2 border-slate-200"
                                            )}
                                        >
                                            {/* Sticky Label Cell */}
                                            <div className={cn(
                                                "w-56 sticky left-0 z-30 border-r border-slate-100 flex items-center px-4 shrink-0 transition-colors",
                                                row.type === 'student' ? "bg-white group-hover:bg-slate-50/80" : "bg-slate-50/30"
                                            )}>
                                                {row.type === 'student' ? (
                                                    <div className="flex items-center flex-1 min-w-0">
                                                        <div
                                                            className="flex items-center gap-2 cursor-pointer group/student flex-1 min-w-0"
                                                            onClick={() => window.alert("학생상세 화면으로 이동합니다")}
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 group-hover/student:bg-primary/10 group-hover/student:text-primary transition-colors shrink-0">
                                                                {row.data.name[0]}
                                                            </div>
                                                            <span
                                                                className={cn(
                                                                    "text-sm font-medium group-hover/student:text-primary transition-colors truncate",
                                                                    row.data.status === "stopped" && "text-slate-300"
                                                                )}
                                                            >
                                                                {row.data.name}
                                                            </span>
                                                        </div>
                                                        <div className="w-28 px-3 text-sm font-medium text-slate-600 border-l border-slate-50 h-8 flex items-center shrink-0">
                                                            {row.data.grade || "-"}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-bold text-slate-500">{row.label}</span>
                                                )}
                                            </div>

                                            {/* Matrix Data Cells */}
                                            <div
                                                className={cn(
                                                    "grid divide-x divide-slate-50 flex-1 transition-colors",
                                                    row.type === 'student' && "group-hover:bg-slate-50/80"
                                                )}
                                                style={{ gridTemplateColumns: `repeat(${daysInMonth.length}, 1fr)` }}
                                            >
                                                {daysInMonth.map((day) => {
                                                    const dateKey = format(day, "yyyy-MM-dd");
                                                    const mKey = format(day, "yyyy-MM");
                                                    const dKey = format(day, "dd");
                                                    const isVisible = !isFuture(day);

                                                    if (row.type === 'summary-count') {
                                                        const data = monthlySummaries[dateKey];
                                                        return (
                                                            <div key={`summary-count-${row.id}-${day}`} className="h-full flex items-center justify-center">
                                                                {isVisible && data && data.count > 0 && (
                                                                    <span className="text-xs text-slate-500 font-normal">{data.count}</span>
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    if (row.type === 'summary-avg') {
                                                        const data = monthlySummaries[dateKey];
                                                        const color = getAchievementColor(data?.avgScore || null);
                                                        return (
                                                            <div key={`summary-avg-${row.id}-${day}`} className="h-full flex items-center justify-center">
                                                                {isVisible && data && data.count > 0 && (
                                                                    <div className="relative w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                                                                        <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundColor: color }} />
                                                                        <span className="relative z-10 text-xs text-slate-800 font-normal">{Math.round(data.avgScore)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    // Student Row
                                                    const score = (MOCK_MONTHLY_SCORES as any)[subject]?.[mKey]?.[row.data.id]?.[dKey];
                                                    const color = getAchievementColor(score);
                                                    return (
                                                        <div
                                                            key={`student-${row.id}-${day}`}
                                                            className={cn(
                                                                "h-full flex items-center justify-center transition-all cursor-pointer relative",
                                                                hoveredDay === day.getDate() && "bg-slate-200/50"
                                                            )}
                                                            onMouseEnter={() => !isFuture(day) && setHoveredDay(day.getDate())}
                                                            onMouseLeave={() => setHoveredDay(null)}
                                                            onClick={() => !isFuture(day) && handleDayClick(day)}
                                                        >
                                                            {score !== undefined && score !== null && isVisible && (
                                                                <div
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
                                                                    style={{ backgroundColor: color }}
                                                                >
                                                                    {score}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    {/* Control Area - Reinvented as a Row to match alignment */}
                                    <div className="flex h-12 border-t border-slate-50 bg-white">
                                        <div className="w-56 sticky left-0 z-30 flex items-center px-4 shrink-0 border-r border-slate-100 bg-white">
                                            <div className="w-8 shrink-0 flex items-center justify-center" /> {/* Avatar Spacer */}
                                            <div
                                                className="flex items-center gap-3 group/toggle cursor-pointer pl-0 pr-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors ml-2"
                                                onClick={() => setShowStopped(!showStopped)}
                                            >
                                                <span className="text-[11px] font-bold text-slate-500 group-hover/toggle:text-primary transition-colors whitespace-nowrap">
                                                    정지 학생 보기
                                                </span>
                                                <div className={cn(
                                                    "w-10 h-5 rounded-full relative transition-all duration-200 shadow-inner shrink-0",
                                                    showStopped ? "bg-primary" : "bg-slate-300"
                                                )}>
                                                    <div className={cn(
                                                        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out transform",
                                                        showStopped && "translate-x-5"
                                                    )} />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Pure Spacer for the matrix data side */}
                                        <div className="flex-1 bg-white" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* --- Daily View --- */
                    <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                        {/* Monthly Return Button */}
                        <div>
                            <Button variant="outline" size="sm" onClick={() => setViewType("monthly")} className="rounded-full bg-white shadow-sm border-slate-200 gap-2">
                                <LayoutGrid className="h-4 w-4" />
                                월별 보기
                            </Button>
                        </div>
                        {/* Date Strip (Naver Sports Style) */}
                        <div className="relative group bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="bg-slate-50 hover:bg-slate-100 border rounded-full shrink-0"
                                onClick={() => {
                                    const firstDay = startOfMonth(selectedDate);
                                    setSelectedDate(firstDay);
                                }}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex-1 overflow-x-auto no-scrollbar mx-2">
                                <div
                                    className="flex items-center gap-1.5 min-w-max md:min-w-0 md:w-full md:justify-between"
                                    ref={dateStripRef}
                                >
                                    {daysInMonth.map((day) => {
                                        const isSelected = isSameDay(day, selectedDate);
                                        const isToday = isSameDay(day, new Date());
                                        const disabled = isFuture(day);

                                        return (
                                            <div
                                                key={day.toString()}
                                                data-selected={isSelected}
                                                className={cn(
                                                    "flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all shrink-0 border",
                                                    "w-12 h-16 md:w-auto md:flex-1 md:min-w-[40px] md:max-w-[70px]",
                                                    isSelected ? "bg-primary border-primary shadow-md shadow-primary/20" : "bg-white border-slate-100 hover:border-slate-300",
                                                    disabled && "opacity-30 cursor-not-allowed grayscale"
                                                )}
                                                onClick={() => !disabled && setSelectedDate(day)}
                                            >
                                                <span className={cn("text-[9px] font-bold mb-0.5 uppercase", isSelected ? "text-primary-foreground/70" : "text-slate-400")}>
                                                    {format(day, "eee", { locale: ko })}
                                                </span>
                                                <span className={cn("text-base font-bold leading-none", isSelected ? "text-white" : "text-slate-700")}>
                                                    {format(day, "d")}
                                                </span>
                                                {isToday && !isSelected && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="bg-slate-50 hover:bg-slate-100 border rounded-full shrink-0"
                                onClick={() => {
                                    const lastDay = endOfMonth(selectedDate);
                                    const finalDay = isFuture(lastDay) ? new Date() : lastDay;
                                    setSelectedDate(finalDay);
                                }}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Summary Area */}
                        {dailySummary ? (
                            <Card className="border shadow-sm rounded-xl overflow-hidden bg-white">
                                <div className="border-b px-6 py-4 bg-slate-50/30">
                                    <h3 className="text-sm font-bold text-slate-700">평균 정답률</h3>
                                </div>
                                <CardContent className="p-0">
                                    <div className="flex flex-col lg:flex-row items-center divide-y lg:divide-y-0 lg:divide-x border-slate-100">
                                        {/* Donut Chart & Legend */}
                                        <div className="w-full lg:w-[40%] p-6 flex items-center justify-center gap-6">
                                            <div className="relative w-28 h-28 flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                                                    <circle
                                                        cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent"
                                                        strokeDasharray={301.6}
                                                        strokeDashoffset={301.6 - (301.6 * (dailySummary?.avgScore || 0)) / 100}
                                                        strokeLinecap="round"
                                                        style={{ color: getAchievementColor(dailySummary?.avgScore || 0) }}
                                                        className="transition-all duration-1000 ease-out"
                                                    />
                                                </svg>
                                                <div className="absolute flex flex-col items-center">
                                                    <span className="text-2xl font-bold text-slate-800">{dailySummary?.avgScore}점</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1.5 min-w-[110px]">
                                                {Object.entries(ACHIEVEMENT_COLORS).map(([key, color], idx) => {
                                                    const labels = ["96-100 1등급", "86-95 2등급", "71-85 3등급", "51-70 4등급", "0-50 5등급"];
                                                    return (
                                                        <div key={key} className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                                            <span className="text-[10px] font-bold text-slate-500 truncate">{labels[idx]}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="w-full lg:w-[60%] grid grid-cols-2 md:grid-cols-4 p-6 gap-4 text-center">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">참여 학생</span>
                                                <div className="flex flex-col">
                                                    <span className="text-2xl font-black text-slate-700">{dailySummary.count}<small className="text-base font-bold ml-0.5">명</small></span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">훈련시간</span>
                                                <div className="flex flex-col">
                                                    <span className="text-2xl font-black text-slate-700">{dailySummary.avgTime}<small className="text-base font-bold ml-0.5">분</small></span>
                                                    <span className="text-[10px] font-bold text-slate-400">(총 {dailySummary.totalTime}분)</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">정답수/문제수</span>
                                                <div className="flex flex-col">
                                                    <span className="text-2xl font-black text-slate-700">{dailySummary.avgCorrect}</span>
                                                    <span className="text-[10px] font-bold text-slate-400">({dailySummary.avgTotal}문항)</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">훈련수</span>
                                                <div className="flex flex-col">
                                                    <span className="text-2xl font-black text-slate-700">{dailySummary.avgTraining}<small className="text-base font-bold ml-0.5">건</small></span>
                                                    <span className="text-[10px] font-bold text-slate-400">(총 {dailySummary.totalTraining}건)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : dailyStudents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-dashed text-slate-400 gap-4">
                                <Search className="h-12 w-12 opacity-20" />
                                <div className="text-center">
                                    <p className="text-lg font-bold">선택한 날짜의 학습 내역이 없습니다.</p>
                                    <p className="text-sm">다른 날짜를 선택해 주세요.</p>
                                </div>
                            </div>
                        ) : null}

                        {/* Student Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
                            {dailyStudents.map((s: any) => {
                                const color = getAchievementColor(s.score);
                                const isExpanded = expandedStudentIds.includes(s.id);
                                const visibleTrainings = isExpanded ? s.trainings : s.trainings.slice(0, 2);

                                return (
                                    <Card key={s.id} className="border shadow-sm rounded-md bg-white overflow-hidden flex flex-col">
                                        <CardHeader className="p-6 border-b">
                                            <CardTitle
                                                className="text-lg font-bold text-slate-700 cursor-pointer hover:text-primary transition-colors"
                                                onClick={() => window.alert("학생상세 화면으로 이동합니다")}
                                            >
                                                {s.name}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="p-6 pb-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    {/* Accuracy Donut Chart */}
                                                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                                                        <svg className="w-full h-full transform -rotate-90">
                                                            <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                                                            <circle
                                                                cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="8" fill="transparent"
                                                                strokeDasharray={263.8}
                                                                strokeDashoffset={263.8 - (263.8 * s.score) / 100}
                                                                strokeLinecap="round"
                                                                style={{ color: color }}
                                                                className="transition-all duration-1000 ease-out"
                                                            />
                                                        </svg>
                                                        <div className="absolute flex flex-col items-center">
                                                            <span className="text-xl font-black text-slate-800">{s.score}점</span>
                                                        </div>
                                                    </div>

                                                    {/* Quick Stats */}
                                                    <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">정답수</span>
                                                            <span className="text-xl font-black text-slate-700">{s.correctCount}<small className="text-[10px] text-slate-400 ml-0.5">/{s.totalQuestions}</small></span>
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">훈련수</span>
                                                            <span className="text-xl font-black text-slate-700">{s.trainingCount}<small className="text-xs font-bold ml-0.5">건</small></span>
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">학습시간</span>
                                                            <span className="text-xl font-black text-slate-700">{s.studyTime}<small className="text-xs font-bold ml-0.5">분</small></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="px-6 py-4">
                                                <div className="border-t border-slate-100 pt-6 flex flex-col gap-3">
                                                    {visibleTrainings.map((t: TrainingDetail, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center justify-between p-3 border border-slate-100 rounded-md hover:border-slate-300 transition-colors group cursor-pointer"
                                                            onClick={() => setSelectedTraining({ ...t, studentName: s.name } as any)}
                                                        >
                                                            <div className="flex flex-col gap-1 truncate pr-4">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[11px] text-slate-400 font-medium truncate">{t.path} - {t.title}</span>
                                                                    <span
                                                                        className={cn(
                                                                            "text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0",
                                                                            t.tag.includes("개념") ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                                                        )}
                                                                    >
                                                                        {t.tag}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <Search className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                                                        </div>
                                                    ))}

                                                    {s.trainings.length > 2 && (
                                                        <div className="text-center pt-2">
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                onClick={() => toggleExpandStudent(s.id)}
                                                                className="text-primary font-bold text-xs"
                                                            >
                                                                {isExpanded ? "접기" : `더보기 (${s.trainings.length - 2}개)`}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {selectedTraining && (
                <TrainingModal
                    training={selectedTraining as any}
                    onClose={() => setSelectedTraining(null)}
                />
            )}

            <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    );
}
