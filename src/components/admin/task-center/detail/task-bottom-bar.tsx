"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TaskItem } from "@/lib/task-center-mock";
import { List, Trash2, Eye, Printer, StopCircle, Save } from "lucide-react";
import { ConfirmDialog } from "../confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTaskCenterStore } from "@/lib/task-center-store";

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

  const status = task?.status;

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

  // 출력 버튼 비활성:
  // 1) 동일 문제 출제 + 저장된 문제 수 0개
  // 2) 학생별 문제 출제 + 배정 학생 0명
  const isPrintDisabled =
    (task?.problemMode === "same" && totalProblems === 0) ||
    (task?.problemMode === "individual" && (task?.assignedStudents?.length ?? 0) === 0);

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
          {!isCreate && (
            <Button variant="outline" size="sm" onClick={() => toast({ title: "준비중입니다!" })} disabled={totalProblems === 0} className="gap-2">
              <Eye className="h-4 w-4" /> 미리보기
            </Button>
          )}

          {/* 출력 - draft, published, ended */}
          {!isCreate && task && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/task-center/${task.id}/print`)}
              disabled={isPrintDisabled}
              className="gap-2"
            >
              <Printer className="h-4 w-4" /> 출력
            </Button>
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
    </>
  );
}
