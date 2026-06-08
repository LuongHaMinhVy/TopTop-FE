"use client";

import { Edit, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { BusinessAccess, isApprovedBusinessShop } from "@/components/shop/BusinessAccess";
import { useDeleteProductMutation, useMyProductsQuery, useMyShopQuery } from "@/hooks/shop-hooks";
import { formatShopPrice, productCover, ShopEmptyState, ShopPageFrame, StatusBadge } from "@/components/shop/ShopUi";

export default function BusinessProductsPage() {
  const t = useTranslations("BusinessProductsPage");
  const shopQuery = useMyShopQuery();
  const canAccessBusiness = isApprovedBusinessShop(shopQuery.data?.data);
  const productsQuery = useMyProductsQuery(0, 50, canAccessBusiness);
  const deleteProduct = useDeleteProductMutation();
  const products = productsQuery.data?.data ?? [];

  return (
    <ShopPageFrame
      title={t("title")}
      subtitle={t("subtitle")}
      action={
        <Link href="/business/products/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-black text-white transition hover:bg-brand-dark">
          <Plus className="size-4" />
          {t("newProduct")}
        </Link>
      }
      variant="seller"
    >
      <DocumentTitle title={`${t("title")} | TopTop`} />
      <BusinessAccess>
        {productsQuery.isLoading ? (
          <div className="h-72 animate-pulse rounded-lg bg-elevated" />
        ) : products.length === 0 ? (
          <ShopEmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-elevated bg-surface shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
            <div className="hidden grid-cols-[minmax(260px,1fr)_130px_130px_120px] gap-4 border-b border-elevated bg-background px-4 py-3 text-xs font-black uppercase text-text-muted md:grid">
              <span>{t("product")}</span>
              <span>{t("price")}</span>
              <span>{t("status")}</span>
              <span className="text-right">{t("actions")}</span>
            </div>
            {products.map((product) => {
              const cover = productCover(product);
              return (
              <div key={product.id} className="grid gap-4 border-b border-elevated bg-background/60 px-4 py-4 transition-colors last:border-b-0 hover:bg-hover/60 md:grid-cols-[minmax(260px,1fr)_130px_130px_120px] md:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-elevated bg-elevated">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-[11px] font-black text-text-muted">TT</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black">{product.title}</p>
                    <p className="text-sm text-text-muted">{product.stockQuantity} {t("stock")}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 md:block">
                  <span className="text-xs font-black uppercase text-text-muted md:hidden">{t("price")}</span>
                  <p className="font-bold text-brand">{formatShopPrice(product.basePrice, product.currency)}</p>
                </div>
                <div className="space-y-1">
                  <StatusBadge value={product.status} />
                  <StatusBadge value={product.moderationStatus} />
                </div>
                <div className="flex justify-end gap-2 border-t border-elevated pt-3 md:border-t-0 md:pt-0">
                  <Link href={`/business/products/${product.id}/edit`} className="grid size-9 place-items-center rounded-md border border-elevated bg-surface transition hover:border-text-muted hover:bg-hover" aria-label={t("edit")}>
                    <Edit className="size-4" />
                  </Link>
                  <button
                    type="button"
                    disabled={deleteProduct.isPending}
                    onClick={() => deleteProduct.mutate(product.id)}
                    className="grid size-9 place-items-center rounded-md border border-elevated bg-surface text-text-muted transition hover:border-brand/40 hover:bg-brand/10 hover:text-brand disabled:opacity-60"
                    aria-label={t("delete")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}
      </BusinessAccess>
    </ShopPageFrame>
  );
}
