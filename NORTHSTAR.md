# Northstar Collective — Product Documentation

**Version 1.3 — June 2026**
**Status: Active development**

---

## What is Northstar Collective?

Northstar Collective is a B2B talent casting marketplace for beauty and lifestyle brands in Singapore.

Brands and agencies discover, evaluate, and book **Superstars** (on-screen video talent) for their campaigns. Superstars can also browse live brand campaigns and apply for ones they want to be part of.

> The platform manages the full lifecycle — from discovery to payment — so neither side has to chase the other. The Grab analogy: the brand knows where they want to go, the Superstar knows where to pick up. Northstar Collective handles everything in between.

**Target market:** Beauty/lifestyle brands, marketing agencies, and corporates in Singapore.
**Talent niche at launch:** On-screen video talent (UGC, product demos, brand videos, social content).
**Goal:** 10 paying brands in 3 months.

---

## Complete End-to-End Workflow

```
[DISCOVERY]
Brand creates campaign brief  ←→  Superstar browses open campaigns
Brand browses Superstar catalog    Superstar applies to campaigns
Brand shortlists + submits inquiry
        ↓
[MATCHING — Admin in the loop]
Admin reviews inquiry
Admin moves status: Open → Reviewing
        ↓
[CONFIRMATION — 72-hour window]
Admin moves status: Reviewing → Confirmed
Brand gets notified: "You've been matched with [Superstar name]"
Superstar gets notified: "You've been selected for [Campaign name]"
CLOCK STARTS — brand has 72 hours to formally commit
        ↓
If brand does not commit in 72h → match expires → Superstar freed → brand notified
        ↓
[FORMAL COMMITMENT]
Brand confirms commitment on platform
Brand specifies remuneration type: Cash / Product+Service / Hybrid
  - Cash: Brand deposits amount into escrow on Northstar Collective (via Stripe)
  - Product/Service: Brand declares what will be sent/provided (logged on platform)
  - Hybrid: Partial deposit + product declaration
Brand pays Northstar Collective contact fee (SGD 80–120) OR subscription covers it
Superstar's contact details revealed to brand
        ↓
[OPTIONAL SCREENING CALL]
Either side can request a screening call via platform
Platform generates a scheduling link (Google Meet / Calendly)
Call is optional — neither side is obligated
Call log recorded on platform (date/time, who initiated)
        ↓
[PRODUCTION]
Campaign is live — both sides working
Platform shows campaign status: In Production
Superstar submits deliverables via platform (upload link or direct file)
        ↓
[REVIEW & REVISION]
Brand reviews submitted deliverables on platform
Brand: Approve OR Request Revision (max 2 revision rounds by default)
If revision requested → Superstar notified → resubmits
        ↓
[COMPLETION]
Brand approves final deliverables
  - Cash remuneration: Escrow released → Superstar paid (via bank transfer or Stripe)
  - Product/Service: Platform logs "sent" confirmation from brand
Campaign marked Complete
Both sides prompted to rate each other (1–5 stars + comment)
Completed campaign added to Superstar's portfolio automatically
Brand can re-book the same Superstar in one click
```

---

## Remuneration Types

Superstars can be compensated in three ways. This is agreed upon at the commitment stage and logged on the platform.

| Type | How it works on Northstar Collective |
|------|-----------------------|
| **Cash** | Brand deposits full fee into Northstar Collective escrow via Stripe. Released to Superstar after brand approves deliverables. Northstar Collective takes platform fee from escrow before release. |
| **Product / Service exchange** | Brand declares what product or service will be provided (product name, estimated value, delivery method). Superstar confirms receipt on platform after receiving. No cash escrow. |
| **Hybrid** | Partial cash (escrowed) + product/service declaration. Most common for beauty campaigns — e.g., SGD 300 + full product set. |

**Why escrow matters:** Neither side has to trust the other on payment. Brand knows the money is safe until work is approved. Superstar knows the money is locked in and will be released upon approval. This is the single biggest reason to stay on Northstar Collective instead of transacting directly.

