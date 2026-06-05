import { Link } from "@/i18n/routing";
import { SHOP_WEBSITE_STRUCTURE_LINKS } from "../data/shop-sitemap-data";

export function WebsiteStructureSection() {
  return (
    <section aria-labelledby="website-structure-heading" className="shop-section">
      <h2 id="website-structure-heading" className="shop-section__title">
        Website Structure
      </h2>
      <ul className="shop-section__link-list">
        {SHOP_WEBSITE_STRUCTURE_LINKS.map((link) => (
          <li key={link.href + link.title}>
            <Link href={link.href} className="shop-section__link">
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
