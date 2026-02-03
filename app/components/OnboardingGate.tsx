"use client";

type Props = { children: React.ReactNode };

export function OnboardingGate({ children }: Props) {
  // The app currently defaults to the "degen" profile and should load straight
  // into the main report page without onboarding redirects.
  //
  // We keep this component as a placeholder so onboarding can be reintroduced
  // later without touching `app/layout.tsx`.
  return <>{children}</>;
}

