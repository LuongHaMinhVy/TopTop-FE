"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Input, Select, Button, Form } from "@repo/ui";
import { IconActionButton } from "./dashboard-common";
import { createAdminSound, updateAdminSound } from "@/services/sound-api-service";
import { Save, X, Music } from "lucide-react";
import type { SoundItem } from "@/types/admin";

export function SoundModal({
  sound,
  onClose,
  onSaveSuccess,
}: {
  sound?: SoundItem | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}) {
  const t = useTranslations("Admin.dashboard.sounds");
  const isEdit = !!sound;

  const [title, setTitle] = useState(sound?.title || "");
  const [artistName, setArtistName] = useState(sound?.artistName || "");
  const [description, setDescription] = useState(sound?.description || "");
  const [type, setType] = useState<"OFFICIAL" | "ORIGINAL" | "EFFECT">(
    (sound?.type as "OFFICIAL" | "ORIGINAL" | "EFFECT") || "OFFICIAL"
  );
  const [audioUrl, setAudioUrl] = useState(sound?.audioUrl || "");
  const [coverUrl, setCoverUrl] = useState(sound?.coverUrl || "");
  const [durationSeconds, setDurationSeconds] = useState<number | "">(
    sound?.durationSeconds ?? ""
  );
  const [isPublic, setIsPublic] = useState(sound?.isPublic ?? true);
  const [isActive, setIsActive] = useState(sound?.isActive ?? true);

  const [errors, setErrors] = useState<{ title?: string; audioUrl?: string }>({});

  const saveMutation = useMutation({
    mutationFn: async () => {
      const durationVal = durationSeconds === "" ? undefined : Number(durationSeconds);
      if (isEdit && sound) {
        return updateAdminSound(sound.id, {
          title: title || undefined,
          artistName: artistName || undefined,
          description: description || undefined,
          coverUrl: coverUrl || undefined,
          durationSeconds: durationVal,
          isPublic,
          isActive,
        });
      } else {
        return createAdminSound({
          title,
          artistName: artistName || undefined,
          description: description || undefined,
          type,
          audioUrl,
          coverUrl: coverUrl || undefined,
          durationSeconds: durationVal,
          isPublic,
        });
      }
    },
    onSuccess: () => {
      onSaveSuccess();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; audioUrl?: string } = {};
    if (!title.trim()) {
      newErrors.title = t("titleRequired");
    }
    if (!isEdit && !audioUrl.trim()) {
      newErrors.audioUrl = t("audioUrlRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    saveMutation.mutate();
  };

  const typeOptions = [
    { value: "OFFICIAL", label: "Official" },
    { value: "ORIGINAL", label: "Original" },
    { value: "EFFECT", label: "Effect" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="modal-opacity-solid relative w-full max-w-lg overflow-hidden rounded-2xl border border-elevated bg-background shadow-2xl flex flex-col max-h-[90vh]"
        data-modal-panel
      >
        <div className="flex items-center justify-between border-b border-elevated px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Music className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-black">
              {isEdit ? t("updateTitle") : t("createTitle")}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            aria-label={t("cancel")}
            className="flex h-8 w-8 items-center justify-center !rounded-lg !p-0 text-text-muted hover:bg-hover hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <Input
            label={t("titleLabel")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            placeholder="e.g. Levitation"
            required
          />

          <Input
            label={t("artistLabel")}
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="e.g. Dua Lipa"
          />

          <div className="flex flex-col gap-1.5">
            <label className="ml-1 text-xs font-bold uppercase tracking-wider text-text-muted">
              {t("descriptionLabel")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border border-elevated bg-surface px-6 py-4 text-text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand placeholder:text-text-muted min-h-[80px] text-sm"
              placeholder="Enter sound description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-xs font-bold uppercase tracking-wider text-text-muted">
                {t("typeLabel")}
              </label>
              <Select
                value={type}
                options={typeOptions}
                onChange={(val) => setType(val as "OFFICIAL" | "ORIGINAL" | "EFFECT")}
                ariaLabel={t("typeLabel")}
                className="w-full"
                disabled={isEdit}
              />
            </div>

            <Input
              label={t("durationLabel")}
              type="number"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g. 30"
              min={1}
            />
          </div>

          {!isEdit && (
            <Input
              label={t("audioUrlLabel")}
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              error={errors.audioUrl}
              placeholder="e.g. https://storage.toptop.app/audio/123.mp3"
              required
            />
          )}

          <Input
            label={t("coverUrlLabel")}
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="e.g. https://storage.toptop.app/covers/123.jpg"
          />

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-elevated bg-surface text-brand focus:ring-brand focus:ring-2"
              />
              <span className="text-sm font-semibold select-none">
                {t("isPublicLabel")}
              </span>
            </label>

            {isEdit && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-elevated bg-surface text-brand focus:ring-brand focus:ring-2"
                />
                <span className="text-sm font-semibold select-none">
                  {t("isActiveLabel")}
                </span>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-elevated">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex h-10 items-center justify-center !rounded-xl border border-elevated px-4 text-sm font-bold"
            >
              {t("cancel")}
            </Button>
            <IconActionButton
              type="submit"
              label={t("submit")}
              icon={Save}
              isLoading={saveMutation.isPending}
            />
          </div>
        </Form>
      </div>
    </div>
  );
}
