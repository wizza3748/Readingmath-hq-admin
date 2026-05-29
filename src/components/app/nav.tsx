
// Navigation configuration
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  Library,
  ClipboardList,
  Network,
  Settings,
  UserCog,
  ScrollText,
  ChevronDown,
  ShoppingCart,
  GitBranch,
  Wallet,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  disabled?: boolean;
  type?: "link" | "label";
};

const navConfig: NavItem[] = [
  {
    title: "일감보드",
    href: "/",
    icon: <LayoutDashboard />,
  },
  {
    title: "[본사관리자]",
    type: "label",
  },
  {
    title: "기관관리",
    icon: <Building2 />,
    children: [
      { title: "기관목록", href: "/institutions" },
    ],
  },
  {
    title: "지사관리",
    icon: <GitBranch />,
    children: [
      { title: "지사 목록", href: "/branches" },
      { title: "정산 내역", href: "/branch-settlements" },
    ],
  },
  {
    title: "콘텐츠관리",
    icon: <Library />,
    children: [
      { title: "진단평가관리(과학)", href: "/content/diagnostic-tests" },
      { title: "진단평가 보고서샘플(과학)", href: "/content/diagnostic-test-report-samples" },
      { title: "문제은행(과학)", href: "/content/science-question-bank" },
    ],
  },
  {
    title: "선생님관리(B2C)",
    icon: <Users />,
    children: [
      { title: "학습상담", href: "/b2c/learning-counseling-detail" },
      { title: "주간학습알림", href: "/b2c/weekly-notification" },
    ],
  },
  {
    title: "공동구매관리",
    href: "/admin/groupbuy",
    icon: <ShoppingCart />,
  },
  {
    title: "[기관관리자]",
    type: "label",
  },
  {
    title: "학생관리",
    icon: <Users />,
    children: [
      { title: "학생목록", href: "/admin/student-list" },
    ],
  },
  {
    title: "선생님관리",
    icon: <UserCog />,
    children: [
      { title: "선생님목록", href: "/admin/teacher-list" },
    ],
  },
  {
    title: "학습관리",
    icon: <GraduationCap />,
    children: [
      { title: "학습내역", href: "/admin/learning-history" },
      { title: "과제 센터", href: "/admin/task-center" },
    ],
  },
];

function NavMenu({ items, level = 0 }: { items: NavItem[], level?: number }) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item, index) => {
        const isChildActive = item.children ? item.children.some(child => child.href && pathname.startsWith(child.href)) : false;
        const isActive = item.href ? (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) : isChildActive;

        const [isOpen, setIsOpen] = React.useState(isChildActive);

        React.useEffect(() => {
          if (isChildActive) {
            setIsOpen(true);
          }
        }, [isChildActive, pathname]);

        if (item.children) {
          return (
            <SidebarMenuItem key={index} asChild>
              <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <div className="relative">
                  <CollapsibleTrigger asChild disabled={item.disabled}>
                    <SidebarMenuButton className="group/collapsible-button justify-between" isActive={isActive}>
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible-button:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <SidebarMenuSub
                    className={cn(
                      level > 0 && "mx-3.5 border-l px-2.5 py-1"
                    )}
                  >
                    <NavMenu items={item.children} level={level + 1} />
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuItem>
          );
        }

        if (item.type === "label") {
          return (
            <div
              key={index}
              className="px-4 py-2 mt-2 text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-widest select-none"
            >
              {item.title}
            </div>
          );
        }

        return (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton asChild isActive={isActive}>
              <Link href={item.href || "#"}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}


export function AppNav() {
  return (
    <SidebarMenu>
      <NavMenu items={navConfig} />
    </SidebarMenu>
  );
}
