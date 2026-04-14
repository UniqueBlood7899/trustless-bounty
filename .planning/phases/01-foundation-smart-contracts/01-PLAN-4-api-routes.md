---
plan: 4
phase: 1
wave: 3
depends_on: [2, 3]
type: execute
autonomous: true
requirements: [BOUNTY-02]
files_modified:
  - backend/src/routes/bounties.ts
  - backend/src/services/algorandService.ts
  - backend/src/index.ts
---

# Plan 4 — Backend API Routes + Algorand Service (Phase 1 Scope)

## Goal
Implement the minimal Phase 1 API surface: `POST /api/bounties` (create + deploy escrow) and `GET /api/bounties/:id` (basic fetch). The `AlgorandService` only exposes `deployBountyEscrow` — payout and refund functions belong in Phase 6 and are intentionally excluded here.

Health check endpoint (`GET /health`) was set up in Plan 3 (index.ts) and needs no changes.

## must_haves
- `POST /api/bounties` creates a Bounty in MongoDB AND deploys a BountyEscrow app on LocalNet, returns `{ bountyId, appId, txId }`
- `GET /api/bounties/:id` returns a single bounty document by MongoDB ID
- `AlgorandService` exposes only `deployBountyEscrow` — no payout or refund functions in this phase
- Environment-aware: works on LocalNet (dev) and TestNet (demo) via `ALGORAND_NETWORK` env var
- No unhandled promise rejections in error paths

## Out of scope (deferred)
- `GET /api/bounties` — bounty board list → Phase 2 (frontend integration)
- `GET /api/bounties/:id/submissions` — submission listing → Phase 3
- `payoutBountyEscrow` / `refundBountyEscrow` — payout/refund triggers → Phase 6

---

## Tasks

<task id="4.1" name="Write AlgorandService with deployBountyEscrow only">

<action>
Create `backend/src/services/algorandService.ts` with ONLY the deploy function.
Payout and refund will be added later in Phase 6.

```typescript
import algosdk from 'algosdk'
import * as algokit from '@algorandfoundation/algokit-utils'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// Network config — 'localnet' for dev, 'testnet' for demo
const network = process.env.ALGORAND_NETWORK || 'localnet'

function getAlgodClient(): algosdk.Algodv2 {
  if (network === 'localnet') {
    return algokit.getAlgoClient(algokit.getDefaultLocalNetConfig('algod'))
  }
  // TestNet — use AlgoNode public endpoint (no auth required for TestNet)
  return new algosdk.Algodv2(
    process.env.ALGOD_TOKEN || '',
    process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
    process.env.ALGOD_PORT || ''
  )
}

function getServerAccount(): algosdk.Account {
  const mnemonic = process.env.SERVER_WALLET_MNEMONIC
  if (!mnemonic) throw new Error('SERVER_WALLET_MNEMONIC not set in .env')
  return algosdk.mnemonicToSecretKey(mnemonic)
}

export interface DeployBountyResult {
  appId: number
  appAddress: string
  txId: string
}

/**
 * Deploy a new BountyEscrow app and lock ALGO as escrow.
 * Called by POST /api/bounties.
 * Returns appId, appAddress, and creation txId.
 *
 * NOTE: payout() and refund() wrappers are NOT here — they belong in Phase 6.
 */
export async function deployBountyEscrow(
  posterAddress: string,
  bountyMongoId: string,
  rewardMicroAlgo: number
): Promise<DeployBountyResult> {
  const algodClient = getAlgodClient()
  const serverAccount = getServerAccount()

  // Import generated typed client from contracts build output
  // Adjust the import path if the compiled client lands elsewhere
  const { BountyEscrowClient } = await import(
    '../../contracts/smart_contracts/bounty_escrow/client'
  )

  const appClient = new BountyEscrowClient(
    { sender: serverAccount, resolveBy: 'id', id: 0 },
    algodClient
  )

  // Deploy the contract (creates a new Algorand app)
  const { appId, appAddress } = await appClient.deploy({ allowCreate: true })

  // Call create() to initialize state and fund escrow
  // Minimum app balance on Algorand = 0.1 ALGO (100_000 microALGO)
  const MIN_BALANCE_MICRO = 100_000
  const totalFundAmount = rewardMicroAlgo + MIN_BALANCE_MICRO

  // Note: exact AlgoKit v5/v6 client API may differ from below.
  // After generating client.ts in Plan 2, read it and adjust call signatures.
  // The intent: call create(poster, bountyId bytes, reward) and fund the app.
  const txn = await appClient.create.create(
    {
      poster: { addr: posterAddress },
      bountyId: new Uint8Array(Buffer.from(bountyMongoId)),
      reward: BigInt(rewardMicroAlgo),
    },
    {
      sendParams: { fee: algokit.microAlgos(2000) },
      // Fund the app account with reward + min balance
      extraFee: algokit.microAlgos(totalFundAmount),
    }
  )

  const txId = txn.transaction.txID()
  console.log(`✓ BountyEscrow deployed: appId=${appId}, txId=${txId}`)

  return {
    appId: Number(appId),
    appAddress,
    txId,
  }
}
```

