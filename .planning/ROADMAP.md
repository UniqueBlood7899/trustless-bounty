# BountyChain Roadmap — v1

> Milestone 1 — Hackathon MVP (Algorand TestNet, 48 hours)
> Generated: 2026-04-15
> Requirements: 23 v1 requirements across 7 categories

## Phases

| # | Phase | Goal | REQs | Est. Hours |
|---|-------|------|------|------------|
| 1 | Foundation & Smart Contracts | Deploy core escrow logic and backend infrastructure | BOUNTY-01–05 | 8 |
| 2 | Wallet & Discovery Board | Connect wallet and browse the bounty marketplace | WALLET-01–03, DISCOVER-01–04 | 6 |
| 3 | Submission & History | Enable solvers to submit solutions and track history | SUBMIT-01–04 | 6 |
| 4 | AI Verification Engine | Integrate Gemini for automatic solution validation | VERIFY-01–05 | 10 |
| 5 | Automated Payouts & Refunds | Bridge AI results to smart contract for trustless payouts | PAYOUT-01–04 | 8 |
| 6 | Poster Dashboard & UX Polish | Give posters full visibility and polish the end-to-end flow | DASH-01–03 | 6 |

**Total estimated hours:** 44

---

## Phase Details

### Phase 1: Foundation & Smart Contracts

**Goal:** Deploy the core escrow smart contract on Algorand TestNet and initialize the Express + MongoDB backend so bounties can be created with funds locked.
**Depends on:** None
**Est. Hours:** 8
**UI hint:** no

**Plans:**
1. Initialize AlgoKit workspace with Puya TS — set up smart contract project scaffolding, configure Algorand TestNet client
2. Develop, test, and deploy the BountyEscrow smart contract (create, lock funds, return state, refund/payout methods)
3. Set up Express.js server with MongoDB connection, define Bounty and Submission schemas
4. Implement backend API routes: `POST /bounties` (create + store metadata), `GET /bounties` (list), `GET /bounties/:id` (detail)

**Requirements:**
- BOUNTY-01: Poster can create a bounty with title, description, category, reward (1–100 ALGO), deadline
- BOUNTY-02: Reward locked in Algorand smart contract escrow at creation
- BOUNTY-03: Category selection (Frontend, Backend, Smart Contracts, Data Tasks, General)
- BOUNTY-04: Custom deadline with 7-day default
- BOUNTY-05: On-screen confirmation with Algorand transaction ID

**Success Criteria:**
1. A bounty can be created on TestNet with ALGO locked in an escrow smart contract app
2. Bounty metadata (title, description, category, deadline, app ID) is successfully stored in MongoDB
3. Backend API returns the list of bounties and individual bounty details correctly
4. AlgoKit deployment script targets TestNet without errors

---

### Phase 2: Wallet & Discovery Board

**Goal:** Allow users to authenticate via Pera Wallet and browse all open bounties on the public board with category filters and sorting.
**Depends on:** Phase 1
**Est. Hours:** 6
**UI hint:** yes

**Plans:**
1. Integrate `@perawallet/connect` into Next.js — build wallet connect/disconnect hook, display address and ALGO balance in navbar
2. Build the public Bounty Board page — fetch bounties from backend, render cards with title, reward, category, deadline
3. Implement category filter tabs and sort controls (Newest, Highest Reward, Ending Soon) on the board
4. Build the individual Bounty Detail page — full description, reward, deadline, category, poster address, and submit button (disabled if not connected)

**Requirements:**
- WALLET-01: User can connect Algorand wallet (Pera Wallet)
- WALLET-02: User can view connected wallet address and ALGO balance
- WALLET-03: User can disconnect or switch wallet
- DISCOVER-01: Public bounty board listing all open bounties
- DISCOVER-02: Filter by category
- DISCOVER-03: Sort by Newest, Highest Reward, Ending Soon
- DISCOVER-04: Individual bounty detail page

**Success Criteria:**
1. User can connect Pera Wallet and see their address + balance in the navbar
2. All bounties created in Phase 1 appear on the board with category badges, reward, and deadline
3. Category filter narrows the list correctly; sort order updates the board
4. Clicking a bounty opens its detail page with full information

---

### Phase 3: Submission & History

**Goal:** Enable solvers to submit a text + optional URL solution for any open bounty, with proper validation and a submission history view.
**Depends on:** Phase 2
**Est. Hours:** 6
**UI hint:** yes

**Plans:**
1. Build the submission form on the Bounty Detail page — text explanation field, optional GitHub/URL field, submit button
2. Implement backend route `POST /bounties/:id/submissions` — validate no self-submit, store submission in MongoDB with status "pending"
3. Build the "My Submissions" page — list solver's submissions with bounty title, submission date, and current status badge
4. Add "Pending Verification" UX state — poll or refresh submission status, show spinner/badge while awaiting AI result

**Requirements:**
- SUBMIT-01: Solver submits text explanation + optional GitHub/URL
- SUBMIT-02: System prevents solver from submitting to their own bounty
- SUBMIT-03: "Pending Verification" status shown while Gemini processes
- SUBMIT-04: Solver can view all their submitted solutions and statuses

**Success Criteria:**
1. A solver can submit a solution and immediately see it in "My Submissions" with status "Pending"
2. Attempting to submit to own bounty returns an error message in the UI
3. Submission form validates that text explanation is not empty
4. Submission is recorded in MongoDB with correct bounty ID, solver address, and timestamp

