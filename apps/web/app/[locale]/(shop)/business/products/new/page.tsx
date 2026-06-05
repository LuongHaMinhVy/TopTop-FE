"use client";

import { useTranslations } from "next-intl";
import { BusinessAccess } from "@/components/shop/BusinessAccess";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { SellerProductForm } from "@/components/shop/SellerProductForm";
import { ShopPageFrame } from "@/components/shop/ShopUi";

export default function NewBusinessProductPage() {
  const t = useTranslations("BusinessProductEditPage");

  return (
    <ShopPageFrame title={t("newTitle")} subtitle={t("subtitle")}>
      <DocumentTitle title={`${t("newTitle")} | TopTop`} />
      <BusinessAccess>
        <SellerProductForm />
      </BusinessAccess>
    </ShopPageFrame>
  );
}