**Important adjustment note:** The AlgoKit typed client API (especially `appClient.create.create()` call shape) depends on the version of algokit-utils and the generated client from Plan 2. After generating `client.ts`, read it to find the actual method names and parameter signatures, then adjust the call above accordingly. The logic (deploy app, call create with poster + bountyId + reward, fund) stays the same.
</action>

<read_first>
- `contracts/smart_contracts/bounty_escrow/client.ts` (generated typed client — read actual method signatures before writing calls)
- `backend/src/models/Bounty.ts` (verify field names: `rewardMicroAlgo`, `posterAddress`, etc.)
- `.env` (verify `SERVER_WALLET_MNEMONIC` and `ALGORAND_NETWORK` are set)
</read_first>

<acceptance_criteria>
- `backend/src/services/algorandService.ts` exists
- File exports `deployBountyEscrow` function
- File does NOT export `payoutBountyEscrow` or `refundBountyEscrow` (those are Phase 6)
- File contains `process.env.SERVER_WALLET_MNEMONIC` (no hardcoded key)
- File contains `process.env.ALGORAND_NETWORK` (environment-aware)
- File contains comment `// NOTE: payout() and refund() wrappers are NOT here — they belong in Phase 6`
- No mnemonic, private key, or secret hardcoded anywhere in the file
</acceptance_criteria>

</task>

<task id="4.2" name="Implement POST /api/bounties and GET /api/bounties/:id routes">

<action>
Create `backend/src/routes/bounties.ts` with only the two Phase 1 routes:

