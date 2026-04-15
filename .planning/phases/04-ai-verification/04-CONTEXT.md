---
phase: 4
status: completed
---

# Phase 4 Context

## Locked Decisions
- **Gemini model:** `gemini-1.5-flash` — fast, low-latency, hackathon-friendly
- **Approval threshold:** Configurable via `VERIFY_THRESHOLD` env var, default `0.6`
- **URL validation:** HTTP HEAD request; penalize score by `0.2` if unreachable or absent
- **Architecture:** Standalone `VerificationService` class + `POST /verify` endpoint — no DB writes in this phase (Phase 5 wires it to submission flow)
- **SDK:** `@google/generative-ai` (Google's official Node.js SDK)
