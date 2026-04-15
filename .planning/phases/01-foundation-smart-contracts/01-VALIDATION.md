---
phase: 1
slug: foundation-smart-contracts
status: active
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-14
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (contracts), jest (backend) |
| **Config file** | `contracts/projects/contracts/vitest.config.ts`, `backend/jest.config.js` |
| **Quick run command** | `npm run check-types` |
| **Full suite command** | `cd backend && npx jest && cd ../contracts/projects/contracts && npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run typecheck
- **After every plan wave:** Run `npx jest` / `npx vitest`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1.2 | 01 | 1 | N/A | — | N/A | unit | `npx vitest run contract.spec.ts` | ✅ | ✅ green |
| 2.1 | 02 | 2 | N/A | — | N/A | unit | `npx vitest run contract.spec.ts` | ✅ | ✅ green |
| 4.2 | 04 | 3 | N/A | — | N/A | integration | `npx jest bounties.spec.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. Vitest and Jest configurations along with test spec files have been initialized to fill gaps.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-14

## Validation Audit 2026-04-14
| Metric | Count |
|--------|-------|
| Gaps found | 3 |
| Resolved | 3 |
| Escalated | 0 |

## Validation Audit 2026-04-15
| Metric | Count |
|--------|-------|
| Re-run result | ✅ All green (6/6 tests) |
| Backend (Jest) | 3 passed |
| Contracts (Vitest) | 3 passed |
| Gaps | 0 remaining |
