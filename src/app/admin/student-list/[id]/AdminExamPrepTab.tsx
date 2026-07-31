"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Search,
  RotateCcw,
  Trash2,
  Eye,
  X,
  Star,
  Crown,
  Check,
  AlertTriangle,
  Info,
  Calendar,
  BookOpen,
  Filter,
  RefreshCw,
  Zap,
} from "lucide-react";
import { StudentServiceType } from "@/lib/student-mock";
import { MATH_CURRICULA, SCIENCE_CURRICULA } from "@/lib/task-center-mock";
import {
  MOCK_EXAM_PREP_HISTORY,
  MOCK_TASK_RESULTS,
  MockExamPrepHistory,
  MockTaskResult,
} from "@/app/admin/task-center/status/mockData";
import {
  getAdminDeletedIds,
  addAdminDeletedId,
  addAdminDeletedIds,
  addAdminResetRecord,
  ResetScope,
} from "./adminExamPrepStorage";
import {
  getMockHistoryForType,
  MATH_TYPE_TO_QUESTIONS,
  SCIENCE_TYPE_TO_QUESTIONS,
} from "@/utils/examPrepStorage";
import { getStoredTasks } from "@/utils/taskStorage";
import { getTaskResult } from "@/utils/taskResultStorage";
import { getQuestionsByTaskId } from "@/lib/task-solve-mock";
import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";

function MathRenderer({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = text.replace(/\n/g, "<br />");
    try {
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
    } catch (e) {
      console.error("KaTeX rendering error", e);
    }
  }, [text]);

  return <div ref={ref} className={className} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & TYPES
// ─────────────────────────────────────────────────────────────────────────────

const HISTORY_LOCAL_KEY = "readingmath_examprep_history_v1"; // 읽기 전용

type AchievementStatus =
  | "none"
  | "undetermined"
  | "relearn"
  | "supplement"
  | "understand"
  | "master";

type Difficulty = "basic" | "skill" | "advanced";
type PathType = "시험 대비" | "과제 센터";
type ChallengeType = "초록 도전" | "왕관 도전" | "다시 도전" | "과제 센터 반영";
type ViewMode = "history" | "achievement";
type Subject = "math" | "science";

interface LocalExamPrepItem {
  id: string;
  typeId: string;
  questionId: string;
  path: PathType;
  isCorrect: boolean;
  submittedAnswer: string;
  solvedAt: string;
  submitted?: boolean;
}

// 풀이이력 목록 행 타입
interface HistoryRow {
  rowId: string;           // 데이터 출처 포함: mock-exam-{id}, local-exam-{index}, task-{taskId}-{typeId}
  source: "mock-exam" | "local-exam" | "task";
  solvedAt: string;
  gradeTerm: string;       // 예: "중1-1"
  majorUnit: string;       // 대단원명
  minorUnit: string;       // 소단원명(수학) or 중단원명(과학)
  typeName: string;
  typeId: string;          // fullTypeId (e.g. "mt-중1-1-0-1-1-basic")
  difficulty: Difficulty;
  path: PathType;
  challengeType: ChallengeType;
  problemCount: number;
  correctCount: number;
  achievementStatus: AchievementStatus; // 이 기록 반영 후 성취도
}

const MATH_TEXTBOOKS = ["아이스크림", "천재", "비상", "미래엔", "동아", "지학사"];
const SCIENCE_TEXTBOOKS = ["오투", "완자", "오투+완자", "기타"];

