"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTaskCenterStore } from "@/lib/task-center-store";
import { TaskStatusBadge } from "../task-status-badge";
import { ChevronLeft } from "lucide-react";
import PrintSettingPanel from "./print-setting-panel";
import PrintPreviewPanel from "./print-preview-panel";
import PrintBottomBar from "./print-bottom-bar";
import PrintStudentModal from "./print-student-modal";
import { evaluateStudentAchievement } from "@/utils/examPrepStorage";

export type PrintColor = "#002775" | "#4BC8DC" | "#FF9B4E" | "#64C947" | "#F7417A" | "#242424";

interface Props {
  taskId: string;
}

export default function TaskPrintView({ taskId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHqView = searchParams.get("source") === "hq-task-status";
  const isQuestionBankPrint = searchParams.get("source") === "science-question-bank";
  const institutionId = searchParams.get("institutionId") ?? "";
  const questionBankId = searchParams.get("questionBankId") ?? "";
  const questionCount = Math.max(0, Number.parseInt(searchParams.get("questionCount") ?? "0", 10) || 0);
  const course = searchParams.get("course") ?? "";
  const majorUnit = searchParams.get("majorUnit") ?? "";
  const minorUnit = searchParams.get("minorUnit") ?? "";
  const typeName = searchParams.get("typeName") ?? "";
  const detailUrl = isQuestionBankPrint
    ? `/content/science-question-bank/${questionBankId}?tab=questions`
    : `/admin/task-center/${taskId}${
        isHqView
          ? `?source=hq-task-status&institutionId=${encodeURIComponent(institutionId)}`
          : ""
      }`;
  const { tasks } = useTaskCenterStore();
  const storedTask = tasks.find((t) => t.id === taskId);
  const task = React.useMemo(() => {
    if (!isQuestionBankPrint || !storedTask) return storedTask;

    const selectedType = storedTask.selectedTypes[0];
    return {
      ...storedTask,
      subject: "science" as const,
      name: "문제은행 출력 테스트",
      course,
      problemMode: "same" as const,
      onlyImportant: false,
      selectedTypes: selectedType
        ? [{
            ...selectedType,
            curriculumId: `science-question-bank-${questionBankId}`,
            course,
            typeId: `science-question-bank-${questionBankId}`,
            majorUnit,
            minorUnit,
            typeName,
            problemCount: questionCount,
          }]
        : [],
      totalProblems: questionCount,
      assignedStudents: [],
      assignedClasses: [],
      individualStudentIds: [],
    };
  }, [
    course,
    isQuestionBankPrint,
    majorUnit,
    minorUnit,
    questionBankId,
    questionCount,
    storedTask,
    typeName,
  ]);

  // States
  const [printType, setPrintType] = React.useState<"student" | "teacher">("student");
  const [printTarget, setPrintTarget] = React.useState<"all" | "selected">("all");
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<string[]>([]);
  const [previewStudentId, setPreviewStudentId] = React.useState<string>("");
  
  const [color, setColor] = React.useState<PrintColor>("#002775");
  const [split, setSplit] = React.useState<"1" | "2" | "4" | "6">("1");
  const [pageMargin, setPageMargin] = React.useState<number>(10);
  const [problemGap, setProblemGap] = React.useState<number>(16);
  const [fontSize, setFontSize] = React.useState<number>(12);
  
  const [showClass, setShowClass] = React.useState<boolean>(true);
  const [showName, setShowName] = React.useState<boolean>(true);
  const [showDate, setShowDate] = React.useState<boolean>(true);
  const [showUnit, setShowUnit] = React.useState<boolean>(true);
  const [showLogo, setShowLogo] = React.useState<boolean>(true);
  const [answerOnlyMode, setAnswerOnlyMode] = React.useState<boolean>(false);

  const [studentModalOpen, setStudentModalOpen] = React.useState(false);

  // printType이 학생용으로 바뀌면 answerOnlyMode 초기화
  React.useEffect(() => {
    if (printType === "student") {
      setAnswerOnlyMode(false);
    }
  }, [printType]);

  // answerOnlyMode 활성화 시 페이지 분할을 기본(1단)으로 강제 고정
  React.useEffect(() => {
    if (answerOnlyMode) {
      setSplit("1");
    }
  }, [answerOnlyMode]);

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

  // Computed valid students (exclude canceled)
  const validStudents = React.useMemo(() => {
    if (!task) return [];
    return task.assignedStudents.filter(s => s.status !== "not_started" && s.status !== ("canceled" as any)); 
  }, [task]);

  const activeStudents = React.useMemo(() => {
    if (!task) return [];
    const base = task.assignedStudents.filter(s => s.status !== ("canceled" as any));
    if (task.problemMode === "relearn") {
      return base.filter(
        s => 
          ((s as any).assignedQuestionIds && (s as any).assignedQuestionIds.length > 0) ||
          ((s.problemCount ?? 0) > 0) ||
          isStudentSelectable(s.studentId)
      );
    }
    return base;
  }, [task, isStudentSelectable]);

  // Handle initialization of preview student
  React.useEffect(() => {
    if (!task) return;
    const isIndividualOrRelearn = task.problemMode === "individual" || task.problemMode === "relearn";
    if (isIndividualOrRelearn && printType === "student") {
      if (printTarget === "all" && activeStudents.length > 0) {
        setPreviewStudentId(activeStudents[0].studentId);
      } else if (printTarget === "selected" && selectedStudentIds.length > 0) {
        setPreviewStudentId(selectedStudentIds[0]);
      } else {
        setPreviewStudentId("");
      }
    }
  }, [task, printType, printTarget, activeStudents, selectedStudentIds]);

  const handleReset = () => {
    setPrintType("student");
    setPrintTarget("all");
    setSelectedStudentIds([]);
    setColor("#002775");
    setSplit("1");
    setPageMargin(10);
    setProblemGap(16);
    setFontSize(12);
    setShowClass(true);
    setShowName(true);
    setShowDate(true);
    setShowUnit(true);
    setShowLogo(true);
    setAnswerOnlyMode(false);
  };

  const handlePrint = () => {
    // 인쇄 전용 DOM이 최신 상태로 렌더링될 수 있도록 약간의 지연 후 실행
    setTimeout(() => {
      const originalTitle = document.title;
      const dateStr = new Date().toISOString().replace(/[:\-T]/g, "").slice(0, 13);
      const safeTaskName = task?.name ? task.name.replace(/[/\\?%*:|"<>]/g, '') : '과제출력';
      const suffix = printType === "teacher" ? "_교사용" : "";
      document.title = `${safeTaskName}_${dateStr}${suffix}`;
      window.print();
      document.title = originalTitle;
    }, 100);
  };

  if (!task) {
    return <div className="p-8 text-center">과제를 찾을 수 없습니다.</div>;
  }

  // Block logic
  let blockMessage = "";
  const isIndividualOrRelearn = task.problemMode === "individual" || task.problemMode === "relearn";
  const defaultBlockMsg = task.problemMode === "relearn"
    ? "학생별 재학습 유형 출제 과제는 배정 후 출력할 수 있습니다."
    : "학생별 문제 출제 과제는 배정 후 출력할 수 있습니다.";

  if (task.status === "draft" && isIndividualOrRelearn) {
    blockMessage = defaultBlockMsg;
  } else if (task.totalProblems === 0) {
    blockMessage = "출력할 문제가 없습니다.";
  } else if (isIndividualOrRelearn && printType === "student" && printTarget === "selected" && selectedStudentIds.length === 0) {
    blockMessage = "출력할 학생을 선택해 주세요.";
  } else if (isIndividualOrRelearn && activeStudents.length === 0) {
    blockMessage = defaultBlockMsg;
  }
  
  const isBlocked = blockMessage !== "";

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 print:bg-white print:pb-0">
      {/* ── 상단 영역 ── */}
      <div className="px-6 pt-5 pb-4 bg-white border-b border-slate-200/80 print:hidden">
        <button
          onClick={() => router.push(detailUrl)}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          뒤로가기
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-[1.5rem] font-bold text-gray-900">과제 출력</h1>
          <TaskStatusBadge status={task.status} />
        </div>
      </div>

      {/* ── 과제 정보 영역 ── */}
      <div className="px-6 py-4 bg-white border-b border-slate-200/80 print:hidden">
        <div className="flex items-start gap-x-8 text-sm">
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-gray-500 text-xs mb-1 whitespace-nowrap">과제명</span>
            <span className="font-medium text-gray-900 truncate" title={task.name}>{task.name}</span>
          </div>
          <div className="flex flex-col shrink-0">
            <span className="text-gray-500 text-xs mb-1 whitespace-nowrap">과목</span>
            <span className="font-medium text-gray-900">{task.subject === "math" ? "수학" : "과학"}</span>
          </div>
          <div className="flex flex-col shrink-0">
            <span className="text-gray-500 text-xs mb-1 whitespace-nowrap">학습과정</span>
            <span className="font-medium text-gray-900">{task.course || "-"}</span>
          </div>
          <div className="flex flex-col shrink-0">
            <span className="text-gray-500 text-xs mb-1 whitespace-nowrap">문제 수</span>
            <span className="font-medium text-gray-900">{getTaskProblemCountText(task)}</span>
          </div>
          <div className="flex flex-col shrink-0">
            <span className="text-gray-500 text-xs mb-1 whitespace-nowrap">문제 구성 방식</span>
            <span className="font-medium text-gray-900">
              {task.problemMode === "same" ? "동일 문제 출제" : task.problemMode === "relearn" ? "학생별 재학습 유형 출제" : "학생별 문제 출제"}
            </span>
          </div>
          <div className="flex flex-col shrink-0">
            <span className="text-gray-500 text-xs mb-1 whitespace-nowrap">대표 문제만 출제</span>
            <span className="font-medium text-gray-900">{task.onlyImportant ? "예" : "아니요"}</span>
          </div>
        </div>
      </div>

      {/* ── 본문 (설정 / 미리보기) ── */}
      <div className="px-6 py-5 h-[calc(100vh-220px)] print:p-0 print:h-auto">
        <div className="flex gap-5 h-full print:block">
          {/* 좌측 설정 영역 */}
          <div className="w-[360px] shrink-0 h-full overflow-y-auto print:hidden">
            <PrintSettingPanel 
              task={task}
              printType={printType} setPrintType={setPrintType}
              printTarget={printTarget} setPrintTarget={setPrintTarget}
              selectedStudentIds={selectedStudentIds}
              previewStudentId={previewStudentId} setPreviewStudentId={setPreviewStudentId}
              color={color} setColor={setColor}
              split={split} setSplit={setSplit}
              pageMargin={pageMargin} setPageMargin={setPageMargin}
              problemGap={problemGap} setProblemGap={setProblemGap}
              fontSize={fontSize} setFontSize={setFontSize}
              showClass={showClass} setShowClass={setShowClass}
              showName={showName} setShowName={setShowName}
              showDate={showDate} setShowDate={setShowDate}
              showUnit={showUnit} setShowUnit={setShowUnit}
              showLogo={showLogo} setShowLogo={setShowLogo}
              onOpenStudentModal={() => setStudentModalOpen(true)}
              activeStudents={activeStudents}
              answerOnlyMode={answerOnlyMode} setAnswerOnlyMode={setAnswerOnlyMode}
            />
          </div>

          {/* 우측 미리보기 영역 */}
          <div className="flex-1 min-w-0 h-full overflow-hidden bg-slate-100 rounded-xl border border-slate-200/80 shadow-inner flex flex-col print:border-none print:bg-white print:rounded-none print:h-auto print:overflow-visible">
            <PrintPreviewPanel 
              task={task}
              isBlocked={isBlocked}
              blockMessage={blockMessage}
              printType={printType}
              previewStudentId={previewStudentId}
              activeStudents={activeStudents}
              color={color}
              split={split}
              pageMargin={pageMargin}
              problemGap={problemGap}
              fontSize={fontSize}
              showClass={showClass}
              showName={showName}
              showDate={showDate}
              showUnit={showUnit}
              showLogo={showLogo}
              printTarget={printTarget}
              selectedStudentIds={selectedStudentIds}
              setPreviewStudentId={setPreviewStudentId}
              answerOnlyMode={answerOnlyMode}
              enableQuestionLinks={isHqView}
            />
          </div>
        </div>
      </div>

      {/* 하단 바 */}
      <PrintBottomBar 
        onBack={() => router.push(detailUrl)}
        onReset={handleReset}
        onPrint={handlePrint}
        isBlocked={isBlocked}
      />

      {/* 학생 선택 모달 */}
      {studentModalOpen && (
        <PrintStudentModal 
          open={studentModalOpen}
          onOpenChange={setStudentModalOpen}
          students={activeStudents}
          selectedIds={selectedStudentIds}
          onConfirm={(ids) => {
            setSelectedStudentIds(ids);
            if (ids.length > 0) setPreviewStudentId(ids[0]);
          }}
        />
      )}
    </div>
  );
}

const getTaskProblemCountText = (task: any) => {
  if (task.problemMode === "same") {
    return `${task.totalProblems}문항`;
  }
  let maxCount = task.totalProblems;
  if (task.assignedStudents && task.assignedStudents.length > 0) {
    const counts = task.assignedStudents.map((s: any) => s.problemCount ?? s.totalCount ?? 0);
    const maxStudentCount = Math.max(...counts);
    if (maxStudentCount > 0) {
      maxCount = maxStudentCount;
    }
  }
  return `${maxCount}문항(최대)`;
};
