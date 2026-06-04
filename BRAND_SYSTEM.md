# CASTD Brand System

**Version 1.0 — June 2026**

---

## 01 — Brand Concept

**CASTD** is a B2B talent casting marketplace for beauty and lifestyle brands in Singapore. The name merges "cast" (to cast talent, to cast a spotlight) with the stripped-down, digital shorthand of dropping a vowel — punchy, modern, remembered on first read.

### Brand Idea
> *The spotlight is on.*

CASTD puts the right talent in front of the right brand — fast, confidently, beautifully. Every surface of the product should feel like a well-lit stage: the talent is the hero, the platform is the stage manager.

### Brand Character
| Trait | Expression |
|-------|-----------|
| **Direct** | No jargon. No fluff. Say the thing. |
| **Confident** | Bold typography, strong contrast — no timid design choices |
| **Curated** | Every element earns its place. Nothing decorative that doesn't serve |
| **Energetic** | The yellow. The pace. The feel of a casting room that moves |
| **Trustworthy** | B2B credibility. Brands should feel safe paying from day one |

---

## 02 — Color System

### Philosophy
The palette is built on **high contrast and restraint**. Three core colors do all the work. The yellow is the energy; black grounds it; white lets the talent photography breathe.

### Primary Colors

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--color-primary` | CASTD Yellow | `#FFD200` | CTAs, highlights, active states, logo mark |
| `--color-ink` | Ink Black | `#0C0C0C` | Primary text, hero backgrounds, headers |
| `--color-white` | Pure White | `#FFFFFF` | Page backgrounds, card surfaces, negative space |

**CASTD Yellow `#FFD200`** — a rich, full-saturation yellow. Warm enough to feel premium, bright enough to command attention. Reference: sits slightly deeper than Scoot's `#FFE500`, which prevents it from reading as neon on screen. On a black background it glows; on white it reads clean.

### Secondary / UI Neutrals

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--color-ink-80` | Ink 80% | `#2A2A2A` | Secondary text, nav links |
| `--color-ink-50` | Ink 50% | `#7A7A7A` | Placeholders, captions, disabled states |
| `--color-ink-10` | Ink 10% | `#EBEBEB` | Borders, dividers, card outlines |
| `--color-surface` | Off-White | `#F8F7F4` | Section backgrounds, alternating panels |
| `--color-yellow-10` | Yellow Tint | `#FFF9DB` | Subtle highlight backgrounds, info banners |

### Functional Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | `#22C55E` | Confirmed booking, paid status |
| `--color-warning` | `#F59E0B` | Pending actions, review states |
| `--color-error` | `#EF4444` | Form errors, destructive actions |

### Color Rules
1. **Yellow never on white as a background for text.** Yellow is for accents, badges, and CTA fills — never a text color against white.
2. **Ink on yellow is the primary CTA pattern.** `#0C0C0C` text on `#FFD200` button, not white-on-yellow.
3. **Photography always bleeds to edge on dark panels.** When talent photos appear on black panels, remove white card frames.
4. **One yellow per viewport.** Don't stack yellow elements. It dilutes the signal.

---

## 03 — Typography

### Typeface Pairings

