const fs = require('fs');

const missingContent = `
// ─────────────────────────────────────────────
// 샘플 학생 및 클래스 (복구)
// ─────────────────────────────────────────────

export const SAMPLE_CLASSES = ["1반", "2반", "3반"];

export const SAMPLE_STUDENTS: StudentAssignment[] = [
  { studentId: "s1", studentName: "김리딩", classGroup: "1반", status: "not_started", printStatus: "not_printed" },
  { studentId: "s2", studentName: "이수학", classGroup: "1반", status: "not_started", printStatus: "not_printed" },
  { studentId: "s3", studentName: "박과학", classGroup: "2반", status: "not_started", printStatus: "not_printed" },
  { studentId: "s4", studentName: "최개념", classGroup: "2반", status: "not_started", printStatus: "not_printed" },
  { studentId: "s5", studentName: "정유형", classGroup: "3반", status: "not_started", printStatus: "not_printed" },
];

export const MOCK_TASKS: TaskItem[] = [];

// ─────────────────────────────────────────────
// 유틸리티 함수
// ─────────────────────────────────────────────

export function getTaskStatusLabel(status: TaskStatus) {
  const map: Record<TaskStatus, string> = {
    draft: "작성중",
    published: "게시됨",
    ended: "종료",
  };
  return map[status];
}

export function getStudentTaskStatusLabel(status: StudentTaskStatus) {
  const map: Record<StudentTaskStatus, string> = {
    not_started: "미시작",
    in_progress: "진행중",
    submitted: "제출완료",
    timeout: "시간초과",
  };
  return map[status];
}

export function getDifficultyLabel(d: Difficulty) {
  const map: Record<Difficulty, string> = {
    basic: "기본",
    intermediate: "실력",
    advanced: "심화",
  };
  return map[d];
}

export function calcAvgScore(students: StudentAssignment[]): number | null {
  const targets = students.filter(s => s.status === "submitted" || s.status === "timeout");
  if (targets.length === 0) return null;
  const total = targets.reduce((sum, s) => sum + (s.score ?? 0), 0);
  return Math.round(total / targets.length);
}

export function getMaxCount(type: SelectedType, difficulties: Difficulty[]): number {
  if (difficulties.length === 0) {
    return type.maxCount.basic + type.maxCount.intermediate + type.maxCount.advanced;
  }
  return difficulties.reduce((sum, d) => {
    if (d === "basic") return sum + type.maxCount.basic;
    if (d === "intermediate") return sum + type.maxCount.intermediate;
    if (d === "advanced") return sum + type.maxCount.advanced;
    return sum;
  }, 0);
}

export function getCoursesBySubject(subject: Subject): string[] {
  const curricula = subject === "math" ? MATH_CURRICULA : SCIENCE_CURRICULA;
  return curricula.map(c => c.course).sort();
}

export function getCurriculumBySubjectAndCourse(subject: Subject, course: string): Curriculum | undefined {
  const curricula = subject === "math" ? MATH_CURRICULA : SCIENCE_CURRICULA;
  return curricula.find(c => c.course === course);
}
`;

let fileContentStr = fs.readFileSync('src/lib/task-center-mock.ts', 'utf8');

// If the file already has getTaskStatusLabel at the bottom, we need to remove it first
const utilStartMatch = fileContentStr.match(/\/\/ ─────────────────────────────────────────────\n\/\/ 유틸리티 함수/);
if (utilStartMatch) {
    fileContentStr = fileContentStr.substring(0, utilStartMatch.index);
}

// Append the missing content
fs.writeFileSync('src/lib/task-center-mock.ts', fileContentStr + missingContent);
console.log('Appended missing exports to src/lib/task-center-mock.ts');
