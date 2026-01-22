
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
    ],
  },
  {
    title: "콘텐츠관리",
    icon: <Library />,
    children: [
      { title: "진단평가관리(과학)", href: "/content/diagnostic-tests" },
      { title: "진단평가 보고서샘플(과학)", href: "/content/diagnostic-test-report-samples" },
    ],
  },
  {
    title: "선생님관리(B2C)",
    icon: <Users />,
    children: [
      { title: "학습상담 상세", href: "/b2c/learning-counseling-detail" },
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
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible-button:rotate-180 group-data-[collapsible=icon]:hidden" />
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
                <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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
