
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

type ReportData = {
    studentName: string;
    grade: string;
    testDate: string;
    testTime: string;
    timeLimit: number;
    totalScore: number;
    level: number;
    objectiveScore: number;
    descriptiveScore: number;
    objectiveCorrect: number;
    objectiveTotal: number;
    descriptiveCorrect: number;
    descriptiveTotal: number;
    unitResults: {
        contentArea: string;
        unitName: string;
        score: number;
    }[];
};

const sampleReportData: ReportData = {
    studentName: '김선우',
    grade: '초등 3학년 1학기',
    testDate: '2025.12.17',
    testTime: '28분 20초',
    timeLimit: 40,
    totalScore: 83,
    level: 3,
    objectiveScore: 40,
    descriptiveScore: 43,
    objectiveCorrect: 16,
    objectiveTotal: 20,
    descriptiveCorrect: 15,
    descriptiveTotal: 20,
    unitResults: [
        { contentArea: '물리', unitName: '1단원-힘과 우리 생활', score: 80 },
        { contentArea: '생명과학', unitName: '2단원-동물의 생활', score: 95 },
        { contentArea: '생명과학', unitName: '3단원-식물의 생활', score: 70 },
        { contentArea: '생명과학', unitName: '4단원-생물의 한살이', score: 88 },
    ],
};

const getLevelComments = (level: number) => {
    const comments = {
        1: {
            title: "지금은 과학 개념들이 머릿속에서 각각 따로 정리되어 있어, 문제가 조금만 바뀌어도 어떻게 접근해야 할지 막막할 수 있습니다. 문제를 읽을 때 중요한 조건이나 질문의 핵심을 놓쳐 아쉽게 틀리는 경우도 많습니다. 단순히 정답만 외우는 공부보다는 “왜 이런 결과가 나왔을까?”를 스스로 질문하며 근거를 찾는 연습이 필요합니다. 차근차근 기초부터 개념을 연결해 나가면 실력은 충분히 성장할 수 있습니다.",
            roadmap: [
                "문제 읽는 습관 만들기: 문제에 표시하며 ‘구하는 것’이 무엇인지 먼저 확인하는 연습이 필요합니다. 이를 통해 조건 누락으로 인한 실수를 줄일 수 있습니다.",
                "개념의 연결 고리 찾기: ‘원인–조건–결론’을 하나의 흐름으로 정리하며 학습하면 새로운 유형의 문제에도 안정적으로 접근할 수 있습니다.",
                "풀이 과정 적어보기: 풀이 순서를 단계별로 정리하고 마지막에 다시 확인하는 습관을 통해 아쉬운 오답을 예방할 수 있습니다.",
                "내 생각 설명해 보기: 과학적 근거를 들어 짧게 설명하는 연습을 하면 서술형 문제에 대한 부담을 줄일 수 있습니다."
            ]
        },
        2: {
            title: "“아는 문제인데 왜 틀렸지?”라는 질문이 자주 떠오르는 단계입니다. 기본적인 내용은 이해하고 있지만, 문제가 조금만 복잡해지면 당황하기 쉽습니다. 몰라서 틀리기보다는 문제를 정확히 읽지 못하거나, 개념을 연결하는 과정에서 어려움을 겪는 경우가 많습니다. 이제는 단순 암기보다는 배운 내용을 문제에 어떻게 적용할지, 그리고 왜 그 답이 정답인지 설명하는 연습에 집중할 필요가 있습니다.",
            roadmap: [
                "문제 풀이 루틴 만들기: ‘구하는 것·조건·자료’를 확인하는 고정된 풀이 순서를 통해 조건 누락 실수를 방지할 수 있습니다.",
                "개념의 사용 조건과 반대 사례 학습: 개념이 적용되는 상황과 그렇지 않은 경우를 함께 정리하면 변형 문제에도 흔들리지 않습니다.",
                "전략 수립과 검토 습관 기르기: 단위와 대략적인 값 확인을 통해 계산 실수와 단위 오류를 줄일 수 있습니다.",
                "근거를 문장으로 표현하기: ‘근거 → 결론’의 구조로 답을 정리하며 감이 아닌 논리에 기반한 풀이를 연습할 필요가 있습니다."
            ]
        },
        3: {
            title: "“실수만 줄여도 점수가 눈에 띄게 오를 수 있는 단계”입니다. 기본 개념이나 대표적인 문제들은 안정적으로 해결하지만, 긴 지문이나 복잡한 자료가 제시될 때 미세한 조건을 놓치거나 계산 과정에서의 사소한 실수로 점수가 깎이곤 합니다. 이제는 정확하게 풀이하는 습관을 기르고, 난도가 높은 응용 문제까지 차분하게 해결하는 연습이 필요합니다.",
            roadmap: [
                "조건·비교 기준·공식 점검하기: 문제에서 요구하는 조건과 비교 기준을 세밀하게 확인하여 문해력을 더욱 정교하게 다듬을 필요가 있습니다.",
                "경계 조건과 반례로 개념 확장하기: 개념이 성립하는 경우와 그렇지 않은 경우를 함께 정리하여 이해의 깊이를 높일 수 있습니다.",
                "전략 최적화와 검토 루틴 고정: 이미 알고 있는 문제를 실수 없이 해결할 수 있도록 풀이 후 검토 과정을 습관화해야 합니다.",
                "근거–원리–결론의 다단 추론 훈련: 서술형 및 복합 추론 문제를 대비해 사고 과정을 단계적으로 정리하는 연습이 필요합니다."
            ]
        },
        4: {
            title: "“아는 것은 충분하지만, 디테일에서 아쉬움이 남는 단계”입니다. 전반적인 실력은 매우 안정적이지만, 만점에 가까운 구간에서 아주 미세한 조건이나 서술형 표현의 정교함 차이로 점수가 감소합니다. 문제를 더 많이 풀기보다는 실수를 최소화하고, 설명의 완성도를 높이는 데 초점을 맞추는 학습이 효과적입니다.",
            roadmap: [
                "개인별 실수 유형 점검하기: 부정 표현, 단위 실수 등 반복되는 실수 유형을 정리하여 고위험 요소를 제거할 필요가 있습니다.",
                "단원 간 개념 연결하기: 서로 다른 단원의 개념을 함께 적용하는 연습을 통해 고난도 통합 문제 해결력을 강화할 수 있습니다.",
                "2단 검토 습관 기르기: 단위 확인과 대략적인 값 점검을 통해 시간 압박 상황에서도 실수를 최소화할 수 있습니다.",
                "서술 표현의 정확성 점검하기: 확정 표현과 가능성 표현을 구분하여 서술형 감점을 예방해야 합니다."
            ]
        },
        5: {
            title: "“보이지 않는 1점까지 놓치지 않는 실력 단계”입니다. 개념 이해, 문제 문해, 해결 과정, 추론 능력이 전반적으로 매우 안정적이며, 오답이 발생하더라도 대부분 단발성 실수이거나 고난도의 복합·비전형·정밀한 서술형 문제에서 나타납니다. 이 단계에서는 문제 수를 늘리기보다 정밀성을 유지하고, 고난도 문제로 사고의 폭을 확장하며, 논증 수준의 설명 능력을 더욱 고도화하는 것이 핵심입니다.",
            roadmap: [
                "문제 끝까지 읽는 습관 유지하기: 문제의 조건과 공식을 끝까지 확인하여 불필요한 실수를 방지할 필요가 있습니다.",
                "함정 요소 점검하기: 예외 상황이나 반대 경우까지 고려하며 개념을 깊이 있게 정리해야 합니다.",
                "개인 검토 체크리스트 활용하기: 단위 확인 등 개인별 점검 항목을 통해 아쉬운 실수를 줄일 수 있습니다.",
                "논리적 서술 완성도 높이기: ‘이유 → 원리 → 결론’의 구조로 답안을 정리하여 서술형 문제에서의 완성도를 높일 필요가 있습니다."
            ]
        },
    };
    return comments[level as keyof typeof comments] || comments[1];
};

