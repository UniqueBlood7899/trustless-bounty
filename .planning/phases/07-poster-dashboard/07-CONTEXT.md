---
phase: 7
---
# Phase 7 Context

## Locked Decisions
- **Poster Dashboard:** `/my-bounties` dedicated page — lists poster's own bounties with expandable submission viewer
- **Submission detail:** Full — solver address (truncated), text preview, URL link, AI score bar, rationale, winner badge
- **Navbar:** Add "My Bounties" next to "My Submissions"
- **Winner badge on Bounty Detail:** Teal banner when `status === 'won'`, show payoutTxId explorer link
- **Backend:** `GET /api/bounties/my?posterAddress=X` — returns poster's bounties with submissions array embedded
- **Reuse all Phase 2-6 patterns:** `glass-card`, `useWallet`, `useToast`, `truncateAddress`, skeleton, status badge
