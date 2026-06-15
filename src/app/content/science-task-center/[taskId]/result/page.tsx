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
  Award,
  TrendingUp,
  BookOpen,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";

import { getQuestionsByTaskId, Question, matchStoredIdWithAdminId } from "@/lib/task-solve-mock";
import { getStoredTasks, Task } from "@/utils/taskStorage";
import { getTaskResult, saveTaskResult, TaskResult, GradingDetail } from "@/utils/taskResultStorage";
import { INITIAL_TASKS, SCIENCE_CURRICULA } from "@/lib/task-center-mock";

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // 오류 신고 모달 상태
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportText, setReportText] = useState<string>("");
  const [isReporting, setIsReporting] = useState<boolean>(false);

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
    </div>
  );
}