---

## The 72-Hour Commit Window

Once a match is confirmed by admin:

1. Both sides get an email + in-app notification
2. A 72-hour countdown appears on the campaign card for both sides
3. Automated reminders:
   - 48h remaining → email reminder to brand
   - 24h remaining → email reminder to brand (urgent)
   - 2h remaining → final reminder
4. If brand commits → campaign moves to "In Production"
5. If window expires without brand commitment → match expires
   - Superstar is freed (back to available)
   - Brand notified: "Your match has expired. You can re-submit an inquiry."
   - Admin notified for follow-up

This creates urgency. It also protects Superstars from being held in limbo indefinitely.

---

## Optional Screening Call

After commitment is made (not before — this protects against brands using Northstar Collective just to get contact info):

- Either the Brand or Superstar can initiate a screening call request on the platform
- Platform sends both sides a scheduling link (Google Meet)
- The call is **not compulsory** — it's an option, not a step
- If a call is scheduled, the platform logs: date, time, who initiated
- Neither side can be penalized for declining a call

**Why it's optional:** Some campaigns don't need it (simple UGC, known talent). For bigger or more complex campaigns, a 10-minute call builds confidence. The platform facilitates it without making it a blocker.

---

## Platform Stickiness — Why Stay on Northstar Collective?

The risk: once a brand and Superstar meet, they may go direct for future work, cutting out Northstar Collective. These features make staying on Northstar Collective more valuable than going around it.

### For Superstars
| Feature | Value |
|---------|-------|
| **Payment protection** | Northstar Collective holds escrow. Superstar is guaranteed payment upon approval. No more chasing brands for money. |
| **Dispute protection** | If a brand ghosts after work is submitted, Northstar Collective mediates and releases payment. Going direct = no protection. |
| **Portfolio auto-build** | Every completed campaign on Northstar Collective is added to their public profile automatically. Credibility compounds. |
| **Star rating & reviews** | Completed work builds a verified reputation. Future brands see "14 campaigns, 4.9★". Off-platform work doesn't count. |
| **Discovery by new brands** | Being on Northstar Collective means new brands can find them. Going direct means only working with people they already know. |

### For Brands
| Feature | Value |
|---------|-------|
| **Escrow = no bad surprises** | Money held until work is approved. No risk of paying and getting nothing. |
| **Deliverable management** | All submissions, revisions, and approvals in one place. No messy email chains. |
| **Contract on record** | Platform logs the campaign brief, remuneration terms, and both parties' commitments. |
| **Re-booking in one click** | Brand can re-book the same Superstar instantly — no need to re-negotiate from scratch. |
| **Invoice + receipt** | Northstar Collective issues a proper invoice for every booking. Useful for company expense claims. |
| **New talent discovery** | The catalog grows. Brands who go direct can only work with one person. Staying on Northstar Collective means access to the full roster. |

### Platform fee structure (why it still makes sense)
Northstar Collective takes a small platform fee from the escrow release (suggested: 10–15% of cash value, capped). This is worth it for the escrow protection, deliverable management, and dispute resolution. Going direct saves the fee but loses all of the above.

---

## Three Portals

Northstar Collective has three distinct interfaces sharing one database.

---

### 1. Superstar Portal

Superstars register, build their profile, discover campaigns, and manage their bookings.

**Authentication:** Email + password or Google OAuth

**Onboarding flow:**
1. Sign up
2. Fill in profile: name, age, gender, languages, content types, vibe tags, social handles + follower counts, bio, rate card, remuneration preferences
3. Upload portfolio photos (minimum 3) and intro video (optional)
4. Profile goes into **pending review** — admin reviews before it goes live
5. Admin approves → profile published → Superstar gets email notification

**Superstar dashboard:**
- Profile completeness score (encourages full profiles)
- Status badge: Draft / Under Review / Active / Paused
- Active campaigns: what's in production right now
- Pending deliverable reviews (action needed)
- Upcoming deadlines
- Earnings summary / product exchange log

