"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, HelpCircle, Siren, Megaphone, Check } from "lucide-react";
import {
  getGradeTerm,
  setGradeTerm,
  gradeTermToLabel,
  SubjectKey,
} from "@/utils/gradeTermStorage";

// ─── 학기 데이터 ─────────────────────────────────────────────────
const ELEM_TERMS = [
  { v: "초3-1", l: "초등 3학년 1학기" },
  { v: "초3-2", l: "초등 3학년 2학기" },
  { v: "초4-1", l: "초등 4학년 1학기" },
  { v: "초4-2", l: "초등 4학년 2학기" },
  { v: "초5-1", l: "초등 5학년 1학기" },
  { v: "초5-2", l: "초등 5학년 2학기" },
  { v: "초6-1", l: "초등 6학년 1학기" },
  { v: "초6-2", l: "초등 6학년 2학기" },
];

const MID_HIGH_TERMS = [
  { v: "중1-1", l: "중등 1학년 1학기" },
  { v: "중1-2", l: "중등 1학년 2학기" },
  { v: "중2-1", l: "중등 2학년 1학기" },
  { v: "중2-2", l: "중등 2학년 2학기" },
  { v: "중3-1", l: "중등 3학년 1학기" },
  { v: "중3-2", l: "중등 3학년 2학기" },
  { v: "고1-1", l: "고등 1학년 1학기" },
  { v: "고1-2", l: "고등 1학년 2학기" },
];

// ─── 학기 변경 모달 (사이드바와 일치) ────────────────────────────
interface GradeTermModalProps {
  currentCode: string;
  subject: SubjectKey;
  onConfirm: (code: string) => void;
  onClose: () => void;
}

