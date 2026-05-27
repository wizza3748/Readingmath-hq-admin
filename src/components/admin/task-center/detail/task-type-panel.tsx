"use client";
import * as React from "react";
import {
  Curriculum, CurriculumType, SelectedType, Difficulty,
  getCoursesBySubject, getCurriculumBySubjectAndCourse, getMaxCount,
  Subject, makeComboKey, getDifficultyLabel,
} from "@/lib/task-center-mock";
import { CurriculumTree } from "../curriculum-tree";
import { TypeProblemPreviewModal } from "./type-problem-preview-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, X, Eye, ChevronDown, ChevronRight, Check } from "lucide-react";
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
  checkedTypeIds: string[];
  bulkDifficulties: Record<Difficulty, boolean>;
  onlyImportant: boolean;
  readonly?: boolean;
  onTypesChange: (types: SelectedType[]) => void;
  onCheckedTypesChange: (ids: string[]) => void;
  onBulkDifficultiesChange: (diffs: Record<Difficulty, boolean>) => void;
}

function getUnitGroupId(type: CurriculumType, subject: Subject, course: string): string {
  // 기본 폴백 조합 키: 학습과정 + 대단원명 + 소단원명 또는 중단원명
  const fallbackKey = `${course}||${type.majorUnit}||${type.minorUnit}`;
  
  if (!type.id) return fallbackKey;
  
  if (subject === "math") {
    // 수학은 대단원 ID + 소단원 ID 단위로 그룹핑해야 하나, ID 자체에 소단원 ID가 없으므로 
    // 기준에 따라 ID가 없는 경우로 보아 fallbackKey를 그룹 키로 사용합니다.
    return fallbackKey;
  }
  
  // 과학의 경우: 대단원 ID + 중단원 ID 가 포함되어 있는지 검사
  const parts = type.id.split("-");
  if (parts.length >= 4) {
    const typeIndex = parts[parts.length - 1];
    const minorIndex = parts[parts.length - 2]; // 중단원 ID
    const majorIndex = parts[parts.length - 3]; // 대단원 ID
    
    if (!isNaN(Number(minorIndex)) && !isNaN(Number(majorIndex))) {
      return `sci_${majorIndex}__${minorIndex}`;
    }
  }
  
  return fallbackKey;
}

