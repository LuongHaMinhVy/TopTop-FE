"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Package, ShoppingBag, Star } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { Product } from "@/types/shop";

export function formatShopPrice(value: number, currency = "VND") {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(value);
}

export function productCover(product: Product) {
  return product.media?.find((item) => item.mediaType === "IMAGE")?.url ?? null;
}

export function ShopPageFrame({
  children,
  title,
  subtitle,
  action,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="h-full overflow-y-auto bg-background text-text-primary custom-scrollbar">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-6 py-8 xl:px-10">
        <header className="flex flex-col gap-4 border-b border-elevated pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold leading-tight md:text-[36px]">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-[15px] leading-6 text-text-muted">{subtitle}</p> : null}
          </div>
          {action}
        </header>
        {children}
      </div>
    </div>
  );
}

export function ShopEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-elevated px-6 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-elevated text-text-muted">
        <ShoppingBag className="size-8" />
      </div>
      <h2 className="text-[20px] font-extrabold">{title}</h2>
      <p className="mt-2 max-w-md text-[14px] leading-6 text-text-muted">{description}</p>
      {action}
    </div>
  );
}

export function ProductCard({
  product,
  soldLabel,
}: {
  product: Product;
  soldLabel: string;
}) {
  const cover = productCover(product);

  return (
    <Link href={`/shop/product/${product.id}`} className="group min-w-0">
      <article className="min-w-0">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-elevated">
          {cover ? (
            <Image
              src={cover}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-text-muted">
              <Package className="size-10" />
            </div>
          )}
        </div>
        <h3 className="mt-3 line-clamp-2 min-h-[40px] text-[15px] font-bold leading-5">
          {product.title}
        </h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="truncate text-[16px] font-extrabold text-brand">
            {formatShopPrice(product.basePrice, product.currency)}
          </p>
          <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-text-muted">
            <Star className="size-3 fill-current" />
            {Number(product.ratingAvg ?? 0).toFixed(1)}
          </span>
        </div>
        <p className="mt-1 text-[12px] text-text-muted">
          {(product.soldCount ?? 0).toLocaleString()} {soldLabel}
        </p>
      </article>
    </Link>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const tone =
    normalized === "CANCELLED" || normalized === "REJECTED" || normalized === "BANNED"
      ? "border-brand/30 bg-brand/10 text-brand"
      : normalized === "ACTIVE" || normalized === "APPROVED" || normalized === "COMPLETED"
        ? "border-text-primary/15 bg-text-primary/10 text-text-primary"
        : "border-elevated bg-elevated text-text-muted";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase ${tone}`}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
