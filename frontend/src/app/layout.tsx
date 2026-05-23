import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LearnTOEIC - Luyện Thi TOEIC Trực Tuyến Số 1",
  description: "Nền tảng học tập và ôn thi thử TOEIC trực tuyến, quản lý kế hoạch học tập cá nhân hóa và theo dõi tiến trình thông minh.",
  keywords: ["TOEIC", "luyện thi toeic", "toeic online", "toeic reading", "tiếng anh"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/20">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