**Superstar profile (self-edit):**
- Personal: name, age, gender, date of birth
- Social: Instagram handle + followers, TikTok handle + followers, YouTube (optional)
- Content: content types, vibe tags, languages
- Preferences: preferred remuneration type (Cash / Product / Both), minimum rate (private — only shown to matched brands), preferred campaign types
- Bio and experience summary
- Portfolio photos (upload/reorder)
- Intro video URL (YouTube / Google Drive)
- Email (for notifications)

**Campaigns feed (bidirectional discovery):**
- Browse open brand campaigns accepting applications
- Filter: content type, remuneration type (cash / product), budget range, campaign dates
- Each card: brand category (anonymized), content type, remuneration type, brief summary, deadline to apply
- "Apply" → submit a short note ("Why I'm a good fit for this campaign")
- Applied campaigns show status: Submitted / Shortlisted / Matched / Not Selected

**My Bookings:**
- All campaigns across all statuses
- Per booking: campaign name, brand (revealed post-commitment), status, timeline, remuneration details
- Active: submit deliverables, view revision feedback
- Completed: view approved deliverables, rating received

**Deliverable submission:**
- Upload files (photos, videos) or paste external link (Google Drive, WeTransfer)
- Add a note to the brand
- Submit → brand notified to review

**Notifications:**
- In-app bell (polls every 30s)
- Email via Resend: application status, match confirmed, 72h commit reminder (for brand — Superstar sees status update), revision requested, payment released

---

### 2. Brand Portal

Brands discover Superstars, run campaigns, manage bookings, and release payments.

**Authentication:** Email + password or Google OAuth

**Onboarding flow:**
1. Sign up
2. Fill brand profile: company name, industry, brand values, aesthetic tags, target audience, campaign types
3. Redirected to catalog

**Brand dashboard:**
- Active campaigns
- Pending actions (commit within 72h, review deliverables, pending revision approvals)
- Shortlist
- Spend summary

**Catalog (`/catalog`):**
- All published Superstar profiles
- Filters: content type, language, gender, age range, vibe tags, platform, remuneration type accepted
- AI fit score badge (personalized to this brand)
- Sort: Best Match, Newest, Most Followers
- Click → Superstar profile

**Superstar profile (brand view):**
- Portfolio photos, intro video, bio, stats
- Preferred remuneration types (Cash / Product / Both)
- AI fit score + rationale
- Completed campaign count + star rating (visible for credibility)
- "Save to shortlist" / "Submit inquiry" buttons

**Campaigns (`/campaigns`):**
- Create a campaign brief: title, content type, deliverables required, remuneration type, budget range or product description, timeline
- Toggle: Open for Superstar applications
- Review incoming Superstar applications — shortlist or pass
- Select Superstar → triggers matched inquiry → 72h window starts

**Inquiries (`/inquiries`):**
- All submitted inquiries with status
- Confirmed inquiries: 72h countdown to commit
- Commitment form: confirm remuneration type and details, make escrow deposit (Stripe) for cash deals
- After commitment: Superstar contact info revealed, screening call option available

**Deliverable review (`/bookings/:id`):**
- View submitted files and Superstar's note
- Approve OR Request Revision (with feedback note)
- After final approval: escrow released → campaign marked Complete
- Prompted to rate the Superstar

**Settings:**
- Brand profile edit
- Subscription management
- Payment methods

---

### 3. Admin Portal

Full oversight of both portals. Manages the platform, approves Superstars, updates inquiry status, and can preview either portal.

**Access:** User IDs in `ADMIN_USER_IDS` env var.

**Admin — Superstars (`/admin/talents`):**
- All Superstars (published + pending + unpublished)
- Review and approve pending Superstars
- Edit all fields (including email for notifications)
- Toggle `is_published`
- Preview as Superstar → see exactly what that Superstar sees in their portal

