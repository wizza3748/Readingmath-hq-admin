"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    X,
    ChevronDown,
    ChevronUp,
    Star,
    Zap,
    ChevronRight,
    Check,
    RotateCcw,
    AlertCircle
} from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    ACHIEVEMENT_THEME,
    ACHIEVEMENT_INFOS,
    AchievementColor
} from "../constants/achievementTheme";
import { getAchievementKey, getMockStatsByColor } from "../utils/achievementUtils";

// --- Types ---
interface TypeData {
    id: string;
    no: string;
    name: string;
    bucket: "basic" | "skill" | "advanced";
    bucketLabel: string;
    isImportant: boolean;
    textbookTag: string;
    achievementColor: AchievementColor;
    hasProgress: boolean;
    needsMockColor?: boolean;
}

interface MidUnit {
    id: string;
    name: string;
    types: TypeData[];
}

interface BigUnit {
    id: string;
    name: string;
    midUnits: MidUnit[];
}

// --- Utils (Replicated from ExamPrepPage to avoid modifying original files) ---
function parseRawNo(rawNo: string): string {
    return rawNo.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

function parseTextbookTag(rawNo: string): string {
    const match = rawNo.match(/\(([^)]+)\)/);
    if (!match) return "기타";
    const bracket = match[1].trim();
    if (bracket === "오+완") return "오투+완자";
    if (bracket === "오") return "오투";
    if (bracket === "완") return "완자";
    return "기타";
}

const IMPORTANT_TYPE_KEYS = new Set<string>([
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|basic|1",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|basic|2",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|basic|3",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|basic|6",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|3",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|4",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|5",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|6",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|10",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|13",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|14",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|15",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|advanced|2",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|advanced|4",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|advanced|6",
]);

const applyMockColors = (types: TypeData[], bucket: "basic" | "skill" | "advanced", isUnit4: boolean) => {
    const total = types.length;
    if (total === 0) return;

    for (let i = 0; i < total; i++) {
        const type = types[i];
        if (!type.needsMockColor) continue;

        const idNum = parseInt(type.no) || (i + 1);
        const seed = idNum * 17 + i * 13 + type.name.length * 7;
        const r = seed % 100;

        let solved = 3;
        let correct = 0;
        if (bucket === "basic") correct = 2 + (r % 2);
        else if (bucket === "skill") correct = 1 + (r % 3);
        else correct = r % 4;

        let color = getAchievementKey(solved, correct, bucket);
        if (bucket === "basic" && color === "red") color = "yellow";
        type.achievementColor = color;
    }
};

