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

# Plan 4 — Backend API Routes + Algorand Service

## Goal
Implement the four backend API routes that the frontend will call, plus an AlgorandService that wraps AlgoKit calls (deploy bounty app, call payout, call refund). This connects MongoDB data storage with on-chain escrow operations.

## must_haves
- `POST /api/bounties` creates a Bounty in MongoDB AND deploys a BountyEscrow app on LocalNet, returns `{ bountyId, appId, txId }`
- `GET /api/bounties` returns all open bounties (filterable by category, sortable)
- `GET /api/bounties/:id` returns a single bounty by MongoDB ID
- `GET /api/bounties/:id/submissions` returns all submissions for a bounty
- AlgorandService can deploy a new escrow app and call payout/refund on an existing app
- Environment-aware: works on LocalNet (dev) and TestNet (demo)

---

## Tasks

<task id="4.1" name="Write AlgorandService to wrap AlgoKit contract calls">

<action>
Create `backend/src/services/algorandService.ts`:

```typescript
import algosdk from 'algosdk'
import * as algokit from '@algorandfoundation/algokit-utils'
import dotenv from 'dotenv'

dotenv.config()

// Network config
const network = process.env.ALGORAND_NETWORK || 'localnet'

function getAlgodClient(): algosdk.Algodv2 {
  if (network === 'localnet') {
    return algokit.getAlgoClient(algokit.getDefaultLocalNetConfig('algod'))
  }
  return new algosdk.Algodv2(
    process.env.ALGOD_TOKEN || '',
    process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
    process.env.ALGOD_PORT || ''
  )
}

function getServerAccount(): algosdk.Account {
  const mnemonic = process.env.SERVER_WALLET_MNEMONIC
  if (!mnemonic) throw new Error('SERVER_WALLET_MNEMONIC not set')
  return algosdk.mnemonicToSecretKey(mnemonic)
}

export interface DeployBountyResult {
  appId: number
  appAddress: string
  txId: string
}

/**
 * Deploy a new BountyEscrow app and lock ALGO as escrow.
 * Returns the app ID, app address, and creation transaction ID.
 */
export async function deployBountyEscrow(
  posterAddress: string,
  bountyMongoId: string,
  rewardMicroAlgo: number
): Promise<DeployBountyResult> {
  const algodClient = getAlgodClient()
  const serverAccount = getServerAccount()

  // Import the generated typed client
  // Path is relative — adjust if needed based on actual build output
  const { BountyEscrowClient } = await import(
    '../../contracts/smart_contracts/bounty_escrow/client'
  )

  const appClient = new BountyEscrowClient(
    { sender: serverAccount, resolveBy: 'id', id: 0 },
    algodClient
  )

  // Deploy the contract
  const { appId, appAddress } = await appClient.deploy({
    allowCreate: true,
  })

  // Call create() to initialize with poster, bounty ID, and reward
  // Send reward amount + minimum balance (0.1 ALGO) as payment
  const MIN_BALANCE_MICRO = 100_000 // 0.1 ALGO
  const totalAmount = rewardMicroAlgo + MIN_BALANCE_MICRO

  const txn = await appClient.create.create({
    poster: poster: { addr: posterAddress },
    bountyId: new Uint8Array(Buffer.from(bountyMongoId)),
    reward: BigInt(rewardMicroAlgo),
  }, {
    sendParams: {
      fee: algokit.microAlgos(2000), // cover inner txn fee
    },
    // Send payment with the transaction
    extraFee: algokit.microAlgos(totalAmount),
  })

  console.log(`✓ BountyEscrow deployed: appId=${appId}, txId=${txn.transaction.txID()}`)

  return {
    appId: Number(appId),
    appAddress,
    txId: txn.transaction.txID(),
  }
}

/**
 * Call payout() on an existing BountyEscrow app.
 * Releases ALGO to the winner's address.
 */
export async function payoutBountyEscrow(
  appId: number,
  winnerAddress: string
): Promise<string> {
  const algodClient = getAlgodClient()
  const serverAccount = getServerAccount()

  const { BountyEscrowClient } = await import(
    '../../contracts/smart_contracts/bounty_escrow/client'
  )

  const appClient = new BountyEscrowClient(
    { sender: serverAccount, resolveBy: 'id', id: appId },
    algodClient
  )

  const result = await appClient.payout({
    winner: { addr: winnerAddress },
  }, {
    sendParams: { fee: algokit.microAlgos(2000) },
  })

  const txId = result.transaction.txID()
  console.log(`✓ Payout sent to ${winnerAddress}: txId=${txId}`)
  return txId
}

/**
 * Call refund() on an existing BountyEscrow app.
 * Returns ALGO to the original poster.
 */
export async function refundBountyEscrow(appId: number): Promise<string> {
  const algodClient = getAlgodClient()
  const serverAccount = getServerAccount()

  const { BountyEscrowClient } = await import(
    '../../contracts/smart_contracts/bounty_escrow/client'
  )

  const appClient = new BountyEscrowClient(
    { sender: serverAccount, resolveBy: 'id', id: appId },
    algodClient
  )

  const result = await appClient.refund({}, {
    sendParams: { fee: algokit.microAlgos(2000) },
  })

  const txId = result.transaction.txID()
  console.log(`✓ Refund sent: txId=${txId}`)
  return txId
}
```

