"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";

// 진입 시 사이드바를 자동으로 닫아야 하는 경로 목록
const SIDEBAR_CLOSE_PATHS = [
  "/admin/task-center",
  "/admin/teacher-list",
  "/admin/student-list",
  "/learning-operations/task-status",
];

function isClosePath(pathname: string | null): boolean {
  return SIDEBAR_CLOSE_PATHS.some(p => pathname?.startsWith(p) ?? false);
}

/**
 * 지정된 경로 구간 진입 시 사이드바를 닫습니다.
 * - 다른 경로 → 해당 경로: 닫힘
 * - 해당 경로 → 다른 경로: 열림
 * - 같은 구간 내부 이동: 상태 유지 (수동 토글 허용)
 */
export function SidebarStateController() {
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPathRef.current;
    const isNowClose = isClosePath(pathname);
    const wasClose = isClosePath(prev);

    // 구간이 바뀔 때만 사이드바 상태 변경
    if (!wasClose && isNowClose) {
      // 외부 → 닫힘 구간 진입: 닫기
      setOpen(false);
    } else if (wasClose && !isNowClose) {
      // 닫힘 구간 → 외부 이동: 열기
      setOpen(true);
    }
    // 같은 구간 내부 이동이나 외부 간 이동은 건드리지 않음

    prevPathRef.current = pathname;
  }, [pathname, setOpen]);

  return null;
}
