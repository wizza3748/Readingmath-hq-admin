export const EXAM_PREP_COLORS = {
    WHITE: "#FFFFFF",
    GRAY: "#94A3B8",
    RED: "#F43F5E",
    YELLOW: "#F59E0B",
    LIME: "#A3E635",
    GREEN: "#22C55E",

    CHIP_TEXT_ON_DARK: "#FFFFFF",
    CHIP_TEXT_ON_LIGHT: "#0F172A",
    CHIP_BORDER: "#E2E8F0",
    CHIP_BG_WHITE: "#FFFFFF",
    CHIP_BG_GRAY: "#E2E8F0",
    MODAL_BG: "#FFFFFF",
    INFO_BG: "#F8FAFC",
} as const;

export type AchievementColor = "white" | "gray" | "red" | "yellow" | "lime" | "green";

export interface AchievementThemeDetail {
    key: AchievementColor;
    label: string;
    description: string;
    colorHex: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
}

export const ACHIEVEMENT_THEME: Record<AchievementColor, AchievementThemeDetail> = {
    white: {
        key: "white",
        label: "미진행",
        description: "아직 학습을 시작하지 않았어요.",
        colorHex: EXAM_PREP_COLORS.WHITE,
        bgClass: "bg-white",
        textClass: "text-[#0F172A]",
        borderClass: "border-[#E2E8F0]",
    },
    gray: {
        key: "gray",
        label: "미판정",
        description: "학습량이 부족해요. 2문제 이상 풀어보세요.",
        colorHex: EXAM_PREP_COLORS.GRAY,
        bgClass: "bg-[#E2E8F0]",
        textClass: "text-[#0F172A]",
        borderClass: "border-transparent",
    },
    red: {
        key: "red",
        label: "재학습 필요",
        description: "전혀 이해하지 못하고 있어요.",
        colorHex: EXAM_PREP_COLORS.RED,
        bgClass: "bg-[#F43F5E]",
        textClass: "text-white",
        borderClass: "border-transparent",
    },
    yellow: {
        key: "yellow",
        label: "보충 필요",
        description: "이해도가 낮은 상태예요.",
        colorHex: EXAM_PREP_COLORS.YELLOW,
        bgClass: "bg-[#F59E0B]",
        textClass: "text-white",
        borderClass: "border-transparent",
    },
    lime: {
        key: "lime",
        label: "유형 이해",
        description: "충분히 이해하여 문제를 풀 수 있어요.",
        colorHex: EXAM_PREP_COLORS.LIME,
        bgClass: "bg-[#A3E635]",
        textClass: "text-white",
        borderClass: "border-transparent",
    },
    green: {
        key: "green",
        label: "유형 완전 이해",
        description: "완전히 이해하고 있어요.",
        colorHex: EXAM_PREP_COLORS.GREEN,
        bgClass: "bg-[#22C55E]",
        textClass: "text-white",
        borderClass: "border-transparent",
    },
};

export const ACHIEVEMENT_ORDER: AchievementColor[] = ["white", "gray", "red", "yellow", "lime", "green"];

export const ACHIEVEMENT_INFOS = ACHIEVEMENT_ORDER.map(key => ACHIEVEMENT_THEME[key]);
