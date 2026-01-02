
'use client';

import * as React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ContentAreaData = {
  name: '물리' | '생명과학' | '지구과학' | '화학';
  avgScore: number;
  correctQuestions: number;
  totalQuestions: number;
  objectiveCount: number;
  descriptiveCount: number;
};

type QuestionResult = {
  number: number;
  contentArea: string;
  unitName: string;
  type: '객관식' | '서술형';
  result: '○' | '△' | '✕';
  difficulty: '하' | '중하' | '중' | '중상' | '상';
};

const sampleContentAreas: ContentAreaData[] = [
    { name: '물리', avgScore: 80, correctQuestions: 5, totalQuestions: 7, objectiveCount: 5, descriptiveCount: 2 },
    { name: '생명과학', avgScore: 92, correctQuestions: 20, totalQuestions: 21, objectiveCount: 15, descriptiveCount: 6 },
];

const sampleQuestionResults: QuestionResult[] = [
    { number: 1, contentArea: '물리', unitName: '(1) 물체를 밀거나 당기기, 수평잡기', type: '객관식', result: '○', difficulty: '하' },
    { number: 2, contentArea: '물리', unitName: '(2) 물체의 무게 측정과 도구의 이용', type: '객관식', result: '○', difficulty: '중하' },
    { number: 3, contentArea: '물리', unitName: '(2) 물체의 무게 측정과 도구의 이용', type: '객관식', result: '○', difficulty: '중' },
    { number: 4, contentArea: '물리', unitName: '(2) 물체의 무게 측정과 도구의 이용', type: '객관식', result: '○', difficulty: '중상' },
    { number: 5, contentArea: '물리', unitName: '(2) 물체의 무게 측정과 도구의 이용', type: '객관식', result: '✕', difficulty: '상' },
    { number: 6, contentArea: '물리', unitName: '(2) 물체의 무게 측정과 도구의 이용', type: '서술형', result: '△', difficulty: '중상' },
    { number: 7, contentArea: '물리', unitName: '(2) 물체의 무게 측정과 도구의 이용', type: '서술형', result: '○', difficulty: '상' },
    { number: 8, contentArea: '생명과학', unitName: '(1) 우리 주변의 동물', type: '객관식', result: '○', difficulty: '하' },
    { number: 9, contentArea: '생명과학', unitName: '(2) 동물의 사는 곳에 따른 특징', type: '객관식', result: '○', difficulty: '중하' },
    { number: 10, contentArea: '생명과학', unitName: '(2) 동물의 사는 곳에 따른 특징', type: '객관식', result: '○', difficulty: '중' },
    { number: 11, contentArea: '생명과학', unitName: '(2) 동물의 사는 곳에 따른 특징', type: '객관식', result: '○', difficulty: '중상' },
    { number: 12, contentArea: '생명과학', unitName: '(1) 우리 주변의 동물', type: '객관식', result: '✕', difficulty: '상' },
    { number: 13, contentArea: '생명과학', unitName: '(1) 우리 주변의 동물', type: '서술형', result: '△', difficulty: '중상' },
    { number: 14, contentArea: '생명과학', unitName: '(2) 동물의 사는 곳에 따른 특징', type: '서술형', result: '○', difficulty: '상' },
    { number: 15, contentArea: '생명과학', unitName: '(1) 우리 주변의 식물', type: '객관식', result: '○', difficulty: '하' },
    { number: 16, contentArea: '생명과학', unitName: '(2) 식물의 사는 곳에 따른 특징', type: '객관식', result: '○', difficulty: '중하' },
    { number: 17, contentArea: '생명과학', unitName: '(2) 식물의 사는 곳에 따른 특징', type: '객관식', result: '○', difficulty: '중' },
    { number: 18, contentArea: '생명과학', unitName: '(2) 식물의 사는 곳에 따른 특징', type: '객관식', result: '○', difficulty: '중상' },
    { number: 19, contentArea: '생명과학', unitName: '(2) 식물의 사는 곳에 따른 특징', type: '객관식', result: '✕', difficulty: '상' },
    { number: 20, contentArea: '생명과학', unitName: '(1) 우리 주변의 식물', type: '서술형', result: '△', difficulty: '중상' },
    { number: 21, contentArea: '생명과학', unitName: '(2) 식물의 사는 곳에 따른 특징', type: '서술형', result: '○', difficulty: '상' },
    { number: 22, contentArea: '생명과학', unitName: '(1) 여러 가지 생물의 한살이(1)', type: '객관식', result: '○', difficulty: '하' },
    { number: 23, contentArea: '생명과학', unitName: '(2) 여러 가지 생물의 한살이(2)', type: '객관식', result: '○', difficulty: '중하' },
    { number: 24, contentArea: '생명과학', unitName: '(2) 여러 가지 생물의 한살이(2)', type: '객관식', result: '○', difficulty: '중' },
    { number: 25, contentArea: '생명과학', unitName: '(2) 여러 가지 생물의 한살이(2)', type: '객관식', result: '○', difficulty: '중상' },
    { number: 26, contentArea: '생명과학', unitName: '(2) 여러 가지 생물의 한살이(2)', type: '객관식', result: '✕', difficulty: '상' },
    { number: 27, contentArea: '생명과학', unitName: '(2) 여러 가지 생물의 한살이(2)', type: '서술형', result: '△', difficulty: '중상' },
    { number: 28, contentArea: '생명과학', unitName: '(2) 여러 가지 생물의 한살이(2)', type: '서술형', result: '○', difficulty: '상' },
];

