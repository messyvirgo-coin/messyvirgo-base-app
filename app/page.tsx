"use client";
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useQuickAuth, useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import { minikitConfig } from "../minikit.config";
import styles from "./page.module.css";
import {
  PROFILE_DEFINITIONS,
  clearStoredProfileId,
  setStoredProfileId,
  useHasStoredProfile,
  useProfileId,
  type ProfileId,
} from "@/app/lib/profile";

interface AuthResponse {
  success: boolean;
  user?: {
    fid: number; // FID is the unique identifier for the user
    issuedAt?: number;
    expiresAt?: number;
  };
  message?: string; // Error messages come as 'message' not 'error'
}

type MacroStatus = "idle" | "loading" | "success" | "error";

function isProfileId(value: string | null): value is ProfileId {
  return value === "degen" || value === "trader" || value === "allocator";
}

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [macroStatus, setMacroStatus] = useState<MacroStatus>("idle");
  const [macroError, setMacroError] = useState("");
  const [macroReport, setMacroReport] = useState<unknown | null>(null);
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  const fid = context?.user?.fid ?? null;
  const profileId = useProfileId(fid);
  const hasStoredProfile = useHasStoredProfile(fid);

  // Initialize the  miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const fetchMacroReport = useCallback(async (profile: ProfileId) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setMacroStatus("loading");
    setMacroError("");
    setMacroReport(null);

    try {
      const url = new URL("/api/macro/latest", window.location.origin);
      url.searchParams.set("profile", profile);
      const response = await fetch(url.toString(), { signal: controller.signal });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const detail =
          typeof errorBody?.error === "string"
            ? errorBody.error
            : "Unknown error";
        throw new Error(detail);
      }

      const report = await response.json();
      setMacroReport(report);
      setMacroStatus("success");
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        return;
      }
      const message =
        fetchError instanceof Error ? fetchError.message : "Unknown error";
      setMacroError(message);
      setMacroStatus("error");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!hasStoredProfile) {
      setMacroStatus("idle");
      setMacroError("");
      setMacroReport(null);
      return;
    }

    void fetchMacroReport(profileId);
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchMacroReport, hasStoredProfile, profileId]);

  // If you need to verify the user's identity, you can use the useQuickAuth hook.
  // This hook will verify the user's signature and return the user's FID. You can update
  // this to meet your needs. See the /app/api/auth/route.ts file for more details.
  // Note: If you don't need to verify the user's identity, you can get their FID and other user data
  // via `context.user.fid`.
  // const { data, isLoading, error } = useQuickAuth<{
  //   userFid: string;
  // }>("/api/auth");

  const {
    data: authData,
    isLoading: isAuthLoading,
    error: authError,
  } = useQuickAuth<AuthResponse>("/api/auth", { method: "GET" });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Check authentication first
    if (isAuthLoading) {
      setError("Please wait while we verify your identity...");
      return;
    }

    if (authError || !authData?.success) {
      setError("Please authenticate to join the waitlist");
      return;
    }

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // TODO: Save email to database/API with user FID
    console.log("Valid email submitted:", email);
    console.log("User authenticated:", authData.user);
    
    // Navigate to success page
    router.push("/success");
  };

  const handleProfileChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const selected = event.target.value;
    if (!isProfileId(selected)) {
      clearStoredProfileId(fid);
      return;
    }

    setStoredProfileId(selected, fid);
  };

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} type="button">
        ✕
      </button>
      
      <div className={styles.content}>
        <div className={styles.waitlistForm}>
          <h1 className={styles.title}>Join {minikitConfig.miniapp.name.toUpperCase()}</h1>
          
          <p className={styles.subtitle}>
             Hey {context?.user?.displayName || "there"}, Get early access and be the first to experience the future of<br />
            crypto marketing strategy.
          </p>

          <div style={{ margin: "16px 0" }}>
            <label htmlFor="macro-profile-select">Macro profile</label>
            <div>
              <select
                id="macro-profile-select"
                value={hasStoredProfile ? profileId : ""}
                onChange={handleProfileChange}
                disabled={macroStatus === "loading"}
              >
                <option value="">Select a profile</option>
                {PROFILE_DEFINITIONS.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.shortLabel}
                  </option>
                ))}
              </select>
            </div>
            {macroStatus === "idle" && (
              <p>Select a profile to load the latest macro report.</p>
            )}
            {macroStatus === "loading" && <p>Loading macro report…</p>}
            {macroStatus === "error" && (
              <p style={{ color: "var(--error, #d54c4c)" }}>
                Failed to load report: {macroError}
              </p>
            )}
            {macroStatus === "success" && (
              <>
                <p>success</p>
                <pre style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(macroReport, null, 2)}
                </pre>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="email"
              placeholder="Your amazing email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.emailInput}
            />
            
            {error && <p className={styles.error}>{error}</p>}
            
            <button type="submit" className={styles.joinButton}>
              JOIN WAITLIST
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
