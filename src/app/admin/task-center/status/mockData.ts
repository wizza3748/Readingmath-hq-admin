// ─────────────────────────────────────────────────────────────────────────────
// 과제 현황 전용 더미 데이터 (실제 API 연동 전 프로토타입용)
//
// ▸ 유형명 / 유형ID: MATH_CURRICULA / SCIENCE_CURRICULA 의 실제 데이터 사용
//   - 수학 유형 ID 형식: "{typeId}-basic" | "{typeId}-skill" | "{typeId}-advanced"
//   - 과학 유형 ID 형식: "{typeId}"  (이미 난이도가 ID에 내포됨)
// ▸ 성취도: evaluateAchievementStatus() 함수를 page.tsx에서 런타임에 호출
//   - 시험 대비 화면과 동일한 판정 로직 및 동일한 localStorage 이력 참조
// ▸ 정규 학습 훈련 데이터 미사용
// ─────────────────────────────────────────────────────────────────────────────
import { MATH_CURRICULA, SCIENCE_CURRICULA } from "@/lib/task-center-mock";

// ExamAchievementStatus 타입을 직접 정의 (순환 참조 방지, 시험 대비와 동일)
export type ExamAchievementStatus =
  | "none"
  | "undetermined"
  | "relearn"
  | "supplement"
  | "understand"
  | "master";

// ── 타입 정의 ─────────────────────────────────────────────────────────────────

export interface MockClass {
  id: string;
  name: string;
}

export interface MockStudent {
  id: string;
  name: string;
  status: "active" | "stopped" | "free";
  grade: string;
  classId: string | null;
  className: string | null;
}

export interface MockTypeResult {
  /** 실제 MATH_CURRICULA / SCIENCE_CURRICULA의 type.id 기반 풀이용 ID */
  typeId: string;
  typeName: string;
  problemCount: number;
  correctCount: number;
  incorrectCount: number;
  unenteredCount: number;
}

export interface MockTaskResult {
  studentId: string;
  taskId: string;
  taskName: string;
  subject: "math" | "science";
  course: string;
  unit: string;
  status: "submitted" | "ongoing" | "notStarted";
  submittedAt?: string;
  lastSolvedAt?: string;
  totalProblems: number;
  answeredProblems: number;
  correctCount: number;
  incorrectCount: number;
  unenteredCount: number;
  score: number;
  typeResults: MockTypeResult[];
}

export interface MockExamPrepHistory {
  studentId: string;
  /** 실제 MATH_CURRICULA / SCIENCE_CURRICULA의 fullTypeId */
  typeId: string;
  typeName: string;
  solvedAt: string;
  problemCount: number;
  correctCount: number;
}

// ── 점수 계산 ──────────────────────────────────────────────────────────────────

function calcScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}



// ── 과제 결과 목록 ─────────────────────────────────────────────────────────────
//
// 수학 유형 ID (MATH_CURRICULA 중1-1 실제 데이터 기반):
//   mt-중1-1-0-1-1  → "소인수분해 문장제 해결하기"  (1단원-소인수분해)
//   mt-중1-1-0-2-1  → "소인수분해 오류 찾기"        (1단원-소인수분해)
//   mt-중1-1-1-1-1  → "정수와 유리수 오류 찾기"     (2단원-정수와 유리수)
//   mt-중1-1-1-1-2  → "정수와 유리수 문장제 해결하기" (2단원-정수와 유리수)
//   mt-중1-1-1-2-3  → "정수와 유리수 개념 적용하기" (2단원-정수와 유리수)
//   mt-중1-1-1-2-4  → "정수와 유리수 여러 가지 방법으로 풀기" (2단원)
//
// 과학 유형 ID (SCIENCE_CURRICULA 중1-1 실제 데이터 기반, ID 자체에 난이도 포함):
//   sc-중1-1-s0-r3-basic  → "각 탐구 단계에 대한 옳은 설명 고르기"
//   sc-중1-1-s0-r3-skill  → "과학적 탐구 방법의 단계 구분"
//   sc-중1-1-s0-r4-basic  → "첨단 과학 기술의 명칭"
//   sc-중1-1-s0-r4-skill  → "탐구 단계의 올바른 연결"
//   sc-중1-1-s0-r5-basic  → "지속가능한 삶의 정의"

