"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { TaskItem, StudentAssignment } from "@/lib/task-center-mock";
import { MATH_PRINT_SAMPLES, SCIENCE_PRINT_SAMPLES, PrintQuestion } from "@/lib/task-print-sample-mock";
import { PrintColor } from "./task-print-view";

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
  showName: boolean;
  showDate: boolean;
  showLogo: boolean;
  printTarget?: "all" | "selected";
  selectedStudentIds?: string[];
  setPreviewStudentId?: (id: string) => void;
}

interface PageData {
  left: PrintQuestion[];
  right: PrintQuestion[];
  student: StudentAssignment | null;
  studentPageNo: number;
}

const PageHeader = ({ task, color, showName, showDate, showLogo, previewStudent }: any) => {
  // 테마 색상에 투명도 30% 적용 (HEX 8자리)
  const borderColor = color.length === 7 ? `${color}4D` : color;
  
  return (
    <div className="mb-4 shrink-0">
      <h2 className="text-[13pt] font-bold truncate mb-2" style={{ color }}>{task.name}</h2>
      <div className="flex justify-between items-end pb-2 border-b" style={{ borderColor }}>
        <div className="text-[11pt] text-gray-700 flex gap-6">
          {showName && (
            <span>이름: {task.problemMode === "individual" && previewStudent?.studentName ? previewStudent.studentName : "__________"}</span>
          )}
          {showDate && (
            <span>날짜: {new Date().toLocaleDateString('ko-KR')}</span>
          )}
        </div>
        {showLogo && (
          <div className="h-[20px] flex items-center">
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

const AbbreviatedPageHeader = ({ task, color }: any) => {
  // 테마 색상에 투명도 30% 적용 (HEX 8자리)
  const borderColor = color.length === 7 ? `${color}4D` : color;
  
  return (
    <div className="mb-3 shrink-0">
      <div className="flex justify-between items-center pb-1 border-b" style={{ borderColor }}>
        <h2 className="text-[10pt] font-bold truncate max-w-[85%]" style={{ color }}>{task.name}</h2>
        <span className="text-[8pt] text-gray-400 font-medium shrink-0">
          리딩{task.subject === "math" ? "수학" : "과학"}
        </span>
      </div>
    </div>
  );
};

const QuestionContent = ({ q, printType, task, color, fontSize, onImageLoad }: any) => {
  let displayAnswer = q.answer;
  if (q.choices && q.choices.length > 0) {
    const choiceIndex = q.choices.indexOf(q.answer);
    if (choiceIndex !== -1) {
      displayAnswer = ['①','②','③','④','⑤'][choiceIndex];
    }
  }

  return (
    <>
      <div className="flex items-start gap-2 mb-2 font-bold" style={{ fontSize: `${fontSize}pt` }}>
        <span style={{ color }}>{q.teacherQuestionNo}.</span>
        <div dangerouslySetInnerHTML={{ __html: q.stem }} className="leading-snug" />
      </div>

      {q.passage && (
        <div className="border p-3 rounded mb-3 text-gray-800 leading-relaxed bg-white" style={{ fontSize: `${fontSize - 1}pt` }}>
          <div dangerouslySetInnerHTML={{ __html: q.passage.replace(/\n/g, '<br/>') }} />
        </div>
      )}

      {q.image && (
        <div className="mb-3 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={q.image} 
            alt="문제 이미지" 
            className="max-w-full h-auto max-h-[150px] object-contain border rounded p-1" 
            onLoad={onImageLoad}
          />
        </div>
      )}

      <div className="flex flex-col gap-1 mt-2 text-gray-700" style={{ fontSize: `${fontSize - 1}pt` }}>
        {q.choices.map((choice: string, i: number) => (
          <div key={i} className="flex items-start gap-2">
            <span className="shrink-0">{['①','②','③','④','⑤'][i]}</span>
            <span dangerouslySetInnerHTML={{ __html: choice }} />
          </div>
        ))}
      </div>

      {printType === "teacher" && (
        <div className="mt-4 pt-3 border-t border-dashed" style={{ borderColor: color }}>
          <div className="text-sm font-bold mb-1" style={{ color: color }}>정답: {displayAnswer}</div>
          <div className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.explanation }} />
        </div>
      )}
    </>
  );
};

export default function PrintPreviewPanel({
  task, isBlocked, blockMessage, printType, previewStudentId, activeStudents,
  color, split, pageMargin, problemGap, fontSize, showName, showDate, showLogo,
  printTarget = "all", selectedStudentIds = [], setPreviewStudentId
}: Props) {
  
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [zoom, setZoom] = React.useState<number>(0);
  const [pages, setPages] = React.useState<PageData[]>([]);
  const [triggerMeasure, setTriggerMeasure] = React.useState(0);

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

  // Determine target students for accumulated printing
  const targetStudents = React.useMemo(() => {
    if (task.problemMode !== "individual") {
      // 동일 문제 출제인 경우: 단일 출력
      return [null];
    }
    if (printTarget === "selected") {
      return activeStudents.filter(s => selectedStudentIds.includes(s.studentId));
    }
    return activeStudents; // 전체 학생
  }, [task.problemMode, printTarget, selectedStudentIds, activeStudents]);

  // Preview Student options for the top control bar select
  const previewStudentOptions = React.useMemo(() => {
    if (task.problemMode !== "individual" || activeStudents.length === 0) return [];
    if (printTarget === "selected") {
      return activeStudents.filter(s => selectedStudentIds.includes(s.studentId));
    }
    return activeStudents;
  }, [task.problemMode, printTarget, activeStudents, selectedStudentIds]);

  let gridColsClass = "grid-cols-2"; // 항상 2단

  // Re-measure when config changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTriggerMeasure(t => t + 1);
    }, 150);
    return () => clearTimeout(timer);
  }, [questions, split, pageMargin, problemGap, fontSize, showName, showDate, showLogo, printType]);

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
    
    const allPages: PageData[] = [];

    // Paginate for each target student independently
    targetStudents.forEach((student) => {
      const studentPages: { left: PrintQuestion[]; right: PrintQuestion[] }[] = [];
      let currentPageData: { left: PrintQuestion[]; right: PrintQuestion[] } = { left: [], right: [] };
      let currentColumn: 'left' | 'right' = 'left';
      let currentColumnHeight = 0;

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        const el = document.getElementById(`measure-q-${q.id}`);
        const itemHeight = el ? el.getBoundingClientRect().height : 0;

        while (true) {
          const isPageOne = studentPages.length === 0;
          const currentHeaderHeight = isPageOne ? headerHeight : shortHeaderHeight;

          // 20px buffer to prevent unexpected overflow
          const currentAvailableHeight = pageHeightPx - (marginPx * 2) - currentHeaderHeight - 20;

          const heightWithGap = itemHeight + (currentPageData[currentColumn].length > 0 ? gapPx : 0);
          
          const willExceedHeight = currentColumnHeight + heightWithGap > currentAvailableHeight;
          const willExceedCount = currentPageData[currentColumn].length >= maxItemsPerColumn;

          // 예외 처리: 현재 단이 비어있다면, 단독 배치를 위해 가용 높이를 초과하더라도 무조건 넣습니다.
          if (currentPageData[currentColumn].length === 0) {
            currentPageData[currentColumn].push(q);
            currentColumnHeight += heightWithGap;
            break; // 배치 완료
          }

          // 제한 조건을 초과하면 다음 단(슬롯)으로 이동
          if (willExceedHeight || willExceedCount) {
            if (currentColumn === 'left') {
              currentColumn = 'right';
              currentColumnHeight = 0;
            } else {
              // 우측 단도 가득 찼으면 다음 페이지로 넘김
              studentPages.push(currentPageData);
              currentPageData = { left: [], right: [] };
              currentColumn = 'left';
              currentColumnHeight = 0;
            }
            continue; // 이동한 슬롯에서 현재 문항을 다시 배치 시도
          }

          // 정상 배치
          currentPageData[currentColumn].push(q);
          currentColumnHeight += heightWithGap;
          break; // 배치 완료
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
  }, [triggerMeasure, questions, split, pageMargin, problemGap, targetStudents]);

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
      
      {/* ── 측정용 숨김 컨테이너 ── */}
      <div className="absolute top-0 left-[-9999px] invisible pointer-events-none" aria-hidden="true">
        <div id="measure-container" style={{ width: '210mm', padding: `${pageMargin}mm`, boxSizing: 'border-box' }}>
          <div id="measure-header">
            <PageHeader task={task} color={color} showName={showName} showDate={showDate} showLogo={showLogo} previewStudent={null} />
          </div>
          <div id="measure-header-short">
            <AbbreviatedPageHeader task={task} color={color} />
          </div>
          <div className={`grid ${gridColsClass}`} style={{ gap: `${problemGap}mm` }}>
            {questions.map((q) => (
              <div key={`measure-${q.id}`} id={`measure-q-${q.id}`} className="flex flex-col break-inside-avoid">
                 <QuestionContent q={q} printType={printType} task={task} color={color} fontSize={fontSize} onImageLoad={handleImageLoad} />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* ── 측정용 숨김 컨테이너 끝 ── */}

      {/* 뷰어 헤더 (화면용 컨트롤 영역) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-3 bg-white/95 backdrop-blur-[2px] border-b border-slate-200/80 gap-3 shrink-0 print:hidden z-20">
        <div className="flex flex-col">
          <h3 className="font-bold text-gray-900 text-[11pt]">과제 출력 미리보기</h3>
          <p className="text-xs text-gray-400 mt-0.5">브라우저와 프린터 설정에 따라 실제 인쇄 결과와 일부 차이가 있을 수 있습니다. PDF 저장은 브라우저 인쇄창에서 대상을 PDF로 선택해 저장합니다.</p>
        </div>
        <div className="flex items-center gap-3.5 ml-auto">
          {/* 미리보기 학생 select */}
          {task.problemMode === "individual" && previewStudentOptions.length > 0 && (
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

      {/* 뷰어 영역 (화면용) */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-slate-100 relative print:hidden custom-scrollbar flex justify-center py-8"
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
                padding: `${pageMargin}mm`,
                boxSizing: 'border-box',
                pageBreakAfter: pIndex === pages.length - 1 ? 'auto' : 'always',
                pageBreakInside: 'avoid',
                flexShrink: 0
              }}
            >
              {pageQuestions.studentPageNo === 1 ? (
                <PageHeader task={task} color={color} showName={showName} showDate={showDate} showLogo={showLogo} previewStudent={pageQuestions.student} />
              ) : (
                <AbbreviatedPageHeader task={task} color={color} />
              )}

              <div className="flex flex-1 relative" style={{ gap: `${problemGap}mm` }}>
                <div className="absolute top-0 bottom-0 left-1/2 border-l border-gray-300" style={{ transform: "translateX(-50%)" }} />
                <div className="flex-1 flex flex-col z-10" style={{ gap: `${problemGap}mm` }}>
                  {(pageQuestions?.left || []).map((q) => (
                    <div key={q.id} className="flex flex-col break-inside-avoid bg-white">
                      <QuestionContent q={q} printType={printType} task={task} color={color} fontSize={fontSize} onImageLoad={undefined} />
                    </div>
                  ))}
                </div>
                <div className="flex-1 flex flex-col z-10" style={{ gap: `${problemGap}mm` }}>
                  {(pageQuestions?.right || []).map((q) => (
                    <div key={q.id} className="flex flex-col break-inside-avoid bg-white">
                      <QuestionContent q={q} printType={printType} task={task} color={color} fontSize={fontSize} onImageLoad={undefined} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-[10pt] text-gray-400 mt-4 pt-2 shrink-0">
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
                padding: `${pageMargin}mm`,
                boxSizing: 'border-box',
                pageBreakAfter: pIndex === pages.length - 1 ? 'auto' : 'always',
                pageBreakInside: 'avoid',
                flexShrink: 0
              }}
            >
              {pageQuestions.studentPageNo === 1 ? (
                <PageHeader task={task} color={color} showName={showName} showDate={showDate} showLogo={showLogo} previewStudent={pageQuestions.student} />
              ) : (
                <AbbreviatedPageHeader task={task} color={color} />
              )}

              <div className="flex flex-1 relative" style={{ gap: `${problemGap}mm` }}>
                <div className="absolute top-0 bottom-0 left-1/2 border-l border-gray-300" style={{ transform: "translateX(-50%)" }} />
                <div className="flex-1 flex flex-col z-10" style={{ gap: `${problemGap}mm` }}>
                  {(pageQuestions?.left || []).map((q) => (
                    <div key={`p-${q.id}`} className="flex flex-col break-inside-avoid bg-white">
                      <QuestionContent q={q} printType={printType} task={task} color={color} fontSize={fontSize} onImageLoad={undefined} />
                    </div>
                  ))}
                </div>
                <div className="flex-1 flex flex-col z-10" style={{ gap: `${problemGap}mm` }}>
                  {(pageQuestions?.right || []).map((q) => (
                    <div key={`p-${q.id}`} className="flex flex-col break-inside-avoid bg-white">
                      <QuestionContent q={q} printType={printType} task={task} color={color} fontSize={fontSize} onImageLoad={undefined} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-[10pt] text-gray-400 mt-4 pt-2 shrink-0">
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
