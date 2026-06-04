"use client";
import { createAuthClient } from "better-auth/react";

/**
 * Auth client points to our Next.js proxy (/api/auth/*) which forwards
 * requests to the Neon Auth server. Same-origin proxy avoids cross-origin
 * cookie issues and keeps session cookies on the app domain.
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? `${window.location.origin}/api/auth`
    : "http://localhost:3000/api/auth",
});

export const { signIn, signUp, signOut, useSession } = authClient;
