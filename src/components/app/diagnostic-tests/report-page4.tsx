
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
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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
    const domains: BehavioralDomain[] = ['개념이해력', '문제해결력', '문해력', '추론력'];
    const types: ('객관식' | '서술형')[] = ['객관식', '서술형'];
    const results: ('correct' | 'incorrect' | 'partial')[] = ['correct', 'incorrect', 'partial'];
    
    const isDescriptive = (i + 1) % 7 === 6 || (i + 1) % 7 === 0;

    return {
        number: i + 1,
        behavioralDomain: domains[i % 4],
        type: isDescriptive ? '서술형' : '객관식',
        result: isDescriptive ? results[(i % 3)] : (i % 5 === 4 ? 'incorrect' : 'correct'),
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
      개념이해력: '개념의 뜻은 알지만 연결이 약한 상태입니다. 원인과 결과 중심으로 개념을 정리하며 말·그림·기호로 바꿔 표현하는 연습이 필요합니다.',
      문제해결력: '문제를 끝까지 읽지 않아 실수가 잦습니다. 조건 확인→원리 선택→계산·검토의 3단계 풀이와 짧은 재검토 습관이 필요합니다.',
      문해력: '조건이나 질문의 핵심을 놓치기 쉽습니다. 구하는 것과 조건을 먼저 찾고, 그래프 변화는 말로 설명한 뒤 풀이하는 연습이 필요합니다.',
      추론력: '결과 설명은 가능하나 근거 제시가 부족합니다. 자료 근거와 결론을 나눠 설명하고, 실험에서는 변인을 구분하는 연습이 필요합니다.',
    },
    2: {
        개념이해력: '개념은 알지만 사용 시점이 헷갈립니다. 비슷한 개념을 비교해 사용 조건을 정리하고 단원 흐름을 연결하는 학습이 필요합니다.',
        문제해결력: '풀이에 시간이 오래 걸리거나 실수가 있습니다. 고정된 풀이 순서를 익히고 자주 틀리는 문제를 반복 점검하는 것이 효과적입니다.',
        문해력: '중요한 조건을 놓치거나 질문을 혼동합니다. 무엇을 구하는지와 조건에 표시하며 그래프를 한 문장으로 요약하는 연습이 필요합니다.',
        추론력: '정답은 맞혀도 설명이 약합니다. 근거와 결론을 말로 연결하고 실험 문제에서는 변하는 것과 유지되는 것을 구분해야 합니다.',
    },
    3: {
        개념이해력: '핵심 개념은 알지만 우선순위 판단에 시간이 걸립니다. 예외 조건까지 정리하고 가장 중요한 개념을 먼저 찾는 연습이 필요합니다.',
        문제해결력: '계산이나 단위 변환에서 실수가 발생합니다. 식 세우기→단위 확인→어림 계산→정확 계산의 순서를 습관화해야 합니다.',
        문해력: '긴 지문에서 조건이나 기준을 놓칩니다. 구하는 것·비교 기준·예외 조건·단위를 체크하며 그래프를 요약하는 연습이 필요합니다.',
        추론력: '근거 설명이 부족해 서술형 감점이 있습니다. 관찰→원리→결론의 구조로 답안을 정리하는 연습이 필요합니다.',
    },
    4: {
        개념이해력: '여러 개념 중 필요한 것을 고르는 데 시간이 걸립니다. 핵심 개념과 보조 개념을 빠르게 구분하는 연습이 필요합니다.',
        문제해결력: '시간 압박 시 검토 부족으로 실수가 생깁니다. 단위와 수의 크기를 확인하는 2단 검토 습관이 중요합니다.',
        문해력: '비교 표현이나 조건 문장을 놓치기 쉽습니다. 지문 속 핵심 표현을 표시하고 근거를 기준으로 판단하는 습관이 필요합니다.',
        추론력: '결론 위주로 서술해 감점됩니다. 자료 근거→적용 원리→결론의 구조로 답안을 완성하는 연습이 필요합니다.',
    },
    5: {
        개념이해력: '개념 이해는 높으나 낯선 유형에서 예외를 놓칠 수 있습니다. 성립 조건과 함께 개념을 정리하는 연습이 필요합니다.',
        문제해결력: '단순 계산이나 단위 실수로 감점됩니다. 단위 확인과 정답 범위 예측을 습관화해 완성도를 높여야 합니다.',
        문해력: '부정·비교·예외 조건을 놓칠 수 있습니다. 문제의 위험 요소를 표시하고 그래프 해석 순서를 지키는 연습이 중요합니다.',
        추론력: '서술형에서 과정 생략으로 논리가 약해집니다. 근거→원리→결론 구조를 지키고 표현을 정확히 구분해야 합니다.',
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
         <div className="flex justify-end items-center gap-4 text-xs mb-2">
            <div className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> 오답</div>
            <div className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-yellow-500" /> 부분정답</div>
            <div className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> 정답</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {sampleQuestionResults.map(q => (
            <div key={q.number} className="border rounded-md p-2 text-center text-xs space-y-1">
              <div className="font-bold text-sm">{q.number}번</div>
              <div className="text-gray-500">{q.behavioralDomain}</div>
              <div className="text-gray-500">{q.type}</div>
              <div className="h-5 flex items-center justify-center">
                {q.type === '객관식' ? (
                  q.result === 'correct' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <div className="flex items-center gap-1">
                    {Array.from({length: q.totalAnswers || 0}).map((_, i) =>
                       i < (q.correctAnswers || 0) ? <CheckCircle key={i} className="w-3 h-3 text-green-500" /> : <XCircle key={i} className="w-3 h-3 text-red-500" />
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

    