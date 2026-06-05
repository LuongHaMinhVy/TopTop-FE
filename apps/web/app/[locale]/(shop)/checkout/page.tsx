"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { usePayOrderMutation, usePlaceOrderMutation, usePreviewCheckoutQuery } from "@/hooks/shop-hooks";
import { formatShopPrice, ShopEmptyState, ShopPageFrame } from "@/components/shop/ShopUi";
import type { ShopPaymentProvider } from "@/types/shop-payment";
import { createProviderTransactionId } from "@/utils/shop-payment";

const PAYMENT_OPTIONS: Array<{ provider: ShopPaymentProvider; icon: "wallet" | "card" }> = [
  { provider: "COD", icon: "wallet" },
  { provider: "PAYPAL", icon: "wallet" },
  { provider: "STRIPE", icon: "card" },
];

export default function CheckoutPage() {
  const t = useTranslations("CheckoutPage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemIds = useMemo(
    () =>
      (searchParams.get("items") ?? "")
        .split(",")
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    [searchParams],
  );
  const previewQuery = usePreviewCheckoutQuery(itemIds, itemIds.length > 0);
  const placeOrder = usePlaceOrderMutation();
  const payOrder = usePayOrderMutation();
  const preview = previewQuery.data?.data;
  const [form, setForm] = useState({
    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",
    note: "",
  });
  const [paymentProvider, setPaymentProvider] = useState<ShopPaymentProvider>("COD");

  const canSubmit =
    itemIds.length > 0 &&
    Boolean(form.receiverName.trim()) &&
    Boolean(form.receiverPhone.trim()) &&
    Boolean(form.receiverAddress.trim()) &&
    !placeOrder.isPending &&
    !payOrder.isPending;

  const submitOrder = async () => {
    if (!canSubmit) return;
    try {
      const response = await placeOrder.mutateAsync({
        cartItemIds: itemIds,
        receiverName: form.receiverName.trim(),
        receiverPhone: form.receiverPhone.trim(),
        receiverAddress: form.receiverAddress.trim(),
        note: form.note.trim() || undefined,
        paymentProvider,
      });
      const orderId = response.data?.id;

      if (orderId && paymentProvider !== "COD") {
        await payOrder.mutateAsync({
          orderId,
          payload: {
            provider: paymentProvider,
            transactionId: createProviderTransactionId(paymentProvider),
          },
        });
      }

      router.push(orderId ? `/orders/${orderId}` : "/orders");
    } catch {
      // Mutation error UI is rendered below from React Query state.
    }
  };

  return (
    <ShopPageFrame title={t("title")} subtitle={t("subtitle")}>
      <DocumentTitle title={`${t("title")} | TopTop`} />
      {itemIds.length === 0 ? (
        <ShopEmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-lg border border-elevated bg-background p-5">
            <h2 className="text-lg font-black">{t("shipping")}</h2>
            <div className="mt-5 grid gap-4">
              <Field label={t("receiverName")} value={form.receiverName} onChange={(receiverName) => setForm((value) => ({ ...value, receiverName }))} />
              <Field label={t("receiverPhone")} value={form.receiverPhone} onChange={(receiverPhone) => setForm((value) => ({ ...value, receiverPhone }))} />
              <label className="grid gap-2 text-sm font-bold">
                {t("receiverAddress")}
                <textarea
                  value={form.receiverAddress}
                  onChange={(event) => setForm((value) => ({ ...value, receiverAddress: event.target.value }))}
                  rows={4}
                  className="rounded-lg border border-elevated bg-background px-4 py-3 text-text-primary outline-none focus:border-text-primary"
                />
              </label>
              <Field label={t("note")} value={form.note} onChange={(note) => setForm((value) => ({ ...value, note }))} optional />
            </div>
          </section>

          <aside className="h-fit rounded-lg border border-elevated bg-background p-5">
            <h2 className="text-lg font-black">{t("summary")}</h2>
            {previewQuery.isLoading ? (
              <div className="mt-4 h-32 animate-pulse rounded-lg bg-elevated" />
            ) : preview ? (
              <div className="mt-4 space-y-4">
                {preview.shops.map((shop) => (
                  <div key={shop.shopId} className="rounded-lg bg-elevated p-3">
                    <p className="font-black">{shop.shopName}</p>
                    <p className="mt-1 text-sm text-text-muted">
                      {shop.items.length} {t("items")} · {formatShopPrice(shop.subtotal, preview.currency)}
                    </p>
                  </div>
                ))}
                <SummaryLine label={t("subtotal")} value={formatShopPrice(preview.subtotalAmount, preview.currency)} />
                <SummaryLine label={t("shippingFee")} value={formatShopPrice(preview.shippingFee, preview.currency)} />
                <SummaryLine label={t("discount")} value={formatShopPrice(preview.discountAmount, preview.currency)} />
                <div className="border-t border-elevated pt-4">
                  <SummaryLine label={t("total")} value={formatShopPrice(preview.totalAmount, preview.currency)} strong />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-text-muted">{t("previewUnavailable")}</p>
            )}

            <section className="mt-5 border-t border-elevated pt-5">
              <h3 className="text-sm font-black">{t("paymentMethod")}</h3>
              <div className="mt-3 grid gap-2">
                {PAYMENT_OPTIONS.map((option) => (
                  <button
                    key={option.provider}
                    type="button"
                    onClick={() => setPaymentProvider(option.provider)}
                    className={`flex min-h-12 items-center justify-between gap-3 rounded-lg border px-4 text-left text-sm font-bold transition ${
                      paymentProvider === option.provider
                        ? "border-text-primary bg-elevated text-text-primary"
                        : "border-elevated text-text-muted hover:bg-hover"
                    }`}
                  >
                    <span className="inline-flex min-w-0 items-center gap-3">
                      {option.icon === "card" ? <CreditCard className="size-4 flex-shrink-0" /> : <Wallet className="size-4 flex-shrink-0" />}
                      <span className="truncate">{t(`paymentProviders.${option.provider}`)}</span>
                    </span>
                    <span className={`size-3 rounded-full border ${paymentProvider === option.provider ? "border-text-primary bg-text-primary" : "border-elevated"}`} />
                  </button>
                ))}
              </div>
              {paymentProvider !== "COD" ? (
                <p className="mt-3 text-xs leading-5 text-text-muted">{t("externalPaymentNote", { provider: t(`paymentProviders.${paymentProvider}`) })}</p>
              ) : null}
            </section>

            {(placeOrder.isError || payOrder.isError) ? <p className="mt-4 text-sm font-bold text-brand">{t("orderError")}</p> : null}
            <button
              type="button"
              disabled={!canSubmit}
              onClick={submitOrder}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-text-primary text-sm font-black text-background hover:opacity-90 disabled:bg-elevated disabled:text-text-muted disabled:hover:opacity-100"
            >
              {placeOrder.isPending || payOrder.isPending ? t("placing") : t("placeOrder")}
            </button>
          </aside>
        </div>
      )}
    </ShopPageFrame>
  );
}

function Field({
  label,
  value,
  onChange,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={!optional}
        className="h-11 rounded-lg border border-elevated bg-background px-4 text-text-primary outline-none focus:border-text-primary"
      />
    </label>
  );
}

function SummaryLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-base font-black" : "text-sm text-text-muted"}`}>
      <span>{label}</span>
      <span className={strong ? "text-brand" : "font-bold text-text-primary"}>{value}</span>
    </div>
  );
}
