import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/components/providers/StoreProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { ThemeProvider } from "@/components/providers/NextThemeProvider";
import { RuntimeIntlProvider } from "@/components/providers/RuntimeIntlProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | TopTop",
    default: "TopTop - Make Your Day",
  },
  description: "Watch, create, and share short videos on TopTop.",
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-text-primary transition-colors duration-300">
        <RuntimeIntlProvider initialLocale={locale}>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="system" 
            enableSystem
            enableColorScheme={false}
          >
            <QueryProvider>
              <StoreProvider>
                <AuthWrapper>
                  {children}
                </AuthWrapper>
              </StoreProvider>
            </QueryProvider>
          </ThemeProvider>
        </RuntimeIntlProvider>
      </body>
    </html>
  );
}
