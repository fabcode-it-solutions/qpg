import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/SessionProvider";
import { injectEnvVars } from "@/lib/utils/env";
import ConsentProvider from "@/components/providers/ConsentProvider";
import ToastProvider from "@/components/providers/ToastProvider";
import Footer from "@/components/layout/Footer";
import "./globals.css";
import AuthWrapper from "@/components/common/AuthWrapper";

// Inject environment variables into window object
injectEnvVars();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QPG AI Assistant",
  description: "AI-powered assistant for QPG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ToastProvider>
            <ConsentProvider>
              <AuthWrapper>
                <div className="min-h-screen flex flex-col">
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </AuthWrapper>
            </ConsentProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
