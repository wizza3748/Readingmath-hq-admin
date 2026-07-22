import {
  Difficulty,
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
  { id: "inst-topbrain", name: "탑브레인수학과학학원" },
  { id: "inst-aplus", name: "에이플러스학원" },
  { id: "inst-cnd", name: "씨앤디영재아카데미" },
  { id: "inst-mathfox", name: "수학여우학원" },
  { id: "inst-wisdom", name: "지혜의수학" },
  { id: "inst-uni", name: "유앤아이수학과학학원" },
  { id: "inst-tid", name: "티아이디영수학원" },
  { id: "inst-pleria", name: "플리아수학" },
  { id: "inst-facto", name: "생각이커는팩토수학학원" },
  { id: "inst-imagination", name: "상상수학" },
  { id: "inst-yangjeong", name: "양정대입학원" },
].sort((a, b) => a.name.localeCompare(b.name, "ko"));

const DIFFICULTY_ORDER: Difficulty[] = ["basic", "intermediate", "advanced"];

function uniqueInOrder(values: string[]) {
  return Array.from(new Set(values));
}

function getMockCreatedAt(index: number, totalTasks: number) {
  const latestFirstIndex = totalTasks - 1 - index;
  const daysAgo = Math.round(
    (latestFirstIndex * 21) / Math.max(1, totalTasks - 1),
  );
  const createdAt = new Date();
  createdAt.setHours(9 + ((index * 3) % 10), (index * 17) % 60, 0, 0);
  createdAt.setDate(createdAt.getDate() - daysAgo);
  return createdAt.toISOString();
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

function buildRecord(
  task: TaskItem,
  index: number,
  totalTasks: number,
): HqTaskStatusRecord {
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
    createdAt: getMockCreatedAt(index, totalTasks),
    assignments: buildAssignments(task, index),
  };
}

export function buildHqTaskStatusRecords(
  tasks: TaskItem[],
): HqTaskStatusRecord[] {
  const orderedTasks = [...tasks].sort((a, b) => {
    if (a.subject === b.subject) return 0;
    return a.subject === "science" ? -1 : 1;
  });
  const activeRecords = orderedTasks.map((task, index) =>
    buildRecord(task, index, orderedTasks.length),
  );

  if (activeRecords.length === 0) return [];

  return [
    ...activeRecords,
    {
      ...activeRecords[0],
      id: "task-deleted-mock",
      uniqueNo: 4999,
      deleted: true,
    },
  ];
}
