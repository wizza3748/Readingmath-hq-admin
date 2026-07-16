"use client";

import React, { use, useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  X,
  Flag,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Award,
  TrendingUp,
  BookOpen,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";

import { getQuestionsByTaskId, matchStoredIdWithAdminId } from "@/lib/task-solve-mock";
import { getStoredTasks, Task } from "@/utils/taskStorage";
import { getTaskResult, saveTaskResult, TaskResult, GradingDetail } from "@/utils/taskResultStorage";
import { INITIAL_TASKS, SCIENCE_CURRICULA } from "@/lib/task-center-mock";
import { getStoredStudents } from "@/lib/student-mock";
import { parseAndRenderMath } from "@/components/admin/task-center/print/print-preview-panel";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{ preview?: string }>;
}

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
        className="text-base leading-relaxed text-gray-800 dark:text-gray-200 min-w-0"
      />
    </>
  );
}

export default function ScienceResultPage(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const searchParams = use(props.searchParams);

  const taskId = params.taskId;
  const isPreview = searchParams.preview === "true";

  const [task, setTask] = useState<Task | null>(null);
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // 오류 신고 모달 상태
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportText, setReportText] = useState<string>("");
  const [isReporting, setIsReporting] = useState<boolean>(false);

  // 출력 미리보기 모달 상태
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [pages, setPages] = useState<any[]>([]);
  const [triggerMeasure, setTriggerMeasure] = useState<number>(0);
  const [dbStudents, setDbStudents] = useState<any[]>([]);

  useEffect(() => {
    setDbStudents(getStoredStudents());
  }, []);

  const student = dbStudents.find((s) => s.id === "student-1") || {
    id: "student-1",
    name: "김민준",
    className: "1반",
  };

  const gradedQuestions = useMemo(() => {
    if (questions.length === 0) return [];
    
    return questions.map((q, idx) => {
      const detail = taskResult?.gradingDetails?.find((d) => d.questionIndex === idx);
      const resultStatus = detail?.status || "unentered";

      let displayAnswer = "-";
      let correctChoiceIndex = -1;
      
      if (q.type === "choice") {
        if (q.answerKey && q.answerKey.length > 0) {
          correctChoiceIndex = q.answerKey[0] - 1;
          displayAnswer = ['①','②','③','④','⑤'][correctChoiceIndex] || "-";
        }
      } else {
        displayAnswer = q.correctAnswer || "-";
      }

      let studentAnswer = "-";
      let studentChoiceIndex = -1;

      if (detail && detail.submittedAnswer !== undefined) {
        const sa = detail.submittedAnswer;
        if (Array.isArray(sa)) {
          if (sa.length > 0) {
            studentChoiceIndex = sa[0];
            studentAnswer = ['①','②','③','④','⑤'][studentChoiceIndex] || "-";
          }
        } else {
          studentAnswer = String(sa);
          if (q.choiceHtmls && q.choiceHtmls.length > 0) {
            const chIdx = q.choiceHtmls.indexOf(studentAnswer);
            if (chIdx !== -1) {
              studentChoiceIndex = chIdx;
              studentAnswer = ['①','②','③','④','⑤'][studentChoiceIndex];
            } else {
              const symbolIdx = ['①','②','③','④','⑤'].indexOf(studentAnswer);
              if (symbolIdx !== -1) {
                studentChoiceIndex = symbolIdx;
              }
            }
          }
        }
      }

      return {
        ...q,
        problemNo: idx + 1,
        result: resultStatus,
        studentAnswer,
        studentChoiceIndex,
        correctChoiceIndex,
        displayAnswer,
      };
    });
  }, [questions, taskResult]);

  useEffect(() => {
    const handleImgLoad = () => {
      setTriggerMeasure(t => t + 1);
    };

    const container = document.getElementById('modal-measure-container');
    if (container) {
      const imgs = container.querySelectorAll('img');
      imgs.forEach(img => {
        if ((img as HTMLImageElement).complete) {
          setTriggerMeasure(t => t + 1);
        } else {
          img.addEventListener('load', handleImgLoad);
        }
      });
    }

    return () => {
      if (container) {
        const imgs = container.querySelectorAll('img');
        imgs.forEach(img => {
          img.removeEventListener('load', handleImgLoad);
        });
      }
    };
  }, [gradedQuestions, isPrintModalOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTriggerMeasure(t => t + 1);
    }, 150);
    return () => clearTimeout(timer);
  }, [gradedQuestions, showAnswer, isPrintModalOpen]);

  useEffect(() => {
    if (gradedQuestions.length === 0 || !isPrintModalOpen) {
      setPages([]);
      return;
    }

    const mmToPx = 3.779527559;
    const pageHeightPx = 297 * mmToPx;
    const marginPx = 10 * mmToPx;
    const gapPx = 14 * mmToPx;
    
    const headerEl = document.getElementById('modal-measure-header');
    const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 170;

    const shortHeaderEl = document.getElementById('modal-measure-header-short');
    const shortHeaderHeight = shortHeaderEl ? shortHeaderEl.getBoundingClientRect().height : 45;

    const allPages: any[] = [];
    let currentPageData: { left: any[]; right: any[] } = { left: [], right: [] };
    let currentColumn: 'left' | 'right' = 'left';
    let currentColumnHeight = 0;

    const moveToNextSlot = () => {
      if (currentColumn === 'left') {
        currentColumn = 'right';
        currentColumnHeight = 0;
      } else {
        allPages.push(currentPageData);
        currentPageData = { left: [], right: [] };
        currentColumn = 'left';
        currentColumnHeight = 0;
      }
    };

    for (let i = 0; i < gradedQuestions.length; i++) {
      const q = gradedQuestions[i];
      
      const elBody = document.getElementById(`modal-measure-q-body-${q.id}`);
      const bodyHeight = elBody ? elBody.getBoundingClientRect().height : 140;

      const elExp = document.getElementById(`modal-measure-q-exp-${q.id}`);
      const expHeight = (showAnswer && elExp) ? elExp.getBoundingClientRect().height : 0;

      while (true) {
        const isPageOne = allPages.length === 0;
        const currentHeaderHeight = isPageOne ? headerHeight : shortHeaderHeight;
        const currentAvailableHeight = pageHeightPx - (marginPx * 2) - currentHeaderHeight - 45;

        const heightWithGap = bodyHeight + (currentPageData[currentColumn].length > 0 ? gapPx : 0);
        const willExceedHeight = currentColumnHeight + heightWithGap > currentAvailableHeight;

        if (currentPageData[currentColumn].length === 0) {
          currentPageData[currentColumn].push({ type: 'question', q });
          currentColumnHeight += heightWithGap;
          break;
        }

        if (willExceedHeight) {
          moveToNextSlot();
          continue;
        }

        currentPageData[currentColumn].push({ type: 'question', q });
        currentColumnHeight += heightWithGap;
        break;
      }

      if (showAnswer) {
        while (true) {
          const isPageOne = allPages.length === 0;
          const currentHeaderHeight = isPageOne ? headerHeight : shortHeaderHeight;
          const currentAvailableHeight = pageHeightPx - (marginPx * 2) - currentHeaderHeight - 45;

          const heightWithGap = expHeight + (currentPageData[currentColumn].length > 0 ? gapPx : 0);
          const willExceedHeight = currentColumnHeight + heightWithGap > currentAvailableHeight;

          if (currentPageData[currentColumn].length === 0) {
            currentPageData[currentColumn].push({ type: 'explanation', q });
            currentColumnHeight += heightWithGap;
            break;
          }

          if (willExceedHeight) {
            moveToNextSlot();
            continue;
          }

          currentPageData[currentColumn].push({ type: 'explanation', q });
          currentColumnHeight += heightWithGap;
          break;
        }
      }
    }

    if (currentPageData.left.length > 0 || currentPageData.right.length > 0) {
      allPages.push(currentPageData);
    }

    setPages(allPages);
  }, [triggerMeasure, gradedQuestions, showAnswer, isPrintModalOpen]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 200);
  };

  const renderItem = (item: any) => {
    const q = item.q;
    if (item.type === 'question') {
      const isImageOnlyPassage = q.passage && q.passage.includes("<img") && q.passage.replace(/<[^>]*>/g, "").replace(/\s/g, "").length === 0;

      return (
        <div key={`item-${q.id}`} className="relative group flex flex-col gap-2.5 text-slate-800 text-left">
          <div className="relative">
            <div className="flex items-start gap-1 font-bold text-sm leading-snug">
              <div className="relative shrink-0 select-none mr-1 w-6 h-6 flex items-center justify-center">
                {q.result === "correct" && (
                  <svg className="absolute w-12 h-10 -top-2 -left-2.5 pointer-events-none z-20" viewBox="0 0 48 40">
                    <ellipse cx="24" cy="20" rx="20" ry="16" fill="none" stroke="#ef4444" strokeWidth="3" strokeOpacity="0.8" />
                  </svg>
                )}
                {q.result === "incorrect" && (
                  <svg className="absolute w-20 h-14 -top-3.5 -left-3 pointer-events-none z-20" viewBox="0 0 80 56">
                    <line x1="6" y1="48" x2="74" y2="6" stroke="#ef4444" strokeWidth="3.5" strokeOpacity="0.8" strokeLinecap="round" />
                  </svg>
                )}
                <span className="text-slate-900 font-bold z-10">{q.problemNo}.</span>
              </div>

              <span 
                dangerouslySetInnerHTML={{ __html: parseAndRenderMath(q.stem) }} 
                className="inline max-w-full min-w-0 [&_p]:inline [&_div]:inline text-[13.5px] text-slate-955 font-semibold" 
              />
            </div>
          </div>

          {q.passage && (
            <div className={cn(
              "text-[12px] leading-relaxed max-w-full overflow-hidden my-1",
              isImageOnlyPassage ? "flex justify-center my-1" : "border border-slate-200 p-3 rounded bg-slate-50/30"
            )}>
              <div dangerouslySetInnerHTML={{ __html: parseAndRenderMath(q.passage.replace(/\n/g, '<br/>')) }} />
            </div>
          )}

          {q.image && (
            <div className="my-1.5 flex justify-center max-w-full overflow-hidden">
              <img src={q.image} alt="문제 이미지" className="max-w-[260px] h-auto max-h-[140px] object-contain border rounded p-0.5 bg-white" />
            </div>
          )}

          {q.choiceHtmls && q.choiceHtmls.length > 0 && (
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-1.5 pl-7 text-[12px]">
              {q.choiceHtmls.map((choice: string, i: number) => {
                const isSelected = q.studentChoiceIndex === i;
                const isCorrect = q.correctChoiceIndex === i;

                let badgeStyle = "bg-white border-slate-200 text-slate-500";
                let textStyle = "text-slate-700";

                if (isSelected) {
                  if (q.result === "correct") {
                    badgeStyle = "bg-emerald-500 border-emerald-500 text-white font-bold";
                    textStyle = "text-emerald-700 font-bold";
                  } else {
                    badgeStyle = "bg-rose-500 border-rose-500 text-white font-bold";
                    textStyle = "text-rose-700 font-bold";
                  }
                } else if (showAnswer && isCorrect) {
                  badgeStyle = "bg-emerald-500 border-emerald-500 text-white font-bold";
                  textStyle = "text-emerald-700 font-bold";
                }

                return (
                  <div key={i} className="flex items-center gap-1.5 min-w-0">
                    <span className={cn("w-4.5 h-4.5 rounded-full flex items-center justify-center border text-[10px] shrink-0", badgeStyle)}>
                      {['①','②','③','④','⑤'][i]}
                    </span>
                    <span 
                      dangerouslySetInnerHTML={{ __html: parseAndRenderMath(choice) }}
                      className={cn("truncate", textStyle)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-1 pl-7 flex items-center gap-2 text-[11px] text-slate-500">
            <span>제출 답안:</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded font-bold border",
              q.result === "correct" 
                ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                : q.result === "incorrect"
                ? "bg-rose-50 border-rose-100 text-rose-700"
                : "bg-slate-100 border-slate-200 text-slate-500"
            )}>
              {q.studentAnswer}
            </span>
          </div>
        </div>
      );
    } else {
      return (
        <div key={`exp-${q.id}`} className="border border-blue-100 bg-blue-50/40 rounded-xl p-3.5 flex flex-col gap-1.5 text-[11px] leading-relaxed relative overflow-hidden shadow-sm text-left">
          <div className="text-[11.5px] font-bold text-blue-700 flex items-center gap-1">
            <span className="inline-block w-1.5 h-3 bg-blue-500 rounded-[2px]" />
            {q.problemNo}번 정답·해설
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-semibold text-slate-500">정답:</span>
            <span className="font-bold text-blue-700" dangerouslySetInnerHTML={{ __html: parseAndRenderMath(q.displayAnswer) }} />
          </div>
          {q.explanationHtml && (
            <div className="flex flex-col gap-0.5 text-slate-600 mt-1 bg-white border border-blue-50/50 p-2.5 rounded-lg">
              <div 
                dangerouslySetInnerHTML={{ __html: parseAndRenderMath(q.explanationHtml) }}
                className="text-xs [&_img]:max-w-full [&_img]:h-auto [&_img]:object-contain"
              />
            </div>
          )}
        </div>
      );
    }
  };


  useEffect(() => {
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

    // 데이터 로드
    const qList = getQuestionsByTaskId(taskId);
    setQuestions(qList);

    const taskList = getStoredTasks();
    let currentTask = taskList.find((t) => t.id === taskId);
    if (currentTask) {
      if (!currentTask.course) {
        const adminTask = INITIAL_TASKS.find((t) => matchStoredIdWithAdminId(t.id, taskId) || matchStoredIdWithAdminId(taskId, t.id));
        if (adminTask) {
          currentTask.course = adminTask.course;
        }
      }
    } else if (isPreview) {
      const adminTask = INITIAL_TASKS.find((t) => t.id === taskId);
      if (adminTask) {
        currentTask = {
          id: adminTask.id,
          subject: adminTask.subject,
          title: adminTask.name,
          status: "submitted",
          assignedAt: adminTask.createdAt,
          totalProblems: adminTask.totalProblems,
          course: adminTask.course,
        };
      }
    }
    setTask(currentTask || null);

    let result = getTaskResult(taskId);
    if (!result && currentTask && currentTask.status === "submitted") {
      const correctCount = currentTask.correctProblems ?? currentTask.totalProblems;
      const gradingDetails: GradingDetail[] = qList.map((q, idx) => {
        const isCorrect = idx < correctCount;
        const status = isCorrect ? "correct" : "incorrect";
        return {
          questionIndex: idx,
          status,
          submittedAnswer: isCorrect
            ? (q.type === "choice" ? q.answerKey : q.correctAnswer)
            : (q.type === "choice" ? [(q.answerKey ? q.answerKey[0] : 1) % (q.choiceCount || 5) + 1] : "오답"),
          correctAnswer: q.type === "choice" ? q.answerKey : q.correctAnswer,
        };
      });

      result = {
        taskId,
        score: currentTask.score ?? Math.round((correctCount / currentTask.totalProblems) * 100),
        correctCount,
        incorrectCount: currentTask.totalProblems - correctCount,
        unenteredCount: 0,
        submittedAt: currentTask.submittedAt || new Date().toISOString(),
        gradingDetails,
      };
      saveTaskResult(taskId, result);
    }
    setTaskResult(result);
  }, [taskId, isPreview]);

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

  const handleExit = () => {
    router.push("/content/science-task-center");
  };

  const handleReportSubmit = () => {
    if (!reportText.trim()) return;
    setIsReporting(true);
    setTimeout(() => {
      setIsReporting(false);
      setShowReportModal(false);
      setReportText("");
      alert("오류 신고가 접수되었습니다.");
    }, 1000);
  };

  const handleVerifyExamPrep = () => {
    const typeIds = Array.from(new Set(questions.map((q) => {
      if (!q.typeName) return null;
      let foundTypeId: string | null = null;
      for (const course of SCIENCE_CURRICULA) {
        const found = course.types.find(t => t.typeName === q.typeName);
        if (found) {
          foundTypeId = found.id;
          break;
        }
      }
      if (!foundTypeId) return null;
      const diff = q.difficulty === "intermediate" ? "skill" : q.difficulty || "basic";
      return `${foundTypeId}-${diff}`;
    }).filter(Boolean)));

    const typeIdsParam = typeIds.join(",");
    router.push(`/content/science-exam-prep?fromTaskResult=true&highlightTypeIds=${typeIdsParam}&gradeSemester=${encodeURIComponent(task?.course || "")}&sourceTaskId=${taskId}&source=task-center`);
  };

  // 날짜 포맷 함수 (YYYY.MM.DD HH:mm)
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
  };

  // 발문 텍스트 정제 함수
  const getCleanStem = (stem?: string) => {
    if (!stem) return "";
    let clean = stem.replace(/<[^>]*>/g, ""); // HTML 제거
    clean = clean.replace(/\$\$([\s\S]*?)\$\$/g, "$1"); // LaTeX $$ 제거
    clean = clean.replace(/\$([\s\S]*?)\$/g, "$1"); // LaTeX $ 제거
    clean = clean.replace(/\\\(|\\\)/g, ""); // LaTeX \( \) 제거
    clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2"); // 분수 표기 정리
    clean = clean.replace(/\\text\{([^}]+)\}/g, "$1"); // \text 제거
    clean = clean.replace(/\\([a-zA-Z]+)/g, ""); // 기타 LaTeX 역슬래시 제거
    clean = clean.replace(/[{}]/g, ""); // 중괄호 제거
    return clean.trim();
  };

  if (!task || !taskResult) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 dark:text-emerald-450 mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">결과 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 pb-24">
      {/* GNB / 상단 헤더 */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 z-40">
        <div className="flex items-center space-x-2.5 text-sm font-semibold">
          {/* 과목 뱃지 */}
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
            과학
          </span>

          {/* 학기 뱃지 */}
          {task.course && (
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 border border-slate-200/60 dark:bg-slate-850 dark:text-slate-350 dark:border-slate-800">
              {task.course}
            </span>
          )}

          {/* 세로 구분선 */}
          <span className="h-3 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* 단원 표시 */}
          <div className="text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
            <span className="text-slate-800 dark:text-slate-100 font-bold">
              {task.unitDisplayName?.split(">")[0]?.trim() || ""}
            </span>
            {task.unitDisplayName?.includes(">") && (
              <>
                <span className="text-slate-400 dark:text-slate-600 font-normal">&gt;</span>
                <span className="text-slate-500 dark:text-slate-450 font-medium">
                  {task.unitDisplayName.substring(task.unitDisplayName.indexOf(">") + 1).trim()}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* 모드 전환 토글 */}
          <button
            onClick={toggleDarkMode}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 flex items-center p-1 cursor-pointer select-none focus:outline-none shadow-md ${
              isDarkMode ? 'bg-slate-800 border border-white/[0.08]' : 'bg-slate-300 border border-slate-400'
            }`}
            title="모드 전환"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 transform shadow-sm ${
                isDarkMode ? 'translate-x-8 bg-slate-700' : 'translate-x-0 bg-white'
              }`}
            >
              {isDarkMode ? (
                <span className="text-[12px] select-none">🌙</span>
              ) : (
                <span className="text-[12px] select-none">☀️</span>
              )}
            </div>
          </button>
          {/* 오류 신고 */}
          <button
            onClick={() => setShowReportModal(true)}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="오류 신고"
          >
            <Flag className="h-5 w-5" />
          </button>
          {/* 닫기 */}
          <button
            onClick={handleExit}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* 과제명 행 */}
      <div className="flex items-center space-x-3 px-6 py-4 bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={handleExit}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title="뒤로가기"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {task.title}
        </h1>
      </div>

      {/* 결과 메인 레이아웃 */}
      <main className="flex-1 w-full px-6 sm:px-12 py-8 space-y-8 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        {/* <과제 결과 요약 영역> */}
        <section className="w-full pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* 점수 크게 표시 */}
            <div className="flex items-baseline gap-4">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">내 점수</span>
              <span className="text-5xl font-black text-emerald-600 dark:text-emerald-450 font-mono tracking-tight">
                {taskResult.score}
                <span className="text-xl font-bold text-slate-800 dark:text-slate-200 ml-1">점</span>
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-black dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
                제출완료
              </span>
            </div>

            {/* 보조 정보 가로 배치 */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-650 dark:text-slate-350">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400">정답</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-450">{taskResult.correctCount} / {task.totalProblems}</span>
              </div>
              <span className="h-3.5 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400">오답</span>
                <span className="font-extrabold text-rose-600 dark:text-rose-455">{taskResult.incorrectCount}문항</span>
              </div>
              <span className="h-3.5 w-px bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400">미입력</span>
                <span className="font-extrabold text-slate-500 dark:text-slate-400">{taskResult.unenteredCount}문항</span>
              </div>
              <span className="h-3.5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:inline" />
              <div className="text-xs text-slate-400 dark:text-slate-500">
                제출일시: {formatDate(taskResult.submittedAt)}
              </div>
            </div>
          </div>
        </section>

        {/* <문항별 결과 영역> */}
        <section className="w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-455 font-bold uppercase tracking-wider">
                  <th className="py-3.5 w-24">문항</th>
                  <th className="py-3.5 w-60 pr-4">유형명</th>
                  <th className="py-3.5 px-4">발문</th>
                  <th className="py-3.5 w-28 text-center">난이도</th>
                  <th className="py-3.5 w-28 text-center">채점 결과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-sm">
                {questions.map((q, idx) => {
                  const detail = taskResult.gradingDetails.find((d) => d.questionIndex === idx);
                  const status = detail?.status || "unentered";
                  const cleanStem = getCleanStem(q.stem);

                  return (
                    <tr key={q.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-850/10 transition-colors">
                      <td className="py-4 font-bold text-slate-800 dark:text-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-4 pr-4 text-slate-650 dark:text-slate-350 whitespace-nowrap">
                        {q.typeName || "-"}
                      </td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-medium whitespace-pre-line leading-relaxed">
                        {cleanStem}
                      </td>
                      <td className="py-4 text-center">
                        {q.difficulty ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-extrabold border ${
                            q.difficulty === "basic"
                              ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50"
                              : q.difficulty === "intermediate"
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-sky-900/50"
                              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-sky-900/50"
                          }`}>
                            {q.difficulty === "basic" ? "기본" : q.difficulty === "intermediate" ? "실력" : "심화"}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-black border ${
                          status === "correct"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/60"
                            : status === "incorrect"
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/60"
                            : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        }`}>
                          {status === "correct" ? "정답" : status === "incorrect" ? "오답" : "미입력"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* <하단 버튼 영역> (고정 바) */}
      <footer className="fixed bottom-0 left-0 right-0 h-20 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md z-45 flex items-center justify-end px-8 shadow-inner">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExit}
            className="px-6 py-3 border border-slate-350 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350 text-sm font-extrabold rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            과제 센터
          </button>
          <button
            onClick={handleVerifyExamPrep}
            className="px-6 py-3 border border-purple-350 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-sm font-extrabold rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            시험 대비 반영 확인
          </button>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>출력</span>
          </button>
          <button
            onClick={() => router.push(`/content/science-task-center/${taskId}/explanation${isPreview ? "?preview=true" : ""}`)}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5 group cursor-pointer"
          >
            <span>해설 보기</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </footer>

      {/* 오류 신고 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowReportModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-[420px] w-full z-10 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-black text-slate-850 dark:text-white mb-2">오류 신고하기</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              문제 또는 해설에 오류가 있는 경우 상세한 사유를 적어 보내주시면 신속히 검토하여 조치하겠습니다.
            </p>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="내용을 입력해 주세요"
              rows={4}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-855 bg-white dark:bg-slate-950 p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-5"
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="py-3 border border-slate-200 dark:border-slate-855 rounded-xl text-sm font-extrabold hover:bg-slate-50 dark:hover:bg-slate-855 text-slate-650 dark:text-slate-350"
              >
                취소
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={isReporting || !reportText.trim()}
                className="py-3 bg-emerald-600 text-white rounded-xl text-sm font-extrabold hover:bg-emerald-750 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isReporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "신고 보내기"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 과제 결과 모달 (Student Task Detail Result Modal) ── */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">과제 결과</h2>
              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* 과제 결과 미리보기 영역 */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-slate-100 dark:bg-slate-955 relative flex justify-center custom-scrollbar" style={{"--fit-scale": "0.85"} as any}>
              <div className="flex flex-col gap-6 shadow-md" style={{ transform: "scale(var(--fit-scale))", transformOrigin: "top center" }}>
                {pages.map((page, pIndex) => (
                  <div
                    key={pIndex}
                    className="flex flex-col bg-white relative shrink-0 border border-slate-300"
                    style={{
                      width: '210mm',
                      height: '297mm',
                      minHeight: '297mm',
                      maxHeight: '297mm',
                      paddingTop: '10mm',
                      paddingLeft: '10mm',
                      paddingRight: '10mm',
                      paddingBottom: '20mm',
                      boxSizing: 'border-box'
                    }}
                  >
                    {pIndex === 0 ? (
                      <div className="mb-4 shrink-0" id="modal-measure-header">
                        <h2 className="text-[13pt] font-bold text-slate-800 truncate mb-2 text-left" style={{ color: "#002775" }}>{task.title}</h2>
                        <div className="flex justify-between items-end pb-2 border-b border-slate-200">
                          <div className="flex flex-col flex-1 min-w-0 pr-4 text-left">
                            <div className="text-[11pt] text-gray-700 flex flex-wrap gap-x-6 gap-y-1 items-center max-w-full font-medium">
                              <span className="truncate max-w-[200px]">반: {student.className || "__________"}</span>
                              <span className="shrink-0">이름: {student.name}</span>
                              <span className="shrink-0">날짜: {new Date().toLocaleDateString('ko-KR')}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-end shrink-0 select-none pointer-events-none mb-[-4px] mt-[-28px]">
                            <div className="text-red-500 font-extrabold text-[24pt] leading-none mb-2 rotate-[-4deg] tracking-wide font-sans">
                              {taskResult.score}점
                            </div>
                            <div className="text-[#002775] font-bold text-[11pt] leading-none pr-1">
                              리딩과학
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3 shrink-0" id="modal-measure-header-short">
                        <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                          <h2 className="text-[10pt] font-bold text-slate-800 truncate text-left">{task.title}</h2>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-1 relative min-w-0 text-slate-800" style={{ gap: '8mm' }}>
                      <div className="absolute top-0 bottom-0 left-1/2 border-l border-slate-300 z-20" style={{ transform: "translateX(-50%)" }} />
                      
                      <div className="flex-1 flex flex-col z-10 min-w-0 flex-shrink-0" style={{ gap: '14mm', width: 'calc(50% - 4mm)', maxWidth: 'calc(50% - 4mm)' }}>
                        {(page.left || []).map((item: any, idx: number) => (
                          <div key={`l-${idx}`}>
                            {renderItem(item)}
                          </div>
                        ))}
                      </div>

                      <div className="flex-1 flex flex-col z-10 min-w-0 flex-shrink-0" style={{ gap: '14mm', width: 'calc(50% - 4mm)', maxWidth: 'calc(50% - 4mm)' }}>
                        {(page.right || []).map((item: any, idx: number) => (
                          <div key={`r-${idx}`}>
                            {renderItem(item)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div 
                      className="absolute flex justify-between items-center text-[10pt] text-gray-400 border-t border-gray-100 pt-2 shrink-0"
                      style={{
                        bottom: '10mm',
                        left: '10mm',
                        right: '10mm',
                        height: '25px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <span>리딩과학</span>
                      <span>{pIndex + 1} / {pages.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 모달 푸터 */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                type="button"
                onClick={() => setShowAnswer(!showAnswer)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 shadow-sm mr-auto",
                  showAnswer
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                )}
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                    showAnswer ? "bg-white border-white text-emerald-600" : "border-slate-400 bg-white"
                  )}
                >
                  {showAnswer && (
                    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                정답·해설 보기
              </button>

              <button 
                onClick={() => setIsPrintModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                취소
              </button>
              <button 
                onClick={handlePrint}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all"
              >
                인쇄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 측정 및 페이징 계산용 숨김 컨테이너 ── */}
      <div className="absolute top-0 left-[-9999px] invisible pointer-events-none" aria-hidden="true" id="modal-measure-container">
        <div style={{ width: '210mm', padding: '10mm', boxSizing: 'border-box' }}>
          {gradedQuestions.map((q) => (
            <div key={`measure-body-${q.id}`} id={`modal-measure-q-body-${q.id}`} className="flex flex-col gap-2 pb-4" style={{ width: 'calc((100% - 8mm) / 2)' }}>
              {renderItem({ type: 'question', q })}
            </div>
          ))}
          {gradedQuestions.map((q) => (
            <div key={`measure-exp-${q.id}`} id={`modal-measure-q-exp-${q.id}`} className="flex flex-col gap-2 pb-4" style={{ width: 'calc((100% - 8mm) / 2)' }}>
              {renderItem({ type: 'explanation', q })}
            </div>
          ))}
        </div>
      </div>

      {/* 인쇄 전용 영역 Portal */}
      {isPrinting && typeof window !== "undefined" && createPortal(
        <div className="print-only-root hidden print:block absolute top-0 left-0 m-0 p-0 bg-white z-[9999]">
          <style>{`
            @media print {
              @page { size: A4 portrait; margin: 0; }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              body > :not(.print-only-root) {
                display: none !important;
              }
            }
          `}</style>
          
          {pages.map((page, pIndex) => (
            <div
              key={`print-${pIndex}`}
              className="flex flex-col bg-white relative shrink-0"
              style={{
                width: '210mm',
                height: '297mm',
                minHeight: '297mm',
                maxHeight: '297mm',
                paddingTop: '10mm',
                paddingLeft: '10mm',
                paddingRight: '10mm',
                paddingBottom: '20mm',
                boxSizing: 'border-box',
                pageBreakAfter: pIndex === pages.length - 1 ? 'auto' : 'always',
                pageBreakInside: 'avoid',
                flexShrink: 0
              }}
            >
              {pIndex === 0 ? (
                <div className="mb-4 shrink-0">
                  <h2 className="text-[13pt] font-bold text-slate-800 truncate mb-2 text-left" style={{ color: "#002775" }}>{task.title}</h2>
                  <div className="flex justify-between items-end pb-2 border-b border-slate-200">
                    <div className="flex flex-col flex-1 min-w-0 pr-4 text-left">
                      <div className="text-[11pt] text-gray-700 flex flex-wrap gap-x-6 gap-y-1 items-center max-w-full font-medium">
                        <span className="truncate max-w-[200px]">반: {student.className || "__________"}</span>
                        <span className="shrink-0">이름: {student.name}</span>
                        <span className="shrink-0">날짜: {new Date().toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-end shrink-0 select-none pointer-events-none mb-[-4px] mt-[-28px]">
                      <div className="text-red-500 font-extrabold text-[24pt] leading-none mb-2 rotate-[-4deg] tracking-wide font-sans">
                        {taskResult.score}점
                      </div>
                      <div className="text-[#002775] font-bold text-[11pt] leading-none pr-1">
                        리딩과학
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-3 shrink-0">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                    <h2 className="text-[10pt] font-bold text-slate-800 truncate text-left">{task.title}</h2>
                  </div>
                </div>
              )}

              <div className="flex flex-1 relative min-w-0 text-slate-800" style={{ gap: '8mm' }}>
                <div className="absolute top-0 bottom-0 left-1/2 border-l border-slate-300 z-20" style={{ transform: "translateX(-50%)" }} />
                
                <div className="flex-1 flex flex-col z-10 min-w-0 flex-shrink-0" style={{ gap: '14mm', width: 'calc(50% - 4mm)', maxWidth: 'calc(50% - 4mm)' }}>
                  {(page.left || []).map((item: any, idx: number) => (
                    <div key={`l-${idx}`}>
                      {renderItem(item)}
                    </div>
                  ))}
                </div>

                <div className="flex-1 flex flex-col z-10 min-w-0 flex-shrink-0" style={{ gap: '14mm', width: 'calc(50% - 4mm)', maxWidth: 'calc(50% - 4mm)' }}>
                  {(page.right || []).map((item: any, idx: number) => (
                    <div key={`r-${idx}`}>
                      {renderItem(item)}
                    </div>
                  ))}
                </div>
              </div>

              <div 
                className="absolute flex justify-between items-center text-[10pt] text-gray-400 border-t border-gray-100 pt-2 shrink-0"
                style={{
                  bottom: '10mm',
                  left: '10mm',
                  right: '10mm',
                  height: '25px',
                  boxSizing: 'border-box'
                }}
              >
                <span>리딩과학</span>
                <span>{pIndex + 1} / {pages.length}</span>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
