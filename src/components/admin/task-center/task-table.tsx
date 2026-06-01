"use client";
import * as React from "react";
import { TaskItem, calcAvgScore, MATH_CURRICULA, SCIENCE_CURRICULA } from "@/lib/task-center-mock";
import { TaskStatusBadge } from "./task-status-badge";
import { DifficultyBadges } from "./difficulty-badges";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Eye, ArrowUpDown, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "./confirm-dialog";
import { useTaskCenterStore } from "@/lib/task-center-store";
import { getStoredClasses } from "@/lib/teacher-mock";

type SortKey = "id" | "name" | "course" | "typeCount" | "problemCount" | "createdAt" | "assignedCount" | "completedCount" | "avgScore";
type SortDir = "asc" | "desc";

interface Props {
  tasks: TaskItem[];
}

const getMappedClassName = (name: string): string => {
  if (typeof window === "undefined") return name;
  const storedClasses = getStoredClasses();
  if (storedClasses.length === 0) return name;

  if (storedClasses.some(c => c.name === name)) {
    return name;
  }

  if (name === "1반" && storedClasses[0]) return storedClasses[0].name;
  if (name === "2반" && storedClasses[1]) return storedClasses[1].name;
  if (name === "3반" && storedClasses[2]) return storedClasses[2].name;

  return storedClasses[0] ? storedClasses[0].name : name;
};

function fmt(dt: string) {
  return dt.replace("T", " ").slice(0, 16);
}

function getSortedMinorsInfo(task: TaskItem) {
  const types = task.selectedTypes;
  if (!types || types.length === 0) {
    return { firstPath: "-", firstMinor: "", totalCount: 0, allPaths: [] };
  }
  
  const list = task.subject === "science" ? SCIENCE_CURRICULA : MATH_CURRICULA;
  const curriculum = list.find(c => c.course === task.course);
  
  // 1. 선택된 고유 단원 목록 수집 (대단원 > 소단원 경로 형태 및 고유 단원명)
  const checkedMinors = new Set<string>(); // "minorUnit" 단원명 수집
  const pathMap = new Map<string, string>(); // "minorUnit" -> "majorUnit > minorUnit" 경로 매핑
  const selectedTypeIds = new Set(types.map(t => t.typeId));
  
  if (curriculum) {
    // 커리큘럼 정렬 순서대로 순회
    curriculum.types.forEach(ct => {
      if (selectedTypeIds.has(ct.id)) {
        checkedMinors.add(ct.minorUnit);
        if (!pathMap.has(ct.minorUnit)) {
          pathMap.set(ct.minorUnit, `${ct.majorUnit} > ${ct.minorUnit}`);
        }
      }
    });
  } else {
    // 폴백
    types.forEach(t => {
      checkedMinors.add(t.minorUnit);
      if (!pathMap.has(t.minorUnit)) {
        pathMap.set(t.minorUnit, `${t.majorUnit} > ${t.minorUnit}`);
      }
    });
  }
  
  const sortedMinors = Array.from(checkedMinors);
  const totalCount = sortedMinors.length;
  
  if (totalCount === 0) {
    return { firstPath: "-", firstMinor: "", totalCount: 0, allPaths: [] };
  }
  
  const firstMinor = sortedMinors[0];
  const firstPath = pathMap.get(firstMinor) || "-";
  const allPaths = sortedMinors.map(minor => pathMap.get(minor) || "");
  
  return { firstPath, firstMinor, totalCount, allPaths };
}

function getDisplayTaskName(task: TaskItem): string {
  if (!task.createdAt) return task.name;
  const targetDate = new Date(task.createdAt);
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;
  
  const info = getSortedMinorsInfo(task);
  if (info.totalCount === 0) {
    return task.name;
  }
  
  const base = info.firstMinor;
  return info.totalCount <= 1 
    ? `${dateStr} | ${base}` 
    : `${dateStr} | ${base} 외 ${info.totalCount - 1}건`;
}

