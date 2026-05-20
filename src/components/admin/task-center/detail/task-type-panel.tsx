"use client";
import * as React from "react";
import {
  Curriculum, CurriculumType, SelectedType, Difficulty,
  getCoursesBySubject, getCurriculumBySubjectAndCourse, getMaxCount,
  Subject, makeComboKey, getDifficultyLabel,
} from "@/lib/task-center-mock";
import { CurriculumTree } from "../curriculum-tree";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, X, Eye, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  subject: Subject;
  selectedTypes: SelectedType[];
  onlyImportant: boolean;
  readonly?: boolean;
  onTypesChange: (types: SelectedType[]) => void;
}

export function TaskTypePanel({ subject, selectedTypes, onlyImportant, readonly, onTypesChange }: Props) {
  const { toast } = useToast();
  const courses = React.useMemo(() => {
    const raw = getCoursesBySubject(subject);
    const levelOrder: Record<string, number> = { "초": 1, "중": 2, "고": 3 };
    return raw.sort((a, b) => {
      const levelA = levelOrder[a.charAt(0)] || 99;
      const levelB = levelOrder[b.charAt(0)] || 99;
      if (levelA !== levelB) return levelA - levelB;
      return a.localeCompare(b);
    });
  }, [subject]);
  const [course, setCourse] = React.useState<string>(() => {
    if (selectedTypes.length > 0 && selectedTypes[0].course) {
      return selectedTypes[0].course;
    }
    return courses[0] ?? "";
  });
  const [isTypesExpanded, setIsTypesExpanded] = React.useState(true);

  // 학습과정 변경 시 펼침 상태로 초기화
  React.useEffect(() => {
    setIsTypesExpanded(true);
  }, [course]);

  React.useEffect(() => {
    if (selectedTypes.length > 0 && selectedTypes[0].course && !course) {
      setCourse(selectedTypes[0].course);
    }
  }, [selectedTypes]);

  // Handle async loading where selectedTypes might be populated after initial render
  React.useEffect(() => {
    if (selectedTypes.length > 0 && selectedTypes[0].course) {
      setCourse(prev => {
        // If it's still the default course and we have a selected type from a different course,
        // or if we just want to ensure it lands on the right tab initially
        return selectedTypes[0].course;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes.length > 0 ? selectedTypes[0].course : ""]);

  const curriculum: Curriculum | undefined = getCurriculumBySubjectAndCourse(subject, course);

  const [searchInput, setSearchInput] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredCurriculum: Curriculum | undefined = React.useMemo(() => {
    if (!curriculum) return undefined;
    if (!searchQuery.trim()) return curriculum;
    const q = searchQuery.trim().toLowerCase();
    return {
      ...curriculum,
      types: curriculum.types.filter(t =>
        t.typeName.toLowerCase().includes(q) ||
        t.majorUnit.toLowerCase().includes(q) ||
        t.minorUnit.toLowerCase().includes(q)
      ),
    };
  }, [curriculum, searchQuery]);

  const selectedCombos = selectedTypes.map(t => makeComboKey(t.typeId, t.difficulty));

  const handleToggleCombo = (typeId: string, difficulty: Difficulty, type: CurriculumType) => {
    if (readonly) return;
    const key = makeComboKey(typeId, difficulty);
    const exists = selectedTypes.find(t => t.typeId === typeId && t.difficulty === difficulty);

    if (exists) {
      onTypesChange(selectedTypes.filter(t => !(t.typeId === typeId && t.difficulty === difficulty)));
    } else {
      const newEntry: SelectedType = {
        curriculumId: curriculum!.id,
        course,
        typeId,
        majorUnit: type.majorUnit,
        minorUnit: type.minorUnit,
        typeName: type.typeName,
        difficulty,
        problemCount: 1,
        maxCount: type.difficultyCount,
        importantCount: type.importantCount,
      };
      onTypesChange([...selectedTypes, newEntry]);
    }
  };

  const handleToggleTypeAllDiffs = (type: CurriculumType) => {
    if (readonly) return;
    const availableDiffs = (["basic", "intermediate", "advanced"] as Difficulty[]).filter(d => type.difficultyCount[d] > 0);
    const allSelected = availableDiffs.every(d => selectedCombos.includes(makeComboKey(type.id, d)));

    if (allSelected) {
      onTypesChange(selectedTypes.filter(t => t.typeId !== type.id));
    } else {
      const currentTypeCombos = selectedTypes.filter(t => t.typeId === type.id);
      const toAddDiffs = availableDiffs.filter(d => !currentTypeCombos.some(t => t.difficulty === d));
      const newEntries: SelectedType[] = toAddDiffs.map(d => ({
        curriculumId: curriculum!.id,
        course,
        typeId: type.id,
        majorUnit: type.majorUnit,
        minorUnit: type.minorUnit,
        typeName: type.typeName,
        difficulty: d,
        problemCount: 1,
        maxCount: type.difficultyCount,
        importantCount: type.importantCount,
      }));
      onTypesChange([...selectedTypes, ...newEntries]);
    }
  };

  const handleToggleMinorAllDiffs = (minorUnit: string, types: CurriculumType[]) => {
    if (readonly) return;
    
    const allAvailableCombos: { typeId: string; diff: Difficulty; type: CurriculumType }[] = [];
    types.forEach(t => {
      (["basic", "intermediate", "advanced"] as Difficulty[]).forEach(d => {
        if (t.difficultyCount[d] > 0) {
          allAvailableCombos.push({ typeId: t.id, diff: d, type: t });
        }
      });
    });

    const allSelected = allAvailableCombos.every(c => selectedCombos.includes(makeComboKey(c.typeId, c.diff)));

    if (allSelected) {
      const typeIds = types.map(t => t.id);
      onTypesChange(selectedTypes.filter(t => !typeIds.includes(t.typeId)));
    } else {
      const newEntries: SelectedType[] = [];
      allAvailableCombos.forEach(c => {
        if (!selectedCombos.includes(makeComboKey(c.typeId, c.diff))) {
          newEntries.push({
            curriculumId: curriculum!.id,
            course,
            typeId: c.typeId,
            majorUnit: c.type.majorUnit,
            minorUnit: c.type.minorUnit,
            typeName: c.type.typeName,
            difficulty: c.diff,
            problemCount: 1,
            maxCount: c.type.difficultyCount,
            importantCount: c.type.importantCount,
          });
        }
      });
      onTypesChange([...selectedTypes, ...newEntries]);
    }
  };

  const handleToggleMajorAllDiffs = (majorUnit: string, types: CurriculumType[]) => {
    handleToggleMinorAllDiffs(majorUnit, types);
  };

  const handleRemoveCombo = (typeId: string, difficulty: Difficulty) => {
    if (readonly) return;
    onTypesChange(selectedTypes.filter(t => !(t.typeId === typeId && t.difficulty === difficulty)));
  };

  const handlePreview = () => {
    toast({ description: "준비중입니다!" });
  };

  const handleClearAll = () => {
    if (readonly) return;
    onTypesChange([]);
  };

  const handleSearch = () => {
    if (searchInput.replace(/\s/g, '').length < 2) return;
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {courses.map(c => (
            <button
              key={c}
              disabled={readonly}
              onClick={() => setCourse(c)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all border duration-150 ${course === c ? "bg-primary/10 text-primary border-primary shadow-xs font-bold" : "border-slate-200 text-muted-foreground hover:border-slate-400 bg-white disabled:opacity-30 disabled:pointer-events-none"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 유형 검색 */}
        {!readonly && (
          <div className="flex items-center gap-2">
            <Input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="유형명 검색 (2자 이상)"
              className="h-9 flex-1"
            />
            <Button size="sm" variant="secondary" onClick={handleSearch} disabled={searchInput.replace(/\s/g, '').length < 2}>검색</Button>
            <Button size="sm" variant="outline" onClick={handleClearSearch}>초기화</Button>
          </div>
        )}

        {/* 커리큘럼 트리 */}
        <div className="">
          {filteredCurriculum ? (
            filteredCurriculum.types.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground text-sm border rounded-lg bg-muted/30">
                <p>검색 결과가 없습니다.</p>
              </div>
            ) : (
              <CurriculumTree
                curriculum={filteredCurriculum}
                selectedCombos={selectedCombos}
                searchQuery={searchQuery}
                onToggleCombo={handleToggleCombo}
                onToggleTypeAllDiffs={handleToggleTypeAllDiffs}
                onToggleMinorAllDiffs={handleToggleMinorAllDiffs}
                onToggleMajorAllDiffs={handleToggleMajorAllDiffs}
                readonly={readonly}
              />
            )
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              학습과정 데이터가 없습니다.
            </div>
          )}
        </div>

        {/* 선택 유형 목록 */}
        <div className="pt-3 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <div 
              className="flex items-center gap-1 cursor-pointer select-none group/title"
              onClick={() => setIsTypesExpanded(!isTypesExpanded)}
            >
              {isTypesExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover/title:text-primary transition-colors" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/title:text-primary transition-colors" />
              )}
              <p className="text-sm font-bold text-foreground group-hover/title:text-primary transition-colors">
                선택된 출제 항목 <span className="text-primary">{selectedTypes.length}</span>개
              </p>
            </div>
            {!readonly && selectedTypes.length > 0 && (
              <Button size="sm" variant="ghost" onClick={handleClearAll} className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5 mr-1" /> 전체 삭제
              </Button>
            )}
          </div>

          {isTypesExpanded && (
            <>
              {selectedTypes.length > 0 ? (
                <ul className="space-y-1.5 pr-2">
                  {selectedTypes.map(t => (
                    <li key={`${t.typeId}__${t.difficulty}`} className="flex items-center gap-2 text-sm bg-slate-50/50 border border-slate-200/60 rounded-xl px-3 py-2 group">
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                              <Badge variant="outline" className={`shrink-0 px-1.5 py-0 h-5 text-[10px] font-bold border-transparent ${
                                t.difficulty === "basic" ? "bg-slate-100 text-slate-600" :
                                t.difficulty === "intermediate" ? "bg-indigo-50 text-indigo-600" :
                                "bg-purple-50 text-purple-600"
                              }`}>
                                {getDifficultyLabel(t.difficulty)}
                              </Badge>
                              <span className="truncate text-[13px] text-foreground">
                                <span className="text-muted-foreground mr-1.5">{t.majorUnit} &gt; {t.minorUnit} &gt;</span>
                                <span className="font-medium">{t.typeName}</span>
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" align="start" className="bg-white border-border shadow-md">
                            <p className="text-xs font-medium">{t.majorUnit} &gt; {t.minorUnit} &gt; {t.typeName} · {getDifficultyLabel(t.difficulty)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-xs font-bold text-muted-foreground mr-1">{t.problemCount}문항</span>
                        <Button size="sm" variant="outline" onClick={handlePreview} className="h-7 px-2.5 text-xs bg-white text-muted-foreground hover:text-foreground shadow-sm">
                          <Eye className="h-3.5 w-3.5 mr-1" /> 미리보기
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleRemoveCombo(t.typeId, t.difficulty)} disabled={readonly} className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-4 text-center text-xs font-medium text-slate-400 bg-slate-50/30 rounded-xl border border-dashed border-slate-200/80">
                  선택된 유형이 없습니다.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
