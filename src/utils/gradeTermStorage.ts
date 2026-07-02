/**
 * 과목별 학기 정보를 localStorage에 저장/조회하는 유틸리티
 * 수학과 과학의 학기를 별도로 분리 관리합니다.
 */

const STORAGE_KEY = "readingmath_grade_term_v1";
const CHANGE_EVENT = "readingmath-grade-term-changed";

export type SubjectKey = "math" | "science";

export interface GradeTermStore {
  math: string;
  science: string;
}

const DEFAULT_STORE: GradeTermStore = {
  math: "중1-1",
  science: "중1-1",
};

/** 전체 과목별 학기 store를 불러옵니다. */
export function getGradeTermStore(): GradeTermStore {
  if (typeof window === "undefined") return { ...DEFAULT_STORE };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STORE };
    const parsed = JSON.parse(raw) as Partial<GradeTermStore>;
    return {
      math: parsed.math ?? DEFAULT_STORE.math,
      science: parsed.science ?? DEFAULT_STORE.science,
    };
  } catch {
    return { ...DEFAULT_STORE };
  }
}

/** 특정 과목의 학기 값을 불러옵니다. */
export function getGradeTerm(subject: SubjectKey): string {
  return getGradeTermStore()[subject];
}

/** 특정 과목의 학기 값을 저장하고, 변경 이벤트를 발송합니다. */
export function setGradeTerm(subject: SubjectKey, gradeTerm: string): void {
  if (typeof window === "undefined") return;
  const store = getGradeTermStore();
  store[subject] = gradeTerm;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(
    new CustomEvent(CHANGE_EVENT, { detail: { subject, gradeTerm } })
  );
}

/**
 * 학기 변경 이벤트 리스너를 등록합니다.
 * 반환값은 클린업 함수입니다.
 */
export function onGradeTermChange(
  callback: (subject: SubjectKey, gradeTerm: string) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail as {
      subject: SubjectKey;
      gradeTerm: string;
    };
    callback(detail.subject, detail.gradeTerm);
  };
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

/** 학기 코드(예: "중1-1")를 표시용 레이블(예: "중등 1학년 1학기")로 변환합니다. */
export function gradeTermToLabel(code: string): string {
  const map: Record<string, string> = {
    "초3-1": "초등 3학년 1학기",
    "초3-2": "초등 3학년 2학기",
    "초4-1": "초등 4학년 1학기",
    "초4-2": "초등 4학년 2학기",
    "초5-1": "초등 5학년 1학기",
    "초5-2": "초등 5학년 2학기",
    "초6-1": "초등 6학년 1학기",
    "초6-2": "초등 6학년 2학기",
    "중1-1": "중등 1학년 1학기",
    "중1-2": "중등 1학년 2학기",
    "중2-1": "중등 2학년 1학기",
    "중2-2": "중등 2학년 2학기",
    "중3-1": "중등 3학년 1학기",
    "중3-2": "중등 3학년 2학기",
    "고1-1": "고등 1학년 1학기",
    "고1-2": "고등 1학년 2학기",
  };
  return map[code] ?? code;
}