const timeComment = (studentName: string, testTime: string, timeLimit: number) => {
    const [minutes, seconds] = testTime.match(/\d+/g)!.map(Number);
    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds > timeLimit * 60) {
        return `${studentName} 학생은 진단평가 진행 시 제한 시간을 초과하였습니다. 시간을 적절히 계획하여 제한된 시간 내에 문제를 풀 수 있도록 노력 바랍니다.`;
    }
    return `${studentName} 학생은 진단평가 진행 시 제한 시간 내에 완료하였습니다. 학습을 할 때에도 시간을 적절히 계획하여 문제를 풀 수 있도록 노력 바랍니다.`;
};

const Pyramid = ({ level }: { level: number }) => {
    const levels = [
        { id: 5, score: "96~100점" },
        { id: 4, score: "86~95점" },
        { id: 3, score: "71~85점" },
        { id: 2, score: "51~70점" },
        { id: 1, score: "50점 이하" },
    ];
    return (
        <div className="w-[380px] h-[220px] relative">
            <svg width="100%" height="100%" viewBox="0 0 380 220" preserveAspectRatio="none">
                <polygon points="190,0 380,220 0,220" fill="#f3f4f6" />
                {levels.map((l, i) => {
                    const isActive = l.id === level;
                    const y1 = i * 44;
                    const y2 = (i + 1) * 44;
                    const x1_offset = i * 38;
                    const x2_offset = (i + 1) * 38;
                    const points = `${190},${y1} ${380 - x1_offset},${y1} ${380 - x2_offset},${y2} ${x2_offset},${y2} ${x1_offset},${y1}`;
                    if (isActive) {
                        return <polygon key={l.id} points={points} fill="hsl(var(--primary))" />;
                    }
                    return null;
                })}
            </svg>
            {levels.map((l, i) => {
                 const isActive = l.id === level;
                 return (
                    <div key={l.id} style={{ top: `${i * 44 + 12}px`}} className="absolute w-full text-center">
                        <span className={`text-2xl font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>{l.id}</span>
                    </div>
                 )
            })}
             {levels.map((l, i) => (
                <div key={`${l.id}-score`} style={{ top: `${i * 44 + 12}px` }} className="absolute right-0 flex items-center">
                    <span className="text-sm font-semibold text-gray-600 mr-2">{l.score}</span>
                    <div className="w-2 h-px bg-gray-400"></div>
                </div>
            ))}
        </div>
    );
};


export function ReportPage2() {
    const data = sampleReportData;
    const comments = getLevelComments(data.level);
    const timeSummary = timeComment(data.studentName, data.testTime, data.timeLimit);
    
    return (
        <div className="bg-white p-12 md:p-16 w-full max-w-4xl shadow-lg relative print:shadow-none page-break" style={{aspectRatio: '210 / 297'}}>
            {/* 상단 정보 영역 */}
            <div className="bg-gray-100 p-4 rounded-lg flex justify-around items-center text-sm">
                <div className="text-center">
                    <span className="font-semibold">{data.studentName}</span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div>
                    <span className="text-gray-500 mr-2">응시 학년</span>
                    <span className="font-semibold">{data.grade}</span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div>
                    <span className="text-gray-500 mr-2">평가일</span>
                    <span className="font-semibold">{data.testDate}</span>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div>
                    <span className="text-gray-500 mr-2">평가 시간</span>
                    <span className="font-semibold">{data.testTime}</span>
                    <span className="text-gray-500 ml-1 text-xs">({data.timeLimit}분)</span>
                </div>
            </div>

            {/* 종합 성취도 */}
            <div className="mt-8">
                <h2 className="text-lg font-bold text-gray-800 border-l-4 border-primary pl-3">과학 문해력 종합 성취도</h2>
                <Card className="mt-4">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="grid grid-cols-2 grid-rows-2 gap-x-6 gap-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <div className="text-gray-500">나의 점수</div>
                                <div className="text-3xl font-bold text-primary mt-1">{data.totalScore}점</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg text-center">
                                <div className="text-gray-500">나의 위치</div>
                                <div className="text-3xl font-bold text-primary mt-1">{data.level}레벨</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg text-center col-span-2">
                                <div className="text-gray-500">풀이 답안 정답수</div>
                                <div className="text-2xl font-bold mt-1">
                                    <span className="text-primary">{data.objectiveCorrect + data.descriptiveCorrect}</span>
                                    <span className="text-gray-400 mx-1">/</span>
                                    <span>{data.objectiveTotal + data.descriptiveTotal} 문제</span>
                                </div>
                            </div>
                        </div>
                        <Pyramid level={data.level} />
                    </CardContent>
                </Card>
            </div>

            {/* 단원별 평가 결과 */}
            <div className="mt-8">
                <h2 className="text-lg font-bold text-gray-800 border-l-4 border-primary pl-3">단원별 평가 결과</h2>
                <Card className="mt-4">
                    <CardContent className="p-6 space-y-4">
                        {data.unitResults.map((unit, index) => (
                            <div key={index} className="grid grid-cols-[100px_1fr_50px] items-center gap-4">
                                <div className="flex items-center">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${unit.contentArea === '물리' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{unit.contentArea}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-600">{unit.unitName}</span>
                                    <Progress value={unit.score} className="h-3 mt-1" indicatorClassName={unit.score < 90 ? 'bg-red-500' : 'bg-blue-500'} />
                                </div>
                                <div className="text-right">
                                    <span className={`text-lg font-bold ${unit.score < 90 ? 'text-red-500' : 'text-blue-500'}`}>{unit.score}%</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* 총평 */}
            <div className="mt-8">
                 <h2 className="text-lg font-bold text-gray-800 border-l-4 border-primary pl-3">총평</h2>
                <Card className="mt-4">
                    <CardContent className="p-6 text-sm leading-relaxed text-gray-700 space-y-4">
                        <p>
                            {data.studentName} 학생의 {data.grade} 과학탐구력 진단평가 결과 100점 만점 중 {data.totalScore}점으로 전체 5레벨 중 {data.level}레벨 에 위치해 있습니다.
                        </p>
                        <p>{comments.title}</p>
                        <div>
                            <h3 className="font-bold mb-2">&lt;우선순위 학습 로드맵 제안&gt;</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {comments.roadmap.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        <p>{timeSummary}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Override Progress component's indicator color
const originalIndicator = Progress.render.propTypes;
Progress.render.propTypes = {
  ...originalIndicator,
  indicatorClassName: () => {},
};

const _Progress = Progress as any;
_Progress.render = React.forwardRef<
  React.ElementRef<typeof Progress>,
  React.ComponentPropsWithoutRef<typeof Progress> & { indicatorClassName?: string }
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
_Progress.displayName = "Progress";
