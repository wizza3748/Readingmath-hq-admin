const fs = require("fs");

const file = "src/lib/task-center-mock.ts";
let content = fs.readFileSync(file, "utf8");

// Trim content up to the closing bracket of INITIAL_TASKS
const idx = content.indexOf('individualStudentIds: ["s5"]');
content = content.substring(0, idx + 28); // Up to 'individualStudentIds: ["s5"]'

const mathTasks = [];
for(let i=1; i<=12; i++) {
  const isDraft = i <= 3;
  const isPublished = i > 3 && i <= 8;
  const status = isDraft ? "draft" : isPublished ? "published" : "ended";
  
  const problemMode = i % 2 === 0 ? "same" : "individual";
  const difficulties = [];
  if (i%5===0) difficulties.push("basic");
  else if (i%5===1) difficulties.push("intermediate");
  else if (i%5===2) difficulties.push("advanced");
  else if (i%5===3) difficulties.push("basic", "intermediate");
  else difficulties.push("basic", "intermediate", "advanced");

  const timeLimit = i % 3 === 0 ? undefined : (i%3)*30;
  
  const course = ["초3-1", "초4-2", "초5-1", "초6-2", "중1-1", "중2-2", "중3-1"][i % 7];
  const unitNames = ["덧셈과 뺄셈", "평면도형", "소인수분해", "문자와 식", "정수와 유리수", "일차방정식", "연립방정식", "함수", "피타고라스 정리", "좌표평면과 그래프"];
  const majorUnit = `${i}단원-${unitNames[i%unitNames.length]}`;
  const typeName = `${unitNames[i%unitNames.length]} 심화 유형 마스터하기`;
  const name = i === 12 ? `${majorUnit} > ${typeName} 외 엄청나게 많은 내용이 들어가서 말줄임이 발생하는 긴 과제명 테스트 케이스입니다` : `${majorUnit} > ${typeName}`;

  const assignedStudents = [];
  if (status === "published" || status === "ended") {
    if (i % 4 === 1) { // 1 assigned
      assignedStudents.push({ studentId: `s${i}1`, studentName: "김수학", classGroup: "1반", status: "not_started", problemCount: 10, printStatus: "not_printed" });
    } else if (i % 4 === 2 || i % 4 === 3) { // 2+ assigned
      assignedStudents.push({ studentId: `s${i}1`, studentName: "김수학", classGroup: "1반", status: "submitted", score: 80 + (i%20), problemCount: 10, printStatus: "printed", submittedAt: "2026-05-15T10:00:00Z" });
      assignedStudents.push({ studentId: `s${i}2`, studentName: "이수학", classGroup: "1반", status: status==="ended"?"timeout":"in_progress", score: status==="ended"?40:undefined, problemCount: 10, printStatus: "not_printed", timedOutAt: status==="ended"?"2026-05-15T11:00:00Z":undefined });
    }
  }

  mathTasks.push(`  {
    id: "task-math-${String(i).padStart(3, "0")}",
    subject: "math",
    name: "${name}",
    course: "${course}",
    status: "${status}",
    difficulties: ${JSON.stringify(difficulties)},
    problemMode: "${problemMode}",
    prioritizeUnsolved: false,
    onlyImportant: ${i%2===0},
    timeLimit: ${timeLimit},
    selectedTypes: [
      { curriculumId: "math-${course}", course: "${course}", typeId: "mt-mock-${i}", majorUnit: "${majorUnit}", minorUnit: "소단원", typeName: "${typeName}", difficulty: "${difficulties[0] || "basic"}", problemCount: 10, maxCount: { basic: 10, intermediate: 5, advanced: 2 }, importantCount: { basic: 5, intermediate: 2, advanced: 1 } }
    ],
    totalProblems: 10,
    createdAt: "2026-05-${String(i).padStart(2,"0")}T10:00:00Z",
    assignedStudents: ${JSON.stringify(assignedStudents)},
    assignedClasses: ${i%2===0 ? `["1반"]` : `[]`},
    individualStudentIds: ${i%2!==0 && assignedStudents.length>0 ? JSON.stringify(assignedStudents.map(s=>s.studentId)) : `[]`}
  }`);
}

