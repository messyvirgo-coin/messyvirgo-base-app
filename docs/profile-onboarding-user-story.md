# User Story: Two-step Onboarding (Legal + Profile)

## User Story
As a user entering the app for the first time, I want to understand what the
app does, accept the Privacy Policy and Terms of Service, and then select a
profile (Degen, Trader, or Allocator) so the experience is personalized and I
can update it later from settings.

## Acceptance Criteria
- On first launch, the user is gated into a 2-step onboarding flow:
  - Step 1 (`/onboarding`): welcome/explanation + must accept Privacy Policy and Terms of Service.
  - Step 2 (`/onboarding/profile`): must choose a profile.
- Until Step 1 and Step 2 are complete, the rest of the app redirects to onboarding.
- Privacy Policy (`/privacy`) and Terms (`/terms`) remain accessible during onboarding.
- Legal acceptance is stored locally (client-side only), keyed by wallet address when available (with anonymous fallback/migration).
- Profile selection is stored locally (client-side only), keyed by wallet address when available (with anonymous fallback/migration).
- After choosing a profile, onboarding completes and the app becomes accessible.
- Users can change their profile later on `/settings/profile`.
- Swipe left/right changes profiles; swipe direction is intuitive.
