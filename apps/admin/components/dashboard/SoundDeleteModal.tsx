"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { deleteAdminSound } from "@/services/sound-api-service";
import { Trash2, X } from "lucide-react";
import { Button } from "@repo/ui";

export function SoundDeleteModal({
  soundId,
  soundTitle,
  onClose,
  onDeleteSuccess,
}: {
  soundId: number;
  soundTitle: string;
  onClose: () => void;
  onDeleteSuccess: () => void;
}) {
  const t = useTranslations("Admin.dashboard.sounds");

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminSound(soundId),
    onSuccess: () => {
      onDeleteSuccess();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="modal-opacity-solid relative w-full max-w-md overflow-hidden rounded-2xl border border-elevated bg-background shadow-2xl p-6"
        data-modal-panel
      >
        <Button
          type="button"
          onClick={onClose}
          aria-label={t("cancel")}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-hover hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
            <Trash2 className="h-6 w-6" />
          </div>

          <h2 className="text-lg font-black text-text-primary mb-2">
            {t("deleteConfirmTitle")}
          </h2>
          <p className="text-sm text-text-muted mb-6">
            {t("deleteConfirmDesc")}
            {soundTitle && (
              <span className="block mt-2 font-bold text-text-primary">
                &quot;{soundTitle}&quot;
              </span>
            )}
          </p>

          <div className="flex w-full gap-3">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 items-center justify-center rounded-xl border border-elevated bg-background text-sm font-bold text-text-primary hover:bg-hover transition"
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              variant="danger"
              className="flex-1 h-10 items-center justify-center rounded-xl bg-red-500 text-sm font-bold text-white hover:bg-red-600 transition disabled:opacity-50 flex justify-center items-center gap-1.5"
            >
              {deleteMutation.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t("delete")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
