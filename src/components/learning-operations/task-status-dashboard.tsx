"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  ExternalLink,
  HelpCircle,
  Percent,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DifficultyBadges } from "@/components/admin/task-center/difficulty-badges";
import { TaskStatusBadge } from "@/components/admin/task-center/task-status-badge";
import {
  Difficulty,
  ProblemMode,
  Subject,
  TaskStatus,
} from "@/lib/task-center-mock";
import {
  HQ_INSTITUTIONS,
  HQ_TASK_STATUS_RECORDS,
  HqInstitution,
  HqTaskAssignment,
  HqTaskStatusRecord,
} from "@/lib/hq-task-status-mock";
import { cn } from "@/lib/utils";

type SubjectFilter = "all" | Subject;
type StatusFilter = "all" | TaskStatus;
type ModeFilter = "all" | ProblemMode;
type SortDirection = "asc" | "desc";
type SortKey =
  | "uniqueNo"
  | "name"
  | "course"
  | "typeCount"
  | "problemCount"
  | "createdAt"
  | "assignedCount"
  | "submittedCount"
  | "avgScore";

interface Filters {
  subject: SubjectFilter;
  institutionIds: string[];
  status: StatusFilter;
  course: string;
  difficulties: Difficulty[];
  mode: ModeFilter;
  dateFrom: string;
  dateTo: string;
  keyword: string;
}

interface TaskMetrics {
  assignedCount: number;
  submittedCount: number;
  submissionRate: number;
  scoreSum: number;
  avgScore: number | null;
  maxProblemCount: number;
}

const DEFAULT_FILTERS: Filters = {
  subject: "all",
  institutionIds: [],
  status: "all",
  course: "all",
  difficulties: [],
  mode: "all",
  dateFrom: "",
  dateTo: "",
  keyword: "",
};

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "basic", label: "기본" },
  { value: "intermediate", label: "실력" },
  { value: "advanced", label: "심화" },
];

const HELP_SECTIONS = [
  {
    title: "통계 집계 기준",
    lines: [
      "과제 현황은 현재 검색 조건에 해당하는 과제를 기준으로 집계됩니다.",
      "과제 수에는 작성중, 게시됨, 종료 상태의 과제가 포함됩니다.",
      "삭제된 과제와 배정 취소된 학생 과제는 집계에서 제외됩니다.",
    ],
  },
  {
    title: "과제 상태 기준",
    lines: [
      "작성중은 과제를 저장하고 수정할 수 있는 상태입니다.",
      "게시됨은 학생에게 과제가 배정된 상태입니다.",
      "종료는 과제 수행과 결과 처리가 종료된 상태입니다.",
    ],
  },
  {
    title: "배정 건수 산정 기준",
    lines: [
      "배정 건수는 과제별 배정 유지 상태의 학생 과제를 합산한 값입니다.",
      "동일 과제에 동일 학생이 반 배정과 개별 배정으로 중복된 경우 1건으로 집계됩니다.",
    ],
  },
  {
    title: "제출률 계산 기준",
    lines: [
      "제출완료 건수는 학생이 제출을 완료한 과제를 기준으로 집계됩니다.",
      "제출률은 배정 건수 대비 제출완료 건수의 비율입니다.",
      "배정 건수가 0건인 경우 제출률은 0%로 표시됩니다.",
    ],
  },
  {
    title: "평균 점수 계산 기준",
    lines: [
      "평균 점수는 제출완료 상태인 학생 과제의 점수를 기준으로 계산됩니다.",
      "동일 학생의 수행 결과가 여러 개인 경우 최신 결과가 적용됩니다.",
      "제출완료 과제가 없는 경우 평균 점수는 -로 표시됩니다.",
    ],
  },
];

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function courseSort(a: string, b: string) {
  const parse = (value: string) => {
    const level = value.startsWith("초") ? 0 : value.startsWith("중") ? 1 : 2;
    const match = value.match(/(\d+)(?:-(\d+))?/);
    return [level, Number(match?.[1] ?? 0), Number(match?.[2] ?? 0)];
  };
  const av = parse(a);
  const bv = parse(b);
  return av[0] - bv[0] || av[1] - bv[1] || av[2] - bv[2];
}

function latestResult(assignment: HqTaskAssignment) {
  return [...assignment.results].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
}

