-- Migration 004: Better Auth tables (self-hosted auth replacing Neon Auth proxy)
-- Run via Neon console SQL editor

CREATE TABLE IF NOT EXISTS "user" (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  email             TEXT UNIQUE NOT NULL,
  "emailVerified"   BOOLEAN NOT NULL DEFAULT FALSE,
  image             TEXT,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session (
  id            TEXT PRIMARY KEY,
  "expiresAt"   TIMESTAMP NOT NULL,
  token         TEXT UNIQUE NOT NULL,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "userId"      TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
  id                          TEXT PRIMARY KEY,
  "accountId"                 TEXT NOT NULL,
  "providerId"                TEXT NOT NULL,
  "userId"                    TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken"               TEXT,
  "refreshToken"              TEXT,
  "idToken"                   TEXT,
  "accessTokenExpiresAt"      TIMESTAMP,
  "refreshTokenExpiresAt"     TIMESTAMP,
  scope                       TEXT,
  password                    TEXT,
  "createdAt"                 TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"                 TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification (
  id            TEXT PRIMARY KEY,
  identifier    TEXT NOT NULL,
  value         TEXT NOT NULL,
  "expiresAt"   TIMESTAMP NOT NULL,
  "createdAt"   TIMESTAMP,
  "updatedAt"   TIMESTAMP
);

CREATE INDEX IF NOT EXISTS session_token_idx   ON session (token);
CREATE INDEX IF NOT EXISTS session_user_idx    ON session ("userId");
CREATE INDEX IF NOT EXISTS account_user_idx    ON account ("userId");
