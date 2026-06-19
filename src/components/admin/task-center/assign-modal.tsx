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
  StudentAssignment,
  getAdaptedSampleClasses,
  getAdaptedSampleStudents
} from "@/lib/task-center-mock";
import { getStoredTeachers, getStoredClasses } from "@/lib/teacher-mock";
import { evaluateStudentAchievement } from "@/utils/examPrepStorage";
import { Search, Users, UserCheck, Info, X } from "lucide-react";

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
  const [assignMode, setAssignMode] = React.useState<"select_mode" | "class_mode" | "individual_mode">("select_mode");
  const [selectedClasses, setSelectedClasses] = React.useState<Set<string>>(new Set());
  const [individualIds, setIndividualIds] = React.useState<Set<string>>(new Set());
  const [currentClass, setCurrentClass] = React.useState<string>("전체");
  const [searchName, setSearchName] = React.useState("");

  const isRelearnMode = task?.problemMode === "relearn";

  const isStudentSelectable = React.useCallback((studentId: string) => {
    if (!task) return false;
    if (task.problemMode !== "relearn") return true;
    if (!task.selectedTypes || task.selectedTypes.length === 0) return false;
    
    return task.selectedTypes.some(t => {
      const cleanTypeId = t.typeId.replace(/-(basic|skill|advanced)$/, "");
      const status = evaluateStudentAchievement(studentId, cleanTypeId, task.subject || "math");
      return status === "relearn";
    });
  }, [task]);

  // 권한별 동적 반 리스트와 학생 목록
  const [classesList, setClassesList] = React.useState<string[]>([]);
  const [allStudents, setAllStudents] = React.useState<StudentAssignment[]>([]);

  // 초기 데이터 로드 및 로그인 권한 분석
  React.useEffect(() => {
    if (open && task) {
      setSearchName("");

      // 로그인 정보 조회
      let activeTeacherId = "";
      if (typeof window !== "undefined") {
        activeTeacherId = localStorage.getItem("readingmath_current_teacher_id") || "";
      }

      const teachers = getStoredTeachers();
      const currentTeacher = teachers.find(t => t.id === activeTeacherId);

      const allGlobalClasses = getAdaptedSampleClasses();
      const allGlobalStudents = getAdaptedSampleStudents();

      let activeClasses: string[] = [];
      let activeStudents: StudentAssignment[] = [];

      if (currentTeacher && currentTeacher.role === "teacher") {
        // 일반 선생님: 본인 담당 반만 노출 및 본인 반 학생만 노출
        activeClasses = currentTeacher.assignedClasses.map(c => c.name);
        activeStudents = allGlobalStudents.filter(s => activeClasses.includes(s.classGroup));
      } else {
        // 대표선생님 또는 세션 없음: 모든 반 및 모든 학생 노출
        activeClasses = allGlobalClasses;
        activeStudents = allGlobalStudents;
      }

      setClassesList(activeClasses);
      setAllStudents(activeStudents);

      // 실제 배정이 적용된 학생이 존재하는지 여부를 최우선 기준으로 판단
      const isAssigned = (task.assignedStudents || []).length > 0;

      // 1. 이미 배정된 학생이 있는 과제인 경우 -> 기존 배정 방식에 따라 즉시 2단계 화면으로 진입
      if (isAssigned) {
        const isClassAssigned = (task.assignedClasses || []).length > 0;
        
        if (isClassAssigned) {
          setAssignMode("class_mode");
          const mappedClasses = (task.assignedClasses || []).map(getMappedClassName);
          setSelectedClasses(new Set(mappedClasses));
          setIndividualIds(new Set());
          setCurrentClass(mappedClasses[0] || (activeClasses[0] || ""));
        } else {
          setAssignMode("individual_mode");
          setSelectedClasses(new Set());
          setCurrentClass("전체");

          // 개별 배정 학생 ID들을 이름 기반으로 로컬 스토리지의 실제 학생 ID로 치환하여 초기화
          const mappedIndividualIds = new Set<string>();
          if (task.individualStudentIds) {
            task.individualStudentIds.forEach(oldId => {
              const oldAssigned = task.assignedStudents.find(as => as.studentId === oldId);
              if (oldAssigned) {
                const realStudent = activeStudents.find(s => s.studentName === oldAssigned.studentName);
                if (realStudent) {
                  mappedIndividualIds.add(realStudent.studentId);
                }
              }
            });
          }
          setIndividualIds(mappedIndividualIds);
        }
      }
      // 2. 배정된 학생이 단 한 명도 없는 경우 -> 무조건 최초 진입으로 판단하여 "배정 방식 선택 화면" 노출!
      else {
        setAssignMode("select_mode");
        setSelectedClasses(new Set());
        setIndividualIds(new Set());
        setCurrentClass("전체");
      }
    }
  }, [open, task]);

  // 학생별 상태 확인 (현재 과제 기준 - 이름 기반 매핑으로 정합성 확보)
  const getStudentTaskStatus = (studentId: string) => {
    const student = allStudents.find(s => s.studentId === studentId);
    if (!student) return undefined;
    return task.assignedStudents.find(s => s.studentName === student.studentName)?.status;
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

  // 반 전체 배정 토글 (단일 반 배정으로 제약)
  const handleToggleClassAssign = (checked: boolean, targetClass: string) => {
    if (checked) {
      setSelectedClasses(new Set([targetClass]));
      setIndividualIds(new Set());
    } else {
      setSelectedClasses(prev => {
        const next = new Set(prev);
        next.delete(targetClass);
        return next;
      });
      setIndividualIds(new Set());
    }
  };

  // 반 탭 클릭 시 스마트 단일 배정 토글 및 필터링 동작 처리
  const handleClassTabClick = (cls: string) => {
    if (cls === "전체") {
      setCurrentClass("전체");
      return;
    }

    const isAssigned = selectedClasses.has(cls);

    if (currentClass === cls) {
      // 이미 활성화된 반 탭을 한 번 더 누름 -> 배정 해제 시도
      if (isAssigned) {
        const classStudents = allStudents.filter(s => s.classGroup === cls);
        const canDeselect = classStudents.some(s => {
          const selected = isSelected(s.studentId, s.classGroup);
          const status = getStudentTaskStatus(s.studentId);
          const isLocked = status && status !== "not_started";
          return selected && !isLocked;
        });

        if (!canDeselect && classStudents.length > 0) {
          alert("이미 과제를 진행 중이거나 완료한 학생이 있어 반 배정을 해제할 수 없습니다.");
          return;
        }

        handleToggleClassAssign(false, cls);
      }
    } else {
      // 다른 반 탭을 누름 -> 단일 배정 전환 시도
      // 1. 기존에 배정된 다른 반이 있다면, 진행중인 학생이 있는지 엄격하게 선검증
      const otherClasses = Array.from(selectedClasses).filter(c => c !== cls);
      if (otherClasses.length > 0) {
        const otherCls = otherClasses[0];
        const otherClassStudents = allStudents.filter(s => s.classGroup === otherCls);
        const hasStartedStudentInOther = otherClassStudents.some(s => {
          const status = getStudentTaskStatus(s.studentId);
          return status && status !== "not_started";
        });
        
        if (hasStartedStudentInOther) {
          alert(`이미 '${otherCls}'의 일부 학생이 과제를 진행 중이어서 배정 반을 변경할 수 없습니다.`);
          return;
        }
      }

      // 2. 다른 반 배정은 자동 취소되고 현재 반만 단일 배정
      handleToggleClassAssign(true, cls);
      setCurrentClass(cls);
    }
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

  // 집계 데이터
  const assignedCount = task.assignedStudents.length;
  const completedCount = task.assignedStudents.filter(s => s.status === "submitted").length;
  const notStartedCount = task.assignedStudents.filter(s => s.status === "not_started").length;
  const inProgressCount = task.assignedStudents.filter(s => s.status === "in_progress").length;
  
  // 이미 진행 중이거나 완료한 학생이 존재하는지 여부
  const hasStarted = completedCount > 0 || inProgressCount > 0;
  
  // 선택 요약 데이터 (이름 매핑 기반으로 중복 카운팅 방지)
  const finalSelectedIds = React.useMemo(() => {
    const ids = new Set([
      ...Array.from(individualIds),
      ...allStudents.filter(s => selectedClasses.has(s.classGroup)).map(s => s.studentId),
      ...task.assignedStudents.filter(s => s.status !== "not_started").map(s => {
        const realStudent = allStudents.find(real => real.studentName === s.studentName);
        return realStudent ? realStudent.studentId : s.studentId;
      })
    ]);

    if (isRelearnMode) {
      return new Set(Array.from(ids).filter(id => isStudentSelectable(id)));
    }
    return ids;
  }, [individualIds, selectedClasses, allStudents, task.assignedStudents, isRelearnMode, isStudentSelectable]);

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
      const isNotStarted = !status || status === "not_started";
      const isSelectable = !isRelearnMode || isStudentSelectable(s.studentId);
      return isNotStarted && isSelectable;
    });
  }, [filteredStudents, task.assignedStudents, isRelearnMode, isStudentSelectable]);

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
      setIndividualIds(prev => {
        const next = new Set(prev);
        selectableFilteredStudents.forEach(target => {
          next.delete(target.studentId);
        });
        return next;
      });
    }
  };

  // 배정 적용 버튼 비활성화 판단
  const isClassModeEmpty = assignMode === "class_mode" && currentClass !== "전체" && allStudents.filter(s => s.classGroup === currentClass && isStudentSelectable(s.studentId)).length === 0;
  const isIndividualModeEmpty = assignMode === "individual_mode" && finalSelectedIds.size === 0 && assignedCount === 0;
  const isDisabledApplyButton = isClassModeEmpty || isIndividualModeEmpty || (finalSelectedIds.size === 0 && assignedCount === 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[960px] h-[680px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-slate-200 shadow-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 flex flex-row items-center border-b border-slate-100 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-slate-800">
            <Users className="h-5 w-5 text-primary" />
            과제 배정 관리
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
          {/* 상단 정보 바 (가로 1줄 플랫 구조로 흐리멍텅한 둥근 라인 박스 완전 제거 및 영역 구분 강화) */}
          <div className="px-6 py-3 border-b border-slate-200/60 bg-white flex items-center justify-between gap-4 text-xs font-semibold text-slate-500 shrink-0 select-none shadow-xs">
            <div className="flex items-center gap-2 max-w-[50%] min-w-0">
              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 uppercase tracking-wider shrink-0">과제명</span>
              <span className="font-extrabold text-slate-800 leading-none truncate">{task.name}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 shrink-0">
              <span>학습과정 <strong className="text-slate-700 font-extrabold">{task.course}</strong></span>
              <span className="text-slate-300 font-light">·</span>
              <span>문제 수 <strong className="text-slate-700 font-extrabold">
                {isRelearnMode
                  ? (task.status === "published" || task.status === "ended" ? "학생별 상이" : "배정 시 확정")
                  : `${task.totalProblems}문항`
                }
              </strong></span>
              <span className="text-slate-300 font-light">·</span>
              <span className="text-slate-600 font-bold bg-slate-100/80 px-1.5 py-0.5 rounded border border-slate-200/30">
                {task.problemMode === "same" ? "동일 문제" : task.problemMode === "individual" ? "학생별 문제" : "학생별 재학습 유형"}
              </span>
            </div>
          </div>

          {/* 배정 현황 영역 (이미 배정된 학생이 있는 경우에만 상단 정보 바로 밑에 얇고 단정하게 렌더링) */}
          {assignedCount > 0 && (
            <div className={`px-6 py-3 border-b border-slate-200/40 bg-slate-50/50 grid ${isRelearnMode ? "grid-cols-5" : "grid-cols-4"} gap-3 shrink-0`}>
              <div className="bg-white px-3 py-2.5 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
                <span className="text-[10px] font-bold text-slate-500">배정 학생</span>
                <span className="text-sm font-black text-blue-600">{assignedCount}명</span>
              </div>
              <div className="bg-white px-3 py-2.5 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
                <span className="text-[10px] font-bold text-slate-500">완료 학생</span>
                <span className="text-sm font-black text-emerald-600">{completedCount}명</span>
              </div>
              <div className="bg-white px-3 py-2.5 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
                <span className="text-[10px] font-bold text-slate-500">미시작 학생</span>
                <span className="text-sm font-black text-slate-600">{notStartedCount}명</span>
              </div>
              <div className="bg-white px-3 py-2.5 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
                <span className="text-[10px] font-bold text-slate-500">진행중 학생</span>
                <span className="text-sm font-black text-amber-600">{inProgressCount}명</span>
              </div>
              {isRelearnMode && (
                <div className="bg-white px-3 py-2.5 rounded-lg border border-slate-200 flex items-center justify-between shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500">배정 제외</span>
                  <span className="text-sm font-black text-rose-500">
                    {allStudents.filter(s => {
                      if (assignMode === "class_mode" && currentClass !== "전체") {
                        return s.classGroup === currentClass && !isStudentSelectable(s.studentId);
                      }
                      return !isStudentSelectable(s.studentId);
                    }).length}명
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 1단계: 배정 방식 선택 화면 */}
          {assignMode === "select_mode" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-5 bg-slate-50/50">
              <div className="text-center flex flex-col items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50/90 px-2.5 py-0.5 rounded-full tracking-wider uppercase border border-indigo-100/50 shadow-xs">과제 배정 시작</span>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">과제 배정 방식을 선택해주세요</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-[680px]">
                {/* 카드 1: 반 단위 배정 (진한 인디고 bg & 화이트 텍스트로 압도적인 존재감 부여) */}
                <button
                  type="button"
                  onClick={() => {
                    setAssignMode("class_mode");
                    if (classesList.length > 0) {
                      setSelectedClasses(new Set([classesList[0]]));
                      setCurrentClass(classesList[0]);
                    }
                  }}
                  className="bg-indigo-600 p-5 rounded-xl border border-indigo-500 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 text-left group cursor-pointer"
                >
                  <div className="h-12 w-12 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-white border border-white/10 group-hover:bg-white group-hover:text-indigo-600 transition-colors duration-200 shadow-xs">
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-base font-black text-white group-hover:text-white transition-colors duration-200">반 단위 배정</h4>
                    <p className="text-[11px] text-indigo-100/90 leading-relaxed font-semibold">
                      선택한 반에 소속된 전체 학생들에게<br />
                      한 번에 과제를 편리하게 배정합니다.
                    </p>
                  </div>
                </button>

                {/* 카드 2: 개별 학생 배정 (진한 퍼플 bg & 화이트 텍스트로 압도적인 존재감 부여) */}
                <button
                  type="button"
                  onClick={() => {
                    setAssignMode("individual_mode");
                    setCurrentClass("전체");
                    setSelectedClasses(new Set());
                  }}
                  className="bg-purple-600 p-5 rounded-xl border border-purple-500 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-600/20 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 text-left group cursor-pointer"
                >
                  <div className="h-12 w-12 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-white border border-white/10 group-hover:bg-white group-hover:text-purple-600 transition-colors duration-200 shadow-xs">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-base font-black text-white group-hover:text-white transition-colors duration-200">개별 학생 배정</h4>
                    <p className="text-[11px] text-purple-100/90 leading-relaxed font-semibold">
                      반에 관계없이 과제를 풀 학생들만<br />
                      직접 한 명씩 개별적으로 골라서 배정합니다.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 2단계 CASE A: 반 단위 배정 특화 화면 */}
          {assignMode === "class_mode" && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
              <div className="px-6 pt-8 pb-3 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-4">
                  {!hasStarted && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssignMode("select_mode");
                        setSelectedClasses(new Set());
                      }}
                      className="h-8 px-3 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 flex items-center gap-1 cursor-pointer border border-slate-200 bg-white hover:text-slate-700 transition-all"
                    >
                      <span>← 이전</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {classesList.map(cls => {
                    const isAssigned = selectedClasses.has(cls);
                    const isCurrent = currentClass === cls;
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => handleClassTabClick(cls)}
                        className={`h-8 px-3.5 rounded-full text-xs font-bold transition-all duration-200 border flex items-center gap-1.5 ${
                          isAssigned
                            ? isCurrent
                              ? "bg-indigo-600 border-indigo-600 text-white ring-2 ring-indigo-600/30 ring-offset-1 shadow-sm font-black"
                              : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/80 font-bold"
                            : isCurrent
                              ? "bg-slate-100 border-slate-300 text-slate-700 font-bold"
                              : "bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-slate-50/50"
                        }`}
                      >
                        {isAssigned && <span className="text-[10px]">✓</span>}
                        {cls}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 반 소속 학생 명단 칩 목록 (화이트 플랫 카드로 영역 구분 및 중요도 선명화) */}
              <div className="flex-1 overflow-y-auto px-6 pt-2.5 pb-5">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-600" />
                      {currentClass} 소속 학생 명단
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {isRelearnMode ? (
                        <>
                          총 <span className="font-black text-slate-700">{allStudents.filter(s => s.classGroup === currentClass).length}</span>명
                          <span className="mx-1 text-slate-300">·</span>
                          배정 가능 <span className="font-black text-indigo-600">{allStudents.filter(s => s.classGroup === currentClass && isStudentSelectable(s.studentId)).length}</span>명
                          <span className="mx-1 text-slate-300">·</span>
                          배정 제외 <span className="font-black text-rose-500">{allStudents.filter(s => s.classGroup === currentClass && !isStudentSelectable(s.studentId)).length}</span>명
                        </>
                      ) : (
                        <>
                          총 <span className="font-black text-indigo-600">{allStudents.filter(s => s.classGroup === currentClass).length}</span>명
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {allStudents
                      .filter(s => s.classGroup === currentClass)
                      .map(s => {
                          const assignable = isStudentSelectable(s.studentId);
                          const selected = isSelected(s.studentId, s.classGroup);
                          return (
                            <div
                              key={s.studentId}
                              onClick={() => {
                                if (assignable) {
                                  toggleStudent(s.studentId, s.classGroup);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-bold transition-all duration-150 cursor-pointer ${
                                assignable
                                  ? selected
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/70"
                                    : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                                  : "bg-slate-100/50 border-slate-200/40 text-slate-400 opacity-60"
                              }`}
                            >
                              <div className={`h-1.5 w-1.5 rounded-full ${selected && assignable ? "bg-indigo-500" : "bg-slate-300"}`} />
                              <span>{s.studentName}</span>
                              {isRelearnMode && (
                                <span className={`text-[9px] px-1 py-0.2 rounded border ${
                                  assignable
                                    ? "bg-blue-50 text-blue-600 border-blue-100/60"
                                    : "bg-slate-100 text-slate-400 border-slate-200"
                                }`}>
                                  {assignable ? "배정 가능" : "출제 대상 없음"}
                                </span>
                              )}
                            </div>
                          );
                        })
                    }
                    {allStudents.filter(s => s.classGroup === currentClass).length === 0 && (
                      <span className="text-xs text-slate-400 italic py-2">이 반에 소속된 학생이 아직 없습니다.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2단계 CASE B: 개별 학생 배정 특화 화면 */}
          {assignMode === "individual_mode" && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
              <div className="px-6 pt-8 pb-3 flex items-center justify-between gap-4 shrink-0">
                {!hasStarted ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAssignMode("select_mode");
                      setIndividualIds(new Set());
                    }}
                    className="h-8 px-3 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 flex items-center gap-1 cursor-pointer border border-slate-200 bg-white hover:text-slate-700 transition-all"
                  >
                    <span>← 이전</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3 shrink-0">
                  <div className="relative w-44">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      className="h-9 pl-9 text-xs bg-slate-50 border border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-offset-0 transition-all rounded-lg"
                      placeholder="학생 이름 검색"
                      value={searchName}
                      onChange={e => setSearchName(e.target.value)}
                    />
                  </div>

                  <div className="h-6 w-px bg-slate-200" />

                  <div className="h-9 px-4 rounded-lg text-xs font-black bg-purple-600 border border-purple-600 text-white flex items-center gap-1.5 shadow-md shadow-purple-600/10 select-none">
                    <Users className="h-3.5 w-3.5" />
                    개별 학생 배정 모드
                  </div>
                </div>
              </div>

              {/* 목록 영역 (스크롤) */}
              <div className="flex-1 overflow-y-auto px-6 pt-2.5 pb-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black flex items-center gap-2 text-slate-700">
                      <Users className="h-4 w-4 text-purple-600" />
                      개별 학생 배정 목록
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
                              {searchName.trim() ? "검색 결과가 없습니다." : "학생 데이터가 없습니다."}
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map(s => {
                            const assignable = isStudentSelectable(s.studentId);
                            const selected = isSelected(s.studentId, s.classGroup);
                            const status = getStudentTaskStatus(s.studentId);
                            const isLocked = status && status !== "not_started";
                            const isClassSelected = selectedClasses.has(s.classGroup);
                            const isDisabled = isLocked || isClassSelected || (isRelearnMode && !assignable);
                            const assignType = (isRelearnMode && !assignable) ? "출제 대상 없음" :
                                             isClassSelected ? "반 배정" :
                                             individualIds.has(s.studentId) ? "개별 배정" :
                                             isLocked ? "개별 배정" : "-";

                            return (
                              <tr key={s.studentId} className={`hover:bg-slate-50/50 border-b border-slate-100 last:border-0 transition-colors duration-150 ${(isRelearnMode && !assignable) ? "bg-slate-50/30 opacity-70" : selected ? "bg-purple-50/30" : ""}`}>
                                <td className="py-3 px-4">
                                  <Checkbox
                                    checked={selected}
                                    onCheckedChange={() => toggleStudent(s.studentId, s.classGroup)}
                                    disabled={isDisabled}
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
                                    assignType === "출제 대상 없음" ? "bg-slate-100 text-slate-400 border-slate-200" :
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
          )}
        </div>

        {/* 하단 영역 (콤팩트한 취소/배정 적용 버튼) */}
        {assignMode !== "select_mode" ? (
          <div className="px-6 py-4 border-t bg-white flex items-center justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 font-black text-slate-500">
              취소
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={isDisabledApplyButton}
              className="h-10 px-8 font-black shadow-lg shadow-primary/20"
            >
              배정 적용 {finalSelectedIds.size > 0 && `(${finalSelectedIds.size}명)`}
            </Button>
          </div>
        ) : (
          <div className="px-6 py-4 border-t bg-white flex items-center justify-end shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 font-black text-slate-500">
              취소
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
