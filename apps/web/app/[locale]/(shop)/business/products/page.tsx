"use client";

import { Edit, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { BusinessAccess, isApprovedBusinessShop } from "@/components/shop/BusinessAccess";
import { useDeleteProductMutation, useMyProductsQuery, useMyShopQuery } from "@/hooks/shop-hooks";
import { formatShopPrice, ShopEmptyState, ShopPageFrame, StatusBadge } from "@/components/shop/ShopUi";

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
        <Link href="/business/products/new" className="inline-flex items-center gap-2 rounded-full bg-text-primary px-4 py-2 text-sm font-black text-background">
          <Plus className="size-4" />
          {t("newProduct")}
        </Link>
      }
    >
      <DocumentTitle title={`${t("title")} | TopTop`} />
      <BusinessAccess>
        {productsQuery.isLoading ? (
          <div className="h-72 animate-pulse rounded-lg bg-elevated" />
        ) : products.length === 0 ? (
          <ShopEmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-elevated">
            <div className="grid grid-cols-[minmax(260px,1fr)_130px_130px_120px] gap-4 border-b border-elevated bg-elevated px-4 py-3 text-xs font-black uppercase text-text-muted">
              <span>{t("product")}</span>
              <span>{t("price")}</span>
              <span>{t("status")}</span>
              <span className="text-right">{t("actions")}</span>
            </div>
            {products.map((product) => (
              <div key={product.id} className="grid grid-cols-[minmax(260px,1fr)_130px_130px_120px] items-center gap-4 border-b border-elevated bg-background px-4 py-4 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate font-black">{product.title}</p>
                  <p className="text-sm text-text-muted">{product.stockQuantity} {t("stock")}</p>
                </div>
                <p className="font-bold text-brand">{formatShopPrice(product.basePrice, product.currency)}</p>
                <div className="space-y-1">
                  <StatusBadge value={product.status} />
                  <StatusBadge value={product.moderationStatus} />
                </div>
                <div className="flex justify-end gap-2">
                  <Link href={`/business/products/${product.id}/edit`} className="grid size-9 place-items-center rounded-full hover:bg-hover" aria-label={t("edit")}>
                    <Edit className="size-4" />
                  </Link>
                  <button
                    type="button"
                    disabled={deleteProduct.isPending}
                    onClick={() => deleteProduct.mutate(product.id)}
                    className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-hover hover:text-brand"
                    aria-label={t("delete")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </BusinessAccess>
    </ShopPageFrame>
  );
}
