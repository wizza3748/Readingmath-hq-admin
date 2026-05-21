"use client";

export interface Task {
    id: string;
    subject: "math" | "science";
    title: string;
    status: "not_started" | "ongoing" | "submitted";
    assignedAt: string; // ISO String
}

const DEFAULT_TASKS: Task[] = [
    // 과학 과제 목록
    {
        id: "sci-1",
        subject: "science",
        title: "순물질과 혼합물의 특징 비교하기 실전 퀴즈",
        status: "not_started",
        assignedAt: "2026-05-21T09:00:00Z",
    },
    {
        id: "sci-2",
        subject: "science",
        title: "물질의 특성(녹는점, 끓는점) 개념 이해도 확인 평가",
        status: "not_started",
        assignedAt: "2026-05-21T09:05:00Z", // 더 최근에 출제된 미시작 과제
    },
    {
        id: "sci-3",
        subject: "science",
        title: "지구의 층상 구조와 지각 변동 단원 마무리",
        status: "ongoing",
        assignedAt: "2026-05-20T08:00:00Z",
    },
    {
        id: "sci-4",
        subject: "science",
        title: "빛의 굴절과 반사 법칙 형성 평가",
        status: "submitted",
        assignedAt: "2026-05-19T07:00:00Z",
    },
    // 수학 과제 목록
    {
        id: "math-1",
        subject: "math",
        title: "유리수의 소수 표현과 순환소수 심화 문제 풀이",
        status: "not_started",
        assignedAt: "2026-05-21T09:10:00Z",
    },
    {
        id: "math-2",
        subject: "math",
        title: "순환소수를 분수로 나타내는 방법 개념 완성 트레이닝",
        status: "not_started",
        assignedAt: "2026-05-21T09:15:00Z", // 더 최근에 출제된 미시작 과제
    },
    {
        id: "math-3",
        subject: "math",
        title: "일차부등식의 활용 실생활 문장제 극복 훈련",
        status: "ongoing",
        assignedAt: "2026-05-20T10:00:00Z",
    },
    {
        id: "math-4",
        subject: "math",
        title: "연립일차방정식의 풀이 가감법과 대입법 기본 연습",
        status: "submitted",
        assignedAt: "2026-05-19T09:00:00Z",
    },
];

const STORAGE_KEY = "readingmath_student_tasks";

export function getStoredTasks(): Task[] {
    if (typeof window === "undefined") return DEFAULT_TASKS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TASKS));
        return DEFAULT_TASKS;
    }
    try {
        const parsed: Task[] = JSON.parse(stored);
        return parsed;
    } catch (e) {
        return DEFAULT_TASKS;
    }
}

export function saveStoredTasks(tasks: Task[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function getUnstartedTasks(subject: "math" | "science"): Task[] {
    const tasks = getStoredTasks();
    return tasks.filter(t => t.subject === subject && t.status === "not_started");
}

export function getLatestUnstartedTask(subject: "math" | "science"): Task | null {
    const unstarted = getUnstartedTasks(subject);
    if (unstarted.length === 0) return null;
    // 배정일시(assignedAt) 기준 내림차순 정렬하여 가장 최근 과제 반환
    return [...unstarted].sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())[0];
}

export function updateTaskStatus(taskId: string, newStatus: Task["status"]): Task[] {
    const tasks = getStoredTasks();
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    saveStoredTasks(updated);
    // Custom event to trigger state updates in other components
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("task-status-changed"));
    }
    return updated;
}
