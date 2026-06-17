"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTaskCenterStore } from "@/lib/task-center-store";
import {
  ChevronLeft,
  ChevronRight,
  BarChart2,
  ArrowLeft,
  X,
  BookOpen,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  Crown,
  Check,
  Info,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isFuture,
  isToday,
  parseISO,
  addDays,
  subDays,
} from "date-fns";
import { ko } from "date-fns/locale";

// 시험 대비 화면과 동일한 성취도 판정 함수 사용
import { evaluateAchievementStatus } from "@/utils/examPrepStorage";
import type { ExamAchievementStatus } from "@/utils/examPrepStorage";

import { MATH_CURRICULA, SCIENCE_CURRICULA } from "@/lib/task-center-mock";

import {
  MOCK_TASK_RESULTS,
  MOCK_EXAM_PREP_HISTORY,
} from "./mockData";
import { getStoredStudents } from "@/lib/student-mock";
import { getStoredClasses } from "@/lib/teacher-mock";

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

function calcScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

function formatDateTime(iso: string): string {
  return format(parseISO(iso), "yyyy.MM.dd HH:mm:ss");
}

// 특정 학생의 특정 유형의 통합 이력 가져오기 (공용)
export function getStudentTypeHistory(
  studentId: string,
  typeId: string,
  subject: "math" | "science"
) {
  const taskCenterList: {
    path: "과제 센터" | "시험 대비";
    solvedAt: string;
    isCorrect: boolean;
    correctCount: number;
    problemCount: number;
  }[] = [];

  MOCK_TASK_RESULTS.forEach((r) => {
    if (r.studentId !== studentId || r.subject !== subject) return;
    const tr = r.typeResults.find((t) => t.typeId === typeId);
    if (!tr) return;

    const solvedAt = r.submittedAt || r.lastSolvedAt || "";
    const correctTotal = tr.correctCount;
    const incorrectTotal = tr.incorrectCount + tr.unenteredCount;

    if (correctTotal === 4 && incorrectTotal === 1) {
      const pattern = [true, true, false, true, true];
      pattern.forEach((isCorrect) => {
        taskCenterList.push({
          path: "과제 센터",
          solvedAt,
          isCorrect,
          correctCount: isCorrect ? 1 : 0,
          problemCount: 1,
        });
      });
    } else if (correctTotal === 3 && incorrectTotal === 2) {
      const pattern = [true, false, true, false, true];
      pattern.forEach((isCorrect) => {
        taskCenterList.push({
          path: "과제 센터",
          solvedAt,
          isCorrect,
          correctCount: isCorrect ? 1 : 0,
          problemCount: 1,
        });
      });
    } else if (correctTotal === 2 && incorrectTotal === 1) {
      const pattern = [true, false, true];
      pattern.forEach((isCorrect) => {
        taskCenterList.push({
          path: "과제 센터",
          solvedAt,
          isCorrect,
          correctCount: isCorrect ? 1 : 0,
          problemCount: 1,
        });
      });
    } else {
      for (let i = 0; i < correctTotal; i++) {
        taskCenterList.push({
          path: "과제 센터",
          solvedAt,
          isCorrect: true,
          correctCount: 1,
          problemCount: 1,
        });
      }
      for (let i = 0; i < incorrectTotal; i++) {
        taskCenterList.push({
          path: "과제 센터",
          solvedAt,
          isCorrect: false,
          correctCount: 0,
          problemCount: 1,
        });
      }
    }
  });

  const examPrepList: {
    path: "과제 센터" | "시험 대비";
    solvedAt: string;
    isCorrect: boolean;
    correctCount: number;
    problemCount: number;
  }[] = [];

  MOCK_EXAM_PREP_HISTORY.forEach((h) => {
    if (h.studentId !== studentId || h.typeId !== typeId) return;

    const correctTotal = h.correctCount;
    const incorrectTotal = h.problemCount - h.correctCount;

    if (correctTotal === 4 && incorrectTotal === 1) {
      const pattern = [true, true, false, true, true];
      pattern.forEach((isCorrect) => {
        examPrepList.push({
          path: "시험 대비",
          solvedAt: h.solvedAt,
          isCorrect,
          correctCount: isCorrect ? 1 : 0,
          problemCount: 1,
        });
      });
    } else if (correctTotal === 3 && incorrectTotal === 2) {
      const pattern = [true, false, true, false, true];
      pattern.forEach((isCorrect) => {
        examPrepList.push({
          path: "시험 대비",
          solvedAt: h.solvedAt,
          isCorrect,
          correctCount: isCorrect ? 1 : 0,
          problemCount: 1,
        });
      });
    } else if (correctTotal === 2 && incorrectTotal === 1) {
      const pattern = [true, false, true];
      pattern.forEach((isCorrect) => {
        examPrepList.push({
          path: "시험 대비",
          solvedAt: h.solvedAt,
          isCorrect,
          correctCount: isCorrect ? 1 : 0,
          problemCount: 1,
        });
      });
    } else {
      for (let i = 0; i < correctTotal; i++) {
        examPrepList.push({
          path: "시험 대비",
          solvedAt: h.solvedAt,
          isCorrect: true,
          correctCount: 1,
          problemCount: 1,
        });
      }
      for (let i = 0; i < incorrectTotal; i++) {
        examPrepList.push({
          path: "시험 대비",
          solvedAt: h.solvedAt,
          isCorrect: false,
          correctCount: 0,
          problemCount: 1,
        });
      }
    }
  });

  return [...taskCenterList, ...examPrepList].sort(
    (a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime()
  );
}

// 축약형 일시 포맷팅 헬퍼 함수
export function formatShortDateTime(iso: string): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${mm}.${dd} ${hh}:${min}`;
  } catch {
    return "-";
  }
}

export type UIExamAchievementStatus =
  | "none"
  | "undecided"
  | "relearn"
  | "supplement"
  | "understand"
  | "master";

export type ProblemTypeResultRow = {
  problemId: string;
  problemNo: number;
  typeId: string;
  typeName: string;
  unit: string;
  problemStatement: string;
  result: "correct" | "incorrect" | "unentered";
};

// 특정 학생의 특정 유형 성취도 판정 정책 (공용)
export function evaluateStudentAchievement(
  studentId: string,
  typeId: string,
  subject: "math" | "science"
): ExamAchievementStatus {
  const history = getStudentTypeHistory(studentId, typeId, subject);

  if (history.length === 0) {
    return "none";
  }
  if (history.length === 1) {
    return "undetermined";
  }

  const isCorrect0 = history[0].isCorrect;
  const isCorrect1 = history[1].isCorrect;

  if (history.length >= 3 && isCorrect0 && isCorrect1 && history[2].isCorrect) {
    return "master";
  }
  if (isCorrect0 && isCorrect1) {
    return "understand";
  }
  if (!isCorrect0 && !isCorrect1) {
    return "relearn";
  }
  return "supplement";
}

// undecided <-> undetermined 변환 헬퍼
export function toUIAchievement(status: string): UIExamAchievementStatus {
  if (status === "undetermined") return "undecided";
  return status as UIExamAchievementStatus;
}

// 로컬 mock 발문 데이터
const LOCAL_MOCK_STATEMENTS: Record<string, string[]> = {
  // 수학 유형 ID
  "mt-중1-1-0-1-1-basic": [
    "소인수분해 조건을 만족하는 가장 작은 자연수를 구하시오.",
    "다음 세 조건을 모두 만족하는 자연수 N의 값을 구하시오.",
    "소인수를 약수로 갖는 두 자리 자연수 중 가장 큰 수를 구하시오."
  ],
  "mt-중1-1-0-2-1-basic": [
    "다음 소인수분해 계산 과정에서 오류가 있는 부분을 찾아 바르게 고치시오.",
    "다음 학생의 소인수분해 풀이 중 잘못된 단계를 고르고 그 이유를 쓰시오.",
    "주어진 식의 소인수분해 결과가 옳지 않은 이유를 설명하시오."
  ],
  "mt-중1-1-0-2-1-skill": [
    "다음 소인수분해 계산 과정에서 오류가 있는 부분을 찾아 바르게 고치시오.",
    "다음 학생의 소인수분해 풀이 중 잘못된 단계를 고르고 그 이유를 쓰시오.",
    "주어진 식의 소인수분해 결과가 옳지 않은 이유를 설명하시오."
  ],
  "mt-중1-1-0-2-2-basic": [
    "소인수분해의 정의와 성질에 대한 설명 중 옳지 않은 것을 고르시오.",
    "다음 중 소수와 합성수, 소인수분해에 대한 설명으로 참인 것을 모두 고르시오.",
    "두 자연수의 곱과 소인수분해의 관계에 대한 설명 중 빈칸에 들어갈 말을 쓰시오."
  ],
  "mt-중1-1-0-2-3-basic": [
    "주어진 문장의 조건을 보고 소인수분해를 이용하여 올바른 식을 세우시오.",
    "다음 실생활 상황을 소인수분해 식으로 나타내고 답을 구하시오.",
    "주어진 자연수를 나누어떨어지게 하는 소인수분해 활용 식을 완성하시오."
  ],
  "mt-중1-1-1-1-1-basic": [
    "정수와 유리수의 사칙연산 식에서 계산 오류가 있는 부분을 찾아 고치시오.",
    "다음 사칙연산 계산 과정에서 처음으로 틀린 부분을 찾아 기호를 쓰시오.",
    "다음 식을 계산할 때 분배법칙이 올바르게 적용되지 않은 부분을 고치시오."
  ],
  "mt-중1-1-1-1-2-basic": [
    "실생활 상황을 나타낸 문장제 문제를 정수와 유리수의 계산을 이용하여 해결하시오.",
    "지하철의 탑승 인원 변화를 정수의 덧셈과 뺄셈 식을 세워 구하시오.",
    "현재 온도와 고도에 따른 기온 변화를 유리수의 곱셈을 활용해 구하시오."
  ],
  "mt-중1-1-1-2-3-basic": [
    "수직선 위에서 정수와 유리수의 위치와 절댓값 개념을 적용하여 문제를 해결하시오.",
    "두 수 A와 B의 절댓값이 같고 두 수 사이의 거리가 8일 때, 두 수를 각각 구하시오.",
    "수직선 위에서 -3을 나타내는 점과 5를 나타내는 점의 한가운데 있는 수를 구하시오."
  ],
  "mt-중1-1-1-2-4-basic": [
    "주어진 정수와 유리수 혼합 계산 문제를 서로 다른 두 가지 방법으로 풀이하시오.",
    "유리수의 혼합 계산 과정을 단계별로 서술하고 계산 값을 구하시오.",
    "다음 식을 결합법칙과 분배법칙을 사용하여 가장 편리한 방법으로 계산하시오."
  ],
  "mt-중1-1-1-2-4-skill": [
    "주어진 정수와 유리수 혼합 계산 문제를 서로 다른 두 가지 방법으로 풀이하시오.",
    "유리수의 혼합 계산 과정을 단계별로 서술하고 계산 값을 구하시오.",
    "다음 식을 결합법칙과 분배법칙을 사용하여 가장 편리한 방법으로 계산하시오."
  ],

  // 과학 유형 ID
  "sc-중1-1-s0-r3-basic": [
    "과학적 탐구 과정의 각 단계에 대한 설명으로 옳은 것을 보기에서 모두 고르시오.",
    "탐구 단계 중 '가설 설정' 단계에서 지켜야 할 조건으로 옳은 것을 쓰시오.",
    "제시된 과학 탐구 사례에서 변인 통제가 올바르게 수행되었는지 판단하시오."
  ],
  "sc-중1-1-s0-r3-skill": [
    "제시된 탐구 활동을 보고 과학적 탐구 방법의 올바른 단계를 구분하여 쓰시오.",
    "주어진 실험 데이터를 바탕으로 결론을 도출하는 탐구 단계를 쓰시오.",
    "실험 결과가 가설과 일치하지 않을 때 취해야 할 과학적 탐구 단계를 고르시오."
  ],
  "sc-중1-1-s0-r4-basic": [
    "현대 사회에서 활용되는 첨단 과학 기술의 정확한 명칭을 쓰시오.",
    "실생활에 기여한 과학 기술 제품의 연결이 바르지 않은 것을 고르시오.",
    "보기의 첨단 과학 기술이 인류의 문명 발달에 미친 영향에 대해 서술하시오."
  ],
  "sc-중1-1-s0-r4-skill": [
    "제시된 과학 탐구 활동의 각 단계와 설명이 올바르게 연결된 것을 고르시오.",
    "과학적 탐구 방법의 연역적 탐구와 귀납적 탐구를 올바르게 구분하여 연결하시오.",
    "실험 장치와 실험 조건의 설정 단계가 올바르게 짝지어진 것을 고르시오."
  ],
  "sc-중1-1-s0-r5-basic": [
    "인류의 지속가능한 삶을 위한 과학 기술의 역할และ 올바른 정의를 서술하시오.",
    "생태계 보존과 신재생 에너지 개발이 지속가능한 발전과 연계되는 방식을 쓰시오.",
    "자원 고갈 문제를 해결하기 위한 친환경 과학 기술의 예시를 한 가지 쓰시오."
  ]
};

// 유형별 문제 발문 가져오기 (대표 문항 sampleQuestion 우선 적용, 없으면 fallback 생성)
export function getProblemStatement(
  typeId: string,
  typeName: string,
  subject: "math" | "science"
): string {
  const pureId = typeId.replace(/-(basic|skill|advanced)$/, "");
  
  const curricula = subject === "math" ? MATH_CURRICULA : SCIENCE_CURRICULA;
  for (const curr of curricula) {
    const found = curr.types.find((t) => t.id === pureId || t.id === typeId);
    if (found && found.sampleQuestion) {
      // 수학 수식 등 줄바꿈 문자 제거하고 텍스트만 깔끔하게 정돈
      return found.sampleQuestion.replace(/\\n/g, " ").replace(/\$\$/g, "");
    }
  }

  // fallback
  if (typeName) {
    return `${typeName}에 관한 문제를 올바르게 해결하시오.`;
  }
  return "-";
}

// 대표 문항 sampleQuestion을 우선 조회하고 없을 시 로컬 mock 발문, 그마저 없으면 fallback 사용
export function resolveProblemStatement(
  typeId: string,
  typeName: string,
  subject: "math" | "science",
  itemIndex: number
): string {
  const pureId = typeId.replace(/-(basic|skill|advanced)$/, "");
  const curricula = subject === "math" ? MATH_CURRICULA : SCIENCE_CURRICULA;

  // 1. 실제 문항 발문 데이터 (sampleQuestion) 확인
  for (const curr of curricula) {
    const found = curr.types.find((t) => t.id === pureId || t.id === typeId);
    if (found && found.sampleQuestion) {
      const clean = found.sampleQuestion.replace(/\\n/g, " ").replace(/\$\$/g, "");
      if (clean && !clean.includes("관련된 식을 풀고") && !clean.includes("값을 구하시오")) {
        return `${clean} [문항 ${itemIndex + 1}]`;
      }
    }
  }

  // 2. page.tsx 내부의 로컬 mock 발문
  const statementsList = LOCAL_MOCK_STATEMENTS[typeId] || LOCAL_MOCK_STATEMENTS[pureId];
  if (statementsList && statementsList.length > 0) {
    const idx = itemIndex % statementsList.length;
    return statementsList[idx];
  }

  // 3. fallback (getProblemStatement)
  const baseStatement = getProblemStatement(typeId, typeName, subject);
  if (baseStatement !== "-") {
    return `${baseStatement} [문항 ${itemIndex + 1}]`;
  }
  return "-";
}


// ─────────────────────────────────────────────────────────────────────────────
// 성취도 CONFIG — 시험 대비 화면(ACHIEVEMENT_CONFIG)과 동일한 라벨/색상 적용
// ─────────────────────────────────────────────────────────────────────────────

interface AchievementDisplayInfo {
  label: string;
  badgeBg: string;
  icon: "question" | "check" | "crown";
  description: string;
}

const ACHIEVEMENT_DISPLAY: Record<UIExamAchievementStatus, AchievementDisplayInfo> = {
  none: {
    label: "미진행",
    badgeBg: "bg-white",
    icon: "question",
    description: "아직 학습을 시작하지 않았어요.",
  },
  undecided: {
    label: "미판정",
    badgeBg: "bg-slate-300",
    icon: "question",
    description: "학습량이 부족해요.",
  },
  relearn: {
    label: "재학습 필요",
    badgeBg: "bg-red-500",
    icon: "check",
    description: "전혀 이해하지 못하고 있어요.",
  },
  supplement: {
    label: "보충 필요",
    badgeBg: "bg-amber-400",
    icon: "check",
    description: "이해도가 낮은 상태예요.",
  },
  understand: {
    label: "유형 이해",
    badgeBg: "bg-green-400",
    icon: "check",
    description: "충분히 이해하여 문제를 풀 수 있어요.",
  },
  master: {
    label: "유형 정복",
    badgeBg: "bg-green-600",
    icon: "crown",
    description: "완전히 이해하고 있어요.",
  },
};

function AchievementIcon({
  icon,
  className,
}: {
  icon: "question" | "check" | "crown";
  className?: string;
}) {
  if (icon === "crown") return <Crown className={cn("stroke-[2]", className)} />;
  if (icon === "check") return <Check className={cn("stroke-[3]", className)} />;
  return (
    <span
      className={cn(
        "font-extrabold text-[12px] leading-none select-none flex items-center justify-center",
        className
      )}
    >
      ?
    </span>
  );
}

function AchievementBadge({
  studentId,
  status,
  subject,
  typeId,
}: {
  studentId: string;
  status: UIExamAchievementStatus;
  subject: "math" | "science";
  typeId: string;
}) {
  // 런타임에 학생별 mockData 이력 기반 성취도 재계산
  const [liveStatus, setLiveStatus] = useState<UIExamAchievementStatus>(status);

  useEffect(() => {
    try {
      const evaluated = evaluateStudentAchievement(studentId, typeId, subject);
      setLiveStatus(toUIAchievement(evaluated));
    } catch {
      setLiveStatus(status);
    }
  }, [studentId, typeId, subject, status]);

  const cfg = ACHIEVEMENT_DISPLAY[liveStatus];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all",
        liveStatus === "none" ? "border-slate-200 bg-white text-slate-500" : "border-transparent text-white " + cfg.badgeBg
      )}
      title={cfg.description}
    >
      <div className={cn(
        "w-3.5 h-3.5 rounded flex items-center justify-center shrink-0",
        liveStatus === "none" ? "text-slate-300" :
        liveStatus === "undecided" ? "text-slate-500" : "text-white"
      )}>
        <AchievementIcon icon={cfg.icon} className="w-3 h-3" />
      </div>
      <span>{cfg.label}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 과제 상태 배지
// ─────────────────────────────────────────────────────────────────────────────

function TaskStatusBadge({
  status,
}: {
  status: "submitted" | "ongoing" | "notStarted";
}) {
  if (status === "submitted")
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
        제출완료
      </span>
    );
  if (status === "ongoing")
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
        진행중
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
      미시작
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 헬퍼 추가
// ─────────────────────────────────────────────────────────────────────────────

function formatDateTimeToMinute(iso: string): string {
  if (!iso) return "-";
  return format(parseISO(iso), "yyyy.MM.dd HH:mm");
}

function getTypeUnit(typeId: string): string {
  for (const curr of MATH_CURRICULA) {
    const found = curr.types.find((t) => typeId.startsWith(t.id));
    if (found) return found.majorUnit;
  }
  for (const curr of SCIENCE_CURRICULA) {
    const found = curr.types.find((t) => typeId.startsWith(t.id));
    if (found) return found.majorUnit;
  }
  return "-";
}

// ─────────────────────────────────────────────────────────────────────────────
// 과제 유형 결과 모달 (StudentTaskTypeResultModal)
// ─────────────────────────────────────────────────────────────────────────────

interface StudentTaskDetailResultModalProps {
  studentId: string;
  taskId: string;
  subject: "math" | "science";
  onClose: () => void;
}

function StudentTaskDetailResultModal({
  studentId,
  taskId,
  subject,
  onClose,
}: StudentTaskDetailResultModalProps) {
  const [dbStudents, setDbStudents] = useState<any[]>([]);
  useEffect(() => {
    setDbStudents(getStoredStudents());
  }, []);

  const student = dbStudents.find((s) => s.id === studentId);
  const taskResult = MOCK_TASK_RESULTS.find(
    (r) => r.studentId === studentId && r.taskId === taskId && r.subject === subject
  );

  const problemRows = useMemo(() => {
    const rows: ProblemTypeResultRow[] = [];
    if (!student || !taskResult) return rows;

    let problemNo = 1;

    taskResult.typeResults.forEach((tr) => {
      const typeId = tr.typeId;
      const typeName = tr.typeName;
      const unit = getTypeUnit(typeId);

      const totalCount = tr.correctCount + tr.incorrectCount + tr.unenteredCount;
      if (totalCount === 0) return;

      // 정답 문항 생성 (itemIndex = 0 ~ correctCount - 1)
      for (let i = 0; i < tr.correctCount; i++) {
        const itemIndex = i;
        const statement = resolveProblemStatement(typeId, typeName, subject, itemIndex);

        rows.push({
          problemId: `${taskId}-${typeId}-p-correct-${i}`,
          problemNo: problemNo++,
          typeId,
          typeName,
          unit,
          problemStatement: statement,
          result: "correct",
        });
      }

      // 오답 문항 생성 (itemIndex = correctCount ~ correctCount + incorrectCount - 1)
      for (let i = 0; i < tr.incorrectCount; i++) {
        const itemIndex = tr.correctCount + i;
        const statement = resolveProblemStatement(typeId, typeName, subject, itemIndex);

        rows.push({
          problemId: `${taskId}-${typeId}-p-incorrect-${i}`,
          problemNo: problemNo++,
          typeId,
          typeName,
          unit,
          problemStatement: statement,
          result: "incorrect",
        });
      }

      // 미입력 문항 생성 (itemIndex = correctCount + incorrectCount ~ problemCount - 1)
      for (let i = 0; i < tr.unenteredCount; i++) {
        const itemIndex = tr.correctCount + tr.incorrectCount + i;
        const statement = resolveProblemStatement(typeId, typeName, subject, itemIndex);

        rows.push({
          problemId: `${taskId}-${typeId}-p-unentered-${i}`,
          problemNo: problemNo++,
          typeId,
          typeName,
          unit,
          problemStatement: statement,
          result: "unentered",
        });
      }
    });

    return rows;
  }, [taskResult, studentId, subject, taskId, student]);

  if (!student || !taskResult) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-[calc(100vw-32px)] lg:w-[70vw] lg:min-w-[720px] max-w-[960px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 h-auto max-h-[85vh] flex flex-col">
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0 bg-slate-50/80">
          <h2 className="text-lg font-bold text-slate-800">
            과제 상세 결과
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* 모달 바디 (스크롤 격리) */}
        <div className="overflow-y-auto flex-1 p-6 min-h-0 bg-white">
          {/* 테이블 상단 정보 영역 (한 줄 요약 구조) */}
          <div className="flex items-center gap-2 mb-3.5 text-sm shrink-0">
            <span className="font-semibold text-slate-800">학생: {student.name}</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600 truncate max-w-[360px]" title={taskResult.taskName}>
              과제: {taskResult.taskName}
            </span>
          </div>
          <div className="w-full">
            <table className="w-full text-sm border-collapse table-fixed border-t border-b border-slate-200">
              <thead>
                <tr className="border-b bg-slate-50 text-slate-500 text-xs font-semibold sticky top-0 z-10">
                  <th className="text-center px-4 py-3 w-[8%]">문항</th>
                  <th className="text-left px-4 py-3 w-[30%]">유형명</th>
                  <th className="text-left px-4 py-3 w-[50%]">문제 발문</th>
                  <th className="text-center px-4 py-3 w-[12%]">결과</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {problemRows.map((row) => (
                  <tr key={row.problemId} className="hover:bg-slate-50/30">
                    {/* 문항 */}
                    <td className="px-4 py-3 text-center font-medium text-slate-600 border-r border-slate-100 whitespace-nowrap">
                      {row.problemNo}
                    </td>
                    {/* 유형명 */}
                    <td className="px-4 py-3 text-left border-r border-slate-100 align-middle">
                      <div
                        className="min-w-[180px] max-w-[240px] whitespace-normal break-keep line-clamp-2 text-slate-800 font-semibold"
                        title={row.typeName}
                      >
                        {row.typeName}
                      </div>
                    </td>
                    {/* 문제 발문 */}
                    <td className="px-4 py-3 text-left text-slate-600 text-xs font-medium border-r border-slate-100">
                      <div className="truncate" title={row.problemStatement}>
                        {row.problemStatement !== "-" && row.problemStatement.length > 40
                          ? `${row.problemStatement.slice(0, 40)}...`
                          : row.problemStatement}
                      </div>
                    </td>
                    {/* 결과 */}
                    <td className="px-4 py-3 text-center font-bold whitespace-nowrap">
                      {row.result === "correct" && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          정답
                        </span>
                      )}
                      {row.result === "incorrect" && (
                        <span className="inline-flex items-center gap-1 text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                          오답
                        </span>
                      )}
                      {row.result === "unentered" && (
                        <span className="inline-flex items-center text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full text-xs font-medium">
                          미입력
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────────────────────────────────────

export default function TaskStatusPage() {
  const router = useRouter();

  const searchParams = useSearchParams();
  const store = useTaskCenterStore();
  const querySubject = searchParams.get("subject");
  const subject = (querySubject === "math" || querySubject === "science")
    ? querySubject
    : (store.currentSubject === "math" || store.currentSubject === "science")
    ? store.currentSubject
    : "math";
  const [classFilter, setClassFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()));
  const [showStopped, setShowStopped] = useState(false);
  // 프로토타입 검증용 역할 토글 (운영 고정 UI 아님)
  const [roleMode, setRoleMode] = useState<"principal" | "teacher">("principal");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [activeDetailResult, setActiveDetailResult] = useState<{
    studentId: string;
    taskId: string;
  } | null>(null);

  // 로컬 스토리지 실시간 동기화 상태 선언
  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [dbClasses, setDbClasses] = useState<any[]>([]);

  useEffect(() => {
    setDbStudents(getStoredStudents());
    setDbClasses(getStoredClasses());
  }, []);

  const classes = useMemo(() => {
    return dbClasses;
  }, [dbClasses]);

  const students = useMemo(() => {
    return dbStudents.map((s) => {
      const cls = dbClasses.find((c) => c.id === s.classId);
      const semNum = s.semester && s.semester !== "-"
        ? (s.semester.includes("2") ? "2" : s.semester.includes("1") ? "1" : s.semester)
        : "1";
      const formattedGrade = `${s.grade}-${semNum}`;
      return {
        id: s.id,
        name: s.name,
        status: s.serviceStatus === "suspended" ? "stopped" : s.classId === null ? "free" : "active",
        grade: formattedGrade,
        classId: s.classId,
        className: cls ? cls.name : null,
      };
    });
  }, [dbStudents, dbClasses]);



  const dateStripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedDate && dateStripRef.current) {
      const el = dateStripRef.current.querySelector('[data-selected="true"]');
      if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedDate]);

  const daysInMonth = useMemo(
    () => eachDayOfInterval({ start: startOfMonth(selectedMonth), end: endOfMonth(selectedMonth) }),
    [selectedMonth]
  );

  const handlePrevMonth = () => setSelectedMonth((m) => startOfMonth(subMonths(m, 1)));
  const handleNextMonth = () => {
    const next = addMonths(selectedMonth, 1);
    if (!isFuture(next)) setSelectedMonth(startOfMonth(next));
  };

  const classOptions = useMemo(() => {
    if (roleMode === "teacher") {
      return [
        { id: "all", name: "전체" },
        ...(classes.filter((c) => ["class-2"].includes(c.id))),
      ];
    }
    return [
      { id: "all", name: "전체" },
      ...classes,
      { id: "unassigned", name: "반 미지정" },
    ];
  }, [roleMode, classes]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.status === "free") return false;
      if (s.status === "stopped" && !showStopped) return false;
      if (roleMode === "teacher") {
        if (s.classId === null) return false;
        if (!["class-2"].includes(s.classId)) return false;
      }
      if (classFilter === "unassigned") return s.classId === null;
      if (classFilter !== "all") return s.classId === classFilter;
      return true;
    });
  }, [roleMode, classFilter, showStopped, students]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return [];
    return MOCK_TASK_RESULTS.filter((r) => {
      if (r.subject !== subject) return false;
      if (!filteredStudents.some((s) => s.id === r.studentId)) return false;
      if (r.status === "notStarted") return false;

      const dt = r.submittedAt || r.lastSolvedAt || "";
      return dt.startsWith(selectedDate);
    });
  }, [selectedDate, subject, filteredStudents]);

  const teacherHasNoClass = roleMode === "teacher" && filteredStudents.length === 0;

  const matrixData = useMemo(() => {
    const result: Record<
      string,
      {
        studentResults: Record<string, { score: number; status: "submitted" | "ongoing" }>;
        participantCount: number;
        avgScore: number | null;
      }
    > = {};

    daysInMonth.forEach((day) => {
      const dk = format(day, "yyyy-MM-dd");
      const studentResults: Record<string, { score: number; status: "submitted" | "ongoing" }> = {};
      const submittedScores: number[] = [];

      filteredStudents.forEach((student) => {
        const dayResults = MOCK_TASK_RESULTS.filter((r) => {
          if (r.studentId !== student.id || r.subject !== subject) return false;
          const dt = r.submittedAt || r.lastSolvedAt || "";
          return dt.startsWith(dk);
        });

        const submitted = dayResults.find((r) => r.status === "submitted");
        const ongoing = dayResults.find((r) => r.status === "ongoing");

        if (submitted) {
          studentResults[student.id] = { score: submitted.score, status: "submitted" };
          submittedScores.push(submitted.score);
        } else if (ongoing) {
          studentResults[student.id] = { score: 0, status: "ongoing" };
        }
      });

      result[dk] = {
        studentResults,
        participantCount: Object.keys(studentResults).length,
        avgScore:
          submittedScores.length > 0
            ? Math.round(submittedScores.reduce((a, b) => a + b, 0) / submittedScores.length)
            : null,
      };
    });
    return result;
  }, [daysInMonth, filteredStudents, subject]);

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    const dayResults = MOCK_TASK_RESULTS.filter((r) => {
      if (r.subject !== subject) return false;
      if (!filteredStudents.some((s) => s.id === r.studentId)) return false;
      const dt = r.submittedAt || r.lastSolvedAt || "";
      return dt.startsWith(selectedDate);
    });

    const submittedResults = dayResults.filter((r) => r.status === "submitted");
    const ongoingResults = dayResults.filter((r) => r.status === "ongoing");

    const participantStudentIds = [...new Set(dayResults.map((r) => r.studentId))];
    const submittedStudentIds = new Set(submittedResults.map((r) => r.studentId));
    const ongoingStudentIds = new Set(ongoingResults.map((r) => r.studentId));

    const totalCorrect = submittedResults.reduce((sum, r) => sum + r.correctCount, 0);
    const totalProblems = submittedResults.reduce((sum, r) => sum + r.totalProblems, 0);
    const avgScore =
      submittedResults.length > 0
        ? Math.round(submittedResults.reduce((sum, r) => sum + r.score, 0) / submittedResults.length)
        : null;

    return {
      participantStudentIds,
      submittedCount: submittedStudentIds.size,
      ongoingCount: ongoingStudentIds.size,
      participantCount: participantStudentIds.length,
      avgScore,
      totalCorrect,
      totalProblems,
    };
  }, [selectedDate, subject, filteredStudents]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-64px)] bg-[#F8F9FA] flex flex-col min-h-0 w-0 min-w-full overflow-hidden">

      {/* 상단 고정 영역 (헤더 + 필터) */}
      <div className="shrink-0 flex flex-col bg-white">
        {/* ── 상단 헤더 ──────────────────────────────────────────────────────── */}
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (selectedDate) {
                  setSelectedDate(null);
                } else {
                  router.push(`/admin/task-center?subject=${subject}`);
                }
              }}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 whitespace-nowrap select-none">
                <BarChart2 className="h-5 w-5 text-primary shrink-0" />
                <span>과제 현황</span>
                {selectedDate && (
                  <>
                    <span className="text-slate-300 font-light mx-1 select-none">|</span>
                    <span className="text-[17px] font-semibold text-slate-500">
                      {format(parseISO(selectedDate), "yyyy년 MM월 dd일 (EEE)", { locale: ko })}
                    </span>
                  </>
                )}
                <button
                  onClick={() => {
                    setSelectedDate(null);
                    router.push(`/admin/task-center/status?subject=${subject === "math" ? "science" : "math"}`);
                  }}
                  title={`${subject === "math" ? "과학" : "수학"} 과제 현황으로 이동`}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all border shrink-0 hover:scale-105 active:scale-95 duration-150",
                    subject === "math"
                      ? "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                      : "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100 hover:text-purple-700"
                  )}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0 animate-pulse",
                    subject === "math" ? "bg-blue-500" : "bg-purple-500"
                  )} />
                  {subject === "math" ? "수학" : "과학"}
                </button>
              </h1>
            </div>
          </div>


        </div>

        {/* ── 필터 영역 ──────────────────────────────────────────────────────── */}
        <div className="bg-white border-b px-6 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-2">


          {/* 월 이동 */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-bold text-sm px-2 min-w-[90px] text-center">
              {format(selectedMonth, "yyyy년 MM월")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={handleNextMonth}
              disabled={isFuture(addMonths(selectedMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* 반 선택 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">반</span>
            <div className="flex gap-1 flex-wrap">
              {classOptions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClassFilter(c.id)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-lg border transition-all",
                    classFilter === c.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-muted-foreground border-slate-200 hover:border-primary/30"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>



          {/* ── 프로토타입 검증용 역할 토글 (운영 고정 UI 아님) ── */}
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/60">
            <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
              프로토타입
            </span>
            <button
              onClick={() => {
                setRoleMode("principal");
                setClassFilter("all");
              }}
              className={cn(
                "px-2.5 py-0.5 text-xs font-medium rounded-md transition-all",
                roleMode === "principal"
                  ? "bg-amber-500 text-white"
                  : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50"
              )}
            >
              대표선생님
            </button>
            <button
              onClick={() => {
                setRoleMode("teacher");
                setClassFilter("all");
              }}
              className={cn(
                "px-2.5 py-0.5 text-xs font-medium rounded-md transition-all",
                roleMode === "teacher"
                  ? "bg-amber-500 text-white"
                  : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50"
              )}
            >
              일반선생님
            </button>
          </div>
        </div>
      </div>

      {/* ── 컨텐츠 ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden p-6">
        {teacherHasNoClass ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Users className="h-12 w-12 text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">조회 가능한 담당 반이 없습니다.</p>
            <p className="text-xs text-muted-foreground mt-1">
              대표선생님에게 반 배정을 요청해 주세요.
            </p>
          </div>
        ) : !selectedDate ? (
          /* ───── 월별 매트릭스 ───── */
          <div className="w-full max-w-full min-w-0 overflow-hidden">
            <p className="px-0 pb-2 text-xs text-muted-foreground">
              날짜 클릭 시 일자 상세로 이동합니다.
            </p>

            <div className="w-full max-w-full min-w-0 overflow-auto border-y border-slate-200 max-h-full">
              <div className="min-w-full">
                {/* 헤더 */}
                <div className="flex h-12 border-b bg-slate-50 sticky top-0 z-20">
                  <div className="w-44 shrink-0 sticky left-0 z-30 bg-slate-50 border-r border-slate-100 flex items-center px-4">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      학생명
                    </span>
                  </div>
                  <div
                    className="grid flex-1 min-w-0"
                    style={{
                      gridTemplateColumns: `repeat(${daysInMonth.length}, minmax(44px, 1fr))`,
                    }}
                  >
                    {daysInMonth.map((day) => {
                      const dk = format(day, "yyyy-MM-dd");
                      const future = isFuture(day) && !isToday(day);
                      const hasData = (matrixData[dk]?.participantCount ?? 0) > 0;
                      const isHovered = hoveredDate === dk;
                      const isDimmed = future || !hasData;

                      return (
                        <button
                          key={dk}
                          onClick={() => !future && setSelectedDate(dk)}
                          onMouseEnter={() => !future && setHoveredDate(dk)}
                          onMouseLeave={() => !future && setHoveredDate(null)}
                          disabled={future}
                          title={future ? undefined : "일별 과제 현황 보기"}
                          className={cn(
                            "h-full flex flex-col items-center justify-center transition-colors relative pb-1.5",
                            isDimmed
                              ? "opacity-20 cursor-default"
                              : "cursor-pointer",
                            isHovered ? "bg-primary/5" : "hover:bg-primary/5"
                          )}
                        >
                          <span className="text-[9px] font-medium leading-none mb-0.5">
                            {format(day, "eee", { locale: ko })}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center",
                              isToday(day) && "ring-1 ring-primary/40 text-primary font-extrabold"
                            )}
                          >
                            {format(day, "d")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 참여 학생 요약 행 */}
                <div className="flex h-9 border-b bg-slate-50/80">
                  <div className="w-44 shrink-0 sticky left-0 z-20 bg-slate-50/80 border-r border-slate-100 flex items-center px-4 font-bold text-slate-700 text-xs">
                    참여 학생
                  </div>
                  <div
                    className="grid flex-1 min-w-0"
                    style={{
                      gridTemplateColumns: `repeat(${daysInMonth.length}, minmax(44px, 1fr))`,
                    }}
                  >
                    {daysInMonth.map((day) => {
                      const dk = format(day, "yyyy-MM-dd");
                      const data = matrixData[dk];
                      const isHovered = hoveredDate === dk;
                      return (
                        <div
                          key={dk}
                          className={cn(
                            "flex items-center justify-center transition-colors text-xs text-slate-600 font-semibold",
                            isHovered && "bg-primary/5"
                          )}
                        >
                          {data?.participantCount > 0 ? `${data.participantCount}명` : ""}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 평균 점수 요약 행 */}
                <div className="flex h-9 border-b-2 border-slate-200 bg-slate-50/80">
                  <div className="w-44 shrink-0 sticky left-0 z-20 bg-slate-50/80 border-r border-slate-100 flex items-center px-4 font-bold text-slate-700 text-xs">
                    평균 점수
                  </div>
                  <div
                    className="grid flex-1 min-w-0"
                    style={{
                      gridTemplateColumns: `repeat(${daysInMonth.length}, minmax(44px, 1fr))`,
                    }}
                  >
                    {daysInMonth.map((day) => {
                      const dk = format(day, "yyyy-MM-dd");
                      const data = matrixData[dk];
                      const isHovered = hoveredDate === dk;
                      return (
                        <div
                          key={dk}
                          className={cn(
                            "flex items-center justify-center transition-colors text-xs font-bold text-slate-800",
                            isHovered && "bg-primary/5"
                          )}
                        >
                          {data?.avgScore !== null && data?.avgScore !== undefined
                            ? `${data.avgScore}점`
                            : ""}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 학생 행 */}
                {filteredStudents.length === 0 ? (
                  <div className="flex items-center justify-center py-16 text-sm text-muted-foreground border-b bg-white">
                    조회할 학생이 없습니다.
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex h-14 border-b group hover:bg-slate-50/60 transition-colors bg-white"
                    >
                      <div className="w-44 shrink-0 sticky left-0 z-20 bg-white group-hover:bg-slate-50/60 border-r border-slate-100 flex items-center gap-2.5 px-3 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                          {student.name[0]}
                        </div>
                        <div className="flex flex-col min-w-0 leading-tight">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => router.push(`/admin/student-list/${student.id}`)}
                              className={cn(
                                "text-xs font-bold truncate text-left hover:underline shrink-0",
                                student.status === "stopped"
                                  ? "text-slate-300"
                                  : "text-slate-700 hover:text-primary"
                              )}
                            >
                              {student.name}
                            </button>
                            {student.status === "stopped" && (
                              <span className="px-1 py-0.2 rounded text-[8px] font-semibold bg-red-100 text-red-600 shrink-0">
                                정지
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {student.className || "반 미지정"} · {student.grade}
                          </span>
                        </div>
                      </div>

                      <div
                        className="grid flex-1 min-w-0"
                        style={{
                          gridTemplateColumns: `repeat(${daysInMonth.length}, minmax(44px, 1fr))`,
                        }}
                      >
                        {daysInMonth.map((day) => {
                          const dk = format(day, "yyyy-MM-dd");
                          const cellData = matrixData[dk]?.studentResults[student.id];
                          const future = isFuture(day) && !isToday(day);
                          const isHovered = hoveredDate === dk;
                          return (
                            <button
                              key={dk}
                              onClick={() => !future && setSelectedDate(dk)}
                              onMouseEnter={() => !future && setHoveredDate(dk)}
                              onMouseLeave={() => !future && setHoveredDate(null)}
                              disabled={future}
                              className={cn(
                                "h-full flex items-center justify-center text-xs transition-colors relative",
                                future
                                  ? "opacity-0 cursor-default"
                                  : "cursor-pointer",
                                isHovered && "bg-primary/5"
                              )}
                            >
                              {cellData?.status === "submitted" && (
                                <span className="bg-white border border-slate-200/80 shadow-sm text-slate-700 text-[10px] font-bold rounded-lg px-1.5 py-0.5 leading-none shrink-0">
                                  {cellData.score}점
                                </span>
                              )}
                              {cellData?.status === "ongoing" && (
                                <span className="bg-blue-50/80 border border-blue-100 text-blue-600 text-[9px] font-semibold rounded-lg px-1.5 py-0.5 leading-none shrink-0">
                                  진행중
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ───── 상세 모드 ───── */
          <div className="space-y-5 w-full max-w-full h-full min-h-0 flex flex-col overflow-hidden">
            {/* 날짜 보조 스트립 카드 */}
            <div className="pb-0 border-b border-slate-200 w-full max-w-full overflow-hidden shrink-0 bg-transparent">
              <div
                ref={dateStripRef}
                className="grid gap-0.5 w-full"
                style={{
                  gridTemplateColumns: `repeat(${daysInMonth.length}, minmax(0, 1fr))`,
                }}
              >
                {daysInMonth.map((day) => {
                  const dk = format(day, "yyyy-MM-dd");
                  const isSelected = dk === selectedDate;
                  const isTodayDate = isToday(day);
                  const future = isFuture(day) && !isTodayDate;
                  const hasData = (matrixData[dk]?.participantCount ?? 0) > 0;
                  const isHovered = hoveredDate === dk;
                  const isDimmed = future || (!hasData && !isSelected);

                  return (
                    <button
                      key={dk}
                      onClick={() => !future && setSelectedDate(dk)}
                      onMouseEnter={() => !future && setHoveredDate(dk)}
                      onMouseLeave={() => !future && setHoveredDate(null)}
                      disabled={future}
                      className={cn(
                        "h-12 flex flex-col items-center justify-center transition-colors relative pb-2 min-w-0 w-full rounded-lg",
                        isDimmed ? "opacity-20" : "",
                        future ? "cursor-default" : "cursor-pointer",
                        isHovered ? "bg-slate-100/50" : "bg-transparent"
                      )}
                    >
                      <span className={cn(
                        "text-[9px] leading-none mb-1.5 transition-colors",
                        isSelected 
                          ? "text-[#f59e0b] font-bold" 
                          : isTodayDate 
                          ? "text-blue-500 font-bold" 
                          : "text-slate-500 font-medium"
                      )}>
                        {isTodayDate ? "오늘" : format(day, "eee", { locale: ko })}
                      </span>
                      <span
                        className={cn(
                          "text-xs transition-all",
                          isSelected 
                            ? "text-[#f59e0b] font-extrabold text-sm" 
                            : isTodayDate 
                            ? "text-slate-800 font-bold" 
                            : "text-slate-700 font-semibold"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {/* 하단 오렌지색 두꺼운 밑줄 표시 */}
                      {isSelected && (
                        <div className="absolute bottom-0 left-1 right-1 h-[3px] bg-[#f59e0b] rounded-t-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 수평 요약 바 (Horizontal Summary Bar) */}
            {selectedDayData && (
              <div className="py-2.5 border-b border-slate-200 flex flex-wrap items-center gap-x-4 gap-y-2 shrink-0 bg-transparent text-xs text-slate-600">
                {[
                  { label: "참여", value: `${selectedDayData.participantCount}명` },
                  { label: "제출완료", value: `${selectedDayData.submittedCount}명` },
                  { label: "진행중", value: `${selectedDayData.ongoingCount}명` },
                  { label: "평균", value: selectedDayData.avgScore !== null ? `${selectedDayData.avgScore}점` : "-" },
                  { label: "정답", value: `${selectedDayData.totalCorrect}문항` },
                  { label: "제출", value: `${selectedDayData.totalProblems}문항` },
                ].map(({ label, value }, idx, arr) => (
                  <React.Fragment key={label}>
                    <div className="flex items-center gap-1.5 py-0.5">
                      <span className="font-semibold text-slate-400">{label}</span>
                      <span className="font-extrabold text-slate-800">{value}</span>
                    </div>
                    {idx < arr.length - 1 && (
                      <span className="text-slate-200 font-medium select-none">|</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* 빈 상태 */}
            {(!selectedDayData || selectedDayData.participantCount === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-transparent flex-1">
                <Calendar className="h-12 w-12 text-slate-200 mb-4 animate-pulse" />
                <p className="text-slate-500 font-medium">
                  선택한 날짜의 과제 현황이 없습니다.
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  다른 날짜를 선택하거나 필터를 변경해 주세요.
                </p>
              </div>
            ) : (
              /* 과제 수행 목록 테이블 */
              <div className="w-full max-w-full flex-1 min-h-0 flex flex-col bg-transparent">
                <div className="py-2.5 flex items-center justify-between shrink-0">
                  <h2 className="text-sm font-bold text-slate-700">
                    과제 수행 목록 ({selectedDayTasks.length}건)
                  </h2>
                </div>
                <div className="w-full max-w-full min-w-0 overflow-auto flex-1 bg-transparent">
                  <table className="w-max min-w-full table-auto text-sm border-collapse border-t border-b border-slate-200 bg-white">
                    <thead>
                      <tr className="border-b bg-slate-50 text-slate-500 text-xs font-semibold sticky top-0 z-10">
                        <th className="text-left px-4 py-2.5">학생</th>
                        <th className="text-left px-4 py-2.5">반</th>
                        <th className="text-left px-4 py-2.5">학년/학기</th>
                        <th className="text-left px-4 py-2.5">과제명</th>
                        <th className="text-center px-4 py-2.5">과제 상태</th>
                        <th className="text-left px-4 py-2.5">출제 단원</th>
                        <th className="text-center px-4 py-2.5">점수</th>
                        <th className="text-center px-4 py-2.5">진행률</th>
                        <th className="text-center px-4 py-2.5">정답/제출</th>
                        <th className="text-center px-4 py-2.5">미입력</th>
                        <th className="text-center px-4 py-2.5">일시</th>
                        <th className="text-center px-4 py-2.5">상세</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {selectedDayTasks.map((r) => {
                        const student = students.find((s) => s.id === r.studentId);
                        if (!student) return null;

                        return (
                          <tr
                            key={`${r.studentId}-${r.taskId}`}
                            className="hover:bg-slate-50/50 transition-colors border-l-4 border-l-transparent"
                          >
                            {/* 학생 */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                                  {student.name[0]}
                                </div>
                                <button
                                  onClick={() => router.push(`/admin/student-list/${student.id}`)}
                                  className={cn(
                                    "text-xs font-bold truncate text-left hover:underline shrink-0",
                                    student.status === "stopped"
                                      ? "text-slate-300"
                                      : "text-slate-700 hover:text-primary"
                                  )}
                                >
                                  {student.name}
                                </button>
                                {student.status === "stopped" && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-500 border border-rose-100 shrink-0">
                                    정지
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 반 */}
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                              {student.className ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                                  {student.className}
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100/50 text-slate-400">
                                  반 미지정
                                </span>
                              )}
                            </td>

                            {/* 학년/학기 */}
                            <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs font-medium">
                              {student.grade}
                            </td>

                            {/* 과제명 */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <button
                                onClick={() => router.push(`/admin/task-center/${r.taskId}`)}
                                className="text-xs font-bold text-primary hover:underline text-left truncate max-w-[220px]"
                                title={r.taskName}
                              >
                                {r.taskName}
                              </button>
                            </td>

                            {/* 과제 상태 */}
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <TaskStatusBadge status={r.status} />
                            </td>

                            {/* 출제 단원 */}
                            <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs max-w-[260px] truncate" title={r.unit}>
                              {r.unit}
                            </td>

                            {/* 점수 */}
                            <td className="px-4 py-3 whitespace-nowrap text-center font-bold text-slate-800">
                              {r.status === "submitted" ? `${r.score}점` : "-"}
                            </td>

                            {/* 진행률 */}
                            <td className="px-4 py-3 whitespace-nowrap text-center font-semibold text-blue-600">
                              {r.status === "ongoing"
                                ? `${r.answeredProblems}/${r.totalProblems}`
                                : "-"}
                            </td>

                            {/* 정답/제출 */}
                            <td className="px-4 py-3 whitespace-nowrap text-center text-slate-500 font-medium">
                              {r.status === "submitted"
                                ? `${r.correctCount}/${r.totalProblems}`
                                : "-"}
                            </td>

                            {/* 미입력 */}
                            <td className="px-4 py-3 whitespace-nowrap text-center text-slate-400 text-xs">
                              {r.status === "submitted" ? `${r.unenteredCount}문항` : "-"}
                            </td>

                            {/* 일시 */}
                            <td className="px-4 py-3 whitespace-nowrap text-center text-slate-400 text-xs font-medium">
                              {r.submittedAt
                                ? formatDateTimeToMinute(r.submittedAt)
                                : r.lastSolvedAt
                                ? formatDateTimeToMinute(r.lastSolvedAt)
                                : "-"}
                            </td>

                            {/* 상세 */}
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              {r.status === "submitted" ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setActiveDetailResult({ studentId: r.studentId, taskId: r.taskId })}
                                  className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-full flex items-center justify-center mx-auto"
                                  title="과제 상세 결과 보기"
                                  aria-label="과제 상세 결과 보기"
                                >
                                  <Search className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-slate-400 font-medium">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 과제 상세 결과 모달 (StudentTaskDetailResultModal) ──────────────────────── */}
      {activeDetailResult && (
        <StudentTaskDetailResultModal
          studentId={activeDetailResult.studentId}
          taskId={activeDetailResult.taskId}
          subject={subject}
          onClose={() => setActiveDetailResult(null)}
        />
      )}
    </div>
  );
}
