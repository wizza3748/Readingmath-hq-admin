"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    HelpCircle,
    Siren,
    Megaphone,
    Menu,
    ArrowRight,
} from "lucide-react";
import { getStoredTasks, Task } from "@/utils/taskStorage";
import StudentSidebar from "@/components/StudentSidebar";
import { MATH_CURRICULA } from "@/lib/task-center-mock";
import { getGradeTerm, onGradeTermChange, gradeTermToLabel } from "@/utils/gradeTermStorage";

const MATH_BACKGROUNDS: Record<string, string> = {
    "초3-1": "https://readingmath.co.kr/build/assets/bg_main_3-1-CCUbB7o5.svg",
    "초3-2": "https://readingmath.co.kr/build/assets/bg_main_3-2-D8EqePYa.svg",
    "초4-1": "https://readingmath.co.kr/build/assets/bg_main_4-1-CIpXu7g-.svg",
    "초4-2": "https://readingmath.co.kr/build/assets/bg_main_4-2-D3-5QOWb.svg",
    "초5-1": "https://readingmath.co.kr/build/assets/bg_main_5-1-DH42VZWQ.svg",
    "초5-2": "https://readingmath.co.kr/build/assets/bg_main_5-2-Cu-5JXHZ.svg",
    "초6-1": "https://readingmath.co.kr/build/assets/bg_main_6-1-9k9owats.svg",
    "초6-2": "https://readingmath.co.kr/build/assets/bg_main_6-2-BwHkaxh6.svg",
    "중1-1": "https://readingmath.co.kr/build/assets/bg_main_7-1-CJk0frCW.svg",
    "중1-2": "https://readingmath.co.kr/build/assets/bg_main_7-2-Dv97TJh6.svg",
    "중2-1": "https://readingmath.co.kr/build/assets/bg_main_8-1-BVgw1sDG.svg",
    "중2-2": "https://readingmath.co.kr/build/assets/bg_main_8-2-DlcRqy-0.svg",
    "중3-1": "https://readingmath.co.kr/build/assets/bg_main_9-1-CFKWPuz7.svg",
    "중3-2": "https://readingmath.co.kr/build/assets/bg_main_9-2-C47Hs1ye.svg",
    "고1-1": "https://readingmath.co.kr/build/assets/bg_main_7-1-CJk0frCW.svg",
    "고1-2": "https://readingmath.co.kr/build/assets/bg_main_7-2-Dv97TJh6.svg",
};

