"use client";
import * as React from "react";
import { Curriculum, CurriculumType, Difficulty, getDifficultyLabel, makeComboKey } from "@/lib/task-center-mock";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DIFFICULTY_LIST: Difficulty[] = ["basic", "intermediate", "advanced"];

interface Props {
  curriculum: Curriculum;
  selectedCombos: string[]; // `${typeId}__${difficulty}` 형태의 선택 조합 키 배열
  searchQuery?: string;
  onToggleCombo: (typeId: string, difficulty: Difficulty, type: CurriculumType) => void;
  onToggleTypeAllDiffs: (type: CurriculumType) => void;
  onToggleMinorAllDiffs: (minorUnit: string, types: CurriculumType[]) => void;
  onToggleMajorAllDiffs: (majorUnit: string, types: CurriculumType[]) => void;
  readonly?: boolean;
}

function HighlightedText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="text-primary font-bold">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// 조합 기준 triState 계산
function typeComboTriState(
  type: CurriculumType,
  selectedCombos: string[]
): "all" | "partial" | "none" {
  const availableDiffs = DIFFICULTY_LIST.filter(d => type.difficultyCount[d] > 0);
  if (availableDiffs.length === 0) return "none";
  const selectedCount = availableDiffs.filter(d =>
    selectedCombos.includes(makeComboKey(type.id, d))
  ).length;
  if (selectedCount === 0) return "none";
  if (selectedCount === availableDiffs.length) return "all";
  return "partial";
}

function minorComboTriState(
  types: CurriculumType[],
  selectedCombos: string[]
): "all" | "partial" | "none" {
  let total = 0;
  let selected = 0;
  for (const t of types) {
    const avail = DIFFICULTY_LIST.filter(d => t.difficultyCount[d] > 0);
    total += avail.length;
    selected += avail.filter(d => selectedCombos.includes(makeComboKey(t.id, d))).length;
  }
  if (total === 0 || selected === 0) return "none";
  if (selected === total) return "all";
  return "partial";
}

function majorComboTriState(
  minorMap: Map<string, CurriculumType[]>,
  selectedCombos: string[]
): "all" | "partial" | "none" {
  const allTypes = Array.from(minorMap.values()).flat();
  return minorComboTriState(allTypes, selectedCombos);
}

