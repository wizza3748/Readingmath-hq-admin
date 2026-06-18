"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  TaskItem, 
  StudentAssignment, 
  getStudentTaskStatusLabel 
} from "@/lib/task-center-mock";
import { getStoredClasses } from "@/lib/teacher-mock";
import { evaluateStudentAchievement } from "@/utils/examPrepStorage";
import * as XLSX from "xlsx";
import { BarChart3, Search, ChevronRight, CheckCircle2, XCircle, Users, Info, Download } from "lucide-react";

const getMappedClassName = (name: string): string => {
  if (typeof window === "undefined") return name;
  const storedClasses = getStoredClasses();
  if (storedClasses.length === 0) return name;

  if (storedClasses.some(c => c.name === name)) {
    return name;
  }

  if (name === "1반" && storedClasses[0]) return storedClasses[0].name;
  if (name === "2반" && storedClasses[1]) return storedClasses[1].name;
  if (name === "3반" && storedClasses[2]) return storedClasses[2].name;

  return storedClasses[0] ? storedClasses[0].name : name;
};

interface ResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskItem;
}

export function ResultModal({ open, onOpenChange, task }: ResultModalProps) {
  const [selectedClass, setSelectedClass] = React.useState("전체");
  // "all" = 배정 대상 카드 활성(전체 표시), "completed" = 완료 학생 카드 활성(제출완료만 표시)
  const [selectedFilter, setSelectedFilter] = React.useState<"all" | "completed">("all");
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null);
  // 학생 상세 아코디언: 문항별 정오답 / 유형별 성취도 (studentId별 독립 관리)
  const [expandedQuestions, setExpandedQuestions] = React.useState<Set<string>>(new Set());
  const [expandedTypeStats, setExpandedTypeStats] = React.useState<Set<string>>(new Set());
  // 유형별 결과 요약 섹션 아코디언
  const [typeSummaryExpanded, setTypeSummaryExpanded] = React.useState(true);

  // 초기화
  React.useEffect(() => {
    if (open) {
      setSelectedClass("전체");
      setSelectedFilter("all");
      setSearchKeyword("");
      setSelectedStudentId(null);
    }
  }, [open]);

  // 집계 로직
  const assignedStudents = task.assignedStudents;
  const totalCount = assignedStudents.length;
  const completedCount = assignedStudents.filter(s => s.status === "submitted").length;
  const inProgressCount = assignedStudents.filter(s => s.status === "in_progress").length;
  const notStartedCount = assignedStudents.filter(s => s.status === "not_started").length;

  const avgScore = completedCount > 0
    ? Math.round(assignedStudents.filter(s => s.status === "submitted").reduce((sum, s) => sum + (s.score || 0), 0) / completedCount)
    : null;

  // 반 배정 여부 판별
  const isClassTask = (task.assignedClasses || []).length > 0;

  // 반 배정 시 반명 표시 (동적 클래스명 매핑)
  const assignedClassName = React.useMemo(() => {
    if (!isClassTask) return "";
    const classes = task.assignedClasses ?? [];
    if (classes.length === 0) return "";
    const mappedFirst = getMappedClassName(classes[0]);
    return classes.length === 1 ? mappedFirst : `${mappedFirst} 외 ${classes.length - 1}개`;
  }, [isClassTask, task.assignedClasses]);

  // 동적 반 목록 생성
  const actualClasses = React.useMemo(() => {
    return Array.from(new Set(assignedStudents.map(s => s.classGroup))).filter(Boolean).sort();
  }, [assignedStudents]);

  const classesCount = actualClasses.length;
  const showFilterBar = isClassTask && classesCount > 1;

  const availableClasses = React.useMemo(() => {
    return ["전체", ...actualClasses];
  }, [actualClasses]);

  // 필터링된 목록
  const filteredStudents = React.useMemo(() => {
    return assignedStudents
      .filter(s => selectedClass === "전체" || s.classGroup === selectedClass)
      .filter(s => {
        if (selectedFilter === "completed") return s.status === "submitted";
        return true; // "all" 이면 전체
      })
      .filter(s => {
        if (!searchKeyword.trim()) return true;
        return s.studentName.includes(searchKeyword.trim());
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [assignedStudents, selectedClass, selectedFilter, searchKeyword]);

  // 학생 상세 가상 데이터 생성 (기존 로직 유지)
  const selectedStudent = assignedStudents.find(s => s.studentId === selectedStudentId);
  const mockDetail = React.useMemo(() => {
    if (!selectedStudent || selectedStudent.status !== "submitted") return null;
    
    // relearn 모드일 때 해당 학생에게 출제된 유형만 필터링
    const studentSelectedTypes = (() => {
      if (task.problemMode !== "relearn") return task.selectedTypes;
      const subject = task.subject || "math";
      return task.selectedTypes.filter(t => {
        const cleanId = t.typeId.replace(/-(basic|skill|advanced)$/, "");
        return evaluateStudentAchievement(selectedStudent.studentId, cleanId, subject) === "relearn";
      });
    })();

    const questions: { id: number; typeId: string; typeName: string; difficulty: string; isCorrect: boolean; studentAnswer: string; correctAnswer: string }[] = [];
    let qIdx = 1;
    const targetCorrectCount = selectedStudent.correctCount ?? Math.round((selectedStudent.score || 0) / 100 * (selectedStudent.totalCount || selectedStudent.problemCount || task.totalProblems));
    let remainingCorrect = targetCorrectCount;
    const totalQ = studentSelectedTypes.reduce((acc, t) => acc + t.problemCount, 0);

    for (const type of studentSelectedTypes) {
      for (let i = 0; i < type.problemCount; i++) {
        const prob = remainingCorrect / (totalQ - (qIdx - 1));
        const isCorrect = Math.random() < prob && remainingCorrect > 0;
        if (isCorrect) remainingCorrect--;

        questions.push({
          id: qIdx++,
          typeId: type.typeId,  // typeName 중복 방지: typeId로 유형 식별
          typeName: type.typeName,
          difficulty: "기본",
          isCorrect,
          studentAnswer: isCorrect ? "3" : "2",
          correctAnswer: "3"
        });
      }
    }
    
    return {
      questions,
      typeStats: studentSelectedTypes.map(t => {
        // typeName이 중복될 수 있으므로 typeId로 정확히 필터링
        const typeQuestions = questions.filter(q => q.typeId === t.typeId);
        // 정답 수가 문항 수를 초과하지 않도록 보정
        const rawCorrect = typeQuestions.filter(q => q.isCorrect).length;
        const correctCount = Math.min(rawCorrect, t.problemCount);
        // 점수는 100점 초과 방지
        const score = t.problemCount > 0 ? Math.min(100, Math.round((correctCount / t.problemCount) * 100)) : 0;
        return {
          typeName: t.typeName,
          total: t.problemCount,
          correct: correctCount,
          score
        };
      })
    };
  }, [selectedStudentId, task.selectedTypes, task.totalProblems, task.problemMode, task.subject, selectedStudent]);

  // 유형별 요약 로직 (평균 정답수·평균 점수 100점 초과 및 문항수 초과 방지 보정)
  const typeSummaries = task.selectedTypes.map(type => {
    const studentsWithResult = assignedStudents.filter(s => s.status === "submitted");
    if (studentsWithResult.length === 0) return { typeName: type.typeName, total: type.problemCount, avgCorrect: null, avgScore: null };
    // 평균 정답: 문항수 × 정답률(0.82), 문항수 초과 방지
    const rawAvgCorrect = type.problemCount * 0.82;
    const clampedAvgCorrect = Math.min(rawAvgCorrect, type.problemCount);
    const avgCorrectValue = clampedAvgCorrect.toFixed(1);
    // 평균 점수: 100점 초과 방지
    const avgScoreValue = Math.min(100, Math.round(82 + Math.random() * 12));
    return { typeName: type.typeName, total: type.problemCount, avgCorrect: avgCorrectValue, avgScore: avgScoreValue };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started": return "bg-gray-100 text-gray-500";
      case "in_progress": return "bg-blue-100 text-blue-600";
      case "submitted": return "bg-green-100 text-green-600";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  // 엑셀 다운로드 (단일 시트)
  const handleExcelDownload = () => {
    const wb = XLSX.utils.book_new();

    const rows: (string | number)[][] = [];

    // ── 섹션 1: 과제 기본 정보 ──
    rows.push(["▣ 과제 기본 정보"]);
    rows.push(["과제명", task.name]);
    rows.push(["학습과정", task.course]);
    rows.push(["문제 수", task.problemMode === "relearn" ? "학생별 상이" : `${task.totalProblems}문항`]);
    rows.push(["문제 구성 방식", task.problemMode === "same" ? "동일 문제" : task.problemMode === "relearn" ? "학생별 재학습 유형" : "학생별 문제"]);
    rows.push(["배정 대상", isClassTask ? `반 배정 (${assignedClassName})` : `개별 학생 배정 (${totalCount}명)`]);
    rows.push(["배정 학생 수", `${totalCount}명`]);
    rows.push(["제출완료 학생 수", `${completedCount}명`]);
    rows.push(["평균 점수", avgScore !== null ? `${avgScore}점` : "-"]);
    rows.push(["미시작", `${notStartedCount}명`]);
    rows.push(["진행중", `${inProgressCount}명`]);

    // 빈 행 구분
    rows.push([]);

    // ── 섹션 2: 학생 결과 목록 ──
    rows.push(["▣ 학생 결과 목록"]);
    rows.push(["학생명", "반", "배정 방식", "과제 상태", "정답 수", "점수", "제출 일시"]);
    assignedStudents.forEach(s => {
      const assignType = (task.assignedClasses || []).includes(s.classGroup) ? "반 배정" : "개별 배정";
      const isCompleted = s.status === "submitted";
      const total = s.problemCount ?? s.totalCount ?? task.totalProblems;
      const correct = s.correctCount ?? (s.score !== undefined ? Math.round((s.score / 100) * total) : 0);
      rows.push([
        s.studentName,
        s.classGroup,
        assignType,
        getStudentTaskStatusLabel(s.status),
        isCompleted ? `${correct}/${total}` : "-",
        isCompleted ? `${s.score ?? 0}점` : "-",
        isCompleted ? formatDate(s.submittedAt) : "-",
      ]);
    });

    // 빈 행 구분
    rows.push([]);

    // ── 섹션 3: 유형별 결과 요약 ──
    rows.push(["▣ 유형별 결과 요약"]);
    rows.push(["유형명", "문항 수", "평균 정답", "평균 점수"]);
    typeSummaries.forEach(ts => {
      rows.push([
        ts.typeName,
        ts.total,
        ts.avgCorrect ? `${ts.avgCorrect}개` : "-",
        ts.avgScore !== null ? `${ts.avgScore}점` : "-",
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 36 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws, "결과 현황");

    // 파일명: 과제명_결과현황_YYYY-MM-DD.xlsx
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const safeName = task.name.replace(/[/\\?%*:|"<>]/g, "").slice(0, 30);
    XLSX.writeFile(wb, `과제결과현황_${safeName}_${dateStr}.xlsx`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[960px] h-[760px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl">
        {/* 모달 헤더 */}
        <DialogHeader className="px-6 pt-5 pb-3 flex flex-row items-center border-b border-slate-100 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-slate-800">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            과제 결과 현황
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
          {/* 상단 정보 바 (과제명 · 학습과정 · 문제 수 · 문제 구성 방식) */}
          <div className="px-6 py-3 border-b border-slate-200/60 bg-white flex items-center justify-between gap-4 text-xs font-semibold text-slate-500 shrink-0 select-none shadow-xs">
            <div className="flex items-center gap-2 max-w-[50%] min-w-0">
              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 uppercase tracking-wider shrink-0">과제명</span>
              <span className="font-extrabold text-slate-800 leading-none truncate">{task.name}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 shrink-0">
              <span>학습과정 <strong className="text-slate-700 font-extrabold">{task.course}</strong></span>
              <span className="text-slate-300 font-light">·</span>
              <span>문제 수 <strong className="text-slate-700 font-extrabold">
                {task.problemMode === "relearn" ? "학생별 상이" : `${task.totalProblems}문항`}
              </strong></span>
              <span className="text-slate-300 font-light">·</span>
              <span className="text-slate-600 font-bold bg-slate-100/80 px-1.5 py-0.5 rounded border border-slate-200/30">
                {task.problemMode === "same" ? "동일 문제" : task.problemMode === "relearn" ? "학생별 재학습 유형" : "학생별 문제"}
              </span>
            </div>
          </div>

          {/* ─── 결과 요약 카드 3개 ─── */}
          <div className="px-6 py-4 border-b border-slate-200/40 bg-slate-50/50 grid grid-cols-3 gap-3 shrink-0">

            {/* ① 배정 대상 카드 (클릭 → 전체 필터 활성) */}
            <button
              onClick={() => setSelectedFilter("all")}
              className={`p-3.5 rounded-xl border flex flex-col text-left transition-all duration-200 shadow-xs cursor-pointer ${
                selectedFilter === "all"
                  ? "bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "bg-white border-slate-200 hover:border-indigo-300"
              }`}
            >
              {/* 타이틀 */}
              <span className={`text-[10px] font-black uppercase mb-1.5 tracking-wider ${selectedFilter === "all" ? "text-indigo-200" : "text-indigo-600"}`}>
                {isClassTask ? "배정 반" : "배정 학생"}
              </span>

              {/* 주요 값: 반 배정이면 반명, 개별 배정이면 N명 */}
              {isClassTask ? (
                <span className={`text-base font-black leading-tight truncate ${selectedFilter === "all" ? "text-white" : "text-slate-800"}`}>
                  {assignedClassName || "-"}
                </span>
              ) : (
                <span className={`text-xl font-black leading-none ${selectedFilter === "all" ? "text-white" : "text-slate-800"}`}>
                  {totalCount}<span className={`text-[10px] ml-0.5 font-bold ${selectedFilter === "all" ? "text-indigo-100/90" : "text-indigo-500"}`}>명</span>
                </span>
              )}
              {/* 상태 요약 (미시작 · 진행중 · 제출완료) */}
              <div className={`flex items-center gap-1 mt-2 text-[9px] font-bold flex-wrap ${selectedFilter === "all" ? "text-indigo-200" : "text-slate-400"}`}>
                <span>미시작 {notStartedCount}</span>
                <span>·</span>
                <span>진행중 {inProgressCount}</span>
                <span>·</span>
                <span>제출완료 {completedCount}</span>
              </div>
            </button>

            {/* ② 완료 학생 카드 (클릭 → 제출완료 필터 토글) */}
            <button
              onClick={() => setSelectedFilter(prev => prev === "completed" ? "all" : "completed")}
              className={`p-3.5 rounded-xl border flex flex-col text-left transition-all duration-200 shadow-xs cursor-pointer ${
                selectedFilter === "completed"
                  ? "bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-600 text-white shadow-md shadow-emerald-600/10"
                  : "bg-white border-slate-200 hover:border-emerald-300"
              }`}
            >
              <span className={`text-[10px] font-black uppercase mb-1.5 tracking-wider ${selectedFilter === "completed" ? "text-emerald-200" : "text-emerald-600"}`}>완료 학생</span>
              <span className={`text-xl font-black leading-none ${selectedFilter === "completed" ? "text-white" : "text-slate-800"}`}>
                {completedCount}<span className={`text-[10px] ml-0.5 font-bold ${selectedFilter === "completed" ? "text-emerald-100/90" : "text-emerald-500"}`}>명</span>
              </span>
              <span className={`text-[9px] font-bold mt-2 tracking-wider ${selectedFilter === "completed" ? "text-emerald-200" : "text-slate-400"}`}>제출완료 기준</span>
            </button>

            {/* ③ 평균 점수 카드 (클릭 불가 · 조회 전용) */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col text-left cursor-default">
              <span className="text-[10px] font-black text-purple-600 mb-1.5 tracking-wider uppercase">평균 점수</span>
              <span className="text-xl font-black text-slate-800 leading-none">
                {avgScore !== null ? `${avgScore}점` : "-"}
              </span>
              <span className="text-[9px] font-bold text-slate-400 mt-2 tracking-wider">완료 학생 기준</span>
            </div>
          </div>

          {/* 반 선택 필터 & 검색 (배정된 반이 여러 개일 때만 노출) */}
          {showFilterBar && (
            <div className="px-6 pt-8 pb-3 flex items-center justify-between gap-4 shrink-0">
              <div className="flex flex-wrap gap-1.5">
                {availableClasses.map(cls => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`h-8 px-3.5 rounded-full text-xs font-bold transition-all duration-200 border flex items-center ${
                      selectedClass === cls
                        ? "bg-slate-800 border-slate-800 text-white shadow-sm font-black"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>

              <div className="relative w-44">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  className="h-9 pl-9 text-xs bg-white border border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-offset-0 transition-all rounded-lg shadow-xs"
                  placeholder="학생 이름 검색"
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* 스크롤 영역 (테이블 + 유형별 요약 포함) */}
          <div className={`flex-1 overflow-y-auto px-6 pb-5 space-y-8 ${!showFilterBar ? "pt-8" : "pt-2.5"}`}>
            {/* 학생 결과 목록 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black flex items-center gap-2 text-slate-700">
                  <Users className="h-4 w-4 text-purple-600" />
                  학생 결과 목록
                </h3>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 text-left">학생명</th>
                      <th className="py-3 px-4 text-left">반</th>
                      <th className="py-3 px-4 text-center">배정 방식</th>
                      <th className="py-3 px-4 text-center">학생 과제 상태</th>
                      <th className="py-3 px-4 text-center">정답 수</th>
                      <th className="py-3 px-4 text-center">점수</th>
                      <th className="py-3 px-4 text-left">제출 일시</th>
                      <th className="py-3 px-4 text-center w-20">상세</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-muted-foreground italic">
                          검색 결과가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(s => {
                        const isCompleted = s.status === "submitted";
                        const assignType = (task.assignedClasses || []).includes(s.classGroup) ? "반 배정" : "개별 배정";
                        const total = s.problemCount ?? s.totalCount ?? task.totalProblems;
                        const correct = s.correctCount ?? (s.score !== undefined ? Math.round((s.score / 100) * total) : 0);
                        
                        return (
                          <React.Fragment key={s.studentId}>
                            <tr className={`hover:bg-slate-50/50 border-b border-slate-100 transition-colors duration-150 ${selectedStudentId === s.studentId ? "bg-indigo-50/30" : ""}`}>
                              <td className="py-3 px-4 font-bold">{s.studentName}</td>
                              <td className="py-3 px-4 text-xs text-muted-foreground font-medium">{s.classGroup}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                                  assignType === "반 배정" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-purple-50 text-purple-600 border-purple-100"
                                }`}>{assignType}</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${getStatusColor(s.status)}`}>
                                  {getStudentTaskStatusLabel(s.status)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-medium">
                                {isCompleted ? `${correct}/${total}` : "-"}
                              </td>
                              <td className="py-3 px-4 text-center font-black">
                                {isCompleted ? <span className="text-primary">{s.score ?? 0}점</span> : "-"}
                              </td>
                              <td className="py-3 px-4 text-[11px] text-muted-foreground whitespace-nowrap">
                                {isCompleted ? formatDate(s.submittedAt) : "-"}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isCompleted && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`h-7 w-7 p-0 rounded-full ${selectedStudentId === s.studentId ? "bg-primary text-white" : ""}`}
                                    onClick={() => setSelectedStudentId(selectedStudentId === s.studentId ? null : s.studentId)}
                                  >
                                    <ChevronRight className={`h-4 w-4 transition-transform ${selectedStudentId === s.studentId ? "rotate-90" : ""}`} />
                                  </Button>
                                )}
                              </td>
                            </tr>

                            {/* 학생별 결과 상세 영역 */}
                            {selectedStudentId === s.studentId && mockDetail && (
                              <tr>
                                <td colSpan={8} className="p-0 bg-muted/10 border-b">
                                  <div className="p-6 space-y-6">
                                    <div className="flex items-center justify-between border-b pb-4">
                                      <div className="flex items-center gap-4">
                                        <h4 className="text-lg font-black text-primary">{s.studentName} 상세 결과</h4>
                                        <div className="flex items-center gap-3 text-xs font-bold">
                                          <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" /> 정답 {mockDetail.questions.filter(q => q.isCorrect).length}</div>
                                          <div className="flex items-center gap-1 text-red-500"><XCircle className="h-3 w-3" /> 오답 {mockDetail.questions.filter(q => !q.isCorrect).length}</div>
                                        </div>
                                      </div>
                                      <Badge className="bg-primary px-3 py-1 text-sm font-black">{s.score ?? 0}점</Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-8">
                                      {/* 문항별 정오답 (토글) */}
                                      <div className="space-y-2">
                                        <button
                                          type="button"
                                          onClick={() => setExpandedQuestions(prev => {
                                            const next = new Set(prev);
                                            if (next.has(s.studentId)) next.delete(s.studentId);
                                            else next.add(s.studentId);
                                            return next;
                                          })}
                                          className="w-full flex items-center justify-between gap-1.5 text-[11px] font-black text-muted-foreground uppercase hover:text-foreground transition-colors cursor-pointer group"
                                        >
                                          <span className="flex items-center gap-1.5">
                                            <Info className="h-3 w-3" /> 문항별 정오답
                                          </span>
                                          <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${expandedQuestions.has(s.studentId) ? "rotate-90" : ""}`} />
                                        </button>
                                        {expandedQuestions.has(s.studentId) && (
                                          <div className="grid grid-cols-5 gap-2">
                                            {mockDetail.questions.map(q => (
                                              <div key={q.id} className={`flex flex-col items-center p-2 rounded-lg border ${q.isCorrect ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"}`}>
                                                <span className="text-[10px] font-bold opacity-60 mb-1">{q.id}</span>
                                                <span className="text-sm font-black">{q.isCorrect ? "O" : "X"}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* 유형별 성취도 (토글) */}
                                      <div className="space-y-2">
                                        <button
                                          type="button"
                                          onClick={() => setExpandedTypeStats(prev => {
                                            const next = new Set(prev);
                                            if (next.has(s.studentId)) next.delete(s.studentId);
                                            else next.add(s.studentId);
                                            return next;
                                          })}
                                          className="w-full flex items-center justify-between gap-1.5 text-[11px] font-black text-muted-foreground uppercase hover:text-foreground transition-colors cursor-pointer group"
                                        >
                                          <span className="flex items-center gap-1.5">
                                            <BarChart3 className="h-3 w-3" /> 유형별 성취도
                                          </span>
                                          <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${expandedTypeStats.has(s.studentId) ? "rotate-90" : ""}`} />
                                        </button>
                                        {expandedTypeStats.has(s.studentId) && (
                                          <div className="space-y-2">
                                            {mockDetail.typeStats.map((ts, idx) => (
                                              <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-lg border shadow-sm">
                                                <span className="text-xs font-bold text-foreground truncate max-w-[140px]">{ts.typeName}</span>
                                                <div className="flex items-center gap-3">
                                                  <span className="text-[11px] font-bold text-muted-foreground">{ts.correct}/{ts.total}</span>
                                                  <span className="text-xs font-black text-primary w-10 text-right">{ts.score}점</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 유형별 결과 요약 영역 (토글) */}
            <div className="pt-4 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => setTypeSummaryExpanded(prev => !prev)}
                className="w-full flex items-center justify-between mb-4 group cursor-pointer"
              >
                <h3 className="text-sm font-black flex items-center gap-2 text-slate-700 group-hover:text-slate-900 transition-colors">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  유형별 결과 요약
                </h3>
                <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${typeSummaryExpanded ? "rotate-90" : ""}`} />
              </button>
              {typeSummaryExpanded && (
                <div className="grid grid-cols-2 gap-4">
                  {typeSummaries.length === 0 ? (
                    <div className="col-span-2 py-8 text-center text-muted-foreground italic bg-muted/10 rounded-xl">유형별 결과가 없습니다.</div>
                  ) : (
                    typeSummaries.map((ts, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-purple-300 transition-all duration-200">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">유형명</span>
                          <span className="text-sm font-bold text-foreground">{ts.typeName}</span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[9px] font-black text-muted-foreground uppercase">문항 수</span>
                            <span className="text-xs font-bold">{ts.total}</span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[9px] font-black text-muted-foreground uppercase">평균 정답</span>
                            <span className="text-xs font-bold text-green-600">{ts.avgCorrect ? `${ts.avgCorrect}개` : "-"}</span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[9px] font-black text-muted-foreground uppercase">평균 점수</span>
                            <span className="text-sm font-black text-primary">{ts.avgScore !== null ? `${ts.avgScore}점` : "-"}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-white flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            onClick={handleExcelDownload}
            className="h-10 px-5 font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            엑셀 다운로드
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-8 font-black text-slate-500">닫기</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
