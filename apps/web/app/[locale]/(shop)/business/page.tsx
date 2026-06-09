"use client";

import type { ReactNode } from "react";
import { BarChart3, Package, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { BusinessAccess, isApprovedBusinessShop } from "@/components/shop/BusinessAccess";
import { useMyProductsQuery, useMyShopQuery, useShopOrdersQuery } from "@/hooks/shop-hooks";
import { formatShopPrice, ShopPageFrame, StatusBadge } from "@/components/shop/ShopUi";

export default function BusinessDashboardPage() {
  const t = useTranslations("BusinessPage");
  const shopQuery = useMyShopQuery();
  const shop = shopQuery.data?.data;
  const canAccessBusiness = isApprovedBusinessShop(shop);
  const productsQuery = useMyProductsQuery(0, 100, canAccessBusiness);
  const ordersQuery = useShopOrdersQuery(0, 100, canAccessBusiness);
  const products = productsQuery.data?.data ?? [];
  const orders = ordersQuery.data?.data ?? [];
  const paidOrders = orders.filter((order) => order.paymentStatus === "PAID");
  const revenue = paidOrders.reduce((sum, order) => sum + order.commissionBaseAmount, 0);
  const shopPayout = paidOrders.reduce((sum, order) => sum + order.shopPayoutAmount, 0);
  const platformFee = paidOrders.reduce((sum, order) => sum + order.platformFeeAmount, 0);

  return (
    <ShopPageFrame
      title={t("title")}
      subtitle={t("subtitle")}
      action={
        <div className="flex flex-wrap gap-2">
          <Link href="/business/shop" className="rounded-full border border-elevated px-4 py-2 text-sm font-black hover:bg-hover">
            {t("manageShop")}
          </Link>
          <Link href="/business/products/new" className="rounded-full bg-text-primary px-4 py-2 text-sm font-black text-background">
            {t("newProduct")}
          </Link>
        </div>
      }
    >
      <DocumentTitle title={`${t("title")} | TopTop`} />
      <BusinessAccess>
        {shop ? (
          <div className="space-y-6">
            <section className="rounded-lg border border-elevated bg-background p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black">{shop.name}</h2>
                  <p className="mt-1 text-sm text-text-muted">@{shop.slug}</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge value={shop.status} />
                  <StatusBadge value={shop.moderationStatus} />
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <Metric icon={<Package className="size-5" />} label={t("products")} value={products.length.toLocaleString()} />
              <Metric icon={<Store className="size-5" />} label={t("orders")} value={orders.length.toLocaleString()} />
              <Metric icon={<Store className="size-5" />} label={t("paidOrders")} value={paidOrders.length.toLocaleString()} />
              <Metric icon={<BarChart3 className="size-5" />} label={t("revenue")} value={formatShopPrice(revenue)} />
              <Metric icon={<BarChart3 className="size-5" />} label={t("shopPayout")} value={formatShopPrice(shopPayout)} />
              <Metric icon={<BarChart3 className="size-5" />} label={t("platformFee")} value={formatShopPrice(platformFee)} />
            </section>
          </div>
        ) : null}
      </BusinessAccess>
    </ShopPageFrame>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-elevated bg-background p-5">
      <div className="mb-4 grid size-10 place-items-center rounded-full bg-elevated text-text-muted">{icon}</div>
      <p className="text-sm font-bold text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
