
import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "문제 미리보기",
  description: "문제 미리보기 페이지",
};

export default function PreviewLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
