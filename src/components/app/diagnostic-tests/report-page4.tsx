
'use client';

import * as React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

type BehavioralDomain = '개념이해력' | '문제해결력' | '문해력' | '추론력';

type BehavioralDomainData = {
  name: BehavioralDomain;
  score: number;
  correct: number;
  total: number;
  objectiveCorrect: number;
  objectiveTotal: number;
  descriptiveCorrect: number;
  descriptiveTotal: number;
};

type QuestionResult = {
  number: number;
  behavioralDomain: BehavioralDomain;
  type: '객관식' | '서술형';
  result: 'correct' | 'incorrect' | 'partial';
  correctAnswers?: number;
  totalAnswers?: number;
};

const sampleBehavioralData: BehavioralDomainData[] = [
  { name: '개념이해력', score: 85, correct: 10, total: 12, objectiveCorrect: 8, objectiveTotal: 9, descriptiveCorrect: 2, descriptiveTotal: 3 },
  { name: '문제해결력', score: 95, correct: 9, total: 10, objectiveCorrect: 7, objectiveTotal: 7, descriptiveCorrect: 2, descriptiveTotal: 3 },
  { name: '문해력', score: 75, correct: 6, total: 8, objectiveCorrect: 4, objectiveTotal: 5, descriptiveCorrect: 2, descriptiveTotal: 3 },
  { name: '추론력', score: 100, correct: 8, total: 8, objectiveCorrect: 5, objectiveTotal: 5, descriptiveCorrect: 3, descriptiveTotal: 3 },
];

const sampleQuestionResults: QuestionResult[] = Array.from({ length: 28 }, (_, i) => {
    const rowDomains: BehavioralDomain[] = ['개념이해력', '문제해결력', '문해력', '추론력', '개념이해력', '문제해결력', '문해력'];
    
    const isDescriptive = (i + 1) % 7 === 6 || (i + 1) % 7 === 0;

    let result: 'correct' | 'incorrect' | 'partial';
    if (isDescriptive) {
        const mod = i % 3;
        if (mod === 0) result = 'correct';
        else if (mod === 1) result = 'partial';
        else result = 'incorrect';
    } else {
        result = (i % 5 === 4) ? 'incorrect' : 'correct';
    }

    const behavioralDomain = rowDomains[i % rowDomains.length];

    return {
        number: i + 1,
        behavioralDomain: behavioralDomain,
        type: isDescriptive ? '서술형' : '객관식',
        result: result,
        correctAnswers: isDescriptive ? (i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1) : undefined,
        totalAnswers: isDescriptive ? 3 : undefined,
    }
});


const getLevel = (score: number): number => {
  if (score >= 96) return 5;
  if (score >= 86) return 4;
  if (score >= 71) return 3;
  if (score >= 51) return 2;
  return 1;
};

const getLevelComments: (level: number, domain: BehavioralDomain) => string = (level, domain) => {
  const comments: Record<number, Record<BehavioralDomain, string>> = {
    1: {
      개념이해력: '과학 용어의 단순 암기보다 개념관계 중심 정리, 다양한 방식(말·그림·기호)의 표현 전환, 조건 변화에 따른 결과 예측 연습이 필요합니다.',
      문제해결력: '실수 방지를 위해 조건 확인, 원리 결정, 검토의 3단계를 준수하고 풀이 후 재확인하는 습관을 들이면 정답률이 높아집니다.',
      문해력: '핵심 조건과 원리를 먼저 찾고, 그래프 변화를 말로 설명하는 연습을 하면 조건 누락과 자료 해석 오류를 줄일 수 있습니다.',
      추론력: '근거와 결론을 구분해 정리하고, 실험 변인을 표로 분석하는 연습을 하면 논리적인 근거 제시와 실험 이해 능력이 향상됩니다.',
    },
    2: {
        개념이해력: '비슷한 개념을 비교해 문제 적용을 연습하고, 마인드맵으로 단원 전체의 인과 흐름을 연결하면 개념 적용 능력이 향상됩니다.',
        문제해결력: '정해진 풀이 순서를 습관화하고 오답 노트를 활용해 반복 학습하면 풀이 시간 단축과 복잡한 문제의 실수를 방지할 수 있습니다.',
        문해력: '구하는 것과 조건에 밑줄을 긋는 습관을 만들고, 그래프를 간략히 정리한 뒤 풀이하면 조건 누락과 질문 혼동을 방지할 수 있습니다.',
        추론력: '근거와 결론을 말로 연결하고 실험 변인을 빠르게 구분하는 연습을 하면 정답의 이유를 논리적으로 설명하는 힘이 길러집니다.',
    },
    3: {
        개념이해력: '예외와 반례를 포함해 개념을 정리하고, 문제의 핵심 개념을 즉시 찾는 연습을 하면 다중 개념 문제의 우선순위 판단이 빨라집니다.',
        문제해결력: '식 세우기부터 검토까지 풀이 순서를 고정하고, 단위와 수의 크기를 점검하는 습관을 들이면 계산 실수를 방지할 수 있습니다.',
        문해력: '구하는 것, 기준, 단위 등을 체크리스트로 확인하고 그래프를 수치와 함께 요약하면 지문 조건 누락과 비교 혼동을 줄일 수 있습니다.',
        추론력: '관찰, 원리, 결론의 3단계로 답안을 구성하고 실험 변인을 요약하는 연습을 하면 서술형 감점을 막고 논리성을 높일 수 있습니다.',
    },
    4: {
        개념이해력: '문제를 보자마자 핵심과 보조 개념을 구분해 찾는 연습을 반복하면, 여러 단원의 개념을 연결하는 속도와 능력이 강화됩니다.',
        문제해결력: '단위와 수치 크기를 점검하는 2단 검토를 습관화하면, 시간 압박 속에서도 실수를 방지하고 풀이의 완성도를 높일 수 있습니다.',
        문해력: '핵심 표현에 표시하고 선택지 근거를 지문에서 찾는 습관을 들이면 함정 조건을 놓치지 않고 정확히 판단하는 힘이 길러집니다.',
        추론력: '근거, 원리, 결론 순으로 답안을 작성하고 변인을 명확히 정리한 뒤 결론을 내리는 연습을 하면 서술형 감점을 방지할 수 있습니다.',
    },
    5: {
        개념이해력: '개념을 성립 조건과 함께 정리하고 핵심 정의를 한 문장으로 표현하는 연습을 하면, 낯선 유형의 예외 조건을 놓치지 않습니다.',
        문제해결력: '단위 확인과 유사 정답 예측을 습관화하고 효율적인 풀이법을 점검하면 계산 실수를 방지하고 문제 해결력을 높일 수 있습니다.',
        문해력: '위험 요소에 표시하고 그래프의 축과 수치를 차례로 요약하는 습관을 들이면 부정 표현이나 예외 조건을 놓치지 않을 수 있습니다.',
        추론력: '근거, 원리, 결론의 3단계 구조를 지키고 표현의 확정성을 구분해 작성하는 연습을 하면 서술형의 논리적 완성도가 높아집니다.',
    }
  };
  return comments[level][domain];
};

