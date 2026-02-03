function normalizeRootUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) {
    throw new Error(
      "[minikit.config] NEXT_PUBLIC_URL is set but empty/whitespace. Set it to your canonical production URL (e.g. https://messyvirgo-base-app.vercel.app)."
    );
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  // Ensure it's a valid absolute origin (no path/query) and normalize.
  try {
    return new URL(withProtocol).origin;
  } catch {
    throw new Error(
      `[minikit.config] Invalid URL value "${raw}". Set NEXT_PUBLIC_URL to a valid absolute URL (e.g. https://messyvirgo-base-app.vercel.app).`
    );
  }
}

function decodeBase64UrlToString(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function getAccountAssociationDomain(payload: string): string | null {
  try {
    const decoded = decodeBase64UrlToString(payload);
    const json = JSON.parse(decoded) as { domain?: unknown };
    return typeof json.domain === "string" && json.domain.trim()
      ? json.domain.trim()
      : null;
  } catch {
    return null;
  }
}

const ACCOUNT_ASSOCIATION = {
  header:
    "eyJmaWQiOi0xLCJ0eXBlIjoiYXV0aCIsImtleSI6IjB4N0VGMzgwMGJFY2IwMDNmRGFjODUzMDI1NTM4NjY1MjA3QTZGRDcwMCJ9",
  payload: "eyJkb21haW4iOiJtZXNzeXZpcmdvLWJhc2UtYXBwLnZlcmNlbC5hcHAifQ",
  signature:
    "AAAAAAAAAAAAAAAAyhG94Fl3s2MRZwKIYr4qFzl2yhEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiSCrVbLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAul7REO_bo9AFv8iC11NYrLu4WEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASQ_-6NvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAA40z3qX8kJNJyw0F4O2a4pq5b1PAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAPhSELIcxQMC9He6VmhtIBncm2etAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBKEeW8584JDsfpJp-s7C1iP7XNKQB5z9Mqaagb0ELAJ0f9ZkYRzgj_xem__U4dSNIXRfhnEA-Ew7UGyK4tSbxxBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZJJkkmSSZJJkkmSSZJJkkmSSZJJkkmSSZJJkkmSSZJI",
} as const;

const ACCOUNT_ASSOCIATION_DOMAIN = getAccountAssociationDomain(
  ACCOUNT_ASSOCIATION.payload
);

const ROOT_URL = (() => {
  // Best practice: always set NEXT_PUBLIC_URL to your canonical production URL
  // in BOTH Vercel Production and Preview environments (so manifests remain
  // domain-consistent with accountAssociation).
  const explicit = process.env.NEXT_PUBLIC_URL;
  if (explicit?.trim()) return normalizeRootUrl(explicit);

  // Fallback: production URL provided by Vercel (hostname, no protocol).
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionUrl?.trim()) return normalizeRootUrl(productionUrl);

  // If we have a domain embedded in the signed accountAssociation, prefer it.
  // This keeps builds deterministic even before the app is deployed/published.
  if (ACCOUNT_ASSOCIATION_DOMAIN) {
    return `https://${ACCOUNT_ASSOCIATION_DOMAIN}`;
  }

  // Final fallback: local dev origin (even in production build contexts).
  // Recommended: set NEXT_PUBLIC_URL in real deployments.
  return "http://localhost:3000";
})();

// Guardrail: accountAssociation is domain-bound. If the manifest's origin doesn't
// match the signed domain, Base preview readiness checks will fail.
if (ACCOUNT_ASSOCIATION_DOMAIN) {
  const rootHost = new URL(ROOT_URL).hostname;
  if (rootHost !== ACCOUNT_ASSOCIATION_DOMAIN) {
    const message = `[minikit.config] Domain mismatch: ROOT_URL host is "${rootHost}" but accountAssociation payload domain is "${ACCOUNT_ASSOCIATION_DOMAIN}". Set NEXT_PUBLIC_URL to "https://${ACCOUNT_ASSOCIATION_DOMAIN}" or regenerate accountAssociation for the new domain.`;

    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    } else {
      console.warn(message);
    }
  }
} else if (process.env.NODE_ENV !== "production") {
  console.warn(
    "[minikit.config] Could not parse accountAssociation.payload to validate domain consistency."
  );
}

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: ACCOUNT_ASSOCIATION,
  miniapp: {
    version: "1",
    // Short display name (used in manifests / small UI surfaces)
    name: "Crypto Macro Economics Daily",
    subtitle: "by Messy Virgo / MESSY",
    description:
      "Daily updated dashboard with detailed report for crypto enthusiasts. Includes general trading scenarios. Educational content, not financial advice.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/messy-icon.png`,
    splashImageUrl: `${ROOT_URL}/messy-splash.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: [
      "macro",
      "liquidity",
      "indicators",
      "economics",
      "report"
    ],
    heroImageUrl: `${ROOT_URL}/messy-hero.png`,
    tagline: "The Future is MESSY.",
    // Long-form title/description for rich previews
    ogTitle: "Crypto Macro Economics Daily",
    ogDescription:
      "Daily updated macro dashboard with detailed report for crypto enthusiasts.",  
    ogImageUrl: `${ROOT_URL}/messy-hero.png`,
  },
} as const;