function UnitPopover({ items, label }: { items: string[]; label: string }) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (items.length === 0) return <span className="text-muted-foreground text-xs">{label}</span>;

  const displayLabel = label.length > 20 ? label.slice(0, 20) + "…" : label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="text-left text-sm text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer outline-none transition-colors"
          title={label}
          suppressHydrationWarning
        >
          {mounted ? displayLabel : ""}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white border border-slate-200 shadow-xl rounded-xl z-50" align="start">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <span className="text-xs font-bold text-slate-800">출제 단원</span>
          <button onClick={() => setOpen(false)} className="p-0.5 hover:bg-slate-100 rounded transition-colors"><X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <ul className="max-h-60 overflow-y-auto py-2 divide-y divide-slate-50">
          {items.map((it, i) => <li key={i} className="px-4 py-1.8 text-xs text-slate-600 font-medium">{it}</li>)}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function TypeCountPopover({ task }: { task: TaskItem }) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 고유 유형 수집
  const uniqueTypes = React.useMemo(() => {
    const seen = new Set<string>();
    return task.selectedTypes.filter(t => {
      if (seen.has(t.typeId)) return false;
      seen.add(t.typeId);
      return true;
    });
  }, [task.selectedTypes]);

  const count = uniqueTypes.length;
  if (count === 0) return <span className="text-muted-foreground text-sm">0개</span>;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline outline-none transition-colors font-medium"
          suppressHydrationWarning
        >
          {mounted ? `${count}개` : ""}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-white border border-slate-200 shadow-xl rounded-xl z-50" align="start">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <span className="text-xs font-bold text-slate-800">선택 유형 목록</span>
          <button onClick={() => setOpen(false)} className="p-0.5 hover:bg-slate-100 rounded transition-colors"><X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" /></button>
        </div>
        <ul className="max-h-60 overflow-y-auto py-2 divide-y divide-slate-50">
          {uniqueTypes.map((t, i) => (
            <li key={i} className="px-4 py-2 text-xs">
              <span className="text-slate-400">{t.majorUnit} &gt; {t.minorUnit} &gt; </span>
              <span className="font-semibold text-slate-700">{t.typeName}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function TaskTable({ tasks }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { deleteTask, duplicateTask } = useTaskCenterStore();

  const [sortKey, setSortKey] = React.useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [deleteTarget, setDeleteTarget] = React.useState<TaskItem | null>(null);
  const [duplicateTarget, setDuplicateTarget] = React.useState<TaskItem | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = [...tasks].sort((a, b) => {
    let va: number | string = 0, vb: number | string = 0;
    const completedA = a.assignedStudents.filter(s => s.status === "submitted");
    const completedB = b.assignedStudents.filter(s => s.status === "submitted");
    switch (sortKey) {
      case "id": va = a.id; vb = b.id; break;
      case "name": va = getDisplayTaskName(a); vb = getDisplayTaskName(b); break;
      case "course": va = a.course; vb = b.course; break;
      case "typeCount": {
        const setA = new Set(a.selectedTypes.map(t => t.typeId));
        const setB = new Set(b.selectedTypes.map(t => t.typeId));
        va = setA.size;
        vb = setB.size;
        break;
      }
      case "problemCount": va = a.totalProblems; vb = b.totalProblems; break;
      case "createdAt": va = a.createdAt; vb = b.createdAt; break;
      case "assignedCount": va = a.assignedStudents.length; vb = b.assignedStudents.length; break;
      case "completedCount": va = completedA.length; vb = completedB.length; break;
      case "avgScore": va = calcAvgScore(a.assignedStudents) ?? -1; vb = calcAvgScore(b.assignedStudents) ?? -1; break;
    }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-1 hover:text-primary whitespace-nowrap group">
      {label}
      <ArrowUpDown className={`h-3 w-3 transition-colors ${sortKey === k ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
    </button>
  );

  const getUnitLabel = (task: TaskItem) => {
    const info = getSortedMinorsInfo(task);
    if (info.totalCount === 0) return "-";
    return info.totalCount === 1 ? info.firstPath : `${info.firstPath} 외 ${info.totalCount - 1}건`;
  };

  const getUnitItems = (task: TaskItem) => {
    const info = getSortedMinorsInfo(task);
    return info.allPaths;
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75">
              {[
                { k: "id" as SortKey, label: "고유번호" },
                { k: "name" as SortKey, label: "과제명" },
                { k: "course" as SortKey, label: "학습과정" },
              ].map(({ k, label }) => (
                <th key={k} className="py-3 px-3 text-left font-semibold text-muted-foreground text-xs">
                  <SortBtn k={k} label={label} />
                </th>
              ))}
              <th className="py-3 px-3 text-left font-semibold text-muted-foreground text-xs whitespace-nowrap">출제 단원</th>
              <th className="py-3 px-3 text-left font-semibold text-muted-foreground text-xs"><SortBtn k="typeCount" label="유형 수" /></th>
              <th className="py-3 px-3 text-left font-semibold text-muted-foreground text-xs"><SortBtn k="problemCount" label="문제 수" /></th>
              <th className="py-3 px-3 text-left font-semibold text-muted-foreground text-xs whitespace-nowrap">난이도</th>
              <th className="py-3 px-3 text-left font-semibold text-muted-foreground text-xs whitespace-nowrap">문제 구성 방식</th>
              <th className="py-3 px-3 text-left font-semibold text-muted-foreground text-xs"><SortBtn k="createdAt" label="생성일시" /></th>
              <th className="py-3 px-3 text-left font-semibold text-muted-foreground text-xs whitespace-nowrap">상태</th>
              <th className="py-3 px-3 text-left font-semibold text-muted-foreground text-xs"><SortBtn k="assignedCount" label="배정" /></th>
              <th className="py-3 px-3 text-left font-semibold text-muted-foreground text-xs"><SortBtn k="completedCount" label="완료" /></th>
              <th className="py-3 px-3 text-left font-semibold text-muted-foreground text-xs"><SortBtn k="avgScore" label="평균 점수" /></th>
              <th className="py-3 px-3 text-left font-semibold text-muted-foreground text-xs whitespace-nowrap">관리</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-16 text-center text-muted-foreground text-sm">
                  조회된 과제가 없습니다.
                </td>
              </tr>
            ) : sorted.map((task) => {
              const completed = task.assignedStudents.filter(s => s.status === "submitted");
              const avg = calcAvgScore(task.assignedStudents);
              const unitLabel = getUnitLabel(task);
              const unitItems = getUnitItems(task);

              return (
                <tr key={task.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/40 transition-colors duration-150">
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{task.id}</td>
                  <td className="py-3 px-3 max-w-[200px]">
                    <button
                      onClick={() => router.push(`/admin/task-center/${task.id}`)}
                      className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold truncate block w-full text-left transition-colors duration-150"
                      title={getDisplayTaskName(task)}
                    >
                      {getDisplayTaskName(task).length > 20 ? getDisplayTaskName(task).slice(0, 20) + "…" : getDisplayTaskName(task)}
                    </button>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-700">{task.course}</td>
                  <td className="py-3 px-3 min-w-[150px]">
                    <UnitPopover items={unitItems} label={unitLabel} />
                  </td>
                  <td className="py-3 px-3"><TypeCountPopover task={task} /></td>
                  <td className="py-3 px-3 whitespace-nowrap">{task.totalProblems}문항</td>
                  <td className="py-3 px-3"><DifficultyBadges difficulties={task.difficulties} /></td>
                  <td className="py-3 px-3">
                    {mounted ? (
                      <span className={`inline-flex w-fit whitespace-nowrap px-2 py-0.5 rounded-full text-[11px] font-medium border ${task.problemMode === "same" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                        {task.problemMode === "same" ? "동일" : "학생별"}
                      </span>
                    ) : ""}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-muted-foreground text-xs">{fmt(task.createdAt)}</td>
                  <td className="py-3 px-3"><TaskStatusBadge status={task.status} /></td>
                  <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                    {mounted ? (() => {
                      const classes = task.assignedClasses || [];
                      if (classes.length > 0) {
                        const mappedFirst = getMappedClassName(classes[0]);
                        if (classes.length === 1) return mappedFirst;
                        return `${mappedFirst} 외 ${classes.length - 1}개`;
                      }
                      return `${task.assignedStudents.length}명`;
                    })() : ""}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">{mounted ? `${completed.length}명` : ""}</td>
                  <td className="py-3 px-3 whitespace-nowrap font-semibold">
                    {mounted ? (avg !== null ? `${avg}점` : "-") : ""}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 justify-start">
                      <button
                        title="미리보기"
                        onClick={() => toast({ title: "준비중입니다!" })}
                        className="px-2.5 py-1 text-xs font-medium bg-white border border-border rounded-md hover:bg-muted text-foreground shadow-sm transition-colors"
                      >
                        미리보기
                      </button>
                      <button
                        title="복제"
                        onClick={() => setDuplicateTarget(task)}
                        className="px-2.5 py-1 text-xs font-medium bg-white border border-border rounded-md hover:bg-muted text-foreground shadow-sm transition-colors"
                      >
                        복제
                      </button>
                      {task.status === "draft" && (
                        <button
                          title="삭제"
                          onClick={() => setDeleteTarget(task)}
                          className="px-2.5 py-1 text-xs font-medium bg-white border border-red-200 rounded-md hover:bg-red-50 text-red-600 shadow-sm transition-colors"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="과제 삭제"
        description={`"${deleteTarget ? getDisplayTaskName(deleteTarget) : ""}" 과제를 삭제하시겠습니까? 삭제한 과제는 복구할 수 없습니다.`}
        confirmLabel="삭제"
        confirmVariant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            deleteTask(deleteTarget.id);
            toast({ title: "삭제되었습니다." });
            setDeleteTarget(null);
          }
        }}
      />

      {/* 복제 확인 */}
      <ConfirmDialog
        open={!!duplicateTarget}
        onOpenChange={(o) => !o && setDuplicateTarget(null)}
        title="과제 복제"
        description={`"${duplicateTarget ? getDisplayTaskName(duplicateTarget) : ""}" 과제를 복제하시겠습니까?`}
        confirmLabel="복제"
        onConfirm={() => {
          if (duplicateTarget) {
            const newTask = duplicateTask(duplicateTarget.id);
            toast({ title: "복제되었습니다." });
            setDuplicateTarget(null);
            router.push(`/admin/task-center/${newTask.id}`);
          }
        }}
      />
    </>
  );
}