const domainOrder: BehavioralDomain[] = ['개념이해력', '문제해결력', '문해력', '추론력'];
const radarChartData = domainOrder.map(domain => {
    const data = sampleBehavioralData.find(d => d.name === domain);
    return {
        subject: domain,
        score: data?.score || 0,
        fullMark: 100,
    };
});

const DomainGaugeChart: React.FC<{ data: { score: number, color: string } }> = ({ data }) => {
    const chartData = [
      { name: 'score', value: data.score },
      { name: 'remaining', value: 100 - data.score },
    ];
  
    return (
      <div className="w-24 h-24 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius="70%"
              outerRadius="90%"
              dataKey="value"
              cornerRadius={5}
              stroke="none"
            >
              <Cell fill={data.color} />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold" style={{ color: data.color }}>
          {data.score}
        </div>
      </div>
    );
};

export function ReportPage4() {
  const domainColors: Record<BehavioralDomain, string> = {
    개념이해력: '#3b82f6',
    문제해결력: '#10b981',
    문해력: '#8b5cf6',
    추론력: '#f97316',
  };

  const CustomPolarAngleAxisTick = (props: any) => {
    let { x, y, payload } = props;
    const d = radarChartData.find(d => d.subject === payload.value);
    if (!d) return null;

    let textAnchor: 'middle' | 'start' | 'end' = 'middle';
    let yOffset = 0;
    
    switch (payload.value) {
        case '개념이해력':
            yOffset = -15;
            textAnchor = 'middle';
            break;
        case '문제해결력':
            textAnchor = 'start';
            x = x + 10;
            break;
        case '문해력':
            yOffset = 15;
            textAnchor = 'middle';
            break;
        case '추론력':
            textAnchor = 'end';
            x = x - 10;
            break;
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <text y={yOffset} textAnchor={textAnchor} dominantBaseline="central" className="text-sm fill-gray-600">
          {d.subject}
        </text>
         <text y={yOffset + 16} textAnchor={textAnchor} dominantBaseline="central" className="text-sm font-bold fill-gray-800">
          {d.score}점
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white p-12 md:p-16 w-full max-w-4xl shadow-lg relative print:shadow-none page-break" style={{ aspectRatio: '210 / 297' }}>
      <div>
        <h2 className="text-lg font-bold text-gray-800 border-l-4 border-primary pl-3">행동 영역별 평가 결과</h2>
        <Card className="mt-4">
          <CardContent className="p-6 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                <PolarGrid gridType="polygon" stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={<CustomPolarAngleAxisTick />} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {domainOrder.map(domainName => {
          const domainData = sampleBehavioralData.find(d => d.name === domainName);
          if (!domainData) return null;
          const level = getLevel(domainData.score);

          return (
            <Card key={domainName} className="p-4">
              <div className="flex items-start gap-4">
                <DomainGaugeChart data={{ score: domainData.score, color: domainColors[domainName] }} />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{domainName}</h3>
                  <p className="text-sm text-gray-500">{`객관식 ${domainData.objectiveCorrect}/${domainData.objectiveTotal} · 서술형 ${domainData.descriptiveCorrect}/${domainData.descriptiveTotal}`}</p>
                  <p className="mt-2 text-sm leading-snug">{getLevelComments(level, domainName)}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-6">
        <div className="grid grid-cols-7 gap-1">
          {sampleQuestionResults.map(q => (
            <div key={q.number} className="border rounded-md p-2 text-center text-xs space-y-1">
              <div className="font-bold text-sm">{q.number}번</div>
              <div className="text-gray-500">{q.behavioralDomain}</div>
              <div className="text-gray-500">{q.type}</div>
              <div className="h-5 flex items-center justify-center">
                {q.type === '객관식' ? (
                  q.result === 'correct' ? <span className="text-blue-500 font-bold text-lg">○</span> : <span className="text-red-500 font-bold text-lg">✕</span>
                ) : (
                  <div className="flex items-center gap-1">
                    {Array.from({length: q.totalAnswers || 0}).map((_, i) =>
                       i < (q.correctAnswers || 0) 
                       ? <span key={i} className="text-blue-500 font-bold text-base">○</span> 
                       : <span key={i} className="text-red-500 font-bold text-base">✕</span>
                    )}
                    <span className="font-semibold ml-1">({q.correctAnswers}/{q.totalAnswers})</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
