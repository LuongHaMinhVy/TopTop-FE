"use client";

import { ArrowLeft, BarChart3, ClipboardList, Package, Plus, ShoppingBag, Store } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { Logo } from "@/components/layout/LayoutHelpers";

const NAV_ITEMS = [
  { href: "/business", label: "Business", icon: BarChart3, exact: true },
  { href: "/business/shop", label: "Shop", icon: Store },
  { href: "/business/products", label: "Sản phẩm", icon: Package },
  { href: "/business/orders", label: "Đơn hàng", icon: ClipboardList },
  { href: "/shop", label: "Mua sắm", icon: ShoppingBag, exact: true },
  { href: "/shop/sitemap", label: "Thêm", icon: Plus },
];

export function ShopSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="shop-sidebar"
      aria-label="Shop navigation"
    >
      {/* Logo */}
      <div className="shop-sidebar__logo">
        <Link href="/business" className="shop-sidebar__logo-link" aria-label="TopTop Business">
          <Logo size="sm"/>
          <span className="shop-sidebar__logo-text">TopTop Business</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="shop-sidebar__nav" aria-label="Shop sections">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={`shop-sidebar__nav-item${isActive ? " shop-sidebar__nav-item--active" : ""}`}
            >
              <Icon size={20} className="shop-sidebar__nav-icon" />
              <span className="shop-sidebar__nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shop-sidebar__footer">
        <Link href="/" className="shop-sidebar__back-link">
          <ArrowLeft size={16} />
          <span>Quay lại tiktok</span>
        </Link>
      </div>
    </aside>
  );
}
