"use client";
import { TaskStatus } from "@/lib/task-center-mock";

const CONFIG: Record<TaskStatus, { label: string; cls: string }> = {
  draft:     { label: "작성중", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  published: { label: "게시됨", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  ended:     { label: "종료",   cls: "bg-gray-100 text-gray-500 border border-gray-200" },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const { label, cls } = CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
