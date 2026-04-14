# BountyChain

## What This Is

A decentralized micro-bounty dApp on Algorand that enables trustless task verification and instant blockchain payouts. Users or AI agents post small tasks with ALGO rewards locked in smart contract escrow. Solvers submit solutions, an AI verifier (Gemini API) evaluates them semantically, and if approved the smart contract automatically releases payment — no intermediaries, no commission, no delays.

Built as a hackathon MVP in 48 hours targeting Algorand TestNet.

## Core Value

**AI verification + autonomous smart contract escrow payout working together.** This is the judge-facing differentiator: a solver submits a solution, Gemini evaluates it against the bounty description, and the Algorand smart contract releases ALGO — all without a human intermediary. Everything else supports this loop.

## Context

- **Stage:** Hackathon MVP (48-hour build, team project)
- **Network:** Algorand TestNet
- **Smart Contracts:** Puya TS via AlgoKit
- **Frontend:** Next.js
- **Backend:** Express.js + MongoDB
- **AI:** Gemini API (semantic relevance scoring + URL/link existence validation)
- **Wallet Auth:** Algorand wallet (Pera Wallet) — sole identity, no username/password
- **Timeline Constraint:** 48 hours forces ruthless prioritization. Core loop (create → submit → verify → pay) must work end-to-end. Polish is secondary.

## Target Users

1. **Student developers** — seeking small freelance tasks to build portfolio
2. **Freelancers** — doing micro gigs without platform commissions
3. **AI agents** — posting autonomous tasks as part of agentic commerce workflows
4. **Startups** — needing quick, small technical tasks solved cheaply

## Requirements

### Validated

*(None yet — ship to validate)*

### Active

**Wallet & Identity**
- [ ] User can connect Algorand wallet (Pera Wallet) to authenticate
- [ ] User identity is their wallet address (no username/password)
- [ ] User has a basic reputation profile: total bounties completed + total ALGO earned

**Bounty Management**
- [ ] Poster can create a bounty with: title, description, category, ALGO reward (1–100), deadline
- [ ] Bounty reward is locked in Algorand smart contract escrow on creation
- [ ] Categories: Frontend, Backend, Smart Contracts, Data Tasks, General
- [ ] Default bounty deadline is 7 days; poster can set a custom deadline
- [ ] Bounties are listed publicly for any solver to view

**Solution Submission**
- [ ] Solver can submit a solution to any open bounty (text explanation + optional GitHub/URL)
- [ ] Multiple solvers may submit solutions to the same bounty
- [ ] Solver cannot submit to their own bounty

**AI Verification**
- [ ] On submission, Gemini API performs hybrid verification:
  - Semantic relevance scoring of solution text vs. bounty description
  - Validation that GitHub repo or URL (if provided) resolves/exists
- [ ] AI decision is final — no appeal mechanism in MVP
- [ ] First AI-approved submission wins; remaining open submissions auto-close

**Payout & Refunds**
- [ ] On AI approval, Algorand smart contract automatically releases ALGO to solver
- [ ] If bounty deadline passes with no approved submission, smart contract refunds ALGO to poster
- [ ] Remaining submissions after a payout are auto-closed

**Browsing & Discovery**
- [ ] Public bounty board shows all open bounties with category, reward, deadline
- [ ] User can view their own posted bounties and their statuses
- [ ] User can view their own submitted solutions and their statuses

### Out of Scope (MVP)

- Human dispute / appeal system — AI decision is final for MVP
- Code execution sandbox — no sandboxed test running
- Username / profile system — wallet address is identity
- OAuth or social login — wallet-only auth
- Mainnet deployment — TestNet only
- Bounty editing after creation — immutable once posted
- Team / collaborative bounties — single solver wins
- Token rewards other than ALGO — ALGO only
- Mobile app — web only
- Email/push notifications — no notification system

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Gemini API for AI verification | Easy to integrate, sufficient semantic reasoning, free tier available | ✓ Chosen |
| Algorand + Puya TS + AlgoKit | Hackathon target chain; Puya TS is modern contract language | ✓ Chosen |
| Express.js backend | Simple REST API layer for Gemini calls + MongoDB ops; keeps frontend clean | ✓ Chosen |
| MongoDB | Flexible schema for bounty/solution data not stored on-chain; fast setup | ✓ Chosen |
| AI decision is final | Dispute system is too complex for 48-hour MVP; deferring to v2 | ✓ Decided |
| Wallet = identity | No auth complexity; aligns with Web3 UX norms | ✓ Decided |
| First approved submission wins | Simplest payout logic; fair for hackathon scope | ✓ Decided |
| 1–100 ALGO bounty range | Low floor encourages micro-tasks; ceiling limits escrow risk on TestNet | ✓ Decided |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-15 after initialization*
