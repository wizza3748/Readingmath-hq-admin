"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import {
    X,
    ChevronDown,
    ChevronUp,
    Info,
    Check,
    AlertCircle,
    RotateCcw,
    Play,
    Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import {
    AchievementColor,
    ACHIEVEMENT_THEME,
    ACHIEVEMENT_INFOS,
    EXAM_PREP_COLORS
} from "./constants/achievementTheme";
import { getAchievementKey, migrateAchievementFilter, getMockStatsByColor } from "./utils/achievementUtils";

type BucketType = "basic" | "skill" | "advanced";

interface TypeData {
    id: string;
    no: string;      // 신규 추가: 유형 번호 또는 축약 텍스트
    name: string;    // 상세 유형명
    bucket: BucketType;
    bucketLabel: string;
    isImportant: boolean;
    textbookTag: string;
    achievementColor: AchievementColor;
    hasProgress: boolean;
    progressMeta: {
        lastQuestionIndex: number;
    };
    needsMockColor?: boolean;
}

interface MidUnit {
    id: string;
    name: string;
    types: TypeData[];
}

interface BigUnit {
    id: string;
    name: string;
    midUnits: MidUnit[];
}


const applyMockColors = (types: TypeData[], bucket: BucketType, isUnit4: boolean) => {
    const total = types.length;
    if (total === 0) return;

    let whiteCount = 0;
    let grayWhiteCount = 0;

    for (let i = 0; i < total; i++) {
        const type = types[i];
        if (!type.needsMockColor) continue;

        const idNum = parseInt(type.no) || (i + 1);
        const ratio = (i + 1) / total;
        // 결정적 랜덤 (0~99)
        const seed = idNum * 17 + i * 13 + type.name.length * 7;
        const r = seed % 100;

        // [변경] 가짜 문제수/정답률 생성 후 공통 유틸로 색상 판정
        let solved = 0;
        let correct = 0;

        if (isUnit4) {
            // [예외 규칙] 4단원: 미진행/미판정 비중 높게
            if (r < 40) { // 40% 미진행
                solved = 0;
                correct = 0;
            } else if (r < 70) { // 30% 미판정
                solved = 1;
                correct = r % 2 === 0 ? 1 : 0;
            } else { // 30% 진행 (다양한 정답률)
                solved = 3;
                correct = r % 4; // 0~3
            }
        } else {
            // [일반 규칙] 골고루 분포
            if (r < 15) { // 15% 미진행
                solved = 0;
                correct = 0;
            } else if (r < 30) { // 15% 미판정
                solved = 1;
                correct = r % 2 === 0 ? 1 : 0;
            } else { // 70% 진행
                solved = 3;
                if (bucket === "basic") correct = 2 + (r % 2); // 2~3 (통과 위주)
                else if (bucket === "skill") correct = 1 + (r % 3); // 1~3
                else correct = r % 4; // 0~3
            }
        }

        let color = getAchievementKey(solved, correct, bucket);

        // [규칙 2 & 5] 1~5번 금지 및 basic Red 원천 차단
        if (idNum <= 5) {
            if (color === "gray" || color === "white") {
                color = bucket === "basic" ? "lime" : (bucket === "skill" ? "green" : "red");
            }
        }

        // basic은 Red 절대 금지 (안전장치 한 번 더)
        if (bucket === "basic" && color === "red") {
            color = "yellow";
        }

        type.achievementColor = color;
        if (color === "white") whiteCount++;
        if (color === "gray" || color === "white") grayWhiteCount++;
    }

    // [추가 규칙 3] 4단원 Gray+White 합 최소 60% 보장
    if (isUnit4) {
        const requiredGW = Math.ceil(total * 0.6);
        for (let i = total - 1; i >= 0 && grayWhiteCount < requiredGW; i--) {
            const type = types[i];
            if (!type.needsMockColor) continue;
            const idNum = parseInt(type.no) || (i + 1);

            if (idNum > 5 && type.achievementColor !== "gray" && type.achievementColor !== "white") {
                type.achievementColor = "gray";
                grayWhiteCount++;
            }
        }
    }

    // [추가 규칙 1] White 최소 1개 보장 (total >= 6 인 경우) 후반부에 넣기
    if (total >= 6 && whiteCount === 0) {
        for (let i = total - 1; i >= 0; i--) {
            const type = types[i];
            if (!type.needsMockColor) continue;

            const ratio = (i + 1) / total;
            const idNum = parseInt(type.no) || (i + 1);

            if (ratio > 0.70 && idNum > 5) {
                type.achievementColor = "white";
                break;
            }
        }
    }

    // [디버깅 로그] 사용자 요청 사항 확인용
    console.log(`[MockLog] Bucket: ${bucket}, Total: ${total}, Unit4: ${isUnit4}`);
    console.log(`[MockLog] Colors:`, types.map(t => `${t.no}:${t.achievementColor}`));
    if (isUnit4) {
        console.log(`[MockLog] Unit4 GW Ratio: ${((grayWhiteCount / total) * 100).toFixed(1)}%`);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 신규 시트 기반 정적 데이터 (빨간색 글씨 = 중요 유형)
// 키 형식: "시트명|중단원명|bucket|유형번호"
// ─────────────────────────────────────────────────────────────────────────────
const IMPORTANT_TYPE_KEYS = new Set<string>([
    // ── 1단원-물질의 특성 ──────────────────────────────────────────────────────
    // 중단원 1. 순물질과 혼합물, 녹는점과 어는점, 끓는점
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|basic|1",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|basic|2",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|basic|3",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|basic|6",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|3",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|4",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|5",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|6",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|10",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|13",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|14",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|skill|15",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|advanced|2",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|advanced|4",
    "1단원-물질의 특성|1. 순물질과 혼합물, 녹는점과 어는점, 끓는점|advanced|6",
    // 중단원 2. 밀도와 용해도
    "1단원-물질의 특성|2. 밀도와 용해도|basic|2",
    "1단원-물질의 특성|2. 밀도와 용해도|basic|3",
    "1단원-물질의 특성|2. 밀도와 용해도|basic|9",
    "1단원-물질의 특성|2. 밀도와 용해도|skill|4",
    "1단원-물질의 특성|2. 밀도와 용해도|skill|5",
    "1단원-물질의 특성|2. 밀도와 용해도|skill|6",
    "1단원-물질의 특성|2. 밀도와 용해도|skill|10",
    "1단원-물질의 특성|2. 밀도와 용해도|skill|14",
    "1단원-물질의 특성|2. 밀도와 용해도|advanced|1",
    "1단원-물질의 특성|2. 밀도와 용해도|advanced|2",
    "1단원-물질의 특성|2. 밀도와 용해도|advanced|5",
    "1단원-물질의 특성|2. 밀도와 용해도|advanced|6",
    // 중단원 3. 혼합물의 분리
    "1단원-물질의 특성|3. 혼합물의 분리|basic|1",
    "1단원-물질의 특성|3. 혼합물의 분리|basic|2",
    "1단원-물질의 특성|3. 혼합물의 분리|basic|3",
    "1단원-물질의 특성|3. 혼합물의 분리|basic|4",
    "1단원-물질의 특성|3. 혼합물의 분리|basic|5",
    "1단원-물질의 특성|3. 혼합물의 분리|skill|5",
    "1단원-물질의 특성|3. 혼합물의 분리|skill|9",
    "1단원-물질의 특성|3. 혼합물의 분리|skill|10",
    "1단원-물질의 특성|3. 혼합물의 분리|skill|11",
    "1단원-물질의 특성|3. 혼합물의 분리|skill|12",
    "1단원-물질의 특성|3. 혼합물의 분리|skill|14",
    "1단원-물질의 특성|3. 혼합물의 분리|advanced|1",
    "1단원-물질의 특성|3. 혼합물의 분리|advanced|4",
    "1단원-물질의 특성|3. 혼합물의 분리|advanced|5",
    "1단원-물질의 특성|3. 혼합물의 분리|advanced|6",

    // ── 2단원-지권의 변화 ──────────────────────────────────────────────────────
    // 중단원 1. 지구계와 지구 내부 구조
    "2단원-지권의 변화|1. 지구계와 지구 내부 구조|basic|1",
    "2단원-지권의 변화|1. 지구계와 지구 내부 구조|basic|6",
    "2단원-지권의 변화|1. 지구계와 지구 내부 구조|basic|7",
    "2단원-지권의 변화|1. 지구계와 지구 내부 구조|basic|8",
    "2단원-지권의 변화|1. 지구계와 지구 내부 구조|basic|9",
    "2단원-지권의 변화|1. 지구계와 지구 내부 구조|skill|1",
    "2단원-지권의 변화|1. 지구계와 지구 내부 구조|skill|5",
    "2단원-지권의 변화|1. 지구계와 지구 내부 구조|skill|9",
    "2단원-지권의 변화|1. 지구계와 지구 내부 구조|skill|10",
    "2단원-지권의 변화|1. 지구계와 지구 내부 구조|skill|11",
    "2단원-지권의 변화|1. 지구계와 지구 내부 구조|advanced|1",
    "2단원-지권의 변화|1. 지구계와 지구 내부 구조|advanced|4",
    // 중단원 2. 암석과 암석의 순환
    "2단원-지권의 변화|2. 암석과 암석의 순환|basic|1",
    "2단원-지권의 변화|2. 암석과 암석의 순환|basic|2",
    "2단원-지권의 변화|2. 암석과 암석의 순환|basic|3",
    "2단원-지권의 변화|2. 암석과 암석의 순환|basic|7",
    "2단원-지권의 변화|2. 암석과 암석의 순환|basic|8",
    "2단원-지권의 변화|2. 암석과 암석의 순환|basic|9",
    "2단원-지권의 변화|2. 암석과 암석의 순환|skill|1",
    "2단원-지권의 변화|2. 암석과 암석의 순환|skill|8",
    "2단원-지권의 변화|2. 암석과 암석의 순환|skill|9",
    "2단원-지권의 변화|2. 암석과 암석의 순환|advanced|1",
    "2단원-지권의 변화|2. 암석과 암석의 순환|advanced|4",
    // 중단원 3. 광물과 토양
    "2단원-지권의 변화|3. 광물과 토양|basic|1",
    "2단원-지권의 변화|3. 광물과 토양|basic|7",
    "2단원-지권의 변화|3. 광물과 토양|basic|8",
    "2단원-지권의 변화|3. 광물과 토양|basic|9",
    "2단원-지권의 변화|3. 광물과 토양|skill|4",
    "2단원-지권의 변화|3. 광물과 토양|skill|8",
    "2단원-지권의 변화|3. 광물과 토양|skill|10",
    "2단원-지권의 변화|3. 광물과 토양|skill|11",
    "2단원-지권의 변화|3. 광물과 토양|skill|12",
    "2단원-지권의 변화|3. 광물과 토양|advanced|1",
    "2단원-지권의 변화|3. 광물과 토양|advanced|2",
    "2단원-지권의 변화|3. 광물과 토양|advanced|3",
    "2단원-지권의 변화|3. 광물과 토양|advanced|4",
    // 중단원 4. 지권의 운동
    "2단원-지권의 변화|4. 지권의 운동|basic|1",
    "2단원-지권의 변화|4. 지권의 운동|basic|4",
    "2단원-지권의 변화|4. 지권의 운동|basic|5",
    "2단원-지권의 변화|4. 지권의 운동|basic|6",
    "2단원-지권의 변화|4. 지권의 운동|basic|7",
    "2단원-지권의 변화|4. 지권의 운동|basic|8",
    "2단원-지권의 변화|4. 지권의 운동|basic|9",
    "2단원-지권의 변화|4. 지권의 운동|skill|1",
    "2단원-지권의 변화|4. 지권의 운동|skill|5",
    "2단원-지권의 변화|4. 지권의 운동|skill|7",
    "2단원-지권의 변화|4. 지권의 운동|skill|10",
    "2단원-지권의 변화|4. 지권의 운동|skill|11",
    "2단원-지권의 변화|4. 지권의 운동|skill|12",
    "2단원-지권의 변화|4. 지권의 운동|skill|13",
    "2단원-지권의 변화|4. 지권의 운동|skill|14",
    "2단원-지권의 변화|4. 지권의 운동|advanced|1",
    "2단원-지권의 변화|4. 지권의 운동|advanced|4",
    "2단원-지권의 변화|4. 지권의 운동|advanced|5",
    "2단원-지권의 변화|4. 지권의 운동|advanced|6",

    // ── 3단원-빛과 파동 ────────────────────────────────────────────────────────
    // 중단원 1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|basic|1",
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|basic|2",
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|basic|3",
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|basic|4",
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|basic|7",
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|basic|8",
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|basic|9",
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|skill|1",
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|skill|3",
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|skill|6",
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|skill|7",
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|skill|13",
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|skill|14",
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|advanced|1",
    "3단원-빛과 파동|1. 물체를 보는 과정과 반사와 굴절, 평면 거울의 상|advanced|3",
    // 중단원 2. 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성
    "3단원-빛과 파동|2. 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성|basic|1",
    "3단원-빛과 파동|2. 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성|basic|4",
    "3단원-빛과 파동|2. 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성|basic|7",
    "3단원-빛과 파동|2. 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성|basic|9",
    "3단원-빛과 파동|2. 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성|skill|2",
    "3단원-빛과 파동|2. 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성|skill|3",
    "3단원-빛과 파동|2. 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성|skill|5",
    "3단원-빛과 파동|2. 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성|skill|10",
    "3단원-빛과 파동|2. 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성|skill|15",
    "3단원-빛과 파동|2. 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성|advanced|2",
    "3단원-빛과 파동|2. 거울과 렌즈에 의한 상, 물체의 색과 빛의 합성|advanced|4",
    // 중단원 3. 파동과 소리
    "3단원-빛과 파동|3. 파동과 소리|basic|1",
    "3단원-빛과 파동|3. 파동과 소리|basic|2",
    "3단원-빛과 파동|3. 파동과 소리|basic|3",
    "3단원-빛과 파동|3. 파동과 소리|basic|4",
    "3단원-빛과 파동|3. 파동과 소리|basic|5",
    "3단원-빛과 파동|3. 파동과 소리|basic|6",
    "3단원-빛과 파동|3. 파동과 소리|basic|7",
    "3단원-빛과 파동|3. 파동과 소리|basic|8",
    "3단원-빛과 파동|3. 파동과 소리|basic|9",
    "3단원-빛과 파동|3. 파동과 소리|skill|1",
    "3단원-빛과 파동|3. 파동과 소리|skill|2",
    "3단원-빛과 파동|3. 파동과 소리|skill|3",
    "3단원-빛과 파동|3. 파동과 소리|skill|4",
    "3단원-빛과 파동|3. 파동과 소리|skill|7",
    "3단원-빛과 파동|3. 파동과 소리|skill|8",
    "3단원-빛과 파동|3. 파동과 소리|skill|11",
    "3단원-빛과 파동|3. 파동과 소리|skill|12",
    "3단원-빛과 파동|3. 파동과 소리|skill|13",
    "3단원-빛과 파동|3. 파동과 소리|advanced|2",
    "3단원-빛과 파동|3. 파동과 소리|advanced|3",
    "3단원-빛과 파동|3. 파동과 소리|advanced|5",
    "3단원-빛과 파동|3. 파동과 소리|advanced|6",

    // ── 4단원-물질의 구성 ──────────────────────────────────────────────────────
    // 중단원 1. 원소
    "4단원-물질의 구성|1. 원소|basic|4",
    "4단원-물질의 구성|1. 원소|basic|5",
    "4단원-물질의 구성|1. 원소|basic|6",
    "4단원-물질의 구성|1. 원소|basic|7",
    "4단원-물질의 구성|1. 원소|basic|8",
    "4단원-물질의 구성|1. 원소|basic|9",
    "4단원-물질의 구성|1. 원소|skill|2",
    "4단원-물질의 구성|1. 원소|skill|4",
    "4단원-물질의 구성|1. 원소|skill|6",
    "4단원-물질의 구성|1. 원소|skill|9",
    "4단원-물질의 구성|1. 원소|skill|11",
    "4단원-물질의 구성|1. 원소|skill|12",
    "4단원-물질의 구성|1. 원소|skill|13",
    "4단원-물질의 구성|1. 원소|skill|14",
    "4단원-물질의 구성|1. 원소|skill|15",
    "4단원-물질의 구성|1. 원소|advanced|1",
    "4단원-물질의 구성|1. 원소|advanced|3",
    "4단원-물질의 구성|1. 원소|advanced|4",
    "4단원-물질의 구성|1. 원소|advanced|5",
    // 중단원 2. 원자와 분자
    "4단원-물질의 구성|2. 원자와 분자|basic|1",
    "4단원-물질의 구성|2. 원자와 분자|basic|6",
    "4단원-물질의 구성|2. 원자와 분자|basic|7",
    "4단원-물질의 구성|2. 원자와 분자|basic|8",
    "4단원-물질의 구성|2. 원자와 분자|basic|9",
    "4단원-물질의 구성|2. 원자와 분자|skill|2",
    "4단원-물질의 구성|2. 원자와 분자|skill|4",
    "4단원-물질의 구성|2. 원자와 분자|skill|6",
    "4단원-물질의 구성|2. 원자와 분자|skill|11",
    "4단원-물질의 구성|2. 원자와 분자|skill|12",
    "4단원-물질의 구성|2. 원자와 분자|skill|13",
    "4단원-물질의 구성|2. 원자와 분자|skill|14",
    "4단원-물질의 구성|2. 원자와 분자|advanced|3",
    "4단원-물질의 구성|2. 원자와 분자|advanced|4",
    "4단원-물질의 구성|2. 원자와 분자|advanced|5",
    "4단원-물질의 구성|2. 원자와 분자|advanced|6",
    // 중단원 3. 이온
    "4단원-물질의 구성|3. 이온|basic|2",
    "4단원-물질의 구성|3. 이온|basic|3",
    "4단원-물질의 구성|3. 이온|basic|4",
    "4단원-물질의 구성|3. 이온|basic|5",
    "4단원-물질의 구성|3. 이온|basic|6",
    "4단원-물질의 구성|3. 이온|basic|7",
    "4단원-물질의 구성|3. 이온|basic|8",
    "4단원-물질의 구성|3. 이온|basic|9",
    "4단원-물질의 구성|3. 이온|skill|6",
    "4단원-물질의 구성|3. 이온|skill|7",
    "4단원-물질의 구성|3. 이온|skill|8",
    "4단원-물질의 구성|3. 이온|skill|9",
    "4단원-물질의 구성|3. 이온|skill|10",
    "4단원-물질의 구성|3. 이온|skill|11",
    "4단원-물질의 구성|3. 이온|skill|12",
    "4단원-물질의 구성|3. 이온|skill|13",
    "4단원-물질의 구성|3. 이온|skill|14",
    "4단원-물질의 구성|3. 이온|skill|15",
    "4단원-물질의 구성|3. 이온|advanced|4",
    "4단원-물질의 구성|3. 이온|advanced|5",
    "4단원-물질의 구성|3. 이온|advanced|6",
]);

/**
 * 유형번호 문자열에서 교과서 태그를 추출합니다.
 * 예: "3(오+완)" → "오투+완자", "1(오)" → "오투", "7(완)" → "완자", "5" → "기타"
 */
function parseTextbookTag(rawNo: string): string {
    const match = rawNo.match(/\(([^)]+)\)/);
    if (!match) return "기타";
    const bracket = match[1].trim();
    if (bracket === "오+완") return "오투+완자";
    if (bracket === "오") return "오투";
    if (bracket === "완") return "완자";
    return "기타";
}

/**
 * 유형번호 문자열에서 순수 번호(숫자)만 추출합니다.
 * 예: "3(오+완)" → "3", "10(오)" → "10"
 */
function parseRawNo(rawNo: string): string {
    return rawNo.replace(/\s*\([^)]*\)\s*/g, "").trim();
}

