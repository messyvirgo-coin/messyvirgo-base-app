## Summary

Implements a mandatory profile selection gate that forces users to choose a profile (Degen, Trader, or Allocator) on first launch. The profile selection is stored locally using localStorage keyed by user FID from Base Mini App context.

## Changes

- Added profile management library (`app/lib/profile.ts`) with FID-keyed localStorage storage
- Ported profile selection UI components from example/web app:
  - `ProfileChooser` - Main profile selection component with carousel
  - `ProfileChooserModal` - Modal wrapper for onboarding flow
  - `ProfileOnboardingGate` - Gate component that forces selection on first launch
  - `MetricBar` - Component for displaying profile traits
- Added profile settings page at `/settings/profile`
- Integrated onboarding gate into root layout
- Added swipe gestures for mobile profile navigation
- Copied profile images/assets to `public/profiles/`
- Added temporary profile button on main page for testing

## User Story

As a user entering the app for the first time, I want to select a profile (Degen, Trader, or Allocator) so that the experience is personalized and I can update it later from settings.

## Acceptance Criteria

- ✅ On first launch without a stored profile, a modal forces profile selection
- ✅ The modal cannot be dismissed (no backdrop click, Esc, or close button)
- ✅ Choosing a profile saves it locally (keyed by user FID when available)
- ✅ After choosing, the modal closes and the app becomes accessible
- ✅ Users can reopen profile selection from a temporary button on the main page
- ✅ Users can change their profile on `/settings/profile`
- ✅ Swipe left/right changes profiles; swipe direction is intuitive
- ✅ On small screens, the full page scrolls instead of the modal overlay

## Technical Details

- Uses Base Mini App Context API (`useMiniKit().context.user.fid`) for user identification
- Profile storage uses localStorage with key format: `mv_profile_id_{fid}`
- Falls back to `anonymous` key if FID is not available
- Modal is locked during onboarding (non-dismissible)
- Responsive design with mobile-first approach
- SSR-safe implementation with proper client-side mounting checks

## Testing

- ✅ Linting passes (`npm run lint`)
- ✅ Build succeeds (`npm run build`)
- ✅ TypeScript compilation successful
- Manual testing recommended:
  - First-time user flow (no stored profile)
  - Profile selection and persistence
  - Profile change from settings page
  - Mobile swipe gestures
  - Responsive behavior on small screens
