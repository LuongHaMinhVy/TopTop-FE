"use client";

import { Link } from "@/i18n/routing";
import { useCategoriesTreeQuery } from "@/hooks/shop-hooks";
import { SHOP_SITEMAP_CATEGORIES } from "../data/shop-sitemap-data";

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
        Danh mục
      </h1>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <ul className="shop-category-strip" aria-label="Shop categories">
          {categories.map((category, index) => (
            <li
              key={category.id}
              className="shop-category-strip__item animate-in fade-in"
              style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
            >
              <Link
                id={`category-${category.id}`}
                href={category.href}
                className="shop-category-tile"
                title={category.title}
              >
                <span
                  className={`shop-category-tile__media shop-category-tile__media--${(index % 6) + 1}`}
                  aria-hidden="true"
                >
                  <span>{getCategoryInitial(category.title)}</span>
                </span>
                <span className="shop-category-tile__title">{category.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function getCategoryInitial(title: string) {
  return title.trim().charAt(0).toLocaleUpperCase("vi-VN");
}
