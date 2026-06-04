"use client";

import {
  type ElementType,
  type ReactNode,
} from "react";
import { Loader2, LogOut, Moon, Sun } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useTheme } from "@/components/providers/NextThemeProvider";
import { dashboardNavItems, type SectionKey } from "./dashboard-config";
import { TopTopMark } from "./dashboard-common";
import { authLogout } from "@/services/auth-api-service";
import { Link, usePathname, useRouter } from "@/i18n/routing";

export function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Admin.dashboard");
  const activeSection = getActiveSection(pathname);
  const activeNavItem =
    dashboardNavItems.find((item) => item.key === activeSection) ??
    dashboardNavItems[0];

  const logoutMutation = useMutation({
    mutationFn: authLogout,
    onSuccess: () => router.push("/login"),
  });

  return (
    <div className="min-h-screen bg-surface text-text-primary lg:pl-[260px]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-elevated bg-background px-4 py-5 lg:flex">
        <div className="mb-7 flex items-center gap-3 px-2">
          <TopTopMark />
          <div>
            <p className="text-lg font-black leading-tight">{t("brandName")}</p>
            <p className="text-xs font-semibold uppercase text-text-muted">
              {t("ops.trustOperations")}
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {dashboardNavItems.map((item) => (
            <SidebarItem
              key={item.key}
              icon={item.icon}
              label={t(item.labelKey)}
              active={activeSection === item.key}
              href={item.href}
            />
          ))}
        </nav>

        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="mt-auto flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-text-muted transition hover:bg-hover hover:text-text-primary"
        >
          {logoutMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          {t("logout")}
        </button>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-elevated bg-background/85 px-4 backdrop-blur-xl md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden">
              <TopTopMark />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-black md:text-2xl">
                {t(activeNavItem.titleKey)}
              </h1>
              <p className="hidden text-sm text-text-muted md:block">
                {t(activeNavItem.descriptionKey)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <div className="hidden items-center gap-3 border-l border-elevated pl-4 md:flex">
              <Avatar alt={t("header.adminTeam")} size="md" />
              <div>
                <p className="text-sm font-bold">{t("header.adminTeam")}</p>
                <p className="text-xs text-text-muted">{t("header.adminRole")}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 md:px-8">
          <MobileNav activeSection={activeSection} />

          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active,
  href,
}: {
  icon: ElementType;
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition ${
        active
          ? "bg-brand text-white shadow-lg shadow-brand/20"
          : "text-text-muted hover:bg-hover hover:text-text-primary"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

function MobileNav({
  activeSection,
}: {
  activeSection: SectionKey;
}) {
  const t = useTranslations("Admin.dashboard");

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:hidden">
      {dashboardNavItems.map((item) => {
        const Icon = item.icon;
        const active = activeSection === item.key;
        const label = t(item.labelKey);

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border px-1 text-[11px] font-black leading-tight ${
              active
                ? "border-brand bg-brand text-white"
                : "border-elevated bg-background text-text-muted"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="max-w-full truncate">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function getActiveSection(pathname: string): SectionKey {
  const normalizedPathname = normalizeDashboardPathname(pathname);
  const match = dashboardNavItems.find(
    (item) => item.href !== "/overview" && normalizedPathname.startsWith(item.href),
  );

  return match?.key ?? "overview";
}

function normalizeDashboardPathname(pathname: string): string {
  const normalized = pathname.replace(/^\/(vi|en)(?=\/|$)/, "") || "/";
  return normalized.endsWith("/") && normalized !== "/"
    ? normalized.slice(0, -1)
    : normalized;
}

function ThemeToggle() {
  const t = useTranslations("Admin.dashboard");
  const { resolvedTheme, setTheme } = useTheme();

  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={t(resolvedTheme === "dark" ? "theme.switchToLight" : "theme.switchToDark")}
      title={t(resolvedTheme === "dark" ? "theme.light" : "theme.dark")}
      suppressHydrationWarning
      className="flex h-10 w-10 items-center justify-center rounded-lg text-text-muted hover:bg-hover hover:text-text-primary"
    >
      <Sun
        className="h-5 w-5 dark:block hidden"
        aria-hidden="true"
        suppressHydrationWarning
      />
      <Moon
        className="h-5 w-5 dark:hidden block"
        aria-hidden="true"
        suppressHydrationWarning
      />
    </button>
  );
}
