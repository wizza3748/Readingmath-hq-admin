"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { TaskItem, StudentAssignment } from "@/lib/task-center-mock";
import { MATH_PRINT_SAMPLES, SCIENCE_PRINT_SAMPLES, PrintQuestion } from "@/lib/task-print-sample-mock";
import { PrintColor } from "./task-print-view";
import { evaluateStudentAchievement } from "@/utils/examPrepStorage";

// ── 초경량 LaTeX 수식 렌더러 유틸리티 ──
export function renderLatexToHtml(latex: string): string {
  let html = latex.trim();

  // 1. \therefore -> ∴
  html = html.replace(/\\therefore/g, '∴');
  
  // 2. \approx -> ≈
  html = html.replace(/\\approx/g, '≈');
  
  // 3. \ne -> ≠
  html = html.replace(/\\ne/g, '≠');
  
  // 4. \le 또는 \leq -> ≤
  html = html.replace(/\\le(q)?/g, '≤');
  
  // 5. \ge 또는 \geq -> ≥
  html = html.replace(/\\ge(q)?/g, '≥');

  // 6. \text{...} 처리 (수식 내 일반 텍스트)
  let textPrev = "";
  while (html !== textPrev) {
    textPrev = html;
    html = html.replace(/\\text\s*\{([^{}]+)\}/g, (match, txt) => {
      return `<span class="not-italic font-sans" style="font-family: sans-serif;">${txt}</span>`;
    });
  }

  // 7. 분수 처리: \frac{num}{den}
  let fracPrev = "";
  while (html !== fracPrev) {
    fracPrev = html;
    html = html.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, (match, num, den) => {
      return `<span class="inline-flex flex-col items-center mx-0.5" style="vertical-align: middle; line-height: 1.1;">
        <span class="text-center text-[0.85em] border-b border-gray-700 px-0.5 pb-[1px]" style="line-height: 1.1;">${num}</span>
        <span class="text-center text-[0.85em] pt-[1px]" style="line-height: 1.1;">${den}</span>
      </span>`;
    });
  }

  // 8. 위첨자 처리: x^{2} 및 x^2
  html = html.replace(/([a-zA-Z0-9)]+)\^\{([^{}]+)\}/g, (match, base, exp) => {
    return `${base}<sup class="text-[0.75em] -top-[0.35em] ml-[1px]" style="vertical-align: super; font-size: 75%;">${exp}</sup>`;
  });
  html = html.replace(/([a-zA-Z0-9)]+)\^([a-zA-Z0-9-+]+)/g, (match, base, exp) => {
    return `${base}<sup class="text-[0.75em] -top-[0.35em] ml-[1px]" style="vertical-align: super; font-size: 75%;">${exp}</sup>`;
  });

  // 9. 곱셈 및 나눗셈 기호
  html = html.replace(/\\times/g, '×');
  html = html.replace(/\\div/g, '÷');

  // 9.1. 각도 및 선분 기호
  html = html.replace(/\\angle/g, '∠');
  
  let overlinePrev = "";
  while (html !== overlinePrev) {
    overlinePrev = html;
    html = html.replace(/\\overline\s*\{([^{}]+)\}/g, (match, txt) => {
      return `<span class="not-italic font-sans" style="text-decoration: overline;">${txt}</span>`;
    });
  }

  // 10. 백슬래시 정리
  html = html.replace(/\\/g, '');

  return `<span class="italic font-serif inline-block mx-0.5" style="font-family: 'Times New Roman', Times, serif; vertical-align: middle;">${html}</span>`;
}

export function parseAndRenderMath(text: string): string {
  if (!text) return "";

  let result = text;

  // 1. $$ ... $$ 블록 수식
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
    return `<div class="my-2 text-center block max-w-full overflow-x-auto">${renderLatexToHtml(formula)}</div>`;
  });

  // 2. \[ ... \] 블록 수식
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
    return `<div class="my-2 text-center block max-w-full overflow-x-auto">${renderLatexToHtml(formula)}</div>`;
  });

  // 3. $ ... $ 인라인 수식
  result = result.replace(/\$([\s\S]*?)\$/g, (match, formula) => {
    return renderLatexToHtml(formula);
  });

  // 4. \( ... \) 인라인 수식
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
    return renderLatexToHtml(formula);
  });

  return result;
}

interface Props {
  task: TaskItem;
  isBlocked: boolean;
  blockMessage: string;
  printType: "student" | "teacher";
  previewStudentId: string;
  activeStudents: StudentAssignment[];
  color: PrintColor;
  split: "1" | "2" | "4" | "6";
  pageMargin: number;
  problemGap: number;
  fontSize: number;
  showClass: boolean;
  showName: boolean;
  showDate: boolean;
  showUnit: boolean;
  showLogo: boolean;
  printTarget?: "all" | "selected";
  selectedStudentIds?: string[];
  setPreviewStudentId?: (id: string) => void;
  answerOnlyMode?: boolean;
  isStudentView?: boolean;
}

export interface PrintItem {
  type: 'question' | 'explanation';
  question: PrintQuestion;
}

interface PageData {
  left: PrintItem[];
  right: PrintItem[];
  student: StudentAssignment | null;
  studentPageNo: number;
}

