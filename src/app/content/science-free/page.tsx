"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    HelpCircle,
    Siren,
    Megaphone,
    Menu,
    ChevronLeft,
    ChevronRight,
    X,
    Star
} from "lucide-react";
import { getStoredTasks, Task } from "@/utils/taskStorage";
import StudentSidebar from "@/components/StudentSidebar";
import { SCIENCE_CURRICULA } from "@/lib/task-center-mock";
import { getGradeTerm, onGradeTermChange, gradeTermToLabel } from "@/utils/gradeTermStorage";

// 16개 학기 순서 매핑 (스프라이트 시트 인덱스)
const ALL_COURSES = [
    "초3-1", "초3-2",
    "초4-1", "초4-2",
    "초5-1", "초5-2",
    "초6-1", "초6-2",
    "중1-1", "중1-2",
    "중2-1", "중2-2",
    "중3-1", "중3-2",
    "고1-1", "고1-2"
];

// 과학용 코스 필터 (중1-1 ~ 중3-2까지만 데이터가 있으므로 6개만 캐러셀에 활용)
const SCIENCE_COURSES = ALL_COURSES.slice(8, 14);

// 과학 캐릭터 매핑 (기본 모드 캐릭터 재사용)
const SCIENCE_CHARACTERS: Record<string, string> = {
    "초3-1": "https://readingmath.co.kr/build/assets/alien_3-1-97dhOfbo.svg",
    "초3-2": "https://readingmath.co.kr/build/assets/alien_3-2-2r3DnG1l.svg",
    "초4-1": "https://readingmath.co.kr/build/assets/alien_4-1-DbP9nCdy.svg",
    "초4-2": "https://readingmath.co.kr/build/assets/alien_4-2-Da6oETZx.svg",
    "초5-1": "https://readingmath.co.kr/build/assets/alien_5-1-CL3ZP9hd.svg",
    "초5-2": "https://readingmath.co.kr/build/assets/alien_5-2-BQv9nVZE.svg",
    "초6-1": "https://readingmath.co.kr/build/assets/alien_6-1-BWQCAj9Y.svg",
    "초6-2": "https://readingmath.co.kr/build/assets/alien_6-2-aHiGzB4J.svg",
    "중1-1": "https://readingmath.co.kr/build/assets/alien_7-1-PpO6__ME.svg",
    "중1-2": "https://readingmath.co.kr/build/assets/alien_7-2-D_rZjnTH.svg",
    "중2-1": "https://readingmath.co.kr/build/assets/alien_8-1-C9kW02q9.svg",
    "중2-2": "https://readingmath.co.kr/build/assets/alien_8-2-BqqoQ5DU.svg",
    "중3-1": "https://readingmath.co.kr/build/assets/alien_9-1-B2AtrAOh.svg",
    "중3-2": "https://readingmath.co.kr/build/assets/alien_9-2-CkyBzS70.svg",
    "고1-1": "https://readingmath.co.kr/build/assets/alien_7-1-PpO6__ME.svg",
    "고1-2": "https://readingmath.co.kr/build/assets/alien_7-2-D_rZjnTH.svg",
};

// 과학 5대 영역 정의
const DOMAIN_TYPES = [
    { id: "sci-physics", name: "물리영역", icon: "⚙️" },
    { id: "sci-chemistry", name: "화학영역", icon: "🧪" },
    { id: "sci-biology", name: "생명과학영역", icon: "🧬" },
    { id: "sci-earth", name: "지구과학영역", icon: "🌍" },
    { id: "sci-explore", name: "탐구활동영역", icon: "🔬" }
];

