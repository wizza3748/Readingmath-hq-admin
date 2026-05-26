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

interface Props {
  task?: TaskItem;
  taskId?: string;
  name: string;
  selectedTypes: SelectedType[];
  problemMode: "same" | "individual";
  prioritizeUnsolved: boolean;
  onlyImportant: boolean;
  readonly?: boolean;
  onNameChange: (v: string) => void;
  onTypeProblemCountChange: (typeId: string, difficulty: Difficulty, count: number) => void;
  onProblemModeChange: (v: "same" | "individual") => void;
  onOnlyImportantChange: (v: boolean) => void;
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
  onlyImportant, readonly,
  onNameChange, onTypeProblemCountChange,
  onProblemModeChange,
  onOnlyImportantChange, onQuickSetAll,
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

  // 1. 문제 수 범위 계산 (선택된 조합 기준)
  let minPossibleProblems = 0;
  let maxPossibleProblems = 0;

  if (selectedTypes.length > 0) {
    // 각 조합마다 최소 1문항 배정 (최대값이 0인 경우 제외)
    minPossibleProblems = selectedTypes.reduce((sum, t) => sum + (t[countKey][t.difficulty] > 0 ? 1 : 0), 0);
    maxPossibleProblems = selectedTypes.reduce((sum, t) => sum + t[countKey][t.difficulty], 0);
  }

  // 중요 문제 부족 상태
  const isImportantInsufficient = onlyImportant && maxPossibleProblems === 0 && selectedTypes.length > 0;

  // 2. 입력 활성화 여부
  const isSettingEnabled = !readonly && !isImportantInsufficient && selectedTypes.length > 0;
  const [isDetailExpanded, setIsDetailExpanded] = React.useState(true);

  // 학습과정 변경 시 펼침 상태로 초기화
  const currentCourse = selectedTypes[0]?.course;
  React.useEffect(() => {
    setIsDetailExpanded(true);
  }, [currentCourse]);

  const [quickTotalCount, setQuickTotalCount] = React.useState<number>(0);
  React.useEffect(() => {
    const total = selectedTypes.reduce((s, t) => s + t.problemCount, 0);
    setQuickTotalCount(total);
  }, [selectedTypes, onlyImportant]);

  const handleQuickTotalApply = (count: number) => {
    const validCount = Math.min(Math.max(minPossibleProblems, count), maxPossibleProblems);
    setQuickTotalCount(validCount);
    if (validCount >= minPossibleProblems) {
      onQuickSetAll(validCount);
    }
    setCountTooltipOpen(false);
  };

  const totalProblems = selectedTypes.reduce((s, t) => s + t.problemCount, 0);
  const assignedStudents: StudentAssignment[] = task?.assignedStudents ?? [];
  const completed = assignedStudents.filter(s => s.status === "submitted");
  const avg = calcAvgScore(assignedStudents);

  const status = task?.status;
  const showAssign = !!task;
  const showResult = status === "published" || status === "ended";

  const unitPaths = React.useMemo(() => {
    const paths = selectedTypes.map(t => `${t.majorUnit} > ${t.minorUnit}`);
    return Array.from(new Set(paths));
  }, [selectedTypes]);

