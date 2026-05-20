"use client";
import React, { Suspense } from "react";
import TaskDetail from "@/components/admin/task-center/detail/task-detail";

export default function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = React.use(params);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TaskDetail taskId={taskId} />
    </Suspense>
  );
}
