---
plan: 2
phase: 1
wave: 2
depends_on: [1]
type: execute
autonomous: true
requirements: [BOUNTY-02]
files_modified:
  - contracts/smart_contracts/bounty_escrow/contract.ts
  - contracts/smart_contracts/bounty_escrow/deploy.ts
  - contracts/smart_contracts/bounty_escrow/client.ts
---

# Plan 2 — BountyEscrow Smart Contract (Puya TS)

## Goal
Write, test, and deploy the BountyEscrow smart contract in Puya TypeScript. The contract must: lock ALGO on creation, release ALGO to a winner address, refund ALGO to the poster. Authorization uses `Txn.sender == Global.creatorAddress` — the backend server wallet is always the deployer/creator.

## must_haves
- Contract compiles without errors via `algokit compile`
- `create()` method locks the passed ALGO amount in the app account
- `payout(winner: Account)` releases all app ALGO to the winner (creator-only)
- `refund(poster: Account)` returns all app ALGO to the poster (creator-only)
- Contract deployed to LocalNet and app ID captured
- ABI JSON and typed client generated via `algokit generate client`

---

## Tasks

<task id="2.1" name="Write BountyEscrow contract in Puya TypeScript">

<action>
Create `contracts/smart_contracts/bounty_escrow/contract.ts` with the following Puya TS contract:

```typescript
import {
  Contract,
  GlobalState,
  Account,
  uint64,
  Bytes,
  itxn,
  Global,
  Txn,
  assert,
  op,
} from '@algorandfoundation/algorand-typescript'

export class BountyEscrow extends Contract {
  // Store poster's address and reward amount for reference
  poster = GlobalState<Account>()
  reward = GlobalState<uint64>()
  bountyId = GlobalState<Bytes>()
  isActive = GlobalState<boolean>()

  /**
   * Create the bounty escrow.
   * Called by the backend server wallet.
   * ALGO is sent along with this transaction as the escrow amount.
   * 
   * @param poster - The Algorand address of the bounty poster
   * @param bountyId - MongoDB bounty ID for reference (stored as bytes)
   * @param reward - The ALGO reward amount in microALGO
   */
  @abimethod({ onCreate: 'require' })
  create(poster: Account, bountyId: Bytes, reward: uint64): void {
    // Verify the creator (server wallet) is calling
    assert(Txn.sender === Global.creatorAddress, 'Only creator can initialize')
    // Verify sufficient ALGO was sent (reward + min balance buffer)
    assert(
      op.balance(Global.currentApplicationAddress) >= reward,
      'Insufficient ALGO sent for reward'
    )
    this.poster.value = poster
    this.reward.value = reward
    this.bountyId.value = bountyId
    this.isActive.value = true
  }

  /**
   * Release ALGO reward to the winner.
   * Only callable by the backend server wallet (app creator).
   * 
   * @param winner - The winning solver's Algorand address
   */
  @abimethod()
  payout(winner: Account): void {
    assert(Txn.sender === Global.creatorAddress, 'Only creator can trigger payout')
    assert(this.isActive.value, 'Bounty is no longer active')

    const amount = this.reward.value
    this.isActive.value = false

    // Send ALGO to the winner
    itxn.payment({
      receiver: winner,
      amount: amount,
      fee: 0,
    }).submit()
  }

  /**
   * Refund ALGO to the original poster (deadline expired, no winner).
   * Only callable by the backend server wallet (app creator).
   */
  @abimethod()
  refund(): void {
    assert(Txn.sender === Global.creatorAddress, 'Only creator can trigger refund')
    assert(this.isActive.value, 'Bounty is no longer active')

    const poster = this.poster.value
    const amount = this.reward.value
    this.isActive.value = false

    // Refund ALGO to the original poster
    itxn.payment({
      receiver: poster,
      amount: amount,
      fee: 0,
    }).submit()
  }

  /**
   * Read-only: get bounty state.
   */
  @abimethod({ readonly: true })
  getState(): readonly [Account, uint64, boolean] {
    return [this.poster.value, this.reward.value, this.isActive.value]
  }
}
```

Notes:
- `onCreate: 'require'` means `create()` must be called in the same transaction group that creates the app
- Inner transactions (itxn) send ALGO from the app account — this is the escrow release mechanism
- `fee: 0` on inner txns means the outer transaction covers fees (set outer fee to 2x min fee)
- If Puya TS API differs from above, adjust to match actual Puya TS v1 API while preserving the same logic
</action>

<read_first>
- `contracts/package.json` (check exact Puya TS version installed)
- `contracts/smart_contracts/` directory (check if any example contract exists to copy patterns from)
- Puya TS API reference: `node_modules/@algorandfoundation/algorand-typescript/README.md` (if exists)
</read_first>

<acceptance_criteria>
- `contracts/smart_contracts/bounty_escrow/contract.ts` exists
- File contains `class BountyEscrow extends Contract`
- File contains a method named `create` with `onCreate`
- File contains a method named `payout`
- File contains a method named `refund`
- File contains `assert(Txn.sender === Global.creatorAddress` (authorization check)
- File contains `itxn.payment` (inner transaction for ALGO release)
</acceptance_criteria>

</task>

<task id="2.2" name="Compile contract and verify output">

<action>
Compile the Puya TS contract using AlgoKit:

```bash
cd contracts
npx algokit compile smart_contracts/bounty_escrow/contract.ts
```

Or if using algokit project structure:
```bash
cd contracts
algokit project run build
```

