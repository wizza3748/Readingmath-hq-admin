import { AchievementColor } from "../constants/achievementTheme";

/**
 * 성취도 판정 로직 유틸리티
 * @param solvedCount 푼 문제 수
 * @param correctCount 맞힌 문제 수
 * @param bucket 난이도 (basic 등)
 * @returns 성취도 컬러 키
 */
export function getAchievementKey(
    solvedCount: number,
    correctCount: number,
    bucket: string
): AchievementColor {
    if (solvedCount === 0) return "white";
    if (solvedCount === 1) return "gray";

    const ratio = correctCount / solvedCount;
    let key: AchievementColor = "green";

    // 3문항 기준 판정 로직으로 정합성 강화
    if (ratio === 0) {
        key = "red";
    } else if (ratio <= 0.4) { // 1/3 (33%) -> yellow
        key = "yellow";
    } else if (ratio < 1) { // 2/3 (66%) -> lime
        key = "lime";
    } else { // 3/3 (100%) -> green
        key = "green";
    }

    // [예외 규칙] basic 난이도는 절대 Red를 노출하지 않음
    if (bucket === "basic" && key === "red") {
        return "yellow";
    }

    return key;
}

/**
 * 특정 성취도 컬러에 맞는 목데이터 통계 생성
 * 실제 FIXED_QUESTIONS의 정답 번호와 연동하여 정합성 확보
 */
export function getMockStatsByColor(color: AchievementColor, typeId: string): {
    answers: (number | null)[],
    gradedResults: (boolean | null)[],
    lastGradedIndex: number,
    gradedCount: number,
    completed: boolean,
    typeId: string
} {
    // FIXED_QUESTIONS 정답: Q1=0, Q2=3, Q3=4
    const qAns = [0, 3, 4];
    let answers: (number | null)[] = [0, 0, 0];
    let gradedResults: (boolean | null)[] = [null, null, null];
    let lastIdx = 2;
    let count = 3;
    let isComp = true;

    const setAns = (idx: number, isCorrect: boolean) => {
        if (isCorrect) {
            answers[idx] = qAns[idx];
            gradedResults[idx] = true;
        } else {
            answers[idx] = (qAns[idx] + 1) % 5;
            gradedResults[idx] = false;
        }
    };

    switch (color) {
        case "white":
            return { answers: [null, null, null], gradedResults: [null, null, null], lastGradedIndex: -1, gradedCount: 0, completed: false, typeId };
        case "gray":
            answers = [qAns[0], null, null];
            gradedResults = [true, null, null];
            return { answers, gradedResults, lastGradedIndex: 0, gradedCount: 1, completed: false, typeId };

        case "green": // 3/3
            setAns(0, true); setAns(1, true); setAns(2, true);
            break;
        case "lime": // 2/3
            setAns(0, true); setAns(1, true); setAns(2, false);
            break;
        case "yellow": // 1/3
            setAns(0, true); setAns(1, false); setAns(2, false);
            break;
        case "red": // 0/3
            setAns(0, false); setAns(1, false); setAns(2, false);
            break;
    }

    return {
        answers,
        gradedResults,
        lastGradedIndex: lastIdx,
        gradedCount: count,
        completed: isComp,
        typeId
    };
}

/**
 * 필터 값 마이그레이션 (blue -> green)
 */
export function migrateAchievementFilter(colors: Set<string | AchievementColor>): Set<AchievementColor> {
    const next = new Set<AchievementColor>();
    colors.forEach(c => {
        if (c === "blue") {
            next.add("green");
        } else if (isValidAchievementColor(c)) {
            next.add(c as AchievementColor);
        }
    });
    return next;
}

function isValidAchievementColor(color: string): color is AchievementColor {
    return ["white", "gray", "red", "yellow", "lime", "green"].includes(color);
}
