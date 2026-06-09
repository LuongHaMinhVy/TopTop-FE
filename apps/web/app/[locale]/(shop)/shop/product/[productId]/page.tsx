"use client";

import Image from "next/image";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Minus, PackageCheck, Plus, ShoppingBag, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { useAddToCartMutation, useProductByIdQuery } from "@/hooks/shop-hooks";
import { formatShopPrice } from "@/components/shop/ShopUi";

export default function ShopProductPage() {
  const t = useTranslations("ShopProductPage");
  const router = useRouter();
  const params = useParams<{ productId: string }>();
  const productId = Number(params.productId);
  const productQuery = useProductByIdQuery(productId, Number.isFinite(productId) && productId > 0);
  const addToCart = useAddToCartMutation();
  const [variantId, setVariantId] = useState<number | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const product = productQuery.data?.data;
  const media = product?.media ?? [];
  const cover = media.find((item) => item.mediaType === "IMAGE")?.url ?? null;
  const selectedVariant = product?.variants.find((variant) => variant.id === variantId);
  const stock = selectedVariant?.stockQuantity ?? product?.stockQuantity ?? 0;
  const price = selectedVariant?.price ?? product?.basePrice ?? 0;
  const canBuy = Boolean(product && stock >= quantity && product.status === "ACTIVE" && product.moderationStatus === "APPROVED");

  const add = (checkout: boolean) => {
    if (!product || !canBuy) return;
    addToCart.mutate(
      { productId: product.id, variantId, quantity },
      {
        onSuccess: (response) => {
          const cartItem = response.data?.items.find(
            (item) => item.productId === product.id && item.variantId === variantId,
          );
          router.push(checkout && cartItem ? `/checkout?items=${cartItem.id}` : "/cart");
        },
      },
    );
  };

  if (productQuery.isLoading) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar">
        <DocumentTitle title={`${t("loading")} | TopTop`} />
        <div className="mx-auto grid max-w-[1180px] gap-6 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,560px)_1fr] lg:gap-8 xl:px-10">
          <div className="aspect-square animate-pulse rounded-xl bg-surface" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-surface" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-surface" />
            <div className="h-24 animate-pulse rounded bg-surface" />
          </div>
        </div>
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar">
        <DocumentTitle title={`${t("notFoundTitle")} | TopTop`} />
        <div className="mx-auto flex min-h-[420px] max-w-[720px] flex-col items-center justify-center px-4 py-8 text-center sm:min-h-[520px] sm:px-6">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-surface text-text-muted border border-elevated">
            <ShoppingBag className="size-8" />
          </div>
          <h1 className="text-xl font-extrabold sm:text-2xl text-text-primary">{t("notFoundTitle")}</h1>
          <p className="mt-2 text-xs leading-relaxed text-text-muted sm:text-sm">{t("notFoundDescription")}</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-dark transition-all"
          >
            <ArrowLeft className="size-4" />
            {t("backToShop")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <DocumentTitle title={`${product.title} | TopTop Shop`} />
      <div className="shop-product mx-auto grid max-w-[1180px] gap-6 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,560px)_1fr] lg:gap-8 xl:px-10">
        <section className="min-w-0">
          <Link
            href="/shop"
            className="group mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-text-muted transition-colors hover:text-brand sm:text-sm"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            {t("backToShop")}
          </Link>
          <div className="toptop-card-glow relative aspect-square overflow-hidden rounded-xl bg-surface border border-elevated/40">
            {cover ? (
              <Image
                src={cover}
                alt={product.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-text-muted">
                <ShoppingBag className="size-16" />
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0 pt-0 lg:pt-10">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-surface border border-elevated px-3 py-1 text-xs font-bold text-text-secondary">
            <PackageCheck className="size-3.5 text-cyan" />
            {t("approved")}
          </div>
          <h1 className="text-xl font-extrabold tracking-tight leading-tight sm:text-2xl md:text-3xl lg:text-4xl text-text-primary">
            {product.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-text-muted sm:text-sm">
            <span className="flex items-center gap-1">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {product.ratingAvg.toFixed(1)}
            </span>
            <span>
              {product.soldCount.toLocaleString()} {t("sold")}
            </span>
            <span className={stock < 5 ? "text-brand" : "text-text-muted"}>
              {product.stockQuantity.toLocaleString()} {t("inStock")}
            </span>
          </div>
          <div className="mt-6">
            <p className="text-2xl font-black text-brand tracking-tight sm:text-3xl lg:text-4xl bg-gradient-to-r from-brand to-[#ff5b78] bg-clip-text text-transparent inline-block drop-shadow-[0_2px_10px_rgba(255,59,92,0.15)]">
              {formatShopPrice(price, product.currency)}
            </p>
          </div>
          {product.variants.length > 0 ? (
            <div className="mt-6">
              <p className="mb-3 text-xs font-bold text-text-primary uppercase tracking-wider">{t("variants")}</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => {
                      setVariantId(variant.id);
                      setQuantity(1);
                    }}
                    className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
                      variantId === variant.id
                        ? "bg-brand border-brand text-white shadow-[0_0_12px_rgba(255,59,92,0.3)]"
                        : "border-elevated hover:bg-hover hover:border-text-secondary/40 text-text-secondary bg-surface"
                    }`}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="text-xs font-bold text-text-primary uppercase tracking-wider">{t("quantity")}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="grid size-9 place-items-center rounded-full border border-elevated bg-surface text-text-primary hover:border-brand hover:text-brand disabled:opacity-30 transition-all"
                aria-label={t("decreaseQuantity")}
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center font-bold text-text-primary">{quantity}</span>
              <button
                type="button"
                disabled={quantity >= stock}
                onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
                className="grid size-9 place-items-center rounded-full border border-elevated bg-surface text-text-primary hover:border-brand hover:text-brand disabled:opacity-30 transition-all"
                aria-label={t("increaseQuantity")}
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={!canBuy || addToCart.isPending}
              onClick={() => add(false)}
              className="h-11 sm:h-12 rounded-full border border-brand bg-transparent text-sm font-bold text-brand hover:bg-brand/5 active:bg-brand/10 disabled:opacity-45 transition-all shadow-[0_2px_8px_rgba(255,59,92,0.05)]"
            >
              {t("addToCart")}
            </button>
            <button
              type="button"
              disabled={!canBuy || addToCart.isPending}
              onClick={() => add(true)}
              className="h-11 sm:h-12 rounded-full bg-brand text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-45 transition-all shadow-[0_2px_12px_rgba(255,59,92,0.25)] hover:shadow-[0_4px_16px_rgba(255,59,92,0.4)]"
            >
              {t("buyNow")}
            </button>
          </div>
          {addToCart.isError ? <p className="mt-3 text-xs font-bold text-brand">{t("addError")}</p> : null}
          {product.description ? (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-text-secondary sm:text-base border-t border-elevated/40 pt-6">
              {product.description}
            </p>
          ) : (
            <p className="mt-6 text-sm leading-relaxed text-text-muted sm:text-base border-t border-elevated/40 pt-6">
              {t("noDescription")}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
