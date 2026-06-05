"use client";

import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUploadMediaMutation } from "@/hooks/media-hooks";

export function ShopImageUploadField({
  label,
  value,
  onChange,
  aspect = "square",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: "square" | "banner";
}) {
  const t = useTranslations("ShopImageUploadField");
  const uploadMedia = useUploadMediaMutation();

  const upload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return;
    }
    uploadMedia.mutate(
      { file, context: "shop" },
      {
        onSuccess: (response) => {
          const url = response.data?.url;
          if (url) onChange(url);
        },
      },
    );
  };

  return (
    <div className="grid gap-2 text-sm font-bold">
      <span>{label}</span>
      <div
        className={`relative overflow-hidden rounded-lg border border-dashed border-elevated bg-elevated ${
          aspect === "banner" ? "aspect-[3/1]" : "aspect-square max-w-64"
        }`}
      >
        {value ? (
          <Image src={value} alt="" fill sizes={aspect === "banner" ? "(max-width: 768px) 100vw, 768px" : "256px"} className="object-cover" />
        ) : (
          <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-3 p-5 text-center text-text-muted hover:bg-hover">
            <ImagePlus className="size-8" />
            <span>{t("choose")}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploadMedia.isPending}
              onChange={(event) => upload(event.target.files?.[0])}
            />
          </label>
        )}

        {value ? (
          <div className="absolute inset-x-3 bottom-3 flex gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center rounded-full bg-background/90 px-4 text-xs font-black text-text-primary shadow-sm hover:bg-background">
              {uploadMedia.isPending ? t("uploading") : t("replace")}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploadMedia.isPending}
                onChange={(event) => upload(event.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={uploadMedia.isPending}
              className="grid size-9 place-items-center rounded-full bg-background/90 text-text-primary shadow-sm hover:bg-background disabled:opacity-60"
              aria-label={t("remove")}
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
      {uploadMedia.isError ? <span className="text-xs font-bold text-brand">{t("error")}</span> : null}
      {uploadMedia.isPending && !value ? <span className="text-xs font-bold text-text-muted">{t("uploading")}</span> : null}
    </div>
  );
}
