"use client";
import * as React from "react";
import { ClipboardList } from "lucide-react";
import { TaskItem, getTaskStatusLabel } from "@/lib/task-center-mock";
import { TaskStatusBadge } from "../task-status-badge";

interface Props {
  task?: TaskItem;
  isCreate: boolean;
}

export function TaskDetailHeader({ task, isCreate }: Props) {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.replace("T", " ").substring(0, 16);
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-[1.5rem] font-extrabold text-slate-900">
          과제 상세
        </h1>
        {!isCreate && task && (
          <TaskStatusBadge status={task.status} />
        )}
      </div>
      {!isCreate && task && task.createdAt && (
        <div className="text-xs font-semibold text-slate-500">
          생성일: {formatDate(task.createdAt)}
        </div>
      )}
    </div>
  );
}
