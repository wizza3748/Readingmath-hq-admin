"use client";

import React, { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  ArrowLeft,
  Flag,
  X,
} from "lucide-react";

import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";

import { getQuestionsByTaskId, Question, matchStoredIdWithAdminId } from "@/lib/task-solve-mock";
import { getAnswers, saveAnswer, Answer } from "@/utils/answerStorage";
import { getStoredTasks, updateTaskStatus, Task } from "@/utils/taskStorage";
import { saveTaskResult, TaskResult, GradingDetail } from "@/utils/taskResultStorage";
import { INITIAL_TASKS, StudentAssignment } from "@/lib/task-center-mock";
import { useToast } from "@/hooks/use-toast";
import PrintPreviewPanel from "@/components/admin/task-center/print/print-preview-panel";

interface PageProps {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{ preview?: string; previewStudentId?: string }>;
}

// KaTeX 수식 렌더링 컴포넌트
function ProblemRenderer({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = html;
    renderMathInElement(ref.current, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      macros: {
        "\\frac": "\\dfrac",
      },
      throwOnError: false,
    });
  }, [html]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .choice-image-wrapper img {
          height: 110px !important;
          max-height: 110px !important;
          width: auto !important;
          object-fit: contain !important;
        }
        .passage-box {
          background-color: #f9fafb !important;
          color: #1f2937 !important;
          border-color: #e5e7eb !important;
        }
        .dark .passage-box {
          background-color: rgba(31, 41, 55, 0.4) !important;
          color: #e5e7eb !important;
          border-color: #374151 !important;
        }
        .passage-box img,
        .text-base img,
        .text-lg img {
          max-width: 100% !important;
          height: auto !important;
          max-height: 280px !important;
          object-fit: contain !important;
          margin: 12px auto !important;
          display: block !important;
        }
      `}} />
      <div
        ref={ref}
        className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 min-w-0"
      />
    </>
  );
}

export default function MathSolvePage(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  const { toast } = useToast();

  const taskId = params.taskId;
  const isPreview = searchParams.preview === "true";

  // 선지 레이아웃 모드 판별 ("col" | "row" | "grid" | "grid3")
  const getChoiceLayoutMode = (choiceHtmls: string[] | undefined): "col" | "row" | "grid" | "grid3" => {
    if (!choiceHtmls || choiceHtmls.length === 0) return "col";

    // 1. 이미지가 포함된 선지가 있는지 확인
    const hasImage = choiceHtmls.some(html => html.includes("<img"));
    if (hasImage) {
      return "grid3"; // 이미지인 경우 3열로 정렬
    }

    // 2. 수식 포함 여부 확인
    const hasMath = choiceHtmls.some(html => html.includes("\\(") || html.includes("$"));

    // 3. HTML 태그 및 LaTeX 명령어를 제거한 실제 비주얼상의 글자 수 계산
    const getVisualLength = (html: string): number => {
      let text = html.replace(/<[^>]*>/g, ""); // HTML 태그 제거
      text = text.replace(/\\\(|\\\)|\$/g, ""); // LaTeX 구분자 제거
      text = text.replace(/\\[a-zA-Z]+/g, ""); // LaTeX 명령어 (\frac 등) 제거
      text = text.replace(/[{}]/g, ""); // 중괄호 제거
      return text.trim().length;
    };

    const maxVisualLength = choiceHtmls.reduce((max, html) => {
      const len = getVisualLength(html);
      return len > max ? len : max;
    }, 0);

    if (hasMath) {
      // 등호(=)나 부등호들이 포함되어 있는지 확인 (식의 가로 길이가 길어짐)
      const hasEquationOrComparison = choiceHtmls.some(html => 
        html.includes("=") || 
        html.includes("<") || 
        html.includes(">") || 
        html.includes("≥") || 
        html.includes("≤") || 
        html.includes("\\le") || 
        html.includes("\\ge") || 
        html.includes("\\ne") || 
        html.includes("\\approx")
      );

      // 전체 비주얼 길이가 매우 짧으면(예: 8자 이하) 등호/부등호가 들어갔더라도 가로 5열(row)로 배치 가능!
      if (maxVisualLength <= 8) {
        return "row";
      }

      if (hasEquationOrComparison) {
        // 등식/부등식이면 식의 가로 폭이 넓으므로 row(5열)는 불가하며, 2열(grid) 혹은 1열(col)로 가야 함
        if (maxVisualLength <= 20) {
          return "grid";
        }
        return "col";
      } else {
        // 등호가 없는 단순 수식 (분수, 단일 기호 등)
        if (maxVisualLength <= 20) {
          return "grid"; // 2열
        }
        return "col"; // 1열
      }
    } else {
      // 일반 텍스트
      if (maxVisualLength <= 8) {
        return "row"; // 5열 (단답형 단어 등)
      }
      if (maxVisualLength <= 16) {
        return "grid"; // 2열
      }
      return "col"; // 1열
    }
  };

  // 상태 관리
  const [task, setTask] = useState<Task | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showAnswerSheet, setShowAnswerSheet] = useState<boolean>(false);
  const [activeInputIdx, setActiveInputIdx] = useState<number | null>(null);

  // 출력 모달 상태
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // 출력용 학생/반 데이터 바인딩 로직
  const adminTask = INITIAL_TASKS.find((t) => matchStoredIdWithAdminId(taskId, t.id) || matchStoredIdWithAdminId(t.id, taskId)) || null;
  const activeStudents = adminTask?.assignedStudents || [];
  const currentStudentId = searchParams.previewStudentId || activeStudents[0]?.studentId || "student-1";
  const currentStudent: StudentAssignment = activeStudents.find(s => s.studentId === currentStudentId) || {
    studentId: currentStudentId,
    studentName: "김푸름",
    classGroup: "1반",
    status: "in_progress",
    printStatus: "not_printed"
  };
  const currentStudentList = React.useMemo(() => [currentStudent], [
    currentStudent.studentId,
    currentStudent.studentName,
    currentStudent.classGroup,
    currentStudent.status,
    currentStudent.printStatus
  ]);

  // 모달 상태
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showUnenteredModal, setShowUnenteredModal] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportText, setReportText] = useState<string>("");
  const [isReporting, setIsReporting] = useState<boolean>(false);

  // 로드 데이터
  useEffect(() => {
    const qList = getQuestionsByTaskId(taskId, searchParams.previewStudentId);
    setQuestions(qList);

    const taskList = getStoredTasks();
    const currentTask = taskList.find((t) => t.id === taskId);
    if (currentTask) {
      setTask(currentTask);
      // 미시작 상태라면 진행중으로 변경 (preview 아닐 때만)
      if (!isPreview && currentTask.status === "notStarted") {
        updateTaskStatus(taskId, "ongoing");
      }
    } else if (isPreview) {
      // 미리보기 모드: 관리자 목데이터 및 localStorage에서 task 정보 조회
      const adminTask = INITIAL_TASKS.find((t) => t.id === taskId);
      let localAdminTask = null;
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("readingmath_admin_tasks");
        if (saved) {
          try {
            const adminTasks = JSON.parse(saved);
            localAdminTask = adminTasks.find((t: any) => t.id === taskId);
          } catch (e) {
            console.error(e);
          }
        }
      }
      const targetAdmin = adminTask || localAdminTask;
      if (targetAdmin) {
        const previewTask: Task = {
          id: targetAdmin.id,
          subject: targetAdmin.subject,
          title: targetAdmin.name,
          status: "notStarted",
          assignedAt: targetAdmin.createdAt,
          totalProblems: targetAdmin.totalProblems,
          course: targetAdmin.course,
        };
        setTask(previewTask);
      } else {
        // INITIAL_TASKS에도 없으면 기본값 생성
        const fallbackTask: Task = {
          id: taskId,
          subject: taskId.includes("sci") ? "science" : "math",
          title: "미리보기 과제",
          status: "notStarted",
          assignedAt: new Date().toISOString(),
          totalProblems: qList.length,
        };
        setTask(fallbackTask);
      }
    }

    // 답안 불러오기
    const saved = getAnswers(taskId);
    setAnswers(saved);

    // 테마 감지
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("readingmath_theme");
      const isDark = savedTheme === "dark";
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [taskId, isPreview, searchParams.previewStudentId]);

  // 출력 모달 노출 시 body 스크롤 방지
  useEffect(() => {
    if (isPrintModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPrintModalOpen]);

  // 문항 전환 시 입력값 동기화
  useEffect(() => {
    if (questions.length === 0) return;
    const currentQ = questions[currentIdx];
    const currentAns = answers.find((a) => a.questionIndex === currentIdx);
    if (currentQ.type === "input") {
      setInputValue(currentAns?.inputValue || "");
    }
  }, [currentIdx, questions, answers]);

  // 다크모드 토글
  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("readingmath_theme", nextMode ? "dark" : "light");
      if (nextMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // 답안 임시 저장 함수
  const handleSaveAnswer = (ans: Answer) => {
    if (isPreview) {
      // preview 모드인 경우 로컬 answers state만 업데이트
      const nextAnswers = [...answers];
      const existIdx = nextAnswers.findIndex((a) => a.questionIndex === ans.questionIndex);
      if (existIdx > -1) {
        nextAnswers[existIdx] = ans;
      } else {
        nextAnswers.push(ans);
      }
      setAnswers(nextAnswers);
      return;
    }

    // 일반 모드: 스토리지에 저장
    saveAnswer(taskId, ans);
    setAnswers([...getAnswers(taskId)]);

    // 실시간 풀이 문항 수 업데이트를 위해 taskStorage의 solvedProblems 갱신
    const uniqueSolvedCount = new Set([
      ...getAnswers(taskId).map((a) => a.questionIndex),
    ]).size;
    const taskList = getStoredTasks();
    const updatedTasks = taskList.map((t) => {
      if (t.id === taskId) {
        return { ...t, solvedProblems: uniqueSolvedCount };
      }
      return t;
    });
    // saveStoredTasks
    if (typeof window !== "undefined") {
      (window as any).__readingmath_tasks__ = updatedTasks;
      window.dispatchEvent(new Event("task-status-changed"));
    }
  };

  // 선지 선택 핸들러
  const handleChoiceSelect = (choiceNum: number) => {
    const currentAns = answers.find((a) => a.questionIndex === currentIdx);
    let selected: number[] = [];

    if (currentAns && Array.isArray(currentAns.selectedChoices) && currentAns.selectedChoices.includes(choiceNum)) {
      // 이미 선택된 것이면 선택 해제
      selected = currentAns.selectedChoices.filter((c) => c !== choiceNum);
    } else {
      // 새로 선택
      selected = [choiceNum];
    }

    const newAns: Answer = {
      questionIndex: currentIdx,
      type: "choice",
      selectedChoices: selected,
    };

    handleSaveAnswer(newAns);
  };

  // 가상 키패드 입력 핸들러
  const handleKeypadPress = (key: string) => {
    let nextVal = inputValue;
    if (key === "delete") {
      nextVal = nextVal.slice(0, -1);
    } else if (key === "clear") {
      nextVal = "";
    } else if (key === "confirm") {
      // 확인 클릭 시 임시저장
      const newAns: Answer = {
        questionIndex: currentIdx,
        type: "input",
        inputValue: inputValue,
      };
      handleSaveAnswer(newAns);
      // 마지막 문제가 아니라면 다음 문제로 자동 이동
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
      }
      return;
    } else {
      // 최대 15자리 제한
      if (nextVal.length < 15) {
        nextVal += key;
      }
    }
    setInputValue(nextVal);

    // 즉시 로컬 답안 상태 반영
    const newAns: Answer = {
      questionIndex: currentIdx,
      type: "input",
      inputValue: nextVal,
    };
    handleSaveAnswer(newAns);
  };

  // 답안표 전용 키패드 입력 핸들러
  const handleAnswerSheetKeypad = (key: string, targetIdx: number) => {
    const currentAns = answers.find((a) => a.questionIndex === targetIdx);
    let currentVal = currentAns?.inputValue || "";
    
    if (key === "delete") {
      currentVal = currentVal.slice(0, -1);
    } else if (key === "clear") {
      currentVal = "";
    } else if (key === "confirm") {
      const newAns: Answer = {
        questionIndex: targetIdx,
        type: "input",
        inputValue: currentVal,
      };
      handleSaveAnswer(newAns);
      setActiveInputIdx(null);
      return;
    } else {
      if (currentVal.length < 15) {
        currentVal += key;
      }
    }
    
    const newAns: Answer = {
      questionIndex: targetIdx,
      type: "input",
      inputValue: currentVal,
    };
    handleSaveAnswer(newAns);
  };

  // 인쇄 실행 함수
  const handlePrint = () => {
    setTimeout(() => {
      const originalTitle = document.title;
      const dateStr = new Date().toISOString().replace(/[:\-T]/g, "").slice(0, 13);
      const safeTaskName = task?.title ? task.title.replace(/[/\\?%*:|"<>]/g, '') : '과제출력';
      document.title = `${safeTaskName}_${dateStr}`;
      window.print();
      document.title = originalTitle;
    }, 100);
  };

  // 제출하기 프로세스 시작
  const handleSubmitClick = () => {
    // 풀리지 않은 문제 검사
    const totalQCount = questions.length;
    const answeredIndices = answers
      .filter((a) => {
        if (a.type === "choice") {
          return a.selectedChoices && a.selectedChoices.length > 0;
        } else {
          return a.inputValue && a.inputValue.trim() !== "";
        }
      })
      .map((a) => a.questionIndex);

    const isAllAnswered = answeredIndices.length === totalQCount;

    if (!isAllAnswered) {
      setShowUnenteredModal(true);
    } else {
      setShowSubmitModal(true);
    }
  };

  // 최종 제출 처리
  const handleConfirmSubmit = async () => {
    setShowUnenteredModal(false);
    setShowSubmitModal(false);
    setIsSubmitting(true);

    // 채점 진행 및 결과 데이터 수집
    let correctCount = 0;
    let unenteredCount = 0;
    const gradingDetails: GradingDetail[] = [];

    questions.forEach((q, idx) => {
      const ans = answers.find((a) => a.questionIndex === idx);
      
      let status: "correct" | "incorrect" | "unentered" = "incorrect";
      let submittedAnswer: string | number[] | undefined = undefined;
      const correctAnswer: string | number[] | undefined = q.type === "choice" ? q.answerKey : q.correctAnswer;

      if (!ans) {
        status = "unentered";
        unenteredCount++;
      } else {
        if (q.type === "choice") {
          submittedAnswer = ans.selectedChoices || [];
          if (!ans.selectedChoices || ans.selectedChoices.length === 0) {
            status = "unentered";
            unenteredCount++;
          } else if (q.answerKey) {
            const sortedSelected = [...ans.selectedChoices].sort();
            const sortedKey = [...q.answerKey].sort();
            const isMatch = sortedSelected.length === sortedKey.length &&
              sortedSelected.every((v, i) => v === sortedKey[i]);
            if (isMatch) {
              status = "correct";
              correctCount++;
            } else {
              status = "incorrect";
            }
          }
        } else {
          submittedAnswer = ans.inputValue || "";
          if (!ans.inputValue || ans.inputValue.trim() === "") {
            status = "unentered";
            unenteredCount++;
          } else if (q.correctAnswer) {
            const isMatch = ans.inputValue.trim() === q.correctAnswer.trim();
            if (isMatch) {
              status = "correct";
              correctCount++;
            } else {
              status = "incorrect";
            }
          }
        }
      }

      gradingDetails.push({
        questionIndex: idx,
        status,
        submittedAnswer,
        correctAnswer,
      });
    });

    const incorrectCount = questions.length - correctCount - unenteredCount;
    const score = Math.round((correctCount / questions.length) * 100);

    // 3초간 인위적 지연 (제출 로딩)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 결과 데이터 고정 저장 (Preview든 일반 모드든 저장)
    const taskResult: TaskResult = {
      taskId,
      score,
      correctCount,
      incorrectCount,
      unenteredCount,
      submittedAt: new Date().toISOString(),
      gradingDetails,
    };
    saveTaskResult(taskId, taskResult);

    if (!isPreview) {
      updateTaskStatus(taskId, "submitted", {
        score,
        correctProblems: correctCount,
        solvedProblems: questions.length,
      });
    }

    setIsSubmitting(false);
    
    // 결과 화면으로 이동
    if (isPreview) {
      router.push(`/content/math-task-center/${taskId}/result?preview=true`);
    } else {
      router.push(`/content/math-task-center/${taskId}/result`);
    }
  };

  // 나가기 핸들러
  const handleExit = () => {
    setShowExitModal(false);
    if (isPreview) {
      window.close();
    } else {
      router.push("/content/math-task-center");
    }
  };

  if (questions.length === 0 || !task) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const currentAnswer = answers.find((a) => a.questionIndex === currentIdx);

  // 문항 작성 여부 확인
  const isQuestionAnswered = (idx: number) => {
    const ans = answers.find((a) => a.questionIndex === idx);
    if (!ans) return false;
    if (ans.type === "choice") {
      return ans.selectedChoices && ans.selectedChoices.length > 0;
    } else {
      return ans.inputValue !== undefined && ans.inputValue.trim() !== "";
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50 text-gray-900 transition-colors duration-200 dark:bg-gray-950 dark:text-gray-100">
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center space-x-2.5 text-sm font-semibold">
          {/* 과목 뱃지 */}
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
            task.subject === "math" 
              ? "bg-blue-50 text-blue-700 border border-blue-150 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900" 
              : "bg-emerald-50 text-emerald-700 border border-emerald-150 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
          }`}>
            {task.subject === "math" ? "수학" : "과학"}
          </span>

          {/* 학기 뱃지 */}
          {task.course && (
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-655 border border-gray-200/60 dark:bg-gray-800 dark:text-gray-350 dark:border-gray-700">
              {task.course}
            </span>
          )}

          {/* 세로 구분선 */}
          <span className="h-3 w-px bg-gray-200 dark:bg-gray-855 mx-1" />

          {/* 단원 표시 */}
          <div className="text-gray-750 dark:text-gray-300 flex items-center space-x-1.5">
            <span className="text-gray-800 dark:text-gray-100 font-bold">
              {task.unitDisplayName?.split(">")[0]?.trim() || ""}
            </span>
            {task.unitDisplayName?.includes(">") && (
              <>
                <span className="text-gray-400 dark:text-gray-600 font-normal">&gt;</span>
                <span className="text-gray-500 dark:text-gray-455 font-medium">
                  {task.unitDisplayName.substring(task.unitDisplayName.indexOf(">") + 1).trim()}
                </span>
              </>
            )}
          </div>

          {isPreview && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 animate-pulse dark:bg-amber-900/50 dark:text-amber-300 ml-2">
              미리보기
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {/* 모드 전환 토글 스위치 */}
          <div className="flex items-center">
            <button
              onClick={toggleDarkMode}
              className={`relative w-16 h-8 rounded-full transition-all duration-300 flex items-center p-1 cursor-pointer select-none focus:outline-none shadow-md ${
                isDarkMode ? 'bg-[#1e293b] border border-white/[0.08]' : 'bg-[#cbd5e1] border border-slate-300'
              }`}
              title="모드 전환"
            >
              {/* 토글 볼 */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 transform shadow-sm ${
                  isDarkMode ? 'translate-x-8 bg-[#334155]' : 'translate-x-0 bg-white'
                }`}
              >
                {isDarkMode ? (
                  <span className="text-[12px] select-none">🌙</span>
                ) : (
                  <span className="text-[12px] select-none">☀️</span>
                )}
              </div>
            </button>
          </div>
          <button
            onClick={() => {
              setReportText("");
              setShowReportModal(true);
            }}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            title="오류 신고"
          >
            <Flag className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowExitModal(true)}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            title="나가기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* 과제명 행 */}
      <div className="flex items-center space-x-3 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setShowExitModal(true)}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          title="뒤로가기"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {task.title}
        </h1>
      </div>

      {/* 메인 레이아웃 (문제/현황) */}
      <main className="flex flex-1 overflow-hidden">
        {/* 좌측 문제/풀이 영역 */}
        <section className="flex flex-1 flex-col overflow-y-auto p-8 lg:p-12 bg-white dark:bg-gray-955 border-r border-gray-100 dark:border-gray-855">
          <div className="flex-1 space-y-8 w-full max-w-none">
            {/* 문제 영역 */}
            <div className="w-full space-y-6 transition-all duration-300">
              <div className="mb-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    문제 {currentIdx + 1}
                  </span>
                  {currentQuestion.typeName && (
                    <>
                      <span className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {currentQuestion.typeName}
                      </span>
                      {currentQuestion.difficulty && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          currentQuestion.difficulty === "basic"
                            ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                            : currentQuestion.difficulty === "intermediate"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-sky-800"
                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/40 dark:text-rose-300 dark:border-sky-800"
                        }`}>
                          {currentQuestion.difficulty === "basic" ? "기본" : currentQuestion.difficulty === "intermediate" ? "실력" : "심화"}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>


              {/* 문제 본문 */}
              <div className="mb-6">
                <ProblemRenderer html={currentQuestion.renderedHtml} />
              </div>

              {/* 답안 입력 영역 */}
              <div className="pt-6">
                {currentQuestion.type === "choice" ? (
                  // 선지형 UI
                  (() => {
                    const layoutMode = getChoiceLayoutMode(currentQuestion.choiceHtmls);
                    
                    if (layoutMode === "row") {
                      return (
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                          {currentQuestion.choiceHtmls?.map((choiceHtml, i) => {
                            const choiceNum = i + 1;
                            const isSelected =
                              currentAnswer && Array.isArray(currentAnswer.selectedChoices)
                                ? currentAnswer.selectedChoices.includes(choiceNum)
                                : false;
                            return (
                              <button
                                key={choiceNum}
                                onClick={() => handleChoiceSelect(choiceNum)}
                                className={`flex items-center justify-start space-x-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150 ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm dark:bg-blue-950/30 dark:text-blue-100 font-bold"
                                    : "border-transparent bg-transparent hover:bg-gray-100/40 dark:hover:bg-gray-800/40"
                                }`}
                              >
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all ${
                                    isSelected
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-gray-300 bg-white text-gray-600 dark:border-gray-650 dark:bg-gray-800 dark:text-gray-350"
                                  }`}
                                >
                                  {choiceNum}
                                </span>
                                <div className="min-w-0">
                                  <ProblemRenderer html={choiceHtml} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    }
                    
                    if (layoutMode === "grid3") {
                      return (
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                          {currentQuestion.choiceHtmls?.map((choiceHtml, i) => {
                            const choiceNum = i + 1;
                            const isSelected =
                              currentAnswer && Array.isArray(currentAnswer.selectedChoices)
                                ? currentAnswer.selectedChoices.includes(choiceNum)
                                : false;
                            return (
                              <button
                                key={choiceNum}
                                onClick={() => handleChoiceSelect(choiceNum)}
                                className={`flex items-center justify-start space-x-3 rounded-xl border px-4 py-3 text-left transition-all duration-150 ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm dark:bg-blue-950/30 dark:text-blue-100 font-bold"
                                    : "border-transparent bg-transparent hover:bg-gray-100/40 dark:hover:bg-gray-800/40"
                                }`}
                              >
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all ${
                                    isSelected
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-gray-300 bg-white text-gray-600 dark:border-gray-650 dark:bg-gray-800 dark:text-gray-305"
                                  }`}
                                >
                                  {choiceNum}
                                </span>
                                <div className="flex-1 min-w-0 flex justify-center py-2 choice-image-wrapper">
                                  <ProblemRenderer html={choiceHtml} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    }
                    
                    if (layoutMode === "grid") {
                      return (
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
                          {currentQuestion.choiceHtmls?.map((choiceHtml, i) => {
                            const choiceNum = i + 1;
                            const isSelected =
                              currentAnswer && Array.isArray(currentAnswer.selectedChoices)
                                ? currentAnswer.selectedChoices.includes(choiceNum)
                                : false;
                            return (
                              <button
                                key={choiceNum}
                                onClick={() => handleChoiceSelect(choiceNum)}
                                className={`flex items-center justify-start space-x-4 rounded-xl border px-4 py-3 text-left transition-all duration-150 ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm dark:bg-blue-950/30 dark:text-blue-100 font-bold"
                                    : "border-transparent bg-transparent hover:bg-gray-100/40 dark:hover:bg-gray-800/40"
                                }`}
                              >
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all ${
                                    isSelected
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-gray-300 bg-white text-gray-600 dark:border-gray-650 dark:bg-gray-800 dark:text-gray-305"
                                  }`}
                                >
                                  {choiceNum}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <ProblemRenderer html={choiceHtml} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    }
                    
                    // 기본 세로 col 배치
                    return (
                      <div className="space-y-3">
                        {currentQuestion.choiceHtmls?.map((choiceHtml, i) => {
                          const choiceNum = i + 1;
                          const isSelected =
                            currentAnswer && Array.isArray(currentAnswer.selectedChoices)
                              ? currentAnswer.selectedChoices.includes(choiceNum)
                              : false;
                          return (
                            <button
                              key={choiceNum}
                              onClick={() => handleChoiceSelect(choiceNum)}
                              className={`flex w-full items-center justify-start space-x-4 rounded-xl border px-5 py-3.5 text-left transition-all duration-150 ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm dark:bg-blue-950/30 dark:text-blue-100 font-bold"
                                  : "border-transparent bg-transparent hover:bg-gray-100/40 dark:hover:bg-gray-800/40"
                              }`}
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all ${
                                  isSelected
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-gray-300 bg-white text-gray-655 dark:bg-gray-800 dark:text-gray-300"
                                }`}
                              >
                                {choiceNum}
                              </span>
                              <div className="flex-1 min-w-0">
                                <ProblemRenderer html={choiceHtml} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()
                ) : (
                  // 입력형 UI
                  <div className="flex flex-col space-y-4 max-w-[360px] mx-auto w-full">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInputValue(val);
                        handleSaveAnswer({
                          questionIndex: currentIdx,
                          type: "input",
                          inputValue: val,
                        });
                      }}
                      placeholder="답을 입력해주세요"
                      className="w-full text-center rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-xl font-bold tracking-wider text-gray-850 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                    />

                    {/* 수치 키패드 */}
                    <div className="w-full bg-gray-100 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-800">
                      <div className="grid grid-cols-5 gap-2.5">
                        {[
                          { label: "1", value: "1" },
                          { label: "2", value: "2" },
                          { label: "3", value: "3" },
                          { label: "4", value: "4" },
                          { label: "5", value: "5" },
                          
                          { label: "6", value: "6" },
                          { label: "7", value: "7" },
                          { label: "8", value: "8" },
                          { label: "9", value: "9" },
                          { label: "0", value: "0" },
                          
                          { label: ".", value: "." },
                          { label: "-", value: "-" },
                          { label: "+", value: "+" },
                          { label: "↺", value: "clear", cls: "bg-gray-55 dark:bg-gray-850 text-gray-650 dark:text-gray-400 font-bold" },
                          { label: "⌫", value: "delete", cls: "bg-gray-55 dark:bg-gray-855 text-gray-655 dark:text-gray-400 font-bold" },
                          
                          { label: "✓", value: "confirm", colSpan: 5, cls: "bg-slate-600 hover:bg-slate-700 text-white font-bold text-xl h-12 flex items-center justify-center rounded-xl" },
                        ].map((btn, i) => {
                          const gridCls = [
                            btn.colSpan ? `col-span-${btn.colSpan}` : "",
                            btn.cls || "bg-white hover:bg-gray-50 text-gray-850 dark:bg-gray-800 dark:hover:bg-gray-750 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50",
                          ].join(" ");
                          return (
                            <button
                              key={i}
                              onClick={() => handleKeypadPress(btn.value)}
                              className={`flex h-11 items-center justify-center rounded-xl text-base font-bold shadow-sm transition active:scale-95 ${gridCls}`}
                              style={{
                                gridColumnEnd: btn.colSpan ? `span ${btn.colSpan}` : undefined
                              }}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 우측 풀이현황 사이드바 */}
        <section className="hidden w-80 shrink-0 border-l border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 md:flex md:flex-col overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              풀이 현황판
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-extrabold">
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-blue-600 border border-blue-600" />
                <span className="text-slate-550 dark:text-slate-400">입력</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-white border border-gray-300 dark:bg-gray-900 dark:border-gray-700" />
                <span className="text-slate-550 dark:text-slate-400">미입력</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-blue-50 border-2 border-blue-600 dark:bg-blue-950" />
                <span className="text-slate-550 dark:text-slate-400">현재</span>
              </div>
            </div>
          </div>

          {/* [답안표 입력] 버튼 추가 */}
          <button
            onClick={() => setShowAnswerSheet(true)}
            className="w-full mb-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all font-bold text-xs flex items-center justify-center gap-1.5 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-950/40"
          >
            답안표 입력
          </button>

          {/* 문항 번호 목록 (사이드바에는 항시 노출) */}
          <div className="flex-1 min-h-0 overflow-y-auto mb-4">
            <div className="grid grid-cols-4 gap-3">
              {questions.map((_, idx) => {
                const isCurrent = currentIdx === idx;
                const isFilled = isQuestionAnswered(idx);

                let buttonClass = "border ";
                if (isCurrent) {
                  buttonClass += "border-2 border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100 font-bold ring-2 ring-blue-500/20";
                } else if (isFilled) {
                  buttonClass += "border-blue-600 bg-blue-600 text-white font-semibold";
                } else {
                  buttonClass += "border-gray-200 bg-white hover:bg-gray-55 text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-400";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`flex aspect-square items-center justify-center rounded-xl text-sm transition-all duration-150 active:scale-95 ${buttonClass}`}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 신규 우측 슬라이드인 OMR 답안표 입력 모달 */}
          {showAnswerSheet && (
            <div className="fixed top-16 bottom-20 right-0 z-40 w-1/2 flex flex-col">
              {/* 뒷배경 블러 및 어둡게 처리 */}
              <div
                onClick={() => {
                  setShowAnswerSheet(false);
                  setActiveInputIdx(null);
                }}
                className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
              />

              {/* Drawer 컨테이너 (가로 50% 영역 전체 채움) */}
              <div className="relative h-full w-full bg-[#FDFCF7] dark:bg-[#1A1A16] shadow-2xl flex flex-col border-l border-gray-200 dark:border-amber-900/20 transform transition-transform duration-300 translate-x-0">
                {/* 헤더 영역 (타이틀 및 안내 문구) - OMR 웜톤 배경 */}
                <div className="px-6 py-5 border-b border-[#EAE6D2] dark:border-amber-900/30 bg-[#F9F8F0] dark:bg-[#1C1C18] flex items-start justify-between shrink-0">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white">답안표 입력</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      문항별 답안을 마킹하거나 입력한 후 하단의 [제출하기] 버튼을 눌러주세요.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAnswerSheet(false);
                      setActiveInputIdx(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* 바디 영역 (스크롤 리스트) - OMR 미색 배경 적용 */}
                <div className="flex-1 overflow-y-auto px-6 py-4 bg-[#FDFCF7] dark:bg-[#1A1A16]">
                  {(() => {
                    const half = Math.ceil(questions.length / 2);
                    const leftColQuestions = questions.slice(0, half);
                    const rightColQuestions = questions.slice(half);
                    const useTwoColumn = questions.length > 15;

                    // 개별 문항 행 렌더러 함수 (OMR 전용 컴팩트 카드 스타일)
                    const renderRow = (q: Question, idx: number) => {
                      const isFilled = isQuestionAnswered(idx);
                      const currentAns = answers.find((a) => a.questionIndex === idx);
                      const isActiveInput = activeInputIdx === idx;

                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between px-3 py-2 mb-2 rounded-xl bg-white dark:bg-gray-800 shadow-xs border transition-all duration-200 ${
                            isActiveInput 
                              ? "border-blue-500 dark:border-blue-500 bg-blue-50/20 dark:bg-blue-950/10 ring-1 ring-blue-500/20" 
                              : "border-[#EFECE0] dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-gray-600"
                          }`}
                        >
                          {/* 문항 번호 - 세련된 배지 스타일 */}
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-gray-700 text-[10px] font-black text-slate-500 dark:text-gray-400">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                          </div>

                          {/* 답안 입력 컨트롤 */}
                          <div className="flex-1 flex justify-center px-2 min-w-0">
                            {q.type === "choice" ? (
                              /* 선지형 (사인펜 마킹 스타일) */
                              <div className="flex items-center gap-1">
                                {Array.from({ length: q.choiceHtmls?.length || 5 }).map((_, cIdx) => {
                                  const choiceNum = cIdx + 1;
                                  const isSelected = currentAns?.selectedChoices?.includes(choiceNum) || false;

                                  return (
                                    <button
                                      key={choiceNum}
                                      onClick={() => {
                                        let selected: number[] = [];
                                        if (currentAns && Array.isArray(currentAns.selectedChoices) && currentAns.selectedChoices.includes(choiceNum)) {
                                          selected = currentAns.selectedChoices.filter((c) => c !== choiceNum);
                                        } else {
                                          selected = [...(currentAns?.selectedChoices || []), choiceNum];
                                        }
                                        handleSaveAnswer({
                                          questionIndex: idx,
                                          type: "choice",
                                          selectedChoices: selected,
                                        });
                                      }}
                                      className={`h-8 w-8 rounded-full border text-xs transition-all duration-150 hover:scale-105 active:scale-95 flex items-center justify-center ${
                                        isSelected
                                          ? "border-blue-600 bg-blue-50 text-blue-700 font-extrabold ring-2 ring-blue-500/20"
                                          : "border-slate-300 bg-slate-50/50 text-slate-600 dark:border-gray-600 dark:bg-gray-750 dark:text-gray-300 hover:bg-slate-100 hover:border-slate-400"
                                      }`}
                                    >
                                      {isSelected ? (
                                        <span className="flex items-center justify-center font-black">
                                          ●
                                        </span>
                                      ) : (
                                        ["①", "②", "③", "④", "⑤"][cIdx] || choiceNum
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              /* 입력형 (주관식 컴팩트 스타일) */
                              <div className="w-full max-w-[100px]">
                                <input
                                  type="text"
                                  readOnly
                                  value={currentAns?.inputValue || ""}
                                  onClick={() => setActiveInputIdx(isActiveInput ? null : idx)}
                                  placeholder="입력"
                                  className="w-full text-center rounded border border-gray-200 bg-white px-2 py-1 text-xs font-bold text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-955 dark:text-white cursor-pointer hover:bg-gray-55/50"
                                />
                              </div>
                            )}
                          </div>

                          {/* 입력 상태 표시 - 조약돌 배지화 */}
                          <div className="shrink-0 w-12 text-right flex justify-end">
                            {isFilled ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-150 dark:border-blue-900/50">
                                <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                                완료
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-400 dark:bg-gray-800 dark:text-gray-500 border border-slate-200/60 dark:border-gray-700/60">
                                <span className="h-1 w-1 rounded-full bg-slate-350 dark:bg-gray-600" />
                                대기
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    };

                    if (useTwoColumn) {
                      return (
                        <div className="grid grid-cols-2 gap-x-6 min-h-0">
                          {/* 좌측 단: 앞부분 절반 */}
                          <div className="pr-2 border-r border-[#EAE6D2] dark:border-amber-900/20">
                            {leftColQuestions.map((q, lIdx) => renderRow(q, lIdx))}
                          </div>
                          {/* 우측 단: 뒷부분 절반 */}
                          <div className="pl-2">
                            {rightColQuestions.map((q, rIdx) => renderRow(q, half + rIdx))}
                          </div>
                        </div>
                      );
                    }

                    // 15문항 이하인 경우: 기존 1단 레이아웃
                    return (
                      <div className="max-w-md mx-auto">
                        {questions.map((q, idx) => renderRow(q, idx))}
                      </div>
                    );
                  })()}
                </div>

                {/* 입력형 하단 고정 키패드 */}
                {activeInputIdx !== null && (
                  <div className="border-t border-[#EAE6D2] dark:border-amber-900/30 bg-[#F9F8F0]/90 dark:bg-[#1C1C18]/95 p-4 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                        선택 문항: {String(activeInputIdx + 1).padStart(2, "0")}번
                      </span>
                      <button
                        onClick={() => setActiveInputIdx(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { label: "1", value: "1" },
                        { label: "2", value: "2" },
                        { label: "3", value: "3" },
                        { label: "4", value: "4" },
                        { label: "5", value: "5" },

                        { label: "6", value: "6" },
                        { label: "7", value: "7" },
                        { label: "8", value: "8" },
                        { label: "9", value: "9" },
                        { label: "0", value: "0" },

                        { label: ".", value: "." },
                        { label: "-", value: "-" },
                        { label: "+", value: "+" },
                        { label: "clear", value: "clear", cls: "bg-white hover:bg-gray-55 text-gray-555 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-400 text-xs font-bold border border-gray-200/50 dark:border-gray-700/50" },
                        { label: "⌫", value: "delete", cls: "bg-white hover:bg-gray-55 text-gray-555 dark:bg-gray-800 dark:hover:bg-gray-750 dark:text-gray-450 text-xs font-bold border border-gray-200/50 dark:border-gray-700/50" },

                        { label: "✓ 확인", value: "confirm", colSpan: 5, cls: "bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 flex items-center justify-center rounded-lg shadow-sm" },
                      ].map((btn, i) => {
                        const gridCls = [
                          btn.colSpan ? `col-span-${btn.colSpan}` : "",
                          btn.cls || "bg-white hover:bg-gray-50 text-gray-850 dark:bg-gray-800 dark:hover:bg-gray-750 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50",
                        ].join(" ");
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleAnswerSheetKeypad(btn.value, activeInputIdx)}
                            className={`flex h-9 items-center justify-center rounded-lg text-xs font-bold shadow-sm transition active:scale-95 ${gridCls}`}
                            style={{
                              gridColumnEnd: btn.colSpan ? `span ${btn.colSpan}` : undefined
                            }}
                          >
                            {btn.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 현황 수치 요약 - 그라디언트 게이지 바 적용 */}
          <div className="mt-auto border-t border-[#EAE6D2] dark:border-amber-900/30 pt-6 dark:border-gray-800 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">풀이한 문제</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {
                  answers.filter((a) => {
                    if (a.type === "choice") {
                      return a.selectedChoices && a.selectedChoices.length > 0;
                    } else {
                      return a.inputValue && a.inputValue.trim() !== "";
                    }
                  }).length
                } / {questions.length}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-150 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-350"
                style={{
                  width: `${
                    (answers.filter((a) => {
                      if (a.type === "choice") {
                        return a.selectedChoices && a.selectedChoices.length > 0;
                      } else {
                        return a.inputValue && a.inputValue.trim() !== "";
                      }
                    }).length /
                      questions.length) *
                    100
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </section>
      </main>

      {/* 하단 네비게이션 고정 바 */}
      <footer className="flex h-20 items-center justify-between border-t border-gray-200 bg-white px-6 dark:border-gray-855 dark:bg-gray-900 z-10">
        <button
          onClick={() => currentIdx > 0 && setCurrentIdx(currentIdx - 1)}
          disabled={currentIdx === 0}
          className="flex items-center space-x-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-gray-850 dark:text-gray-305 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>이전</span>
        </button>

        <div className="text-sm font-bold text-gray-500 dark:text-gray-400">
          <span className="text-blue-600 dark:text-blue-400">{currentIdx + 1}</span> / {questions.length}
        </div>

        <div className="flex items-center space-x-3">
          {isPreview && (
            <button
              onClick={() => router.push(`/content/math-task-center/${taskId}/explanation?preview=true`)}
              className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/10 active:scale-95 transition"
            >
              <span>전체 해설 보기</span>
            </button>
          )}
          {currentIdx < questions.length - 1 && (
            <button
              onClick={() => setCurrentIdx(currentIdx + 1)}
              className="flex items-center space-x-1 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 active:scale-95 transition"
            >
              <span>다음</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>출력</span>
          </button>

          {!isPreview && (
            <button
              onClick={handleSubmitClick}
              className="flex items-center space-x-1 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/10 active:scale-95 transition"
            >
              <span>제출하기</span>
            </button>
          )}
        </div>
      </footer>

      {/* 모달 1. 나가기 확인 모달 */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
              과제 풀이를 중단하고 나가시겠습니까?
            </h3>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {isPreview
                ? "미리보기를 종료합니다. 작성한 모든 데이터는 저장되지 않습니다."
                : "지금까지 입력한 답안은 임시 저장되어 다음 접속 시 이어서 풀 수 있습니다."}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleExit}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-md shadow-red-500/10"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달 2. 미입력 안내 모달 */}
      {showUnenteredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
              아직 풀지 않은 문항이 존재합니다!
            </h3>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              전체 {questions.length}문항 중{" "}
              <span className="font-bold text-red-500 dark:text-red-400">
                {questions.length -
                  answers.filter((a) => {
                    if (a.type === "choice") {
                      return a.selectedChoices && a.selectedChoices.length > 0;
                    } else {
                      return a.inputValue && a.inputValue.trim() !== "";
                    }
                  }).length}
              </span>
              문항이 미입력 상태입니다. 이대로 제출하시겠습니까?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUnenteredModal(false)}
                className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                계속 풀기
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/10"
              >
                이대로 제출하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달 3. 제출 확인 모달 */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
              과제를 제출하시겠습니까?
            </h3>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              제출을 완료하면 채점이 진행되며, 더 이상 답안을 수정할 수 없습니다.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/10"
              >
                제출하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달 4. 제출 로딩 모달 */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="flex flex-col items-center space-y-6 text-white text-center px-4 max-w-sm">
            <Loader2 className="h-14 w-14 animate-spin text-blue-500" />
            <div className="space-y-2">
              <h3 className="text-xl font-bold">답안을 제출하고 있습니다...</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                답안 기록을 검증하고 즉석 채점을 완료하는 중입니다. 중복 제출을 방지하기 위해 잠시만 대기해 주세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 모달 5. 오류 신고 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/40">
              <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
              글립 오류 신고
            </h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              현재 문항(문제 {currentIdx + 1}) 기준의 오류 내용을 작성하여 보내주세요.
            </p>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="오류 내용을 상세히 작성해 주세요."
              className="w-full h-32 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white mb-6 resize-none"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportText("");
                }}
                className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (!reportText.trim()) return;
                  setIsReporting(true);
                  // 1초 임의 대기 후 토스트 알림
                  await new Promise((resolve) => setTimeout(resolve, 800));
                  setIsReporting(false);
                  setShowReportModal(false);
                  setReportText("");
                  toast({
                    title: "오류 신고 접수 완료",
                    description: "소중한 의견 감사드립니다. 빠르게 확인하여 수정하겠습니다.",
                  });
                }}
                disabled={!reportText.trim() || isReporting}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 disabled:opacity-50"
              >
                {isReporting ? "보내는 중..." : "신고하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모달 6. 과제 출력 모달 */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {/* 모달 헤더 영역 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-150 dark:border-gray-800 shrink-0 bg-gray-50 dark:bg-gray-950">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">과제 출력</h3>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-xl transition dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 과제 출력 미리보기 영역 */}
            <div className="flex-1 overflow-hidden min-h-0 bg-slate-100 dark:bg-slate-955 flex justify-center">
              {adminTask ? (
                <div className="w-full h-full">
                  <PrintPreviewPanel
                    task={adminTask}
                    isBlocked={false}
                    blockMessage=""
                    printType="student"
                    previewStudentId={currentStudentId}
                    activeStudents={currentStudentList}
                    color="#002775"
                    split="1"
                    pageMargin={10}
                    problemGap={16}
                    fontSize={12}
                    showClass={true}
                    showName={true}
                    showDate={false}
                    showUnit={true}
                    showLogo={true}
                    answerOnlyMode={false}
                    isStudentView={true}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  과제 데이터를 불러올 수 없습니다.
                </div>
              )}
            </div>

            {/* 하단 버튼 영역 */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-150 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 shrink-0 gap-3">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-850 dark:text-gray-305 dark:hover:bg-gray-800 transition"
              >
                취소
              </button>
              <button
                onClick={handlePrint}
                disabled={!adminTask || adminTask.totalProblems === 0}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 disabled:opacity-50 transition"
              >
                인쇄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
