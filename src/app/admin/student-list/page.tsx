"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Download, RefreshCw, Layers, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/admin/task-center/confirm-dialog";
import {
  Student,
  StudentServiceStatus,
  StudentServiceType,
  getStudentStatusLabel,
  getStudentServiceTypeLabel,
  getStoredStudents,
  saveStoredStudents,
  getAssignedTeacherMap,
} from "@/lib/student-mock";
import { ALL_CLASSES, getStoredTeachers, Teacher, getStoredClasses, saveStoredClasses, ClassInfo } from "@/lib/teacher-mock";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function StudentListPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isMounted, setIsMounted] = React.useState(false);

  // ── 데이터 상태 ──────────────────────────────────────────────
  const [students, setStudents] = React.useState<Student[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [classesList, setClassesList] = React.useState<ClassInfo[]>([]);

  // ── 필터 상태 (선생님목록 스타일에 맞춰 한 줄 통합형) ─────────────────
  const [filterStatus, setFilterStatus] = React.useState<StudentServiceStatus | "all">("all");
  const [filterType, setFilterType] = React.useState<StudentServiceType | "all">("all");
  const [filterGrade, setFilterGrade] = React.useState<string>("all");
  const [filterClass, setFilterClass] = React.useState<string>("all");
  const [filterRecommend, setFilterRecommend] = React.useState<string>("all");
  const [searchText, setSearchText] = React.useState("");

  const [appliedStatus, setAppliedStatus] = React.useState<StudentServiceStatus | "all">("all");
  const [appliedType, setAppliedType] = React.useState<StudentServiceType | "all">("all");
  const [appliedGrade, setAppliedGrade] = React.useState<string>("all");
  const [appliedClass, setAppliedClass] = React.useState<string>("all");
  const [appliedRecommend, setAppliedRecommend] = React.useState<string>("all");
  const [searchApplied, setSearchApplied] = React.useState("");

  // ── 정렬 상태 ──────────────────────────────────────────────
  const [sortField, setSortField] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc");

  // ── 페이징 ──────────────────────────────────────────────────
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  // ── 삭제 확인 다이얼로그 ────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = React.useState<Student | null>(null);

  // ── 반 관리 모달 상태 ──────────────────────────────────────
  const [isClassModalOpen, setIsClassModalOpen] = React.useState(false);
  const [classModalMode, setClassModalMode] = React.useState<"list" | "create" | "edit">("list");
  const [newClassName, setNewClassName] = React.useState("");
  const [editingClassId, setEditingClassId] = React.useState<string | null>(null);
  const [editingClassName, setEditingClassName] = React.useState("");
  
  // 반 삭제 제약 제어 상태
  const [classDeletePreventOpen, setClassDeletePreventOpen] = React.useState(false);
  const [classDeleteConfirmOpen, setClassDeleteConfirmOpen] = React.useState(false);
  const [classDeleteTarget, setClassDeleteTarget] = React.useState<ClassInfo | null>(null);

  // ── 학생 반 일괄 변경 모달 및 체크박스 상태 ───────────────────
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<string[]>([]);
  const [bulkClassModalOpen, setBulkClassModalOpen] = React.useState(false);
  const [bulkSelectedClassId, setBulkSelectedClassId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsMounted(true);
    setStudents(getStoredStudents());
    setTeachers(getStoredTeachers());
    setClassesList(getStoredClasses());
  }, []);

  // ── 실시간 담당 선생님 매핑용 딕셔너리 연산 ─────────────────
  const teacherMap = React.useMemo(() => {
    return getAssignedTeacherMap(teachers);
  }, [teachers]);

  // ── 추천코드 필터링 목록 추출 ──────────────────────────────
  const recommendCodes = React.useMemo(() => {
    const codes = students
      .map(s => s.recommendCode)
      .filter((c): c is string => typeof c === "string" && c.trim() !== "");
    return Array.from(new Set(codes));
  }, [students]);

  // ── 필터링 연산 ──────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    return students.filter(s => {
      if (appliedStatus !== "all" && s.serviceStatus !== appliedStatus) return false;
      if (appliedType !== "all" && s.serviceType !== appliedType) return false;
      if (appliedGrade !== "all" && s.grade !== appliedGrade) return false;
      if (appliedClass !== "all" && s.classId !== appliedClass) return false;
      if (appliedRecommend !== "all" && s.recommendCode !== appliedRecommend) return false;
      if (searchApplied.length >= 1) {
        const q = searchApplied.toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !s.loginId.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [students, appliedStatus, appliedType, appliedGrade, appliedClass, appliedRecommend, searchApplied]);

  // ── 정렬 연산 ──────────────────────────────────────────────
  const sorted = React.useMemo(() => {
    if (!sortField) return filtered;

    return [...filtered].sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortField === "name") {
        valA = a.name;
        valB = b.name;
      } else if (sortField === "grade") {
        const gradeOrder: Record<string, number> = {
          "초등 3": 1, "초등 4": 2, "초등 5": 3, "초등 6": 4,
          "중등 1": 5, "중등 2": 6, "중등 3": 7, "미정": 99
        };
        valA = gradeOrder[a.grade] || 99;
        valB = gradeOrder[b.grade] || 99;
      } else if (sortField === "semester") {
        const semOrder: Record<string, number> = { "1학기": 1, "2학기": 2 };
        valA = semOrder[a.semester] || 99;
        valB = semOrder[b.semester] || 99;
      } else if (sortField === "class") {
        const clsA = ALL_CLASSES.find(c => c.id === a.classId)?.name || "";
        const clsB = ALL_CLASSES.find(c => c.id === b.classId)?.name || "";
        valA = clsA;
        valB = clsB;
      } else if (sortField === "serviceEndDate") {
        valA = a.serviceEndDate || "9999-99-99";
        valB = b.serviceEndDate || "9999-99-99";
      } else if (sortField === "createdAt") {
        valA = a.createdAt;
        valB = b.createdAt;
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = sorted.slice((page - 1) * perPage, page * perPage);
  const isAllSelected = paged.length > 0 && paged.every(s => selectedStudentIds.includes(s.id));
  const startRow = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const endRow = Math.min(page * perPage, filtered.length);

  const pageNums = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  // ── 핸들러 ──────────────────────────────────────────────────
  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null); // 3차 클릭 시 정렬 해제
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setPage(1);
  };

  const handleSearch = () => {
    setAppliedStatus(filterStatus);
    setAppliedType(filterType);
    setAppliedGrade(filterGrade);
    setAppliedClass(filterClass);
    setAppliedRecommend(filterRecommend);
    setSearchApplied(searchText.trim());
    setPage(1);
  };

  const handleReset = () => {
    setFilterStatus("all");
    setFilterType("all");
    setFilterGrade("all");
    setFilterClass("all");
    setFilterRecommend("all");
    setSearchText("");

    setAppliedStatus("all");
    setAppliedType("all");
    setAppliedGrade("all");
    setAppliedClass("all");
    setAppliedRecommend("all");
    setSearchApplied("");
    setPage(1);
  };

  const handleDeleteClick = (student: Student) => {
    setDeleteTarget(student);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const nextStudents = students.filter(s => s.id !== deleteTarget.id);
    setStudents(nextStudents);
    saveStoredStudents(nextStudents);
    toast({ title: "학생 정보가 삭제되었습니다." });
    setDeleteTarget(null);
  };

  // ── 반 관리 모달 핸들러 ────────────────────────────────────
  const handleAddClass = () => {
    if (!newClassName.trim()) {
      toast({ title: "반 이름을 입력해 주세요.", variant: "destructive" });
      return;
    }
    const newId = `class-${Date.now()}`;
    const newClass: ClassInfo = {
      id: newId,
      name: newClassName.trim(),
      studentCount: 0,
    };
    const nextClasses = [...classesList, newClass];
    setClassesList(nextClasses);
    saveStoredClasses(nextClasses);
    toast({ title: "반이 성공적으로 등록되었습니다." });
    setNewClassName("");
    setClassModalMode("list");
  };

  const handleStartEditClass = (cls: ClassInfo) => {
    setEditingClassId(cls.id);
    setEditingClassName(cls.name);
    setClassModalMode("edit");
  };

  const handleSaveEditClass = () => {
    if (!editingClassName.trim()) {
      toast({ title: "반 이름을 입력해 주세요.", variant: "destructive" });
      return;
    }
    const nextClasses = classesList.map(c => {
      if (c.id === editingClassId) {
        return { ...c, name: editingClassName.trim() };
      }
      return c;
    });
    setClassesList(nextClasses);
    saveStoredClasses(nextClasses);
    toast({ title: "반 이름이 수정되었습니다." });
    setEditingClassId(null);
    setEditingClassName("");
    setClassModalMode("list");
  };

  const handleClassDeleteClick = (cls: ClassInfo) => {
    const assignedTeacher = teacherMap[cls.id];
    
    // 삭제 불가 조건: 소속 학생 수 1명 이상이거나, 담당 선생님이 배정되어 있는 경우
    if (cls.studentCount >= 1 || assignedTeacher) {
      setClassDeleteTarget(cls);
      setClassDeletePreventOpen(true);
    } else {
      // 삭제 가능
      setClassDeleteTarget(cls);
      setClassDeleteConfirmOpen(true);
    }
  };

  const handleClassDeleteConfirm = () => {
    if (!classDeleteTarget) return;
    const nextClasses = classesList.filter(c => c.id !== classDeleteTarget.id);
    setClassesList(nextClasses);
    saveStoredClasses(nextClasses);
    toast({ title: "반이 성공적으로 삭제되었습니다." });
    setClassDeleteConfirmOpen(false);
    setClassDeleteTarget(null);
  };

  // ── 전체 선택 토글 핸들러 ───────────────────────────────────
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pagedIds = paged.map(s => s.id);
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...pagedIds])));
    } else {
      const pagedIds = new Set(paged.map(s => s.id));
      setSelectedStudentIds(prev => prev.filter(id => !pagedIds.has(id)));
    }
  };

  // ── 개별 선택 토글 핸들러 ───────────────────────────────────
  const handleSelectOne = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(prev => [...prev, studentId]);
    } else {
      setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
    }
  };

  // ── 일괄 변경 적용 핸들러 ───────────────────────────────────
  const handleApplyBulkClass = () => {
    if (selectedStudentIds.length === 0) {
      toast({ title: "선택된 학생이 없습니다.", variant: "destructive" });
      return;
    }
    if (!bulkSelectedClassId) {
      toast({ title: "변경할 반을 선택해 주세요.", variant: "destructive" });
      return;
    }

    const nextStudents = students.map(s => {
      if (selectedStudentIds.includes(s.id)) {
        return { ...s, classId: bulkSelectedClassId === "none" ? null : bulkSelectedClassId };
      }
      return s;
    });
    setStudents(nextStudents);
    saveStoredStudents(nextStudents);

    // 반별 학생 수 실시간 자동 재연산 동기화
    const nextClasses = classesList.map(cls => {
      const count = nextStudents.filter(s => s.classId === cls.id).length;
      return { ...cls, studentCount: count };
    });
    setClassesList(nextClasses);
    saveStoredClasses(nextClasses);

    toast({ title: `성공적으로 ${selectedStudentIds.length}명 학생의 반이 변경되었습니다.` });
    setSelectedStudentIds([]); 
    setBulkSelectedClassId(null);
    setBulkClassModalOpen(false);
  };

  if (!isMounted) {
    return <div className="min-h-[calc(100vh-80px)] bg-[#f4f6f9]" />;
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#f4f6f9] px-6 pt-5 pb-6">
      
      {/* ── 페이지 헤더 ───────────────────────────────────────── */}
      <div className="pb-4 flex items-center justify-between">
        <h1 className="text-[1.5rem] font-bold text-foreground">학생목록</h1>
        <div className="flex items-center gap-2">
          {/* 학생 개별 등록 */}
          <Button
            className="h-9 px-4 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm"
            onClick={() => toast({ title: "준비중입니다!" })}
          >
            <Plus className="h-4 w-4" />
            학생 개별 등록
          </Button>
          {/* 학생 일괄 등록 (개별 등록 우측 배치, 솔리드 스타일 대칭) */}
          <Button
            className="h-9 px-4 gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-sm"
            onClick={() => toast({ title: "학생 일괄 등록이 준비중입니다." })}
          >
            <Plus className="h-4 w-4" />
            학생 일괄 등록
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        
        {/* ── 통합 검색 필터 영역 (선생님목록의 고급스러운 패밀리룩 이식) ── */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
            
            {/* 서비스 상태 필터 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">서비스 상태</p>
              <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
                <SelectTrigger className="h-9 w-32 text-sm bg-white border-slate-200">
                  <SelectValue placeholder="서비스 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="before_use">사용전</SelectItem>
                  <SelectItem value="in_use">사용중</SelectItem>
                  <SelectItem value="suspended">서비스 정지</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 서비스 타입 필터 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">서비스 타입</p>
              <Select value={filterType} onValueChange={v => setFilterType(v as any)}>
                <SelectTrigger className="h-9 w-36 text-sm bg-white border-slate-200">
                  <SelectValue placeholder="서비스 타입" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="math">리딩수학</SelectItem>
                  <SelectItem value="science">리딩과학</SelectItem>
                  <SelectItem value="combo">리딩수학+과학 통합</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 학년 필터 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">학년</p>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="h-9 w-28 text-sm bg-white border-slate-200">
                  <SelectValue placeholder="학년" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {["초등 3", "초등 4", "초등 5", "초등 6", "중등 1", "중등 2", "중등 3", "미정"].map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 반 필터 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">반</p>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="h-9 w-32 text-sm bg-white border-slate-200">
                  <SelectValue placeholder="반 전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {classesList.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 추천코드 필터 */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">추천코드</p>
              <Select value={filterRecommend} onValueChange={setFilterRecommend}>
                <SelectTrigger className="h-9 w-32 text-sm bg-white border-slate-200">
                  <SelectValue placeholder="추천코드" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {recommendCodes.map(code => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 검색어 인풋 */}
            <div className="flex-1 min-w-[200px] max-w-xs">
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">검색어</p>
              <Input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="학생 이름 또는 아이디 입력"
                className="h-9 text-sm bg-white border-slate-200"
              />
            </div>

            {/* 필터 조작 버튼군 */}
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

        {/* ── 보조 및 기능 액션 버튼 영역 ───────────────────────── */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* 선택 표시기 (체크된 학생 수 > 0 일 때 실시간 등장) */}
          {selectedStudentIds.length > 0 && (
            <div className="flex items-center gap-2 mr-2 text-xs font-bold text-slate-700 animate-in fade-in slide-in-from-right-1 duration-200">
              <span>{selectedStudentIds.length} 선택됨</span>
              <button
                onClick={() => setSelectedStudentIds([])}
                className="px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors text-[10px] font-bold"
              >
                초기화
              </button>
            </div>
          )}

          {/* 학생 반 일괄 변경 */}
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3 gap-1.5 bg-green-50 hover:bg-green-100/80 text-green-700 border-green-200 font-semibold"
            onClick={() => {
              if (selectedStudentIds.length === 0) {
                toast({ title: "반을 일괄 변경할 학생을 먼저 선택해 주세요.", variant: "destructive" });
                return;
              }
              setBulkSelectedClassId(null);
              setBulkClassModalOpen(true);
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 text-green-600" />
            학생 반 일괄 변경
          </Button>

          {/* 반 관리 */}
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3 gap-1.5 bg-blue-50 hover:bg-blue-100/80 text-blue-700 border-blue-200 font-semibold"
            onClick={() => {
              setClassModalMode("list");
              setIsClassModalOpen(true);
            }}
          >
            <Layers className="h-4 w-4 text-blue-600" />
            반 관리
          </Button>

          {/* 엑셀 다운로드 */}
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3 gap-1.5 bg-slate-50 hover:bg-slate-100/80 text-slate-700 border-slate-200 font-semibold"
            onClick={() => toast({ title: "엑셀 다운로드가 준비중입니다." })}
          >
            <FileSpreadsheet className="h-4 w-4 text-slate-500" />
            엑셀 다운로드
          </Button>
        </div>

        {/* ── 테이블 ────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1200px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={e => handleSelectAll(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-20">
                    고유 번호
                  </th>
                  <th
                    onClick={() => handleSort("name")}
                    className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-24 cursor-pointer select-none hover:bg-slate-100/80"
                  >
                    학생 이름 {sortField === "name" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-20">
                    PIN 번호
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-32">
                    아이디
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-36">
                    부모님 연락처
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-40">
                    서비스 타입
                  </th>
                  <th
                    onClick={() => handleSort("grade")}
                    className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-20 cursor-pointer select-none hover:bg-slate-100/80"
                  >
                    학년 {sortField === "grade" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    onClick={() => handleSort("semester")}
                    className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-20 cursor-pointer select-none hover:bg-slate-100/80"
                  >
                    학기 {sortField === "semester" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    onClick={() => handleSort("class")}
                    className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-28 cursor-pointer select-none hover:bg-slate-100/80"
                  >
                    반 {sortField === "class" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  {/* 추가된 조회 전용 담당 선생님 컬럼 */}
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-600 bg-slate-100/50 whitespace-nowrap w-28">
                    담당 선생님
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-24">
                    서비스상태
                  </th>
                  <th
                    onClick={() => handleSort("serviceEndDate")}
                    className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-28 cursor-pointer select-none hover:bg-slate-100/80"
                  >
                    서비스 종료일 {sortField === "serviceEndDate" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-28 cursor-pointer select-none hover:bg-slate-100/80"
                  >
                    등록일 {sortField === "createdAt" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-500 whitespace-nowrap w-28">
                    추천코드
                  </th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="text-center py-16 text-slate-400 text-sm">
                      조회된 학생 정보가 없습니다.
                    </td>
                  </tr>
                ) : (
                  paged.map(student => {
                    const matchedClass = classesList.find(c => c.id === student.classId);
                    const teacherName = student.classId ? teacherMap[student.classId] || "-" : "-";

                    // 서비스 타입 배지 스타일링
                    let serviceTypeBadge = "bg-slate-50 text-slate-600 border-slate-200";
                    if (student.serviceType === "math") {
                      serviceTypeBadge = "bg-orange-50 text-orange-700 border-orange-100";
                    } else if (student.serviceType === "science") {
                      serviceTypeBadge = "bg-blue-50 text-blue-700 border-blue-100";
                    } else if (student.serviceType === "combo") {
                      serviceTypeBadge = "bg-amber-50 text-amber-700 border-amber-100";
                    }

                    // 서비스 상태 배지 스타일링
                    let statusBadge = "bg-slate-100 text-slate-600 border-slate-200";
                    if (student.serviceStatus === "in_use") {
                      statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-100";
                    } else if (student.serviceStatus === "suspended") {
                      statusBadge = "bg-orange-50 text-orange-700 border-orange-100";
                    } else if (student.serviceStatus === "before_use") {
                      statusBadge = "bg-slate-100 text-slate-700 border-slate-200";
                    }

                    return (
                      <tr
                        key={student.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={e => handleSelectOne(student.id, e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        {/* 고유 번호 */}
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {student.seq}
                        </td>

                        {/* 학생 이름 */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => router.push(`/admin/student-list/${student.id}`)}
                            className="text-blue-600 font-semibold text-sm hover:underline"
                          >
                            {student.name}
                          </button>
                        </td>

                        {/* PIN 번호 */}
                        <td className="px-4 py-3 text-slate-600 text-sm">
                          {student.pinNumber || "-"}
                        </td>

                        {/* 아이디 */}
                        <td className="px-4 py-3 text-slate-700 text-sm font-medium">
                          {student.loginId || "-"}
                        </td>

                        {/* 부모님 연락처 */}
                        <td className="px-4 py-3 text-slate-700 text-sm">
                          {student.parentPhone || "-"}
                        </td>

                        {/* 서비스 타입 배지 */}
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${serviceTypeBadge}`}>
                            {getStudentServiceTypeLabel(student.serviceType)}
                          </span>
                        </td>

                        {/* 학년 */}
                        <td className="px-4 py-3 text-slate-700 text-sm">
                          {student.grade}
                        </td>

                        {/* 학기 */}
                        <td className="px-4 py-3 text-slate-700 text-sm">
                          {student.semester || "-"}
                        </td>

                        {/* 반 */}
                        <td className="px-4 py-3 text-slate-700 text-sm font-semibold">
                          {matchedClass ? matchedClass.name : "-"}
                        </td>

                        {/* 담당 선생님 (조회 전용 및 강조 스타일) */}
                        <td className="px-4 py-3 text-slate-800 text-sm font-bold bg-slate-50/30">
                          {teacherName}
                        </td>

                        {/* 서비스상태 */}
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${statusBadge}`}>
                            {getStudentStatusLabel(student.serviceStatus)}
                          </span>
                        </td>

                        {/* 서비스 종료일 */}
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {student.serviceEndDate || "-"}
                        </td>

                        {/* 등록일 */}
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {student.createdAt}
                        </td>

                        {/* 추천코드 */}
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {student.recommendCode || "-"}
                        </td>

                        {/* 액션 */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            {/* 수정 */}
                            <button
                              className="w-7 h-7 flex items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 transition-colors"
                              onClick={() => router.push(`/admin/student-list/${student.id}`)}
                              title="수정"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {/* 삭제 */}
                            <button
                              className="w-7 h-7 flex items-center justify-center rounded-md text-rose-400 hover:bg-rose-50 transition-colors"
                              onClick={() => handleDeleteClick(student)}
                              title="삭제"
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
        title="학생 삭제"
        description={`'${deleteTarget?.name}' 학생을 삭제하시겠습니까?\n삭제된 정보는 복구할 수 없습니다.`}
        confirmLabel="삭제"
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      {/* ── 반 관리 모달 ────────────────────────────────────────── */}
      <Dialog open={isClassModalOpen} onOpenChange={setIsClassModalOpen}>
        <DialogContent className="max-w-2xl rounded-xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">
              {classModalMode === "list" && "반 관리 - 목록"}
              {classModalMode === "create" && "반 관리 - 등록"}
              {classModalMode === "edit" && "반 관리 - 수정"}
            </DialogTitle>
          </DialogHeader>

          {/* 1. 목록 상태 (mode === 'list') */}
          {classModalMode === "list" && (
            <div className="space-y-4">
              <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 sticky top-0">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 w-16">번호</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">반 이름</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100/30">담당 선생님</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 w-24">학생 수</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 w-24">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classesList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                          등록된 반 정보가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      classesList.map((cls, idx) => {
                        const teacherName = teacherMap[cls.id] || "-";
                        return (
                          <tr key={cls.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2.5 text-xs text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-700 font-medium">{cls.name}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-800 font-bold bg-slate-50/30">{teacherName}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-500">{cls.studentCount}명</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleStartEditClass(cls)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 transition-colors"
                                  title="수정"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleClassDeleteClick(cls)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md text-rose-400 hover:bg-rose-50 transition-colors"
                                  title="삭제"
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

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => setClassModalMode("create")}
                  className="h-9 px-4 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  반 등록
                </Button>
              </div>
            </div>
          )}

          {/* 2. 등록 상태 (mode === 'create') */}
          {classModalMode === "create" && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">반 이름</label>
                <Input
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  placeholder="반 이름을 입력해 주세요 (예: 초3A반)"
                  className="h-10 text-sm border-slate-200"
                  onKeyDown={e => e.key === "Enter" && handleAddClass()}
                />
              </div>
              <DialogFooter className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewClassName("");
                    setClassModalMode("list");
                  }}
                  className="h-9 px-4 text-xs font-semibold bg-white border-slate-200 text-slate-600"
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddClass}
                  className="h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  등록
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* 3. 수정 상태 (mode === 'edit') */}
          {classModalMode === "edit" && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">반 이름 수정</label>
                <Input
                  value={editingClassName}
                  onChange={e => setEditingClassName(e.target.value)}
                  placeholder="수정할 반 이름을 입력해 주세요"
                  className="h-10 text-sm border-slate-200"
                  onKeyDown={e => e.key === "Enter" && handleSaveEditClass()}
                />
              </div>
              <DialogFooter className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingClassId(null);
                    setEditingClassName("");
                    setClassModalMode("list");
                  }}
                  className="h-9 px-4 text-xs font-semibold bg-white border-slate-200 text-slate-600"
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEditClass}
                  className="h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  저장
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── 반 삭제 제한 안내 얼럿 모달 ────────────────────────────── */}
      <Dialog open={classDeletePreventOpen} onOpenChange={setClassDeletePreventOpen}>
        <DialogContent className="max-w-md rounded-xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">반 삭제 제한</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {`해당 반은 삭제할 수 없습니다.
소속 학생 또는 담당 선생님 설정을 해제한 뒤 다시 진행해 주세요.`}
          </div>
          <DialogFooter className="flex items-center justify-end pt-2">
            <Button
              size="sm"
              onClick={() => setClassDeletePreventOpen(false)}
              className="h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 반 삭제 확인 다이얼로그 모달 ────────────────────────────── */}
      <Dialog open={classDeleteConfirmOpen} onOpenChange={setClassDeleteConfirmOpen}>
        <DialogContent className="max-w-md rounded-xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">반 삭제</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-slate-600 leading-relaxed">
            {`해당 반을 삭제하시겠습니까?
삭제한 반은 복구할 수 없습니다.`}
          </div>
          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setClassDeleteConfirmOpen(false);
                setClassDeleteTarget(null);
              }}
              className="h-9 px-4 text-xs font-semibold bg-white border-slate-200 text-slate-600"
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleClassDeleteConfirm}
              className="h-9 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 학생 반 일괄 변경 모달 ────────────────────────────── */}
      <Dialog open={bulkClassModalOpen} onOpenChange={setBulkClassModalOpen}>
        <DialogContent className="max-w-xl rounded-xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">학생 반 일괄 변경</DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-5">
            {/* 정보 안내 카드 (연한 회색 배경과 둥근 패널) */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-800 mb-0.5">
                총 <span className="text-blue-600 font-extrabold">{selectedStudentIds.length}명</span>의 학생이 선택되었습니다.
              </p>
              <p className="text-xs text-slate-400">아래에서 지정할 반을 선택해주세요.</p>
            </div>

            {/* 반 선택 인풋 필드 */}
            <div className="grid grid-cols-4 gap-4 items-center">
              <label className="text-sm font-semibold text-slate-600 col-span-1">
                <span className="text-red-500 mr-1">*</span>반
              </label>
              <div className="col-span-3">
                <select
                  value={bulkSelectedClassId || ""}
                  onChange={e => setBulkSelectedClassId(e.target.value)}
                  className="h-10 text-sm w-full bg-white border border-slate-200 rounded-lg px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                >
                  <option value="" disabled>반을 선택해주세요.</option>
                  <option value="none">미지정 (-)</option>
                  {classesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBulkClassModalOpen(false);
                setBulkSelectedClassId(null);
              }}
              className="h-9 px-4 text-xs font-semibold bg-white border-slate-200 text-slate-600"
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleApplyBulkClass}
              disabled={!bulkSelectedClassId}
              className="h-9 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:hover:bg-blue-600"
            >
              적용
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
