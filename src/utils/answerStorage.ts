export interface Answer {
  questionIndex: number;       // 0-based
  type: "choice" | "input";
  selectedChoices?: number[];  // 1-based 선지 번호 배열 (선지형)
  inputValue?: string;         // 입력값 (입력형)
}

declare global {
  interface Window {
    __readingmath_answers__?: Record<string, Answer[]>;
  }
}

// SSR 환경 고려하여 window 안전 확인
const getGlobalStore = (): Record<string, Answer[]> => {
  if (typeof window === "undefined") {
    return {};
  }
  if (!window.__readingmath_answers__) {
    window.__readingmath_answers__ = {};
  }
  return window.__readingmath_answers__;
};

export function getAnswers(taskId: string): Answer[] {
  const store = getGlobalStore();
  return store[taskId] ? [...store[taskId]] : [];
}

export function saveAnswer(taskId: string, answer: Answer): void {
  if (typeof window === "undefined") return;
  const store = getGlobalStore();
  if (!store[taskId]) {
    store[taskId] = [];
  }

  const existingIndex = store[taskId].findIndex(
    (a) => a.questionIndex === answer.questionIndex
  );

  if (existingIndex > -1) {
    store[taskId][existingIndex] = answer;
  } else {
    store[taskId].push(answer);
  }

  // index 기준 오름차순 정렬 유지
  store[taskId].sort((a, b) => a.questionIndex - b.questionIndex);
}

export function clearAnswers(taskId: string): void {
  if (typeof window === "undefined") return;
  const store = getGlobalStore();
  delete store[taskId];
}
