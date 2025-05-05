import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import "./globals.css";

// 使用Inter字体替代Geist，这是Next.js支持良好的系统字体
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Climate AI",
  description: "AI-powered climate research and insights platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <SessionProvider>
          <SidebarProvider>
            <div className="container relative">
              <header className="top-header z-50">
                <Navbar />
                <SidebarTrigger className="lg:hidden ml-2" />
              </header>
              <Sidebar />
              <main className="main-content overflow-visible">
                <div className="pt-[60px] w-full">
                  {children}
                </div>
              </main>
            </div>
          </SidebarProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

