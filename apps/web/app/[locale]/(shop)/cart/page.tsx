"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import {
  useMyCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from "@/hooks/shop-hooks";
import { formatShopPrice, ShopEmptyState, ShopPageFrame } from "@/components/shop/ShopUi";

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
            <div key={index} className="h-28 animate-pulse rounded-lg bg-elevated" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <ShopEmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          action={
            <Link href="/shop" className="mt-5 rounded-full bg-text-primary px-5 py-2 text-sm font-bold text-background">
              {t("continueShopping")}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className="flex flex-col gap-4 rounded-lg border border-elevated bg-background p-4 sm:flex-row">
                <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-lg bg-elevated sm:size-24 sm:w-24">
                  {item.productImageUrl ? (
                    <Image src={item.productImageUrl} alt={item.productTitle} fill sizes="96px" className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/shop/product/${item.productId}`} className="line-clamp-2 text-[16px] font-extrabold hover:underline">
                    {item.productTitle}
                  </Link>
                  {item.variantName ? <p className="mt-1 text-sm text-text-muted">{item.variantName}</p> : null}
                  {!item.isAvailable ? <p className="mt-2 text-sm font-bold text-brand">{t("unavailable")}</p> : null}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-lg font-black text-brand">{formatShopPrice(item.price)}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="grid size-9 place-items-center rounded-full border border-elevated hover:bg-hover disabled:opacity-40"
                        disabled={item.quantity <= 1 || updateItem.isPending}
                        onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                        aria-label={t("decrease")}
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                      <button
                        type="button"
                        className="grid size-9 place-items-center rounded-full border border-elevated hover:bg-hover disabled:opacity-40"
                        disabled={item.quantity >= item.stockQuantity || updateItem.isPending}
                        onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                        aria-label={t("increase")}
                      >
                        <Plus className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-hover hover:text-brand"
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

          <aside className="h-fit rounded-lg border border-elevated bg-background p-4 sm:p-5 lg:sticky lg:top-4">
            <h2 className="text-lg font-black">{t("summary")}</h2>
            <div className="mt-4 flex justify-between text-sm text-text-muted">
              <span>{t("selectedItems", { count: selectedIds.length })}</span>
              <span className="font-black text-text-primary">{formatShopPrice(subtotal)}</span>
            </div>
            <Link
              href={selectedIds.length > 0 ? `/checkout?items=${selectedIds.join(",")}` : "/cart"}
              className={`mt-5 flex h-11 items-center justify-center rounded-full text-sm font-black ${
                selectedIds.length > 0 ? "bg-text-primary text-background hover:opacity-90" : "pointer-events-none bg-elevated text-text-muted"
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
