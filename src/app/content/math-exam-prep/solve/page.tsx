"use client";

import React, { use, useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  X,
  Check,
  AlertCircle,
  Info,
  Loader2,
  Home,
  ArrowRight,
  Star,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import "katex/dist/katex.min.css";
import renderMathInElement from "katex/contrib/auto-render";

import { MATH_PRINT_SAMPLES } from "@/lib/task-print-sample-mock";
import { MATH_CURRICULA } from "@/lib/task-center-mock";
import { MATH_TYPE_TO_QUESTIONS, saveLocalPrepHistory, getCombinedTypeHistory, evaluateAchievementStatus } from "@/utils/examPrepStorage";

function getYoutubeEmbedUrl(url?: string) {
  if (!url) return "";
  let videoId = "";
  try {
    if (url.includes("youtu.be/")) {
      const parts = url.split("youtu.be/");
      if (parts.length > 1) {
        videoId = parts[1].split("?")[0];
      }
    } else if (url.includes("youtube.com/watch")) {
      const match = url.match(/[?&]v=([^&#]+)/);
      videoId = match ? match[1] : "";
    }
  } catch (e) {
    console.error("Error parsing youtube url", e);
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}

const formatSolvedAt = (isoString: string) => {
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${y}. ${m}. ${d}. ${hh}:${mm}:${ss}`;
};

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

function MathSolveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeId = searchParams.get("typeId") || "";
  const typeName = searchParams.get("name") || "";

  // typeId로 원본 유형 데이터 찾기
  const rawTypeId = typeId.replace(/-(basic|skill|advanced)$/, "");
  const difficulty = typeId.endsWith("-basic") ? "basic" : typeId.endsWith("-skill") ? "skill" : "advanced";

  let foundType: any = null;
  for (const course of MATH_CURRICULA) {
    for (const type of course.types) {
      if (type.id === rawTypeId) {
        foundType = type;
        break;
      }
    }
    if (foundType) break;
  }

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

  const renderChoiceButton = (choice: string, idx: number, layoutMode: "col" | "row" | "grid" | "grid3") => {
    const isSelected = selectedChoice === idx;
    const isCorrectChoice = questionSample.choices[idx] === questionSample.answer || idx + 1 === parseInt(questionSample.answer, 10);
    const choiceNum = idx + 1;

    // 버튼 전체 박스 스타일 (기본은 border-transparent bg-transparent)
    let buttonClass = "border-transparent bg-transparent hover:bg-gray-100/40 dark:hover:bg-gray-800/40 text-slate-800 dark:text-slate-200";
    
    // 번호 배지 스타일 (기본은 border-gray-300 bg-white text-gray-600)
    let badgeClass = "border-gray-300 bg-white text-gray-600 dark:border-gray-650 dark:bg-gray-800 dark:text-gray-300";

    if (isSubmitted) {
      if (isCorrectChoice) {
        buttonClass = "border-emerald-500 bg-emerald-50/40 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100 font-bold shadow-sm";
        badgeClass = "border-emerald-500 bg-emerald-500 text-white";
      } else if (isSelected) {
        buttonClass = "border-rose-500 bg-rose-50/40 text-rose-900 dark:bg-rose-950/20 dark:text-rose-100 font-bold shadow-sm";
        badgeClass = "border-rose-500 bg-rose-500 text-white";
      } else {
        buttonClass = "border-transparent bg-transparent opacity-40 pointer-events-none";
        badgeClass = "border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-850 dark:text-gray-500";
      }
    } else if (isSelected) {
      buttonClass = "border-blue-500 bg-blue-50/50 text-blue-900 shadow-sm dark:bg-blue-950/30 dark:text-blue-100 font-bold";
      badgeClass = "border-blue-600 bg-blue-600 text-white";
    }

    let buttonSpacingClass = "space-x-4 px-5 py-3.5";
    if (layoutMode === "row") {
      buttonSpacingClass = "space-x-3 px-3 py-2.5";
    } else if (layoutMode === "grid3") {
      buttonSpacingClass = "space-x-3 px-4 py-3";
    } else if (layoutMode === "grid") {
      buttonSpacingClass = "space-x-4 px-4 py-3";
    }

    return (
      <button
        key={idx}
        disabled={isSubmitted}
        onClick={() => setSelectedChoice(idx)}
        className={cn(
          "text-left rounded-xl border flex items-center justify-start transition-all duration-150 cursor-pointer group/opt",
          buttonSpacingClass,
          buttonClass,
          layoutMode === "col" ? "w-full" : ""
        )}
      >
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all",
          badgeClass
        )}>
          {choiceNum}
        </div>
        {layoutMode === "grid3" ? (
          <div className="flex-1 min-w-0 flex justify-center py-2 choice-image-wrapper">
            <ProblemRenderer html={choice} />
          </div>
        ) : (
          <span className="font-semibold text-[15px] md:text-[16px] leading-[1.5] flex-1 break-keep">
            <ProblemRenderer html={choice} />
          </span>
        )}
      </button>
    );
  };

  // --- State ---
  const [questionSample, setQuestionSample] = useState<any>(undefined); // undefined: 로딩중, null: 없음
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [inputText, setInputText] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("readingmath_theme");
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    if (!typeId) {
      setQuestionSample(null);
      return;
    }
    const history = getCombinedTypeHistory(typeId, "math");
    const questionIds = MATH_TYPE_TO_QUESTIONS[typeId] || [];
    const questionId = questionIds[history.length % 3] || questionIds[0];
    const sample = MATH_PRINT_SAMPLES.find((q) => q.id === questionId);
    setQuestionSample(sample || null);
  }, [typeId]);

  // 로딩 상태 처리
  if (questionSample === undefined) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin mb-2" />
        <p className="text-gray-500 text-sm">문항을 불러오는 중입니다...</p>
      </div>
    );
  }

  // 매칭되는 문항이 없는 경우 예외 처리 (미노출)
  if (questionSample === null) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center dark:bg-slate-950 text-slate-800 dark:text-slate-200">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">문항을 불러올 수 없습니다.</h2>
        <p className="text-gray-500 text-sm mb-6">선택한 유형 ID와 매칭되는 문항이 존재하지 않거나 준비 중입니다.</p>
        <Button onClick={() => router.push("/content/math-exam-prep")} className="font-bold">
          시험 대비 홈으로 이동
        </Button>
      </div>
    );
  }

  const isChoiceType = questionSample.choices && questionSample.choices.length > 0;
  const isAnswered = isChoiceType ? selectedChoice !== null : inputText.trim() !== "";

  // 뒤로가기 클릭 시 이탈 방지 처리
  const handleBack = () => {
    if (!isSubmitted) {
      setShowExitModal(true);
    } else {
      router.push("/content/math-exam-prep");
    }
  };

  // 답안 제출 채점 로직
  const handleSubmit = () => {
    if (!isAnswered || isSubmitted) return;

    let correct = false;
    let submittedAnsText = "";

    if (isChoiceType) {
      if (selectedChoice !== null) {
        const selectedVal = questionSample.choices[selectedChoice];
        submittedAnsText = selectedVal;
        
        // 정답 비교 (선지 텍스트 또는 1-based index)
        const clean = (s: string) => s.replace(/[\$\s\(\)\\]/g, "");
        const cleanAnswer = clean(questionSample.answer);
        
        if (clean(selectedVal) === cleanAnswer) {
          correct = true;
        } else {
          // 혹시 answer가 "1", "2" 와 같은 숫자이고 index와 매칭되는지
          const matchIdx = questionSample.choices.indexOf(questionSample.answer);
          if (matchIdx === selectedChoice) {
            correct = true;
          } else {
            const numAns = parseInt(questionSample.answer, 10);
            if (!isNaN(numAns) && numAns === selectedChoice + 1) {
              correct = true;
            }
          }
        }
      }
    } else {
      submittedAnsText = inputText.trim();
      const clean = (s: string) => s.replace(/[\$\s\(\)\\]/g, "").trim();
      if (clean(inputText) === clean(questionSample.answer)) {
        correct = true;
      }
    }

    setIsCorrect(correct);
    setIsSubmitted(true);

    // [이력 저장] 시험 대비 풀이 이력 생성 (과제 센터 이력에는 쓰기 금지 조건 준수)
    saveLocalPrepHistory({
      typeId,
      questionId: questionSample.id,
      path: "시험 대비",
      isCorrect: correct,
      submittedAnswer: submittedAnsText,
      solvedAt: new Date().toISOString()
    });
  };

  const handleKeypadPress = (key: string) => {
    if (isSubmitted) return;

    let nextVal = inputText;
    if (key === "delete") {
      nextVal = nextVal.slice(0, -1);
    } else if (key === "clear") {
      nextVal = "";
    } else if (key === "confirm") {
      if (nextVal.trim() !== "") {
        handleSubmit();
      }
      return;
    } else {
      if (nextVal.length < 15) {
        nextVal += key;
      }
    }
    setInputText(nextVal);
  };


  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-slate-50 text-slate-900 transition-colors duration-200 pb-24",
      isDarkMode && "bg-slate-950 text-slate-100 dark"
    )}>
      {/* GNB / 상단 영역 */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 shrink-0 z-40">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={handleBack}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-850 transition-colors"
            title="뒤로가기"
          >
            <ChevronLeft className="h-6 h-6 stroke-[2.5]" />
          </button>
          <span className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
          {/* 유형명 주요 제목으로 노출 (훈련명/단원명/교과서명 대체 금지) */}
          <h1 className="text-[17px] font-black text-slate-900 dark:text-white leading-none">
            {typeName || "유형 문항 풀이"}
          </h1>
        </div>
      </header>

      {/* 메인 풀이 영역 (좌우 2분할) */}
      <main className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden">
        {/* 좌측: 실제 문제 풀이 영역 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="w-full flex flex-col gap-6 pb-12">
            
            {/* 발문 렌더러 */}
            <div className="text-[18px] md:text-[20px] font-bold leading-[1.6] text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-keep">
              <ProblemRenderer html={questionSample.stem} />
            </div>

            {/* 지문/본문/이미지/도표 렌더러 */}
            {questionSample.passage && (
              <div className="passage-box border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 bg-slate-50 dark:bg-slate-900/40 text-[15px] md:text-[16px] leading-[1.7] text-slate-700 dark:text-slate-350 shadow-inner">
                <ProblemRenderer html={questionSample.passage} />
              </div>
            )}

            {questionSample.image && (
              <div className="flex justify-center max-w-full my-4">
                <img
                  src={questionSample.image}
                  alt="문제 이미지"
                  className="max-w-full h-auto max-h-[240px] object-contain rounded-xl"
                />
              </div>
            )}

            {/* 답안 입력 영역 */}
            <div className="mt-4 border-t border-slate-100 dark:border-slate-800/50 pt-6">
              {isChoiceType ? (
                /* 선지형 문항 (보기 선택) */
                (() => {
                  const layoutMode = getChoiceLayoutMode(questionSample.choices);
                  
                  if (layoutMode === "row") {
                    return (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                        {questionSample.choices.map((choice: string, idx: number) => 
                          renderChoiceButton(choice, idx, "row")
                        )}
                      </div>
                    );
                  }
                  
                  if (layoutMode === "grid3") {
                    return (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                        {questionSample.choices.map((choice: string, idx: number) => 
                          renderChoiceButton(choice, idx, "grid3")
                        )}
                      </div>
                    );
                  }
                  
                  if (layoutMode === "grid") {
                    return (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
                        {questionSample.choices.map((choice: string, idx: number) => 
                          renderChoiceButton(choice, idx, "grid")
                        )}
                      </div>
                    );
                  }
                  
                  // 기본 세로 col 배치
                  return (
                    <div className="space-y-3">
                      {questionSample.choices.map((choice: string, idx: number) => 
                        renderChoiceButton(choice, idx, "col")
                      )}
                    </div>
                  );
                })()
              ) : (
                /* 입력형 / 풀이답안형 문항 (텍스트 입력) */
                <div className="flex flex-col space-y-4 max-w-[360px] mx-auto w-full">
                  <input
                    type="text"
                    disabled={isSubmitted}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isSubmitted ? "제출이 완료되었습니다." : "답을 입력해주세요"}
                    className={cn(
                      "w-full text-center rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-xl font-bold tracking-wider text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-850 dark:bg-gray-900 dark:text-white transition-all",
                      isSubmitted && (isCorrect ? "border-emerald-500 bg-emerald-50/10" : "border-rose-500 bg-rose-50/10")
                    )}
                  />
                  {isSubmitted && (
                    <div className="text-sm font-semibold flex items-center justify-center gap-1.5 mt-1">
                      <span className="text-slate-400 dark:text-slate-500">올바른 정답:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{questionSample.answer}</span>
                    </div>
                  )}

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
                        { label: "↺", value: "clear", cls: "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold" },
                        { label: "⌫", value: "delete", cls: "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold" },
                        
                        { label: "✓", value: "confirm", colSpan: 5, cls: "bg-slate-600 hover:bg-slate-700 text-white font-bold text-xl h-12 flex items-center justify-center rounded-xl" },
                      ].map((btn, i) => {
                        const gridCls = [
                          btn.colSpan ? `col-span-${btn.colSpan}` : "",
                          btn.cls || "bg-white hover:bg-gray-50 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-750 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50",
                        ].join(" ");
                        return (
                          <button
                            key={i}
                            disabled={isSubmitted}
                            onClick={() => handleKeypadPress(btn.value)}
                            className={cn(
                              "flex h-11 items-center justify-center rounded-xl text-base font-bold shadow-sm transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                              gridCls
                            )}
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

            {/* 문항 채점 결과 및 해설 영역 (w-full 래퍼 안으로 배치하여 stretch 정렬 및 100% 폭 활용) */}
            {isSubmitted && (
              <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                <div className={cn(
                  "absolute top-0 left-0 w-1.5 h-full",
                  isCorrect ? "bg-emerald-500" : "bg-rose-500"
                )} />
                
                <div className="flex items-center gap-2 mb-4 text-slate-900 dark:text-white font-bold ml-2">
                  <div className="p-1 bg-violet-100 dark:bg-violet-950/60 rounded-md">
                    <Info className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-lg">정답 및 해설</span>
                </div>
                
                <div className="ml-2 leading-[1.8] whitespace-pre-wrap text-[15px] md:text-[16px]">
                  <div className="mb-4">
                    <h5 className="font-extrabold text-slate-400 dark:text-slate-500 text-xs mb-1 uppercase tracking-widest">해설</h5>
                    <ProblemRenderer html={questionSample.explanation} />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 우측: 유형 상세 참고 패널 */}
        {foundType && (
          <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-y-auto p-6 flex flex-col gap-6">
            
            {/* 유형 기본 정보 */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">유형 정보</span>
              
              {/* 배지 행 */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                )}>
                  {/* 현재 성취도 상태 */}
                  <span className="capitalize">
                    {(() => {
                      const status = evaluateAchievementStatus(typeId, "math");
                      const statusLabels: Record<string, string> = {
                        none: "미진행",
                        undetermined: "미판정",
                        relearn: "재학습 필요",
                        supplement: "보충 필요",
                        understand: "유형 이해",
                        master: "유형 정복",
                      };
                      return statusLabels[status] || status;
                    })()}
                  </span>
                </div>
                {/* 중요 여부 */}
                {((difficulty === "basic" && foundType.importantCount.basic > 0) ||
                  (difficulty === "skill" && foundType.importantCount.intermediate > 0) ||
                  (difficulty === "advanced" && foundType.importantCount.advanced > 0)) && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-bold dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    중요
                  </div>
                )}
                {/* 난이도 */}
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold",
                  isDarkMode ? "bg-slate-800 text-slate-350" : "bg-slate-100 text-slate-600"
                )}>
                  {difficulty === "basic" ? "기본" : difficulty === "skill" ? "실력" : "심화"}
                </span>
              </div>

              {/* 유형명 */}
              <h3 className="text-[16px] font-extrabold leading-snug text-slate-900 dark:text-white">
                {foundType.typeName}
              </h3>
            </div>

            {/* 대표 유형 동영상 */}
            {foundType.videoUrl && (
              <>
                <div className="border-t border-slate-200 dark:border-slate-800" />
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">대표 유형 동영상</h4>
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200/50 bg-black shadow-inner">
                    <iframe
                      src={getYoutubeEmbedUrl(foundType.videoUrl)}
                      title={`${foundType.typeName} 동영상`}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              </>
            )}

            {/* 대표 유형 문제 */}
            {foundType.sampleQuestion && (
              <>
                <div className="border-t border-slate-200 dark:border-slate-800" />
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">대표 유형 문제</h4>
                  <div className="p-4 rounded-xl text-sm leading-relaxed border bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800/50 text-slate-700 dark:text-slate-200 font-medium">
                    <ProblemRenderer html={foundType.sampleQuestion} />
                  </div>
                </div>
              </>
            )}

            {/* 최근 풀이 이력 */}
            <>
              <div className="border-t border-slate-200 dark:border-slate-800" />
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">최근 풀이 이력</h4>
                {(() => {
                  const combinedHistory = getCombinedTypeHistory(typeId, "math");
                  return combinedHistory.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {combinedHistory.slice(0, 3).map((h, i) => (
                        <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/50">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                              h.isCorrect ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400" : "bg-red-100 text-red-500 dark:bg-red-950/40 dark:text-red-400"
                            )}>
                              {h.isCorrect ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-750 dark:text-slate-350">{h.path}</span>
                              <span className="text-slate-400 dark:text-slate-500">·</span>
                              <span className={cn("font-medium", h.isCorrect ? "text-green-500" : "text-red-400")}>
                                {h.isCorrect ? "정답" : "오답"}
                              </span>
                            </div>
                          </div>
                          <span className="text-slate-400 dark:text-slate-500">{formatSolvedAt(h.solvedAt)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 gap-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/20 text-slate-400 dark:text-slate-650">
                      <BookOpen className="w-8 h-8 opacity-40" />
                      <span className="text-xs font-semibold">아직 풀이 이력이 없어요</span>
                    </div>
                  );
                })()}
              </div>
            </>

          </div>
        )}
      </main>

      {/* 하단 푸터 (버튼 영역) */}
      <footer className="fixed bottom-0 left-0 right-0 h-20 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md z-45 flex items-center justify-between px-8 shadow-inner">
        <div className="flex-1">
          {/* 채점 완료 후 채점 결과 즉시 표시 */}
          {isSubmitted && (
            isCorrect ? (
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-extrabold animate-in slide-in-from-bottom-2">
                <div className="p-1 bg-emerald-100 dark:bg-emerald-950/60 rounded-full">
                  <Check className="w-4 h-4 stroke-[3.5]" />
                </div>
                <span className="text-[14px] md:text-[15px]">정답</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-450 font-extrabold animate-in slide-in-from-bottom-2">
                <div className="p-1 bg-rose-100 dark:bg-rose-950/60 rounded-full">
                  <X className="w-4 h-4 stroke-[3.5]" />
                </div>
                <span className="text-[14px] md:text-[15px]">오답</span>
              </div>
            )
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isSubmitted ? (
            <Button
              disabled={!isAnswered}
              onClick={handleSubmit}
              className="px-8 h-12 md:h-13 font-black bg-violet-600 hover:bg-violet-750 text-white rounded-xl shadow-lg shadow-violet-600/10 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              제출하기
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push("/content/math-exam-prep")}
                variant="outline"
                className="px-6 h-12 md:h-13 font-bold border-slate-300 dark:border-slate-700 rounded-xl"
              >
                <Home className="w-4 h-4 mr-2" />
                시험 대비 홈으로
              </Button>
              <Button
                onClick={() => router.push(`/content/math-exam-prep?selectedTypeId=${encodeURIComponent(typeId)}`)}
                className="px-6 h-12 md:h-13 font-black bg-violet-600 hover:bg-violet-750 text-white rounded-xl shadow-md"
              >
                유형 상세로
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </footer>

      {/* 풀이 종료 확인 모달 */}
      {showExitModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowExitModal(false)}
        >
          <div 
            className={cn(
              "w-full max-w-[290px] rounded-2xl border p-5 shadow-2xl flex flex-col gap-5 bg-white border-slate-100 text-slate-900 animate-in zoom-in-95 duration-200",
              isDarkMode && "bg-[#1e293b] border-slate-700 text-white"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <h3 className="text-[16px] font-black tracking-tight text-center">
                풀이를 종료할까요?
              </h3>
              <p className={cn(
                "text-[12px] leading-relaxed text-center break-keep font-medium whitespace-pre-line text-slate-500",
                isDarkMode && "text-slate-400"
              )}>
                제출하지 않은 답안은 풀이 이력에 반영되지 않습니다.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className={cn(
                  "py-3 rounded-xl font-extrabold text-[12.5px] transition-all active:scale-95 shadow-sm border bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700",
                  isDarkMode && "bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200"
                )}
              >
                취소
              </button>
              <button
                onClick={() => {
                  setShowExitModal(false);
                  router.push("/content/math-exam-prep");
                }}
                className="py-3 rounded-xl font-extrabold text-[12.5px] transition-all active:scale-95 shadow-lg bg-violet-600 hover:bg-violet-750 text-white"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MathSolvePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          <span className="text-sm font-semibold text-slate-400">문항을 불러오는 중...</span>
        </div>
      </div>
    }>
      <MathSolveContent />
    </Suspense>
  );
}
