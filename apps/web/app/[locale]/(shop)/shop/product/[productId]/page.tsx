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
      <div className="h-full overflow-y-auto bg-background text-text-primary custom-scrollbar">
        <DocumentTitle title={`${t("loading")} | TopTop`} />
        <div className="mx-auto grid max-w-[1180px] gap-8 px-6 py-8 lg:grid-cols-[minmax(0,560px)_1fr] xl:px-10">
          <div className="aspect-square animate-pulse rounded-lg bg-elevated" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-elevated" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-elevated" />
            <div className="h-24 animate-pulse rounded bg-elevated" />
          </div>
        </div>
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="h-full overflow-y-auto bg-background text-text-primary custom-scrollbar">
        <DocumentTitle title={`${t("notFoundTitle")} | TopTop`} />
        <div className="mx-auto flex min-h-[520px] max-w-[720px] flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-elevated text-text-muted">
            <ShoppingBag className="size-8" />
          </div>
          <h1 className="text-[24px] font-extrabold">{t("notFoundTitle")}</h1>
          <p className="mt-2 text-[14px] leading-6 text-text-muted">{t("notFoundDescription")}</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-text-primary px-5 text-[15px] font-bold text-background hover:opacity-90"
          >
            <ArrowLeft className="size-5" />
            {t("backToShop")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background text-text-primary custom-scrollbar">
      <DocumentTitle title={`${product.title} | TopTop Shop`} />
      <div className="mx-auto grid max-w-[1180px] gap-8 px-6 py-8 lg:grid-cols-[minmax(0,560px)_1fr] xl:px-10">
        <section className="min-w-0">
          <Link
            href="/shop"
            className="mb-5 inline-flex items-center gap-2 text-[14px] font-bold text-text-muted hover:text-text-primary"
          >
            <ArrowLeft className="size-4" />
            {t("backToShop")}
          </Link>
          <div className="relative aspect-square overflow-hidden rounded-lg bg-elevated">
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
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-elevated px-3 py-1.5 text-[13px] font-bold text-text-muted">
            <PackageCheck className="size-4" />
            {t("approved")}
          </div>
          <h1 className="text-[28px] font-extrabold leading-tight md:text-[36px]">{product.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[14px] font-semibold text-text-muted">
            <span className="flex items-center gap-1">
              <Star className="size-4 fill-current" />
              {product.ratingAvg.toFixed(1)}
            </span>
            <span>
              {product.soldCount.toLocaleString()} {t("sold")}
            </span>
            <span>
              {product.stockQuantity.toLocaleString()} {t("inStock")}
            </span>
          </div>
          <p className="mt-6 text-[32px] font-extrabold text-brand">
            {formatShopPrice(price, product.currency)}
          </p>
          {product.variants.length > 0 ? (
            <div className="mt-6">
              <p className="mb-3 text-sm font-black">{t("variants")}</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => {
                      setVariantId(variant.id);
                      setQuantity(1);
                    }}
                    className={`rounded-full border px-4 py-2 text-sm font-bold ${
                      variantId === variant.id
                        ? "border-text-primary bg-text-primary text-background"
                        : "border-elevated hover:bg-hover"
                    }`}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-6 flex items-center gap-3">
            <p className="text-sm font-black">{t("quantity")}</p>
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="grid size-9 place-items-center rounded-full border border-elevated hover:bg-hover disabled:opacity-40"
              aria-label={t("decreaseQuantity")}
            >
              <Minus className="size-4" />
            </button>
            <span className="w-8 text-center font-black">{quantity}</span>
            <button
              type="button"
              disabled={quantity >= stock}
              onClick={() => setQuantity((value) => Math.min(stock, value + 1))}
              className="grid size-9 place-items-center rounded-full border border-elevated hover:bg-hover disabled:opacity-40"
              aria-label={t("increaseQuantity")}
            >
              <Plus className="size-4" />
            </button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={!canBuy || addToCart.isPending}
              onClick={() => add(false)}
              className="h-12 rounded-full border border-elevated text-sm font-black hover:bg-hover disabled:opacity-50"
            >
              {t("addToCart")}
            </button>
            <button
              type="button"
              disabled={!canBuy || addToCart.isPending}
              onClick={() => add(true)}
              className="h-12 rounded-full bg-text-primary text-sm font-black text-background hover:opacity-90 disabled:bg-elevated disabled:text-text-muted disabled:hover:opacity-100"
            >
              {t("buyNow")}
            </button>
          </div>
          {addToCart.isError ? <p className="mt-3 text-sm font-bold text-brand">{t("addError")}</p> : null}
          {product.description ? (
            <p className="mt-6 whitespace-pre-line text-[16px] leading-7 text-text-secondary">
              {product.description}
            </p>
          ) : (
            <p className="mt-6 text-[16px] leading-7 text-text-muted">{t("noDescription")}</p>
          )}
        </section>
      </div>
    </div>
  );
}
