"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, ChevronDown, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/admin/task-center/confirm-dialog";
import {
  Teacher,
  TeacherRole,
  TeacherServiceStatus,
  ClassInfo,
  ALL_CLASSES,
  getStoredTeachers,
  saveStoredTeachers,
  canDeleteTeacher,
} from "@/lib/teacher-mock";

interface TeacherDetailPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function TeacherDetailPage({ params }: TeacherDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  // ── Route parameters unwrapping ─────────────────────────────
  const [teacherId, setTeacherId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (params instanceof Promise) {
      params.then((p) => setTeacherId(p.id));
    } else if (params && params.id) {
      setTeacherId(params.id);
    }
  }, [params]);

  // ── 입력 폼 상태 ───────────────────────────────────────────
  const [loginId, setLoginId] = React.useState("");
  const [password, setPassword] = React.useState(""); // 비밀번호는 입력하지 않으면 기존 유지
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [serviceStatus, setServiceStatus] = React.useState<TeacherServiceStatus>("normal");
  const [isRepresentative, setIsRepresentative] = React.useState(false);
  const [selectedClassIds, setSelectedClassIds] = React.useState<string[]>([]);

  // ── UI 상태 ──────────────────────────────────────────────
  const [classDropdownOpen, setClassDropdownOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [isNotFound, setIsNotFound] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // ── 데이터 관리 상태 ───────────────────────────────────────
  const [teachersList, setTeachersList] = React.useState<Teacher[]>([]);
  const [currentTeacher, setCurrentTeacher] = React.useState<Teacher | null>(null);
  const [hasOtherRepresentative, setHasOtherRepresentative] = React.useState(false);

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

  // ── 데이터 바인딩 ──────────────────────────────────────────
  React.useEffect(() => {
    if (!teacherId) return;

    const list = getStoredTeachers();
    setTeachersList(list);

    const target = list.find((t) => t.id === teacherId);
    if (!target) {
      setIsNotFound(true);
      return;
    }

    setCurrentTeacher(target);
    setLoginId(target.loginId);
    setName(target.name);
    setEmail(target.email || "");
    setPhone(target.phone || "");
    setServiceStatus(target.serviceStatus);
    setIsRepresentative(target.role === "representative");

    // 담당 반 ID 매칭 표시
    const classIds = target.assignedClasses.map((c) => c.id);
    setSelectedClassIds(classIds);

    // 본인을 제외한 다른 대표선생님이 존재하는지 감지
    const otherRepExist = list.some((t) => t.id !== teacherId && t.role === "representative");
    setHasOtherRepresentative(otherRepExist);
  }, [teacherId]);

  // ── 담당 반 선택 목록 연산 (삭제되지 않은 반 + 미매칭 반 + 현재 본인 매칭 반) ──
  const availableClasses = React.useMemo(() => {
    if (!teacherId) return ALL_CLASSES;

    // 다른 선생님들이 매칭한 반 ID 목록만 수집
    const otherAssignedIds = new Set<string>();
    teachersList.forEach((t) => {
      if (t.id !== teacherId) {
        t.assignedClasses.forEach((c) => otherAssignedIds.add(c.id));
      }
    });

    // 전체 반(ALL_CLASSES) 중 다른 선생님에게 매칭되지 않은 반만 필터링 (본인 매칭 반은 포함됨)
    return ALL_CLASSES.filter((c) => !otherAssignedIds.has(c.id));
  }, [teachersList, teacherId]);

  // ── 대표 선생님 클릭 가드 (상세) ──────────────────────────
  const handleRepChange = (checked: boolean) => {
    if (checked && hasOtherRepresentative) {
      // 본인 외에 다른 대표선생님이 존재하므로 불가 안내 얼럿 출력
      alert(
        "대표선생님은 기관당 1명만 설정할 수 있습니다.\n기존 대표선생님을 변경한 뒤 다시 선택해 주세요."
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

  // ── 수정 저장 처리 ──────────────────────────────────────────
  const handleSave = () => {
    if (!currentTeacher) return;

    // 필수 값 검증
    if (!name.trim()) {
      toast({ title: "이름을 입력해주세요.", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "연락처를 입력해주세요.", variant: "destructive" });
      return;
    }

    // 담당 반 정보 조립
    const assignedClasses: ClassInfo[] = ALL_CLASSES.filter((c) =>
      selectedClassIds.includes(c.id)
    );

    // 기존 데이터 갱신
    const updatedTeachers = teachersList.map((t) => {
      if (t.id === currentTeacher.id) {
        return {
          ...t,
          name: name.trim(),
          role: isRepresentative ? ("representative" as TeacherRole) : ("teacher" as TeacherRole),
          serviceStatus,
          phone: phone.trim(),
          email: email.trim(),
          assignedClasses,
          // 비밀번호 미입력 시 기존 비밀번호가 유지된다는 제약조건에 따름
        };
      }
      return t;
    });

    saveStoredTeachers(updatedTeachers);
    toast({ title: "수정사항이 성공적으로 저장되었습니다." });
    router.push("/admin/teacher-list");
  };

  // ── 삭제 처리 ──────────────────────────────────────────────
  const handleDeleteClick = () => {
    if (!currentTeacher) return;

    const { deletable, reason } = canDeleteTeacher(currentTeacher);
    if (!deletable) {
      toast({ title: reason ?? "삭제할 수 없습니다.", variant: "destructive" });
      return;
    }
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!currentTeacher) return;
    const nextTeachers = teachersList.filter((t) => t.id !== currentTeacher.id);
    saveStoredTeachers(nextTeachers);
    toast({ title: "선생님 정보가 삭제되었습니다." });
    router.push("/admin/teacher-list");
  };

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-lg text-slate-500 font-semibold mb-4">존재하지 않는 선생님 정보입니다.</p>
        <Button onClick={() => router.push("/admin/teacher-list")}>선생님 목록으로 이동</Button>
      </div>
    );
  }

  if (!currentTeacher) {
    return <div className="min-h-screen bg-[#f4f6f9]" />;
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#f4f6f9] px-6 pt-5 pb-20 relative">
      {/* ── 헤더 영역 ───────────────────────────────────────── */}
      <div className="mb-5">
        <h1 className="text-[1.5rem] font-bold text-foreground">선생님 상세</h1>
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
                    disabled
                    className="h-10 text-sm w-full max-w-2xl bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center">
                <label className="text-sm font-semibold text-slate-600 col-span-1">비밀번호</label>
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
                    placeholder="이름"
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

              {/* 대표 선생님 토글 */}
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
                  {hasOtherRepresentative && (
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" /> 이미 기관 내 다른 대표선생님이 존재합니다. (설정 불가)
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
                          const cls = ALL_CLASSES.find((c) => c.id === id);
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

        <div className="flex items-center gap-2">
          <Button
            className="h-9 px-5 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm rounded-lg"
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
            저장
          </Button>

          <Button
            variant="destructive"
            className="h-9 px-4 gap-1.5 font-semibold rounded-lg"
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      {/* ── 삭제 확인 모달 다이얼로그 ────────────────────────────── */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="선생님 삭제"
        description={`'${currentTeacher.name}' 선생님을 삭제하시겠습니까?\n삭제된 정보는 복구할 수 없습니다.`}
        confirmLabel="삭제"
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
