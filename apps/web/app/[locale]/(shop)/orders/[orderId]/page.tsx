"use client";

import Image from "next/image";
import { useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { CreditCard, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { useCancelOrderMutation, useOrderByIdQuery, usePayOrderMutation, useUpdateOrderStatusMutation } from "@/hooks/shop-hooks";
import { formatShopPrice, ShopEmptyState, ShopPageFrame, StatusBadge } from "@/components/shop/ShopUi";
import type { OnlineShopPaymentProvider } from "@/types/shop-payment";
import { createProviderTransactionId } from "@/utils/shop-payment";

export default function OrderDetailPage() {
  const t = useTranslations("OrderDetailPage");
  const params = useParams<{ orderId: string }>();
  const orderId = Number(params.orderId);
  const orderQuery = useOrderByIdQuery(orderId, Number.isFinite(orderId) && orderId > 0);
  const cancelOrder = useCancelOrderMutation();
  const payOrder = usePayOrderMutation();
  const updateStatus = useUpdateOrderStatusMutation();
  const [paymentProvider, setPaymentProvider] = useState<OnlineShopPaymentProvider>("PAYPAL");
  const order = orderQuery.data?.data;

  if (orderQuery.isLoading) {
    return <ShopPageFrame title={t("title")} subtitle={t("loading")}><DocumentTitle title={`${t("title")} | TopTop`} /></ShopPageFrame>;
  }

  if (!order) {
    return (
      <ShopPageFrame title={t("title")}>
        <ShopEmptyState title={t("notFoundTitle")} description={t("notFoundDescription")} />
      </ShopPageFrame>
    );
  }

  const canCancel = ["PENDING_PAYMENT", "PAID", "SELLER_CONFIRMING"].includes(order.status);
  const canConfirmReceived = order.status === "DELIVERED";
  const canPay = ["UNPAID", "FAILED", "PENDING"].includes(order.paymentStatus) && order.status === "PENDING_PAYMENT";

  return (
    <ShopPageFrame title={t("title")} subtitle={order.orderCode}>
      <DocumentTitle title={`${order.orderCode} | TopTop`} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-3">
          {order.items.map((item) => (
            <article key={item.id} className="flex gap-4 rounded-lg border border-elevated bg-background p-4">
              <div className="relative size-20 flex-shrink-0 overflow-hidden rounded-lg bg-elevated">
                {item.productImageUrl ? (
                  <Image src={item.productImageUrl} alt={item.productTitle} fill sizes="80px" className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-black">{item.productTitle}</p>
                {item.variantName ? <p className="mt-1 text-sm text-text-muted">{item.variantName}</p> : null}
                <p className="mt-2 text-sm text-text-muted">
                  {formatShopPrice(item.unitPrice, order.currency)} × {item.quantity}
                </p>
              </div>
              <p className="font-black text-brand">{formatShopPrice(item.totalPrice, order.currency)}</p>
            </article>
          ))}
        </section>

        <aside className="h-fit rounded-lg border border-elevated bg-background p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">{order.shopName}</h2>
            <StatusBadge value={order.status} />
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <Line label={t("payment")} value={order.paymentStatus} />
            <Line label={t("shipping")} value={order.shippingStatus} />
            <Line label={t("receiver")} value={order.receiverName} />
            <Line label={t("phone")} value={order.receiverPhone} />
            <Line label={t("address")} value={order.receiverAddress} />
            <Line label={t("subtotal")} value={formatShopPrice(order.subtotalAmount, order.currency)} />
            <Line label={t("shippingFee")} value={formatShopPrice(order.shippingFee, order.currency)} />
            <div className="border-t border-elevated pt-3">
              <Line label={t("total")} value={formatShopPrice(order.totalAmount, order.currency)} strong />
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            {canPay ? (
              <section className="mb-3 rounded-lg bg-elevated p-3">
                <p className="text-sm font-black">{t("payNow")}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <PaymentButton
                    active={paymentProvider === "PAYPAL"}
                    icon={<Wallet className="size-4" />}
                    label={t("paymentProviders.PAYPAL")}
                    onClick={() => setPaymentProvider("PAYPAL")}
                  />
                  <PaymentButton
                    active={paymentProvider === "STRIPE"}
                    icon={<CreditCard className="size-4" />}
                    label={t("paymentProviders.STRIPE")}
                    onClick={() => setPaymentProvider("STRIPE")}
                  />
                </div>
                {payOrder.isError ? <p className="mt-3 text-xs font-bold text-brand">{t("paymentError")}</p> : null}
                <button
                  type="button"
                  disabled={payOrder.isPending}
                  onClick={() =>
                    payOrder.mutate({
                      orderId: order.id,
                      payload: {
                        provider: paymentProvider,
                        transactionId: createProviderTransactionId(paymentProvider),
                      },
                    })
                  }
                  className="mt-3 h-10 w-full rounded-full bg-text-primary text-sm font-black text-background disabled:opacity-60"
                >
                  {payOrder.isPending ? t("paying") : t("payWith", { provider: t(`paymentProviders.${paymentProvider}`) })}
                </button>
                <p className="mt-3 text-xs leading-5 text-text-muted">{t("paymentRedirectNote", { provider: t(`paymentProviders.${paymentProvider}`) })}</p>
              </section>
            ) : null}
            {canConfirmReceived ? (
              <button
                type="button"
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ orderId: order.id, status: "COMPLETED" })}
                className="h-10 rounded-full bg-text-primary text-sm font-black text-background disabled:opacity-60"
              >
                {t("confirmReceived")}
              </button>
            ) : null}
            {canCancel ? (
              <button
                type="button"
                disabled={cancelOrder.isPending}
                onClick={() => cancelOrder.mutate(order.id)}
                className="h-10 rounded-full border border-elevated text-sm font-black text-brand hover:bg-hover disabled:opacity-60"
              >
                {t("cancel")}
              </button>
            ) : null}
          </div>
        </aside>
      </div>
    </ShopPageFrame>
  );
}

function PaymentButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border px-3 text-sm font-black ${
        active ? "border-text-primary bg-background text-text-primary" : "border-transparent bg-background text-text-muted hover:text-text-primary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-black" : "text-text-muted"}`}>
      <span>{label}</span>
      <span className="text-right text-text-primary">{value}</span>
    </div>
  );
}
