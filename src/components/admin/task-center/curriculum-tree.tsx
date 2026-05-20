"use client";
import * as React from "react";
import { Curriculum, CurriculumType, Difficulty, getDifficultyLabel, makeComboKey } from "@/lib/task-center-mock";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
                          className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-slate-50/60 transition-colors duration-150 cursor-pointer overflow-hidden group/type"
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
                              className={`truncate mr-2 ${typeState !== "none" ? "text-primary font-medium" : "text-muted-foreground"}`}
                              title={type.typeName}
                            >
                              <HighlightedText text={type.typeName} query={searchQuery} />
                            </span>

                            {/* 난이도 선택 칩 */}
                            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                              {DIFFICULTY_LIST.map(d => {
                                const count = type.difficultyCount[d];
                                const isCountZero = count === 0;
                                const isDisabled = readonly || isCountZero;
                                const isSelected = selectedCombos.includes(makeComboKey(type.id, d));
                                
                                let chipClass = "h-6 px-2 rounded text-[10px] font-bold transition-all border ";
                                if (isCountZero) {
                                  chipClass += "bg-muted/20 text-muted-foreground/30 border-transparent cursor-not-allowed";
                                } else if (isSelected) {
                                  if (d === "basic") chipClass += "bg-slate-100 text-slate-600 border-slate-300 shadow-sm ";
                                  else if (d === "intermediate") chipClass += "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm ";
                                  else chipClass += "bg-purple-50 text-purple-600 border-purple-200 shadow-sm ";
                                  if (readonly) chipClass += "opacity-70 cursor-not-allowed";
                                } else {
                                  if (readonly) {
                                    chipClass += "bg-slate-50/30 text-slate-400 border-transparent cursor-not-allowed";
                                  } else {
                                    if (d === "basic") chipClass += "bg-slate-50/50 text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-600 ";
                                    else if (d === "intermediate") chipClass += "bg-indigo-50/30 text-indigo-400 border-indigo-100 hover:border-indigo-200 hover:text-indigo-600 ";
                                    else chipClass += "bg-purple-50/30 text-purple-400 border-purple-100 hover:border-purple-200 hover:text-purple-600 ";
                                  }
                                }

                                return (
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
                              })}
                            </div>
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