const COLORS: { [key in ContentAreaData['name']]: string } = {
  물리: '#3b82f6',
  생명과학: '#10b981',
  지구과학: '#8b5cf6',
  화학: '#f97316',
};

const GaugeChart = ({ data }: { data: ContentAreaData }) => {
    const chartData = [
        { name: 'score', value: data.avgScore },
        { name: 'remaining', value: 100 - data.avgScore },
    ];

    return (
        <Card className="flex-1">
            <CardContent className="p-4 flex flex-col items-center justify-center">
                 <div style={{ width: '150px', height: '150px', position: 'relative' }}>
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
                                <Cell fill={COLORS[data.name]} />
                                <Cell fill="#e5e7eb" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-sm font-semibold" style={{ color: COLORS[data.name] }}>{data.name}</span>
                        <span className="text-3xl font-bold" style={{ color: COLORS[data.name] }}>{data.avgScore}%</span>
                    </div>
                </div>
                <div className="text-center mt-3">
                    <p className="text-sm text-gray-500">{`${data.avgScore}점 / 100점`}</p>
                    <p className="text-sm font-semibold">{`정답 ${data.correctQuestions} / 전체 ${data.totalQuestions}`}</p>
                    <p className="text-xs text-gray-400 mt-1">{`객관식 ${data.objectiveCount}문항 · 서술형 ${data.descriptiveCount}문항`}</p>
                </div>
            </CardContent>
        </Card>
    );
};

export function ReportPage3() {
    return (
        <div className="bg-white p-12 md:p-16 w-full max-w-4xl shadow-lg relative print:shadow-none page-break" style={{aspectRatio: '210 / 297'}}>
            {/* 내용 영역별 성취도 요약 */}
            <div>
                <h2 className="text-lg font-bold text-gray-800 border-l-4 border-primary pl-3">내용 영역별 평가 결과</h2>
                <div className="mt-4 flex gap-4">
                    {sampleContentAreas.map((area) => (
                        <GaugeChart key={area.name} data={area} />
                    ))}
                </div>
            </div>
            
            {/* 문항별 세부 결과 요약 */}
            <div className="mt-8">
                <div className="rounded-md border max-h-[520px] overflow-y-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-gray-50 z-10">
                            <TableRow>
                                <TableHead className="w-[60px] text-center">번호</TableHead>
                                <TableHead className="w-[100px]">내용 영역</TableHead>
                                <TableHead>중단원 유형</TableHead>
                                <TableHead className="w-[80px]">결과</TableHead>
                                <TableHead className="w-[80px]">난이도</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sampleQuestionResults.map((row) => (
                                <TableRow key={row.number}>
                                    <TableCell className="text-center">{row.number}</TableCell>
                                    <TableCell>{row.contentArea}</TableCell>
                                    <TableCell>{row.unitName}</TableCell>
                                    <TableCell className={
                                        row.result === '○' ? 'text-blue-500' : 
                                        row.result === '△' ? 'text-green-500' : 'text-red-500'
                                    }>{row.result}</TableCell>
                                    <TableCell>{row.difficulty}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            {/* 결과 표시 기준 */}
            <div className="mt-4 text-center text-xs text-gray-500">
                <span>○ 풀이 과정 전체 정답</span>
                <span className="mx-2">/</span>
                <span>△ 풀이 과정 70% 이상 정답</span>
                <span className="mx-2">/</span>
                <span>✕ 풀이 과정 70% 미만 정답</span>
            </div>
        </div>
    );
}
