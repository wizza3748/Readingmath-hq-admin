"use client";

import React, { use, useEffect, useState, useRef, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  X,
  Check,
  AlertCircle,
  Info,
  Loader2,
  Home,
  ArrowRight,
  Star,
  BookOpen,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";

import { MATH_PRINT_SAMPLES } from "@/lib/task-print-sample-mock";
import { MATH_CURRICULA } from "@/lib/task-center-mock";
import { MATH_TYPE_TO_QUESTIONS, saveLocalPrepHistory, getCombinedTypeHistory, evaluateAchievementStatus, getChallengeQuestionCount, getDailyAttemptsCount, recordDailyAttempt, isDailyAttemptAllowed } from "@/utils/examPrepStorage";

function getYoutubeEmbedUrl(url?: string) {
  if (!url) return "";
  let videoId = "";
  try {
    if (url.includes("youtu.be/")) {
      const parts = url.split("youtu.be/");
      if (parts.length > 1) {
        videoId = parts[1].split("?")[0];
      }
    } else if (url.includes("youtube.com/watch")) {
      const match = url.match(/[?&]v=([^&#]+)/);
      videoId = match ? match[1] : "";
    }
  } catch (e) {
    console.error("Error parsing youtube url", e);
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}

const formatSolvedAt = (isoString: string) => {
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${y}. ${m}. ${d}. ${hh}:${mm}:${ss}`;
};

interface AchievementInfo {
  label: string;
  shortLabel: string;
  icon: "crown" | "check" | "question";
  chipBg: string;
  chipBorder: string;
  chipIconColor: string;
  filterIconColor: string;
  filterTextColor: string;
  selBg: string;
  selBorder: string;
  selText: string;
  description: string;
  challengeLabel: string;
  challengeStyle: string;
}

const ACHIEVEMENT_CONFIG: Record<string, AchievementInfo> = {
  none: {
    label: "미진행", shortLabel: "미진행", icon: "question",
    chipBg: "bg-white", chipBorder: "border border-slate-200", chipIconColor: "text-slate-300",
    filterIconColor: "text-slate-300", filterTextColor: "text-slate-500",
    selBg: "bg-slate-700", selBorder: "border-slate-700", selText: "text-white",
    description: "아직 학습을 시작하지 않았어요.",
    challengeLabel: "초록 도전", challengeStyle: "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30",
  },
  undetermined: {
    label: "미판정", shortLabel: "미판정", icon: "question",
    chipBg: "bg-slate-300", chipBorder: "border-transparent", chipIconColor: "text-slate-500",
    filterIconColor: "text-slate-500", filterTextColor: "text-slate-600",
    selBg: "bg-slate-500", selBorder: "border-slate-500", selText: "text-white",
    description: "학습량이 부족해요.",
    challengeLabel: "초록 도전", challengeStyle: "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30",
  },
  relearn: {
    label: "재학습 필요", shortLabel: "재학습", icon: "check",
    chipBg: "bg-red-500", chipBorder: "border-transparent", chipIconColor: "text-white",
    filterIconColor: "text-red-500", filterTextColor: "text-red-600",
    selBg: "bg-red-500", selBorder: "border-red-500", selText: "text-white",
    description: "전혀 이해하지 못하고 있어요.",
    challengeLabel: "초록 도전", challengeStyle: "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30",
  },
  supplement: {
    label: "보충 필요", shortLabel: "보충", icon: "check",
    chipBg: "bg-yellow-500", chipBorder: "border-transparent", chipIconColor: "text-white",
    filterIconColor: "text-yellow-500", filterTextColor: "text-yellow-600",
    selBg: "bg-yellow-500", selBorder: "border-yellow-500", selText: "text-white",
    description: "이해도가 낮은 상태예요.",
    challengeLabel: "초록 도전", challengeStyle: "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30",
  },
  understand: {
    label: "유형 이해", shortLabel: "이해", icon: "check",
    chipBg: "bg-green-400", chipBorder: "border-transparent", chipIconColor: "text-white",
    filterIconColor: "text-green-500", filterTextColor: "text-green-600",
    selBg: "bg-green-500", selBorder: "border-green-500", selText: "text-white",
    description: "충분히 이해하여 문제를 풀 수 있어요.",
    challengeLabel: "왕관 도전", challengeStyle: "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/30",
  },
  master: {
    label: "유형 정복", shortLabel: "정복", icon: "crown",
    chipBg: "bg-green-600", chipBorder: "border-transparent", chipIconColor: "text-white",
    filterIconColor: "text-green-700", filterTextColor: "text-green-700",
    selBg: "bg-green-700", selBorder: "border-green-700", selText: "text-white",
    description: "완전히 이해하고 있어요.",
    challengeLabel: "다시 도전", challengeStyle: "bg-slate-500 hover:bg-slate-600 text-white shadow-slate-500/30",
  },
};

function AchievementIcon({ status, className }: { status: string; className?: string }) {
  const cfg = ACHIEVEMENT_CONFIG[status];
  if (!cfg) return null;
  if (cfg.icon === "crown") return <Crown className={cn("stroke-[2]", className)} />;
  if (cfg.icon === "check") return <Check className={cn("stroke-[3]", className)} />;
}

// KaTeX 수식 렌더링 컴포넌트
function ProblemRenderer({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = html;
    renderMathInElement(ref.current, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      macros: {
        "\\frac": "\\dfrac",
      },
      throwOnError: false,
    });
  }, [html]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .choice-image-wrapper img {
          height: 110px !important;
          max-height: 110px !important;
          width: auto !important;
          object-fit: contain !important;
        }
        .passage-box {
          background-color: #f9fafb !important;
          color: #1f2937 !important;
          border-color: #e5e7eb !important;
        }
        .dark .passage-box {
          background-color: rgba(31, 41, 55, 0.4) !important;
          color: #e5e7eb !important;
          border-color: #374151 !important;
        }
        .passage-box img,
        .text-base img,
        .text-lg img {
          max-width: 100% !important;
          height: auto !important;
          max-height: 280px !important;
          object-fit: contain !important;
          margin: 12px auto !important;
          display: block !important;
        }
      `}} />
      <div
        ref={ref}
        className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 min-w-0"
      />
    </>
  );
}

function MathSolveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeId = searchParams.get("typeId") || "";
  const typeName = searchParams.get("name") || "";

  // typeId로 원본 유형 데이터 찾기
  const rawTypeId = typeId.replace(/-(basic|skill|advanced)$/, "");
  const difficulty = typeId.endsWith("-basic") ? "basic" : typeId.endsWith("-skill") ? "skill" : "advanced";

  let foundType: any = null;
  let detectedGradeTerm = searchParams.get("gradeTerm") || "";
  const sessionId = searchParams.get("sessionId") || `direct-${Date.now()}`;

  for (const course of MATH_CURRICULA) {
    for (const type of course.types) {
      if (type.id === rawTypeId) {
        foundType = type;
        if (!detectedGradeTerm) {
          detectedGradeTerm = course.course; // 예: "중등 1-1"
        }
        break;
      }
    }
    if (foundType) break;
  }

  // 선지 레이아웃 모드 판별 ("col" | "row" | "grid" | "grid3")
  const getChoiceLayoutMode = (choiceHtmls: string[] | undefined): "col" | "row" | "grid" | "grid3" => {
    if (!choiceHtmls || choiceHtmls.length === 0) return "col";
    const hasImage = choiceHtmls.some(html => html.includes("<img"));
    if (hasImage) return "grid3";
    const hasMath = choiceHtmls.some(html => html.includes("\\(") || html.includes("$"));
    const getVisualLength = (html: string): number => {
      let text = html.replace(/<[^>]*>/g, "");
      text = text.replace(/\\\(|\\\)|\$/g, "");
      text = text.replace(/\\[a-zA-Z]+/g, "");
      text = text.replace(/[{}]/g, "");
      return text.trim().length;
    };
    const maxVisualLength = choiceHtmls.reduce((max, html) => {
      const len = getVisualLength(html);
      return len > max ? len : max;
    }, 0);

    if (hasMath) {
      const hasEquationOrComparison = choiceHtmls.some(html => 
        html.includes("=") || html.includes("<") || html.includes(">") || 
        html.includes("≥") || html.includes("≤") || html.includes("\\le") || 
        html.includes("\\ge") || html.includes("\\ne") || html.includes("\\approx")
      );
      if (maxVisualLength <= 8) return "row";
      if (hasEquationOrComparison) {
        if (maxVisualLength <= 20) return "grid";
        return "col";
      } else {
        if (maxVisualLength <= 20) return "grid";
        return "col";
      }
    } else {
      if (maxVisualLength <= 8) return "row";
      if (maxVisualLength <= 16) return "grid";
      return "col";
    }
  };

  // --- State ---
  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [inputText, setInputText] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // 성취도 실시간 갱신 감지용 버전 상태
  const [historyVersion, setHistoryVersion] = useState<number>(0);
  
  // 진입 차단(에러) 상태
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [isAttemptLimitBlocked, setIsAttemptLimitBlocked] = useState<boolean>(false);
  const [qCount, setQCount] = useState<number>(2);
  const hasRecordedAttempt = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("readingmath_theme");
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  // 세션 설정 및 진입 방어 검증
  useEffect(() => {
    if (!typeId) {
      setIsBlocked(true);
      return;
    }

    // 1. 도전 세션 문항 수 결정
    const count = getChallengeQuestionCount(typeId, "math");
    setQCount(count);

    // 2. 후보 문항 pool 수집 (학년-학기, 과목 등은 MATH_TYPE_TO_QUESTIONS 매핑 정의에서 고유 매핑되어 있으므로, 
    //    유형 ID mt-x-x-x 에 연관된 basic, skill, advanced 난이도 풀을 합산하여 pool을 구성함)
    const mappings = MATH_TYPE_TO_QUESTIONS;
    const poolIdsSet = new Set<string>();

    [`${rawTypeId}-basic`, `${rawTypeId}-skill`, `${rawTypeId}-advanced`].forEach(key => {
      const ids = mappings[key] || [];
      ids.forEach(id => poolIdsSet.add(id));
    });

    const poolIds = Array.from(poolIdsSet);
    const pool = poolIds
      .map(id => MATH_PRINT_SAMPLES.find(q => q.id === id))
      .filter((q): q is any => !!q);

    // 3. 진입 방어 검증 (문항 풀 검증)
    if (pool.length < count) {
      setIsBlocked(true);
      return;
    }

    // 3.5 일일 도전 제한 및 세션 상태 검증
    const attemptParams = { subject: "math" as const, gradeTerm: detectedGradeTerm, typeId };
    const sessionKey = `examprep_recorded_${sessionId}`;
    const questionKey = `examprep_questions_${sessionId}`;

    const savedQuestionsStr = sessionStorage.getItem(questionKey);
    if (savedQuestionsStr) {
      try {
        const savedQuestions = JSON.parse(savedQuestionsStr);
        setSessionQuestions(savedQuestions);
        setIsBlocked(false);
        return;
      } catch (e) {
        console.error("Failed to parse saved questions", e);
      }
    }

    // 신규 세션인데 도전 제한 횟수(2회) 도달 시 차단 및 홈 화면 리다이렉트
    if (!isDailyAttemptAllowed(attemptParams)) {
      router.replace(`/content/math-exam-prep?selectedTypeId=${encodeURIComponent(typeId)}&gradeTerm=${encodeURIComponent(detectedGradeTerm)}`);
      return;
    }

    // 4. 세션 문항 선정 (중복 없는 count개 구성)
    // history.length에 따른 순환을 지원하여 매 도전마다 다른 문항이 나오도록 유도
    const combinedHistory = getCombinedTypeHistory(typeId, "math");
    const len = pool.length;
    const startIdx = combinedHistory.length % len;
    
    const selected: any[] = [];
    for (let i = 0; i < count; i++) {
      const idx = (startIdx + i) % len;
      selected.push(pool[idx]);
    }

    // 5. 도전 세션 생성 확정 시점에 도전 횟수 1회 기록 및 세션 정보 저장
    if (!sessionStorage.getItem(sessionKey)) {
      recordDailyAttempt(attemptParams);
      sessionStorage.setItem(sessionKey, "true");
    }
    sessionStorage.setItem(questionKey, JSON.stringify(selected));

    setSessionQuestions(selected);
    setIsBlocked(false);
  }, [typeId]);

  const combinedHistory = useMemo(() => {
    return getCombinedTypeHistory(typeId, "math");
  }, [typeId, historyVersion]);

  const currentStatus = useMemo(() => {
    return evaluateAchievementStatus(typeId, "math");
  }, [typeId, historyVersion]);

  // KaTeX 수식 렌더링 헬퍼
  const renderChoiceButton = (choice: string, idx: number, layoutMode: "col" | "row" | "grid" | "grid3") => {
    const questionSample = sessionQuestions[currentIdx];
    if (!questionSample) return null;

    const isSelected = selectedChoice === idx;
    const isCorrectChoice = questionSample.choices[idx] === questionSample.answer || idx + 1 === parseInt(questionSample.answer, 10);
    const choiceNum = idx + 1;

    let buttonClass = "border-transparent bg-transparent hover:bg-gray-100/40 dark:hover:bg-gray-800/40 text-slate-800 dark:text-slate-200";
    let badgeClass = "border-gray-300 bg-white text-gray-600 dark:border-gray-650 dark:bg-gray-800 dark:text-gray-300";

    if (isSubmitted) {
      if (isCorrectChoice) {
        buttonClass = "border-emerald-500 bg-emerald-50/40 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100 font-bold shadow-sm";
        badgeClass = "border-emerald-500 bg-emerald-500 text-white";
      } else if (isSelected) {
        buttonClass = "border-rose-500 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-100 font-bold shadow-sm";
        badgeClass = "border-rose-500 bg-rose-500 text-white";
      } else {
        buttonClass = "border-transparent bg-transparent opacity-40 pointer-events-none";
        badgeClass = "border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-850 dark:text-gray-500";
      }
    } else if (isSelected) {
      buttonClass = "border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm dark:bg-blue-950/30 dark:text-blue-100 font-bold";
      badgeClass = "border-blue-600 bg-blue-600 text-white";
    }

    let buttonSpacingClass = "space-x-4 px-5 py-3.5";
    if (layoutMode === "row") {
      buttonSpacingClass = "space-x-3 px-3 py-2.5";
    } else if (layoutMode === "grid3") {
      buttonSpacingClass = "space-x-3 px-4 py-3";
    } else if (layoutMode === "grid") {
      buttonSpacingClass = "space-x-4 px-4 py-3";
    }

    return (
      <button
        key={idx}
        disabled={isSubmitted}
        onClick={() => setSelectedChoice(idx)}
        className={cn(
          "text-left rounded-xl border flex items-center justify-start transition-all duration-150 cursor-pointer group/opt",
          buttonSpacingClass,
          buttonClass,
          layoutMode === "col" ? "w-full" : ""
        )}
      >
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all",
          badgeClass
        )}>
          {choiceNum}
        </div>
        {layoutMode === "grid3" ? (
          <div className="flex-1 min-w-0 flex justify-center py-2 choice-image-wrapper">
            <ProblemRenderer html={choice} />
          </div>
        ) : (
          <span className="font-semibold text-[15px] md:text-[16px] leading-[1.5] flex-1 break-keep">
            <ProblemRenderer html={choice} />
          </span>
        )}
      </button>
    );
  };

  // 직접 진입 방어 에러 화면
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-800 dark:text-slate-200 animate-in fade-in duration-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">출제 가능한 문항이 없어요.</h2>
        <p className="text-gray-500 text-sm mb-6">해당 유형에 제공되는 문항 수가 부족하여 도전 세션을 시작할 수 없습니다.</p>
        <Button 
          onClick={() => router.push(`/content/math-exam-prep?selectedTypeId=${encodeURIComponent(typeId)}`)} 
          className="font-bold bg-violet-600 hover:bg-violet-750 text-white rounded-xl px-6 h-12"
        >
          시험 대비 홈으로
        </Button>
      </div>
    );
  }

  // 문항 로딩 대기
  if (sessionQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-2" />
        <p className="text-gray-500 text-sm">문항을 불러오는 중입니다...</p>
      </div>
    );
  }

  const questionSample = sessionQuestions[currentIdx];
  const isChoiceType = questionSample?.choices && questionSample.choices.length > 0;
  const isAnswered = isChoiceType ? selectedChoice !== null : inputText.trim() !== "";

  // 뒤로가기 클릭 시 이탈 방지 처리
  const handleBack = () => {
    if (!isSubmitted || currentIdx < sessionQuestions.length - 1) {
      setShowExitModal(true);
    } else {
      router.push("/content/math-exam-prep");
    }
  };

  // 답안 제출 채점 로직
  const handleSubmit = () => {
    if (!isAnswered || isSubmitted || !questionSample) return;

    let correct = false;
    let submittedAnsText = "";

    if (isChoiceType) {
      if (selectedChoice !== null) {
        const selectedVal = questionSample.choices[selectedChoice];
        submittedAnsText = selectedVal;
        
        const clean = (s: string) => s.replace(/[\$\s\(\)\\]/g, "");
        const cleanAnswer = clean(questionSample.answer);
        
        if (clean(selectedVal) === cleanAnswer) {
          correct = true;
        } else {
          const matchIdx = questionSample.choices.indexOf(questionSample.answer);
          if (matchIdx === selectedChoice) {
            correct = true;
          } else {
            const numAns = parseInt(questionSample.answer, 10);
            if (!isNaN(numAns) && numAns === selectedChoice + 1) {
              correct = true;
            }
          }
        }
      }
    } else {
      submittedAnsText = inputText.trim();
      const clean = (s: string) => s.replace(/[\$\s\(\)\\]/g, "").trim();
      if (clean(inputText) === clean(questionSample.answer)) {
        correct = true;
      }
    }

    setIsCorrect(correct);
    setIsSubmitted(true);

    // [이력 저장] 신규 저장 시 submitted: true 세팅
    saveLocalPrepHistory({
      typeId,
      questionId: questionSample.id,
      path: "시험 대비",
      isCorrect: correct,
      submittedAnswer: submittedAnsText,
      solvedAt: new Date().toISOString()
    });

    // 성취도 재판정 연동을 위한 버전 상태 갱신
    setHistoryVersion(v => v + 1);
  };

  const handleNext = () => {
    setSelectedChoice(null);
    setInputText("");
    setIsSubmitted(false);
    setIsCorrect(null);
    setCurrentIdx(prev => prev + 1);
  };

  const handleKeypadPress = (key: string) => {
    if (isSubmitted) return;

    let nextVal = inputText;
    if (key === "delete") {
      nextVal = nextVal.slice(0, -1);
    } else if (key === "clear") {
      nextVal = "";
    } else if (key === "confirm") {
      if (nextVal.trim() !== "") {
        handleSubmit();
      }
      return;
    } else {
      if (nextVal.length < 15) {
        nextVal += key;
      }
    }
    setInputText(nextVal);
  };


  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors duration-200 pb-24",
      isDarkMode && "bg-slate-950 text-slate-100 dark"
    )}>
      {/* GNB / 상단 영역 */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 shrink-0 z-40">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={handleBack}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-850 transition-colors"
            title="뒤로가기"
          >
            <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
          </button>
          <span className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          {/* 유형명 주요 제목으로 노출 */}
          <h1 className="text-[17px] font-black text-slate-900 dark:text-white leading-none">
            {typeName || "유형 문항 풀이"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* 상단 문항 진행률 표시 */}
          <span className="text-sm font-extrabold text-slate-500 dark:text-slate-400">
            {currentIdx + 1} / {sessionQuestions.length}
          </span>
        </div>
      </header>

      {/* 메인 풀이 영역 (좌우 2분할) */}
      <main className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden">
        {/* 좌측: 실제 문제 풀이 영역 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="w-full flex flex-col gap-6 pb-12">
            
            {/* 발문 렌더러 */}
            <div className="text-[18px] md:text-[20px] font-bold leading-[1.6] text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-keep">
              <ProblemRenderer html={questionSample.stem} />
            </div>

            {/* 지문/본문/이미지/도표 렌더러 */}
            {questionSample.passage && (
              <div className="passage-box border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 bg-slate-50 dark:bg-slate-900/40 text-[15px] md:text-[16px] leading-[1.7] text-slate-700 dark:text-slate-355 shadow-inner">
                <ProblemRenderer html={questionSample.passage} />
              </div>
            )}

            {questionSample.image && (
              <div className="flex justify-center max-w-full my-4">
                <img
                  src={questionSample.image}
                  alt="문제 이미지"
                  className="max-w-full h-auto max-h-[240px] object-contain rounded-xl"
                />
              </div>
            )}

            {/* 답안 입력 영역 */}
            <div className="mt-4 border-t border-slate-100 dark:border-slate-800/50 pt-6">
              {isChoiceType ? (
                /* 선지형 문항 (보기 선택) */
                (() => {
                  const layoutMode = getChoiceLayoutMode(questionSample.choices);
                  
                  if (layoutMode === "row") {
                    return (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                        {questionSample.choices.map((choice: string, idx: number) => 
                          renderChoiceButton(choice, idx, "row")
                        )}
                      </div>
                    );
                  }
                  
                  if (layoutMode === "grid3") {
                    return (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                        {questionSample.choices.map((choice: string, idx: number) => 
                          renderChoiceButton(choice, idx, "grid3")
                        )}
                      </div>
                    );
                  }
                  
                  if (layoutMode === "grid") {
                    return (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
                        {questionSample.choices.map((choice: string, idx: number) => 
                          renderChoiceButton(choice, idx, "grid")
                        )}
                      </div>
                    );
                  }
                  
                  // 기본 세로 col 배치
                  return (
                    <div className="space-y-3">
                      {questionSample.choices.map((choice: string, idx: number) => 
                        renderChoiceButton(choice, idx, "col")
                      )}
                    </div>
                  );
                })()
              ) : (
                /* 입력형 / 풀이답안형 문항 (텍스트 입력) */
                <div className="flex flex-col space-y-4 max-w-[360px] mx-auto w-full">
                  <input
                    type="text"
                    disabled={isSubmitted}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isSubmitted ? "제출이 완료되었습니다." : "답을 입력해주세요"}
                    className={cn(
                      "w-full text-center rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-xl font-bold tracking-wider text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-850 dark:bg-gray-900 dark:text-white transition-all",
                      isSubmitted && (isCorrect ? "border-emerald-500 bg-emerald-50/10" : "border-rose-500 bg-rose-50/10")
                    )}
                  />
                  {isSubmitted && (
                    <div className="text-sm font-semibold flex items-center justify-center gap-1.5 mt-1">
                      <span className="text-slate-400 dark:text-slate-500">올바른 정답:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{questionSample.answer}</span>
                    </div>
                  )}

                  {/* 수치 키패드 */}
                  <div className="w-full bg-gray-100 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-800">
                    <div className="grid grid-cols-5 gap-2.5">
                      {[
                        { label: "1", value: "1" },
                        { label: "2", value: "2" },
                        { label: "3", value: "3" },
                        { label: "4", value: "4" },
                        { label: "5", value: "5" },
                        
                        { label: "6", value: "6" },
                        { label: "7", value: "7" },
                        { label: "8", value: "8" },
                        { label: "9", value: "9" },
                        { label: "0", value: "0" },
                        
                        { label: ".", value: "." },
                        { label: "-", value: "-" },
                        { label: "+", value: "+" },
                        { label: "↺", value: "clear", cls: "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold" },
                        { label: "⌫", value: "delete", cls: "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold" },
                        
                        { label: "✓", value: "confirm", colSpan: 5, cls: "bg-slate-600 hover:bg-slate-700 text-white font-bold text-xl h-12 flex items-center justify-center rounded-xl" },
                      ].map((btn, i) => {
                        const gridCls = [
                          btn.colSpan ? `col-span-${btn.colSpan}` : "",
                          btn.cls || "bg-white hover:bg-gray-50 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-750 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50",
                        ].join(" ");
                        return (
                          <button
                            key={i}
                            disabled={isSubmitted}
                            onClick={() => handleKeypadPress(btn.value)}
                            className={cn(
                              "flex h-11 items-center justify-center rounded-xl text-base font-bold shadow-sm transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                              gridCls
                            )}
                            style={{
                              gridColumnEnd: btn.colSpan ? `span ${btn.colSpan}` : undefined
                            }}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 문항 채점 결과 및 해설 영역 */}
            {isSubmitted && (
              <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                <div className={cn(
                  "absolute top-0 left-0 w-1.5 h-full",
                  isCorrect ? "bg-emerald-500" : "bg-rose-500"
                )} />
                
                <div className="flex items-center gap-2 mb-4 text-slate-900 dark:text-white font-bold ml-2">
                  <div className="p-1 bg-violet-100 dark:bg-violet-950/60 rounded-md">
                    <Info className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-lg">정답 및 해설</span>
                </div>
                
                <div className="ml-2 leading-[1.8] whitespace-pre-wrap text-[15px] md:text-[16px]">
                  <div className="mb-4">
                    <h5 className="font-extrabold text-slate-400 dark:text-slate-500 text-xs mb-1 uppercase tracking-widest">해설</h5>
                    <ProblemRenderer html={questionSample.explanation} />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 우측: 유형 상세 참고 패널 */}
        {foundType && (
          <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-y-auto p-6 flex flex-col gap-6">
            
            {/* 유형 기본 정보 */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">유형 정보</span>
              
              {/* 배지 행 */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                  ACHIEVEMENT_CONFIG[currentStatus]?.chipBg || "bg-violet-100",
                  ACHIEVEMENT_CONFIG[currentStatus]?.chipBorder || "",
                  ACHIEVEMENT_CONFIG[currentStatus]?.chipIconColor || "text-violet-700",
                  currentStatus === "none" && "border"
                )}>
                  <AchievementIcon status={currentStatus} className="w-3 h-3" />
                  {/* 현재 성취도 상태 */}
                  <span className="capitalize">
                    {(() => {
                      const status = currentStatus;
                      const statusLabels: Record<string, string> = {
                        none: "미진행",
                        undetermined: "미판정",
                        relearn: "재학습 필요",
                        supplement: "보충 필요",
                        understand: "유형 이해",
                        master: "유형 정복",
                      };
                      return statusLabels[status] || status;
                    })()}
                  </span>
                </div>
                {/* 중요 여부 */}
                {((difficulty === "basic" && foundType.importantCount.basic > 0) ||
                  (difficulty === "skill" && foundType.importantCount.intermediate > 0) ||
                  (difficulty === "advanced" && foundType.importantCount.advanced > 0)) && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-bold dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    중요
                  </div>
                )}
                {/* 난이도 */}
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold",
                  isDarkMode ? "bg-slate-800 text-slate-350" : "bg-slate-100 text-slate-600"
                )}>
                  {difficulty === "basic" ? "기본" : difficulty === "skill" ? "실력" : "심화"}
                </span>
              </div>

              {/* 유형명 */}
              <h3 className="text-[16px] font-extrabold leading-snug text-slate-900 dark:text-white">
                {foundType.typeName}
              </h3>
            </div>

            {/* 대표 유형 동영상 */}
            {foundType.videoUrl && (
              <>
                <div className="border-t border-slate-200 dark:border-slate-800" />
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">대표 유형 동영상</h4>
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200/50 bg-black shadow-inner">
                    <iframe
                      src={getYoutubeEmbedUrl(foundType.videoUrl)}
                      title={`${foundType.typeName} 동영상`}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              </>
            )}

            {/* 대표 유형 문제 */}
            {foundType.sampleQuestion && (
              <>
                <div className="border-t border-slate-200 dark:border-slate-800" />
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">대표 유형 문제</h4>
                  <div className="p-4 rounded-xl text-sm leading-relaxed border bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800/50 text-slate-700 dark:text-slate-200 font-medium">
                    <ProblemRenderer html={foundType.sampleQuestion} />
                  </div>
                </div>
              </>
            )}

            {/* 최근 풀이 이력 */}
            <>
              <div className="border-t border-slate-200 dark:border-slate-800" />
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">최근 풀이 이력</h4>
                {combinedHistory.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {combinedHistory.slice(0, 3).map((h, i) => (
                      <div key={i} className={cn(
                        "flex items-center justify-between p-3 rounded-xl border text-xs shadow-sm",
                        isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-100"
                      )}>
                        <div className="flex items-center gap-2">
                          {h.isCorrect ? (
                            <Check className="w-4 h-4 text-green-500 stroke-[3]" />
                          ) : (
                            <X className="w-4 h-4 text-red-500 stroke-[3]" />
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-750 dark:text-slate-350">{h.path}</span>
                            <span className="text-slate-400 dark:text-slate-500">·</span>
                            <span className={cn("font-bold", h.isCorrect ? "text-green-500" : "text-red-505")}>
                              {h.isCorrect ? "정답" : "오답"}
                            </span>
                          </div>
                        </div>
                        <span className="text-slate-400 dark:text-slate-500">{formatSolvedAt(h.solvedAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 gap-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/20 text-slate-400 dark:text-slate-650">
                    <BookOpen className="w-8 h-8 opacity-40" />
                    <span className="text-xs font-semibold">아직 풀이 이력이 없어요</span>
                  </div>
                )}
              </div>
            </>

          </div>
        )}
      </main>

      {/* 하단 푸터 (버튼 영역) */}
      <footer className="fixed bottom-0 left-0 right-0 h-20 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md z-45 flex items-center justify-between px-8 shadow-inner">
        <div className="flex-1">
          {/* 채점 완료 후 채점 결과 즉시 표시 */}
          {isSubmitted && (
            isCorrect ? (
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-extrabold animate-in slide-in-from-bottom-2">
                <div className="p-1 bg-emerald-100 dark:bg-emerald-950/60 rounded-full">
                  <Check className="w-4 h-4 stroke-[3.5]" />
                </div>
                <span className="text-[14px] md:text-[15px]">정답</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-450 font-extrabold animate-in slide-in-from-bottom-2">
                <div className="p-1 bg-rose-100 dark:bg-rose-950/60 rounded-full">
                  <X className="w-4 h-4 stroke-[3.5]" />
                </div>
                <span className="text-[14px] md:text-[15px]">오답</span>
              </div>
            )
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isSubmitted ? (
            <Button
              disabled={!isAnswered}
              onClick={handleSubmit}
              className="px-8 h-12 md:h-13 font-black bg-violet-600 hover:bg-violet-750 text-white rounded-xl shadow-lg shadow-violet-600/10 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              제출하기
            </Button>
          ) : (
            currentIdx < sessionQuestions.length - 1 ? (
              <Button
                onClick={handleNext}
                className="px-8 h-12 md:h-13 font-black bg-violet-600 hover:bg-violet-750 text-white rounded-xl shadow-md"
              >
                다음 문제
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => router.push("/content/math-exam-prep")}
                  variant="outline"
                  className="px-6 h-12 md:h-13 font-bold border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <Home className="w-4 h-4 mr-2" />
                  시험 대비 홈으로
                </Button>
                <Button
                  onClick={() => router.push(`/content/math-exam-prep?selectedTypeId=${encodeURIComponent(typeId)}`)}
                  className="px-6 h-12 md:h-13 font-black bg-violet-600 hover:bg-violet-750 text-white rounded-xl shadow-md"
                >
                  유형 상세로
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )
          )}
        </div>
      </footer>

      {/* 풀이 종료 확인 모달 */}
      {showExitModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowExitModal(false)}
        >
          <div 
            className={cn(
              "w-full max-w-[290px] rounded-2xl border p-5 shadow-2xl flex flex-col gap-5 bg-white border-slate-100 text-slate-900 animate-in zoom-in-95 duration-200",
              isDarkMode && "bg-[#1e293b] border-slate-700 text-white"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <h3 className="text-[16px] font-black tracking-tight text-center">
                풀이를 종료할까요?
              </h3>
              <p className={cn(
                "text-[12px] leading-relaxed text-center break-keep font-medium whitespace-pre-line text-slate-500",
                isDarkMode && "text-slate-400"
              )}>
                제출하지 않은 답안은 풀이 이력에 반영되지 않습니다.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className={cn(
                  "py-3 rounded-xl font-extrabold text-[12.5px] transition-all active:scale-95 shadow-sm border bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700",
                  isDarkMode && "bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200"
                )}
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowExitModal(false);
                  router.push("/content/math-exam-prep");
                }}
                className="py-3 rounded-xl font-extrabold text-[12.5px] transition-all active:scale-95 shadow-lg bg-violet-600 hover:bg-violet-750 text-white"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MathSolvePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          <span className="text-sm font-semibold text-slate-400">문항을 불러오는 중...</span>
        </div>
      </div>
    }>
      <MathSolveContent />
    </Suspense>
  );
}
