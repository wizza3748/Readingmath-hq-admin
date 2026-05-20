"use client";
import React, { Suspense } from "react";
import TaskPrintView from "@/components/admin/task-center/print/task-print-view";

export default function TaskPrintPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = React.use(params);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TaskPrintView taskId={taskId} />
    </Suspense>
  );
}
