"use client";

import React from "react";
import { X, Settings, ChevronRight } from "lucide-react";

interface StudentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  subject: "math" | "science";
  gradeTerm?: string;
}

export default function StudentSidebar({
  isOpen,
  onClose,
  subject,
  gradeTerm = "중등 1학년 1학기",
}: StudentSidebarProps) {
  if (!isOpen) return null;

  const handleAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert("준비중입니다.");
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* 백드롭 (배경 어둡게 & 블러) */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* 사이드바 바디 컨테이너 */}
      <div className="relative z-10 flex h-full items-start">
        {/* 사이드바 외부 왼쪽 상단 X 닫기 버튼 */}
        <button
          onClick={onClose}
          className="mr-3 mt-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/60 text-white hover:bg-slate-800/80 transition-colors focus:outline-none"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 실제 사이드바 내용물 */}
        <div className="flex h-full w-[310px] flex-col rounded-l-[28px] bg-white shadow-2xl overflow-hidden transition-transform duration-300 transform translate-x-0">
          {/* 상단 설정 영역 (어두운 백그라운드) */}
          <div className="bg-[#1e232f] px-6 pt-8 pb-6 text-white flex-shrink-0">
            {/* 프로필 정보 */}
            <div className="flex items-center gap-3.5 mb-5">
              {/* 캐릭터 프로필 아이콘 */}
              <div className="h-12 w-12 rounded-full bg-[#3ba8fc] border-2 border-white flex items-center justify-center overflow-hidden shadow-inner">
                <svg viewBox="0 0 100 100" className="w-10 h-10 text-white fill-current">
                  {/* 귀여운 캐릭터 헬멧/귀 */}
                  <circle cx="28" cy="40" r="10" />
                  <circle cx="72" cy="40" r="10" />
                  <circle cx="28" cy="40" r="6" fill="#1e232f" />
                  <circle cx="72" cy="40" r="6" fill="#1e232f" />
                  {/* 얼굴 */}
                  <circle cx="50" cy="55" r="32" />
                  {/* 볼터치 */}
                  <circle cx="34" cy="62" r="5" fill="#f43f5e" />
                  <circle cx="66" cy="62" r="5" fill="#f43f5e" />
                  {/* 눈 */}
                  <circle cx="40" cy="52" r="4.5" fill="#1e232f" />
                  <circle cx="60" cy="52" r="4.5" fill="#1e232f" />
                  <circle cx="42" cy="50" r="1.5" fill="white" />
                  <circle cx="62" cy="50" r="1.5" fill="white" />
                  {/* 입 */}
                  <path d="M 46,62 Q 50,65 54,62" stroke="#1e232f" strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
              </div>

              {/* 학생명 + 설정 아이콘 */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[19px] font-black tracking-tight select-none">진리딩</span>
                  <button 
                    onClick={handleAlert}
                    className="p-1 text-slate-400 hover:text-white transition-colors focus:outline-none"
                  >
                    <Settings className="h-4.5 w-4.5" />
                  </button>
                </div>
                <span className="text-[12px] font-medium text-slate-400 mt-0.5">
                  2027년 02월 28일까지
                </span>
              </div>
            </div>

            {/* 변경 가능 칩 영역 */}
            <div className="space-y-2.5">
              {/* 학기 변경 버튼 */}
              <button
                onClick={handleAlert}
                className="w-full flex items-center justify-between bg-[#2a313e] hover:bg-[#323b4b] transition-colors rounded-xl px-4 py-3 text-left focus:outline-none"
              >
                <div className="flex items-center gap-2 text-[13.5px]">
                  <span className="text-slate-400 font-medium">학기</span>
                  <span className="font-extrabold text-white">{gradeTerm}</span>
                </div>
                <div className="flex items-center gap-0.5 text-[12px] font-extrabold text-slate-300">
                  <span>변경</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </div>
              </button>

              {/* 과목 변경 버튼 */}
              <button
                onClick={handleAlert}
                className="w-full flex items-center justify-between bg-[#2a313e] hover:bg-[#323b4b] transition-colors rounded-xl px-4 py-3 text-left focus:outline-none"
              >
                <div className="flex items-center gap-2 text-[13.5px]">
                  <span className="text-slate-400 font-medium">과목</span>
                  <span className="font-extrabold text-white">
                    {subject === "math" ? "수학" : "과학"}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 text-[12px] font-extrabold text-slate-300">
                  <span>변경</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </div>
              </button>
            </div>
          </div>

          {/* 중단 메뉴 영역 (흰색 백그라운드) */}
          <div className="flex-1 bg-white px-6 py-6 overflow-y-auto space-y-7">
            {/* 메뉴 그룹 1 */}
            <div className="space-y-6">
              {[
                { label: "학습 기록", value: "history" },
                { label: "월간보고서", value: "report" },
                { label: "오답노트", value: "notes" },
                { label: "진단평가", value: "test" }
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-[16px] font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5 transition-colors"
                >
                  {item.label}
                </div>
              ))}
            </div>

            {/* 구분선 */}
            <div className="h-px bg-slate-100" />

            {/* 메뉴 그룹 2 */}
            <div className="space-y-6">
              {[
                { label: "이용권 결제", value: "payment" },
                { label: "이용가이드", value: "guide" }
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-[16px] font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5 transition-colors"
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* 하단 영역 (홈 화면에 추가, 로그아웃) */}
          <div className="bg-[#f8fafc] border-t border-slate-100 p-4 space-y-2 flex-shrink-0">
            <button
              onClick={() => alert("홈 화면 추가 기능 준비중입니다.")}
              className="w-full h-11 bg-white hover:bg-slate-50 transition-colors border border-slate-200 text-[#475569] font-bold text-sm rounded-xl shadow-sm focus:outline-none"
            >
              홈 화면에 추가
            </button>
            <button
              onClick={() => alert("로그아웃 기능 준비중입니다.")}
              className="w-full h-11 bg-white hover:bg-slate-50 transition-colors border border-slate-200 text-slate-600 font-bold text-sm rounded-xl shadow-sm focus:outline-none"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