export function CurriculumTree({
  curriculum, selectedCombos, searchQuery,
  onToggleCombo, onToggleTypeAllDiffs, onToggleMinorAllDiffs, onToggleMajorAllDiffs,
  readonly
}: Props) {
  // 대단원 그룹핑
  const majorGroups = React.useMemo(() => {
    const map = new Map<string, Map<string, CurriculumType[]>>();
    for (const t of curriculum.types) {
      if (!map.has(t.majorUnit)) map.set(t.majorUnit, new Map());
      const minorMap = map.get(t.majorUnit)!;
      if (!minorMap.has(t.minorUnit)) minorMap.set(t.minorUnit, []);
      minorMap.get(t.minorUnit)!.push(t);
    }
    return map;
  }, [curriculum]);

  const [openMajors, setOpenMajors] = React.useState<Set<string>>(new Set());
  const [openMinors, setOpenMinors] = React.useState<Set<string>>(new Set());

  const prevMajorGroups = React.useRef(majorGroups);
  const initializedRef = React.useRef(false);

  React.useEffect(() => {
    if (prevMajorGroups.current !== majorGroups) {
      initializedRef.current = false;
      prevMajorGroups.current = majorGroups;
    }

    const isSearching = !!(searchQuery && searchQuery.trim());
    if (initializedRef.current && !isSearching) return;

    const q = searchQuery?.toLowerCase() || "";
    const initialOpenMajors = new Set<string>();
    const initialOpenMinors = new Set<string>();

    majorGroups.forEach((minorMap, major) => {
      let majorHasMatch = false;
      
      minorMap.forEach((types, minor) => {
        // 선택된 항목이 있는지 확인
        const hasSelectedType = types.some(t =>
          DIFFICULTY_LIST.some(d => selectedCombos.includes(makeComboKey(t.id, d)))
        );
        
        // 검색어와 매칭되는지 확인
        const minorHasSearchMatch = isSearching && (
          major.toLowerCase().includes(q) ||
          minor.toLowerCase().includes(q) ||
          types.some(t => t.typeName.toLowerCase().includes(q))
        );

        if (hasSelectedType || minorHasSearchMatch) {
          initialOpenMinors.add(minor);
          majorHasMatch = true;
        }
      });

      if (majorHasMatch) {
        initialOpenMajors.add(major);
      }
    });

    if (isSearching) {
      setOpenMajors(prev => new Set([...prev, ...initialOpenMajors]));
      setOpenMinors(prev => new Set([...prev, ...initialOpenMinors]));
    } else {
      setOpenMajors(initialOpenMajors);
      setOpenMinors(initialOpenMinors);
      initializedRef.current = true;
    }
  }, [majorGroups, searchQuery, selectedCombos]);

  const toggleMajor = (major: string) => setOpenMajors(prev => {
    const s = new Set(prev); s.has(major) ? s.delete(major) : s.add(major); return s;
  });
  const toggleMinor = (minor: string) => setOpenMinors(prev => {
    const s = new Set(prev); s.has(minor) ? s.delete(minor) : s.add(minor); return s;
  });

  return (
    <div className="space-y-1 text-sm">
      {Array.from(majorGroups.entries()).map(([major, minorMap]) => {
        const majorState = majorComboTriState(minorMap, selectedCombos);
        const isOpenMajor = openMajors.has(major);

        return (
          <div key={major}>
            {/* 대단원 */}
            <div className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-slate-50/80 transition-colors duration-150 group">
              <button onClick={() => toggleMajor(major)} className="text-muted-foreground hover:text-foreground">
                {isOpenMajor ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <Checkbox
                checked={majorState === "all" ? true : majorState === "partial" ? "indeterminate" : false}
                disabled={readonly}
                onCheckedChange={() => !readonly && onToggleMajorAllDiffs(major, Array.from(minorMap.values()).flat())}
              />
              <span className="font-bold text-slate-800 cursor-pointer" onClick={() => toggleMajor(major)}>
                <HighlightedText text={major} query={searchQuery} />
              </span>
              <span className="ml-auto text-xs font-semibold text-slate-400 opacity-0 group-hover:opacity-100">
                {Array.from(minorMap.values()).flat().length}유형
              </span>
            </div>

            {isOpenMajor && Array.from(minorMap.entries()).map(([minor, types]) => {
              const minorState = minorComboTriState(types, selectedCombos);
              const isOpenMinor = openMinors.has(minor);

              return (
                <div key={minor} className="ml-6">
                  {/* 소단원/중단원 */}
                  <div className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-slate-50/70 transition-colors duration-150 group">
                    <button onClick={() => toggleMinor(minor)} className="text-muted-foreground hover:text-foreground">
                      {isOpenMinor ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                    <Checkbox
                      checked={minorState === "all" ? true : minorState === "partial" ? "indeterminate" : false}
                      disabled={readonly}
                      onCheckedChange={() => !readonly && onToggleMinorAllDiffs(minor, types)}
                    />
                    <span className="font-semibold text-slate-700 cursor-pointer" onClick={() => toggleMinor(minor)}>
                      <HighlightedText text={minor} query={searchQuery} />
                    </span>
                  </div>

                  {isOpenMinor && types.map(type => {
                    const typeState = typeComboTriState(type, selectedCombos);
                    const availableDiffs = DIFFICULTY_LIST.filter(d => type.difficultyCount[d] > 0);

                    return (
                      <div key={type.id} className="ml-6">
                        {/* 유형 행 */}
                        <div
                          className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg transition-all duration-150 cursor-pointer overflow-hidden group/type border-l-2 ${
                            typeState !== "none"
                              ? "bg-indigo-50/40 hover:bg-indigo-50/60 border-indigo-500 rounded-r-lg rounded-l-none"
                              : "hover:bg-slate-50/60 border-transparent"
                          }`}
                          onClick={() => !readonly && onToggleTypeAllDiffs(type)}
                        >
                          <Checkbox
                            checked={typeState === "all" ? true : typeState === "partial" ? "indeterminate" : false}
                            disabled={readonly || availableDiffs.length === 0}
                            onCheckedChange={() => !readonly && onToggleTypeAllDiffs(type)}
                            onClick={e => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            <span
                              className={`truncate mr-2 ${typeState !== "none" ? "text-indigo-600 font-bold" : "text-slate-700"}`}
                              title={type.typeName}
                            >
                              <HighlightedText text={type.typeName} query={searchQuery} />
                            </span>

                            {/* 난이도 선택 칩 */}
                            <TooltipProvider delayDuration={200}>
                              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                {DIFFICULTY_LIST.map(d => {
                                  const count = type.difficultyCount[d];
                                  const isCountZero = count === 0;
                                  const isDisabled = readonly || isCountZero;
                                  const isSelected = selectedCombos.includes(makeComboKey(type.id, d));
                                  
                                  let chipClass = "h-7 px-2.5 rounded text-[11px] font-bold transition-all border flex items-center justify-center ";
                                  
                                  if (isCountZero) {
                                    chipClass += "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed";
                                  } else if (isSelected) {
                                    // 선택됨: 진한 배경, 흰색 텍스트
                                    if (d === "basic") {
                                      chipClass += "bg-slate-700 text-white border-slate-700 hover:bg-slate-800 shadow-xs ";
                                    } else if (d === "intermediate") {
                                      chipClass += "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-xs ";
                                    } else {
                                      chipClass += "bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-xs ";
                                    }
                                    if (readonly) chipClass += "opacity-70 cursor-not-allowed";
                                  } else {
                                    // 미선택: 흰 배경, 테두리, 난이도별 보조 색상 유지
                                    if (readonly) {
                                      chipClass += "bg-slate-50/30 text-slate-400 border-transparent cursor-not-allowed";
                                    } else {
                                      if (d === "basic") {
                                        chipClass += "bg-white text-slate-600 border-slate-300 hover:bg-slate-50/80 hover:text-slate-800 ";
                                      } else if (d === "intermediate") {
                                        chipClass += "bg-white text-blue-600 border-blue-200 hover:bg-blue-50/40 hover:text-blue-700 ";
                                      } else {
                                        chipClass += "bg-white text-purple-600 border-purple-200 hover:bg-purple-50/40 hover:text-purple-700 ";
                                      }
                                    }
                                  }

                                  const buttonContent = (
                                    <button
                                      key={d}
                                      type="button"
                                      disabled={isDisabled}
                                      onClick={() => onToggleCombo(type.id, d, type)}
                                      className={chipClass}
                                    >
                                      {getDifficultyLabel(d)} {count}
                                    </button>
                                  );

                                  return (
                                    <Tooltip key={d}>
                                      <TooltipTrigger asChild>
                                        {buttonContent}
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="bg-slate-900 border border-slate-800 text-white py-1 px-2 text-[10px] rounded shadow-md">
                                        <p>숫자는 해당 난이도에 등록된 문제 수입니다.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
