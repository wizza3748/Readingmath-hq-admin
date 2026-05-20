"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { AppSidebar } from "@/components/app/sidebar";
import { Header } from "@/components/app/header";
import { SidebarInset } from "@/components/ui/sidebar";
import { SidebarLayout } from "@/components/app/sidebar-layout";
import { SidebarStateController } from "@/components/app/sidebar-state-controller";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export default function ConditionalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    // P0-1: exam-prep 및 science-home 하위 경로 전체에서 사이드바 및 글로벌 헤더 미노출 보장
    const isStandalone = pathname?.startsWith("/content/exam-prep") || pathname?.startsWith("/content/science-home");

    if (isStandalone) {
        return (
            <body className="font-body antialiased" suppressHydrationWarning>
                <FirebaseClientProvider>
                    {children}
                    <Toaster />
                </FirebaseClientProvider>
                <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />
            </body>
        );
    }

    const sidebarDefaultOpen = !pathname?.startsWith("/admin/task-center");

    return (
        <body className="font-body antialiased" suppressHydrationWarning>
            <FirebaseClientProvider>
                <SidebarLayout defaultOpen={sidebarDefaultOpen}>
                    <SidebarStateController />
                    <AppSidebar />
                    <SidebarInset>
                        <Header />
                        <main>{children}</main>
                    </SidebarInset>
                </SidebarLayout>
                <Toaster />
            </FirebaseClientProvider>
            <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="afterInteractive" />
        </body>
    );
}
