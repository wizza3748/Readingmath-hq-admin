import {
  Difficulty,
  INITIAL_TASKS,
  ProblemMode,
  Subject,
  TaskItem,
  TaskStatus,
} from "@/lib/task-center-mock";

export interface HqInstitution {
  id: string;
  name: string;
}

export interface HqTaskResult {
  score: number;
  createdAt: string;
}

export interface HqTaskAssignment {
  studentId: string;
  status: "not_started" | "in_progress" | "submitted";
  problemCount: number;
  canceled?: boolean;
  results: HqTaskResult[];
}

export interface HqTaskStatusRecord {
  id: string;
  uniqueNo: number;
  institutionId: string;
  institutionName: string;
  subject: Subject;
  name: string;
  course: string;
  status: TaskStatus;
  difficulties: Difficulty[];
  problemMode: ProblemMode;
  units: string[];
  types: string[];
  typeCount: number;
  totalProblems: number;
  createdAt: string;
  assignments: HqTaskAssignment[];
  deleted?: boolean;
}

export const HQ_INSTITUTIONS: HqInstitution[] = [
  { id: "inst-gangnam", name: "리딩수학 강남센터" },
  { id: "inst-guro", name: "리딩수학 구로센터" },
  { id: "inst-bundang", name: "리딩수학 분당센터" },
  { id: "inst-songdo", name: "리딩수학 송도센터" },
  { id: "inst-suwon", name: "리딩수학 수원센터" },
  { id: "inst-ilsan", name: "리딩수학 일산센터" },
].sort((a, b) => a.name.localeCompare(b.name, "ko"));

const DIFFICULTY_ORDER: Difficulty[] = ["basic", "intermediate", "advanced"];

function uniqueInOrder(values: string[]) {
  return Array.from(new Set(values));
}

function getScore(task: TaskItem, studentIndex: number) {
  const student = task.assignedStudents[studentIndex];
  if (typeof student.score === "number") return student.score;
  if (
    typeof student.correctCount === "number" &&
    typeof student.totalCount === "number" &&
    student.totalCount > 0
  ) {
    return Math.round((student.correctCount / student.totalCount) * 100);
  }
  return 60 + ((task.id.length * 7 + studentIndex * 11) % 41);
}

function buildAssignments(task: TaskItem, taskIndex: number): HqTaskAssignment[] {
  const assignments: HqTaskAssignment[] = task.assignedStudents.map((student, studentIndex) => {
    const submittedAt = student.submittedAt ?? task.createdAt;
    const score = getScore(task, studentIndex);
    const results: HqTaskResult[] =
      student.status === "submitted"
        ? [
            ...(studentIndex === 0 && taskIndex % 3 === 0
              ? [
                  {
                    score: Math.max(0, score - 12),
                    createdAt: new Date(
                      new Date(submittedAt).getTime() - 24 * 60 * 60 * 1000,
                    ).toISOString(),
                  },
                ]
              : []),
            { score, createdAt: submittedAt },
          ]
        : [];

    return {
      studentId: student.studentId,
      status: student.status,
      problemCount: student.problemCount ?? task.totalProblems,
      results,
    };
  });

  if (assignments.length > 0 && taskIndex % 5 === 0) {
    assignments.push({ ...assignments[0], canceled: true });
  }

  if (assignments.length > 1 && taskIndex % 4 === 0) {
    assignments.push({ ...assignments[1] });
  }

  return assignments;
}

function buildRecord(task: TaskItem, index: number): HqTaskStatusRecord {
  const institution = HQ_INSTITUTIONS[index % HQ_INSTITUTIONS.length];
  const units = uniqueInOrder(
    task.selectedTypes.map((type) => `${type.majorUnit} > ${type.minorUnit}`),
  );
  const typeMap = new Map<string, string>();
  task.selectedTypes.forEach((type) => {
    if (!typeMap.has(type.typeId)) {
      typeMap.set(
        type.typeId,
        `${type.majorUnit} > ${type.minorUnit} > ${type.typeName}`,
      );
    }
  });
  const difficulties = DIFFICULTY_ORDER.filter((difficulty) =>
    task.selectedTypes.some((type) => type.difficulty === difficulty),
  );

  return {
    id: task.id,
    uniqueNo: 4100 + index + 1,
    institutionId: institution.id,
    institutionName: institution.name,
    subject: task.subject,
    name: task.name,
    course: task.course,
    status: task.status,
    difficulties:
      difficulties.length > 0
        ? difficulties
        : DIFFICULTY_ORDER.filter((difficulty) =>
            task.difficulties.includes(difficulty),
          ),
    problemMode: task.problemMode,
    units,
    types: Array.from(typeMap.values()),
    typeCount: typeMap.size,
    totalProblems: task.totalProblems,
    createdAt: task.createdAt,
    assignments: buildAssignments(task, index),
  };
}

const ACTIVE_RECORDS = INITIAL_TASKS.map(buildRecord);

export const HQ_TASK_STATUS_RECORDS: HqTaskStatusRecord[] = [
  ...ACTIVE_RECORDS,
  {
    ...ACTIVE_RECORDS[0],
    id: "task-deleted-mock",
    uniqueNo: 4999,
    deleted: true,
  },
];
