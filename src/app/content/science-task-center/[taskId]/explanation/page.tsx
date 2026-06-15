"use client";

import React, { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  X,
  Flag,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  PlayCircle,
} from "lucide-react";

import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";

import { getQuestionsByTaskId, Question } from "@/lib/task-solve-mock";
import { getStoredTasks, Task } from "@/utils/taskStorage";
import { getTaskResult, saveTaskResult, TaskResult, GradingDetail } from "@/utils/taskResultStorage";
import { INITIAL_TASKS } from "@/lib/task-center-mock";

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

export default function ScienceExplanationPage(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const searchParams = use(props.searchParams);

  const taskId = params.taskId;
  const isPreview = searchParams.preview === "true";

  const [task, setTask] = useState<Task | null>(null);
  const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 문항 전환 시 좌측 영역 스크롤 최상단 이동
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentIdx]);

  // 오류 신고 모달 상태
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportText, setReportText] = useState<string>("");
  const [isReporting, setIsReporting] = useState<boolean>(false);

  useEffect(() => {
    // 테마 로드
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
    if (!currentTask && isPreview) {
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
        currentTask = {
          id: targetAdmin.id,
          subject: targetAdmin.subject,
          title: targetAdmin.name,
          status: "submitted",
          assignedAt: targetAdmin.createdAt,
          totalProblems: targetAdmin.totalProblems,
          course: targetAdmin.course,
        };
      } else {
        currentTask = {
          id: taskId,
          subject: "science",
          title: "미리보기 과제",
          status: "submitted",
          assignedAt: new Date().toISOString(),
          totalProblems: qList.length,
        };
      }
    }
    setTask(currentTask || null);

    let result = getTaskResult(taskId);
    if (!result && isPreview) {
      const gradingDetails: GradingDetail[] = qList.map((q, idx) => ({
        questionIndex: idx,
        status: "correct",
        submittedAnswer: q.type === "choice" ? q.answerKey : q.correctAnswer,
        correctAnswer: q.type === "choice" ? q.answerKey : q.correctAnswer,
      }));

      result = {
        taskId,
        score: 100,
        correctCount: qList.length,
        incorrectCount: 0,
        unenteredCount: 0,
        submittedAt: new Date().toISOString(),
        gradingDetails,
      };
    } else if (!result && currentTask && currentTask.status === "submitted") {
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
    if (isPreview) {
      window.close();
    } else {
      router.push("/content/science-task-center");
    }
  };

  const handleBackToResult = () => {
    if (isPreview) {
      router.push(`/content/science-task-center/${taskId}/solve?preview=true`);
    } else {
      router.push(`/content/science-task-center/${taskId}/result${isPreview ? "?preview=true" : ""}`);
    }
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

  const scrollToQuestion = (idx: number) => {
    setCurrentIdx(idx);
  };

  if (!task || !taskResult) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">해설 데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      {/* 상단 헤더 영역 */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 z-40 shrink-0">
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
          {/* 닫기 (나가기) */}
          <button
            onClick={handleExit}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="나가기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* 과제명 행 */}
      <div className="flex items-center space-x-3 px-6 py-4 bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <button
          onClick={handleBackToResult}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title="뒤로가기"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {task.title}
        </h1>
      </div>

      {/* 메인 레이아웃 (좌측 리스트 / 우측 현황판) */}
      <main className="flex flex-1 overflow-hidden pb-20">
        {/* 좌측 문제 해설 세로 목록 영역 */}
        <section
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-8 lg:p-12 bg-white dark:bg-slate-950 border-r border-slate-150 dark:border-slate-850 space-y-12"
        >
          {(() => {
            const q = questions[currentIdx];
            if (!q) return null;
            const idx = currentIdx;
            const detail = taskResult.gradingDetails.find((d) => d.questionIndex === idx);
            const status = detail?.status || "unentered";
            const submittedAns = detail?.submittedAnswer;
            const correctAns = detail?.correctAnswer;

            return (
              <div
                key={q.id}
                id={`q-card-${idx}`}
                className="pb-12 space-y-6"
              >
                {/* 문항 헤더 */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-855 pb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      문제 {idx + 1}
                    </span>
                    {q.typeName && (
                      <>
                        <span className="h-3.5 w-px bg-slate-200 dark:bg-slate-700" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                          {q.typeName}
                        </span>
                      </>
                    )}
                    {q.difficulty && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-extrabold border ${
                        q.difficulty === "basic"
                          ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-slate-800"
                          : q.difficulty === "intermediate"
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-slate-800"
                          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-slate-800"
                      }`}>
                        {q.difficulty === "basic" ? "기본" : q.difficulty === "intermediate" ? "실력" : "심화"}
                      </span>
                    )}
                  </div>

                  {/* 정오답 결과 뱃지 */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-black border ${
                    status === "correct"
                      ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800"
                      : status === "incorrect"
                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800"
                      : "bg-slate-105 text-slate-600 border-slate-250 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  }`}>
                    {status === "correct" ? "정답" : status === "incorrect" ? "오답" : "미입력"}
                  </span>
                </div>

                {/* 문제 내용 */}
                <div className="py-2">
                  <ProblemRenderer html={q.renderedHtml} />
                </div>

                {/* 읽기 전용 답안 확인 영역 */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350">답안 확인</h4>
                  
                  {q.type === "choice" ? (
                    // 선지 확인 (읽기 전용)
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
                      {q.choiceHtmls?.map((choiceHtml, i) => {
                        const choiceNum = i + 1;
                        
                        const isCorrectKey = Array.isArray(correctAns) && correctAns.includes(choiceNum);
                        const isSubmitted = Array.isArray(submittedAns) && submittedAns.includes(choiceNum);

                        let btnStyle = "border-transparent bg-transparent dark:text-slate-300";
                        let numStyle = "border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

                        if (isCorrectKey) {
                          btnStyle = "border-emerald-500 bg-emerald-50/40 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-350 font-bold";
                          numStyle = "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500";
                        } else if (isSubmitted) {
                          btnStyle = "border-rose-500 bg-rose-50/40 text-rose-900 line-through dark:bg-rose-950/20 dark:text-rose-350";
                          numStyle = "border-rose-600 bg-rose-600 text-white dark:border-rose-500 dark:bg-rose-500";
                        }

                        return (
                          <div
                            key={choiceNum}
                            className={`flex items-center justify-start space-x-3 rounded-xl border px-3 py-2 ${btnStyle}`}
                          >
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${numStyle}`}>
                              {choiceNum}
                            </span>
                            <div className="min-w-0">
                              <ProblemRenderer html={choiceHtml} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // 입력형 확인 (읽기 전용)
                    <div className="bg-slate-50 dark:bg-slate-850/40 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 space-y-2.5 max-w-md">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400 font-bold">내가 입력한 답</span>
                        <span className={`font-black ${status === "correct" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                          {status === "unentered" ? "미입력" : submittedAns as string}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm border-t border-slate-150 dark:border-slate-800 pt-2.5">
                        <span className="text-slate-500 dark:text-slate-400 font-bold">정답</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          {correctAns as string}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 해설 영역 */}
                <div className="bg-[#e6f4f1]/40 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 rounded-2xl p-6 sm:p-7 space-y-3.5">
                  <h4 className="text-sm font-black text-emerald-750 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-xs font-bold">i</span>
                    {idx + 1}번 해설
                  </h4>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    {q.explanationHtml ? (
                      <ProblemRenderer html={q.explanationHtml} />
                    ) : (
                      <p className="text-slate-400 dark:text-slate-500 italic">등록된 해설이 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* 우측 해설 현황판 영역 */}
        <aside className="w-80 overflow-y-auto bg-slate-50 p-6 dark:bg-slate-900 shrink-0 hidden md:block">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">해설 현황판</h3>
              {/* 범례 표시 */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-extrabold">
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-emerald-600 border border-emerald-600" />
                  <span className="text-slate-550 dark:text-slate-400">정답</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-rose-600 border border-rose-600" />
                  <span className="text-slate-550 dark:text-slate-400">오답</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-white border border-gray-300 dark:bg-gray-900 dark:border-gray-700" />
                  <span className="text-slate-550 dark:text-slate-400">미입력</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-emerald-50 border-2 border-emerald-600 dark:bg-emerald-950" />
                  <span className="text-slate-550 dark:text-slate-400">현재</span>
                </div>
              </div>
            </div>

            {/* 그리드 리스트 (클릭 시 스크롤 이동) */}
            <div className="grid grid-cols-4 gap-3">
              {questions.map((q, idx) => {
                const detail = taskResult.gradingDetails.find((d) => d.questionIndex === idx);
                const status = detail?.status || "unentered";
                const isActive = idx === currentIdx;

                let buttonClass = "border ";
                if (isActive) {
                  if (status === "correct") {
                    buttonClass += "border-2 border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/20 scale-105 z-10";
                  } else if (status === "incorrect") {
                    buttonClass += "border-2 border-rose-600 bg-rose-50 text-rose-900 font-bold dark:bg-rose-950/50 dark:text-rose-100 ring-2 ring-rose-500/20 scale-105 z-10";
                  } else {
                    buttonClass += "border-2 border-slate-400 bg-slate-50 text-slate-800 font-bold dark:bg-slate-800 dark:text-slate-250 ring-2 ring-slate-500/20 scale-105 z-10";
                  }
                } else {
                  if (status === "correct") {
                    buttonClass += "border-transparent bg-emerald-600 text-white font-semibold hover:bg-emerald-750 hover:scale-105";
                  } else if (status === "incorrect") {
                    buttonClass += "border-transparent bg-rose-600 text-white font-semibold hover:bg-rose-700 hover:scale-105";
                  } else {
                    buttonClass += "border-gray-200 bg-white hover:bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-855 dark:text-gray-500 hover:scale-105";
                  }
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => scrollToQuestion(idx)}
                    className={`flex aspect-square items-center justify-center rounded-xl text-sm transition-all duration-150 active:scale-95 cursor-pointer shadow-sm ${buttonClass}`}
                    title={`문제 ${idx + 1} 해설로 전환`}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </main>

      {/* 하단 고정 바 */}
      <footer className="fixed bottom-0 left-0 right-0 h-20 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md z-45 flex items-center justify-between px-8 shadow-inner">
        {/* 맨 왼쪽: 이전 문제 */}
        <button
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx(currentIdx - 1)}
          className="px-5 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 text-sm font-extrabold rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
        >
          이전 문제
        </button>

        {/* 정중앙: 현재 문항 / 전체 문항 수 */}
        <div className="text-sm font-black text-slate-500 dark:text-slate-400 font-mono">
          {currentIdx + 1} / {questions.length}
        </div>

        {/* 맨 오른쪽: 다음 문제 및 과제 센터 복귀 버튼 */}
        <div className="flex items-center space-x-3">
          <button
            disabled={currentIdx === questions.length - 1}
            onClick={() => setCurrentIdx(currentIdx + 1)}
            className="px-5 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 text-sm font-extrabold rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
          >
            다음 문제
          </button>
          <button
            onClick={handleExit}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-650 dark:hover:bg-emerald-550 text-white text-sm font-extrabold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            과제 센터
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
    </div>
  );
}
