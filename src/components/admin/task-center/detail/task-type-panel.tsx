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
  checkedTypeIds: string[];
  onlyImportant: boolean;
  readonly?: boolean;
  onTypesChange: (types: SelectedType[]) => void;
  onCheckedTypesChange: (ids: string[]) => void;
}

export function TaskTypePanel({ subject, selectedTypes, checkedTypeIds = [], onlyImportant, readonly, onTypesChange, onCheckedTypesChange }: Props) {
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

  // 1. 선택된 단원(minorUnit) 목록 추출
  const activeMinors = React.useMemo(() => {
    return Array.from(new Set(selectedTypes.map(t => t.minorUnit)));
  }, [selectedTypes]);

  // 2. 각 minorUnit에 해당하는 유형 리스트 그룹화
  const minorGroupedTypes = React.useMemo(() => {
    const groups: Record<string, { majorUnit: string; types: CurriculumType[] }> = {};
    if (filteredCurriculum) {
      filteredCurriculum.types.forEach(t => {
        if (!groups[t.minorUnit]) {
          groups[t.minorUnit] = { majorUnit: t.majorUnit, types: [] };
        }
        if (!groups[t.minorUnit].types.some(exist => exist.id === t.id)) {
          groups[t.minorUnit].types.push(t);
        }
      });
    }
    return groups;
  }, [filteredCurriculum]);

  const handleToggleCombo = (typeId: string, difficulty: Difficulty, type: CurriculumType) => {
    if (readonly) return;
    const exists = selectedTypes.find(t => t.typeId === typeId && t.difficulty === difficulty);

    if (exists) {
      // OFF 토글: checkedTypeIds는 건드리지 않고 유지!
      onTypesChange(selectedTypes.filter(t => !(t.typeId === typeId && t.difficulty === difficulty)));
    } else {
      // ON 토글
      const nextMultiplier = selectedTypes[0]?.problemCount ?? 1;
      
      // 조합 100개 / 총 문제 300개 한계 사전 검증
      if (selectedTypes.length + 1 > 100) {
        toast({ title: "선택 항목 최대값은 유형·난이도 조합 100개입니다.", variant: "destructive" });
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
      // ON:checkedTypeIds에만 추가하고 난이도는 아무것도 켜지 않음 (기본 상태)
      onCheckedTypesChange([...checkedTypeIds, type.id]);
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
      // 소단원 선택: 미체크 유형 추가, 난이도는 켜지 않음
      const toAdd = typeIds.filter(id => !checkedTypeIds.includes(id));
      onCheckedTypesChange([...checkedTypeIds, ...toAdd]);
    }
  };

  const handleToggleMajorChecked = (majorUnit: string, types: CurriculumType[]) => {
    handleToggleMinorChecked(majorUnit, types);
  };

  const handleApplyBulkDifficulty = (mode: string) => {
    if (readonly) return;
    if (checkedTypeIds.length === 0) {
      toast({ title: "선택된 유형이 없습니다. 커리큘럼 트리에서 유형을 먼저 체크해 주세요.", variant: "destructive" });
      return;
    }

    let targetDiffs: Difficulty[] = [];
    if (mode === "basic") targetDiffs = ["basic"];
    else if (mode === "intermediate") targetDiffs = ["intermediate"];
    else if (mode === "advanced") targetDiffs = ["advanced"];
    else if (mode === "basic+intermediate") targetDiffs = ["basic", "intermediate"];
    else if (mode === "basic+advanced") targetDiffs = ["basic", "advanced"];
    else if (mode === "intermediate+advanced") targetDiffs = ["intermediate", "advanced"];
    else if (mode === "all") targetDiffs = ["basic", "intermediate", "advanced"];
    // 'clear'는 빈 배열 유지

    // 1. checkedTypeIds에 속하지 않는 유형들의 기존 난이도 상태 유지
    const keptTypes = selectedTypes.filter(t => !checkedTypeIds.includes(t.typeId));

    // 2. checkedTypeIds에 속하는 유형들에 대해 새로운 난이도 조합 구성
    const nextMultiplier = selectedTypes[0]?.problemCount ?? 1;
    const newEntries: SelectedType[] = [];

    if (targetDiffs.length > 0 && curriculum) {
      checkedTypeIds.forEach(typeId => {
        const type = curriculum.types.find(t => t.id === typeId);
        if (!type) return;

        targetDiffs.forEach(d => {
          newEntries.push({
            curriculumId: curriculum.id,
            course,
            typeId,
            majorUnit: type.majorUnit,
            minorUnit: type.minorUnit,
            typeName: type.typeName,
            difficulty: d,
            problemCount: nextMultiplier,
            maxCount: type.difficultyCount,
            importantCount: type.importantCount,
          });
        });
      });
    }

    const nextSelectedTypes = [...keptTypes, ...newEntries];

    // 3. 100개 조합 & 300문항 한계 사전 검사 및 초과 시 경고
    if (nextSelectedTypes.length > 100) {
      toast({ title: "선택 가능한 유형·난이도 조합은 최대 100개입니다. (일괄 적용 불가)", variant: "destructive" });
      return;
    }
    if (nextSelectedTypes.length * nextMultiplier > 300) {
      toast({ title: "전체 출제 문제 수는 최대 300문항입니다. (일괄 적용 불가)", variant: "destructive" });
      return;
    }

    // 4. 적용
    onTypesChange(nextSelectedTypes);
    toast({ title: "선택된 유형에 난이도 조합이 일괄 적용되었습니다." });
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

        {/* 선택 유형 난이도 적용 바 */}
        {!readonly && (
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-3 bg-indigo-600 rounded-full" />
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">선택 유형 난이도 적용</span>
              {checkedTypeIds.length > 0 && (
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full border border-indigo-100">
                  {checkedTypeIds.length}개 유형 선택됨
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-[10.5px] font-bold px-2.5 bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70" onClick={() => handleApplyBulkDifficulty("basic")}>기본만</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10.5px] font-bold px-2.5 bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70" onClick={() => handleApplyBulkDifficulty("intermediate")}>실력만</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10.5px] font-bold px-2.5 bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70" onClick={() => handleApplyBulkDifficulty("advanced")}>심화만</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10.5px] font-bold px-2.5 bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70" onClick={() => handleApplyBulkDifficulty("basic+intermediate")}>기본+실력</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10.5px] font-bold px-2.5 bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70" onClick={() => handleApplyBulkDifficulty("basic+advanced")}>기본+심화</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10.5px] font-bold px-2.5 bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70" onClick={() => handleApplyBulkDifficulty("intermediate+advanced")}>실력+심화</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10.5px] font-bold px-2.5 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/60" onClick={() => handleApplyBulkDifficulty("all")}>전체</Button>
              <Button size="sm" variant="outline" className="h-7 text-[10.5px] font-bold px-2.5 bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/60" onClick={() => handleApplyBulkDifficulty("clear")}>전체 해제</Button>
            </div>
          </div>
        )}

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
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-4 bg-indigo-600 rounded-full" />
              <h4 className="text-sm font-black text-slate-800">단원별 난이도 현황</h4>
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
                {activeMinors.map(minor => {
                  const group = minorGroupedTypes[minor];
                  if (!group) return null;

                  return (
                    <div key={minor} className="grid grid-cols-[220px_1fr_1fr_1fr] min-h-[90px] items-center text-center divide-x divide-slate-100">
                      {/* 좌측: 단원/유형 정보 */}
                      <div className="text-left py-3.5 px-4 flex flex-col justify-center min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 line-clamp-1">{group.majorUnit}</span>
                        <span className="text-xs font-black text-slate-800 leading-snug">{minor}</span>
                      </div>

                      {/* 우측 3단 난이도 컬럼 내부: 간결한 칩 형태로 표시 */}
                      {(["basic", "intermediate", "advanced"] as Difficulty[]).map(d => {
                        return (
                          <div key={d} className="p-3 flex flex-wrap gap-2.5 justify-start items-center h-full min-h-[60px]">
                            {group.types.map((type, idx) => {
                              const isSelected = selectedCombos.includes(makeComboKey(type.id, d));
                              const hasImportant = type.importantCount[d] > 0;
                              
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
                                        ?
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-slate-900 text-white border border-slate-800 text-[10.5px] font-medium py-1.5 px-2.5 shadow-md max-w-[280px]">
                                      <p className="font-extrabold text-blue-400 mb-0.5">{type.typeName}</p>
                                      <p className="opacity-80">유형 번호: {idx + 1}번 · 중요문제: {hasImportant ? "포함" : "없음"}</p>
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
