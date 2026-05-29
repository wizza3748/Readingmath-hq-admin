"use client";
import * as React from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/admin/task-center/confirm-dialog";
import {
  Teacher,
  TeacherServiceStatus,
  getTeacherRoleLabel,
  getTeacherStatusLabel,
  formatAssignedClasses,
  canDeleteTeacher,
  getStoredTeachers,
  saveStoredTeachers,
} from "@/lib/teacher-mock";

function formatDate(dateStr: string): string {
  return dateStr.replace("T", " ");
}

export default function TeacherListPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  // ── 데이터 상태 ──────────────────────────────────────────────
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);

  React.useEffect(() => {
    setIsMounted(true);
    setTeachers(getStoredTeachers());
  }, []);

  // ── 필터 상태 ──────────────────────────────────────────────
  const [pendingStatus, setPendingStatus] = React.useState<TeacherServiceStatus | "all">("all");
  const [appliedStatus, setAppliedStatus] = React.useState<TeacherServiceStatus | "all">("all");
  const [searchText, setSearchText] = React.useState("");
  const [searchApplied, setSearchApplied] = React.useState("");

  // ── 페이징 ──────────────────────────────────────────────────
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  // ── 삭제 확인 다이얼로그 ────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = React.useState<Teacher | null>(null);

  // ── 필터링 ──────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    return teachers.filter(t => {
      if (appliedStatus !== "all" && t.serviceStatus !== appliedStatus) return false;
      if (searchApplied.length >= 1) {
        const q = searchApplied.toLowerCase();
        if (
          !t.name.toLowerCase().includes(q) &&
          !t.loginId.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [teachers, appliedStatus, searchApplied]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const startRow = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const endRow = Math.min(page * perPage, filtered.length);

  const pageNums = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  // ── 핸들러 ──────────────────────────────────────────────────
  const handleSearch = () => {
    setAppliedStatus(pendingStatus);
    setSearchApplied(searchText.trim());
    setPage(1);
  };

  const handleReset = () => {
    setPendingStatus("all");
    setAppliedStatus("all");
    setSearchText("");
    setSearchApplied("");
    setPage(1);
  };

  const handleDeleteClick = (teacher: Teacher) => {
    const { deletable, reason } = canDeleteTeacher(teacher);
    if (!deletable) {
      toast({ title: reason ?? "삭제할 수 없습니다.", variant: "destructive" });
      return;
    }
    setDeleteTarget(teacher);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const nextTeachers = teachers.filter(t => t.id !== deleteTarget.id);
    setTeachers(nextTeachers);
    saveStoredTeachers(nextTeachers);
    toast({ title: "삭제되었습니다." });
    setDeleteTarget(null);
  };

  if (!isMounted) {
    return <div className="min-h-[calc(100vh-80px)] bg-[#f4f6f9]" />;
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#f4f6f9] pb-6">
      {/* ── 페이지 헤더 ───────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between">
        <h1 className="text-[1.5rem] font-bold text-foreground">선생님목록</h1>
        <Button
          className="h-9 px-4 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
          onClick={() => router.push("/admin/teacher-list/create")}
        >
          <Plus className="h-4 w-4" />
          선생님 등록
        </Button>
      </div>

      <div className="px-6 space-y-4">

        {/* ── 필터 및 검색 영역 ─────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">서비스 상태</p>
              <Select
                value={pendingStatus}
                onValueChange={v => setPendingStatus(v as TeacherServiceStatus | "all")}
              >
                <SelectTrigger className="h-9 w-36 text-sm bg-white border-slate-200">
                  <SelectValue placeholder="서비스상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="normal">정상</SelectItem>
                  <SelectItem value="suspended">중지</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px] max-w-sm">
               <p className="text-xs font-semibold text-muted-foreground mb-1.5">검색어</p>
              <Input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="성명 또는 아이디를 입력해주세요"
                className="h-9 text-sm bg-white border-slate-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSearch}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
              >
                검색
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                className="h-9 px-4 text-sm font-semibold bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                초기화
              </Button>
            </div>
          </div>
        </div>

        {/* ── 테이블 ────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-16">
                  고유번호
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-24">
                  성명
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap">
                  아이디
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-24">
                  선생님 구분
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-36">
                  담당 반
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-20">
                  서비스 상태
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-28">
                  연락처
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap">
                  이메일
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-36">
                  등록일
                </th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-400 text-sm">
                    선생님 정보가 없습니다.
                  </td>
                </tr>
              ) : (
                paged.map(teacher => {
                  const { deletable } = canDeleteTeacher(teacher);
                  const isRepresentative = teacher.role === "representative";

                  return (
                    <tr
                      key={teacher.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                    >
                      {/* 고유번호 */}
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {teacher.seq}
                      </td>

                      {/* 성명 */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/admin/teacher-list/${teacher.id}`)}
                          className="text-blue-600 font-semibold text-sm hover:underline"
                        >
                          {teacher.name}
                        </button>
                      </td>

                      {/* 아이디 */}
                      <td className="px-4 py-3 text-slate-700 text-sm">
                        {teacher.loginId}
                      </td>

                      {/* 선생님 구분 */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-bold ${
                            isRepresentative
                              ? "text-emerald-600"
                              : "text-rose-500"
                          }`}
                        >
                          {getTeacherRoleLabel(teacher.role)}
                        </span>
                      </td>

                      {/* 담당 반 */}
                      <td className="px-4 py-3 text-slate-700 text-sm">
                        {formatAssignedClasses(teacher.assignedClasses)}
                      </td>

                      {/* 서비스 상태 */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-bold ${
                            teacher.serviceStatus === "normal"
                              ? "text-emerald-600"
                              : "text-rose-500"
                          }`}
                        >
                          {getTeacherStatusLabel(teacher.serviceStatus)}
                        </span>
                      </td>

                      {/* 연락처 */}
                      <td className="px-4 py-3 text-slate-700 text-sm">
                        {teacher.phone || "-"}
                      </td>

                      {/* 이메일 */}
                      <td className="px-4 py-3 text-slate-700 text-sm">
                        {teacher.email || "-"}
                      </td>

                      {/* 등록일 */}
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {formatDate(teacher.createdAt)}
                      </td>

                      {/* 액션 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {/* 수정 */}
                          <button
                            className="w-7 h-7 flex items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 transition-colors"
                            onClick={() => router.push(`/admin/teacher-list/${teacher.id}`)}
                            title="수정"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {/* 삭제 */}
                          <button
                            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                              deletable
                                ? "text-rose-400 hover:bg-rose-50"
                                : "text-slate-300 cursor-not-allowed"
                            }`}
                            onClick={() => handleDeleteClick(teacher)}
                            title={deletable ? "삭제" : "삭제 불가"}
                            disabled={!deletable}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── 페이징 ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          {/* 좌측: 건수 + 페이지당 */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>
              {startRow} - {endRow} / 전체 {filtered.length}
            </span>
            <Select
              value={String(perPage)}
              onValueChange={v => { setPerPage(Number(v)); setPage(1); }}
            >
              <SelectTrigger className="h-7 w-16 text-sm border-slate-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 우측: 페이지 버튼 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg text-sm hover:bg-muted disabled:opacity-40"
            >
              ‹
            </button>
            {pageNums.map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  n === page
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg text-sm hover:bg-muted disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* ── 삭제 확인 다이얼로그 ─────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null); }}
        title="선생님 삭제"
        description={`'${deleteTarget?.name}' 선생님을 삭제하시겠습니까?\n삭제된 정보는 복구할 수 없습니다.`}
        confirmLabel="삭제"
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
