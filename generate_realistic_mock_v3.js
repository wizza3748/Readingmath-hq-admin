const fs = require('fs');
const path = require('path');

// 1. task-center-mock.ts 읽기
const mockFilePath = path.join(__dirname, 'src/lib/task-center-mock.ts');
const content = fs.readFileSync(mockFilePath, 'utf8');

// 2. MATH_CURRICULA 부분 개별 추출
const mathStart = content.indexOf('export const MATH_CURRICULA: Curriculum[] = [');
const mathEnd = content.indexOf('export const SCIENCE_CURRICULA', mathStart);
if (mathStart === -1 || mathEnd === -1) {
  throw new Error("Could not find MATH_CURRICULA boundaries in task-center-mock.ts");
}
let mathBlock = content.substring(mathStart, mathEnd).trim();
const lastBracketMath = mathBlock.lastIndexOf('];');
mathBlock = mathBlock.substring(0, lastBracketMath + 2)
  .replace('export const MATH_CURRICULA: Curriculum[] =', 'const MATH_CURRICULA =');

// 3. SCIENCE_CURRICULA 부분 개별 추출 (SAMPLE_CLASSES 전까지 잘라서 정확하게 닫기)
const sciStart = content.indexOf('export const SCIENCE_CURRICULA: Curriculum[] = [');
const sciEnd = content.indexOf('export const SAMPLE_CLASSES', sciStart);
if (sciStart === -1 || sciEnd === -1) {
  throw new Error("Could not find SCIENCE_CURRICULA boundaries in task-center-mock.ts");
}
let sciBlock = content.substring(sciStart, sciEnd).trim();
const lastBracketSci = sciBlock.lastIndexOf('];');
sciBlock = sciBlock.substring(0, lastBracketSci + 2)
  .replace('export const SCIENCE_CURRICULA: Curriculum[] =', 'const SCIENCE_CURRICULA =');

// 4. 임시 CJS 파일 작성 (CommonJS 규격 강제 적용으로 type: module 우회)
const tempFilePath = path.join(__dirname, 'temp_curricula.cjs');
const fileContent = [
  mathBlock,
  "",
  sciBlock,
  "",
  "module.exports = { MATH_CURRICULA, SCIENCE_CURRICULA };"
].join("\n");

fs.writeFileSync(tempFilePath, fileContent, 'utf8');

// 5. require로 임시 모듈 로드
const { MATH_CURRICULA, SCIENCE_CURRICULA } = require('./temp_curricula.cjs');

// 6. 임시 파일 즉시 삭제
fs.unlinkSync(tempFilePath);

// 7. 과제 설정 구성
const mathTasksConfig = [
  { id: "task-001", types: 1, problems: 5, diff: ["intermediate"], mode: "individual", time: 30, status: "draft", assigned: 0, completed: 0, score: null, course: "초3-1", createdAt: "2026-05-19T09:00:00Z" },
  { id: "task-002", types: 2, problems: 7, diff: ["advanced"], mode: "same", time: 60, status: "draft", assigned: 0, completed: 0, score: null, course: "초4-2", createdAt: "2026-05-18T15:00:00Z" },
  { id: "task-003", types: 3, problems: 10, diff: ["basic", "intermediate"], mode: "same", time: null, status: "draft", assigned: 0, completed: 0, score: null, course: "초5-1", createdAt: "2026-05-18T10:00:00Z" },
  { id: "task-math-004", types: 1, problems: 8, diff: ["basic"], mode: "individual", time: 45, status: "draft", assigned: 0, completed: 0, score: null, course: "초6-2", createdAt: "2026-05-17T16:00:00Z" },
  { id: "task-math-005", types: 5, problems: 15, diff: ["intermediate", "advanced"], mode: "same", time: 60, status: "published", assigned: 1, completed: 0, score: null, course: "중1-1", createdAt: "2026-05-15T09:00:00Z" },
  { id: "task-math-006", types: 6, problems: 18, diff: ["basic", "intermediate", "advanced"], mode: "individual", time: null, status: "published", assigned: 5, completed: 2, score: 85, course: "중1-2", createdAt: "2026-05-14T10:00:00Z" },
  { id: "task-math-007", types: 2, problems: 12, diff: ["intermediate"], mode: "same", time: 30, status: "published", assigned: 3, completed: 3, score: 90, course: "중2-1", createdAt: "2026-05-13T10:00:00Z" },
  { id: "task-math-008", types: 8, problems: 25, diff: ["advanced"], mode: "individual", time: 60, status: "published", assigned: 2, completed: 1, score: 75, course: "중2-2", createdAt: "2026-05-12T10:00:00Z" },
  { id: "task-math-009", types: 10, problems: 30, diff: ["basic", "intermediate", "advanced"], mode: "same", time: null, status: "published", assigned: 4, completed: 4, score: 92, course: "중3-1", createdAt: "2026-05-11T10:00:00Z" },
  { id: "task-math-010", types: 3, problems: 14, diff: ["basic", "intermediate"], mode: "individual", time: 45, status: "ended", assigned: 2, completed: 2, score: 100, course: "초3-1", createdAt: "2026-05-05T10:00:00Z" },
  { id: "task-math-011", types: 5, problems: 20, diff: ["intermediate"], mode: "same", time: 30, status: "ended", assigned: 4, completed: 4, score: 65, course: "중1-1", createdAt: "2026-05-04T10:00:00Z" },
  { id: "task-math-012", types: 6, problems: 22, diff: ["advanced"], mode: "individual", time: null, status: "ended", assigned: 6, completed: 5, score: 80, course: "중2-1", createdAt: "2026-05-03T10:00:00Z" }
];

