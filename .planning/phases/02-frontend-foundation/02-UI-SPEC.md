# Phase 2 — UI Design Contract

> Generated from `02-CONTEXT.md` decisions. All downstream agents MUST read this before implementing any UI.

---

## Design System

### Theme
- **Mode:** Dark only
- **Style:** Glassmorphism — frosted glass cards, semi-transparent surfaces, subtle blur
- **Base background:** `#0A0E1A` (deep navy-black)
- **Surface (cards/panels):** `rgba(255,255,255,0.05)` with `backdrop-filter: blur(12px)`
- **Border:** `rgba(255,255,255,0.08)` at 1px
- **Box shadow:** `0 8px 32px rgba(0,0,0,0.4)`

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0A0E1A` | Page background |
| `--color-surface` | `rgba(255,255,255,0.05)` | Cards, panels |
| `--color-border` | `rgba(255,255,255,0.08)` | Card edges |
| `--color-accent` | `#00D4BA` | Algorand teal — CTAs, active states, badges |
| `--color-accent-dim` | `rgba(0,212,186,0.15)` | Accent hover backgrounds |
| `--color-text-primary` | `#F0F4FF` | Headings, primary content |
| `--color-text-secondary` | `rgba(240,244,255,0.55)` | Descriptions, metadata |
| `--color-text-muted` | `rgba(240,244,255,0.35)` | Timestamps, helper text |
| `--color-error` | `#FF5B5B` | Validation errors |
| `--color-success` | `#00D4BA` | Success states (reuse teal) |

### Typography
- **Font:** `Inter` (Google Fonts)
- **Headings:** 700 weight
- **Body:** 400 weight, 15-16px
- **Labels/captions:** 500 weight, 12-13px, letter-spacing: 0.03em
- **Monospace (addresses, tx IDs):** `'JetBrains Mono', monospace`

### Spacing & Radius
- **Card radius:** `16px`
- **Button radius:** `8px`
- **Input radius:** `8px`
- **Base spacing unit:** `8px`

---

## Components

### 1. Navbar

**Layout:** Fixed top, full-width, `backdrop-filter: blur(20px)`, `background: rgba(10,14,26,0.8)`, bottom border `rgba(255,255,255,0.06)`

**Content:**
- Left: BountyChain logo (⬡ symbol + "BountyChain" wordmark in teal)
- Center: Navigation links — "Board", "Post Bounty"
- Right: Wallet Pill (see below) or "Connect Wallet" button

**Wallet Pill (connected state):**
```
[ ⬡ 450.2 ALGO  |  7F3A...B21X  ⌄ ]
```
- Pill background: `rgba(0,212,186,0.12)`, border `rgba(0,212,186,0.3)`
- Click reveals dropdown with: "Copy address", "Disconnect"
- Responsive: truncate address to 6...4 chars on mobile

**"Connect Wallet" Button:**
- Ghost button with teal border, teal text
- On click: open standard Pera Wallet connection modal

---

### 2. Bounty Card (Board Grid)

**Container:** `glass-card` — `background: rgba(255,255,255,0.05)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255,255,255,0.08)`, `border-radius: 16px`, `padding: 20px`

**Layout (top to bottom):**
```
┌──────────────────────────────┐
│ [Category Badge]   [⬡ X ALGO]│
│                               │
│ Bounty Title (bold, 2 lines) │
│                               │
│ Description preview (1 line  │
│ truncated with ellipsis)      │
│                               │
│ ⏱ 3d 14h remaining           │
└──────────────────────────────┘
```

**Category Badge:** Small pill — `background: rgba(0,212,186,0.12)`, `color: #00D4BA`, `border-radius: 20px`, `padding: 3px 10px`, `font-size: 12px`, `font-weight: 500`

**Reward:** `⬡ 1.5 ALGO` — right-aligned, teal color, `font-size: 15px`, `font-weight: 700`

**Countdown:** `⏱ 3d 14h remaining` — bottom left, muted text, 12px

**Interaction:** Hover → `transform: translateY(-2px)`, `box-shadow` brightens, border → `rgba(0,212,186,0.3)`. Cursor pointer. Click navigates to detail page.