```typescript
import { Router, Request, Response, NextFunction } from 'express'
import Bounty from '../models/Bounty'
import { deployBountyEscrow } from '../services/algorandService'

const router = Router()

/**
 * POST /api/bounties
 * Create a new bounty — saves to MongoDB and deploys BountyEscrow on Algorand.
 *
 * Body (JSON):
 *   title: string           — bounty title (max 200 chars)
 *   description: string     — task description (max 5000 chars)
 *   category: string        — one of: Frontend | Backend | Smart Contracts | Data Tasks | General
 *   rewardAlgo: number      — reward in ALGO (1–100)
 *   deadline: string        — ISO 8601 date string (e.g. "2026-04-22T00:00:00.000Z")
 *   posterAddress: string   — Algorand wallet address of the bounty creator
 *
 * Response (201):
 *   { success: true, data: { bountyId, appId, txId, bounty } }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, category, rewardAlgo, deadline, posterAddress } = req.body

    // --- Input validation ---
    if (!title || !description || !category || !rewardAlgo || !deadline || !posterAddress) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: title, description, category, rewardAlgo, deadline, posterAddress',
      })
    }
    if (typeof rewardAlgo !== 'number' || rewardAlgo < 1 || rewardAlgo > 100) {
      return res.status(400).json({
        success: false,
        error: 'rewardAlgo must be a number between 1 and 100',
      })
    }
    const validCategories = ['Frontend', 'Backend', 'Smart Contracts', 'Data Tasks', 'General']
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `category must be one of: ${validCategories.join(', ')}`,
      })
    }
    const deadlineDate = new Date(deadline)
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'deadline must be a valid future ISO date string',
      })
    }

    const rewardMicroAlgo = Math.floor(rewardAlgo * 1_000_000)

    // --- Step 1: Save placeholder to MongoDB to get _id ---
    const bounty = new Bounty({
      title: title.trim(),
      description: description.trim(),
      category,
      rewardMicroAlgo,
      rewardAlgo,
      deadline: deadlineDate,
      posterAddress,
      appId: 0,         // placeholder — will be updated after contract deploy
      creationTxId: '', // placeholder
      status: 'open',
    })
    await bounty.save()

    // --- Step 2: Deploy Algorand escrow contract ---
    const { appId, txId } = await deployBountyEscrow(
      posterAddress,
      bounty._id.toString(),
      rewardMicroAlgo
    )

    // --- Step 3: Update bounce with real contract data ---
    bounty.appId = appId
    bounty.creationTxId = txId
    await bounty.save()

    return res.status(201).json({
      success: true,
      data: {
        bountyId: bounty._id,
        appId,
        txId,
        bounty,
      },
    })
  } catch (error) {
    next(error) // passed to errorHandler middleware
  }
})

/**
 * GET /api/bounties/:id
 * Fetch a single bounty by MongoDB ObjectId.
 *
 * Response (200): { success: true, data: bounty }
 * Response (404): { success: false, error: 'Bounty not found' }
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bounty = await Bounty.findById(req.params.id).lean()
    if (!bounty) {
      return res.status(404).json({ success: false, error: 'Bounty not found' })
    }
    return res.json({ success: true, data: bounty })
  } catch (error) {
    next(error)
  }
})

// GET / (list) and GET /:id/submissions are NOT implemented here.
// - GET /api/bounties (board listing) → Phase 2 (frontend integration)
// - GET /api/bounties/:id/submissions → Phase 3 (submission flow)

export default router
```

Register the router in `backend/src/index.ts`. Find the commented-out line:
```
// app.use('/api/bounties', bountiesRouter)
```
Replace with:
```typescript
import bountiesRouter from './routes/bounties'
// ...
app.use('/api/bounties', bountiesRouter)
```
</action>

