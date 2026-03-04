"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, FileText, Search, Info, Bell, Menu, HelpCircle } from "lucide-react";

export default function TrainingResultPage() {
    const router = useRouter();

    const handleSolveMore = () => {
        router.push("/content/exam-prep?from=solveMore");
    };

    const results = [
        { step: "1단계 문장 완성하기", score: "C", correct: 4, total: 8, rate: "50%" },
        { step: "2단계 답안 완성하기", score: "A", correct: 9, total: 10, rate: "90%" },
        { step: "3단계 탐구활동 보고서 만들기", score: "B", correct: 4, total: 5, rate: "80%" },
    ];

    return (
        <div className="min-h-screen bg-[#f1f3ff] flex flex-col font-sans select-none">
            {/* 상단 네비바 (이미지 2 참고) */}
            <header className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-2">
                    <img src="https://readingmath.co.kr/build/assets/logo-b2c89286.svg" alt="logo" className="h-6" />
                    <span className="font-bold text-gray-700">진순이</span>
                </div>
                <div className="flex items-center gap-4 text-gray-400">
                    <HelpCircle className="w-5 h-5" />
                    <Bell className="w-5 h-5" />
                    <Search className="w-5 h-5" />
                    <Menu className="w-5 h-5" />
                </div>
            </header>

            <main className="flex-1 p-6 flex flex-col gap-6 max-w-6xl mx-auto w-full">
                {/* 결과 요약 바 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col gap-2">
                        <div className="text-sm text-gray-500 font-bold flex items-center gap-1">
                            (1) 순물질과 혼합물, 녹는점과 어는점, 끓는점 &gt; 서술형 훈련 <span className="text-gray-300 ml-2">ROUND 1</span>
                        </div>
                        <div className="flex items-center gap-6 mt-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-400">훈련 완료 일시</span>
                                <span className="text-sm font-black text-gray-700">2026-03-03 15:41</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-400">훈련 소요 시간</span>
                                <span className="text-sm font-black text-gray-700">01:31</span>
                            </div>
                            <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-black border border-green-100">
                                ✓ 기준 시간내에 풀었어요.
                            </div>
                        </div>
                    </div>
                </div>

                {/* 메인 결과 테이블 */}
                <div className="flex gap-6 items-stretch h-[450px]">
                    {/* 왼쪽 캐릭터 카드 */}
                    <div className="w-[180px] bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-4 p-6 shrink-0">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full animate-pulse" />
                            <img
                                src="https://readingmath.co.kr/build/assets/alien_8-1-343222e3.svg"
                                alt="Character"
                                className="w-24 h-24 relative z-10"
                            />
                        </div>
                        <div className="text-2xl font-black text-gray-800 tracking-tight">Good!</div>
                    </div>

                    {/* 오른쪽 테이블 */}
                    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="grid grid-cols-5 bg-gray-50/50 border-b border-gray-100 h-14 items-center px-8 text-sm font-bold text-gray-400 text-center">
                            <div>학습 구분</div>
                            <div>학습 점수</div>
                            <div>정답수</div>
                            <div>문제수</div>
                            <div>정답률</div>
                        </div>
                        <div className="flex-1 divide-y divide-gray-50">
                            {results.map((res, i) => (
                                <div key={i} className="grid grid-cols-5 h-[100px] items-center px-8 text-center">
                                    <div className="text-[17px] font-black text-gray-600 text-left">{res.step}</div>
                                    <div className="flex justify-center">
                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center font-black text-white ${res.score === 'A' ? 'bg-green-400' : res.score === 'B' ? 'bg-yellow-400' : 'bg-gray-400'
                                            }`}>
                                            {res.score}
                                        </div>
                                    </div>
                                    <div className="text-[20px] font-black text-gray-700">{res.correct}</div>
                                    <div className="text-[20px] font-black text-gray-700">{res.total}</div>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-[20px] font-black text-gray-700">{res.rate}</span>
                                        <Search className="w-5 h-5 text-gray-300 cursor-pointer hover:text-gray-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* 합계 영역 */}
                        <div className="bg-gray-100/30 grid grid-cols-5 h-20 items-center px-8 text-center border-t border-gray-100">
                            <div className="text-base font-black text-gray-400">전체</div>
                            <div></div>
                            <div className="text-[22px] font-black text-gray-700">17</div>
                            <div className="text-[22px] font-black text-gray-700">23</div>
                            <div className="text-[22px] font-black text-indigo-600">74%</div>
                        </div>
                    </div>
                </div>

                {/* 하단 한줄 평 영역 */}
                <div className="bg-[#f8f9ff] border-2 border-indigo-100 rounded-xl p-5 flex items-start gap-4">
                    <img
                        src="https://readingmath.co.kr/build/assets/alien_8-1-343222e3.svg"
                        alt="Bot"
                        className="w-12 h-12 bg-white rounded-full p-2 border border-indigo-50"
                    />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-700 leading-relaxed">
                            진순이님의 서술형 훈련 결과는 100점 만점 중 74점입니다.<br />
                            문제에서 요구하는 답이 무엇인지 정확히 파악한 후에 문제에 맞는 단원의 개념을 끌어 오세요. 문제를 주의 깊게 생각하면서 읽으면 문제 해결에 필요한 힌트가 보입니다.
                        </p>
                    </div>
                </div>

                {/* 하단 버튼 영역 */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="default"
                        className="bg-[#0091ff] hover:bg-[#007ceb] text-white px-6 h-12 rounded-lg font-black flex items-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        홈으로
                    </Button>
                    <Button
                        variant="secondary"
                        className="bg-[#5a647d] hover:bg-[#4a546d] text-white px-6 h-12 rounded-lg font-black flex items-center gap-2"
                    >
                        <FileText className="w-5 h-5" />
                        오답노트 확인하기
                    </Button>

                    {/* 문제 더 풀기 버튼 (본 작업 대상) */}
                    <Button
                        onClick={handleSolveMore}
                        className="ml-auto bg-white border-2 border-[#2b44aa] text-[#2b44aa] hover:bg-blue-50 px-8 h-12 rounded-lg font-black transition-all active:scale-95 shadow-sm"
                    >
                        문제 더 풀기
                    </Button>
                </div>
            </main>
        </div>
    );
}
