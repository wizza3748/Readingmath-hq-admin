"use client";

import { getStoredTasks } from "./taskStorage";
import { getTaskResult } from "./taskResultStorage";
import { getQuestionsByTaskId } from "../lib/task-solve-mock";
import { MATH_CURRICULA, SCIENCE_CURRICULA } from "../lib/task-center-mock";

// 성취도 상태 타입
export type ExamAchievementStatus = "none" | "undetermined" | "relearn" | "supplement" | "understand" | "master";

// 풀이 이력 아이템 인터페이스
export interface ExamPrepHistoryItem {
  id: string;
  typeId: string;
  questionId: string;
  path: "시험 대비" | "과제 센터";
  isCorrect: boolean;
  submittedAnswer: string;
  solvedAt: string; // ISO String
}

const HISTORY_STORAGE_KEY = "readingmath_examprep_history_v1";

// 수학 유형 ID -> 문항 ID 목록 매핑 테이블 (유형당 3개 문항 매핑)
export const MATH_TYPE_TO_QUESTIONS: Record<string, string[]> = {};

// 과학 유형 ID -> 문항 ID 목록 매핑 테이블 (유형당 3개 문항 매핑)
export const SCIENCE_TYPE_TO_QUESTIONS: Record<string, string[]> = {};

// 해시 함수
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// 매핑 초기화 함수
function initializeMappings() {
  const mathBasicPool = ["math-sample-1", "math-sample-5", "math-sample-7", "math-sample-8"];
  const mathSkillPool = ["math-sample-2", "math-sample-4", "math-sample-6", "math-sample-9"];
  const mathAdvancedPool = ["math-sample-3", "math-sample-10"];

  const sciBasicPool = ["science-sample-1", "science-sample-2", "science-sample-3", "science-sample-5"];
  const sciSkillPool = ["science-sample-4", "science-sample-7", "science-sample-8"];
  const sciAdvancedPool = ["science-sample-6", "science-sample-9", "science-sample-10"];

  // 수학 매핑 생성
  MATH_CURRICULA.forEach((course) => {
    course.types.forEach((type) => {
      const h = hashString(type.id);
      if (type.difficultyCount.basic > 0) {
        MATH_TYPE_TO_QUESTIONS[`${type.id}-basic`] = [
          mathBasicPool[h % 4],
          mathBasicPool[(h + 1) % 4],
          mathBasicPool[(h + 2) % 4]
        ];
      }
      if (type.difficultyCount.intermediate > 0) {
        MATH_TYPE_TO_QUESTIONS[`${type.id}-skill`] = [
          mathSkillPool[h % 4],
          mathSkillPool[(h + 1) % 4],
          mathSkillPool[(h + 2) % 4]
        ];
      }
      if (type.difficultyCount.advanced > 0) {
        MATH_TYPE_TO_QUESTIONS[`${type.id}-advanced`] = [
          mathAdvancedPool[h % 2],
          mathAdvancedPool[(h + 1) % 2],
          mathSkillPool[h % 4]
        ];
      }
    });
  });

  // 과학 매핑 생성
  SCIENCE_CURRICULA.forEach((course) => {
    course.types.forEach((type) => {
      const h = hashString(type.id);
      if (type.difficultyCount.basic > 0) {
        SCIENCE_TYPE_TO_QUESTIONS[`${type.id}-basic`] = [
          sciBasicPool[h % 4],
          sciBasicPool[(h + 1) % 4],
          sciBasicPool[(h + 2) % 4]
        ];
      }
      if (type.difficultyCount.intermediate > 0) {
        SCIENCE_TYPE_TO_QUESTIONS[`${type.id}-skill`] = [
          sciSkillPool[h % 3],
          sciSkillPool[(h + 1) % 3],
          sciSkillPool[(h + 2) % 3]
        ];
      }
      if (type.difficultyCount.advanced > 0) {
        SCIENCE_TYPE_TO_QUESTIONS[`${type.id}-advanced`] = [
          sciAdvancedPool[h % 3],
          sciAdvancedPool[(h + 1) % 3],
          sciAdvancedPool[(h + 2) % 3]
        ];
      }
    });
  });
}

// 초기화 실행
initializeMappings();

// 각 유형에 대한 초기 mock 이력 생성 함수 (화면 검수용 기본값)
export function getMockHistoryForType(typeId: string, subject: "math" | "science"): ExamPrepHistoryItem[] {
  const questions = subject === "math" ? MATH_TYPE_TO_QUESTIONS[typeId] : SCIENCE_TYPE_TO_QUESTIONS[typeId];
  if (!questions || questions.length === 0) return [];

  const h = hashString(typeId);
  const statusIndex = h % 6; // 0: none, 1: undetermined, 2: relearn, 3: supplement, 4: understand, 5: master

  const baseDate = new Date("2026-06-01T00:00:00Z");

  const createItem = (isCorrect: boolean, offsetDays: number, qIdx: number): ExamPrepHistoryItem => {
    const solvedAt = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000).toISOString();
    return {
      id: `mock-${typeId}-${offsetDays}`,
      typeId,
      questionId: questions[qIdx % questions.length],
      path: (h + qIdx) % 2 === 0 ? "시험 대비" : "과제 센터",
      isCorrect,
      submittedAnswer: "mock",
      solvedAt,
    };
  };

  switch (statusIndex) {
    case 0: // 미진행 (이력 없음)
      return [];
    case 1: // 미판정 (최신 이력 1개)
      return [createItem(true, 1, 0)];
    case 2: // 재학습 필요 (최신 연속 2개 오답)
      return [createItem(false, 2, 0), createItem(false, 1, 1)];
    case 3: // 보충 필요 (최신 2개 중 정답 1개, 오답 1개)
      return [createItem(true, 2, 0), createItem(false, 1, 1)];
    case 4: // 유형 이해 (최신 연속 2개 정답)
      return [createItem(true, 2, 0), createItem(true, 1, 1)];
    case 5: // 유형 정복 (최신 연속 3개 이상 정답)
      return [createItem(true, 3, 0), createItem(true, 2, 1), createItem(true, 1, 2)];
    default:
      return [];
  }
}

