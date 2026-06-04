"use client";

import React, { useState } from "react";
import { useCreateLivestream } from "@/hooks/live-hooks";
import { useRouter } from "next/navigation";
import { Card, Button, Input, IconButton } from "@repo/ui";
import { Camera, MonitorUp } from "lucide-react";
import { useTranslations } from "next-intl";

type LivestreamSourceMode = "face" | "screen";

export default function LivestreamStudioPage() {
  const router = useRouter();
  const t = useTranslations("LiveStudio");
  const createLivestream = useCreateLivestream();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceMode, setSourceMode] = useState<LivestreamSourceMode>("face");

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert(t("titleRequired"));
      return;
    }

    try {
      const res = await createLivestream.mutateAsync({
        title,
        description,
        allowChat: true,
        allowGifts: true,
      });

      if (res.data?.id) {
        router.push(`/lives/studio/${res.data.id}?source=${sourceMode}`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || t("createFailed"));
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <Card className="p-6 relative">
        <IconButton
          icon="X"
          className="absolute top-4 right-4"
          onClick={() => router.replace("/lives")}
        />
        <h2 className="text-2xl font-bold mb-1">{t("setupTitle")}</h2>
        <p className="text-text-muted mb-6">
          {t("setupSubtitle")}
        </p>

        <form onSubmit={handleStart} className="space-y-6">
          <div className="space-y-2 flex flex-col">
            <label htmlFor="title" className="text-sm font-semibold">
              {t("titleLabel")}
            </label>
            <Input
              id="title"
              placeholder={t("titlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="space-y-2 flex flex-col">
            <label htmlFor="description" className="text-sm font-semibold">
              {t("descriptionLabel")}
            </label>
            <textarea
              id="description"
              placeholder={t("descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">{t("sourceLabel")}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SourceModeButton
                active={sourceMode === "face"}
                icon={<Camera className="h-5 w-5" />}
                title={t("facecamTitle")}
                description={t("facecamDescription")}
                onClick={() => setSourceMode("face")}
              />
              <SourceModeButton
                active={sourceMode === "screen"}
                icon={<MonitorUp className="h-5 w-5" />}
                title={t("screenTitle")}
                description={t("screenDescription")}
                onClick={() => setSourceMode("screen")}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-bold bg-brand hover:bg-brand/90 text-white"
            disabled={createLivestream.isPending}
          >
            {createLivestream.isPending ? t("settingUp") : t("goLiveNow")}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function SourceModeButton({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[92px] items-start gap-3 rounded-md border p-4 text-left transition ${
        active
          ? "border-brand bg-brand/10 text-text-primary"
          : "border-elevated bg-surface-secondary text-text-primary hover:bg-elevated"
      }`}
    >
      <span
        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          active ? "bg-brand text-white" : "bg-elevated text-text-muted"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-text-muted">{description}</span>
      </span>
    </button>
  );
}
