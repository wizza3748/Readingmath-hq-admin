"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const HELP_ITEMS = [
  "통계 집계 기준",
  "과제 상태 기준",
  "배정 건수 산정 기준",
  "제출률 계산 기준",
  "평균 점수 계산 기준",
];

export default function TaskStatusPage() {
  const [helpOpen, setHelpOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#f4f6f9] pb-16">
      <div className="flex items-center justify-between px-6 pt-5 pb-1">
        <div className="flex items-center gap-3">
          <h1 className="text-[1.5rem] font-bold text-foreground">과제 현황</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHelpOpen(true)}
            className="h-7 gap-1.5 border-gray-200 bg-white px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            이용 안내
          </Button>
        </div>
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <DialogHeader className="shrink-0 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <HelpCircle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-bold leading-none text-gray-900">
                과제 현황 이용 안내
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 space-y-2 overflow-y-auto py-5 pr-1">
            {HELP_ITEMS.map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-gray-700">{item}</span>
              </div>
            ))}
          </div>

          <DialogFooter className="shrink-0 border-t border-slate-100 pt-4">
            <Button
              onClick={() => setHelpOpen(false)}
              className="bg-primary px-6 text-sm font-semibold hover:bg-primary/90"
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
