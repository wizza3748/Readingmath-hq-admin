"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  TaskItem, 
  SAMPLE_STUDENTS, 
  SAMPLE_CLASSES,
  StudentAssignment 
} from "@/lib/task-center-mock";
import { Search, Users, Info, X } from "lucide-react";

interface AssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskItem;
  onAssign: (assignedClasses: string[], individualStudentIds: string[]) => void;
}

export function AssignModal({
  open,
  onOpenChange,
  task,
  onAssign,
}: AssignModalProps) {
  const [selectedClasses, setSelectedClasses] = React.useState<Set<string>>(new Set());
  const [individualIds, setIndividualIds] = React.useState<Set<string>>(new Set());
  const [currentClass, setCurrentClass] = React.useState<string>("전체");
  const [searchName, setSearchName] = React.useState("");

  // 초기 데이터 로드
  React.useEffect(() => {
    if (open && task) {
      setSelectedClasses(new Set(task.assignedClasses || []));
      setIndividualIds(new Set(task.individualStudentIds || []));
      setCurrentClass("전체");
      setSearchName("");
    }
  }, [open, task]);

  const allStudents = SAMPLE_STUDENTS;

  // 학생별 상태 확인 (현재 과제 기준)
  const getStudentTaskStatus = (studentId: string) => {
    return task.assignedStudents.find(s => s.studentId === studentId)?.status;
  };

  // 학생이 선택된 상태인지 확인
  const isSelected = (studentId: string, classGroup: string) => {
    const status = getStudentTaskStatus(studentId);
    if (status && status !== "not_started") return true; 
    if (selectedClasses.has(classGroup)) return true;
    if (individualIds.has(studentId)) return true;
    return false;
  };

  // 개별 학생 토글
  const toggleStudent = (studentId: string, classGroup: string) => {
    const status = getStudentTaskStatus(studentId);
    if (status && status !== "not_started") return;

    setIndividualIds(prev => {
      const next = new Set(prev);
      const currentlySelected = isSelected(studentId, classGroup);

      if (currentlySelected) {
        if (selectedClasses.has(classGroup)) {
          setSelectedClasses(cPrev => {
            const cNext = new Set(cPrev);
            cNext.delete(classGroup);
            return cNext;
          });
          allStudents
            .filter(s => s.classGroup === classGroup && s.studentId !== studentId)
            .forEach(s => next.add(s.studentId));
          next.delete(studentId);
        } else {
          next.delete(studentId);
        }
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  // 반 전체 선택
  const handleSelectAllInClass = () => {
    if (currentClass === "전체") return;
    setSelectedClasses(prev => new Set(prev).add(currentClass));
    setIndividualIds(prev => {
      const next = new Set(prev);
      allStudents.filter(s => s.classGroup === currentClass).forEach(s => next.delete(s.studentId));
      return next;
    });
  };

  // 반 선택 해제 (미시작 학생만)
  const handleDeselectAllInClass = () => {
    if (currentClass === "전체") return;
    setSelectedClasses(prev => {
      const next = new Set(prev);
      next.delete(currentClass);
      return next;
    });
    setIndividualIds(prev => {
      const next = new Set(prev);
      allStudents
        .filter(s => s.classGroup === currentClass)
        .filter(s => {
          const status = getStudentTaskStatus(s.studentId);
          return !status || status === "not_started";
        })
        .forEach(s => next.delete(s.studentId));
      return next;
    });
  };

  // 필터링된 학생 목록
  const filteredStudents = React.useMemo(() => {
    return allStudents
      .filter(s => currentClass === "전체" || s.classGroup === currentClass)
      .filter(s => {
        if (!searchName.trim()) return true;
        return s.studentName.includes(searchName.trim());
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [allStudents, currentClass, searchName]);

  // 반 전체 선택/해제 가능 여부 계산
  const { canSelectClass, canDeselectClass } = React.useMemo(() => {
    if (currentClass === "전체") return { canSelectClass: false, canDeselectClass: false };
    
    const classStudents = allStudents.filter(s => s.classGroup === currentClass);
    
    const canSelect = !selectedClasses.has(currentClass) && 
                      classStudents.some(s => !isSelected(s.studentId, s.classGroup));
    
    const canDeselect = classStudents.some(s => {
      const selected = isSelected(s.studentId, s.classGroup);
      const status = getStudentTaskStatus(s.studentId);
      const isLocked = status && status !== "not_started";
      return selected && !isLocked;
    });

    return { canSelectClass: canSelect, canDeselectClass: canDeselect };
  }, [currentClass, allStudents, selectedClasses, individualIds, task.assignedStudents]);

  // 집계 데이터
  const assignedCount = task.assignedStudents.length;
  const completedCount = task.assignedStudents.filter(s => s.status === "submitted").length;
  const notStartedCount = task.assignedStudents.filter(s => s.status === "not_started").length;
  const inProgressCount = task.assignedStudents.filter(s => s.status === "in_progress").length;
  
  // 선택 요약 데이터
  const totalSelectedIds = new Set([
    ...Array.from(individualIds),
    ...allStudents.filter(s => selectedClasses.has(s.classGroup)).map(s => s.studentId),
    ...task.assignedStudents.filter(s => s.status !== "not_started").map(s => s.studentId)
  ]);

  const selectedClassesArray = Array.from(selectedClasses);
  const selectedClassesText = selectedClassesArray.length === 0 ? "-" :
    selectedClassesArray.length === 1 ? selectedClassesArray[0] :
    `${selectedClassesArray[0]} 외 ${selectedClassesArray.length - 1}개`;

  const handleApply = () => {
    onAssign(Array.from(selectedClasses), Array.from(individualIds));
    onOpenChange(false);
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "not_started": return "미시작";
      case "in_progress": return "진행중";
      case "submitted": return "제출완료";
      default: return "-";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "not_started": return "bg-gray-100 text-gray-600";
      case "in_progress": return "bg-blue-100 text-blue-600";
      case "submitted": return "bg-green-100 text-green-600";
      default: return "bg-transparent text-gray-300";
    }
  };

  // 일괄 선택 관련 로직
  const selectableFilteredStudents = React.useMemo(() => {
    return filteredStudents.filter(s => {
      const status = getStudentTaskStatus(s.studentId);
      return !status || status === "not_started";
    });
  }, [filteredStudents, task.assignedStudents]);

  const allSelectableSelected = React.useMemo(() => {
    return selectableFilteredStudents.length > 0 && 
           selectableFilteredStudents.every(s => isSelected(s.studentId, s.classGroup));
  }, [selectableFilteredStudents, selectedClasses, individualIds, task.assignedStudents]);

  const someSelectableSelected = React.useMemo(() => {
    return selectableFilteredStudents.length > 0 && 
           !allSelectableSelected && 
           selectableFilteredStudents.some(s => isSelected(s.studentId, s.classGroup));
  }, [selectableFilteredStudents, allSelectableSelected, selectedClasses, individualIds, task.assignedStudents]);

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      // 선택 가능 학생 전체 선택
      setIndividualIds(prev => {
        const next = new Set(prev);
        selectableFilteredStudents.forEach(s => {
          if (!isSelected(s.studentId, s.classGroup)) {
            next.add(s.studentId);
          }
        });
        return next;
      });
    } else {
      // 선택 해제 가능 학생 전체 해제
      let nextSelectedClasses = new Set(selectedClasses);
      let nextIndividualIds = new Set(individualIds);

      selectableFilteredStudents.forEach(target => {
        if (nextSelectedClasses.has(target.classGroup)) {
          // 반 전체 선택 해제 시, 해당 반의 다른 학생들을 개별 선택으로 전환
          nextSelectedClasses.delete(target.classGroup);
          allStudents
            .filter(s => s.classGroup === target.classGroup && s.studentId !== target.studentId)
            .forEach(s => nextIndividualIds.add(s.studentId));
        } else {
          nextIndividualIds.delete(target.studentId);
        }
      });

      setSelectedClasses(nextSelectedClasses);
      setIndividualIds(nextIndividualIds);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[960px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl">
        <DialogHeader className="p-6 flex flex-row items-center border-b border-slate-100 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-slate-800">
            <Users className="h-5 w-5 text-primary" />
            과제 배정 관리
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 bg-muted/5">
          {/* 상단 정보 영역 (고정) */}
          <div className="p-6 pb-2 space-y-6 shrink-0">
            {/* 과제 정보 영역 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">과제명</span>
                <span className="text-base font-bold text-slate-800 leading-tight">{task.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500">
                <span>학습과정 <span className="text-slate-800 font-bold">{task.course}</span></span>
                <span className="text-slate-300 font-light">·</span>
                <span>문제 수 <span className="text-slate-800 font-bold">{task.totalProblems}문항</span></span>
                <span className="text-slate-300 font-light">·</span>
                <span>문제 구성 방식 <span className="text-slate-800 font-bold">{task.problemMode === "same" ? "동일 문제" : "학생별 문제"}</span></span>
              </div>
            </div>

            {/* 배정 현황 영역 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-4 rounded-xl border border-blue-100/80 flex flex-col shadow-xs">
                <span className="text-[11px] font-bold text-blue-600 mb-1">배정 학생</span>
                <span className="text-2xl font-extrabold text-blue-800">{assignedCount}<span className="text-xs ml-0.5 font-bold text-blue-600/85">명</span></span>
              </div>
              <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-4 rounded-xl border border-emerald-100/80 flex flex-col shadow-xs">
                <span className="text-[11px] font-bold text-emerald-600 mb-1">완료 학생</span>
                <span className="text-2xl font-extrabold text-emerald-800">{completedCount}<span className="text-xs ml-0.5 font-bold text-emerald-600/85">명</span></span>
              </div>
              <div className="bg-gradient-to-br from-slate-50/75 to-slate-100/30 p-4 rounded-xl border border-slate-200 flex flex-col shadow-xs">
                <span className="text-[11px] font-bold text-slate-500 mb-1">미시작 학생</span>
                <span className="text-2xl font-extrabold text-slate-700">{notStartedCount}<span className="text-xs ml-0.5 font-bold text-slate-500/85">명</span></span>
              </div>
              <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-4 rounded-xl border border-amber-100/80 flex flex-col shadow-xs">
                <span className="text-[11px] font-bold text-amber-600 mb-1">진행중 학생</span>
                <span className="text-2xl font-extrabold text-amber-800">{inProgressCount}<span className="text-xs ml-0.5 font-bold text-amber-600/85">명</span></span>
              </div>
            </div>

            {/* 필터 및 액션 영역 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap gap-2 shrink-0">
                {["전체", ...SAMPLE_CLASSES].map(cls => (
                  <button
                    key={cls}
                    onClick={() => setCurrentClass(cls)}
                    className={`h-8 px-4 rounded-full text-xs font-bold transition-all duration-200 border ${
                      currentClass === cls 
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
                  value={searchName}
                  onChange={e => setSearchName(e.target.value)}
                />
              </div>

              {currentClass !== "전체" && (
                <div className="flex gap-2 shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-3 font-bold text-[11px]" 
                    onClick={handleSelectAllInClass}
                    disabled={!canSelectClass}
                  >
                    해당 반 전체 선택
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-3 font-bold text-[11px] text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 disabled:text-gray-400 disabled:bg-gray-50 disabled:border-gray-200" 
                    onClick={handleDeselectAllInClass}
                    disabled={!canDeselectClass}
                  >
                    해당 반 선택 해제
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 목록 영역 (스크롤) */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  학생 배정 목록
                </h3>
                <p className="text-xs text-muted-foreground">현재 필터 결과 <span className="font-bold text-foreground">{filteredStudents.length}</span>명</p>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 text-left w-12">
                        <Checkbox 
                          checked={allSelectableSelected ? true : someSelectableSelected ? "indeterminate" : false}
                          onCheckedChange={(checked) => handleToggleAll(!!checked)}
                        />
                      </th>
                      <th className="py-3 px-4 text-left">학생명</th>
                      <th className="py-3 px-4 text-left">반</th>
                      <th className="py-3 px-4 text-center">과제 상태</th>
                      <th className="py-3 px-4 text-center">배정 방식</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                          학생 데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(s => {
                        const selected = isSelected(s.studentId, s.classGroup);
                        const status = getStudentTaskStatus(s.studentId);
                        const isLocked = status && status !== "not_started";
                        const assignType = selectedClasses.has(s.classGroup) ? "반 배정" : 
                                         individualIds.has(s.studentId) ? "개별 배정" : 
                                         isLocked ? (task.assignedClasses?.includes(s.classGroup) ? "반 배정" : "개별 배정") : "-";

                        return (
                          <tr key={s.studentId} className={`hover:bg-slate-50/50 border-b border-slate-100 last:border-0 transition-colors duration-150 ${selected ? "bg-indigo-50/30" : ""}`}>
                            <td className="py-3 px-4">
                              <Checkbox 
                                checked={selected}
                                onCheckedChange={() => toggleStudent(s.studentId, s.classGroup)}
                                disabled={isLocked}
                              />
                            </td>
                            <td className="py-3 px-4 font-bold">{s.studentName}</td>
                            <td className="py-3 px-4 text-xs text-muted-foreground font-medium">{s.classGroup}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                                {getStatusText(status)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                                assignType === "반 배정" ? "bg-blue-50 text-blue-600 border-blue-100" : 
                                assignType === "개별 배정" ? "bg-purple-50 text-purple-600 border-purple-100" : 
                                "bg-transparent text-transparent border-transparent"
                              }`}>
                                {assignType}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 영역 (요약 + 버튼) */}
        <div className="px-6 py-4 border-t bg-white flex items-center justify-between shrink-0">
          <div className="flex gap-6 items-center">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">선택된 학생</span>
              <span className="text-sm font-black text-primary">{totalSelectedIds.size}명</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">선택 반</span>
              <span className="text-sm font-black text-foreground">{selectedClassesText}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">개별 선택</span>
              <span className="text-sm font-black text-foreground">{individualIds.size}명</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-8 font-black text-muted-foreground">
              취소
            </Button>
            <Button onClick={handleApply} className="h-11 px-10 font-black shadow-lg shadow-primary/20">
              배정 적용 {totalSelectedIds.size > 0 && `(${totalSelectedIds.size}명)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
