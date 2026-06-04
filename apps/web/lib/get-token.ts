"use client";

/**
 * Neon Auth sets "__Secure-neon-auth.session_token" (HttpOnly, Secure, SameSite=None).
 * Our Next.js proxy rewrites this to LOCAL_COOKIE so it is:
 *  - JS-readable via document.cookie
 *  - Works on http://localhost (no Secure requirement)
 */
const LOCAL_COOKIE = "neon-auth.session_token";

/**
 * Read the Neon Auth session token from document.cookie.
 * The proxy renames the upstream cookie from "__Secure-neon-auth.session_token"
 * to "neon-auth.session_token" so JS can access it.
 */
export function getSessionToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    /(?:^|;\s*)neon-auth\.session_token=([^;]+)/
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Manually set the session token cookie. Used as a fallback when the
 * Set-Cookie header from the proxy doesn't fire (e.g. in some SPA navigations).
 */
export function setSessionToken(token: string): void {
  if (typeof document === "undefined" || !token) return;
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `${LOCAL_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Clear the session token cookie (used on sign-out).
 */
export function clearSessionToken(): void {
  if (typeof document === "undefined") return;
  // Clear both the old and new cookie names to avoid stale state
  document.cookie = `${LOCAL_COOKIE}=; path=/; max-age=0`;
  document.cookie = `better-auth.session_token=; path=/; max-age=0`;
}
