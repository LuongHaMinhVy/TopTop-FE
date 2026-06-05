export type ShopPaymentProvider = "COD" | "PAYPAL" | "STRIPE";
export type OnlineShopPaymentProvider = Exclude<ShopPaymentProvider, "COD">;