**Admin — Brands (`/admin/brands`):**
- All brand accounts and profiles
- View their campaigns, inquiries, and shortlists
- Preview as Brand → impersonate their view (read-only)

**Admin — Inquiries (`/admin/inquiries`):**
- All inquiries across all brands
- Update status: Open → Reviewing → Confirmed → Closed
- Each status change triggers email + in-app notification to both sides
- View 72h commit countdowns; intervene if brands are unresponsive

**Admin — Campaigns (`/admin/campaigns`):**
- All campaigns from all brands
- Moderate before campaigns appear on Superstar portal (approve / reject / edit)

**Admin — Bookings (`/admin/bookings`):**
- Monitor active productions
- View deliverables and revision history
- Mediate disputes (can manually release or freeze escrow)

**Admin — Settings (`/admin/settings`):**
- Resend API key
- Platform fee percentage
- Stripe keys
- ADMIN_USER_IDS management

**Admin Preview Mode:**
- "Preview as Superstar" dropdown → select any Superstar → view their portal exactly as they see it
- "Preview as Brand" dropdown → select any Brand → view their portal exactly as they see it
- Admin header shows "Previewing as [name]" with exit button

---

## Post-Work Completion — What the Interface Looks Like

### Superstar view after completion:
```
┌─────────────────────────────────────────────────────┐
│  ✅ Campaign Completed                               │
│  Beauté Cosmetics × [Your name]                     │
│  "Holiday Glow UGC Series" — Dec 2026               │
│                                                     │
│  Remuneration received:                             │
│  SGD 450 released on 12 Dec 2026                   │
│  + Product set (confirmed received 10 Dec)          │
│                                                     │
│  Brand rating for you: ★★★★★                        │
│  "Professional, delivered ahead of schedule."       │
│                                                     │
│  [Rate this brand]  [View deliverables]             │
└─────────────────────────────────────────────────────┘
```

Completed campaigns appear on the Superstar's public profile as a portfolio entry:
- Campaign type (UGC, product demo, etc.)
- Brand category (not brand name — anonymous unless brand consents to be named)
- Deliverable thumbnail (if brand approves sharing)
- Star rating received

### Brand view after completion:
```
┌─────────────────────────────────────────────────────┐
│  ✅ Campaign Completed                               │
│  Holiday Glow UGC Series                           │
│  Superstar: [Name] · Dec 2026                       │
│                                                     │
│  Deliverables: 3 videos approved                    │
│  Total paid: SGD 450 (released 12 Dec)             │
│  Northstar Collective invoice: #INV-2026-0042  [Download]          │
│                                                     │
│  [Rate [Name]]  [Re-book [Name]]  [View files]      │
└─────────────────────────────────────────────────────┘
```

### Rating system:
- Both sides rate each other: 1–5 stars + optional short comment (max 150 chars)
- Ratings are mutual — both see each other's rating at the same time (no gaming)
- Displayed on: Superstar's public profile card (aggregated), Brand's admin view
- A Superstar with 10+ completed campaigns and 4.8★ is visibly more bookable

---

## Business Model

### Phase 1 — Launch (free)
- All browsing, shortlisting, inquiry, and campaign creation is free
- No escrow in Phase 1 — trust-based, admin-mediated
- Goal: get 10+ brands active and validate first bookings

### Phase 2 — Monetization

| Revenue stream | Amount | Trigger |
|---------------|--------|---------|
| Contact fee | SGD 80–120 per confirmed Superstar | Brand commits to a match |
| Monthly subscription | SGD 15/month | Replaces per-contact fees for high-volume brands |
| Platform fee (escrow) | 10–12% of cash remuneration | Deducted when escrow is released to Superstar |

**Model logic:**
- Browsing and applying is always free for both sides
- Brands pay the contact fee only when they've decided they want someone
- Superstars never pay anything — the platform is free for them entirely
- Escrow fee is small enough to be worth the protection; big enough to be sustainable

---

