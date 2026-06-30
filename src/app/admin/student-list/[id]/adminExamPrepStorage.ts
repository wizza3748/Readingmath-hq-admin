// ─────────────────────────────────────────────────────────────────────────────
// 기관관리자 전용 시험 대비 삭제/초기화 localStorage 유틸
//
// ▸ 학생 프론트 데이터에는 절대 쓰지 않음
// ▸ readingmath_examprep_history_v1 키에는 읽기도 하지 않음 (AdminExamPrepTab에서 직접 읽기)
// ▸ 삭제/초기화 결과는 기관관리자 시험 대비 탭에서만 적용
// ─────────────────────────────────────────────────────────────────────────────

// ── 기관관리자 전용 localStorage 키 ───────────────────────────────────────────

/** 삭제된 풀이 기록 rowId 목록 (학생 ID별) — 목록 제외 + 성취도 재계산 단일 기준 */
const ADMIN_DELETED_KEY = "readingmath_admin_exam_deleted_v1";

/** 초기화 이력 기록 (학생 ID별) — 감사 로그 용도만, 목록 제외에 사용 안 함 */
const ADMIN_RESET_KEY = "readingmath_admin_exam_reset_v1";

// ── 타입 정의 ─────────────────────────────────────────────────────────────────

export type ResetScope = "all" | "grade" | "semester" | "unit";

export interface AdminResetRecord {
  subject: "math" | "science";
  scope: ResetScope;
  scopeLabel: string; // 예: "전체 초기화", "중등 1학년", "1단원-소인수분해"
  reason: string;     // 초기화 사유 입력값
  resetAt: string;    // ISO string
  deletedRowIds: string[]; // 이 초기화로 삭제된 rowId 목록
}

// ── 삭제 항목 관리 ────────────────────────────────────────────────────────────

/** 기관관리자가 삭제 처리한 rowId 목록 조회 */
export function getAdminDeletedIds(studentId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(ADMIN_DELETED_KEY);
    if (!saved) return [];
    const parsed: Record<string, string[]> = JSON.parse(saved);
    return parsed[studentId] || [];
  } catch {
    return [];
  }
}

/** 기관관리자가 삭제 처리할 rowId 1건 추가 */
export function addAdminDeletedId(studentId: string, rowId: string): void {
  if (typeof window === "undefined") return;
  const current = getAdminDeletedIds(studentId);
  if (current.includes(rowId)) return;
  _saveDeletedIds(studentId, [...current, rowId]);
}

/** 기관관리자가 삭제 처리할 rowId 여러 건 추가 (초기화 시 사용) */
export function addAdminDeletedIds(studentId: string, rowIds: string[]): void {
  if (typeof window === "undefined") return;
  const current = getAdminDeletedIds(studentId);
  const newIds = rowIds.filter((id) => !current.includes(id));
  if (newIds.length === 0) return;
  _saveDeletedIds(studentId, [...current, ...newIds]);
}

function _saveDeletedIds(studentId: string, ids: string[]): void {
  try {
    const saved = localStorage.getItem(ADMIN_DELETED_KEY);
    const parsed: Record<string, string[]> = saved ? JSON.parse(saved) : {};
    parsed[studentId] = ids;
    localStorage.setItem(ADMIN_DELETED_KEY, JSON.stringify(parsed));
  } catch {
    // localStorage 저장 실패 시 무시
  }
}

// ── 초기화 이력 관리 (감사 로그) ──────────────────────────────────────────────

/** 기관관리자 초기화 이력 조회 */
export function getAdminResetRecords(studentId: string): AdminResetRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(ADMIN_RESET_KEY);
    if (!saved) return [];
    const parsed: Record<string, AdminResetRecord[]> = JSON.parse(saved);
    return parsed[studentId] || [];
  } catch {
    return [];
  }
}

/** 기관관리자 초기화 이력 1건 추가 */
export function addAdminResetRecord(
  studentId: string,
  record: AdminResetRecord
): void {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem(ADMIN_RESET_KEY);
    const parsed: Record<string, AdminResetRecord[]> = saved
      ? JSON.parse(saved)
      : {};
    const current = parsed[studentId] || [];
    parsed[studentId] = [...current, record];
    localStorage.setItem(ADMIN_RESET_KEY, JSON.stringify(parsed));
  } catch {
    // localStorage 저장 실패 시 무시
  }
}
