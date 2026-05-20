"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";

const TASK_CENTER_PATH = "/admin/task-center";

/**
 * task-center 구간 진입 시에만 사이드바를 닫습니다.
 * - 다른 경로 → task-center: 닫힘
 * - task-center → 다른 경로: 열림
 * - task-center 내부 이동: 상태 유지 (수동 토글 허용)
 */
export function SidebarStateController() {
  const pathname = usePathname();
  const { setOpen } = useSidebar();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPathRef.current;
    const isNowTaskCenter = pathname?.startsWith(TASK_CENTER_PATH) ?? false;
    const wasTaskCenter = prev?.startsWith(TASK_CENTER_PATH) ?? false;

    // 구간이 바뀔 때만 사이드바 상태 변경
    if (!wasTaskCenter && isNowTaskCenter) {
      // 외부 → task-center 진입: 닫기
      setOpen(false);
    } else if (wasTaskCenter && !isNowTaskCenter) {
      // task-center → 외부 이동: 열기
      setOpen(true);
    }
    // task-center 내부 이동이나 외부 간 이동은 건드리지 않음

    prevPathRef.current = pathname;
  }, [pathname, setOpen]);

  return null;
}