const sciTasksConfig = [
  { id: "task-101", types: 1, problems: 5, diff: ["basic"], mode: "same", time: 30, status: "draft", assigned: 0, completed: 0, score: null, course: "중1-1", createdAt: "2026-05-19T08:00:00Z" },
  { id: "task-sci-102", types: 1, problems: 6, diff: ["intermediate"], mode: "individual", time: 45, status: "draft", assigned: 0, completed: 0, score: null, course: "중1-2", createdAt: "2026-05-18T14:00:00Z" },
  { id: "task-sci-103", types: 2, problems: 9, diff: ["advanced"], mode: "same", time: null, status: "draft", assigned: 0, completed: 0, score: null, course: "중2-1", createdAt: "2026-05-18T09:00:00Z" },
  { id: "task-sci-104", types: 3, problems: 10, diff: ["basic", "intermediate"], mode: "individual", time: 60, status: "draft", assigned: 0, completed: 0, score: null, course: "중2-2", createdAt: "2026-05-17T15:00:00Z" },
  { id: "task-sci-105", types: 2, problems: 12, diff: ["basic"], mode: "same", time: 30, status: "published", assigned: 1, completed: 0, score: null, course: "중3-1", createdAt: "2026-05-15T08:00:00Z" },
  { id: "task-sci-106", types: 3, problems: 15, diff: ["intermediate", "advanced"], mode: "individual", time: null, status: "published", assigned: 5, completed: 2, score: 85, course: "중3-2", createdAt: "2026-05-14T09:00:00Z" },
  { id: "task-sci-107", types: 5, problems: 16, diff: ["basic", "intermediate", "advanced"], mode: "same", time: 45, status: "published", assigned: 3, completed: 3, score: 90, course: "중1-1", createdAt: "2026-05-13T09:00:00Z" },
  { id: "task-sci-108", types: 6, problems: 20, diff: ["intermediate"], mode: "individual", time: 60, status: "published", assigned: 2, completed: 1, score: 75, course: "중1-2", createdAt: "2026-05-12T09:00:00Z" },
  { id: "task-sci-109", types: 8, problems: 28, diff: ["advanced"], mode: "same", time: null, status: "published", assigned: 4, completed: 4, score: 92, course: "중2-1", createdAt: "2026-05-11T09:00:00Z" },
  { id: "task-sci-110", types: 10, problems: 30, diff: ["basic", "intermediate"], mode: "individual", time: 30, status: "ended", assigned: 2, completed: 2, score: 100, course: "중2-2", createdAt: "2026-05-05T09:00:00Z" },
  { id: "task-sci-111", types: 5, problems: 24, diff: ["intermediate"], mode: "same", time: 45, status: "ended", assigned: 4, completed: 4, score: 65, course: "중3-1", createdAt: "2026-05-04T09:00:00Z" },
  { id: "task-sci-112", types: 6, problems: 25, diff: ["advanced"], mode: "individual", time: null, status: "ended", assigned: 6, completed: 5, score: 80, course: "중3-2", createdAt: "2026-05-03T09:00:00Z" }
];

