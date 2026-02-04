function normalizeRootUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) {
    throw new Error(
      "[minikit.config] NEXT_PUBLIC_URL is set but empty/whitespace. Set it to your canonical production URL (e.g. https://messyvirgo-base-macros.vercel.app)."
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
      `[minikit.config] Invalid URL value "${raw}". Set NEXT_PUBLIC_URL to a valid absolute URL (e.g. https://messyvirgo-base-macros.vercel.app).`
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

// Account association will be generated after initial deployment
// Set this to null initially, then update with real values from base.dev/preview after deployment
// Uncomment and fill in after generating account association from base.dev/preview:
const ACCOUNT_ASSOCIATION: {
  "header": "eyJmaWQiOjI2NTc3OTQsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhEMTY0NTFDMjgyQkExNzZiZDg3ZmEyMzkzNTMwNDFDQTdmQTgyODRmIn0",
  "payload": "eyJkb21haW4iOiJtZXNzeXZpcmdvLWJhc2UtbWFjcm9zLnZlcmNlbC5hcHAifQ",
  "signature": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEGpAkMRLYQN-hD24BBxzA69rIy-fdTayn7n93zOu1wHXDKiU7m4c8FissHViyNCJkG_ha9pXiGy1Mw9pIkoEUVQHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
} | null = null;

// After deployment, replace the null above with your generated values:
// const ACCOUNT_ASSOCIATION = {
//   header: "your-generated-header-here",
//   payload: "your-generated-payload-here",
//   signature: "your-generated-signature-here",
// } as const;

const ACCOUNT_ASSOCIATION_DOMAIN = ACCOUNT_ASSOCIATION
  ? getAccountAssociationDomain((ACCOUNT_ASSOCIATION as { payload: string }).payload)
  : null;

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

    // Only hard-fail on actual production deploy builds (e.g. Vercel Production).
    // Local `next build` and Preview builds should warn so contributors aren't blocked.
    const isVercelProductionBuild =
      process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";

    if (isVercelProductionBuild) {
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
  // accountAssociation is optional - can be added after initial deployment
  ...(ACCOUNT_ASSOCIATION ? { accountAssociation: ACCOUNT_ASSOCIATION } : {}),
  miniapp: {
    version: "1",
    name: "Market Vibe Daily",
    subtitle: "by Messy Virgo / MESSY",
    description: 
      "Daily crypto market intel. Get todays regime and risk context, plus what traders typically do, summarized in 2 minutes. Full report included. No advice, education only.",
    screenshotUrls: [`${ROOT_URL}/screenshot-1.png`, `${ROOT_URL}/screenshot-2.png`, `${ROOT_URL}/screenshot-3.png`],
    iconUrl: `${ROOT_URL}/messy-icon.png`,
    splashImageUrl: `${ROOT_URL}/messy-splash.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: [
      "vibe",
      "intel",
      "signals",
      "daily",
      "regime"
    ],
    heroImageUrl: `${ROOT_URL}/messy-hero.png`,
    tagline: "Know the vibe. Trade smarter.",
    ogTitle: "Market Vibe Daily",
    ogDescription: 
      "Daily crypto market intel. Check the vibe, see the risk, and get the 2-minute summary.",
    ogImageUrl: `${ROOT_URL}/messy-hero.png`,
  },
} as const;

