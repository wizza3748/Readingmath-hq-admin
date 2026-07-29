import type { Metadata } from "next";
import ConditionalLayout from "@/components/app/conditional-layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "리딩수학과학 프로토타입",
  description: "리딩수학과학 본사 관리자 페이지",
  icons: {
    icon: [
      {
        url: "https://framerusercontent.com/images/mB5unjxRr8Soyu8ve5oN3fzTi4.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "https://framerusercontent.com/images/MeQL98VgcmhT072SuMzmGneYdQ.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
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
