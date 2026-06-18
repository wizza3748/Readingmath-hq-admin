"use client";
import * as React from "react";
import {
  TaskItem, SelectedType, Difficulty, StudentAssignment, ProblemScope,
  getDifficultyLabel, getMaxCount, calcAvgScore,
} from "@/lib/task-center-mock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BarChart3, Info, ChevronDown, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AssignModal } from "../assign-modal";
import { ResultModal } from "../result-modal";
import { useTaskCenterStore } from "@/lib/task-center-store";
import { useToast } from "@/hooks/use-toast";
import { getStoredClasses } from "@/lib/teacher-mock";

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

interface Props {
  task?: TaskItem;
  taskId?: string;
  name: string;
  selectedTypes: SelectedType[];
  problemMode: "same" | "individual";
  prioritizeUnsolved: boolean;
  onlyImportant: boolean;
  onlyImportantType: boolean;
  readonly?: boolean;
  onNameChange: (v: string) => void;
  onTypeProblemCountChange: (typeId: string, difficulty: Difficulty, count: number) => void;
  onProblemModeChange: (v: "same" | "individual") => void;
  onOnlyImportantChange: (v: boolean) => void;
  onOnlyImportantTypeChange: (v: boolean) => void;
  onQuickSetAll: (count: number) => void;
}

const DIFFICULTY_LIST: Difficulty[] = ["basic", "intermediate", "advanced"];

