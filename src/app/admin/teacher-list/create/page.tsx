"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, ChevronDown, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Teacher,
  TeacherRole,
  TeacherServiceStatus,
  ClassInfo,
  ALL_CLASSES,
  getStoredTeachers,
  saveStoredTeachers,
  getStoredClasses, // ⬅️ 최신 로컬스토리지 반 정보 로더 추가
} from "@/lib/teacher-mock";

export default function TeacherCreatePage() {
  const router = useRouter();
  const { toast } = useToast();

  // ── 입력 폼 상태 ───────────────────────────────────────────
  const [loginId, setLoginId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [serviceStatus, setServiceStatus] = React.useState<TeacherServiceStatus>("normal");
  const [isRepresentative, setIsRepresentative] = React.useState(false);
  const [selectedClassIds, setSelectedClassIds] = React.useState<string[]>([]);

  // ── UI 상태 ──────────────────────────────────────────────
  const [classDropdownOpen, setClassDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // ── 기존 데이터 로드 및 환경 분석 ─────────────────────────
  const [existingTeachers, setExistingTeachers] = React.useState<Teacher[]>([]);
  const [classesList, setClassesList] = React.useState<ClassInfo[]>([]); // ⬅️ 반 목록 상태 추가
  const [hasRepresentative, setHasRepresentative] = React.useState(false);

  React.useEffect(() => {
    const list = getStoredTeachers();
    setExistingTeachers(list);
    setClassesList(getStoredClasses()); // ⬅️ 마운트 시 최신 반 리스트 로드
    // 기관 내 대표선생님이 1명이라도 존재하는지 감지
    const hasRep = list.some((t) => t.role === "representative");
    setHasRepresentative(hasRep);
  }, []);

  // 외부 클릭 시 담당 반 드롭다운 닫기
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setClassDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── 담당 반 선택 목록 연산 (삭제되지 않은 반 + 담당 선생님 미매칭 반) ──
  const availableClasses = React.useMemo(() => {
    // 다른 모든 선생님들이 매칭한 반 ID 목록 수집
    const assignedIds = new Set<string>();
    existingTeachers.forEach((t) => {
      t.assignedClasses.forEach((c) => assignedIds.add(c.id));
    });

    // 전체 반 중 다른 선생님에게 매칭되지 않은 반만 필터링
    return classesList.filter((c) => !assignedIds.has(c.id));
  }, [existingTeachers, classesList]);

  // ── 대표 선생님 클릭 가드 ──────────────────────────────────
  const handleRepChange = (checked: boolean) => {
    if (checked && hasRepresentative) {
      // 대표선생님이 이미 존재하므로 불가 안내 얼럿 출력
      alert(
        "대표선생님은 기관당 1명만 설정할 수 있습니다.\n기존 대표선생님 설정을 해제한 뒤 다시 설정해 주세요."
      );
      return;
    }
    setIsRepresentative(checked);
  };

  // ── 담당 반 다중 선택 처리 ─────────────────────────────────
  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const removeClassTag = (classId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClassIds((prev) => prev.filter((id) => id !== classId));
  };

  // ── 등록 처리 (저장) ────────────────────────────────────────
  const handleSave = () => {
    // 1. 필수 값 검증
    if (!loginId.trim()) {
      toast({ title: "아이디를 입력해주세요.", variant: "destructive" });
      return;
    }
    if (!password.trim()) {
      toast({ title: "비밀번호를 입력해주세요.", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "이름을 입력해주세요.", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "연락처를 입력해주세요.", variant: "destructive" });
      return;
    }

    // 아이디 중복 체크
    if (existingTeachers.some((t) => t.loginId === loginId.trim())) {
      toast({ title: "이미 존재하는 아이디입니다.", variant: "destructive" });
      return;
    }

    // 2. 담당 반 상세 정보 빌드
    const assignedClasses: ClassInfo[] = classesList.filter((c) =>
      selectedClassIds.includes(c.id)
    );

    // 3. 신규 선생님 구분 및 기본 데이터 조립
    const nextSeq = existingTeachers.length > 0 ? Math.max(...existingTeachers.map((t) => t.seq)) + 1 : 1;
    const newTeacher: Teacher = {
      id: `teacher-${Date.now()}`,
      seq: nextSeq,
      name: name.trim(),
      loginId: loginId.trim(),
      role: isRepresentative ? "representative" : "teacher",
      serviceStatus,
      phone: phone.trim(),
      email: email.trim(),
      createdAt: new Date().toISOString().slice(0, 19),
      assignedClasses,
    };

    // 4. 저장 및 이동
    const updated = [newTeacher, ...existingTeachers];
    saveStoredTeachers(updated);

    toast({ title: "성공적으로 저장되었습니다." });
    router.push("/admin/teacher-list");
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#f4f6f9] px-6 pt-5 pb-20 relative">
      {/* ── 헤더 영역 ───────────────────────────────────────── */}
      <div className="mb-5">
        <h1 className="text-[1.5rem] font-bold text-foreground">선생님 등록</h1>
      </div>

      <div className="w-full">
        {/* ── 카드 박스 ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-8">
          
          {/* ── 계정 정보 영역 ─────────────────────────────────── */}
          <div>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">계정 정보</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-sm font-semibold text-slate-600 col-span-1">
                  <span className="text-red-500 mr-1">*</span>아이디
                </label>
                <div className="col-span-3">
                  <Input
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="아이디"
                    className="h-10 text-sm w-full max-w-2xl bg-white border-slate-200 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-sm font-semibold text-slate-600 col-span-1">
                  <span className="text-red-500 mr-1">*</span>비밀번호
                </label>
                <div className="col-span-3">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="입력 후 저장 시 비밀번호가 저장됩니다"
                    className="h-10 text-sm w-full max-w-2xl bg-white border-slate-200 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── 개인 정보 영역 ─────────────────────────────────── */}
          <div>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">개인 정보</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-sm font-semibold text-slate-600 col-span-1">
                  <span className="text-red-500 mr-1">*</span>이름
                </label>
                <div className="col-span-3">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름을 입력해주세요"
                    className="h-10 text-sm w-full max-w-2xl bg-white border-slate-200 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-sm font-semibold text-slate-600 col-span-1">이메일</label>
                <div className="col-span-3">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일"
                    className="h-10 text-sm w-full max-w-2xl bg-white border-slate-200 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-sm font-semibold text-slate-600 col-span-1">
                  <span className="text-red-500 mr-1">*</span>연락처
                </label>
                <div className="col-span-3">
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="연락처"
                    className="h-10 text-sm w-full max-w-2xl bg-white border-slate-200 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 상태 라디오 버튼 */}
              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-sm font-semibold text-slate-600 col-span-1">상태</label>
                <div className="col-span-3 flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                    <input
                      type="radio"
                      name="serviceStatus"
                      checked={serviceStatus === "normal"}
                      onChange={() => setServiceStatus("normal")}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    정상
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                    <input
                      type="radio"
                      name="serviceStatus"
                      checked={serviceStatus === "suspended"}
                      onChange={() => setServiceStatus("suspended")}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    중지
                  </label>
                </div>
              </div>

              {/* 대표 선생님 스위치 */}
              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-sm font-semibold text-slate-600 col-span-1">대표 선생님</label>
                <div className="col-span-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleRepChange(!isRepresentative)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isRepresentative ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isRepresentative ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  {hasRepresentative && (
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" /> 이미 기관 내 대표선생님이 설정되어 있습니다. (추가 불가)
                    </span>
                  )}
                </div>
              </div>

              {/* 담당 반 설정 멀티 셀렉트 박스 */}
              <div className="grid grid-cols-4 gap-4 items-start">
                <label className="text-sm font-semibold text-slate-600 pt-2.5 col-span-1">담당 반</label>
                <div className="col-span-3 w-full max-w-2xl relative" ref={dropdownRef}>
                  <div
                    onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                    className="min-h-[40px] px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-between gap-2 cursor-pointer hover:border-slate-300 transition-colors"
                  >
                    {selectedClassIds.length === 0 ? (
                      <span className="text-sm text-slate-400">선택 가능한 담당 반 목록</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedClassIds.map((id) => {
                          const cls = classesList.find((c) => c.id === id);
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-md border border-blue-100"
                            >
                              {cls?.name}
                              <button
                                type="button"
                                onClick={(e) => removeClassTag(id, e)}
                                className="text-blue-400 hover:text-blue-600 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  </div>

                  {classDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg z-[9999] max-h-44 overflow-y-auto py-1">
                      {availableClasses.length === 0 ? (
                        <div className="text-sm text-slate-400 px-4 py-3 text-center">
                          선택 가능한 미매칭 반이 없습니다.
                        </div>
                      ) : (
                        availableClasses.map((cls) => {
                          const isSelected = selectedClassIds.includes(cls.id);
                          return (
                            <div
                              key={cls.id}
                              onClick={() => toggleClassSelection(cls.id)}
                              className={`px-4 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected ? "bg-blue-50/50 text-blue-700 font-semibold" : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span>
                                {cls.name} <span className="text-xs text-slate-400 font-normal">({cls.studentCount}명)</span>
                              </span>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                              />
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 하단 바 (Footer Bar) ─ 과제 센터 스타일 브라우저 하단 완벽 고정 (fixed bottom-0) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-[2px] border-t border-slate-200 px-6 py-4 flex items-center justify-between shadow-[0_-6px_20px_-4px_rgba(0,0,0,0.06)]">
        <button
          onClick={() => router.push("/admin/teacher-list")}
          className="h-9 px-3.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600 font-semibold text-sm flex items-center gap-2.5 transition-colors"
        >
          {/* 깨지지 않는 정밀 햄버거 메뉴 아이콘 직접 드로잉 */}
          <div className="flex flex-col gap-1 w-3.5">
            <span className="h-0.5 w-full bg-slate-500 rounded-full" />
            <span className="h-0.5 w-full bg-slate-500 rounded-full" />
            <span className="h-0.5 w-full bg-slate-500 rounded-full" />
          </div>
          목록
        </button>

        <Button
          className="h-9 px-5 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm rounded-lg"
          onClick={handleSave}
        >
          <Save className="h-4 w-4" />
          저장
        </Button>
      </div>
    </div>
  );
}
