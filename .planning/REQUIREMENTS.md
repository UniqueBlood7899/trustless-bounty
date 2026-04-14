# Requirements — BountyChain v1

> Milestone 1 — Hackathon MVP (48 hours, Algorand TestNet)

## v1 Requirements

### Wallet & Auth (WALLET)

- [ ] **WALLET-01**: User can connect their Algorand wallet via Pera Wallet to authenticate with the app
- [ ] **WALLET-02**: User can view their connected wallet address and current ALGO balance in the UI
- [ ] **WALLET-03**: User can disconnect or switch their connected wallet

### Bounty Creation (BOUNTY)

- [ ] **BOUNTY-01**: Poster can create a bounty by specifying title, description, category, ALGO reward (1–100 ALGO), and deadline
- [ ] **BOUNTY-02**: Poster's ALGO reward is locked in Algorand smart contract escrow at the moment of bounty creation
- [ ] **BOUNTY-03**: Poster can select a category from: Frontend, Backend, Smart Contracts, Data Tasks, General
- [ ] **BOUNTY-04**: Poster can set a custom deadline; system defaults to 7 days if none is specified
- [ ] **BOUNTY-05**: Poster receives an on-screen confirmation showing the Algorand transaction ID after successful bounty creation

### Bounty Discovery (DISCOVER)

- [ ] **DISCOVER-01**: Any visitor can browse a public bounty board that lists all open bounties
- [ ] **DISCOVER-02**: User can filter the bounty board by category
- [ ] **DISCOVER-03**: User can sort bounties by: Newest, Highest Reward, Ending Soon
- [ ] **DISCOVER-04**: User can open an individual bounty detail page showing full description, reward, deadline, category, and poster address

### Solution Submission (SUBMIT)

- [ ] **SUBMIT-01**: Solver can submit a solution to an open bounty, providing a text explanation and optionally a GitHub repo link or deployed URL
- [ ] **SUBMIT-02**: System prevents a solver from submitting a solution to a bounty they posted
- [ ] **SUBMIT-03**: After submission, the solver sees a "Pending Verification" status while Gemini processes the solution
- [ ] **SUBMIT-04**: Solver can view a list of all their submitted solutions and the current status of each (pending, approved, rejected, closed)

### AI Verification (VERIFY)

- [ ] **VERIFY-01**: On submission, Gemini API performs semantic relevance scoring between the solver's explanation text and the bounty description
- [ ] **VERIFY-02**: System performs an HTTP HEAD request to validate that any submitted GitHub repo or URL resolves successfully
- [ ] **VERIFY-03**: If the first submission meets the acceptance score threshold, the system auto-approves it and triggers payout
- [ ] **VERIFY-04**: If a submission falls below the score threshold, it is auto-rejected
- [ ] **VERIFY-05**: Solver receives an on-screen result (Approved / Rejected) accompanied by a short AI-generated rationale

### Payout & Refunds (PAYOUT)

- [ ] **PAYOUT-01**: When AI approves a submission, the Algorand smart contract automatically releases the escrowed ALGO to the winning solver's wallet
- [ ] **PAYOUT-02**: When a bounty's deadline passes with no approved submission, the smart contract automatically refunds the escrowed ALGO to the poster's wallet
- [ ] **PAYOUT-03**: The winning solver receives on-screen Algorand transaction confirmation after payout
- [ ] **PAYOUT-04**: All remaining open submissions for a bounty are automatically closed once a winner is paid out

### Poster Dashboard (DASH)

- [ ] **DASH-01**: Poster can view all their posted bounties with their current status (Open, Won, Expired, Refunded)
- [ ] **DASH-02**: Poster can view all submissions received on each of their bounties
- [ ] **DASH-03**: Poster can see which submission was the winner and the AI verification result that led to payout

---

## v2 Requirements (Deferred)

- Basic reputation score (total bounties completed, total ALGO earned) — deferred, deprioritized for MVP
- Filter by reward amount on bounty board — deferred, low impact for MVP
- Human dispute / appeal system — significant complexity, deferred to v2
- Code execution sandbox for technical task verification — infrastructure complexity, deferred

---

## Out of Scope

- Username/profile system — wallet address is identity; user accounts add auth complexity
- OAuth / social login — Web3 wallet is the auth primitive
- Mainnet deployment — TestNet only for hackathon
- Bounty editing after creation — smart contract immutability; would require complex state management
- Team/collaborative bounties — single solver winner model only
- ALGO-other-than-ALGO token rewards — ALGO native only; ASA support is v2
- Mobile app — web (Next.js) only
- Email/push notifications — no notification infrastructure for MVP

---

## Traceability

*(Filled by roadmapper)*

| REQ-ID | Phase |
|--------|-------|
| WALLET-01 | 2 |
| WALLET-02 | 2 |
| WALLET-03 | 2 |
| BOUNTY-01 | 1 |
| BOUNTY-02 | 1 |
| BOUNTY-03 | 1 |
| BOUNTY-04 | 1 |
| BOUNTY-05 | 1 |
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
