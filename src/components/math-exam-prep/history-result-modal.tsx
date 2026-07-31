"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Info, X } from "lucide-react";
import renderMathInElement from "katex/contrib/auto-render";

import { cn } from "@/lib/utils";
import { MATH_PRINT_SAMPLES } from "@/lib/task-print-sample-mock";
import type { ExamPrepHistoryItem } from "@/utils/examPrepStorage";

import "katex/dist/katex.min.css";

interface HistoryResultModalProps {
  history: ExamPrepHistoryItem;
  onClose: () => void;
}

function MathContent({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = html.replace(/\n/g, "<br />");
    renderMathInElement(ref.current, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      macros: { "\\frac": "\\dfrac" },
      throwOnError: false,
    });
  }, [html]);

  return <div ref={ref} className={className} />;
}

function getCorrectChoiceIndex(choices: string[], answer: string) {
  const matchingIndex = choices.indexOf(answer);
  if (matchingIndex !== -1) return matchingIndex;

  const answerNumber = Number.parseInt(answer, 10);
  return Number.isNaN(answerNumber) ? -1 : answerNumber - 1;
}

export function HistoryResultModal({ history, onClose }: HistoryResultModalProps) {
  const [mounted, setMounted] = useState(false);
  const question = MATH_PRINT_SAMPLES.find((item) => item.id === history.questionId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  if (!mounted || !question) return null;

  const correctChoiceIndex = getCorrectChoiceIndex(question.choices, question.answer);
  const savedChoiceIndex = question.choices.indexOf(history.submittedAnswer);
  const submittedChoiceIndex = savedChoiceIndex !== -1
    ? savedChoiceIndex
    : history.isCorrect
      ? correctChoiceIndex
      : question.choices.findIndex((_, index) => index !== correctChoiceIndex);
  const submittedText = history.submittedAnswer !== "mock"
    ? history.submittedAnswer
    : history.isCorrect
      ? question.answer
      : "오답";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="최근 풀이 결과"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">최근 풀이 결과</h2>
            <span className={cn(
              "rounded-full px-2.5 py-1 text-xs font-bold",
              history.isCorrect
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
            )}>
              {history.isCorrect ? "정답" : "오답"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-6 md:px-8">
          <section className="space-y-5">
            <MathContent
              html={question.stem}
              className="text-lg font-bold leading-relaxed text-slate-900 dark:text-slate-100"
            />

            {question.passage && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200">
                <MathContent html={question.passage} className="leading-relaxed" />
              </div>
            )}

            {question.image && (
              <div className="flex justify-center rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <img
                  src={question.image}
                  alt="문제 이미지"
                  className="max-h-[320px] max-w-full object-contain"
                />
              </div>
            )}

            {question.table && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-center text-sm">
                  {question.table.headers && (
                    <thead>
                      <tr>
                        {question.table.headers.map((header) => (
                          <th key={header} className="border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {question.table.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={`${rowIndex}-${cellIndex}`} className="border border-slate-200 px-3 py-2 dark:border-slate-700">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mt-7 border-t border-slate-200 pt-6 dark:border-slate-800">
            {question.choices.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {question.choices.map((choice, index) => {
                  const isCorrectChoice = index === correctChoiceIndex;
                  const isSubmittedChoice = index === submittedChoiceIndex;

                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 text-slate-700 dark:text-slate-200",
                        isCorrectChoice && "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20",
                        isSubmittedChoice && !isCorrectChoice && "border-rose-500 bg-rose-50/60 dark:bg-rose-950/20",
                        !isCorrectChoice && !isSubmittedChoice && "border-slate-200 opacity-60 dark:border-slate-800",
                      )}
                    >
                      <span className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                        isCorrectChoice && "border-emerald-500 bg-emerald-500 text-white",
                        isSubmittedChoice && !isCorrectChoice && "border-rose-500 bg-rose-500 text-white",
                      )}>
                        {index + 1}
                      </span>
                      <MathContent html={choice} className="min-w-0 flex-1 font-medium" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={cn(
                "rounded-xl border px-5 py-4 text-center text-lg font-bold",
                history.isCorrect
                  ? "border-emerald-500 bg-emerald-50/60 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"
                  : "border-rose-500 bg-rose-50/60 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300",
              )}>
                제출 답안: {submittedText}
              </div>
            )}
          </section>

          <section className="relative mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className={cn(
              "absolute inset-y-0 left-0 w-1.5",
              history.isCorrect ? "bg-emerald-500" : "bg-rose-500",
            )} />
            <div className="mb-5 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <span className="rounded-md bg-violet-100 p-1 dark:bg-violet-950/60">
                <Info className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </span>
              <span className="text-lg">정답 및 해설</span>
            </div>
            <div className="space-y-5 pl-1">
              <div>
                <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-slate-400">정답</h3>
                <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4 stroke-[3]" />
                  <MathContent html={question.answer} />
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-slate-400">해설</h3>
                <MathContent
                  html={question.explanation}
                  className="leading-relaxed text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
