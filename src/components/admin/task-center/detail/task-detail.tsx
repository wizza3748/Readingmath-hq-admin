"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTaskCenterStore } from "@/lib/task-center-store";
import { useToast } from "@/hooks/use-toast";
import {
  TaskItem, SelectedType, Difficulty, ProblemMode, Subject, ProblemScope,
  normalizeTask, makeComboKey, MATH_CURRICULA, SCIENCE_CURRICULA, buildAutoName,
} from "@/lib/task-center-mock";
import { TaskDetailHeader } from "./task-detail-header";
import { TaskTypePanel } from "./task-type-panel";
import { TaskSettingPanel } from "./task-setting-panel";
import { TaskBottomBar } from "./task-bottom-bar";
import { ConfirmDialog } from "../confirm-dialog";

const DIFFICULTY_LIST: Difficulty[] = ["basic", "intermediate", "advanced"];

interface Props {
  taskId?: string;
}

export default function TaskDetail({ taskId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { tasks, addTask, updateTask, setCurrentSubject } = useTaskCenterStore();

  const existingTask = React.useMemo(() => 
    taskId ? tasks.find(t => t.id === taskId) : undefined, 
  [taskId, tasks]);

  const isCreate = !taskId;
  const spSubject = searchParams.get("subject") as Subject | null;
  const subject: Subject = existingTask?.subject ?? (spSubject === "science" ? "science" : "math");

  const normalizedExistingTask = React.useMemo(() => 
    existingTask ? normalizeTask(existingTask, subject) : undefined, 
  [existingTask, subject]);

  const readonly = normalizedExistingTask?.status === "published" || normalizedExistingTask?.status === "ended";

  // ── 폼 상태
  const [name, setName] = React.useState(normalizedExistingTask?.name ?? "");
  const [nameManuallyEdited, setNameManuallyEdited] = React.useState(false);
  const [selectedTypes, setSelectedTypes] = React.useState<SelectedType[]>(normalizedExistingTask?.selectedTypes ?? []);
  const [checkedTypeIds, setCheckedTypeIds] = React.useState<string[]>(() => {
    const existing = normalizedExistingTask?.selectedTypes ?? [];
    return Array.from(new Set(existing.map(t => t.typeId)));
  });
  const [bulkDifficulties, setBulkDifficulties] = React.useState<Record<Difficulty, boolean>>({
    basic: true,
    intermediate: true,
    advanced: true
  });
  const [problemMode, setProblemMode] = React.useState<ProblemMode>(normalizedExistingTask?.problemMode ?? "same");
  const [prioritizeUnsolved, setPrioritizeUnsolved] = React.useState(normalizedExistingTask?.prioritizeUnsolved ?? false);
  const [onlyImportant, setOnlyImportant] = React.useState(normalizedExistingTask?.onlyImportant ?? false);
  const [onlyImportantType, setOnlyImportantType] = React.useState(normalizedExistingTask?.onlyImportantType ?? false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [listConfirmOpen, setListConfirmOpen] = React.useState(false);

  // 저장된 상태 스냅샷(dirty check용)
  const savedSnapshot = React.useRef(JSON.stringify({
    name: normalizedExistingTask?.name ?? "",
    selectedTypes: normalizedExistingTask?.selectedTypes ?? [],
    problemMode: normalizedExistingTask?.problemMode ?? "same",
    prioritizeUnsolved: normalizedExistingTask?.prioritizeUnsolved ?? false,
    onlyImportant: normalizedExistingTask?.onlyImportant ?? false,
    onlyImportantType: normalizedExistingTask?.onlyImportantType ?? false,
  }));

  const getAutoTaskName = React.useCallback((types: SelectedType[], taskCreatedAt?: string) => {
    if (!types || types.length === 0) return "";
    
    // 1. 날짜 YYYY-MM-DD 포맷팅 (createdAt이 제공되면 해당 날짜 사용, 없으면 오늘 날짜 사용)
    const targetDate = taskCreatedAt ? new Date(taskCreatedAt) : new Date();
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dd = String(targetDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    // 2. 선택된 유형들의 단원 목록을 '커리큘럼 트리 정렬 순서'를 기준으로 고유값 수집
    const list = subject === "science" ? SCIENCE_CURRICULA : MATH_CURRICULA;
    const currentCourse = types[0]?.course ?? "";
    const curriculum = list.find(c => c.course === currentCourse);
    
    if (!curriculum) {
      // 혹시라도 커리큘럼을 찾지 못할 경우의 안전 폴백 (기존 selectedTypes 기준 최초 순서)
      const fallbackMinors = Array.from(new Set(types.map(t => t.minorUnit)));
      if (fallbackMinors.length === 0) return "";
      const base = fallbackMinors[0];
      return fallbackMinors.length <= 1 
        ? `${dateStr} | ${base}` 
        : `${dateStr} | ${base} 외 ${fallbackMinors.length - 1}건`;
    }
    
    // 커리큘럼 순서대로 선택된 단원 수집 (중복 제거)
    const checkedMinors = new Set<string>();
    const selectedTypeIds = new Set(types.map(t => t.typeId));
    
    curriculum.types.forEach(ct => {
      if (selectedTypeIds.has(ct.id)) {
        checkedMinors.add(ct.minorUnit);
      }
    });
    
    const sortedMinors = Array.from(checkedMinors);
    if (sortedMinors.length === 0) return "";
    
    const base = sortedMinors[0];
    return sortedMinors.length <= 1 
      ? `${dateStr} | ${base}` 
      : `${dateStr} | ${base} 외 ${sortedMinors.length - 1}건`;
  }, [subject]);

  React.useEffect(() => {
    if (normalizedExistingTask) {
      const autoName = getAutoTaskName(normalizedExistingTask.selectedTypes, normalizedExistingTask.createdAt);
      const isManual = normalizedExistingTask.name !== autoName;
      setName(isManual ? normalizedExistingTask.name : (autoName || normalizedExistingTask.name));
      setSelectedTypes(normalizedExistingTask.selectedTypes);
      setCheckedTypeIds(Array.from(new Set(normalizedExistingTask.selectedTypes.map(t => t.typeId))));
      setProblemMode(normalizedExistingTask.problemMode);
      setPrioritizeUnsolved(normalizedExistingTask.prioritizeUnsolved);
      setOnlyImportant(normalizedExistingTask.onlyImportant ?? false);
      setOnlyImportantType(normalizedExistingTask.onlyImportantType ?? false);
      
      setNameManuallyEdited(isManual);

      savedSnapshot.current = JSON.stringify({
        name: normalizedExistingTask.name,
        selectedTypes: normalizedExistingTask.selectedTypes,
        problemMode: normalizedExistingTask.problemMode,
        prioritizeUnsolved: normalizedExistingTask.prioritizeUnsolved,
        onlyImportant: normalizedExistingTask.onlyImportant ?? false,
        onlyImportantType: normalizedExistingTask.onlyImportantType ?? false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, normalizedExistingTask, getAutoTaskName]);

  // ── 개발 환경 전용 selectedTypes 검증 디버그 로그
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !normalizedExistingTask) return;
    
    const list = subject === "science" ? SCIENCE_CURRICULA : MATH_CURRICULA;
    const curriculum = list.find(c => c.course === normalizedExistingTask.course);
    
    if (!curriculum) {
      console.warn(`[TaskDetail Debug] Task ${normalizedExistingTask.id}: 학습과정 "${normalizedExistingTask.course}"에 해당하는 커리큘럼을 찾을 수 없습니다.`);
      return;
    }

    normalizedExistingTask.selectedTypes.forEach(t => {
      const realType = curriculum.types.find(ct => ct.id === t.typeId);
      if (!realType) {
        console.warn(`[TaskDetail Debug] Task ${normalizedExistingTask.id} - 커리큘럼에 존재하지 않는 typeId 발견: "${t.typeId}" (유형명: ${t.typeName})`);
      } else {
        const count = realType.difficultyCount[t.difficulty] || 0;
        if (count === 0) {
          console.warn(`[TaskDetail Debug] Task ${normalizedExistingTask.id} - 출제 불가 difficulty 발견 (배정 문항 수 0): typeId="${t.typeId}", difficulty="${t.difficulty}"`);
        }
      }
    });
  }, [normalizedExistingTask, subject]);

  // 선택 유형 변경 시 초기화 및 100개 / 300문항 초과 방지
  const handleTypesChange = (types: SelectedType[]) => {
    const currentMultiplier = selectedTypes[0]?.problemCount ?? 1;
    
    // 추가하려는 시도인지 확인 (기존 선택 개수보다 많아지는 경우)
    if (types.length > selectedTypes.length) {
      if (types.length > 100) {
        toast({
          title: "출제 유형은 최대 100개까지 선택할 수 있습니다.",
          description: "유형 선택을 줄여주세요.",
          variant: "destructive"
        });
        return;
      }
      
      // 각 problemCount를 현재 배수(multiplier)로 보정
      const adjustedTypes = types.map(t => ({
        ...t,
        problemCount: selectedTypes.find(exist => exist.typeId === t.typeId && exist.difficulty === t.difficulty)?.problemCount ?? currentMultiplier,
        maxCount: { basic: 3, intermediate: 3, advanced: 3 } // 모든 유형 문제 수 3개로 목킹
      }));
      
      const expectedTotal = adjustedTypes.length * currentMultiplier;
      if (expectedTotal > 300) {
        toast({ title: "전체 출제 문제 수는 최대 300문항입니다.", variant: "destructive" });
        return;
      }
      
      setSelectedTypes(adjustedTypes);
      if (!nameManuallyEdited) {
        setName(getAutoTaskName(adjustedTypes, normalizedExistingTask?.createdAt));
      }
    } else {
      // 삭제나 동일 유지인 경우
      const adjustedTypes = types.map(t => ({
        ...t,
        problemCount: selectedTypes.find(exist => exist.typeId === t.typeId && exist.difficulty === t.difficulty)?.problemCount ?? currentMultiplier,
        maxCount: { basic: 3, intermediate: 3, advanced: 3 } // 모든 유형 문제 수 3개로 목킹
      }));
      
      setSelectedTypes(adjustedTypes);
      if (!nameManuallyEdited) {
        setName(getAutoTaskName(adjustedTypes, normalizedExistingTask?.createdAt));
      }
    }
  };

  // 출제 범위(중요 문제만) 변경
  const handleOnlyImportantChange = (important: boolean) => {
    setOnlyImportant(important);
    if (important) {
      setSelectedTypes(prev =>
        prev
          .filter(t => (t.importantCount?.[t.difficulty] ?? 0) > 0)
          .map(t => ({ ...t, problemCount: 1 }))
      );
    }
  };

  // 중요 유형만 출제 필터 변경
  const handleOnlyImportantTypeChange = (v: boolean) => {
    setOnlyImportantType(v);
  };

  const isDirty = () => {
    const current = JSON.stringify({ name, selectedTypes, problemMode, prioritizeUnsolved, onlyImportant, onlyImportantType });
    return current !== savedSnapshot.current;
  };

  const handleListClick = () => {
    if ((isCreate && (selectedTypes.length > 0 || name)) || (!isCreate && isDirty())) {
      setListConfirmOpen(true);
    } else {
      setCurrentSubject(subject);
      router.push("/admin/task-center");
    }
  };

  // 중요 유형만 출제 ON 시: 중요 유형(importantCount 합 > 0)만 계산 대상으로 필터링
  const activeSelectedTypesForCalculation = onlyImportantType
    ? selectedTypes.filter(t => t.importantCount.basic > 0 || t.importantCount.intermediate > 0 || t.importantCount.advanced > 0)
    : selectedTypes;

  // 중요 문제만 출제 ON 시: 각 조합의 importantCount[difficulty] 를 초과하지 않도록 clamp
  const totalProblems = onlyImportant
    ? activeSelectedTypesForCalculation.reduce((s, t) => {
        const importantMax = t.importantCount?.[t.difficulty] ?? 0;
        return s + (importantMax > 0 ? Math.min(t.problemCount, importantMax) : 0);
      }, 0)
    : activeSelectedTypesForCalculation.reduce((s, t) => s + t.problemCount, 0);

  const handleProblemModeChange = (mode: ProblemMode) => {
    setProblemMode(mode);
    if (mode === "individual") {
      setPrioritizeUnsolved(true);
    } else {
      setPrioritizeUnsolved(false);
    }
  };

  const handleTypeProblemCountChange = (typeId: string, difficulty: Difficulty, count: number) => {
    if (onlyImportant) return;
    setSelectedTypes(prev => prev.map(t => (t.typeId === typeId && t.difficulty === difficulty) ? { ...t, problemCount: count } : t));
  };

  // multiplier(배수) 일괄 적용 방식으로 변경
  const handleQuickSetAll = (multiplier: number) => {
    if (onlyImportant) return;
    if (selectedTypes.length === 0) return;
    
    const expectedTotal = selectedTypes.length * multiplier;
    if (expectedTotal > 300) {
      toast({ title: "전체 출제 문제 수는 최대 300문항입니다.", variant: "destructive" });
      return;
    }

    setSelectedTypes(prev => prev.map(t => ({
      ...t,
      problemCount: multiplier
    })));
  };

  const handleSave = () => {
    const activeTypesForCheck = onlyImportantType
      ? selectedTypes.filter(t => t.importantCount.basic > 0 || t.importantCount.intermediate > 0 || t.importantCount.advanced > 0)
      : selectedTypes;

    const totalMax = activeTypesForCheck.reduce((sum, t) => sum + t.maxCount[t.difficulty], 0);

    if (!name.trim()) { toast({ title: "과제명을 입력하세요.", variant: "destructive" }); return; }
    if (activeTypesForCheck.length === 0) { toast({ title: "선택한 단원에 출제 가능한 중요 유형이 없습니다.", variant: "destructive" }); return; }
    if (totalMax === 0) { toast({ title: "선택한 유형·난이도에 출제 가능한 문제가 없습니다.", variant: "destructive" }); return; }

    // 중요 문제 부족 상태 검사
    if (onlyImportant) {
      const importantMax = activeTypesForCheck.reduce((sum, t) => sum + (t.importantCount?.[t.difficulty] ?? 0), 0);
      if (importantMax === 0) {
        toast({ title: "선택한 유형·난이도에 중요 문제가 없습니다.", variant: "destructive" });
        return;
      }

      // 저장 직전 방어 1. 중요 문제 수 0개 조합 저장 금지
      const hasZeroImportant = selectedTypes.some(t => (t.importantCount?.[t.difficulty] ?? 0) === 0);
      if (hasZeroImportant) {
        toast({ title: "선택한 유형·난이도 중 중요 문제가 없는 항목이 있습니다.", variant: "destructive" });
        return;
      }

      // 저장 직전 방어 3. 문제 수 1 초과 저장 금지
      const hasOverOne = selectedTypes.some(t => t.problemCount > 1);
      if (hasOverOne) {
        toast({ title: "중요 문제만 출제 시 문제 수는 1문항을 초과할 수 없습니다.", variant: "destructive" });
        return;
      }
    }

    if (totalProblems === 0) { toast({ title: "문제 수를 설정하세요.", variant: "destructive" }); return; }

    // 저장 직전 방어 2. 중요 문제만 출제 ON 상태에서 모든 선택 조합 problemCount=1 보정
    const finalSelectedTypes = onlyImportant
      ? selectedTypes.map(t => ({ ...t, problemCount: 1 }))
      : selectedTypes;

    const finalTotalProblems = onlyImportant ? finalSelectedTypes.length : totalProblems;

    // difficulties는 selectedTypes에서 추출하여 고유 목록 저장
    const finalDifficulties = Array.from(new Set(finalSelectedTypes.map(t => t.difficulty)));

    setIsSaving(true);
    try {
      if (isCreate) {
        const newId = `task-${Date.now()}`;
        const newTask: TaskItem = {
          id: newId, subject, name: name.trim(), course: finalSelectedTypes[0]?.course ?? "",
          status: "draft", difficulties: finalDifficulties, problemMode, prioritizeUnsolved,
          onlyImportant, onlyImportantType, selectedTypes: finalSelectedTypes, totalProblems: finalTotalProblems,
          createdAt: new Date().toISOString(), assignedStudents: [],
          problemScope: onlyImportant ? "important" : "all", // 하위 호환용
        };
        addTask(newTask);
        setCurrentSubject(subject);
        toast({ title: "저장되었습니다." });
        router.push(`/admin/task-center/${newId}`);
      } else if (taskId) {
        updateTask(taskId, {
          name: name.trim(), difficulties: finalDifficulties, problemMode, prioritizeUnsolved,
          onlyImportant, onlyImportantType, selectedTypes: finalSelectedTypes, totalProblems: finalTotalProblems,
          course: finalSelectedTypes[0]?.course ?? normalizedExistingTask?.course ?? "",
          problemScope: onlyImportant ? "important" : "all", // 하위 호환용
        });
        savedSnapshot.current = JSON.stringify({ name: name.trim(), selectedTypes: finalSelectedTypes, problemMode, prioritizeUnsolved, onlyImportant, onlyImportantType });
        setCurrentSubject(subject);
        toast({ title: "저장되었습니다." });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] pb-24">
      <TaskDetailHeader task={existingTask} isCreate={isCreate} />

      <div className="px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-5 items-start">
          {/* 좌측: 유형 선택 */}
          <TaskTypePanel
            subject={subject}
            selectedTypes={selectedTypes}
            checkedTypeIds={checkedTypeIds}
            bulkDifficulties={bulkDifficulties}
            onlyImportant={onlyImportant}
            onlyImportantType={onlyImportantType}
            readonly={readonly}
            onTypesChange={handleTypesChange}
            onCheckedTypesChange={setCheckedTypeIds}
            onBulkDifficultiesChange={setBulkDifficulties}
          />

          {/* 우측: 과제 설정 */}
          <div className="flex flex-col gap-5">
            <TaskSettingPanel
              task={normalizedExistingTask}
              taskId={taskId}
              name={name}
              selectedTypes={selectedTypes}
              problemMode={problemMode}
              prioritizeUnsolved={prioritizeUnsolved}
              onlyImportant={onlyImportant}
              onlyImportantType={onlyImportantType}
              readonly={readonly}
              onNameChange={(v) => { 
                setName(v); 
                if (!v.trim()) {
                  setNameManuallyEdited(false); 
                } else {
                  setNameManuallyEdited(true); 
                }
              }}
              onTypeProblemCountChange={handleTypeProblemCountChange}
              onProblemModeChange={handleProblemModeChange}
              onOnlyImportantChange={handleOnlyImportantChange}
              onOnlyImportantTypeChange={handleOnlyImportantTypeChange}
              onQuickSetAll={handleQuickSetAll}
            />
          </div>
        </div>
      </div>

      <TaskBottomBar
        task={existingTask}
        isCreate={isCreate}
        isSaving={isSaving}
        totalProblems={totalProblems}
        onSave={handleSave}
        onListClick={handleListClick}
      />

      {/* 목록 이동 확인창 */}
      <ConfirmDialog
        open={listConfirmOpen}
        onOpenChange={setListConfirmOpen}
        title="목록으로 이동"
        description={"저장하지 않은 변경 내용이 있습니다.\n목록으로 이동하시겠습니까?"}
        confirmLabel="이동"
        onConfirm={() => {
          setCurrentSubject(subject);
          router.push("/admin/task-center");
        }}
      />
    </div>
  );
}
