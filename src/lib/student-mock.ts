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
  mathGradeTerm?: string; // 수학 학습 학기 (예: 중1-1, 중3-1 등)
  scienceGradeTerm?: string; // 과학 학습 학기
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
    id: "s1",
    seq: 1,
    name: "김민준",
    pinNumber: "1234",
    loginId: "minjun1",
    parentPhone: "01011112222",
    serviceType: "combo",
    grade: "중등 1",
    semester: "1학기",
    mathGradeTerm: "중1-1",
    scienceGradeTerm: "중1-1",
    classId: "class-1",
    serviceStatus: "in_use",
    serviceEndDate: "2027-12-31",
    createdAt: "2026-01-01",
    recommendCode: "",
  },
  {
    id: "s2",
    seq: 2,
    name: "이서연",
    pinNumber: "1234",
    loginId: "seoyeon2",
    parentPhone: "01022223333",
    serviceType: "combo",
    grade: "중등 1",
    semester: "1학기",
    classId: "class-1",
    serviceStatus: "in_use",
    serviceEndDate: "2027-12-31",
    createdAt: "2026-01-01",
    recommendCode: "",
  },
  {
    id: "s3",
    seq: 3,
    name: "박지호",
    pinNumber: "1234",
    loginId: "jiho3",
    parentPhone: "01033334444",
    serviceType: "combo",
    grade: "중등 2",
    semester: "1학기",
    classId: "class-2",
    serviceStatus: "in_use",
    serviceEndDate: "2027-12-31",
    createdAt: "2026-01-01",
    recommendCode: "",
  },
  {
    id: "s4",
    seq: 4,
    name: "최수아",
    pinNumber: "1234",
    loginId: "sua4",
    parentPhone: "01044445555",
    serviceType: "combo",
    grade: "중등 2",
    semester: "1학기",
    classId: "class-2",
    serviceStatus: "in_use",
    serviceEndDate: "2027-12-31",
    createdAt: "2026-01-01",
    recommendCode: "",
  },
  {
    id: "s5",
    seq: 5,
    name: "정우진",
    pinNumber: "1234",
    loginId: "woojin5",
    parentPhone: "01055556666",
    serviceType: "combo",
    grade: "중등 2",
    semester: "2학기",
    classId: "class-2",
    serviceStatus: "in_use",
    serviceEndDate: "2027-12-31",
    createdAt: "2026-01-01",
    recommendCode: "",
  },
  {
    id: "s6",
    seq: 6,
    name: "한소율",
    pinNumber: "1234",
    loginId: "soyul6",
    parentPhone: "01066667777",
    serviceType: "combo",
    grade: "중등 3",
    semester: "1학기",
    classId: "class-3",
    serviceStatus: "in_use",
    serviceEndDate: "2027-12-31",
    createdAt: "2026-01-01",
    recommendCode: "",
  },
  {
    id: "s7",
    seq: 7,
    name: "윤태양",
    pinNumber: "1234",
    loginId: "taeyang7",
    parentPhone: "01077778888",
    serviceType: "combo",
    grade: "중등 3",
    semester: "2학기",
    classId: "class-3",
    serviceStatus: "in_use",
    serviceEndDate: "2027-12-31",
    createdAt: "2026-01-01",
    recommendCode: "",
  },
  {
    id: "s8",
    seq: 8,
    name: "강다은",
    pinNumber: "1234",
    loginId: "daeun8",
    parentPhone: "01088889999",
    serviceType: "combo",
    grade: "중등 1",
    semester: "1학기",
    classId: "class-1",
    serviceStatus: "suspended",
    serviceEndDate: "2027-12-31",
    createdAt: "2026-01-01",
    recommendCode: "",
  },
  {
    id: "s9",
    seq: 9,
    name: "임현우",
    pinNumber: "1234",
    loginId: "hyunwoo9",
    parentPhone: "01099990000",
    serviceType: "combo",
    grade: "중등 2",
    semester: "1학기",
    classId: "class-2",
    serviceStatus: "suspended",
    serviceEndDate: "2027-12-31",
    createdAt: "2026-01-01",
    recommendCode: "",
  },
  {
    id: "s10",
    seq: 10,
    name: "오지민",
    pinNumber: "1234",
    loginId: "jimin10",
    parentPhone: "01012341234",
    serviceType: "combo",
    grade: "중등 1",
    semester: "1학기",
    classId: null,
    serviceStatus: "before_use",
    serviceEndDate: "2027-12-31",
    createdAt: "2026-01-01",
    recommendCode: "",
  },
  {
    id: "s11",
    seq: 11,
    name: "신예린",
    pinNumber: "1234",
    loginId: "yerin11",
    parentPhone: "01043214321",
    serviceType: "combo",
    grade: "중등 1",
    semester: "1학기",
    classId: null,
    serviceStatus: "in_use",
    serviceEndDate: "2027-12-31",
    createdAt: "2026-01-01",
    recommendCode: "",
  },
];

const STUDENT_STORAGE_KEY = "readingmath_students_data";

/** grade(중등 1) + semester(1학기) → 학습학기 코드(중1-1) 파생 */
function deriveGradeTerm(grade: string, semester: string): string {
  const gradeMap: Record<string, string> = {
    "초등 3": "초3", "초등 4": "초4", "초등 5": "초5", "초등 6": "초6",
    "중등 1": "중1", "중등 2": "중2", "중등 3": "중3", "고등 1": "고1",
  };
  const semMap: Record<string, string> = { "1학기": "1", "2학기": "2" };
  const g = gradeMap[grade];
  const s = semMap[semester];
  if (!g || !s) return "중1-1";
  return `${g}-${s}`;
}

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
    const parsed = JSON.parse(stored) as Student[];
    // 구버전 학생 데이터 자동 마이그레이션
    const hasLegacyData = parsed.some(s => s.id.startsWith("student-") || !s.hasOwnProperty("semester") || !s.semester || s.semester === "-");
    if (hasLegacyData) {
      localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    // mathGradeTerm / scienceGradeTerm 누락 시 기본학기에서 파생 자동 적용
    const needsMigration = parsed.some(s => !s.mathGradeTerm || !s.scienceGradeTerm);
    if (needsMigration) {
      const migrated = parsed.map(s => ({
        ...s,
        mathGradeTerm: s.mathGradeTerm || deriveGradeTerm(s.grade, s.semester),
        scienceGradeTerm: s.scienceGradeTerm || deriveGradeTerm(s.grade, s.semester),
      }));
      localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return parsed;
  } catch (e) {
    return INITIAL_STUDENTS;
  }
}

export function saveStoredStudents(students: Student[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(students));
  }
}
