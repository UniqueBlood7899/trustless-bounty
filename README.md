# ⬡ BountyChain

> **Trustless AI-Verified Micro-Bounties on Algorand**

BountyChain is a decentralized bounty platform that combines **Algorand smart contract escrow** with **Gemini AI verification** to enable fully autonomous task-and-pay workflows — no intermediaries, no commission, no delays.

**The core loop:**
1. Poster locks ALGO in a per-bounty smart contract escrow
2. Solver submits a text solution (+ optional GitHub URL)
3. Gemini 1.5 Flash semantically scores the solution against the task description
4. Score ≥ threshold → smart contract **automatically pays the winner**
5. Deadline passes with no winner → contract **automatically refunds the poster**

[![Algorand](https://img.shields.io/badge/Algorand-TestNet-00D4BA?style=flat-square&logo=algorand)](https://testnet.algoexplorer.io)
[![Gemini](https://img.shields.io/badge/Gemini-1.5%20Flash-4285F4?style=flat-square&logo=google)](https://aistudio.google.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)

---

## 🎬 Demo

> Post bounty → Submit solution → AI verifies (~3s) → ALGO paid on-chain → View on TestNet Explorer

Smart Contract App ID: `758868693` ([View on Lora](https://lora.algokit.io/testnet/application/758868693))

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Per-bounty escrow** | Each bounty deploys its own Algorand smart contract |
| **AI verification** | Gemini 1.5 Flash scores solutions 0–1 against task description |
| **URL validation** | HTTP HEAD check on submitted links; unreachable = -0.2 score penalty |
| **Instant payout** | Smart contract inner transaction fires automatically on approval |
| **First-approved-wins** | First passing submission wins; all others auto-closed |
| **Auto-refund cron** | Hourly job refunds poster if deadline passes with no winner |
| **Pera Wallet** | Full Pera Wallet Connect integration with session persistence |
| **Poster dashboard** | `/my-bounties` — view all bounties posted + every submission received |
| **Solver history** | `/my-submissions` — track all submissions with AI rationale + score |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                │
│  Board · Bounty Detail · Create · My Bounties · My Subs │
│                   Pera Wallet Connect                   │
└─────────────────────┬───────────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────────┐
│               Backend (Express + MongoDB)               │
│                                                         │
│  POST /api/bounties     → deploy BountyEscrow contract  │
│  POST /api/bounties/:id/submissions → save + verify     │
│  GET  /api/submissions  → solver history                │
│  GET  /api/bounties/my  → poster dashboard              │
│  POST /api/verify       → standalone verification       │
│                                                         │
│  VerificationService (Gemini Flash Model)               │
│  refundCron (node-cron, hourly)                         │
└──────┬──────────────────────────────────┬───────────────┘
       │ AlgoKit Utils                    │ Google AI SDK
┌──────▼──────────┐              ┌────────▼────────────────┐
│  Algorand       │              │  Gemini Flash Model     │
│  TestNet        │              │  Semantic scoring       │
│  BountyEscrow   │              │  0.0 – 1.0 score        │
│  Smart Contract │              │  Configurable threshold │
└─────────────────┘              └─────────────────────────┘
```

---

## 📁 Project Structure

```
.
├── contracts/                  # AlgoKit workspace
│   └── projects/contracts/
│       └── smart_contracts/
│           └── bounty_escrow/
│               ├── contract.algo.ts    # PuyaTS smart contract
│               └── contract.spec.ts   # Integration tests
├── backend/                    # Express.js API
│   └── src/
│       ├── models/             # Mongoose schemas (Bounty, Submission)
│       ├── routes/             # bounties, submissions, verify
│       ├── services/           # algorandService, verificationService, refundCron
│       └── contracts/          # Generated BountyEscrowClient (ARC-56)
└── frontend/                   # Next.js 14 App Router
    └── src/
        ├── app/                # Pages: /, /create, /bounty/[id], /my-bounties, /my-submissions
        ├── components/         # Navbar, CreateBountyForm, SubmitSolutionForm
        ├── context/            # WalletContext (Pera Wallet)
        └── lib/                # api.ts, algorand.ts helpers
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20
- MongoDB (local or Atlas)
- [Pera Wallet](https://perawallet.app/) mobile app
- [Gemini API key](https://aistudio.google.com/apikey) (free)
- Algorand TestNet wallet with ALGO ([fund here](https://dispenser.testnet.algorand.network))

### 1. Clone

```bash
git clone https://github.com/UniqueBlood7899/trustless-bounty.git
cd trustless-bounty
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env   # or create .env manually (see below)
npm run dev            # starts on port 4000
```

**`backend/.env`**
```env
MONGODB_URI=mongodb://localhost:27017/bountychain
PORT=4000
FRONTEND_URL=http://localhost:3000

# Get from https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Algorand network (localnet | testnet)
ALGORAND_NETWORK=testnet

# 25-word mnemonic of a TestNet wallet funded with ALGO
# This wallet deploys and signs all escrow contracts
SERVER_WALLET_MNEMONIC=word1 word2 ... word25

# Approval threshold (0.0–1.0)
VERIFY_THRESHOLD=0.6
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev            # starts on port 3000
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_ALGOD_URL=https://testnet-api.algonode.cloud
```

### 4. Open the app

Visit `http://localhost:3000` — connect Pera Wallet and start posting bounties.

---

## 🔐 Smart Contract

The `BountyEscrow` contract is written in **PuyaTS** (Algorand's TypeScript-to-AVM compiler) and compiled via AlgoKit.

**Key methods:**
```typescript
createApplication(rewardMicroAlgo: uint64, deadline: uint64): void
payout(winnerAccount: Account): void   // creator only, sends reward to winner
refund(): void                          // creator only, after deadline, returns funds
```

**Security:**
- Only the contract creator (backend server wallet) can call `payout` / `refund`
- Cannot pay twice or refund after payout (state guards)
- Deadline enforced on-chain via `Global.latestTimestamp`

**Deployed on TestNet:**
- App ID: `758868693`
- [View on Lora Explorer](https://lora.algokit.io/testnet/application/758868693)

---

## 🤖 AI Verification

The `VerificationService` uses **Gemini 1.5 Flash** to evaluate submissions:

```
Score 0.0 – 1.0  →  threshold (default 0.6)  →  approved / rejected
```

- **URL validation:** HTTP HEAD request to submitted links; unreachable URLs subtract 0.2 from score
- **Configurable threshold:** Set `VERIFY_THRESHOLD` in `.env` (default: `0.6`)
- **Async:** Does not block the HTTP response — solver gets `pending` instantly, result arrives in ~3–5s
- **Error handling:** On Gemini API failure, submission is marked `rejected` to avoid permanently pending state

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/bounties` | Create bounty + deploy escrow |
| `GET` | `/api/bounties` | List open bounties (filter, sort, paginate) |
| `GET` | `/api/bounties/my` | Poster's bounties with submissions |
| `GET` | `/api/bounties/:id` | Single bounty |
| `POST` | `/api/bounties/:id/submissions` | Submit solution (triggers async AI verify) |
| `GET` | `/api/bounties/:id/submissions` | List submissions for a bounty |
| `GET` | `/api/submissions` | Solver's submission history (`?solverAddress=`) |
| `POST` | `/api/verify` | Standalone verify endpoint (`{ bountyId, submissionId }`) |
| `GET` | `/health` | Health check |

---

## 🧪 Running Tests

```bash
# Smart contract tests (AlgoKit + Vitest)
cd contracts/projects/contracts
npm test

# Backend type check
cd backend
npx tsc --noEmit

# Frontend type check
cd frontend
npx tsc --noEmit
```

---

## 🌊 End-to-End Flow

```
1. Poster connects Pera Wallet → fills Create Bounty form
2. Backend deploys BountyEscrow on Algorand TestNet
3. Escrow funded with rewardALGO + 0.2 ALGO min balance
4. Bounty appears on the Board

5. Solver connects wallet → opens bounty → submits solution
6. Backend saves submission (status: pending) → responds 201 immediately
7. setImmediate() → VerificationService.verify() runs async
8. Gemini scores: 0.0–1.0 + URL check → decision: approved | rejected

9. If approved:
   → submission.status = 'approved'
   → bounty.status = 'won', winnerSubmissionId set
   → all other pending submissions → 'closed'
   → payoutBountyEscrow(appId, winnerAddress) called
   → BountyEscrow.payout() inner tx sends ALGO to winner
   → payoutTxId stored in MongoDB

10. If deadline passes (no winner):
    → refundCron (hourly) detects expired bounties
    → refundBountyEscrow(appId) called
    → bounty.status = 'refunded'
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contract | AlgoKit · PuyaTS · Algorand AVM |
| Blockchain | Algorand TestNet |
| AI Verification | Google Gemini 1.5 Flash |
| Backend | Express.js · TypeScript · MongoDB / Mongoose |
| Frontend | Next.js 14 (App Router) · Tailwind CSS |
| Wallet | Pera Wallet Connect (`@perawallet/connect`) |
| Scheduler | node-cron |
| Algorand SDK | `algosdk` · `@algorandfoundation/algokit-utils` |

---
