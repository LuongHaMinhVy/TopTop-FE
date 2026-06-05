import Link from "next/link";
import { SHOP_GLOBAL_SITE_LINKS } from "../data/shop-sitemap-data";
import { Globe } from "lucide-react";

export function GlobalSiteSection() {
  return (
    <section aria-labelledby="global-site-heading" className="shop-section shop-section--global">
      <h2 id="global-site-heading" className="shop-section__title">
        <Globe size={20} className="shop-section__title-icon" aria-hidden="true" />
        Global Site
      </h2>
      <ul className="shop-global-grid">
        {SHOP_GLOBAL_SITE_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="shop-global-link"
            >
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
