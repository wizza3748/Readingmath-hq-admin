"use client";
import * as React from "react";
import { Eye, X, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Subject, getDifficultyLabel, Difficulty, MATH_CURRICULA, SCIENCE_CURRICULA } from "@/lib/task-center-mock";
import { MATH_PRINT_SAMPLES, SCIENCE_PRINT_SAMPLES, PrintQuestion } from "@/lib/task-print-sample-mock";
import { MATH_PROBLEM_MAPPINGS, SCIENCE_PROBLEM_MAPPINGS } from "@/lib/task-problem-mapping";
import { QuestionContent, QuestionExplanation } from "../print/print-preview-panel";

// 고유 문자열 기반 결정론적 시드 생성 함수
function getSeedFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// 시드 기반 난수 생성기
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// 결정론적 셔플 알고리즘
function shuffleWithSeed<T>(array: T[], seedStr: string): T[] {
  const shuffled = [...array];
  let seed = getSeedFromString(seedStr);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const r = seededRandom(seed);
    seed += 1;
    const j = Math.floor(r * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  typeId: string;
  typeName: string;
  difficulty: Difficulty;
  problemCount: number;
}

export function TypeProblemPreviewModal({ isOpen, onClose, subject, typeId, typeName, difficulty, problemCount }: Props) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isExplanationOpen, setIsExplanationOpen] = React.useState(false);

  // 단원 경로 탐색
  const curricula = subject === "math" ? MATH_CURRICULA : SCIENCE_CURRICULA;
  let majorUnitName = "";
  let minorUnitName = "";
  
  for (const curr of curricula) {
    const foundType = curr.types.find(t => t.id === typeId);
    if (foundType) {
      majorUnitName = foundType.majorUnit;
      minorUnitName = foundType.minorUnit;
      break;
    }
  }

  const unitPath = majorUnitName && minorUnitName
    ? `${majorUnitName} > ${minorUnitName} > ${typeName}`
    : typeName;

  // 모달이 열리거나 유형/난이도가 바뀔 때 인덱스 및 해설 접힘 상태 초기화
  React.useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsExplanationOpen(false);
    }
  }, [isOpen, typeId, difficulty]);

  if (!isOpen) return null;

  // 1. 해당 과목의 전체 문제 샘플 및 매핑 정보 가져오기
  const samples = subject === "science" ? SCIENCE_PRINT_SAMPLES : MATH_PRINT_SAMPLES;
  const mappings = subject === "science" ? SCIENCE_PROBLEM_MAPPINGS : MATH_PROBLEM_MAPPINGS;

  // 2. 선택된 유형(typeId) 및 난이도(difficulty) 조합과 매핑되는 문제 필터링
  let filteredProblems = samples
    .filter(sample => {
      const mapping = mappings[sample.id];
      return mapping && mapping.typeId === typeId && mapping.difficulty === difficulty;
    })
    .map(sample => {
      const mapping = mappings[sample.id];
      return {
        ...sample,
        important: mapping ? mapping.important : false,
      };
    });

  // 3. 만약 매칭되는 문제가 하나도 없다면, 빈 화면이 나오지 않고 기존 목데이터에서 임의로 노출하는 Fallback 정책 적용
  // 중복 렌더링을 방지하기 위해 typeId와 difficulty 조합으로 고유 seed를 생성하고 결정론적 셔플을 수행하여 문항을 다양화합니다.
  if (filteredProblems.length === 0 && samples.length > 0) {
    const seedKey = `${typeId}_${difficulty}`;
    const shuffledSamples = shuffleWithSeed(samples, seedKey);
    
    // 전달받은 problemCount 개수만큼 정확히 잘라내어 노출합니다.
    filteredProblems = shuffledSamples.slice(0, problemCount).map((sample, idx) => {
      return {
        ...sample,
        important: idx === 0, // 첫 번째 문항을 중요 문항으로 처리하여 배지 및 정렬 기능 노출 보장
      };
    });
  }

  // 3. 중요 문제 우선 정렬 (1. 중요 문제 우선, 2. CMS 등록 순서)
  // filter & map 후 sort를 수행하여 원본 순서를 유지하면서 중요 문제를 맨 앞으로 정렬
  const sortedProblems = [...filteredProblems].sort((a, b) => {
    if (a.important && !b.important) return -1;
    if (!a.important && b.important) return 1;
    return 0; // 원본 순서(CMS 등록 순서) 유지
  });

  const totalCount = sortedProblems.length;
  const currentProblem: (PrintQuestion & { important: boolean }) | undefined = sortedProblems[currentIndex];

  // 문제 이동 헬퍼 (이동 시 정답·해설 영역 접힘 상태로 초기화)
  const handleGoToProblem = (index: number) => {
    if (index >= 0 && index < totalCount) {
      setCurrentIndex(index);
      setIsExplanationOpen(false);
    }
  };

  // 정답 및 해설이 등록되어 있는지 여부 체크
  const hasExplanation = currentProblem ? (!!currentProblem.explanation || !!currentProblem.answer) : false;

  // 테마 색상 지정
  const brandColor = subject === "math" ? "#4F46E5" : "#059669"; // 수학: Indigo, 과학: Emerald

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in">
      <div 
        className="flex flex-col bg-white w-full max-w-2xl h-[75vh] rounded-2xl border border-slate-200 shadow-2xl overflow-hidden font-sans"
        style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        {/* 1. 모달 헤더 영역 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex flex-col gap-0.5 flex-1 min-w-0 mr-4">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">유형 문제 미리보기</h2>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 w-full">
              <span className="truncate text-slate-700 font-medium" title={unitPath}>
                {unitPath}
              </span>
              <span className="text-slate-300 shrink-0">•</span>
              <Badge variant="outline" className={`px-2 py-0 h-5 text-[10px] font-bold border-transparent shrink-0 ${
                difficulty === "basic" ? "bg-slate-100 text-slate-600" :
                difficulty === "intermediate" ? "bg-indigo-50 text-indigo-600" :
                "bg-purple-50 text-purple-600"
              }`}>
                {getDifficultyLabel(difficulty)}
              </Badge>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors duration-150"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 모달 컨텐츠 바디 */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
          {totalCount === 0 ? (
            /* 등록된 문제가 없는 경우의 빈 상태 */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/20">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">등록된 문제가 없습니다.</h3>
              <p className="text-sm text-slate-400">해당 유형 및 난이도 조합에 등록된 미리보기 문제가 없습니다.</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* 2. 문제 탐색 영역 */}
              <div className="flex flex-col sm:grid sm:grid-cols-[80px_1fr_80px] items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl w-full">
                {/* 좌측 구역: 현재 문제 순서 / 전체 문제 수 */}
                <div className="text-sm font-bold text-slate-600 shrink-0 sm:justify-self-start w-[80px]">
                  문항 <span style={{ color: brandColor }}>{currentIndex + 1}</span> / {totalCount}
                </div>

                {/* 중앙 구역: 문제 번호 목록 (가로 중앙 배치) */}
                <div className="flex flex-nowrap items-center justify-center gap-1.5 max-w-full sm:justify-self-center overflow-x-auto scrollbar-none">
                  {sortedProblems.map((prob, idx) => {
                    const isSelected = idx === currentIndex;
                    const isImportant = prob.important;
                    
                    return (
                      <button
                        key={prob.id}
                        onClick={() => handleGoToProblem(idx)}
                        className={`relative px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-150 flex items-center justify-center min-w-[32px] h-8 shrink-0 ${
                          isSelected
                            ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                            : isImportant
                            ? "bg-amber-50/50 text-amber-700 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        <span>{isImportant ? `★ ${idx + 1}` : idx + 1}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 우측 구역: 대칭을 위한 빈 공간 */}
                <div className="hidden sm:block sm:justify-self-end w-[80px]" />
              </div>

              {/* 3. 문제 표시 영역 */}
              {currentProblem && (
                <div className="p-6 border border-slate-200 rounded-2xl bg-white shadow-xs flex flex-col gap-4">
                  {/* 중요 문제 배지 - 텍스트와 겹치지 않도록 상단에 단독 배치 */}
                  {currentProblem.important && (
                    <div className="flex">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                        ★ 중요 문제
                      </span>
                    </div>
                  )}

                  {/* 문항 렌더링 컴포넌트 재사용 */}
                  {/* teacherQuestionNo를 모달 내 표시 순번으로 전달하여 일치시킴 */}
                  <div className="prose max-w-full">
                    <QuestionContent
                      q={{
                        ...currentProblem,
                        teacherQuestionNo: currentIndex + 1
                      }}
                      printType="student"
                      task={{ subject }}
                      color={brandColor}
                      fontSize={11}
                      scaleDownChoices={false}
                      itemType="question"
                    />
                  </div>

                  {/* 4. 정답·해설 영역 */}
                  <div className="mt-4 pt-1">
                    {!isExplanationOpen ? (
                      /* 정답·해설 보기 버튼 */
                      <div className="flex justify-end">
                        <Button
                          disabled={!hasExplanation}
                          onClick={() => setIsExplanationOpen(true)}
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs font-bold text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors duration-150"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                          정답·해설 보기
                        </Button>
                      </div>
                    ) : (
                      /* 정답·해설 상세 영역 (공간 효율화를 위해 space-y 및 구분선 제거) */
                      <div className="space-y-2.5 animate-in slide-in-from-top-4 duration-200">
                        <div className="flex items-center justify-between pb-1">
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <HelpCircle className="h-4 w-4" style={{ color: brandColor }} />
                            정답 및 해설
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExplanationOpen(false)}
                            className="h-8 px-2.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            정답·해설 닫기
                          </Button>
                        </div>

                        {hasExplanation ? (
                          /* QuestionExplanation 컴포넌트를 활용하여 동일한 UI와 LaTeX 렌더링 유지 */
                          <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-4">
                            <QuestionExplanation
                              q={{
                                ...currentProblem,
                                teacherQuestionNo: currentIndex + 1
                              }}
                              color={brandColor}
                              fontSize={10}
                              isSeparated={false}
                            />
                          </div>
                        ) : (
                          <div className="py-6 text-center text-sm font-medium text-slate-400 bg-slate-50/30 rounded-xl border border-dashed border-slate-200">
                            등록된 정답·해설이 없습니다.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. 하단 버튼 영역 */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="px-5 h-10 text-sm font-semibold border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl"
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}
