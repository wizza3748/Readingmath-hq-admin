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
  const [problemMode, setProblemMode] = React.useState<ProblemMode>(normalizedExistingTask?.problemMode ?? "same");
  const [prioritizeUnsolved, setPrioritizeUnsolved] = React.useState(normalizedExistingTask?.prioritizeUnsolved ?? false);
  const [timeLimit, setTimeLimit] = React.useState<number | undefined>(normalizedExistingTask?.timeLimit);
  const [onlyImportant, setOnlyImportant] = React.useState(normalizedExistingTask?.onlyImportant ?? false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [listConfirmOpen, setListConfirmOpen] = React.useState(false);

  // 저장된 상태 스냅샷(dirty check용)
  const savedSnapshot = React.useRef(JSON.stringify({
    name: normalizedExistingTask?.name ?? "",
    selectedTypes: normalizedExistingTask?.selectedTypes ?? [],
    problemMode: normalizedExistingTask?.problemMode ?? "same",
    prioritizeUnsolved: normalizedExistingTask?.prioritizeUnsolved ?? false,
    timeLimit: normalizedExistingTask?.timeLimit,
    onlyImportant: normalizedExistingTask?.onlyImportant ?? false,
  }));

  React.useEffect(() => {
    if (normalizedExistingTask) {
      setName(normalizedExistingTask.name);
      setSelectedTypes(normalizedExistingTask.selectedTypes);
      setProblemMode(normalizedExistingTask.problemMode);
      setPrioritizeUnsolved(normalizedExistingTask.prioritizeUnsolved);
      setTimeLimit(normalizedExistingTask.timeLimit);
      setOnlyImportant(normalizedExistingTask.onlyImportant ?? false);
      
      const autoName = buildAutoName(normalizedExistingTask.selectedTypes);
      const isManual = normalizedExistingTask.name !== autoName;
      setNameManuallyEdited(isManual);

      savedSnapshot.current = JSON.stringify({
        name: normalizedExistingTask.name,
        selectedTypes: normalizedExistingTask.selectedTypes,
        problemMode: normalizedExistingTask.problemMode,
        prioritizeUnsolved: normalizedExistingTask.prioritizeUnsolved,
        timeLimit: normalizedExistingTask.timeLimit,
        onlyImportant: normalizedExistingTask.onlyImportant ?? false,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, normalizedExistingTask]);

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

  // 선택 유형 변경 시 초기화
  const handleTypesChange = (types: SelectedType[]) => {
    setSelectedTypes(types);
    if (!nameManuallyEdited) {
      setName(buildAutoName(types));
    }
  };

  // 출제 범위(중요 문제만) 변경 시 문제 수 재계산
  const handleOnlyImportantChange = (important: boolean) => {
    setOnlyImportant(important);
    const countKey = important ? "importantCount" : "maxCount";
    
    setSelectedTypes(prev => prev.map(t => {
      const max = t[countKey][t.difficulty];
      const min = max > 0 ? 1 : 0;
      return { ...t, problemCount: Math.max(min, 1) };
    }));
  };

  const isDirty = () => {
    const current = JSON.stringify({ name, selectedTypes, problemMode, prioritizeUnsolved, timeLimit, onlyImportant });
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

  const totalProblems = selectedTypes.reduce((s, t) => s + t.problemCount, 0);

  const handleProblemModeChange = (mode: ProblemMode) => {
    setProblemMode(mode);
    if (mode === "individual") {
      setPrioritizeUnsolved(true);
    } else {
      setPrioritizeUnsolved(false);
    }
  };

  const handleTypeProblemCountChange = (typeId: string, difficulty: Difficulty, count: number) => {
    setSelectedTypes(prev => prev.map(t => (t.typeId === typeId && t.difficulty === difficulty) ? { ...t, problemCount: count } : t));
  };

  const handleQuickSetAll = (count: number) => {
    if (selectedTypes.length === 0) return;

    const countKey = onlyImportant ? "importantCount" : "maxCount";

    // 1. 배분 대상 및 초기값 설정 (출제 가능 조합마다 1문항 우선 배정)
    const updated = selectedTypes.map(t => {
      const max = t[countKey][t.difficulty];
      return { ...t, problemCount: max > 0 ? 1 : 0 };
    });

    const currentTotal = updated.reduce((sum, t) => sum + t.problemCount, 0);
    let remainder = Math.max(0, count - currentTotal);

    // 2. 잔여 문항 순차 배분 (최대값 초과 금지)
    if (remainder > 0) {
      let safetyCounter = 0;
      while (remainder > 0 && safetyCounter < 1000) {
        let allocatedInThisRound = 0;
        for (let i = 0; i < updated.length && remainder > 0; i++) {
          const t = updated[i];
          const typeMax = t[countKey][t.difficulty];

          if (t.problemCount < typeMax) {
            t.problemCount++;
            remainder--;
            allocatedInThisRound++;
          }
        }
        if (allocatedInThisRound === 0) break;
        safetyCounter++;
      }
    }

    setSelectedTypes([...updated]);
  };

  const handleSave = () => {
    const totalMax = selectedTypes.reduce((sum, t) => sum + t.maxCount[t.difficulty], 0);

    if (!name.trim()) { toast({ title: "과제명을 입력하세요.", variant: "destructive" }); return; }
    if (selectedTypes.length === 0) { toast({ title: "유형·난이도를 1개 이상 선택하세요.", variant: "destructive" }); return; }
    if (totalMax === 0) { toast({ title: "선택한 유형·난이도에 출제 가능한 문제가 없습니다.", variant: "destructive" }); return; }

    // 중요 문제 부족 상태 검사
    if (onlyImportant) {
      const importantMax = selectedTypes.reduce((sum, t) => sum + t.importantCount[t.difficulty], 0);
      if (importantMax === 0) {
        toast({ title: "선택한 유형·난이도에 중요 문제가 없습니다.", variant: "destructive" });
        return;
      }
    }

    if (totalProblems === 0) { toast({ title: "문제 수를 설정하세요.", variant: "destructive" }); return; }

    // difficulties는 selectedTypes에서 추출하여 고유 목록 저장
    const finalDifficulties = Array.from(new Set(selectedTypes.map(t => t.difficulty)));

    setIsSaving(true);
    try {
      if (isCreate) {
        const newId = `task-${Date.now()}`;
        const newTask: TaskItem = {
          id: newId, subject, name: name.trim(), course: selectedTypes[0]?.course ?? "",
          status: "draft", difficulties: finalDifficulties, problemMode, prioritizeUnsolved,
          timeLimit, onlyImportant, selectedTypes, totalProblems,
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
          timeLimit, onlyImportant, selectedTypes, totalProblems,
          course: selectedTypes[0]?.course ?? normalizedExistingTask?.course ?? "",
          problemScope: onlyImportant ? "important" : "all", // 하위 호환용
        });
        savedSnapshot.current = JSON.stringify({ name: name.trim(), selectedTypes, problemMode, prioritizeUnsolved, timeLimit, onlyImportant });
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
            onlyImportant={onlyImportant}
            readonly={readonly}
            onTypesChange={handleTypesChange}
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
              timeLimit={timeLimit}
              onlyImportant={onlyImportant}
              readonly={readonly}
              onNameChange={(v) => { setName(v); setNameManuallyEdited(true); }}
              onTypeProblemCountChange={handleTypeProblemCountChange}
              onProblemModeChange={handleProblemModeChange}
              onTimeLimitChange={setTimeLimit}
              onOnlyImportantChange={handleOnlyImportantChange}
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
