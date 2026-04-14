# BountyChain Roadmap — v1

> Milestone 1 — Hackathon MVP (Algorand TestNet, 48 hours)
> Generated: 2026-04-15 (revised)
> Requirements: 23 v1 requirements across 7 categories

## Phases

| # | Phase | Goal | REQs | Est. Hours |
|---|-------|------|------|------------|
| 1 | Foundation & Smart Contracts | Escrow contract + backend API, no frontend yet | BOUNTY-02 | 8 |
| 2 | Frontend Foundation | Wallet connect, bounty creation UI, discovery board | WALLET-01–03, BOUNTY-01, BOUNTY-03–05, DISCOVER-01–04 | 8 |
| 3 | Submission & History | Solver submits solutions, tracks history | SUBMIT-01–04 | 6 |
| 4 | AI Verification Service | Gemini API service — standalone, testable before integration | VERIFY-01, VERIFY-02 | 6 |
| 5 | AI Submission Integration | Connect AI to submission flow — auto-approve/reject with UI feedback | VERIFY-03, VERIFY-04, VERIFY-05 | 5 |
| 6 | Automated Payouts & Refunds | Bridge AI approval to smart contract for trustless payouts | PAYOUT-01–04 | 8 |
| 7 | Poster Dashboard & UX Polish | Poster visibility + end-to-end demo polish | DASH-01–03 | 6 |

**Total estimated hours:** 47

---

## Phase Details

### Phase 1: Foundation & Smart Contracts

**Goal:** Deploy the BountyEscrow smart contract on Algorand TestNet and stand up the Express + MongoDB backend API so the contract and data layer are ready for the frontend.
**Depends on:** None
**Est. Hours:** 8
**UI hint:** no

**Plans:**
1. Initialize AlgoKit workspace with Puya TS — configure TestNet client, set up project scaffolding and deployment scripts
2. Develop and deploy the BountyEscrow smart contract — `create()` to lock escrow funds, `payout(winner_address)` to release, `refund()` to return to poster; deploy to TestNet
3. Set up Express.js server with MongoDB — define Bounty and Submission schemas, environment config, CORS, error handling middleware
4. Implement backend API routes: `POST /bounties`, `GET /bounties`, `GET /bounties/:id`, `GET /bounties/:id/submissions`

**Requirements:**
- BOUNTY-02: ALGO reward locked in Algorand smart contract escrow at creation

**Success Criteria:**
1. BountyEscrow smart contract is deployed to TestNet and its app ID is captured
2. AlgoKit can call `create()` on the contract and lock ALGO on TestNet (visible in explorer)
3. Express server starts and all four API routes respond correctly (tested with Postman or curl)
4. MongoDB connection is healthy and Bounty/Submission models save/read without errors

---

### Phase 2: Frontend Foundation — Wallet, Bounty Creation & Discovery

**Goal:** Users can connect their Pera Wallet, create a bounty (with ALGO locked on-chain), browse the public board, filter/sort, and view bounty details.
**Depends on:** Phase 1
**Est. Hours:** 8
**UI hint:** yes

**Plans:**
1. Integrate `@perawallet/connect` into Next.js — wallet connect/disconnect hook, display address + ALGO balance in navbar; persist session across page refreshes
2. Build bounty creation form — title, description, category select, reward (1–100 ALGO), deadline picker; on submit, call backend `POST /bounties` which triggers smart contract `create()` and locks ALGO
3. Show post-creation confirmation — display Algorand transaction ID with link to TestNet explorer; redirect to new bounty detail page
4. Build the public Bounty Board — fetch from `GET /bounties`, render cards with title, category badge, reward, time remaining
5. Implement category filter tabs and sort controls (Newest, Highest Reward, Ending Soon); build the individual Bounty Detail page

**Requirements:**
- WALLET-01: User can connect Algorand wallet (Pera Wallet)
- WALLET-02: User can view connected wallet address and ALGO balance
- WALLET-03: User can disconnect or switch wallet
- BOUNTY-01: Poster can create a bounty with title, description, category, reward, deadline
- BOUNTY-03: Category selection (Frontend, Backend, Smart Contracts, Data Tasks, General)
- BOUNTY-04: Custom deadline with 7-day default
- BOUNTY-05: On-screen creation confirmation with Algorand transaction ID
- DISCOVER-01: Public bounty board listing all open bounties
- DISCOVER-02: Filter by category
- DISCOVER-03: Sort by Newest, Highest Reward, Ending Soon
- DISCOVER-04: Individual bounty detail page