// 대단원명 기준으로 계통 자동 판정 함수
function getScienceDomainOfUnit(majorUnit: string): string {
    const name = majorUnit.replace(/^\d+단원\s+/, "");
    // 탐구활동영역
    if (/과학과\s*인류|지속가능|탐구|실험|도구|측정/i.test(name)) {
        return "탐구활동영역";
    }
    // 생명과학영역
    if (/생물|식물|동물|유전|세포|자극|반응|생식|생태계|인체|소화|순환|호흡|배설/i.test(name)) {
        return "생명과학영역";
    }
    // 지구과학영역
    if (/지권|별|우주|태양계|날씨|기권|은하|달|행성|수권|해수|지각|화산|지진/i.test(name)) {
        return "지구과학영역";
    }
    // 물리영역
    if (/열|빛|파동|힘|운동|속력|에너지|전기|자기|전류|전압|저항|소리|일/i.test(name)) {
        return "물리영역";
    }
    // 그 외는 모두 화학영역 (물질, 기체, 원소, 화학 반응 등)
    return "화학영역";
}

// 계통별 테마 색상 설정
const DOMAIN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    "물리영역": { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
    "화학영역": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    "생명과학영역": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    "지구과학영역": { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
    "탐구활동영역": { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" }
};

// 고등 학기 행성명 예외 변경 함수 (그 외에는 gradeTermToLabel 결과 반환)
function getSciencePlanetLabel(courseCode: string): string {
    if (courseCode === "고1-1") return "통합과학-1";
    if (courseCode === "고1-2") return "통합과학-2";
    return gradeTermToLabel(courseCode);
}

export default function ScienceFreePage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"semester" | "domain">("semester"); // 학기 vs 계통 토글
    const [showAll, setShowAll] = useState(false); // 모두 보기 토글
    const [selectedCourse, setSelectedCourse] = useState<string>("중1-1");
    const [selectedDomain, setSelectedDomain] = useState<string>("물리영역");
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // Hydration 해결을 위해 마운트 후 localStorage 값 동기화
    useEffect(() => {
        setSelectedCourse(getGradeTerm("science") || "중1-1");
        const cleanup = onGradeTermChange((subject, code) => {
            if (subject === "science") {
                setSelectedCourse(code);
            }
        });
        return cleanup;
    }, []);

    useEffect(() => {
        setTasks(getStoredTasks());
        const handleChanged = () => {
            setTasks(getStoredTasks());
        };
        window.addEventListener("task-status-changed", handleChanged);
        return () => {
            window.removeEventListener("task-status-changed", handleChanged);
        };
    }, []);

    const scienceTasks = tasks.filter(t => t.subject === "science");
    const unstartedCount = scienceTasks.filter(t => t.status === "notStarted").length;

    // 캐러셀 관련 인덱스 연산
    const currentCourseIdx = SCIENCE_COURSES.indexOf(selectedCourse);
    const handlePrevCourse = () => {
        const nextIdx = (currentCourseIdx - 1 + SCIENCE_COURSES.length) % SCIENCE_COURSES.length;
        setSelectedCourse(SCIENCE_COURSES[nextIdx]);
        setIsPanelOpen(true);
    };
    const handleNextCourse = () => {
        const nextIdx = (currentCourseIdx + 1) % SCIENCE_COURSES.length;
        setSelectedCourse(SCIENCE_COURSES[nextIdx]);
        setIsPanelOpen(true);
    };

    // 계통 캐러셀 관련 연산
    const currentDomainIdx = DOMAIN_TYPES.findIndex(d => d.name === selectedDomain);
    const handlePrevDomain = () => {
        const nextIdx = (currentDomainIdx - 1 + DOMAIN_TYPES.length) % DOMAIN_TYPES.length;
        setSelectedDomain(DOMAIN_TYPES[nextIdx].name);
        setIsPanelOpen(true);
    };
    const handleNextDomain = () => {
        const nextIdx = (currentDomainIdx + 1) % DOMAIN_TYPES.length;
        setSelectedDomain(DOMAIN_TYPES[nextIdx].name);
        setIsPanelOpen(true);
    };

    // 선택된 학기의 대단원 및 소단원 그룹핑
    const getUnitsForCourse = (courseCode: string) => {
        const courseData = SCIENCE_CURRICULA.find(c => c.course === courseCode);
        if (!courseData) return [];

        const majorUnitsMap: Record<string, { minorUnit: string; domain: string }[]> = {};
        courseData.types.forEach(t => {
            if (!majorUnitsMap[t.majorUnit]) {
                majorUnitsMap[t.majorUnit] = [];
            }
            if (!majorUnitsMap[t.majorUnit].some(item => item.minorUnit === t.minorUnit)) {
                majorUnitsMap[t.majorUnit].push({
                    minorUnit: t.minorUnit,
                    domain: getScienceDomainOfUnit(t.majorUnit)
                });
            }
        });

        return Object.entries(majorUnitsMap).map(([majorUnit, minors]) => ({
            majorUnit,
            minors
        }));
    };

    // 선택된 계통에 소속된 학기별 단원 그룹핑
    const getUnitsForDomain = (domainName: string) => {
        const result: { course: string; majorUnit: string; minors: string[] }[] = [];

        SCIENCE_CURRICULA.forEach(curr => {
            const courseUnits: Record<string, string[]> = {};
            curr.types.forEach(t => {
                const dom = getScienceDomainOfUnit(t.majorUnit);
                if (dom === domainName) {
                    if (!courseUnits[t.majorUnit]) {
                        courseUnits[t.majorUnit] = [];
                    }
                    if (!courseUnits[t.majorUnit].includes(t.minorUnit)) {
                        courseUnits[t.majorUnit].push(t.minorUnit);
                    }
                }
            });

            Object.entries(courseUnits).forEach(([majorUnit, minors]) => {
                result.push({
                    course: curr.course,
                    majorUnit,
                    minors
                });
            });
        });

        return result;
    };

    // 스프라이트 행성 이미지 크롭 스타일 생성 함수
    const getPlanetStyle = (courseCode: string, size = 160) => {
        const idx = ALL_COURSES.indexOf(courseCode);
        if (idx === -1) return {};
        const planetWidth = 240;
        const totalWidth = 3840;
        // 크기에 비례한 백그라운드 사이즈 계산
        const scale = size / planetWidth;
        const bgSizeX = totalWidth * scale;
        const bgSizeY = 255 * scale;
        const posX = idx * planetWidth * scale;

        return {
            backgroundImage: "url('https://readingmath.co.kr/build/assets/planets_semester-G9fpAzeY.png')",
            backgroundSize: `${bgSizeX}px ${bgSizeY}px`,
            backgroundPosition: `-${posX}px 0px`,
            width: `${size}px`,
            height: `${255 * scale}px`
        };
    };

    return (
        <div className="relative h-screen w-full overflow-hidden bg-[#081324] font-sans select-none text-white">
            {/* 1. Global Navigation Bar (GNB) */}
            <header className="fixed top-0 left-0 right-0 h-[56px] bg-[#081324] z-50 flex items-center justify-between px-5">
                <Link href="/" className="flex items-center gap-2 cursor-pointer flex-shrink-0 min-w-[130px]">
                    <svg viewBox="0 0 100 100" className="h-6 w-6 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3B82F6" />
                                <stop offset="50%" stopColor="#EC4899" />
                                <stop offset="100%" stopColor="#F59E0B" />
                            </linearGradient>
                        </defs>
                        <path d="M 50,10 L 55,45 L 90,50 L 55,55 L 50,90 L 45,55 L 10,50 L 45,45 Z" fill="url(#logoGrad)" />
                        <circle cx="28" cy="28" r="4.5" fill="#3B82F6" />
                        <circle cx="72" cy="28" r="4.5" fill="#EC4899" />
                        <circle cx="72" cy="72" r="4.5" fill="#F59E0B" />
                        <circle cx="28" cy="72" r="4.5" fill="#10B981" />
                    </svg>
                    <span className="text-[17px] font-black tracking-tight text-white font-headline whitespace-nowrap select-none">
                        진리딩
                    </span>
                </Link>

                {/* GNB Tabs */}
                <div className="flex items-end gap-1.5 h-full">
                    <Link href="/content/science-home" className="h-[40px] flex items-center">
                        <div className="text-[#5c7797] hover:text-white px-5 py-1.5 text-[15px] font-bold min-w-[95px] text-center cursor-pointer transition-colors select-none">
                            기본 모드
                        </div>
                    </Link>
                    <div className="bg-[#0084ff] text-white px-6 h-[40px] rounded-t-[10px] rounded-b-none text-[15px] font-black flex items-center justify-center cursor-pointer min-w-[95px] transition-all hover:bg-[#0074e0] select-none">
                        자유 모드
                    </div>
                    <Link href="/content/science-exam-prep" className="h-[40px] flex items-center">
                        <div className="text-[#5c7797] hover:text-white px-5 py-1.5 text-[15px] font-bold min-w-[95px] text-center cursor-pointer transition-colors select-none">
                            시험 대비
                        </div>
                    </Link>
                    <Link href="/content/science-task-center" className="h-[40px] flex items-center">
                        <div className="relative text-[#5c7797] hover:text-white px-5 py-1.5 text-[15px] font-bold min-w-[95px] text-center cursor-pointer transition-colors select-none">
                            <span>과제 센터</span>
                            {unstartedCount > 0 && (
                                <span className="absolute top-[3px] right-[2px] h-2 w-2 bg-[#ef4444] rounded-full animate-pulse" />
                            )}
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-[24px] text-[#cbd5e1]">
                    <HelpCircle className="h-[22px] w-[22px] hover:text-white transition-colors cursor-pointer" />
                    <div className="relative cursor-pointer group">
                        <Siren className="h-[22px] w-[22px] hover:text-white transition-colors" />
                        <span className="absolute top-[-1px] right-[-1px] h-2 w-2 bg-[#ff3b30] rounded-full animate-pulse" />
                    </div>
                    <Megaphone className="h-[22px] w-[22px] hover:text-white transition-colors cursor-pointer" />
                    <Menu className="h-[22px] w-[22px] hover:text-white transition-colors cursor-pointer" onClick={() => setIsSidebarOpen(true)} />
                </div>
            </header>

            {/* 2. Controls Area (Sub-bar) */}
            <div className="absolute top-[75px] left-6 right-6 z-40 flex justify-between items-center">
                {/* Left: 학기/계통 토글 */}
                <div className="bg-[#142338]/90 backdrop-blur-md p-1 rounded-xl border border-[#1e2e45] flex items-center gap-1">
                    <button
                        onClick={() => { setViewMode("semester"); setIsPanelOpen(false); }}
                        className={`px-4 py-1.5 rounded-lg text-[13.5px] font-extrabold transition-all duration-200 ${
                            viewMode === "semester"
                                ? "bg-[#0084ff] text-white shadow-sm"
                                : "text-[#5c7797] hover:text-white"
                        }`}
                    >
                        학기
                    </button>
                    <button
                        onClick={() => { setViewMode("domain"); setIsPanelOpen(false); }}
                        className={`px-4 py-1.5 rounded-lg text-[13.5px] font-extrabold transition-all duration-200 ${
                            viewMode === "domain"
                                ? "bg-[#0084ff] text-white shadow-sm"
                                : "text-[#5c7797] hover:text-white"
                        }`}
                    >
                        계통
                    </button>
                </div>

                {/* Right: 모두 보기 토글 */}
                <div className="flex items-center gap-3">
                    <span className="text-[13.5px] font-bold text-[#cbd5e1]">모두 보기</span>
                    <button
                        onClick={() => { setShowAll(!showAll); setIsPanelOpen(false); }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                            showAll ? "bg-[#10b981]" : "bg-slate-700"
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                                showAll ? "translate-x-6" : "translate-x-1"
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* 3. Main Display Area */}
            <main className="relative h-full w-full pt-[130px] px-6 pb-6 overflow-hidden">
                {!showAll ? (
                    /* 캐러셀 모드 (상세 패널 슬라이드 구성) */
                    <div className="relative w-full h-full flex items-center justify-center">
                        <div className={`transition-all duration-500 flex items-center justify-center w-full ${isPanelOpen ? "lg:pr-[500px]" : ""}`}>
                            {viewMode === "semester" ? (
                                /* 학기 캐러셀 */
                                <div className="flex flex-col items-center select-none">
                                    <div className="flex items-center gap-8 md:gap-16">
                                        <button
                                            onClick={handlePrevCourse}
                                            className="h-12 w-12 rounded-full bg-[#142338]/80 hover:bg-[#0084ff] flex items-center justify-center border border-[#1e2e45] text-white transition-all transform hover:scale-105"
                                        >
                                            <ChevronLeft className="h-6 w-6" />
                                        </button>

                                        {/* 중앙 학기 강조 뷰 */}
                                        <div
                                            className="flex flex-col items-center cursor-pointer transition-all duration-300"
                                            onClick={() => setIsPanelOpen(true)}
                                        >
                                            {/* 스프라이트 행성 이미지 */}
                                            <div className="transform hover:scale-[1.03] transition-transform duration-300 drop-shadow-[0_10px_30px_rgba(59,130,246,0.3)]">
                                                <div style={getPlanetStyle(selectedCourse, 220)} />
                                            </div>

                                            <h2 className="text-[24px] font-black tracking-tight mt-6 mb-2">
                                                {getSciencePlanetLabel(selectedCourse)} 행성
                                            </h2>
                                            
                                            {/* 진행률 바 */}
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className="text-[12px] font-bold text-slate-400">0% 진행했어요!</span>
                                                <div className="w-[180px] h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="w-[0%] h-full bg-[#0084ff]" />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleNextCourse}
                                            className="h-12 w-12 rounded-full bg-[#142338]/80 hover:bg-[#0084ff] flex items-center justify-center border border-[#1e2e45] text-white transition-all transform hover:scale-105"
                                        >
                                            <ChevronRight className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* 계통 캐러셀 */
                                <div className="flex flex-col items-center select-none">
                                    <div className="flex items-center gap-8 md:gap-16">
                                        <button
                                            onClick={handlePrevDomain}
                                            className="h-12 w-12 rounded-full bg-[#142338]/80 hover:bg-[#0084ff] flex items-center justify-center border border-[#1e2e45] text-white transition-all transform hover:scale-105"
                                        >
                                            <ChevronLeft className="h-6 w-6" />
                                        </button>

                                        <div
                                            className="flex flex-col items-center cursor-pointer transition-all duration-300"
                                            onClick={() => setIsPanelOpen(true)}
                                        >
                                            {/* 계통구조 전용 일러스트 모양의 원형 뱃지 */}
                                            <div className="w-[200px] h-[200px] rounded-full bg-gradient-to-br from-[#0c2240] to-[#173863] border-4 border-[#0084ff]/30 flex items-center justify-center shadow-[0_15px_40px_-5px_rgba(0,132,255,0.4)] transform hover:scale-105 transition-transform duration-300">
                                                <span className="text-[72px]">
                                                    {DOMAIN_TYPES.find(d => d.name === selectedDomain)?.icon}
                                                </span>
                                            </div>

                                            <h2 className="text-[24px] font-black tracking-tight mt-6 mb-2">
                                                {selectedDomain}
                                            </h2>
                                            <span className="text-[12px] font-bold text-slate-400">0% 진행했어요!</span>
                                        </div>

                                        <button
                                            onClick={handleNextDomain}
                                            className="h-12 w-12 rounded-full bg-[#142338]/80 hover:bg-[#0084ff] flex items-center justify-center border border-[#1e2e45] text-white transition-all transform hover:scale-105"
                                        >
                                            <ChevronRight className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 우측 단원 목록 상세 패널 (Drawer) */}
                        <div
                            className={`fixed top-[56px] right-0 bottom-0 w-full lg:w-[480px] bg-[#0c192c]/95 border-l border-[#142338] z-30 shadow-2xl transition-transform duration-300 flex flex-col backdrop-blur-md ${
                                isPanelOpen ? "translate-x-0" : "translate-x-full"
                            }`}
                        >
                            {/* 패널 헤더 */}
                            <div className="p-5 border-b border-[#142338] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {viewMode === "semester" ? (
                                        <>
                                            <div style={getPlanetStyle(selectedCourse, 50)} className="rounded-md" />
                                            <h3 className="text-[18px] font-black text-white">
                                                {getSciencePlanetLabel(selectedCourse)}
                                            </h3>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-[28px]">
                                                {DOMAIN_TYPES.find(d => d.name === selectedDomain)?.icon}
                                            </span>
                                            <h3 className="text-[18px] font-black text-white">
                                                {selectedDomain}
                                            </h3>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsPanelOpen(false)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* 패널 단원 리스트 */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                                {viewMode === "semester" ? (
                                    getUnitsForCourse(selectedCourse).map((unitGroup, idx) => (
                                        <div key={idx} className="space-y-3">
                                            <h4 className="text-[15px] font-black text-[#0084ff] border-b border-[#1e2e45] pb-1">
                                                {unitGroup.majorUnit}
                                            </h4>
                                            <div className="space-y-2">
                                                {unitGroup.minors.map((minor, mIdx) => {
                                                    const color = DOMAIN_COLORS[minor.domain] || DOMAIN_COLORS["물리영역"];
                                                    return (
                                                        <div key={mIdx} className="bg-[#12253f] hover:bg-[#162d4c] rounded-xl p-3.5 border border-[#1e324c]/40 transition-colors flex items-center justify-between gap-3">
                                                            <div className="flex flex-col items-start gap-1">
                                                                <span className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-md border ${color.bg} ${color.text} ${color.border}`}>
                                                                    {minor.domain}
                                                                </span>
                                                                <p className="text-[13.5px] font-bold text-white leading-snug break-keep">
                                                                    {minor.minorUnit}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-0.5 text-slate-600 flex-shrink-0">
                                                                <Star className="h-[14px] w-[14px]" />
                                                                <Star className="h-[14px] w-[14px]" />
                                                                <Star className="h-[14px] w-[14px]" />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    getUnitsForDomain(selectedDomain).map((unitItem, idx) => (
                                        <div key={idx} className="space-y-3">
                                            <div className="flex items-center justify-between border-b border-[#1e2e45] pb-1">
                                                <h4 className="text-[14px] font-black text-[#0084ff]">
                                                    {unitItem.majorUnit}
                                                </h4>
                                                <span className="text-[11px] font-extrabold text-[#a0aec0] bg-slate-800 px-2 py-0.5 rounded-md">
                                                    {getSciencePlanetLabel(unitItem.course)}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {unitItem.minors.map((minor, mIdx) => (
                                                    <div key={mIdx} className="bg-[#12253f] hover:bg-[#162d4c] rounded-xl p-3.5 border border-[#1e324c]/40 transition-colors flex items-center justify-between gap-3">
                                                        <p className="text-[13.5px] font-bold text-white leading-snug break-keep">
                                                            {minor}
                                                        </p>
                                                        <div className="flex items-center gap-0.5 text-slate-600 flex-shrink-0">
                                                            <Star className="h-[14px] w-[14px]" />
                                                            <Star className="h-[14px] w-[14px]" />
                                                            <Star className="h-[14px] w-[14px]" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 모두 보기 모드 */
                    <div className="w-full h-[calc(100vh-170px)] overflow-y-auto pr-1 pb-10">
                        {viewMode === "semester" ? (
                            /* 학기 기준 그리드 배열 */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {SCIENCE_COURSES.map((courseCode, idx) => {
                                    const units = getUnitsForCourse(courseCode);
                                    const charUrl = SCIENCE_CHARACTERS[courseCode] || SCIENCE_CHARACTERS["중1-1"];
                                    return (
                                        <div key={idx} className="bg-[#0b1828] border border-[#1a2b3e] rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-[#0084ff]/50 transition-colors">
                                            <div>
                                                {/* 헤더 캐릭터 아이콘 + 타이틀 */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <img src={charUrl} alt="alien" className="w-[32px] h-[32px] object-contain" />
                                                    <h3 className="text-[15.5px] font-black text-white">
                                                        {getSciencePlanetLabel(courseCode)}
                                                    </h3>
                                                </div>

                                                {/* 단원 목록 */}
                                                <div className="space-y-2 mb-4">
                                                    {units.map((unitGroup, uIdx) => (
                                                        <p key={uIdx} className="text-[12.5px] text-slate-400 font-bold leading-normal truncate">
                                                            {unitGroup.majorUnit}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 하단 행성 썸네일 & 진행률 */}
                                            <div className="flex items-center justify-between border-t border-[#1e2e45] pt-3.5 mt-2">
                                                <div style={getPlanetStyle(courseCode, 45)} className="rounded" />
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-[#0084ff] block">0% 완료</span>
                                                    <span className="text-[11.5px] font-black text-slate-400 block">개념훈련 도전</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* 계통 기준 모두보기 */
                            <div className="space-y-12">
                                {DOMAIN_TYPES.map((domain, idx) => {
                                    const domainUnits = getUnitsForDomain(domain.name);
                                    // 각 계통에 등록된 학기 필터링 및 단원 리스팅
                                    const coursesInDomain = [...new Set(domainUnits.map(du => du.course))];
                                    return (
                                        <div key={idx} className="space-y-4">
                                            {/* 계통별 타이틀 */}
                                            <div className="flex items-center gap-2 pb-2 border-b border-[#1c2e46]">
                                                <span className="text-[24px]">{domain.icon}</span>
                                                <h3 className="text-[18px] font-black text-white">{domain.name}</h3>
                                            </div>

                                            {/* 해당 계통의 학기별 카드 목록 */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {coursesInDomain.map((courseCode, cIdx) => {
                                                    const courseUnits = domainUnits.filter(du => du.course === courseCode);
                                                    const charUrl = SCIENCE_CHARACTERS[courseCode] || SCIENCE_CHARACTERS["중1-1"];
                                                    return (
                                                        <div key={cIdx} className="bg-[#0b1828] border border-[#1a2b3e] rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-[#0084ff]/50 transition-colors">
                                                            <div>
                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <img src={charUrl} alt="alien" className="w-[32px] h-[32px] object-contain" />
                                                                    <h4 className="text-[14.5px] font-black text-white">
                                                                        {getSciencePlanetLabel(courseCode)}
                                                                    </h4>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    {courseUnits.map((u, uIdx) => (
                                                                        <div key={uIdx} className="bg-[#12253f]/50 p-2 rounded-lg border border-[#1e324c]/30">
                                                                            <p className="text-[11.5px] font-black text-[#5c7797] mb-1 truncate">{u.majorUnit}</p>
                                                                            {u.minors.map((m, mIdx) => (
                                                                                <p key={mIdx} className="text-[12px] text-slate-300 font-bold truncate leading-relaxed">
                                                                                    {m}
                                                                                </p>
                                                                            ))}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between border-t border-[#1e2e45] pt-3.5 mt-4">
                                                                <div style={getPlanetStyle(courseCode, 45)} className="rounded" />
                                                                <span className="text-[11.5px] font-black text-[#0084ff]">도전하기</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* 4. Global Footer (우주로) */}
            <div className="fixed bottom-4 right-4 z-40">
                <div className="bg-[#142338]/90 hover:bg-[#1a2d47] backdrop-blur-md px-4 py-2 rounded-full border border-[#1e2e45] shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95">
                    <span className="text-[15px]">🚀</span>
                    <span className="text-[12.5px] font-black tracking-tight text-white">중고등 우주로</span>
                </div>
            </div>

            {/* 5. GNB Sidebar */}
            <StudentSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                subject="science"
                gradeTerm={getSciencePlanetLabel(selectedCourse)}
            />
        </div>
    );
}