function SegBtn({ label, active, disabled, onClick }: { label: string; active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        active ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold" : "bg-white text-muted-foreground border-slate-200 hover:border-primary/30 hover:text-primary hover:bg-slate-50/50"
      }`}
    >
      {label}
    </button>
  );
}

export function TaskSettingPanel({
  task, taskId, name, selectedTypes, problemMode,
  onlyImportant, onlyImportantType, readonly,
  onNameChange, onTypeProblemCountChange,
  onProblemModeChange,
  onOnlyImportantChange, onOnlyImportantTypeChange, onQuickSetAll,
}: Props) {
  const countKey = onlyImportant ? "importantCount" : "maxCount";
  const { assignStudents } = useTaskCenterStore();
  const { toast } = useToast();
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [resultOpen, setResultOpen] = React.useState(false);
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [countTooltipOpen, setCountTooltipOpen] = React.useState(false);
  const [assignHelpOpen, setAssignHelpOpen] = React.useState(false);
  const [resultHelpOpen, setResultHelpOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 중요 유형 필터가 켜져 있으면 중요 유형만 필터링한 리스트를 기준으로 계산
  const activeSelectedTypes = onlyImportantType
    ? selectedTypes.filter(t => t.importantCount.basic > 0 || t.importantCount.intermediate > 0 || t.importantCount.advanced > 0)
    : selectedTypes;

  // 1. 문제 수 범위 계산 (선택된 조합 기준)
  let minPossibleProblems = 0;
  let maxPossibleProblems = 0;

  if (activeSelectedTypes.length > 0) {
    // 각 조합마다 최소 1문항 배정 (최대값이 0인 경우 제외)
    minPossibleProblems = activeSelectedTypes.reduce((sum, t) => sum + (t[countKey][t.difficulty] > 0 ? 1 : 0), 0);
    maxPossibleProblems = activeSelectedTypes.reduce((sum, t) => sum + t[countKey][t.difficulty], 0);
  }

  // 중요 문제 부족 상태 (ON + 전혀 없음)
  const isImportantInsufficient = onlyImportant && maxPossibleProblems === 0 && selectedTypes.length > 0;

  // 선택된 조합 전체에 중요 문제가 하나도 없는지 (체크박스 비활성 여부 판단)
  const hasNoImportantProblems = selectedTypes.length > 0 &&
    selectedTypes.reduce((sum, t) => sum + t.importantCount[t.difficulty], 0) === 0;

  // 2. 입력 활성화 여부
  const isSettingEnabled = !readonly && !isImportantInsufficient && activeSelectedTypes.length > 0;
  const [isDetailExpanded, setIsDetailExpanded] = React.useState(true);

  // 학습과정 변경 시 펼침 상태로 초기화
  const currentCourse = selectedTypes[0]?.course;
  React.useEffect(() => {
    setIsDetailExpanded(true);
  }, [currentCourse]);

  const [quickTotalCount, setQuickTotalCount] = React.useState<number>(0);
  React.useEffect(() => {
    const total = activeSelectedTypes.reduce((s, t) => s + t.problemCount, 0);
    setQuickTotalCount(total);
  }, [selectedTypes, onlyImportant, onlyImportantType]);

  const handleQuickTotalApply = (count: number) => {
    const validCount = Math.min(Math.max(minPossibleProblems, count), maxPossibleProblems);
    setQuickTotalCount(validCount);
    if (validCount >= minPossibleProblems) {
      onQuickSetAll(validCount);
    }
    setCountTooltipOpen(false);
  };

  const totalProblems = activeSelectedTypes.reduce((s, t) => s + t.problemCount, 0);
  const assignedStudents: StudentAssignment[] = task?.assignedStudents ?? [];
  const completed = assignedStudents.filter(s => s.status === "submitted");
  const avg = calcAvgScore(assignedStudents);

  const status = task?.status;
  const showAssign = !!task;
  const showResult = status === "published" || status === "ended";

  return (
    <>
      {/* 과제 설정 카드 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* 과제명 */}
      <div className="pb-5 border-b border-slate-100">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-sm font-bold text-foreground">과제명</span>
          <span className="text-xs text-muted-foreground font-normal">선택 단원 기준으로 과제명이 자동 생성됩니다.</span>
        </div>
        <Input
          value={name}
          onChange={e => onNameChange(e.target.value)}
          disabled={readonly}
          placeholder="과제명을 입력하세요"
          maxLength={50}
          className="h-10 text-sm font-bold"
        />
      </div>

      {/* 문제 수 설정 영역 */}
      <div className="pb-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-foreground">문제 수 설정</p>
            <TooltipProvider delayDuration={0}>
              <Tooltip open={countTooltipOpen} onOpenChange={setCountTooltipOpen}>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-[320px] p-3 space-y-2 bg-white border-border shadow-lg z-[60] text-xs text-muted-foreground leading-relaxed">
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground/90">선택한 출제 유형마다 지정한 문항 수만큼 문제가 출제됩니다.</p>
                    <p>예: 선택 유형 10개에서 [2문항씩]을 선택하면 총 20문항이 출제됩니다.</p>
                    <p className="pt-1.5 border-t border-slate-100 font-medium text-blue-600">
                      • 출제 유형은 최대 100개까지 선택할 수 있습니다.<br />
                      • 총 문제 수는 최대 300문항까지 설정할 수 있습니다.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* 중요 유형만 출제 + 중요 문제만 출제 Checkbox 묶음 */}
          {selectedTypes.length > 0 && (
            <div className="flex items-center gap-3">
              {/* 중요 유형만 출제 */}
              <div className="flex items-center gap-1.5 px-1">
                <input
                  id="onlyImportantType"
                  type="checkbox"
                  checked={onlyImportantType}
                  disabled={readonly}
                  onChange={e => onOnlyImportantTypeChange(e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary rounded border-gray-300 cursor-pointer disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="onlyImportantType"
                  className={`text-[11px] font-bold cursor-pointer whitespace-nowrap ${
                    onlyImportantType ? "text-amber-600" : "text-muted-foreground hover:text-foreground"
                  } transition-colors`}
                >
                  중요 유형만 출제
                </label>
              </div>

              {/* 중요 문제만 출제 */}
              <div className="flex items-center gap-1.5 px-1">
                <input
                  id="onlyImportant"
                  type="checkbox"
                  checked={onlyImportant}
                  disabled={readonly || hasNoImportantProblems}
                  onChange={e => onOnlyImportantChange(e.target.checked)}
                  className="h-3.5 w-3.5 accent-primary rounded border-gray-300 cursor-pointer disabled:cursor-not-allowed"
                />
                <label 
                  htmlFor="onlyImportant" 
                  className={`text-[11px] font-bold cursor-pointer whitespace-nowrap ${
                    onlyImportant ? "text-blue-600" : "text-muted-foreground hover:text-foreground"
                  } transition-colors`}
                >
                  중요 문제만 출제
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 문항 수 선택 버튼 */}
        {(() => {
          const comboCount = activeSelectedTypes.length;
          const currentMultiplier = activeSelectedTypes[0]?.problemCount ?? 1;

          // 중요 문제만 출제 ON 시: 중요 문제가 있는 조합만 합산
          const displayTotal = onlyImportant
            ? activeSelectedTypes.reduce((s, t) => {
                const importantMax = t.importantCount[t.difficulty];
                return s + (importantMax > 0 ? Math.min(t.problemCount, importantMax) : 0);
              }, 0)
            : comboCount * (comboCount > 0 ? currentMultiplier : 0);

          return (
            <div className="space-y-4">
              <div className="flex gap-2.5">
                {([1, 2, 3] as const).map(m => {
                  const isActive = currentMultiplier === m;
                  const isOverLimit = comboCount * m > 300;
                  
                  return (
                    <Button
                      key={m}
                      variant={isActive ? "default" : "outline"}
                      className={`flex-1 h-10 text-xs font-black transition-all ${
                        isActive
                          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white shadow-sm"
                          : "text-slate-600 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                      }`}
                      disabled={readonly || comboCount === 0 || isOverLimit || isImportantInsufficient || (onlyImportant && m !== 1)}
                      onClick={() => onQuickSetAll(m)}
                    >
                      {m}문항씩 {isOverLimit && "(초과)"}
                    </Button>
                  );
                })}
              </div>

              {/* 계산식 표시 영역 */}
              {onlyImportant ? (
                <div className="py-2.5 px-3 bg-blue-50/30 border border-blue-100 rounded-xl text-center text-xs font-bold text-slate-700">
                  중요 문제 기준 출제 = 총 <span className="text-indigo-600 font-black text-[13px]">{displayTotal}</span>문항
                </div>
              ) : (
                <div className="py-2.5 px-3 bg-blue-50/30 border border-blue-100 rounded-xl text-center text-xs font-bold text-slate-700">
                  선택 유형 <span className="text-blue-600 font-extrabold">{comboCount}</span>개 × <span className="text-blue-600 font-extrabold">{comboCount > 0 ? currentMultiplier : 1}문항씩</span> = 총 <span className="text-indigo-600 font-black text-[13px]">{displayTotal}</span>문항
                </div>
              )}

              {hasNoImportantProblems && !onlyImportant && (
                <p className="text-[11px] text-muted-foreground px-1">선택한 유형·난이도에 중요 문제가 없습니다.</p>
              )}

              {isImportantInsufficient && (
                <p className="text-[11px] text-amber-600 font-bold px-1 animate-pulse">⚠️ 선택한 유형·난이도에 중요 문제가 없습니다.</p>
              )}
            </div>
          );
        })()}
      </div>

      {/* 문제 구성 방식 */}
      <div className="pb-2">
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <p className="text-sm font-bold text-foreground">문제 구성 방식</p>
            <TooltipProvider delayDuration={0}>
              <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors p-0.5">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-[300px] p-3 space-y-2.5 bg-white border-border shadow-lg z-[60]">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-blue-600">동일 문제 출제</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">모든 학생에게 같은 문제가 출제됩니다.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-blue-600">학생별 문제 출제</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      학생별 풀이 이력을 기준으로 미풀이 문제가 우선 구성됩니다.<br/>
                      후보 문제가 적은 경우 학생 간 동일 문제가 포함될 수 있습니다.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2">
            {(["same", "individual"] as const).map(m => (
              <Button
                key={m}
                variant={problemMode === m ? "default" : "outline"}
                className={`flex-1 h-10 text-xs font-black transition-all ${
                  problemMode === m
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white shadow-sm"
                    : "text-slate-600 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                }`}
                disabled={readonly}
                onClick={() => {
                  onProblemModeChange(m);
                  setTooltipOpen(false);
                }}
              >
                {m === "same" ? "동일 문제 출제" : "학생별 문제 출제"}
              </Button>
            ))}
          </div>
          <div className="space-y-1 mt-2 px-1">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              • {problemMode === "same" ? "모든 학생이 같은 문제를 풉니다." : "학생별 풀이 이력을 기준으로 문제가 구성됩니다."}
            </p>
            {problemMode === "individual" && (
              <p className="text-[11px] text-muted-foreground">• 학생 간 동일 문제가 포함될 수 있습니다.</p>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* 배정 관리 카드 */}
      {showAssign && (
        <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 bg-gradient-to-br from-blue-50/40 to-indigo-50/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-bold text-blue-800">배정 관리</p>
              <TooltipProvider delayDuration={0}>
                <Tooltip open={assignHelpOpen} onOpenChange={setAssignHelpOpen}>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-blue-400 hover:text-blue-600 transition-colors p-0.5">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="bg-white border-blue-100 shadow-md p-2.5 z-[60]">
                    <p className="text-[11px] text-blue-600 font-medium">과제 진행 상태가 학생들에게 실시간으로 반영됩니다.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {/* 배정 관리 버튼: 작성중, 게시됨만 (종료 제외) */}
            {status !== "ended" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs border-blue-200 text-blue-700 bg-white hover:bg-blue-50 transition-colors shadow-sm font-bold"
                onClick={() => {
                  setAssignOpen(true);
                  setAssignHelpOpen(false);
                }}
              >
                배정 관리
              </Button>
            )}
          </div>

          {assignedStudents.length === 0 ? (
            <p className="text-sm text-blue-400 font-medium italic py-1 px-0.5">배정된 학생이 없습니다.</p>
          ) : (
            <div className="px-0.5">
              <div className="flex items-center gap-2.5">
                {(() => {
                  const classes = task?.assignedClasses ?? [];
                  if (classes.length > 0) {
                    const mappedFirst = getMappedClassName(classes[0]);
                    const displayClassName = classes.length === 1 ? mappedFirst : `${mappedFirst} 외 ${classes.length - 1}개`;
                    return (
                      <span className="text-xl font-black text-blue-700 leading-none tracking-tight">
                        {mounted ? displayClassName : classes[0]}
                      </span>
                    );
                  }
                  return (
                    <span className="text-xl font-black text-blue-700 leading-none tracking-tight">
                      {mounted ? assignedStudents.length : ""}<span className="text-sm font-bold ml-0.5">{mounted ? "명" : ""}</span>
                    </span>
                  );
                })()}
                <Badge variant="outline" className="bg-blue-600 text-white border-transparent px-2.5 py-0.5 text-[10px] font-bold shadow-sm shrink-0">
                  완료 {completed.length}명
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 결과 현황 카드 */}
      {showResult && (
        <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-5 bg-gradient-to-br from-purple-50/40 to-fuchsia-50/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-bold text-purple-800">결과 현황</p>
              <TooltipProvider delayDuration={0}>
                <Tooltip open={resultHelpOpen} onOpenChange={setResultHelpOpen}>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-purple-400 hover:text-purple-600 transition-colors p-0.5">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="bg-white border-purple-100 shadow-md p-2.5 z-[60]">
                    <p className="text-[11px] text-purple-600 font-medium">평균 점수는 제출완료 학생 기준으로 계산됩니다.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs border-purple-200 text-purple-700 bg-white hover:bg-purple-50 transition-colors shadow-sm font-bold"
              onClick={() => {
                setResultOpen(true);
                setResultHelpOpen(false);
              }}
            >
              결과 현황
            </Button>
          </div>

          {completed.length === 0 ? (
            <p className="text-sm text-purple-400 font-medium italic py-1 px-0.5">결과가 생성된 학생이 없습니다.</p>
          ) : (
            <div className="px-0.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-black text-purple-700 leading-none tracking-tight">
                  완료 {completed.length}<span className="text-sm font-bold ml-0.5">명</span>
                </span>
                <Badge variant="outline" className="bg-purple-600 text-white border-transparent px-2.5 py-0.5 text-[10px] font-bold shadow-sm shrink-0">
                  평균 {Math.round(completed.reduce((sum, s) => sum + (s.score || 0), 0) / completed.length)}점
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 배정 모달 */}
      {task && taskId && (
        <AssignModal
          open={assignOpen}
          onOpenChange={setAssignOpen}
          task={task}
          onAssign={(classes, studentIds) => {
            assignStudents(taskId, classes, studentIds);
            toast({ title: "배정되었습니다." });
          }}
        />
      )}

      {/* 결과 모달 */}
      {task && (
        <ResultModal
          open={resultOpen}
          onOpenChange={setResultOpen}
          task={task}
        />
      )}
    </>
  );
}