Note: The exact AlgoKit client API (method names, param shapes) may differ from the above. After generating the typed client in Plan 2, read `client.ts` and adjust the `appClient.create.create()` and `appClient.payout()` call signatures to match the actual generated API. The logic and intent stay the same.
</action>

<read_first>
- `contracts/smart_contracts/bounty_escrow/client.ts` (generated typed client — read actual method signatures)
- `backend/src/models/Bounty.ts` (check field names)
</read_first>

<acceptance_criteria>
- `backend/src/services/algorandService.ts` exists
- File exports `deployBountyEscrow`, `payoutBountyEscrow`, `refundBountyEscrow` functions
- File contains `process.env.SERVER_WALLET_MNEMONIC`
- File contains `process.env.ALGORAND_NETWORK` (environment-aware)
- File does NOT hardcode any mnemonic or private key
</acceptance_criteria>

</task>

<task id="4.2" name="Implement bounties REST API routes">

<action>
Create `backend/src/routes/bounties.ts`:

```typescript
import { Router, Request, Response, NextFunction } from 'express'
import Bounty from '../models/Bounty'
import Submission from '../models/Submission'
import { deployBountyEscrow } from '../services/algorandService'

const router = Router()

/**
 * POST /api/bounties
 * Create a new bounty — deploys escrow on Algorand and stores metadata in MongoDB.
 * Body: { title, description, category, rewardAlgo, deadline, posterAddress }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, category, rewardAlgo, deadline, posterAddress } = req.body

    // Validation
    if (!title || !description || !category || !rewardAlgo || !deadline || !posterAddress) {
      return res.status(400).json({ success: false, error: 'All fields are required' })
    }
    if (rewardAlgo < 1 || rewardAlgo > 100) {
      return res.status(400).json({ success: false, error: 'Reward must be between 1 and 100 ALGO' })
    }
    const validCategories = ['Frontend', 'Backend', 'Smart Contracts', 'Data Tasks', 'General']
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' })
    }

    const rewardMicroAlgo = Math.floor(rewardAlgo * 1_000_000)
    const deadlineDate = new Date(deadline)

    // Create a placeholder bounty first to get MongoDB ID
    const bounty = new Bounty({
      title: title.trim(),
      description: description.trim(),
      category,
      rewardMicroAlgo,
      rewardAlgo,
      deadline: deadlineDate,
      posterAddress,
      appId: 0,          // placeholder until deployed
      creationTxId: '',  // placeholder
      status: 'open',
    })
    await bounty.save()

    // Deploy Algorand escrow contract
    const { appId, txId } = await deployBountyEscrow(
      posterAddress,
      bounty._id.toString(),
      rewardMicroAlgo
    )

    // Update with actual contract data
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
    next(error)
  }
})

/**
 * GET /api/bounties
 * List all open bounties. Supports ?category= and ?sort=newest|reward|deadline
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, sort = 'newest', status = 'open' } = req.query

    const filter: Record<string, unknown> = {}
    if (status) filter.status = status
    if (category && category !== 'all') filter.category = category

    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 } // default: newest
    if (sort === 'reward') sortQuery = { rewardAlgo: -1 }
    if (sort === 'deadline') sortQuery = { deadline: 1 }

    const bounties = await Bounty.find(filter).sort(sortQuery).lean()

    return res.json({ success: true, data: bounties, count: bounties.length })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/bounties/:id
 * Get a single bounty by MongoDB ID.
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

/**
 * GET /api/bounties/:id/submissions
 * Get all submissions for a bounty.
 */
router.get('/:id/submissions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bounty = await Bounty.findById(req.params.id)
    if (!bounty) {
      return res.status(404).json({ success: false, error: 'Bounty not found' })
    }

    const submissions = await Submission.find({ bountyId: req.params.id })
      .sort({ createdAt: -1 })
      .lean()

    return res.json({ success: true, data: submissions, count: submissions.length })
  } catch (error) {
    next(error)
  }
})

export default router
```