**Skeleton Variant:** Pulsing grey rectangles at same position as real content. `animation: pulse 1.5s ease infinite`.

---

### 3. Bounty Board Page (`/`)

**Header area:**
- H1: "Bounty Board" (large, white)
- Subtext: "Discover tasks. Earn ALGO."
- Right of header: "Post Bounty" CTA button (teal, filled)

**Filter bar (below header):**
- Category filter tabs: `All | Frontend | Backend | Smart Contracts | Data Tasks | General`
  - Active tab: teal underline + teal text
  - Inactive: muted text
- Sort dropdown (right end): "Sort: Newest ▼" — opens select with `Newest | Highest Reward | Ending Soon`

**Grid:** 3-column CSS Grid (`grid-template-columns: repeat(3, 1fr)`, `gap: 20px`)
- Responsive: 2-col at tablet, 1-col at mobile

**Loading State:** 6 skeleton cards in the grid, pulsing

**Empty State:**
- Centred illustration (SVG outline — open chest or radar icon, teal accent, ~120px)
- H2: "No bounties yet"
- Body: "Be the first to post a task and earn ALGO."
- CTA button: "Create the First Bounty" → navigates to `/create`

---

### 4. Bounty Creation Form (`/create`)

**Gate:** If wallet not connected → show inline warning "Connect your wallet to post a bounty" with Connect button. Form disabled.

**Form layout:** Single-column, max-width 640px, centred

**Fields:**
| Field | Type | Constraint |
|-------|------|------------|
| Title | Text input | Max 200 chars, required |
| Description | Textarea (4 rows) | Max 5000 chars, required |
| Category | Select | Frontend/Backend/Smart Contracts/Data Tasks/General |
| Reward (ALGO) | Number input | 1–100, step 0.5 |
| Deadline | Date picker | Default = today + 7 days, min = tomorrow |

**Submit button:** Full-width, teal, "Post Bounty & Lock ALGO →"
- On click: basic client-side validation → if pass, send to backend → trigger Pera Wallet deeplink

**Validation error display:** Inline red helper text below each field

**Loading Overlay (during on-chain confirmation):**
- Full-screen glass overlay (`rgba(10,14,26,0.85)`, `backdrop-filter: blur(20px)`)
- Centre: animated teal spinner + "Awaiting network confirmation…" + sub-text "Check your Pera Wallet"
- Non-dismissable (blocks double-submit)

---

### 5. Bounty Detail Page (`/bounty/[id]`)

**Layout:** Two-column at desktop (2/3 main + 1/3 sidebar), single column at mobile

**Main (left):**
- Category badge + status badge ("Open", "Won", "Expired")
- H1: Bounty title
- Description (full text)
- Posted by: `[truncated address]` (monospace)
- Creation Tx: `[txId]` (monospace) with external link icon → TestNet explorer

**Sidebar (right):**
- Glass card:
  - Large reward: `⬡ X ALGO`
  - Deadline countdown (live)
  - "Submit Solution" CTA button (teal, full-width) — disabled if wallet not connected

---

### 6. Toast Notifications

**Position:** Bottom-right, stacked
**Success toast:** Background `rgba(0,212,186,0.15)`, left border `#00D4BA`, icon ✓
- Text: "Bounty Created!" + sub-text with truncated txId + click-to-copy
**Error toast:** Background `rgba(255,91,91,0.1)`, left border `#FF5B5B`, icon ✕
**Duration:** 5 seconds, manual dismiss

---

## Page Routes

| Path | Component | Auth required |
|------|-----------|---------------|
| `/` | Bounty Board | No |
| `/create` | Bounty Creation Form | Yes (wallet) |
| `/bounty/[id]` | Bounty Detail | No (submit requires wallet) |

---

## Interaction States Summary

| State | Behaviour |
|-------|-----------|
| Loading board | 6 skeleton cards, pulsing |
| Empty board | Illustration + CTA |
| Form submitting | Full-screen overlay, spinner |
| Success | Redirect to detail + success toast |
| Error (API) | Error toast + form re-enabled |
| Wallet not connected | Disabled form + prompt |
| Connected | Wallet pill with balance + address |
