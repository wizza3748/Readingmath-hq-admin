// ──────────────────────────────────────────────────────────────
// 선생님 관리 - 타입 정의 및 목 데이터
// ──────────────────────────────────────────────────────────────

export type TeacherRole = "representative" | "teacher"; // 대표선생님 | 선생님
export type TeacherServiceStatus = "normal" | "suspended"; // 정상 | 중지

export interface ClassInfo {
  id: string;
  name: string;
  studentCount: number;
}

export interface Teacher {
  id: string;
  seq: number;
  name: string;
  loginId: string;
  role: TeacherRole;
  serviceStatus: TeacherServiceStatus;
  phone: string;
  email: string;
  createdAt: string;
  assignedClasses: ClassInfo[]; // 반 등록순 정렬
}

// ── 헬퍼 함수 ──────────────────────────────────────────────────

export function getTeacherRoleLabel(role: TeacherRole): string {
  return role === "representative" ? "대표 선생님" : "선생님";
}

export function getTeacherStatusLabel(status: TeacherServiceStatus): string {
  return status === "normal" ? "정상" : "중지";
}

/** 담당 반 표시 기준 */
export function formatAssignedClasses(classes: ClassInfo[]): string {
  if (classes.length === 0) return "-";
  if (classes.length === 1) return classes[0].name;
  return `${classes[0].name} 외 ${classes.length - 1}개`;
}

/** 삭제 가능 여부 판단 */
export function canDeleteTeacher(teacher: Teacher): { deletable: boolean; reason?: string } {
  // 대표선생님은 삭제 불가
  if (teacher.role === "representative") {
    return { deletable: false, reason: "대표 선생님은 삭제할 수 없습니다." };
  }
  // 담당 반 없으면 삭제 가능
  if (teacher.assignedClasses.length === 0) {
    return { deletable: true };
  }
  // 담당 반 중 소속 학생 1명 이상인 반 존재 → 삭제 불가
  const hasStudents = teacher.assignedClasses.some(c => c.studentCount > 0);
  if (hasStudents) {
    return { deletable: false, reason: "소속 학생이 있는 담당 반이 존재하여 삭제할 수 없습니다." };
  }
  // 모든 담당 반 소속 학생 0명 → 삭제 가능
  return { deletable: true };
}

// ── 목 데이터 ──────────────────────────────────────────────────

export const MOCK_TEACHERS: Teacher[] = [
  {
    id: "teacher-35",
    seq: 35,
    name: "진선생",
    loginId: "jinsun_teacher2",
    role: "teacher",
    serviceStatus: "normal",
    phone: "01036983748",
    email: "",
    createdAt: "2025-12-17T08:48:00",
    assignedClasses: [
      { id: "class-2", name: "중2반", studentCount: 3 },
    ],
  },
  {
    id: "teacher-34",
    seq: 34,
    name: "진원장",
    loginId: "jinsun123",
    role: "representative",
    serviceStatus: "normal",
    phone: "01036983748",
    email: "",
    createdAt: "2025-12-17T08:36:27",
    assignedClasses: [
      { id: "class-1", name: "중1반", studentCount: 4 },
    ],
  },
];

// ── 전체 반 목록 ──────────────────────────────────────────────
export const ALL_CLASSES_INITIAL: ClassInfo[] = [
  { id: "class-1", name: "중1반", studentCount: 4 },
  { id: "class-2", name: "중2반", studentCount: 3 },
  { id: "class-3", name: "중3반", studentCount: 0 },
  { id: "class-4", name: "중1A반", studentCount: 0 },
  { id: "class-5", name: "중2B반", studentCount: 0 },
  { id: "class-6", name: "고1A반", studentCount: 0 },
  { id: "class-7", name: "고2B반", studentCount: 0 },
  { id: "class-8", name: "고3C반", studentCount: 0 },
];

export const ALL_CLASSES = ALL_CLASSES_INITIAL;

