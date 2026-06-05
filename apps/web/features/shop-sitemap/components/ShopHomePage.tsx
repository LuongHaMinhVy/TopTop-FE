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
    <div className="h-full overflow-y-auto bg-background text-text-primary custom-scrollbar">
      <DocumentTitle title={`${t("title")} | TopTop`} />
      <div className="mx-auto flex max-w-[1440px] flex-col gap-7 px-4 pb-14 pt-4 sm:px-6 xl:px-8">
        <header className="sticky top-0 z-20 bg-background/95 py-3 backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Link href="/shop" className="mr-2 hidden shrink-0 items-center gap-2 text-[22px] font-black md:flex">
              <ShoppingBag className="size-7 text-brand" />
              <span>TopTop Shop</span>
            </Link>
            <form onSubmit={submitSearch} className="flex min-w-0 flex-1 items-center rounded-full bg-elevated px-4">
              <Search className="size-5 shrink-0 text-text-muted" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={t("actions.search")}
                className="h-12 min-w-0 flex-1 bg-transparent px-3 text-[15px] font-semibold text-text-primary outline-none placeholder:text-text-muted"
              />
              <button
                type="submit"
                className="h-9 rounded-full bg-text-primary px-5 text-[14px] font-black text-background hover:opacity-90"
              >
                {t("actions.search")}
              </button>
            </form>
            <div className="flex shrink-0 gap-2">
              <Link
                href="/cart"
                className="grid size-12 place-items-center rounded-full bg-elevated hover:bg-hover"
                aria-label={t("actions.cart")}
              >
                <ShoppingBag className="size-5" />
              </Link>
              <Link
                href="/business"
                className="hidden h-12 items-center gap-2 rounded-full bg-elevated px-4 text-[14px] font-black hover:bg-hover sm:inline-flex"
              >
                <Store className="size-4" />
                {t("actions.business")}
              </Link>
            </div>
          </div>
        </header>

        <section className="grid min-h-[260px] overflow-hidden rounded-lg bg-elevated lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-2 text-[14px] font-black text-brand">
                <Truck className="size-5" />
                Freeship cho sản phẩm có đủ điều kiện
              </p>
              <h1 className="mt-5 max-w-3xl text-[38px] font-black leading-[1.02] sm:text-[52px] lg:text-[64px]">
                {activeCategory?.name ?? (keyword ? `Tim "${keyword}"` : t("title"))}
              </h1>
              <p className="mt-4 max-w-2xl text-[16px] font-semibold leading-7 text-text-secondary">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <HeroPill label="Flash sale" href="#flash-sale" />
              <HeroPill label="Danh muc" href="#categories" />
              <HeroPill label="Ban hang" href="/business" />
            </div>
          </div>

          <div className="hidden grid-cols-2 gap-3 p-5 lg:grid">
            {products.slice(0, 4).map((product) => (
              <HeroProduct key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section id="categories" aria-labelledby="shop-categories-heading">
          <SectionHeader title="Danh muc" actionHref="/shop/sitemap" actionLabel="Xem them" />
          {categoriesQuery.isLoading ? (
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="h-[96px] w-[112px] shrink-0 animate-pulse rounded-lg bg-elevated" />
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

        {dealProducts.length > 0 ? <ProductRail id="flash-sale" title="Flash sale" products={dealProducts} /> : null}
        {topSellingProducts.length > 0 ? <ProductRail title="Ban chay" products={topSellingProducts} /> : null}
        {newestProducts.length > 0 ? <ProductRail title="Hang moi ve" products={newestProducts} /> : null}

        <section aria-labelledby="shop-products-heading">
          <SectionHeader
            title={activeCategory?.name ?? (keyword ? "Ket qua san pham" : "Goi y hom nay")}
            actionHref={keyword || categoryId ? "/shop" : "/cart"}
            actionLabel={keyword || categoryId ? "Tat ca san pham" : t("actions.cart")}
          />

          {productsQuery.isLoading ? (
            <ProductGridSkeleton />
          ) : productsQuery.isError ? (
            <ShopState
              icon={<ShoppingBag className="size-8" />}
              title={t("states.errorTitle")}
              description={t("states.errorDescription")}
              action={
                <button
                  type="button"
                  onClick={() => void productsQuery.refetch()}
                  className="mt-5 rounded-full bg-text-primary px-5 py-2 text-[14px] font-bold text-background hover:opacity-90"
                >
                  {t("actions.retry")}
                </button>
              }
            />
          ) : products.length === 0 ? (
            <ShopState
              icon={<Store className="size-8" />}
              title={t("states.emptyTitle")}
              description={t("states.emptyDescription")}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
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
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-[22px] font-black leading-tight">{title}</h2>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="inline-flex shrink-0 items-center gap-1 text-[14px] font-black text-text-muted hover:text-text-primary">
          {actionLabel}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

function HeroPill({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="rounded-full bg-background px-4 py-2 text-[13px] font-black hover:bg-hover">
      {label}
    </Link>
  );
}

function HeroProduct({ product }: { product: Product }) {
  const cover = productCover(product);

  return (
    <Link href={`/shop/product/${product.id}`} className="group min-w-0 rounded-md bg-background p-2">
      <div className="relative aspect-square overflow-hidden rounded-md bg-elevated">
        {cover ? (
          <Image src={cover} alt={product.title} fill sizes="180px" className="object-cover transition-transform duration-200 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-text-muted">
            <ShoppingBag className="size-8" />
          </div>
        )}
      </div>
      <p className="mt-2 truncate text-[13px] font-black text-brand">{formatPrice(product.basePrice, product.currency)}</p>
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
    <Link href={`/shop?category=${category.id}`} className="group w-[112px] shrink-0 text-center">
      <span
        className={`mx-auto grid size-16 place-items-center rounded-full text-[22px] font-black transition-colors ${
          active ? "bg-text-primary text-background" : "bg-elevated text-text-primary group-hover:bg-hover"
        }`}
        aria-hidden="true"
      >
        {category.name.trim().charAt(0).toLocaleUpperCase("vi-VN") || index + 1}
      </span>
      <span className="mt-2 line-clamp-2 block text-[13px] font-bold leading-4">{category.name}</span>
    </Link>
  );
}

function ProductRail({ id, title, products }: { id?: string; title: string; products: Product[] }) {
  return (
    <section id={id} aria-label={title}>
      <SectionHeader title={title} actionHref="/shop" actionLabel="Tat ca" />
      <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
        {products.map((product) => (
          <RailProduct key={`${title}-${product.id}`} product={product} />
        ))}
      </div>
    </section>
  );
}

function RailProduct({ product }: { product: Product }) {
  const cover = productCover(product);

  return (
    <Link href={`/shop/product/${product.id}`} className="group w-[150px] shrink-0">
      <article className="min-w-0">
        <div className="relative aspect-square overflow-hidden rounded-md bg-elevated">
          {cover ? (
            <Image
              src={cover}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 50vw, 160px"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-text-muted">
              <ShoppingBag className="size-8" />
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-sm bg-brand px-1.5 py-0.5 text-[11px] font-black text-white">
            Deal
          </span>
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-[34px] text-[13px] font-semibold leading-[17px]">{product.title}</h3>
        <p className="mt-1 truncate text-[15px] font-black text-brand">{formatPrice(product.basePrice, product.currency)}</p>
        <p className="mt-0.5 text-[11px] text-text-muted">{(product.soldCount ?? 0).toLocaleString()} da ban</p>
      </article>
    </Link>
  );
}

function ProductCard({ product, soldLabel }: { product: Product; soldLabel: string }) {
  const cover = productCover(product);

  return (
    <Link href={`/shop/product/${product.id}`} className="group min-w-0">
      <article className="min-w-0">
        <div className="relative aspect-square overflow-hidden rounded-md bg-elevated">
          {cover ? (
            <Image
              src={cover}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-text-muted">
              <ShoppingBag className="size-10" />
            </div>
          )}
        </div>
        <h3 className="mt-2 line-clamp-2 min-h-[38px] text-[14px] font-semibold leading-5">{product.title}</h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-[17px] font-black text-brand">{formatPrice(product.basePrice, product.currency)}</p>
          <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-text-muted">
            <Star className="size-3 fill-current" />
            {Number(product.ratingAvg ?? 0).toFixed(1)}
          </span>
        </div>
        <p className="mt-1 text-[12px] text-text-muted">
          {(product.soldCount ?? 0).toLocaleString()} {soldLabel}
        </p>
      </article>
    </Link>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-square rounded-md bg-elevated" />
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
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-elevated text-text-muted">{icon}</div>
      <h2 className="text-[20px] font-extrabold">{title}</h2>
      <p className="mt-2 max-w-md text-[14px] leading-6 text-text-muted">{description}</p>
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
