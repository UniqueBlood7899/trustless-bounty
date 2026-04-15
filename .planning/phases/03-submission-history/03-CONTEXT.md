---
phase: 3
status: completed
---

# Phase 3 Context

## Locked Decisions

- **Submission form placement:** Inline on Bounty Detail page — the sidebar "Submit Solution" button expands into an inline form (text + optional URL). No modal, no separate page.
- **My Submissions layout:** Simple table-like list rows (bounty title | submission date | status badge). No card grid.
- **Self-submit block:** Backend enforces `solverAddress !== posterAddress` → 403. Frontend shows inline error toast.
- **Status polling:** Poll `GET /submissions/:id` every 5s while status is `"pending"`. Show spinner on badge. Stop polling when status changes.
- **Design system:** Carry forward Phase 2 glassmorphism, teal accents, `useWallet`, `useToast`, `glass-card` CSS class.

## Reusable from Phase 2

- `useWallet()` — solver identity
- `useToast()` — success/error feedback  
- `glass-card` + skeleton CSS classes
- `lib/api.ts` — extend with submission fetch helpers
- `truncateAddress()` from `lib/algorand.ts`

## Deferred
- Editing/deleting submissions — out of scope MVP
