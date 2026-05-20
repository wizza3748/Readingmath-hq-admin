"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTaskCenterStore } from "@/lib/task-center-store";
import { useToast } from "@/hooks/use-toast";
import {
  Subject, TaskStatus, Difficulty, ProblemMode,
  getTaskStatusLabel, getDifficultyLabel, calcAvgScore,
} from "@/lib/task-center-mock";
import { TaskTable } from "./task-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Plus, HelpCircle, BarChart2, Search, RotateCcw, BookOpen, Layers, UserCheck, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// ── 세그먼트 버튼 그룹 ──────────────────────────────
function SegBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-200 ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
          : "bg-white text-muted-foreground border-slate-200 hover:border-primary/30 hover:text-primary hover:bg-slate-50/50"
      }`}
    >
      {label}
    </button>
  );
}

// ── 상태 카드 ────────────────────────────────────────
const STATUS_CARD_CFG = [
  { status: "draft" as TaskStatus, label: "작성중", subText: "학생 배정 전 과제", icon: "✏️", colors: "border-amber-200/60 from-amber-50/50", numCls: "text-amber-600", bgSel: "ring-amber-400/80" },
  { status: "published" as TaskStatus, label: "게시됨", subText: "학생에게 배정된 진행 중 과제", icon: "📢", colors: "border-emerald-200/60 from-emerald-50/50", numCls: "text-emerald-600", bgSel: "ring-emerald-400/80" },
  { status: "ended" as TaskStatus, label: "종료", subText: "수행 완료 또는 종료 처리된 과제", icon: "🔒", colors: "border-slate-200/60 from-slate-50/50", numCls: "text-slate-500", bgSel: "ring-slate-400/80" },
];

export default function TaskDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { tasks, currentSubject, setCurrentSubject } = useTaskCenterStore();

  // ── 필터 상태 ──────────────────────────────────────
  const [statusFilter, setStatusFilter] = React.useState<TaskStatus | "all">("all");
  const [courseFilter, setCourseFilter] = React.useState("all");
  const [difficulties, setDifficulties] = React.useState<Difficulty[]>([]);
  const [modeFilter, setModeFilter] = React.useState<ProblemMode | "all">("all");
  const [timeLimitFilter, setTimeLimitFilter] = React.useState<"all" | "set" | "unset">("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [searchText, setSearchText] = React.useState("");
  const [searchApplied, setSearchApplied] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [helpOpen, setHelpOpen] = React.useState(false);

  const subjectTasks = tasks.filter(t => t.subject === currentSubject);

  // 상태별 건수
  const countByStatus = (s: TaskStatus) => subjectTasks.filter(t => t.status === s).length;

  // 학습과정 목록
  const courses = Array.from(new Set(subjectTasks.map(t => t.course))).sort();

  // 필터링
  const filtered = subjectTasks.filter(t => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (courseFilter !== "all" && t.course !== courseFilter) return false;
    if (difficulties.length > 0 && !difficulties.some(d => t.difficulties.includes(d))) return false;
    if (modeFilter !== "all" && t.problemMode !== modeFilter) return false;
    if (timeLimitFilter === "set" && !t.timeLimit) return false;
    if (timeLimitFilter === "unset" && t.timeLimit) return false;
    if (dateFrom) {
      const created = t.createdAt.slice(0, 10);
      if (created < dateFrom) return false;
    }
    if (dateTo) {
      const created = t.createdAt.slice(0, 10);
      if (created > dateTo) return false;
    }
    if (searchApplied.length >= 2) {
      const q = searchApplied.toLowerCase();
      const inName = t.name.toLowerCase().includes(q);
      const inUnit = t.selectedTypes.some(st =>
        st.majorUnit.toLowerCase().includes(q) ||
        st.minorUnit.toLowerCase().includes(q) ||
        st.typeName.toLowerCase().includes(q)
      );
      if (!inName && !inUnit) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSubjectChange = (s: Subject) => {
    setCurrentSubject(s);
    setCourseFilter("all");
    setPage(1);
  };

  const handleStatusCard = (s: TaskStatus) => {
    setStatusFilter(prev => prev === s ? "all" : s);
    setPage(1);
  };

  const handleReset = () => {
    setStatusFilter("all");
    setCourseFilter("all");
    setDifficulties([]);
    setModeFilter("all");
    setTimeLimitFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearchText("");
    setSearchApplied("");
    setPage(1);
  };

  const toggleDifficulty = (d: Difficulty) => {
    setDifficulties(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
    setPage(1);
  };

  const handleSearch = () => {
    const trimmed = searchText.trim();
    if (trimmed.length < 2) return;
    setSearchApplied(trimmed);
    setPage(1);
  };

  const canSearch = searchText.trim().length >= 2;

  const PaginationBtn = ({ n, active }: { n: number; active: boolean }) => (
    <button
      onClick={() => setPage(n)}
      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
      }`}
    >{n}</button>
  );

  const pageNums = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="min-h-screen bg-[#f4f6f9] pb-16">
      <div className="px-6 pt-5 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[1.5rem] font-bold text-foreground">과제 대시보드</h1>
          <Button variant="outline" size="sm" onClick={() => setHelpOpen(true)} className="h-7 text-xs px-2.5 gap-1.5 bg-white border-gray-200 text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-3.5 w-3.5" /> 이용 안내
          </Button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* ── 과목 기준 영역 ──────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-slate-200/80">
          <div className="flex gap-1">
            {(["math", "science"] as Subject[]).map(s => (
              <button
                key={s}
                onClick={() => handleSubjectChange(s)}
                className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
                  currentSubject === s
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-slate-800"
                }`}
              >
                {s === "math" ? "수학" : "과학"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Button variant="outline" size="sm" onClick={() => toast({ title: "준비중입니다!" })} className="gap-2 bg-white">
              <BarChart2 className="h-4 w-4" /> 월별 과제 현황
            </Button>
            <Button size="sm" onClick={() => router.push(`/admin/task-center/create?subject=${currentSubject}`)} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" /> 과제 생성
            </Button>
          </div>
        </div>

        {/* ── 상태 카드 ─────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {STATUS_CARD_CFG.map(cfg => {
            const count = countByStatus(cfg.status);
            const isSelected = statusFilter === cfg.status;
            return (
              <button
                key={cfg.status}
                onClick={() => handleStatusCard(cfg.status)}
                className={`bg-gradient-to-br ${cfg.colors} to-white rounded-xl p-4 border text-left transition-all duration-200 hover:shadow-md flex flex-col justify-center ${
                  isSelected ? `ring-2 ${cfg.bgSel} ring-offset-1 shadow-md border-transparent` : "shadow-sm border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{cfg.icon}</span>
                    <p className="text-sm font-bold text-foreground">{cfg.label}</p>
                  </div>
                  <p className={`text-2xl font-extrabold leading-none ${cfg.numCls}`}>{count.toLocaleString()}</p>
                </div>
                <p className="text-[11px] text-muted-foreground/80">{cfg.subText}</p>
              </button>
            );
          })}
        </div>

        {/* ── 필터 영역 ─────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-5 py-4 space-y-3">
          {/* row1: 상태 / 학습과정 / 난이도 / 구성방식 / 제한시간 */}
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">과제 상태</p>
              <div className="flex gap-1">
                {(["all", "draft", "published", "ended"] as const).map(s => (
                  <SegBtn key={s} label={s === "all" ? "전체" : getTaskStatusLabel(s)} active={statusFilter === s} onClick={() => { setStatusFilter(s); setPage(1); }} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">학습과정</p>
              <Select value={courseFilter} onValueChange={v => { setCourseFilter(v); setPage(1); }}>
                <SelectTrigger className="h-9 w-28 text-sm">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">난이도</p>
              <div className="flex gap-1">
                <SegBtn label="전체" active={difficulties.length === 0} onClick={() => { setDifficulties([]); setPage(1); }} />
                {(["basic", "intermediate", "advanced"] as Difficulty[]).map(d => (
                  <SegBtn key={d} label={getDifficultyLabel(d)} active={difficulties.includes(d)} onClick={() => toggleDifficulty(d)} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">구성 방식</p>
              <div className="flex gap-1">
                {(["all", "same", "individual"] as const).map(m => (
                  <SegBtn key={m} label={m === "all" ? "전체" : m === "same" ? "동일" : "학생별"} active={modeFilter === m} onClick={() => { setModeFilter(m); setPage(1); }} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">제한시간</p>
              <div className="flex gap-1">
                {(["all", "set", "unset"] as const).map(m => (
                  <SegBtn key={m} label={m === "all" ? "전체" : m === "set" ? "설정" : "미설정"} active={timeLimitFilter === m} onClick={() => { setTimeLimitFilter(m); setPage(1); }} />
                ))}
              </div>
            </div>
          </div>

          {/* row2: 생성일 / 검색어 / 버튼 / 조회건수 */}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">생성일</p>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                  className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <span className="text-muted-foreground text-xs">~</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={e => { setDateTo(e.target.value); setPage(1); }}
                  className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px] max-w-xs">
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">검색어</p>
              <Input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canSearch && handleSearch()}
                placeholder="과제명,단원명,유형명 검색"
                className="h-9 text-sm"
              />
            </div>
            <div className="flex items-end gap-2 pb-0">
              <Button size="sm" onClick={handleSearch} disabled={!canSearch} className="h-9 gap-1 px-4">
                <Search className="h-3.5 w-3.5" /> 검색
              </Button>
              <Button size="sm" variant="outline" onClick={handleReset} className="h-9 gap-1 px-4">
                <RotateCcw className="h-3.5 w-3.5" /> 초기화
              </Button>
              <span className="text-sm text-muted-foreground ml-2 pb-1.5 whitespace-nowrap">
                조회 건수: <span className="font-semibold text-foreground">{filtered.length}건</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── 과제 목록 ─────────────────────────────── */}
        <TaskTable tasks={paged} />

        {/* ── 페이징 ──────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">총 {filtered.length}건</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg text-sm hover:bg-muted disabled:opacity-40">‹</button>
            {pageNums.map(n => <PaginationBtn key={n} n={n} active={n === page} />)}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg text-sm hover:bg-muted disabled:opacity-40">›</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">페이지당</span>
            <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-8 w-20 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}개</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── 과제 대시보드 이용 안내 모달 ── */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col gap-0">
          <DialogHeader className="pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <HelpCircle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900 leading-none">과제 대시보드 이용 안내</DialogTitle>
            </div>
          </DialogHeader>

          {/* 안내 콘텐츠 영역 */}
          <div className="py-5 overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-5">
            {/* 1. 과제 안내 */}
            <div className="p-4 rounded-xl border border-blue-100/70 bg-gradient-to-br from-blue-50/40 to-white hover:shadow-sm transition-all duration-200">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                <h3 className="text-sm font-bold text-gray-900">1. 과제 안내</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 pl-6 list-disc marker:text-blue-400 leading-relaxed">
                <li>과제는 선택한 유형과 난이도를 기준으로 생성됩니다.</li>
                <li>과제명은 선택 유형 기준으로 생성되며 수정할 수 있습니다.</li>
                <li>동일 문제 출제는 모든 학생에게 같은 문제가 출제됩니다.</li>
                <li>학생별 문제 출제는 학생별 풀이 이력에 따라 문제 구성이 다를 수 있습니다.</li>
              </ul>
            </div>

            {/* 2. 상태 안내 */}
            <div className="p-4 rounded-xl border border-emerald-100/70 bg-gradient-to-br from-emerald-50/40 to-white hover:shadow-sm transition-all duration-200">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                <h3 className="text-sm font-bold text-gray-900">2. 상태 안내</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 pl-6 list-disc marker:text-emerald-400 leading-relaxed">
                <li>작성중은 과제를 저장하고 수정할 수 있는 상태입니다.</li>
                <li>게시됨은 학생에게 과제가 배정된 상태입니다.</li>
                <li>종료는 과제 수행과 결과 처리가 종료된 상태입니다.</li>
                <li>학생 과제 상태는 미시작, 진행중, 제출완료, 시간초과로 구분됩니다.</li>
              </ul>
            </div>

            {/* 3. 배정 안내 */}
            <div className="p-4 rounded-xl border border-purple-100/70 bg-gradient-to-br from-purple-50/40 to-white hover:shadow-sm transition-all duration-200">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="h-4.5 w-4.5 text-purple-500 shrink-0" />
                <h3 className="text-sm font-bold text-gray-900">3. 배정 안내</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 pl-6 list-disc marker:text-purple-400 leading-relaxed">
                <li>과제는 반 단위 또는 학생 단위로 배정할 수 있습니다.</li>
                <li>동일 학생이 반 배정과 개별 배정에 함께 포함된 경우 1명으로 집계됩니다.</li>
                <li>배정 취소된 학생은 출력 대상과 결과 집계에서 제외됩니다.</li>
              </ul>
            </div>

            {/* 4. 출력 안내 */}
            <div className="p-4 rounded-xl border border-rose-100/70 bg-gradient-to-br from-rose-50/40 to-white hover:shadow-sm transition-all duration-200">
              <div className="flex items-center gap-2 mb-3">
                <Printer className="h-4.5 w-4.5 text-rose-500 shrink-0" />
                <h3 className="text-sm font-bold text-gray-900">4. 출력 안내</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 pl-6 list-disc marker:text-rose-400 leading-relaxed">
                <li>동일 문제 출제 과제는 저장 후 출력할 수 있습니다.</li>
                <li>학생별 문제 출제 과제는 게시됨 상태부터 출력할 수 있습니다.</li>
                <li>학생용 출력물에는 정답과 해설이 포함되지 않습니다.</li>
                <li>교사용 출력물에는 정답과 해설이 포함됩니다.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 shrink-0 flex justify-end">
            <Button onClick={() => setHelpOpen(false)} className="px-6 bg-primary hover:bg-primary/90 font-semibold text-sm">
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