// --- Main Component ---
export default function CommonCurriculumLayerPage() {
    const [curriculum, setCurriculum] = useState<BigUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [openMidUnitId, setOpenMidUnitId] = useState<string | null>(null);

    // Load Data
    useEffect(() => {
        async function loadData() {
            try {
                const response = await fetch("/api/exam-prep-sheet");
                const arrayBuffer = await response.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: "array" });

                const newBigUnits: BigUnit[] = workbook.SheetNames.map((sheetName, sheetIdx) => {
                    const sheet = workbook.Sheets[sheetName];
                    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
                    let bigUnitName = sheetName;
                    if (data.length > 0 && data[0][0]) bigUnitName = data[0][0].toString().trim();

                    const midUnitsMap = new Map<string, TypeData[]>();
                    let currentMidUnit = "";

                    for (let i = 0; i < data.length; i++) {
                        const row = data[i];
                        if (!row || row.length === 0) continue;
                        const col0 = row[0]?.toString().trim();
                        if (col0 && col0.startsWith("중단원")) {
                            currentMidUnit = col0.replace(/^중단원\s*/, "");
                            if (!midUnitsMap.has(currentMidUnit)) midUnitsMap.set(currentMidUnit, []);
                            if (i + 1 < data.length && data[i + 1] && (data[i + 1][0]?.toString().trim() === "유형 번호" || data[i + 1][1]?.toString().trim() === "유형명")) i++;
                            continue;
                        }
                        if (!currentMidUnit) continue;

                        const buckets: ("basic" | "skill" | "advanced")[] = ["basic", "skill", "advanced"];
                        [0, 2, 4].forEach((colIdx, bIdx) => {
                            const rawNo = row[colIdx]?.toString().trim();
                            const name = row[colIdx + 1]?.toString().trim();
                            if (rawNo && name && !/^(유형\s*번호|유형명|기본|실력|심화)$/.test(rawNo)) {
                                const bucket = buckets[bIdx];
                                const no = parseRawNo(rawNo);
                                const textbookTag = parseTextbookTag(rawNo);
                                const isImportant = IMPORTANT_TYPE_KEYS.has(`${sheetName}|${currentMidUnit}|${bucket}|${no}`);
                                midUnitsMap.get(currentMidUnit)!.push({
                                    id: `${sheetName}:${currentMidUnit}:${bucket}:${no}`,
                                    no, name, bucket, bucketLabel: bucket === "basic" ? "기본" : bucket === "skill" ? "실력" : "심화",
                                    isImportant, textbookTag, achievementColor: "white", hasProgress: false, needsMockColor: true
                                });
                            }
                        });
                    }

                    const isUnit4 = sheetName.includes("4단원");
                    midUnitsMap.forEach((types) => {
                        applyMockColors(types.filter(t => t.bucket === "basic"), "basic", isUnit4);
                        applyMockColors(types.filter(t => t.bucket === "skill"), "skill", isUnit4);
                        applyMockColors(types.filter(t => t.bucket === "advanced"), "advanced", isUnit4);
                    });

                    return {
                        id: `bu-${sheetIdx}`,
                        name: bigUnitName,
                        midUnits: Array.from(midUnitsMap.entries()).map(([name, types], idx) => ({
                            id: `${sheetName}-m${idx}`, name, types
                        }))
                    };
                });
                setCurriculum(newBigUnits);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const toggleMidUnit = (id: string) => {
        setOpenMidUnitId(prev => (prev === id ? null : id));
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-[#1a1c2c] text-white/50">로딩 중...</div>;

    return (
        <div className="relative min-h-screen w-full flex overflow-hidden bg-[#0f111a] font-sans select-none">
            {/* 1. Hero Content Area (Left) */}
            <main className="relative flex-1 flex flex-col items-center justify-center">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <div
                        className="w-full h-full bg-cover bg-center opacity-60"
                        style={{ backgroundImage: `url('https://readingmath.co.kr/build/assets/science_bg_main_8-1-BTNaVv7h.svg')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f111a]/80" />
                </div>

                {/* Planet Illustration */}
                <div className="relative z-10 flex flex-col items-center animate-pulse-slow">
                    <div className="w-[320px] h-[320px] relative">
                         <img
                            src="https://readingmath.co.kr/build/assets/alien_8-1-C9kW02q9.svg"
                            alt="Planet Illustration"
                            className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                        />
                    </div>
                    
                    <div className="mt-8 text-center">
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">2학년 1학기</h2>
                        <div className="flex flex-col items-center gap-2">
                             <p className="text-indigo-300 font-bold text-lg">0% 진행했어요!</p>
                             <div className="w-64 h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                <div className="h-full w-[0%] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                             </div>
                        </div>
                    </div>
                </div>

                {/* Header Overlay (Tabs) */}
                <div className="absolute top-6 left-6 flex items-center gap-3 z-20">
                    <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-2xl">
                        <div className="text-white/40 px-5 py-1.5 text-xs font-black min-w-[90px] text-center">기본 모드</div>
                        <div className="bg-blue-500 text-white px-5 py-1.5 rounded-[9px] text-xs font-black shadow-lg shadow-blue-900/40 min-w-[90px] text-center">자유 모드</div>
                    </div>
                    <div className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-indigo-900/40 border border-white/10 flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 fill-current" />
                        시험 대비
                        <ChevronRight className="h-3 w-3 opacity-50" />
                    </div>
                </div>
            </main>

            {/* 2. Sidebar Layer (Right) */}
            <aside className="w-[480px] h-screen bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.3)] z-30 flex flex-col animate-in slide-in-from-right-full duration-500">
                {/* Sidebar Header */}
                <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">2학년 1학기</h1>
                    <Link href="/content/science-home">
                        <button className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                            <X className="h-6 w-6 text-slate-400" />
                        </button>
                    </Link>
                </div>

                {/* Sidebar Scroll Area */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                    {curriculum.map((bigUnit) => (
                        <div key={bigUnit.id} className="flex flex-col gap-3">
                             {/* Big Unit Header */}
                             <div className="flex items-center gap-2 mb-1">
                                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-100 uppercase tracking-widest">
                                    {bigUnit.name.split('-')[0]}
                                </span>
                                <span className="text-sm font-bold text-slate-400">
                                    {bigUnit.name.split('-')[1]}
                                </span>
                             </div>

                             {/* Mid Units List */}
                             <div className="flex flex-col gap-2">
                                {bigUnit.midUnits.map((midUnit) => {
                                    const isOpen = openMidUnitId === midUnit.id;
                                    return (
                                        <div key={midUnit.id} className={cn(
                                            "flex flex-col border rounded-2xl overflow-hidden transition-all duration-300",
                                            isOpen ? "border-indigo-200 bg-indigo-50/10 shadow-lg" : "border-slate-100 hover:border-slate-200"
                                        )}>
                                            {/* Mid Unit Trigger */}
                                            <div 
                                                onClick={() => toggleMidUnit(midUnit.id)}
                                                className="p-4 px-5 flex items-center justify-between cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <p className={cn("text-sm font-black transition-colors", isOpen ? "text-indigo-600" : "text-slate-700 group-hover:text-slate-900")}>
                                                        {midUnit.name}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3].map(i => <Star key={i} className="h-4 w-4 text-slate-200 fill-slate-200" />)}
                                                    </div>
                                                    <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-300", isOpen && "rotate-180 text-indigo-500")} />
                                                </div>
                                            </div>

                                            {/* Mid Unit Expanded Content */}
                                            {isOpen && (
                                                <div className="p-5 pt-0 flex flex-col gap-6 animate-in fade-in slide-in-from-top-2">
                                                    {/* Training Area (개념/유형/서술형) */}
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[
                                                            { label: '개념 훈련', round: 'ROUND1' },
                                                            { label: '유형 훈련', round: 'ROUND1' },
                                                            { label: '서술형 훈련', round: 'ROUND1' }
                                                        ].map((item, idx) => (
                                                            <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 py-6 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group/card active:scale-95 transition-transform">
                                                                <Star className="h-6 w-6 text-slate-200 fill-slate-200 group-hover/card:text-indigo-100 group-hover/card:fill-indigo-100 transition-colors" />
                                                                <div className="text-center">
                                                                    <p className="text-[11px] font-black text-slate-700">{item.label}</p>
                                                                    <p className="text-[10px] font-bold text-slate-300">{item.round}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Type Challenge Area (중단원 유형 보드) */}
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                                            <h3 className="text-sm font-black text-slate-800">유형도전</h3>
                                                        </div>
                                                        
                                                        {/* Type Board: Row Structure */}
                                                        <div className="flex flex-col gap-4">
                                                            {(['basic', 'skill', 'advanced'] as const).map(bucket => {
                                                                const types = midUnit.types.filter(t => t.bucket === bucket);
                                                                return (
                                                                    <div key={bucket} className="flex flex-col gap-2">
                                                                        <div className="flex items-center justify-between px-1">
                                                                            <span className="text-[11px] font-black text-slate-400">{bucket === 'basic' ? '기본' : bucket === 'skill' ? '실력' : '심화'}</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {types.map(type => (
                                                                                <TypeChip key={type.id} type={type} />
                                                                            ))}
                                                                            {types.length === 0 && <span className="text-[10px] text-slate-300 py-1">준비된 유형이 없습니다.</span>}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                             </div>
                        </div>
                    ))}
                </div>
            </aside>

            <style jsx global>{`
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.02); opacity: 0.95; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s ease-in-out infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}

function TypeChip({ type }: { type: TypeData }) {
    const theme = ACHIEVEMENT_THEME[type.achievementColor];
    
    // Clicking takes to study screen
    const handleClick = () => {
        window.location.href = `/content/exam-prep/study/${encodeURIComponent(type.id)}?mode=new&color=${type.achievementColor}&name=${encodeURIComponent(type.name)}`;
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "relative h-10 w-10 min-w-[40px] rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm",
                theme.bgClass,
                theme.key === "white" ? "border border-slate-100" : "border-transparent"
            )}
            title={type.name}
        >
            <span className={cn("text-xs font-black", theme.textClass)}>
                {type.no}
            </span>

            {type.isImportant && (
                <Star
                    className={cn(
                        "absolute top-0.5 left-0.5 w-2 h-2",
                        theme.key === "white" ? "text-slate-400 fill-slate-400" : "text-white fill-white"
                    )}
                />
            )}
        </div>
    );
}
