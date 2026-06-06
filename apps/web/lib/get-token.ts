"use client";

const SESSION_COOKIE = "better-auth.session_token";

/** Read the Better Auth session token from document.cookie. */
export function getSessionToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    /(?:^|;\s*)better-auth\.session_token=([^;]+)/
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setSessionToken(token: string): void {
  if (typeof document === "undefined" || !token) return;
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearSessionToken(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
  // Also clear old Neon Auth cookie if present
  document.cookie = `neon-auth.session_token=; path=/; max-age=0`;
}
