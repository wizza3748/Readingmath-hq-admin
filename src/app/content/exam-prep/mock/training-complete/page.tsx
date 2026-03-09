"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default function TrainingCompletePage() {
    const router = useRouter();

    const handleSolveMore = () => {
        router.push("/content/exam-prep?from=solveMore");
    };

    return (
        <div className="min-h-screen bg-[#f1f3ff] flex flex-col items-center justify-center font-sans select-none p-6">
            <div className="max-w-xl w-full text-center flex flex-col items-center gap-6">

                {/* 훈련 완료 안내 */}
                <h1 className="text-[32px] font-black text-[#4f5b93] mb-2">
                    서술형 훈련을 완료했어요!
                </h1>
                <p className="text-[20px] font-bold text-[#6b77a1] opacity-80 mb-8">
                    (1) 순물질과 혼합물, 녹는점과 어는점, 끓는점의 서술형 훈련
                </p>

                {/* 캐릭터 영역 (Mock - 이미지 1 참고) */}
                <div className="relative w-[300px] h-[300px] flex items-center justify-center mb-4">
                    {/* 별 아이콘 (Mock) */}
                    <div className="absolute top-10 flex items-center justify-center opacity-30">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="#6b77a1">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                        </svg>
                    </div>
                    {/* 캐릭터 이미지 (임시) */}
                    <img
                        src="https://readingmath.co.kr/build/assets/alien_8-1-C9kW02q9.svg"
                        alt="Character"
                        className="w-[240px] h-[240px] relative z-10"
                    />
                    <div className="absolute bottom-10 text-[60px] font-black text-[#6b77a1]/10 tracking-widest uppercase">
                        CLEAR
                    </div>
                </div>

                {/* 자세히 보기 용 버튼 (이미지 1 참고) */}
                <Button className="bg-[#2b44aa] hover:bg-[#1e3490] text-white px-8 h-12 rounded-lg font-bold flex items-center gap-2 mb-8 shadow-lg shadow-blue-900/10">
                    <ChevronRight className="w-5 h-5 font-black" />
                    자세히 보기
                </Button>

                {/* 유형도전 버튼 (본 작업 대상) */}
                <Button
                    variant="outline"
                    onClick={handleSolveMore}
                    className="bg-white border-2 border-[#2b44aa] text-[#2b44aa] hover:bg-blue-50 hover:text-[#2b44aa] px-12 h-14 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-md"
                >
                    유형도전
                </Button>
            </div>
        </div>
    );
}
