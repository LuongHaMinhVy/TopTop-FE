"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "@/i18n/routing";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { openAuthModal } from "@/store/slices/authSlice";
import { ShopImageUploadField } from "@/components/shop/ShopImageUploadField";
import type { AppDispatch, RootState } from "@/store/store";
import { useCreateShopMutation, useMyShopQuery, useUpdateShopMutation } from "@/hooks/shop-hooks";
import { ShopEmptyState, ShopPageFrame, StatusBadge } from "@/components/shop/ShopUi";
import type { Shop } from "@/types/shop";

type ShopFormState = {
  name: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
};

export default function SellerRequestPage() {
  const t = useTranslations("BusinessRequestPage");
  const dispatch = useDispatch<AppDispatch>();
  const isLoggedIn = useSelector((state: RootState) => Boolean(state.auth.user));
  const shopQuery = useMyShopQuery(isLoggedIn);
  const shop = shopQuery.data?.data;

  return (
    <ShopPageFrame title={t("title")} subtitle={t("subtitle")}>
      <DocumentTitle title={`${t("title")} | TopTop`} />
      {!isLoggedIn ? (
        <ShopEmptyState
          title={t("loginTitle")}
          description={t("loginDescription")}
          action={
            <button
              type="button"
              onClick={() => dispatch(openAuthModal("login"))}
              className="mt-5 rounded-full bg-text-primary px-5 py-2 text-sm font-bold text-background"
            >
              {t("loginAction")}
            </button>
          }
        />
      ) : shopQuery.isLoading ? (
        <div className="h-80 max-w-3xl animate-pulse rounded-lg bg-elevated" />
      ) : (
        <SellerRequestForm key={shop?.id ?? "new"} shop={shop} />
      )}
    </ShopPageFrame>
  );
}

function SellerRequestForm({ shop }: { shop?: Shop }) {
  const t = useTranslations("BusinessRequestPage");
  const createShop = useCreateShopMutation();
  const updateShop = useUpdateShopMutation();
  const [form, setForm] = useState<ShopFormState>(() => ({
    name: shop?.name ?? "",
    description: shop?.description ?? "",
    avatarUrl: shop?.avatarUrl ?? "",
    bannerUrl: shop?.bannerUrl ?? "",
  }));
  const pending = createShop.isPending || updateShop.isPending;
  const approved = shop?.status === "ACTIVE" && shop.moderationStatus === "APPROVED";

  const submit = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      avatarUrl: form.avatarUrl.trim() || undefined,
      bannerUrl: form.bannerUrl.trim() || undefined,
    };

    if (shop) {
      updateShop.mutate(payload);
    } else {
      createShop.mutate(payload);
    }
  };

  return (
    <section className="max-w-3xl rounded-lg border border-elevated bg-background p-5">
      {shop ? (
        <div className="mb-5 flex flex-wrap gap-2">
          <StatusBadge value={shop.status} />
          <StatusBadge value={shop.moderationStatus} />
        </div>
      ) : null}
      <div className="grid gap-4">
        <Field label={t("name")} value={form.name} onChange={(name) => setForm((value) => ({ ...value, name }))} />
        <label className="grid gap-2 text-sm font-bold">
          {t("description")}
          <textarea
            value={form.description}
            onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
            rows={5}
            className="rounded-lg border border-elevated bg-background px-4 py-3 text-text-primary outline-none focus:border-text-primary"
          />
        </label>
        <ShopImageUploadField label={t("avatar")} value={form.avatarUrl} onChange={(avatarUrl) => setForm((value) => ({ ...value, avatarUrl }))} />
        <ShopImageUploadField label={t("banner")} value={form.bannerUrl} onChange={(bannerUrl) => setForm((value) => ({ ...value, bannerUrl }))} aspect="banner" />
        {(createShop.isError || updateShop.isError) ? <p className="text-sm font-bold text-brand">{t("saveError")}</p> : null}
        {approved ? (
          <div className="rounded-lg bg-elevated p-4">
            <p className="text-sm font-bold text-text-muted">{t("approvedNotice")}</p>
            <Link href="/business" className="mt-3 inline-flex rounded-full bg-text-primary px-4 py-2 text-sm font-black text-background">
              {t("goToBusiness")}
            </Link>
          </div>
        ) : null}
        <button
          type="button"
          disabled={pending || !form.name.trim() || approved}
          onClick={submit}
          className="h-11 rounded-full bg-text-primary px-5 text-sm font-black text-background disabled:bg-elevated disabled:text-text-muted"
        >
          {pending ? t("saving") : shop ? t("updateRequest") : t("request")}
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
        className="h-11 rounded-lg border border-elevated bg-background px-4 text-text-primary outline-none focus:border-text-primary"
      />
    </label>
  );
}