<read_first>
- `backend/src/index.ts` (find the placeholder comment — add import at top and uncomment the route registration)
- `backend/src/models/Bounty.ts` (field names: `rewardMicroAlgo`, `rewardAlgo`, `posterAddress`, `appId`, `creationTxId`, `status`)
- `backend/src/services/algorandService.ts` (verify `deployBountyEscrow` signature matches what's called here)
</read_first>

<acceptance_criteria>
- `backend/src/routes/bounties.ts` exists
- File contains `router.post('/'` (bounty creation route)
- File contains `router.get('/:id'` (single bounty fetch)
- File does NOT contain `router.get('/'` at root (no list route in Phase 1)
- File does NOT contain `router.get('/:id/submissions'` (no submissions route)
- File contains comment noting GET / and /:id/submissions are deferred to Phase 2/3
- File imports `deployBountyEscrow` from `../services/algorandService`
- `backend/src/index.ts` contains `app.use('/api/bounties', bountiesRouter)` (uncommented)
</acceptance_criteria>

</task>

<task id="4.3" name="Smoke test Phase 1 API surface">

<action>
With the backend running (`cd backend && npx ts-node src/index.ts`), run these verification calls:

```bash
# 1. Health check (from Plan 3 — verify still works)
curl -s http://localhost:4000/health
# Expected: {"status":"ok","timestamp":"..."}

# 2. GET non-existent bounty (404 path)
curl -s http://localhost:4000/api/bounties/000000000000000000000000
# Expected: {"success":false,"error":"Bounty not found"}

# 3. POST with missing fields (400 validation)
curl -s -X POST http://localhost:4000/api/bounties \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}' | python3 -m json.tool
# Expected: {"success":false,"error":"All fields are required..."}

# 4. POST with invalid reward (400 validation)
curl -s -X POST http://localhost:4000/api/bounties \
  -H "Content-Type: application/json" \
  -d '{"title":"T","description":"D","category":"General","rewardAlgo":500,"deadline":"2026-04-22T00:00:00Z","posterAddress":"AAAA"}' | python3 -m json.tool
# Expected: {"success":false,"error":"rewardAlgo must be a number between 1 and 100"}

# 5. POST valid bounty (if LocalNet running + wallet funded → 201 with appId + txId)
curl -s -X POST http://localhost:4000/api/bounties \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build a React button component",
    "description": "Create a reusable Button component in React with TypeScript. Should support primary and secondary variants.",
    "category": "Frontend",
    "rewardAlgo": 1,
    "deadline": "2026-04-22T00:00:00.000Z",
    "posterAddress": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ"
  }' | python3 -m json.tool
# Expected if LocalNet running: {"success":true,"data":{"bountyId":"...","appId":N,"txId":"...","bounty":{...}}}
# Expected if LocalNet off: error from algorandService (NOT an unhandled crash)

# 6. GET the created bounty (use bountyId from step 5)
# curl -s http://localhost:4000/api/bounties/<bountyId-from-step-5>
```

Verify no `UnhandledPromiseRejection` in server logs during any of these calls.
</action>

<read_first>
- `backend/src/routes/bounties.ts` (the routes just created)
</read_first>

<acceptance_criteria>
- `GET /health` returns `{"status":"ok",...}`
- `GET /api/bounties/000000000000000000000000` returns 404 with `{"success":false,"error":"Bounty not found"}`
- `POST /api/bounties` with missing fields returns 400 with error message referencing missing fields
- `POST /api/bounties` with `rewardAlgo: 500` returns 400 with message `"rewardAlgo must be a number between 1 and 100"`
- `POST /api/bounties` with valid body does NOT crash the server (either succeeds or returns a handled network error)
- No `UnhandledPromiseRejection` warnings in terminal output
- `GET /api/bounties` (no ID) returns 404 (route not registered — this is intentional)
</acceptance_criteria>

</task>

---

## Verification

```bash
# Files exist
test -f backend/src/routes/bounties.ts && echo "OK: routes/bounties.ts"
test -f backend/src/services/algorandService.ts && echo "OK: algorandService.ts"

# Scope enforcement — list route NOT present
grep -q "router.get('/'," backend/src/routes/bounties.ts && echo "FAIL: list route present" || echo "OK: no list route (deferred)"
grep -q "submissions" backend/src/routes/bounties.ts && echo "FAIL: submissions route present" || echo "OK: no submissions route (deferred)"

# Payout/refund NOT exported
grep -q "payoutBountyEscrow\|refundBountyEscrow" backend/src/services/algorandService.ts && echo "FAIL: payout/refund in service" || echo "OK: no payout/refund (Phase 6)"

# Route registration
grep -q "app.use('/api/bounties'" backend/src/index.ts && echo "OK: /api/bounties mounted"

# No hardcoded secrets
grep -E "mnemonicToSecretKey\('[^']+'\)" backend/src/services/algorandService.ts && echo "FAIL: hardcoded mnemonic" || echo "OK: no hardcoded mnemonic"

# Server health + routes
cd backend && npx ts-node src/index.ts &
BACKEND_PID=$!
sleep 4
curl -sf http://localhost:4000/health | grep -q '"ok"' && echo "OK: health check"
curl -s http://localhost:4000/api/bounties/000000000000000000000000 | grep -q '"Bounty not found"' && echo "OK: 404 on missing bounty"
kill $BACKEND_PID 2>/dev/null
```