function ExamPrepPage() {
    // --- States ---
    const searchParams = useSearchParams();
    const [curriculum, setCurriculum] = useState<BigUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedGradeTerm, setSelectedGradeTerm] = useState("mid2-1");
    const [selectedTextbook, setSelectedTextbook] = useState("전체");
    const [selectedAchievements, setSelectedAchievements] = useState<Set<AchievementColor>>(new Set());

    // 필터 마이그레이션 (blue -> green)
    useEffect(() => {
        const migrated = migrateAchievementFilter(selectedAchievements);
        if (migrated.size !== selectedAchievements.size || [...migrated].some(c => ![...selectedAchievements].includes(c))) {
            setSelectedAchievements(migrated);
        }
    }, [selectedAchievements]);

    const [onlyImportant, setOnlyImportant] = useState(false);

    // 아코디언 상태 관리 분리 
    // P0: 대단원(Major) 상태와 중단원(Middle) 상태 독립 관리
    const [openMajorUnitIds, setOpenMajorUnitIds] = useState<Set<string>>(new Set());
    const [openMiddleUnitIds, setOpenMiddleUnitIds] = useState<Set<string>>(new Set());

    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

    const [modalType, setModalType] = useState<"achievement" | "progress" | "reset" | null>(null);

    // --- Data Loading & Parsing ---
    useEffect(() => {
        async function loadExcelData() {
            try {
                // API 라우트를 통해 구글 시트 데이터 로드
                const response = await fetch("/api/exam-prep-sheet");
                if (!response.ok) throw new Error("데이터를 불러올 수 없습니다.");
                const arrayBuffer = await response.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: "array" });

                const newBigUnits: BigUnit[] = workbook.SheetNames.map((sheetName, sheetIdx) => {
                    const sheet = workbook.Sheets[sheetName];
                    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

                    // 신규 시트: 1행 A열에 대단원명이 들어있음 (예: "1단원-물질의 특성")
                    let bigUnitName = sheetName;
                    if (data.length > 0 && data[0][0]) {
                        bigUnitName = data[0][0].toString().trim();
                    }

                    const midUnitsMap = new Map<string, TypeData[]>();
                    let currentMidUnit = "";

                    for (let i = 0; i < data.length; i++) {
                        const row = data[i];
                        if (!row || row.length === 0) continue;

                        const col0 = row[0]?.toString().trim();

                        // 중단원 식별: "중단원 1.", "중단원 2." 등
                        if (col0 && col0.startsWith("중단원")) {
                            currentMidUnit = col0.replace(/^중단원\s*/, "");
                            if (!midUnitsMap.has(currentMidUnit)) {
                                midUnitsMap.set(currentMidUnit, []);
                            }
                            // 헤더행 스킵: 다음 행에 "유형 번호" 또는 "기본" 등의 헤더가 있으면 건너뜀
                            if (
                                i + 1 < data.length &&
                                data[i + 1] &&
                                (
                                    data[i + 1][0]?.toString().trim() === "유형 번호" ||
                                    data[i + 1][0]?.toString().trim() === "기본" ||
                                    data[i + 1][1]?.toString().trim() === "기본 유형" ||
                                    data[i + 1][1]?.toString().trim() === "유형명"
                                )
                            ) {
                                i++; // 헤더 스킵
                            }
                            continue;
                        }

                        if (!currentMidUnit) continue; // 중단원 파악 전의 행 스킵

                        // 신규 시트 컬럼 구조:
                        // A(0): 기본 유형번호, B(1): 기본 유형명
                        // C(2): 실력 유형번호, D(3): 실력 유형명
                        // E(4): 심화 유형번호, F(5): 심화 유형명

                        // 기본
                        const basicRaw = row[0]?.toString().trim();
                        const basicName = row[1]?.toString().trim();
                        if (basicRaw && basicName && !/^(유형\s*번호|기본|유형명)$/.test(basicRaw)) {
                            midUnitsMap.get(currentMidUnit)!.push(createType(sheetName, currentMidUnit, "basic", basicRaw, basicName));
                        }

                        // 실력
                        const skillRaw = row[2]?.toString().trim();
                        const skillName = row[3]?.toString().trim();
                        if (skillRaw && skillName && !/^(유형\s*번호|실력|유형명)$/.test(skillRaw)) {
                            midUnitsMap.get(currentMidUnit)!.push(createType(sheetName, currentMidUnit, "skill", skillRaw, skillName));
                        }

                        // 심화
                        const advRaw = row[4]?.toString().trim();
                        const advName = row[5]?.toString().trim();
                        if (advRaw && advName && !/^(유형\s*번호|심화|유형명)$/.test(advRaw)) {
                            midUnitsMap.get(currentMidUnit)!.push(createType(sheetName, currentMidUnit, "advanced", advRaw, advName));
                        }
                    }

                    const isUnit4 = sheetName.includes("4단원") || sheetName.includes("4.");

                    midUnitsMap.forEach((types) => {
                        applyMockColors(types.filter(t => t.bucket === "basic"), "basic", isUnit4);
                        applyMockColors(types.filter(t => t.bucket === "skill"), "skill", isUnit4);
                        applyMockColors(types.filter(t => t.bucket === "advanced"), "advanced", isUnit4);
                    });

                    const midUnits: MidUnit[] = Array.from(midUnitsMap.entries()).map(([name, types], idx) => ({
                        id: `${sheetName}-m${idx}`,
                        name,
                        types
                    }));

                    return { id: `bu-${sheetIdx}`, name: bigUnitName, midUnits };
                });

                setCurriculum(newBigUnits);

                // --- 아코디언 초기 상태 제어 로직 ---
                const fromSolveMore = searchParams.get("from") === "solveMore";
                const pBigUnitId = searchParams.get("bigUnitId");
                const pMidUnitId = searchParams.get("midUnitId");

                if (fromSolveMore) {
                    let targetMajorIds = new Set<string>();
                    let targetMiddleIds = new Set<string>();

                    if (pBigUnitId || pMidUnitId) {
                        // 1. 파라미터가 있는 경우 (확장성)
                        if (pBigUnitId) {
                            targetMajorIds.add(pBigUnitId);
                            const foundBig = newBigUnits.find(bu => bu.id === pBigUnitId);
                            if (foundBig && foundBig.midUnits.length > 0) {
                                // 대단원만 지정된 경우 첫 번째 중단원 자동 열기
                                targetMiddleIds.add(pMidUnitId || foundBig.midUnits[0].id);
                            }
                        } else if (pMidUnitId) {
                            // 중단원만 지정된 경우 부모 대단원 자동 계산
                            const parentBig = newBigUnits.find(bu => bu.midUnits.some(mu => mu.id === pMidUnitId));
                            if (parentBig) {
                                targetMajorIds.add(parentBig.id);
                                targetMiddleIds.add(pMidUnitId);
                            }
                        }
                    } else {
                        // 2. 파라미터가 없는 경우 고정값 (2단원 > 2번째 중단원)
                        if (newBigUnits.length >= 2) {
                            const unit2 = newBigUnits[1];
                            targetMajorIds.add(unit2.id);
                            if (unit2.midUnits.length >= 2) {
                                targetMiddleIds.add(unit2.midUnits[1].id);
                            } else if (unit2.midUnits.length > 0) {
                                targetMiddleIds.add(unit2.midUnits[0].id);
                            }
                        } else if (newBigUnits.length > 0) {
                            // 2단원이 없는 경우 대비 Fallback
                            targetMajorIds.add(newBigUnits[0].id);
                            if (newBigUnits[0].midUnits.length > 0) {
                                targetMiddleIds.add(newBigUnits[0].midUnits[0].id);
                            }
                        }
                    }

                    setOpenMajorUnitIds(targetMajorIds);
                    setOpenMiddleUnitIds(targetMiddleIds);
                } else {
                    // 3. 일반 진입시 모든 아코디언을 열림(Open) 처리
                    setOpenMajorUnitIds(new Set(newBigUnits.map(bu => bu.id)));
                    setOpenMiddleUnitIds(new Set(newBigUnits.flatMap(bu => bu.midUnits.map(mu => mu.id))));
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        }

        loadExcelData();
    }, []);

    function createType(sheet: string, midName: string, bucket: BucketType, rawNo: string, name: string): TypeData {
        const bucketLabelMap = { basic: "기본", skill: "실력", advanced: "심화" };

        // 신규 시트 기반: 유형번호 파싱
        const no = parseRawNo(rawNo);      // 표시용 순수 번호 (예: "3(오+완)" → "3")

        // 1. 교과서 태그: 유형번호 괄호 표기에서 추출 (예: "3(오+완)" → "오투+완자")
        const textbookTag = parseTextbookTag(rawNo);

        // 2. 중요 유형: 브라우저에서 수집한 정적 Set 기준
        const importantKey = `${sheet}|${midName}|${bucket}|${no}`;
        const isImportant = IMPORTANT_TYPE_KEYS.has(importantKey);

        // 3. 성취도 목 데이터 생성 -------------------------------------------------------
        const typeId = `${sheet}:${midName}:${bucket}:${no}`;
        let hasProgress = false;
        let achColor: AchievementColor = "white";
        let needsMockColor = true;

        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(`examPrep:${typeId}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const gradedResults: (boolean | null)[] = parsed.gradedResults || [];
                    const solvedCount = gradedResults.filter(r => r !== null).length;
                    const correctCount = gradedResults.filter(r => r === true).length;

                    if (parsed && Array.isArray(parsed.gradedResults)) {
                        needsMockColor = false;
                        const hasAnswers = Array.isArray(parsed.answers) && parsed.answers.some((a: any) => a !== null);
                        if (hasAnswers || parsed.completed) {
                            hasProgress = true;
                        }
                        if (solvedCount === 0) {
                            achColor = hasProgress ? "gray" : "white";
                        } else {
                            achColor = getAchievementKey(solvedCount, correctCount, bucket);
                        }

                        // [추가 규칙] basic 난이도는 실데이터 결과라도 Red를 절대 노출하지 않음 (기획 정책)
                        if (bucket === "basic" && achColor === "red") {
                            achColor = "yellow";
                        }

                        console.log(`[RealDataLog] ${typeId}: Found real data. Mock skipped.`);
                    }
                } catch (e) {
                    console.error("Storage parse error", e);
                }
            }
        }
        // -------------------------------------------------------------------------------

        return {
            id: typeId,
            no,
            name,
            bucket,
            bucketLabel: bucketLabelMap[bucket],
            isImportant,
            textbookTag,
            achievementColor: achColor,
            hasProgress,
            progressMeta: { lastQuestionIndex: -1 },
            needsMockColor
        };
    }

    // --- Filtering & Counting Logic ---
    const prevFilteredMajorUnitsRef = React.useRef<Set<string>>(new Set());

    const filteredCurriculum = useMemo(() => {
        let currentFilteredMajorUnits = new Set<string>();

        const filtered = curriculum.map((bigUnit: BigUnit) => {
            const filteredMidUnits = bigUnit.midUnits.map(midUnit => {
                const filteredTypes = midUnit.types.filter(type => {
                    const matchesTextbook = selectedTextbook === "전체" || type.textbookTag === selectedTextbook;
                    const matchesAchievement = selectedAchievements.size === 0 || selectedAchievements.has(type.achievementColor);
                    const matchesImportant = !onlyImportant || type.isImportant;
                    return matchesTextbook && matchesAchievement && matchesImportant;
                });
                return { ...midUnit, types: filteredTypes };
            }).filter(midUnit => midUnit.types.length > 0);

            return { ...bigUnit, midUnits: filteredMidUnits };
        }).filter(bigUnit => bigUnit.midUnits.length > 0); // P0: 유효 칩이 없는 대단원은 필터에서 완전 제거

        filtered.forEach(bu => currentFilteredMajorUnits.add(bu.id));

        // P0: 필터 조건 변경으로 인해 삭제되었다가 '다시 등장'한 대단원이 있다면 자동으로 '열림' 보장
        // setTimeout 렌더 사이클 우회를 위해 requestAnimationFrame 또는 별도 useEffect 사용 불필요 (Set 복사 활용)
        // 여기선 상태 변경 함수를 Promise/timeout 밖에서 호출하기 어려우므로 useEffect로 넘기기 위한 Ref 업데이트만 수행
        prevFilteredMajorUnitsRef.current = currentFilteredMajorUnits;

        return filtered;
    }, [curriculum, selectedTextbook, selectedAchievements, onlyImportant]);

    // 필터 변경 시 다시 등장한 대단원 열림 처리 
    useEffect(() => {
        setOpenMajorUnitIds(prev => {
            const next = new Set(prev);
            let changed = false;
            prevFilteredMajorUnitsRef.current.forEach(id => {
                if (!next.has(id)) {
                    next.add(id);
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [filteredCurriculum]);

    const stats = useMemo(() => {
        const counts: Record<AchievementColor, number> = { white: 0, gray: 0, red: 0, yellow: 0, lime: 0, green: 0 };
        curriculum.forEach(bu => {
            bu.midUnits.forEach(mu => {
                mu.types.forEach(type => {
                    const matchesTextbook = selectedTextbook === "전체" || type.textbookTag === selectedTextbook;
                    const matchesImportant = !onlyImportant || type.isImportant;
                    if (matchesTextbook && matchesImportant) {
                        counts[type.achievementColor]++;
                    }
                });
            });
        });
        return counts;
    }, [curriculum, selectedTextbook, onlyImportant]);

    // 필터 초기화 관련 (P0 추가)
    const isFilterDefault =
        selectedGradeTerm === "mid2-1" &&
        selectedTextbook === "전체" &&
        selectedAchievements.size === 0 &&
        onlyImportant === false;

    const handleResetFilters = () => {
        setSelectedGradeTerm("mid2-1"); // 기본 학기
        setSelectedTextbook("전체"); // 기본 교재
        setSelectedAchievements(new Set()); // 성취도 선택 해제
        setOnlyImportant(false); // 중요 유형 OFF
        setSelectedTypeId(null); // 선택된 유형 해제 (하단 레이어 비활성)
    };

    // --- Actions ---

    const toggleMajorAccordion = (id: string) => {
        setOpenMajorUnitIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const toggleMiddleAccordion = (id: string) => {
        setOpenMiddleUnitIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleTypeSelect = (id: string) => {
        if (selectedTypeId === id) setSelectedTypeId(null);
        else setSelectedTypeId(id);
    };

    const selectedType = useMemo(() => {
        if (!selectedTypeId) return null;
        for (const bu of curriculum) {
            for (const mu of bu.midUnits) {
                const found = mu.types.find(t => t.id === selectedTypeId);
                if (found) return found;
            }
        }
        return null;
    }, [selectedTypeId, curriculum]);

    const handleAction = () => {
        if (!selectedType) return;

        // P0-추가 3) 분기 모달 트리거 차단: 흰색 유형칩(미진행)인 경우 무조건 새로 풀기
        if (selectedType.achievementColor === "white") {
            startNew(selectedType.id);
            return;
        }

        // 클릭 시 항상 최신 localStorage 조회
        let hasCount = false;
        const saved = localStorage.getItem(`examPrep:${selectedType.id}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const hasAnswers = Array.isArray(parsed.answers) && parsed.answers.some((a: any) => a !== null);
                if (hasAnswers || parsed.completed) {
                    hasCount = true;
                }
            } catch (e) {
                console.error("Storage parse error", e);
            }
        }

        if (!hasCount) {
            const mockData = getMockStatsByColor(selectedType.achievementColor, selectedType.id);
            localStorage.setItem(`examPrep:${selectedType.id}`, JSON.stringify(mockData));
            hasCount = true;
        }
        // ------------------------------------------------------------------------------------

        if (hasCount) {
            setModalType("progress"); // 무조건 모달
        } else {
            startNew(selectedType.id); // 1번 진입
        }
    };

    const startNew = (id: string) => {
        const color = selectedType?.achievementColor || "white";
        const name = selectedType?.name || "";
        window.location.href = `/content/exam-prep/study/${encodeURIComponent(id)}?mode=new&color=${color}&name=${encodeURIComponent(name)}`;
    };

    const resume = (id: string) => {
        const color = selectedType?.achievementColor || "gray";
        const name = selectedType?.name || "";
        window.location.href = `/content/exam-prep/study/${encodeURIComponent(id)}?mode=resume&color=${color}&name=${encodeURIComponent(name)}`;
    };

    const resetAndStart = (id: string) => {
        const color = selectedType?.achievementColor || "white";
        const name = selectedType?.name || "";
        // 데이터 명시적 완전 초기화 후 시작
        localStorage.removeItem(`examPrep:${id}`);
        window.location.href = `/content/exam-prep/study/${encodeURIComponent(id)}?mode=new&color=${color}&name=${encodeURIComponent(name)}`;
    };

    const closeSelection = () => setSelectedTypeId(null);



    if (loading) return <div className="flex h-screen items-center justify-center font-body text-slate-500">데이터를 로딩 중입니다...</div>;
    if (error) return <div className="flex h-screen flex-col items-center justify-center font-body text-red-500 gap-4"><AlertCircle className="h-10 w-10" />{error}</div>;

    return (
        <div className="flex flex-col min-h-screen font-body text-slate-900 w-full overflow-x-hidden bg-[#f4f6f8]">
            {/* 공통 래퍼 컴포넌트 */}
            <div className="w-full max-w-5xl mx-auto px-4 md:px-6 flex flex-col items-stretch">

                {/* 1. Header & Header Filter Area */}
                <header
                    className={cn(
                        "py-6 flex flex-col transition-all bg-[#f4f6f8] gap-6",
                        modalType ? "static" : "sticky top-0 z-40"
                    )}
                >
                    {/* 상단: 타이틀 & 모드 전환 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight whitespace-nowrap">시험대비</h1>
                            
                            {/* 모드 전환 버튼 (기본/자유) */}
                            <div className="flex bg-[#1e222e] p-1 rounded-xl border border-white/5 shadow-xl">
                                <div 
                                    className="text-white/40 hover:text-white px-5 py-1.5 text-xs font-black min-w-[90px] text-center cursor-pointer transition-colors"
                                    onClick={() => window.location.href = '/content/exam-prep'}
                                >
                                    기본 모드
                                </div>
                                <div 
                                    className="text-white/40 hover:text-white px-5 py-1.5 text-xs font-black min-w-[90px] text-center cursor-pointer transition-colors"
                                    onClick={() => window.location.href = '/content/exam-prep/common-curriculum'}
                                >
                                    자유 모드
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 하단: 필터 영역 */}
                    <div className="flex items-center justify-between gap-4">
                        {/* 좌측 필터 그룹 */}
                        <div className="flex items-center gap-3 md:gap-4 flex-wrap flex-1">
                            <div className="flex items-center gap-2">
                                <Select value={selectedGradeTerm} onValueChange={setSelectedGradeTerm}>
                                    <SelectTrigger className="w-auto min-w-[120px] bg-white border-slate-200 font-bold h-[38px] text-[13px] text-slate-700 rounded-full focus:ring-1 focus:ring-indigo-500 shadow-sm">
                                        <SelectValue placeholder="학년-학기" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        <SelectItem value="초3-1">초3-1학기</SelectItem>
                                        <SelectItem value="초3-2">초3-2학기</SelectItem>
                                        <SelectItem value="초4-1">초4-1학기</SelectItem>
                                        <SelectItem value="초4-2">초4-2학기</SelectItem>
                                        <SelectItem value="초5-1">초5-1학기</SelectItem>
                                        <SelectItem value="초5-2">초5-2학기</SelectItem>
                                        <SelectItem value="초6-1">초6-1학기</SelectItem>
                                        <SelectItem value="초6-2">초6-2학기</SelectItem>
                                        <SelectItem value="중1-1">중1-1학기</SelectItem>
                                        <SelectItem value="중1-2">중1-2학기</SelectItem>
                                        <SelectItem value="mid2-1">중2-1학기</SelectItem>
                                        <SelectItem value="중2-2">중2-2학기</SelectItem>
                                        <SelectItem value="중3-1">중3-1학기</SelectItem>
                                        <SelectItem value="중3-2">중3-2학기</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex bg-white p-1 rounded-full overflow-hidden border border-slate-200 shadow-sm">
                                {["전체", "오투", "완자", "오투+완자", "기타"].map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSelectedTextbook(tag)}
                                        className={cn(
                                            "px-4 py-1.5 text-[12px] font-bold rounded-full transition-all whitespace-nowrap",
                                            selectedTextbook === tag ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                        )}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                className={cn(
                                    "h-[38px] rounded-full text-[12px] font-bold gap-1.5 bg-white border-slate-200 px-4 shadow-sm",
                                    selectedAchievements.size > 0 && "border-indigo-600 text-indigo-600"
                                )}
                                onClick={() => setModalType("achievement")}
                            >
                                성취도 {selectedAchievements.size > 0 ? (selectedAchievements.size === 1 ? "1개" : `${selectedAchievements.size}개`) : ""}
                                <ChevronDown className="h-4 w-4 opacity-70" />
                            </Button>
                        </div>

                        {/* 우측 그룹 */}
                        <div className="flex items-center justify-end gap-3 md:gap-5 shrink-0 pl-4 border-l border-slate-200/60">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">중요 유형만 보기</span>
                                <Switch
                                    checked={onlyImportant}
                                    onCheckedChange={setOnlyImportant}
                                    className="scale-90 data-[state=checked]:bg-indigo-600"
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={isFilterDefault}
                                onClick={handleResetFilters}
                                className="h-[38px] text-[12px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            >
                                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                초기화
                            </Button>
                        </div>
                    </div>
                </header>

                {/* 3. Curriculum List Area */}
                <main className="flex-1 w-full pt-4 pb-32 flex flex-col items-center gap-6">
                    {filteredCurriculum.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4 w-full">
                            <Info className="h-10 w-10 opacity-20" />
                            <span className="font-bold text-sm">조건에 맞는 유형이 없습니다. 필터를 변경해 보세요.</span>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col gap-6">
                            {filteredCurriculum.map((bigUnit: BigUnit) => (
                                <div key={bigUnit.id} className="flex flex-col rounded-2xl overflow-hidden bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] border border-slate-200/80 transition-all duration-200">
                                    {/* P0 대단원 아코디언 헤더 */}
                                    <div
                                        className="group bg-gradient-to-r from-indigo-50/80 to-blue-50/50 border-b border-indigo-100/60 p-5 px-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none"
                                        onClick={() => toggleMajorAccordion(bigUnit.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {(() => {
                                                const parts = bigUnit.name.split('-');
                                                if (parts.length > 1) {
                                                    const chipText = parts[0].trim();
                                                    const titleText = parts.slice(1).join('-').trim();
                                                    return (
                                                        <>
                                                            <div className="bg-indigo-600/90 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-sm tracking-wide">
                                                                {chipText}
                                                            </div>
                                                            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight group-hover:text-indigo-900 transition-colors">
                                                                {titleText}
                                                            </h2>
                                                        </>
                                                    );
                                                }
                                                return (
                                                    <>
                                                        <div className="bg-indigo-600/90 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-sm tracking-wide">
                                                            {bigUnit.name}
                                                        </div>
                                                        <h2 className="text-lg font-extrabold text-slate-800 tracking-tight group-hover:text-indigo-900 transition-colors"></h2>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <div className={cn("p-1.5 rounded-full transition-all duration-200", openMajorUnitIds.has(bigUnit.id) ? "bg-white shadow-sm ring-1 ring-slate-200/80" : "bg-slate-100/80 group-hover:bg-slate-200")}>
                                            {openMajorUnitIds.has(bigUnit.id) ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                                        </div>
                                    </div>

                                    {/* P0 대단원 아코디언 바디 (접힘 시 DOM 노출 안 함) */}
                                    {openMajorUnitIds.has(bigUnit.id) && (
                                        <div className="flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                                            {bigUnit.midUnits.map((midUnit: MidUnit) => {
                                                const isExpanded = openMiddleUnitIds.has(midUnit.id);
                                                const basicTypes = midUnit.types.filter(t => t.bucket === 'basic');
                                                const skillTypes = midUnit.types.filter(t => t.bucket === 'skill');
                                                const advTypes = midUnit.types.filter(t => t.bucket === 'advanced');

                                                return (
                                                    <div key={midUnit.id} className="flex flex-col border-b border-slate-100 last:border-b-0">
                                                        {/* 중단원 아코디언 헤더 */}
                                                        <div
                                                            className={cn(
                                                                "flex items-center justify-between p-4 px-6 cursor-pointer hover:bg-slate-50 transition-colors select-none group",
                                                                isExpanded && "bg-slate-50/50"
                                                            )}
                                                            onClick={() => toggleMiddleAccordion(midUnit.id)}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                                                                <div className={cn("w-1.5 h-1.5 rounded-full transition-colors", isExpanded ? "bg-indigo-500" : "bg-slate-300 group-hover:bg-slate-400")} />
                                                                <p className={cn("text-sm font-bold truncate transition-colors", isExpanded ? "text-indigo-900" : "text-slate-700 group-hover:text-slate-900")}>
                                                                    {midUnit.name}
                                                                </p>
                                                            </div>
                                                            <div className={cn("p-1.5 rounded-full transition-colors", isExpanded ? "bg-white shadow-sm ring-1 ring-slate-200" : "bg-slate-100 group-hover:bg-slate-200")}>
                                                                {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                                                            </div>
                                                        </div>

                                                        {/* 중단원 아코디언 바디 */}
                                                        {isExpanded && (
                                                            <div className="flex flex-col border-t border-slate-100 bg-white p-5 px-6">
                                                                {/* 3-column board (개념/기본/심화 열) - 유형칩 노출 */}
                                                                <div className="grid grid-cols-3 gap-3">
                                                                    {/* 기본 열 (구 개념) */}
                                                                    <div className="flex flex-col min-h-[140px] bg-[#F8F9FB] rounded-xl border border-slate-200 overflow-hidden">
                                                                        <div className="py-2.5 px-3.5 border-b border-slate-200 flex items-center justify-between">
                                                                            <span className="text-xs font-bold text-slate-700">기본</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2 p-3.5 content-start flex-1">
                                                                            {basicTypes.map(type => (
                                                                                <TypeChip key={type.id} type={type} isSelected={selectedTypeId === type.id} onClick={() => handleTypeSelect(type.id)} />
                                                                            ))}
                                                                            {basicTypes.length === 0 && <span className="text-[11px] text-slate-400 w-full text-center py-2">없음</span>}
                                                                        </div>
                                                                    </div>
                                                                    {/* 기본 열 */}
                                                                    <div className="flex flex-col min-h-[140px] bg-[#F8F9FB] rounded-xl border border-slate-200 overflow-hidden">
                                                                        <div className="py-2.5 px-3.5 border-b border-slate-200 flex items-center justify-between">
                                                                            <span className="text-xs font-bold text-slate-700">실력</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2 p-3.5 content-start flex-1">
                                                                            {skillTypes.map(type => (
                                                                                <TypeChip key={type.id} type={type} isSelected={selectedTypeId === type.id} onClick={() => handleTypeSelect(type.id)} />
                                                                            ))}
                                                                            {skillTypes.length === 0 && <span className="text-[11px] text-slate-400 w-full text-center py-2">없음</span>}
                                                                        </div>
                                                                    </div>
                                                                    {/* 심화 열 */}
                                                                    <div className="flex flex-col min-h-[140px] bg-[#F8F9FB] rounded-xl border border-slate-200 overflow-hidden">
                                                                        <div className="py-2.5 px-3.5 border-b border-slate-200 flex items-center justify-between">
                                                                            <span className="text-xs font-bold text-slate-700">심화</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-2 p-3.5 content-start flex-1">
                                                                            {advTypes.map(type => (
                                                                                <TypeChip key={type.id} type={type} isSelected={selectedTypeId === type.id} onClick={() => handleTypeSelect(type.id)} />
                                                                            ))}
                                                                            {advTypes.length === 0 && <span className="text-[11px] text-slate-400 w-full text-center py-2">없음</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* 4. Fixed Bottom Bar */}
            {selectedType && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-slate-900 text-white p-3.5 px-5 rounded-2xl shadow-xl z-[100] flex items-center justify-between gap-4 animate-in slide-in-from-bottom-8 duration-200">
                    <div className="flex flex-col min-w-0 w-full max-w-[50%]">
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">SELECTED</span>
                        <span className="text-sm font-bold truncate pr-2" title={selectedType.name}>{selectedType.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold h-10 px-4 rounded-xl shadow-md text-xs"
                            onClick={handleAction}
                        >
                            선택한 유형 풀기
                        </Button>
                        <button
                            onClick={closeSelection}
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Achievement Selection Modal */}
            <Dialog open={modalType === "achievement"} onOpenChange={(open) => !open && setModalType(null)}>
                <DialogContent className="sm:max-w-md bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="p-5 pb-4 flex flex-row items-center justify-between border-b border-slate-100">
                        <DialogTitle className="text-base font-bold text-slate-800">성취도 선택</DialogTitle>
                    </DialogHeader>

                    <div className="p-5 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
                        {/* 성취도 목록 (칩 그리드) */}
                        <div className="grid grid-cols-3 gap-3">
                            {ACHIEVEMENT_INFOS.map(ach => {
                                const isSelected = selectedAchievements.has(ach.key);
                                const count = stats[ach.key];
                                const isDisabled = count === 0;

                                return (
                                    <button
                                        key={ach.key}
                                        disabled={isDisabled}
                                        onClick={() => {
                                            const next = new Set(selectedAchievements);
                                            if (next.has(ach.key)) next.delete(ach.key);
                                            else next.add(ach.key);
                                            setSelectedAchievements(next);
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 p-2.5 rounded-2xl transition-all relative overflow-hidden group",
                                            isSelected ? "bg-white ring-2" : "bg-white hover:bg-slate-50",
                                            isDisabled && "opacity-40 cursor-not-allowed"
                                        )}
                                        style={isSelected ? { outline: `2px solid ${ach.colorHex}`, outlineOffset: '-2px' } : { border: '1px solid #E2E8F0' }}
                                    >
                                        <div className={cn(
                                            "w-7 h-7 rounded-[8px] shrink-0",
                                            ach.bgClass,
                                            ach.key === "white" && "border border-slate-200"
                                        )} />
                                        <span className={cn("text-sm font-bold", isSelected ? "text-slate-800" : isDisabled ? "text-slate-300" : "text-slate-500")}>{count}개</span>
                                        {isSelected && (
                                            <div
                                                className="absolute top-1.5 right-1.5 rounded-full p-0.5"
                                                style={{ backgroundColor: ach.colorHex }}
                                            >
                                                <Check className="h-2.5 w-2.5 text-white stroke-[4]" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* 성취도 설명 영역 */}
                        <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-3 border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> 성취도 안내</h4>
                            <div className="flex flex-col gap-3">
                                {ACHIEVEMENT_INFOS.map(ach => (
                                    <div key={ach.key} className="flex items-start gap-2.5">
                                        <div className={cn(
                                            "w-3 h-3 rounded-full mt-0.5 shrink-0",
                                            ach.bgClass,
                                            ach.key === "white" && "border border-slate-300"
                                        )} />
                                        <p className="text-xs text-slate-600 font-medium leading-snug break-keep">
                                            {ach.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 5. Progress Split Modal */}
            <Dialog open={modalType === "progress"} onOpenChange={(open) => {
                if (!open) {
                    setModalType(null);
                    setSelectedTypeId(null); // 모달 닫을 때 selectedType 초기화 강제 보장
                }
            }}>
                <DialogContent className="sm:max-w-[320px] bg-white rounded-3xl p-6 text-center flex flex-col items-center gap-5">
                    <DialogTitle className="sr-only">이어서 풀기 안내</DialogTitle>
                    <div className="bg-indigo-50 p-3 rounded-full"><RotateCcw className="h-6 w-6 text-indigo-600" /></div>
                    <p className="font-bold text-sm text-slate-800 leading-relaxed" title={selectedType?.name}>
                        학습중이거나 완료한 기록이 있습니다.<br />이어서 하시겠어요?
                    </p>
                    <div className="flex flex-col w-full gap-2 mt-2">
                        <Button
                            className="w-full h-11 rounded-xl bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 hover:text-slate-800 text-sm border-none shadow-none"
                            onClick={() => setModalType("reset")}
                            title={selectedType?.name}
                        >
                            새로 풀기
                        </Button>
                        <Button
                            className="w-full h-11 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 text-sm"
                            onClick={() => selectedType && resume(selectedType.id)}
                            title={selectedType?.name}
                        >
                            이어서 풀기
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 6. Reset Confirmation Modal */}
            <Dialog open={modalType === "reset"} onOpenChange={(open) => {
                if (!open) {
                    setModalType(null);
                    setSelectedTypeId(null);
                }
            }}>
                <DialogContent className="sm:max-w-[320px] bg-white rounded-3xl p-6 text-center flex flex-col items-center gap-5">
                    <DialogTitle className="sr-only">새로 풀기 경고</DialogTitle>
                    <div className="bg-red-50 p-3 rounded-full"><AlertCircle className="h-6 w-6 text-red-600" /></div>
                    <p className="font-bold text-sm text-slate-800 leading-relaxed">
                        새로 풀 경우 이전 학습 내역은<br />초기화 됩니다. 계속하시겠어요?
                    </p>
                    <div className="flex flex-col w-full gap-2 mt-2">
                        <Button
                            variant="ghost"
                            className="w-full h-11 rounded-xl text-slate-400 font-bold hover:bg-slate-50 text-sm"
                            onClick={() => setModalType("progress")}
                        >
                            취소
                        </Button>
                        <Button
                            className="w-full h-11 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-md shadow-red-600/20 text-sm"
                            onClick={() => selectedType && resetAndStart(selectedType.id)}
                        >
                            새로 풀기
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function TypeChip({ type, isSelected, onClick }: { type: TypeData; isSelected: boolean; onClick: () => void }) {
    const theme = ACHIEVEMENT_THEME[type.achievementColor];

    const selectionColor = theme.key === "white" ? "#94A3B8" : theme.colorHex;

    return (
        <div
            onClick={onClick}
            title={type.name}
            className={cn(
                "group relative h-10 px-3.5 rounded-lg flex items-center justify-center cursor-pointer transition-all",
                theme.bgClass,
                theme.key === "white" ? "border border-[#E2E8F0]" : "border-transparent",
                isSelected ? "ring-offset-2 scale-[1.02] shadow-sm z-10" : "hover:brightness-95"
            )}
            style={isSelected ? {
                boxShadow: `0 0 0 2px white, 0 0 0 4px ${selectionColor}`,
                zIndex: 20
            } : {}}
        >
            <span className={cn("text-sm font-bold", theme.textClass)}>
                {type.no}
            </span>

            {/* 중요 유형 표시: 별 아이콘 단독 노출 */}
            {type.isImportant && (
                <Star
                    className={cn(
                        "absolute top-1 left-1 z-10 w-2.5 h-2.5 drop-shadow-sm",
                        theme.key === "white" ? "text-slate-500 fill-slate-500" : "text-white fill-white"
                    )}
                />
            )}

            {/* 선택 상태: 우측 상단 체크 칩 */}
            {isSelected && (
                <div
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-white z-20"
                    style={{ backgroundColor: selectionColor }}
                >
                    <Check className="w-3.5 h-3.5 stroke-[4]" />
                </div>
            )}
        </div>
    );
}

export default function SuspensedExamPrepPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-400 font-medium">데이터 로딩 중...</div>
            </div>
        }>
            <ExamPrepPage />
        </Suspense>
    );
}