const sciTasks = [];
for(let i=1; i<=12; i++) {
  const isDraft = i <= 3;
  const isPublished = i > 3 && i <= 8;
  const status = isDraft ? "draft" : isPublished ? "published" : "ended";
  
  const problemMode = i % 2 === 0 ? "same" : "individual";
  const difficulties = [];
  if (i%5===0) difficulties.push("basic");
  else if (i%5===1) difficulties.push("intermediate");
  else if (i%5===2) difficulties.push("advanced");
  else if (i%5===3) difficulties.push("basic", "intermediate");
  else difficulties.push("basic", "intermediate", "advanced");

  const timeLimit = i % 3 === 0 ? undefined : (i%3)*30;
  
  const course = ["중1-1", "중1-2", "중2-1", "중2-2", "중3-1", "중3-2"][i % 6];
  const unitNames = ["지권의 변화", "여러 가지 힘", "생물의 다양성", "기체의 성질", "물질의 상태 변화", "빛과 파동", "식물과 에너지", "동물과 에너지", "전기와 자기", "태양계"];
  const majorUnit = `${i}단원-${unitNames[i%unitNames.length]}`;
  const typeName = `${unitNames[i%unitNames.length]} 핵심 정리`;
  const name = i === 12 ? `${majorUnit} > ${typeName} 외 과학 관련 아주 긴 이름의 단원명이 어떻게 표시되는지 확인하기 위한 테스트 케이스입니다` : `${majorUnit} > ${typeName}`;

  const assignedStudents = [];
  if (status === "published" || status === "ended") {
    if (i % 4 === 1) { // 1 assigned
      assignedStudents.push({ studentId: `sc${i}1`, studentName: "박과학", classGroup: "2반", status: "not_started", problemCount: 15, printStatus: "not_printed" });
    } else if (i % 4 === 2 || i % 4 === 3) { // 2+ assigned
      assignedStudents.push({ studentId: `sc${i}1`, studentName: "박과학", classGroup: "2반", status: "submitted", score: 75 + (i%20), problemCount: 15, printStatus: "printed", submittedAt: "2026-05-16T10:00:00Z" });
      assignedStudents.push({ studentId: `sc${i}2`, studentName: "최과학", classGroup: "2반", status: status==="ended"?"timeout":"in_progress", score: status==="ended"?50:undefined, problemCount: 15, printStatus: "not_printed", timedOutAt: status==="ended"?"2026-05-16T11:00:00Z":undefined });
    }
  }

  sciTasks.push(`  {
    id: "task-sci-${String(i).padStart(3, "0")}",
    subject: "science",
    name: "${name}",
    course: "${course}",
    status: "${status}",
    difficulties: ${JSON.stringify(difficulties)},
    problemMode: "${problemMode}",
    prioritizeUnsolved: false,
    onlyImportant: ${i%2===0},
    timeLimit: ${timeLimit},
    selectedTypes: [
      { curriculumId: "sci-${course}", course: "${course}", typeId: "sc-mock-${i}", majorUnit: "${majorUnit}", minorUnit: "소단원", typeName: "${typeName}", difficulty: "${difficulties[0] || "basic"}", problemCount: 15, maxCount: { basic: 10, intermediate: 5, advanced: 2 }, importantCount: { basic: 5, intermediate: 2, advanced: 1 } }
    ],
    totalProblems: 15,
    createdAt: "2026-05-${String(i+10).padStart(2,"0")}T10:00:00Z",
    assignedStudents: ${JSON.stringify(assignedStudents)},
    assignedClasses: ${i%2===0 ? `["2반"]` : `[]`},
    individualStudentIds: ${i%2!==0 && assignedStudents.length>0 ? JSON.stringify(assignedStudents.map(s=>s.studentId)) : `[]`}
  }`);
}

const utils = `
];

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

export function getStudentStatusLabel(status: StudentTaskStatus) {
  const map: Record<StudentTaskStatus, string> = {
    not_started: "미시작",
    in_progress: "학습중",
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

const DIFFICULTY_LIST_ALL: Difficulty[] = ["basic", "intermediate", "advanced"];

// 기존 SelectedType(difficulty 없음)을 조합 구조로 정규화
export function normalizeSelectedTypes(
  selectedTypes: SelectedType[],
  taskDifficulties: Difficulty[],
  subject: Subject
): SelectedType[] {
  const result: SelectedType[] = [];
  for (const t of selectedTypes) {
    if ((t as SelectedType & { difficulty?: Difficulty }).difficulty) {
      // 이미 difficulty가 있으면 그대로 사용
      result.push(t);
      continue;
    }
    // difficulty가 없는 구 버전: 확장 대상 난이도 결정
    const targetDiffs = taskDifficulties.length > 0
      ? taskDifficulties
      : DIFFICULTY_LIST_ALL;
    // 문제 수가 1 이상인 난이도만 생성
    const expandDiffs = targetDiffs.filter(d => t.maxCount[d] > 0);
    for (const d of expandDiffs) {
      result.push({
        ...t,
        difficulty: d,
        problemCount: 1,
      });
    }
  }
  return result;
}

// TaskItem을 새 조합 구조로 정규화
export function normalizeTask(task: TaskItem, subject: Subject): TaskItem {
  const hasNewStructure = task.selectedTypes.length > 0 &&
    (task.selectedTypes[0] as SelectedType & { difficulty?: Difficulty }).difficulty !== undefined;
  if (hasNewStructure) return task;
  return {
    ...task,
    selectedTypes: normalizeSelectedTypes(task.selectedTypes, task.difficulties, subject),
    onlyImportant: task.problemScope === "important" || task.onlyImportant === true,
  };
}

// 조합 키 생성 헬퍼
export function makeComboKey(typeId: string, difficulty: Difficulty): string {
  return \`\${typeId}__\${difficulty}\`;
}
\`;

content = content + "\n  },\n" + mathTasks.join(",\n") + ",\n" + sciTasks.join(",\n") + utils;

fs.writeFileSync(file, content, "utf8");