export const MOCK_TASK_RESULTS: MockTaskResult[] = [

  // ──────────────── 2026-06-03 ────────────────────────────────────────────────
  {
    studentId: "s1", taskId: "task-001", taskName: "소인수분해 기본", subject: "math",
    course: "중1-1", unit: "1단원-소인수분해 > 소인수분해의 이해",
    status: "submitted", submittedAt: "2026-06-03T10:25:00",
    totalProblems: 10, answeredProblems: 10, correctCount: 10, incorrectCount: 0, unenteredCount: 0,
    score: 100,
    typeResults: [
      {
        typeId: "mt-중1-1-0-1-1-basic",
        typeName: "소인수분해 문장제 해결하기",
        problemCount: 3, correctCount: 3, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-1-basic",
        typeName: "소인수분해 오류 찾기",
        problemCount: 3, correctCount: 3, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-2-basic",
        typeName: "소인수분해 개념 적용하기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-3-basic",
        typeName: "소인수분해 식 세우기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
    ],
  },
  {
    studentId: "s2", taskId: "task-001", taskName: "소인수분해 기본", subject: "math",
    course: "중1-1", unit: "1단원-소인수분해 > 소인수분해의 이해",
    status: "submitted", submittedAt: "2026-06-03T11:10:00",
    totalProblems: 10, answeredProblems: 10, correctCount: 6, incorrectCount: 3, unenteredCount: 1,
    score: calcScore(6, 10),
    typeResults: [
      {
        typeId: "mt-중1-1-0-1-1-basic",
        typeName: "소인수분해 문장제 해결하기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-1-basic",
        typeName: "소인수분해 오류 찾기",
        problemCount: 3, correctCount: 1, incorrectCount: 1, unenteredCount: 1,
      },
      {
        typeId: "mt-중1-1-0-2-2-basic",
        typeName: "소인수분해 개념 적용하기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-3-basic",
        typeName: "소인수분해 식 세우기",
        problemCount: 2, correctCount: 1, incorrectCount: 1, unenteredCount: 0,
      },
    ],
  },
  {
    studentId: "s3", taskId: "task-002", taskName: "정수와 유리수 기본", subject: "math",
    course: "중2-1", unit: "2단원-정수와 유리수 > 정수와 유리수의 이해",
    status: "submitted", submittedAt: "2026-06-03T09:45:00",
    totalProblems: 8, answeredProblems: 8, correctCount: 7, incorrectCount: 1, unenteredCount: 0,
    score: calcScore(7, 8),
    typeResults: [
      {
        typeId: "mt-중1-1-1-1-1-basic",
        typeName: "정수와 유리수 오류 찾기",
        problemCount: 3, correctCount: 3, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-1-2-basic",
        typeName: "정수와 유리수 문장제 해결하기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-2-3-basic",
        typeName: "정수와 유리수 개념 적용하기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
    ],
  },
  {
    studentId: "s4", taskId: "task-002", taskName: "정수와 유리수 기본", subject: "math",
    course: "중2-1", unit: "2단원-정수와 유리수 > 정수와 유리수의 이해",
    status: "ongoing", lastSolvedAt: "2026-06-03T10:00:00",
    totalProblems: 8, answeredProblems: 4, correctCount: 0, incorrectCount: 0, unenteredCount: 0,
    score: 0,
    typeResults: [],
  },

  // ──────────────── 2026-06-05 ────────────────────────────────────────────────
  {
    studentId: "s5", taskId: "task-003", taskName: "정수와 유리수 심화", subject: "math",
    course: "중2-2", unit: "2단원-정수와 유리수 > 정수와 유리수 심화 탐구",
    status: "submitted", submittedAt: "2026-06-05T14:30:00",
    totalProblems: 12, answeredProblems: 12, correctCount: 9, incorrectCount: 2, unenteredCount: 1,
    score: calcScore(9, 12),
    typeResults: [
      {
        typeId: "mt-중1-1-1-2-3-basic",
        typeName: "정수와 유리수 개념 적용하기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-2-4-skill",
        typeName: "정수와 유리수 여러 가지 방법으로 풀기",
        problemCount: 3, correctCount: 2, incorrectCount: 0, unenteredCount: 1,
      },
      {
        typeId: "mt-중1-1-1-1-1-basic",
        typeName: "정수와 유리수 오류 찾기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-1-2-basic",
        typeName: "정수와 유리수 문장제 해결하기",
        problemCount: 3, correctCount: 3, incorrectCount: 0, unenteredCount: 0,
      },
    ],
  },
  {
    studentId: "s6", taskId: "task-004", taskName: "정수와 유리수 개념", subject: "math",
    course: "중3-1", unit: "2단원-정수와 유리수 > 정수와 유리수의 이해",
    status: "submitted", submittedAt: "2026-06-05T15:20:00",
    totalProblems: 10, answeredProblems: 10, correctCount: 5, incorrectCount: 3, unenteredCount: 2,
    score: calcScore(5, 10),
    typeResults: [
      {
        typeId: "mt-중1-1-1-1-1-basic",
        typeName: "정수와 유리수 오류 찾기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-1-2-basic",
        typeName: "정수와 유리수 문장제 해결하기",
        problemCount: 3, correctCount: 1, incorrectCount: 1, unenteredCount: 1,
      },
      {
        typeId: "mt-중1-1-1-2-3-basic",
        typeName: "정수와 유리수 개념 적용하기",
        problemCount: 2, correctCount: 1, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-2-4-basic",
        typeName: "정수와 유리수 여러 가지 방법으로 풀기",
        problemCount: 2, correctCount: 1, incorrectCount: 0, unenteredCount: 1,
      },
    ],
  },
  {
    studentId: "s1", taskId: "task-005", taskName: "과학탐구 기초", subject: "science",
    course: "중1-1", unit: "1단원 과학과 인류의 지속가능한 삶 > 과학과 인류의 지속가능한 삶",
    status: "submitted", submittedAt: "2026-06-05T16:00:00",
    totalProblems: 8, answeredProblems: 8, correctCount: 7, incorrectCount: 1, unenteredCount: 0,
    score: calcScore(7, 8),
    typeResults: [
      {
        typeId: "sc-중1-1-s0-r3-basic",
        typeName: "각 탐구 단계에 대한 옳은 설명 고르기",
        problemCount: 3, correctCount: 3, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "sc-중1-1-s0-r4-basic",
        typeName: "첨단 과학 기술의 명칭",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "sc-중1-1-s0-r5-basic",
        typeName: "지속가능한 삶의 정의",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
    ],
  },

  // ──────────────── 2026-06-10 ────────────────────────────────────────────────
  {
    studentId: "s1", taskId: "task-006", taskName: "소인수분해 심화", subject: "math",
    course: "중1-1", unit: "1단원-소인수분해 > 소인수분해 기본 원리",
    status: "submitted", submittedAt: "2026-06-10T10:00:00",
    totalProblems: 10, answeredProblems: 10, correctCount: 10, incorrectCount: 0, unenteredCount: 0,
    score: 100,
    typeResults: [
      {
        typeId: "mt-중1-1-0-1-1-basic",
        typeName: "소인수분해 문장제 해결하기",
        problemCount: 3, correctCount: 3, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-1-skill",
        typeName: "소인수분해 오류 찾기",
        problemCount: 3, correctCount: 3, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-2-basic",
        typeName: "소인수분해 개념 적용하기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-3-basic",
        typeName: "소인수분해 식 세우기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
    ],
  },
  {
    studentId: "s2", taskId: "task-006", taskName: "소인수분해 심화", subject: "math",
    course: "중1-1", unit: "1단원-소인수분해 > 소인수분해 기본 원리",
    status: "submitted", submittedAt: "2026-06-10T11:30:00",
    totalProblems: 10, answeredProblems: 10, correctCount: 7, incorrectCount: 2, unenteredCount: 1,
    score: calcScore(7, 10),
    typeResults: [
      {
        typeId: "mt-중1-1-0-1-1-basic",
        typeName: "소인수분해 문장제 해결하기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-1-skill",
        typeName: "소인수분해 오류 찾기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-2-basic",
        typeName: "소인수분해 개념 적용하기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-3-basic",
        typeName: "소인수분해 식 세우기",
        problemCount: 2, correctCount: 1, incorrectCount: 0, unenteredCount: 1,
      },
    ],
  },
  {
    studentId: "s3", taskId: "task-007", taskName: "정수와 유리수 종합", subject: "math",
    course: "중2-1", unit: "2단원-정수와 유리수 > 정수와 유리수의 이해",
    status: "ongoing", lastSolvedAt: "2026-06-10T09:00:00",
    totalProblems: 10, answeredProblems: 6, correctCount: 0, incorrectCount: 0, unenteredCount: 0,
    score: 0,
    typeResults: [],
  },
  {
    studentId: "s4", taskId: "task-007", taskName: "정수와 유리수 종합", subject: "math",
    course: "중2-1", unit: "2단원-정수와 유리수 > 정수와 유리수의 이해",
    status: "submitted", submittedAt: "2026-06-10T13:00:00",
    totalProblems: 10, answeredProblems: 10, correctCount: 10, incorrectCount: 0, unenteredCount: 0,
    score: calcScore(10, 10),
    typeResults: [
      {
        typeId: "mt-중1-1-1-1-1-basic",
        typeName: "정수와 유리수 오류 찾기",
        problemCount: 3, correctCount: 3, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-2-3-basic",
        typeName: "정수와 유리수 개념 적용하기",
        problemCount: 3, correctCount: 3, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-1-2-basic",
        typeName: "정수와 유리수 문장제 해결하기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-2-4-basic",
        typeName: "정수와 유리수 여러 가지 방법으로 풀기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
    ],
  },
  {
    studentId: "s5", taskId: "task-008", taskName: "정수와 유리수 응용", subject: "math",
    course: "중2-2", unit: "2단원-정수와 유리수 > 정수와 유리수의 이해",
    status: "submitted", submittedAt: "2026-06-10T14:00:00",
    totalProblems: 10, answeredProblems: 10, correctCount: 6, incorrectCount: 4, unenteredCount: 0,
    score: calcScore(6, 10),
    typeResults: [
      {
        typeId: "mt-중1-1-1-2-4-skill",
        typeName: "정수와 유리수 여러 가지 방법으로 풀기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-1-2-basic",
        typeName: "정수와 유리수 문장제 해결하기",
        problemCount: 3, correctCount: 1, incorrectCount: 2, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-1-1-basic",
        typeName: "정수와 유리수 오류 찾기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-2-3-basic",
        typeName: "정수와 유리수 개념 적용하기",
        problemCount: 2, correctCount: 1, incorrectCount: 1, unenteredCount: 0,
      },
    ],
  },
  {
    studentId: "s7", taskId: "task-009", taskName: "소인수분해 조건 풀기", subject: "math",
    course: "중3-2", unit: "1단원-소인수분해 > 소인수분해 기본 원리",
    status: "submitted", submittedAt: "2026-06-10T15:30:00",
    totalProblems: 12, answeredProblems: 12, correctCount: 8, incorrectCount: 3, unenteredCount: 1,
    score: calcScore(8, 12),
    typeResults: [
      {
        typeId: "mt-중1-1-0-2-1-basic",
        typeName: "소인수분해 오류 찾기",
        problemCount: 3, correctCount: 3, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-1-1-skill",
        typeName: "소인수분해 문장제 해결하기",
        problemCount: 3, correctCount: 1, incorrectCount: 1, unenteredCount: 1,
      },
      {
        typeId: "mt-중1-1-0-2-2-basic",
        typeName: "소인수분해 개념 적용하기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-3-basic",
        typeName: "소인수분해 식 세우기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
    ],
  },

  // ──────────────── 2026-06-13 (과학) ─────────────────────────────────────────
  {
    studentId: "s2", taskId: "task-010", taskName: "탐구 방법 이해", subject: "science",
    course: "중1-1", unit: "1단원 과학과 인류의 지속가능한 삶 > 과학과 인류의 지속가능한 삶",
    status: "submitted", submittedAt: "2026-06-13T10:00:00",
    totalProblems: 8, answeredProblems: 8, correctCount: 5, incorrectCount: 2, unenteredCount: 1,
    score: calcScore(5, 8),
    typeResults: [
      {
        typeId: "sc-중1-1-s0-r3-skill",
        typeName: "과학적 탐구 방법의 단계 구분",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "sc-중1-1-s0-r4-skill",
        typeName: "탐구 단계의 올바른 연결",
        problemCount: 3, correctCount: 1, incorrectCount: 1, unenteredCount: 1,
      },
      {
        typeId: "sc-중1-1-s0-r5-basic",
        typeName: "지속가능한 삶의 정의",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
    ],
  },
  {
    studentId: "s3", taskId: "task-011", taskName: "탐구 단계 심화", subject: "science",
    course: "중2-1", unit: "1단원 과학과 인류의 지속가능한 삶 > 과학과 인류의 지속가능한 삶",
    status: "submitted", submittedAt: "2026-06-13T11:30:00",
    totalProblems: 10, answeredProblems: 10, correctCount: 8, incorrectCount: 2, unenteredCount: 0,
    score: calcScore(8, 10),
    typeResults: [
      {
        typeId: "sc-중1-1-s0-r3-basic",
        typeName: "각 탐구 단계에 대한 옳은 설명 고르기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "sc-중1-1-s0-r5-basic",
        typeName: "지속가능한 삶의 정의",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "sc-중1-1-s0-r4-basic",
        typeName: "첨단 과학 기술의 명칭",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "sc-중1-1-s0-r4-skill",
        typeName: "탐구 단계의 올바른 연결",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
    ],
  },
  {
    studentId: "s6", taskId: "task-012", taskName: "과학 탐구 종합", subject: "science",
    course: "중3-1", unit: "1단원 과학과 인류의 지속가능한 삶 > 과학과 인류의 지속가능한 삶",
    status: "ongoing", lastSolvedAt: "2026-06-13T09:00:00",
    totalProblems: 10, answeredProblems: 3, correctCount: 0, incorrectCount: 0, unenteredCount: 0,
    score: 0,
    typeResults: [],
  },

  // ──────────────── 2026-06-16 (당일) ─────────────────────────────────────────
  {
    studentId: "s1", taskId: "task-013", taskName: "소인수분해 조건 응용", subject: "math",
    course: "중1-1", unit: "1단원-소인수분해 > 소인수분해 기본 원리",
    status: "submitted", submittedAt: "2026-06-16T08:45:00",
    totalProblems: 10, answeredProblems: 10, correctCount: 10, incorrectCount: 0, unenteredCount: 0,
    score: 100,
    typeResults: [
      {
        typeId: "mt-중1-1-0-2-1-basic",
        typeName: "소인수분해 오류 찾기",
        problemCount: 3, correctCount: 3, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-1-1-basic",
        typeName: "소인수분해 문장제 해결하기",
        problemCount: 3, correctCount: 3, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-2-basic",
        typeName: "소인수분해 개념 적용하기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-3-basic",
        typeName: "소인수분해 식 세우기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
    ],
  },
  {
    studentId: "s11", taskId: "task-013", taskName: "소인수분해 조건 응용", subject: "math",
    course: "중1-1", unit: "1단원-소인수분해 > 소인수분해 기본 원리",
    status: "submitted", submittedAt: "2026-06-16T09:10:00",
    totalProblems: 10, answeredProblems: 10, correctCount: 6, incorrectCount: 4, unenteredCount: 0,
    score: calcScore(6, 10),
    typeResults: [
      {
        typeId: "mt-중1-1-0-2-1-basic",
        typeName: "소인수분해 오류 찾기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-1-1-basic",
        typeName: "소인수분해 문장제 해결하기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-2-basic",
        typeName: "소인수분해 개념 적용하기",
        problemCount: 2, correctCount: 1, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-3-basic",
        typeName: "소인수분해 식 세우기",
        problemCount: 2, correctCount: 1, incorrectCount: 1, unenteredCount: 0,
      },
    ],
  },

  // ──────────────── 2026-05 (전월) ─────────────────────────────────────────────
  {
    studentId: "s1", taskId: "task-m01", taskName: "소인수분해 입문", subject: "math",
    course: "중1-1", unit: "1단원-소인수분해 > 소인수분해의 이해",
    status: "submitted", submittedAt: "2026-05-08T10:00:00",
    totalProblems: 8, answeredProblems: 8, correctCount: 7, incorrectCount: 1, unenteredCount: 0,
    score: calcScore(7, 8),
    typeResults: [
      {
        typeId: "mt-중1-1-0-1-1-basic",
        typeName: "소인수분해 문장제 해결하기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-1-basic",
        typeName: "소인수분해 오류 찾기",
        problemCount: 3, correctCount: 3, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-0-2-2-basic",
        typeName: "소인수분해 개념 적용하기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
    ],
  },
  {
    studentId: "s3", taskId: "task-m02", taskName: "정수와 유리수 입문", subject: "math",
    course: "중2-1", unit: "2단원-정수와 유리수 > 정수와 유리수의 이해",
    status: "submitted", submittedAt: "2026-05-15T11:00:00",
    totalProblems: 10, answeredProblems: 10, correctCount: 9, incorrectCount: 1, unenteredCount: 0,
    score: calcScore(9, 10),
    typeResults: [
      {
        typeId: "mt-중1-1-1-1-1-basic",
        typeName: "정수와 유리수 오류 찾기",
        problemCount: 3, correctCount: 3, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-1-2-basic",
        typeName: "정수와 유리수 문장제 해결하기",
        problemCount: 3, correctCount: 2, incorrectCount: 1, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-2-3-basic",
        typeName: "정수와 유리수 개념 적용하기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
      {
        typeId: "mt-중1-1-1-2-4-basic",
        typeName: "정수와 유리수 여러 가지 방법으로 풀기",
        problemCount: 2, correctCount: 2, incorrectCount: 0, unenteredCount: 0,
      },
    ],
  },
];

// ── 시험 대비 풀이 이력 (유형 풀이 이력 모달 전용) ──────────────────────────────
// - 실제 MATH_CURRICULA / SCIENCE_CURRICULA 의 fullTypeId 사용
// - 매트릭스·일별 과제 목록에 미노출, 유형 풀이 이력 모달에서만 구분 표시

export const MOCK_EXAM_PREP_HISTORY: MockExamPrepHistory[] = [
  {
    studentId: "s1", typeId: "mt-중1-1-0-1-1-basic",
    typeName: "소인수분해 문장제 해결하기",
    solvedAt: "2026-06-01T10:00:00", problemCount: 5, correctCount: 5,
  },
  {
    studentId: "s1", typeId: "mt-중1-1-0-2-1-basic",
    typeName: "소인수분해 오류 찾기",
    solvedAt: "2026-06-02T11:00:00", problemCount: 5, correctCount: 5,
  },
  {
    studentId: "s2", typeId: "mt-중1-1-0-1-1-basic",
    typeName: "소인수분해 문장제 해결하기",
    solvedAt: "2026-05-28T14:00:00", problemCount: 5, correctCount: 5,
  },
  {
    studentId: "s3", typeId: "mt-중1-1-1-1-1-basic",
    typeName: "정수와 유리수 오류 찾기",
    solvedAt: "2026-06-04T09:00:00", problemCount: 4, correctCount: 4,
  },
  {
    studentId: "s5", typeId: "mt-중1-1-1-2-3-basic",
    typeName: "정수와 유리수 개념 적용하기",
    solvedAt: "2026-06-08T15:00:00", problemCount: 6, correctCount: 5,
  },
  {
    studentId: "s5", typeId: "mt-중1-1-1-2-4-skill",
    typeName: "정수와 유리수 여러 가지 방법으로 풀기",
    solvedAt: "2026-06-09T10:00:00", problemCount: 6, correctCount: 3,
  },
  {
    studentId: "s1", typeId: "sc-중1-1-s0-r3-basic",
    typeName: "각 탐구 단계에 대한 옳은 설명 고르기",
    solvedAt: "2026-06-04T09:00:00", problemCount: 4, correctCount: 4,
  },
  {
    studentId: "s2", typeId: "sc-중1-1-s0-r3-skill",
    typeName: "과학적 탐구 방법의 단계 구분",
    solvedAt: "2026-06-12T10:00:00", problemCount: 4, correctCount: 3,
  },
  {
    studentId: "s1", typeId: "mt-중1-1-0-1-1-basic",
    typeName: "소인수분해 문장제 해결하기",
    solvedAt: "2026-06-17T10:00:00", problemCount: 2, correctCount: 0,
  },
  {
    studentId: "s3", typeId: "mt-중1-1-0-1-1-basic",
    typeName: "소인수분해 문장제 해결하기",
    solvedAt: "2026-06-17T10:00:00", problemCount: 2, correctCount: 0,
  },
  {
    studentId: "s5", typeId: "mt-중1-1-0-1-1-basic",
    typeName: "소인수분해 문장제 해결하기",
    solvedAt: "2026-06-17T10:00:00", problemCount: 2, correctCount: 0,
  },
  {
    studentId: "s6", typeId: "mt-중1-1-0-1-1-basic",
    typeName: "소인수분해 문장제 해결하기",
    solvedAt: "2026-06-17T10:00:00", problemCount: 2, correctCount: 0,
  },
];

// ── 실시간 유형명 매핑 보정 ──────────────────────────────────────────────────────
function getRealTypeName(typeId: string, subject: "math" | "science"): string {
  const pureId = typeId.replace(/-(basic|skill|advanced)$/, "");
  const list = subject === "math" ? MATH_CURRICULA : SCIENCE_CURRICULA;
  for (const course of list) {
    const found = course.types.find(t => t.id === pureId || t.id === typeId);
    if (found) return found.typeName;
  }
  return "";
}

MOCK_TASK_RESULTS.forEach(r => {
  r.typeResults.forEach(tr => {
    const realName = getRealTypeName(tr.typeId, r.subject);
    if (realName) {
      tr.typeName = realName;
    }
  });
});

MOCK_EXAM_PREP_HISTORY.forEach(h => {
  const subject = h.typeId.startsWith("sc") ? "science" : "math";
  const realName = getRealTypeName(h.typeId, subject);
  if (realName) {
    h.typeName = realName;
  }
});
