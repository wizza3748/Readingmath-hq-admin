import Link from "next/link";
import { AppNav } from "@/components/app/nav";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";

function AppLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 text-sidebar-primary"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 font-bold font-headline text-lg">
          <AppLogo />
          <span className="text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            리딩수학과학 <span className="font-normal text-sidebar-foreground/80">본사/기관</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <AppNav />
      </SidebarContent>
    </Sidebar>
  );
}
