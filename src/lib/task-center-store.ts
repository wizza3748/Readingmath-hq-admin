"use client";

import { create } from "zustand";
import {
  TaskItem,
  Subject,
  INITIAL_TASKS,
  StudentAssignment,
  SAMPLE_STUDENTS,
} from "./task-center-mock";

interface TaskCenterStore {
  tasks: TaskItem[];
  currentSubject: Subject;
  setCurrentSubject: (subject: Subject) => void;
  addTask: (task: TaskItem) => void;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => void;
  deleteTask: (taskId: string) => void;
  duplicateTask: (taskId: string) => TaskItem;
  assignStudents: (taskId: string, classGroups: string[], individualIds: string[]) => void;
  endTask: (taskId: string) => void;
}

export const useTaskCenterStore = create<TaskCenterStore>((set, get) => ({
  tasks: INITIAL_TASKS,
  currentSubject: "math",

  setCurrentSubject: (subject) => set({ currentSubject: subject }),

  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),

  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    })),

  deleteTask: (taskId) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) })),

  duplicateTask: (taskId) => {
    const source = get().tasks.find((t) => t.id === taskId);
    if (!source) throw new Error("Task not found");
    const newId = `task-${Date.now()}`;
    const { timeLimit: _omitTimeLimit, ...rest } = source;
    const newTask: TaskItem = {
      ...rest,
      id: newId,
      name: `${source.name} (복제)`,
      status: "draft",
      createdAt: new Date().toISOString(),
      assignedStudents: [],
      assignedClasses: [],
      individualStudentIds: [],
      timeLimit: undefined,
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    return newTask;
  },

  assignStudents: (taskId: string, classGroups: string[], individualIds: string[]) => {
    const allStudents = SAMPLE_STUDENTS;
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;

        // 1. 현재 유지되어야 하는 학생들 (진행중 이상)
        const lockedStudents = t.assignedStudents.filter(s => s.status !== "not_started");
        const lockedIds = new Set(lockedStudents.map(s => s.studentId));

        // 2. 새로운 배정 대상 학생 ID 합집합
        const newTargetIds = new Set([
          ...individualIds,
          ...allStudents
            .filter(s => classGroups.includes(s.classGroup))
            .map(s => s.studentId)
        ]);

        // 3. 최종 배정 학생 목록 구성
        // 기존 학생 중 유지되거나 새로 추가된 학생들
        const finalStudents: StudentAssignment[] = [
          ...lockedStudents,
          ...Array.from(newTargetIds)
            .filter(id => !lockedIds.has(id))
            .map(id => {
              const student = allStudents.find(s => s.studentId === id);
              return {
                studentId: id,
                studentName: student?.studentName ?? id,
                classGroup: student?.classGroup ?? "",
                status: "not_started" as const,
                printStatus: "not_printed" as const,
                problemCount: t.totalProblems,
              };
            })
        ];

        // 4. 상태 결정
        const hasStudents = finalStudents.length > 0;
        const newStatus = hasStudents ? "published" : "draft";

        return {
          ...t,
          status: newStatus,
          assignedStudents: finalStudents,
          assignedClasses: classGroups,
          individualStudentIds: individualIds,
        };
      }),
    }));
  },

  endTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        // 학생 상태는 그대로 보존, 과제 상태만 "ended"로 변경
        return { ...t, status: "ended" };
      }),
    }));
  },
}));