  return (
    <>
      {/* 과제 설정 카드 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* 과제명 */}
      <div className="pb-5 border-b border-slate-100">
        <p className="text-sm font-bold text-foreground mb-2">과제명</p>
        <Input
          value={name}
          onChange={e => onNameChange(e.target.value)}
          disabled={readonly}
          placeholder="과제명을 입력하세요"
          maxLength={50}
          className="h-10 text-sm font-bold"
        />
        {unitPaths.length > 0 && (
          <div className="mt-3.5 px-0.5 flex items-baseline gap-2 overflow-hidden">
            <span className="text-[11px] font-bold text-foreground/70 shrink-0">출제 단원:</span>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-[11px] text-muted-foreground truncate cursor-default">
                    {unitPaths[0]}{unitPaths.length > 1 ? ` 외 ${unitPaths.length - 1}건` : ""}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="bg-white border-border shadow-lg p-3 z-[60]">
                  <div className="text-xs space-y-2">
                    <p className="font-bold text-foreground border-b pb-1.5 mb-1.5">출제 단원 목록</p>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-2">
                      {unitPaths.map((path, idx) => (
                        <p key={idx} className="text-muted-foreground">• {path}</p>
                      ))}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* 문제 수 설정 영역 (X1 / X2 / X3 방식) */}
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
                <TooltipContent side="top" align="start" className="max-w-[320px] p-3 space-y-2 bg-white border-border shadow-lg z-[60]">
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1.5 leading-relaxed">
                    <li className="marker:text-blue-500 font-medium text-foreground/80">선택된 유형·난이도 조합마다 지정된 배수(X1, X2, X3)만큼 문제가 출제됩니다.</li>
                    <li className="marker:text-blue-500">난이도 선택과 무관하게 언제든 자유롭게 X1 / X2 / X3를 지정할 수 있습니다.</li>
                    <li className="marker:text-blue-500">선택 가능한 최대 조합 수는 100개이며, 총 출제 문제 수는 최대 300문항으로 제한됩니다.</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* 중요 문제만 출제 Checkbox */}
          {selectedTypes.length > 0 && (
            <div className="flex items-center gap-1.5 px-1">
              <input
                id="onlyImportant"
                type="checkbox"
                checked={onlyImportant}
                disabled={readonly || (selectedTypes.reduce((sum, t) => sum + t.importantCount[t.difficulty], 0) === 0)}
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
          )}
        </div>

        {/* X1 / X2 / X3 배수 선택 버튼 */}
        {(() => {
          const comboCount = selectedTypes.length;
          const currentMultiplier = selectedTypes[0]?.problemCount ?? 1;

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
                          ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm"
                          : "text-slate-600 bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/50"
                      }`}
                      disabled={readonly || comboCount === 0 || isOverLimit}
                      onClick={() => onQuickSetAll(m)}
                    >
                      X{m} {isOverLimit && "(초과)"}
                    </Button>
                  );
                })}
              </div>

              {/* 계산식 표시 영역 */}
              <div className="py-2.5 px-3 bg-blue-50/30 border border-blue-100 rounded-xl text-center text-xs font-bold text-slate-700">
                선택 항목 <span className="text-blue-600 font-extrabold">{comboCount}</span>개 × <span className="text-blue-600 font-extrabold">X{comboCount > 0 ? currentMultiplier : 1}</span> = 총 <span className="text-indigo-600 font-black text-[13px]">{comboCount * (comboCount > 0 ? currentMultiplier : 0)}</span>문항
              </div>

              {/* 출제 요약 정보 보드 */}
              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60 grid grid-cols-3 gap-2 text-center shadow-2xs">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">선택 항목</p>
                  <p className="text-sm font-black text-slate-800">{comboCount}개</p>
                </div>
                <div className="border-l border-slate-200">
                  <p className="text-[10px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">출제 배수</p>
                  <p className="text-sm font-black text-blue-600">X{comboCount > 0 ? currentMultiplier : 0}</p>
                </div>
                <div className="border-l border-slate-200">
                  <p className="text-[10px] font-extrabold text-slate-400 mb-1 uppercase tracking-wider">총 문제 수</p>
                  <p className="text-sm font-black text-indigo-600">{comboCount * (comboCount > 0 ? currentMultiplier : 0)}문항</p>
                </div>
              </div>

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
                className={`flex-1 h-9 ${problemMode === m ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" : "text-muted-foreground"}`}
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
            <div className="space-y-2.5 px-0.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-black text-blue-700">{assignedStudents.length}<span className="text-sm font-bold ml-0.5">명</span></span>
                <Badge variant="outline" className="bg-blue-600 text-white border-transparent px-2.5 py-0.5 text-[10px] font-bold shadow-sm">
                  완료 {completed.length}명
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-blue-500 font-medium">
                {assignedStudents.filter(s => (task?.assignedClasses ?? []).includes(s.classGroup)).length > 0 && (
                  <span>반 배정 <span className="font-bold text-blue-700">{assignedStudents.filter(s => (task?.assignedClasses ?? []).includes(s.classGroup)).length}</span>명</span>
                )}
                {assignedStudents.filter(s => (task?.assignedClasses ?? []).includes(s.classGroup)).length > 0 && (task?.individualStudentIds ?? []).length > 0 && (
                  <span className="mx-0.5 text-blue-200 font-bold">·</span>
                )}
                {(task?.individualStudentIds ?? []).length > 0 && (
                  <span>개별 배정 <span className="font-bold text-blue-700">{(task?.individualStudentIds ?? []).length}</span>명</span>
                )}
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
            <div className="space-y-1.5 py-1 px-0.5">
              <p className="text-sm text-purple-400 font-medium italic">결과가 생성된 학생이 없습니다.</p>
              <p className="text-xs font-bold text-purple-500 opacity-60">평균 -</p>
            </div>
          ) : (
            <div className="space-y-2.5 px-0.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-black text-purple-700">완료 {completed.length}<span className="text-sm font-bold ml-0.5">명</span></span>
                <Badge variant="outline" className="bg-purple-600 text-white border-transparent px-2.5 py-0.5 text-[10px] font-bold shadow-sm">
                  평균 {Math.round(completed.reduce((sum, s) => sum + (s.score || 0), 0) / completed.length)}점
                </Badge>
              </div>

              {(() => {
                const classAverages = (task?.assignedClasses ?? [])
                  .map(cls => {
                    const classCompleted = completed.filter(s => s.classGroup === cls);
                    if (classCompleted.length === 0) return null;
                    const avgScore = Math.round(classCompleted.reduce((sum, s) => sum + (s.score || 0), 0) / classCompleted.length);
                    return { name: cls, avg: avgScore };
                  })
                  .filter(Boolean) as { name: string; avg: number }[];

                if (classAverages.length === 0) return null;

                return (
                  <div className="flex items-center gap-1.5 text-[11px] text-purple-500 font-medium">
                    {classAverages.length <= 2 ? (
                      classAverages.map((ca, idx) => (
                        <React.Fragment key={ca.name}>
                          <span>{ca.name} 평균 <span className="font-bold text-purple-700">{ca.avg}</span>점</span>
                          {idx === 0 && classAverages.length === 2 && <span className="mx-0.5 text-purple-200 font-bold">·</span>}
                        </React.Fragment>
                      ))
                    ) : (
                      <span>{classAverages[0].name} 평균 <span className="font-bold text-purple-700">{classAverages[0].avg}</span>점 외 {classAverages.length - 1}개</span>
                    )}
                  </div>
                );
              })()}
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