export function TaskTypePanel({ subject, selectedTypes, checkedTypeIds = [], bulkDifficulties, onlyImportant, readonly, onTypesChange, onCheckedTypesChange, onBulkDifficultiesChange }: Props) {
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
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [previewTypeId, setPreviewTypeId] = React.useState("");
  const [previewTypeName, setPreviewTypeName] = React.useState("");
  const [previewDifficulty, setPreviewDifficulty] = React.useState<Difficulty>("basic");
  const [previewProblemCount, setPreviewProblemCount] = React.useState<number>(3);

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

  const getDifficultyStatus = React.useCallback((d: Difficulty) => {
    if (checkedTypeIds.length === 0) return "none";
    const selectedCount = checkedTypeIds.filter(typeId =>
      selectedTypes.some(t => t.typeId === typeId && t.difficulty === d)
    ).length;

    if (selectedCount === 0) return "none";
    if (selectedCount === checkedTypeIds.length) return "all";
    return "partial";
  }, [checkedTypeIds, selectedTypes]);

  const curriculum: Curriculum | undefined = getCurriculumBySubjectAndCourse(subject, course);

  const [searchInput, setSearchInput] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredCurriculum: Curriculum | undefined = React.useMemo(() => {
    if (!curriculum) return undefined;
    const baseTypes = curriculum.types;
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? baseTypes.filter(t =>
          t.typeName.toLowerCase().includes(q) ||
          t.majorUnit.toLowerCase().includes(q) ||
          t.minorUnit.toLowerCase().includes(q)
        )
      : baseTypes;
    
    const minorTypeCounters: Record<string, number> = {};
    
    return {
      ...curriculum,
      types: filtered.map(t => {
        const minor = t.minorUnit;
        if (minorTypeCounters[minor] === undefined) {
          minorTypeCounters[minor] = 0;
        } else {
          minorTypeCounters[minor] += 1;
        }
        const idx = minorTypeCounters[minor];
        
        // 소단원 내에서 2번째(idx 1)와 6번째(idx 5) 유형만 중요 유형으로 지정
        const isImportant = idx === 1 || idx === 5;
        const fakeImportantCount = isImportant
          ? { basic: 1, intermediate: 1, advanced: 1 }
          : { basic: 0, intermediate: 0, advanced: 0 };

        return {
          ...t,
          difficultyCount: { basic: 3, intermediate: 3, advanced: 3 },
          importantCount: fakeImportantCount
        };
      })
    };
  }, [curriculum, searchQuery]);

  const selectedCombos = selectedTypes.map(t => makeComboKey(t.typeId, t.difficulty));

  // 1. 선택된 단원(groupId) 목록 추출 (checkedTypeIds 기준, 순서 보존)
  const activeMinors = React.useMemo(() => {
    if (!filteredCurriculum || !checkedTypeIds.length) return [];
    const checkedMinors = new Set<string>();
    filteredCurriculum.types.forEach(t => {
      if (checkedTypeIds.includes(t.id)) {
        checkedMinors.add(getUnitGroupId(t, subject, course));
      }
    });
    return Array.from(checkedMinors);
  }, [filteredCurriculum, checkedTypeIds, subject, course]);

  // 2. 각 groupId에 해당하는 유형 리스트 그룹화 (checkedTypeIds 기준)
  const minorGroupedTypes = React.useMemo(() => {
    const groups: Record<string, { majorUnit: string; minorUnit: string; types: CurriculumType[] }> = {};
    if (filteredCurriculum) {
      filteredCurriculum.types.forEach(t => {
        if (!checkedTypeIds.includes(t.id)) return; // 체크된 유형만 하단 현황에 포함!
        
        const groupId = getUnitGroupId(t, subject, course);
        if (!groups[groupId]) {
          groups[groupId] = { majorUnit: t.majorUnit, minorUnit: t.minorUnit, types: [] };
        }
        if (!groups[groupId].types.some(exist => exist.id === t.id)) {
          groups[groupId].types.push(t);
        }
      });
    }
    return groups;
  }, [filteredCurriculum, checkedTypeIds, subject, course]);

  const handleToggleCombo = (typeId: string, difficulty: Difficulty, type: CurriculumType) => {
    if (readonly) return;
    const exists = selectedTypes.find(t => t.typeId === typeId && t.difficulty === difficulty);

    if (exists) {
      // OFF 토글: checkedTypeIds는 해제되어도 계속 유지!
      onTypesChange(selectedTypes.filter(t => !(t.typeId === typeId && t.difficulty === difficulty)));
    } else {
      // ON 토글
      const nextMultiplier = selectedTypes[0]?.problemCount ?? 1;
      
      // 조합 100개 / 총 문제 300개 한계 사전 검증
      if (selectedTypes.length + 1 > 100) {
        toast({
          title: "출제 유형은 최대 100개까지 선택할 수 있습니다.",
          description: "유형 선택을 줄여주세요.",
          variant: "destructive"
        });
        return;
      }
      if ((selectedTypes.length + 1) * nextMultiplier > 300) {
        toast({ title: "과제 전체 문제 수 최대값은 300문항입니다.", variant: "destructive" });
        return;
      }

      // checkedTypeIds에 자동 추가 보정
      if (!checkedTypeIds.includes(typeId)) {
        onCheckedTypesChange([...checkedTypeIds, typeId]);
      }

      const newEntry: SelectedType = {
        curriculumId: curriculum!.id,
        course,
        typeId,
        majorUnit: type.majorUnit,
        minorUnit: type.minorUnit,
        typeName: type.typeName,
        difficulty,
        problemCount: nextMultiplier,
        maxCount: type.difficultyCount,
        importantCount: type.importantCount,
      };
      onTypesChange([...selectedTypes, newEntry]);
    }
  };

  const handleToggleTypeChecked = (type: CurriculumType) => {
    if (readonly) return;
    const isChecked = checkedTypeIds.includes(type.id);
    if (isChecked) {
      // OFF: checkedTypeIds에서 소거 및 해당 유형의 모든 난이도 선택값 함께 해제
      onCheckedTypesChange(checkedTypeIds.filter(id => id !== type.id));
      onTypesChange(selectedTypes.filter(t => t.typeId !== type.id));
    } else {
      // ON: checkedTypeIds에 추가하고, 현재 bulkDifficulties 중 ON인 모든 난이도를 자동 주입 (0문항 방지)
      const nextMultiplier = selectedTypes[0]?.problemCount ?? 1;
      const activeDiffs = (["basic", "intermediate", "advanced"] as Difficulty[]).filter(d => bulkDifficulties[d]);
      
      const newEntries: SelectedType[] = activeDiffs.map(d => ({
        curriculumId: curriculum!.id,
        course,
        typeId: type.id,
        majorUnit: type.majorUnit,
        minorUnit: type.minorUnit,
        typeName: type.typeName,
        difficulty: d,
        problemCount: nextMultiplier,
        maxCount: type.difficultyCount,
        importantCount: type.importantCount,
      }));

      // 가드 사전 검사
      const nextSelected = [...selectedTypes, ...newEntries];
      if (nextSelected.length > 100) {
        toast({
          title: "출제 유형은 최대 100개까지 선택할 수 있습니다.",
          description: "유형 선택을 줄여주세요.",
          variant: "destructive"
        });
        return;
      }
      if (nextSelected.length * nextMultiplier > 300) {
        toast({ title: "전체 출제 문제 수는 최대 300문항입니다. (선택 차단)", variant: "destructive" });
        return;
      }

      onCheckedTypesChange([...checkedTypeIds, type.id]);
      onTypesChange(nextSelected);
    }
  };

  const handleToggleMinorChecked = (minorUnit: string, types: CurriculumType[]) => {
    if (readonly) return;
    const typeIds = types.map(t => t.id);
    const checkedCount = types.filter(t => checkedTypeIds.includes(t.id)).length;
    const isAllChecked = checkedCount === types.length;

    if (isAllChecked) {
      // 소단원 해제: 하위 모든 유형 ID 소거 및 관련 난이도 전체 해제
      onCheckedTypesChange(checkedTypeIds.filter(id => !typeIds.includes(id)));
      onTypesChange(selectedTypes.filter(t => !typeIds.includes(t.typeId)));
    } else {
      // 소단원 선택: 미체크 유형 추가, 현재 bulkDifficulties 중 ON 상태인 난이도를 일괄 자동 부여 (0문항 방지)
      const nextMultiplier = selectedTypes[0]?.problemCount ?? 1;
      const activeDiffs = (["basic", "intermediate", "advanced"] as Difficulty[]).filter(d => bulkDifficulties[d]);
      const toAdd: SelectedType[] = [];

      types.forEach(t => {
        if (checkedTypeIds.includes(t.id)) return;
        activeDiffs.forEach(d => {
          toAdd.push({
            curriculumId: curriculum!.id,
            course,
            typeId: t.id,
            majorUnit: t.majorUnit,
            minorUnit: t.minorUnit,
            typeName: t.typeName,
            difficulty: d,
            problemCount: nextMultiplier,
            maxCount: t.difficultyCount,
            importantCount: t.importantCount,
          });
        });
      });

      const nextSelected = [...selectedTypes, ...toAdd];

      // 가드 사전 검사
      if (nextSelected.length > 100) {
        toast({
          title: "출제 유형은 최대 100개까지 선택할 수 있습니다.",
          description: "유형 선택을 줄여주세요.",
          variant: "destructive"
        });
        return;
      }
      if (nextSelected.length * nextMultiplier > 300) {
        toast({ title: "전체 출제 문제 수는 최대 300문항입니다. (선택 차단)", variant: "destructive" });
        return;
      }

      const toAddIds = typeIds.filter(id => !checkedTypeIds.includes(id));
      onCheckedTypesChange([...checkedTypeIds, ...toAddIds]);
      onTypesChange(nextSelected);
    }
  };

  const handleToggleMajorChecked = (majorUnit: string, types: CurriculumType[]) => {
    handleToggleMinorChecked(majorUnit, types);
  };

  const handleToggleBulkDifficulty = (diff: Difficulty) => {
    if (readonly) return;
    if (checkedTypeIds.length === 0) return;

    const status = getDifficultyStatus(diff);
    const nextMultiplier = selectedTypes[0]?.problemCount ?? 1;

    let nextSelectedTypes = [...selectedTypes];

    if (status === "all") {
      // 모든 체크 유형에서 선택된 상태이므로 해당 난이도를 전체 해제
      nextSelectedTypes = selectedTypes.filter(t => !(checkedTypeIds.includes(t.typeId) && t.difficulty === diff));
    } else {
      // 일부 또는 전체 미선택 상태이므로 해당 난이도를 전체 선택
      const toAdd: SelectedType[] = [];
      checkedTypeIds.forEach(typeId => {
        const alreadyExists = selectedTypes.some(t => t.typeId === typeId && t.difficulty === diff);
        if (alreadyExists) return;

        const type = curriculum?.types.find(t => t.id === typeId);
        if (!type) return;

        toAdd.push({
          curriculumId: curriculum!.id,
          course,
          typeId,
          majorUnit: type.majorUnit,
          minorUnit: type.minorUnit,
          typeName: type.typeName,
          difficulty: diff,
          problemCount: nextMultiplier,
          maxCount: type.difficultyCount,
          importantCount: type.importantCount,
        });
      });

      const candidateSelected = [...selectedTypes, ...toAdd];

      // 가드 체크
      if (candidateSelected.length > 100) {
        toast({
          title: "출제 유형은 최대 100개까지 선택할 수 있습니다.",
          description: "유형 선택을 줄여주세요.",
          variant: "destructive"
        });
        return;
      }
      if (candidateSelected.length * nextMultiplier > 300) {
        toast({ title: "전체 출제 문제 수는 최대 300문항입니다. (토글 적용 불가)", variant: "destructive" });
        return;
      }

      nextSelectedTypes = candidateSelected;
    }

    onTypesChange(nextSelectedTypes);

    const isNowAll = status !== "all";
    onBulkDifficultiesChange({
      ...bulkDifficulties,
      [diff]: isNowAll
    });
  };

  const handleRemoveCombo = (typeId: string, difficulty: Difficulty) => {
    if (readonly) return;
    onTypesChange(selectedTypes.filter(t => !(t.typeId === typeId && t.difficulty === difficulty)));
  };

  const handlePreview = (typeId: string, difficulty: Difficulty, typeName: string, problemCount: number) => {
    setPreviewTypeId(typeId);
    setPreviewDifficulty(difficulty);
    setPreviewTypeName(typeName);
    setPreviewProblemCount(problemCount);
    setIsPreviewOpen(true);
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
                checkedTypeIds={checkedTypeIds}
                searchQuery={searchQuery}
                onToggleCombo={handleToggleCombo}
                onToggleTypeChecked={handleToggleTypeChecked}
                onToggleMinorChecked={handleToggleMinorChecked}
                onToggleMajorChecked={handleToggleMajorChecked}
                readonly={readonly}
              />
            )
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              학습과정 데이터가 없습니다.
            </div>
          )}
        </div>

        {/* 4. 단원별 난이도 현황 영역 (하단 별도 영역) */}
        {activeMinors.length > 0 && (
          <div className="pt-6 border-t border-slate-200/85 mt-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-600 rounded-full" />
                <h4 className="text-sm font-black text-slate-800">단원별 출제 유형 현황</h4>
                <span className="text-xs text-slate-500 font-medium ml-2">선택한 단원의 유형과 출제 난이도를 확인하고 조정합니다.</span>
              </div>

              {!readonly && (
                <div className="flex gap-1.5 shrink-0 ml-auto">
                  {(["basic", "intermediate", "advanced"] as Difficulty[]).map(d => {
                    const status = getDifficultyStatus(d);
                    const label = d === "basic" ? "기본" : d === "intermediate" ? "실력" : "심화";
                    
                    let btnClass = "h-7 px-3 text-[11px] font-black rounded-lg transition-all border flex items-center justify-center cursor-pointer select-none ";
                    
                    if (status === "all") {
                      if (d === "basic") {
                        btnClass += "bg-slate-700 text-white border-slate-700 hover:bg-slate-800 shadow-xs ";
                      } else if (d === "intermediate") {
                        btnClass += "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-xs ";
                      } else {
                        btnClass += "bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-xs ";
                      }
                    } else if (status === "partial") {
                      if (d === "basic") {
                        btnClass += "bg-slate-100 text-slate-700 border-slate-400 hover:bg-slate-200/80 shadow-2xs ";
                      } else if (d === "intermediate") {
                        btnClass += "bg-blue-50 text-blue-700 border-blue-400 hover:bg-blue-100/80 shadow-2xs ";
                      } else {
                        btnClass += "bg-purple-50 text-purple-700 border-purple-400 hover:bg-purple-100/80 shadow-2xs ";
                      }
                    } else {
                      btnClass += "bg-white border-slate-200 text-slate-400 hover:border-slate-350 hover:bg-slate-50/50 ";
                    }

                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleToggleBulkDifficulty(d)}
                        className={btnClass}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              {/* 테이블 헤더 */}
              <div className="grid grid-cols-[220px_1fr_1fr_1fr] bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 text-center py-2.5">
                <div className="text-left pl-4">단원</div>
                <div className="border-l border-slate-200/60">기본</div>
                <div className="border-l border-slate-200/60">실력</div>
                <div className="border-l border-slate-200/60">심화</div>
              </div>

              {/* 테이블 바디 */}
              <div className="divide-y divide-slate-100">
                {activeMinors.map(groupId => {
                  const group = minorGroupedTypes[groupId];
                  if (!group) return null;

                  return (
                    <div key={groupId} className="grid grid-cols-[220px_1fr_1fr_1fr] min-h-[90px] items-center text-center divide-x divide-slate-100">
                      {/* 좌측: 단원/유형 정보 */}
                      <div className="text-left py-3.5 px-4 flex flex-col justify-center min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 line-clamp-1">{group.majorUnit}</span>
                        <span className="text-xs font-black text-slate-800 leading-snug">{group.minorUnit}</span>
                      </div>

                      {/* 우측 3단 난이도 컬럼 내부: 간결한 칩 형태로 표시 */}
                      {(["basic", "intermediate", "advanced"] as Difficulty[]).map(d => {
                        return (
                          <div key={d} className="p-3 flex flex-wrap gap-2.5 justify-start items-center h-full min-h-[60px]">
                            {group.types.map((type, idx) => {
                              const isSelected = selectedCombos.includes(makeComboKey(type.id, d));
                              const hasImportant = type.importantCount[d] > 0;
                              
                              const isTypeImportant = type.importantCount.basic > 0 || type.importantCount.intermediate > 0 || type.importantCount.advanced > 0;
                              const importantQuestionText = hasImportant ? "중요문제 있음" : "중요문제 없음";
                              const tooltipDetailText = isTypeImportant 
                                ? `중요유형 · ${importantQuestionText}` 
                                : importantQuestionText;
                              
                              // 칩 스타일링: w-7 h-7 크기의 작고 예쁜 사각형 칩
                              let chipClass = "relative w-7 h-7 flex items-center justify-center rounded-lg border text-xs font-extrabold transition-all duration-150 select-none cursor-pointer ";
                              
                              if (isSelected) {
                                if (d === "basic") {
                                  chipClass += "bg-slate-700 border-slate-700 text-white hover:bg-slate-800 shadow-2xs ";
                                } else if (d === "intermediate") {
                                  chipClass += "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-2xs ";
                                } else {
                                  chipClass += "bg-purple-600 border-purple-600 text-white hover:bg-purple-700 shadow-2xs ";
                                }
                              } else {
                                chipClass += "bg-slate-100 border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-200/50 ";
                              }

                              return (
                                <TooltipProvider key={type.id} delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={chipClass}
                                        onClick={() => !readonly && handleToggleCombo(type.id, d, type)}
                                      >
                                        {hasImportant && (
                                          <span className="absolute -top-1.5 -right-1 text-amber-500 text-[11px] font-black select-none drop-shadow-2xs">★</span>
                                        )}
                                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-slate-900 text-white border border-slate-800 text-[10.5px] font-medium py-1.5 px-2.5 shadow-md max-w-[280px]">
                                      <p className="font-extrabold text-blue-400 mb-0.5">{type.typeName}</p>
                                      <p className="opacity-80">{tooltipDetailText}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
      
      <TypeProblemPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        subject={subject}
        typeId={previewTypeId}
        typeName={previewTypeName}
        difficulty={previewDifficulty}
        problemCount={previewProblemCount}
      />
    </div>
  );
}