**Success Criteria:**
1. User connects Pera Wallet and sees their address + balance in the navbar
2. Creating a bounty locks ALGO in the smart contract — tx ID shown and verifiable on TestNet explorer
3. New bounty appears on the public board immediately after creation
4. Category filter and sort controls work correctly on the board
5. Clicking a bounty opens its detail page with full description, reward, deadline, and poster address

---

### Phase 3: Submission & History

**Goal:** Solvers can submit a solution (text + optional URL) to any open bounty, are blocked from self-submitting, and can track all their submissions.
**Depends on:** Phase 2
**Est. Hours:** 6
**UI hint:** yes

**Plans:**
1. Build the solution submission form on the Bounty Detail page — text explanation field, optional GitHub/URL field (validated client-side as URL format); submit button visible only to connected wallets
2. Implement `POST /bounties/:id/submissions` — reject if solver wallet == poster wallet (SUBMIT-02); store submission with status `"pending"`, solver address, text, url, timestamps
3. Build the "My Submissions" page — list all submissions by connected wallet address; show bounty title, submission date, status badge (Pending / Approved / Rejected / Closed)
4. Add real-time status UX — poll submission status every 5s while status is `"pending"`, show spinner; update badge immediately on status change

**Requirements:**
- SUBMIT-01: Solver submits text explanation + optional GitHub/URL
- SUBMIT-02: System prevents solver from submitting to their own bounty
- SUBMIT-03: "Pending Verification" status shown while Gemini processes
- SUBMIT-04: Solver can view all their submitted solutions and statuses

**Success Criteria:**
1. Solver submits a solution and it immediately appears in "My Submissions" with "Pending" status
2. Submitting to own bounty is blocked — backend returns 403 and UI shows a clear error
3. Submission is persisted in MongoDB with correct bounty ID, solver address, and status `"pending"`
4. Status badge updates automatically when status changes (no manual refresh needed)

---

### Phase 4: AI Verification Service

**Goal:** Build a standalone, testable Gemini-powered verification service that scores a solution against a bounty description and validates URLs — independently of the submission trigger.
**Depends on:** Phase 1
**Est. Hours:** 6
**UI hint:** no

**Plans:**
1. Integrate Gemini API (`gemini-pro`) into Express backend — create `VerificationService` class with `score(bountyDescription, solutionText)`: returns `{ score: 0–1, rationale: string }`; tune prompt for semantic relevance judgement
2. Implement URL validation utility — `validateUrl(url)`: performs HTTP HEAD request, returns `{ reachable: boolean, statusCode }`; penalize score by 0.2 if URL is unreachable or not provided
3. Build `POST /verify` standalone endpoint — accepts `{ bountyId, submissionId }`, runs score + URL check, returns `{ score, rationale, decision: "approved"|"rejected" }` without writing to DB yet
4. Write integration tests for the verification service — test approve/reject boundary cases, URL penalty, empty URL handling

**Requirements:**
- VERIFY-01: Gemini API semantic relevance scoring (solution text vs. bounty description)
- VERIFY-02: HTTP HEAD request to validate submitted GitHub/URL

**Success Criteria:**
1. `POST /verify` with a highly relevant solution returns score ≥ 0.7 and `decision: "approved"`
2. `POST /verify` with an irrelevant solution returns score < 0.7 and `decision: "rejected"` with meaningful rationale
3. A broken/unreachable URL is detected and rationale explicitly mentions link failure
4. Service can be tested independently without a submitted solution in the DB

---

### Phase 5: AI Submission Integration

**Goal:** Connect the Phase 4 verification service to the submission flow — submissions are automatically verified on creation, statuses update, first-winner logic runs, and solvers see their result with AI rationale in the UI.
**Depends on:** Phase 4, Phase 3
**Est. Hours:** 5
**UI hint:** yes

**Plans:**
1. Wire verification into submission creation — after `POST /submissions`, queue async call to `VerificationService`; update submission `status`, `ai_score`, `ai_rationale` in MongoDB when complete
2. Implement first-approved-wins logic — when a submission is approved, check if bounty already has a winner; if not, mark bounty `status: "won"`, set `winner_submission_id`; close all other `"pending"` submissions for that bounty to `"closed"`
3. Surface AI result in solver UI — "My Submissions" page shows `Approved` / `Rejected` badge; clicking shows a modal with AI score and rationale text
4. Surface AI result on Bounty Detail page — show recent submission statuses visible to any visitor (anonymized); show winner badge when bounty is won

**Requirements:**
- VERIFY-03: Auto-approve first submission that meets score threshold
- VERIFY-04: Auto-reject submissions below threshold
- VERIFY-05: Solver sees Approved/Rejected result with AI-generated rationale

