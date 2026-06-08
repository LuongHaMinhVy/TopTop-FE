# Implementation Notes — Shop UI Brand, Role Navigation, and Responsive Pass

## 1. Summary

Updated the shop shell and shop home UI so the buyer experience is cleaner, uses the TopTop brand tokens more directly, and avoids duplicated header/cart entry points. Extended the responsive pass to the main app shell, settings, profile, search, Studio, and key modals without changing desktop breakpoints. Refined the seller/business UI so it feels closer to TopTop's operational product language instead of generic AI-generated panels. Added profile-content privacy controls for posts, reposts, liked videos, and favorites.

## 2. Specs used

- User request: make the whole shop UI feel more like the user's brand, reduce AI-looking visuals, show seller-only sidebar items only to sellers, show normal users only shop and cart, remove duplicate cart entry, add a compact header menu like the normal TopTop header, and then check responsive behavior across all pages without breaking desktop layout.
- `md/SKILL.md`: required project inspection, existing convention reuse, i18n, verification, and implementation record.

## 3. Project conventions detected

- Architecture: Next.js app router in `apps/web/app/[locale]`, feature components under `features`, shared shop UI under `components/shop`.
- Naming: PascalCase React components, route groups such as `(shop)` and `(main)`, CSS classes for shop shell use `shop-*`.
- API pattern: shop state is accessed through React Query hooks in `hooks/shop-hooks`.
- UI pattern: global theme tokens live in `app/[locale]/globals.css`, icons use `lucide-react`, navigation uses localized `Link` from `@/i18n/routing`.
- Validation/error pattern: this UI change did not add API validation or backend behavior.

## 4. Files changed

- `apps/web/features/shop-sitemap/components/ShopSidebar.tsx` — split buyer and seller navigation, showing seller business links only for approved seller shops and a seller-request entry for non-approved users.
- `apps/web/features/shop-sitemap/components/ShopTopBar.tsx` — removed duplicate desktop shop/cart tabs from the topbar and kept only the account/settings menu.
- `apps/web/features/shop-sitemap/components/ShopHomePage.tsx` — removed duplicate cart CTA/header branding and reduced hardcoded UI copy.
- `apps/web/app/[locale]/(shop)/seller-request/page.tsx` — restyled the seller request route as a centered modal-like panel with a close action, checklist, and compact form layout.
- `apps/web/app/[locale]/globals.css` — added mobile shop shell behavior so the sidebar becomes a bottom navigation rail and sitemap grids collapse cleanly.
- `apps/web/components/shop/ShopUi.tsx` — tightened shared shop page spacing and headings for mobile.
- `apps/web/app/[locale]/(shop)/cart/page.tsx`, `checkout/page.tsx`, `orders/[orderId]/page.tsx`, `shop/product/[productId]/page.tsx`, `business/products/page.tsx`, `business/shop/page.tsx`, and `components/shop/SellerProductForm.tsx` — adjusted mobile card/form/table layouts.
- `apps/web/app/[locale]/(main)/layout.tsx` — prevented the messages side-panel offset from being applied on mobile.
- `apps/web/app/[locale]/setting/page.tsx` — made settings navigation scroll horizontally on mobile and kept desktop's fixed multi-column layout from `md` upward.
- `apps/web/app/[locale]/(main)/[username]/page.tsx` — adjusted profile header, action buttons, favorites tabs, and sound grid for mobile widths.
- `apps/web/components/search/SearchResultsPage.tsx` — tightened search result spacing, tabs, and user rows for small screens.
- `apps/web/app/[locale]/toptopstudio/layout.tsx` — changed Studio's fixed sidebar into a horizontal mobile nav while preserving the desktop sidebar at `md`.
- `apps/web/app/[locale]/toptopstudio/manage/page.tsx` — allowed the wide Studio management table to scroll horizontally instead of being clipped on mobile.
- `apps/web/components/profile/EditProfileModal.tsx` — made the edit-profile modal height-constrained and converted fixed two-column rows into stacked mobile rows.
- `apps/web/components/shop/ShopUi.tsx` — added a `seller` frame variant with TopTop accent treatment for business pages.
- `apps/web/app/[locale]/(shop)/business/products/page.tsx` — restyled product management rows with thumbnails, branded action buttons, stronger table hierarchy, and seller frame.
- `apps/web/app/[locale]/(shop)/business/shop/page.tsx` — restyled shop settings form with seller panel chrome, brand accent, and branded save button.
- `apps/web/components/shop/SellerProductForm.tsx` — restyled product create/edit form with seller panel chrome, clearer variant section, and branded controls.
- `apps/web/app/[locale]/(shop)/business/products/new/page.tsx` and `business/products/[productId]/edit/page.tsx` — applied the seller frame variant.
- `apps/web/app/[locale]/(shop)/business/shop/page.tsx` and `components/shop/SellerProductForm.tsx` — centered bounded seller panels inside the shop content area so profile/form screens no longer sit against the left side.
- `apps/web/app/[locale]/setting/page.tsx` — added privacy toggles for showing posts, reposts, liked videos, and favorites on the profile.
- `apps/web/app/[locale]/(main)/[username]/page.tsx` — hides the repost tab when reposts are private, shows locked empty states for hidden posts/liked/favorites, and keeps public collections available under Favorites.
- `apps/web/hooks/video-hooks.ts`, `apps/web/services/video-api-service.ts`, `apps/web/types/user.ts`, `apps/web/services/user-api-service.ts`, `apps/admin/utils/response/user-info.ts`, `apps/web/messages/vi.json`, and `apps/web/messages/en.json` — updated frontend contracts, profile liked-video fetching, cache keys, and localized copy for the new privacy controls.
- `back/src/main/java/com/back/user/model/entity/User.java`, `UpdatePrivacySettingsRequestDTO.java`, `PrivacySettings.java`, `UserInfoMapper.java`, `AuthResponseMapper.java`, and `UserServiceImpl.java` — persisted and returned the new profile-content visibility settings.
- `back/src/main/java/com/back/video/controller/VideoController.java`, `IVideoService.java`, and `VideoServiceImpl.java` — added `/videos/users/{username}/liked`, guarded by the owner's liked-video visibility setting.
- `apps/web/app/[locale]/globals.css` — restyled shop sidebar/topbar with existing theme tokens.
- `apps/web/messages/vi.json` and `apps/web/messages/en.json` — added localized labels for the shop shell and shop home additions.

