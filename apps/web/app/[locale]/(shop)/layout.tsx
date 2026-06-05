import type { ReactNode } from "react";
import { ShopSidebar } from "@/features/shop-sitemap/components/ShopSidebar";
import { ShopTopBar } from "@/features/shop-sitemap/components/ShopTopBar";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shop-shell">
      <ShopSidebar />
      <div className="shop-shell__main">
        <ShopTopBar />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
