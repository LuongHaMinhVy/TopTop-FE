"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import {
  useMyCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from "@/hooks/shop-hooks";
import { formatShopPrice, ShopPageFrame } from "@/components/shop/ShopUi";

export default function CartPage() {
  const t = useTranslations("CartPage");
  const cartQuery = useMyCartQuery();
  const updateItem = useUpdateCartItemMutation();
  const removeItem = useRemoveCartItemMutation();
  const items = cartQuery.data?.data?.items ?? [];
  const selectedIds = items.filter((item) => item.selected && item.isAvailable).map((item) => item.id);
  const subtotal = items
    .filter((item) => item.selected && item.isAvailable)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <ShopPageFrame title={t("title")} subtitle={t("subtitle")}>
      <DocumentTitle title={`${t("title")} | TopTop`} />
      {cartQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-elevated bg-surface px-4 py-8 text-center sm:px-6">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-elevated text-text-muted">
            <ShoppingBag className="size-8" />
          </div>
          <h2 className="text-lg font-bold text-text-primary sm:text-xl">{t("emptyTitle")}</h2>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-text-muted sm:text-sm">{t("emptyDescription")}</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-brand-dark transition-all shadow-[0_2px_10px_rgba(255,59,92,0.25)]"
          >
            {t("continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="toptop-card-glow flex flex-col gap-4 rounded-xl border border-elevated bg-surface p-4 transition-all sm:flex-row"
              >
                <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-lg bg-elevated sm:size-24 sm:w-24">
                  {item.productImageUrl ? (
                    <Image
                      src={item.productImageUrl}
                      alt={item.productTitle}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-text-muted">
                      <ShoppingBag className="size-8" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <Link
                      href={`/shop/product/${item.productId}`}
                      className="line-clamp-2 text-sm font-bold text-text-primary hover:text-brand transition-colors sm:text-base"
                    >
                      {item.productTitle}
                    </Link>
                    {item.variantName ? (
                      <span className="mt-1 inline-block rounded-md bg-elevated px-2 py-0.5 text-xs font-semibold text-text-muted">
                        {item.variantName}
                      </span>
                    ) : null}
                    {!item.isAvailable ? <p className="mt-2 text-xs font-bold text-brand">{t("unavailable")}</p> : null}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-base font-extrabold text-brand sm:text-lg">
                      {formatShopPrice(item.price)}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-full border border-elevated bg-surface text-text-primary hover:border-brand hover:text-brand disabled:opacity-30 transition-all"
                        disabled={item.quantity <= 1 || updateItem.isPending}
                        onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                        aria-label={t("decrease")}
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-text-primary">{item.quantity}</span>
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-full border border-elevated bg-surface text-text-primary hover:border-brand hover:text-brand disabled:opacity-30 transition-all"
                        disabled={item.quantity >= item.stockQuantity || updateItem.isPending}
                        onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                        aria-label={t("increase")}
                      >
                        <Plus className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded-full text-text-muted hover:bg-brand/10 hover:text-brand disabled:opacity-30 transition-all"
                        disabled={removeItem.isPending}
                        onClick={() => removeItem.mutate(item.id)}
                        aria-label={t("remove")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="toptop-promo-cyan h-fit rounded-xl p-5 border border-cyan/20 lg:sticky lg:top-4 flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-text-primary">{t("summary")}</h2>
              <div className="mt-4 flex justify-between text-sm text-text-secondary">
                <span>{t("selectedItems", { count: selectedIds.length })}</span>
                <span className="font-extrabold text-text-primary">{formatShopPrice(subtotal)}</span>
              </div>
            </div>
            <Link
              href={selectedIds.length > 0 ? `/checkout?items=${selectedIds.join(",")}` : "/cart"}
              className={`flex h-11 items-center justify-center rounded-full text-sm font-bold transition-all shadow-[0_2px_12px_rgba(255,59,92,0.2)] ${
                selectedIds.length > 0
                  ? "bg-brand text-white hover:bg-brand-dark hover:shadow-[0_4px_16px_rgba(255,59,92,0.35)]"
                  : "pointer-events-none bg-elevated text-text-muted"
              }`}
            >
              {t("checkout")}
            </Link>
          </aside>
        </div>
      )}
    </ShopPageFrame>
  );
}
