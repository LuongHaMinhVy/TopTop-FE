"use client";

import { useState, type ElementType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Package,
  ShieldAlert,
  ShoppingBag,
  Store,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Unlock,
  Sparkles,
  Loader2,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge, Button, Input, Select } from "@repo/ui";
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
  unsuspendAdminShop,
} from "@/services/commerce-admin-api-service";
import type { AdminCommerceOrder, AdminProduct, AdminShop } from "@/types/admin";
import { EmptyState, IconActionButton, LoadingRows, Panel } from "@/components/dashboard/dashboard-common";
import { formatDate, statusVariant } from "@/components/dashboard/dashboard-utils";

type CommerceSection = "overview" | "shops" | "products" | "orders";

const commerceSections: Array<{ key: CommerceSection; labelKey: string; icon: ElementType }> = [
  { key: "overview", labelKey: "tabs.overview", icon: ShoppingBag },
  { key: "shops", labelKey: "tabs.shops", icon: Store },
  { key: "products", labelKey: "tabs.products", icon: Package },
  { key: "orders", labelKey: "tabs.orders", icon: ShoppingBag },
];

export default function AdminCommercePage() {
  const tPages = useTranslations("Admin.dashboard.pages.commerce");
  const [activeSection, setActiveSection] = useState<CommerceSection>("overview");

  // Overview stats queries (smaller size is fine, e.g. 4)
  const shopsQuery = useQuery({ queryKey: ["admin", "commerce", "shops-overview"], queryFn: () => getAdminShops({ size: 4 }) });
  const productsQuery = useQuery({ queryKey: ["admin", "commerce", "products-overview"], queryFn: () => getAdminProducts({ size: 4 }) });
  const ordersQuery = useQuery({ queryKey: ["admin", "commerce", "orders-overview"], queryFn: () => getAdminOrders({ size: 4 }) });

  return (
    <div className="space-y-6">
      {/* Premium Hero Banner */}
      <div className="toptop-gradient-hero rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-brand animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand">TopTop Social Commerce</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-text-primary">
            {tPages("title")}
          </h1>
          <p className="mt-1 text-xs font-semibold text-text-muted">
            {tPages("description")}
          </p>
        </div>
      </div>

      <CommerceSubmenu activeSection={activeSection} onChange={setActiveSection} />

      {activeSection === "overview" && (
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
      )}

      {activeSection === "shops" && <ShopPanel />}

      {activeSection === "products" && <ProductPanel />}

      {activeSection === "orders" && <OrderPanel />}
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
    <nav className="grid gap-2 rounded-xl border border-elevated bg-background p-2 sm:grid-cols-2 xl:grid-cols-4">
      {commerceSections.map((section) => {
        const Icon = section.icon;
        const active = activeSection === section.key;

        return (
          <Button
            key={section.key}
            type="button"
            onClick={() => onChange(section.key)}
            aria-current={active ? "page" : undefined}
            className={`flex h-12 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition ${
              active
                ? "bg-brand text-white shadow-lg shadow-brand/20"
                : "text-text-muted hover:bg-hover hover:text-text-primary"
            }`}
          >
            <Icon className="size-4" />
            <span className="truncate">{t(section.labelKey)}</span>
          </Button>
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
            <OverviewList
              title={t("recentShops")}
              empty={t("emptyShops")}
              items={shops.slice(0, 4).map((shop) => ({
                id: shop.id,
                title: shop.name,
                meta: `${shop.status} / ${shop.moderationStatus}`,
              }))}
            />
            <OverviewList
              title={t("recentProducts")}
              empty={t("emptyProducts")}
              items={products.slice(0, 4).map((product) => ({
                id: product.id,
                title: product.title,
                meta: `${product.status} / ${product.moderationStatus}`,
              }))}
            />
            <OverviewList
              title={t("recentOrders")}
              empty={t("emptyOrders")}
              items={orders.slice(0, 4).map((order) => ({
                id: order.id,
                title: order.orderCode,
                meta: `${order.status} / ${formatPrice(order.totalAmount, order.currency)}`,
              }))}
            />
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
    <div className="toptop-card-glow rounded-xl bg-surface p-4">
      <h3 className="text-sm font-black text-text-primary">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-xs text-text-muted font-bold">{empty}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="min-w-0 rounded-lg bg-background p-3">
              <p className="truncate text-sm font-black text-text-primary">{item.title}</p>
              <p className="mt-1 truncate text-[10px] font-bold text-text-muted uppercase">
                {item.meta.replaceAll("_", " ")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: ElementType; label: string; value: number }) {
  return (
    <div className="toptop-card-glow rounded-xl bg-background p-5 border border-elevated">
      <div className="mb-4 grid size-10 place-items-center rounded-full bg-elevated text-text-muted">
        <Icon className="size-5" />
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-black text-text-primary">{value.toLocaleString()}</p>
    </div>
  );
}

function ShopPanel() {
  const t = useTranslations("Admin.dashboard.commerce");
  const tDashboard = useTranslations("Admin.dashboard");
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [moderationStatus, setModerationStatus] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const shopsQuery = useQuery({
    queryKey: ["admin", "commerce", "shops", page, status, moderationStatus],
    queryFn: () =>
      getAdminShops({
        page,
        size: 10,
        status: status || undefined,
        moderationStatus: moderationStatus || undefined,
      }),
  });

  const approve = useMutation({
    mutationFn: approveAdminShop,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] }),
  });
  const reject = useMutation({
    mutationFn: rejectAdminShop,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] }),
  });
  const suspend = useMutation({
    mutationFn: suspendAdminShop,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] }),
  });
  const unsuspend = useMutation({
    mutationFn: unsuspendAdminShop,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] }),
  });

  // Bulk operation mutation
  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: number[]; action: "approve" | "reject" | "suspend" }) => {
      await Promise.all(
        ids.map((id) => {
          if (action === "approve") return approveAdminShop(id);
          if (action === "reject") return rejectAdminShop(id);
          return suspendAdminShop(id);
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] });
      setSelectedIds([]);
    },
  });

  const rawItems = shopsQuery.data?.data ?? [];
  const filteredItems = rawItems.filter((shop) => {
    const q = search.toLowerCase();
    return shop.name.toLowerCase().includes(q) || shop.slug.toLowerCase().includes(q);
  });

  const pageInfo = shopsQuery.data?.meta;

  const statusOptions = [
    { value: "", label: t("allStatuses") },
    { value: "ACTIVE", label: t("status.ACTIVE") },
    { value: "SUSPENDED", label: t("status.SUSPENDED") },
    { value: "CLOSED", label: t("status.CLOSED") },
    { value: "DRAFT", label: t("status.DRAFT") },
  ];

  const moderationOptions = [
    { value: "", label: t("allModeration") },
    { value: "PENDING", label: t("moderationStatus.PENDING") },
    { value: "APPROVED", label: t("moderationStatus.APPROVED") },
    { value: "REJECTED", label: t("moderationStatus.REJECTED") },
    { value: "NEED_REVIEW", label: t("moderationStatus.NEED_REVIEW") },
  ];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredItems.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    }
  };

  const handleBulkAction = (action: "approve" | "reject" | "suspend") => {
    let confirmMsg = "";
    if (action === "approve") confirmMsg = t("bulkApproveShopsConfirm", { count: selectedIds.length });
    else if (action === "reject") confirmMsg = t("bulkRejectShopsConfirm", { count: selectedIds.length });
    else confirmMsg = `Suspend ${selectedIds.length} selected shops?`;

    if (confirm(confirmMsg)) {
      bulkMutation.mutate({ ids: selectedIds, action });
    }
  };

  return (
    <Panel
      title={t("shopModeration")}
      description={t("shopDescription")}
      action={
        <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[580px] md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-10 rounded-lg py-2 pl-10 pr-4"
            />
          </div>
          <Select
            value={status}
            options={statusOptions}
            onChange={(val) => {
              setStatus(val);
              setPage(0);
              setSelectedIds([]);
            }}
            ariaLabel={t("statusLabel")}
            className="md:w-44 "
          />
          <Select
            value={moderationStatus}
            options={moderationOptions}
            onChange={(val) => {
              setModerationStatus(val);
              setPage(0);
              setSelectedIds([]);
            }}
            ariaLabel={t("moderationLabel")}
            className="md:w-44"
          />
        </div>
      }
    >
      {shopsQuery.isError ? (
        <EmptyState icon={ShieldAlert} title={t("loadError")} detail={t("loadErrorDetail")} />
      ) : shopsQuery.isLoading ? (
        <LoadingRows count={5} />
      ) : filteredItems.length === 0 ? (
        <EmptyState icon={Store} title={t("emptyShops")} detail={t("emptyDetail")} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-elevated">
            <div className="grid grid-cols-[40px_minmax(240px,1.5fr)_160px_160px_160px] gap-4 border-b border-elevated bg-surface px-4 py-3 text-xs font-black uppercase text-text-muted items-center">
              <div className="flex justify-center">
                <input
                  type="checkbox"
                  checked={filteredItems.length > 0 && filteredItems.every((s) => selectedIds.includes(s.id))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-elevated bg-surface text-brand focus:ring-brand cursor-pointer"
                />
              </div>
              <span>{t("shops")}</span>
              <span>{t("statusLabel")}</span>
              <span>Owner ID</span>
              <span className="text-right">Actions</span>
            </div>
            {filteredItems.map((shop) => (
              <div
                key={shop.id}
                className="toptop-table-row grid grid-cols-[40px_minmax(240px,1.5fr)_160px_160px_160px] items-center gap-4 border-b border-elevated px-4 py-4 last:border-b-0"
              >
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(shop.id)}
                    onChange={(e) => handleSelectOne(shop.id, e.target.checked)}
                    className="h-4 w-4 rounded border-elevated bg-surface text-brand focus:ring-brand cursor-pointer"
                  />
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-elevated text-text-muted font-bold">
                    {shop.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={shop.avatarUrl} alt={shop.name} className="h-full w-full object-cover" />
                    ) : (
                      shop.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black text-text-primary text-sm">{shop.name}</p>
                    <p className="text-xs font-semibold text-text-muted">@{shop.slug}</p>
                  </div>
                </div>
                <Status value={`${shop.status} / ${shop.moderationStatus}`} />
                <span className="text-sm font-bold text-text-muted">Owner #{shop.ownerId}</span>
                <div className="flex justify-end gap-2">
                  {shop.moderationStatus === "PENDING" && (
                    <>
                      <IconActionButton
                        label={t("approve")}
                        icon={Check}
                        variant="success"
                        onClick={() => approve.mutate(shop.id)}
                      />
                      <IconActionButton
                        label={t("reject")}
                        icon={X}
                        variant="secondary"
                        onClick={() => reject.mutate(shop.id)}
                      />
                    </>
                  )}
                  {shop.status === "SUSPENDED" ? (
                    <IconActionButton
                      label={t("unsuspend")}
                      icon={Unlock}
                      variant="secondary"
                      onClick={() => unsuspend.mutate(shop.id)}
                    />
                  ) : shop.status === "ACTIVE" ? (
                    <IconActionButton
                      label={t("suspend")}
                      icon={ShieldAlert}
                      variant="secondary"
                      onClick={() => suspend.mutate(shop.id)}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <PaginationControls
            page={page}
            totalPages={pageInfo?.totalPages ?? 1}
            totalElements={pageInfo?.totalElements ?? filteredItems.length}
            onPageChange={setPage}
          />

          {/* Floating Batch Actions Bar for Shops */}
          {selectedIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full border border-elevated bg-background/95 px-6 py-3.5 shadow-2xl backdrop-blur-md transition-all md:w-auto w-[92%] max-w-lg">
              <span className="text-xs font-black text-text-primary whitespace-nowrap">
                {t("selectedCount", { count: selectedIds.length })}
              </span>
              <div className="h-4 w-px bg-elevated" />
              <div className="flex flex-1 items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="h-9 rounded-full px-3 text-xs font-bold text-text-muted hover:bg-hover transition active:scale-95"
                >
                  {tDashboard("moderation.clearSelection")}
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction("approve")}
                  disabled={bulkMutation.isPending}
                  className="h-9 rounded-full bg-green-600 px-4 text-xs font-black text-white hover:bg-green-700 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {bulkMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {t("approve")}
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction("reject")}
                  disabled={bulkMutation.isPending}
                  className="h-9 rounded-full border border-elevated px-4 text-xs font-black text-text-primary hover:bg-hover flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {bulkMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {t("reject")}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

function ProductPanel() {
  const t = useTranslations("Admin.dashboard.commerce");
  const tDashboard = useTranslations("Admin.dashboard");
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [moderationStatus, setModerationStatus] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const productsQuery = useQuery({
    queryKey: ["admin", "commerce", "products", page, status, moderationStatus],
    queryFn: () =>
      getAdminProducts({
        page,
        size: 10,
        status: status || undefined,
        moderationStatus: moderationStatus || undefined,
      }),
  });

  const approve = useMutation({
    mutationFn: approveAdminProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] }),
  });
  const reject = useMutation({
    mutationFn: rejectAdminProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] }),
  });
  const ban = useMutation({
    mutationFn: banAdminProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] }),
  });

  // Bulk operation mutation
  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: number[]; action: "approve" | "reject" | "ban" }) => {
      await Promise.all(
        ids.map((id) => {
          if (action === "approve") return approveAdminProduct(id);
          if (action === "reject") return rejectAdminProduct(id);
          return banAdminProduct(id);
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "commerce"] });
      setSelectedIds([]);
    },
  });

  const rawItems = productsQuery.data?.data ?? [];
  const filteredItems = rawItems.filter((product) => {
    const q = search.toLowerCase();
    return product.title.toLowerCase().includes(q) || (product.slug && product.slug.toLowerCase().includes(q));
  });

  const pageInfo = productsQuery.data?.meta;

  const statusOptions = [
    { value: "", label: t("allStatuses") },
    { value: "ACTIVE", label: t("status.ACTIVE") },
    { value: "DRAFT", label: t("status.DRAFT") },
    { value: "BANNED", label: t("status.SUSPENDED") },
  ];

  const moderationOptions = [
    { value: "", label: t("allModeration") },
    { value: "PENDING", label: t("moderationStatus.PENDING") },
    { value: "APPROVED", label: t("moderationStatus.APPROVED") },
    { value: "REJECTED", label: t("moderationStatus.REJECTED") },
    { value: "NEED_REVIEW", label: t("moderationStatus.NEED_REVIEW") },
  ];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredItems.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    }
  };

  const handleBulkAction = (action: "approve" | "reject" | "ban") => {
    let confirmMsg = "";
    if (action === "approve") confirmMsg = t("bulkApproveProductsConfirm", { count: selectedIds.length });
    else if (action === "reject") confirmMsg = t("bulkRejectProductsConfirm", { count: selectedIds.length });
    else confirmMsg = t("bulkBanProductsConfirm", { count: selectedIds.length });

    if (confirm(confirmMsg)) {
      bulkMutation.mutate({ ids: selectedIds, action });
    }
  };

  return (
    <Panel
      title={t("productModeration")}
      description={t("productDescription")}
      action={
        <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[580px] md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-10 rounded-lg py-2 pl-10 pr-4"
            />
          </div>
          <Select
            value={status}
            options={statusOptions}
            onChange={(val) => {
              setStatus(val);
              setPage(0);
              setSelectedIds([]);
            }}
            ariaLabel={t("statusLabel")}
            className="md:w-44"
          />
          <Select
            value={moderationStatus}
            options={moderationOptions}
            onChange={(val) => {
              setModerationStatus(val);
              setPage(0);
              setSelectedIds([]);
            }}
            ariaLabel={t("moderationLabel")}
            className="md:w-44"
          />
        </div>
      }
    >
      {productsQuery.isError ? (
        <EmptyState icon={ShieldAlert} title={t("loadError")} detail={t("loadErrorDetail")} />
      ) : productsQuery.isLoading ? (
        <LoadingRows count={5} />
      ) : filteredItems.length === 0 ? (
        <EmptyState icon={Package} title={t("emptyProducts")} detail={t("emptyDetail")} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-elevated">
            <div className="grid grid-cols-[40px_minmax(240px,1.5fr)_150px_130px_130px_160px] gap-4 border-b border-elevated bg-surface px-4 py-3 text-xs font-black uppercase text-text-muted items-center">
              <div className="flex justify-center">
                <input
                  type="checkbox"
                  checked={filteredItems.length > 0 && filteredItems.every((p) => selectedIds.includes(p.id))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-elevated bg-surface text-brand focus:ring-brand cursor-pointer"
                />
              </div>
              <span>{t("products")}</span>
              <span>Price & Info</span>
              <span>{t("statusLabel")}</span>
              <span>Shop ID</span>
              <span className="text-right">Actions</span>
            </div>
            {filteredItems.map((product) => (
              <div
                key={product.id}
                className="toptop-table-row grid grid-cols-[40px_minmax(240px,1.5fr)_150px_130px_130px_160px] items-center gap-4 border-b border-elevated px-4 py-4 last:border-b-0"
              >
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                    className="h-4 w-4 rounded border-elevated bg-surface text-brand focus:ring-brand cursor-pointer"
                  />
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-elevated text-text-muted">
                    {product.media && product.media.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.media[0].url} alt={product.title} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="size-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black text-text-primary text-sm">{product.title}</p>
                    <p className="text-xs font-semibold text-text-muted">slug: {product.slug}</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-text-primary">
                  <p className="text-brand font-black">{formatPrice(product.basePrice, product.currency)}</p>
                  <p className="text-text-muted mt-0.5">{product.stockQuantity} {t("stock")} · {product.soldCount || 0} sold</p>
                </div>
                <Status value={`${product.status} / ${product.moderationStatus}`} />
                <span className="text-xs font-bold text-text-muted">Shop #{product.shopId}</span>
                <div className="flex justify-end gap-2">
                  {product.status === "BANNED" || product.moderationStatus === "REJECTED" ? (
                    <IconActionButton
                      label={t("approve")}
                      icon={Check}
                      variant="success"
                      onClick={() => approve.mutate(product.id)}
                    />
                  ) : (
                    <>
                      {product.moderationStatus === "PENDING" && (
                        <IconActionButton
                          label={t("reject")}
                          icon={X}
                          variant="secondary"
                          onClick={() => reject.mutate(product.id)}
                        />
                      )}
                      <IconActionButton
                        label={t("ban")}
                        icon={ShieldAlert}
                        variant="secondary"
                        onClick={() => ban.mutate(product.id)}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <PaginationControls
            page={page}
            totalPages={pageInfo?.totalPages ?? 1}
            totalElements={pageInfo?.totalElements ?? filteredItems.length}
            onPageChange={setPage}
          />

          {/* Floating Batch Actions Bar for Products */}
          {selectedIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full border border-elevated bg-background/95 px-6 py-3.5 shadow-2xl backdrop-blur-md transition-all md:w-auto w-[92%] max-w-lg">
              <span className="text-xs font-black text-text-primary whitespace-nowrap">
                {t("selectedCount", { count: selectedIds.length })}
              </span>
              <div className="h-4 w-px bg-elevated" />
              <div className="flex flex-1 items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="h-9 rounded-full px-3 text-xs font-bold text-text-muted hover:bg-hover transition active:scale-95"
                >
                  {tDashboard("moderation.clearSelection")}
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction("approve")}
                  disabled={bulkMutation.isPending}
                  className="h-9 rounded-full bg-green-600 px-4 text-xs font-black text-white hover:bg-green-700 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {bulkMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {t("approve")}
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction("reject")}
                  disabled={bulkMutation.isPending}
                  className="h-9 rounded-full border border-elevated px-4 text-xs font-black text-text-primary hover:bg-hover flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {bulkMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {t("reject")}
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkAction("ban")}
                  disabled={bulkMutation.isPending}
                  className="h-9 rounded-full border border-elevated px-4 text-xs font-black text-text-primary hover:bg-hover flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {bulkMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldAlert className="h-3.5 w-3.5" />
                  )}
                  {t("ban")}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

function OrderPanel() {
  const t = useTranslations("Admin.dashboard.commerce");

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const ordersQuery = useQuery({
    queryKey: ["admin", "commerce", "orders", page],
    queryFn: () => getAdminOrders({ page, size: 10 }),
  });

  const rawItems = ordersQuery.data?.data ?? [];
  const filteredItems = rawItems.filter((order) => {
    const q = search.toLowerCase();
    return (
      order.orderCode.toLowerCase().includes(q) ||
      order.shopName.toLowerCase().includes(q) ||
      (order.receiverName && order.receiverName.toLowerCase().includes(q))
    );
  });

  const pageInfo = ordersQuery.data?.meta;

  return (
    <Panel
      title={t("ordersTitle")}
      description={t("ordersDescription")}
      action={
        <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[320px] md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-10 rounded-lg py-2 pl-10 pr-4"
            />
          </div>
        </div>
      }
    >
      {ordersQuery.isError ? (
        <EmptyState icon={ShieldAlert} title={t("loadError")} detail={t("loadErrorDetail")} />
      ) : ordersQuery.isLoading ? (
        <LoadingRows count={5} />
      ) : filteredItems.length === 0 ? (
        <EmptyState icon={ShoppingBag} title={t("emptyOrders")} detail={t("emptyDetail")} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-elevated">
            <div className="grid grid-cols-[minmax(180px,1.2fr)_140px_160px_140px_130px] gap-4 border-b border-elevated bg-surface px-4 py-3 text-xs font-black uppercase text-text-muted">
              <span>{t("orders")}</span>
              <span>{t("statusLabel")}</span>
              <span>Payment & Shipping</span>
              <span>Receiver</span>
              <span className="text-right">Total Amount</span>
            </div>
            {filteredItems.map((order) => (
              <div
                key={order.id}
                className="toptop-table-row grid grid-cols-[minmax(180px,1.2fr)_140px_160px_140px_130px] items-center gap-4 border-b border-elevated px-4 py-4 last:border-b-0"
              >
                <div>
                  <p className="font-black text-text-primary text-sm">{order.orderCode}</p>
                  <p className="text-xs font-semibold text-text-muted">{order.shopName} · {formatDate(order.createdAt)}</p>
                </div>
                <Status value={order.status} />
                <div className="text-xs font-bold text-text-primary">
                  <p>Payment: <span className="text-brand font-black">{order.paymentStatus}</span></p>
                  <p className="text-text-muted mt-0.5">Shipping: {order.shippingStatus}</p>
                </div>
                <div className="text-xs font-semibold text-text-muted">
                  <p className="text-text-primary font-bold">{order.receiverName}</p>
                  <p className="mt-0.5">{order.receiverPhone}</p>
                </div>
                <p className="text-right font-black text-brand text-sm">{formatPrice(order.totalAmount, order.currency)}</p>
              </div>
            ))}
          </div>

          <PaginationControls
            page={page}
            totalPages={pageInfo?.totalPages ?? 1}
            totalElements={pageInfo?.totalElements ?? filteredItems.length}
            onPageChange={setPage}
          />
        </>
      )}
    </Panel>
  );
}

function Status({ value }: { value: string }) {
  const parts = value.split(" / ");
  return (
    <div className="flex flex-wrap gap-1">
      {parts.map((p, i) => (
        <Badge key={i} variant={statusVariant(p)} size="sm">
          {p.replaceAll("_", " ")}
        </Badge>
      ))}
    </div>
  );
}

function formatPrice(value: number, currency = "VND") {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(value);
}

function PaginationControls({
  page,
  totalPages,
  totalElements,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations("Admin.dashboard.commerce");

  return (
    <div className="mt-4 flex flex-col gap-3 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
      <span>
        {t("pageSummary", {
          page: page + 1,
          total: Math.max(totalPages, 1),
          count: totalElements,
        })}
      </span>
      <div className="flex gap-2">
        <IconActionButton
          label={t("previous")}
          icon={ChevronLeft}
          variant="secondary"
          disabled={page <= 0}
          onClick={() => onPageChange(Math.max(page - 1, 0))}
        />
        <IconActionButton
          label={t("next")}
          icon={ChevronRight}
          variant="secondary"
          disabled={page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </div>
  );
}
