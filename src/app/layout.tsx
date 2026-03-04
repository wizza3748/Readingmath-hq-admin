import type { Metadata } from "next";
import ConditionalLayout from "@/components/app/conditional-layout";
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
      <ConditionalLayout>
        {children}
      </ConditionalLayout>
    </html>
  );
}
