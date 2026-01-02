
'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

const MathSymbols = () => (
    <div className="absolute right-12 bottom-20 flex flex-col items-center space-y-8 opacity-10">
      <span className="text-8xl font-thin text-gray-400">+</span>
      <span className="text-8xl font-thin text-gray-400">-</span>
      <span className="text-8xl font-thin text-gray-400">×</span>
      <span className="text-8xl font-thin text-gray-400">÷</span>
    </div>
  );

export default function DiagnosticTestReportSamplesPage() {
    const handlePrint = () => {
        window.print();
    };

    const studentName = "김선우";
    const grade = "초등 3학년 1학기";
    const testDate = "2025-12-17";

    return (
        <div className="bg-gray-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl flex justify-end mb-4">
                <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    인쇄하기
                </Button>
            </div>
            
            <div className="bg-white p-12 md:p-16 w-full max-w-4xl shadow-lg relative" style={{aspectRatio: '210 / 297'}}>
                {/* 상단 영역 */}
                <header className="flex justify-between items-center border-b pb-4">
                    <span className="text-sm text-gray-600">리딩과학으로 1등 과학 시작하기!</span>
                    <span className="text-sm text-gray-600 font-mono">readingmath.co.kr</span>
                </header>

                {/* 타이틀 영역 */}
                <div className="mt-20">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight">
                        {studentName} 님의
                    </h1>
                    <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight mt-2">
                        과학탐구력 종합진단평가
                    </h1>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mt-2">
                        보고서
                    </h1>
                </div>

                {/* 정보 영역 */}
                <div className="mt-16 space-y-3">
                    <div className="flex items-center">
                        <span className="inline-block w-20 text-lg font-semibold text-gray-500">학년</span>
                        <span className="text-lg font-semibold text-gray-800">{grade}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="inline-block w-20 text-lg font-semibold text-gray-500">평가일</span>
                        <span className="text-lg font-semibold text-gray-800">{testDate}</span>
                    </div>
                </div>

                {/* 하단 로고 */}
                <div className="absolute bottom-16 left-16">
                    <span className="text-xl font-bold text-gray-700">리딩수학과학</span>
                </div>
                
                {/* 배경 심볼 */}
                <MathSymbols />
            </div>
        </div>
    );
}
