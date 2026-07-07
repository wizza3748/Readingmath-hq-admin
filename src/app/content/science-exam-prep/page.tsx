"use client";

import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import {
  ChevronDown, ChevronUp, RotateCcw, Star, X,
  HelpCircle, Moon, Sun, Info, Crown, Check,
  BookOpen, ChevronRight, Play, Zap,
  Siren, Megaphone, Menu, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { getStoredTasks, Task } from "@/utils/taskStorage";
import { useRouter, useSearchParams } from "next/navigation";
import { getCombinedTypeHistory, evaluateAchievementStatus, getChallengeQuestionCount, SCIENCE_TYPE_TO_QUESTIONS, getDailyAttemptsCount, isDailyAttemptAllowed } from "@/utils/examPrepStorage";
import { cn } from "@/lib/utils";
import { SCIENCE_CURRICULA } from "@/lib/task-center-mock";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";
import StudentSidebar from "@/components/StudentSidebar";
import { getGradeTerm, setGradeTerm, onGradeTermChange, gradeTermToLabel } from "@/utils/gradeTermStorage";


const DAILY_ATTEMPTS_KEY = "readingmath_examprep_daily_attempts_v1";

function MathRenderer({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = text.replace(/\n/g, "<br />");
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
  }, [text]);

  return <div ref={ref} className={className} />;
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

// =========================================================================
// TYPES
// =========================================================================
type AchievementStatus = "none" | "undetermined" | "relearn" | "supplement" | "understand" | "master";
type Difficulty = "basic" | "skill" | "advanced";

interface TypeData {
  id: string;
  name: string;
  difficulty: Difficulty;
  isImportant: boolean;
  textbook: string;
  status: AchievementStatus;
  videoUrl?: string;
  sampleQuestion?: string;
  availableCount?: number;
}

interface SubUnit {
  id: string;
  name: string;
  basicTypes: TypeData[];
  skillTypes: TypeData[];
  advancedTypes: TypeData[];
}

interface BigUnit {
  id: string;
  badge: string;
  name: string;
  color: string;
  subUnits: SubUnit[];
}

// =========================================================================
// ACHIEVEMENT CONFIG (명세 기준)
// =========================================================================
interface AchievementInfo {
  label: string;
  shortLabel: string;
  icon: "question" | "check" | "crown" | "zap" | "x" | "alert";
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

const ACHIEVEMENT_CONFIG: Record<AchievementStatus, AchievementInfo> = {
  none: {
    label: "미진행", shortLabel: "미진행", icon: "question",
    chipBg: "bg-white", chipBorder: "border border-slate-200", chipIconColor: "text-slate-300",
    filterIconColor: "text-slate-300", filterTextColor: "text-slate-500",
    selBg: "bg-slate-700", selBorder: "border-slate-700", selText: "text-white",
    description: "아직 학습을 시작하지 않았어요.",
    challengeLabel: "번개 도전", challengeStyle: "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30",
  },
  undetermined: {
    label: "미판정", shortLabel: "미판정", icon: "question",
    chipBg: "bg-slate-300", chipBorder: "border-transparent", chipIconColor: "text-slate-500",
    filterIconColor: "text-slate-500", filterTextColor: "text-slate-600",
    selBg: "bg-slate-500", selBorder: "border-slate-500", selText: "text-white",
    description: "학습량이 부족해요.",
    challengeLabel: "번개 도전", challengeStyle: "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30",
  },
  relearn: {
    label: "재학습 필요", shortLabel: "재학습", icon: "x",
    chipBg: "bg-red-500", chipBorder: "border-transparent", chipIconColor: "text-white",
    filterIconColor: "text-red-500", filterTextColor: "text-red-600",
    selBg: "bg-red-500", selBorder: "border-red-500", selText: "text-white",
    description: "전혀 이해하지 못하고 있어요.",
    challengeLabel: "번개 도전", challengeStyle: "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30",
  },
  supplement: {
    label: "보충 필요", shortLabel: "보충", icon: "alert",
    chipBg: "bg-yellow-500", chipBorder: "border-transparent", chipIconColor: "text-white",
    filterIconColor: "text-yellow-500", filterTextColor: "text-yellow-600",
    selBg: "bg-yellow-500", selBorder: "border-yellow-500", selText: "text-white",
    description: "이해도가 낮은 상태예요.",
    challengeLabel: "번개 도전", challengeStyle: "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30",
  },
  understand: {
    label: "유형 이해", shortLabel: "이해", icon: "zap",
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

const ALL_STATUSES: AchievementStatus[] = ["none", "undetermined", "relearn", "supplement", "understand", "master"];
const SCIENCE_TEXTBOOKS = ["오투", "완자", "오투+완자", "기타"];

const GRADE_TERMS = [
  { v: "초3-1", l: "초등 3-1" }, { v: "초3-2", l: "초등 3-2" },
  { v: "초4-1", l: "초등 4-1" }, { v: "초4-2", l: "초등 4-2" },
  { v: "초5-1", l: "초등 5-1" }, { v: "초5-2", l: "초등 5-2" },
  { v: "초6-1", l: "초등 6-1" }, { v: "초6-2", l: "초등 6-2" },
  { v: "중1-1", l: "중등 1-1" }, { v: "중1-2", l: "중등 1-2" },
  { v: "중2-1", l: "중등 2-1" }, { v: "중2-2", l: "중등 2-2" },
  { v: "중3-1", l: "중등 3-1" }, { v: "중3-2", l: "중등 3-2" },
  { v: "고1-1", l: "고등 1-1" }, { v: "고1-2", l: "고등 1-2" },
];


function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function mkStatus(seed: number, diff: Difficulty): AchievementStatus {
  const r = (seed * 17 + 43) % 100;
  if (diff === "basic") {
    if (r < 5) return "none";
    if (r < 12) return "undetermined";
    if (r < 25) return "supplement";
    if (r < 55) return "understand";
    return "master";
  } else if (diff === "skill") {
    if (r < 10) return "none";
    if (r < 20) return "undetermined";
    if (r < 30) return "relearn";
    if (r < 46) return "supplement";
    if (r < 68) return "understand";
    return "master";
  } else {
    if (r < 15) return "none";
    if (r < 27) return "undetermined";
    if (r < 42) return "relearn";
    if (r < 56) return "supplement";
    if (r < 75) return "understand";
    return "master";
  }
}

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

// =========================================================================
// HELPER COMPONENTS
// =========================================================================
function AchievementIcon({ status, className }: { status: AchievementStatus; className?: string }) {
  const cfg = ACHIEVEMENT_CONFIG[status];
  if (cfg.icon === "crown") return <Crown className={cn("stroke-[2] fill-current", className)} />;
  if (cfg.icon === "zap") return <Zap className={cn("stroke-[2.5] fill-current", className)} />;
  if (cfg.icon === "x") return <X className={cn("stroke-[3]", className)} />;
  if (cfg.icon === "alert") return <AlertTriangle className={cn("stroke-[2.5]", className)} />;
  if (cfg.icon === "check") return <Check className={cn("stroke-[3]", className)} />;
  return <HelpCircle className={cn("stroke-[2.5]", className)} />;
}

interface TypeChipProps {
  type: TypeData;
  isSelected: boolean;
  onClick: () => void;
  isDark: boolean;
  isHighlighted?: boolean;
  isTaskResultHighlight?: boolean;
}

function TypeChip({ type, isSelected, onClick, isDark, isHighlighted, isTaskResultHighlight }: TypeChipProps) {
  const cfg = ACHIEVEMENT_CONFIG[type.status];
  const selColor = type.status === "none" ? "#64748b" : 
    type.status === "undetermined" ? "#6b7280" :
    type.status === "relearn" ? "#ef4444" :
    type.status === "supplement" ? "#eab308" :
    type.status === "understand" ? "#22c55e" : "#16a34a";

  return (
    <div
      id={`type-chip-${type.id}`}
      onClick={onClick}
      title={type.name}
      className={cn(
        "relative w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-150 select-none",
        cfg.chipBg, cfg.chipBorder,
        isSelected ? "scale-110 z-10" : "hover:brightness-90 hover:scale-[1.04] active:scale-95",
        isHighlighted && "exam-prep-highlight-active"
      )}
      style={isSelected ? {
        boxShadow: `0 0 0 2px white, 0 0 0 4px ${selColor}`,
        zIndex: 20,
      } : {}}
    >
      <AchievementIcon status={type.status} className={cn("w-4 h-4", cfg.chipIconColor)} />
      {type.isImportant && (
        <Star
          className={cn(
            "absolute top-0.5 left-0.5 w-2 h-2 fill-current",
            type.status === "none" ? "text-slate-400" :
            type.status === "undetermined" ? "text-slate-600" : "text-white/80"
          )}
        />
      )}
      {isTaskResultHighlight && (
        <span className="absolute -top-2.5 px-1 py-0.5 rounded bg-red-500 text-[8px] font-black text-white whitespace-nowrap shadow-sm z-20">
          과제
        </span>
      )}
    </div>
  );
}

interface DetailPanelProps {
  type: TypeData;
  bigUnit: BigUnit;
  subUnit: SubUnit;
  onClose: () => void;
  isDark: boolean;
  gradeTerm: string;
}

function DetailPanel({ type, bigUnit, subUnit, onClose, isDark, gradeTerm }: DetailPanelProps) {
  const router = useRouter();
  const [showRetryModal, setShowRetryModal] = useState(false);
  const cfg = ACHIEVEMENT_CONFIG[type.status];
  const diffLabel: Record<Difficulty, string> = { basic: "기본", skill: "실력", advanced: "심화" };

  const isPlayable = type.availableCount === undefined ? true : type.availableCount > 0;

  // 도전 세션 문항 수 결정 및 pool 체크
  const qCount = getChallengeQuestionCount(type.id, "science");
  const questionPool = SCIENCE_TYPE_TO_QUESTIONS[type.id] || [];
  const hasEnoughQuestions = questionPool.length >= qCount;

  // 일일 도전 제한 체크 추가
  const attemptParams = { subject: "science" as const, gradeTerm, typeId: type.id };
  const dailyAttemptsCount = getDailyAttemptsCount(attemptParams);
  const isAttemptAllowed = dailyAttemptsCount < 2;

  // 최종 도전 버튼 활성화 조건
  const isChallengeEnabled = hasEnoughQuestions && isAttemptAllowed;

  useEffect(() => {
    if (!showRetryModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowRetryModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showRetryModal]);

  const combinedHistory = useMemo(() => {
    return getCombinedTypeHistory(type.id, "science");
  }, [type]);

  const bg = isDark ? "bg-[#1e293b]" : "bg-white";
  const border = isDark ? "border-slate-700" : "border-slate-200";
  const headBg = isDark ? "bg-[#1e293b] border-slate-700" : "bg-white border-slate-100";
  const textPrimary = isDark ? "text-white" : "text-slate-800";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const subBg = isDark ? "bg-slate-700/50" : "bg-slate-50";

  return (
    <div className={cn(
      "w-full h-full flex flex-col",
      bg
    )}>
      {/* 헤더 */}
      <div className={cn("flex items-center justify-between px-4 py-3.5 border-b shrink-0", headBg)}>
        <span className={cn("text-sm font-extrabold", textPrimary)}>유형 상세</span>
        <button
          onClick={onClose}
          className={cn(
            "p-1.5 rounded-lg transition-colors",
            isDark ? "text-slate-400 hover:bg-slate-700 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-800"
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 스크롤 바디 */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">

        {/* 유형 정보 */}
        <div className="flex flex-col gap-3">
          {/* 배지 행 */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
              cfg.chipBg, cfg.chipBorder, cfg.chipIconColor,
              type.status === "none" && "border"
            )}>
              <AchievementIcon status={type.status} className="w-3 h-3" />
              <span className={cn(type.status === "none" && "text-slate-500")}>{cfg.shortLabel}</span>
            </div>
            {type.isImportant && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-bold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                중요
              </div>
            )}
            <span className={cn(
              "px-2.5 py-1 rounded-full text-xs font-bold",
              isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
            )}>{diffLabel[type.difficulty]}</span>
          </div>

          {/* 유형명 */}
          <h3 className={cn("text-[15px] font-extrabold leading-snug", textPrimary)}>
            {type.name}
          </h3>

        </div>

        {/* 구분선 */}
        <div className={cn("border-t", border)} />

        {/* 도전 버튼 */}
        <div className="flex flex-col gap-2">
          <button 
            disabled={!isChallengeEnabled || (cfg.challengeLabel === "다시 도전" && !isPlayable)}
            onClick={() => {
              if (cfg.challengeLabel === "다시 도전") {
                if (isPlayable) {
                  setShowRetryModal(true);
                }
              } else {
                onClose();
                const sessionId = Math.random().toString(36).substring(2, 10) + Date.now();
                router.push(`/content/science-exam-prep/solve?typeId=${encodeURIComponent(type.id)}&name=${encodeURIComponent(type.name)}&gradeTerm=${encodeURIComponent(gradeTerm)}&sessionId=${sessionId}`);
              }
            }}
            className={cn(
              "w-full py-3 rounded-xl font-extrabold text-sm transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2",
              cfg.challengeStyle,
              (!isChallengeEnabled || (cfg.challengeLabel === "다시 도전" && !isPlayable)) && "opacity-50 cursor-not-allowed pointer-events-none shadow-none"
            )}
          >
            {cfg.challengeLabel === "왕관 도전" && <Crown className="w-4 h-4 fill-current" />}
            {cfg.challengeLabel === "다시 도전" && <RotateCcw className="w-4 h-4" />}
            {cfg.challengeLabel === "번개 도전" && <Zap className="w-4 h-4 fill-current" />}
            {cfg.challengeLabel}
          </button>

          {/* 출제 예정 문항 수 및 부족 안내 문구 */}
          <div className="text-center text-xs font-bold py-1">
            {!hasEnoughQuestions ? (
              <span className="text-red-500">출제 가능한 문항이 없어요.</span>
            ) : !isAttemptAllowed ? (
              <span className="text-red-500">오늘 이 유형의 도전 횟수를 모두 사용했어요.</span>
            ) : (
              <span className={textMuted}>이번 도전은 {qCount}문항으로 진행돼요.</span>
            )}
          </div>
        </div>

        {/* 도전 버튼 아래 섹션들 (구분선 자동 관리) */}
        {[
          // 1. 대표 유형 동영상
          type.videoUrl ? (
            <div key="video" className="flex flex-col gap-2">
              <h4 className={cn("text-xs font-bold uppercase tracking-widest", textMuted)}>대표 유형 동영상</h4>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200/50 bg-black shadow-inner">
                <iframe
                  src={getYoutubeEmbedUrl(type.videoUrl)}
                  title={`${type.name} 동영상`}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          ) : null,

          // 2. 대표 유형 문제
          type.sampleQuestion ? (
            <div key="sample" className="flex flex-col gap-2.5">
              <h4 className={cn("text-xs font-bold uppercase tracking-widest", textMuted)}>대표 유형 문제</h4>
              <div className={cn(
                "p-4 rounded-xl text-sm leading-relaxed border font-medium",
                isDark ? "bg-slate-800/40 border-slate-700/50 text-slate-200" : "bg-slate-50 border-slate-100 text-slate-700"
              )}>
                <MathRenderer text={type.sampleQuestion} />
              </div>
            </div>
          ) : null,

          // 3. 풀이 이력
          <div key="history" className="flex flex-col gap-2">
            <h4 className={cn("text-xs font-bold uppercase tracking-widest", textMuted)}>최근 풀이 이력</h4>
            {combinedHistory.length > 0 ? (
              <div className="flex flex-col gap-2">
                {combinedHistory.slice(0, 3).map((h, i) => (
                  <div key={i} className={cn(
                    "flex items-center justify-between p-3 rounded-xl border text-xs shadow-sm",
                    isDark ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-100"
                  )}>
                    <div className="flex items-center gap-2">
                      {h.isCorrect ? (
                        <Check className="w-4 h-4 text-green-500 stroke-[3]" />
                      ) : (
                        <X className="w-4 h-4 text-red-500 stroke-[3]" />
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className={cn("font-bold", textPrimary)}>{h.path}</span>
                        <span className={textMuted}>·</span>
                        <span className={cn("font-bold", h.isCorrect ? "text-green-500" : "text-red-500")}>
                          {h.isCorrect ? "정답" : "오답"}
                        </span>
                      </div>
                    </div>
                    <span className={cn("font-medium", textMuted)}>{formatSolvedAt(h.solvedAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={cn(
                "flex flex-col items-center py-8 gap-2.5 rounded-2xl",
                isDark ? "bg-slate-800/60 text-slate-600" : "bg-slate-50 text-slate-400"
              )}>
                <BookOpen className="w-8 h-8 opacity-40" />
                <span className="text-xs font-semibold">아직 풀이 이력이 없어요</span>
              </div>
            )}
          </div>
        ].filter(Boolean).map((section, idx) => (
          <React.Fragment key={idx}>
            <div className={cn("border-t", border)} />
            {section}
          </React.Fragment>
        ))}
      </div>

      {/* 다시 도전 확인 모달 */}
      {showRetryModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowRetryModal(false)}
        >
          <div 
            className={cn(
              "w-full max-w-[280px] rounded-2xl border p-5 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200",
              isDark ? "bg-[#1e293b] border-slate-700 text-white" : "bg-white border-slate-100 text-slate-900"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <h3 className="text-[16px] font-black tracking-tight text-center">
                다시 도전할까요?
              </h3>
              <p className={cn(
                "text-[12px] leading-relaxed text-center break-keep font-medium whitespace-pre-line",
                isDark ? "text-slate-400" : "text-slate-500"
              )}>
                이 유형은 이미 정복한 상태입니다.{"\n"}
                다시 도전 결과에 따라 성취도 상태가 변경될 수 있습니다.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowRetryModal(false)}
                className={cn(
                  "py-3 rounded-xl font-extrabold text-[12.5px] transition-all active:scale-95 shadow-sm border",
                  isDark 
                    ? "bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200" 
                    : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700"
                )}
              >
                취소
              </button>
              <button
                disabled={!isPlayable}
                onClick={() => {
                  setShowRetryModal(false);
                  onClose();
                  const sessionId = Math.random().toString(36).substring(2, 10) + Date.now();
                  router.push(`/content/science-exam-prep/solve?typeId=${encodeURIComponent(type.id)}&name=${encodeURIComponent(type.name)}&gradeTerm=${encodeURIComponent(gradeTerm)}&sessionId=${sessionId}`);
                }}
                className={cn(
                  "py-3 rounded-xl font-extrabold text-[12.5px] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-1.5",
                  isPlayable 
                    ? (isDark 
                        ? "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/25" 
                        : "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20")
                    : (isDark
                        ? "bg-slate-800 text-slate-600 cursor-not-allowed shadow-none pointer-events-none"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none pointer-events-none")
                )}
              >
                다시 도전
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// MAIN PAGE
// =========================================================================
const safeDecode = (val: string | null) => {
  if (!val) return "";
  try {
    return decodeURIComponent(val);
  } catch (e) {
    return val;
  }
};

const safeExtractGradeSemester = (typeId: string | null): string | null => {
  if (!typeId) return null;
  const decoded = safeDecode(typeId);
  const match = decoded.match(/((?:초|중)\d-\d)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
};

function ScienceExamPrepPageContent() {
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedGradeTerm, setSelectedGradeTerm] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return getGradeTerm("science");
    }
    return "중1-1";
  });
  const [selectedTextbooks, setSelectedTextbooks] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<AchievementStatus>>(new Set());
  const [onlyImportant, setOnlyImportant] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);

  const [taskResultHighlightIds, setTaskResultHighlightIds] = useState<string[]>([]);
  const [showBanner, setShowBanner] = useState(false);

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

  // localStorage 학기 변경 이벤트 구독 (사이드바에서 변경 시 동기화)
  useEffect(() => {
    setSelectedGradeTerm(getGradeTerm("science"));
    const cleanup = onGradeTermChange((subject, code) => {
      if (subject === "science") {
        setSelectedGradeTerm(code);
      }
    });
    return cleanup;
  }, []);


  const scienceTasks = tasks.filter(t => t.subject === "science");
  const unstartedCount = scienceTasks.filter(t => t.status === "notStarted").length;

  // refreshTrigger: -1 = 서버/초기(hydration 안전), 0 이상 = 클라이언트에서 localStorage 읽기
  const [refreshTrigger, setRefreshTrigger] = useState(-1);

  // 클라이언트 마운트 후 실제 localStorage status 반영을 위해 trigger 업데이트
  useEffect(() => {
    setRefreshTrigger(0);
  }, []);

  const handleResetData = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("readingmath_student_tasks");
      localStorage.removeItem("readingmath_tasks_seed_version");
      localStorage.removeItem("readingmath_examprep_history_v1");
      localStorage.removeItem(DAILY_ATTEMPTS_KEY);
      sessionStorage.clear();
      window.dispatchEvent(new Event("examprep-history-updated"));
    }
  };
  const searchParams = useSearchParams();
  const selectedTypeIdQuery = searchParams.get("selectedTypeId");

  // 선택된 학기에 맞는 커리큘럼 데이터를 동적으로 파싱하여 생성
  const curriculum = useMemo<BigUnit[]>(() => {
    const rawCurriculum = SCIENCE_CURRICULA.find(c => c.course === selectedGradeTerm);
    if (!rawCurriculum) return [];

    const bigUnits: BigUnit[] = [];
    const bigUnitMap = new Map<string, BigUnit>();
    const subUnitMap = new Map<string, SubUnit>();

    let bigUnitIndex = 0;
    let subUnitIndex = 0;

    rawCurriculum.types.forEach(type => {
      // 대단원 파싱 (예: "1단원 과학과 인류의 지속가능한 삶")
      let badge = "";
      let bigUnitName = type.majorUnit;

      const unitMatch = type.majorUnit.match(/(\d+단원)/);
      if (unitMatch) {
        badge = unitMatch[1];
        const badgeIndex = type.majorUnit.indexOf(badge);
        bigUnitName = type.majorUnit.substring(badgeIndex + badge.length).trim();
      } else {
        const dashIndex = type.majorUnit.indexOf('-');
        if (dashIndex !== -1) {
          badge = type.majorUnit.substring(0, dashIndex).trim();
          bigUnitName = type.majorUnit.substring(dashIndex + 1).trim();
        } else {
          const spaceIndex = type.majorUnit.indexOf(' ');
          if (spaceIndex !== -1) {
            badge = type.majorUnit.substring(0, spaceIndex).trim();
            bigUnitName = type.majorUnit.substring(spaceIndex + 1).trim();
          } else {
            badge = `${bigUnitIndex + 1}단원`;
          }
        }
      }

      let bigUnit = bigUnitMap.get(type.majorUnit);
      if (!bigUnit) {
        bigUnitIndex++;
        const colors = ["bg-cyan-600", "bg-blue-600", "bg-teal-600", "bg-emerald-600", "bg-sky-600"];
        bigUnit = {
          id: `u${bigUnitIndex}`,
          badge,
          name: bigUnitName,
          color: colors[(bigUnitIndex - 1) % colors.length],
          subUnits: []
        };
        bigUnitMap.set(type.majorUnit, bigUnit);
        bigUnits.push(bigUnit);
        subUnitMap.clear();
      }

      let subUnit = subUnitMap.get(type.minorUnit);
      if (!subUnit) {
        subUnitIndex++;
        subUnit = {
          id: `su${subUnitIndex}`,
          name: type.minorUnit,
          basicTypes: [],
          skillTypes: [],
          advancedTypes: []
        };
        subUnitMap.set(type.minorUnit, subUnit);
        bigUnit.subUnits.push(subUnit);
      }

      const hash = hashString(type.id);

      if (type.difficultyCount.basic > 0) {
        subUnit.basicTypes.push({
          id: `${type.id}-basic`,
          name: type.typeName,
          difficulty: "basic",
          isImportant: type.importantCount.basic > 0,
          textbook: type.textbook || "기타",
          status: refreshTrigger < 0 ? "none" : evaluateAchievementStatus(`${type.id}-basic`, "science"),
          videoUrl: type.videoUrl,
          sampleQuestion: type.sampleQuestion,
          availableCount: type.difficultyCount.basic
        });
      }
      if (type.difficultyCount.intermediate > 0) {
        subUnit.skillTypes.push({
          id: `${type.id}-skill`,
          name: type.typeName,
          difficulty: "skill",
          isImportant: type.importantCount.intermediate > 0,
          textbook: type.textbook || "기타",
          status: refreshTrigger < 0 ? "none" : evaluateAchievementStatus(`${type.id}-skill`, "science"),
          videoUrl: type.videoUrl,
          sampleQuestion: type.sampleQuestion,
          availableCount: type.difficultyCount.intermediate
        });
      }
      if (type.difficultyCount.advanced > 0) {
        subUnit.advancedTypes.push({
          id: `${type.id}-advanced`,
          name: type.typeName,
          difficulty: "advanced",
          isImportant: type.importantCount.advanced > 0,
          textbook: type.textbook || "기타",
          status: refreshTrigger < 0 ? "none" : evaluateAchievementStatus(`${type.id}-advanced`, "science"),
          videoUrl: type.videoUrl,
          sampleQuestion: type.sampleQuestion,
          availableCount: type.difficultyCount.advanced
        });
      }
    });

    return bigUnits;
  }, [selectedGradeTerm, refreshTrigger]);

  const [openBigUnits, setOpenBigUnits] = useState<Set<string>>(new Set());
  const [openSubUnits, setOpenSubUnits] = useState<Set<string>>(new Set());
  const [highlightingIds, setHighlightingIds] = useState<Set<string>>(new Set());

  // 학기가 변경되어 curriculum 데이터가 바뀔 때 모든 단원을 자동으로 열어줌 (과제 반영 확인 진입 시에는 해당하는 단원만 펼침)
  useEffect(() => {
    const fromTaskResult = searchParams.get("fromTaskResult") === "true";
    const highlightTypeIdsStr = searchParams.get("highlightTypeIds");

    if (fromTaskResult && highlightTypeIdsStr) {
      const targetIds = highlightTypeIdsStr.split(",").map(id => id.trim());
      const newOpenBigUnits = new Set<string>();
      const newOpenSubUnits = new Set<string>();

      curriculum.forEach(bu => {
        let hasTargetInBigUnit = false;
        bu.subUnits.forEach(su => {
          const allTypes = [...su.basicTypes, ...su.skillTypes, ...su.advancedTypes];
          const hasTargetInSubUnit = allTypes.some(t => targetIds.includes(t.id));
          if (hasTargetInSubUnit) {
            newOpenSubUnits.add(su.id);
            hasTargetInBigUnit = true;
          }
        });
        if (hasTargetInBigUnit) {
          newOpenBigUnits.add(bu.id);
        }
      });

      setOpenBigUnits(newOpenBigUnits);
      setOpenSubUnits(newOpenSubUnits);
    } else {
      setOpenBigUnits(new Set(curriculum.map(u => u.id)));
      setOpenSubUnits(new Set(curriculum.flatMap(u => u.subUnits.map(su => su.id))));
    }
  }, [curriculum, searchParams]);

  const [selectedInfo, setSelectedInfo] = useState<{
    type: TypeData;
    bigUnit: BigUnit;
    subUnit: SubUnit;
  } | null>(null);

  // 실시간 이력 갱신 리스너 등록
  useEffect(() => {
    const handleUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener("examprep-history-updated", handleUpdate);
    return () => window.removeEventListener("examprep-history-updated", handleUpdate);
  }, []);



  // refreshTrigger가 변경될 때 selectedInfo.type 데이터 동기화
  useEffect(() => {
    if (selectedInfo) {
      const targetId = selectedInfo.type.id;
      for (const bu of curriculum) {
        for (const su of bu.subUnits) {
          const foundType = [...su.basicTypes, ...su.skillTypes, ...su.advancedTypes].find(t => t.id === targetId);
          if (foundType) {
            setSelectedInfo(prev => prev ? { ...prev, type: foundType } : null);
            return;
          }
        }
      }
    }
  }, [refreshTrigger, curriculum]);

  // 쿼리 파라미터 selectedTypeId에 기반한 자동 패널 오픈 로직
  useEffect(() => {
    if (selectedTypeIdQuery) {
      const decodedTypeId = safeDecode(selectedTypeIdQuery);
      for (const bu of curriculum) {
        for (const su of bu.subUnits) {
          const foundType = [...su.basicTypes, ...su.skillTypes, ...su.advancedTypes].find(t => t.id === decodedTypeId);
          if (foundType) {
            setSelectedInfo({
              type: foundType,
              bigUnit: bu,
              subUnit: su
            });
            // 해당 유형이 포함된 단원 아코디언 펼침 상태 반영
            setOpenBigUnits(prev => {
              const next = new Set(prev);
              next.add(bu.id);
              return next;
            });
            setOpenSubUnits(prev => {
              const next = new Set(prev);
              next.add(su.id);
              return next;
            });
            return;
          }
        }
      }
    }
  }, [selectedTypeIdQuery, curriculum]);

  // 1단계: 진입 조건 감지 및 학기/필터/배너 설정 (safeDecode 및 safeExtractGradeSemester 활용)
  useEffect(() => {
    const fromTaskResult = searchParams.get("fromTaskResult") === "true";
    const source = searchParams.get("source");
    const gradeSemesterQuery = searchParams.get("gradeSemester");
    const gradeTermQuery = searchParams.get("gradeTerm");
    const selectedTypeIdQuery = searchParams.get("selectedTypeId");

    // 우선순위 1: gradeSemester 혹은 gradeTerm 쿼리 값
    let targetGradeTerm = safeDecode(gradeSemesterQuery || gradeTermQuery);

    // 우선순위 2: selectedTypeId에서 추출한 학습과정
    if (!targetGradeTerm && selectedTypeIdQuery) {
      const extracted = safeExtractGradeSemester(selectedTypeIdQuery);
      if (extracted) {
        targetGradeTerm = extracted;
      }
    }

    // 우선순위 3: targetGradeTerm이 있는 경우에만 selectedGradeTerm 업데이트 (기존 selectedGradeTerm 유지)
    if (targetGradeTerm && selectedGradeTerm !== targetGradeTerm) {
      setSelectedGradeTerm(targetGradeTerm);
    }

    // 과제 센터 유입인 경우 필터 초기화 및 배너 활성화
    if (fromTaskResult && source === "task-center") {
      setSelectedTextbooks(new Set());
      setSelectedStatuses(new Set());
      setOnlyImportant(false);
      setShowBanner(true);
    }
  }, [searchParams]);

  // 2단계: 학기 일치 및 curriculum 로딩 완료 후 단원 펼침, 하이라이트 설정, 스크롤 이동
  useEffect(() => {
    const fromTaskResult = searchParams.get("fromTaskResult") === "true";
    const source = searchParams.get("source");
    const gradeSemesterQuery = searchParams.get("gradeSemester");
    const highlightTypeIdsStr = searchParams.get("highlightTypeIds");

    if (fromTaskResult && source === "task-center" && gradeSemesterQuery && highlightTypeIdsStr) {
      const gradeSemester = safeDecode(gradeSemesterQuery);

      if (selectedGradeTerm === gradeSemester && curriculum.length > 0) {
        const decodedIds = safeDecode(highlightTypeIdsStr);
        const targetIds = decodedIds.split(",").map(id => id.trim()).filter(Boolean);

        setTaskResultHighlightIds(targetIds);

        const normalize = (id: string) => id.replace(/-(basic|skill|advanced)$/, "");
        const isTypeMatched = (typeId: string, targets: string[]) => {
          return targets.some(tid => {
            if (typeId === tid) return true;
            return normalize(typeId) === normalize(tid);
          });
        };

        // 반영 대상 유형칩들이 포함된 단원만 열고 나머지는 닫음
        const toOpenBigUnits = new Set<string>();
        const toOpenSubUnits = new Set<string>();
        const highlightIds = new Set<string>();

        curriculum.forEach(bu => {
          bu.subUnits.forEach(su => {
            const allTypes = [...su.basicTypes, ...su.skillTypes, ...su.advancedTypes];
            let hasMatched = false;
            allTypes.forEach(t => {
              if (isTypeMatched(t.id, targetIds)) {
                highlightIds.add(t.id);
                hasMatched = true;
              }
            });
            if (hasMatched) {
              toOpenBigUnits.add(bu.id);
              toOpenSubUnits.add(su.id);
            }
          });
        });

        if (highlightIds.size > 0) {
          setOpenBigUnits(toOpenBigUnits);
          setOpenSubUnits(toOpenSubUnits);
          setHighlightingIds(highlightIds);

          // 3초 후 강조 클래스 제거 (정적 배지는 유지)
          const timer = setTimeout(() => {
            setHighlightingIds(new Set());
          }, 3000);

          // 첫 번째 반영 대상 유형칩으로 스크롤 이동
          let firstTargetId: string | null = null;
          for (const bu of curriculum) {
            for (const su of bu.subUnits) {
              const allTypes = [...su.basicTypes, ...su.skillTypes, ...su.advancedTypes];
              const found = allTypes.find(t => highlightIds.has(t.id));
              if (found) {
                firstTargetId = found.id;
                break;
              }
            }
            if (firstTargetId) break;
          }

          let scrollTimer: NodeJS.Timeout;
          if (firstTargetId) {
            scrollTimer = setTimeout(() => {
              try {
                const el = document.getElementById(`type-chip-${firstTargetId}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              } catch (e) {
                // 스크롤 실패 시 화면 오류 무시
              }
            }, 300);
          }

          return () => {
            clearTimeout(timer);
            if (scrollTimer) clearTimeout(scrollTimer);
          };
        }
      }
    }
  }, [searchParams, curriculum, selectedGradeTerm]);

  // 배너 닫기 처리 (배너만 비노출, 배지 및 아코디언은 유지)
  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  // 상세 패널이 열려 있을 때 body 스크롤 차단 (이중 스크롤바 방지)
  useEffect(() => {
    if (selectedInfo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedInfo]);

  // 안내 팝오버 외부 클릭 닫기
  useEffect(() => {
    if (!showGuide) return;
    const handler = (e: MouseEvent) => {
      if (guideRef.current && !guideRef.current.contains(e.target as Node)) {
        setShowGuide(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showGuide]);

  const isFilterDefault =
    selectedTextbooks.size === 0 &&
    selectedStatuses.size === 0 &&
    !onlyImportant &&
    selectedGradeTerm === "중1-1";

  const handleReset = () => {
    setSelectedTextbooks(new Set());
    setSelectedStatuses(new Set());
    setOnlyImportant(false);
    setSelectedGradeTerm("중1-1");
    setSelectedInfo(null);
  };

  const toggleBigUnit = (id: string) =>
    setOpenBigUnits(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleSubUnit = (id: string) =>
    setOpenSubUnits(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleTextbook = (tb: string) =>
    setSelectedTextbooks(prev => { const n = new Set(prev); n.has(tb) ? n.delete(tb) : n.add(tb); return n; });

  const toggleStatus = (s: AchievementStatus) =>
    setSelectedStatuses(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });

  // 필터링된 커리큘럼
  const filtered = useMemo(() => {
    const fromTaskResult = searchParams.get("fromTaskResult") === "true";
    const source = searchParams.get("source");
    const gradeSemesterQuery = searchParams.get("gradeSemester");

    return curriculum.map(bu => ({
      ...bu,
      subUnits: bu.subUnits.map(su => {
        const f = (t: TypeData) => {
          // fromTaskResult=true 진입 상태에서만 적용
          if (fromTaskResult && source === "task-center" && gradeSemesterQuery) {
            const decodedGradeSemester = safeDecode(gradeSemesterQuery);
            if (selectedGradeTerm === decodedGradeSemester) {
              const normalize = (id: string) => id.replace(/-(basic|skill|advanced)$/, "");
              const isTaskResultHighlight = taskResultHighlightIds.some(tid => {
                if (t.id === tid) return true;
                return normalize(t.id) === normalize(tid);
              });
              if (isTaskResultHighlight) return true;
            }
          }

          return (selectedTextbooks.size === 0 || selectedTextbooks.has(t.textbook)) &&
            (selectedStatuses.size === 0 || selectedStatuses.has(t.status)) &&
            (!onlyImportant || t.isImportant);
        };
        return {
          ...su,
          basicTypes: su.basicTypes.filter(f),
          skillTypes: su.skillTypes.filter(f),
          advancedTypes: su.advancedTypes.filter(f),
        };
      }).filter(su => su.basicTypes.length > 0 || su.skillTypes.length > 0 || su.advancedTypes.length > 0),
    })).filter(bu => bu.subUnits.length > 0);
  }, [curriculum, selectedTextbooks, selectedStatuses, onlyImportant, taskResultHighlightIds, searchParams, selectedGradeTerm]);


  // 테마 (과제 센터 스타일에 맞춤)
  const bg = isDark ? "bg-[#070b1c]" : "bg-[#f1f5f9]";
  const card = isDark ? "bg-[#1e293b] border-slate-700" : "bg-white border-slate-200";
  const filterBg = isDark ? "bg-[#070b1c]/90 border-white/[0.06]" : "bg-white/95 border-slate-200/80";
  const headerBg = isDark ? "bg-[#070b1c]/80 border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.4)]" : "bg-white/95 border-slate-200/80 shadow-[0_2px_15px_rgba(0,0,0,0.04)]";
  const textPrimary = isDark ? "text-white" : "text-slate-800";
  const textMuted = isDark ? "text-slate-400" : "text-slate-500";
  const inputBg = isDark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700";
  const chipDefault = isDark ? "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50";
  const divBorder = isDark ? "border-slate-700" : "border-slate-100";
  const subBg = isDark ? "bg-slate-800/60 border-slate-700" : "bg-slate-50 border-slate-200";
  const tabTextStyle = isDark ? "text-[#94a3b8] hover:text-white" : "text-slate-600 hover:text-slate-900";

  return (
    <div className={cn("min-h-screen w-full font-sans", bg, isDark ? "text-slate-100" : "text-slate-900")}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-exam-highlight {
          0% {
            box-shadow: 0 0 0 2px white, 0 0 0 4px #8b5cf6, 0 0 8px rgba(139, 92, 246, 0.5);
            transform: scale(1.1);
          }
          50% {
            box-shadow: 0 0 0 4px white, 0 0 0 8px #d946ef, 0 0 20px rgba(217, 70, 239, 0.8);
            transform: scale(1.18);
          }
          100% {
            box-shadow: 0 0 0 2px white, 0 0 0 4px #8b5cf6, 0 0 8px rgba(139, 92, 246, 0.5);
            transform: scale(1.1);
          }
        }
        .exam-prep-highlight-active {
          animation: pulse-exam-highlight 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          z-index: 30 !important;
          border-radius: 8px !important;
          transition: all 0.3s ease;
        }
      `}} />

      {/* ===== GNB 헤더 (과제 센터와 동일 스타일) ===== */}
      <header className={`fixed top-0 left-0 right-0 h-[56px] ${headerBg} backdrop-blur-md border-b z-40 flex items-center justify-between px-6 transition-all duration-300`}>
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer flex-shrink-0 group">
          <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 p-[1.5px] transition-transform duration-300 group-hover:scale-105">
            <div className={`flex h-full w-full items-center justify-center rounded-[6px] ${isDark ? "bg-[#0c0926]" : "bg-white"}`}>
              <svg viewBox="0 0 100 100" className="h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg">
                <path d="M 50,10 L 55,45 L 90,50 L 55,55 L 50,90 L 45,55 L 10,50 L 45,45 Z" fill="url(#scienceLogoGrad)" />
                <defs>
                  <linearGradient id="scienceLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <span className={`text-[17px] font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"} whitespace-nowrap select-none`}>
            진리딩
          </span>
        </Link>

        {/* 탭 메뉴 */}
        <div className="flex items-end gap-1 h-full">
          <Link href="/content/science-home" className="h-[44px] flex items-center">
            <div className={`${tabTextStyle} px-5 py-2 text-[14px] font-bold min-w-[90px] text-center cursor-pointer transition-all duration-200 hover:-translate-y-[1px] select-none`}>
              기본 모드
            </div>
          </Link>
          <div className="h-[44px] flex items-center">
            <div className={`${isDark ? "text-[#94a3b8]" : "text-slate-600"} px-5 py-2 text-[14px] font-bold min-w-[90px] text-center select-none cursor-default`}>
              자유 모드
            </div>
          </div>
          {/* 시험 대비 - 활성 탭 */}
          <div className={`relative bg-[#0084ff] shadow-[0_-4px_20px_rgba(0,132,255,0.25)] border-[#38bdf8]/35 text-white px-6 h-[44px] rounded-t-[12px] rounded-b-none text-[14px] font-black flex items-center justify-center min-w-[95px] select-none border-t border-x`}>
            <span>시험 대비</span>
          </div>
          <Link href="/content/science-task-center" className="h-[44px] flex items-center">
            <div className={`relative ${tabTextStyle} px-5 py-2 text-[14px] font-bold min-w-[90px] text-center cursor-pointer transition-all duration-200 hover:-translate-y-[1px] select-none`}>
              <span>과제 센터</span>
              {unstartedCount > 0 && (
                <span className="absolute top-[10px] right-[2px] h-2 w-2 bg-[#ef4444] rounded-full animate-pulse" />
              )}
            </div>
          </Link>
        </div>

        {/* 우측 아이콘 */}
        <div className={`flex items-center gap-[20px] ${isDark ? "text-[#94a3b8]" : "text-slate-500"}`}>
          <HelpCircle className={`h-[20px] w-[20px] ${isDark ? "hover:text-white" : "hover:text-slate-900"} transition-colors cursor-pointer`} />
          <div className="relative cursor-pointer group">
            <Siren className={`h-[20px] w-[20px] ${isDark ? "hover:text-white" : "hover:text-slate-900"} transition-colors`} />
            <span className="absolute top-0 right-0 h-1.5 w-1.5 bg-[#ef4444] rounded-full animate-pulse" />
          </div>
          <Megaphone className={`h-[20px] w-[20px] ${isDark ? "hover:text-white" : "hover:text-slate-900"} transition-colors cursor-pointer`} />
          <Menu className={`h-[20px] w-[20px] ${isDark ? "hover:text-white" : "hover:text-slate-900"} transition-colors cursor-pointer`} onClick={() => setIsSidebarOpen(true)} />
        </div>
      </header>

      {/* ===== 타이틀 영역 (과제 센터 스타일) ===== */}
      <div className="w-full px-6 pt-[76px] pb-1 z-10">
        <div className="flex flex-wrap items-center gap-3.5 pb-2">
          <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>시험 대비</h1>
          <Link href="/content/math-exam-prep">
            <span className={`px-3 py-0.5 ${isDark ? 'bg-gradient-to-r from-[#06b6d4]/20 to-[#0891b2]/20 text-[#22d3ee] border-[#06b6d4]/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-cyan-50 text-[#0891b2] border-[#a5f3fc]'} text-[12px] font-black rounded-full border cursor-pointer hover:opacity-80 transition-opacity`}>과학</span>
          </Link>

          {/* 데이터 초기화 버튼 (과제 센터 스타일과 100% 동일) */}
          <button
            onClick={handleResetData}
            className={`flex items-center gap-1 px-3 py-0.5 rounded-full border text-[12px] font-black shadow-sm transition-all active:scale-95 cursor-pointer ${
              isDark 
                ? 'bg-white/[0.02] border-white/[0.08] text-[#94a3b8] hover:text-white hover:bg-white/[0.06]' 
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="진행 기록 및 성취도 초기화"
          >
            <RotateCcw className="h-3 w-3" />
            <span>데이터 초기화</span>
          </button>
        </div>
      </div>

      {/* ===== 필터 바 (sticky, top-[56px]) ===== */}
      <div className={cn("sticky top-[56px] z-30 w-full px-6 py-3 backdrop-blur-md border-b transition-all duration-300", filterBg)}>
        {/* 필터 행 */}
        <div className="w-full flex items-center gap-2 flex-wrap">
          {/* 학년-학기 */}
          <select
            value={selectedGradeTerm}
            onChange={e => { setSelectedGradeTerm(e.target.value); setGradeTerm("science", e.target.value); setSelectedInfo(null); }}
            className={cn("h-7 px-3 text-xs font-bold rounded-full border outline-none cursor-pointer", inputBg)}
          >
            {GRADE_TERMS.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
          </select>

          {/* 구분 */}
          <div className={cn("h-5 w-px", isDark ? "bg-slate-600" : "bg-slate-200")} />

          {/* 교과서 칩 (복수 선택) */}
          {SCIENCE_TEXTBOOKS.map(tb => {
            const sel = selectedTextbooks.has(tb);
            return (
              <button key={tb} onClick={() => toggleTextbook(tb)}
                className={cn(
                  "h-7 px-2.5 text-xs font-bold rounded-full border transition-all",
                  sel ? "bg-blue-600 border-blue-600 text-white" : chipDefault
                )}>
                {tb}
              </button>
            );
          })}

          {/* 구분 */}
          <div className={cn("h-5 w-px", isDark ? "bg-slate-600" : "bg-slate-200")} />

          {/* 성취도 칩 (복수 선택, 아이콘 포함) */}
          {ALL_STATUSES.map(status => {
            const cfg = ACHIEVEMENT_CONFIG[status];
            const sel = selectedStatuses.has(status);
            return (
              <button key={status} onClick={() => toggleStatus(status)}
                className={cn(
                  "h-7 px-2.5 text-xs font-bold rounded-full border transition-all flex items-center gap-1",
                  sel
                    ? "bg-blue-600 border-blue-600 text-white"
                    : chipDefault
                )}>
                <AchievementIcon status={status} className={cn("w-3 h-3", sel ? "text-white stroke-white" : cfg.filterIconColor)} />
                <span className={sel ? "text-white" : cfg.filterTextColor}>{cfg.shortLabel}</span>
              </button>
            );
          })}

          {/* 안내 버튼 + 팝오버 */}
          <div ref={guideRef} className="relative">
            <button onClick={() => setShowGuide(v => !v)}
              className={cn(
                "h-7 px-2.5 text-xs font-bold rounded-full border flex items-center gap-1 transition-all",
                showGuide
                  ? isDark ? "bg-slate-600 border-slate-500 text-white" : "bg-slate-100 border-slate-300 text-slate-700"
                  : chipDefault
              )}>
              <Info className="w-3 h-3" />안내
            </button>
            {showGuide && (
              <div className={cn(
                "absolute left-0 top-9 w-72 rounded-2xl shadow-2xl border p-4 z-50 flex flex-col gap-2.5",
                isDark ? "bg-[#1e293b] border-slate-600" : "bg-white border-slate-200"
              )}>
                <h4 className={cn("text-xs font-extrabold mb-0.5 flex items-center gap-1.5", textMuted)}>
                  <Info className="w-3.5 h-3.5" />성취도 안내
                </h4>
                {ALL_STATUSES.map(s => {
                  const cfg = ACHIEVEMENT_CONFIG[s];
                  return (
                    <div key={s} className="flex items-start gap-2.5">
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        cfg.chipBg, s === "none" && "border border-slate-200"
                      )}>
                        <AchievementIcon status={s} className={cn("w-3.5 h-3.5", cfg.chipIconColor)} />
                      </div>
                      <div>
                        <p className={cn("text-xs font-bold", textPrimary)}>{cfg.label}</p>
                        <p className={cn("text-xs mt-0.5", textMuted)}>{cfg.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 우측 그룹 */}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setOnlyImportant(v => !v)}
              className={cn(
                "h-7 px-2.5 text-xs font-bold rounded-full border flex items-center gap-1.5 transition-all",
                onlyImportant
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : chipDefault
              )}>
              <Star className={cn("w-3 h-3", onlyImportant ? "fill-amber-400 text-amber-400" : isDark ? "text-slate-500" : "text-slate-400")} />
              중요 유형만 보기
            </button>
            <button onClick={handleReset} disabled={isFilterDefault}
              className={cn(
                "h-7 px-2.5 text-xs font-bold rounded-full border flex items-center gap-1 transition-all",
                isFilterDefault ? "opacity-35 cursor-not-allowed" : "cursor-pointer",
                chipDefault
              )}>
              <RotateCcw className="w-3 h-3" />초기화
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 flex items-center p-1 cursor-pointer select-none focus:outline-none shadow-sm ${
                isDark ? 'bg-[#1e293b] border border-white/[0.08]' : 'bg-[#cbd5e1] border border-slate-300'
              }`}
            >
              {/* 토글 볼 */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 transform shadow-sm ${
                  isDark ? 'translate-x-7 bg-[#334155]' : 'translate-x-0 bg-white'
                }`}
              >
                {isDark ? (
                  <span className="text-[10px] select-none">🌙</span>
                ) : (
                  <span className="text-[10px] select-none">☀️</span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ===== 메인 콘텐츠 ===== */}
      <main className="w-full px-6 pt-5 pb-32 flex flex-col gap-3">
        {showBanner && (
          <div className={cn(
            "flex items-center justify-between px-5 py-4 rounded-2xl border shadow-sm transition-all animate-in fade-in slide-in-from-top-4 duration-300",
            isDark 
              ? "bg-emerald-950/40 border-emerald-900/60 text-emerald-200" 
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          )}>
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 shrink-0 text-emerald-500" />
              <div className="text-sm font-bold leading-normal">
                <div>과제 결과가 시험 대비에 반영되었습니다.</div>
                <div className={cn("text-xs font-semibold mt-0.5", isDark ? "text-emerald-300/80" : "text-emerald-600")}>
                  반영된 유형을 확인해 보세요.
                </div>
              </div>
            </div>
            <button
              onClick={handleCloseBanner}
              className={cn(
                "p-1.5 rounded-lg hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer",
                isDark ? "hover:bg-white/5 active:bg-white/10" : ""
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Info className={cn("w-12 h-12 opacity-20", textMuted)} />
            <span className={cn("text-sm font-bold opacity-50", textMuted)}>조건에 맞는 유형이 없어요. 필터를 변경해 보세요.</span>
          </div>
        ) : (
          filtered.map(bigUnit => (
            <div key={bigUnit.id} className={cn("rounded-2xl overflow-hidden border transition-all duration-200", card)}>

              {/* 대단원 헤더 */}
              <div
                onClick={() => toggleBigUnit(bigUnit.id)}
                className={cn(
                  "flex items-center justify-between px-5 py-3 cursor-pointer select-none transition-colors",
                  isDark ? "hover:bg-slate-700/40" : "hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn("px-2.5 py-0.5 rounded-full text-white text-xs font-extrabold tracking-wide", bigUnit.color)}>
                    {bigUnit.badge}
                  </span>
                  <h2 className={cn("text-[15px] font-extrabold tracking-tight", textPrimary)}>{bigUnit.name}</h2>
                </div>
                {openBigUnits.has(bigUnit.id)
                  ? <ChevronUp className={cn("w-4 h-4", textMuted)} />
                  : <ChevronDown className={cn("w-4 h-4", textMuted)} />
                }
              </div>

              {/* 대단원 바디 */}
              {openBigUnits.has(bigUnit.id) && (
                <div className={cn("border-t", divBorder)}>
                  {bigUnit.subUnits.map(subUnit => (
                    <div key={subUnit.id} className={cn("border-b last:border-b-0", divBorder)}>

                      {/* 소단원 헤더 */}
                      <div
                        onClick={() => toggleSubUnit(subUnit.id)}
                        className={cn(
                          "flex items-center justify-between px-5 py-2.5 cursor-pointer select-none transition-colors",
                          isDark ? "hover:bg-slate-700/30" : "hover:bg-slate-50/60"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
                            openSubUnits.has(subUnit.id) ? "bg-indigo-500" : isDark ? "bg-slate-600" : "bg-slate-300"
                          )} />
                          <span className={cn("text-sm font-bold", isDark ? "text-slate-300" : "text-slate-700")}>
                            {subUnit.name}
                          </span>
                        </div>
                        {openSubUnits.has(subUnit.id)
                          ? <ChevronUp className="w-4 h-4 text-slate-400" />
                          : <ChevronDown className="w-4 h-4 text-slate-400" />
                        }
                      </div>

                      {/* 소단원 바디 - 3열 (기본/실력/심화) */}
                      {openSubUnits.has(subUnit.id) && (
                        <div className="grid grid-cols-3 gap-3 px-5 pb-4 pt-1">
                          {[
                            { label: "기본", types: subUnit.basicTypes },
                            { label: "실력", types: subUnit.skillTypes },
                            { label: "심화", types: subUnit.advancedTypes },
                          ].map(({ label, types }) => (
                            <div key={label} className={cn("rounded-xl border overflow-hidden", subBg)}>
                              <div className={cn(
                                "px-3 py-2 border-b text-xs font-bold",
                                isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-600"
                              )}>
                                {label}
                              </div>
                              <div className="flex flex-wrap gap-1.5 p-2.5 min-h-[56px] content-start">
                                {types.length > 0 ? (
                                  types.map(t => (
                                    <TypeChip
                                      key={t.id}
                                      type={t}
                                      isSelected={selectedInfo?.type.id === t.id}
                                      isDark={isDark}
                                      isHighlighted={highlightingIds.has(t.id)}
                                      isTaskResultHighlight={
                                        taskResultHighlightIds.includes(t.id) ||
                                        taskResultHighlightIds.includes(t.id.replace(/-(basic|skill|advanced)$/, ""))
                                      }
                                      onClick={() => {
                                        if (selectedInfo?.type.id === t.id) {
                                          setSelectedInfo(null);
                                        } else {
                                          setSelectedInfo({ type: t, bigUnit, subUnit });
                                        }
                                      }}
                                    />
                                  ))
                                ) : (
                                  <span className={cn("text-xs py-2 w-full text-center", textMuted)}>없음</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </main>

      {/* ===== 우측 슬라이드 패널 (항상 렌더, CSS로 show/hide) ===== */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-[480px] z-50 transition-transform duration-200 ease-in-out shadow-2xl border-l",
        isDark ? "bg-[#1e293b] border-slate-700" : "bg-white border-slate-200",
        selectedInfo ? "translate-x-0" : "translate-x-full"
      )}>
        {selectedInfo && (
          <DetailPanel
            type={selectedInfo.type}
            bigUnit={selectedInfo.bigUnit}
            subUnit={selectedInfo.subUnit}
            onClose={() => setSelectedInfo(null)}
            isDark={isDark}
            gradeTerm={selectedGradeTerm}
          />
        )}
      </div>
      <StudentSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        subject="science"
        gradeTerm={gradeTermToLabel(selectedGradeTerm)}
      />
    </div>
  );
}

export default function ScienceExamPrepPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500 font-bold">로딩 중...</div>}>
      <ScienceExamPrepPageContent />
    </Suspense>
  );
}
