function normalizeRootUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const ROOT_URL = (() => {
  const explicit = process.env.NEXT_PUBLIC_URL;
  if (explicit) return normalizeRootUrl(explicit);

  // Vercel provides this as a hostname (no protocol), e.g. "my-app.vercel.app".
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return normalizeRootUrl(vercelUrl);

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionUrl) return normalizeRootUrl(productionUrl);

  // Last resort fallback. This keeps local/CI builds from failing hard, but it
  // will produce incorrect absolute URLs for manifest assets if deployed.
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[minikit.config] Missing NEXT_PUBLIC_URL/VERCEL_URL; falling back to http://localhost:3000. Set NEXT_PUBLIC_URL to fix manifest asset URLs."
    );
  }
  return "http://localhost:3000";
})();

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  "accountAssociation": {
    "header": "eyJmaWQiOi0xLCJ0eXBlIjoiYXV0aCIsImtleSI6IjB4N0VGMzgwMGJFY2IwMDNmRGFjODUzMDI1NTM4NjY1MjA3QTZGRDcwMCJ9",
    "payload": "eyJkb21haW4iOiJtZXNzeXZpcmdvLWJhc2UtYXBwLnZlcmNlbC5hcHAifQ",
    "signature": "AAAAAAAAAAAAAAAAyhG94Fl3s2MRZwKIYr4qFzl2yhEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiSCrVbLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAul7REO_bo9AFv8iC11NYrLu4WEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASQ_-6NvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAA40z3qX8kJNJyw0F4O2a4pq5b1PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAPhSELIcxQMC9He6VmhtIBncm2etAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBKEeW8584JDsfpJp-s7C1iP7XNKQB5z9Mqaagb0ELAJ0f9ZkYRzgj_xem__U4dSNIXRfhnEA-Ew7UGyK4tSbxxBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZJJkkmSSZJJkkmSSZJJkkmSSZJJkkmSSZJJkkmSSZJI"
  },
  miniapp: {
    version: "1",
    name: "Messy Virgo",
    subtitle: "Macro and token intelligence",
    description:
      "Daily macro regime card from Messy Virgo. Fast, shareable market context. More lenses may be added later, including deeper reports and technical analysis.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/messy-icon.png`,
    splashImageUrl: `${ROOT_URL}/messy-splash.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["macro", "research", "signal", "risk", "analysis"],
    heroImageUrl: `${ROOT_URL}/messy-hero.png`,
    tagline: "Daily regime. Clear context.",
    ogTitle: "Messy Virgo",
    ogDescription: "Daily macro regime card and token intelligence.",
    ogImageUrl: `${ROOT_URL}/messy-hero.png`,
  },
} as const;

