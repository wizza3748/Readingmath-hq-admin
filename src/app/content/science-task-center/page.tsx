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
    AlertCircle,
    CheckCircle2,
    Clock,
    PlayCircle
} from "lucide-react";
import { getStoredTasks, updateTaskStatus, Task, getUnstartedTasks } from "@/utils/taskStorage";

export default function ScienceTaskCenterPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    
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
    const unstartedCount = scienceTasks.filter(t => t.status === "not_started").length;

    const handleStatusChange = (taskId: string, status: Task["status"]) => {
        updateTaskStatus(taskId, status);
    };

    return (
        <div className="relative min-h-screen w-full overflow-y-auto bg-[#040b17] font-sans select-none text-white pb-12">
            {/* 1. Global Navigation Bar (GNB) */}
            <header className="fixed top-0 left-0 right-0 h-[48px] bg-[#091527] border-b border-[#142338] z-50 flex items-center justify-between px-5 shadow-md">
                {/* Left: 진리딩 로고 */}
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

                {/* Center: Mode Tabs & 과제 센터 */}
                <div className="flex items-end gap-1.5 h-full">
                    <Link href="/content/science-home" className="h-[40px] flex items-center">
                        <div className="text-[#5c7797] hover:text-white px-5 py-1.5 text-[15px] font-bold min-w-[95px] text-center cursor-pointer transition-colors select-none">
                            기본 모드
                        </div>
                    </Link>
                    <div className="text-[#5c7797] hover:text-white px-5 py-1.5 text-[15px] font-bold min-w-[95px] text-center cursor-pointer transition-colors select-none h-[40px] flex items-center">
                        자유 모드
                    </div>
                    <div className="text-[#5c7797] hover:text-white px-5 py-1.5 text-[15px] font-bold min-w-[95px] text-center cursor-pointer transition-colors select-none h-[40px] flex items-center">
                        시험 대비
                    </div>
                    
                    {/* 과제 센터 탭 (현재 화면이므로 활성 상태이나 비활성 처리) */}
                    <div className="relative bg-[#0084ff] text-white px-6 h-[40px] rounded-t-[10px] rounded-b-none text-[15px] font-black flex items-center justify-center min-w-[95px] select-none shadow-[0_-2px_10px_rgba(0,132,255,0.3)]">
                        <span>과제 센터</span>
                        {/* 과제 센터 알림 dot (미시작 과제 1건 이상일 때) */}
                        {unstartedCount > 0 && (
                            <span className="absolute top-[8px] right-[10px] h-2.5 w-2.5 bg-[#ef4444] rounded-full ring-2 ring-[#0084ff] animate-pulse" />
                        )}
                    </div>
                </div>

                {/* Right: Utility Icons */}
                <div className="flex items-center gap-[24px] text-[#cbd5e1]">
                    <HelpCircle className="h-[22px] w-[22px] hover:text-white transition-colors cursor-pointer" />
                    <div className="relative cursor-pointer group">
                        <Siren className="h-[22px] w-[22px] hover:text-white transition-colors" />
                        <span className="absolute top-[-1px] right-[-1px] h-2 w-2 bg-[#ff3b30] rounded-full animate-pulse" />
                    </div>
                    <Megaphone className="h-[22px] w-[22px] hover:text-white transition-colors cursor-pointer" />
                    <Menu className="h-[22px] w-[22px] hover:text-white transition-colors cursor-pointer" />
                </div>
            </header>

            {/* Content Area */}
            <main className="max-w-5xl mx-auto px-6 pt-[90px]">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Link href="/content/science-home" className="p-2 bg-[#101e33] hover:bg-[#1a2d4b] rounded-full transition-colors">
                            <ArrowLeft className="h-5 w-5 text-white" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 bg-[#0084ff]/20 text-[#0084ff] text-[12px] font-black rounded-md border border-[#0084ff]/30">과학</span>
                                <h1 className="text-2xl font-black tracking-tight text-white font-headline">과학 과제 센터</h1>
                            </div>
                            <p className="text-[13px] text-[#5c7797] mt-1 font-medium">배정된 과학 과제를 확인하고 학습을 진행해 보세요.</p>
                        </div>
                    </div>
                    
                    {/* Status Summary */}
                    <div className="bg-[#0b1424] border border-[#142338] rounded-2xl px-6 py-3.5 flex items-center gap-6 shadow-xl">
                        <div className="text-center">
                            <span className="text-[11px] text-[#5c7797] block font-bold">미시작</span>
                            <span className="text-xl font-black text-[#0084ff] block mt-0.5">{unstartedCount}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-[#142338]" />
                        <div className="text-center">
                            <span className="text-[11px] text-[#5c7797] block font-bold">진행중</span>
                            <span className="text-xl font-black text-[#38bdf8] block mt-0.5">
                                {scienceTasks.filter(t => t.status === "ongoing").length}
                            </span>
                        </div>
                        <div className="h-8 w-[1px] bg-[#142338]" />
                        <div className="text-center">
                            <span className="text-[11px] text-[#5c7797] block font-bold">제출완료</span>
                            <span className="text-xl font-black text-[#4ade80] block mt-0.5">
                                {scienceTasks.filter(t => t.status === "submitted").length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info Alert */}
                <div className="bg-gradient-to-r from-[#0084ff]/10 to-transparent border-l-4 border-[#0084ff] p-4 rounded-r-xl flex items-start gap-3 mb-8 shadow-md">
                    <AlertCircle className="h-5 w-5 text-[#0084ff] flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-[14px] font-bold text-white">💡 과제 상태 실시간 테스트 안내</h4>
                        <p className="text-[12.5px] text-[#8aa6cb] mt-1 leading-relaxed">
                            각 과제 카드의 상태 변경 드롭다운을 통해 상태를 실시간으로 조작해볼 수 있습니다. <br />
                            <strong>'미시작'</strong> 과제가 1건 이상일 때만 상단 헤더의 <strong>빨간 점(dot)</strong>과 홈 화면의 <strong>과제 출제 알림 배너</strong>가 즉시 갱신됩니다.
                        </p>
                    </div>
                </div>

                {/* Tasks Grid */}
                {scienceTasks.length === 0 ? (
                    <div className="bg-[#0b1424] border border-[#142338] rounded-3xl p-16 text-center shadow-xl">
                        <ClipboardList className="h-16 w-16 text-[#1c2e4a] mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-white">배정된 과제가 없습니다</h3>
                        <p className="text-sm text-[#5c7797] mt-1">깨끗하게 모든 과제를 마쳤거나 배정된 일감이 없습니다.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scienceTasks.map((task) => {
                            let statusColor = "text-[#0084ff] bg-[#0084ff]/10 border-[#0084ff]/20";
                            let statusIcon = <AlertCircle className="h-[14px] w-[14px]" />;
                            let statusText = "미시작";

                             if (task.status === "ongoing") {
                                statusColor = "text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/20";
                                statusIcon = <PlayCircle className="h-[14px] w-[14px]" />;
                                statusText = "진행중";
                            } else if (task.status === "submitted") {
                                statusColor = "text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20";
                                statusIcon = <CheckCircle2 className="h-[14px] w-[14px]" />;
                                statusText = "제출완료";
                            }

                            return (
                                <div key={task.id} className="bg-[#0b1424] border border-[#142338] hover:border-[#1e3456] rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between min-h-[160px]">
                                    <div>
                                        <div className="flex items-center justify-between mb-3.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-bold border ${statusColor}`}>
                                                {statusIcon}
                                                {statusText}
                                            </span>
                                            <span className="text-[11px] text-[#5c7797] font-medium font-mono">
                                                출제일: {new Date(task.assignedAt).toLocaleString("ko-KR")}
                                            </span>
                                        </div>
                                        <h3 className="text-[16px] font-bold text-white leading-snug break-keep tracking-tight">
                                            {task.title}
                                        </h3>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#121f33]">
                                        <span className="text-[12px] text-[#5c7797] font-semibold font-mono">ID: {task.id.toUpperCase()}</span>
                                        
                                        {/* Status Control */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-[#5c7797] font-bold">상태 변경:</span>
                                            <select 
                                                value={task.status} 
                                                onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
                                                className="bg-[#101e33] border border-[#233857] text-white text-[12px] font-bold px-2 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0084ff] cursor-pointer"
                                            >
                                                <option value="not_started">미시작</option>
                                                <option value="ongoing">진행중</option>
                                                <option value="submitted">제출완료</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
