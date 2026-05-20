"use client";
import React, { Suspense } from "react";
import TaskDetail from "@/components/admin/task-center/detail/task-detail";

export default function CreatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TaskDetail />
    </Suspense>
  );
}
