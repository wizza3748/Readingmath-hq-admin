"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, Settings, ChevronRight } from "lucide-react";
import {
  getGradeTerm,
  setGradeTerm,
  onGradeTermChange,
  gradeTermToLabel,
  SubjectKey,
} from "@/utils/gradeTermStorage";
import { MATH_CURRICULA, SCIENCE_CURRICULA } from "@/lib/task-center-mock";

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

/** 학기 코드에서 학습 진도 문자열 추출 (1단원 첫 번째 소/중단원) */
function getFirstProgress(subject: SubjectKey, gradeCode: string): { major: string; minor: string } {
  const curricula = subject === "math" ? MATH_CURRICULA : SCIENCE_CURRICULA;
  const course = curricula.find((c) => c.course === gradeCode);
  if (!course || course.types.length === 0) {
    return { major: "", minor: "" };
  }
  const first = course.types[0];
  return { major: first.majorUnit, minor: first.minorUnit };
}

// ─── 학기 변경 모달 ────────────────────────────────────────────
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

  // 탭 전환 시 선택값 초기화 방지 (현재 탭에 있으면 유지, 없으면 첫 번째로)
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
        {/* 닫기 */}
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

          {/* 탭 */}
          <div className="flex bg-slate-100 rounded-full p-1 mb-6">
            <button
              onClick={() => setTab("elem")}
              className={`flex-1 h-8 rounded-full text-[13px] font-bold transition-all duration-200 ${
                tab === "elem"
                  ? "bg-[#2563eb] text-white shadow"
                  : "text-slate-500"
              }`}
            >
              초등
            </button>
            <button
              onClick={() => setTab("midHigh")}
              className={`flex-1 h-8 rounded-full text-[13px] font-bold transition-all duration-200 ${
                tab === "midHigh"
                  ? "bg-[#2563eb] text-white shadow"
                  : "text-slate-500"
              }`}
            >
              중고등
            </button>
          </div>

          {/* 라디오 그리드 */}
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
                          selected === term.v
                            ? "border-[#2563eb] bg-[#2563eb]"
                            : "border-slate-300"
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

          {/* 시작하기 버튼 */}
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

// ─── 과목 변경 화면 ────────────────────────────────────────────
interface SubjectSelectScreenProps {
  currentSubject: SubjectKey;
  mathGradeCode: string;
  scienceGradeCode: string;
  onSelect: (subject: SubjectKey) => void;
  onClose: () => void;
}

/** 현재 경로에서 화면 타입을 추출하여 대상 과목 경로를 반환 */
function resolveSubjectPath(currentPath: string, subject: SubjectKey): string {
  const pageTypeMap: Record<string, { math: string; science: string }> = {
    "home": { math: "/content/math-home", science: "/content/science-home" },
    "exam-prep": { math: "/content/math-exam-prep", science: "/content/science-exam-prep" },
    "task-center": { math: "/content/math-task-center", science: "/content/science-task-center" },
  };
  // 경로에서 페이지 타입 추출 (math-home → home, science-exam-prep → exam-prep 등)
  for (const [type, paths] of Object.entries(pageTypeMap)) {
    if (currentPath.includes(type)) {
      return paths[subject];
    }
  }
  // 매핑 없으면 과목별 홈으로
  return subject === "math" ? "/content/math-home" : "/content/science-home";
}

