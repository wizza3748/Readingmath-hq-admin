"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { TaskItem, getStudentTaskStatusLabel } from "@/lib/task-center-mock";
import { Printer, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskItem;
}

export function PrintModal({ open, onOpenChange, task }: PrintModalProps) {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const isSameMode = task.problemMode === "same";
  const students = task.assignedStudents;

  React.useEffect(() => {
    if (open) setSelectedIds(new Set());
  }, [open]);

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrint = () => {
    toast({ title: "출력 파일이 생성되었습니다." });
    onOpenChange(false);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "submitted": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "timeout": return "bg-orange-50 text-orange-700 border-orange-200";
      case "in_progress": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 rounded-2xl border border-slate-200 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <Printer className="h-4 w-4 text-primary" />
            과제 출력 설정
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* 과제명 정보 */}
          <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-medium">과제명: </span>
              <span className="font-bold text-slate-700">{task.name}</span>
            </div>
            <Badge variant="outline" className="text-xs bg-white border-slate-200 text-slate-600 font-semibold shadow-xs">
              {task.problemMode === "same" ? "동일 문제 출제" : "학생별 문제 출제"}
            </Badge>
          </div>

          {isSameMode ? (
            /* 동일 문제 출제 */
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Printer className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">공통 학습지 출력</p>
                <p className="text-sm text-muted-foreground mt-1">
                  모든 학생에게 동일한 학습지를 출력합니다.
                </p>
              </div>
              <Button
                onClick={handlePrint}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Printer className="h-4 w-4" />
                공통 학습지 출력
              </Button>
            </div>
          ) : (
            /* 학생별 문제 출제 */
            <>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2">출력 대상 학생 선택</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="w-10 py-2.5 px-3">
                          <Checkbox
                            checked={students.length > 0 && students.every((s) => selectedIds.has(s.studentId))}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedIds(new Set(students.map((s) => s.studentId)));
                              else setSelectedIds(new Set());
                            }}
                          />
                        </th>
                        <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">학생명</th>
                        <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">반</th>
                        <th className="py-2.5 px-3 text-right font-medium text-muted-foreground">문제 수</th>
                        <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">과제 상태</th>
                        <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">출력 상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr
                          key={s.studentId}
                          className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors duration-150 cursor-pointer"
                          onClick={() => toggleStudent(s.studentId)}
                        >
                          <td className="py-2.5 px-3">
                            <Checkbox
                              checked={selectedIds.has(s.studentId)}
                              onCheckedChange={() => toggleStudent(s.studentId)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="py-2.5 px-3 font-medium">{s.studentName}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{s.classGroup}</td>
                          <td className="py-2.5 px-3 text-right">{s.problemCount ?? task.totalProblems}문항</td>
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className={`text-xs ${getStatusClass(s.status)}`}>
                              {getStudentTaskStatusLabel(s.status)}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3">
                            {s.printStatus === "printed" ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle2 className="h-3.5 w-3.5" /> 출력완료
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">미출력</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {!isSameMode && (
          <DialogFooter className="px-6 py-4 border-t gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              전체 학생 출력
            </Button>
            <Button
              onClick={handlePrint}
              disabled={selectedIds.size === 0}
              className="gap-2 bg-primary"
            >
              <Printer className="h-4 w-4" />
              선택 학생 출력 ({selectedIds.size}명)
            </Button>
          </DialogFooter>
        )}
        {isSameMode && (
          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
