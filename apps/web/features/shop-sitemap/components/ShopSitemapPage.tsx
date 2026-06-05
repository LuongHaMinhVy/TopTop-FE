import { SitemapSection } from "./SitemapSection";
import { WebsiteStructureSection } from "./WebsiteStructureSection";
import { GlobalSiteSection } from "./GlobalSiteSection";

export function ShopSitemapPage() {
  return (
    <main className="shop-shell__content custom-scrollbar">
      <div className="shop-shell__content-inner">
        <SitemapSection />
        <div className="shop-shell__divider" aria-hidden="true" />
        <div className="shop-shell__row">
          <WebsiteStructureSection />
          <GlobalSiteSection />
        </div>
      </div>
    </main>
  );
}
