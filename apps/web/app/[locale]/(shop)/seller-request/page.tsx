"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDispatch, useSelector } from "react-redux";
import { CheckCircle2, Store, X } from "lucide-react";
import { Link } from "@/i18n/routing";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { openAuthModal } from "@/store/slices/authSlice";
import { ShopImageUploadField } from "@/components/shop/ShopImageUploadField";
import type { AppDispatch, RootState } from "@/store/store";
import { useCreateShopMutation, useMyShopQuery, useUpdateShopMutation } from "@/hooks/shop-hooks";
import { StatusBadge } from "@/components/shop/ShopUi";
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
    <div className="h-full overflow-y-auto bg-background px-3 py-4 text-text-primary custom-scrollbar sm:px-6 sm:py-6 lg:px-10">
      <DocumentTitle title={`${t("title")} | TopTop`} />
      <section className="mx-auto grid min-h-[calc(100vh-104px)] w-full max-w-6xl place-items-center sm:min-h-[calc(100vh-112px)]">
        <div className="relative grid w-full overflow-hidden rounded-lg border border-elevated bg-background shadow-2xl lg:grid-cols-[360px_minmax(0,1fr)]">
          <Link
            href="/shop"
            aria-label={t("close")}
            className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-surface text-text-muted hover:bg-hover hover:text-text-primary"
          >
            <X className="size-5" />
          </Link>

          <aside className="border-b border-elevated bg-surface p-5 sm:p-6 lg:border-b-0 lg:border-r lg:p-8">
            <div className="flex size-14 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Store className="size-7" />
            </div>
            <h1 className="mt-6 text-[30px] font-black leading-tight sm:text-[34px]">{t("title")}</h1>
            <p className="mt-3 text-[15px] font-semibold leading-6 text-text-muted">{t("subtitle")}</p>
            <div className="mt-8 grid gap-3">
              {[t("requirements.identity"), t("requirements.products"), t("requirements.review")].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-md bg-background p-3">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand" />
                  <span className="text-sm font-bold leading-5 text-text-secondary">{item}</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="min-w-0 p-4 sm:p-7 lg:p-8">
            {!isLoggedIn ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <div className="grid size-16 place-items-center rounded-full bg-surface text-brand">
                  <Store className="size-8" />
                </div>
                <h2 className="mt-5 text-2xl font-black">{t("loginTitle")}</h2>
                <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-text-muted">{t("loginDescription")}</p>
                <button
                  type="button"
                  onClick={() => dispatch(openAuthModal("login"))}
                  className="mt-6 rounded-full bg-text-primary px-6 py-2.5 text-sm font-black text-background hover:opacity-90"
                >
                  {t("loginAction")}
                </button>
              </div>
            ) : shopQuery.isLoading ? (
              <div className="h-[520px] animate-pulse rounded-lg bg-elevated" />
            ) : (
              <SellerRequestForm key={shop?.id ?? "new"} shop={shop} />
            )}
          </div>
        </div>
      </section>
    </div>
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
    <section className="min-w-0">
      {shop ? (
        <div className="mb-5 flex flex-wrap gap-2">
          <StatusBadge value={shop.status} />
          <StatusBadge value={shop.moderationStatus} />
        </div>
      ) : null}
      <div className="grid gap-5">
        <Field label={t("name")} value={form.name} onChange={(name) => setForm((value) => ({ ...value, name }))} />
        <label className="grid gap-2 text-sm font-bold">
          {t("description")}
          <textarea
            value={form.description}
            onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
            rows={5}
            className="rounded-lg border border-elevated bg-surface px-4 py-3 text-text-primary outline-none focus:border-text-primary"
          />
        </label>
        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
          <ShopImageUploadField label={t("avatar")} value={form.avatarUrl} onChange={(avatarUrl) => setForm((value) => ({ ...value, avatarUrl }))} />
          <ShopImageUploadField label={t("banner")} value={form.bannerUrl} onChange={(bannerUrl) => setForm((value) => ({ ...value, bannerUrl }))} aspect="banner" />
        </div>
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
          className="h-12 rounded-full bg-text-primary px-5 text-sm font-black text-background hover:opacity-90 disabled:bg-elevated disabled:text-text-muted disabled:opacity-100"
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
        className="h-11 rounded-lg border border-elevated bg-surface px-4 text-text-primary outline-none focus:border-text-primary"
      />
    </label>
  );
}
