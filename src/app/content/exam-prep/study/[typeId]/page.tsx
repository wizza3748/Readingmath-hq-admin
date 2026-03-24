"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
    ChevronLeft,
    X,
    Check,
    AlertCircle,
    ChevronRight,
    Play,
    RotateCcw,
    Home,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    AchievementColor,
    ACHIEVEMENT_THEME
} from "../../constants/achievementTheme";
import { getAchievementKey } from "../../utils/achievementUtils";

// --- CMS 기반 문제 데이터 (3문항 고정) ---
const FIXED_QUESTIONS = [
    {
        id: "q1",
        question: "순물질과 혼합물에 대한 설명으로 옳은 것은?",
        subQuestion: "",
        options: [
            "① 순물질은 한 가지 물질로 이루어져 있으며, 끓는점과 녹는점이 일정하다.",
            "② 혼합물은 성분 물질의 고유한 성질을 잃고 새로운 성질을 나타낸다.",
            "③ 공기는 여러 가지 기체가 섞여 있지만, 끓는점과 녹는점이 일정하므로 순물질이다.",
            "④ 물은 수소와 산소라는 두 가지 원소로 이루어져 있으므로 혼합물이다.",
            "⑤ 설탕물은 혼합물이지만, 성분 물질의 혼합 비율에 관계없이 밀도가 일정하다."
        ],
        answer: 0, // 1번
        explanation: "순물질은 한 가지 물질로 이루어져 있으며 고유한 끓는점, 녹는점, 밀도 등의 특성을 가집니다. 혼합물은 성분 물질의 고유한 성질을 그대로 지니고, 끓는점, 녹는점, 밀도 등이 일정하지 않습니다. 공기와 설탕물은 혼합물이고, 물은 화합물로 순물질입니다."
    },
    {
        id: "q2",
        question: "순물질과 혼합물의 특성을 비교하여 설명한 내용으로 옳지 않은 것은?",
        subQuestion: "",
        options: [
            "① 순물질은 물질의 종류가 같으면 양에 관계없이 끓는점이 일정하다.",
            "② 순물질은 녹는점과 어는점이 같다.",
            "③ 순물질은 상태 변화 시 온도가 일정하게 유지된다.",
            "④ 혼합물은 성분 물질의 고유한 성질을 잃고 새로운 성질을 나타낸다.",
            "⑤ 혼합물은 성분 물질의 혼합 비율에 따라 녹는점, 끓는점 등이 달라진다."
        ],
        answer: 3, // 4번
        explanation: "혼합물은 성분 물질이 섞여 있는 것이므로, 성분 물질들의 고유한 성질은 그대로 지닙니다."
    },
    {
        id: "q3",
        question: "다음 중 해당과 같이 녹는점 내림 현상을 이용한 예를 모두 고른 것은?",
        subQuestion: "ㄱ. 겨울철 김치를 담글 때 소금을 사용한다.\nㄴ. 전류가 너무 많이 흐를 때 스스로 녹아서 회로를 차단하는 퓨즈를 만든다.\nㄷ. 겨울에 수도관이 얼지 않도록 부동액을 넣는다.",
        options: [
            "① ㄱ",
            "② ㄴ",
            "③ ㄷ",
            "④ ㄱ, ㄴ",
            "⑤ ㄴ, ㄷ"
        ],
        answer: 4, // 5번
        explanation: "소화전의 안전장치에 사용하는 합금은 녹는점이 매우 낮은 합금(혼합물)으로, 화재 시 쉽게 녹아 물이 분사되도록 만든다. 이는 혼합물의 녹는점 내림 현상을 이용한 예이다. 김장 시 소금은 삼투압을 이용해 수분을 제거하는 것이 주된 목적이고, 부동액은 물의 어는점 내림을 이용한 예이므로 녹는점 내림 현상과 관련이 없습니다."
    }
];


function StudyPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const typeId = decodeURIComponent(params.typeId as string);
    const mode = searchParams.get("mode");
    const color = searchParams.get("color");
    const typeName = searchParams.get("name");
    const typeNo = typeId.split(":").pop();

    // --- State ---
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [gradedResults, setGradedResults] = useState<(boolean | null)[]>([null, null, null]);
    const [showResultScreen, setShowResultScreen] = useState(false); // 결과 화면 표시 여부 제어
    const [nextTypeId, setNextTypeId] = useState<string | null>(null);
    const [nextTypeName, setNextTypeName] = useState<string | null>(null);
    const [isLoadingNext, setIsLoadingNext] = useState(false);
    const [recoveredTypeName, setRecoveredTypeName] = useState<string | null>(null);

    // 실제 표시할 유형명 (URL 파라미터 우선, 없으면 복구된 이름)
    const displayTypeName = typeName || recoveredTypeName;

    // [다음 유형 찾기] 로직
    useEffect(() => {
        if (!isSubmitted || !showResultScreen) return;

        async function fetchNextType() {
            setIsLoadingNext(true);
            try {
                const response = await fetch("/api/exam-prep-sheet");
                if (!response.ok) return;
                const arrayBuffer = await response.arrayBuffer();
                const XLSX = await import("xlsx");
                const workbook = XLSX.read(arrayBuffer, { type: "array" });

                const parts = typeId.split(":");
                if (parts.length < 4) return;

                const targetBucket = parts[parts.length - 2];
                const targetSheet = parts[0];
                const targetMidUnit = parts.slice(1, parts.length - 2).join(":");

                const sheet = workbook.Sheets[targetSheet];
                if (!sheet) return;

                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                let currentMidUnit = "";
                const typesByBucket: Record<string, { id: string; name: string }[]> = { basic: [], skill: [], advanced: [] };

                for (let i = 1; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length === 0) continue;

                    const col0 = row[0]?.toString().trim();
                    if (col0 && col0.startsWith("중단원")) {
                        currentMidUnit = col0.replace(/^중단원\s*/, "");
                        if (i + 1 < data.length && data[i + 1][0] === "유형 번호") {
                            i++;
                        }
                        continue;
                    }

                    if (currentMidUnit !== targetMidUnit) continue;

                    const basicNo = row[0]?.toString().trim();
                    const basicName = row[1]?.toString().trim() || "유형";
                    if (basicNo) typesByBucket.basic.push({ id: `${targetSheet}:${targetMidUnit}:basic:${basicNo}`, name: basicName });

                    const skillNo = row[2]?.toString().trim();
                    const skillName = row[3]?.toString().trim() || "유형";
                    if (skillNo) typesByBucket.skill.push({ id: `${targetSheet}:${targetMidUnit}:skill:${skillNo}`, name: skillName });

                    const advNo = row[4]?.toString().trim();
                    const advName = row[5]?.toString().trim() || "유형";
                    if (advNo) typesByBucket.advanced.push({ id: `${targetSheet}:${targetMidUnit}:advanced:${advNo}`, name: advName });
                }

                const bucketOrder = ["basic", "skill", "advanced"];
                const currentBucket = targetBucket as "basic" | "skill" | "advanced";

                const listInBucket = typesByBucket[currentBucket] || [];
                const currentIndex = listInBucket.findIndex(t => t.id === typeId);

                if (currentIndex !== -1 && currentIndex + 1 < listInBucket.length) {
                    setNextTypeId(listInBucket[currentIndex + 1].id);
                    setNextTypeName(listInBucket[currentIndex + 1].name);
                } else {
                    const bucketIdx = bucketOrder.indexOf(currentBucket);
                    let found = false;
                    for (let j = bucketIdx + 1; j < bucketOrder.length; j++) {
                        const nextBucketList = typesByBucket[bucketOrder[j]];
                        if (nextBucketList && nextBucketList.length > 0) {
                            setNextTypeId(nextBucketList[0].id);
                            setNextTypeName(nextBucketList[0].name);
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        setNextTypeId(null);
                        setNextTypeName(null);
                    }
                }
            } catch (e) {
                console.error("Failed to load next type", e);
            } finally {
                setIsLoadingNext(false);
            }
        }

        fetchNextType();
    }, [isSubmitted, showResultScreen, typeId]);

    // [P0] Safeguard: URL 파라미터에 이름이 없는 경우 현재 typeId로 이름 복구
    useEffect(() => {
        if (typeName) return;

        async function recoverCurrentTypeName() {
            try {
                const response = await fetch("/api/exam-prep-sheet");
                if (!response.ok) return;
                const arrayBuffer = await response.arrayBuffer();
                const XLSX = await import("xlsx");
                const workbook = XLSX.read(arrayBuffer, { type: "array" });

                const parts = typeId.split(":");
                if (parts.length < 4) return;
                const targetSheet = parts[0];
                const targetMidUnit = parts.slice(1, parts.length - 2).join(":");
                const targetBucket = parts[parts.length - 2];
                const targetNo = parts[parts.length - 1];

                const sheet = workbook.Sheets[targetSheet];
                if (!sheet) return;
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                let currentMidUnit = "";
                for (let i = 1; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length === 0) continue;
                    const col0 = row[0]?.toString().trim();
                    if (col0 && col0.startsWith("중단원")) {
                        currentMidUnit = col0.replace(/^중단원\s*/, "");
                        continue;
                    }
                    if (currentMidUnit !== targetMidUnit) continue;

                    if (targetBucket === "basic" && row[0]?.toString().trim() === targetNo) {
                        setRecoveredTypeName(row[1]?.toString() || null);
                        break;
                    }
                    if (targetBucket === "skill" && row[2]?.toString().trim() === targetNo) {
                        setRecoveredTypeName(row[3]?.toString() || null);
                        break;
                    }
                    if (targetBucket === "advanced" && row[4]?.toString().trim() === targetNo) {
                        setRecoveredTypeName(row[5]?.toString() || null);
                        break;
                    }
                }
            } catch (e) {
                console.error("Failed to recover type name", e);
            }
        }
        recoverCurrentTypeName();
    }, [typeName, typeId]);

    // --- Load Data ---
    useEffect(() => {
        // P0-수정: 흰색 유형칩(미학습)인 경우 로컬 스토리지 무시하고 항상 새로 시작
        if (color === "white") {
            setAnswers([null, null, null]);
            setIsSubmitted(false);
            setGradedResults([null, null, null]);
            setShowResultScreen(false);
            setCurrentIndex(0);
            return;
        }

        const saved = localStorage.getItem(`examPrep:${typeId}`);
        // "resume" 모드일 때만 이어서 풀기 적용. 단, 모드가 없어도 완료 시엔 결과로.
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const loadedAnswers = parsed.answers || [null, null, null];
                const loadedGraded = parsed.gradedResults || [null, null, null];
                const submitted = parsed.completed || false;

                setAnswers(loadedAnswers);
                setIsSubmitted(submitted);
                setGradedResults(loadedGraded);

                if (submitted) {
                    if (mode === "resume") {
                        // 완료 상태 "이어서 풀기" 진입 시 - 결과 화면 생략 및 1번 진입 (해설보기 상태)
                        setShowResultScreen(false);
                        setCurrentIndex(0);
                    } else {
                        // 그 외 정상 완료 후 리로드 등은 결과 노출
                        setShowResultScreen(true);
                    }
                } else {
                    setCurrentIndex(0);
                }
            } catch (e) {
                console.error("Storage parse error", e);
            }
        }
    }, [typeId, mode, color]);

    // --- Logic ---
    const currentQuestion = FIXED_QUESTIONS[currentIndex];
    const userChoice = answers[currentIndex];

    // 제출 이후에만 채점 및 완료 아이템으로 표시됨
    const isCompletedItem = isSubmitted;
    const isCorrect = isSubmitted ? gradedResults[currentIndex] === true : false;
    const isAllAnswered = answers.every(a => a !== null);

    const handleBack = () => {
        router.push("/content/exam-prep");
    };

    const updateStorage = (newAnswers: (number | null)[], newResults: (boolean | null)[], done: boolean) => {
        const storageData = {
            typeId, // 검수용
            answers: newAnswers,
            gradedResults: newResults,
            completed: done
        };
        localStorage.setItem(`examPrep:${typeId}`, JSON.stringify(storageData));
    };

    const handleSelect = (idx: number) => {
        if (isCompletedItem) return; // 제출 완료 후 수정 불가
        const next = [...answers];
        next[currentIndex] = idx;
        setAnswers(next);
        // 채점 없이 답안만 로컬 저장
        updateStorage(next, gradedResults, false);
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };

    const handleNextItem = () => {
        if (currentIndex < 2) setCurrentIndex(currentIndex + 1);
    };

    const handleSubmit = () => {
        if (!isAllAnswered || isCompletedItem) return;

        // 전체 문항 일괄 채점
        const nextResults = FIXED_QUESTIONS.map((q, i) => answers[i] === q.answer);
        
        setGradedResults(nextResults);
        setIsSubmitted(true);
        setShowResultScreen(true); // 채점 완료 시 자동 결과 화면 진입

        // 변경된 일괄 채점 상태 및 제출 완료 기록
        updateStorage(answers, nextResults, true);
    };

    const finalAchievement = useMemo(() => {
        const solvedCount = gradedResults.filter(r => r !== null).length;
        const correctCount = gradedResults.filter(r => r === true).length;

        const bucket = typeId.split(":")[2] || "";
        const achKey = getAchievementKey(solvedCount, correctCount, bucket);

        return ACHIEVEMENT_THEME[achKey];
    }, [gradedResults, typeId]);

    const accuracy = useMemo(() => {
        const solvedCount = gradedResults.filter(r => r !== null).length;
        const correctCount = gradedResults.filter(r => r === true).length;
        return solvedCount > 0 ? Math.round((correctCount / solvedCount) * 100) : 0;
    }, [gradedResults]);

    if (isSubmitted && showResultScreen) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center">
                {/* 결과 헤더 */}
                <div className="w-full h-14 bg-white border-b flex items-center px-6 justify-between sticky top-0 z-10">
                    <span className="font-bold text-lg text-gray-900 leading-none">{displayTypeName || "유형 학습 완료"}</span>
                    <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="w-full max-w-2xl mt-12 px-4 pb-20">
                    <div className="bg-white rounded-2xl shadow-sm border p-10 text-center flex flex-col items-center">
                        {/* 성취도 유형칩 시각화: 이미지 2번 스타일 (솔리드 컬러 + 흰색 텍스트) */}
                        <div className={cn(
                            "w-20 h-13 rounded-xl flex items-center justify-center mb-6 shadow-md font-black text-xl border-none",
                            finalAchievement.bgClass,
                            finalAchievement.textClass,
                            finalAchievement.key === "white" && "border border-slate-200"
                        )}>
                            {typeNo}
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{finalAchievement.label}</h2>
                        <p className="text-gray-500 mb-8">{finalAchievement.description}</p>

                        <div className="w-full grid grid-cols-3 divide-x border-y py-6 mb-10">
                            <div>
                                <div className="text-sm text-gray-400 mb-1">성취도</div>
                                <div
                                    className="text-xl font-bold"
                                    style={{ color: finalAchievement.colorHex }}
                                >
                                    {accuracy}%
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-400 mb-1">맞힌 문제</div>
                                <div className="text-xl font-bold">{gradedResults.filter(r => r === true).length} / 3</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-400 mb-1">소요 시간</div>
                                <div className="text-xl font-bold">01:45</div>
                            </div>
                        </div>

                        {/* 정오답 리스트 */}
                        <div className="w-full flex justify-center gap-4 mb-10">
                            {gradedResults.map((res, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold border",
                                        res === true ? "border-green-500 bg-green-50 text-green-600" : "border-red-500 bg-red-50 text-red-600"
                                    )}>
                                        {res === true ? "O" : "X"}
                                    </div>
                                    <span className="text-xs text-gray-400">{i + 1}번</span>
                                </div>
                            ))}
                        </div>

                        <div className="w-full grid gap-3 grid-cols-2">
                            <Button variant="outline" size="lg" className="h-14 font-bold border-gray-300" onClick={() => {
                                setShowResultScreen(false); // 채점 결과 상태의 문제 화면으로 이동
                            }}>
                                <Info className="w-5 h-5 mr-2" />
                                해설보기
                            </Button>
                            <Button variant="outline" size="lg" className="h-14 font-bold border-gray-300" onClick={() => {
                                localStorage.removeItem(`examPrep:${typeId}`);
                                window.location.href = `/content/exam-prep/study/${encodeURIComponent(typeId)}?mode=new&color=white&name=${encodeURIComponent(displayTypeName || "")}`;
                            }}>
                                <RotateCcw className="w-5 h-5 mr-2" />
                                다시 문제풀기
                            </Button>
                        </div>
                        <div className="w-full grid gap-3 mt-3 grid-cols-2">
                            <Button variant="ghost" className="h-14 font-medium bg-gray-100/50 hover:bg-gray-100 text-gray-700" onClick={handleBack}>
                                <Home className="w-4 h-4 mr-2" />
                                시험대비 홈으로
                            </Button>
                            {isLoadingNext ? (
                                <Button size="lg" className="h-14 font-bold bg-gray-200 text-gray-500 pointer-events-none shadow-inner" disabled>
                                    다음 유형 조회 중...
                                </Button>
                            ) : nextTypeId ? (
                                <Button size="lg" className="h-14 font-bold bg-primary hover:bg-primary/90" onClick={() => {
                                    window.location.href = `/content/exam-prep/study/${encodeURIComponent(nextTypeId)}?mode=new&name=${encodeURIComponent(nextTypeName || "")}`;
                                }}>
                                    다음 유형 풀기
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            ) : <div />}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex">
            {/* 좌측 메인 영역 */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* 헤더 네비게이션 */}
                <div className="h-16 border-b flex items-center px-6 bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <ChevronLeft className="w-6 h-6 text-gray-600" />
                        </button>
                        <span className="font-bold text-lg text-gray-900 leading-none">{displayTypeName || "유형 문제 풀이"}</span>
                    </div>
                </div>

                {/* 문항 탭 영역 */}
                <div className="bg-white border-b px-6 flex items-end gap-1 shrink-0 pt-3 shadow-sm z-10 relative">
                    {FIXED_QUESTIONS.map((_, i) => {
                        const isDone = isSubmitted;
                        const isAnswered = answers[i] !== null;
                        const isCurrent = i === currentIndex;
                        
                        let tabClass = "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50";
                        if (isCurrent) {
                            tabClass = "text-primary border-primary font-bold bg-indigo-50/40";
                        } else if (isDone) {
                            tabClass = "text-gray-700 border-transparent hover:bg-gray-50";
                        } else if (isAnswered) {
                            tabClass = "text-indigo-600 border-transparent font-medium bg-indigo-50/20 hover:bg-indigo-50/40";
                        }

                        return (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={cn(
                                    "px-6 py-3 min-w-[130px] text-[15px] border-b-2 transition-all rounded-t-xl flex items-center justify-center gap-2 outline-none",
                                    tabClass
                                )}
                            >
                                <span>문제 {i + 1}</span>
                                {isDone ? (
                                    gradedResults[i] ? (
                                        <span className="text-emerald-500 font-bold ml-1">O</span>
                                    ) : (
                                        <span className="text-rose-500 font-bold ml-1">X</span>
                                    )
                                ) : isAnswered && !isCurrent ? (
                                    <span className="text-[11px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold tracking-tight">저장됨</span>
                                ) : !isAnswered && !isCurrent ? (
                                    <span className="text-[11px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium tracking-tight">미입력</span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>

                {/* 문제 영역 */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#f4f6f8] selection:bg-primary/10">
                    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-12">

                        {/* 1. 문제+보기+선지 카드 컨테이너 */}
                        <div className="bg-white rounded-[24px] shadow-sm border border-gray-200/80 p-6 md:p-10">
                            <div className="flex gap-4 md:gap-5">
                                {/* 문제 번호 */}
                                <div className="text-[26px] font-black text-primary/80 min-w-[36px] mt-0.5 tracking-tighter shrink-0">
                                    {String(currentIndex + 1).padStart(2, "0")}
                                </div>

                                {/* 텍스트 및 선지 영역 */}
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-[19px] md:text-[21px] font-bold leading-[1.6] mb-8 text-gray-900 whitespace-pre-wrap break-keep">
                                        {currentQuestion.question}
                                    </h1>

                                    {currentQuestion.subQuestion && (
                                        <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-6 md:p-8 mb-10 whitespace-pre-wrap leading-[1.7] text-gray-700 text-[15px] md:text-[16px] shadow-sm">
                                            {currentQuestion.subQuestion}
                                        </div>
                                    )}

                                    {/* 선택지 목록 (카드행 단위) */}
                                    <div className="space-y-3.5">
                                        {currentQuestion.options.map((option, idx) => {
                                            const isSelected = userChoice === idx;
                                            const isCorrectAns = idx === currentQuestion.answer;

                                            let stateClass = "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 shadow-sm";
                                            if (isCompletedItem) {
                                                if (isCorrectAns) {
                                                    // 실제 정답: 항상 초록색
                                                    stateClass = "border-emerald-500 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-500/20";
                                                } else if (isSelected) {
                                                    // 사용자가 선택한 오답: 항상 빨간색
                                                    stateClass = "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20";
                                                } else {
                                                    // 그 외: 흐리게 처리
                                                    stateClass = "border-gray-200 bg-gray-50/50 opacity-60";
                                                }
                                            } else if (isSelected) {
                                                stateClass = "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 shadow-md";
                                            }

                                            return (
                                                <button
                                                    key={idx}
                                                    disabled={isCompletedItem}
                                                    onClick={() => handleSelect(idx)}
                                                    className={cn(
                                                        "w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all flex items-center gap-4 md:gap-5 group/opt",
                                                        stateClass
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                                        (isCompletedItem && isCorrectAns) ? "bg-emerald-500 border-emerald-500 text-white" :
                                                            (isCompletedItem && isSelected && !isCorrectAns) ? "bg-rose-500 border-rose-500 text-white" :
                                                                isSelected ? "bg-primary border-primary text-white" :
                                                                    "bg-white border-gray-300 group-hover/opt:border-gray-400"
                                                    )}>
                                                        {(isCorrectAns && isCompletedItem) && <Check className="w-4 h-4 stroke-[3.5]" />}
                                                        {(isSelected && isCompletedItem && !isCorrectAns) && <X className="w-4 h-4 stroke-[3.5]" />}
                                                        {(isSelected && !isCompletedItem) && <Check className="w-4 h-4 stroke-[3.5]" />}
                                                    </div>
                                                    <span className="font-semibold text-[16px] md:text-[17px] leading-[1.5] flex-1 break-keep">
                                                        {option}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. 해설 영역 (문제 카드 외부 하단에 고정 노출) */}
                        {isCompletedItem && (
                            <div className="bg-white rounded-[20px] p-6 text-gray-700 border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                                <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold ml-2">
                                    <div className="p-1 bg-indigo-100 rounded-md">
                                        <Info className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <span className="text-lg">해설</span>
                                </div>
                                <div className="ml-2 mt-4 leading-[1.8] whitespace-pre-wrap text-[15px] md:text-[16px]">
                                    {currentQuestion.explanation}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* 하단 푸터 (버튼 영역) */}
                <div className="h-[100px] border-t bg-white px-6 md:px-12 flex items-center justify-between shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-10">
                    <div className="flex-1">
                        {isSubmitted && !isCorrect && (
                            <div className="flex items-center gap-3 text-rose-600 font-bold animate-in slide-in-from-bottom-2">
                                <AlertCircle className="w-6 h-6" />
                                <span className="text-[14px] md:text-[16px]">틀렸어요! 해설을 확인해보세요.</span>
                            </div>
                        )}
                        {isSubmitted && isCorrect && (
                            <div className="flex items-center gap-3 text-emerald-600 font-bold animate-in slide-in-from-bottom-2">
                                <div className="p-1.5 bg-emerald-100 rounded-full">
                                    <Check className="w-5 h-5 stroke-[3]" />
                                </div>
                                <span className="text-[14px] md:text-[16px]">정답이에요!</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 md:gap-4 shrink-0">
                        {!isSubmitted ? (
                            <Button
                                disabled={!isAllAnswered}
                                onClick={handleSubmit}
                                className="w-36 md:w-48 h-12 md:h-14 text-[16px] md:text-[17px] font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-2xl transition-all active:scale-95 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none"
                            >
                                제출하기
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setShowResultScreen(true)}
                                className="w-36 md:w-48 h-12 md:h-14 text-[16px] md:text-[17px] font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-2xl transition-all active:scale-95 text-white"
                            >
                                유형 결과 보기
                                <ChevronRight className="w-5 h-5 ml-1 md:ml-2 stroke-[3]" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}

export default function SuspensedStudyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-400 font-medium">유형 문제 로딩 중...</div>
            </div>
        }>
            <StudyPage />
        </Suspense>
    );
}
