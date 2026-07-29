import Link from "next/link";
import { AppNav } from "@/components/app/nav";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";

function AppLogo() {
  return (
    <img
      src="https://framerusercontent.com/images/MeQL98VgcmhT072SuMzmGneYdQ.png"
      alt=""
      className="h-8 w-8 shrink-0 object-contain"
    />
  );
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 font-bold font-headline text-lg">
          <AppLogo />
          <span className="whitespace-nowrap text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            리딩수학과학 프로토타입
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <AppNav />
      </SidebarContent>
    </Sidebar>
  );
}