---

### Phase 4: AI Verification Engine

**Goal:** Integrate Gemini API to automatically score and validate each submission, auto-approving or rejecting with an AI-generated rationale shown in the UI.
**Depends on:** Phase 3
**Est. Hours:** 10
**UI hint:** no

**Plans:**
1. Integrate Gemini API (`gemini-pro`) into Express backend — create verification service with prompt template that compares solution text vs. bounty description and returns a relevance score (0–1) and rationale
2. Implement URL/GitHub link validation — perform HTTP HEAD request on submitted URL; treat unreachable URLs as a score penalty
3. Build verification trigger — `POST /submissions/:id/verify` endpoint that: calls Gemini, gets score, applies threshold logic (≥0.7 = approve, <0.7 = reject), updates submission status in MongoDB
4. Store AI score and rationale in submission document; update submission status to "approved" or "rejected"
5. Return AI result to frontend — update submission status badge on "My Submissions" page; show rationale tooltip/card on Bounty Detail page

**Requirements:**
- VERIFY-01: Gemini API semantic relevance scoring (solution vs. description)
- VERIFY-02: HTTP HEAD request to validate submitted GitHub/URL
- VERIFY-03: Auto-approve if score ≥ threshold
- VERIFY-04: Auto-reject if score < threshold
- VERIFY-05: Solver sees Approved/Rejected result with AI-generated rationale

**Success Criteria:**
1. Submitting a highly relevant solution results in "Approved" status within ~5 seconds
2. Submitting an obviously irrelevant solution results in "Rejected" with a meaningful rationale
3. A broken URL is flagged — score is penalized and rejection rationale mentions link failure
4. AI rationale is visible to the solver in the UI after verification

---

### Phase 5: Automated Payouts & Refunds

**Goal:** Bridge AI approval to the Algorand smart contract to automatically release ALGO to the winner and auto-refund the poster when a bounty expires with no winner.
**Depends on:** Phase 4, Phase 1
**Est. Hours:** 8
**UI hint:** no

**Plans:**
1. Implement payout trigger — when verification returns "approved", backend calls the BountyEscrow smart contract `payout(winner_address)` method via AlgoKit; record tx ID in MongoDB
2. Implement expiry refund — scheduled job (node-cron) runs hourly, finds bounties past deadline with no approved submission, calls `refund()` on the smart contract, updates bounty status to "refunded"
3. Auto-close logic — after payout, backend updates all remaining "pending" submissions for the same bounty to "closed"
4. Winner confirmation UI — on "My Submissions" page, approved + paid submission shows Algorand transaction ID with link to TestNet explorer

**Requirements:**
- PAYOUT-01: Smart contract auto-releases ALGO to solver on AI approval
- PAYOUT-02: Smart contract auto-refunds ALGO to poster when deadline passes with no approved submission
- PAYOUT-03: Winner sees on-screen Algorand transaction confirmation
- PAYOUT-04: All remaining submissions auto-closed after payout

**Success Criteria:**
1. ALGO is visibly transferred to the winner's wallet (observable on TestNet explorer) within seconds of AI approval
2. If no submission is approved before deadline, poster's ALGO returns to their wallet automatically
3. After payout, all other "pending" submissions for that bounty show "Closed"
4. Winner submission shows a clickable TestNet transaction link

---

### Phase 6: Poster Dashboard & UX Polish

**Goal:** Give posters full visibility into their bounties and submissions received, and polish the end-to-end user experience for the demo.
**Depends on:** Phase 5
**Est. Hours:** 6
**UI hint:** yes

**Plans:**
1. Build the Poster Dashboard — list all bounties posted by connected wallet with status chips (Open, Won, Expired, Refunded) and ALGO amounts
2. Implement submission viewer for posters — on each bounty card, show all submissions received with solver address, text preview, URL, and AI result (score + rationale)
3. End-to-end TestNet walkthrough — run full demo flow (create → submit → verify → payout), fix any blocking issues discovered
4. UX polish — loading states, error toasts, empty states, responsive layout, consistent styling

**Requirements:**
- DASH-01: Poster views all their posted bounties with statuses
- DASH-02: Poster views all submissions received on each bounty
- DASH-03: Poster sees which submission won and the AI verification result

**Success Criteria:**
1. Poster can see all their bounties grouped by status with ALGO amounts
2. Poster can expand a bounty to see all submissions, including which one was the winner and why
3. The full demo loop (Create → Submit → Verify → Payout) completes on TestNet without errors
4. UI has no blank/broken states during the demo flow

---

## Traceability

| REQ-ID | Phase |
|--------|-------|
| BOUNTY-01 | 1 |
| BOUNTY-02 | 1 |
| BOUNTY-03 | 1 |
| BOUNTY-04 | 1 |
| BOUNTY-05 | 1 |
| WALLET-01 | 2 |
| WALLET-02 | 2 |
| WALLET-03 | 2 |
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
| VERIFY-03 | 4 |
| VERIFY-04 | 4 |
| VERIFY-05 | 4 |
| PAYOUT-01 | 5 |
| PAYOUT-02 | 5 |
| PAYOUT-03 | 5 |
| PAYOUT-04 | 5 |
| DASH-01 | 6 |
| DASH-02 | 6 |
| DASH-03 | 6 |
