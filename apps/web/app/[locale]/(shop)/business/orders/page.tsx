"use client";

import { useTranslations } from "next-intl";
import { BusinessAccess, isApprovedBusinessShop } from "@/components/shop/BusinessAccess";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { useMyShopQuery, useShopOrdersQuery, useUpdateOrderStatusMutation } from "@/hooks/shop-hooks";
import { formatShopPrice, ShopEmptyState, ShopPageFrame, StatusBadge } from "@/components/shop/ShopUi";
import type { Order } from "@/types/shop";

const NEXT_STATUS: Partial<Record<Order["status"], Order["status"]>> = {
  SELLER_CONFIRMING: "PACKING",
  PAID: "SELLER_CONFIRMING",
  PACKING: "SHIPPING",
  SHIPPING: "DELIVERED",
};

export default function BusinessOrdersPage() {
  const t = useTranslations("BusinessOrdersPage");
  const shopQuery = useMyShopQuery();
  const canAccessBusiness = isApprovedBusinessShop(shopQuery.data?.data);
  const ordersQuery = useShopOrdersQuery(0, 50, canAccessBusiness);
  const updateOrder = useUpdateOrderStatusMutation();
  const orders = ordersQuery.data?.data ?? [];

  return (
    <ShopPageFrame title={t("title")} subtitle={t("subtitle")}>
      <DocumentTitle title={`${t("title")} | TopTop`} />
      <BusinessAccess>
        {ordersQuery.isLoading ? (
          <div className="h-72 animate-pulse rounded-lg bg-elevated" />
        ) : orders.length === 0 ? (
          <ShopEmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const nextStatus = NEXT_STATUS[order.status];
              return (
                <article key={order.id} className="rounded-lg border border-elevated bg-background p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-black">{order.orderCode}</p>
                      <p className="mt-1 text-sm text-text-muted">
                        {order.receiverName} · {order.items.length} {t("items")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge value={order.status} />
                      <p className="font-black text-brand">{formatShopPrice(order.totalAmount, order.currency)}</p>
                      {nextStatus ? (
                        <button
                          type="button"
                          disabled={updateOrder.isPending}
                          onClick={() => updateOrder.mutate({ orderId: order.id, status: nextStatus })}
                          className="rounded-full bg-text-primary px-4 py-2 text-sm font-black text-background disabled:opacity-60"
                        >
                          {t("moveTo", { status: nextStatus.replaceAll("_", " ") })}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </BusinessAccess>
    </ShopPageFrame>
  );
}