function activeAssignments(record: HqTaskStatusRecord) {
  const assignmentMap = new Map<string, HqTaskAssignment>();
  record.assignments
    .filter((assignment) => !assignment.canceled)
    .forEach((assignment) => {
      const current = assignmentMap.get(assignment.studentId);
      if (!current) {
        assignmentMap.set(assignment.studentId, assignment);
        return;
      }
      const currentResultTime = latestResult(current)?.createdAt ?? "";
      const nextResultTime = latestResult(assignment)?.createdAt ?? "";
      if (nextResultTime >= currentResultTime) {
        assignmentMap.set(assignment.studentId, assignment);
      }
    });
  return Array.from(assignmentMap.values());
}

function getTaskMetrics(record: HqTaskStatusRecord): TaskMetrics {
  const assignments = activeAssignments(record);
  const submitted = assignments.filter(
    (assignment) => assignment.status === "submitted",
  );
  const scoreSum = submitted.reduce(
    (sum, assignment) => sum + (latestResult(assignment)?.score ?? 0),
    0,
  );
  const assignedCount = assignments.length;
  const submittedCount = submitted.length;

  return {
    assignedCount,
    submittedCount,
    submissionRate:
      assignedCount === 0
        ? 0
        : Math.round((submittedCount / assignedCount) * 100),
    scoreSum,
    avgScore:
      submittedCount === 0 ? null : Math.round(scoreSum / submittedCount),
    maxProblemCount: Math.max(
      record.totalProblems,
      ...assignments.map((assignment) => assignment.problemCount),
    ),
  };
}

