"use client";

import { Link } from "@/i18n/routing";
import { useCategoriesTreeQuery } from "@/hooks/shop-hooks";
import { SHOP_SITEMAP_CATEGORIES } from "../data/shop-sitemap-data";
import { useTranslations } from "next-intl";

type SitemapCategoryItem = {
  id: string;
  title: string;
  slug: string;
  href: string;
  children: Array<{
    id: string;
    title: string;
    slug: string;
    href: string;
  }>;
};

export function SitemapSection() {
  const { data: response, isLoading } = useCategoriesTreeQuery();
  const t = useTranslations("ShopPage");

  const categories: SitemapCategoryItem[] = response?.data && response.data.length > 0
    ? response.data.map((cat) => ({
        id: String(cat.id),
        title: cat.name,
        slug: cat.slug,
        href: `/shop?category=${cat.id}`,
        children: cat.children?.map((child) => ({
          id: String(child.id),
          title: child.name,
          slug: child.slug,
          href: `/shop?category=${child.id}`,
        })) || [],
      }))
    : SHOP_SITEMAP_CATEGORIES;

  return (
    <section aria-labelledby="sitemap-heading" className="shop-section shop-section--sitemap">
      <h1 id="sitemap-heading" className="shop-section__title shop-section__title--large">
        {t("sections.categories")}
      </h1>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="shop-sitemap-grid" aria-label="Shop categories">
          {categories.map((category, index) => (
            <section
              key={category.id}
              aria-labelledby={`category-${category.id}`}
              className="shop-sitemap-category animate-in fade-in"
              style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
            >
              <Link
                id={`category-${category.id}`}
                href={category.href}
                className="shop-sitemap-category__title"
                title={category.title}
              >
                {category.title}
              </Link>
              {category.children && category.children.length > 0 && (
                <ul className="shop-sitemap-category__list">
                  {category.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={child.href}
                        className="shop-sitemap-category__child"
                        title={child.title}
                      >
                        {child.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

