"use client";

const SESSION_COOKIE = "better-auth.session_token";
const LS_KEY = "castd_session_token";

/**
 * Read the Better Auth session token.
 * Better Auth sets the cookie as httpOnly (not readable by JS), so we also
 * cache it in localStorage via setSessionToken() - which is called by the
 * portal layouts whenever the session resolves.
 */
export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  // Primary: localStorage cache set by portal layouts
  try {
    const cached = localStorage.getItem(LS_KEY);
    if (cached) return cached;
  } catch (_) {}
  // Fallback: JS-readable cookie (in case Better Auth config changed)
  const match = document.cookie.match(
    /(?:^|;\s*)better-auth\.session_token=([^;]+)/
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** Cache the session token from useSession().data.session.token */
export function setSessionToken(token: string): void {
  if (typeof window === "undefined" || !token) return;
  try {
    localStorage.setItem(LS_KEY, token);
  } catch (_) {}
  // Also mirror as JS-accessible cookie for any remaining direct reads
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearSessionToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LS_KEY);
  } catch (_) {}
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
  document.cookie = `neon-auth.session_token=; path=/; max-age=0`;
}
