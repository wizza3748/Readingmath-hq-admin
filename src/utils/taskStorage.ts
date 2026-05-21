"use client";

export interface Task {
    id: string;
    subject: "math" | "science";
    title: string;
    status: "notStarted" | "ongoing" | "submitted";
    assignedAt: string; // ISO String
    unitDisplayName?: string;
    totalProblems: number;
    solvedProblems?: number;
    score?: number;
    correctProblems?: number;
    submittedAt?: string;
    updatedAt?: string;
}

const DEFAULT_TASKS: Task[] = [
    // === 수학 과제 목록 (미시작 1, 진행중 2, 제출완료 5) ===
    {
        id: "math-task-001",
        subject: "math",
        title: "유리수의 소수 표현과 순환소수 심화 문제 풀이",
        status: "notStarted",
        assignedAt: "2026-05-21T09:10:00Z",
        unitDisplayName: "1단원-유리수와 순환소수",
        totalProblems: 10
    },
    {
        id: "math-task-002",
        subject: "math",
        title: "일차부등식의 활용 실생활 문장제 극복 훈련",
        status: "ongoing",
        assignedAt: "2026-05-20T10:00:00Z",
        updatedAt: "2026-05-21T14:30:00Z",
        unitDisplayName: "2단원-일차부등식과 연립방정식",
        totalProblems: 15,
        solvedProblems: 6
    },
    {
        id: "math-task-003",
        subject: "math",
        title: "연립일차방정식의 풀이 가감법과 대입법 기본 연습",
        status: "ongoing",
        assignedAt: "2026-05-20T08:00:00Z",
        updatedAt: "2026-05-20T10:00:00Z",
        unitDisplayName: "2단원-일차부등식과 연립방정식",
        totalProblems: 12,
        solvedProblems: 9
    },
    {
        id: "math-task-004",
        subject: "math",
        title: "소인수분해 기본 개념 확인 평가",
        status: "submitted",
        assignedAt: "2026-05-19T09:00:00Z",
        submittedAt: "2026-05-19T10:30:00Z",
        unitDisplayName: "1단원-소인수분해",
        totalProblems: 10,
        score: 80,
        correctProblems: 8
    },
    {
        id: "math-task-005",
        subject: "math",
        title: "최대공약수와 최소공배수의 활용 실전",
        status: "submitted",
        assignedAt: "2026-05-18T15:00:00Z",
        submittedAt: "2026-05-18T16:20:00Z",
        unitDisplayName: "1단원-소인수분해",
        totalProblems: 8,
        score: 88,
        correctProblems: 7
    },
    {
        id: "math-task-006",
        subject: "math",
        title: "정수와 유리수의 사칙연산 타임어택",
        status: "submitted",
        assignedAt: "2026-05-17T10:00:00Z",
        submittedAt: "2026-05-17T11:00:00Z",
        unitDisplayName: "2단원-정수와 유리수",
        totalProblems: 20,
        score: 90,
        correctProblems: 18
    },
    {
        id: "math-task-007",
        subject: "math",
        title: "문자를 사용한 식과 식의 계산 기초",
        status: "submitted",
        assignedAt: "2026-05-16T14:00:00Z",
        submittedAt: "2026-05-16T15:45:00Z",
        unitDisplayName: "3단원-문자와 식",
        totalProblems: 15,
        score: 80,
        correctProblems: 12
    },
    {
        id: "math-task-008",
        subject: "math",
        title: "일차방정식의 풀이 및 오류 찾기 연습",
        status: "submitted",
        assignedAt: "2026-05-15T08:00:00Z",
        submittedAt: "2026-05-15T09:00:00Z",
        unitDisplayName: "3단원-문자와 식",
        totalProblems: 10,
        score: 100,
        correctProblems: 10
    },

    // === 과학 과제 목록 (미시작 1, 진행중 2, 제출완료 5) ===
    {
        id: "sci-task-001",
        subject: "science",
        title: "순물질과 혼합물의 특징 비교하기 실전 퀴즈",
        status: "notStarted",
        assignedAt: "2026-05-21T09:05:00Z",
        unitDisplayName: "1단원-물질의 특성",
        totalProblems: 10
    },
    {
        id: "sci-task-002",
        subject: "science",
        title: "지구의 층상 구조와 지각 변동 단원 마무리",
        status: "ongoing",
        assignedAt: "2026-05-20T08:00:00Z",
        updatedAt: "2026-05-21T15:10:00Z",
        unitDisplayName: "2단원-지구계와 지각 변동",
        totalProblems: 15,
        solvedProblems: 5
    },
    {
        id: "sci-task-003",
        subject: "science",
        title: "빛의 굴절과 반사 법칙 형성 평가",
        status: "ongoing",
        assignedAt: "2026-05-19T07:00:00Z",
        updatedAt: "2026-05-20T11:20:00Z",
        unitDisplayName: "3단원-빛과 파동",
        totalProblems: 8,
        solvedProblems: 4
    },
    {
        id: "sci-task-004",
        subject: "science",
        title: "물질의 세 가지 상태와 분자 운동 기초",
        status: "submitted",
        assignedAt: "2026-05-18T10:00:00Z",
        submittedAt: "2026-05-19T14:00:00Z",
        unitDisplayName: "1단원-물질의 상태 변화",
        totalProblems: 10,
        score: 90,
        correctProblems: 9
    },
    {
        id: "sci-task-005",
        subject: "science",
        title: "상태 변화와 열에너지 흡수/방출 이해도 평가",
        status: "submitted",
        assignedAt: "2026-05-17T09:00:00Z",
        submittedAt: "2026-05-18T10:15:00Z",
        unitDisplayName: "1단원-물질의 상태 변화",
        totalProblems: 12,
        score: 83,
        correctProblems: 10
    },
    {
        id: "sci-task-006",
        subject: "science",
        title: "기체의 압력과 부피 관계(보일의 법칙) 실험 분석",
        status: "submitted",
        assignedAt: "2026-05-16T15:00:00Z",
        submittedAt: "2026-05-17T17:30:00Z",
        unitDisplayName: "2단원-기체의 성질",
        totalProblems: 10,
        score: 80,
        correctProblems: 8
    },
    {
        id: "sci-task-007",
        subject: "science",
        title: "온도에 따른 기체의 부피 변화(샤를의 법칙) 응용",
        status: "submitted",
        assignedAt: "2026-05-15T10:00:00Z",
        submittedAt: "2026-05-16T12:00:00Z",
        unitDisplayName: "2단원-기체의 성질",
        totalProblems: 10,
        score: 70,
        correctProblems: 7
    },
    {
        id: "sci-task-008",
        subject: "science",
        title: "물질의 구성 원소와 불꽃 반응 색 구별 퀴즈",
        status: "submitted",
        assignedAt: "2026-05-14T13:00:00Z",
        submittedAt: "2026-05-15T14:50:00Z",
        unitDisplayName: "3단원-물질의 구성",
        totalProblems: 15,
        score: 100,
        correctProblems: 15
    }
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
        
        // 강제 리셋 및 신규 16개 과제 마이그레이션 조건 검사
        // 16개보다 현저히 적거나 새 ID(math-task-, sci-task-) 패턴이 온전히 존재하지 않으면 초기화
        const hasNewMath = parsed.some(t => t.id.startsWith("math-task-"));
        const hasNewSci = parsed.some(t => t.id.startsWith("sci-task-"));
        
        if (parsed.length < DEFAULT_TASKS.length || !hasNewMath || !hasNewSci) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TASKS));
            return DEFAULT_TASKS;
        }
        
        let changed = false;
        const migrated = parsed.map(t => {
            let itemChanged = false;
            const updatedItem = { ...t };
            
            // status 마이그레이션: not_started -> notStarted
            if ((updatedItem.status as string) === "not_started") {
                updatedItem.status = "notStarted" as const;
                itemChanged = true;
            }
            
            // totalProblems 방어 및 복구
            if (updatedItem.totalProblems === undefined || updatedItem.totalProblems === null || isNaN(Number(updatedItem.totalProblems))) {
                const defaultItem = DEFAULT_TASKS.find(d => d.id === updatedItem.id);
                updatedItem.totalProblems = defaultItem ? defaultItem.totalProblems : 10;
                itemChanged = true;
            }

            // correctProblems 방어 (submitted 상태인데 correctProblems가 없는 경우)
            if (updatedItem.status === "submitted" && (updatedItem.correctProblems === undefined || updatedItem.correctProblems === null || isNaN(Number(updatedItem.correctProblems)))) {
                const defaultItem = DEFAULT_TASKS.find(d => d.id === updatedItem.id);
                updatedItem.correctProblems = defaultItem && defaultItem.correctProblems !== undefined ? defaultItem.correctProblems : updatedItem.totalProblems;
                itemChanged = true;
            }

            // score 방어 (submitted 상태인데 score가 없는 경우)
            if (updatedItem.status === "submitted" && (updatedItem.score === undefined || updatedItem.score === null || isNaN(Number(updatedItem.score)))) {
                const defaultItem = DEFAULT_TASKS.find(d => d.id === updatedItem.id);
                updatedItem.score = defaultItem && defaultItem.score !== undefined ? defaultItem.score : 80;
                itemChanged = true;
            }
            
            if (itemChanged) {
                changed = true;
            }
            return updatedItem;
        });

        if (changed) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            return migrated;
        }
        
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
    return tasks.filter(t => t.subject === subject && t.status === "notStarted");
}

export function getLatestUnstartedTask(subject: "math" | "science"): Task | null {
    const unstarted = getUnstartedTasks(subject);
    if (unstarted.length === 0) return null;
    // 배정일시(assignedAt) 기준 내림차순 정렬하여 가장 최근 과제 반환
    return [...unstarted].sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())[0];
}

export function updateTaskStatus(taskId: string, newStatus: Task["status"]): Task[] {
    const tasks = getStoredTasks();
    const updated = tasks.map(t => {
        if (t.id === taskId) {
            const updates: Partial<Task> = { status: newStatus };
            if (newStatus === "ongoing") {
                updates.updatedAt = new Date().toISOString();
                if (t.solvedProblems === undefined) {
                    updates.solvedProblems = 0;
                }
            } else if (newStatus === "submitted") {
                updates.submittedAt = new Date().toISOString();
                if (t.score === undefined) {
                    updates.score = 100;
                    updates.correctProblems = t.totalProblems;
                }
            }
            return { ...t, ...updates };
        }
        return t;
    });
    saveStoredTasks(updated);
    // Custom event to trigger state updates in other components
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("task-status-changed"));
    }
    return updated;
}