// 시험 대비 전용 로컬 이력 가져오기
function getLocalPrepHistory(): ExamPrepHistoryItem[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse local prep history", e);
    return [];
  }
}

// 시험 대비 전용 로컬 이력 저장
export function saveLocalPrepHistory(item: Omit<ExamPrepHistoryItem, "id">): void {
  if (typeof window === "undefined") return;
  const history = getLocalPrepHistory();
  const newItem: ExamPrepHistoryItem = {
    ...item,
    id: `prep-${item.typeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  history.push(newItem);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));

  // 상태 갱신 이벤트를 전송하여 화면 동기화 유도
  window.dispatchEvent(new Event("examprep-history-updated"));
}

// 유형 ID 기준 모든 이력 통합 조회 (시험 대비 실제 이력 + 과제 센터 실제 이력 + 초기 mock 이력)
export function getCombinedTypeHistory(typeId: string, subject: "math" | "science"): ExamPrepHistoryItem[] {
  const combined: ExamPrepHistoryItem[] = [];

  // 1. 시험 대비 전용 실제 이력 수집 (유형 ID 일치 조건)
  const localHistory = getLocalPrepHistory();
  const actualHistory = localHistory.filter((item) => item.typeId === typeId);
  combined.push(...actualHistory);

  // 2. 과제 센터 풀이 이력 수집 (읽기 전용 참조)
  const tasks = getStoredTasks();
  tasks.forEach((task) => {
    // 과목 및 제출완료 확인
    if (task.subject !== subject || task.status !== "submitted") return;

    const result = getTaskResult(task.id);
    if (!result) return;

    const questions = getQuestionsByTaskId(task.id);

    result.gradingDetails.forEach((detail) => {
      const q = questions[detail.questionIndex] as any;
      if (!q) return;

      // [추가 준수 조건] 
      // - 유형 ID가 같은 문항 풀이 결과만 포함 (유형명/난이도/중요여부 대체 매칭 금지)
      // - 유형 ID가 확인되지 않는 과제 센터 풀이 결과는 이력에 포함하지 않음
      const qDifficulty = q.difficulty === "basic" ? "basic" : q.difficulty === "advanced" ? "advanced" : "skill";
      const qFullTypeId = q.typeId ? `${q.typeId}-${qDifficulty}` : "";

      if (qFullTypeId && qFullTypeId === typeId) {
        combined.push({
          id: `task-${task.id}-${detail.questionIndex}`,
          typeId: qFullTypeId,
          questionId: q.id,
          path: "과제 센터",
          isCorrect: detail.status === "correct",
          submittedAnswer: Array.isArray(detail.submittedAnswer)
            ? detail.submittedAnswer.join(",")
            : String(detail.submittedAnswer),
          solvedAt: result.submittedAt || new Date().toISOString(),
        });
      }
    });
  });

  // 3. 초기 mock 이력 수집 (검수용 기본 이력)
  const mockHistory = getMockHistoryForType(typeId, subject);
  combined.push(...mockHistory);

  // 풀이 완료 순서 기준 (solvedAt 내림차순, 최신순)으로 정렬하여 반환
  return combined.sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime());
}

// 시험 대비 성취도 판정 정책 적용 함수
export function evaluateAchievementStatus(typeId: string, subject: "math" | "science"): ExamAchievementStatus {
  const history = getCombinedTypeHistory(typeId, subject);

  // 1. 유형별 문항 풀이 이력 없음 -> 미진행
  if (history.length === 0) {
    return "none";
  }

  // 2. 유형별 문항 풀이 이력 1개 -> 미판정
  if (history.length === 1) {
    return "undetermined";
  }

  // 최신 3문제 이상 체크
  const isCorrect0 = history[0].isCorrect;
  const isCorrect1 = history[1].isCorrect;

  // 3. 최신 연속 3문제 이상 정답 -> 유형 정복
  if (history.length >= 3 && isCorrect0 && isCorrect1 && history[2].isCorrect) {
    return "master";
  }

  // 4. 최신 연속 2문제 정답 -> 유형 이해
  if (isCorrect0 && isCorrect1) {
    return "understand";
  }

  // 5. 최신 연속 2문제 오답 -> 재학습 필요
  if (!isCorrect0 && !isCorrect1) {
    return "relearn";
  }

  // 6. 최신 2문제 중 정답 1개, 오답 1개 -> 보충 필요
  return "supplement";
}

