const fs = require('fs');

const mathTasksConfig = [
  { id: "task-001", types: 1, problems: 5, diff: ["intermediate"], mode: "individual", time: 30, status: "draft", assigned: 0, completed: 0, score: null, course: "초3-1", unit: "1단원-덧셈과 뺄셈", typeNames: ["받아올림이 없는 세 자리 수의 덧셈", "받아올림이 있는 세 자리 수의 덧셈"] },
  { id: "task-002", types: 2, problems: 7, diff: ["advanced"], mode: "same", time: 60, status: "draft", assigned: 0, completed: 0, score: null, course: "초4-2", unit: "2단원-평면도형", typeNames: ["각과 직각", "직각삼각형의 성질"] },
  { id: "task-003", types: 3, problems: 10, diff: ["basic", "intermediate"], mode: "same", time: "undefined", status: "draft", assigned: 0, completed: 0, score: null, course: "초5-1", unit: "3단원-문자와 식", typeNames: ["문자를 사용한 식", "식의 값 구하기", "일차식의 덧셈"] },
  { id: "task-math-004", types: 1, problems: 8, diff: ["basic"], mode: "individual", time: 45, status: "draft", assigned: 0, completed: 0, score: null, course: "초6-2", unit: "4단원-비례식", typeNames: ["비례식의 성질"] },
  { id: "task-math-005", types: 5, problems: 15, diff: ["intermediate", "advanced"], mode: "same", time: 60, status: "published", assigned: 1, completed: 0, score: null, course: "중1-1", unit: "5단원-좌표평면", typeNames: ["좌표평면 위의 점", "사분면", "대칭인 점", "그래프의 이해", "함수의 활용"] },
  { id: "task-math-006", types: 6, problems: 18, diff: ["basic", "intermediate", "advanced"], mode: "individual", time: "undefined", status: "published", assigned: 5, completed: 2, score: 85, course: "중1-2", unit: "6단원-입체도형", typeNames: ["다면체", "정다면체", "회전체", "입체도형의 겉넓이", "입체도형의 부피", "구의 부피"] },
  { id: "task-math-007", types: 2, problems: 12, diff: ["intermediate"], mode: "same", time: 30, status: "published", assigned: 3, completed: 3, score: 90, course: "중2-1", unit: "7단원-유리수", typeNames: ["유리수의 뜻", "유리수의 덧셈과 뺄셈"] },
  { id: "task-math-008", types: 8, problems: 25, diff: ["advanced"], mode: "individual", time: 60, status: "published", assigned: 2, completed: 1, score: 75, course: "중2-2", unit: "8단원-도형의 닮음", typeNames: ["닮음비", "삼각형의 닮음 조건", "평행선과 선분의 길이", "무게중심", "닮음의 활용", "피타고라스 정리", "삼각비", "원과 직선"] },
  { id: "task-math-009", types: 10, problems: 30, diff: ["basic", "intermediate", "advanced"], mode: "same", time: "undefined", status: "published", assigned: 4, completed: 4, score: 92, course: "중3-1", unit: "9단원-제곱근", typeNames: ["제곱근의 뜻", "제곱근의 성질", "무리수", "실수와 수직선", "근호를 포함한 식의 계산", "유리화", "다항식의 곱셈", "인수분해", "완전제곱식", "합차공식"] },
  { id: "task-math-010", types: 3, problems: 14, diff: ["basic", "intermediate"], mode: "individual", time: 45, status: "ended", assigned: 2, completed: 2, score: 100, course: "초3-1", unit: "10단원-분수", typeNames: ["분수의 뜻", "진분수와 가분수", "분수의 크기 비교"] },
  { id: "task-math-011", types: 5, problems: 20, diff: ["intermediate"], mode: "same", time: 30, status: "ended", assigned: 4, completed: 4, score: 65, course: "중1-1", unit: "11단원-방정식", typeNames: ["일차방정식", "방정식의 해", "이항", "복잡한 방정식", "방정식의 활용"] },
  { id: "task-math-012", types: 6, problems: 22, diff: ["advanced"], mode: "individual", time: "undefined", status: "ended", assigned: 6, completed: 5, score: 80, course: "중2-1", unit: "12단원-연립방정식", typeNames: ["미지수가 2개인 일차방정식", "연립방정식", "대입법", "가감법", "복잡한 연립방정식", "연립방정식의 활용"] }
];