// 성취도 현황 커리큘럼 유형 타입
interface TypeData {
  id: string;
  name: string;
  difficulty: Difficulty;
  isImportant: boolean;
  status: AchievementStatus;
  majorUnit: string;
  minorUnit: string;
  gradeTerm: string;
  textbook: string;
  videoUrl?: string;
  sampleQuestion?: string;
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

// 커리큘럼 모달용 트리 노드
interface CurriculumTreeNode {
  id: string;
  label: string;
  type: "gradeTerm" | "bigUnit" | "minorUnit" | "typeNode";
  children?: CurriculumTreeNode[];
  typeId?: string;
  gradeTerm?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENT CONFIG
// ─────────────────────────────────────────────────────────────────────────────

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
  badgeBg: string;
  badgeText: string;
}

const ACHIEVEMENT_CONFIG: Record<AchievementStatus, AchievementInfo> = {
  none: {
    label: "미진행", shortLabel: "미진행", icon: "question",
    chipBg: "bg-white", chipBorder: "border-2 border-dashed border-slate-300", chipIconColor: "text-slate-300",
    filterIconColor: "text-slate-300", filterTextColor: "text-slate-500",
    selBg: "bg-slate-700", selBorder: "border-slate-700", selText: "text-white",
    description: "아직 학습을 시작하지 않았어요.",
    challengeLabel: "번개 도전", challengeStyle: "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30",
    badgeBg: "bg-slate-100", badgeText: "text-slate-600",
  },
  undetermined: {
    label: "미판정", shortLabel: "미판정", icon: "question",
    chipBg: "bg-slate-300", chipBorder: "border-transparent", chipIconColor: "text-slate-500",
    filterIconColor: "text-slate-500", filterTextColor: "text-slate-600",
    selBg: "bg-slate-500", selBorder: "border-slate-500", selText: "text-white",
    description: "학습량이 부족해요.",
    challengeLabel: "번개 도전", challengeStyle: "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30",
    badgeBg: "bg-slate-200", badgeText: "text-slate-700",
  },
  relearn: {
    label: "재학습 필요", shortLabel: "재학습", icon: "x",
    chipBg: "bg-red-500", chipBorder: "border-transparent", chipIconColor: "text-white",
    filterIconColor: "text-red-500", filterTextColor: "text-red-600",
    selBg: "bg-red-500", selBorder: "border-red-500", selText: "text-white",
    description: "전혀 이해하지 못하고 있어요.",
    challengeLabel: "번개 도전", challengeStyle: "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30",
    badgeBg: "bg-red-100", badgeText: "text-red-700",
  },
  supplement: {
    label: "보충 필요", shortLabel: "보충", icon: "alert",
    chipBg: "bg-yellow-500", chipBorder: "border-transparent", chipIconColor: "text-white",
    filterIconColor: "text-yellow-500", filterTextColor: "text-yellow-600",
    selBg: "bg-yellow-500", selBorder: "border-yellow-500", selText: "text-white",
    description: "이해도가 낮은 상태예요.",
    challengeLabel: "번개 도전", challengeStyle: "bg-green-500 hover:bg-green-600 text-white shadow-green-500/30",
    badgeBg: "bg-yellow-100", badgeText: "text-yellow-700",
  },
  understand: {
    label: "유형 이해", shortLabel: "이해", icon: "zap",
    chipBg: "bg-green-400", chipBorder: "border-transparent", chipIconColor: "text-white",
    filterIconColor: "text-green-500", filterTextColor: "text-green-600",
    selBg: "bg-green-500", selBorder: "border-green-500", selText: "text-white",
    description: "충분히 이해하여 문제를 풀 수 있어요.",
    challengeLabel: "왕관 도전", challengeStyle: "bg-green-600 hover:bg-green-700 text-white shadow-green-500/30",
    badgeBg: "bg-green-100", badgeText: "text-green-700",
  },
  master: {
    label: "유형 정복", shortLabel: "정복", icon: "crown",
    chipBg: "bg-green-600", chipBorder: "border-transparent", chipIconColor: "text-white",
    filterIconColor: "text-green-700", filterTextColor: "text-green-700",
    selBg: "bg-green-700", selBorder: "border-green-700", selText: "text-white",
    description: "완전히 이해하고 있어요.",
    challengeLabel: "다시 도전", challengeStyle: "bg-slate-500 hover:bg-slate-600 text-white shadow-slate-500/30",
    badgeBg: "bg-green-200", badgeText: "text-green-800",
  },
};

const ALL_STATUSES: AchievementStatus[] = [
  "none", "undetermined", "relearn", "supplement", "understand", "master",
];

const DIFF_LABEL: Record<Difficulty, string> = {
  basic: "기본", skill: "실력", advanced: "심화",
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function toGradeTerm(grade: string, semester: string): string {
  const semNum = semester === "2학기" ? "2" : "1";
  if (grade.startsWith("초등")) {
    const n = grade.replace("초등 ", "").trim();
    return `초${n}-${semNum}`;
  }
  if (grade.startsWith("중등")) {
    const n = grade.replace("중등 ", "").trim();
    return `중${n}-${semNum}`;
  }
  return "중1-1";
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}.${mo}.${dd} ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

function formatDateOnly(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}.${mo}.${dd}`;
  } catch {
    return iso;
  }
}

function extractDifficulty(typeId: string): Difficulty {
  if (typeId.endsWith("-basic")) return "basic";
  if (typeId.endsWith("-advanced")) return "advanced";
  return "skill";
}

function purifyTypeId(typeId: string): string {
  return typeId.replace(/-(basic|skill|advanced)$/, "");
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
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

/** 성취도 재계산 — 삭제된 rowId 제외 후 판정 (evaluateStudentAchievement와 동일 로직) */
function evaluateWithExclusion(
  historyItems: { isCorrect: boolean; rowId: string }[],
  deletedIds: string[]
): AchievementStatus {
  const filtered = historyItems.filter((h) => !deletedIds.includes(h.rowId));
  if (filtered.length === 0) return "none";
  if (filtered.length === 1) return "undetermined";
  const [h0, h1] = filtered;
  if (filtered.length >= 3 && h0.isCorrect && h1.isCorrect && filtered[2].isCorrect)
    return "master";
  if (h0.isCorrect && h1.isCorrect) return "understand";
  if (!h0.isCorrect && !h1.isCorrect) return "relearn";
  return "supplement";
}

// 커리큘럼에서 typeId → 대단원/소단원 찾기
function findTypeInfo(
  typeId: string,
  subject: Subject
): { majorUnit: string; minorUnit: string; gradeTerm: string } | null {
  const pureId = purifyTypeId(typeId);
  const normalizedId = normalizeTypeIdForMatch(typeId);
  const curricula = subject === "math" ? MATH_CURRICULA : SCIENCE_CURRICULA;
  for (const course of curricula) {
    const found = course.types.find(
      (t) => t.id === pureId || t.id === typeId || t.id === normalizedId
    );
    if (found) {
      return {
        majorUnit: found.majorUnit,
        minorUnit: found.minorUnit,
        gradeTerm: course.course,
      };
    }
  }
  return null;
}

// MOCK 데이터 정규화 (ID 불일치 보정)
function normalizeTypeIdForMatch(id: string): string {
  const clean = purifyTypeId(id);
  if (clean === "mt-중1-1-0-1-1") return "mt-중1-1-0-0";
  if (clean === "mt-중1-1-0-2-1") return "mt-중1-1-0-1";
  if (clean === "mt-중1-1-0-2-2") return "mt-중1-1-0-2";
  if (clean === "mt-중1-1-0-2-3") return "mt-중1-1-0-3";
  return clean;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

/** readingmath_examprep_history_v1 읽기 (읽기 전용, 쓰기 없음) */
function readLocalExamPrepHistory(): LocalExamPrepItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalExamPrepItem[];
  } catch {
    return [];
  }
}

/**
 * 풀이이력 목록 구성
 * - MOCK_EXAM_PREP_HISTORY (studentId 필터) → rowId: "mock-exam-{id}"
 * - localStorage (방안 A: 현재 학생 이력으로 간주) → rowId: "local-exam-{index}"
 * - MOCK_TASK_RESULTS (studentId 필터, 시험 대비 반영 유형만) → rowId: "task-{taskId}-{typeId}"
 * - 중복 제거: typeId + challengeType + solvedAt + isCorrect 기준
 */
function buildHistoryRows(
  studentId: string,
  subject: Subject,
  deletedIds: string[]
): HistoryRow[] {
  const rows: HistoryRow[] = [];
  const dedupSet = new Set<string>();

  const dedupeKey = (
    typeId: string,
    challengeType: string,
    solvedAt: string,
    isCorrect: boolean
  ) => `${typeId}|${challengeType}|${solvedAt}|${isCorrect}`;

  // ── 1. MOCK_EXAM_PREP_HISTORY ───────────────────────────────────────────
  const mockExamItems = MOCK_EXAM_PREP_HISTORY.filter(
    (h) =>
      h.studentId === studentId &&
      (subject === "math"
        ? !h.typeId.startsWith("sc-")
        : h.typeId.startsWith("sc-"))
  );

  mockExamItems.forEach((h) => {
    const diff = extractDifficulty(h.typeId);
    const info = findTypeInfo(h.typeId, subject);
    const rowId = `mock-exam-${h.studentId}-${h.typeId}-${h.solvedAt}`;
    if (deletedIds.includes(rowId)) return;

    // 도전 구분 추론 (MOCK은 sessionId 없음 → 순서로 추론)
    const challengeType: ChallengeType = "초록 도전";
    const dk = dedupeKey(h.typeId, challengeType, h.solvedAt, h.correctCount === h.problemCount);
    if (dedupSet.has(dk)) return;
    dedupSet.add(dk);

    rows.push({
      rowId,
      source: "mock-exam",
      solvedAt: h.solvedAt,
      gradeTerm: info?.gradeTerm || "",
      majorUnit: info ? info.majorUnit : h.typeName,
      minorUnit: info?.minorUnit || "",
      typeName: h.typeName,
      typeId: h.typeId,
      difficulty: diff,
      path: "시험 대비",
      challengeType,
      problemCount: h.problemCount,
      correctCount: h.correctCount,
      achievementStatus: "none", // 후처리
    });
  });

  // ── 2. localStorage (방안 A: 현재 studentId 이력으로 간주) ───────────────
  const localItems = readLocalExamPrepHistory().filter(
    (h) =>
      h.submitted !== false &&
      (subject === "math"
        ? !h.typeId.startsWith("sc-")
        : h.typeId.startsWith("sc-"))
  );

  localItems.forEach((h, idx) => {
    const rowId = `local-exam-${idx}-${h.typeId}-${h.solvedAt}`;
    if (deletedIds.includes(rowId)) return;

    const diff = extractDifficulty(h.typeId);
    const info = findTypeInfo(h.typeId, subject);
    const challengeType: ChallengeType = "초록 도전";
    const dk = dedupeKey(h.typeId, challengeType, h.solvedAt, h.isCorrect);
    if (dedupSet.has(dk)) return;
    dedupSet.add(dk);

    rows.push({
      rowId,
      source: "local-exam",
      solvedAt: h.solvedAt,
      gradeTerm: info?.gradeTerm || "",
      majorUnit: info ? info.majorUnit : "",
      minorUnit: info?.minorUnit || "",
      typeName: info
        ? (() => {
            const pureId = purifyTypeId(h.typeId);
            const curricula =
              subject === "math" ? MATH_CURRICULA : SCIENCE_CURRICULA;
            for (const course of curricula) {
              const found = course.types.find((t) => t.id === pureId);
              if (found) return found.typeName;
            }
            return h.typeId;
          })()
        : h.typeId,
      typeId: h.typeId,
      difficulty: diff,
      path: "시험 대비",
      challengeType,
      problemCount: 1,
      correctCount: h.isCorrect ? 1 : 0,
      achievementStatus: "none",
    });
  });

  // ── 3. MOCK_TASK_RESULTS (시험 대비 반영 유형만) ─────────────────────────
  const taskItems = MOCK_TASK_RESULTS.filter(
    (r) =>
      r.studentId === studentId &&
      r.subject === subject &&
      r.status === "submitted"
  );

  taskItems.forEach((r) => {
    r.typeResults.forEach((tr) => {
      if (!tr.typeId) return;
      const rowId = `task-${r.taskId}-${tr.typeId}`;
      if (deletedIds.includes(rowId)) return;

      const diff = extractDifficulty(tr.typeId);
      const info = findTypeInfo(tr.typeId, subject);
      const challengeType: ChallengeType = "과제 센터 반영";
      const isCorrect = tr.correctCount > tr.incorrectCount + tr.unenteredCount;
      const dk = dedupeKey(tr.typeId, challengeType, r.submittedAt || "", isCorrect);
      if (dedupSet.has(dk)) return;
      dedupSet.add(dk);

      rows.push({
        rowId,
        source: "task",
        solvedAt: r.submittedAt || r.lastSolvedAt || "",
        gradeTerm: info?.gradeTerm || r.course || "",
        majorUnit: info ? info.majorUnit : "",
        minorUnit: info?.minorUnit || "",
        typeName: tr.typeName,
        typeId: tr.typeId,
        difficulty: diff,
        path: "과제 센터",
        challengeType,
        problemCount: tr.problemCount,
        correctCount: tr.correctCount,
        achievementStatus: "none",
      });
    });
  });

  // ── 3.1. localStorage Task Results (실제 과제 연동) ─────────────────────
  try {
    const localTasks = getStoredTasks().filter(
      (t) => t.subject === subject && t.status === "submitted"
    );
    localTasks.forEach((task) => {
      const result = getTaskResult(task.id);
      if (!result) return;
      const questions = getQuestionsByTaskId(task.id);
      result.gradingDetails.forEach((detail) => {
        const q = questions[detail.questionIndex] as any;
        if (!q) return;
        const qDifficulty = q.difficulty === "basic" ? "basic" : q.difficulty === "advanced" ? "advanced" : "skill";
        const qFullTypeId = q.typeId ? `${q.typeId}-${qDifficulty}` : "";
        if (qFullTypeId) {
          const rowId = `local-task-${task.id}-${detail.questionIndex}`;
          if (deletedIds.includes(rowId)) return;

          const info = findTypeInfo(qFullTypeId, subject);
          const challengeType: ChallengeType = "과제 센터 반영";
          const isCorrect = detail.status === "correct";
          const dk = dedupeKey(qFullTypeId, challengeType, result.submittedAt || "", isCorrect);
          if (dedupSet.has(dk)) return;
          dedupSet.add(dk);

          rows.push({
            rowId,
            source: "task",
            solvedAt: result.submittedAt || new Date().toISOString(),
            gradeTerm: info?.gradeTerm || task.course || "",
            majorUnit: info ? info.majorUnit : "",
            minorUnit: info?.minorUnit || "",
            typeName: q.typeName || qFullTypeId,
            typeId: qFullTypeId,
            difficulty: qDifficulty,
            path: "과제 센터",
            challengeType,
            problemCount: 1,
            correctCount: isCorrect ? 1 : 0,
            achievementStatus: "none",
          });
        }
      });
    });
  } catch (e) {
    console.error("Failed to load local tasks in buildHistoryRows", e);
  }

  // ── 4. 기본 Mock 데이터 (getMockHistoryForType) ──────────────────────────
  const curricula = subject === "math" ? MATH_CURRICULA : SCIENCE_CURRICULA;
  curricula.forEach((course) => {
    course.types.forEach((type) => {
      const diffs: Difficulty[] = [];
      if (type.difficultyCount.basic > 0) diffs.push("basic");
      if (type.difficultyCount.intermediate > 0) diffs.push("skill");
      if (type.difficultyCount.advanced > 0) diffs.push("advanced");

      diffs.forEach((diff) => {
        const typeId = `${type.id}-${diff}`;
        const mockHist = getMockHistoryForType(typeId, subject);
        mockHist.forEach((h, idx) => {
          const rowId = `mock-type-${typeId}-${idx}`;
          if (deletedIds.includes(rowId)) return;

          const info = findTypeInfo(typeId, subject);
          const challengeType: ChallengeType = h.path === "과제 센터" ? "과제 센터 반영" : "초록 도전";
          const dk = dedupeKey(typeId, challengeType, h.solvedAt, h.isCorrect);
          if (dedupSet.has(dk)) return;
          dedupSet.add(dk);

          rows.push({
            rowId,
            source: "mock-exam",
            solvedAt: h.solvedAt,
            gradeTerm: info?.gradeTerm || course.course,
            majorUnit: info ? info.majorUnit : "",
            minorUnit: info?.minorUnit || "",
            typeName: type.typeName,
            typeId: typeId,
            difficulty: diff,
            path: h.path,
            challengeType,
            problemCount: 1,
            correctCount: h.isCorrect ? 1 : 0,
            achievementStatus: "none",
          });
        });
      });
    });
  });

  // 풀이일시 내림차순 정렬
  rows.sort(
    (a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime()
  );

  // 성취도 재계산 (typeId별로 이력 누적)
  const typeHistoryMap = new Map<
    string,
    { isCorrect: boolean; rowId: string }[]
  >();
  // 내림차순 정렬된 rows를 역순(오름차순)으로 누적해야 최신순 판정 가능
  [...rows].reverse().forEach((row) => {
    const key = row.typeId;
    if (!typeHistoryMap.has(key)) typeHistoryMap.set(key, []);
    typeHistoryMap.get(key)!.unshift({
      isCorrect: row.correctCount === row.problemCount,
      rowId: row.rowId,
    });
  });

  // 각 row의 achievementStatus: 해당 row까지 누적된 이력 기준 판정
  const typeAccumMap = new Map<
    string,
    { isCorrect: boolean; rowId: string }[]
  >();
  [...rows].reverse().forEach((row) => {
    const key = row.typeId;
    if (!typeAccumMap.has(key)) typeAccumMap.set(key, []);
    const accum = typeAccumMap.get(key)!;
    accum.unshift({
      isCorrect: row.correctCount === row.problemCount,
      rowId: row.rowId,
    });
    row.achievementStatus = evaluateWithExclusion(accum, deletedIds);
  });

  return rows;
}

function splitMajorUnit(majorUnit: string): { badge: string; name: string } {
  const dashIdx = majorUnit.indexOf("-");
  if (dashIdx !== -1) {
    return {
      badge: majorUnit.substring(0, dashIdx).trim(),
      name: majorUnit.substring(dashIdx + 1).trim(),
    };
  }
  const spaceIdx = majorUnit.indexOf(" ");
  if (spaceIdx !== -1) {
    return {
      badge: majorUnit.substring(0, spaceIdx).trim(),
      name: majorUnit.substring(spaceIdx + 1).trim(),
    };
  }
  return { badge: "", name: majorUnit };
}

/** 성취도 현황 커리큘럼 구성 */
function buildAchievementCurriculum(
  studentId: string,
  subject: Subject,
  gradeTerm: string,
  deletedIds: string[]
): BigUnit[] {
  const curricula = subject === "math" ? MATH_CURRICULA : SCIENCE_CURRICULA;
  const rawCurriculum = curricula.find((c) => c.course === gradeTerm);
  if (!rawCurriculum) return [];

  // 해당 학생 + 해당 과목의 모든 이력 (삭제 제외)
  const allRows = buildHistoryRows(studentId, subject, deletedIds);

  const bigUnitMap = new Map<string, BigUnit>();
  const subUnitMap = new Map<string, SubUnit>();
  const bigUnits: BigUnit[] = [];
  let bigUnitIndex = 0;
  let subUnitIndex = 0;

  rawCurriculum.types.forEach((type, idx) => {
    // 대단원 파싱
    const { badge, name: bigUnitName } = splitMajorUnit(type.majorUnit);

    let bigUnit = bigUnitMap.get(type.majorUnit);
    if (!bigUnit) {
      bigUnitIndex++;
      const colors = [
        "bg-indigo-600", "bg-violet-600", "bg-sky-600",
        "bg-rose-600", "bg-amber-500", "bg-teal-600",
      ];
      bigUnit = {
        id: `u${bigUnitIndex}`,
        badge,
        name: bigUnitName,
        color: colors[(bigUnitIndex - 1) % colors.length],
        subUnits: [],
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
        advancedTypes: [],
      };
      subUnitMap.set(type.minorUnit, subUnit);
      bigUnit.subUnits.push(subUnit);
    }

    const isImportant = idx === 1 || idx === 5 || type.importantCount.basic > 0;

    const makeTypeData = (diff: Difficulty): TypeData => {
      const fullTypeId = `${type.id}-${diff === "skill" ? "skill" : diff}`;
      // 해당 유형 이력 (삭제 제외, 최신순)
      const typeRows = allRows
        .filter((r) => r.typeId === fullTypeId)
        .sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime());

      const histItems = typeRows.map((r) => ({
        isCorrect: r.correctCount === r.problemCount,
        rowId: r.rowId,
      }));
      const status = evaluateWithExclusion(histItems, deletedIds);

      // textbook 매핑
      const hash = hashString(type.id);
      let textbook = "기타";
      if (subject === "math") {
        const offset = diff === "basic" ? 0 : diff === "skill" ? 1 : 2;
        textbook = MATH_TEXTBOOKS[(hash + offset) % MATH_TEXTBOOKS.length];
      } else {
        textbook = type.textbook || "기타";
      }

      return {
        id: fullTypeId,
        name: type.typeName,
        difficulty: diff,
        isImportant: diff === "basic" ? (isImportant || type.importantCount.basic > 0) :
                     diff === "skill" ? (isImportant || type.importantCount.intermediate > 0) :
                     (isImportant || type.importantCount.advanced > 0),
        status,
        majorUnit: type.majorUnit,
        minorUnit: type.minorUnit,
        gradeTerm,
        textbook,
        videoUrl: type.videoUrl,
        sampleQuestion: type.sampleQuestion,
      };
    };

    if (type.difficultyCount.basic > 0) {
      subUnit.basicTypes.push(makeTypeData("basic"));
    }
    if (type.difficultyCount.intermediate > 0) {
      subUnit.skillTypes.push(makeTypeData("skill"));
    }
    if (type.difficultyCount.advanced > 0) {
      subUnit.advancedTypes.push(makeTypeData("advanced"));
    }
  });

  return bigUnits;
}

/** 커리큘럼 트리 구성 (모달용) */
function buildCurriculumTree(subject: Subject): CurriculumTreeNode[] {
  const curricula = subject === "math" ? MATH_CURRICULA : SCIENCE_CURRICULA;
  return curricula.map((course) => {
    const bigUnitMap = new Map<string, CurriculumTreeNode>();

    course.types.forEach((type) => {
      let bigNode = bigUnitMap.get(type.majorUnit);
      if (!bigNode) {
        bigNode = {
          id: `${course.course}-${type.majorUnit}`,
          label: type.majorUnit,
          type: "bigUnit",
          children: [],
          gradeTerm: course.course,
        };
        bigUnitMap.set(type.majorUnit, bigNode);
      }

      let minorNode = bigNode.children!.find(
        (c) => c.label === type.minorUnit
      );
      if (!minorNode) {
        minorNode = {
          id: `${course.course}-${type.majorUnit}-${type.minorUnit}`,
          label: type.minorUnit,
          type: "minorUnit",
          children: [],
          gradeTerm: course.course,
        };
        bigNode.children!.push(minorNode);
      }

      // 유형별 난이도 노드
      const diffs: { diff: Difficulty; count: number }[] = [
        { diff: "basic", count: type.difficultyCount.basic },
        { diff: "skill", count: type.difficultyCount.intermediate },
        { diff: "advanced", count: type.difficultyCount.advanced },
      ];
      diffs.forEach(({ diff, count }) => {
        if (count > 0) {
          const fullTypeId = `${type.id}-${diff}`;
          minorNode!.children!.push({
            id: fullTypeId,
            label: `${type.typeName} (${DIFF_LABEL[diff]})`,
            type: "typeNode",
            typeId: fullTypeId,
            gradeTerm: course.course,
          });
        }
      });
    });

    return {
      id: course.course,
      label: course.course,
      type: "gradeTerm",
      children: Array.from(bigUnitMap.values()),
      gradeTerm: course.course,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENT ICON
// ─────────────────────────────────────────────────────────────────────────────

function AchievementIcon({
  status,
  className,
}: {
  status: AchievementStatus;
  className?: string;
}) {
  if (status === "undetermined") return null;
  const cfg = ACHIEVEMENT_CONFIG[status];
  if (cfg.icon === "crown")
    return <Crown className={`stroke-[2] fill-current ${className}`} />;
  if (cfg.icon === "zap")
    return <Zap className={`stroke-[2.5] fill-current ${className}`} />;
  if (cfg.icon === "x")
    return <span className={`inline-flex items-center justify-center font-black leading-none select-none ${className}`}>!</span>;
  if (cfg.icon === "alert")
    return <span className={`inline-flex items-center justify-center font-black leading-none select-none ${className}`}>!</span>;
  if (cfg.icon === "check")
    return <Check className={`stroke-[3] ${className}`} />;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7.5 9.5a4.5 4.5 0 0 1 9 0c0 2.5-4.5 3.5-4.5 5.5" />
      <path d="M12 19h.01" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACHIEVEMENT STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AchievementStatus }) {
  const cfg = ACHIEVEMENT_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.badgeBg} ${cfg.badgeText}`}
    >
      <AchievementIcon status={status} className="w-3 h-3" />
      {cfg.shortLabel}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPE CHIP (성취도 현황)
// ─────────────────────────────────────────────────────────────────────────────

function TypeChip({
  type,
  isSelected,
  onClick,
}: {
  type: TypeData;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cfg = ACHIEVEMENT_CONFIG[type.status];
  return (
    <div
      onClick={onClick}
      title={type.name}
      className={`relative w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150 select-none ${cfg.chipBg} ${cfg.chipBorder} ${
        isSelected ? "scale-110 z-10" : "hover:brightness-90 hover:scale-[1.04]"
      }`}
      style={
        isSelected
          ? { boxShadow: "0 0 0 2px white, 0 0 0 4px #6366f1", zIndex: 20 }
          : {}
      }
    >
      <AchievementIcon
        status={type.status}
        className={`w-6 h-6 ${
          type.status === "relearn" || type.status === "supplement" ? "text-[30px]" : ""
        } ${cfg.chipIconColor}`}
      />
      {type.isImportant && (
        <Star
          className={`absolute top-0.5 left-0.5 w-2 h-2 fill-current ${
            type.status === "none" ? "text-slate-400" : "text-white/80"
          }`}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRICULUM MODAL
// ─────────────────────────────────────────────────────────────────────────────

function CurriculumModal({
  subject,
  onSelect,
  onClose,
  selectableTypes,
}: {
  subject: Subject;
  onSelect: (node: CurriculumTreeNode) => void;
  onClose: () => void;
  selectableTypes: CurriculumTreeNode["type"][];
}) {
  const [searchText, setSearchText] = useState("");
  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set());
  const tree = useMemo(() => buildCurriculumTree(subject), [subject]);

  const toggleNode = (id: string) => {
    setOpenNodes((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const filterTree = (
    nodes: CurriculumTreeNode[],
    q: string
  ): CurriculumTreeNode[] => {
    if (!q.trim()) return nodes;
    const lower = q.toLowerCase();
    return nodes
      .map((node) => {
        const childrenFiltered = node.children
          ? filterTree(node.children, q)
          : [];
        if (
          node.label.toLowerCase().includes(lower) ||
          childrenFiltered.length > 0
        ) {
          return { ...node, children: childrenFiltered };
        }
        return null;
      })
      .filter(Boolean) as CurriculumTreeNode[];
  };

  const displayTree = useMemo(
    () => filterTree(tree, searchText),
    [tree, searchText]
  );

  const renderNode = (
    node: CurriculumTreeNode,
    depth: number
  ): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isOpen = openNodes.has(node.id) || searchText.length > 0;
    const isSelectable = selectableTypes.includes(node.type);

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
          }}
        >
          {hasChildren && (
            <span className="text-slate-400 w-4 shrink-0 cursor-pointer">
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
          )}
          {!hasChildren && <span className="w-4 shrink-0" />}
          <span
            className={`text-sm flex-1 ${
              isSelectable
                ? "font-semibold text-slate-700"
                : "font-medium text-slate-500"
            }`}
          >
            {node.label}
          </span>
          {isSelectable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(node);
              }}
              className="ml-2 shrink-0 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
            >
              적용
            </button>
          )}
        </div>
        {isOpen &&
          hasChildren &&
          node.children!.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">커리큘럼 선택</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="커리큘럼 검색..."
              className="w-full h-9 pl-9 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {displayTree.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              검색 결과가 없습니다.
            </div>
          ) : (
            displayTree.map((node) => renderNode(node, 0))
          )}
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <p className="text-xs text-slate-500">
            선택 가능:{" "}
            {selectableTypes.includes("gradeTerm") && "학년/학기 "}
            {selectableTypes.includes("bigUnit") && "대단원 "}
            {selectableTypes.includes("minorUnit") && "소단원/중단원 "}
            {selectableTypes.includes("typeNode") && "유형"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────

function HistoryDetailModal({
  row,
  onClose,
}: {
  row: HistoryRow;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">풀이 결과 상세</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {/* 풀이 기록 정보 */}
          <div className="bg-slate-50 rounded-xl p-4 mb-5">
            <h4 className="text-sm font-bold text-slate-700 mb-3">
              풀이 기록 정보
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-500 text-xs">유형명</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {row.typeName}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">난이도</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {DIFF_LABEL[row.difficulty]}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">풀이 경로</span>
                <p className="font-semibold text-slate-800 mt-0.5">{row.path}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">풀이일시</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatDateTime(row.solvedAt)}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">풀이 문제 수</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {row.problemCount}문항
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">결과</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {row.correctCount} / {row.problemCount}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">성취도 상태</span>
                <div className="mt-0.5">
                  <StatusBadge status={row.achievementStatus} />
                </div>
              </div>
            </div>
          </div>

          {/* 문제별 결과 */}
          <h4 className="text-sm font-bold text-slate-700 mb-3">문제별 결과</h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-600">
                    문제
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-600">
                    문제 발문
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-600">
                    제출 답안
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-600">
                    정답
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-600">
                    결과
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: row.problemCount }, (_, i) => {
                  const isCorrect = i < row.correctCount;
                  return (
                    <tr
                      key={i}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-4 py-2.5 text-slate-700 font-semibold">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 max-w-[200px]">
                        <span className="line-clamp-1">
                          문제 {i + 1} 발문 (상세 데이터 없음)
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">-</td>
                      <td className="px-4 py-2.5 text-slate-600">-</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            isCorrect
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {isCorrect ? "정답" : "오답"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            * 문제 발문 및 제출 답안 상세는 API 연동 후 제공됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE RECORD MODAL
// ─────────────────────────────────────────────────────────────────────────────

function DeleteRecordModal({
  row,
  onConfirm,
  onClose,
}: {
  row: HistoryRow;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const trimmed = reason.replace(/\s/g, "");
  const isValid = trimmed.length >= 2 && reason.length < 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            풀이 기록 삭제
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700 space-y-1">
            <p className="font-bold">선택한 풀이 기록 1건을 삭제합니다.</p>
            <p>복수 삭제는 지원하지 않습니다.</p>
            <p>삭제된 데이터는 복구할 수 없습니다.</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-slate-500">유형명</span>
                <p className="font-semibold text-slate-800">{row.typeName}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">난이도</span>
                <p className="font-semibold text-slate-800">
                  {DIFF_LABEL[row.difficulty]}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">풀이일시</span>
                <p className="font-semibold text-slate-800">
                  {formatDateTime(row.solvedAt)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">풀이 문제 수</span>
                <p className="font-semibold text-slate-800">
                  {row.problemCount}문항
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500">결과</span>
                <p className="font-semibold text-slate-800">
                  {row.correctCount} / {row.problemCount}
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
              삭제 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="삭제 사유를 입력해 주세요."
              rows={3}
              maxLength={100}
              className="w-full text-sm border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-red-400"
            />
            <p className="text-xs text-slate-400 text-right mt-1">
              {reason.length} / 100
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="h-9 px-4 text-sm font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => isValid && onConfirm(reason)}
            disabled={!isValid}
            className={`h-9 px-4 text-sm font-semibold rounded-lg transition-colors ${
              isValid
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESET HISTORY MODAL
// ─────────────────────────────────────────────────────────────────────────────

function ResetHistoryModal({
  studentId,
  subject,
  allRows,
  onConfirm,
  onClose,
}: {
  studentId: string;
  subject: Subject;
  allRows: HistoryRow[];
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [scope, setScope] = useState<ResetScope>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedCurrNode, setSelectedCurrNode] =
    useState<CurriculumTreeNode | null>(null);
  const [showCurrModal, setShowCurrModal] = useState(false);
  const [reason, setReason] = useState("");
  const trimmedReason = reason.replace(/\s/g, "");

  const curricula = subject === "math" ? MATH_CURRICULA : SCIENCE_CURRICULA;
  const gradeTerms = curricula.map((c) => c.course);
  // 학년 목록 (중1, 초3 등)
  const grades = Array.from(
    new Set(gradeTerms.map((gt) => gt.replace(/-\d$/, "")))
  );

  const scopeSelectableTypes: CurriculumTreeNode["type"][] =
    scope === "unit"
      ? ["bigUnit", "minorUnit", "typeNode"]
      : [];

  // 초기화 범위에 포함되는 rowId 산출 (시험 대비 경로만)
  const targetRowIds = useMemo(() => {
    const examRows = allRows.filter((r) => r.path === "시험 대비");
    switch (scope) {
      case "all":
        return examRows.map((r) => r.rowId);
      case "grade":
        return examRows
          .filter((r) => r.gradeTerm.replace(/-\d$/, "") === selectedGrade)
          .map((r) => r.rowId);
      case "semester":
        return examRows
          .filter(
            (r) =>
              r.gradeTerm.replace(/-\d$/, "") === selectedGrade &&
              r.gradeTerm.endsWith(`-${selectedSemester === "1학기" ? "1" : "2"}`)
          )
          .map((r) => r.rowId);
      case "unit":
        if (!selectedCurrNode) return [];
        if (selectedCurrNode.type === "typeNode") {
          // 유형 선택 시 typeId로 필터
          return examRows
            .filter((r) => r.typeId === selectedCurrNode.typeId)
            .map((r) => r.rowId);
        }
        // 대단원 또는 소단원/중단원 선택 시
        return examRows
          .filter(
            (r) =>
              r.majorUnit.includes(
                selectedCurrNode.label.includes("-")
                  ? selectedCurrNode.label.split("-")[1]?.trim() || selectedCurrNode.label
                  : selectedCurrNode.label
              ) ||
              r.minorUnit === selectedCurrNode.label
          )
          .map((r) => r.rowId);
      default:
        return [];
    }
  }, [scope, selectedGrade, selectedSemester, selectedCurrNode, allRows]);

  const getScopeLabel = () => {
    switch (scope) {
      case "all": return "전체 초기화";
      case "grade": return selectedGrade ? `${selectedGrade} 학년` : "학년 미선택";
      case "semester":
        return selectedGrade && selectedSemester
          ? `${selectedGrade} ${selectedSemester}`
          : "학기 미선택";
      case "unit": return selectedCurrNode ? selectedCurrNode.label : "단원/유형 미선택";
    }
  };

  const isSelectionComplete =
    scope === "all" ||
    (scope === "grade" && selectedGrade !== "") ||
    (scope === "semester" && selectedGrade !== "" && selectedSemester !== "") ||
    (scope === "unit" && selectedCurrNode !== null);

  const isValid =
    trimmedReason.length >= 2 &&
    reason.length <= 500 &&
    targetRowIds.length > 0;

  const handleConfirm = () => {
    if (!isValid) return;
    addAdminDeletedIds(studentId, targetRowIds);
    addAdminResetRecord(studentId, {
      subject,
      scope,
      scopeLabel: getScopeLabel(),
      reason,
      resetAt: new Date().toISOString(),
      deletedRowIds: targetRowIds,
    });
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-orange-500" />
            시험 대비 이력 초기화
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 초기화 단위 선택 */}
          <div>
            <label className="text-sm font-bold text-slate-700 mb-2 block">
              초기화 단위
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "all", label: "전체 초기화" },
                  { value: "grade", label: "학년별 초기화" },
                  { value: "semester", label: "학기별 초기화" },
                  { value: "unit", label: "단원/유형 초기화" },
                ] as { value: ResetScope; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setScope(opt.value);
                    setSelectedGrade("");
                    setSelectedSemester("");
                    setSelectedCurrNode(null);
                  }}
                  className={`h-8 px-3 text-sm font-semibold rounded-lg border transition-colors ${
                    scope === opt.value
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 추가 선택 항목 */}
          {(scope === "grade" || scope === "semester") && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  학년 선택
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="h-9 w-full border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                >
                  <option value="">학년을 선택해 주세요</option>
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              {scope === "semester" && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    학기 선택
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="h-9 w-full border border-slate-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                  >
                    <option value="">학기를 선택해 주세요</option>
                    <option value="1학기">1학기</option>
                    <option value="2학기">2학기</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {scope === "unit" && (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                단원/유형 선택
              </label>
              <button
                onClick={() => setShowCurrModal(true)}
                className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <span
                  className={
                    selectedCurrNode ? "text-slate-800" : "text-slate-400"
                  }
                >
                  {selectedCurrNode
                    ? selectedCurrNode.label
                    : "클릭하여 선택"}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}

          {/* 초기화 대상 건수 */}
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-sm">
            <p className="text-orange-700 font-semibold">
              초기화 대상:{" "}
              <span className="text-orange-900 font-black">
                {targetRowIds.length}건
              </span>
            </p>
            {targetRowIds.length === 0 && (
              <p className="text-orange-600 text-xs mt-1">
                초기화할 이력이 없습니다. (과제 센터 경로 이력은 초기화 대상에서 제외됩니다.)
              </p>
            )}
          </div>

          {/* 복구 불가 안내 */}
          {isSelectionComplete && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl p-3 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              초기화된 데이터는 복구할 수 없습니다.
            </div>
          )}

          {/* 초기화 사유 */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
              초기화 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="초기화 이유를 입력해 주세요."
              rows={3}
              maxLength={500}
              className="w-full text-sm border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
            <p className="text-xs text-slate-400 text-right mt-1">
              {reason.length} / 500
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="h-9 px-4 text-sm font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`h-9 px-4 text-sm font-semibold rounded-lg transition-colors ${
              isValid
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            초기화
          </button>
        </div>
      </div>

      {showCurrModal && (
        <CurriculumModal
          subject={subject}
          selectableTypes={scopeSelectableTypes}
          onSelect={(node) => {
            setSelectedCurrNode(node);
            setShowCurrModal(false);
          }}
          onClose={() => setShowCurrModal(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DETAIL PANEL (우측 슬라이드 패널)
// ─────────────────────────────────────────────────────────────────────────────

function TypeDetailPanel({
  type,
  bigUnit,
  subUnit,
  allRows,
  deletedIds,
  onClose,
}: {
  type: TypeData;
  bigUnit: BigUnit;
  subUnit: SubUnit;
  allRows: HistoryRow[];
  deletedIds: string[];
  onClose: () => void;
}) {
  const cfg = ACHIEVEMENT_CONFIG[type.status];
  const typeRows = allRows
    .filter((r) => r.typeId === type.id && !deletedIds.includes(r.rowId))
    .slice(0, 5);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 shrink-0">
        <span className="text-sm font-extrabold text-slate-800">유형 상세</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 스크롤 바디 */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">
        {/* 유형 기본 정보 */}
        <div className="flex flex-col gap-3">
          {/* 배지 행 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold text-white ${bigUnit.color}`}
            >
              {bigUnit.badge}
            </span>
            {type.isImportant && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-bold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                중요
              </div>
            )}
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              {DIFF_LABEL[type.difficulty]}
            </span>
            <StatusBadge status={type.status} />
          </div>

          {/* 유형명 */}
          <h3 className="text-[15px] font-extrabold leading-snug text-slate-800">
            {type.name}
          </h3>
        </div>

        <div className="border-t border-slate-100" />

        {/* 도전 버튼 (비활성 — 기관관리자 화면) */}
        <div className="flex flex-col gap-2">
          <div className="text-center text-[11px] font-bold text-slate-400 py-1">
            도전 버튼 (기관관리자 화면 — 비활성)
          </div>
          <div className="flex gap-2">
            {(
              [
                { label: "번개 도전", cls: "bg-green-100 text-green-600/80" },
                { label: "왕관 도전", cls: "bg-violet-100 text-violet-600/80" },
                { label: "다시 도전", cls: "bg-slate-100 text-slate-600/80" },
              ] as { label: string; cls: string }[]
            ).map((btn) => (
              <button
                key={btn.label}
                disabled
                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all opacity-50 cursor-not-allowed ${btn.cls}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 도전 버튼 아래 섹션들 (동영상, 대표문제, 최근이력) */}
        {[
          // 1. 대표 유형 동영상
          type.videoUrl ? (
            <div key="video" className="flex flex-col gap-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">대표 유형 동영상</h4>
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
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">대표 유형 문제</h4>
              <div className="p-4 rounded-xl text-sm leading-relaxed border border-slate-100 bg-slate-50 text-slate-700 font-medium">
                <MathRenderer text={type.sampleQuestion} />
              </div>
            </div>
          ) : null,

          // 3. 풀이 이력
          <div key="history" className="flex flex-col gap-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">최근 풀이 이력</h4>
            {typeRows.length > 0 ? (
              <div className="flex flex-col gap-2">
                {typeRows.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white text-xs shadow-sm">
                    <div className="flex items-center gap-2">
                      {r.correctCount === r.problemCount ? (
                        <Check className="w-4 h-4 text-green-500 stroke-[3]" />
                      ) : (
                        <X className="w-4 h-4 text-red-500 stroke-[3]" />
                      )}
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{r.path}</span>
                        <span className="text-slate-400">·</span>
                        <span className={`font-bold ${r.correctCount === r.problemCount ? "text-green-500" : "text-red-500"}`}>
                          {r.correctCount === r.problemCount ? "정답" : "오답"}
                        </span>
                      </div>
                    </div>
                    <span className="font-medium text-slate-400">{formatDateOnly(r.solvedAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 gap-2.5 rounded-2xl bg-slate-50 text-slate-400">
                <BookOpen className="w-8 h-8 opacity-40" />
                <span className="text-xs font-semibold">아직 풀이 이력이 없어요</span>
              </div>
            )}
          </div>
        ].filter(Boolean).map((section, idx) => (
          <React.Fragment key={idx}>
            <div className="border-t border-slate-100" />
            {section}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRADE TERMS for filter
// ─────────────────────────────────────────────────────────────────────────────

const MATH_GRADE_TERMS = [
  { v: "초3-1", l: "초등 3-1" }, { v: "초3-2", l: "초등 3-2" },
  { v: "초4-1", l: "초등 4-1" }, { v: "초4-2", l: "초등 4-2" },
  { v: "초5-1", l: "초등 5-1" }, { v: "초5-2", l: "초등 5-2" },
  { v: "초6-1", l: "초등 6-1" }, { v: "초6-2", l: "초등 6-2" },
  { v: "중1-1", l: "중등 1-1" }, { v: "중1-2", l: "중등 1-2" },
  { v: "중2-1", l: "중등 2-1" }, { v: "중2-2", l: "중등 2-2" },
  { v: "중3-1", l: "중등 3-1" }, { v: "중3-2", l: "중등 3-2" },
];

const SCIENCE_GRADE_TERMS = [
  { v: "중1-1", l: "중등 1-1" }, { v: "중1-2", l: "중등 1-2" },
  { v: "중2-1", l: "중등 2-1" }, { v: "중2-2", l: "중등 2-2" },
  { v: "중3-1", l: "중등 3-1" }, { v: "중3-2", l: "중등 3-2" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT: AdminExamPrepTab
// ─────────────────────────────────────────────────────────────────────────────

interface AdminExamPrepTabProps {
  studentId: string;
  studentName: string;
  serviceType: StudentServiceType;
  grade: string;
  semester: string;
}

export default function AdminExamPrepTab({
  studentId,
  studentName,
  serviceType,
  grade,
  semester,
}: AdminExamPrepTabProps) {
  // ── 과목 탭 ───────────────────────────────────────────────────────────────
  const availableSubjects: Subject[] =
    serviceType === "math"
      ? ["math"]
      : serviceType === "science"
      ? ["science"]
      : ["math", "science"];
  const [subject, setSubject] = useState<Subject>(availableSubjects[0]);

  // ── 보기 전환 ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("history");

  // ── 기관관리자 삭제 목록 (localStorage 동기화) ───────────────────────────
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  useEffect(() => {
    setDeletedIds(getAdminDeletedIds(studentId));
  }, [studentId]);

  const refreshDeletedIds = useCallback(() => {
    setDeletedIds(getAdminDeletedIds(studentId));
  }, [studentId]);

  // ── 이력 데이터 (refreshTrigger로 재구성) ────────────────────────────────
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = useCallback(() => {
    refreshDeletedIds();
    setRefreshTrigger((v) => v + 1);
  }, [refreshDeletedIds]);

  // 학생 프론트 이벤트 수신 (읽기 전용)
  useEffect(() => {
    const handler = () => triggerRefresh();
    window.addEventListener("examprep-history-updated", handler);
    window.addEventListener("task-status-changed", handler);
    return () => {
      window.removeEventListener("examprep-history-updated", handler);
      window.removeEventListener("task-status-changed", handler);
    };
  }, [triggerRefresh]);

  // 전체 풀이이력 rows
  const allRows = useMemo(
    () => buildHistoryRows(studentId, subject, deletedIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [studentId, subject, deletedIds, refreshTrigger]
  );

  // ── 풀이이력 검색 상태 ────────────────────────────────────────────────────
  const defaultGradeTerm = toGradeTerm(grade, semester);
  const [searchPeriodUnit, setSearchPeriodUnit] = useState<"전체" | "일" | "월" | "년">("전체");
  const [searchPeriodValue, setSearchPeriodValue] = useState<string>("");
  const [searchCurrNode, setSearchCurrNode] = useState<CurriculumTreeNode | null>(null);
  const [showSearchCurrModal, setShowSearchCurrModal] = useState(false);
  const [searchTypeName, setSearchTypeName] = useState("");
  const [searchPath, setSearchPath] = useState<"전체" | "시험 대비" | "과제 센터">("전체");
  const [searchStatuses, setSearchStatuses] = useState<Set<AchievementStatus>>(new Set());

  // 실제 적용된 검색 조건 (검색 버튼 클릭 시 반영)
  const [appliedSearch, setAppliedSearch] = useState({
    periodUnit: "전체" as "전체" | "일" | "월" | "년",
    periodValue: "",
    currNode: null as CurriculumTreeNode | null,
    typeName: "",
    path: "전체" as "전체" | "시험 대비" | "과제 센터",
    statuses: new Set<AchievementStatus>(),
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const typeNameTrimmed = searchTypeName.replace(/\s/g, "");
  const isSearchEnabled = typeNameTrimmed.length !== 1; // 공백제외 1자면 비활성

  // 검색 실행
  const handleSearch = () => {
    if (!isSearchEnabled) return;
    setAppliedSearch({
      periodUnit: searchPeriodUnit,
      periodValue: searchPeriodValue,
      currNode: searchCurrNode,
      typeName: searchTypeName,
      path: searchPath,
      statuses: new Set(searchStatuses),
    });
    setCurrentPage(1);
  };

  // 검색 초기화
  const handleSearchReset = () => {
    setSearchPeriodUnit("전체");
    setSearchPeriodValue("");
    setSearchCurrNode(null);
    setSearchTypeName("");
    setSearchPath("전체");
    setSearchStatuses(new Set());
    setAppliedSearch({
      periodUnit: "전체",
      periodValue: "",
      currNode: null,
      typeName: "",
      path: "전체",
      statuses: new Set(),
    });
    setCurrentPage(1);
  };

  // 필터링된 rows
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      // 기간 필터
      if (appliedSearch.periodUnit !== "전체" && appliedSearch.periodValue) {
        const dt = new Date(row.solvedAt);
        const y = dt.getFullYear();
        const mo = dt.getMonth() + 1;
        const d = dt.getDate();
        const pv = appliedSearch.periodValue;
        if (appliedSearch.periodUnit === "년") {
          if (String(y) !== pv) return false;
        } else if (appliedSearch.periodUnit === "월") {
          const [py, pm] = pv.split("-").map(Number);
          if (y !== py || mo !== pm) return false;
        } else {
          // 일
          const [py, pm, pd] = pv.split("-").map(Number);
          if (y !== py || mo !== pm || d !== pd) return false;
        }
      }

      // 커리큘럼 필터
      if (appliedSearch.currNode) {
        const { type: nodeType, label, typeId: nTypeId } = appliedSearch.currNode;
        if (nodeType === "typeNode" && nTypeId) {
          if (row.typeId !== nTypeId) return false;
        } else if (nodeType === "minorUnit") {
          if (row.minorUnit !== label) return false;
        } else if (nodeType === "bigUnit") {
          if (!row.majorUnit.includes(label.includes("-") ? label.split("-")[1]?.trim() || label : label)) return false;
        } else if (nodeType === "gradeTerm") {
          if (row.gradeTerm !== label) return false;
        }
      }

      // 유형명 검색
      if (appliedSearch.typeName.trim()) {
        const q = appliedSearch.typeName.replace(/\s/g, "").toLowerCase();
        if (!row.typeName.replace(/\s/g, "").toLowerCase().includes(q)) return false;
      }

      // 풀이 경로
      if (appliedSearch.path !== "전체" && row.path !== appliedSearch.path) return false;

      // 성취도 상태
      if (
        appliedSearch.statuses.size > 0 &&
        !appliedSearch.statuses.has(row.achievementStatus)
      ) {
        return false;
      }

      return true;
    });
  }, [allRows, appliedSearch]);

  const totalCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pagedRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ── 모달 상태 ─────────────────────────────────────────────────────────────
  const [detailRow, setDetailRow] = useState<HistoryRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<HistoryRow | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // ── 성취도 현황 상태 ──────────────────────────────────────────────────────
  const gradeTerms = subject === "math" ? MATH_GRADE_TERMS : SCIENCE_GRADE_TERMS;
  const [achGradeTerm, setAchGradeTerm] = useState(defaultGradeTerm);
  const [achStatuses, setAchStatuses] = useState<Set<AchievementStatus>>(new Set());
  const [achTypeName, setAchTypeName] = useState("");
  const [achOnlyImportant, setAchOnlyImportant] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);

  const [appliedAch, setAppliedAch] = useState({
    gradeTerm: defaultGradeTerm,
    statuses: new Set<AchievementStatus>(),
    typeName: "",
    onlyImportant: false,
  });

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

  const curriculum = useMemo(
    () => buildAchievementCurriculum(studentId, subject, appliedAch.gradeTerm, deletedIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [studentId, subject, appliedAch, deletedIds, refreshTrigger]
  );

  const [openBigUnits, setOpenBigUnits] = useState<Set<string>>(new Set());
  const [openSubUnits, setOpenSubUnits] = useState<Set<string>>(new Set());
  const [selectedTypeInfo, setSelectedTypeInfo] = useState<{
    type: TypeData;
    bigUnit: BigUnit;
    subUnit: SubUnit;
  } | null>(null);

  useEffect(() => {
    setOpenBigUnits(new Set(curriculum.map((u) => u.id)));
    setOpenSubUnits(
      new Set(curriculum.flatMap((u) => u.subUnits.map((su) => su.id)))
    );
  }, [curriculum]);

  // 과목 변경 시 성취도 학년/학기 재설정
  useEffect(() => {
    setAchGradeTerm(defaultGradeTerm);
    setAppliedAch((prev) => ({ ...prev, gradeTerm: defaultGradeTerm }));
    setSelectedTypeInfo(null);
  }, [subject, defaultGradeTerm]);

  const handleAchSearch = () => {
    setAppliedAch({
      gradeTerm: achGradeTerm,
      statuses: new Set(achStatuses),
      typeName: achTypeName,
      onlyImportant: achOnlyImportant,
    });
    setSelectedTypeInfo(null);
  };

  const handleAchReset = () => {
    setAchGradeTerm(defaultGradeTerm);
    setAchStatuses(new Set());
    setAchTypeName("");
    setAchOnlyImportant(false);
    setAppliedAch({
      gradeTerm: defaultGradeTerm,
      statuses: new Set(),
      typeName: "",
      onlyImportant: false,
    });
    setSelectedTypeInfo(null);
  };

  // 필터링된 커리큘럼
  const filteredCurriculum = useMemo(() => {
    const { statuses, typeName, onlyImportant } = appliedAch;
    const q = typeName.replace(/\s/g, "").toLowerCase();

    return curriculum
      .map((bu) => ({
        ...bu,
        subUnits: bu.subUnits
          .map((su) => {
            const f = (t: TypeData) => {
              if (statuses.size > 0 && !statuses.has(t.status)) return false;
              if (q && !t.name.replace(/\s/g, "").toLowerCase().includes(q)) return false;
              if (onlyImportant && !t.isImportant) return false;
              return true;
            };
            return {
              ...su,
              basicTypes: su.basicTypes.filter(f),
              skillTypes: su.skillTypes.filter(f),
              advancedTypes: su.advancedTypes.filter(f),
            };
          })
          .filter(
            (su) =>
              su.basicTypes.length > 0 ||
              su.skillTypes.length > 0 ||
              su.advancedTypes.length > 0
          ),
      }))
      .filter((bu) => bu.subUnits.length > 0);
  }, [curriculum, appliedAch]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-4 relative">
      {/* ── 과목 선택 및 보기 전환 상단 바 ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1.5 border-b border-slate-200/60">
        {/* 좌측: 과목 탭 */}
        {availableSubjects.length > 1 ? (
          <div className="flex items-center gap-1.5">
            {availableSubjects.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSubject(s);
                  setSelectedTypeInfo(null);
                }}
                className={`h-8 px-4 text-xs font-extrabold rounded-lg border transition-all ${
                  subject === s
                    ? s === "math"
                      ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm"
                      : "bg-sky-50 border-sky-200 text-sky-700 shadow-sm"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {s === "math" ? "수학" : "과학"}
              </button>
            ))}
          </div>
        ) : (
          <div />
        )}

        {/* 우측: 보기 전환 탭 (Segmented Control) */}
        <div className="flex items-center bg-slate-100/80 border border-slate-200/60 rounded-xl p-1 w-fit shadow-inner">
          {(
            [
              { value: "history", label: "풀이이력" },
              { value: "achievement", label: "성취도현황" },
            ] as { value: ViewMode; label: string }[]
          ).map((opt) => {
            const active = viewMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setViewMode(opt.value)}
                className={`h-7 px-4 text-xs font-bold rounded-lg transition-all whitespace-nowrap min-w-[80px] flex items-center justify-center ${
                  active
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200/40"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          풀이이력 모드
      ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === "history" && (
        <div className="space-y-4">
          {/* 검색 영역 */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-12 gap-4 items-end">
              {/* 기간 단위 */}
              <div className="flex flex-col gap-1 w-full col-span-1 xl:col-span-2">
                <label className="text-xs font-semibold text-slate-500">
                  기간 단위
                </label>
                <div className="flex items-center gap-1">
                  {(["전체", "일", "월", "년"] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => {
                        setSearchPeriodUnit(u);
                        if (u === "전체") {
                          setSearchPeriodValue("");
                          return;
                        }
                        const now = new Date();
                        if (u === "년")
                          setSearchPeriodValue(String(now.getFullYear()));
                        else if (u === "월")
                          setSearchPeriodValue(
                            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
                          );
                        else
                          setSearchPeriodValue(
                            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
                          );
                      }}
                      className={`h-8 px-3 text-xs font-bold rounded-lg border transition-colors flex-1 ${
                        searchPeriodUnit === u
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* 기간 선택 */}
              <div className="flex flex-col gap-1 w-full col-span-1 xl:col-span-2">
                <label className="text-xs font-semibold text-slate-500">
                  기간 선택
                </label>
                <input
                  type={
                    searchPeriodUnit === "일"
                      ? "date"
                      : searchPeriodUnit === "월"
                      ? "month"
                      : searchPeriodUnit === "년"
                      ? "number"
                      : "text"
                  }
                  value={searchPeriodValue}
                  disabled={searchPeriodUnit === "전체"}
                  placeholder={searchPeriodUnit === "전체" ? "전체 기간" : undefined}
                  min={searchPeriodUnit === "년" ? "2020" : undefined}
                  max={searchPeriodUnit === "년" ? "2099" : undefined}
                  onChange={(e) => setSearchPeriodValue(e.target.value)}
                  className="h-8 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              {/* 커리큘럼 검색 */}
              <div className="flex flex-col gap-1 w-full col-span-1 xl:col-span-2">
                <label className="text-xs font-semibold text-slate-500">
                  커리큘럼 검색
                </label>
                <button
                  onClick={() => setShowSearchCurrModal(true)}
                  className="h-8 px-3 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2 w-full text-left"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span
                    className={`truncate ${
                      searchCurrNode ? "text-slate-800 font-semibold" : "text-slate-400"
                    }`}
                  >
                    {searchCurrNode ? searchCurrNode.label : "커리큘럼 선택"}
                  </span>
                  {searchCurrNode && (
                    <X
                      className="w-3 h-3 text-slate-400 ml-auto shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchCurrNode(null);
                      }}
                    />
                  )}
                </button>
              </div>

              {/* 유형명 검색 */}
              <div className="flex flex-col gap-1 w-full col-span-1 xl:col-span-2">
                <label className="text-xs font-semibold text-slate-500">
                  유형명 검색
                </label>
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    value={searchTypeName}
                    onChange={(e) => setSearchTypeName(e.target.value)}
                    placeholder="공백제외 2자 이상"
                    className="h-8 pl-8 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                  />
                </div>
              </div>

              {/* 풀이 경로 */}
              <div className="flex flex-col gap-1 w-full col-span-1 xl:col-span-1">
                <label className="text-xs font-semibold text-slate-500">
                  풀이 경로
                </label>
                <select
                  value={searchPath}
                  onChange={(e) => {
                    setSearchPath(e.target.value as typeof searchPath);
                  }}
                  className="h-8 px-2 text-sm border border-slate-200 rounded-lg focus:outline-none w-full"
                >
                  <option>전체</option>
                  <option>시험 대비</option>
                  <option>과제 센터</option>
                </select>
              </div>

              {/* 성취도 상태 */}
              <div className="flex flex-col gap-1.5 w-full col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-3">
                <label className="text-xs font-semibold text-slate-500">
                  성취도 상태
                </label>
                <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
                  {ALL_STATUSES.map((s) => {
                    const selected = searchStatuses.has(s);
                    const cfg = ACHIEVEMENT_CONFIG[s];
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSearchStatuses((prev) => {
                            const n = new Set(prev);
                            n.has(s) ? n.delete(s) : n.add(s);
                            return n;
                          });
                        }}
                        className={`h-7 px-2.5 text-xs font-bold rounded-full border transition-all flex items-center gap-1 ${
                          selected
                            ? `${cfg.selBg} ${cfg.selBorder} ${cfg.selText} shadow-sm`
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <AchievementIcon
                          status={s}
                          className={`w-3.5 h-3.5 ${selected ? "text-white stroke-white" : cfg.filterIconColor}`}
                        />
                        <span className={selected ? "text-white" : cfg.filterTextColor}>
                          {cfg.shortLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 검색 / 초기화 버튼 */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              {typeNameTrimmed.length === 1 ? (
                <p className="text-xs text-red-500 font-semibold">
                  유형명은 공백 제외 2자 이상 입력해 주세요.
                </p>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleSearch}
                  disabled={!isSearchEnabled}
                  className={`h-8 px-5 text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    isSearchEnabled
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  검색
                </button>
                <button
                  onClick={handleSearchReset}
                  className="h-8 px-4 text-sm font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  초기화
                </button>
              </div>
            </div>
          </div>

          {/* 풀이이력 목록 */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
            {/* 상단 헤더 */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <p className="text-sm text-slate-600">
                전체{" "}
                <span className="font-bold text-slate-900">{totalCount}</span>건
              </p>
              <button
                onClick={() => setShowResetModal(true)}
                className="h-8 px-3 text-xs font-bold border border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                시험 대비 이력 초기화
              </button>
            </div>

            {/* 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {[
                      "번호", "최근 풀이 일시", "학년/학기", "대단원",
                      "소단원/중단원", "유형명", "난이도", "최근 풀이 경로",
                      "풀이 문제 수", "결과", "성취도 상태", "관리",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2.5 text-left text-xs font-bold text-slate-600 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="py-16 text-center text-slate-400 text-sm"
                      >
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        조회된 풀이 이력이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    pagedRows.map((row, i) => {
                      const rowNum =
                        totalCount - (currentPage - 1) * pageSize - i;
                      return (
                        <tr
                          key={row.rowId}
                          className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="px-3 py-2.5 text-slate-500 text-xs">
                            {rowNum}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap text-xs">
                            {formatDateTime(row.solvedAt)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">
                            {row.gradeTerm}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700 text-xs max-w-[100px]">
                            <span className="line-clamp-1">{row.majorUnit}</span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs max-w-[100px]">
                            <span className="line-clamp-1">{row.minorUnit}</span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-800 font-semibold text-xs max-w-[120px]">
                            <span className="line-clamp-1">{row.typeName}</span>
                          </td>
                          <td className="px-3 py-2.5 text-xs">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                              {DIFF_LABEL[row.difficulty]}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.5 rounded font-semibold ${
                                row.path === "시험 대비"
                                  ? "bg-indigo-50 text-indigo-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {row.path}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-700 text-center">
                            {row.problemCount}
                          </td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-center">
                            <span
                              className={
                                row.correctCount === row.problemCount
                                  ? "text-green-600"
                                  : "text-red-500"
                              }
                            >
                              {row.correctCount}
                            </span>
                            <span className="text-slate-400">
                              /{row.problemCount}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <StatusBadge status={row.achievementStatus} />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setDetailRow(row)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                                title="풀이 결과 상세"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {row.path === "시험 대비" && (
                                <button
                                  onClick={() => setDeleteRow(row)}
                                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                  title="풀이 기록 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 페이징 */}
            {(() => {
              const startRowIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
              const endRowIndex = Math.min(currentPage * pageSize, totalCount);
              return (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
                  {/* 왼쪽: 범위 정보 및 페이지 크기 선택 */}
                  <div className="flex items-center gap-3 text-sm text-slate-500 font-semibold">
                    <span>
                      {startRowIndex} - {endRowIndex} / 전체 {totalCount}
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-8 border border-slate-200 rounded-lg px-2 text-sm bg-white focus:outline-none cursor-pointer text-slate-600"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* 오른쪽: 페이징 네비게이션 */}
                  <div className="flex items-center gap-1">
                    {/* << */}
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    {/* < */}
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* 페이지 번호 루프 */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 2
                      )
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="px-1 text-slate-400 text-xs">…</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                              currentPage === p
                                ? "bg-[#0092fa] text-white border-[#0092fa]"
                                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      ))}

                    {/* > */}
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {/* >> */}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          성취도현황 모드
      ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === "achievement" && (
        <div className="space-y-4">
          {/* 가로형 필터 영역 */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
            {/* <좌측 필터 영역> */}
            <div className="flex flex-wrap items-center gap-2">
              {/* 학년/학기 */}
              <select
                value={achGradeTerm}
                onChange={(e) => {
                  const newTerm = e.target.value;
                  setAchGradeTerm(newTerm);
                  setAppliedAch((prev) => ({ ...prev, gradeTerm: newTerm }));
                  setSelectedTypeInfo(null);
                }}
                className="h-8 border border-slate-200 rounded-lg px-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {gradeTerms.map((gt) => (
                  <option key={gt.v} value={gt.v}>
                    {gt.l}
                  </option>
                ))}
              </select>

              {/* 구분선 */}
              <div className="h-5 w-px bg-slate-200 mx-1" />

              {/* 성취도 상태 칩 그룹 */}
              <div className="flex flex-wrap items-center gap-1.5">
                {ALL_STATUSES.map((s) => {
                  const selected = achStatuses.has(s);
                  const cfg = ACHIEVEMENT_CONFIG[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setAchStatuses((prev) => {
                          const n = new Set(prev);
                          n.has(s) ? n.delete(s) : n.add(s);
                          return n;
                        });
                      }}
                      className={`h-7 px-2.5 text-xs font-bold rounded-full border transition-all flex items-center gap-1 ${
                        selected
                          ? `${cfg.selBg} ${cfg.selBorder} ${cfg.selText} shadow-sm`
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <AchievementIcon
                        status={s}
                        className={`w-3 h-3 ${selected ? "text-white stroke-white" : cfg.filterIconColor}`}
                      />
                      <span className={selected ? "text-white" : cfg.filterTextColor}>
                        {cfg.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 안내 버튼 및 팝오버 */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowGuide((v) => !v)}
                  className="h-7 px-2.5 text-xs font-bold rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  안내
                </button>
                {showGuide && (
                  <div
                    ref={guideRef}
                    className="absolute left-0 top-9 w-80 rounded-2xl shadow-2xl border p-5 z-50 bg-white border-slate-200 flex flex-col gap-3"
                  >
                    <h4 className="text-xs font-extrabold text-slate-500 mb-0.5 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      성취도 안내
                    </h4>
                    {ALL_STATUSES.map((s) => {
                      const cfg = ACHIEVEMENT_CONFIG[s];
                      return (
                        <div key={s} className="flex items-start gap-3">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cfg.chipBg} ${cfg.chipBorder}`}
                          >
                            <AchievementIcon
                              status={s}
                              className={`w-6 h-6 ${
                                s === "relearn" || s === "supplement" ? "text-[30px]" : ""
                              } ${cfg.chipIconColor}`}
                            />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-slate-800">{cfg.label}</p>
                            <p className="text-sm leading-snug text-slate-500 mt-0.5">{cfg.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 구분선 */}
              <div className="h-5 w-px bg-slate-200 mx-1" />

              {/* 유형명 검색 */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={achTypeName}
                  onChange={(e) => setAchTypeName(e.target.value)}
                  placeholder="공백제외 2자 이상"
                  className="h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36"
                />
              </div>

              {/* 검색 */}
              <button
                type="button"
                disabled={achTypeName.replace(/\s/g, "").length === 1}
                onClick={handleAchSearch}
                className="h-8 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                검색
              </button>

              {/* 필터 초기화 */}
              <button
                type="button"
                disabled={
                  achGradeTerm === defaultGradeTerm &&
                  achStatuses.size === 0 &&
                  achTypeName === "" &&
                  achOnlyImportant === false
                }
                onClick={() => {
                  setAchGradeTerm(defaultGradeTerm);
                  setAchStatuses(new Set());
                  setAchTypeName("");
                  setAchOnlyImportant(false);
                  setAppliedAch({
                    gradeTerm: defaultGradeTerm,
                    statuses: new Set(),
                    typeName: "",
                    onlyImportant: false,
                  });
                  setSelectedTypeInfo(null);
                }}
                className="h-8 px-3 text-xs font-semibold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                초기화
              </button>
            </div>

            {/* <우측 필터 영역> */}
            <div className="flex items-center">
              {/* 중요 유형만 보기 */}
              <button
                type="button"
                onClick={() => {
                  const newVal = !achOnlyImportant;
                  setAchOnlyImportant(newVal);
                  setAppliedAch((prev) => ({ ...prev, onlyImportant: newVal }));
                }}
                className={`h-8 px-3.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all ${
                  achOnlyImportant
                    ? "bg-amber-50 border-amber-300 text-amber-700 shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${achOnlyImportant ? "fill-amber-400 text-amber-400" : "text-slate-400"}`} />
                중요 유형만 보기
              </button>
            </div>
          </div>

          {/* 아코디언 본문 및 유형 상세 패널 */}
          <div className="w-full relative">
            <div
              className={`flex gap-4 transition-all duration-200 ${
                selectedTypeInfo ? "pr-[420px]" : ""
              }`}
            >
              <div className="flex-1 min-w-0 space-y-3">
                {filteredCurriculum.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center py-24 gap-3">
                    <Filter className="w-10 h-10 text-slate-300" />
                    <p className="text-sm font-bold text-slate-400">
                      조건에 맞는 유형이 없습니다.
                    </p>
                  </div>
                ) : (
                  filteredCurriculum.map((bigUnit) => (
                    <div
                      key={bigUnit.id}
                      className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden"
                    >
                      {/* 대단원 헤더 */}
                      <div
                        onClick={() => {
                          setOpenBigUnits((prev) => {
                            const n = new Set(prev);
                            n.has(bigUnit.id)
                              ? n.delete(bigUnit.id)
                              : n.add(bigUnit.id);
                            return n;
                          });
                        }}
                        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-white text-xs font-extrabold ${bigUnit.color}`}
                          >
                            {bigUnit.badge}
                          </span>
                          <h3 className="text-[15px] font-extrabold text-slate-800">
                            {bigUnit.name}
                          </h3>
                        </div>
                        {openBigUnits.has(bigUnit.id) ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      {openBigUnits.has(bigUnit.id) && (
                        <div className="border-t border-slate-100">
                          {bigUnit.subUnits.map((subUnit) => (
                            <div
                              key={subUnit.id}
                              className="border-b border-slate-100 last:border-b-0"
                            >
                              {/* 소단원 헤더 */}
                              <div
                                onClick={() => {
                                  setOpenSubUnits((prev) => {
                                    const n = new Set(prev);
                                    n.has(subUnit.id)
                                      ? n.delete(subUnit.id)
                                      : n.add(subUnit.id);
                                    return n;
                                  });
                                }}
                                className="flex items-center justify-between px-5 py-2.5 cursor-pointer hover:bg-slate-50/60 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      openSubUnits.has(subUnit.id)
                                        ? "bg-indigo-500"
                                        : "bg-slate-300"
                                    }`}
                                  />
                                  <span className="text-sm font-bold text-slate-700">
                                    {subUnit.name}
                                  </span>
                                </div>
                                {openSubUnits.has(subUnit.id) ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>

                              {openSubUnits.has(subUnit.id) && (
                                <div className="grid grid-cols-3 gap-3 px-5 pb-4 pt-1">
                                  {[
                                    { label: "기본", types: subUnit.basicTypes },
                                    { label: "실력", types: subUnit.skillTypes },
                                    { label: "심화", types: subUnit.advancedTypes },
                                  ].map(({ label, types }) => (
                                    <div
                                      key={label}
                                      className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"
                                    >
                                      <div className="px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-600">
                                        {label}
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 p-2.5 min-h-[56px] content-start">
                                        {types.length > 0 ? (
                                          types.map((t) => (
                                            <TypeChip
                                              key={t.id}
                                              type={t}
                                              isSelected={
                                                selectedTypeInfo?.type.id ===
                                                t.id
                                              }
                                              onClick={() => {
                                                if (
                                                  selectedTypeInfo?.type.id ===
                                                  t.id
                                                ) {
                                                  setSelectedTypeInfo(null);
                                                } else {
                                                  setSelectedTypeInfo({
                                                    type: t,
                                                    bigUnit,
                                                    subUnit,
                                                  });
                                                }
                                              }}
                                            />
                                          ))
                                        ) : (
                                          <span className="text-xs py-2 w-full text-center text-slate-400">
                                            없음
                                          </span>
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
              </div>
            </div>

            {/* 유형 상세 패널 (우측 고정) */}
            <div
              className={`fixed top-0 right-0 h-full w-[400px] z-40 transition-transform duration-200 ease-in-out shadow-2xl border-l border-slate-200 bg-white ${
                selectedTypeInfo ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {selectedTypeInfo && (
                <TypeDetailPanel
                  type={selectedTypeInfo.type}
                  bigUnit={selectedTypeInfo.bigUnit}
                  subUnit={selectedTypeInfo.subUnit}
                  allRows={allRows}
                  deletedIds={deletedIds}
                  onClose={() => setSelectedTypeInfo(null)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 모달들 ─────────────────────────────────────────────────────────── */}
      {detailRow && (
        <HistoryDetailModal
          row={detailRow}
          onClose={() => setDetailRow(null)}
        />
      )}

      {deleteRow && (
        <DeleteRecordModal
          row={deleteRow}
          onConfirm={(reason) => {
            addAdminDeletedId(studentId, deleteRow.rowId);
            setDeleteRow(null);
            triggerRefresh();
          }}
          onClose={() => setDeleteRow(null)}
        />
      )}

      {showResetModal && (
        <ResetHistoryModal
          studentId={studentId}
          subject={subject}
          allRows={allRows}
          onConfirm={() => {
            setShowResetModal(false);
            triggerRefresh();
          }}
          onClose={() => setShowResetModal(false)}
        />
      )}

      {showSearchCurrModal && (
        <CurriculumModal
          subject={subject}
          selectableTypes={["gradeTerm", "bigUnit", "minorUnit", "typeNode"]}
          onSelect={(node) => {
            setSearchCurrNode(node);
            setShowSearchCurrModal(false);
          }}
          onClose={() => setShowSearchCurrModal(false)}
        />
      )}
    </div>
  );
}
