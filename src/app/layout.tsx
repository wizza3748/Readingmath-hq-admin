import type { Metadata } from "next";
import Script from "next/script";
import { AppSidebar } from "@/components/app/sidebar";
import { Header } from "@/components/app/header";
import { SidebarInset } from "@/components/ui/sidebar";
import { SidebarLayout } from "@/components/app/sidebar-layout";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Readingmath HQ Admin",
  description: "리딩수학과학 본사 관리자 페이지",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <SidebarLayout>
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
    </html>
  );
}
