import { MATH_PRINT_SAMPLES, SCIENCE_PRINT_SAMPLES } from "./task-print-sample-mock";
import { getStoredTasks } from "@/utils/taskStorage";
import { INITIAL_TASKS } from "@/lib/task-center-mock";

export interface Question {
  id: string;
  taskId: string;
  subject: "math" | "science";
  index: number; // 1-based
  type: "choice" | "input";
  renderedHtml: string; // \(...\) 수식 포함
  choiceCount?: number;
  choiceHtmls?: string[];
  answerKey?: number[]; // 선지형 정답 (1-based index 배열)
  correctAnswer?: string; // 입력형 정답값
  typeId?: string; // 유형 ID
  typeName?: string; // 유형명 (예: "기본 도형의 이해")
  difficulty?: "basic" | "intermediate" | "advanced"; // 난이도
  explanationHtml?: string; // 해설 HTML (수식 포함)
  stem?: string; // 발문 텍스트
}

// LaTeX 수식 구분자를 $...$ 에서 \(...\) 로, $$...$$ 에서 \[...\] 로 변환하는 헬퍼 함수
function convertDollarToParentheses(text: string): string {
  if (!text) return "";
  let result = text;
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, "\\[$1\\]");
  result = result.replace(/\$([\s\S]*?)\$/g, "\\($1\\)");
  return result;
}

// Stored ID(예: math-task-004)와 Admin ID(예: task-math-004) 간의 유연한 매핑을 지원하는 헬퍼 함수
export function matchStoredIdWithAdminId(storedId: string, adminId: string): boolean {
  if (storedId === adminId) return true;
  
  const storedNumMatch = storedId.match(/\d+/);
  const adminNumMatch = adminId.match(/\d+/);
  if (!storedNumMatch || !adminNumMatch) return false;
  
  const storedNum = parseInt(storedNumMatch[0], 10);
  const adminNum = parseInt(adminNumMatch[0], 10);
  
  const isStoredSci = storedId.includes("sci");
  const isAdminSci = adminId.includes("sci") || adminNum >= 100;
  
  if (isStoredSci !== isAdminSci) return false;
  
  if (!isStoredSci) {
    return storedNum === adminNum;
  } else {
    return adminNum === (100 + storedNum);
  }
}

