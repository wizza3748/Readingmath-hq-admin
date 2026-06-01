"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTaskCenterStore } from "@/lib/task-center-store";
import { TaskStatusBadge } from "../task-status-badge";
import { ChevronLeft } from "lucide-react";
import PrintSettingPanel from "./print-setting-panel";
import PrintPreviewPanel from "./print-preview-panel";
import PrintBottomBar from "./print-bottom-bar";
import PrintStudentModal from "./print-student-modal";

export type PrintColor = "#002775" | "#4BC8DC" | "#FF9B4E" | "#64C947" | "#F7417A" | "#242424";

interface Props {
  taskId: string;
}

export default function TaskPrintView({ taskId }: Props) {
  const router = useRouter();
  const { tasks } = useTaskCenterStore();
  const task = tasks.find((t) => t.id === taskId);

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

  const [studentModalOpen, setStudentModalOpen] = React.useState(false);

  // Computed valid students (exclude canceled)
  const validStudents = React.useMemo(() => {
    if (!task) return [];
    return task.assignedStudents.filter(s => s.status !== "not_started" && s.status !== ("canceled" as any)); 
  }, [task]);

  const activeStudents = React.useMemo(() => {
    if (!task) return [];
    return task.assignedStudents.filter(s => s.status !== ("canceled" as any));
  }, [task]);

  // Handle initialization of preview student
  React.useEffect(() => {
    if (!task) return;
    if (task.problemMode === "individual" && printType === "student") {
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
  if (task.status === "draft" && task.problemMode === "individual") {
    blockMessage = "학생별 문제 출제 과제는 배정 후 출력할 수 있습니다.";
  } else if (task.totalProblems === 0) {
    blockMessage = "출력할 문제가 없습니다.";
  } else if (task.problemMode === "individual" && printType === "student" && printTarget === "selected" && selectedStudentIds.length === 0) {
    blockMessage = "출력할 학생을 선택해 주세요.";
  } else if (task.problemMode === "individual" && activeStudents.length === 0) {
    blockMessage = "학생별 문제 출제 과제는 배정 후 출력할 수 있습니다.";
  }
  
  const isBlocked = blockMessage !== "";

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 print:bg-white print:pb-0">
      {/* ── 상단 영역 ── */}
      <div className="px-6 pt-5 pb-4 bg-white border-b border-slate-200/80 print:hidden">
        <button
          onClick={() => router.push(`/admin/task-center/${taskId}`)}
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
            <span className="font-medium text-gray-900">{task.totalProblems}문항</span>
          </div>
          <div className="flex flex-col shrink-0">
            <span className="text-gray-500 text-xs mb-1 whitespace-nowrap">문제 구성 방식</span>
            <span className="font-medium text-gray-900">
              {task.problemMode === "same" ? "동일 문제 출제" : "학생별 문제 출제"}
            </span>
          </div>
          <div className="flex flex-col shrink-0">
            <span className="text-gray-500 text-xs mb-1 whitespace-nowrap">중요 문제만 출제</span>
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
            />
          </div>
        </div>
      </div>

      {/* 하단 바 */}
      <PrintBottomBar 
        onBack={() => router.push(`/admin/task-center/${taskId}`)}
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
