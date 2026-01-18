# User Story: Profile Onboarding Gate

## User Story
As a user entering the app for the first time, I want to select a profile
(Degen, Trader, or Allocator) so that the experience is personalized and I
can update it later from settings.

## Acceptance Criteria
- On first launch without a stored profile, a modal forces profile selection.
- The modal cannot be dismissed (no backdrop click, Esc, or close button).
- Choosing a profile saves it locally (keyed by user FID when available).
- After choosing, the modal closes and the app becomes accessible.
- Users can reopen profile selection from a temporary button on the main page.
- Users can change their profile on `/settings/profile`.
- Swipe left/right changes profiles; swipe direction is intuitive.
- On small screens, the full page scrolls instead of the modal overlay.
