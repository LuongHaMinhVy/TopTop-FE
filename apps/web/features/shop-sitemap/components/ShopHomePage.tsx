"use client";

import Image from "next/image";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Search, ShoppingBag, Star, Store, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { DocumentTitle } from "@/components/shared/DocumentTitle";
import { useCategoriesTreeQuery, usePublicProductsQuery } from "@/hooks/shop-hooks";
import type { Category, Product } from "@/types/shop";

const PRODUCT_PAGE_SIZE = 36;
const CATEGORY_LIMIT = 18;
const DEAL_LIMIT = 8;
const RAIL_LIMIT = 10;

export default function ShopHomePage() {
  const t = useTranslations("ShopPage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = Number(searchParams.get("category"));
  const categoryId = Number.isFinite(categoryParam) && categoryParam > 0 ? categoryParam : undefined;
  const keyword = searchParams.get("q")?.trim() || undefined;
  const [searchValue, setSearchValue] = useState(keyword ?? "");

  const categoriesQuery = useCategoriesTreeQuery();
  const productsQuery = usePublicProductsQuery(keyword, categoryId, 0, PRODUCT_PAGE_SIZE);
  const categories = useMemo(() => categoriesQuery.data?.data ?? [], [categoriesQuery.data]);
  const products = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data]);
  const categoryTiles = useMemo(() => flattenCategories(categories).slice(0, CATEGORY_LIMIT), [categories]);
  const activeCategory = findCategoryById(categories, categoryId);
  const dealProducts = products.slice(0, DEAL_LIMIT);
  const topSellingProducts = useMemo(
    () => [...products].sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0)).slice(0, RAIL_LIMIT),
    [products],
  );
  const newestProducts = useMemo(
    () => [...products].sort((a, b) => b.id - a.id).slice(0, RAIL_LIMIT),
    [products],
  );

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const nextKeyword = searchValue.trim();
    if (nextKeyword) params.set("q", nextKeyword);
    if (categoryId) params.set("category", String(categoryId));
    const query = params.toString();
    router.push(query ? `/shop?${query}` : "/shop");
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <DocumentTitle title={`${t("title")} | TopTop`} />
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 pb-8 pt-4 sm:gap-8 sm:px-6 sm:pb-14 xl:px-8">
        <form
          onSubmit={submitSearch}
          className="sticky top-2 z-20 flex min-w-0 items-center rounded-full border border-elevated bg-background/80 px-2 py-1 backdrop-blur-md transition-all focus-within:border-brand/40 focus-within:shadow-[0_0_12px_rgba(255,59,92,0.15)] sm:px-3 sm:py-1.5"
        >
          <Search className="ml-2 size-4 shrink-0 text-text-muted sm:size-5" />
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={t("actions.search")}
            className="h-9 min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold text-text-primary outline-none placeholder:text-text-muted sm:h-10 sm:px-3 sm:text-[15px]"
          />
          <button
            type="submit"
            className="h-8 shrink-0 rounded-full bg-brand px-3 text-xs font-bold text-white transition-all hover:bg-brand-dark sm:h-9 sm:px-5 sm:text-sm"
          >
            <span className="hidden sm:inline">{t("actions.search")}</span>
            <Search className="size-4 sm:hidden" />
          </button>
        </form>

        <section className="toptop-gradient-hero grid min-h-[200px] overflow-hidden rounded-xl sm:min-h-[240px] lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col justify-between gap-6 p-5 sm:p-8 lg:p-10">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--color-cyan)_12%,transparent)] border border-cyan/20 px-3 py-1 text-xs font-bold text-cyan animate-pulse">
                <Truck className="size-4" />
                {t("hero.freeship")}
              </span>
              <h1 className="mt-4 max-w-3xl text-[28px] font-extrabold tracking-tight leading-[1.1] sm:text-[44px] lg:text-[56px] text-text-primary">
                {activeCategory?.name ?? (keyword ? t("hero.searchTitle", { keyword }) : t("title"))}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-text-secondary sm:text-base">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <HeroPill label={t("hero.pills.flashSale")} href="#flash-sale" />
              <HeroPill label={t("sections.categories")} href="#categories" />
              <HeroPill label={t("actions.business")} href="/business" />
            </div>
          </div>

          <div className="hidden grid-cols-2 gap-3 p-5 lg:grid">
            {products.slice(0, 4).map((product) => (
              <HeroProduct key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section id="categories" aria-labelledby="shop-categories-heading">
          <SectionHeader title={t("sections.categories")} actionHref="/shop/sitemap" actionLabel={t("actions.seeAll")} />
          {categoriesQuery.isLoading ? (
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[76px] w-[80px] shrink-0 animate-pulse rounded-full bg-elevated sm:h-[96px] sm:w-[100px]"
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {categoryTiles.map((category, index) => (
                <CategoryShortcut
                  key={category.id}
                  category={category}
                  active={category.id === categoryId}
                  index={index}
                />
              ))}
            </div>
          )}
        </section>

        {dealProducts.length > 0 ? (
          <ProductRail
            id="flash-sale"
            title={t("sections.flashSale")}
            products={dealProducts}
            allLabel={t("actions.seeAll")}
            dealLabel={t("labels.deal")}
          />
        ) : null}
        {topSellingProducts.length > 0 ? (
          <ProductRail
            title={t("sections.bestSellers")}
            products={topSellingProducts}
            allLabel={t("actions.seeAll")}
            dealLabel={t("labels.deal")}
          />
        ) : null}
        {newestProducts.length > 0 ? (
          <ProductRail
            title={t("sections.newArrivals")}
            products={newestProducts}
            allLabel={t("actions.seeAll")}
            dealLabel={t("labels.deal")}
          />
        ) : null}

        <section aria-labelledby="shop-products-heading">
          <SectionHeader
            title={activeCategory?.name ?? (keyword ? t("sections.searchResults") : t("sections.forYou"))}
            actionHref={keyword || categoryId ? "/shop" : undefined}
            actionLabel={keyword || categoryId ? t("actions.allProducts") : undefined}
          />

          {productsQuery.isLoading ? (
            <ProductGridSkeleton />
          ) : productsQuery.isError ? (
            <ShopState
              icon={<ShoppingBag className="size-8 text-brand" />}
              title={t("states.errorTitle")}
              description={t("states.errorDescription")}
              action={
                <button
                  type="button"
                  onClick={() => void productsQuery.refetch()}
                  className="mt-5 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-dark"
                >
                  {t("actions.retry")}
                </button>
              }
            />
          ) : products.length === 0 ? (
            <ShopState
              icon={<Store className="size-8 text-text-muted" />}
              title={t("states.emptyTitle")}
              description={t("states.emptyDescription")}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 sm:gap-4 lg:gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} soldLabel={t("labels.sold")} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  actionHref,
  actionLabel,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-lg font-extrabold tracking-tight text-text-primary sm:text-xl md:text-2xl">{title}</h2>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-text-muted transition-colors hover:text-brand sm:text-sm"
        >
          {actionLabel}
          <ArrowRight className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

function HeroPill({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center justify-center rounded-full border border-elevated bg-background px-4 py-0.5 text-xs font-bold text-text-secondary transition-all hover:border-brand hover:text-text-primary hover:bg-hover"
    >
      {label}
    </Link>
  );
}

function HeroProduct({ product }: { product: Product }) {
  const cover = productCover(product);

  return (
    <Link
      href={`/shop/product/${product.id}`}
      className="toptop-card-glow group min-w-0 rounded-xl bg-background/50 p-2 border border-elevated/40 transition-all hover:bg-background"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-elevated/40">
        {cover ? (
          <Image
            src={cover}
            alt={product.title}
            fill
            sizes="180px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-text-muted">
            <ShoppingBag className="size-6" />
          </div>
        )}
      </div>
      <p className="mt-2 truncate text-[13px] font-extrabold text-brand">
        {formatPrice(product.basePrice, product.currency)}
      </p>
    </Link>
  );
}

function CategoryShortcut({
  category,
  active,
  index,
}: {
  category: Category;
  active: boolean;
  index: number;
}) {
  return (
    <Link
      href={`/shop?category=${category.id}`}
      className="group flex w-[80px] shrink-0 flex-col items-center text-center transition-transform active:scale-95 sm:w-[100px]"
    >
      <span
        className={`grid size-12 place-items-center rounded-full text-lg font-bold transition-all sm:size-16 sm:text-xl ${
          active
            ? "bg-brand text-white shadow-[0_0_12px_rgba(255,59,92,0.4)]"
            : "bg-surface border border-elevated text-text-primary group-hover:border-cyan/40 group-hover:text-cyan group-hover:shadow-[0_0_10px_rgba(37,244,238,0.15)]"
        }`}
        aria-hidden="true"
      >
        {category.name.trim().charAt(0).toLocaleUpperCase("vi-VN") || index + 1}
      </span>
      <span
        className={`mt-2 line-clamp-2 block text-xs font-bold leading-tight transition-colors sm:text-sm ${
          active ? "text-brand" : "text-text-secondary group-hover:text-text-primary"
        }`}
      >
        {category.name}
      </span>
    </Link>
  );
}

function ProductRail({
  id,
  title,
  products,
  allLabel,
  dealLabel,
}: {
  id?: string;
  title: string;
  products: Product[];
  allLabel: string;
  dealLabel: string;
}) {
  return (
    <section id={id} aria-label={title}>
      <SectionHeader title={title} actionHref="/shop" actionLabel={allLabel} />
      <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
        {products.map((product) => (
          <RailProduct key={`${title}-${product.id}`} product={product} dealLabel={dealLabel} />
        ))}
      </div>
    </section>
  );
}

function RailProduct({ product, dealLabel }: { product: Product; dealLabel: string }) {
  const cover = productCover(product);

  return (
    <Link
      href={`/shop/product/${product.id}`}
      className="toptop-card-glow group w-[130px] shrink-0 rounded-xl bg-surface p-2 transition-all sm:w-[150px] sm:p-2.5"
    >
      <article className="min-w-0">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-elevated">
          {cover ? (
            <Image
              src={cover}
              alt={product.title}
              fill
              sizes="150px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-text-muted">
              <ShoppingBag className="size-6" />
            </div>
          )}
          <span className="toptop-tag absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold text-white sm:text-[10px]">
            {dealLabel}
          </span>
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-[32px] text-xs font-semibold leading-[16px] text-text-primary transition-colors group-hover:text-brand sm:min-h-[36px] sm:leading-[18px]">
          {product.title}
        </h3>
        <p className="mt-1.5 truncate text-xs font-extrabold text-brand sm:text-sm">
          {formatPrice(product.basePrice, product.currency)}
        </p>
        <p className="mt-0.5 text-[10px] text-text-muted sm:text-[11px]">
          {(product.soldCount ?? 0).toLocaleString()} đã bán
        </p>
      </article>
    </Link>
  );
}

function ProductCard({ product, soldLabel }: { product: Product; soldLabel: string }) {
  const cover = productCover(product);

  return (
    <Link
      href={`/shop/product/${product.id}`}
      className="toptop-card-glow group min-w-0 rounded-xl bg-surface p-2.5 transition-all"
    >
      <article className="min-w-0">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-elevated">
          {cover ? (
            <Image
              src={cover}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 160px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-text-muted">
              <ShoppingBag className="size-8" />
            </div>
          )}
        </div>
        <h3 className="mt-3 line-clamp-2 min-h-[36px] text-xs font-semibold leading-[18px] text-text-primary transition-colors group-hover:text-brand sm:text-sm">
          {product.title}
        </h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="truncate text-sm font-extrabold text-brand sm:text-base">
            {formatPrice(product.basePrice, product.currency)}
          </p>
          <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-text-muted">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            {Number(product.ratingAvg ?? 0).toFixed(1)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-text-muted">
          {(product.soldCount ?? 0).toLocaleString()} {soldLabel}
        </p>
      </article>
    </Link>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6 sm:gap-4 lg:gap-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-xl bg-surface p-2.5">
          <div className="aspect-square rounded-lg bg-elevated" />
          <div className="mt-3 h-4 rounded bg-elevated" />
          <div className="mt-2 h-4 w-2/3 rounded bg-elevated" />
        </div>
      ))}
    </div>
  );
}

function ShopState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center rounded-xl border border-elevated bg-surface">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-elevated text-text-muted">{icon}</div>
      <h2 className="text-[18px] font-bold text-text-primary sm:text-[20px]">{title}</h2>
      <p className="mt-2 max-w-md text-xs leading-relaxed text-text-muted sm:text-sm">{description}</p>
      {action}
    </div>
  );
}

function productCover(product: Product) {
  return product.media?.find((item) => item.mediaType === "IMAGE")?.url ?? null;
}

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND",
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(value);
}

function flattenCategories(categories: Category[]) {
  return categories.flatMap((category) => [category, ...(category.children ?? [])]);
}

function findCategoryById(categories: Category[], categoryId?: number): Category | undefined {
  if (!categoryId) return undefined;
  for (const category of categories) {
    if (category.id === categoryId) return category;
    const child = category.children?.find((item) => item.id === categoryId);
    if (child) return child;
  }
  return undefined;
}
