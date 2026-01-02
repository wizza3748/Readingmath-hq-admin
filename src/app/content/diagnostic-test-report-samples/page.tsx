
'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

const ReportLogo = () => (
    <svg width="140" height="24" viewBox="0 0 145 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.136 12.556H9.016V15.796H12.136V12.556Z" fill="#673AB7"/>
        <path d="M19.1469 12.556H15.9069V15.796H19.1469V12.556Z" fill="#673AB7"/>
        <path d="M12.136 8.356H9.016V11.596H12.136V8.356Z" fill="#673AB7"/>
        <path d="M19.1469 8.356H15.9069V11.596H19.1469V8.356Z" fill="#673AB7"/>
        <path d="M24.8999 17.5V7.16H22.3959V17.5H24.8999Z" fill="#1A237E"/>
        <path d="M30.4193 14.164C30.4193 14.884 30.2393 15.484 29.8793 15.964C29.5193 16.444 28.9793 16.828 28.2593 17.116C27.5393 17.404 26.6913 17.548 25.7153 17.548H22.4113V7.16H25.7153C26.6913 7.16 27.5393 7.304 28.2593 7.592C28.9793 7.88 29.5193 8.264 29.8793 8.744C30.2393 9.224 30.4193 9.824 30.4193 10.544C30.4193 11.048 30.2993 11.5 30.0593 11.9C29.8193 12.3 29.4753 12.632 29.0273 12.896C29.6193 13.192 30.0753 13.608 30.3953 14.144L30.4193 14.164ZM27.9113 10.492C27.9113 10.108 27.8153 9.784 27.6233 9.52C27.4313 9.256 27.1193 9.064 26.6873 8.944C26.2553 8.824 25.6913 8.764 24.9953 8.764H24.8993V11.416H25.0433C25.7393 11.416 26.2993 11.356 26.7233 11.236C27.1473 11.116 27.4633 10.916 27.6713 10.636C27.8793 10.356 27.9113 10.228 27.9113 10.492ZM28.0073 14.284C28.0073 13.984 27.9113 13.712 27.7193 13.468C27.5273 13.224 27.2153 13.048 26.7833 12.94C26.3513 12.832 25.7593 12.778 25.0073 12.778H24.8993V15.94H25.1393C25.8673 15.94 26.4553 15.868 26.9033 15.724C27.3513 15.58 27.6873 15.348 27.9113 15.028C28.0913 14.74 28.0073 14.548 28.0073 14.284Z" fill="#1A237E"/>
        <path d="M37.893 12.424V7.16H35.389V17.5H37.893V13.84H40.833V17.5H43.337V7.16H40.833V11.224H37.893V12.424Z" fill="#1A237E"/>
        <path d="M50.2195 7.16L46.5435 14.128L46.4955 14.056V7.16H43.9915V17.5H46.4955V10.744L50.1715 17.5H52.5395V7.16H50.0355V13.792L46.5435 7.336L50.2195 7.16Z" fill="#1A237E"/>
        <path d="M54.8516 17.5V7.16H52.3476V17.5H54.8516Z" fill="#1A237E"/>
        <path d="M62.0625 15.016L64.2185 7.16H66.8585L63.5345 17.5H60.9185L57.5945 7.16H60.2345L62.0625 15.016Z" fill="#1A237E"/>
        <path d="M72.2475 7.16V8.98H68.8355V17.5H66.3315V8.98H62.9195V7.16H72.2475Z" fill="#1A237E"/>
        <path d="M83.4735 15.016L85.6295 7.16H88.2695L84.9455 17.5H82.3295L78.9935 7.16H81.6455L83.4735 15.016Z" fill="#1A237E"/>
        <path d="M94.6295 17.5H92.0135L89.6935 13.888L87.3735 17.5H84.7575L88.5895 12.064L85.0455 7.16H87.7335L89.6935 10.432L91.6535 7.16H94.3415L90.7975 12.064L94.6295 17.5Z" fill="#1A237E"/>
        <path d="M102.502 12.508C102.502 14.188 102.018 15.448 101.05 16.288C100.082 17.128 98.786 17.548 97.162 17.548C95.538 17.548 94.242 17.128 93.274 16.288C92.306 15.448 91.822 14.188 91.822 12.508V12.088C91.822 10.384 92.306 9.124 93.274 8.308C94.242 7.492 95.538 7.084 97.162 7.084C98.786 7.084 100.082 7.492 101.05 8.308C102.018 9.124 102.502 10.384 102.502 12.088V12.508ZM99.982 12.088C99.982 11.008 99.666 10.204 99.034 9.676C98.402 9.148 97.838 8.884 97.342 8.884C96.63 8.884 96.054 9.148 95.614 9.676C95.174 10.204 94.954 11.008 94.954 12.088V12.508C94.954 13.588 95.174 14.392 95.614 14.92C96.054 15.448 96.63 15.712 97.342 15.712C97.838 15.712 98.402 15.448 99.034 14.92C99.666 14.392 99.982 13.588 99.982 12.508V12.088Z" fill="#1A237E"/>
        <path d="M109.845 7.16L106.169 14.128L106.121 14.056V7.16H103.617V17.5H106.121V10.744L109.797 17.5H112.165V7.16H109.661V13.792L106.169 7.336L109.845 7.16Z" fill="#1A237E"/>
        <path d="M120.407 15.016L122.563 7.16H125.203L121.879 17.5H119.263L115.927 7.16H118.579L120.407 15.016Z" fill="#1A237E"/>
        <path d="M131.455 17.5H128.839L126.519 13.888L124.199 17.5H121.583L125.415 12.064L121.871 7.16H124.559L126.519 10.432L128.479 7.16H131.167L127.623 12.064L131.455 17.5Z" fill="#1A237E"/>
        <path d="M138.766 12.508C138.766 14.188 138.282 15.448 137.314 16.288C136.346 17.128 135.05 17.548 133.426 17.548C131.802 17.548 130.506 17.128 129.538 16.288C128.57 15.448 128.086 14.188 128.086 12.508V12.088C128.086 10.384 128.57 9.124 129.538 8.308C130.506 7.492 131.802 7.084 133.426 7.084C135.05 7.084 136.346 7.492 137.314 8.308C138.282 9.124 138.766 10.384 138.766 12.088V12.508ZM136.246 12.088C136.246 11.008 135.93 10.204 135.298 9.676C134.666 9.148 134.102 8.884 133.606 8.884C132.894 8.884 132.318 9.148 131.878 9.676C131.438 10.204 131.218 11.008 131.218 12.088V12.508C131.218 13.588 131.438 14.392 131.878 14.92C132.318 15.448 132.894 15.712 133.606 15.712C134.102 15.712 134.666 15.448 135.298 14.92C135.93 14.392 136.246 13.588 136.246 12.508V12.088Z" fill="#1A237E"/>
        <path d="M144.331 7.16L142.127 15.076L139.923 7.16H137.283L140.959 17.5H143.503L147.179 7.16H144.331Z" fill="#1A237E"/>
    </svg>
);

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
                    <ReportLogo />
                </div>
                
                {/* 배경 심볼 */}
                <MathSymbols />
            </div>
        </div>
    );
}

