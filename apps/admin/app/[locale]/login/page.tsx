"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authLogin } from "@/services/auth-api-service";
import { AlertCircle, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, Input } from "@/components/ui";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useTheme } from "@/components/providers/NextThemeProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const t = useTranslations("Admin.login");
  const themeT = useTranslations("Admin.dashboard.theme");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loginMutation = useMutation({
    mutationFn: authLogin,
    onSuccess: (response) => {
      const roles = response.data?.user?.roles || [];
      const isAdmin = roles.includes("ROLE_ADMIN");

      if (!isAdmin) {
        setErrorMsg(t("accessDenied"));
        return;
      }

      router.push("/overview");
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || t("unknownError"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-surface px-4 py-12 font-sans text-text-primary sm:px-6 lg:px-8">
      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
        <LanguageSwitcher />
        <LoginThemeToggle
          lightLabel={themeT("light")}
          darkLabel={themeT("dark")}
          switchToLightLabel={themeT("switchToLight")}
          switchToDarkLabel={themeT("switchToDark")}
        />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-black shadow-lg">
            <span className="absolute z-10 text-3xl font-extrabold italic tracking-tighter text-white">
              t
            </span>
            <span className="absolute z-0 -translate-x-0.5 -translate-y-0.5 text-3xl font-extrabold italic tracking-tighter text-cyan">
              t
            </span>
            <span className="absolute z-0 translate-x-0.5 translate-y-0.5 text-3xl font-extrabold italic tracking-tighter text-brand">
              t
            </span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-text-primary">
          {t("title")}
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-text-muted">
          {t("subtitle")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="border border-elevated bg-background px-4 py-8 shadow-2xl shadow-black/10 sm:rounded-2xl sm:px-10">
          {errorMsg && (
            <div className="mb-6 rounded-md border-l-4 border-red-500 bg-red-500/10 p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {errorMsg}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              type="email"
              required
              label={t("emailLabel")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="rounded-xl px-4 py-3 sm:text-sm"
            />

            <Input
              type="password"
              required
              label={t("passwordLabel")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              className="rounded-xl px-4 py-3 sm:text-sm"
            />

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={loginMutation.isPending}
                className="w-full rounded-lg px-4 py-3 text-sm"
              >
                {loginMutation.isPending ? t("submitting") : t("submit")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function LoginThemeToggle({
  lightLabel,
  darkLabel,
  switchToLightLabel,
  switchToDarkLabel,
}: {
  lightLabel: string;
  darkLabel: string;
  switchToLightLabel: string;
  switchToDarkLabel: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={
        resolvedTheme === "dark" ? switchToLightLabel : switchToDarkLabel
      }
      title={resolvedTheme === "dark" ? lightLabel : darkLabel}
      suppressHydrationWarning
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-elevated bg-background text-text-muted shadow-sm hover:bg-hover hover:text-text-primary"
    >
      <Sun className="h-5 w-5 hidden dark:block" aria-hidden="true" />
      <Moon className="h-5 w-5 block dark:hidden" aria-hidden="true" />
    </button>
  );
}
