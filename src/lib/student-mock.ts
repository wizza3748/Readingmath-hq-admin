// ──────────────────────────────────────────────────────────────
// 학생 관리 - 타입 정의 및 목 데이터
// ──────────────────────────────────────────────────────────────

import { ClassInfo, ALL_CLASSES, getStoredTeachers, Teacher } from "./teacher-mock";

export type StudentServiceStatus = "before_use" | "in_use" | "suspended"; // 사용전 | 사용중 | 서비스 정지
export type StudentServiceType = "math" | "science" | "combo"; // 리딩수학 | 리딩과학 | 리딩수학+과학 통합
export type StudentStopReservationStatus = "immediate" | "available" | "scheduled" | "none";

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
  institutionBillingType?: "general" | "event";
  hasCurrentMonthOverageCharge?: boolean;
  serviceStartedAt?: string;
  institutionEventEndDate?: string;
  serviceStopScheduledAt?: string | null;
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

export function getStudentStopReservationStatus(
  student: Student,
  todayText = (() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  })(),
): StudentStopReservationStatus {
  if (
    student.institutionBillingType === "event"
    && student.serviceStatus === "in_use"
    && student.hasCurrentMonthOverageCharge
    && student.serviceStartedAt === todayText
    && !student.serviceStopScheduledAt
    && (!student.institutionEventEndDate || student.institutionEventEndDate >= todayText)
  ) {
    return "immediate";
  }

  if (
    student.serviceStatus === "in_use"
    && student.serviceStopScheduledAt
    && student.serviceStopScheduledAt > todayText
  ) {
    return "scheduled";
  }

  if (
    student.institutionBillingType === "event"
    && student.serviceStatus === "in_use"
    && student.hasCurrentMonthOverageCharge
    && student.serviceStartedAt
    && student.serviceStartedAt < todayText
    && !student.serviceStopScheduledAt
    && (!student.institutionEventEndDate || student.institutionEventEndDate >= todayText)
  ) {
    return "available";
  }

  return "none";
}

export function getStudentStopReservationLabel(student: Student, todayText?: string): string {
  const status = getStudentStopReservationStatus(student, todayText);
  if (status === "immediate") return "즉시 정지 가능";
  if (status === "available") return "예약 가능";
  if (status === "scheduled" && student.serviceStopScheduledAt) {
    return `${student.serviceStopScheduledAt.replaceAll("-", ".")} 정지 예정`;
  }
  return "-";
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

const BASE_INITIAL_STUDENTS: Student[] = [
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
    institutionBillingType: "event",
    hasCurrentMonthOverageCharge: true,
    serviceStartedAt: "2026-07-01",
    institutionEventEndDate: "2027-08-31",
    serviceStopScheduledAt: null,
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

const ADDITIONAL_STUDENT_NAMES = [
  "서하준", "김도윤", "이하은", "박서준", "최지우", "정예준", "한서아",
  "윤시우", "임채원", "오준서", "신유나", "강은우", "송지안", "홍민재",
  "문서윤", "배지훈", "백하린",
];

const ADDITIONAL_STUDENTS: Student[] = ADDITIONAL_STUDENT_NAMES.map((name, index) => {
  const seq = index + 12;
  const gradeNumber = (index % 3) + 1;
  const semester = index % 2 === 0 ? "1학기" : "2학기";
  const gradeTerm = `중${gradeNumber}-${semester === "1학기" ? "1" : "2"}`;

  return {
    id: `s${seq}`,
    seq,
    name,
    pinNumber: "1234",
    loginId: `student${seq}`,
    parentPhone: `010${String(12000000 + seq * 10101).padStart(8, "0")}`,
    serviceType: seq % 4 === 0 ? "math" : seq % 4 === 1 ? "science" : "combo",
    grade: `중등 ${gradeNumber}`,
    semester,
    mathGradeTerm: gradeTerm,
    scienceGradeTerm: gradeTerm,
    classId: `class-${gradeNumber}`,
    serviceStatus: seq === 24 ? "before_use" : "in_use",
    serviceEndDate: "2027-12-31",
    createdAt: `2026-07-${String(index + 2).padStart(2, "0")}`,
    recommendCode: "",
  };
});

export const INITIAL_STUDENTS: Student[] = [...BASE_INITIAL_STUDENTS, ...ADDITIONAL_STUDENTS];

let runtimeStudents: Student[] | null = null;
let runtimeStudentActivities: unknown[] = [];

function applyEventBillingPrototypeDefaults(student: Student): Student {
  const hasCurrentMonthOverageCharge = student.seq <= 4;
  const defaultScheduledAt = student.id === "s3" ? "2026-09-01" : null;
  const now = new Date();
  const todayText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return {
    ...student,
    institutionBillingType: "event",
    hasCurrentMonthOverageCharge,
    serviceStartedAt: student.id === "s4" ? todayText : (student.serviceStartedAt || "2026-07-01"),
    institutionEventEndDate: student.institutionEventEndDate || "2027-08-31",
    serviceStopScheduledAt: student.serviceStopScheduledAt ?? defaultScheduledAt,
  };
}

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
  const now = new Date();
  const todayText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const applyScheduledState = (student: Student): Student => {
    if (student.serviceStopScheduledAt && student.serviceStopScheduledAt <= todayText) {
      return { ...student, serviceStatus: "suspended", serviceStopScheduledAt: null };
    }
    if (student.institutionEventEndDate && student.institutionEventEndDate < todayText) {
      return { ...student, serviceStatus: "suspended", serviceStopScheduledAt: null };
    }
    return student;
  };
  const initialStudents = INITIAL_STUDENTS.map((student) => applyScheduledState({
      ...applyEventBillingPrototypeDefaults(student),
      mathGradeTerm: student.mathGradeTerm || deriveGradeTerm(student.grade, student.semester),
      scienceGradeTerm: student.scienceGradeTerm || deriveGradeTerm(student.grade, student.semester),
    }));
  if (typeof window === "undefined") return initialStudents;
  if (!runtimeStudents) runtimeStudents = initialStudents;
  runtimeStudents = runtimeStudents.map(applyScheduledState);
  return runtimeStudents;
}

export function appendStudentServiceActivity(student: Student, action: string, scheduledDate: string) {
  if (typeof window === "undefined") return;
  runtimeStudentActivities.unshift({
    processedAt: new Date().toISOString(),
    processor: "기관관리자",
    studentId: student.id,
    studentName: student.name,
    action,
    scheduledDate,
  });
}

export function saveStoredStudents(students: Student[]): void {
  if (typeof window !== "undefined") {
    runtimeStudents = students.map((student) => ({ ...student }));
  }
}
