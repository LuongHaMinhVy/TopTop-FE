"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ShopImageUploadField } from "@/components/shop/ShopImageUploadField";
import type { Product } from "@/types/shop";
import { useCreateProductMutation, useUpdateProductMutation } from "@/hooks/shop-hooks";

type ProductFormState = {
  title: string;
  description: string;
  basePrice: string;
  stockQuantity: string;
  imageUrl: string;
  variantName: string;
  variantSku: string;
  variantPrice: string;
  variantStock: string;
};

const EMPTY_FORM: ProductFormState = {
  title: "",
  description: "",
  basePrice: "",
  stockQuantity: "",
  imageUrl: "",
  variantName: "",
  variantSku: "",
  variantPrice: "",
  variantStock: "",
};

export function SellerProductForm({ product }: { product?: Product }) {
  const t = useTranslations("SellerProductForm");
  const router = useRouter();
  const createProduct = useCreateProductMutation();
  const updateProduct = useUpdateProductMutation();
  const [form, setForm] = useState<ProductFormState>(() => createInitialForm(product));

  const pending = createProduct.isPending || updateProduct.isPending;
  const basePrice = Number(form.basePrice);
  const stockQuantity = Number(form.stockQuantity);
  const variantPrice = Number(form.variantPrice);
  const variantStock = Number(form.variantStock);
  const canSubmit = Boolean(form.title.trim()) && basePrice > 0 && stockQuantity >= 0 && !pending;

  const submit = () => {
    if (!canSubmit) return;
    const media = form.imageUrl.trim()
      ? [{ url: form.imageUrl.trim(), mediaType: "IMAGE" as const, sortOrder: 0 }]
      : undefined;
    const variants = form.variantName.trim()
      ? [
          {
            name: form.variantName.trim(),
            sku: form.variantSku.trim() || undefined,
            price: Number.isFinite(variantPrice) && variantPrice > 0 ? variantPrice : basePrice,
            stockQuantity: Number.isFinite(variantStock) && variantStock >= 0 ? variantStock : stockQuantity,
          },
        ]
      : undefined;
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      basePrice,
      stockQuantity,
      currency: "VND",
      media,
      variants,
    };

    if (product) {
      updateProduct.mutate(
        { id: product.id, payload },
        { onSuccess: () => router.push("/business/products") },
      );
    } else {
      createProduct.mutate(payload, { onSuccess: () => router.push("/business/products") });
    }
  };

  return (
    <section className="max-w-3xl rounded-lg border border-elevated bg-background p-5">
      <div className="grid gap-4">
        <Field label={t("title")} value={form.title} onChange={(title) => setForm((value) => ({ ...value, title }))} />
        <label className="grid gap-2 text-sm font-bold">
          {t("description")}
          <textarea
            value={form.description}
            onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
            rows={5}
            className="rounded-lg border border-elevated bg-background px-4 py-3 text-text-primary outline-none focus:border-text-primary"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("price")} value={form.basePrice} onChange={(basePrice) => setForm((value) => ({ ...value, basePrice }))} inputMode="decimal" />
          <Field label={t("stock")} value={form.stockQuantity} onChange={(stockQuantity) => setForm((value) => ({ ...value, stockQuantity }))} inputMode="numeric" />
        </div>
        <ShopImageUploadField label={t("image")} value={form.imageUrl} onChange={(imageUrl) => setForm((value) => ({ ...value, imageUrl }))} />

        <div className="rounded-lg bg-elevated p-4">
          <h2 className="text-sm font-black">{t("variantTitle")}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label={t("variantName")} value={form.variantName} onChange={(variantName) => setForm((value) => ({ ...value, variantName }))} optional />
            <Field label={t("variantSku")} value={form.variantSku} onChange={(variantSku) => setForm((value) => ({ ...value, variantSku }))} optional />
            <Field label={t("variantPrice")} value={form.variantPrice} onChange={(variantPrice) => setForm((value) => ({ ...value, variantPrice }))} optional inputMode="decimal" />
            <Field label={t("variantStock")} value={form.variantStock} onChange={(variantStock) => setForm((value) => ({ ...value, variantStock }))} optional inputMode="numeric" />
          </div>
        </div>

        {(createProduct.isError || updateProduct.isError) ? <p className="text-sm font-bold text-brand">{t("saveError")}</p> : null}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="h-11 rounded-full bg-text-primary px-5 text-sm font-black text-background disabled:bg-elevated disabled:text-text-muted"
        >
          {pending ? t("saving") : product ? t("save") : t("create")}
        </button>
      </div>
    </section>
  );
}

function createInitialForm(product?: Product): ProductFormState {
  if (!product) return EMPTY_FORM;
  const firstImage = product.media?.find((item) => item.mediaType === "IMAGE");
  const firstVariant = product.variants?.[0];
  return {
    title: product.title ?? "",
    description: product.description ?? "",
    basePrice: String(product.basePrice ?? ""),
    stockQuantity: String(product.stockQuantity ?? ""),
    imageUrl: firstImage?.url ?? "",
    variantName: firstVariant?.name ?? "",
    variantSku: firstVariant?.sku ?? "",
    variantPrice: firstVariant ? String(firstVariant.price) : "",
    variantStock: firstVariant ? String(firstVariant.stockQuantity) : "",
  };
}

function Field({
  label,
  value,
  onChange,
  optional,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  inputMode?: "numeric" | "decimal";
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={!optional}
        inputMode={inputMode}
        className="h-11 rounded-lg border border-elevated bg-background px-4 text-text-primary outline-none focus:border-text-primary"
      />
    </label>
  );
}
