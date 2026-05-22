export interface ProblemMapping {
  typeId: string;
  difficulty: "basic" | "intermediate" | "advanced";
  important: boolean;
}

// 수학 목데이터 매핑 테이블 (MATH_PRINT_SAMPLES의 id 기준)
export const MATH_PROBLEM_MAPPINGS: Record<string, ProblemMapping> = {
  "math-sample-1": { typeId: "mt-초3-1-0-0", difficulty: "basic", important: true },
  "math-sample-2": { typeId: "mt-초3-1-0-0", difficulty: "basic", important: false },
  "math-sample-3": { typeId: "mt-초3-1-0-0", difficulty: "intermediate", important: true },
  "math-sample-4": { typeId: "mt-초3-1-0-0", difficulty: "intermediate", important: false },
  "math-sample-5": { typeId: "mt-초3-1-0-0", difficulty: "advanced", important: true },
  "math-sample-6": { typeId: "mt-초3-1-0-1", difficulty: "basic", important: true },
  "math-sample-7": { typeId: "mt-초3-1-0-1", difficulty: "basic", important: false },
  "math-sample-8": { typeId: "mt-초3-1-0-1", difficulty: "intermediate", important: true },
  "math-sample-9": { typeId: "mt-초3-1-0-1", difficulty: "advanced", important: true },
  "math-sample-10": { typeId: "mt-초3-1-0-1", difficulty: "advanced", important: false }
};

// 과학 목데이터 매핑 테이블 (SCIENCE_PRINT_SAMPLES의 id 기준)
export const SCIENCE_PROBLEM_MAPPINGS: Record<string, ProblemMapping> = {
  "science-sample-1": { typeId: "sc-초3-1-0-1-1", difficulty: "basic", important: true },
  "science-sample-2": { typeId: "sc-초3-1-0-1-1", difficulty: "basic", important: false },
  "science-sample-3": { typeId: "sc-초3-1-0-1-2", difficulty: "intermediate", important: true },
  "science-sample-4": { typeId: "sc-초3-1-0-1-2", difficulty: "intermediate", important: false },
  "science-sample-5": { typeId: "sc-초3-1-0-1-3", difficulty: "advanced", important: true },
  "science-sample-6": { typeId: "sc-초3-1-0-2-1", difficulty: "basic", important: true },
  "science-sample-7": { typeId: "sc-초3-1-0-2-1", difficulty: "basic", important: false },
  "science-sample-8": { typeId: "sc-초3-1-0-2-2", difficulty: "intermediate", important: true },
  "science-sample-9": { typeId: "sc-초3-1-0-2-2", difficulty: "intermediate", important: false },
  "science-sample-10": { typeId: "sc-초3-1-0-2-3", difficulty: "advanced", important: true }
};
