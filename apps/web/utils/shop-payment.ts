import type { ShopPaymentProvider } from "@/types/shop-payment";

export function createProviderTransactionId(provider: ShopPaymentProvider) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${provider}-${random}`;
}
