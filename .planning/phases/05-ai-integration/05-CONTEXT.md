---
phase: 5
depends_on: [4, 3]
---

# Phase 5 Context

## Decisions (inherited from Phase 4)
- VerificationService wired async into `POST /submissions` — no blocking the HTTP response
- First-approved-wins: on approval, set bounty `status: 'won'`, `winnerSubmissionId`; close all other `pending` submissions for that bounty
- UI: show AI rationale directly inline in My Submissions row (expandable) and on Bounty Detail sidebar
- Winner badge on Bounty Detail (teal "⬡ Won" banner)
