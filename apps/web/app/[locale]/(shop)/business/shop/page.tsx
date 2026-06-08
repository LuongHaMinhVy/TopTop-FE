"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { BusinessAccess } from "@/components/shop/BusinessAccess";
import { ShopImageUploadField } from "@/components/shop/ShopImageUploadField";
import { useMyShopQuery, useUpdateShopMutation } from "@/hooks/shop-hooks";
import { ShopPageFrame, StatusBadge } from "@/components/shop/ShopUi";
import type { Shop } from "@/types/shop";

type ShopFormState = {
  name: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
};

export default function BusinessShopPage() {
  const t = useTranslations("BusinessShopPage");
  const shopQuery = useMyShopQuery();
  const shop = shopQuery.data?.data;

  return (
    <ShopPageFrame title={t("title")} subtitle={t("subtitle")} variant="seller">
      <DocumentTitle title={`${t("title")} | TopTop`} />
      <BusinessAccess>
        {shop ? <BusinessShopForm key={shop.id} shop={shop} /> : null}
      </BusinessAccess>
    </ShopPageFrame>
  );
}

function BusinessShopForm({ shop }: { shop: Shop }) {
  const t = useTranslations("BusinessShopPage");
  const updateShop = useUpdateShopMutation();
  const [form, setForm] = useState<ShopFormState>(() => ({
    name: shop.name ?? "",
    description: shop.description ?? "",
    avatarUrl: shop.avatarUrl ?? "",
    bannerUrl: shop.bannerUrl ?? "",
  }));

  const submit = () => {
    updateShop.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      avatarUrl: form.avatarUrl.trim() || undefined,
      bannerUrl: form.bannerUrl.trim() || undefined,
    });
  };

  return (
    <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-lg border border-elevated bg-surface shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
      <div className="border-b border-elevated bg-background px-4 py-4 sm:px-5">
        <div className="mb-3 h-1 w-12 rounded-full bg-brand shadow-[16px_0_0_#25F4EE]" />
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={shop.status} />
          <StatusBadge value={shop.moderationStatus} />
        </div>
      </div>
      <div className="grid gap-4 p-4 sm:p-5">
        <Field label={t("name")} value={form.name} onChange={(name) => setForm((value) => ({ ...value, name }))} />
        <label className="grid gap-2 text-sm font-bold">
          {t("description")}
          <textarea
            value={form.description}
            onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
            rows={5}
            className="rounded-lg border border-elevated bg-background px-4 py-3 text-text-primary outline-none transition focus:border-brand focus:ring-1 focus:ring-brand/40"
          />
        </label>
        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
          <ShopImageUploadField label={t("avatar")} value={form.avatarUrl} onChange={(avatarUrl) => setForm((value) => ({ ...value, avatarUrl }))} />
          <ShopImageUploadField label={t("banner")} value={form.bannerUrl} onChange={(bannerUrl) => setForm((value) => ({ ...value, bannerUrl }))} aspect="banner" />
        </div>
        {updateShop.isError ? <p className="text-sm font-bold text-brand">{t("saveError")}</p> : null}
        <button
          type="button"
          disabled={updateShop.isPending || !form.name.trim()}
          onClick={submit}
          className="h-11 rounded-md bg-brand px-5 text-sm font-black text-white transition hover:bg-brand-dark disabled:bg-elevated disabled:text-text-muted"
        >
          {updateShop.isPending ? t("saving") : t("save")}
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={!optional}
        className="h-11 rounded-lg border border-elevated bg-background px-4 text-text-primary outline-none transition focus:border-brand focus:ring-1 focus:ring-brand/40"
      />
    </label>
  );
}
