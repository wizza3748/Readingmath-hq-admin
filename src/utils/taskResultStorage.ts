"use client";

export interface GradingDetail {
  questionIndex: number; // 0-based
  status: "correct" | "incorrect" | "unentered";
  submittedAnswer?: string | number[]; // 입력형(string) 또는 선지형(number[])
  correctAnswer?: string | number[];   // 정답값
}

export interface TaskResult {
  taskId: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  unenteredCount: number;
  submittedAt: string; // ISO String
  gradingDetails: GradingDetail[];
}

declare global {
  interface Window {
    __readingmath_task_results__?: Record<string, TaskResult>;
  }
}

const getGlobalStore = (): Record<string, TaskResult> => {
  if (typeof window === "undefined") {
    return {};
  }
  if (!window.__readingmath_task_results__) {
    // localStorage에서 기존 데이터 로드 시도
    try {
      const saved = localStorage.getItem("readingmath_task_results");
      window.__readingmath_task_results__ = saved ? JSON.parse(saved) : {};
    } catch (e) {
      window.__readingmath_task_results__ = {};
    }
  }
  return window.__readingmath_task_results__ || {};
};

const saveGlobalStore = (store: Record<string, TaskResult>): void => {
  if (typeof window === "undefined") return;
  window.__readingmath_task_results__ = store;
  try {
    localStorage.setItem("readingmath_task_results", JSON.stringify(store));
  } catch (e) {
    console.error("Failed to save task results to localStorage", e);
  }
};

export function getTaskResult(taskId: string): TaskResult | null {
  const store = getGlobalStore();
  return store[taskId] ? { ...store[taskId] } : null;
}

export function saveTaskResult(taskId: string, result: TaskResult): void {
  const store = getGlobalStore();
  store[taskId] = result;
  saveGlobalStore(store);
}

export function clearTaskResult(taskId: string): void {
  const store = getGlobalStore();
  delete store[taskId];
  saveGlobalStore(store);
}