const PageHeader = ({ task, color, showClass, showName, showDate, showUnit, showLogo, previewStudent, printType, isStudentView }: any) => {
  // 테마 색상에 투명도 30% 적용 (HEX 8자리)
  const borderColor = color.length === 7 ? `${color}4D` : color;
  const displayName = printType === "teacher" ? `${task.name} (교사용)` : task.name;
  
  // 반 정보 추출
  let classText = "";
  if (task.problemMode === "same") {
    if (isStudentView) {
      if (previewStudent && previewStudent.classGroup) {
        classText = previewStudent.classGroup;
      }
    } else {
      const classes = task.assignedClasses || [];
      if (classes.length === 1) {
        classText = classes[0];
      } else {
        classText = "__________";
      }
    }
  } else {
    if (previewStudent && previewStudent.classGroup) {
      classText = previewStudent.classGroup;
    }
  }

  // 단원 정보 추출
  const unitList = React.useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();
    (task.selectedTypes || []).forEach((t: any) => {
      const key = `${t.majorUnit} > ${t.minorUnit}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(key);
      }
    });
    return list;
  }, [task.selectedTypes]);

  return (
    <div className="mb-4 shrink-0">
      <h2 className="text-[13pt] font-bold truncate mb-2" style={{ color }} title={displayName}>{displayName}</h2>
      <div className="flex justify-between items-end pb-2 border-b" style={{ borderColor }}>
        <div className="flex flex-col flex-1 min-w-0 pr-4">
          <div className="text-[11pt] text-gray-700 flex flex-wrap gap-x-6 gap-y-1 items-center max-w-full font-medium">
            {showClass && classText && classText !== "__________" && (
              <span className="truncate max-w-[200px]" title={classText}>반: {classText}</span>
            )}
            {showName && (
              <span className="shrink-0">이름: {isStudentView && previewStudent?.studentName ? previewStudent.studentName : ((task.problemMode === "individual" || task.problemMode === "relearn") && previewStudent?.studentName ? previewStudent.studentName : "__________")}</span>
            )}
            {showDate && (
              <span className="shrink-0">날짜: {new Date().toLocaleDateString('ko-KR')}</span>
            )}
          </div>
          {showUnit && unitList.length > 0 && (
            <div className="text-[9.5pt] text-gray-500 mt-2 font-medium leading-relaxed whitespace-normal break-keep">
              {task.course && (
                <div className="font-bold text-gray-700 mb-1">[{task.course}]</div>
              )}
              {unitList.map((unit, idx) => (
                <div key={idx} className="w-full">
                  {unit}
                </div>
              ))}
            </div>
          )}
        </div>
        {showLogo && (
          <div className="h-[20px] flex items-center shrink-0 mb-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={task.subject === "math" ? "/print_sample/math_logo.png" : "/print_sample/science_logo.png"} 
              alt="Logo" 
              className="h-full w-auto object-contain" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                }
              }}
            />
            <span style={{ display: 'none', color: color, fontWeight: 'bold', fontSize: '11pt' }}>
              리딩{task.subject === "math" ? "수학" : "과학"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const AbbreviatedPageHeader = ({ task, color, printType }: any) => {
  // 테마 색상에 투명도 30% 적용 (HEX 8자리)
  const borderColor = color.length === 7 ? `${color}4D` : color;
  const displayName = printType === "teacher" ? `${task.name} (교사용)` : task.name;
  
  return (
    <div className="mb-3 shrink-0">
      <div className="flex justify-between items-center pb-1 border-b" style={{ borderColor, borderWidth: '0 0 1px 0' }}>
        <h2 className="text-[10pt] font-bold truncate" style={{ color }}>{displayName}</h2>
      </div>
    </div>
  );
};

// ── 1. 문항 본문 (발문/보기/선지) 렌더링 컴포넌트 ──
export const QuestionBody = ({ q, color, fontSize, onImageLoad, scaleDownChoices }: any) => {
  // q.passage가 이미지만 포함하고 있는지 판별 (HTML 태그를 걷어낸 실질적인 글자가 없는 경우)
  const cleanPassageText = q.passage ? q.passage.replace(/<[^>]*>/g, "").replace(/\s/g, "") : "";
  const isImageOnlyPassage = q.passage && q.passage.includes("<img") && cleanPassageText.length === 0;

  return (
    <div className="max-w-full min-w-0 overflow-hidden flex flex-col">
      <div className="mb-2 font-bold max-w-full min-w-0 leading-snug" style={{ fontSize: `${fontSize}pt` }}>
        <span style={{ color }} className="inline mr-1.5 whitespace-nowrap">{q.teacherQuestionNo}.</span>
        <span 
          dangerouslySetInnerHTML={{ __html: parseAndRenderMath(q.stem) }} 
          className="inline max-w-full min-w-0 overflow-hidden [&_p]:inline [&_div]:inline" 
        />
      </div>

      {q.passage && (
        <div 
          className={`${
            isImageOnlyPassage 
              ? "mb-3 flex justify-center w-full" 
              : "border p-3 rounded mb-3 text-gray-800 leading-relaxed bg-white"
          } max-w-full min-w-0 overflow-x-auto`} 
          style={{ fontSize: `${fontSize - 1}pt` }}
        >
          <div 
            dangerouslySetInnerHTML={{ __html: parseAndRenderMath(q.passage.replace(/\n/g, '<br/>')) }} 
            className="max-w-full min-w-0 overflow-hidden [&_img]:!max-w-full [&_img]:!h-auto [&_img]:object-contain [&_table]:!max-w-full [&_table]:w-full [&_table]:table-fixed"
          />
        </div>
      )}

      {q.image && (
        <div className="mb-3 flex justify-center max-w-full min-w-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={q.image} 
            alt="문제 이미지" 
            className="max-w-full h-auto max-h-[150px] object-contain" 
            onLoad={onImageLoad}
          />
        </div>
      )}

      {q.choices && q.choices.length > 0 ? (
        // ── 가로 맞춤형 선지 렌더링 ──
        // flex-wrap으로 안전하고 유연한 자동 줄바꿈을 유지하면서,
        // 각 선지가 쪼개지지 않도록 whitespace-nowrap을 적용하고, 선지 사이 여백을 gap-x-8 gap-y-2로 대폭 넓혀 쾌적한 가독성을 제공합니다.
        <div className="flex flex-wrap gap-x-8 gap-y-2 mt-2 text-gray-700 max-w-full min-w-0 items-start" style={{ fontSize: `${fontSize - 1}pt` }}>
          {q.choices.map((choice: string, i: number) => {
            const isImageChoice = /<img\s/i.test(choice);
            return (
              <div
                key={i}
                className={`flex items-start gap-1.5 min-w-0 ${
                  isImageChoice
                    ? "[&_img]:!max-w-full [&_img]:!h-auto [&_img]:object-contain"
                    : "max-w-full whitespace-nowrap" // 수식이나 텍스트가 좁은 폭 때문에 강제로 여러 줄로 쪼개지는 현상 절대 차단
                }`}
                style={
                  isImageChoice
                    ? { maxWidth: "44%", flexBasis: "44%", flexGrow: 0, flexShrink: 0 }
                    : undefined
                }
              >
                <span className="shrink-0 font-medium">{['①','②','③','④','⑤'][i]}</span>
                <span
                  dangerouslySetInnerHTML={{ __html: parseAndRenderMath(choice) }}
                  className={`min-w-0 overflow-hidden [&_table]:!max-w-full [&_table]:w-full [&_table]:table-fixed ${
                    isImageChoice
                      ? "[&_img]:!max-w-full [&_img]:!w-full [&_img]:!h-auto [&_img]:object-contain [&_img]:block"
                      : "max-w-full"
                  }`}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 mb-2 flex items-end gap-2 max-w-full min-w-0">
          <span className="text-gray-800 font-bold shrink-0" style={{ fontSize: `${fontSize - 1}pt` }}>정답 :</span>
          <div className="border-b border-gray-400 w-40 flex-1 max-w-[200px] mb-[2px]"></div>
        </div>
      )}
    </div>
  );
};

// ── 2. 정답·해설 영역 렌더링 컴포넌트 ──
export const QuestionExplanation = ({ q, color, fontSize, isSeparated, onImageLoad }: any) => {
  // 정답과 해설이 모두 미등록된 문항은 아예 해설 카드를 표시하지 않음
  if (!q.explanation && !q.answer) return null;

  let displayAnswer = q.answer;
  if (q.choices && q.choices.length > 0) {
    const choiceIndex = q.choices.indexOf(q.answer);
    if (choiceIndex !== -1) {
      displayAnswer = ['①','②','③','④','⑤'][choiceIndex];
    }
  }

  let cleanExplanation = q.explanation || "";
  let extractedImages: string[] = [];

  if (cleanExplanation) {
    const imgRegex = /<img[^>]*>/g;
    const matches = cleanExplanation.match(imgRegex);
    if (matches) {
      extractedImages = matches;
      cleanExplanation = cleanExplanation.replace(imgRegex, "").trim();
      // Remove leading/trailing line breaks or spaces
      cleanExplanation = cleanExplanation.replace(/^(<br\s*\/?>|\s)+|(<br\s*\/?>|\s)+$/gi, "").trim();
    }
  }

  return (
    <div 
      className={`flex flex-col max-w-full min-w-0 w-full ${
        isSeparated 
          ? "border border-slate-200 rounded-lg p-3 bg-slate-50/50 mt-1 shadow-sm break-inside-avoid" 
          : "mt-4 pt-3 border-t border-dashed"
      }`} 
      style={{ borderColor: isSeparated ? undefined : color }}
    >
      {isSeparated && (
        <div className="text-[10pt] font-bold mb-2 pb-1 border-b border-slate-200 flex items-center gap-1.5" style={{ color: color }}>
          <span className="inline-block w-1.5 h-3 rounded-[2px]" style={{ backgroundColor: color }}></span>
          {q.teacherQuestionNo}번 정답·해설
        </div>
      )}
      
      {/* 정답 노출 */}
      <div className="text-[9.5pt] font-bold mb-1.5 flex items-center gap-1.5">
        <span className="text-slate-500 font-semibold text-[9pt]">정답 :</span>
        <span style={{ color }} dangerouslySetInnerHTML={{ __html: parseAndRenderMath(displayAnswer) }} />
      </div>
      
      {/* 해설 내용 노출 */}
      {cleanExplanation && (
        <div 
          className="text-[9.5pt] text-gray-700 leading-relaxed max-w-full min-w-0 overflow-hidden [&_table]:!max-w-full [&_table]:w-full [&_table]:table-fixed mt-1" 
          dangerouslySetInnerHTML={{ __html: parseAndRenderMath(cleanExplanation) }} 
        />
      )}

      {/* 해설 이미지 노출 (해설 내용 아래에 정렬하여 표시) */}
      {extractedImages.map((imgHtml, idx) => (
        <div 
          key={idx}
          className="mt-2 flex justify-center max-w-full min-w-0 overflow-hidden [&_img]:!max-w-full [&_img]:!h-auto [&_img]:object-contain border rounded p-1 bg-white"
          dangerouslySetInnerHTML={{ __html: imgHtml }}
          onLoad={onImageLoad}
        />
      ))}
    </div>
  );
};

// ── 3. 통합 매개 컴포넌트 ──
export const QuestionContent = ({ q, printType, task, color, fontSize, onImageLoad, scaleDownChoices, itemType = "all" }: any) => {
  if (itemType === "question") {
    return (
      <QuestionBody 
        q={q} 
        color={color} 
        fontSize={fontSize} 
        onImageLoad={onImageLoad} 
        scaleDownChoices={scaleDownChoices} 
      />
    );
  }

  if (itemType === "explanation") {
    return (
      <QuestionExplanation 
        q={q} 
        color={color} 
        fontSize={fontSize} 
        isSeparated={true} 
        onImageLoad={onImageLoad} 
      />
    );
  }

  // 기본값 "all" (학생용 및 단일 렌더링용)
  return (
    <div className="max-w-full min-w-0 overflow-hidden flex flex-col">
      <QuestionBody 
        q={q} 
        color={color} 
        fontSize={fontSize} 
        onImageLoad={onImageLoad} 
        scaleDownChoices={scaleDownChoices} 
      />
      {printType === "teacher" && (
        <QuestionExplanation 
          q={q} 
          color={color} 
          fontSize={fontSize} 
          isSeparated={false} 
          onImageLoad={onImageLoad} 
        />
      )}
    </div>
  );
};

export default function PrintPreviewPanel({
  task, isBlocked, blockMessage, printType, previewStudentId, activeStudents,
  color, split, pageMargin, problemGap, fontSize, showClass, showName, showDate, showUnit, showLogo,
  printTarget = "all", selectedStudentIds = [], setPreviewStudentId,
  answerOnlyMode = false, isStudentView = false
}: Props) {
  
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [zoom, setZoom] = React.useState<number>(isStudentView ? 1 : 0);
  const [pages, setPages] = React.useState<PageData[]>([]);
  const [triggerMeasure, setTriggerMeasure] = React.useState(0);
  const [scaleDownIds, setScaleDownIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const questions = React.useMemo(() => {
    if (task.totalProblems === 0) return [];
    const sourceSamples = task.subject === "science" ? SCIENCE_PRINT_SAMPLES : MATH_PRINT_SAMPLES;
    const list: (PrintQuestion & { studentQuestionNo?: number; teacherQuestionNo?: number })[] = [];
    
    for (let i = 0; i < task.totalProblems; i++) {
      const q = sourceSamples[i % sourceSamples.length];
      list.push({
        ...q,
        id: `${q.id}-${i}`,
        teacherQuestionNo: i + 1,
        studentQuestionNo: i + 1,
      });
    }
    return list;
  }, [task]);

  const isStudentSelectable = React.useCallback((studentId: string) => {
    if (!task) return false;
    if (task.problemMode !== "relearn") return true;
    if (!task.selectedTypes || task.selectedTypes.length === 0) return false;
    
    // 1. 기존의 이력 기반 재학습 판정 시도
    const hasRelearn = task.selectedTypes.some(t => {
      const cleanTypeId = t.typeId.replace(/-(basic|skill|advanced)$/, "");
      const status = evaluateStudentAchievement(studentId, cleanTypeId, task.subject || "math");
      return status === "relearn";
    });
    if (hasRelearn) return true;

    // 2. 프로토타입 시연 및 테스트를 위한 60% 상시 허용 폴백
    const num = parseInt(studentId.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) {
      return (num % 5) < 3;
    }

    return ["s1", "s2", "student-1", "student-2"].includes(studentId);
  }, [task]);

  // Determine target students for accumulated printing
  const targetStudents = React.useMemo(() => {
    if (task.problemMode !== "individual" && task.problemMode !== "relearn") {
      // 동일 문제 출제인 경우: 단일 출력
      return [null];
    }
    let candidates = activeStudents;
    if (task.problemMode === "relearn") {
      candidates = activeStudents.filter(
        s => 
          ((s as any).assignedQuestionIds && (s as any).assignedQuestionIds.length > 0) ||
          ((s.problemCount ?? 0) > 0) ||
          isStudentSelectable(s.studentId)
      );
    }
    if (printTarget === "selected") {
      return candidates.filter(s => selectedStudentIds.includes(s.studentId));
    }
    return candidates; // 전체 학생
  }, [task.problemMode, printTarget, selectedStudentIds, JSON.stringify(activeStudents), isStudentSelectable]);

  // Preview Student options for the top control bar select
  const previewStudentOptions = React.useMemo(() => {
    const isIndividualOrRelearn = task.problemMode === "individual" || task.problemMode === "relearn";
    if (!isIndividualOrRelearn || activeStudents.length === 0) return [];
    
    let candidates = activeStudents;
    if (task.problemMode === "relearn") {
      candidates = activeStudents.filter(
        s => 
          ((s as any).assignedQuestionIds && (s as any).assignedQuestionIds.length > 0) ||
          ((s.problemCount ?? 0) > 0) ||
          isStudentSelectable(s.studentId)
      );
    }
    if (printTarget === "selected") {
      return candidates.filter(s => selectedStudentIds.includes(s.studentId));
    }
    return candidates;
  }, [task.problemMode, printTarget, activeStudents, selectedStudentIds, isStudentSelectable]);

  let gridColsClass = "grid-cols-2"; // 항상 2단

  // Re-measure when config changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTriggerMeasure(t => t + 1);
    }, 150);
    return () => clearTimeout(timer);
  }, [questions, split, pageMargin, problemGap, fontSize, showClass, showName, showDate, showUnit, showLogo, printType]);

  // 이미지 로딩 및 수식 렌더링 완료 후 다단 배치 실시간 재계산 감지 로직
  React.useEffect(() => {
    if (!mounted) return;
    
    const container = document.getElementById('measure-container');
    if (!container) return;

    let timer: any = null;
    const safeTrigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setTriggerMeasure(t => t + 1);
      }, 100);
    };

    const handleImgLoad = () => {
      safeTrigger();
    };

    // 1. 이미 존재하는 이미지들 중 로드 대기/완료 처리
    const imgs = container.querySelectorAll('img');
    imgs.forEach(img => {
      if ((img as HTMLImageElement).complete) {
        // 이미 완료된 이미지도 높이 반영을 위해 1회 재계산 트리거
        safeTrigger();
      } else {
        img.addEventListener('load', handleImgLoad);
      }
    });

    // 2. 동적으로 주입되는 이미지 및 수식 마크업 변화 감지
    const observer = new MutationObserver((mutations) => {
      let changed = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              const newImgs = el.tagName === 'IMG' ? [el] : Array.from(el.querySelectorAll('img'));
              if (newImgs.length > 0) {
                newImgs.forEach(img => {
                  if ((img as HTMLImageElement).complete) {
                    safeTrigger();
                  } else {
                    img.addEventListener('load', handleImgLoad);
                  }
                });
                changed = true;
              }
              // 수식 등으로 DOM 내용이 바뀐 경우에도 높이 재측정 트리거
              if (el.classList.contains('math') || el.querySelector('.italic')) {
                changed = true;
              }
            }
          });
          changed = true;
        }
      });
      if (changed) {
        safeTrigger();
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true
    });

    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
      const currentImgs = container.querySelectorAll('img');
      currentImgs.forEach(img => {
        img.removeEventListener('load', handleImgLoad);
      });
    };
  }, [mounted, questions]);

  // Actual auto-pagination logic over target students
  React.useEffect(() => {
    if (questions.length === 0) {
      setPages([]);
      return;
    }
    
    // 1mm = 3.779527559px
    const mmToPx = 3.779527559;
    const pageHeightPx = 297 * mmToPx;
    const marginPx = pageMargin * mmToPx;
    const gapPx = problemGap * mmToPx;
    
    const headerEl = document.getElementById('measure-header');
    const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 0;

    const shortHeaderEl = document.getElementById('measure-header-short');
    const shortHeaderHeight = shortHeaderEl ? shortHeaderEl.getBoundingClientRect().height : 0;
    
    let maxItemsPerColumn = 9999; // 기본
    if (split === "2") maxItemsPerColumn = 1;
    else if (split === "4") maxItemsPerColumn = 2;
    else if (split === "6") maxItemsPerColumn = 3;

    // 1단계: 각 문항의 본문 높이를 측정하여 본문 영역 한계를 초과하는 문항이 있는지 스캔
    const newScaleDownIds: string[] = [];
    const isPageOneInitial = true;
    const initialHeaderHeight = isPageOneInitial ? headerHeight : shortHeaderHeight;
    const maxAvailableHeight = pageHeightPx - (marginPx * 2) - initialHeaderHeight - 45;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      let itemHeight = 0;
      
      if (printType === "teacher") {
        // 교사용일 때는 해설 영역 크기 때문에 억울하게 이미지가 줄지 않도록 본문 높이만으로 판정
        const elBody = document.getElementById(`measure-q-body-${q.id}`);
        itemHeight = elBody ? elBody.getBoundingClientRect().height : 0;
      } else {
        // 학생용일 때는 전체 높이로 판정
        const el = document.getElementById(`measure-q-${q.id}`);
        itemHeight = el ? el.getBoundingClientRect().height : 0;
      }

      // 문항의 높이가 1단 전체 최대 가용 높이를 넘어서면 추가 축소 대상으로 등록
      if (itemHeight > maxAvailableHeight) {
        newScaleDownIds.push(q.id);
      }
    }

    // 변경점이 있을 때만 딱 1회 업데이트 (무한 루프 방지)
    const hasScaleChanged = scaleDownIds.length !== newScaleDownIds.length ||
      newScaleDownIds.some(id => !scaleDownIds.includes(id));
    
    if (hasScaleChanged) {
      setScaleDownIds(newScaleDownIds);
      return; // 다음 렌더링에 축소된 높이가 적용되도록 흐름 대기
    }
    
    const allPages: PageData[] = [];

    // Paginate for each target student independently
    targetStudents.forEach((student) => {
      const studentPages: { left: PrintItem[]; right: PrintItem[] }[] = [];
      let currentPageData: { left: PrintItem[]; right: PrintItem[] } = { left: [], right: [] };
      let currentColumn: 'left' | 'right' = 'left';
      let currentColumnHeight = 0;

      // 헬퍼: 다음 단(또는 다음 페이지)으로 슬롯 전이
      const moveToNextSlot = () => {
        if (currentColumn === 'left') {
          currentColumn = 'right';
          currentColumnHeight = 0;
        } else {
          studentPages.push(currentPageData);
          currentPageData = { left: [], right: [] };
          currentColumn = 'left';
          currentColumnHeight = 0;
        }
      };

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        if (printType === "teacher") {
          if (answerOnlyMode) {
            // ── 정답·해설만 출력 모드: explanation 아이템만 배치 ──
            if (q.explanation || q.answer) {
              const elExp = document.getElementById(`measure-q-exp-${q.id}`);
              const expHeight = elExp ? elExp.getBoundingClientRect().height : 0;

              while (true) {
                const isPageOne = studentPages.length === 0;
                const currentHeaderHeight = isPageOne ? headerHeight : shortHeaderHeight;
                const currentAvailableHeight = pageHeightPx - (marginPx * 2) - currentHeaderHeight - 45;

                const heightWithGap = expHeight + (currentPageData[currentColumn].length > 0 ? gapPx : 0);
                const willExceedHeight = currentColumnHeight + heightWithGap > currentAvailableHeight;
                const willExceedCount = currentPageData[currentColumn].length >= maxItemsPerColumn;

                if (currentPageData[currentColumn].length === 0) {
                  currentPageData[currentColumn].push({ type: 'explanation', question: q });
                  currentColumnHeight += heightWithGap;
                  break;
                }

                if (willExceedHeight || willExceedCount) {
                  moveToNextSlot();
                  continue;
                }

                currentPageData[currentColumn].push({ type: 'explanation', question: q });
                currentColumnHeight += heightWithGap;
                break;
              }
            }
          } else {
          const elBody = document.getElementById(`measure-q-body-${q.id}`);
          const bodyHeight = elBody ? elBody.getBoundingClientRect().height : 0;

          const elExp = document.getElementById(`measure-q-exp-${q.id}`);
          const expHeight = elExp ? elExp.getBoundingClientRect().height : 0;

          // 1. 문항 본문 배치
          while (true) {
            const isPageOne = studentPages.length === 0;
            const currentHeaderHeight = isPageOne ? headerHeight : shortHeaderHeight;
            const currentAvailableHeight = pageHeightPx - (marginPx * 2) - currentHeaderHeight - 45;

            const heightWithGap = bodyHeight + (currentPageData[currentColumn].length > 0 ? gapPx : 0);
            
            const willExceedHeight = currentColumnHeight + heightWithGap > currentAvailableHeight;
            const willExceedCount = currentPageData[currentColumn].length >= maxItemsPerColumn;

            if (currentPageData[currentColumn].length === 0) {
              // 단독 배치는 언제나 강행
              currentPageData[currentColumn].push({ type: 'question', question: q });
              currentColumnHeight += heightWithGap;
              break;
            }

            if (willExceedHeight || willExceedCount) {
              moveToNextSlot();
              continue;
            }

            currentPageData[currentColumn].push({ type: 'question', question: q });
            currentColumnHeight += heightWithGap;
            break;
          }

          // 해설 정보가 실존할 때만 해설 배치 실행
          if (q.explanation || q.answer) {
            // 2. 정답·해설 배치
            while (true) {
              const isPageOne = studentPages.length === 0;
              const currentHeaderHeight = isPageOne ? headerHeight : shortHeaderHeight;
              const currentAvailableHeight = pageHeightPx - (marginPx * 2) - currentHeaderHeight - 45;

              const heightWithGap = expHeight + (currentPageData[currentColumn].length > 0 ? gapPx : 0);
              
              // 정답/해설은 하나의 통 카드로 다뤄야 하므로 슬롯을 초과하면 다음 슬롯으로 온전히 밀어넘김
              const willExceedHeight = currentColumnHeight + heightWithGap > currentAvailableHeight;
              const willExceedCount = currentPageData[currentColumn].length >= maxItemsPerColumn;

              if (currentPageData[currentColumn].length === 0) {
                // 단독 배치 강행
                currentPageData[currentColumn].push({ type: 'explanation', question: q });
                currentColumnHeight += heightWithGap;
                break;
              }

              if (willExceedHeight || willExceedCount) {
                // 정답·해설이 남은 공간에 들어가지 않는 경우: 다음 단 배치 가능 여부 확인
                // 다음 단에도 들어가지 않는 경우 다음 페이지 좌측 단 상단에 표시
                moveToNextSlot();
                continue;
              }

              currentPageData[currentColumn].push({ type: 'explanation', question: q });
              currentColumnHeight += heightWithGap;
              break;
            }
          }

          } // end else (answerOnlyMode === false)

        } else {
          // ── 학생용 기존 안전 배치 알고리즘 ──
          const el = document.getElementById(`measure-q-${q.id}`);
          const itemHeight = el ? el.getBoundingClientRect().height : 0;

          while (true) {
            const isPageOne = studentPages.length === 0;
            const currentHeaderHeight = isPageOne ? headerHeight : shortHeaderHeight;
            const currentAvailableHeight = pageHeightPx - (marginPx * 2) - currentHeaderHeight - 45;

            const heightWithGap = itemHeight + (currentPageData[currentColumn].length > 0 ? gapPx : 0);
            
            const willExceedHeight = currentColumnHeight + heightWithGap > currentAvailableHeight;
            const willExceedCount = currentPageData[currentColumn].length >= maxItemsPerColumn;

            if (currentPageData[currentColumn].length === 0) {
              currentPageData[currentColumn].push({ type: 'question', question: q });
              currentColumnHeight += heightWithGap;
              break;
            }

            if (willExceedHeight || willExceedCount) {
              moveToNextSlot();
              continue;
            }

            currentPageData[currentColumn].push({ type: 'question', question: q });
            currentColumnHeight += heightWithGap;
            break;
          }
        }
      }
      
      if (currentPageData.left.length > 0 || currentPageData.right.length > 0) {
        studentPages.push(currentPageData);
      }

      // Add to accumulated flat pages list with student context
      studentPages.forEach((p, idx) => {
        allPages.push({
          left: p.left,
          right: p.right,
          student,
          studentPageNo: idx + 1
        });
      });
    });
    
    setPages(allPages);
  }, [triggerMeasure, questions, split, pageMargin, problemGap, JSON.stringify(targetStudents), scaleDownIds, printType, showClass, showUnit, answerOnlyMode]);

  // Preview Student Select Scroll Trigger (조상 컨테이너 스크롤 전파 버그 방지를 위해 직접 scrollTo 제어)
  React.useEffect(() => {
    if (!previewStudentId) return;
    const targetEl = document.getElementById(`student-page-${previewStudentId}`);
    if (targetEl && scrollRef.current) {
      const containerTop = scrollRef.current.getBoundingClientRect().top;
      const targetTop = targetEl.getBoundingClientRect().top;
      const relativeTop = targetTop - containerTop;
      
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollTop + relativeTop,
        behavior: "smooth"
      });
    }
  }, [previewStudentId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const pageEls = el.querySelectorAll('.a4-page-container');
    let maxVisibleArea = 0;
    let mostVisibleIndex = 0;

    pageEls.forEach((pageEl, index) => {
      const rect = pageEl.getBoundingClientRect();
      const visibleHeight = Math.max(0, Math.min(rect.bottom, el.getBoundingClientRect().bottom) - Math.max(rect.top, el.getBoundingClientRect().top));
      if (visibleHeight > maxVisibleArea) {
        maxVisibleArea = visibleHeight;
        mostVisibleIndex = index;
      }
    });

    setCurrentPage(mostVisibleIndex + 1);
  };

  const handleImageLoad = () => {
    setTriggerMeasure(t => t + 1);
  };

  if (isBlocked) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 font-semibold text-sm print:hidden">
        <p className="px-6 py-4 bg-white border border-slate-200/80 rounded-xl shadow-sm">{blockMessage}</p>
      </div>
    );
  }

  const zoomStyle = zoom === 0 
    ? { transform: "scale(var(--fit-scale))", transformOrigin: "top center" }
    : { transform: `scale(${zoom})`, transformOrigin: "top center" };

  return (
    <div className="flex flex-col h-full print:h-auto relative">
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
          /* body의 직계 자식 중 인쇄 전용 DOM을 제외한 앱 레이아웃 숨김 처리 */
          body > :not(.print-only-root) {
            display: none !important;
          }
        }
        /* 화면 미리보기 및 인쇄 공통 A4 페이지 고정 및 shrink 방지 */
        .a4-page-container {
          width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          flex-shrink: 0 !important;
          box-sizing: border-box !important;
        }
      `}</style>
      
      <div className="absolute top-0 left-[-9999px] invisible pointer-events-none" aria-hidden="true">
        <div id="measure-container" style={{ width: '210mm', padding: `${pageMargin}mm`, boxSizing: 'border-box' }}>
          <div id="measure-header">
            <PageHeader task={task} color={color} showClass={showClass} showName={showName} showDate={showDate} showUnit={showUnit} showLogo={showLogo} previewStudent={activeStudents.find(s => s.studentId === previewStudentId) || (isStudentView ? activeStudents[0] : null)} printType={printType} isStudentView={isStudentView} />
          </div>
          <div id="measure-header-short">
            <AbbreviatedPageHeader task={task} color={color} printType={printType} />
          </div>
          
          {/* 단일 컬럼 수직 배치로 CSS stretch 격자 왜곡 원천 차단 */}
          <div className="flex flex-col gap-4" style={{ width: '100%' }}>
            {questions.map((q) => {
              // 실제 컬럼 너비 정확히 산출: 좌우 다단 간격은 시험지 표준 8mm로 고정
              const singleColumnWidth = `calc((100% - 8mm) / 2)`;
              
              if (printType === "teacher") {
                return (
                  <React.Fragment key={`measure-frag-${q.id}`}>
                    {/* 교사용 본문 측정 - answerOnlyMode에서는 숨김 처리하되 DOM은 유지 */}
                    <div
                      id={`measure-q-body-${q.id}`}
                      className="flex flex-col bg-white"
                      style={{
                        width: singleColumnWidth,
                        maxWidth: singleColumnWidth,
                        boxSizing: 'border-box',
                        ...(answerOnlyMode ? { visibility: 'hidden', position: 'absolute', pointerEvents: 'none' } : {})
                      }}
                    >
                       <QuestionContent q={q} printType={printType} task={task} color={color} fontSize={fontSize} onImageLoad={handleImageLoad} scaleDownChoices={scaleDownIds.includes(q.id)} itemType="question" />
                    </div>

                    {/* 교사용 정답·해설 측정 */}
                    <div
                      id={`measure-q-exp-${q.id}`}
                      className="flex flex-col bg-white"
                      style={{
                        width: singleColumnWidth,
                        maxWidth: singleColumnWidth,
                        boxSizing: 'border-box'
                      }}
                    >
                       <QuestionContent q={q} printType={printType} task={task} color={color} fontSize={fontSize} onImageLoad={handleImageLoad} itemType="explanation" />
                    </div>
                  </React.Fragment>
                );
              }
              
              // 학생용 모드 (기존 1개로 측정)
              return (
                <div 
                  key={`measure-${q.id}`} 
                  id={`measure-q-${q.id}`} 
                  className="flex flex-col bg-white"
                  style={{ 
                     width: singleColumnWidth,
                     maxWidth: singleColumnWidth,
                     boxSizing: 'border-box'
                  }}
                >
                   <QuestionContent q={q} printType={printType} task={task} color={color} fontSize={fontSize} onImageLoad={handleImageLoad} scaleDownChoices={scaleDownIds.includes(q.id)} itemType="all" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* ── 측정용 숨김 컨테이너 끝 ── */}

      {/* 뷰어 헤더 (화면용 컨트롤 영역) */}
      {!isStudentView && (
        <div className="flex items-center justify-between px-5 py-3 bg-white/95 backdrop-blur-[2px] border-b border-slate-200/80 shrink-0 print:hidden z-20">
          <div className="flex items-center gap-3.5 ml-auto">
            {/* 미리보기 학생 select */}
            {(task.problemMode === "individual" || task.problemMode === "relearn") && previewStudentOptions.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-semibold whitespace-nowrap">미리보기 학생</span>
                <select
                  value={previewStudentId}
                  onChange={(e) => {
                    if (setPreviewStudentId) {
                      setPreviewStudentId(e.target.value);
                    }
                  }}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white font-semibold text-slate-700 min-w-[100px] outline-none hover:border-slate-300 transition-all focus:ring-1 focus:ring-primary/20"
                >
                  {previewStudentOptions.map(s => (
                    <option key={s.studentId} value={s.studentId}>{s.studentName}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 페이지 정보 */}
            <div className="flex items-center gap-1 text-xs bg-slate-100 rounded-lg px-2.5 py-1 whitespace-nowrap font-semibold text-slate-600">
              <span>{currentPage}</span>
              <span className="text-gray-400">/</span>
              <span>{pages.length > 0 ? pages.length : 1}</span>
            </div>

            {/* 확대 축소 */}
            <select 
              value={zoom} 
              onChange={(e) => setZoom(Number(e.target.value))}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white font-semibold text-slate-600 outline-none hover:border-slate-300 transition-all focus:ring-1 focus:ring-primary/20"
            >
              <option value={0}>화면 맞춤</option>
              <option value={0.75}>75%</option>
              <option value={1}>100%</option>
              <option value={1.25}>125%</option>
            </select>
          </div>
        </div>
      )}

      {/* 뷰어 영역 (화면용) */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-slate-100 relative print:hidden custom-scrollbar flex justify-center py-4"
        style={{"--fit-scale": "0.65"} as any}
      >
        <div className="flex flex-col gap-8 shadow-md" style={zoomStyle}>
          {pages.map((pageQuestions, pIndex) => (
            <div 
              key={pIndex} 
              id={pageQuestions.student && pageQuestions.studentPageNo === 1 ? `student-page-${pageQuestions.student.studentId}` : undefined}
              className="a4-page-container flex flex-col bg-white relative mx-auto shrink-0"
              style={{
                width: '210mm',
                height: '297mm',
                minHeight: '297mm',
                maxHeight: '297mm',
                paddingTop: `${pageMargin}mm`,
                paddingLeft: `${pageMargin}mm`,
                paddingRight: `${pageMargin}mm`,
                paddingBottom: `calc(${pageMargin}mm + 30px)`,
                boxSizing: 'border-box',
                pageBreakAfter: pIndex === pages.length - 1 ? 'auto' : 'always',
                pageBreakInside: 'avoid',
                flexShrink: 0
              }}
            >
              {pageQuestions.studentPageNo === 1 ? (
                <PageHeader task={task} color={color} showClass={showClass} showName={showName} showDate={showDate} showUnit={showUnit} showLogo={showLogo} previewStudent={pageQuestions.student || (isStudentView ? activeStudents[0] : null)} printType={printType} isStudentView={isStudentView} />
              ) : (
                <AbbreviatedPageHeader task={task} color={color} printType={printType} />
              )}

              <div className="flex flex-1 relative min-w-0" style={{ gap: '8mm' }}>
                <div className="absolute top-0 bottom-0 left-1/2 border-l border-gray-300 z-20" style={{ transform: "translateX(-50%)" }} />
                <div 
                  className="flex-1 flex flex-col z-10 min-w-0 flex-shrink-0" 
                  style={{ 
                    gap: `${problemGap}mm`,
                    width: 'calc(50% - 4mm)',
                    maxWidth: 'calc(50% - 4mm)'
                  }}
                >
                  {(pageQuestions?.left || []).map((qItem) => (
                    <div key={`${qItem.question.id}-${qItem.type}`} className="flex flex-col break-inside-avoid bg-white w-full max-w-full min-w-0 overflow-hidden">
                      <QuestionContent 
                        q={qItem.question} 
                        printType={printType} 
                        task={task} 
                        color={color} 
                        fontSize={fontSize} 
                        onImageLoad={undefined} 
                        scaleDownChoices={scaleDownIds.includes(qItem.question.id)} 
                        itemType={qItem.type}
                      />
                    </div>
                  ))}
                </div>
                <div 
                  className="flex-1 flex flex-col z-10 min-w-0 flex-shrink-0" 
                  style={{ 
                    gap: `${problemGap}mm`,
                    width: 'calc(50% - 4mm)',
                    maxWidth: 'calc(50% - 4mm)'
                  }}
                >
                  {(pageQuestions?.right || []).map((qItem) => (
                    <div key={`${qItem.question.id}-${qItem.type}`} className="flex flex-col break-inside-avoid bg-white w-full max-w-full min-w-0 overflow-hidden">
                      <QuestionContent 
                        q={qItem.question} 
                        printType={printType} 
                        task={task} 
                        color={color} 
                        fontSize={fontSize} 
                        onImageLoad={undefined} 
                        scaleDownChoices={scaleDownIds.includes(qItem.question.id)} 
                        itemType={qItem.type}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div 
                className="absolute flex justify-between items-center text-[10pt] text-gray-400 border-t border-gray-100 pt-2 shrink-0"
                style={{
                  bottom: `${pageMargin}mm`,
                  left: `${pageMargin}mm`,
                  right: `${pageMargin}mm`,
                  height: '25px',
                  boxSizing: 'border-box'
                }}
              >
                <span>리딩{task.subject === "math" ? "수학" : "과학"}</span>
                <span>{pIndex + 1} / {pages.length}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 인쇄 전용 영역 (React Portal) */}
      {mounted && createPortal(
        <div className="print-only-root hidden print:block absolute top-0 left-0 m-0 p-0 bg-white z-[9999]">
          {pages.map((pageQuestions, pIndex) => (
            <div 
              key={`print-${pIndex}`} 
              className="a4-page-container flex flex-col bg-white relative m-0 shrink-0"
              style={{
                width: '210mm',
                height: '297mm',
                minHeight: '297mm',
                maxHeight: '297mm',
                paddingTop: `${pageMargin}mm`,
                paddingLeft: `${pageMargin}mm`,
                paddingRight: `${pageMargin}mm`,
                paddingBottom: `calc(${pageMargin}mm + 30px)`,
                boxSizing: 'border-box',
                pageBreakAfter: pIndex === pages.length - 1 ? 'auto' : 'always',
                pageBreakInside: 'avoid',
                flexShrink: 0
              }}
            >
              {pageQuestions.studentPageNo === 1 ? (
                <PageHeader task={task} color={color} showClass={showClass} showName={showName} showDate={showDate} showUnit={showUnit} showLogo={showLogo} previewStudent={pageQuestions.student || (isStudentView ? activeStudents[0] : null)} printType={printType} isStudentView={isStudentView} />
              ) : (
                <AbbreviatedPageHeader task={task} color={color} printType={printType} />
              )}

              <div className="flex flex-1 relative min-w-0" style={{ gap: '8mm' }}>
                <div className="absolute top-0 bottom-0 left-1/2 border-l border-gray-300 z-20" style={{ transform: "translateX(-50%)" }} />
                <div 
                  className="flex-1 flex flex-col z-10 min-w-0 flex-shrink-0" 
                  style={{ 
                    gap: `${problemGap}mm`,
                    width: 'calc(50% - 4mm)',
                    maxWidth: 'calc(50% - 4mm)'
                  }}
                >
                  {(pageQuestions?.left || []).map((qItem) => (
                    <div key={`p-${qItem.question.id}-${qItem.type}`} className="flex flex-col break-inside-avoid bg-white w-full max-w-full min-w-0 overflow-hidden">
                      <QuestionContent 
                        q={qItem.question} 
                        printType={printType} 
                        task={task} 
                        color={color} 
                        fontSize={fontSize} 
                        onImageLoad={undefined} 
                        scaleDownChoices={scaleDownIds.includes(qItem.question.id)} 
                        itemType={qItem.type}
                      />
                    </div>
                  ))}
                </div>
                <div 
                  className="flex-1 flex flex-col z-10 min-w-0 flex-shrink-0" 
                  style={{ 
                    gap: `${problemGap}mm`,
                    width: 'calc(50% - 4mm)',
                    maxWidth: 'calc(50% - 4mm)'
                  }}
                >
                  {(pageQuestions?.right || []).map((qItem) => (
                    <div key={`p-${qItem.question.id}-${qItem.type}`} className="flex flex-col break-inside-avoid bg-white w-full max-w-full min-w-0 overflow-hidden">
                      <QuestionContent 
                        q={qItem.question} 
                        printType={printType} 
                        task={task} 
                        color={color} 
                        fontSize={fontSize} 
                        onImageLoad={undefined} 
                        scaleDownChoices={scaleDownIds.includes(qItem.question.id)} 
                        itemType={qItem.type}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div 
                className="absolute flex justify-between items-center text-[10pt] text-gray-400 border-t border-gray-100 pt-2 shrink-0"
                style={{
                  bottom: `${pageMargin}mm`,
                  left: `${pageMargin}mm`,
                  right: `${pageMargin}mm`,
                  height: '25px',
                  boxSizing: 'border-box'
                }}
              >
                <span>리딩{task.subject === "math" ? "수학" : "과학"}</span>
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
