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
    Star,
    ChevronDown
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

// 초등 및 중고등 학기 분리
const ELEM_COURSES = ALL_COURSES.slice(0, 8);
const MID_HIGH_COURSES = ALL_COURSES.slice(8, 16);

// 과학 캐릭터 매핑
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
    "고1-2": "https://readingmath.co.kr/build/assets/alien_7-2-D_rZjnTH.svg"
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
    if (/과학과\s*인류|지속가능|탐구|실험|도구|측정/i.test(name)) {
        return "탐구활동영역";
    }
    if (/생물|식물|동물|유전|세포|자극|반응|생식|생태계|인체|소화|순환|호흡|배설/i.test(name)) {
        return "생명과학영역";
    }
    if (/지권|별|우주|태양계|날씨|기권|은하|달|행성|수권|해수|지각|화산|지진/i.test(name)) {
        return "지구과학영역";
    }
    if (/열|빛|파동|힘|운동|속력|에너지|전기|자기|전류|전압|저항|소리|일/i.test(name)) {
        return "물리영역";
    }
    return "화학영역";
}

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
    const [viewMode, setViewMode] = useState<"semester" | "domain">("semester");
    const [showAll, setShowAll] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    // 우주(Elementary vs Middle/High) 상태
    const [universe, setUniverse] = useState<"elem" | "mid-high">("mid-high");

    const courses = universe === "elem" ? ELEM_COURSES : MID_HIGH_COURSES;
    const [selectedCourse, setSelectedCourse] = useState<string>("중1-1");
    const [selectedDomain, setSelectedDomain] = useState<string>("물리영역");

    // 우주 상태 전환 시 기본 선택 학기 설정 및 패널 닫기
    const handleUniverseToggle = () => {
        if (universe === "mid-high") {
            setUniverse("elem");
            setSelectedCourse("초3-1");
        } else {
            setUniverse("mid-high");
            setSelectedCourse("중1-1");
        }
        setIsPanelOpen(false);
    };

    // Hydration 해결 및 최초 로드
    useEffect(() => {
        const stored = getGradeTerm("science") || "중1-1";
        setSelectedCourse(stored);
        if (ELEM_COURSES.includes(stored)) {
            setUniverse("elem");
        } else {
            setUniverse("mid-high");
        }
        const cleanup = onGradeTermChange((subject, code) => {
            if (subject === "science") {
                setSelectedCourse(code);
                if (ELEM_COURSES.includes(code)) {
                    setUniverse("elem");
                } else {
                    setUniverse("mid-high");
                }
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

    // 학기 인덱스 계산 및 순환 로직
    const currentCourseIdx = courses.indexOf(selectedCourse);
    const prevCourseCode = courses[(currentCourseIdx - 1 + courses.length) % courses.length];
    const nextCourseCode = courses[(currentCourseIdx + 1) % courses.length];

    // 행성 클릭 시: 패널 개폐 토글 바인딩
    const selectCourseWithPanel = (courseCode: string) => {
        if (courseCode === selectedCourse) {
            setIsPanelOpen(!isPanelOpen);
        } else {
            setSelectedCourse(courseCode);
            setIsPanelOpen(true);
        }
    };

    // 화살표 버튼 클릭 시: 패널은 열지 않고 단순히 상태(학기)만 전환
    const shiftCourseSelection = (courseCode: string) => {
        setSelectedCourse(courseCode);
    };

    // 계통 인덱스 계산 및 순환 로직
    const currentDomainIdx = DOMAIN_TYPES.findIndex(d => d.name === selectedDomain);
    const prevDomainName = DOMAIN_TYPES[(currentDomainIdx - 1 + DOMAIN_TYPES.length) % DOMAIN_TYPES.length].name;
    const nextDomainName = DOMAIN_TYPES[(currentDomainIdx + 1) % DOMAIN_TYPES.length].name;

    // 계통 클릭 시: 패널 개폐 토글 바인딩
    const selectDomainWithPanel = (domainName: string) => {
        if (domainName === selectedDomain) {
            setIsPanelOpen(!isPanelOpen);
        } else {
            setSelectedDomain(domainName);
            setIsPanelOpen(true);
        }
    };

    // 계통 화살표 버튼 클릭 시: 패널 오픈 없이 단순 순환
    const shiftDomainSelection = (domainName: string) => {
        setSelectedDomain(domainName);
    };

    // 단원 정보 매핑
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

    const getUnitsForDomain = (domainName: string) => {
        const result: { course: string; majorUnit: string; minors: string[] }[] = [];

        SCIENCE_CURRICULA.forEach(curr => {
            if (!courses.includes(curr.course)) return;

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

    // 행성 크롭 스타일 생성
    const getPlanetStyle = (courseCode: string, size = 160) => {
        const idx = ALL_COURSES.indexOf(courseCode);
        if (idx === -1) return {};
        const planetWidth = 240;
        const totalWidth = 3840;
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
            <div className="absolute top-[75px] right-6 z-40 flex items-center gap-4 bg-[#142338]/90 backdrop-blur-md p-1.5 rounded-xl border border-[#1e2e45]/80 shadow-lg">
                {/* 학기/계통 토글 */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => { setViewMode("semester"); setIsPanelOpen(false); }}
                        className={`px-3 py-1 rounded-lg text-[13px] font-extrabold transition-all duration-200 ${
                            viewMode === "semester"
                                ? "bg-[#0084ff] text-white shadow-sm"
                                : "text-[#5c7797] hover:text-white"
                        }`}
                    >
                        학기
                    </button>
                    <button
                        onClick={() => { setViewMode("domain"); setIsPanelOpen(false); }}
                        className={`px-3 py-1 rounded-lg text-[13px] font-extrabold transition-all duration-200 ${
                            viewMode === "domain"
                                ? "bg-[#0084ff] text-white shadow-sm"
                                : "text-[#5c7797] hover:text-white"
                        }`}
                    >
                        계통
                    </button>
                </div>

                {/* 세로 얇은 선 */}
                <div className="w-[1px] h-4 bg-slate-700/60" />

                {/* 모두 보기 토글 */}
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#cbd5e1] whitespace-nowrap">모두 보기</span>
                    <button
                        onClick={() => { setShowAll(!showAll); setIsPanelOpen(false); }}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none ${
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
                    /* 캐러셀 모드 */
                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* 네비게이션 좌측 화살표 - 브라우저 완전 왼쪽 (단순 학기 전환) */}
                        <button
                            onClick={() => {
                                if (viewMode === "semester") {
                                    shiftCourseSelection(prevCourseCode);
                                } else {
                                    shiftDomainSelection(prevDomainName);
                                }
                            }}
                            className="fixed left-8 top-[55%] -translate-y-1/2 h-12 w-12 rounded-full bg-[#142338]/80 hover:bg-[#0084ff] flex items-center justify-center border border-[#1e2e45] text-white transition-all transform hover:scale-105 z-40 shadow-lg"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>

                        <div className={`transition-all duration-500 flex items-center justify-center w-full ${isPanelOpen ? "lg:pr-[500px]" : ""}`}>
                            {viewMode === "semester" ? (
                                /* 학기 3단 캐러셀 */
                                <div className="flex flex-col items-center select-none w-full max-w-[840px]">
                                    <div className="flex items-center justify-between w-full">
                                        {/* 이전 학기 (왼쪽 배치, opacity-50) */}
                                        <div
                                            onClick={() => selectCourseWithPanel(prevCourseCode)}
                                            className="flex flex-col items-center opacity-50 cursor-pointer scale-75 transform transition-all duration-300 hover:opacity-85"
                                        >
                                            <div style={getPlanetStyle(prevCourseCode, 150)} />
                                            <span className="text-[13px] font-bold text-slate-300 mt-3 truncate max-w-[120px]">
                                                {getSciencePlanetLabel(prevCourseCode)}
                                            </span>
                                        </div>

                                        {/* 중앙 현재 학기 */}
                                        <div
                                            className="flex flex-col items-center cursor-pointer transition-all duration-300 z-10 px-8"
                                            onClick={() => selectCourseWithPanel(selectedCourse)}
                                        >
                                            <div className="transform hover:scale-[1.03] transition-transform duration-300 drop-shadow-[0_10px_35px_rgba(59,130,246,0.35)]">
                                                <div style={getPlanetStyle(selectedCourse, 220)} />
                                            </div>

                                            <h2 className="text-[23px] font-black tracking-tight mt-6 mb-2">
                                                {getSciencePlanetLabel(selectedCourse)} 행성
                                            </h2>
                                            
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className="text-[12px] font-bold text-slate-400">0% 진행했어요!</span>
                                                <div className="w-[180px] h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="w-[0%] h-full bg-[#0084ff]" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 다음 학기 (오른쪽 배치, opacity-50) */}
                                        <div
                                            onClick={() => selectCourseWithPanel(nextCourseCode)}
                                            className="flex flex-col items-center opacity-50 cursor-pointer scale-75 transform transition-all duration-300 hover:opacity-85"
                                        >
                                            <div style={getPlanetStyle(nextCourseCode, 150)} />
                                            <span className="text-[13px] font-bold text-slate-300 mt-3 truncate max-w-[120px]">
                                                {getSciencePlanetLabel(nextCourseCode)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* 계통 3단 캐러셀 */
                                <div className="flex flex-col items-center select-none w-full max-w-[840px]">
                                    <div className="flex items-center justify-between w-full">
                                        {/* 이전 계통 (왼쪽) */}
                                        <div
                                            onClick={() => selectDomainWithPanel(prevDomainName)}
                                            className="flex flex-col items-center opacity-50 cursor-pointer scale-75 transform transition-all duration-300 hover:opacity-85"
                                        >
                                            <div className="w-[130px] h-[130px] rounded-full bg-gradient-to-br from-[#0c2240] to-[#173863] border-2 border-slate-700 flex items-center justify-center">
                                                <span className="text-[48px]">
                                                    {DOMAIN_TYPES.find(d => d.name === prevDomainName)?.icon}
                                                </span>
                                            </div>
                                            <span className="text-[13px] font-bold text-slate-300 mt-3">{prevDomainName}</span>
                                        </div>

                                        {/* 중앙 현재 계통 */}
                                        <div
                                            className="flex flex-col items-center cursor-pointer transition-all duration-300 z-10 px-8"
                                            onClick={() => selectDomainWithPanel(selectedDomain)}
                                        >
                                            <div className="w-[200px] h-[200px] rounded-full bg-gradient-to-br from-[#0c2240] to-[#173863] border-4 border-[#0084ff]/30 flex items-center justify-center shadow-[0_15px_40px_-5px_rgba(0,132,255,0.4)] transform hover:scale-105 transition-transform duration-300">
                                                <span className="text-[72px]">
                                                    {DOMAIN_TYPES.find(d => d.name === selectedDomain)?.icon}
                                                </span>
                                            </div>
                                            <h2 className="text-[23px] font-black tracking-tight mt-6 mb-2">
                                                {selectedDomain}
                                            </h2>
                                            <span className="text-[12px] font-bold text-slate-400">0% 진행했어요!</span>
                                        </div>

                                        {/* 다음 계통 (오른쪽) */}
                                        <div
                                            onClick={() => selectDomainWithPanel(nextDomainName)}
                                            className="flex flex-col items-center opacity-50 cursor-pointer scale-75 transform transition-all duration-300 hover:opacity-85"
                                        >
                                            <div className="w-[130px] h-[130px] rounded-full bg-gradient-to-br from-[#0c2240] to-[#173863] border-2 border-slate-700 flex items-center justify-center">
                                                <span className="text-[48px]">
                                                    {DOMAIN_TYPES.find(d => d.name === nextDomainName)?.icon}
                                                </span>
                                            </div>
                                            <span className="text-[13px] font-bold text-slate-300 mt-3">{nextDomainName}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 네비게이션 우측 화살표 - 브라우저 완전 오른쪽 (패널 열리면 숨김) */}
                        {!isPanelOpen && (
                            <button
                                onClick={() => {
                                    if (viewMode === "semester") {
                                        shiftCourseSelection(nextCourseCode);
                                    } else {
                                        shiftDomainSelection(nextDomainName);
                                    }
                                }}
                                className="fixed right-8 top-[55%] -translate-y-1/2 h-12 w-12 rounded-full bg-[#142338]/80 hover:bg-[#0084ff] flex items-center justify-center border border-[#1e2e45] text-white transition-all transform hover:scale-105 z-40 shadow-lg"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        )}

                        {/* 우측 상세 패널 (둥근 플로팅 카드화) */}
                        <div
                            className={`fixed top-[130px] right-6 bottom-6 w-full lg:w-[480px] bg-[#0c192c]/95 border border-[#1e2e45] z-30 shadow-2xl transition-all duration-300 flex flex-col backdrop-blur-md rounded-2xl overflow-hidden ${
                                isPanelOpen ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95 pointer-events-none"
                            }`}
                        >
                            {/* 패널 헤더 */}
                            <div className="p-5 border-b border-[#142338] flex items-center justify-between bg-[#0e1f37]/40">
                                <div className="flex items-center gap-3">
                                    {viewMode === "semester" ? (
                                        <h3 className="text-[17px] font-black text-white">
                                            {getSciencePlanetLabel(selectedCourse)}
                                        </h3>
                                    ) : (
                                        <>
                                            <span className="text-[24px]">
                                                {DOMAIN_TYPES.find(d => d.name === selectedDomain)?.icon}
                                            </span>
                                            <h3 className="text-[17px] font-black text-white">
                                                {selectedDomain}
                                            </h3>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsPanelOpen(false)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="h-4.5 w-4.5" />
                                </button>
                            </div>

                            {/* 패널 단원 리스트 */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                                {viewMode === "semester" ? (
                                    getUnitsForCourse(selectedCourse).map((unitGroup, idx) => {
                                        const sampleMinorDomain = unitGroup.minors[0]?.domain || "물리영역";
                                        const color = DOMAIN_COLORS[sampleMinorDomain];
                                        return (
                                            <div key={idx} className="space-y-4 border-b border-[#1e2e45]/60 pb-6 last:border-b-0 last:pb-0">
                                                {/* 대단원 헤더: 영역 뱃지 + 대단원 제목 가로 배열 */}
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <span className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-md border ${color.bg} ${color.text} ${color.border} flex-shrink-0`}>
                                                        {sampleMinorDomain}
                                                    </span>
                                                    <h4 className="text-[14px] font-extrabold text-[#94a3b8] leading-tight">
                                                        {unitGroup.majorUnit}
                                                    </h4>
                                                </div>

                                                {/* 소단원 리스트 */}
                                                <div className="space-y-4 pt-1">
                                                    {unitGroup.minors.map((minor, mIdx) => (
                                                        <div key={mIdx} className="flex items-center justify-between gap-3 text-slate-300 hover:text-white transition-colors">
                                                            <p className="text-[13.5px] font-bold leading-relaxed break-keep flex-1">
                                                                {minor.minorUnit}
                                                            </p>
                                                            <div className="flex items-center gap-3 flex-shrink-0 text-slate-600">
                                                                <div className="flex items-center gap-0.5">
                                                                    <Star className="h-[14px] w-[14px] fill-current text-slate-700/80" />
                                                                    <Star className="h-[14px] w-[14px] fill-current text-slate-700/80" />
                                                                    <Star className="h-[14px] w-[14px] fill-current text-slate-700/80" />
                                                                </div>
                                                                <ChevronDown className="h-[16px] w-[16px] text-slate-500 cursor-pointer hover:text-white" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    getUnitsForDomain(selectedDomain).map((unitItem, idx) => {
                                        const color = DOMAIN_COLORS[selectedDomain] || DOMAIN_COLORS["물리영역"];
                                        const charUrl = SCIENCE_CHARACTERS[unitItem.course] || SCIENCE_CHARACTERS["중1-1"];
                                        return (
                                            <div key={idx} className="space-y-4 border-b border-[#1e2e45]/60 pb-6 last:border-b-0 last:pb-0">
                                                {/* 학기 표시 행 (단원 바로 위 행) */}
                                                <div className="flex items-center gap-2 text-[#0084ff] font-black text-[15px] mb-1">
                                                    <img src={charUrl} alt="alien" className="w-[20px] h-[20px] object-contain flex-shrink-0" />
                                                    <span>{getSciencePlanetLabel(unitItem.course).replace("학년", "")}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10.5px] font-extrabold px-2 py-0.5 rounded-md border ${color.bg} ${color.text} ${color.border} flex-shrink-0`}>
                                                            {selectedDomain}
                                                        </span>
                                                        <h4 className="text-[14px] font-extrabold text-white leading-tight">
                                                            {unitItem.majorUnit}
                                                        </h4>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-1">
                                                    {unitItem.minors.map((minor, mIdx) => (
                                                        <div key={mIdx} className="flex items-center justify-between gap-3 text-slate-300 hover:text-white transition-colors">
                                                            <p className="text-[13.5px] font-bold leading-relaxed break-keep flex-1">
                                                                {minor}
                                                            </p>
                                                            <div className="flex items-center gap-3 flex-shrink-0 text-slate-600">
                                                                <div className="flex items-center gap-0.5">
                                                                    <Star className="h-[14px] w-[14px] fill-current text-slate-700/80" />
                                                                    <Star className="h-[14px] w-[14px] fill-current text-slate-700/80" />
                                                                    <Star className="h-[14px] w-[14px] fill-current text-slate-700/80" />
                                                                </div>
                                                                <ChevronDown className="h-[16px] w-[16px] text-slate-500 cursor-pointer hover:text-white" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                {viewMode === "semester" && getUnitsForCourse(selectedCourse).length === 0 && (
                                    <div className="text-center py-12 text-slate-500 font-bold italic">
                                        해당 학기의 과학 단원은 준비 중입니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* 모두 보기 모드 */
                    <div className="w-full h-[calc(100vh-170px)] overflow-y-auto pr-1 pb-10">
                        {viewMode === "semester" ? (
                            /* 학기 기준 4열-2행 격자 순서 매칭 렌더링 (1열에 1학기/2학기 세로 정렬 및 푸터 영역 제거) */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[0, 2, 4, 6, 1, 3, 5, 7].map((originalIdx) => {
                                    const courseCode = courses[originalIdx];
                                    const units = getUnitsForCourse(courseCode);
                                    const charUrl = SCIENCE_CHARACTERS[courseCode] || SCIENCE_CHARACTERS["중1-1"];
                                    return (
                                        <div key={originalIdx} className="bg-[#0b1828] border border-[#1a2b3e] rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-[#0084ff]/50 transition-colors">
                                            <div>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <img src={charUrl} alt="alien" className="w-[32px] h-[32px] object-contain flex-shrink-0" />
                                                    <h3 className="text-[15.5px] font-black text-white whitespace-nowrap">
                                                        {getSciencePlanetLabel(courseCode)}
                                                    </h3>
                                                </div>

                                                <div className="space-y-2">
                                                    {units.map((unitGroup, uIdx) => (
                                                        <p key={uIdx} className="text-[12.5px] text-slate-400 font-bold leading-normal truncate">
                                                            {unitGroup.majorUnit}
                                                        </p>
                                                    ))}
                                                    {units.length === 0 && (
                                                        <p className="text-[12px] text-slate-500 font-bold italic leading-normal">
                                                            단원 데이터 준비 중
                                                        </p>
                                                    )}
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
                                    const coursesInDomain = [...new Set(domainUnits.map(du => du.course))];
                                    return (
                                        <div key={idx} className="space-y-4">
                                            <div className="flex items-center gap-2 pb-2 border-b border-[#1c2e46]">
                                                <span className="text-[24px]">{domain.icon}</span>
                                                <h3 className="text-[18px] font-black text-white">{domain.name}</h3>
                                            </div>

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
                                                                        <p key={uIdx} className="text-[12.5px] text-slate-400 font-bold leading-normal truncate">
                                                                            {u.majorUnit}
                                                                        </p>
                                                                    ))}
                                                                </div>
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

            {/* 4. Global Footer */}
            {!isPanelOpen && (
                <div className="fixed bottom-4 right-4 z-40">
                    <button
                        onClick={handleUniverseToggle}
                        className="bg-[#142338]/95 hover:bg-[#0084ff] backdrop-blur-md px-5 py-2.5 rounded-full border border-[#1e2e45] shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 group"
                    >
                        <span className="text-[15px] group-hover:animate-bounce">🚀</span>
                        <span className="text-[13px] font-black tracking-tight text-white">
                            {universe === "mid-high" ? "초등 우주로" : "중고등 우주로"}
                        </span>
                    </button>
                </div>
            )}

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
