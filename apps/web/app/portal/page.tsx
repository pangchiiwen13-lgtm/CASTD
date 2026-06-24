"use client";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";

/**
 * Smart role router. After login/signup, users land here.
 *
 * Reads northstar_portal_intent from localStorage (set by login/signup page
 * before the Google OAuth redirect) to decide which portal to enter.
 *
 * Intent "brand"     -> /onboarding?role=brand (new) or /dashboard (existing)
 * Intent "superstar" -> /onboarding/superstar (new) or /superstar/dashboard (existing)
 * No intent          -> falls back to whichever profile exists (old behaviour)
 *
 * The same Google account can have both a brand AND a superstar profile.
 * The intent decides which portal the user enters on THIS login.
 */
export default function PortalPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    if (!session) { router.push("/login"); return; }

    const token = (session as any)?.session?.token || getSessionToken();
    if (!token) { router.push("/login"); return; }

    // Read which portal the user intended to enter
    const intent = typeof window !== "undefined"
      ? (localStorage.getItem("northstar_portal_intent") as "brand" | "superstar" | null)
      : null;

    api.checkRegistration(token)
      .then((result) => {
        // Clear intent after reading so it doesn't interfere with future logins
        if (typeof window !== "undefined") {
          localStorage.removeItem("northstar_portal_intent");
        }

        if (intent === "brand") {
          // User wants the brand portal
          router.replace(result.has_brand ? "/dashboard" : "/onboarding?role=brand");
        } else if (intent === "superstar") {
          // User wants the superstar portal
          router.replace(result.has_superstar ? "/superstar/dashboard" : "/onboarding/superstar");
        } else {
          // No intent stored - fall back to whichever profile exists
          if (result.has_superstar && result.has_brand) {
            // Both profiles - default to brand portal; user can switch from there
            router.replace("/dashboard");
          } else if (result.has_superstar) {
            router.replace("/superstar/dashboard");
          } else if (result.has_brand) {
            router.replace("/dashboard");
          } else {
            // No profile at all - show role selection
            router.replace("/onboarding");
          }
        }
      })
      .catch(() => {
        router.replace("/onboarding");
      });
  }, [session, isPending, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-xl font-bold mb-2">Northstar</div>
        <p className="text-muted-foreground text-sm">Loading your account...</p>
      </div>
    </div>
  );
}