function GradeTermModal({ currentCode, subject, onConfirm, onClose }: GradeTermModalProps) {
  const isCurrentElem = currentCode.startsWith("초");
  const [tab, setTab] = useState<"elem" | "midHigh">(isCurrentElem ? "elem" : "midHigh");
  const [selected, setSelected] = useState(currentCode);

  const termList = tab === "elem" ? ELEM_TERMS : MID_HIGH_TERMS;

  useEffect(() => {
    const inCurrentTab = termList.some((t) => t.v === selected);
    if (!inCurrentTab) {
      setSelected(termList[0].v);
    }
  }, [tab]);

  const rows: Array<[typeof ELEM_TERMS[0], typeof ELEM_TERMS[0] | null]> = [];
  for (let i = 0; i < termList.length; i += 2) {
    rows.push([termList[i], termList[i + 1] ?? null]);
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-[340px] mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-7 pt-8 pb-7">
          <h2 className="text-[17px] font-bold text-slate-800 text-center mb-6">
            학습할 학기를 선택해 주세요.
          </h2>

          <div className="flex bg-slate-100 rounded-full p-1 mb-6">
            <button
              onClick={() => setTab("elem")}
              className={`flex-1 h-8 rounded-full text-[13px] font-bold transition-all duration-200 ${
                tab === "elem" ? "bg-[#2563eb] text-white shadow" : "text-slate-500"
              }`}
            >
              초등
            </button>
            <button
              onClick={() => setTab("midHigh")}
              className={`flex-1 h-8 rounded-full text-[13px] font-bold transition-all duration-200 ${
                tab === "midHigh" ? "bg-[#2563eb] text-white shadow" : "text-slate-500"
              }`}
            >
              중고등
            </button>
          </div>

          <div className="space-y-3 mb-7">
            {rows.map((row, ri) => (
              <div key={ri} className="grid grid-cols-2 gap-3">
                {row.map((term) =>
                  term ? (
                    <label
                      key={term.v}
                      className={`flex items-center gap-2 cursor-pointer py-1 px-1 rounded-lg transition-colors ${
                        selected === term.v ? "text-[#2563eb]" : "text-slate-600"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          selected === term.v ? "border-[#2563eb] bg-[#2563eb]" : "border-slate-300"
                        }`}
                        onClick={() => setSelected(term.v)}
                      >
                        {selected === term.v && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span
                        className="text-[13px] font-semibold leading-tight"
                        onClick={() => setSelected(term.v)}
                      >
                        {term.l}
                      </span>
                    </label>
                  ) : (
                    <div key="empty" />
                  )
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => onConfirm(selected)}
            className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-bold text-[15px] rounded-xl transition-colors shadow-md"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 마이페이지 컴포넌트 ──────────────────────────────────────
export default function MyPage() {
  const router = useRouter();

  // 학기 상태
  const [mathGradeCode, setMathGradeCode] = useState("중1-1");
  const [scienceGradeCode, setScienceGradeCode] = useState("중1-1");

  // 모달 제어 상태
  const [showModal, setShowModal] = useState(false);
  const [modalSubject, setModalSubject] = useState<SubjectKey>("math");

  useEffect(() => {
    setMathGradeCode(getGradeTerm("math"));
    setScienceGradeCode(getGradeTerm("science"));
  }, []);

  const openModal = (sub: SubjectKey) => {
    setModalSubject(sub);
    setShowModal(true);
  };

  const handleGradeConfirm = useCallback(
    (code: string) => {
      setGradeTerm(modalSubject, code);
      if (modalSubject === "math") {
        setMathGradeCode(code);
        router.push("/content/math-home");
      } else {
        setScienceGradeCode(code);
        router.push("/content/science-home");
      }
      setShowModal(false);
    },
    [modalSubject, router]
  );

  return (
    <div className="min-h-screen w-full bg-[#081324] text-slate-100 font-sans pb-16">
      {/* GNB 헤더 */}
      <header className="fixed top-0 left-0 right-0 h-[56px] bg-[#091527] border-b border-[#142338] z-50 flex items-center justify-between px-5 shadow-md">
        <Link href="/content/math-home" className="flex items-center gap-2 cursor-pointer">
          <svg viewBox="0 0 100 100" className="h-6 w-6 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <path d="M 50,10 L 55,45 L 90,50 L 55,55 L 50,90 L 45,55 L 10,50 L 45,45 Z" fill="url(#logoGrad)" />
            <circle cx="28" cy="28" r="4.5" fill="#3B82F6" />
            <circle cx="72" cy="28" r="4.5" fill="#EC4899" />
            <circle cx="72" cy="72" r="4.5" fill="#F59E0B" />
            <circle cx="28" cy="72" r="4.5" fill="#10B981" />
          </svg>
          <span className="text-[17px] font-black tracking-tight text-white select-none">
            진리딩
          </span>
        </Link>
        <span className="text-[16px] font-extrabold text-white">마이페이지</span>
        <div className="flex items-center gap-4 text-[#cbd5e1]">
          <HelpCircle className="h-5 w-5 cursor-not-allowed opacity-50" />
          <Siren className="h-5 w-5 cursor-not-allowed opacity-50" />
          <Megaphone className="h-5 w-5 cursor-not-allowed opacity-50" />
        </div>
      </header>

      {/* 학기 변경 모달 */}
      {showModal && (
        <GradeTermModal
          currentCode={modalSubject === "math" ? mathGradeCode : scienceGradeCode}
          subject={modalSubject}
          onConfirm={handleGradeConfirm}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* 메인 콘텐츠 영역 */}
      <main className="max-w-[1020px] mx-auto px-6 pt-[96px] flex gap-10">
        
        {/* 좌측 사이드 프로필 카드 */}
        <section className="w-[200px] flex-shrink-0 flex flex-col items-center select-none pt-4">
          <div className="relative mb-4">
            <div className="h-28 w-28 rounded-full bg-[#3ba8fc] border-[3px] border-slate-700/80 flex items-center justify-center overflow-hidden shadow-2xl">
              <svg viewBox="0 0 100 100" className="w-24 h-24 text-white fill-current">
                <circle cx="28" cy="40" r="10" />
                <circle cx="72" cy="40" r="10" />
                <circle cx="28" cy="40" r="6" fill="#1e232f" />
                <circle cx="72" cy="40" r="6" fill="#1e232f" />
                <circle cx="50" cy="55" r="32" />
                <circle cx="34" cy="62" r="5" fill="#f43f5e" />
                <circle cx="66" cy="62" r="5" fill="#f43f5e" />
                <circle cx="40" cy="52" r="4.5" fill="#1e232f" />
                <circle cx="60" cy="52" r="4.5" fill="#1e232f" />
                <circle cx="42" cy="50" r="1.5" fill="white" />
                <circle cx="62" cy="50" r="1.5" fill="white" />
                <path d="M 46,62 Q 50,65 54,62" stroke="#1e232f" strokeWidth="3" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <div className="absolute bottom-0 right-0 bg-[#2563eb] text-white p-1.5 rounded-full border border-slate-800 shadow">
              <span className="text-[12px] leading-none">⚙️</span>
            </div>
          </div>
          <h2 className="text-[17px] font-bold mb-6 text-white text-center">진리딩</h2>
          <nav className="w-full space-y-1">
            <button className="w-full text-left py-2.5 px-4 rounded-xl text-[14px] font-bold bg-[#1e293b] text-white shadow-sm transition-colors cursor-pointer">
              내 정보
            </button>
            <button className="w-full text-left py-2.5 px-4 rounded-xl text-[14px] font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-not-allowed opacity-60">
              이용권 정보
            </button>
          </nav>
        </section>

        {/* 우측 폼 입력 카드 영역 */}
        <section className="flex-1 space-y-6 max-w-[700px]">
          
          {/* 계정 정보 카드 */}
          <article className="bg-[#0f172a]/80 border border-[#1e293b] rounded-2xl p-6 shadow-lg">
            <h3 className="text-[15px] font-extrabold text-slate-400 mb-4 select-none">계정 정보</h3>
            <div className="grid grid-cols-3 gap-y-3.5 text-[13.5px] border-b border-slate-800/60 pb-4">
              <span className="text-slate-400 font-bold select-none">학생이름</span>
              <span className="col-span-2 text-white font-extrabold">진리딩</span>
              
              <span className="text-slate-400 font-bold select-none">아이디</span>
              <span className="col-span-2 text-white font-extrabold">test123</span>
              
              <span className="text-slate-400 font-bold select-none">가입일</span>
              <span className="col-span-2 text-white font-extrabold">2026-07-02</span>
            </div>
            <div className="flex justify-end pt-3">
              <button className="text-[12px] font-semibold text-slate-500 hover:text-slate-400 cursor-not-allowed opacity-50">
                회원 탈퇴
              </button>
            </div>
          </article>

          {/* 학생 정보 카드 */}
          <article className="bg-[#0f172a]/80 border border-[#1e293b] rounded-2xl p-6 shadow-lg space-y-4">
            <h3 className="text-[15px] font-extrabold text-slate-400 select-none">학생 정보</h3>
            <div className="space-y-3 pointer-events-none opacity-60 select-none">
              <div className="flex items-center bg-[#1e293b]/60 border border-slate-700/60 rounded-xl px-4 py-3">
                <span className="text-[14px] text-slate-400 mr-3">👤</span>
                <input type="text" value="진리딩" readOnly className="bg-transparent outline-none text-[13.5px] text-white font-bold w-full" />
              </div>
              <div className="flex items-center bg-[#1e293b]/60 border border-slate-700/60 rounded-xl px-4 py-3">
                <span className="text-[14px] text-slate-400 mr-3">📅</span>
                <input type="text" value="2016-01-01" readOnly className="bg-transparent outline-none text-[13.5px] text-white font-bold w-full" />
              </div>
              <div className="flex items-center bg-[#1e293b]/60 border border-slate-700/60 rounded-xl px-4 py-3">
                <span className="text-[14px] text-slate-400 mr-3">📱</span>
                <input type="text" value="01012345678" readOnly className="bg-transparent outline-none text-[13.5px] text-white font-bold w-full" />
              </div>
            </div>
          </article>

          {/* 학습 정보 카드 (동적 변경 영역) */}
          <article className="bg-[#0f172a]/80 border border-[#1e293b] rounded-2xl p-6 shadow-lg space-y-4">
            <h3 className="text-[15px] font-extrabold text-slate-400 select-none">학습 정보</h3>
            <div className="space-y-3">
              {/* 수학 학기 변경 */}
              <div className="flex items-center justify-between bg-[#1e293b] border border-[#2563eb]/40 rounded-xl px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-[14px]">📐</span>
                  <span className="text-[13.5px] font-bold text-slate-300">리딩수학</span>
                  <span className="text-[13.5px] font-black text-white ml-2 bg-[#2563eb]/20 px-2 py-0.5 rounded-lg border border-[#2563eb]/30">
                    {gradeTermToLabel(mathGradeCode)}
                  </span>
                </div>
                <button
                  onClick={() => openModal("math")}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white text-[12px] font-extrabold px-3 py-1.5 rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  변경하기
                </button>
              </div>

              {/* 과학 학기 변경 */}
              <div className="flex items-center justify-between bg-[#1e293b] border border-[#7c3aed]/40 rounded-xl px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-[14px]">🚀</span>
                  <span className="text-[13.5px] font-bold text-slate-300">리딩과학</span>
                  <span className="text-[13.5px] font-black text-white ml-2 bg-[#7c3aed]/20 px-2 py-0.5 rounded-lg border border-[#7c3aed]/30">
                    {gradeTermToLabel(scienceGradeCode)}
                  </span>
                </div>
                <button
                  onClick={() => openModal("science")}
                  className="bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white text-[12px] font-extrabold px-3 py-1.5 rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  변경하기
                </button>
              </div>
            </div>
          </article>

          {/* 비밀번호 변경 카드 */}
          <article className="bg-[#0f172a]/80 border border-[#1e293b] rounded-2xl p-6 shadow-lg space-y-4 opacity-50 pointer-events-none select-none">
            <h3 className="text-[15px] font-extrabold text-slate-400">비밀번호 변경</h3>
            <div className="space-y-3">
              <div className="flex items-center bg-[#1e293b]/60 border border-slate-700/60 rounded-xl px-4 py-3">
                <span className="text-[14px] text-slate-400 mr-3">🔒</span>
                <input type="password" placeholder="새 비밀번호" readOnly className="bg-transparent outline-none text-[13.5px] text-white w-full" />
              </div>
              <div className="flex items-center bg-[#1e293b]/60 border border-slate-700/60 rounded-xl px-4 py-3">
                <span className="text-[14px] text-slate-400 mr-3">🔒</span>
                <input type="password" placeholder="새 비밀번호 확인" readOnly className="bg-transparent outline-none text-[13.5px] text-white w-full" />
              </div>
            </div>
          </article>

          {/* 학부모 정보 카드 */}
          <article className="bg-[#0f172a]/80 border border-[#1e293b] rounded-2xl p-6 shadow-lg space-y-4 opacity-50 pointer-events-none select-none">
            <h3 className="text-[15px] font-extrabold text-slate-400">학부모 정보</h3>
            <div className="space-y-3">
              <div className="flex items-center bg-[#1e293b]/60 border border-slate-700/60 rounded-xl px-4 py-3">
                <span className="text-[14px] text-slate-400 mr-3">👤</span>
                <input type="text" value="진부모" readOnly className="bg-transparent outline-none text-[13.5px] text-white font-bold w-full" />
              </div>
              <div className="flex items-center bg-[#1e293b]/60 border border-slate-700/60 rounded-xl px-4 py-3">
                <span className="text-[14px] text-slate-400 mr-3">📱</span>
                <input type="text" value="01012345678" readOnly className="bg-transparent outline-none text-[13.5px] text-white font-bold w-full" />
              </div>
            </div>
          </article>

          {/* 마케팅 활용 동의 */}
          <article className="bg-[#0f172a]/80 border border-[#1e293b] rounded-2xl p-5 shadow-lg flex items-center justify-between opacity-50 pointer-events-none select-none">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded border border-slate-600 flex items-center justify-center">
                <span className="text-[11px] text-slate-400"></span>
              </div>
              <span className="text-[13.5px] font-bold text-slate-300">마케팅 활용 동의</span>
            </div>
            <button className="text-[12px] font-bold text-[#3ba8fc] border border-[#3ba8fc]/40 rounded-lg px-3 py-1 bg-[#3ba8fc]/5">
              약관 보기
            </button>
          </article>

          {/* 로그인 관리 */}
          <article className="bg-[#0f172a]/80 border border-[#1e293b] rounded-2xl p-6 shadow-lg space-y-4 opacity-50 pointer-events-none select-none">
            <h3 className="text-[15px] font-extrabold text-slate-400">로그인 관리</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-[13.5px] font-extrabold text-emerald-500">N 네이버</span>
                <button className="text-[12px] font-extrabold border border-slate-700 rounded-lg px-3 py-1.5 bg-slate-800 text-slate-400">
                  연동 하기
                </button>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-[13.5px] font-extrabold text-yellow-500">💬 카카오톡</span>
                <button className="text-[12px] font-extrabold border border-slate-700 rounded-lg px-3 py-1.5 bg-slate-800 text-slate-400">
                  연동 하기
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-extrabold text-slate-300">🔢 핀번호</span>
                <button className="text-[12px] font-extrabold border border-slate-700 rounded-lg px-3 py-1.5 bg-slate-800 text-slate-400">
                  PIN 설정하기
                </button>
              </div>
            </div>
          </article>

          {/* 하단 액션 버튼 */}
          <div className="flex items-center justify-center gap-4 pt-6 select-none">
            <button
              onClick={() => router.push("/content/math-home")}
              className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-[14px] rounded-xl shadow-lg transition-all"
            >
              메인으로
            </button>
            <button
              disabled
              className="px-8 py-3.5 bg-slate-800/40 text-slate-600 font-extrabold text-[14px] rounded-xl shadow border border-slate-800/50 cursor-not-allowed opacity-50"
            >
              저장하기
            </button>
          </div>

        </section>
      </main>
    </div>
  );
}