function formatDateTime(value: string) {
  const date = new Date(value);
  const datePart = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${datePart} ${timePart}`;
}

function problemModeLabel(mode: ProblemMode) {
  if (mode === "same") return "동일";
  if (mode === "individual") return "학생별";
  return "재학습";
}

function ProblemModeBadge({ mode }: { mode: ProblemMode }) {
  const className =
    mode === "same"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : mode === "individual"
        ? "border-violet-200 bg-violet-50 text-violet-700"
        : "border-orange-200 bg-orange-50 text-orange-700";
  return (
    <Badge variant="outline" className={className}>
      {problemModeLabel(mode)}
    </Badge>
  );
}

function SubjectBadge({ subject }: { subject: Subject }) {
  return (
    <Badge
      variant="outline"
      className={
        subject === "math"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }
    >
      {subject === "math" ? "수학" : "과학"}
    </Badge>
  );
}

function SegmentGroup<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
            value === option.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-slate-200 bg-white text-muted-foreground hover:border-primary/30 hover:text-primary",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function InstitutionMultiSelect({
  institutions,
  value,
  onChange,
}: {
  institutions: HqInstitution[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedNames = institutions
    .filter((institution) => value.includes(institution.id))
    .map((institution) => institution.name);

  const toggle = (institutionId: string) => {
    const next = value.includes(institutionId)
      ? value.filter((id) => id !== institutionId)
      : [...value, institutionId];
    onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-label="기관 선택"
          aria-expanded={open}
          className="h-9 w-[230px] justify-between bg-white font-normal"
        >
          <span className="truncate">
            {selectedNames.length === 0
              ? "전체"
              : selectedNames.length === 1
                ? selectedNames[0]
                : `${selectedNames[0]} 외 ${selectedNames.length - 1}개`}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="기관명 검색" />
          <CommandList>
            <CommandEmpty>검색된 기관이 없습니다.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => onChange([])}>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.length === 0 ? "opacity-100" : "opacity-0",
                  )}
                />
                전체
              </CommandItem>
              {institutions.map((institution) => (
                <CommandItem
                  key={institution.id}
                  value={institution.name}
                  onSelect={() => toggle(institution.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(institution.id)
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {institution.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const Icon =
    activeKey !== sortKey
      ? ArrowUpDown
      : direction === "asc"
        ? ArrowUp
        : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 whitespace-nowrap font-semibold hover:text-primary"
      aria-label={`${label} 정렬`}
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function DetailPopover({
  label,
  title,
  items,
  disabled = false,
}: {
  label: string;
  title: string;
  items: string[];
  disabled?: boolean;
}) {
  if (disabled) {
    return <span className="whitespace-nowrap text-muted-foreground">{label}</span>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="max-w-[220px] truncate text-left text-primary underline-offset-4 hover:underline"
          title={label}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px]" align="start">
        <p className="mb-3 text-sm font-bold text-foreground">{title}</p>
        <ul className="max-h-64 space-y-2 overflow-y-auto text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="rounded-md bg-slate-50 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export default function TaskStatusDashboard() {
  const [draftFilters, setDraftFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = React.useState<SortKey>("uniqueNo");
  const [sortDirection, setSortDirection] =
    React.useState<SortDirection>("desc");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [helpOpen, setHelpOpen] = React.useState(false);

  const visibleRecords = React.useMemo(
    () => HQ_TASK_STATUS_RECORDS.filter((record) => !record.deleted),
    [],
  );

  const courseOptions = React.useMemo(() => {
    const courses = visibleRecords
      .filter(
        (record) =>
          draftFilters.subject === "all" ||
          record.subject === draftFilters.subject,
      )
      .map((record) => record.course);
    return Array.from(new Set(courses)).sort(courseSort);
  }, [draftFilters.subject, visibleRecords]);

  const keywordLength = draftFilters.keyword.replace(/\s/g, "").length;
  const invalidKeyword = keywordLength === 1;
  const invalidDateRange = Boolean(
    draftFilters.dateFrom &&
      draftFilters.dateTo &&
      draftFilters.dateFrom > draftFilters.dateTo,
  );
  const searchDisabled = invalidKeyword || invalidDateRange;

  const filteredRecords = React.useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLocaleLowerCase("ko");
    return visibleRecords.filter((record) => {
      if (
        appliedFilters.subject !== "all" &&
        record.subject !== appliedFilters.subject
      ) {
        return false;
      }
      if (
        appliedFilters.institutionIds.length > 0 &&
        !appliedFilters.institutionIds.includes(record.institutionId)
      ) {
        return false;
      }
      if (
        appliedFilters.status !== "all" &&
        record.status !== appliedFilters.status
      ) {
        return false;
      }
      if (
        appliedFilters.course !== "all" &&
        record.course !== appliedFilters.course
      ) {
        return false;
      }
      if (
        appliedFilters.difficulties.length > 0 &&
        !appliedFilters.difficulties.some((difficulty) =>
          record.difficulties.includes(difficulty),
        )
      ) {
        return false;
      }
      if (
        appliedFilters.mode !== "all" &&
        record.problemMode !== appliedFilters.mode
      ) {
        return false;
      }
      const createdDate = record.createdAt.slice(0, 10);
      if (appliedFilters.dateFrom && createdDate < appliedFilters.dateFrom) {
        return false;
      }
      if (appliedFilters.dateTo && createdDate > appliedFilters.dateTo) {
        return false;
      }
      if (keyword) {
        const searchTarget = [
          record.name,
          ...record.units,
          ...record.types,
        ]
          .join(" ")
          .toLocaleLowerCase("ko");
        if (!searchTarget.includes(keyword)) return false;
      }
      return true;
    });
  }, [appliedFilters, visibleRecords]);

  const sortedRecords = React.useMemo(() => {
    const valueOf = (record: HqTaskStatusRecord) => {
      const metrics = getTaskMetrics(record);
      const values: Record<SortKey, string | number> = {
        uniqueNo: record.uniqueNo,
        name: record.name,
        course: record.course,
        typeCount: record.typeCount,
        problemCount: metrics.maxProblemCount,
        createdAt: new Date(record.createdAt).getTime(),
        assignedCount: metrics.assignedCount,
        submittedCount: metrics.submittedCount,
        avgScore: metrics.avgScore ?? -1,
      };
      return values[sortKey];
    };
    return [...filteredRecords].sort((a, b) => {
      const av = valueOf(a);
      const bv = valueOf(b);
      const comparison =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), "ko", { numeric: true });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredRecords, sortDirection, sortKey]);

  const summary = React.useMemo(() => {
    return filteredRecords.reduce(
      (acc, record) => {
        const metrics = getTaskMetrics(record);
        acc.assignedCount += metrics.assignedCount;
        acc.submittedCount += metrics.submittedCount;
        acc.scoreSum += metrics.scoreSum;
        return acc;
      },
      { assignedCount: 0, submittedCount: 0, scoreSum: 0 },
    );
  }, [filteredRecords]);

  const submissionRate =
    summary.assignedCount === 0
      ? 0
      : Math.round((summary.submittedCount / summary.assignedCount) * 100);
  const averageScore =
    summary.submittedCount === 0
      ? null
      : Math.round(summary.scoreSum / summary.submittedCount);
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRecords = sortedRecords.slice(
    (safePage - 1) * perPage,
    safePage * perPage,
  );
  const rangeStart = sortedRecords.length === 0 ? 0 : (safePage - 1) * perPage + 1;
  const rangeEnd = Math.min(safePage * perPage, sortedRecords.length);

  const pageNumbers = React.useMemo(() => {
    const count = Math.min(totalPages, 7);
    let start = Math.max(1, safePage - 3);
    start = Math.min(start, Math.max(1, totalPages - count + 1));
    return Array.from({ length: count }, (_, index) => start + index);
  }, [safePage, totalPages]);

  const changeSubject = (subject: SubjectFilter) => {
    const availableCourses = Array.from(
      new Set(
        visibleRecords
          .filter((record) => subject === "all" || record.subject === subject)
          .map((record) => record.course),
      ),
    );
    setDraftFilters((current) => ({
      ...current,
      subject,
      course:
        current.course === "all" || availableCourses.includes(current.course)
          ? current.course
          : "all",
    }));
  };

  const toggleDifficulty = (difficulty: Difficulty) => {
    setDraftFilters((current) => ({
      ...current,
      difficulties: current.difficulties.includes(difficulty)
        ? current.difficulties.filter((item) => item !== difficulty)
        : [...current.difficulties, difficulty],
    }));
  };

  const applySearch = () => {
    if (searchDisabled) return;
    setAppliedFilters({
      ...draftFilters,
      keyword: draftFilters.keyword.trim(),
    });
    setPage(1);
  };

  const resetSearch = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const summaryCards = [
    {
      title: "과제 수",
      description: "작성중·게시됨·종료 상태의 과제 수",
      value: `${formatNumber(filteredRecords.length)}건`,
      icon: ClipboardList,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "배정 건수",
      description: "학생에게 배정된 과제 수",
      value: `${formatNumber(summary.assignedCount)}건`,
      icon: Users,
      color: "text-violet-600 bg-violet-50",
    },
    {
      title: "제출완료 건수",
      description: "학생이 제출을 완료한 과제 수",
      value: `${formatNumber(summary.submittedCount)}건`,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "제출률",
      description: "배정 건수 대비 제출완료 비율",
      value: `${submissionRate}%`,
      icon: Percent,
      color: "text-orange-600 bg-orange-50",
    },
    {
      title: "평균 점수",
      description: "제출완료 학생 과제의 평균 점수",
      value: averageScore === null ? "-" : `${averageScore}점`,
      icon: BarChart3,
      color: "text-rose-600 bg-rose-50",
    },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#f4f6f9] pb-16">
        <div className="flex items-center justify-between px-6 pt-5 pb-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[1.5rem] font-bold text-foreground">과제 현황</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHelpOpen(true)}
              className="h-7 gap-1.5 border-gray-200 bg-white px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="h-3.5 w-3.5" /> 이용 안내
            </Button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <Card className="border-slate-200/80 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-end gap-x-5 gap-y-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">과목 구분</span>
                  <SegmentGroup
                    value={draftFilters.subject}
                    ariaLabel="과목 구분"
                    options={[
                      { value: "all", label: "전체" },
                      { value: "math", label: "수학" },
                      { value: "science", label: "과학" },
                    ]}
                    onChange={changeSubject}
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">기관</span>
                  <InstitutionMultiSelect
                    institutions={HQ_INSTITUTIONS}
                    value={draftFilters.institutionIds}
                    onChange={(institutionIds) =>
                      setDraftFilters((current) => ({ ...current, institutionIds }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">과제 상태</span>
                  <SegmentGroup
                    value={draftFilters.status}
                    ariaLabel="과제 상태"
                    options={[
                      { value: "all", label: "전체" },
                      { value: "draft", label: "작성중" },
                      { value: "published", label: "게시됨" },
                      { value: "ended", label: "종료" },
                    ]}
                    onChange={(status) =>
                      setDraftFilters((current) => ({ ...current, status }))
                    }
                  />
                </div>

                <div className="min-w-[150px] space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="course-filter">
                    학습과정
                  </label>
                  <Select
                    value={draftFilters.course}
                    onValueChange={(course) =>
                      setDraftFilters((current) => ({ ...current, course }))
                    }
                  >
                    <SelectTrigger id="course-filter" className="h-9 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {courseOptions.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">난이도</span>
                  <div className="flex gap-1" role="group" aria-label="난이도">
                    <button
                      type="button"
                      aria-pressed={draftFilters.difficulties.length === 0}
                      onClick={() =>
                        setDraftFilters((current) => ({ ...current, difficulties: [] }))
                      }
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm font-medium",
                        draftFilters.difficulties.length === 0
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-slate-200 bg-white text-muted-foreground",
                      )}
                    >
                      전체
                    </button>
                    {DIFFICULTY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={draftFilters.difficulties.includes(option.value)}
                        onClick={() => toggleDifficulty(option.value)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-sm font-medium",
                          draftFilters.difficulties.includes(option.value)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-slate-200 bg-white text-muted-foreground",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">문제 구성 방식</span>
                  <SegmentGroup
                    value={draftFilters.mode}
                    ariaLabel="문제 구성 방식"
                    options={[
                      { value: "all", label: "전체" },
                      { value: "same", label: "동일" },
                      { value: "individual", label: "학생별" },
                      { value: "relearn", label: "재학습" },
                    ]}
                    onChange={(mode) =>
                      setDraftFilters((current) => ({ ...current, mode }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">생성일</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      aria-label="생성일 시작일"
                      value={draftFilters.dateFrom}
                      onChange={(event) =>
                        setDraftFilters((current) => ({
                          ...current,
                          dateFrom: event.target.value,
                        }))
                      }
                      className="h-9 w-[145px] bg-white"
                    />
                    <span className="text-muted-foreground">~</span>
                    <Input
                      type="date"
                      aria-label="생성일 종료일"
                      value={draftFilters.dateTo}
                      onChange={(event) =>
                        setDraftFilters((current) => ({
                          ...current,
                          dateTo: event.target.value,
                        }))
                      }
                      className="h-9 w-[145px] bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <Input
                  aria-label="검색어"
                  placeholder="과제명, 단원명, 유형명 검색"
                  value={draftFilters.keyword}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      keyword: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !searchDisabled) applySearch();
                  }}
                  className="h-9 min-w-[280px] flex-1 bg-white"
                />
                <Button
                  size="sm"
                  onClick={applySearch}
                  disabled={searchDisabled}
                  className="h-9 gap-1.5 px-4"
                >
                  <Search className="h-4 w-4" /> 검색
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetSearch}
                  className="h-9 gap-1.5 bg-white px-4"
                >
                  <RotateCcw className="h-4 w-4" /> 초기화
                </Button>
                <span className="ml-auto whitespace-nowrap text-sm font-semibold text-muted-foreground">
                  조회 건수: {formatNumber(filteredRecords.length)}건
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="border-slate-200/80 shadow-sm">
                  <CardContent className="flex h-full items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-muted-foreground">{card.title}</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.description}</p>
                    </div>
                    <div className={cn("rounded-xl p-2.5", card.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="overflow-hidden border-slate-200/80 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[2100px]">
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="w-[95px]">
                        <SortableHeader label="고유번호" sortKey="uniqueNo" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      </TableHead>
                      <TableHead className="sticky left-0 z-20 min-w-[170px] bg-slate-50">기관명</TableHead>
                      <TableHead className="w-[75px]">과목</TableHead>
                      <TableHead className="min-w-[220px]">
                        <SortableHeader label="과제명" sortKey="name" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      </TableHead>
                      <TableHead className="w-[100px]">
                        <SortableHeader label="학습과정" sortKey="course" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      </TableHead>
                      <TableHead className="min-w-[230px]">출제 단원</TableHead>
                      <TableHead className="w-[90px]">
                        <SortableHeader label="유형 수" sortKey="typeCount" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      </TableHead>
                      <TableHead className="w-[105px]">
                        <SortableHeader label="문제 수" sortKey="problemCount" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      </TableHead>
                      <TableHead className="min-w-[150px]">난이도</TableHead>
                      <TableHead className="w-[110px]">문제 구성 방식</TableHead>
                      <TableHead className="w-[160px]">
                        <SortableHeader label="생성일시" sortKey="createdAt" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      </TableHead>
                      <TableHead className="w-[90px]">상태</TableHead>
                      <TableHead className="w-[85px] text-right">
                        <SortableHeader label="배정" sortKey="assignedCount" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      </TableHead>
                      <TableHead className="w-[85px] text-right">
                        <SortableHeader label="완료" sortKey="submittedCount" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      </TableHead>
                      <TableHead className="w-[80px] text-right">제출률</TableHead>
                      <TableHead className="w-[105px] text-right">
                        <SortableHeader label="평균 점수" sortKey="avgScore" activeKey={sortKey} direction={sortDirection} onSort={handleSort} />
                      </TableHead>
                      <TableHead className="sticky right-0 z-20 w-[85px] bg-slate-50 text-center">바로가기</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={17} className="h-48 text-center text-muted-foreground">
                          조회 결과가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageRecords.map((record) => {
                        const metrics = getTaskMetrics(record);
                        const unitLabel =
                          record.units.length <= 1
                            ? record.units[0] ?? "-"
                            : `${record.units[0]} 외 ${record.units.length - 1}건`;
                        const problemCount =
                          record.problemMode === "same"
                            ? record.totalProblems
                            : metrics.maxProblemCount;
                        const problemCountLabel =
                          record.problemMode === "relearn"
                            ? `${formatNumber(problemCount)}문항(최대)`
                            : `${formatNumber(problemCount)}문항`;
                        const detailUrl = `/admin/task-center/${record.id}?source=hq-task-status&institutionId=${record.institutionId}`;

                        return (
                          <TableRow key={record.id}>
                            <TableCell className="font-mono text-sm font-semibold text-slate-600">{record.uniqueNo}</TableCell>
                            <TableCell className="sticky left-0 z-10 bg-white font-medium">{record.institutionName}</TableCell>
                            <TableCell><SubjectBadge subject={record.subject} /></TableCell>
                            <TableCell>
                              <span className="block max-w-[220px] truncate font-medium" title={record.name}>{record.name}</span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{record.course}</TableCell>
                            <TableCell>
                              <DetailPopover label={unitLabel} title="전체 출제 단원" items={record.units} disabled={record.units.length === 0} />
                            </TableCell>
                            <TableCell>
                              <DetailPopover label={`${record.typeCount}개`} title="전체 유형" items={record.types} disabled={record.typeCount === 0} />
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{problemCountLabel}</TableCell>
                            <TableCell><DifficultyBadges difficulties={record.difficulties} /></TableCell>
                            <TableCell><ProblemModeBadge mode={record.problemMode} /></TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(record.createdAt)}</TableCell>
                            <TableCell><TaskStatusBadge status={record.status} /></TableCell>
                            <TableCell className="text-right">{formatNumber(metrics.assignedCount)}명</TableCell>
                            <TableCell className="text-right">{formatNumber(metrics.submittedCount)}명</TableCell>
                            <TableCell className="text-right">{metrics.submissionRate}%</TableCell>
                            <TableCell className="text-right">{metrics.avgScore === null ? "-" : `${metrics.avgScore}점`}</TableCell>
                            <TableCell className="sticky right-0 z-10 bg-white text-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a
                                    href={detailUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${record.name} 과제 상세 바로가기`}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>과제 상세 바로가기</TooltipContent>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-5 py-4">
                <span className="text-sm text-muted-foreground">
                  {rangeStart} - {rangeEnd} / 전체 {formatNumber(sortedRecords.length)}
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={String(perPage)}
                    onValueChange={(value) => {
                      setPerPage(Number(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger aria-label="페이지당 표시 개수" className="h-8 w-[90px] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50, 100].map((count) => (
                        <SelectItem key={count} value={String(count)}>{count}개</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" aria-label="첫 페이지" disabled={safePage === 1} onClick={() => setPage(1)}>
                      <ChevronFirst className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" aria-label="이전 페이지" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {pageNumbers.map((pageNumber) => (
                      <Button
                        key={pageNumber}
                        variant={safePage === pageNumber ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`${pageNumber}페이지`}
                        aria-current={safePage === pageNumber ? "page" : undefined}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    ))}
                    <Button variant="outline" size="icon" className="h-8 w-8" aria-label="다음 페이지" disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" aria-label="마지막 페이지" disabled={safePage === totalPages} onClick={() => setPage(totalPages)}>
                      <ChevronLast className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <DialogHeader className="shrink-0 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <DialogTitle className="text-xl font-bold leading-none text-gray-900">과제 현황 이용 안내</DialogTitle>
              </div>
            </DialogHeader>
            <div className="flex-1 space-y-4 overflow-y-auto py-5 pr-1">
              {HELP_SECTIONS.map((section, index) => (
                <section key={section.title} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <h3 className="mb-2 text-sm font-bold text-gray-900">{index + 1}. {section.title}</h3>
                  <ul className="space-y-1.5 pl-5 text-sm leading-relaxed text-gray-600">
                    {section.lines.map((line) => (
                      <li key={line} className="list-disc marker:text-blue-400">{line}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <DialogFooter className="shrink-0 border-t border-slate-100 pt-4">
              <Button onClick={() => setHelpOpen(false)} className="bg-primary px-6 text-sm font-semibold hover:bg-primary/90">확인</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
