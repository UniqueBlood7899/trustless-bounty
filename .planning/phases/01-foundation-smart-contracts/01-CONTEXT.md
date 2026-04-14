# Phase 1: Foundation & Smart Contracts — Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy the BountyEscrow smart contract to Algorand (LocalNet for dev, TestNet for demo) and stand up the Express.js + MongoDB backend API. **No frontend work in this phase.** The output is a deployable Puya TS contract and a working backend API that the frontend will call in Phase 2.

The contract must: lock ALGO escrow on creation, release ALGO to a winner address, refund ALGO to the poster. The backend must: deploy contracts, store bounty metadata in MongoDB, expose REST endpoints, and run an expiry cron job.
</domain>

<decisions>
## Implementation Decisions

### A — Contract Architecture
- **D-01:** Use **per-bounty Algorand Applications** — each `POST /bounties` creates a new Algorand app (smart contract). The app's own account holds the escrowed ALGO. The app ID is stored in MongoDB alongside bounty metadata.
- **D-02:** Each app is a fresh instance of the same BountyEscrow contract template — deploy once to get the ABI, then instantiate per bounty.

### B — Contract Authorization Model
- **D-03:** The backend server wallet deploys every bounty app — making it the **app creator**. Authorization on `payout()` and `refund()` uses the native Algorand check: `Txn.sender == Global.creator_address`. No extra authorization state needed inside the contract.
- **D-04:** The backend Express server holds the server wallet private key (env variable). It signs all contract calls (`create`, `payout`, `refund`). Frontend wallets never touch the contract directly in MVP.
- **D-05:** Poster co-sign / trustless release is explicitly **v2** — note this in comments and pitch. Not in MVP scope.

### C — Expiry / Refund Trigger
- **D-06:** Use `node-cron` in Express, running on schedule `* * * * *` (every 1 minute).
- **D-07:** Cron job logic: query MongoDB for bounties where `deadline < Date.now()` AND `status == "open"` (no winner). For each: call `BountyEscrow.refund()` via AlgoKit, update bounty status to `"refunded"` in MongoDB.
- **D-08:** 1-minute interval chosen deliberately for hackathon demo — judges can see automated refund in real time.

### D — Development Environment
- **D-09:** Use **AlgoKit LocalNet** for all development and testing iteration (Docker-based local Algorand node — fast, free, resettable).
- **D-10:** Final deployment to **Algorand TestNet** done before demo, with a smoke test verifying: deploy contract, lock ALGO, call payout, verify funds moved on TestNet explorer.
- **D-11:** AlgoKit project lives in a `contracts/` directory at the repo root. `algokit deploy` targets `localnet` during dev and `testnet` for final deploy.

### Agent's Discretion
- Exact Puya TS contract method signatures and ABI structure — planner can decide based on AlgoKit Puya TS examples
- MongoDB schema field naming conventions — follow Express/Mongoose best practices
- Whether to use AlgoKit's typed client generator (`algokit generate client`) or raw AlgodClient calls
- Whether backend cron job runs in the main Express process or a separate worker

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Algorand / Smart Contracts
- `.planning/REQUIREMENTS.md` §Bounty Creation (BOUNTY-01–05) — contract must enforce 1–100 ALGO range and category/deadline constraints
- `.planning/REQUIREMENTS.md` §Payout & Refunds (PAYOUT-01–04) — contract behavior on approval and expiry
- `.planning/PROJECT.md` §Key Decisions — per-bounty apps, backend server wallet, cron refund, LocalNet→TestNet

### External References
- AlgoKit Puya TS contract examples: https://github.com/algorandfoundation/algokit-puya-ts-starter
- Algorand TestNet faucet: https://bank.testnet.algorand.network/
- AlgoKit LocalNet setup: `algokit localnet start`

No project-internal ADRs yet — this is the first phase.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. No existing code to reuse.

### Established Patterns
- None established yet. Phase 1 sets the patterns that all subsequent phases follow.

### Integration Points
- Phase 2 (frontend) will call `POST /bounties` to create bounties. Backend must return `{ bountyId, appId, txId }` from this endpoint.
- Phase 5 (AI Integration) will call an internal `VerificationService` that then triggers the `payout()` call via the backend wallet. The contract's `payout(winner_address)` method must accept a target address parameter.
- Phase 6 (Cron/Payouts) extends the cron job from this phase to also handle the payout trigger path.
</code_context>

<specifics>
## Specific Ideas

- "The extra app creation cost is acceptable for hackathon scale" — poster pays ~0.1 ALGO per bounty creation on top of reward. This should be noted in UX (e.g., "creation fee: 0.1 ALGO" shown on the create bounty form in Phase 2).
- "Poster co-sign trustless release as a v2 decentralization upgrade" — include a `// TODO(v2): require poster co-signature for trustless payout` comment in the contract.
- Server wallet private key stored in Express `.env` as `SERVER_WALLET_MNEMONIC`. Never committed to git — add to `.gitignore`.
</specifics>

<deferred>
## Deferred Ideas

- Poster co-sign / trustless release — v2 decentralization upgrade, noted in pitch and contract comments
- On-chain scheduler for autonomous refunds (Algorand doesn't support this natively in MVP scope)
- Multi-sig authorization — v2 or later
- AVM box storage for bounty data (instead of MongoDB) — would allow fully on-chain state, deferred

None — discussion stayed cleanly within phase scope.
</deferred>

---

*Phase: 01-foundation-smart-contracts*
*Context gathered: 2026-04-15*
