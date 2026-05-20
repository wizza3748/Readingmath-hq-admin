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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  TaskItem, 
  StudentAssignment, 
  getStudentTaskStatusLabel 
} from "@/lib/task-center-mock";
import { BarChart3, Search, ChevronRight, Clock, CheckCircle2, XCircle, Users, Info } from "lucide-react";

interface ResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskItem;
}

export function ResultModal({ open, onOpenChange, task }: ResultModalProps) {
  const [selectedClass, setSelectedClass] = React.useState("전체");
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [searchKeyword, setSearchKeyword] = React.useState("");
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null);

  // 초기화
  React.useEffect(() => {
    if (open) {
      setSelectedClass("전체");
      setSelectedStatus("all");
      setSearchKeyword("");
      setSelectedStudentId(null);
    }
  }, [open]);

  // 집계 로직
  const assignedStudents = task.assignedStudents;
  const completedStudents = assignedStudents.filter(s => s.status === "submitted" || s.status === "timeout");
  
  const totalCount = assignedStudents.length;
  const completedCount = completedStudents.length;
  const inProgressCount = assignedStudents.filter(s => s.status === "in_progress").length;
  const notStartedCount = assignedStudents.filter(s => s.status === "not_started").length;
  const submittedCount = assignedStudents.filter(s => s.status === "submitted").length;
  const timeoutCount = assignedStudents.filter(s => s.status === "timeout").length;

  const avgScore = completedCount > 0 
    ? Math.round(completedStudents.reduce((sum, s) => sum + (s.score || 0), 0) / completedCount)
    : null;

  // 동적 반 목록 생성
  const availableClasses = React.useMemo(() => {
    const classes = Array.from(new Set(assignedStudents.map(s => s.classGroup))).filter(Boolean);
    return ["전체", ...classes.sort()];
  }, [assignedStudents]);

  // 반별 평균 정보
  const classAverages = React.useMemo(() => {
    return availableClasses
      .filter(cls => cls !== "전체")
      .map(cls => {
        const classCompleted = assignedStudents.filter(s => s.classGroup === cls && (s.status === "submitted" || s.status === "timeout"));
        if (classCompleted.length === 0) return null;
        const avg = Math.round(classCompleted.reduce((sum, s) => sum + (s.score || 0), 0) / classCompleted.length);
        return { name: cls, avg };
      })
      .filter(Boolean) as { name: string; avg: number }[];
  }, [availableClasses, assignedStudents]);

  const classAvgText = React.useMemo(() => {
    if (classAverages.length === 0) return "";
    if (classAverages.length === 1) return `${classAverages[0].name} ${classAverages[0].avg}점`;
    if (classAverages.length === 2) return `${classAverages[0].name} ${classAverages[0].avg}점 · ${classAverages[1].name} ${classAverages[1].avg}점`;
    return `${classAverages[0].name} ${classAverages[0].avg}점 외 ${classAverages.length - 1}개`;
  }, [classAverages]);

  // 필터링된 목록
  const filteredStudents = React.useMemo(() => {
    return assignedStudents
      .filter(s => selectedClass === "전체" || s.classGroup === selectedClass)
      .filter(s => {
        if (selectedStatus === "all") return true;
        if (selectedStatus === "completed") return s.status === "submitted" || s.status === "timeout";
        return s.status === selectedStatus;
      })
      .filter(s => {
        if (!searchKeyword.trim()) return true;
        return s.studentName.includes(searchKeyword.trim());
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [assignedStudents, selectedClass, selectedStatus, searchKeyword]);

  // 학생 상세 가상 데이터 생성 (기존 로직 유지)
  const selectedStudent = assignedStudents.find(s => s.studentId === selectedStudentId);
  const mockDetail = React.useMemo(() => {
    if (!selectedStudent || (selectedStudent.status !== "submitted" && selectedStudent.status !== "timeout")) return null;
    
    const questions: { id: number; typeName: string; difficulty: string; isCorrect: boolean; studentAnswer: string; correctAnswer: string }[] = [];
    let qIdx = 1;
    const targetCorrectCount = selectedStudent.correctCount ?? Math.round((selectedStudent.score || 0) / 100 * (selectedStudent.totalCount || task.totalProblems));
    let remainingCorrect = targetCorrectCount;
    const totalQ = task.selectedTypes.reduce((acc, t) => acc + t.problemCount, 0);

    for (const type of task.selectedTypes) {
      for (let i = 0; i < type.problemCount; i++) {
        const prob = remainingCorrect / (totalQ - (qIdx - 1));
        const isCorrect = Math.random() < prob && remainingCorrect > 0;
        if (isCorrect) remainingCorrect--;

        questions.push({
          id: qIdx++,
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
      timeSpent: "24분 15초",
      typeStats: task.selectedTypes.map(t => {
        const typeQuestions = questions.filter(q => q.typeName === t.typeName);
        const correctCount = typeQuestions.filter(q => q.isCorrect).length;
        return {
          typeName: t.typeName,
          total: t.problemCount,
          correct: correctCount,
          score: t.problemCount > 0 ? Math.round((correctCount / t.problemCount) * 100) : 0
        };
      })
    };
  }, [selectedStudentId, task.selectedTypes, task.totalProblems, selectedStudent]);

  // 유형별 요약 로직 (기존 로직 유지)
  const typeSummaries = task.selectedTypes.map(type => {
    const studentsWithResult = completedStudents;
    if (studentsWithResult.length === 0) return { typeName: type.typeName, total: type.problemCount, avgCorrect: null, avgScore: null };
    const avgCorrectValue = (type.problemCount * 0.82).toFixed(1);
    const avgScoreValue = Math.round(82 + Math.random() * 12);
    return { typeName: type.typeName, total: type.problemCount, avgCorrect: avgCorrectValue, avgScore: avgScoreValue };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started": return "bg-gray-100 text-gray-500";
      case "in_progress": return "bg-blue-100 text-blue-600";
      case "submitted": return "bg-green-100 text-green-600";
      case "timeout": return "bg-red-100 text-red-600";
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

  const handleStatusToggle = (status: string) => {
    setSelectedStatus(prev => prev === status ? "all" : status);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[960px] h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl">
        {/* 모달 헤더 */}
        <DialogHeader className="p-6 flex flex-row items-center border-b border-slate-100 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-slate-800">
            <BarChart3 className="h-5 w-5 text-primary" />
            과제 결과 현황
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-muted/5">
          {/* 과제 정보 영역 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">과제명</span>
              <span className="text-base font-bold text-slate-800 leading-normal break-words whitespace-pre-wrap">{task.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500">
              <span>학습과정 <span className="text-slate-800 font-bold">{task.course}</span></span>
              <span className="text-slate-300 font-light">·</span>
              <span>문제 수 <span className="text-slate-800 font-bold">{task.totalProblems}문항</span></span>
              <span className="text-slate-300 font-light">·</span>
              <span>문제 구성 방식 <span className="text-slate-800 font-bold">{task.problemMode === "same" ? "동일 문제" : "학생별 문제"}</span></span>
              <span className="text-slate-300 font-light">·</span>
              <span>제한시간 <span className="text-slate-800 font-bold">{task.timeLimit ? `${task.timeLimit}분` : "미설정"}</span></span>
            </div>
          </div>

          {/* 결과 요약 영역 */}
          <div className="grid grid-cols-3 gap-4">
            <button 
              onClick={() => setSelectedStatus("all")}
              className={`p-4 rounded-xl border flex flex-col text-left transition-all duration-200 ${
                selectedStatus === "all" ? "bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-200 ring-2 ring-blue-400/20 shadow-sm" : "bg-white border-slate-200 hover:border-blue-200"
              }`}
            >
              <span className="text-[11px] font-bold text-blue-600 mb-1">배정 학생</span>
              <span className="text-2xl font-extrabold text-blue-800">{totalCount}<span className="text-xs ml-0.5 font-bold text-blue-600/85">명</span></span>
              <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2 text-[10px] font-bold">
                <span onClick={(e) => { e.stopPropagation(); handleStatusToggle("not_started"); }} className={`transition-colors cursor-pointer ${selectedStatus === "not_started" ? "text-blue-700 bg-blue-100/80 px-1 rounded" : "text-blue-400"}`}>미시작 {notStartedCount}</span>
                <span className="text-blue-100 font-light">·</span>
                <span onClick={(e) => { e.stopPropagation(); handleStatusToggle("in_progress"); }} className={`transition-colors cursor-pointer ${selectedStatus === "in_progress" ? "text-blue-700 bg-blue-100/80 px-1 rounded" : "text-blue-400"}`}>진행중 {inProgressCount}</span>
                <span className="text-blue-100 font-light">·</span>
                <span onClick={(e) => { e.stopPropagation(); handleStatusToggle("submitted"); }} className={`transition-colors cursor-pointer ${selectedStatus === "submitted" ? "text-blue-700 bg-blue-100/80 px-1 rounded" : "text-blue-400"}`}>제출완료 {submittedCount}</span>
                <span className="text-blue-100 font-light">·</span>
                <span onClick={(e) => { e.stopPropagation(); handleStatusToggle("timeout"); }} className={`transition-colors cursor-pointer ${selectedStatus === "timeout" ? "text-blue-700 bg-blue-100/80 px-1 rounded" : "text-blue-400"}`}>시간초과 {timeoutCount}</span>
              </div>
            </button>
            
            <button 
              onClick={() => handleStatusToggle("completed")}
              className={`p-4 rounded-xl border flex flex-col text-left transition-all duration-200 ${
                selectedStatus === "completed" ? "bg-gradient-to-br from-green-50 to-emerald-50/50 border-green-200 ring-2 ring-green-400/20 shadow-sm" : "bg-white border-slate-200 hover:border-green-200"
              }`}
            >
              <span className="text-[11px] font-bold text-green-600 mb-1">완료 학생</span>
              <span className="text-2xl font-extrabold text-green-800">{completedCount}<span className="text-xs ml-0.5 font-bold text-green-600/85">명</span></span>
              <span className="text-[10px] font-bold text-green-400/80 mt-2">제출완료 + 시간초과</span>
            </button>
            
            <div className="bg-gradient-to-br from-purple-50/50 to-fuchsia-50/30 p-4 rounded-xl border border-purple-100 flex flex-col shadow-xs">
              <span className="text-[11px] font-bold text-purple-600 mb-1">평균 점수</span>
              <span className="text-2xl font-extrabold text-purple-800">{avgScore !== null ? `${avgScore}점` : "-"}</span>
              <div className="mt-2 flex items-center gap-1.5 min-h-[14px]">
                {classAvgText ? (
                  <span className="text-[10px] font-bold text-purple-400/80 leading-tight">{classAvgText}</span>
                ) : (
                  <span className="text-[10px] font-bold text-purple-400 opacity-60">반별 데이터 없음</span>
                )}
              </div>
            </div>
          </div>

          {/* 반 선택 및 검색 영역 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-2 shrink-0">
              {availableClasses.map(cls => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`h-8 px-4 rounded-full text-xs font-bold transition-all duration-200 border ${
                    selectedClass === cls 
                      ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/10" 
                      : "bg-white border-slate-200 text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-slate-50/50"
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>

            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                className="h-9 pl-9 text-xs bg-slate-50 border border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-offset-0 transition-all rounded-lg" 
                placeholder="학생 이름 검색" 
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
              />
            </div>
          </div>

          {/* 목록 영역 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                학생 결과 목록
              </h3>
              <p className="text-xs text-muted-foreground">총 <span className="font-bold text-foreground">{filteredStudents.length}</span>명</p>
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
                      const isCompleted = s.status === "submitted" || s.status === "timeout";
                      const assignType = (task.assignedClasses || []).includes(s.classGroup) ? "반 배정" : "개별 배정";
                      const total = s.totalCount ?? task.totalProblems;
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
                              {isCompleted ? formatDate(s.status === "timeout" ? (s.timedOutAt || s.submittedAt) : s.submittedAt) : "-"}
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
                                        <div className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {mockDetail.timeSpent}</div>
                                        <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" /> 정답 {mockDetail.questions.filter(q => q.isCorrect).length}</div>
                                        <div className="flex items-center gap-1 text-red-500"><XCircle className="h-3 w-3" /> 오답 {mockDetail.questions.filter(q => !q.isCorrect).length}</div>
                                      </div>
                                    </div>
                                    <Badge className="bg-primary px-3 py-1 text-sm font-black">{s.score ?? 0}점</Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                      <h5 className="text-[11px] font-black text-muted-foreground uppercase flex items-center gap-1.5">
                                        <Info className="h-3 w-3" /> 문항별 정오답
                                      </h5>
                                      <div className="grid grid-cols-5 gap-2">
                                        {mockDetail.questions.map(q => (
                                          <div key={q.id} className={`flex flex-col items-center p-2 rounded-lg border ${q.isCorrect ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"}`}>
                                            <span className="text-[10px] font-bold opacity-60 mb-1">{q.id}</span>
                                            <span className="text-sm font-black">{q.isCorrect ? "O" : "X"}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <h5 className="text-[11px] font-black text-muted-foreground uppercase flex items-center gap-1.5">
                                        <BarChart3 className="h-3 w-3" /> 유형별 성취도
                                      </h5>
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

          {/* 유형별 결과 요약 영역 */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-black flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              유형별 결과 요약
            </h3>
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
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-muted/10 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-8 font-bold text-muted-foreground">닫기</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
