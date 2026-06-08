"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BusinessAccess, isApprovedBusinessShop } from "@/components/shop/BusinessAccess";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { SellerProductForm } from "@/components/shop/SellerProductForm";
import { ShopEmptyState, ShopPageFrame } from "@/components/shop/ShopUi";
import { useMyShopQuery, useProductByIdQuery } from "@/hooks/shop-hooks";

export default function EditBusinessProductPage() {
  const t = useTranslations("BusinessProductEditPage");
  const params = useParams<{ productId: string }>();
  const productId = Number(params.productId);
  const shopQuery = useMyShopQuery();
  const canAccessBusiness = isApprovedBusinessShop(shopQuery.data?.data);
  const productQuery = useProductByIdQuery(
    productId,
    canAccessBusiness && Number.isFinite(productId) && productId > 0,
  );
  const product = productQuery.data?.data;

  return (
    <ShopPageFrame title={t("editTitle")} subtitle={t("subtitle")} variant="seller">
      <DocumentTitle title={`${t("editTitle")} | TopTop`} />
      <BusinessAccess>
        {productQuery.isLoading ? (
          <div className="h-80 max-w-3xl animate-pulse rounded-lg bg-elevated" />
        ) : product ? (
          <SellerProductForm product={product} />
        ) : (
          <ShopEmptyState title={t("notFoundTitle")} description={t("notFoundDescription")} />
        )}
      </BusinessAccess>
    </ShopPageFrame>
  );
}