function SubjectSelectScreen({
  currentSubject,
  mathGradeCode,
  scienceGradeCode,
  onSelect,
  onClose,
}: SubjectSelectScreenProps) {
  const mathProgress = getFirstProgress("math", mathGradeCode);
  const scienceProgress = getFirstProgress("science", scienceGradeCode);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0d1a2e]">
      {/* 별 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/30"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.6 + 0.2,
            }}
          />
        ))}
      </div>

      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* 상단 다이아몬드 */}
        <div className="text-center mb-6">
          <span className="text-white/30 text-2xl">✦</span>
        </div>

        <h1 className="text-white text-[20px] font-bold text-center mb-8">
          학습할 과목을 선택하세요
        </h1>

        {/* 과목 카드 - 가로 배열 */}
        <div className="flex gap-4 mb-8">
          {/* 리딩수학 */}
          <button
            onClick={() => onSelect("math")}
            className={`flex-1 rounded-2xl p-4 text-left transition-all duration-200 ${
              currentSubject === "math"
                ? "ring-2 ring-white/60 scale-[1.02]"
                : "hover:scale-[1.01]"
            }`}
            style={{ background: "linear-gradient(135deg, #4f8ef7 0%, #2563eb 100%)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-black text-[18px]">리딩수학</span>
              <span className="text-xl">🪐</span>
            </div>
            <div className="bg-white/20 rounded-lg px-2.5 py-2">
              <p className="text-white/80 text-[10px] font-medium mb-0.5">학습 진도</p>
              {mathProgress.major ? (
                <>
                  <p className="text-white font-bold text-[11px] leading-tight">{mathProgress.major}</p>
                  <p className="text-white/80 text-[10px]">{mathProgress.minor}</p>
                </>
              ) : (
                <p className="text-white/70 text-[11px]">데이터 준비중</p>
              )}
            </div>
            <div className="mt-3">
              <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                개념 훈련 ROUND 1
              </span>
            </div>
          </button>

          {/* 리딩과학 */}
          <button
            onClick={() => onSelect("science")}
            className={`flex-1 rounded-2xl p-4 text-left transition-all duration-200 ${
              currentSubject === "science"
                ? "ring-2 ring-white/60 scale-[1.02]"
                : "hover:scale-[1.01]"
            }`}
            style={{ background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-black text-[18px]">리딩과학</span>
              <span className="text-xl">🚀</span>
            </div>
            <div className="bg-white/20 rounded-lg px-2.5 py-2">
              <p className="text-white/80 text-[10px] font-medium mb-0.5">학습 진도</p>
              {scienceProgress.major ? (
                <>
                  <p className="text-white font-bold text-[11px] leading-tight">{scienceProgress.major}</p>
                  <p className="text-white/80 text-[10px]">{scienceProgress.minor}</p>
                </>
              ) : (
                <p className="text-white/70 text-[11px]">데이터 준비중</p>
              )}
            </div>
            <div className="mt-3">
              <span className="inline-block bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                개념 훈련 ROUND 1
              </span>
            </div>
          </button>
        </div>

        {/* 다음부터 자동 진입 */}
        <div className="flex items-center justify-center gap-2 text-white/50 text-[13px] mb-4">
          <div className="h-4 w-4 rounded border border-white/30 flex items-center justify-center">
            {currentSubject && <div className="h-2.5 w-2.5 rounded-sm bg-[#2563eb]" />}
          </div>
          <span>다음부터 자동 진입</span>
        </div>

        {/* 로그아웃 */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => alert("로그아웃 기능 준비중입니다.")}
            className="text-white/40 hover:text-white/70 text-[13px] flex items-center gap-1.5 transition-colors"
          >
            <span>↩</span>
            <span>로그아웃</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────
interface StudentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** 현재 화면의 과목 (표시 기본값으로만 사용, 실제 과목은 내부 상태로 관리) */
  subject: SubjectKey;
  /** @deprecated localStorage로 관리됨. 하위 호환을 위해 유지 */
  gradeTerm?: string;
}

export default function StudentSidebar({
  isOpen,
  onClose,
  subject: initialSubject,
}: StudentSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // ── 내부 상태: localStorage에서 읽어옴 ──
  const [mathGradeCode, setMathGradeCode] = useState<string>("중1-1");
  const [scienceGradeCode, setScienceGradeCode] = useState<string>("중1-1");
  const [currentSubject, setCurrentSubject] = useState<SubjectKey>(initialSubject);

  // 마운트 시 localStorage에서 초기값 로드
  useEffect(() => {
    setMathGradeCode(getGradeTerm("math"));
    setScienceGradeCode(getGradeTerm("science"));
  }, [isOpen]);

  // 다른 탭/컴포넌트에서 변경 시 동기화
  useEffect(() => {
    const cleanup = onGradeTermChange((sub, code) => {
      if (sub === "math") setMathGradeCode(code);
      else setScienceGradeCode(code);
    });
    return cleanup;
  }, []);

  // ── 모달/화면 상태 ──
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showSubjectScreen, setShowSubjectScreen] = useState(false);

  const currentGradeCode = currentSubject === "math" ? mathGradeCode : scienceGradeCode;
  const currentGradeLabel = gradeTermToLabel(currentGradeCode);

  const handleAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    alert("준비중입니다.");
  };

  /** 학기 확정 */
  const handleGradeConfirm = useCallback(
    (code: string) => {
      setGradeTerm(currentSubject, code);
      if (currentSubject === "math") setMathGradeCode(code);
      else setScienceGradeCode(code);
      setShowGradeModal(false);
      onClose();
    },
    [currentSubject, onClose]
  );

  /** 과목 선택: 현재 화면 타입 유지한 채 과목만 전환 */
  const handleSubjectSelect = useCallback(
    (sub: SubjectKey) => {
      setCurrentSubject(sub);
      setShowSubjectScreen(false);
      const targetPath = resolveSubjectPath(pathname, sub);
      // 현재 경로와 같으면 이동 불필요
      if (targetPath !== pathname) {
        router.push(targetPath);
      }
      onClose();
    },
    [router, onClose, pathname]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* ── 학기 변경 모달 ── */}
      {showGradeModal && (
        <GradeTermModal
          currentCode={currentGradeCode}
          subject={currentSubject}
          onConfirm={handleGradeConfirm}
          onClose={() => setShowGradeModal(false)}
        />
      )}

      {/* ── 과목 변경 전체 화면 ── */}
      {showSubjectScreen && (
        <SubjectSelectScreen
          currentSubject={currentSubject}
          mathGradeCode={mathGradeCode}
          scienceGradeCode={scienceGradeCode}
          onSelect={handleSubjectSelect}
          onClose={() => setShowSubjectScreen(false)}
        />
      )}

      <div className="fixed inset-0 z-[100] flex justify-end">
        {/* 백드롭 */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300"
          onClick={onClose}
        />

        {/* 사이드바 바디 컨테이너 */}
        <div className="relative z-10 flex h-full items-start">
          {/* 왼쪽 상단 X 닫기 버튼 */}
          <button
            onClick={onClose}
            className="mr-3 mt-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/60 text-white hover:bg-slate-800/80 transition-colors focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>

          {/* 실제 사이드바 내용물 */}
          <div className="flex h-full w-[310px] flex-col rounded-l-[28px] bg-white shadow-2xl overflow-hidden">
            {/* 상단 설정 영역 */}
            <div className="bg-[#1e232f] px-6 pt-8 pb-6 text-white flex-shrink-0">
              {/* 프로필 */}
              <div className="flex items-center gap-3.5 mb-5">
                <div className="h-12 w-12 rounded-full bg-[#3ba8fc] border-2 border-white flex items-center justify-center overflow-hidden shadow-inner">
                  <svg viewBox="0 0 100 100" className="w-10 h-10 text-white fill-current">
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

              {/* 학기/과목 변경 버튼 */}
              <div className="space-y-2.5">
                {/* 학기 변경 */}
                <button
                  onClick={() => setShowGradeModal(true)}
                  className="w-full flex items-center justify-between bg-[#2a313e] hover:bg-[#323b4b] transition-colors rounded-xl px-4 py-3 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-2 text-[13.5px]">
                    <span className="text-slate-400 font-medium">학기</span>
                    <span className="font-extrabold text-white">{currentGradeLabel}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-[12px] font-extrabold text-slate-300">
                    <span>변경</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </button>

                {/* 과목 변경 */}
                <button
                  onClick={() => setShowSubjectScreen(true)}
                  className="w-full flex items-center justify-between bg-[#2a313e] hover:bg-[#323b4b] transition-colors rounded-xl px-4 py-3 text-left focus:outline-none"
                >
                  <div className="flex items-center gap-2 text-[13.5px]">
                    <span className="text-slate-400 font-medium">과목</span>
                    <span className="font-extrabold text-white">
                      {currentSubject === "math" ? "수학" : "과학"}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 text-[12px] font-extrabold text-slate-300">
                    <span>변경</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </button>
              </div>
            </div>

            {/* 메뉴 영역 */}
            <div className="flex-1 bg-white px-6 py-6 overflow-y-auto space-y-7">
              <div className="space-y-6">
                {[
                  { label: "학습 기록" },
                  { label: "월간보고서" },
                  { label: "오답노트" },
                  { label: "진단평가" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="text-[16px] font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5 transition-colors"
                  >
                    {item.label}
                  </div>
                ))}
              </div>
              <div className="h-px bg-slate-100" />
              <div className="space-y-6">
                {[{ label: "이용권 결제" }, { label: "이용가이드" }].map((item) => (
                  <div
                    key={item.label}
                    className="text-[16px] font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none py-0.5 transition-colors"
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* 하단 영역 */}
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
    </>
  );
}
