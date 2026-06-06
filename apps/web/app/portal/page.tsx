"use client";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";

/**
 * Smart role router. After login/signup, users land here.
 * Checks what type of account they have and redirects accordingly.
 *   Brand  → /catalog
 *   Superstar → /superstar/dashboard
 *   Neither → /onboarding (role selection)
 */
export default function PortalPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    if (!session) { router.push("/login"); return; }

    // Prefer session.session.token - portal has no layout to sync localStorage
    const token = (session as any)?.session?.token || getSessionToken();
    if (!token) { router.push("/login"); return; }

    api.checkRegistration(token)
      .then((result) => {
        if (result.has_superstar) {
          router.replace("/superstar/dashboard");
        } else if (result.has_brand) {
          router.replace("/catalog");
        } else {
          router.replace("/onboarding");
        }
      })
      .catch(() => {
        // API down or no profile - send to onboarding
        router.replace("/onboarding");
      });
  }, [session, isPending, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-xl font-bold mb-2">CASTD</div>
        <p className="text-muted-foreground text-sm">Loading your account…</p>
      </div>
    </div>
  );
}