function generateTask(t, idx, subject) {
  const isDraft = t.status === "draft";
  const assignedStudents = [];
  
  if (t.assigned > 0) {
    for (let s = 1; s <= t.assigned; s++) {
      const isCompleted = s <= t.completed;
      let stuStatus = "not_started";
      let stuScore = undefined;
      
      if (isCompleted) {
        stuStatus = "submitted";
        stuScore = t.score;
      } else if (t.status === "ended") {
        stuStatus = "timeout";
        stuScore = t.score ? Math.round(t.score * 0.7) : 40;
      } else {
        stuStatus = "in_progress";
      }

      assignedStudents.push({
        studentId: `stu-${subject}-${idx}-${s}`,
        studentName: `학생${s}`,
        classGroup: "1반",
        status: stuStatus,
        score: stuScore,
        problemCount: t.problems,
        printStatus: "not_printed",
        submittedAt: isCompleted ? "2026-05-15T10:00:00Z" : undefined,
        timedOutAt: stuStatus === "timeout" ? "2026-05-15T11:00:00Z" : undefined
      });
    }
  }

  const curricula = subject === "math" ? MATH_CURRICULA : SCIENCE_CURRICULA;
  const curriculum = curricula.find(c => c.course === t.course);
  if (!curriculum) {
    throw new Error(`Curriculum not found for course: ${t.course}`);
  }

  const selectedTypes = [];
  let problemsLeft = t.problems;
  for (let c = 0; c < t.types; c++) {
    const isLast = c === t.types - 1;
    let pCount = 1;
    if (isLast) {
      pCount = problemsLeft;
    } else {
      pCount = Math.floor(problemsLeft / (t.types - c));
    }
    problemsLeft -= pCount;

    const realType = curriculum.types[c % curriculum.types.length];
    
    // Choose diff based on fallback logic if not in t.diff
    let diff = t.diff[0];
    if (realType.difficultyCount[diff] === 0) {
      const fallback = ["basic", "intermediate", "advanced"].find(d => realType.difficultyCount[d] > 0);
      if (fallback) diff = fallback;
    }

    selectedTypes.push({
      curriculumId: curriculum.id,
      course: t.course,
      typeId: realType.id,
      majorUnit: realType.majorUnit,
      minorUnit: realType.minorUnit,
      typeName: realType.typeName,
      difficulty: diff,
      problemCount: pCount,
      maxCount: realType.difficultyCount,
      importantCount: realType.importantCount
    });
  }

  // 선생님 직접 수정 과제명 매핑 (수학 4개, 과학 4개)
  const manualNames = {
    // Math tasks (4 items)
    "task-001": "기본 개념 확인 과제",
    "task-math-005": "이번 주 복습 과제",
    "task-math-011": "초등 5학년 중간고사 대비 과제",
    "task-math-012": "심화 문제 추가 과제",
    
    // Science tasks (4 items)
    "task-101": "핵심 개념 점검 과제",
    "task-sci-106": "방학 전 실력 점검 과제",
    "task-sci-108": "서술형 대비 과제",
    "task-sci-110": "이번 단원 마무리 과제"
  };

  let taskName = "";
  if (manualNames[t.id]) {
    taskName = manualNames[t.id];
  } else {
    // 자동 생성 과제명 규칙 적용
    const uniqueTypeIds = Array.from(new Set(selectedTypes.map(st => st.typeId)));
    const firstUnique = selectedTypes[0];
    const N = uniqueTypeIds.length - 1;
    taskName = N === 0 ? firstUnique.typeName : `${firstUnique.typeName} 외 ${N}건`;
    // Max 50 characters constraint
    if (taskName.length > 50) {
      taskName = taskName.substring(0, 47) + "...";
    }
  }

  return {
    id: t.id,
    subject: subject,
    name: taskName,
    course: t.course,
    status: t.status,
    difficulties: Array.from(new Set(selectedTypes.map(st => st.difficulty))),
    problemMode: t.mode,
    prioritizeUnsolved: false,
    onlyImportant: false,
    timeLimit: t.time === null ? undefined : t.time,
    selectedTypes: selectedTypes,
    totalProblems: t.problems,
    createdAt: t.createdAt,
    assignedStudents: assignedStudents,
    assignedClasses: t.mode === 'same' ? ["1반"] : [],
    individualStudentIds: t.mode === 'individual' ? assignedStudents.map(s => s.studentId) : []
  };
}

let generated = [];
mathTasksConfig.forEach((t, i) => generated.push(generateTask(t, i + 1, "math")));
sciTasksConfig.forEach((t, i) => generated.push(generateTask(t, i + 1, "science")));

// 8. INITIAL_TASKS 블록만 정밀하게 덮어쓰기 (닫는 bracket인 ];를 명시적으로 추가하여 TS1005 오류 수정)
const startStr = "export const INITIAL_TASKS: TaskItem[] = [";
const endStr = "// ─────────────────────────────────────────────\n// 유틸리티 함수";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx === -1 || endIdx === -1) {
  throw new Error("Could not find INITIAL_TASKS boundaries in task-center-mock.ts");
}

const before = content.substring(0, startIdx + startStr.length);
const after = content.substring(endIdx);

const finalTasksJSON = JSON.stringify(generated, null, 2);
const finalContent = before + "\n" + finalTasksJSON.substring(2, finalTasksJSON.length - 2) + "\n];\n\n" + after;

fs.writeFileSync(mockFilePath, finalContent, "utf8");
console.log("SUCCESSFULLY GENERATED AND PERSISTED MOCK DATA!");
