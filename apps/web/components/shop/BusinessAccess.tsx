"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useSelector } from "react-redux";
import { useRouter } from "@/i18n/routing";
import { ShopEmptyState } from "@/components/shop/ShopUi";
import { useMyShopQuery } from "@/hooks/shop-hooks";
import type { RootState } from "@/store/store";
import type { Shop } from "@/types/shop";

export function isApprovedBusinessShop(shop?: Shop | null) {
  return shop?.status === "ACTIVE" && shop.moderationStatus === "APPROVED";
}

export function BusinessAccess({ children }: { children: ReactNode }) {
  const t = useTranslations("BusinessAccess");
  const router = useRouter();
  const isLoggedIn = useSelector((state: RootState) => Boolean(state.auth.user));
  const shopQuery = useMyShopQuery(isLoggedIn);
  const shop = shopQuery.data?.data;
  const canAccessBusiness = isApprovedBusinessShop(shop);

  useEffect(() => {
    if (!isLoggedIn || (!shopQuery.isLoading && !canAccessBusiness)) {
      router.replace("/seller-request");
    }
  }, [canAccessBusiness, isLoggedIn, router, shopQuery.isLoading]);

  if (!isLoggedIn || shopQuery.isLoading) {
    return <div className="h-52 animate-pulse rounded-lg bg-elevated" />;
  }

  if (!canAccessBusiness) {
    return (
      <ShopEmptyState
        title={t("blockedTitle")}
        description={
          shop
            ? t("blockedPendingDescription", {
                status: shop.status.replaceAll("_", " "),
                moderationStatus: shop.moderationStatus.replaceAll("_", " "),
              })
            : t("blockedDescription")
        }
      />
    );
  }

  return <>{children}</>;
}
