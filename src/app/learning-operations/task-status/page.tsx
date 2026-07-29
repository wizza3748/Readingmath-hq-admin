"use client";

import dynamic from "next/dynamic";

const TaskStatusDashboard = dynamic(
  () => import("@/components/learning-operations/task-status-dashboard"),
  { ssr: false },
);

export default function TaskStatusPage() {
  return <TaskStatusDashboard />;
}