**Success Criteria:**
1. Submitting a relevant solution auto-transitions it to "Approved" within ~5 seconds — no manual trigger needed
2. Submitting an irrelevant solution auto-transitions it to "Rejected" with visible rationale
3. After one submission is approved, all other pending submissions for that bounty become "Closed"
4. Solver can read the AI rationale from their submissions list

---

### Phase 6: Automated Payouts & Refunds

**Goal:** Bridge AI approval to the Algorand smart contract — automatically release ALGO to the winner, auto-refund the poster when deadlines pass, and show transaction confirmations.
**Depends on:** Phase 5, Phase 1
**Est. Hours:** 8
**UI hint:** no

**Plans:**
1. Implement payout trigger — when Phase 5 marks a submission as approved and bounty as "won", backend calls `BountyEscrow.payout(winner_address)` via AlgoKit; store tx ID in MongoDB; update bounty `status: "paid"`
2. Implement expiry refund cron job — node-cron runs hourly, queries MongoDB for bounties past deadline with `status: "open"` (no winner), calls `BountyEscrow.refund()` for each, updates status to `"refunded"`
3. Auto-close submissions on payout — after payout completes, ensure all remaining `"pending"` submissions are set to `"closed"` (guard for edge cases from Phase 5 logic)
4. Winner confirmation UI — in "My Submissions", approved + paid submission shows Algorand tx ID with TestNet explorer link; solver sees ALGO credited

**Requirements:**
- PAYOUT-01: Smart contract auto-releases ALGO to solver on AI approval
- PAYOUT-02: Smart contract auto-refunds ALGO to poster when deadline passes with no winner
- PAYOUT-03: Winner sees on-screen Algorand transaction confirmation
- PAYOUT-04: All remaining submissions auto-closed after payout

**Success Criteria:**
1. ALGO appears in the winner's wallet within seconds of AI approval — verifiable on TestNet explorer
2. Running the cron job against an expired bounty transfers ALGO back to the poster wallet
3. Winner's submission shows a clickable TestNet tx link in the UI
4. All other submissions show "Closed" after payout is confirmed

---

### Phase 7: Poster Dashboard & UX Polish

**Goal:** Give posters complete visibility into their bounties and submissions, then harden the end-to-end demo for judges.
**Depends on:** Phase 6
**Est. Hours:** 6
**UI hint:** yes

**Plans:**
1. Build the Poster Dashboard — list all bounties posted by connected wallet with status chips (Open, Won, Expired, Refunded), ALGO amounts, and deadlines
2. Build submission viewer for posters — on each bounty card, expand to see all submissions received: solver address, text preview, URL, AI score, rationale, and which one won
3. End-to-end TestNet demo walkthrough — run the full flow (Create bounty → Submit solution → AI verifies → Smart contract pays → Poster sees result); fix any blocking issues
4. UX polish — add loading skeletons, error toasts, empty states ("No bounties yet", "No submissions"), responsive layout; verify all pages work on mobile viewport

**Requirements:**
- DASH-01: Poster views all their posted bounties with statuses (Open, Won, Expired, Refunded)
- DASH-02: Poster views all submissions received on each bounty
- DASH-03: Poster sees which submission won and the AI verification result

**Success Criteria:**
1. Poster sees all their bounties grouped/filtered by status with correct ALGO amounts
2. Poster can expand any bounty to see all submissions and identify the winner with AI rationale
3. The full demo loop (Create → Submit → Verify → Pay) runs cleanly on TestNet without errors or broken states
4. UI has no blank page, crash, or unhandled error during the demo flow

---

## Traceability

| REQ-ID | Phase |
|--------|-------|
| BOUNTY-02 | 1 |
| WALLET-01 | 2 |
| WALLET-02 | 2 |
| WALLET-03 | 2 |
| BOUNTY-01 | 2 |
| BOUNTY-03 | 2 |
| BOUNTY-04 | 2 |
| BOUNTY-05 | 2 |
| DISCOVER-01 | 2 |
| DISCOVER-02 | 2 |
| DISCOVER-03 | 2 |
| DISCOVER-04 | 2 |
| SUBMIT-01 | 3 |
| SUBMIT-02 | 3 |
| SUBMIT-03 | 3 |
| SUBMIT-04 | 3 |
| VERIFY-01 | 4 |
| VERIFY-02 | 4 |
| VERIFY-03 | 5 |
| VERIFY-04 | 5 |
| VERIFY-05 | 5 |
| PAYOUT-01 | 6 |
| PAYOUT-02 | 6 |
| PAYOUT-03 | 6 |
| PAYOUT-04 | 6 |
| DASH-01 | 7 |
| DASH-02 | 7 |
| DASH-03 | 7 |
