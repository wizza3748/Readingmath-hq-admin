"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onBack: () => void;
  onReset: () => void;
  onPrint: () => void;
  isBlocked: boolean;
}

export default function PrintBottomBar({ onBack, onReset, onPrint, isBlocked }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-[2px] border-t border-slate-200/80 px-6 py-4 shadow-[0_-6px_20px_-4px_rgba(0,0,0,0.06)] z-50 print:hidden">
      <div className="w-full flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="h-10 px-6 font-bold text-slate-500 hover:text-slate-700">이전</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onReset} className="h-10 px-5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80">설정 초기화</Button>
          <Button variant="outline" onClick={onPrint} disabled={isBlocked} className="h-10 px-5 font-bold text-slate-600">PDF 저장</Button>
          <Button variant="default" onClick={onPrint} disabled={isBlocked} className="h-10 px-6 font-bold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/10">인쇄</Button>
        </div>
      </div>
    </div>
  );
}
