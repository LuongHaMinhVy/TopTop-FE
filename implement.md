# Implementation Notes — Authentication Standardization & Validation

## 1. Summary

Standardized and localized authentication registration and login validation across the application's standalone pages (`login/page.tsx`, `signup/page.tsx`) and modal (`AuthModal.tsx`). Implemented field-specific error states that render a red border and display validation error messages directly underneath each input instead of generic alert banners or native browser `required` tooltips.

## 2. Specs Used

- User request: "phần validate của login signup modal với page làm chuẩn lại cho tôi" (standardize login/signup/modal validation).
- User request: "bỏ cái required của input đi thay bằng validate kiểu vòng input đỏ lên với thông báo hiện dưới input" (remove required validation and use field-specific red outlines with error text under the input).
- Goals:
  1. Centralize and sync username, email, password, and Date of Birth validation constraints between `login/page.tsx`, `signup/page.tsx`, and `AuthModal.tsx`.
  2. Map validation errors to specific fields (`errors` object state) and pass them as the `error` prop to custom `<Input>` components.
  3. Remove standard `required` attributes to allow submit actions to trigger validation.
  4. Ensure localized translation keys are consistently used for all validation errors.

## 3. Project Conventions Detected

- **Input Component**: The `@repo/ui` `<Input>` component supports an `error` prop which adds `border-red-500` and displays the error message underneath.
- **Internationalization**: Uses `next-intl` (`useTranslations`) hook for translating form labels, placeholders, and error messages.

## 4. Files Changed

- `front/apps/web/app/[locale]/login/page.tsx`
  - Replaced the submission block to perform manual frontend validation.
  - Standardized error strings to use `t("errUsernameLength")`, `t("errUsernamePattern")`, `t("errEmailPattern")`, etc.
  - Used field-specific `errors` state to bind error messages directly to input error props.
- `front/apps/web/app/[locale]/signup/page.tsx`
  - Fully refactored validation logic (`validateForm`) to output an errors object mapping to `username`, `email`, `password`, and `dob`.
  - Removed HTML5 `required` attribute.
  - Standardized Date of Birth validation (minimum 13 years old, leap year handling, and future dates).
- `front/apps/web/components/auth/AuthModal.tsx`
  - Synced both regular login/signup inputs and OAuth onboarding fields to use field-specific `errors` state.
  - Standardized inputs to dynamically switch label/placeholder and type dynamically (type="text" for username/email login vs type="email" for email signup).
- `front/apps/web/messages/vi.json` & `en.json`
  - Maintained localized messages for validation error keys.

## 5. Testing and Verification

- The forms compile perfectly.
- Dynamic input changes clear the corresponding field's error outline immediately.