// taskId에 따라 문항들을 반환하는 함수
export function getQuestionsByTaskId(taskId: string): Question[] {
  // taskStorage 에 기록된 totalProblems 갯수 조회
  const tasks = getStoredTasks();
  const task = tasks.find((t) => matchStoredIdWithAdminId(t.id, taskId) || matchStoredIdWithAdminId(taskId, t.id));
  let adminTask = INITIAL_TASKS.find((t) => matchStoredIdWithAdminId(taskId, t.id) || matchStoredIdWithAdminId(t.id, taskId));
  if (!adminTask) {
    try {
      const { useTaskCenterStore } = require("./task-center-store");
      const dynamicTasks = useTaskCenterStore.getState().tasks;
      adminTask = dynamicTasks.find((t: any) => matchStoredIdWithAdminId(taskId, t.id) || matchStoredIdWithAdminId(t.id, taskId));
    } catch (e) {
      console.warn("Failed to load dynamic tasks from useTaskCenterStore", e);
    }
  }

  console.log("DEBUG: getQuestionsByTaskId", {
    taskId,
    taskFound: task ? task.id : null,
    adminTaskFound: adminTask ? adminTask.id : null,
    selectedTypes: adminTask ? adminTask.selectedTypes : null
  });

  // subject는 실제 task 데이터에서 결정 (taskId 문자열 포함 여부로 판단하면 task-003 같은 ID에서 오분류 발생)
  const subject: "math" | "science" =
    task?.subject ?? adminTask?.subject ?? (taskId.includes("sci") ? "science" : "math");
  const isMath = subject === "math";
  const sourceSamples = isMath ? MATH_PRINT_SAMPLES : SCIENCE_PRINT_SAMPLES;

  const totalProblems = task ? task.totalProblems : adminTask ? adminTask.totalProblems : 10;

  // 유형별 문항 배분 정보 (관리자 목데이터의 selectedTypes 기준)
  // 각 selectedType의 problemCount 만큼 문항에 typeName/difficulty 할당
  const selectedTypes = adminTask?.selectedTypes ?? [];
  const typePerQuestion: Array<{ typeId: string; typeName: string; difficulty: "basic" | "intermediate" | "advanced" }> = [];
  if (selectedTypes.length > 0) {
    for (const st of selectedTypes) {
      const count = st.problemCount ?? 1;
      for (let k = 0; k < count; k++) {
        typePerQuestion.push({ typeId: st.typeId, typeName: st.typeName, difficulty: st.difficulty });
      }
    }
  }

  const questions: Question[] = [];

  for (let i = 0; i < totalProblems; i++) {
    const sample = sourceSamples[i % sourceSamples.length];
    const index = i + 1;
    const isChoice = sample.choices && sample.choices.length > 0;

    // renderedHtml 조립 (발문, 보기, 이미지)
    let passageHtml = "";
    if (sample.passage) {
      const cleanPassage = convertDollarToParentheses(sample.passage);
      const formattedPassage = cleanPassage.replace(/\n/g, "<br/>");

      const cleanPassageText = sample.passage.replace(/<[^>]*>/g, "").replace(/\s/g, "");
      const isImageOnlyPassage = sample.passage.includes("<img") && cleanPassageText.length === 0;

      if (isImageOnlyPassage) {
        passageHtml = `<div class="mb-3 flex justify-center w-full">${formattedPassage}</div>`;
      } else {
        passageHtml = `<div class="passage-box border p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-gray-800 dark:text-gray-200 leading-relaxed mb-4 whitespace-pre-line">${formattedPassage}</div>`;
      }
    }

    let imageHtml = "";
    if (sample.image) {
      imageHtml = `<div class="mb-4 flex justify-center max-w-full"><img src="${sample.image}" alt="문제 이미지" class="max-w-full h-auto max-h-[200px] object-contain rounded" /></div>`;
    }

    const stemHtml = `<div class="mb-4 text-gray-900 dark:text-gray-100 font-medium">${convertDollarToParentheses(sample.stem)}</div>`;

    const renderedHtml = `
      <div class="max-w-full min-w-0 flex flex-col">
        ${stemHtml}
        ${passageHtml}
        ${imageHtml}
      </div>
    `.trim();

    const choiceHtmls = isChoice
      ? sample.choices.map((c) => convertDollarToParentheses(c))
      : undefined;

    let answerKey: number[] | undefined = undefined;
    let correctAnswer: string | undefined = undefined;

    if (isChoice) {
      const matchIdx = sample.choices.indexOf(sample.answer);
      if (matchIdx !== -1) {
        answerKey = [matchIdx + 1];
      } else {
        const clean = (s: string) => s.replace(/[\$\s\(\)\\]/g, "");
        const cleanAnswer = clean(sample.answer);
        const idx = sample.choices.findIndex((c) => clean(c) === cleanAnswer);
        if (idx !== -1) {
          answerKey = [idx + 1];
        } else {
          answerKey = [1];
        }
      }
    } else {
      correctAnswer = sample.answer;
    }

    // 문항별 유형/난이도 매핑 (typePerQuestion 범위 초과 시 순환)
    const typeInfo =
      typePerQuestion.length > 0
        ? typePerQuestion[i % typePerQuestion.length]
        : undefined;

    questions.push({
      id: `q-${subject}-${taskId.split("-").pop()}-${String(index).padStart(3, "0")}`,
      taskId,
      subject,
      index,
      type: isChoice ? "choice" : "input",
      renderedHtml,
      choiceCount: isChoice ? sample.choices.length : undefined,
      choiceHtmls,
      answerKey,
      correctAnswer,
      typeId: typeInfo?.typeId,
      typeName: typeInfo?.typeName,
      difficulty: typeInfo?.difficulty,
      explanationHtml: sample.explanation ? convertDollarToParentheses(sample.explanation) : undefined,
      stem: sample.stem,
    });
  }

  return questions;
}
