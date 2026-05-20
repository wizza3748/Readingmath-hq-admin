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
      viewBox="0 0 65 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8"
    >
      <path d="M57.846 16.6857V10.5254C44.8766 10.5254 37.5134 18.9598 31.4435 27.5853C25.3736 18.9599 18.0104 10.5254 5.04102 10.5254V16.6857C15.8896 16.6857 21.8123 24.3991 27.7158 33.0196C21.8123 41.6402 15.8896 49.3535 5.04102 49.3535V55.5138C18.0104 55.5138 25.3736 47.0794 31.4435 38.4539C37.5134 47.0793 44.8766 55.5138 57.846 55.5138V49.3535C46.9974 49.3535 41.0747 41.6401 35.1712 33.0196C41.0747 24.399 46.9974 16.6857 57.846 16.6857Z" fill="#002775" />
      <path d="M62.0854 35.2805V30.7588H47.259V35.2805H62.0854Z" fill="#F7417A" />
      <path d="M38.8561 7.10298H33.7038V1.95068H29.1821V7.10298H24.0298V11.6247H29.1821V16.777H33.7038V11.6247H38.8561V7.10298Z" fill="#4BC8DC" />
      <path d="M38.4404 58.4543V54.4062H24.4456V58.4543H38.4404Z" fill="#64C947" />
      <path d="M33.4673 64.0496V60.0015H29.4192V64.0496H33.4673Z" fill="#64C947" />
      <path d="M33.4673 52.8591V48.811H29.4192V52.8591H33.4673Z" fill="#64C947" />
      <path d="M15.4008 29.3765L12.2035 26.1792L8.56033 29.8225L4.91703 26.1792L1.71973 29.3765L5.36303 33.0197L1.71973 36.663L4.91703 39.8603L8.56033 36.217L12.2035 39.8603L15.4008 36.663L11.7576 33.0197L15.4008 29.3765Z" fill="#FF9B4E" />
    </svg>
  )
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 font-bold font-headline text-lg">
          <AppLogo />
          <span className="text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Readingmath <span className="font-normal text-sidebar-foreground/80">Admin</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <AppNav />
      </SidebarContent>
    </Sidebar>
  );
}
