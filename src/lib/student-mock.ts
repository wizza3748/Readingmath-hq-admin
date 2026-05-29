// ──────────────────────────────────────────────────────────────
// 학생 관리 - 타입 정의 및 목 데이터
// ──────────────────────────────────────────────────────────────

import { ClassInfo, ALL_CLASSES, getStoredTeachers, Teacher } from "./teacher-mock";

export type StudentServiceStatus = "before_use" | "in_use" | "suspended"; // 사용전 | 사용중 | 서비스 정지
export type StudentServiceType = "math" | "science" | "combo"; // 리딩수학 | 리딩과학 | 리딩수학+과학 통합

export interface Student {
  id: string;
  seq: number;
  name: string;
  pinNumber: string;
  loginId: string;
  parentPhone: string;
  serviceType: StudentServiceType;
  grade: string; // 초등 3, 초등 4, 중등 1 등 또는 미정
  semester: string; // 1학기, 2학기 등 또는 -
  classId: string | null; // 소속 반 ID
  serviceStatus: StudentServiceStatus;
  serviceEndDate: string; // YYYY-MM-DD 또는 -
  createdAt: string; // YYYY-MM-DD
  recommendCode: string;
}

// ── 헬퍼 함수 ──────────────────────────────────────────────────

export function getStudentStatusLabel(status: StudentServiceStatus): string {
  switch (status) {
    case "before_use": return "사용전";
    case "in_use": return "사용중";
    case "suspended": return "서비스 정지";
    default: return "-";
  }
}

export function getStudentServiceTypeLabel(type: StudentServiceType): string {
  switch (type) {
    case "math": return "리딩수학";
    case "science": return "리딩과학";
    case "combo": return "리딩수학+과학 통합";
    default: return "-";
  }
}

/** 담당 선생님 연산 매핑 생성 */
export function getAssignedTeacherMap(teachers: Teacher[]): Record<string, string> {
  const map: Record<string, string> = {};
  teachers.forEach(t => {
    t.assignedClasses.forEach(cls => {
      map[cls.id] = t.name;
    });
  });
  return map;
}

// ── 목 데이터 ──────────────────────────────────────────────────

export const INITIAL_STUDENTS: Student[] = [
  {
    id: "student-3845",
    seq: 3845,
    name: "김네스토오",
    pinNumber: "",
    loginId: "test12345",
    parentPhone: "01036983748",
    serviceType: "combo",
    grade: "초등 4",
    semester: "2학기",
    classId: null,
    serviceStatus: "before_use",
    serviceEndDate: "",
    createdAt: "2026-01-06",
    recommendCode: "",
  },
  {
    id: "student-3273",
    seq: 3273,
    name: "육학생",
    pinNumber: "1234",
    loginId: "",
    parentPhone: "01012345678",
    serviceType: "combo",
    grade: "초등 4",
    semester: "1학기",
    classId: null,
    serviceStatus: "suspended",
    serviceEndDate: "",
    createdAt: "2025-12-17",
    recommendCode: "REC-ALPHA",
  },
  {
    id: "student-3200",
    seq: 3200,
    name: "오학생",
    pinNumber: "",
    loginId: "",
    parentPhone: "01012345678",
    serviceType: "combo",
    grade: "미정",
    semester: "",
    classId: null,
    serviceStatus: "suspended",
    serviceEndDate: "",
    createdAt: "2025-12-17",
    recommendCode: "",
  },
  {
    id: "student-3199",
    seq: 3199,
    name: "사학생",
    pinNumber: "",
    loginId: "",
    parentPhone: "01012345678",
    serviceType: "combo",
    grade: "미정",
    semester: "",
    classId: "class-1", // 초3A반 (진반장 담당)
    serviceStatus: "suspended",
    serviceEndDate: "",
    createdAt: "2025-12-17",
    recommendCode: "",
  },
  {
    id: "student-3198",
    seq: 3198,
    name: "삼학생",
    pinNumber: "",
    loginId: "",
    parentPhone: "01012345678",
    serviceType: "combo",
    grade: "미정",
    semester: "",
    classId: "class-1", // 초3A반 (진반장 담당)
    serviceStatus: "suspended",
    serviceEndDate: "",
    createdAt: "2025-12-17",
    recommendCode: "REC-BETA",
  },
  {
    id: "student-3197",
    seq: 3197,
    name: "이학생",
    pinNumber: "1234",
    loginId: "",
    parentPhone: "01012345578",
    serviceType: "combo",
    grade: "초등 3",
    semester: "1학기",
    classId: "class-2", // 초4B반 (진반장 담당)
    serviceStatus: "suspended",
    serviceEndDate: "",
    createdAt: "2025-12-17",
    recommendCode: "",
  },
  {
    id: "student-3196",
    seq: 3196,
    name: "진리딩",
    pinNumber: "1234",
    loginId: "",
    parentPhone: "01036983748",
    serviceType: "combo",
    grade: "중등 1",
    semester: "1학기",
    classId: "class-3", // 초5C반 (담당교사 미지정 반)
    serviceStatus: "in_use",
    serviceEndDate: "",
    createdAt: "2025-12-17",
    recommendCode: "",
  },
];

const STUDENT_STORAGE_KEY = "readingmath_students_data";

export function getStoredStudents(): Student[] {
  if (typeof window === "undefined") {
    return INITIAL_STUDENTS;
  }
  const stored = localStorage.getItem(STUDENT_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(INITIAL_STUDENTS));
    return INITIAL_STUDENTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_STUDENTS;
  }
}

export function saveStoredStudents(students: Student[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(students));
  }
}
