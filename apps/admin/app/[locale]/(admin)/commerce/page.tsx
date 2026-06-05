"use client";

import { useState, type ElementType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Package, ShieldAlert, ShoppingBag, Store, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui";
import {
  approveAdminProduct,
  approveAdminShop,
  banAdminProduct,
  getAdminOrders,
  getAdminProducts,
  getAdminShops,
  rejectAdminProduct,
  rejectAdminShop,
  suspendAdminShop,
} from "@/services/commerce-admin-api-service";
import type { AdminCommerceOrder, AdminProduct, AdminShop } from "@/types/admin";
import { EmptyState, IconActionButton, LoadingRows, Panel } from "@/components/dashboard/dashboard-common";

type CommerceSection = "overview" | "shops" | "products" | "orders";

const commerceSections: Array<{ key: CommerceSection; labelKey: string; icon: ElementType }> = [
  { key: "overview", labelKey: "tabs.overview", icon: ShoppingBag },
  { key: "shops", labelKey: "tabs.shops", icon: Store },
  { key: "products", labelKey: "tabs.products", icon: Package },
  { key: "orders", labelKey: "tabs.orders", icon: ShoppingBag },
];

export default function AdminCommercePage() {
  const [activeSection, setActiveSection] = useState<CommerceSection>("overview");
  const shopsQuery = useQuery({ queryKey: ["admin", "commerce", "shops"], queryFn: () => getAdminShops({ size: 12 }) });
  const productsQuery = useQuery({ queryKey: ["admin", "commerce", "products"], queryFn: () => getAdminProducts({ size: 12 }) });
  const ordersQuery = useQuery({ queryKey: ["admin", "commerce", "orders"], queryFn: () => getAdminOrders({ size: 12 }) });

  return (
    <div className="space-y-6">
      <CommerceSubmenu activeSection={activeSection} onChange={setActiveSection} />

      {activeSection === "overview" ? (
        <OverviewPanel
          shopsCount={shopsQuery.data?.meta?.totalElements ?? shopsQuery.data?.data?.length ?? 0}
          productsCount={productsQuery.data?.meta?.totalElements ?? productsQuery.data?.data?.length ?? 0}
          ordersCount={ordersQuery.data?.meta?.totalElements ?? ordersQuery.data?.data?.length ?? 0}
          shops={shopsQuery.data?.data ?? []}
          products={productsQuery.data?.data ?? []}
          orders={ordersQuery.data?.data ?? []}
          isLoading={shopsQuery.isLoading || productsQuery.isLoading || ordersQuery.isLoading}
          isError={shopsQuery.isError || productsQuery.isError || ordersQuery.isError}
        />
      ) : null}

      {activeSection === "shops" ? (
        <ShopPanel items={shopsQuery.data?.data ?? []} isLoading={shopsQuery.isLoading} isError={shopsQuery.isError} />
      ) : null}

      {activeSection === "products" ? (
        <ProductPanel items={productsQuery.data?.data ?? []} isLoading={productsQuery.isLoading} isError={productsQuery.isError} />
      ) : null}

      {activeSection === "orders" ? (
        <OrderPanel items={ordersQuery.data?.data ?? []} isLoading={ordersQuery.isLoading} isError={ordersQuery.isError} />
      ) : null}
    </div>
  );
}

function CommerceSubmenu({
  activeSection,
  onChange,
}: {
  activeSection: CommerceSection;
  onChange: (section: CommerceSection) => void;
}) {
  const t = useTranslations("Admin.dashboard.commerce");

  return (
    <nav className="grid gap-2 rounded-lg border border-elevated bg-background p-2 sm:grid-cols-2 xl:grid-cols-4">
      {commerceSections.map((section) => {
        const Icon = section.icon;
        const active = activeSection === section.key;

        return (
          <button
            key={section.key}
            type="button"
            onClick={() => onChange(section.key)}
            aria-current={active ? "page" : undefined}
            className={`flex h-12 items-center justify-center gap-2 rounded-md px-3 text-sm font-black transition ${
              active
                ? "bg-brand text-white shadow-lg shadow-brand/20"
                : "text-text-muted hover:bg-hover hover:text-text-primary"
            }`}
          >
            <Icon className="size-4" />
            <span className="truncate">{t(section.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}

function OverviewPanel({
  shopsCount,
  productsCount,
  ordersCount,
  shops,
  products,
  orders,
  isLoading,
  isError,
}: {
  shopsCount: number;
  productsCount: number;
  ordersCount: number;
  shops: AdminShop[];
  products: AdminProduct[];
  orders: AdminCommerceOrder[];
  isLoading: boolean;
  isError: boolean;
}) {
  const t = useTranslations("Admin.dashboard.commerce");

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Metric icon={Store} label={t("shops")} value={shopsCount} />
        <Metric icon={Package} label={t("products")} value={productsCount} />
        <Metric icon={ShoppingBag} label={t("orders")} value={ordersCount} />
      </section>

      <Panel title={t("overviewTitle")} description={t("overviewDescription")}>
        {isError ? (
          <EmptyState icon={ShieldAlert} title={t("loadError")} detail={t("loadErrorDetail")} />
        ) : isLoading ? (
          <LoadingRows count={5} />
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            <OverviewList title={t("recentShops")} empty={t("emptyShops")} items={shops.slice(0, 4).map((shop) => ({
              id: shop.id,
              title: shop.name,
              meta: `${shop.status} / ${shop.moderationStatus}`,
            }))} />
            <OverviewList title={t("recentProducts")} empty={t("emptyProducts")} items={products.slice(0, 4).map((product) => ({
              id: product.id,
              title: product.title,
              meta: `${product.status} / ${product.moderationStatus}`,
            }))} />
            <OverviewList title={t("recentOrders")} empty={t("emptyOrders")} items={orders.slice(0, 4).map((order) => ({
              id: order.id,
              title: order.orderCode,
              meta: `${order.status} / ${formatPrice(order.totalAmount, order.currency)}`,
            }))} />
          </div>
        )}
      </Panel>
    </div>
  );
}

function OverviewList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{ id: number; title: string; meta: string }>;
}) {
  return (
    <div className="rounded-lg border border-elevated bg-surface p-4">
      <h3 className="text-sm font-black">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">{empty}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="min-w-0 rounded-md bg-background p-3">
              <p className="truncate text-sm font-black">{item.title}</p>
              <p className="mt-1 truncate text-xs font-bold text-text-muted">{item.meta.replaceAll("_", " ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: ElementType; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-elevated bg-background p-5">
      <div className="mb-4 grid size-10 place-items-center rounded-full bg-elevated text-text-muted">
        <Icon className="size-5" />
      </div>
      <p className="text-sm font-bold text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-black">{value.toLocaleString()}</p>
    </div>
  );
}

function ShopPanel({ items, isLoading, isError }: { items: AdminShop[]; isLoading: boolean; isError: boolean }) {
  const t = useTranslations("Admin.dashboard.commerce");
  const queryClient = useQueryClient();
  const approve = useMutation({ mutationFn: approveAdminShop, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] }) });
  const reject = useMutation({ mutationFn: rejectAdminShop, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] }) });
  const suspend = useMutation({ mutationFn: suspendAdminShop, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] }) });

  return (
    <Panel title={t("shopModeration")} description={t("shopDescription")}>
      {isError ? <EmptyState icon={ShieldAlert} title={t("loadError")} detail={t("loadErrorDetail")} /> : isLoading ? <LoadingRows count={4} /> : items.length === 0 ? <EmptyState icon={Store} title={t("emptyShops")} detail={t("emptyDetail")} /> : (
        <div className="overflow-hidden rounded-lg border border-elevated">
          {items.map((shop) => (
            <div key={shop.id} className="grid grid-cols-[minmax(220px,1fr)_130px_160px] items-center gap-4 border-b border-elevated bg-background px-4 py-4 last:border-b-0">
              <div className="min-w-0">
                <p className="truncate font-black">{shop.name}</p>
                <p className="text-sm text-text-muted">@{shop.slug}</p>
              </div>
              <Status value={`${shop.status} / ${shop.moderationStatus}`} />
              <div className="flex justify-end gap-2">
                <IconActionButton label={t("approve")} icon={Check} onClick={() => approve.mutate(shop.id)} />
                <IconActionButton label={t("reject")} icon={X} variant="danger" onClick={() => reject.mutate(shop.id)} />
                <IconActionButton label={t("suspend")} icon={ShieldAlert} variant="secondary" onClick={() => suspend.mutate(shop.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ProductPanel({ items, isLoading, isError }: { items: AdminProduct[]; isLoading: boolean; isError: boolean }) {
  const t = useTranslations("Admin.dashboard.commerce");
  const queryClient = useQueryClient();
  const approve = useMutation({ mutationFn: approveAdminProduct, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] }) });
  const reject = useMutation({ mutationFn: rejectAdminProduct, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] }) });
  const ban = useMutation({ mutationFn: banAdminProduct, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] }) });

  return (
    <Panel title={t("productModeration")} description={t("productDescription")}>
      {isError ? <EmptyState icon={ShieldAlert} title={t("loadError")} detail={t("loadErrorDetail")} /> : isLoading ? <LoadingRows count={4} /> : items.length === 0 ? <EmptyState icon={Package} title={t("emptyProducts")} detail={t("emptyDetail")} /> : (
        <div className="overflow-hidden rounded-lg border border-elevated">
          {items.map((product) => (
            <div key={product.id} className="grid grid-cols-[minmax(220px,1fr)_140px_150px_150px] items-center gap-4 border-b border-elevated bg-background px-4 py-4 last:border-b-0">
              <div className="min-w-0">
                <p className="truncate font-black">{product.title}</p>
                <p className="text-sm text-text-muted">{formatPrice(product.basePrice, product.currency)} · {product.stockQuantity} {t("stock")}</p>
              </div>
              <Status value={`${product.status} / ${product.moderationStatus}`} />
              <p className="text-sm font-bold text-text-muted">Shop #{product.shopId}</p>
              <div className="flex justify-end gap-2">
                <IconActionButton label={t("approve")} icon={Check} onClick={() => approve.mutate(product.id)} />
                <IconActionButton label={t("reject")} icon={X} variant="danger" onClick={() => reject.mutate(product.id)} />
                <IconActionButton label={t("ban")} icon={ShieldAlert} variant="secondary" onClick={() => ban.mutate(product.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function OrderPanel({ items, isLoading, isError }: { items: AdminCommerceOrder[]; isLoading: boolean; isError: boolean }) {
  const t = useTranslations("Admin.dashboard.commerce");
  return (
    <Panel title={t("ordersTitle")} description={t("ordersDescription")}>
      {isError ? <EmptyState icon={ShieldAlert} title={t("loadError")} detail={t("loadErrorDetail")} /> : isLoading ? <LoadingRows count={4} /> : items.length === 0 ? <EmptyState icon={ShoppingBag} title={t("emptyOrders")} detail={t("emptyDetail")} /> : (
        <div className="overflow-hidden rounded-lg border border-elevated">
          {items.map((order) => (
            <div key={order.id} className="grid grid-cols-[minmax(180px,1fr)_160px_150px_150px] items-center gap-4 border-b border-elevated bg-background px-4 py-4 last:border-b-0">
              <div>
                <p className="font-black">{order.orderCode}</p>
                <p className="text-sm text-text-muted">{order.shopName}</p>
              </div>
              <Status value={order.status} />
              <p className="text-sm font-bold text-text-muted">{order.paymentStatus} / {order.shippingStatus}</p>
              <p className="text-right font-black text-brand">{formatPrice(order.totalAmount, order.currency)}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function Status({ value }: { value: string }) {
  return <Badge variant="info" size="sm">{value.replaceAll("_", " ")}</Badge>;
}

function formatPrice(value: number, currency = "VND") {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(value);
}
