"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowLeft, BarChart3, ClipboardList, Package, ShoppingBag, ShoppingCart, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSelector } from "react-redux";
import { isApprovedBusinessShop } from "@/components/shop/BusinessAccess";
import { useMyShopQuery } from "@/hooks/shop-hooks";
import { Link, usePathname } from "@/i18n/routing";
import { Logo } from "@/components/layout/LayoutHelpers";
import type { RootState } from "@/store/store";

type ShopNavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  exact?: boolean;
};

const BUYER_NAV_ITEMS: ShopNavItem[] = [
  { href: "/shop", labelKey: "nav.shop", icon: ShoppingBag, exact: true },
  { href: "/cart", labelKey: "nav.cart", icon: ShoppingCart },
  { href: "/orders", labelKey: "nav.myOrders", icon: ClipboardList },
];

const SELLER_REQUEST_NAV_ITEM: ShopNavItem = {
  href: "/seller-request",
  labelKey: "nav.sellerRequest",
  icon: Store,
};

const SELLER_NAV_ITEMS: ShopNavItem[] = [
  { href: "/business", labelKey: "nav.business", icon: BarChart3, exact: true },
  { href: "/business/shop", labelKey: "nav.shopProfile", icon: Store },
  { href: "/business/products", labelKey: "nav.products", icon: Package },
  { href: "/business/orders", labelKey: "nav.orders", icon: ClipboardList },
];

export function ShopSidebar() {
  const t = useTranslations("ShopShell");
  const pathname = usePathname();
  const isLoggedIn = useSelector((state: RootState) => Boolean(state.auth.user));
  const shopQuery = useMyShopQuery(isLoggedIn);
  const canAccessSellerNav = isApprovedBusinessShop(shopQuery.data?.data);
  const navItems = canAccessSellerNav
    ? [...BUYER_NAV_ITEMS, ...SELLER_NAV_ITEMS]
    : [...BUYER_NAV_ITEMS, SELLER_REQUEST_NAV_ITEM];

  return (
    <aside
      className="shop-sidebar"
      aria-label={t("navLabel")}
    >
      {/* Logo */}
      <div className="shop-sidebar__logo">
        <Link href="/shop" className="shop-sidebar__logo-link" aria-label={t("brand")}>
          <Logo size="sm"/>
          <span className="shop-sidebar__logo-text">{t("brand")}</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="shop-sidebar__nav" aria-label={t("navLabel")}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={`${item.href}-${item.labelKey}`}
              href={item.href}
              className={`shop-sidebar__nav-item${isActive ? " shop-sidebar__nav-item--active" : ""}`}
            >
              <Icon size={20} className="shop-sidebar__nav-icon" />
              <span className="shop-sidebar__nav-label">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shop-sidebar__footer">
        <Link href="/" className="shop-sidebar__back-link">
          <ArrowLeft size={16} />
          <span>{t("backToTopTop")}</span>
        </Link>
      </div>
    </aside>
  );
}