Register routes in `backend/src/index.ts`. Find the `// app.use('/api/bounties', bountiesRouter)` comment and replace it with the real import + registration:

```typescript
// Add at top of index.ts imports:
import bountiesRouter from './routes/bounties'

// Add after health check route:
app.use('/api/bounties', bountiesRouter)
```
</action>

<read_first>
- `backend/src/index.ts` (find the placeholder comment for routes)
- `backend/src/models/Bounty.ts` (field names must match exactly)
- `backend/src/models/Submission.ts` (field names must match exactly)
- `backend/src/services/algorandService.ts` (function signatures)
</read_first>

<acceptance_criteria>
- `backend/src/routes/bounties.ts` exists
- File exports a router with routes for `POST /`, `GET /`, `GET /:id`, `GET /:id/submissions`
- File imports `deployBountyEscrow` from `../services/algorandService`
- `backend/src/index.ts` contains `app.use('/api/bounties', bountiesRouter)` (uncommented)
- `GET /api/bounties` responds with `{ success: true, data: [...], count: N }`
- `GET /api/bounties/invalid-id` responds with 404 and `{ success: false, error: 'Bounty not found' }`
- `POST /api/bounties` with missing fields responds with 400 and error message
</acceptance_criteria>

</task>

<task id="4.3" name="Smoke test all API routes">

<action>
With the backend running (`cd backend && npx ts-node src/index.ts`), test each route:

```bash
# Health check
curl -s http://localhost:4000/health

# List bounties (should return empty array initially)
curl -s http://localhost:4000/api/bounties | python3 -m json.tool

# GET non-existent bounty (should return 404)
curl -s http://localhost:4000/api/bounties/000000000000000000000000 | python3 -m json.tool

# POST a test bounty (adjust posterAddress to a valid Algorand address)
curl -s -X POST http://localhost:4000/api/bounties \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Bounty",
    "description": "Build a simple frontend component",
    "category": "Frontend",
    "rewardAlgo": 1,
    "deadline": "2026-04-22T00:00:00.000Z",
    "posterAddress": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ"
  }' | python3 -m json.tool
```

For the POST test, this will attempt to deploy a contract to LocalNet. If LocalNet is running and the server wallet is funded, it should return `bountyId`, `appId`, and `txId`. If LocalNet is not running yet, the test will fail with a connection error — that's acceptable; what matters is the route logic is correct and MongoDB I/O works.

Run `GET /api/bounties` again after POST to verify the bounty appears.
</action>

<read_first>
- `backend/src/routes/bounties.ts` (verify routes before testing)
</read_first>

<acceptance_criteria>
- `curl http://localhost:4000/health` returns `{"status":"ok",...}`
- `curl http://localhost:4000/api/bounties` returns `{"success":true,"data":[],"count":0}` (when empty)
- `curl http://localhost:4000/api/bounties/000000000000000000000000` returns 404 JSON response
- `POST /api/bounties` with valid body either succeeds (if LocalNet + wallet configured) or fails with a network error (NOT a JavaScript crash)
- No `UnhandledPromiseRejection` errors in backend console during testing
</acceptance_criteria>

</task>

---

## Verification

```bash
# Files exist
test -f backend/src/routes/bounties.ts && echo "OK: routes/bounties.ts"
test -f backend/src/services/algorandService.ts && echo "OK: algorandService.ts"

# Route registration in index.ts
grep -q "bountiesRouter" backend/src/index.ts && echo "OK: bountiesRouter registered"
grep -q "app.use('/api/bounties'" backend/src/index.ts && echo "OK: /api/bounties route mounted"

# No hardcoded secrets
grep -v "SERVER_WALLET_MNEMONIC" backend/src/services/algorandService.ts | grep -v "process.env" | grep -c "mnemonic\|private_key" | xargs -I{} test {} -eq 0 && echo "OK: no hardcoded secrets"

# Server starts and health responds
cd backend && npx ts-node src/index.ts &
BACKEND_PID=$!
sleep 4
curl -sf http://localhost:4000/health | grep -q "ok" && echo "OK: server health check"
curl -sf http://localhost:4000/api/bounties | grep -q "success" && echo "OK: GET /api/bounties works"
kill $BACKEND_PID 2>/dev/null
```