## Technical Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router) + Tailwind + shadcn/ui |
| Backend | Python FastAPI |
| Database | Neon (serverless PostgreSQL) |
| Auth | Better Auth v1.7.0-beta.4 (self-hosted in Next.js API routes) |
| Email | Resend (`noreply@Northstar Collective.sg`) |
| Payments | Stripe Checkout (contact fee + escrow) + Stripe Billing ($15/month sub) |
| File storage | Cloudflare R2 or Supabase Storage (for deliverable uploads) |
| AI scoring | DeepSeek (`deepseek-chat`) |
| Scheduling | Cal.com or Google Calendar API (screening call links) |
| Deploy — web | Vercel |
| Deploy — api | Railway |

### Auth
- Better Auth at `apps/web/app/api/auth/[...all]/route.ts`
- Methods: email + password, Google OAuth
- Cookie: `better-auth.session_token`
- FastAPI verifies sessions directly against DB (`session` + `"user"` tables)

### Email (Resend)
- API key in `platform_settings` DB (editable via `/admin/settings`)
- From: `Northstar Collective <noreply@Northstar Collective.sg>`

### Notifications
- `notifications` table: user_id, title, message, link, is_read, created_at
- Bell component polls unread count every 30s
- In brand layout and superstar layout headers

---

## Database Schema

### Current tables (migrations 001–004)

```sql
-- Auth (managed by Better Auth)
"user", session, account, verification

-- Core
brands        -- id, user_id, company_name, industry, brand_values[], aesthetic_tags[],
              --   target_audience (jsonb), plan_tier, credits_remaining, email
talents       -- id, ig_username, name, age, gender, languages[], content_types[],
              --   vibe_tags[], ig_handle, tiktok_handle, ig_followers, tiktok_followers,
              --   bio, experience_summary, rate_card_text, photo_urls[], intro_video_url,
              --   face_condition, hair_condition, body_condition, tc_signed,
              --   is_published, email
shortlists    -- id, brand_id, talent_id
inquiries     -- id, brand_id, talent_id, campaign_name, campaign_type, brief_text,
              --   budget_range, preferred_dates, status

-- Platform
notifications       -- id, user_id, title, message, link, is_read, created_at
platform_settings   -- key, value, updated_at
brand_fit_scores    -- id, brand_id, talent_id, score, rationale, computed_at
contact_confirmations -- id, brand_id, talent_id, inquiry_id, stripe_session_id, amount_sgd, paid_at
subscriptions       -- id, brand_id, stripe_subscription_id, plan, status, current_period_end
```

### To add (migration 005+)

