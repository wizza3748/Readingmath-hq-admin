"use client";
import * as React from "react";
import { Difficulty, getDifficultyLabel } from "@/lib/task-center-mock";

const COLOR: Record<Difficulty, string> = {
  basic:        "bg-sky-50 text-sky-700 border border-sky-200",
  intermediate: "bg-violet-50 text-violet-700 border border-violet-200",
  advanced:     "bg-rose-50 text-rose-700 border border-rose-200",
};

export function DifficultyBadges({ difficulties }: { difficulties: Difficulty[] }) {
  const order: Difficulty[] = ["basic", "intermediate", "advanced"];
  return (
    <span className="flex gap-1 flex-wrap">
      {order.filter(d => difficulties.includes(d)).map(d => (
        <span key={d} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${COLOR[d]}`}>
          {getDifficultyLabel(d)}
        </span>
      ))}
    </span>
  );
}
