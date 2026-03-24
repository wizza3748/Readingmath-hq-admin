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
    AlertCircle,
    Info,
    Menu,
    ArrowLeft,
    ArrowRight,
    Zap as ZapIcon
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
    const [activeTraining, setActiveTraining] = useState<'concept' | 'type' | 'descriptive' | null>(null);
    const [showDescription, setShowDescription] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedMidUnit, setSelectedMidUnit] = useState<{bigUnitName: string, midUnitName: string, midUnitId: string} | null>(null);

    // --- Training Descriptions ---
    const TRAINING_DESCRIPTIONS = {
        concept: "개념 훈련은 중단원유형의 개념을 이해하기 위한 첫 번째 훈련입니다. 지문을 읽고 핵심 개념을 정리한 뒤, 개념 요약하기& 개념 체크 문제로 이해도를 확인합니다. 마지막으로 개념 확인 문제(10문항 고정)를 풀이하면 종료됩니다.",
        type: "유형 훈련은 다양한 유형의 문제를 풀며 학습한 개념을 문제에 적용해보는 훈련입니다. 각각 5문제씩 총 4회차의 문제를 모두 해결하면 유형 훈련이 종료됩니다. [1차 유형 문제]와 [1차 유사 문제], [2차 유형 문제]와 [2차 유사 문제]는 비슷한 유형의 문제가 출제되고 모든 문제를 풀이한 시간이 30분이 초과되면 최종 훈련 결과에서 10점이 감점됩니다.",
        descriptive: "서술형 훈련은 탐구 보고서 작성 능력을 기르는 마지막 훈련입니다. 답안 완성(2문항) -> 문제& 답안 완성(2문항) -> 탐구활동 보고서 만들기(1문항) 총 5문항을 풀이하면 종료됩니다. 풀이 시간이 30분을 초과하면 최종 훈련 결과에서 10점이 감점됩니다."
    };

    const handleTrainingStart = (bigUnitName: string, midUnitName: string, midUnitId: string, type: 'concept' | 'type' | 'descriptive') => {
        setSelectedMidUnit({ bigUnitName, midUnitName, midUnitId });
        setActiveTraining(type);
    };

    const handleNextTraining = () => {
        if (activeTraining === 'concept') setActiveTraining('type');
        else if (activeTraining === 'type') setActiveTraining('descriptive');
        else setActiveTraining(null);
    };

    const renderTrainingHeader = (type: 'concept' | 'type' | 'descriptive') => (
        <div className="w-full flex items-center justify-between p-6 bg-white/5 border-b border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <div 
                    className="p-3 bg-white/10 rounded-xl cursor-pointer hover:bg-white/20 transition-colors"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <Menu className="h-5 w-5 text-white" />
                </div>
                <div>
                     <p className="text-white/50 text-xs font-bold leading-tight">{selectedMidUnit?.bigUnitName}</p>
                     <p className="text-white font-black text-lg">{selectedMidUnit?.midUnitName}</p>
                </div>
            </div>
            <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <span className="text-white font-black text-sm">
                        {type === 'concept' ? '개념 훈련' : type === 'type' ? '유형 훈련' : '서술형 훈련'}
                    </span>
                    <Info 
                        className="h-4 w-4 text-white/50 cursor-pointer hover:text-white transition-colors" 
                        onClick={() => setShowDescription(!showDescription)}
                    />
                 </div>
                 <div className="flex gap-2">
                    <div className={cn("h-3 w-3 rounded-full", type === 'concept' ? "bg-white" : "bg-white/20")} />
                    <div className={cn("h-3 w-3 rounded-full", type === 'type' ? "bg-white" : "bg-white/20")} />
                    <div className={cn("h-3 w-3 rounded-full", type === 'descriptive' ? "bg-white" : "bg-white/20")} />
                 </div>
            </div>
        </div>
    );

    const renderTrainingContent = () => {
        if (!activeTraining) return null;
        return (
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {renderTrainingHeader(activeTraining)}
                
                <div className="flex-1 p-12 flex flex-col gap-12 relative overflow-y-auto">
                    {/* ROUND 1 Section */}
                    <div className="flex items-center gap-8 animate-in fade-in slide-in-from-left-4 duration-500">
                        <span className="text-white/40 font-black text-lg tracking-widest">ROUND 1</span>
                        <div className="flex flex-wrap gap-4 flex-1">
                            {activeTraining === 'concept' && (
                                <>
                                    <div className="flex flex-col gap-2 flex-1 min-w-[300px]">
                                        <p className="text-white/40 text-xs font-bold text-center">개념 학습</p>
                                        <Button className="h-14 bg-blue-500 hover:bg-blue-600 text-white font-black text-lg rounded-xl shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all active:scale-95">학습하기</Button>
                                    </div>
                                    <div className="flex flex-col gap-2 flex-1 min-w-[300px]">
                                        <p className="text-white/40 text-xs font-bold text-center">개념 확인하기</p>
                                        <Button className="h-14 bg-blue-500 hover:bg-blue-600 text-white font-black text-lg rounded-xl shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all active:scale-95">학습하기</Button>
                                    </div>
                                </>
                            )}
                            {activeTraining === 'type' && (
                                <>
                                    {['1차 유형 문제', '1차 유사 문제', '2차 유형 문제', '2차 유사 문제'].map((label, idx) => (
                                        <div key={idx} className="flex flex-col gap-2 flex-1 min-w-[200px]">
                                            <p className="text-white/40 text-xs font-bold text-center">{label}</p>
                                            <Button className="h-14 bg-blue-500 hover:bg-blue-600 text-white font-black text-lg rounded-xl shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all active:scale-95">학습하기</Button>
                                        </div>
                                    ))}
                                </>
                            )}
                            {activeTraining === 'descriptive' && (
                                <>
                                    {['1단계 문장 완성하기', '2단계 답안 완성하기', '3단계 탐구활동 보고서 만들기'].map((label, idx) => (
                                        <div key={idx} className="flex flex-col gap-2 flex-1 min-w-[240px]">
                                            <p className="text-white/40 text-xs font-bold text-center">{label}</p>
                                            <Button className="h-14 bg-blue-500 hover:bg-blue-600 text-white font-black text-lg rounded-xl shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all active:scale-95">학습하기</Button>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                            <span className="text-white/20 font-black text-2xl">?</span>
                        </div>
                    </div>

                    {/* Next Button (Fixed Bottom Right of content area) */}
                    <div className="absolute bottom-8 right-8">
                        <Button 
                            className="bg-white/10 hover:bg-white/20 text-white/50 hover:text-white px-6 h-12 rounded-xl text-sm font-black flex items-center gap-2 border border-white/5 transition-all"
                            onClick={handleNextTraining}
                        >
                            {activeTraining === 'concept' ? '유형 훈련' : activeTraining === 'type' ? '서술형 훈련' : '종료'}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Description Box (Absolute within content) */}
                    {showDescription && (
                        <div className="absolute top-2 right-2 w-[400px] bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                             <div className="flex items-center justify-between mb-4">
                                <h4 className="text-white font-black text-lg">훈련 설명</h4>
                                <X className="h-5 w-5 text-white/30 cursor-pointer hover:text-white" onClick={() => setShowDescription(false)} />
                             </div>
                             <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line font-medium">
                                {TRAINING_DESCRIPTIONS[activeTraining]}
                             </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

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

    const navigateToExamPrep = (midUnitId: string) => {
        window.location.href = `/content/exam-prep?from=solveMore&midUnitId=${encodeURIComponent(midUnitId)}`;
    };

    const isTrainingActive = activeTraining !== null;

    if (loading) return <div className="flex h-screen items-center justify-center bg-[#1a1c2c] text-white/50">로딩 중...</div>;

    return (
        <div className="relative h-screen w-full flex overflow-hidden bg-[#0f111a] font-sans select-none">
            {/* 1. Main Content Area (Left) */}
            <main className={cn(
                "relative flex-1 flex flex-col transition-all duration-500",
                isTrainingActive ? "bg-[#0b0d14]" : "items-center justify-center"
            )}>
                {isTrainingActive ? (
                    renderTrainingContent()
                ) : (
                    <>
                        {/* Hero Overlay (Tabs) */}
                        <div className="absolute top-6 left-6 flex items-center gap-3 z-20">
                            <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-2xl">
                                <div 
                                    className="text-white/40 hover:text-white px-5 py-1.5 text-xs font-black min-w-[90px] text-center cursor-pointer transition-colors"
                                    onClick={() => window.location.href = '/content/exam-prep'}
                                >
                                    기본 모드
                                </div>
                                <div 
                                    className="text-white/40 hover:text-white px-5 py-1.5 text-xs font-black min-w-[90px] text-center cursor-pointer transition-colors"
                                    onClick={() => window.location.href = '/content/exam-prep/common-curriculum'}
                                >
                                    자유 모드
                                </div>
                            </div>
                            <div className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-indigo-900/40 border border-white/10 flex items-center gap-2">
                                <ZapIcon className="h-3.5 w-3.5 fill-current" />
                                시험 대비
                                <ChevronRight className="h-3 w-3 opacity-50" />
                            </div>
                        </div>

                        {/* Hero Background & Illustration */}
                        <div className="absolute inset-0 z-0 pointer-events-none">
                            <div
                                className="w-full h-full bg-cover bg-center opacity-60"
                                style={{ backgroundImage: `url('https://readingmath.co.kr/build/assets/science_bg_main_8-1-BTNaVv7h.svg')` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f111a]/80" />
                        </div>

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
                    </>
                )}
            </main>

            {/* Dim Overlay (Only for non-training view when sidebar is open) */}
            {!isTrainingActive && isSidebarOpen && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 transition-all duration-300 pointer-events-none" />
            )}

            {/* 2. Sidebar Layer (Right) */}
            <aside className={cn(
                "h-screen bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.3)] z-30 flex flex-col transition-all duration-500 ease-in-out border-l border-slate-100",
                isTrainingActive ? "w-[640px]" : "w-[480px]",
                isSidebarOpen ? "translate-x-0" : "translate-x-full fixed right-0"
            )}>
                {/* Sidebar Header */}
                <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">2학년 1학기</h1>
                    <button 
                        onClick={() => {
                            if (isTrainingActive) setIsSidebarOpen(false);
                            else window.location.href = '/content/science-home';
                        }}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <X className="h-6 w-6 text-slate-400" />
                    </button>
                </div>

                {/* Sidebar Scroll Area */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                    {curriculum.map((bigUnit) => (
                        <div key={bigUnit.id} className="flex flex-col gap-3">
                             <div className="flex items-center gap-2 mb-1">
                                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-100 uppercase tracking-widest">
                                    {bigUnit.name.split('-')[0]}
                                </span>
                                <span className="text-sm font-bold text-slate-400">
                                    {bigUnit.name.split('-')[1]}
                                </span>
                             </div>

                             <div className="flex flex-col gap-2">
                                {bigUnit.midUnits.map((midUnit) => {
                                    const isOpen = openMidUnitId === midUnit.id;
                                    return (
                                        <div key={midUnit.id} className={cn(
                                            "flex flex-col border rounded-2xl overflow-hidden transition-all duration-300",
                                            isOpen ? "border-indigo-200 bg-indigo-50/10 shadow-lg" : "border-slate-100 hover:border-slate-200"
                                        )}>
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

                                            {isOpen && (
                                                <div className="p-5 pt-0 flex flex-col gap-6 animate-in fade-in slide-in-from-top-2">
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[
                                                            { label: '개념 훈련', round: 'ROUND1', type: 'concept' as const },
                                                            { label: '유형 훈련', round: 'ROUND1', type: 'type' as const },
                                                            { label: '서술형 훈련', round: 'ROUND1', type: 'descriptive' as const }
                                                        ].map((item, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className="bg-white border border-slate-100 rounded-xl p-4 py-6 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group/card active:scale-95 transition-transform"
                                                                onClick={() => handleTrainingStart(bigUnit.name, midUnit.name, midUnit.id, item.type)}
                                                            >
                                                                <Star className="h-6 w-6 text-slate-200 fill-slate-200 group-hover/card:text-indigo-100 group-hover/card:fill-indigo-100 transition-colors" />
                                                                <div className="text-center">
                                                                    <p className="text-[11px] font-black text-slate-700">{item.label}</p>
                                                                    <p className="text-[10px] font-bold text-slate-300">{item.round}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div 
                                                        className="group/type-bank flex items-center justify-between bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl p-4 px-5 transition-all cursor-pointer active:scale-[0.98] border border-transparent hover:border-slate-200 shadow-sm hover:shadow-md"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigateToExamPrep(midUnit.id);
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                                            <h3 className="text-sm font-black text-slate-800">유형도전</h3>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 opacity-90 group-hover/type-bank:opacity-100 transition-opacity">
                                                            {[
                                                                { color: 'white' as AchievementColor, label: '미진행' },
                                                                { color: 'gray' as AchievementColor, label: '미판정' },
                                                                { color: 'red' as AchievementColor, label: '재학습 필요' },
                                                                { color: 'yellow' as AchievementColor, label: '보충 필요' },
                                                                { color: 'lime' as AchievementColor, label: '유형 이해' },
                                                                { color: 'green' as AchievementColor, label: '유형 완전 이해' },
                                                            ].map((item, idx) => {
                                                                const theme = ACHIEVEMENT_THEME[item.color];
                                                                return (
                                                                     <div
                                                                        key={idx}
                                                                        className={cn(
                                                                            "h-7 w-7 rounded-lg flex items-center justify-center shadow-sm",
                                                                            theme.bgClass,
                                                                            theme.key === "white" ? "border border-slate-200" : "border-transparent"
                                                                        )}
                                                                        title={item.label}
                                                                    />
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

                {/* Sidebar Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <Button 
                        onClick={() => window.location.href = '/content/science-home'}
                        className="w-full h-14 bg-[#1e222e] hover:bg-[#2a2f3e] text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
                    >
                        <ZapIcon className="h-5 w-5 text-indigo-400" />
                        행성 메인으로
                    </Button>
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
