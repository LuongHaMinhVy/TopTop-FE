import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Providers from "@/utils/providers";
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
  title: "TOPTOP - Management System",
  description: "TOPTOP - Management System",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="admin-theme-init" strategy="beforeInteractive">
          {`
            try {
              var theme = localStorage.getItem('theme') || 'system';
              var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              var resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
              document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
              document.documentElement.style.colorScheme = resolvedTheme;
            } catch (_) {}
          `}
        </Script>
        <RuntimeIntlProvider initialLocale={locale}>
          <Providers>{children}</Providers>
        </RuntimeIntlProvider>
      </body>
    </html>
  );
}