**Display / Headlines — [Syne](https://fonts.google.com/specimen/Syne)**
- Weights: Bold (700), ExtraBold (800)
- Use: Hero H1s, section titles, feature callouts
- Character: Geometric, irregular letterforms — editorial energy without being styled. It feels like a casting billboard.
- Google Fonts: `font-family: 'Syne', sans-serif`

**Body / UI — [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)**
- Weights: Regular (400), Medium (500), SemiBold (600)
- Use: All body copy, UI labels, navigation, forms, cards
- Character: Modern humanist sans. Readable at small sizes, personality at large sizes.
- Google Fonts: `font-family: 'Plus Jakarta Sans', sans-serif`

### Type Scale

| Role | Font | Size | Weight | Line Height |
|------|------|------|--------|-------------|
| Display XL | Syne | 72px / 4.5rem | 800 | 1.0 |
| H1 | Syne | 48px / 3rem | 800 | 1.05 |
| H2 | Syne | 36px / 2.25rem | 700 | 1.1 |
| H3 | Syne | 24px / 1.5rem | 700 | 1.2 |
| H4 | Plus Jakarta Sans | 20px / 1.25rem | 600 | 1.3 |
| Body LG | Plus Jakarta Sans | 18px / 1.125rem | 400 | 1.6 |
| Body | Plus Jakarta Sans | 16px / 1rem | 400 | 1.6 |
| Body SM | Plus Jakarta Sans | 14px / 0.875rem | 400 | 1.5 |
| Label | Plus Jakarta Sans | 12px / 0.75rem | 600 | 1.4 |
| Caption | Plus Jakarta Sans | 11px / 0.6875rem | 500 | 1.4 |

### Typography Rules
1. **Headings are sentence case, never ALL CAPS** — except Labels and status badges.
2. **Letter-spacing on display type** — apply `tracking-tight` (-0.02em) on H1+ to avoid Syne's letterforms reading loose at size.
3. **Minimum body size is 14px** — talent profiles and inquiry forms must never drop below this.
4. **Brand name is always CASTD** — all caps, no exceptions, no lowercase version.

---

## 04 — Logo & Wordmark

### Wordmark
The CASTD wordmark is set in **Syne ExtraBold (800)** with slight negative letter-spacing. The logotype treatment:

```
CASTD
```

- Primary: Ink Black on White / Yellow on Ink Black
- The "C" may optionally be replaced with a spotlight/aperture glyph mark in `#FFD200` — but only if a custom mark is commissioned. Until then, full wordmark only.

### Logo Usage Rules
1. **Minimum size: 80px wide** — below this the letterforms compress unreadably.
2. **Clear space: 0.5× the wordmark height on all sides.**
3. **Approved color combos:**
   - CASTD Yellow `#FFD200` on Ink Black `#0C0C0C` — hero/dark usage
   - Ink Black `#0C0C0C` on White `#FFFFFF` — default usage
   - White `#FFFFFF` on Ink Black `#0C0C0C` — secondary dark usage
4. **Never:** stretch, rotate, drop shadow, outline, place on yellow background, or colorize individual letters.

---

## 05 — Iconography

Use **Lucide Icons** (already bundled). Stroke weight: `1.5px`. Size: `16px` for UI, `20px` for feature icons, `24px` for empty states.

Color: Always `--color-ink` or `--color-ink-50`. Never yellow icons — reserve yellow for fills and CTAs only.

---

## 06 — Spacing & Layout

### Grid
- **Desktop:** 12-column, 80px gutters, 1280px max-width container
- **Tablet:** 8-column, 48px gutters
- **Mobile:** 4-column, 24px gutters, 16px side padding

### Spacing Scale (base-8)
```
4px   xs
8px   sm
16px  md
24px  lg
32px  xl
48px  2xl
64px  3xl
96px  4xl
128px 5xl
```

### Section Anatomy
Sections alternate between three panel types:
1. **White panel** — default; light content, photography cards
2. **Off-white panel** (`#F8F7F4`) — feature lists, testimonials
3. **Ink Black panel** — hero sections, bold callouts; yellow and white text only

---

## 07 — Photography & Media

### Talent Photography
This is the product. Every talent photo must:
- Be high-resolution (minimum 800×1000px for catalog cards, 1200×1500px for profile hero)
- Use a **clean, neutral background** (white, cream, or studio grey) — not outdoor or branded environments
- Show the talent's face clearly — no obstructions, no heavy filters
- Be portrait ratio (2:3) for catalog grid; 16:9 for intro video thumbnail

### Editorial Photography (marketing/landing)
- High-contrast, bold framing — wide angles, confident poses
- Talent photos can overlay on the Ink Black hero panel with a subtle yellow color-grade on the background layer
- Avoid stock photos wherever possible

### Video
- Intro clips: 15–30 seconds, portrait (9:16), no music required
- Platform background: autoplay muted on profile page

---

## 08 — UI Components (Design Language)

### Buttons

| Variant | Background | Text | Use |
|---------|-----------|------|-----|
| Primary | `#FFD200` | `#0C0C0C` | Main CTAs: "Book Now", "Confirm Talent" |
| Secondary | `#0C0C0C` | `#FFFFFF` | Destructive or secondary action |
| Ghost | Transparent | `#0C0C0C` | Tertiary actions, nav links |
| Outline | Transparent + border | `#0C0C0C` | Filters, toggles |

Button sizing: `height: 44px` (mobile), `height: 40px` (desktop). Border radius: `6px`. Font: Plus Jakarta Sans SemiBold 15px.

### Cards (Talent Cards)
- White background, `1px #EBEBEB` border, `border-radius: 12px`
- Hover state: lift with `box-shadow: 0 8px 24px rgba(0,0,0,0.10)` + `transform: translateY(-2px)`
- Photo ratio: 2:3 (fills top 65% of card)
- Bottom strip: Name (H4), tags row (Pills), fit score badge if applicable

### Tags / Pills
- Background: `#EBEBEB`, text: `#2A2A2A`, `border-radius: 100px`, padding: `4px 10px`
- Active/selected: Background `#FFD200`, text: `#0C0C0C`

### Fit Score Badge
- Background: `#FFD200`
- Text: `#0C0C0C`, Plus Jakarta Sans SemiBold
- Format: `94 Match` — score first, then label
- Position: top-right corner of talent card, `border-radius: 6px`

### Forms
- Input height: 44px
- Border: `1px solid #EBEBEB`, focus: `2px solid #FFD200`
- Error state: `1px solid #EF4444` + helper text below
- Label: Plus Jakarta Sans Medium 13px, `color: #2A2A2A`

---

## 09 — Motion

Transitions should feel **fast and decisive** — this is a productivity tool, not a portfolio site.

| Property | Value |
|----------|-------|
| Default transition | `150ms ease-out` |
| Card hover | `200ms ease-out` |
| Page transitions | `200ms fade` via Next.js |
| Skeleton loaders | Pulse animation `1.5s ease-in-out infinite` |

No bounces, no springs, no entrance animations on body copy. Animation is for state changes only.

---

## 10 — Tone of Voice

### Voice Attributes
- **Confident, not arrogant.** State facts. Don't hedge.
- **Brief, not terse.** Every sentence earns its place.
- **Human, not corporate.** Write like a smart person, not a press release.
- **Action-forward.** Start CTAs with verbs. Show what happens next.

### Sample Copy

| Context | Do | Don't |
|---------|-----|-------|
| CTA | "Find your talent" | "Click here to begin the discovery process" |
| Empty state | "No talents shortlisted yet. Start browsing the catalog." | "Your shortlist is currently empty." |
| Confirmation | "Talent secured. We'll be in touch within 24 hours." | "Your confirmation has been successfully submitted." |
| Pricing | "SGD 80 per confirmed talent" | "Competitive fees based on engagement tier" |
| Error | "Couldn't save your profile. Try again." | "An error has occurred. Please contact support." |

### CASTD is always:
- Spelled in full caps: **CASTD**
- Not "Castd", "castd", or "C.A.S.T.D"

---

## 11 — Brand Don'ts

1. No gradient fills on any element
2. No rounded corners on the logo
3. No drop shadows on text
4. No stock photography of offices, handshakes, or laptops
5. No using yellow as a background for body text
6. No mixing multiple accent colors — yellow is the only accent
7. No more than two font sizes in any single card component
8. No decorative borders or ornamental flourishes

---

## 12 — Tailwind Config Tokens

```js
// tailwind.config.js — CASTD design tokens
colors: {
  primary: '#FFD200',
  ink: {
    DEFAULT: '#0C0C0C',
    80: '#2A2A2A',
    50: '#7A7A7A',
    10: '#EBEBEB',
  },
  surface: '#F8F7F4',
  'yellow-tint': '#FFF9DB',
},
fontFamily: {
  display: ['Syne', 'sans-serif'],
  sans: ['Plus Jakarta Sans', 'sans-serif'],
},
borderRadius: {
  sm: '4px',
  DEFAULT: '6px',
  md: '8px',
  lg: '12px',
  full: '9999px',
},
```

---

*CASTD Brand System v1.0 — internal reference. Update version number on any structural change.*