```sql
-- Link Superstars to auth users (self-serve portal)
ALTER TABLE talents ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE talents ADD COLUMN IF NOT EXISTS remuneration_preference TEXT DEFAULT 'both'; -- cash/product/both
ALTER TABLE talents ADD COLUMN IF NOT EXISTS min_rate_sgd INT; -- private, shown only to matched brands
ALTER TABLE talents ADD COLUMN IF NOT EXISTS profile_status TEXT DEFAULT 'draft'; -- draft/pending/active/paused
ALTER TABLE talents ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2);
ALTER TABLE talents ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0;

-- Campaigns (bidirectional)
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id),
  title TEXT NOT NULL,
  content_type TEXT,
  brief_text TEXT,
  deliverables TEXT,              -- what the Superstar needs to produce
  remuneration_type TEXT,         -- cash / product / hybrid
  budget_range TEXT,              -- for cash deals
  product_description TEXT,       -- for product/service exchange
  preferred_dates TEXT,
  status TEXT DEFAULT 'draft',    -- draft / open / closed / completed
  is_published BOOLEAN DEFAULT FALSE,  -- visible on Superstar campaigns feed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Superstar applications to campaigns
CREATE TABLE campaign_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  talent_id UUID REFERENCES talents(id),
  note TEXT,
  status TEXT DEFAULT 'pending',  -- pending / shortlisted / matched / rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 72-hour commit tracking
ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS commit_deadline TIMESTAMPTZ,   -- confirmed_at + 72h
  ADD COLUMN IF NOT EXISTS committed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS remuneration_type TEXT,        -- cash / product / hybrid
  ADD COLUMN IF NOT EXISTS remuneration_cash_sgd INT,
  ADD COLUMN IF NOT EXISTS remuneration_product_desc TEXT,
  ADD COLUMN IF NOT EXISTS escrow_stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS escrow_released_at TIMESTAMPTZ;

-- Deliverables
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id),
  submitted_by_talent_id UUID REFERENCES talents(id),
  file_urls TEXT[],
  note TEXT,
  revision_round INT DEFAULT 1,
  status TEXT DEFAULT 'pending_review',  -- pending_review / approved / revision_requested
  brand_feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id),
  from_user_id TEXT NOT NULL,     -- Better Auth user ID
  to_entity_type TEXT NOT NULL,   -- 'talent' or 'brand'
  to_entity_id UUID NOT NULL,
  stars INT CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  is_visible BOOLEAN DEFAULT FALSE,  -- revealed only after both sides have rated
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screening call log
CREATE TABLE screening_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id),
  initiated_by TEXT,              -- 'brand' or 'talent'
  scheduled_at TIMESTAMPTZ,
  meet_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## File Structure

```
Northstar Collective/
├── Northstar Collective.md                        ← this file (product documentation)
├── BRAND_SYSTEM.md                 ← visual identity
│
├── apps/
│   ├── web/                        ← Next.js (App Router)
│   │   ├── app/
│   │   │   ├── (auth)/             ← login, signup
│   │   │   ├── (brand)/            ← brand portal
│   │   │   │   ├── catalog/
│   │   │   │   ├── catalog/[id]/
│   │   │   │   ├── shortlist/
│   │   │   │   ├── inquiries/
│   │   │   │   ├── inquiries/[id]/ ← booking detail: deliverables, commit, review
│   │   │   │   ├── campaigns/      ← create + manage campaigns
│   │   │   │   └── settings/
│   │   │   ├── (superstar)/        ← superstar portal (TODO)
│   │   │   │   ├── dashboard/
│   │   │   │   ├── profile/        ← self-edit
│   │   │   │   ├── campaigns/      ← browse + apply to brand campaigns
│   │   │   │   ├── applications/   ← my applications
│   │   │   │   └── bookings/       ← active + completed bookings
│   │   │   │       └── [id]/       ← submit deliverables, view feedback
│   │   │   ├── (admin)/
│   │   │   │   └── admin/
│   │   │   │       ├── talents/
│   │   │   │       ├── brands/     ← TODO
│   │   │   │       ├── inquiries/
│   │   │   │       ├── campaigns/  ← TODO
│   │   │   │       ├── bookings/   ← TODO
│   │   │   │       └── settings/
│   │   │   ├── onboarding/         ← brand profile setup
│   │   │   └── page.tsx            ← landing page
│   │   ├── components/
│   │   │   ├── catalog/
│   │   │   ├── NotificationBell.tsx
│   │   │   └── ui/
│   │   └── lib/
│   │       ├── auth.ts
│   │       ├── auth-client.ts
│   │       ├── api.ts
│   │       └── get-token.ts
│   │
│   └── api/                        ← Python FastAPI
│       ├── routers/
│       │   ├── talents.py
│       │   ├── brands.py
│       │   ├── shortlists.py
│       │   ├── inquiries.py        ← add commit, 72h window, remuneration
│       │   ├── notifications.py
│       │   ├── admin_settings.py
│       │   ├── campaigns.py        ← TODO
│       │   ├── deliverables.py     ← TODO
│       │   └── ratings.py          ← TODO
│       └── services/
│           ├── email.py
│           ├── notifications.py
│           ├── ai_scoring.py
│           └── escrow.py           ← TODO (Stripe escrow logic)
│
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_indexes.sql
    ├── 003_notifications.sql
    ├── 004_better_auth.sql
    └── 005_campaigns_deliverables_ratings.sql  ← TODO
