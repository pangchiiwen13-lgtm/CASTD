/**
 * Next.js proxy for Neon Auth (Better Auth).
 *
 * Makes auth same-origin so session cookies are stored on localhost:3000 (dev)
 * or the production domain rather than on the Neon Auth hostname.
 *
 * Cookie strategy:
 *  - Neon Auth sets "__Secure-neon-auth.session_token" (HttpOnly, Secure, SameSite=None)
 *  - We rewrite it to "neon-auth.session_token" (no HttpOnly, no __Secure- prefix)
 *    so that: (a) it works on http://localhost and (b) JS can read it for FastAPI Bearer auth
 *  - When forwarding inbound cookies TO Neon Auth we rename back to
 *    "__Secure-neon-auth.session_token" so Neon Auth recognises the session
 */
import type { NextRequest } from "next/server";

const NEON_AUTH_BASE =
  "https://ep-red-silence-aossuqc4.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth";

// The cookie name Neon Auth uses (with __Secure- prefix requiring HTTPS + HttpOnly)
const UPSTREAM_COOKIE = "__Secure-neon-auth.session_token";
// The cookie name we expose to the browser (JS-readable, works on HTTP localhost)
const LOCAL_COOKIE = "neon-auth.session_token";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

// Headers that must not be forwarded to the upstream auth server.
// x-forwarded-* can cause the upstream to think the request is HTTP and
// trigger an HTTP→HTTPS redirect loop.
const STRIP_FROM_UPSTREAM = new Set([
  "host",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-port",
  "x-forwarded-proto",
  "x-real-ip",
]);

async function handler(req: NextRequest) {
  // Build upstream URL: strip /api/auth prefix, keep the rest + search params
  const suffix = req.nextUrl.pathname.replace(/^\/api\/auth/, "") || "/";
  const upstream = `${NEON_AUTH_BASE}${suffix}${req.nextUrl.search}`;

  // ------------------------------------------------------------------
  // Forward headers, excluding hop-by-hop and x-forwarded-*
  // Also rename our local cookie name back to the upstream name.
  // ------------------------------------------------------------------
  const forwardHeaders = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (STRIP_FROM_UPSTREAM.has(lower) || HOP_BY_HOP.has(lower)) return;

    if (lower === "cookie") {
      // Rename LOCAL_COOKIE → UPSTREAM_COOKIE so Neon Auth recognises the session
      const rewrittenCookie = value
        .split(";")
        .map((part) => {
          const trimmed = part.trim();
          if (trimmed.startsWith(LOCAL_COOKIE + "=")) {
            return trimmed.replace(LOCAL_COOKIE + "=", UPSTREAM_COOKIE + "=");
          }
          return trimmed;
        })
        .join("; ");
      forwardHeaders.set("cookie", rewrittenCookie);
    } else {
      forwardHeaders.set(key, value);
    }
  });

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const upstream_res = await fetch(upstream, {
    method: req.method,
    headers: forwardHeaders,
    body,
    redirect: "manual", // pass redirects back to the client unchanged
  });

  // Build response headers, stripping hop-by-hop
  const resHeaders = new Headers();
  upstream_res.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!HOP_BY_HOP.has(lower) && lower !== "set-cookie") {
      resHeaders.set(key, value);
    }
  });

  // ------------------------------------------------------------------
  // Rewrite Set-Cookie headers from upstream:
  //   - Rename __Secure-neon-auth.session_token → neon-auth.session_token
  //   - Strip HttpOnly   (so JS can read the token for FastAPI Bearer auth)
  //   - Strip Secure     (so the cookie works on http://localhost in dev)
  //   - Strip __Secure-  prefix  (browser rejects __Secure- cookies without Secure)
  //   - Downgrade SameSite=None → SameSite=Lax  (same-origin, stricter)
  //   - Strip Domain     (cookie must land on THIS origin)
  //   - Strip Partitioned (not needed on same-origin)
  // ------------------------------------------------------------------
  const rawSetCookies: string[] = [];
  try {
    // @ts-ignore — getSetCookie() available in undici / Node 18+
    rawSetCookies.push(...upstream_res.headers.getSetCookie());
  } catch {
    const single = upstream_res.headers.get("set-cookie");
    if (single) rawSetCookies.push(single);
  }

  for (const cookie of rawSetCookies) {
    const rewritten = cookie
      .replace(UPSTREAM_COOKIE, LOCAL_COOKIE) // rename
      .replace(/;\s*domain=[^;]*/gi, "")       // strip Domain
      .replace(/;\s*httponly/gi, "")            // strip HttpOnly
      .replace(/;\s*secure(?=[;,\s]|$)/gi, "") // strip Secure
      .replace(/;\s*partitioned/gi, "")         // strip Partitioned
      .replace(/samesite=none/gi, "SameSite=Lax");
    resHeaders.append("set-cookie", rewritten);
  }

  return new Response(upstream_res.body, {
    status: upstream_res.status,
    headers: resHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
