"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLogoutMutation, useReactivateAccountMutation } from "@/hooks/auth-hooks";
import type { AuthResponse } from "@/types/auth";

export function AccountReactivationDialog({
  authData,
  onActivated,
  onCancelled,
}: {
  authData: AuthResponse;
  onActivated: () => void;
  onCancelled: () => void;
}) {
  const t = useTranslations("auth.reactivation");
  const reactivateMutation = useReactivateAccountMutation(() => onActivated());
  const logoutMutation = useLogoutMutation();
  const isPending = reactivateMutation.isPending || logoutMutation.isPending;
  const isPendingDeletion = authData.reactivationReason === "PENDING_DELETION";

  const handleCancel = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => onCancelled(),
    });
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4">
      <div
        role="dialog"
        aria-modal="true"
        className="modal-opacity-solid w-full max-w-[420px] rounded-xl border border-elevated bg-background p-6 text-text-primary shadow-2xl"
      >
        <h2 className="text-xl font-black">{t("title")}</h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          {isPendingDeletion ? t("pendingDeletionDescription") : t("deactivatedDescription")}
        </p>
        {authData.deletionScheduledAt && (
          <p className="mt-3 rounded-lg bg-elevated px-3 py-2 text-xs font-semibold text-text-muted">
            {t("scheduledAt", {
              value: new Date(authData.deletionScheduledAt).toLocaleString(),
            })}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={handleCancel}
            className="h-11 flex-1 rounded-md border border-elevated bg-background px-4 text-sm font-bold text-text-primary transition hover:bg-hover disabled:opacity-60"
          >
            {logoutMutation.isPending ? <Loader2 className="mx-auto size-4 animate-spin" /> : t("cancel")}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => reactivateMutation.mutate()}
            className="h-11 flex-1 rounded-md bg-brand px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {reactivateMutation.isPending ? <Loader2 className="mx-auto size-4 animate-spin" /> : t("confirm")}
          </button>
        </div>
        {reactivateMutation.isError && (
          <p className="mt-3 text-sm font-semibold text-brand">
            {reactivateMutation.error instanceof Error ? reactivateMutation.error.message : t("error")}
          </p>
        )}
      </div>
    </div>
  );
}
