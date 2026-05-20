'use client';

import { SidebarProvider } from "@/components/ui/sidebar";

export function SidebarLayout({ children, defaultOpen = true }: { children: React.ReactNode; defaultOpen?: boolean }) {
    return <SidebarProvider defaultOpen={defaultOpen}>{children}</SidebarProvider>;
}