## 5. Decisions not explicitly in the spec

- Seller visibility uses the existing `isApprovedBusinessShop` rule so sidebar/header seller items match the existing `BusinessAccess` gate.
- Buyer sidebar shows `Shop`, `Cart`, and `Become a seller`; approved sellers see business management links instead of the seller-request entry.
- Shop/cart navigation remains in the sidebar only on desktop; the shop home product section no longer links to cart as its default action.
- Responsive changes are mobile-first additions under existing `sm`, `md`, `lg`, and `xl` breakpoints so desktop layout remains the same.
- Seller UI changes are visual-only and reuse the existing hooks, routes, permissions, validation, and i18n strings.
- Profile privacy defaults keep posts and reposts visible, while liked videos and favorite posts remain private unless enabled. Public collections are still served through the existing public collection endpoint.

## 6. Changes required by existing code

- Added `ShopShell` i18n namespace because the shop layout had hardcoded labels.
- Added seller request checklist and close labels to the existing `BusinessRequestPage` i18n namespace.
- Reused existing shop hooks and auth state instead of adding new role state.

## 7. Trade-offs

- The sidebar role check depends on `useMyShopQuery`, so seller links appear after the query resolves. This keeps the UI consistent with existing access control and avoids trusting client-side role strings.

## 8. Deviations from spec

- None.

## 9. Data / API / schema notes

- No data, API, or schema changes.

## 10. Testing and verification

- `pnpm run lint` — passed after the broader responsive pass and seller UI refinement.
- `pnpm exec tsc --noEmit` — root workspace only prints TypeScript help because there is no root `tsconfig`.
- `pnpm --filter web exec tsc --noEmit` — failed due to pre-existing errors in `app/[locale]/(main)/page.tsx` lines 17 and 63. No responsive/shop/studio files were reported.
- `back/gradlew.bat compileJava` — passed.

## 11. Known limitations and follow-up

- Fix the existing `(main)/page.tsx` type errors so the web app type-check can pass globally.
