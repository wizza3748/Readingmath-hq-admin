
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
};

const navConfig: NavItem[] = [
  {
    title: "대시보드",
    href: "/",
    icon: <LayoutDashboard />,
  },
  {
    title: "기관관리",
    icon: <Building2 />,
    children: [
      { title: "기관목록", href: "/institutions" },
      { title: "기관문의", href: "/institution-inquiries" },
      { title: "기관결제", href: "/institution-payments" },
      { title: "기관포인트", href: "/institution-points" },
    ],
  },
  {
    title: "학생관리",
    icon: <Users />,
    children: [
      { title: "학생목록", href: "/students" },
    ],
  },
  {
    title: "선생님관리(B2C)",
    icon: <GraduationCap />,
    children: [
      { title: "선생님목록", href: "/teachers" },
      { title: "월별관리현황", href: "/teachers/monthly-status" },
      { title: "선생님관리자 바로가기", href: "/teacher-admin" },
    ],
  },
  {
    title: "콘텐츠관리",
    icon: <Library />,
    children: [
      { title: "진단평가관리(과학)", href: "/content/diagnostic-tests" },
      { title: "학습관리(수학)", href: "/content/math" },
      { title: "학습관리(과학)", href: "/content/science" },
      { title: "커리큘럼관리", href: "/content/curriculum" },
    ],
  },
  {
    title: "게시판관리",
    icon: <ClipboardList />,
    children: [
      { title: "공지사항", href: "/board/notices" },
      { title: "자료실", href: "/board/resources" },
      { title: "FAQ", href: "/board/faq" },
    ],
  },
  {
    title: "지사관리",
    icon: <Network />,
    children: [
      { title: "지사 목록", href: "/branches" },
      { title: "정산 내역", href: "/branches/settlements" },
    ],
  },
  {
    title: "환경설정",
    href: "/settings/terms",
    icon: <Settings />,
  },
  {
    title: "운영자관리",
    href: "/admin-users",
    icon: <UserCog />,
  },
  {
    title: "로그관리",
    icon: <ScrollText />,
    children: [
      { title: "활동로그", href: "/logs/activity" },
      { title: "학습기록", href: "/logs/learning" },
    ],
  },
];

function NavMenu({ items, level = 0 }: { items: NavItem[], level?: number }) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item, index) => {
        const isActive = item.href ? (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) : false;
        const isChildActive = item.children ? item.children.some(child => child.href && pathname.startsWith(child.href)) : false;
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
                    <SidebarMenuButton className="group/collapsible-button justify-between">
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
