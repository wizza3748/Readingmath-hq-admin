
'use client';

import * as React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type MetacognitionData = {
  reliabilityScore: number;
  achievementScore: number;
  studentName: string;
};

type PredictionResult = {
  prediction: '확실해요' | '정답일 것 같아요' | '모르겠어요';
  result: '○' | '✕';
  count: number;
  description: string;
};

const sampleData: MetacognitionData = {
  reliabilityScore: 81,
  achievementScore: 83,
  studentName: '김선우',
};

const predictionResults: PredictionResult[] = [
  { prediction: '확실해요', result: '○', count: 10, description: '정답이라고 확신했고 실제로 충족한 문항' },
  { prediction: '확실해요', result: '✕', count: 2, description: '정답이라고 확신했으나 미충족한 문항' },
  { prediction: '정답일 것 같아요', result: '○', count: 8, description: '확신은 없었으나 충족한 문항' },
  { prediction: '정답일 것 같아요', result: '✕', count: 5, description: '확신 없이 미충족한 문항' },
  { prediction: '모르겠어요', result: '○', count: 2, description: '모른다고 판단했으나 충족한 문항' },
  { prediction: '모르겠어요', result: '✕', count: 1, description: '모른다고 판단했고 미충족한 문항' },
];

const DonutChart = ({
  score,
  label,
  unit,
}: {
  score: number;
  label: string;
  unit: '%' | '점';
}) => {
  const chartData = [
    { name: 'score', value: score },
    { name: 'remaining', value: 100 - score },
  ];

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{label}</h3>
      <div className="w-40 h-40 relative">
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
              <Cell fill="#3b82f6" />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-blue-600">
            {score}
            <span className="text-xl">{unit}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const getMatrixPosition = (achievement: number, reliability: number): string => {
  let row: 'A' | 'B' | 'C' | 'D';
  let col: 'A' | 'B' | 'C' | 'D';

  if (reliability === 100) row = 'A';
  else if (reliability >= 80) row = 'B';
  else if (reliability >= 60) row = 'C';
  else row = 'D';

  if (achievement === 100) col = 'A';
  else if (achievement >= 80) col = 'B';
  else if (achievement >= 60) col = 'C';
  else col = 'D';
  
  const colMap = { 'D': 'A', 'C': 'B', 'B': 'C', 'A': 'D'};
  
  const newCol = colMap[col]

  return `${row}${newCol}`;
};


const Matrix = ({ achievement, reliability }: { achievement: number; reliability: number }) => {
  const rows = [
    { label: '100', sections: ['AD', 'AC', 'AB', 'AA'] },
    { label: '~99', sections: ['BD', 'BC', 'BB', 'BA'] },
    { label: '~79', sections: ['CD', 'CC', 'CB', 'CA'] },
    { label: '~59', sections: ['DD', 'DC', 'DB', 'DA'] },
  ];
  const cols = ['~59', '~79', '~99', '100'];
  const userPosition = getMatrixPosition(achievement, reliability);

  return (
    <div className="flex-1">
      <div className="grid grid-cols-5">
        <div className="flex items-center justify-center font-semibold text-sm text-gray-500"></div>
        {cols.map((col, i) => (
          <div key={i} className="text-center font-semibold text-sm text-gray-500 py-1">{col}</div>
        ))}

        {rows.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            <div className="flex items-center justify-center font-semibold text-sm text-gray-500 pr-2">{row.label}</div>
            {row.sections.map((section) => (
              <div
                key={section}
                className={cn(
                  'flex items-center justify-center h-12 border border-gray-200 text-gray-600',
                  userPosition === section && 'bg-blue-600 text-white font-bold'
                )}
              >
                {section}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
       <p className="text-xs text-right mt-1 text-gray-500">■ 나의 위치 / 가로: 종합 성취도 점수 / 세로: 메타인지 신뢰도 점수</p>
    </div>
  );
};


const getTotalComment = (data: MetacognitionData): string => {
    const { studentName, achievementScore, reliabilityScore } = data;
    const matrixPosition = getMatrixPosition(achievementScore, reliabilityScore);
    const comments: Record<string, string> = {
        AD: `이 구간의 학생들은 자신의 학습 상태에 대한 인지가 정확하여 아는 것과 모르는 것에 대한 구별이 명확합니다. 헷갈리는 내용이더라도 모른다고 엄격하게 분류하기 때문에 완전한 이해를 지향한다고 볼 수 있습니다.`,
        AC: `이 구간의 학생들은 자신의 학습 상태에 대한 인지가 정확하여 아는 것과 모르는 것에 대한 구별이 명확합니다. 헷갈리는 내용이더라도 모른다고 엄격하게 분류하기 때문에 완전한 이해를 지향한다고 볼 수 있습니다.`,
        AB: `이 구간의 학생들은 자신의 학습 상태에 대한 인지가 정확하여 아는 것과 모르는 것에 대한 구별이 명확합니다. 헷갈리는 내용이더라도 모른다고 엄격하게 분류하기 때문에 완전한 이해를 지향한다고 볼 수 있습니다.`,
        AA: `이 구간의 학생들은 또래에 비해 우수한 지적 수준에, 지식에 대한 확신감까지 갖고 있기 때문에 학습적으로 자신감이 넘칩니다. 자만하지 않고 해결과정에서 실수하는 부분이 없도록 주의할 필요가 있습니다.`,
        BD: `이 구간의 학생들은 학습 상태에 대한 점검의 정확도가 양호한 편입니다. 이 구간의 학생들은 학습할 동기와 목표만 설정할 수 있다면 가시적인 성과를 낼 잠재력을 가지고 있습니다.`,
        BC: `이 구간의 학생들은 학습 상태에 대한 점검의 정확도가 양호한 편입니다. 이 구간의 학생들은 학습할 동기와 목표만 설정할 수 있다면 가시적인 성과를 낼 잠재력을 가지고 있습니다.`,
        BB: `이 구간의 학생들은 학습 상태에 대한 점검의 정확도가 양호한 편입니다. 이 구간의 학생들은 학습할 동기와 목표만 설정할 수 있다면 가시적인 성과를 낼 잠재력을 가지고 있습니다.`,
        BA: `이 구간의 학생들은 문제 상황을 수학적으로 이해하고 해결하는 수리문해력을 갖추고 있습니다. 하지만 학습 상태에 대한 점검에는 일부 오류가 있다는 점을 간과해서는 안 됩니다.`,
        CD: `이 구간의 학생들은 학습 상태에 대한 점검의 정확도가 낮은 편입니다. 정답이라는 확신 없이 정답을 고른 문항 또는 정답이라는 확신을 가지고 오답을 고른 문항이 다수 있습니다.`,
        CC: `이 구간의 학생들은 학습 상태에 대한 점검의 정확도가 낮은 편입니다. 정답이라는 확신 없이 정답을 고른 문항 또는 정답이라는 확신을 가지고 오답을 고른 문항이 다수 있습니다.`,
        CB: `이 구간의 학생들은 학습 상태에 대한 점검의 정확도가 낮은 편입니다. 정답이라는 확신 없이 정답을 고른 문항 또는 정답이라는 확신을 가지고 오답을 고른 문항이 다수 있습니다.`,
        CA: `이 구간의 학생들은 문제 상황을 수학적으로 이해하고 해결하는 수리문해력을 갖추고 있습니다. 정답이라는 확신 없이 정답을 고른 문항 또는 정답이라는 확신을 가지고 오답을 고른 문항이 다수 있습니다.`,
        DD: `이 구간의 학생들은 자신의 학습 상태를 정확하게 평가하고 점검하는 것에 익숙하지 않습니다. 학습 상태의 인지에 오류가 있을 가능성이 높습니다.`,
        DC: `이 구간의 학생들은 자신의 학습 상태를 정확하게 평가하고 점검하는 것에 익숙하지 않습니다. 학습 상태의 인지에 오류가 있을 가능성이 높습니다.`,
        DB: `이 구간의 학생들은 자신의 학습 상태를 정확하게 평가하고 점검하는 것에 익숙하지 않습니다. 학습 상태의 인지에 오류가 있을 가능성이 높습니다.`,
        DA: `이 구간의 학생들은 문제 상황을 수학적으로 이해하고 해결하는 수리문해력을 갖추고 있습니다. 하지만 정답이라고 확신하지 못하고 정답을 맞힌 문항이 상당히 많습니다. 학습 상태가 불완전할 가능성도 있으며 자신감이 부족하여 자신의 학습 상태를 긍정적으로 평가하지 못할 가능성도 있습니다.`,
    };

    const mainComment = comments[matrixPosition] || "총평을 불러올 수 없습니다.";
    
    const intro = `${studentName} 학생의 종합 성취도는 ${achievementScore}점이며, 메타인지 신뢰도는 ${reliabilityScore}%으로 ${matrixPosition}구간에 해당합니다.`;

    return `${intro}\n\n${mainComment}`;
};


export function ReportPage5() {
  const comment = getTotalComment(sampleData);

  return (
    <div className="bg-white p-12 md:p-16 w-full max-w-4xl shadow-lg relative print:shadow-none page-break" style={{ aspectRatio: '210 / 297' }}>
      <h2 className="text-lg font-bold text-gray-800 border-l-4 border-primary pl-3">메타인지 신뢰도 평가 결과</h2>
      
      <div className="mt-4 flex items-center gap-8">
        <Card className="flex-1">
          <CardContent className="p-6 flex justify-around">
            <DonutChart score={sampleData.reliabilityScore} label="메타인지 신뢰도" unit="%" />
            <DonutChart score={sampleData.achievementScore} label="종합 성취도" unit="점" />
          </CardContent>
        </Card>
        <Matrix achievement={sampleData.achievementScore} reliability={sampleData.reliabilityScore} />
      </div>

      <div className="mt-8">
         <h3 className="text-base font-bold text-gray-700 mb-2">정답예측도 결과</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[140px] text-center">정답예측도</TableHead>
                <TableHead className="w-[80px] text-center">결과</TableHead>
                <TableHead className="w-[100px] text-center">해당문제수</TableHead>
                <TableHead>설명</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predictionResults.map((row, index) => (
                <TableRow key={index}>
                  {index % 2 === 0 && (
                    <TableCell rowSpan={2} className="font-semibold text-center align-middle border-r">
                      {row.prediction}
                    </TableCell>
                  )}
                  <TableCell className="text-center font-bold text-lg">
                    <span className={row.result === '○' ? 'text-blue-500' : 'text-red-500'}>
                        {row.result}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{row.count}</TableCell>
                  <TableCell className="text-sm text-gray-600">{row.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-base font-bold text-gray-700 mb-2">총평</h3>
        <Card>
            <CardContent className="p-6 text-sm whitespace-pre-wrap">
                {comment}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
