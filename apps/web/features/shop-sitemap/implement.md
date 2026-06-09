# Implementation Notes — TikTok Shop UI Remake

## 1. Summary

Remake TikTok Shop frontend pages (Homepage, Product Detail, Cart) to transition away from generic AI-looking styling and adopt the unified TopTop brand guidelines (obsidian/neon, premium hover transitions, unified gradients, responsive grids, and standard BEM-styled shell elements).

## 2. Specs used

- `.agents/tasks/tiktok-shop-ui-remake.md`
- `AGENTS.md` (universal-coding-skill)
- Stitch Project ID `17359340167999134565` (TikTok Shop Builder)

## 3. Project conventions detected

- **Architecture:** Next.js App Router workspace using feature folders (`front/apps/web/features/shop-sitemap/components/` and `front/apps/web/app/[locale]/(shop)/`).
- **Naming:** React component files in PascalCase, BEM classes for css identifiers (e.g. `shop-sidebar__nav-item`).
- **API pattern:** Custom queries/mutations from `@/hooks/shop-hooks` (`usePublicProductsQuery`, `useCategoriesTreeQuery`).
- **UI pattern:** Reusable layout elements and CSS vars in `globals.css` with dedicated brand accents (`toptop-gradient-hero`, `toptop-card-glow`, `toptop-promo-*`).
- **Validation/error pattern:** React Query loading/error states, standard i18n placeholders via `next-intl` (`useTranslations("ShopPage")`).

## 4. Files changed

- `front/apps/web/features/shop-sitemap/components/ShopHomePage.tsx` — Apply TopTop branding, responsive styling, and custom classes.
- `front/apps/web/app/[locale]/(shop)/shop/product/[productId]/page.tsx` — Product details redesign with brand styles.
- `front/apps/web/app/[locale]/(shop)/cart/page.tsx` — Cart page design refinement using TopTop accent classes.

## 5. Decisions not explicitly in the spec

- Kept IBM Plex Sans as the default font-sans instead of importing Google Fonts to prevent performance overhead and preserve the existing layout engine of the TopTop platform.
- Replaced flat Tailwind card colors with `toptop-card-glow` utility for an interactive obsidian-neon storefront feel.
- Modified quantity buttons and stepper borders to use transparent border-elevated/40 blends to give a glassmorphic aesthetic to interactive controls.

## 6. Changes required by existing code

- Ensure `useTranslations("ShopPage")` and other locale keys are not modified or broken.
- Ensure type signatures for query/mutation hooks remain identical.

## 7. Trade-offs

- Relying on hybrid utility/Tailwind styles (mix of `toptop-card-glow` and standard grid layouts) to keep the markup concise while ensuring brand identity is preserved.

## 8. Deviations from spec

- None.

## 9. Data / API / schema notes

- None (frontend-only refactor).

## 10. Testing and verification

- Completed `pnpm lint` in `front` — All ESLint rules passed successfully.
- Completed `pnpm build` in `front` — TypeScript check and production Next.js compilation succeeded for all applications (`web` and `admin`).

## 11. Known limitations and follow-up

- None.