const sciTasksConfig = [
  { id: "task-101", types: 1, problems: 5, diff: ["basic"], mode: "same", time: 30, status: "draft", assigned: 0, completed: 0, score: null, course: "중1-1", unit: "1단원-지권의 변화", typeNames: ["지구계와 지권의 층상 구조", "암석의 분류"] },
  { id: "task-sci-102", types: 1, problems: 6, diff: ["intermediate"], mode: "individual", time: 45, status: "draft", assigned: 0, completed: 0, score: null, course: "중1-2", unit: "2단원-여러 가지 힘", typeNames: ["중력과 탄성력"] },
  { id: "task-sci-103", types: 2, problems: 9, diff: ["advanced"], mode: "same", time: "undefined", status: "draft", assigned: 0, completed: 0, score: null, course: "중2-1", unit: "3단원-생물의 다양성", typeNames: ["생물 다양성과 보전", "생물 분류 체계"] },
  { id: "task-sci-104", types: 3, problems: 10, diff: ["basic", "intermediate"], mode: "individual", time: 60, status: "draft", assigned: 0, completed: 0, score: null, course: "중2-2", unit: "4단원-물질의 상태 변화", typeNames: ["상태 변화와 열에너지", "분자 운동", "증발과 끓음"] },
  { id: "task-sci-105", types: 2, problems: 12, diff: ["basic"], mode: "same", time: 30, status: "published", assigned: 1, completed: 0, score: null, course: "중3-1", unit: "5단원-빛과 파동", typeNames: ["빛의 반사와 굴절", "파동의 성질"] },
  { id: "task-sci-106", types: 3, problems: 15, diff: ["intermediate", "advanced"], mode: "individual", time: "undefined", status: "published", assigned: 5, completed: 2, score: 85, course: "중3-2", unit: "6단원-식물과 에너지", typeNames: ["광합성", "호흡", "증산 작용"] },
  { id: "task-sci-107", types: 5, problems: 16, diff: ["basic", "intermediate", "advanced"], mode: "same", time: 45, status: "published", assigned: 3, completed: 3, score: 90, course: "중1-1", unit: "7단원-동물과 에너지", typeNames: ["소화", "순환", "호흡", "배설", "세포 호흡"] },
  { id: "task-sci-108", types: 6, problems: 20, diff: ["intermediate"], mode: "individual", time: 60, status: "published", assigned: 2, completed: 1, score: 75, course: "중1-2", unit: "8단원-전기와 자기", typeNames: ["마찰전기", "전류와 전압", "저항", "옴의 법칙", "자기장", "전자기력"] },
  { id: "task-sci-109", types: 8, problems: 28, diff: ["advanced"], mode: "same", time: "undefined", status: "published", assigned: 4, completed: 4, score: 92, course: "중2-1", unit: "9단원-태양계", typeNames: ["지구의 크기", "달의 크기", "지구의 자전", "지구의 공전", "달의 위상 변화", "일식과 월식", "태양계 행성", "태양 활동"] },
  { id: "task-sci-110", types: 10, problems: 30, diff: ["basic", "intermediate"], mode: "individual", time: 30, status: "ended", assigned: 2, completed: 2, score: 100, course: "중2-2", unit: "10단원-화학 반응", typeNames: ["물리 변화와 화학 변화", "화학 반응식", "질량 보존 법칙", "일정 성분비 법칙", "기체 반응 법칙", "발열 반응", "흡열 반응", "산화와 환원", "산과 염기", "중화 반응"] },
  { id: "task-sci-111", types: 5, problems: 24, diff: ["intermediate"], mode: "same", time: 45, status: "ended", assigned: 4, completed: 4, score: 65, course: "중3-1", unit: "11단원-유전과 진화", typeNames: ["멘델의 유전 원리", "사람의 유전", "돌연변이", "진화론", "생물의 분류"] },
  { id: "task-sci-112", types: 6, problems: 25, diff: ["advanced"], mode: "individual", time: "undefined", status: "ended", assigned: 6, completed: 5, score: 80, course: "중3-2", unit: "12단원-역학적 에너지", typeNames: ["일과 에너지", "운동 에너지", "위치 에너지", "역학적 에너지 보존", "도구와 일", "일률"] }
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

  const selectedTypes = [];
  // distribute problems randomly but exactly summing to t.problems, with each type getting at least 1
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

    const tName = t.typeNames[c % t.typeNames.length];
    
    selectedTypes.push({
      curriculumId: `${subject}-${t.course}`,
      course: t.course,
      typeId: `mock-type-${subject}-${idx}-${c}`,
      majorUnit: t.unit,
      minorUnit: tName + " 관련 핵심",
      typeName: tName,
      difficulty: t.diff[0],
      problemCount: pCount,
      maxCount: { basic: 10, intermediate: 10, advanced: 10 },
      importantCount: { basic: 5, intermediate: 5, advanced: 5 }
    });
  }

  const nameSuffix = t.types > 1 ? ` 외 ${t.types - 1}건` : "";
  const taskName = t.types === 10 ? `${t.unit} > ${selectedTypes[0].typeName}${nameSuffix} 이렇게 매우 긴 과제명이 발생했을 때의 말줄임 표시 테스트용` : `${t.unit} > ${selectedTypes[0].typeName}${nameSuffix}`;

  const dateDay = String((idx * 2) % 28 + 1).padStart(2, '0');
  const createdAt = `2026-05-${dateDay}T10:00:00Z`;

  return [
    "  {",
    `    id: "${t.id}",`,
    `    subject: "${subject}",`,
    `    name: ${JSON.stringify(taskName)},`,
    `    course: "${t.course}",`,
    `    status: "${t.status}",`,
    `    difficulties: ${JSON.stringify(t.diff)},`,
    `    problemMode: "${t.mode}",`,
    `    prioritizeUnsolved: false,`,
    `    onlyImportant: false,`,
    `    timeLimit: ${t.time},`,
    `    selectedTypes: ${JSON.stringify(selectedTypes)},`,
    `    totalProblems: ${t.problems},`,
    `    createdAt: "${createdAt}",`,
    `    assignedStudents: ${JSON.stringify(assignedStudents)},`,
    `    assignedClasses: ${t.mode === 'same' ? '["1반"]' : '[]'},`,
    `    individualStudentIds: ${t.mode === 'individual' ? JSON.stringify(assignedStudents.map(s => s.studentId)) : '[]'}`,
    "  }"
  ].join("\n");
}

let generated = [];
mathTasksConfig.forEach((t, i) => generated.push(generateTask(t, i + 1, "math")));
sciTasksConfig.forEach((t, i) => generated.push(generateTask(t, i + 1, "science")));

const file = "src/lib/task-center-mock.ts";
let content = fs.readFileSync(file, "utf8");

const startStr = "export const INITIAL_TASKS: TaskItem[] = [";
const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf("];", startIdx);

if (startIdx === -1 || endIdx === -1) {
  throw new Error("Could not find INITIAL_TASKS block");
}

const before = content.substring(0, startIdx + startStr.length);
const after = content.substring(endIdx);

const finalContent = before + "\n" + generated.join(",\n") + "\n" + after;
fs.writeFileSync(file, finalContent, "utf8");
console.log("SUCCESS");
