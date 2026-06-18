"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TaskItem } from "@/lib/task-center-mock";
import { List, Trash2, Eye, Printer, StopCircle, Save } from "lucide-react";
import { ConfirmDialog } from "../confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTaskCenterStore } from "@/lib/task-center-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { evaluateStudentAchievement } from "@/utils/examPrepStorage";

interface Props {
  task?: TaskItem;
  isCreate: boolean;
  isSaving?: boolean;
  totalProblems: number;
  onSave: () => void;
  onListClick: () => void;
}

export function TaskBottomBar({ task, isCreate, isSaving, totalProblems, onSave, onListClick }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { deleteTask, endTask } = useTaskCenterStore();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [endOpen, setEndOpen] = React.useState(false);
  const [studentSelectOpen, setStudentSelectOpen] = React.useState(false);
  const [selectedPreviewStudentId, setSelectedPreviewStudentId] = React.useState("");

  const status = task?.status;

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

  const previewStatus = React.useMemo(() => {
    if (!task) return { disabled: true, reason: "" };

    if (totalProblems === 0) {
      return { disabled: true, reason: "미리보기할 문제가 없습니다." };
    }

    const activeStudents = (task.assignedStudents || []).filter(s => s.status !== ("canceled" as any));

    if (task.problemMode === "individual") {
      if (activeStudents.length === 0) {
        return { disabled: true, reason: "학생별 문제 출제 과제는 배정 후 미리보기할 수 있습니다." };
      }
    }

    if (task.problemMode === "relearn") {
      const selectableStudentsCount = activeStudents.filter(s => isStudentSelectable(s.studentId)).length;
      if (selectableStudentsCount === 0) {
        return { disabled: true, reason: "학생별 재학습 유형 출제 과제는 배정 후 미리보기할 수 있습니다." };
      }
    }

    return { disabled: false, reason: "" };
  }, [task, totalProblems, isStudentSelectable]);

  const previewCandidates = React.useMemo(() => {
    if (!task) return [];
    const activeStudents = (task.assignedStudents || []).filter(s => s.status !== ("canceled" as any));
    if (task.problemMode === "individual") {
      return activeStudents;
    }
    if (task.problemMode === "relearn") {
      return activeStudents.filter(s => isStudentSelectable(s.studentId));
    }
    return [];
  }, [task, isStudentSelectable]);

  const handlePreviewClick = () => {
    if (!task) return;
    
    if (task.problemMode === "same") {
      const folder = task.subject === "science" ? "science-task-center" : "math-task-center";
      window.open(`/content/${folder}/${task.id}/solve?preview=true`, "_blank");
      return;
    }
    
    if (previewCandidates.length > 0) {
      setSelectedPreviewStudentId(previewCandidates[0].studentId);
      setStudentSelectOpen(true);
    }
  };

  const handleConfirmPreview = () => {
    if (!task || !selectedPreviewStudentId) return;
    const folder = task.subject === "science" ? "science-task-center" : "math-task-center";
    window.open(`/content/${folder}/${task.id}/solve?preview=true&previewStudentId=${selectedPreviewStudentId}`, "_blank");
    setStudentSelectOpen(false);
  };

  const handleDelete = () => {
    if (!task) return;
    deleteTask(task.id);
    toast({ title: "삭제되었습니다." });
    router.push("/admin/task-center");
  };

  const handleEnd = () => {
    if (!task) return;
    endTask(task.id);
    toast({ title: "과제가 종료되었습니다." });
    setEndOpen(false);
  };

  const printStatus = React.useMemo(() => {
    if (!task) return { disabled: true, reason: "" };

    const activeStudents = (task.assignedStudents || []).filter(
      s => s.status !== ("canceled" as any)
    );

    if (task.problemMode === "same") {
      if (totalProblems === 0) {
        return { disabled: true, reason: "출력할 문제가 없습니다." };
      }
    }

    if (task.problemMode === "individual") {
      if (activeStudents.length === 0) {
        return { disabled: true, reason: "학생별 문제 출제 과제는 배정 후 출력할 수 있습니다." };
      }
    }

    if (task.problemMode === "relearn") {
      const printableStudentsCount = activeStudents.filter(
        s => isStudentSelectable(s.studentId)
      ).length;
      if (printableStudentsCount === 0) {
        return { disabled: true, reason: "학생별 재학습 유형 출제 과제는 배정 후 출력할 수 있습니다." };
      }
    }

    return { disabled: false, reason: "" };
  }, [task, totalProblems, isStudentSelectable]);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-[2px] border-t border-slate-200 px-6 py-4 flex items-center justify-between shadow-[0_-6px_20px_-4px_rgba(0,0,0,0.06)]">
        {/* 왼쪽: 목록 */}
        <Button variant="outline" size="sm" onClick={onListClick} className="gap-2">
          <List className="h-4 w-4" /> 목록
        </Button>

        {/* 오른쪽: 액션 버튼 */}
        <div className="flex items-center gap-2">
          {/* 삭제 - draft */}
          {!isCreate && status === "draft" && (
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" /> 삭제
            </Button>
          )}

          {/* 미리보기 - draft, published, ended */}
          {!isCreate && task && (
            <div title={previewStatus.disabled ? previewStatus.reason : undefined}>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewClick}
                disabled={previewStatus.disabled}
                className="gap-2"
              >
                <Eye className="h-4 w-4" /> 미리보기
              </Button>
            </div>
          )}

          {/* 출력 - draft, published, ended */}
          {!isCreate && task && (
            <div title={printStatus.disabled ? printStatus.reason : undefined}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/admin/task-center/${task.id}/print`)}
                disabled={printStatus.disabled}
                className="gap-2"
              >
                <Printer className="h-4 w-4" /> 출력
              </Button>
            </div>
          )}

          {/* 종료 - published */}
          {!isCreate && status === "published" && (
            <Button variant="outline" size="sm" onClick={() => setEndOpen(true)} className="gap-2 text-orange-600 border-orange-300 hover:bg-orange-50">
              <StopCircle className="h-4 w-4" /> 종료
            </Button>
          )}

          {/* 저장 - create 또는 draft */}
          {(isCreate || status === "draft") && (
            <Button size="sm" onClick={onSave} disabled={isSaving} className="gap-2 bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4" /> {isSaving ? "저장중..." : "저장"}
            </Button>
          )}
        </div>
      </div>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="과제 삭제"
        description={`"${task?.name}" 과제를 삭제하시겠습니까?\n삭제한 과제는 복구할 수 없습니다.`}
        confirmLabel="삭제"
        confirmVariant="destructive"
        onConfirm={handleDelete}
      />

      {/* 종료 확인 */}
      <ConfirmDialog
        open={endOpen}
        onOpenChange={setEndOpen}
        title="과제 종료"
        description={"과제를 종료하시겠습니까?\n종료 후 학생은 과제를 더 이상 진행할 수 없습니다."}
        confirmLabel="종료"
        onConfirm={handleEnd}
      />
      {/* 미리보기 학생 선택 모달 */}
      <Dialog open={studentSelectOpen} onOpenChange={setStudentSelectOpen}>
        <DialogContent className="max-w-[400px] rounded-2xl border border-slate-200 p-5 shadow-2xl bg-white text-slate-900">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="text-lg font-extrabold text-slate-800">
              미리보기 학생 선택
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 max-h-[280px] overflow-y-auto flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500 mb-2">
              미리보기할 학생을 선택해 주세요. 해당 학생에게 배정된 문항 기준으로 미리보기가 표시됩니다.
            </p>
            {previewCandidates.map(student => (
              <label 
                key={student.studentId}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  selectedPreviewStudentId === student.studentId
                    ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input 
                  type="radio" 
                  name="previewStudent" 
                  value={student.studentId}
                  checked={selectedPreviewStudentId === student.studentId}
                  onChange={() => setSelectedPreviewStudentId(student.studentId)}
                  className="accent-primary h-4 w-4"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold">{student.studentName}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{student.classGroup}</span>
                </div>
              </label>
            ))}
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <Button 
              variant="outline" 
              onClick={() => setStudentSelectOpen(false)}
              className="h-10 px-5 font-black text-slate-500 rounded-xl"
            >
              취소
            </Button>
            <Button 
              onClick={handleConfirmPreview}
              className="h-10 px-6 font-black rounded-xl shadow-lg shadow-primary/20"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
