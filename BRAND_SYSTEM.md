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

Two fonts. One for impact, one for reading. Do not introduce a third.

---

**Display / Headlines — [Syne](https://fonts.google.com/specimen/Syne)**
- Weights used: Bold (700), ExtraBold (800)
- Role: Hero headings, section titles, feature callouts, the wordmark
- Character: Geometric with subtly irregular letterforms — bold, editorial, billboard energy. Use only at 24px and above.
- Google Fonts import: `font-family: 'Syne', sans-serif`
- Tailwind class: `font-display`

> ⚠️ **Do not use Syne for body copy, form labels, or any text below 24px.** Its geometric construction hurts readability at small sizes.

---

**Body / UI — [Inter](https://fonts.google.com/specimen/Inter)**
- Weights used: Regular (400), Medium (500), SemiBold (600)
- Role: All body copy, UI labels, navigation, buttons, forms, cards, data tables
- Character: Designed specifically for screen readability. Excellent letter-spacing, open apertures, and optical size tuning across all weights. Used by Linear, Vercel, Stripe, and most high-quality SaaS products. Renders crisply on every OS and screen density.
- Google Fonts import: `font-family: 'Inter', sans-serif`
- Tailwind class: `font-sans`
- Variable font: Use `Inter var` via `@fontsource/inter` for automatic optical sizing — include `font-optical-sizing: auto` in the CSS reset.

> ✅ **Inter is the default for everything the user reads.** When in doubt, use Inter.

---

### Type Scale

| Role | Font | Size | Weight | Line Height | Letter Spacing | Color |
|------|------|------|--------|-------------|----------------|-------|
| Display XL | Syne | 72px / 4.5rem | 800 | 1.0 | -0.02em | `#0C0C0C` or `#FFFFFF` |
| H1 | Syne | 48px / 3rem | 800 | 1.05 | -0.02em | `#0C0C0C` or `#FFFFFF` |
| H2 | Syne | 36px / 2.25rem | 700 | 1.1 | -0.01em | `#0C0C0C` |
| H3 | Syne | 24px / 1.5rem | 700 | 1.2 | 0 | `#0C0C0C` |
| H4 | Inter | 20px / 1.25rem | 600 | 1.3 | 0 | `#0C0C0C` |
| Body LG | Inter | 18px / 1.125rem | 400 | 1.65 | 0 | `#0C0C0C` |
| Body | Inter | 16px / 1rem | 400 | 1.6 | 0 | `#0C0C0C` |
| Body SM | Inter | 14px / 0.875rem | 400 | 1.55 | 0 | `#2A2A2A` |
| Label / Badge | Inter | 12px / 0.75rem | 600 | 1.4 | +0.04em | `#0C0C0C` |
| Caption | Inter | 11px / 0.6875rem | 500 | 1.4 | +0.02em | `#7A7A7A` |

> **Line height note:** Use `1.6` minimum for body text. Tight line heights (≤ 1.4) are reserved for large display type only. Cramped line height is the single most common cause of hard-to-read body text.

---

### Contrast Requirements (WCAG AA minimum — mandatory)

| Text type | Min contrast ratio | Passing combos |
|-----------|-------------------|----------------|
| Body text (≥ 16px) | 4.5 : 1 | `#0C0C0C` on `#FFFFFF` ✅ (21:1) · `#0C0C0C` on `#F8F7F4` ✅ (19:1) |
| Large text (≥ 24px bold) | 3 : 1 | `#0C0C0C` on `#FFD200` ✅ (11:1) |
| Body on dark panels | 4.5 : 1 | `#FFFFFF` on `#0C0C0C` ✅ (21:1) |
| Captions / secondary | 4.5 : 1 | `#7A7A7A` on `#FFFFFF` ✅ (4.6:1) |

> ❌ **Never use `#7A7A7A` on `#F8F7F4`** — contrast drops to ~3.8:1, failing WCAG AA for body text.
> ❌ **Never use light grey text (`#ABABAB` or lighter) on white** — common failure point.

---

### Typography Rules

1. **Inter for everything below H3.** If it's smaller than 24px, it uses Inter — no exceptions.
2. **Syne for display and branding only.** Headings H1–H3, the wordmark, and large callout numbers.
3. **Headings are sentence case, never ALL CAPS** — except Labels (`font-size: 12px`) and status badges.
4. **Negative tracking on display type.** Apply `letter-spacing: -0.02em` on H1+. Syne's letterforms read loose at large sizes without it.
5. **Positive tracking on small labels.** Apply `letter-spacing: +0.04em` on Labels (12px) to improve legibility at small size.
6. **Minimum rendered body size is 14px.** Talent profiles, inquiry forms, data tables — nothing smaller.
7. **Brand name is always CASTD** — all caps, no exceptions, no lowercase version.
8. **Do not set body text in medium (500) weight.** Use Regular (400) for body, SemiBold (600) for emphasis. Medium weight at body sizes creates visual muddiness.

---

### Google Fonts Import (copy into `<head>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet">
```

### NPM Alternative (recommended for Next.js — avoids layout shift)

```bash
npm install @next/font
```

```js
// app/layout.tsx
import { Inter, Syne } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
})
```

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

Button sizing: `height: 44px` (mobile), `height: 40px` (desktop). Border radius: `6px`. Font: Inter SemiBold 15px.

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
- Text: `#0C0C0C`, Inter SemiBold
- Format: `94 Match` — score first, then label
- Position: top-right corner of talent card, `border-radius: 6px`