const CLASSES_STORAGE_KEY = "readingmath_classes_data";

export function getStoredClasses(): ClassInfo[] {
  if (typeof window === "undefined") {
    return ALL_CLASSES_INITIAL;
  }
  const stored = localStorage.getItem(CLASSES_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(ALL_CLASSES_INITIAL));
    return ALL_CLASSES_INITIAL;
  }
  try {
    const parsed = JSON.parse(stored) as ClassInfo[];
    let changed = false;
    const updated = parsed.map(c => {
      let count = c.studentCount;
      let name = c.name;
      
      if (c.id === "class-1") {
        if (c.studentCount !== 4) { count = 4; changed = true; }
        if (c.name === "초3A반" || c.name === "대표선생님반") { name = "중1반"; changed = true; }
      }
      else if (c.id === "class-2") {
        if (c.studentCount !== 3) { count = 3; changed = true; }
        if (c.name === "초4B반" || c.name === "그냥선생님반") { name = "중2반"; changed = true; }
      }
      else if (c.id === "class-3") {
        if (c.name === "초5C반") { name = "중3반"; changed = true; }
      }
      
      return { ...c, name, studentCount: count };
    });
    if (changed) {
      localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(updated));
    }
    return updated;
  } catch (e) {
    return ALL_CLASSES_INITIAL;
  }
}

export function saveStoredClasses(classes: ClassInfo[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(classes));
  }
}

const TEACHER_STORAGE_KEY = "readingmath_teachers_data";

export function getStoredTeachers(): Teacher[] {
  if (typeof window === "undefined") {
    return MOCK_TEACHERS;
  }
  const stored = localStorage.getItem(TEACHER_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(TEACHER_STORAGE_KEY, JSON.stringify(MOCK_TEACHERS));
    return MOCK_TEACHERS;
  }
  try {
    const parsed = JSON.parse(stored) as Teacher[];
    let changed = false;
    const updated = parsed.map(t => {
      // 1. teacher-34 (진원장) 보정
      if (t.id === "teacher-34") {
        const isNameDiff = t.name !== "진원장";
        const class1 = t.assignedClasses.find(c => c.id === "class-1");
        const isClass1Invalid = !class1 || class1.studentCount !== 4 || class1.name === "초3A반" || class1.name === "대표선생님반";
        const hasExtraClasses = t.assignedClasses.length !== 1;
        
        if (isNameDiff || isClass1Invalid || hasExtraClasses) {
          changed = true;
          const currentName = (class1 && class1.name !== "초3A반" && class1.name !== "대표선생님반") ? class1.name : "중1반";
          return {
            ...t,
            name: "진원장",
            assignedClasses: [
              { id: "class-1", name: currentName, studentCount: 4 }
            ]
          };
        }
      }
      
      // 2. teacher-35 (진선생) 보정
      if (t.id === "teacher-35") {
        const isNameDiff = t.name !== "진선생";
        const class2 = t.assignedClasses.find(c => c.id === "class-2");
        const isClass2Invalid = !class2 || class2.studentCount !== 3 || class2.name === "초4B반" || class2.name === "그냥선생님반";
        const hasExtraClasses = t.assignedClasses.length !== 1;
        
        if (isNameDiff || isClass2Invalid || hasExtraClasses) {
          changed = true;
          const currentName = (class2 && class2.name !== "초4B반" && class2.name !== "그냥선생님반") ? class2.name : "중2반";
          return {
            ...t,
            name: "진선생",
            assignedClasses: [
              { id: "class-2", name: currentName, studentCount: 3 }
            ]
          };
        }
      }
      return t;
    });
    if (changed) {
      localStorage.setItem(TEACHER_STORAGE_KEY, JSON.stringify(updated));
    }
    return updated;
  } catch (e) {
    return MOCK_TEACHERS;
  }
}

export function saveStoredTeachers(teachers: Teacher[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TEACHER_STORAGE_KEY, JSON.stringify(teachers));
  }
}