const MATH_CHARACTERS: Record<string, string> = {
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



export default function MathHomePage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedGradeTerm, setSelectedGradeTerm] = useState<string>(() => {
        if (typeof window !== "undefined") {
            return getGradeTerm("math");
        }
        return "중1-1";
    });
    
    useEffect(() => {
        setSelectedGradeTerm(getGradeTerm("math"));
        const cleanup = onGradeTermChange((subject, code) => {
            if (subject === "math") {
                setSelectedGradeTerm(code);
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

    const mathTasks = tasks.filter(t => t.subject === "math");
    const unstartedCount = mathTasks.filter(t => t.status === "notStarted").length;
    
    const latestUnstartedTask = [...mathTasks]
        .filter(t => t.status === "notStarted")
        .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())[0];

    // 선택된 학기의 첫 단원 첫 소/중단원 명칭 가져오기
    const firstProgressLabel = (() => {
        const course = MATH_CURRICULA.find(c => c.course === selectedGradeTerm);
        if (!course || course.types.length === 0) {
            return "(1) 유리수의 소수 표현";
        }
        return course.types[0].minorUnit;
    })();

    const backgroundUrl = MATH_BACKGROUNDS[selectedGradeTerm] || MATH_BACKGROUNDS["중1-1"];
    const characterUrl = MATH_CHARACTERS[selectedGradeTerm] || MATH_CHARACTERS["중1-1"];




    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#081324] font-sans select-none text-white">
            {/* 1. Global Navigation Bar (GNB) */}
            <header className="fixed top-0 left-0 right-0 h-[56px] bg-[#091527] border-b border-[#142338] z-50 flex items-center justify-between px-5 shadow-md">
                {/* Left: 진리딩 로고 (클릭 시 일감보드로 이동) */}
                <Link href="/" className="flex items-center gap-2 cursor-pointer flex-shrink-0 min-w-[130px]">
                    <svg viewBox="0 0 100 100" className="h-6 w-6 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3B82F6" />
                                <stop offset="50%" stopColor="#EC4899" />
                                <stop offset="100%" stopColor="#F59E0B" />
                            </linearGradient>
                        </defs>
                        {/* 십자 별 모양 심볼 */}
                        <path d="M 50,10 L 55,45 L 90,50 L 55,55 L 50,90 L 45,55 L 10,50 L 45,45 Z" fill="url(#logoGrad)" />
                        {/* 대각선 보조 도트들 */}
                        <circle cx="28" cy="28" r="4.5" fill="#3B82F6" />
                        <circle cx="72" cy="28" r="4.5" fill="#EC4899" />
                        <circle cx="72" cy="72" r="4.5" fill="#F59E0B" />
                        <circle cx="28" cy="72" r="4.5" fill="#10B981" />
                    </svg>
                    <span className="text-[17px] font-black tracking-tight text-white font-headline whitespace-nowrap select-none">
                        진리딩
                    </span>
                </Link>

                {/* Center: Mode Tabs */}
                <div className="flex items-end gap-1.5 h-full">
                    <div className="bg-[#0084ff] text-white px-6 h-[40px] rounded-t-[10px] rounded-b-none text-[15px] font-black flex items-center justify-center cursor-pointer min-w-[95px] transition-all hover:bg-[#0074e0] select-none">
                        기본 모드
                    </div>
                    <div className="h-[40px] flex items-center">
                        <div className="text-[#5c7797] px-5 py-1.5 text-[15px] font-bold min-w-[95px] text-center select-none cursor-default">
                            자유 모드
                        </div>
                    </div>
                    <Link href="/content/math-exam-prep" className="h-[40px] flex items-center">
                        <div className="text-[#5c7797] hover:text-white px-5 py-1.5 text-[15px] font-bold min-w-[95px] text-center cursor-pointer transition-colors select-none">
                            시험 대비
                        </div>
                    </Link>
                    <Link href="/content/math-task-center" className="h-[40px] flex items-center">
                        <div className="relative text-[#5c7797] hover:text-white px-5 py-1.5 text-[15px] font-bold min-w-[95px] text-center cursor-pointer transition-colors select-none">
                            <span>과제 센터</span>
                            {unstartedCount > 0 && (
                                <span className="absolute top-[3px] right-[2px] h-2 w-2 bg-[#ef4444] rounded-full animate-pulse" />
                            )}
                        </div>
                    </Link>
                </div>

                {/* Right: Utility Icons */}
                <div className="flex items-center gap-[24px] text-[#cbd5e1]">
                    <HelpCircle className="h-[22px] w-[22px] hover:text-white transition-colors cursor-pointer" />
                    <div className="relative cursor-pointer group">
                        <Siren className="h-[22px] w-[22px] hover:text-white transition-colors" />
                        <span className="absolute top-[-1px] right-[-1px] h-2 w-2 bg-[#ff3b30] rounded-full animate-pulse" />
                    </div>
                    <Megaphone className="h-[22px] w-[22px] hover:text-white transition-colors cursor-pointer" />
                    <Menu 
                        className="h-[22px] w-[22px] hover:text-white transition-colors cursor-pointer" 
                        onClick={() => setIsSidebarOpen(true)}
                    />
                </div>
            </header>

            {/* 2. Floating Info Badges */}
            <div className="absolute top-[70px] right-6 z-40 flex items-center gap-2.5">
                {/* Badge 1: 학기 표시 배지 */}
                <div className="bg-white hover:bg-slate-50 shadow-[0_2px_10px_rgba(0,0,0,0.12)] pl-[18px] pr-5 py-2.5 rounded-full flex items-center gap-2.5 cursor-pointer transition-all duration-200 select-none">
                    <span className="text-[15px] leading-none">🪐</span>
                    <span className="text-[13.5px] font-bold text-[#1e293b] tracking-tight leading-none">
                        {gradeTermToLabel(selectedGradeTerm)} 행성
                    </span>
                </div>
                {/* Badge 2: 수학 (클릭 시 과학 홈으로 이동) */}
                <Link href="/content/science-home">
                    <div className="bg-white hover:bg-slate-50 shadow-[0_2px_10px_rgba(0,0,0,0.12)] px-5 py-2.5 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 select-none">
                        <span className="text-[13.5px] font-bold text-[#1e293b] tracking-tight leading-none">
                            수학
                        </span>
                    </div>
                </Link>
            </div>

            {/* 2-1. 과제 알림 카드 (배지 row 아래 분리 배치) */}
            {unstartedCount > 0 && latestUnstartedTask && (
                <Link href="/content/math-task-center" className="absolute top-[120px] right-6 z-40 block">
                    <div className="w-[264px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.55),0_4px_20px_rgba(245,158,11,0.25)] cursor-pointer transition-all duration-200 hover:shadow-[0_24px_70px_rgba(0,0,0,0.65)] hover:-translate-y-1 select-none task-card-enter overflow-hidden">
                        <div className="px-4 pt-3.5 pb-4">
                            {/* 헤더: 도트 + 타이틀 + 과제 풀기 버튼 */}
                            <div className="flex items-center gap-2 mb-3">
                                {/* 새 과제 도착 타이틀 왼쪽에 도트 위치 */}
                                <span className="relative flex h-2 w-2 flex-shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                </span>
                                <p className="text-[12px] font-extrabold text-[#ef4444] tracking-wider leading-none">새 과제 도착!</p>
                                
                                {/* 타이틀 영역 우측에 과제 풀기 버튼 배치 */}
                                <div className="ml-auto flex-shrink-0">
                                    <div className="bg-[#091527] hover:bg-[#0d1f35] text-white text-[11px] font-extrabold rounded-lg px-2.5 py-1 flex items-center gap-1 transition-colors duration-150">
                                        과제 풀기 <ArrowRight className="h-2.5 w-2.5" />
                                    </div>
                                </div>
                            </div>

                            {/* 구분선 */}
                            <div className="h-px bg-slate-100 mb-3" />

                            {/* 과제명 */}
                            <p className="text-[13.5px] font-extrabold text-slate-900 leading-snug break-keep mb-2 line-clamp-3">
                                {latestUnstartedTask.title}
                            </p>

                            {/* 단원명 */}
                            {latestUnstartedTask.unitDisplayName && (
                                <span className="inline-block text-[10px] font-bold text-[#92400e] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md leading-none">
                                    {latestUnstartedTask.unitDisplayName}
                                </span>
                            )}
                        </div>
                    </div>
                </Link>
            )}

            {/* 3. Hero Content Area */}
            <main className="relative h-screen w-full flex flex-col items-center justify-end pb-[7vh] pt-[56px]">
                {/* Background Image (수학 홈 이미지) */}
                <div className="absolute inset-0 z-0">
                    <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url('${backgroundUrl}')` }}
                    />
                    <div className="absolute inset-0 bg-black/25 pointer-events-none" />
                </div>

                {/* Speech Bubble */}
                <div className="relative z-10 mb-6 animate-bounce-slow">
                    <div className="bg-white rounded-2xl p-5 px-8 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.6)] border border-slate-100/90 relative max-w-[420px] select-none">
                        <p className="text-[14.5px] font-black text-slate-800 leading-relaxed text-center break-keep">
                            {firstProgressLabel}의 <br />
                            개념훈련을 시작해 보세요!
                        </p>
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white" />
                    </div>
                </div>

                {/* Character */}
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-[170px] h-[190px] transform hover:scale-105 transition-transform duration-500 cursor-pointer">
                        <img src={characterUrl} className="w-full h-full object-contain" alt="character" />
                    </div>
                    <div className="w-[140px] h-[10px] bg-black/35 blur-sm rounded-full mt-1.5 opacity-80 pointer-events-none" />
                </div>
            </main>

            <style jsx global>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3.2s ease-in-out infinite;
                }
                @keyframes card-enter {
                    0% { opacity: 0; transform: translateY(-8px) scale(0.97); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .task-card-enter {
                    animation: card-enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}</style>

            <StudentSidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
                subject="math"
                gradeTerm={gradeTermToLabel(selectedGradeTerm)}
            />
        </div>
    );
}
