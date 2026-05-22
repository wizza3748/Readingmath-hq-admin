"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    HelpCircle,
    Siren,
    Megaphone,
    Menu,
    ArrowLeft,
    ClipboardList,
    CheckCircle2,
    PlayCircle,
    Sparkles,
    ChevronDown,
    X,
    TrendingUp,
    Award,
    BookOpen,
    ArrowRight,
    Lock
} from "lucide-react";
import { getStoredTasks, updateTaskStatus, Task } from "@/utils/taskStorage";

export default function MathTaskCenterPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(true);
    
    // 모달 상태
    const [startModalOpen, setStartModalOpen] = useState(false);
    const [continueModalOpen, setContinueModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    
    // 완료 과제 더보기 상태
    const [visibleCompletedCount, setVisibleCompletedCount] = useState(10);

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
    
    // 상태별 분류
    const unstartedTasks = [...mathTasks]
        .filter(t => t.status === "notStarted")
        .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
        
    const ongoingTasks = [...mathTasks]
        .filter(t => t.status === "ongoing")
        .sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
        });
        
    const submittedTasks = [...mathTasks]
        .filter(t => t.status === "submitted")
        .sort((a, b) => {
            const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
            const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
            return dateB - dateA;
        });

    // 학습 현황 요약 연산 (제출완료 과제 기준)
    const completedCount = submittedTasks.length;
    
    const averageScore = completedCount > 0 
        ? Math.round(submittedTasks.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / completedCount)
        : 0;
        
    const totalSubmittedProblems = submittedTasks.reduce((acc, curr) => acc + (Number(curr.totalProblems) || 0), 0);
    const totalCorrectProblems = submittedTasks.reduce((acc, curr) => acc + (Number(curr.correctProblems) || 0), 0);

    // 날짜 포맷 함수 (YYYY.MM.DD HH:mm)
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
    };

    // 미시작 과제 시작 모달 열기
    const openStartModal = (task: Task) => {
        setSelectedTask(task);
        setStartModalOpen(true);
    };

    // 미시작 과제 시작 동작 수행
    const confirmStartTask = () => {
        if (selectedTask) {
            updateTaskStatus(selectedTask.id, "ongoing");
            setStartModalOpen(false);
            setSelectedTask(null);
        }
    };

    // 진행중 과제 계속 풀기 모달 열기
    const openContinueModal = (task: Task) => {
        setSelectedTask(task);
        setContinueModalOpen(true);
    };

    // 완료 과제 더보기 핸들러
    const handleShowMoreCompleted = () => {
        setVisibleCompletedCount(prev => prev + 10);
    };

    return (
        <div className={`relative min-h-screen w-full overflow-x-hidden ${isDarkMode ? 'bg-[#060413] text-[#cbd5e1]' : 'bg-[#f8fafc] text-[#334155]'} font-body pb-32 transition-colors duration-300`}>
            
            {/* 세련된 배경 발광 효과 (다크모드 시 극대화, 라이트모드 시 부드러운 하이라이트) */}
            {isDarkMode ? (
                <>
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12)_0%,transparent_70%)] pointer-events-none z-0" />
                    <div className="absolute top-[30%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.08)_0%,transparent_75%)] pointer-events-none z-0" />
                    <div className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.1)_0%,transparent_70%)] pointer-events-none z-0" />
                </>
            ) : (
                <>
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.03)_0%,transparent_70%)] pointer-events-none z-0" />
                    <div className="absolute top-[30%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.02)_0%,transparent_75%)] pointer-events-none z-0" />
                </>
            )}

            {/* 1. Global Navigation Bar (GNB) */}
            <header className={`fixed top-0 left-0 right-0 h-[56px] ${isDarkMode ? 'bg-[#0c0926]/80 border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.4)]' : 'bg-white/80 border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'} backdrop-blur-md border-b z-40 flex items-center justify-between px-6 transition-all duration-300`}>
                <Link href="/" className="flex items-center gap-2 cursor-pointer flex-shrink-0 group">
                    <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 p-[1.5px] transition-transform duration-300 group-hover:scale-105">
                        <div className={`flex h-full w-full items-center justify-center rounded-[6px] ${isDarkMode ? 'bg-[#0c0926]' : 'bg-white'}`}>
                            <svg viewBox="0 0 100 100" className="h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg">
                                <path d="M 50,10 L 55,45 L 90,50 L 55,55 L 50,90 L 45,55 L 10,50 L 45,45 Z" fill="url(#headerLogoGradMath)" />
                                <defs>
                                    <linearGradient id="headerLogoGradMath" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6366F1" />
                                        <stop offset="100%" stopColor="#EC4899" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                    <span className={`text-[17px] font-black tracking-tight ${isDarkMode ? 'text-white bg-gradient-to-r from-white to-[#cbd5e1] bg-clip-text' : 'text-[#0f172a]'} font-headline whitespace-nowrap select-none`}>
                        진리딩
                    </span>
                </Link>

                <div className="flex items-end gap-1 h-full">
                    <Link href="/content/math-home" className="h-[44px] flex items-center">
                        <div className={`${isDarkMode ? 'text-[#94a3b8] hover:text-white' : 'text-[#64748b] hover:text-[#0f172a]'} px-5 py-2 text-[14px] font-bold min-w-[90px] text-center cursor-pointer transition-all duration-200 hover:-translate-y-[1px] select-none`}>
                            기본 모드
                        </div>
                    </Link>
                    <div className={`${isDarkMode ? 'text-[#94a3b8] hover:text-white' : 'text-[#64748b] hover:text-[#0f172a]'} px-5 py-2 text-[14px] font-bold min-w-[90px] text-center cursor-pointer transition-all duration-200 hover:-translate-y-[1px] select-none h-[44px] flex items-center`}>
                        자유 모드
                    </div>
                    <div className={`${isDarkMode ? 'text-[#94a3b8] hover:text-white' : 'text-[#64748b] hover:text-[#0f172a]'} px-5 py-2 text-[14px] font-bold min-w-[90px] text-center cursor-pointer transition-all duration-200 hover:-translate-y-[1px] select-none h-[44px] flex items-center`}>
                        시험 대비
                    </div>
                    
                    <div className={`relative ${isDarkMode ? 'bg-[#f59e0b] shadow-[0_-4px_20px_rgba(245,158,11,0.25)] border-[#fbbf24]/30' : 'bg-[#f59e0b] shadow-[0_-4px_15px_rgba(245,158,11,0.15)] border-[#fbbf24]/50'} text-white px-6 h-[44px] rounded-t-[12px] rounded-b-none text-[14px] font-black flex items-center justify-center min-w-[95px] select-none border-t border-x`}>
                        <span>과제 센터</span>
                        {unstartedTasks.length > 0 && (
                            <span className="absolute top-[10px] right-[10px] h-2 w-2 bg-[#ef4444] rounded-full ring-2 ring-[#f59e0b] animate-ping" />
                        )}
                    </div>
                </div>

                <div className={`flex items-center gap-[20px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                    <HelpCircle className={`h-[20px] w-[20px] ${isDarkMode ? 'hover:text-white' : 'hover:text-[#0f172a]'} transition-colors cursor-pointer`} />
                    <div className="relative cursor-pointer group">
                        <Siren className={`h-[20px] w-[20px] ${isDarkMode ? 'hover:text-white' : 'hover:text-[#0f172a]'} transition-colors`} />
                        <span className="absolute top-0 right-0 h-1.5 w-1.5 bg-[#ef4444] rounded-full animate-pulse" />
                    </div>
                    <Megaphone className={`h-[20px] w-[20px] ${isDarkMode ? 'hover:text-white' : 'hover:text-[#0f172a]'} transition-colors cursor-pointer`} />
                    <Menu className={`h-[20px] w-[20px] ${isDarkMode ? 'hover:text-white' : 'hover:text-[#0f172a]'} transition-colors cursor-pointer`} />
                </div>
            </header>

            {/* Main Container */}
            <main className="relative max-w-5xl mx-auto px-6 pt-[90px] z-10">
                
                {/* 2. <상단 영역> */}
                <div className={`flex flex-col md:flex-row md:items-center md:justify-between mb-10 pb-6 border-b ${isDarkMode ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white bg-gradient-to-r from-white to-[#cbd5e1] bg-clip-text' : 'text-[#0f172a]'}`}>과제 센터</h1>
                            <span className={`px-3 py-0.5 ${isDarkMode ? 'bg-gradient-to-r from-[#fbbf24]/20 to-[#d97706]/20 text-[#fbbf24] border-[#fbbf24]/30' : 'bg-[#fef3c7] text-[#d97706] border-[#fde68a]'} text-[12px] font-black rounded-full border shadow-[0_0_15px_rgba(251,191,36,0.15)]`}>수학</span>
                        </div>
                        <p className={`text-[13.5px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#475569]'} mt-1 font-medium`}>수학과제를 확인하고 풀이할 수 있습니다.</p>
                    </div>

                    {/* 테마 토글 버튼 (라이트 / 다크) */}
                    <div className="mt-4 md:mt-0 flex items-center">
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`relative w-16 h-8 rounded-full transition-all duration-300 flex items-center p-1 cursor-pointer select-none focus:outline-none shadow-md ${
                                isDarkMode ? 'bg-[#1e293b] border border-white/[0.08]' : 'bg-[#e2e8f0] border border-slate-300'
                            }`}
                        >
                            {/* 토글 볼 */}
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 transform shadow-sm ${
                                    isDarkMode ? 'translate-x-8 bg-[#334155]' : 'translate-x-0 bg-white'
                                }`}
                            >
                                {isDarkMode ? (
                                    <span className="text-[12px] select-none">🌙</span>
                                ) : (
                                    <span className="text-[12px] select-none">☀️</span>
                                )}
                            </div>
                        </button>
                    </div>
                </div>

                {/* 3. <학습 현황 요약 영역> (다크/라이트 완벽 대응 및 미려한 레이아웃) */}
                {completedCount > 0 && (
                    <div className="mb-12">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* 카드 1: 완료 과제 수 */}
                            <div className={`relative overflow-hidden ${isDarkMode ? 'bg-white/[0.02] border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.3)] hover:bg-white/[0.04]' : 'bg-white border border-slate-100 shadow-[0_6px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.04)]'} rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group`}>
                                <div className={`absolute top-[-20%] right-[-20%] p-6 ${isDarkMode ? 'bg-[#fbbf24]/5 group-hover:bg-[#fbbf24]/8' : 'bg-amber-50 group-hover:bg-amber-100/50'} rounded-full blur-2xl transition-colors duration-300 pointer-events-none`} />
                                <div className="flex items-center justify-between">
                                    <span className={`text-[12px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'} font-extrabold tracking-wide uppercase`}>완료 과제</span>
                                    <Award className="h-5 w-5 text-[#fbbf24]" />
                                </div>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className={`text-3xl font-black ${isDarkMode ? 'text-white bg-gradient-to-r from-white to-[#e2e8f0] bg-clip-text' : 'text-[#0f172a]'} font-mono tracking-tight`}>{completedCount}</span>
                                    <span className={`text-[13px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#475569]'} font-black`}>개</span>
                                </div>
                                <div className="mt-2.5 h-[1.5px] w-full bg-gradient-to-r from-[#fbbf24]/40 to-transparent" />
                            </div>

                            {/* 카드 2: 평균 점수 */}
                            <div className={`relative overflow-hidden ${isDarkMode ? 'bg-white/[0.02] border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.3)] hover:bg-white/[0.04]' : 'bg-white border border-slate-100 shadow-[0_6px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.04)]'} rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group`}>
                                <div className={`absolute top-[-20%] right-[-20%] p-6 ${isDarkMode ? 'bg-[#34d399]/5 group-hover:bg-[#34d399]/8' : 'bg-emerald-50 group-hover:bg-emerald-100/50'} rounded-full blur-2xl transition-colors duration-300 pointer-events-none`} />
                                <div className="flex items-center justify-between">
                                    <span className={`text-[12px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'} font-extrabold tracking-wide uppercase`}>평균 점수</span>
                                    <TrendingUp className="h-5 w-5 text-[#34d399]" />
                                </div>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className={`text-3xl font-black ${isDarkMode ? 'text-[#34d399]' : 'text-[#059669]'} font-mono tracking-tight`}>{averageScore}</span>
                                    <span className={`text-[13px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#475569]'} font-black`}>점</span>
                                </div>
                                <div className="mt-2.5 h-[1.5px] w-full bg-gradient-to-r from-[#34d399]/40 to-transparent" />
                            </div>

                            {/* 카드 3: 제출 문항 수 */}
                            <div className={`relative overflow-hidden ${isDarkMode ? 'bg-white/[0.02] border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.3)] hover:bg-white/[0.04]' : 'bg-white border border-slate-100 shadow-[0_6px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.04)]'} rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group`}>
                                <div className={`absolute top-[-20%] right-[-20%] p-6 ${isDarkMode ? 'bg-[#38bdf8]/5 group-hover:bg-[#38bdf8]/8' : 'bg-blue-50 group-hover:bg-blue-100/50'} rounded-full blur-2xl transition-colors duration-300 pointer-events-none`} />
                                <div className="flex items-center justify-between">
                                    <span className={`text-[12px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'} font-extrabold tracking-wide uppercase`}>제출 문항</span>
                                    <BookOpen className="h-5 w-5 text-[#38bdf8]" />
                                </div>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className={`text-3xl font-black ${isDarkMode ? 'text-[#38bdf8]' : 'text-[#0284c7]'} font-mono tracking-tight`}>{totalSubmittedProblems}</span>
                                    <span className={`text-[13px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#475569]'} font-black`}>문항</span>
                                </div>
                                <div className="mt-2.5 h-[1.5px] w-full bg-gradient-to-r from-[#38bdf8]/40 to-transparent" />
                            </div>

                            {/* 카드 4: 정답 문항 수 */}
                            <div className={`relative overflow-hidden ${isDarkMode ? 'bg-white/[0.02] border-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.3)] hover:bg-white/[0.04]' : 'bg-white border border-slate-100 shadow-[0_6px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.04)]'} rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group`}>
                                <div className={`absolute top-[-20%] right-[-20%] p-6 ${isDarkMode ? 'bg-[#a78bfa]/5 group-hover:bg-[#a78bfa]/8' : 'bg-purple-50 group-hover:bg-purple-100/50'} rounded-full blur-2xl transition-colors duration-300 pointer-events-none`} />
                                <div className="flex items-center justify-between">
                                    <span className={`text-[12px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'} font-extrabold tracking-wide uppercase`}>정답 문항</span>
                                    <CheckCircle2 className="h-5 w-5 text-[#a78bfa]" />
                                </div>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className={`text-3xl font-black ${isDarkMode ? 'text-[#a78bfa]' : 'text-[#7c3aed]'} font-mono tracking-tight`}>{totalCorrectProblems}</span>
                                    <span className={`text-[13px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#475569]'} font-black`}>문항</span>
                                </div>
                                <div className="mt-2.5 h-[1.5px] w-full bg-gradient-to-r from-[#a78bfa]/40 to-transparent" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. <진행중 과제 영역> (더 입체감 있는 그라데이션 글로우 & 디테일) */}
                {ongoingTasks.length > 0 && (
                    <div className="mb-14">
                        <div className="flex items-center gap-2.5 mb-5">
                            <h2 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-[#0f172a]'} tracking-tight`}>진행중 과제</h2>
                            <span className={`${isDarkMode ? 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/20 shadow-[0_0_10px_rgba(56,189,248,0.1)]' : 'bg-blue-50 text-[#0284c7] border border-blue-100'} px-2.5 py-0.5 rounded-full text-[12px] font-black font-mono`}>{ongoingTasks.length}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {ongoingTasks.map(task => {
                                const solved = Number(task.solvedProblems) || 0;
                                const totalProbs = Number(task.totalProblems) || 0;
                                const progressPct = totalProbs > 0 ? Math.round((solved / totalProbs) * 100) : 0;
                                
                                return (
                                    <div key={task.id} className={`group relative ${isDarkMode ? 'bg-white/[0.02] border-white/[0.06] hover:border-indigo-500/40 shadow-[0_12px_45px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.12)]' : 'bg-[#f0f7ff] border border-blue-100/70 shadow-[0_4px_15px_rgba(30,41,59,0.02)] hover:border-blue-300'} rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between min-h-[210px] hover:-translate-y-1`}>
                                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        
                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-2.5">
                                                <h3 className={`text-[16px] font-bold ${isDarkMode ? 'text-white group-hover:text-indigo-200' : 'text-[#1e293b] group-hover:text-[#1d4ed8]'} transition-colors leading-snug break-keep tracking-tight`}>
                                                    {task.title}
                                                </h3>
                                            </div>
                                            
                                            {task.unitDisplayName && (
                                                <span className={`inline-block px-2.5 py-0.5 ${isDarkMode ? 'bg-white/[0.04] text-[#a5b4fc] border-white/[0.04]' : 'bg-white text-indigo-600 border border-slate-200'} text-[11.5px] font-bold rounded-md leading-none mb-4`}>
                                                    {task.unitDisplayName}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-2">
                                            {/* Progress Bar */}
                                            <div className="flex items-center justify-between text-[12px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#475569]'} font-extrabold mb-2">
                                                <span className="flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5 text-[#38bdf8]" /> 풀이 진행률</span>
                                                <span className={`font-mono ${isDarkMode ? 'text-white bg-white/[0.05]' : 'text-[#0f172a] bg-[#e0f2fe]'} px-1.5 py-0.5 rounded`}>{progressPct}% ({solved}/{totalProbs})</span>
                                            </div>
                                            <div className={`w-full h-3 ${isDarkMode ? 'bg-[#110e2e]/90 border-white/[0.04]' : 'bg-slate-200/70 border-slate-300/40'} rounded-full overflow-hidden border p-[1.5px]`}>
                                                <div 
                                                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                                                    style={{ width: `${progressPct}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className={`mt-5 pt-4 border-t ${isDarkMode ? 'border-white/[0.05]' : 'border-slate-200/50'} flex items-center justify-between`}>
                                            <span className={`text-[11px] ${isDarkMode ? 'text-[#64748b]' : 'text-[#64748b]'} font-mono`}>최근진행: {formatDate(task.updatedAt)}</span>
                                            <button 
                                                onClick={() => openContinueModal(task)}
                                                className={`px-6 py-2 ${isDarkMode ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]' : 'bg-[#1d4ed8] hover:bg-blue-700 hover:shadow-[0_4px_12px_rgba(29,78,216,0.2)]'} text-white text-[12px] font-extrabold rounded-xl shadow-lg transition-all duration-200 active:scale-95 flex items-center gap-1 group/btn`}
                                            >
                                                계속 풀기 <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 5. <미시작 과제 영역> */}
                {unstartedTasks.length > 0 && (
                    <div className="mb-14">
                        <div className="flex items-center gap-2.5 mb-5">
                            <h2 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-[#0f172a]'} tracking-tight`}>미시작 과제</h2>
                            <span className={`${isDarkMode ? 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]' : 'bg-amber-50 text-[#d97706] border border-amber-100'} px-2.5 py-0.5 rounded-full text-[12px] font-black font-mono`}>{unstartedTasks.length}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {unstartedTasks.map(task => (
                                <div key={task.id} className={`group relative ${isDarkMode ? 'bg-white/[0.02] border-white/[0.06] hover:border-[#fbbf24]/40 shadow-[0_12px_45px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_40px_rgba(251,191,36,0.08)]' : 'bg-white border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.015)] hover:border-slate-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.025)]'} rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between min-h-[190px] hover:-translate-y-1`}>
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#fbbf24] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-2.5">
                                            <h3 className={`text-[16px] font-bold ${isDarkMode ? 'text-white group-hover:text-[#fbbf24]/90' : 'text-[#1e293b] group-hover:text-[#b45309]'} transition-colors leading-snug break-keep tracking-tight`}>
                                                {task.title}
                                            </h3>
                                        </div>
                                        
                                        {task.unitDisplayName && (
                                            <span className={`inline-block px-2.5 py-0.5 ${isDarkMode ? 'bg-white/[0.04] text-[#fcd34d] border-white/[0.04]' : 'bg-amber-50 text-[#d97706] border border-amber-100'} text-[11.5px] font-bold rounded-md leading-none mb-4`}>
                                                {task.unitDisplayName}
                                            </span>
                                        )}
                                    </div>

                                    <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-white/[0.05]' : 'border-slate-200/50'} flex items-center justify-between`}>
                                        <div className={`text-[12.5px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'} font-bold flex items-center gap-1.5`}>
                                            <Lock className={`h-3.5 w-3.5 ${isDarkMode ? 'text-[#fbbf24]/70' : 'text-[#d97706]'}`} />
                                            문항수: <span className={`${isDarkMode ? 'text-white' : 'text-[#0f172a]'} font-mono`}>{task.totalProblems}</span>문항
                                        </div>
                                        <button 
                                            onClick={() => openStartModal(task)}
                                            className={`px-6 py-2 ${isDarkMode ? 'bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:from-[#fbbf24] hover:to-[#f59e0b] hover:shadow-[0_0_20px_rgba(251,191,36,0.35)]' : 'bg-[#1e293b] hover:bg-[#0f172a] text-white'} text-[12px] font-extrabold rounded-xl shadow-lg transition-all duration-200 active:scale-95 flex items-center gap-1 group/btn`}
                                        >
                                            과제 풀기 <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 6. <완료 과제 영역> */}
                {submittedTasks.length > 0 && (
                    <div className="mb-14">
                        <div className="flex items-center gap-2.5 mb-5">
                            <h2 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-[#0f172a]'} tracking-tight`}>완료 과제</h2>
                            <span className={`${isDarkMode ? 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]' : 'bg-emerald-50 text-[#059669] border border-emerald-100'} px-2.5 py-0.5 rounded-full text-[12px] font-black font-mono`}>{submittedTasks.length}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {submittedTasks.slice(0, visibleCompletedCount).map(task => (
                                <div key={task.id} className={`group relative ${isDarkMode ? 'bg-white/[0.01] border-white/[0.04] shadow-[0_12px_45px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_40px_rgba(52,211,153,0.06)]' : 'bg-white border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.015)] hover:border-slate-300'} rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between min-h-[190px] hover:-translate-y-1`}>
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#34d399] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h3 className={`text-[16px] font-bold ${isDarkMode ? 'text-[#e2e8f0] group-hover:text-white' : 'text-[#1e293b] group-hover:text-[#059669]'} transition-colors leading-snug break-keep tracking-tight`}>
                                                {task.title}
                                            </h3>
                                        </div>
                                        
                                        {task.unitDisplayName && (
                                            <span className={`inline-block px-2.5 py-0.5 ${isDarkMode ? 'bg-white/[0.03] text-[#a7f3d0] border-white/[0.03]' : 'bg-emerald-50 text-[#059669] border border-emerald-100'} text-[11px] font-bold rounded-md leading-none mb-3`}>
                                                {task.unitDisplayName}
                                            </span>
                                        )}
                                        <p className="text-[11.5px] text-[#64748b] font-mono mt-1">
                                            제출: {formatDate(task.submittedAt)}
                                        </p>
                                    </div>

                                    <div className={`mt-5 pt-4 border-t ${isDarkMode ? 'border-white/[0.05]' : 'border-slate-200/50'} flex items-center justify-between`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xl font-black ${isDarkMode ? 'text-[#34d399]' : 'text-[#059669]'} font-mono tracking-tight`}>{task.score}점</span>
                                            <span className={`text-[12.5px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#475569]'} font-bold`}>
                                                정답 <span className={`font-mono font-black ${isDarkMode ? 'text-[#34d399]' : 'text-[#059669]'}`}>{task.correctProblems}</span> / {task.totalProblems}
                                            </span>
                                        </div>
                                        <button 
                                            className={`px-6 py-2 ${isDarkMode ? 'bg-white/[0.03] text-[#cbd5e1] border-white/[0.08] hover:bg-white/[0.08] hover:text-white hover:border-white/[0.15]' : 'bg-slate-50 border border-slate-200 text-[#475569] hover:bg-slate-100 hover:text-[#0f172a]'} text-[12px] font-extrabold rounded-xl shadow-md transition-all active:scale-95`}
                                        >
                                            결과 보기
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 완료 과제 더보기 버튼 (11건 이상일 때만 노출) */}
                        {submittedTasks.length > visibleCompletedCount && (
                            <div className="mt-10 flex justify-center">
                                <button 
                                    onClick={handleShowMoreCompleted}
                                    className={`px-10 py-3.5 ${isDarkMode ? 'bg-white/[0.02] hover:bg-white/[0.06] text-[#cbd5e1] hover:text-white border-white/[0.06] hover:border-white/[0.12]' : 'bg-white border border-slate-200 text-[#64748b] hover:bg-slate-50 hover:text-[#0f172a]'} text-[13px] font-extrabold rounded-2xl shadow-xl transition-all flex items-center gap-1.5 hover:-translate-y-0.5`}
                                >
                                    완료 과제 더보기 <ChevronDown className="h-4 w-4 text-[#94a3b8]" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 전체 과제 부재 시 대체 화면 */}
                {mathTasks.length === 0 && (
                    <div className={`relative overflow-hidden ${isDarkMode ? 'bg-white/[0.02] border-white/[0.06] shadow-2xl' : 'bg-white border border-slate-100 shadow-lg'} rounded-3xl p-20 text-center`}>
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 ${isDarkMode ? 'bg-indigo-500/5' : 'bg-indigo-500/[0.02]'} rounded-full blur-3xl pointer-events-none`} />
                        <ClipboardList className={`h-16 w-16 ${isDarkMode ? 'text-indigo-400/40' : 'text-indigo-400/20'} mx-auto mb-4`} />
                        <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-[#0f172a]'}`}>배정된 과제가 없습니다</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#64748b]'} mt-2`}>깨끗하게 모든 과제를 마쳤거나 배정된 수학 과제가 없습니다.</p>
                    </div>
                )}

            </main>

            {/* ============================================================== */}
            {/* 7. <과제 시작 확인 모달> */}
            {startModalOpen && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Dimmed Background */}
                    <div className="absolute inset-0 bg-[#020108]/90 backdrop-blur-md" />
                    
                    {/* Modal Content */}
                    <div className={`relative ${isDarkMode ? 'bg-[#0c0926]/90 border-white/[0.12] shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.06)]' : 'bg-white border border-slate-200 shadow-2xl'} rounded-3xl p-8 max-w-[420px] w-full z-10 animate-in fade-in zoom-in-95 duration-200`}>
                        <div className="absolute top-5 right-5">
                            <button 
                                onClick={() => { setStartModalOpen(false); setSelectedTask(null); }}
                                className={`p-1.5 ${isDarkMode ? 'text-[#94a3b8] hover:text-white hover:bg-white/[0.05]' : 'text-[#64748b] hover:text-[#0f172a] hover:bg-slate-100'} rounded-xl transition-all`}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center text-center mt-4">
                            <div className={`p-4 ${isDarkMode ? 'bg-[#fbbf24]/10 border-[#fbbf24]/20 shadow-[0_0_25px_rgba(251,191,36,0.15)]' : 'bg-amber-50 border border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.08)]'} rounded-full mb-5 animate-pulse`}>
                                <Sparkles className="h-7 w-7 text-[#fbbf24]" />
                            </div>
                            
                            <h3 className={`text-[19px] font-black ${isDarkMode ? 'text-white' : 'text-[#0f172a]'} tracking-tight mb-2.5`}>
                                과제를 시작할까요?
                            </h3>
                            
                            <p className={`text-[14px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#475569]'} leading-relaxed break-keep mb-7`}>
                                과제 화면에 들어가 문제를 풀이하게 됩니다.<br />
                                제출 버튼을 누르기 전까지 입력한 답안은 자동으로 유지됩니다.
                            </p>

                            <div className="w-full grid grid-cols-2 gap-3.5">
                                <button
                                    onClick={() => { setStartModalOpen(false); setSelectedTask(null); }}
                                    className={`py-3.5 ${isDarkMode ? 'bg-white/[0.03] text-[#cbd5e1] border-white/[0.08] hover:bg-white/[0.08] hover:text-white hover:border-white/[0.15]' : 'bg-slate-50 border border-slate-200 text-[#475569] hover:bg-slate-100 hover:text-[#0f172a]'} text-[13.5px] font-extrabold rounded-xl transition-all active:scale-95 shadow-md`}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={confirmStartTask}
                                    className={`py-3.5 ${isDarkMode ? 'bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'bg-[#1e293b] hover:bg-[#0f172a] text-white'} text-[13.5px] font-extrabold rounded-xl shadow-lg transition-all active:scale-95`}
                                >
                                    풀기 시작
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* 8. <계속 풀기 확인 모달> */}
            {continueModalOpen && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Dimmed Background */}
                    <div className="absolute inset-0 bg-[#020108]/90 backdrop-blur-md" />
                    
                    {/* Modal Content */}
                    <div className={`relative ${isDarkMode ? 'bg-[#0c0926]/90 border-white/[0.12] shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.06)]' : 'bg-white border border-slate-200 shadow-2xl'} rounded-3xl p-8 max-w-[420px] w-full z-10 animate-in fade-in zoom-in-95 duration-200`}>
                        <div className="absolute top-5 right-5">
                            <button 
                                onClick={() => { setContinueModalOpen(false); setSelectedTask(null); }}
                                className={`p-1.5 ${isDarkMode ? 'text-[#94a3b8] hover:text-white hover:bg-white/[0.05]' : 'text-[#64748b] hover:text-[#0f172a] hover:bg-slate-100'} rounded-xl transition-all`}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex flex-col items-center text-center mt-4">
                            <div className={`p-4 ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.15)]' : 'bg-indigo-50 border border-indigo-200'} rounded-full mb-5`}>
                                <PlayCircle className="h-7 w-7 text-indigo-400" />
                            </div>
                            
                            <h3 className={`text-[19px] font-black ${isDarkMode ? 'text-white' : 'text-[#0f172a]'} tracking-tight mb-2.5`}>
                                과제를 계속 풀까요?
                            </h3>
                            
                            <p className={`text-[14px] ${isDarkMode ? 'text-[#94a3b8]' : 'text-[#475569]'} leading-relaxed break-keep mb-7`}>
                                이전에 진행하던 과제 풀이 화면으로 이동하여<br />
                                저장되어 있던 답안에 이어 풀기를 계속합니다.
                            </p>

                            <div className="w-full grid grid-cols-2 gap-3.5">
                                <button
                                    onClick={() => { setContinueModalOpen(false); setSelectedTask(null); }}
                                    className={`py-3.5 ${isDarkMode ? 'bg-white/[0.03] text-[#cbd5e1] border-white/[0.08] hover:bg-white/[0.08] hover:text-white hover:border-white/[0.15]' : 'bg-slate-50 border border-slate-200 text-[#475569] hover:bg-slate-100 hover:text-[#0f172a]'} text-[13.5px] font-extrabold rounded-xl shadow-md active:scale-95`}
                                >
                                    취소
                                </button>
                                <button
                                    onClick={() => { setContinueModalOpen(false); setSelectedTask(null); }}
                                    className={`py-3.5 ${isDarkMode ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-[#1d4ed8] hover:bg-blue-700 text-white'} text-[13.5px] font-extrabold rounded-xl shadow-lg active:scale-95`}
                                >
                                    계속 풀기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
