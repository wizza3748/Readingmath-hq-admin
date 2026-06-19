"use client";

import { create } from "zustand";
import {
  TaskItem,
  Subject,
  INITIAL_TASKS,
  StudentAssignment,
  getAdaptedSampleStudents,
} from "./task-center-mock";
import { evaluateStudentAchievement } from "@/utils/examPrepStorage";

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
  resetToDefault: () => void;
}

const getInitialAdminTasks = (): TaskItem[] => {
  if (typeof window === "undefined") return INITIAL_TASKS;
  const saved = localStorage.getItem("readingmath_admin_tasks");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return INITIAL_TASKS;
    }
  }
  return INITIAL_TASKS;
};

export const useTaskCenterStore = create<TaskCenterStore>((set, get) => ({
  tasks: getInitialAdminTasks(),
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
    const allStudents = getAdaptedSampleStudents();
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
              
              let pCount = t.totalProblems;
              if (t.problemMode === "relearn") {
                const subject = t.subject || "math";
                pCount = (t.selectedTypes || []).reduce((sum, typeItem) => {
                  const cleanId = typeItem.typeId.replace(/-(basic|skill|advanced)$/, "");
                  const state = evaluateStudentAchievement(id, cleanId, subject);
                  
                  let isRelearn = state === "relearn";
                  if (!isRelearn) {
                    const num = parseInt(id.replace(/[^0-9]/g, ""), 10);
                    if (!isNaN(num)) {
                      isRelearn = (num % 5) < 3;
                    } else {
                      isRelearn = ["s1", "s2", "student-1", "student-2"].includes(id);
                    }
                  }

                  if (isRelearn) {
                    return sum + typeItem.problemCount;
                  }
                  return sum;
                }, 0);
              }

              return {
                studentId: id,
                studentName: student?.studentName ?? id,
                classGroup: student?.classGroup ?? "",
                status: "not_started" as const,
                printStatus: "not_printed" as const,
                problemCount: pCount,
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
  resetToDefault: () => set({ tasks: INITIAL_TASKS, currentSubject: "math" }),
}));

if (typeof window !== "undefined") {
  useTaskCenterStore.subscribe((state) => {
    localStorage.setItem("readingmath_admin_tasks", JSON.stringify(state.tasks));
    const { getStoredTasks } = require("@/utils/taskStorage");
    const studentTasks = [...getStoredTasks()];
    
    let isChanged = false;
    
    state.tasks.forEach((taskItem) => {
      const isStaticMock = INITIAL_TASKS.some(t => t.id === taskItem.id);
      if (isStaticMock) return;

      const existingIndex = studentTasks.findIndex(t => t.id === taskItem.id);
      
      if (taskItem.status === "published" || taskItem.status === "ended") {
        const mappedTask = {
          id: taskItem.id,
          subject: taskItem.subject,
          title: taskItem.name,
          status: existingIndex >= 0 ? studentTasks[existingIndex].status : "notStarted",
          assignedAt: taskItem.createdAt,
          unitDisplayName: taskItem.selectedTypes[0]?.majorUnit ?? "혼합 단원",
          totalProblems: taskItem.totalProblems,
          course: taskItem.course,
          solvedProblems: existingIndex >= 0 ? studentTasks[existingIndex].solvedProblems : undefined,
          score: existingIndex >= 0 ? studentTasks[existingIndex].score : undefined,
          correctProblems: existingIndex >= 0 ? studentTasks[existingIndex].correctProblems : undefined,
          submittedAt: existingIndex >= 0 ? studentTasks[existingIndex].submittedAt : undefined,
          updatedAt: existingIndex >= 0 ? studentTasks[existingIndex].updatedAt : undefined
        };
        
        const existingStr = existingIndex >= 0 ? JSON.stringify(studentTasks[existingIndex]) : "";
        const mappedStr = JSON.stringify(mappedTask);
        
        if (existingStr !== mappedStr) {
          if (existingIndex >= 0) {
            studentTasks[existingIndex] = mappedTask;
          } else {
            studentTasks.unshift(mappedTask);
          }
          isChanged = true;
        }
      } else if (taskItem.status === "draft" && existingIndex >= 0) {
        studentTasks.splice(existingIndex, 1);
        isChanged = true;
      }
    });
    
    if (isChanged) {
      window.__readingmath_tasks__ = studentTasks;
      localStorage.setItem("readingmath_student_tasks", JSON.stringify(studentTasks));
      window.dispatchEvent(new Event("task-status-changed"));
    }
  });
}