```

---

## Build Status

### Done ✅
- Database migrations 001–004
- FastAPI: talents, brands, shortlists, inquiries, notifications, admin settings
- Brand portal: catalog (search + filters), talent profile, shortlist, inquiry submission
- Admin panel: talent CRUD, inquiry status updates, platform settings
- Auth: Better Auth — email + password + Google OAuth
- Email notifications (Resend) — branded HTML templates
- In-app notification bell (brand portal)
- Automated workflow: inquiry → notifications → status changes → notifications

### In Progress 🔄
- Fix Turbopack build error (patch-package applied, needs server restart to verify)
- Update `ADMIN_USER_IDS` (old Neon Auth user IDs invalid after migration)

### To Build 🔲

**Priority 1 — Superstar portal**
- `(superstar)/` route group + layout + auth guard
- Superstar onboarding (profile creation flow)
- Dashboard, profile self-edit, campaign feed, applications, bookings
- Deliverable submission UI
- Notification bell in superstar layout
- Migration: `user_id`, `profile_status`, `remuneration_preference` on `talents`

**Priority 2 — Campaigns system**
- `campaigns` + `campaign_applications` tables (migration 005)
- FastAPI `/campaigns` router
- Brand campaign creation + management page
- Superstar campaigns feed + apply flow
- Admin campaign moderation

**Priority 3 — 72-hour commit + remuneration**
- Commit deadline tracking on confirmed inquiries
- Remuneration type selection at commitment
- Automated 48h/24h/2h email reminders (cron job on Railway)
- Match expiry logic

**Priority 4 — Deliverables + ratings**
- `deliverables` + `ratings` + `screening_calls` tables
- FastAPI routers for each
- Brand review UI (approve / request revision with feedback)
- Superstar submission UI
- Mutual rating reveal (both submit → both see simultaneously)
- Rating aggregation on talent profile

**Priority 5 — Payments**
- Stripe Checkout: contact fee at confirmation
- Stripe escrow: deposit at commitment, release at approval
- Stripe Billing: $15/month subscription
- Webhook handler in Next.js API routes
- Invoice generation + download

**Priority 6 — Admin preview mode**
- "Preview as Superstar" — impersonate any talent's portal view
- "Preview as Brand" — impersonate any brand's portal view

**Priority 7 — AI scoring**
- DeepSeek fit score service
- Trigger on brand profile save
- Fit score badge on catalog cards + sort

**Priority 8 — Deployment**
- Vercel (web), Railway (api)
- Set all env vars in dashboards
- Custom domain: Northstar Collective.sg

---

## Environment Variables

### `apps/web/.env.local`
```
DATABASE_URL=
BETTER_AUTH_SECRET=
NEXT_PUBLIC_APP_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ADMIN_USER_IDS=
NEXT_PUBLIC_API_URL=
STRIPE_PUBLISHABLE_KEY=
```

### `apps/api/.env`
```
DATABASE_URL=
RESEND_API_KEY=
DEEPSEEK_API_KEY=
ADMIN_USER_IDS=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_MONTHLY=
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| No Telegram | All notifications via Resend email + in-app bell. No external dependencies. |
| Better Auth self-hosted | Enables Google OAuth. Neon Auth couldn't do social providers. |
| Payment at confirmation, not inquiry | Zero friction at discovery. Brands pay when they've decided. |
| Escrow, not direct payment | Protects both sides. Main reason to stay on platform instead of going direct. |
| Mutual rating reveal | Both rate before either can see the other's rating. Prevents gaming. |
| 72-hour commit window | Protects Superstars from being held in indefinite limbo. Creates urgency for brands. |
| Optional screening call | Useful for complex campaigns. Never a blocker. Platform facilitates but doesn't mandate. |
| Superstar never pays | Platform is free for talent. They only gain from being here. |
| Cash + product remuneration | Beauty industry heavily relies on product exchange. Platform must support both. |

---

*Northstar Collective Product Documentation v1.3 — update this file whenever the product direction changes.*