### Forms
- Input height: 44px
- Border: `1px solid #EBEBEB`, focus: `2px solid #FFD200`
- Error state: `1px solid #EF4444` + helper text below
- Label: Inter Medium 13px, `color: #2A2A2A`

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
const { fontFamily } = require('tailwindcss/defaultTheme')

module.exports = {
  theme: {
    extend: {
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
        // Inter — body, UI, all text below H3
        sans: ['var(--font-inter)', 'Inter', ...fontFamily.sans],
        // Syne — display headings, wordmark only
        display: ['var(--font-syne)', 'Syne', ...fontFamily.sans],
      },
      fontSize: {
        // Matches the CASTD type scale exactly
        'display-xl': ['4.5rem',  { lineHeight: '1.0',  letterSpacing: '-0.02em', fontWeight: '800' }],
        'h1':         ['3rem',    { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '800' }],
        'h2':         ['2.25rem', { lineHeight: '1.1',  letterSpacing: '-0.01em', fontWeight: '700' }],
        'h3':         ['1.5rem',  { lineHeight: '1.2',  letterSpacing: '0',       fontWeight: '700' }],
        'h4':         ['1.25rem', { lineHeight: '1.3',  letterSpacing: '0',       fontWeight: '600' }],
        'body-lg':    ['1.125rem',{ lineHeight: '1.65', letterSpacing: '0',       fontWeight: '400' }],
        'body':       ['1rem',    { lineHeight: '1.6',  letterSpacing: '0',       fontWeight: '400' }],
        'body-sm':    ['0.875rem',{ lineHeight: '1.55', letterSpacing: '0',       fontWeight: '400' }],
        'label':      ['0.75rem', { lineHeight: '1.4',  letterSpacing: '0.04em',  fontWeight: '600' }],
        'caption':    ['0.6875rem',{ lineHeight: '1.4', letterSpacing: '0.02em',  fontWeight: '500' }],
      },
      borderRadius: {
        sm:      '4px',
        DEFAULT: '6px',
        md:      '8px',
        lg:      '12px',
        full:    '9999px',
      },
    },
  },
}
```

### CSS Reset additions (add to `globals.css`)

```css
/* Ensure Inter renders with optical sizing on all platforms */
body {
  font-family: var(--font-inter), Inter, sans-serif;
  font-optical-sizing: auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #0C0C0C;
  font-size: 16px;
  line-height: 1.6;
}

h1, h2, h3 {
  font-family: var(--font-syne), Syne, sans-serif;
  letter-spacing: -0.02em;
}
```

---

*CASTD Brand System v1.0 — internal reference. Update version number on any structural change.*
