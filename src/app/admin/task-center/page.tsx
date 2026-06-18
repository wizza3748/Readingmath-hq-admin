"use client";

import React, { Suspense } from "react";
import TaskDashboard from "@/components/admin/task-center/task-dashboard";

export default function TaskCenterPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-500 font-bold">로딩 중...</div>}>
      <TaskDashboard />
    </Suspense>
  );
}
