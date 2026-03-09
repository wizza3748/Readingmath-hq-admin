"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
    HelpCircle,
    Bell,
    Megaphone,
    Menu,
    ChevronRight,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ScienceHomePage() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#1a1c2c] font-sans select-none">
            {/* 1. Header Area (Tabs & Info & Exam Prep Button) */}
            <div className="absolute top-6 left-6 right-6 h-14 bg-black/40 backdrop-blur-md z-40 flex items-center justify-between px-6 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex items-center gap-6">
                    {/* Mode Tabs */}
                    <div className="flex bg-black/50 p-1.5 rounded-xl items-center border border-white/10">
                        <div className="bg-white text-slate-800 px-6 py-1.5 rounded-[10px] text-xs font-black shadow-sm flex items-center justify-center min-w-[100px]">
                            기본 모드
                        </div>
                        <div className="text-white/40 px-6 py-1.5 text-xs font-bold min-w-[100px] text-center cursor-not-allowed">
                            자유 모드
                        </div>
                    </div>

                    {/* [P0] 시험대비 진입 버튼 - 독립 레이어로 배치 (이미지 기반) */}
                    <Link href="/content/exam-prep">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-9 px-6 gap-2 font-black text-xs shadow-lg shadow-indigo-900/50 border border-white/20 transition-all active:scale-95 group">
                            <Zap className="h-3.5 w-3.5 fill-current" />
                            시험대비
                            <ChevronRight className="h-3.5 w-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                    </Link>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <div className="bg-white/10 px-4 py-1.5 rounded-full border border-white/10">
                        <span className="text-[11px] font-black text-white/80 tracking-tight">
                            중등 2학년 1학기 행성
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Hero Content Area */}
            <main className="relative h-screen w-full flex flex-col items-center justify-center">
                {/* Background Image (SVG from URL) */}
                <div className="absolute inset-0 z-0">
                    <div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url('https://readingmath.co.kr/build/assets/science_bg_main_8-1-BTNaVv7h.svg')` }}
                    />
                    {/* Depth Overlay */}
                    <div className="absolute inset-0 bg-black/10" />
                </div>

                {/* Speech Bubble */}
                <div className="relative z-10 mb-6 animate-bounce-slow">
                    <div className="bg-white rounded-2xl p-6 px-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] border border-slate-100 relative max-w-[420px]">
                        <p className="text-sm font-black text-slate-800 leading-relaxed text-center break-keep">
                            (1) 순물질과 혼합물, 녹는점과 어는점, 끓는점의 <br />
                            <span className="text-indigo-600">개념훈련</span>을 시작해 보세요!
                        </p>
                        {/* Triangle Tip */}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-white" />
                    </div>
                </div>

                {/* Character (SVG from URL) */}
                <div className="relative z-10 w-[240px] h-[240px] transform hover:scale-105 transition-transform duration-500 cursor-pointer">
                    <img
                        src="https://readingmath.co.kr/build/assets/alien_8-1-C9kW02q9.svg"
                        alt="Character"
                        className="w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.3)]"
                    />
                </div>
            </main>

            <style jsx global>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
