"use client";

import { useState } from "react";
import { PackageCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { useMyOrdersQuery } from "@/hooks/shop-hooks";
import { formatShopPrice, ShopEmptyState, ShopPageFrame, StatusBadge } from "@/components/shop/ShopUi";

export default function OrdersPage() {
  const t = useTranslations("OrdersPage");
  const tStatus = useTranslations("ShopStatus");
  const ordersQuery = useMyOrdersQuery(0, 30);
  const orders = ordersQuery.data?.data ?? [];
  const [filter, setFilter] = useState<"all" | "paid" | "delivered">("all");
  const filteredOrders = orders.filter((order) => {
    if (filter === "paid") return order.paymentStatus === "PAID";
    if (filter === "delivered") return order.shippingStatus === "DELIVERED";
    return true;
  });

  return (
    <ShopPageFrame title={t("title")} subtitle={t("subtitle")}>
      <DocumentTitle title={`${t("title")} | TopTop`} />
      {ordersQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-lg bg-elevated" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <ShopEmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "paid", "delivered"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full border px-4 py-2 text-sm font-black ${
                  filter === item ? "border-text-primary bg-text-primary text-background" : "border-elevated text-text-muted hover:bg-hover"
                }`}
              >
                {t(`filters.${item}`)}
              </button>
            ))}
          </div>
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-lg border border-elevated bg-background p-4 transition hover:bg-hover"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-12 flex-shrink-0 place-items-center rounded-full bg-elevated text-text-muted">
                    <PackageCheck className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black">{order.shopName}</p>
                    <p className="text-sm text-text-muted">{order.orderCode}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:justify-end">
                  <StatusBadge value={order.status} label={tStatus(`order.${order.status}`)} />
                  <StatusBadge value={order.paymentStatus} label={tStatus(`payment.${order.paymentStatus}`)} />
                  <p className="text-lg font-black text-brand">{formatShopPrice(order.totalAmount, order.currency)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </ShopPageFrame>
  );
}