Expected output files after compilation:
- `contracts/smart_contracts/bounty_escrow/BountyEscrow.approval.teal` (or `.arc32.json`)
- `contracts/smart_contracts/bounty_escrow/BountyEscrow.arc32.json` (ABI + contract spec)

If compilation fails due to Puya TS API differences, fix the contract code. Common fixes needed:
- Import paths may differ: check actual exports from `@algorandfoundation/algorand-typescript`
- `itxn.payment` syntax may be `itxn({ type: 'pay', ... })` — check actual API
- `@abimethod` decorator may have different import name

Generate typed client after successful compilation:
```bash
cd contracts
npx algokit generate client smart_contracts/bounty_escrow/BountyEscrow.arc32.json --output smart_contracts/bounty_escrow/client.ts
```
</action>

<read_first>
- `contracts/smart_contracts/bounty_escrow/contract.ts` (the contract just written)
- `contracts/node_modules/@algorandfoundation/algorand-typescript/package.json` (check version)
</read_first>

<acceptance_criteria>
- `cd contracts && npx algokit compile smart_contracts/bounty_escrow/contract.ts` exits with code 0
- File `contracts/smart_contracts/bounty_escrow/BountyEscrow.arc32.json` exists (or equivalent `.json` spec file)
- The ARC-32 JSON contains `"methods"` array with entries for `create`, `payout`, `refund`
- `contracts/smart_contracts/bounty_escrow/client.ts` exists (generated typed client)
</acceptance_criteria>

</task>

<task id="2.3" name="Write deployment script and deploy to LocalNet">

<action>
Create `contracts/smart_contracts/bounty_escrow/deploy.ts`:

```typescript
import algosdk from 'algosdk'
import * as algokit from '@algorandfoundation/algokit-utils'
import { BountyEscrowClient } from './client'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

async function deployBountyEscrow() {
  // Connect to network (localnet or testnet based on env)
  const network = process.env.ALGORAND_NETWORK || 'localnet'
  
  let algodClient: algosdk.Algodv2
  
  if (network === 'localnet') {
    algodClient = algokit.getAlgoClient(algokit.getDefaultLocalNetConfig('algod'))
  } else {
    // Testnet
    algodClient = new algosdk.Algodv2(
      process.env.ALGOD_TOKEN || '',
      process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
      process.env.ALGOD_PORT || ''
    )
  }

  // Load server wallet from mnemonic
  const mnemonic = process.env.SERVER_WALLET_MNEMONIC
  if (!mnemonic) throw new Error('SERVER_WALLET_MNEMONIC not set in .env')
  
  const serverAccount = algosdk.mnemonicToSecretKey(mnemonic)
  
  console.log(`Deploying BountyEscrow to ${network}...`)
  console.log(`Deployer (server wallet): ${serverAccount.addr}`)

  const appClient = new BountyEscrowClient(
    { sender: serverAccount, resolveBy: 'id', id: 0 },
    algodClient
  )

  // Deploy the contract
  const { appId, appAddress } = await appClient.deploy({
    allowCreate: true,
  })

  console.log(`✓ BountyEscrow deployed!`)
  console.log(`  App ID: ${appId}`)
  console.log(`  App Address: ${appAddress}`)
  
  return { appId, appAddress }
}

deployBountyEscrow().catch(console.error)
```

Install missing dependencies:
```bash
cd contracts && npm install @algorandfoundation/algokit-utils algosdk dotenv
```

Run deployment to LocalNet:
```bash
cd contracts && npx ts-node smart_contracts/bounty_escrow/deploy.ts
```

If LOCAL NET is running and `SERVER_WALLET_MNEMONIC` is set for a funded LocalNet account (get one from `algokit localnet explore` → grab an account mnemonic), the deployment should succeed and print the App ID.

**For LocalNet funded account:** Run `algokit localnet explore` or use the KMD default accounts:
```bash
# Get a funded LocalNet account mnemonic
algokit account list --network localnet 2>/dev/null || \
node -e "
const algosdk = require('algosdk');
// LocalNet default mnemonic for testing
const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon invest';
console.log('Test mnemonic (DO NOT USE IN PROD):', mnemonic);
"
```
</action>

<read_first>
- `contracts/smart_contracts/bounty_escrow/client.ts` (generated typed client — check actual exported class name)
- `.env` (check SERVER_WALLET_MNEMONIC is set)
</read_first>

<acceptance_criteria>
- `contracts/smart_contracts/bounty_escrow/deploy.ts` exists
- Running `cd contracts && npx ts-node smart_contracts/bounty_escrow/deploy.ts` prints `✓ BountyEscrow deployed!`
- Output includes `App ID:` with a non-zero integer
- Output includes `App Address:` with a valid Algorand address
</acceptance_criteria>

</task>

---

## Verification

Run after all tasks complete:
```bash
# Contract file exists
test -f contracts/smart_contracts/bounty_escrow/contract.ts && echo "OK: contract.ts"

# ARC-32 spec compiled
ls contracts/smart_contracts/bounty_escrow/*.json 2>/dev/null && echo "OK: ARC-32 JSON compiled"

# Typed client generated
test -f contracts/smart_contracts/bounty_escrow/client.ts && echo "OK: client.ts generated"

# deployment script exists
test -f contracts/smart_contracts/bounty_escrow/deploy.ts && echo "OK: deploy.ts"

# Contract has required methods
grep -q "payout" contracts/smart_contracts/bounty_escrow/contract.ts && echo "OK: payout method"
grep -q "refund" contracts/smart_contracts/bounty_escrow/contract.ts && echo "OK: refund method"
grep -q "creatorAddress" contracts/smart_contracts/bounty_escrow/contract.ts && echo "OK: creator auth"
```
