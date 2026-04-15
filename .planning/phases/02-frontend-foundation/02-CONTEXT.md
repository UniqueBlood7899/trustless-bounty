---
phase: 2
status: completed
---

# Phase 2 Context

## Locked Decisions
- **Visual Style & Theme:** Dark glassmorphism with Algorand teal (`#00D4BA`) accents. Premium crypto-native feel.
- **Bounty Board Layout:** 3-column glass card grid.
- **Card Info:** Title, category badge, reward, countdown, and 1-line description preview.
- **Reward Display:** Algorand symbol (⬡) with amount.
- **Connection Trigger:** Standard Pera Wallet connection modal.
- **Connected State:** Navbar pill showing `⬡ [Balance] | [Truncated Address]`.
- **Form & Confirmation Flow:** Full-screen glassmorphism overlay during creation, followed by immediate redirect to detail page + success toast.
- **Empty & Loading States:** Skeleton cards during data loading. Thematic illustration with CTA button ("Create the First Bounty") for empty board.

## Specifics
- Avoid over-engineering the styling; use Tailwind classes where possible to achieve glassmorphism (`backdrop-blur`, semi-transparent bg).
- Emphasise the Algorand/crypto-native identity.

## Deferred Ideas
None captured in this session.
