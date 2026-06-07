import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "万能导入 V2 - 智能多格式批量下单系统",
  description: "通过 AI 大模型实现任意格式文件的智能解析与导入",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <header className="bg-surface border-b border-border sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-primary">万能导入 V2</h1>
                  <p className="text-sm text-text-muted">智能多格式批量下单系统</p>
                </div>
                <nav className="flex gap-4">
                  <a href="/" className="px-4 py-2 rounded-lg hover:bg-primary-light text-text-secondary font-medium transition">导入</a>
                  <a href="/rules" className="px-4 py-2 rounded-lg hover:bg-primary-light text-text-secondary font-medium transition">解析规则</a>
                  <a href="/shipments" className="px-4 py-2 rounded-lg hover:bg-primary-light text-text-secondary font-medium transition">已导入运单</a>
                </nav>
              </div>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-border bg-surface mt-auto">
            <div className="max-w-7xl mx-auto px-6 py-4 text-center text-sm text-text-muted">
              万能导入 V2 —— 智能多格式批量下单系统 &copy; 2026
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
