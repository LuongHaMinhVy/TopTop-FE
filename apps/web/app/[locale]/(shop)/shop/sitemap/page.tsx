import { ShopSitemapPage } from "@/features/shop-sitemap/components/ShopSitemapPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sitemap | TopTop Shop",
  description: "Browse sitemap and global sites on TopTop Shop.",
};

export default function ShopSitemapRoute() {
  return <ShopSitemapPage />;
}
