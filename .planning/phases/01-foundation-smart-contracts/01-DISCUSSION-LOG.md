# Phase 1: Foundation & Smart Contracts — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 01-foundation-smart-contracts
**Areas discussed:** Contract Architecture, Contract Authorization Model, Expiry/Refund Trigger, Development Environment

---

## A — Contract Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Per-bounty apps | Each bounty creates a new Algorand Application. ALGO locked in app's own account. Standard Algorand escrow pattern. | ✓ |
| Global contract | One deployed app manages all bounties via internal global/local state. Cheaper but riskier fund isolation. | |
| Per-bounty + factory | Factory contract deploys child escrow apps on demand. | |

**User's choice:** Per-bounty apps
**Notes:** "Clean isolation of funds per bounty is safer and easier to reason about. Auditability and payout/refund logic become simpler. The extra app creation cost is acceptable for hackathon scale."

---

## B — Contract Authorization Model

### Who signs payout/refund transactions?

| Option | Description | Selected |
|--------|-------------|----------|
| Backend server wallet | Backend-controlled Algorand account signs all contract calls. Fully automated AI→payout flow. | ✓ |
| Poster must co-sign | Poster's wallet required to approve payout/refund. Trustless but complex UX. | |
| Oracle/multisig | Multiple parties must sign. Strong guarantees but out of scope. | |

**User's choice:** Backend server wallet
**Notes:** "Automatic AI approval → payout flow is the priority. Backend-controlled signing keeps the system simple, fully automated, and demo-friendly. Poster co-sign positioned as v2 decentralization upgrade."

### How does the contract enforce authorization?

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcoded creator check | Contract stores deployer address, checks against it | |
| App creator = backend wallet | Backend deploys each app; `Txn.sender == Global.creator_address` handles auth natively | ✓ |
| Agent's discretion | Planner decides the Puya TS pattern | |

**User's choice:** App creator = backend wallet
**Notes:** "Avoids storing extra authorization state manually inside the contract. Clean, native to Algorand."

---

## C — Expiry / Refund Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Scheduled cron job | node-cron scans MongoDB for expired bounties, calls refund() automatically | ✓ |
| On-demand check | Refund logic runs on API call. Lazy evaluation. | |
| Manual "Claim Refund" | Poster-initiated button in UI | |

**User's choice:** Scheduled cron job
**Notes:** "Automatic refund behavior is important for demo credibility. Creates a clean autonomous escrow lifecycle."

### Cron frequency?

| Option | Selected |
|--------|----------|
| Every 5 minutes | |
| Every 1 minute | ✓ |
| Every hour | |

**User's choice:** Every 1 minute
**Notes:** "Fast refund turnaround for live demonstration. Lets judges immediately see automated refund behavior."

---

## D — Development Environment

| Option | Description | Selected |
|--------|-------------|----------|
| LocalNet → TestNet at end | AlgoKit LocalNet for dev iteration, TestNet deploy before demo | ✓ |
| TestNet throughout | Always on real network — slower, real ALGO costs | |
| LocalNet only | Skip TestNet — not demo-ready | |

**User's choice:** LocalNet → TestNet at end
**Notes:** "Rapid local iteration while developing smart contracts. LocalNet gives faster debugging and zero-cost testing. Final deployment and smoke testing on TestNet before demo."

---

## Agent's Discretion

- Exact Puya TS contract method signatures and ABI structure
- MongoDB schema field naming conventions
- Whether to use AlgoKit typed client generator or raw AlgodClient
- Whether cron job runs in main Express process or separate worker

## Deferred Ideas

- Poster co-sign / trustless release — v2
- On-chain scheduler for autonomous refunds
- Multi-sig authorization — v2
- AVM box storage instead of MongoDB — on-chain state, deferred
