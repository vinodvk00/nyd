import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { SWRProvider } from "./swr-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { HeaderProvider } from "@/contexts/header-context";
import { ProtectedRoute } from "@/components/protected-route";
import { ConditionalAppShell } from "@/components/layout/ConditionalAppShell";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nyd",
  description: "measure becoming, not just doing?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <HeaderProvider>
              <ProtectedRoute>
                <SWRProvider>
                  <ConditionalAppShell>
                    {children}
                  </ConditionalAppShell>
                </SWRProvider>
              </ProtectedRoute>
            </HeaderProvider>
          </AuthProvider>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
