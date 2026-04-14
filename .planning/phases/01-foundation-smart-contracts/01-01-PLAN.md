---
plan: 1
phase: 1
wave: 1
depends_on: []
type: execute
autonomous: true
files_modified:
  - contracts/package.json
  - contracts/tsconfig.json
  - contracts/.algokit.toml
  - contracts/smart_contracts/bounty_escrow/contract.py
  - contracts/smart_contracts/bounty_escrow/__init__.py
  - contracts/smart_contracts/__init__.py
  - contracts/deploy-config.ts
  - .gitignore
  - .env.example
---

# Plan 1 — AlgoKit Workspace Setup (Puya TS)

## Goal
Initialize an AlgoKit project with Puya TypeScript support, configure LocalNet and TestNet clients, and establish the deployment infrastructure so the smart contract can be written and deployed in Plan 2.

## must_haves
- AlgoKit project directory exists and `algokit bootstrap all` succeeds
- Puya TS dependency is installed and `algokit compile` resolves without errors
- AlgoKit client can connect to LocalNet (`algokit localnet start`)
- TestNet deployment script exists and is parameterizable via env vars
- Server wallet mnemonic loaded from `.env` (never hardcoded)

---

## Tasks

<task id="1.1" name="Initialize AlgoKit project with Puya TS">

<action>
Create the AlgoKit project in a `contracts/` directory at the repo root.

Run the following from the repo root:
```bash
mkdir -p contracts
cd contracts
algokit init --template-url https://github.com/algorandfoundation/algokit-puya-ts-starter.git --no-git --defaults
```

If the above template URL fails (network/version issues), fallback:
```bash
cd contracts
algokit init --name bounty-escrow --template puya-ts --no-git --defaults
```

After init, verify:
- `contracts/package.json` exists and has `@algorandfoundation/algorand-typescript` in dependencies
- `contracts/tsconfig.json` exists
- `contracts/.algokit.toml` exists with `[algokit]` section

Then install dependencies:
```bash
cd contracts && npm install
```
</action>

<read_first>
- AlgoKit docs: https://developer.algorand.org/docs/get-details/algokit/
- Puya TS README: https://github.com/algorandfoundation/puya-ts
</read_first>

<acceptance_criteria>
- `contracts/package.json` exists and contains `"@algorandfoundation/algorand-typescript"`
- `contracts/node_modules/` directory exists (npm install succeeded)
- `contracts/.algokit.toml` exists
- Running `cd contracts && npx algokit compile` exits without fatal errors (may warn about no contracts yet)
</acceptance_criteria>

</task>

<task id="1.2" name="Configure server wallet and environment">

<action>
Create `.env.example` at the repo root with the following variables. Never commit actual values.

```
# Algorand Network
ALGORAND_NETWORK=localnet
ALGOD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
ALGOD_SERVER=http://localhost
ALGOD_PORT=4001

# Server wallet (backend signer — base64 mnemonic of funded account)
SERVER_WALLET_MNEMONIC=

# MongoDB
MONGODB_URI=mongodb://localhost:27017/bountychain

# Port
PORT=4000
```

Create `.env` (copied from `.env.example`) for local dev. Add `.env` to `.gitignore`:
```
# Add to .gitignore
.env
contracts/.env
```

For LocalNet, `SERVER_WALLET_MNEMONIC` will be populated with a funded LocalNet account.
For TestNet, it will be a real TestNet account funded from the faucet: https://bank.testnet.algorand.network/
</action>

<read_first>
- `.gitignore` (check if it exists and what's already in it)
</read_first>

<acceptance_criteria>
- `.env.example` exists at repo root and contains `SERVER_WALLET_MNEMONIC=`
- `.env.example` contains `ALGOD_SERVER=http://localhost`
- `.gitignore` contains `.env` as a line
- `.env` is NOT tracked by git (`git status` shows it as untracked or ignored)
</acceptance_criteria>

</task>

<task id="1.3" name="Verify AlgoKit LocalNet connection">

<action>
Start AlgoKit LocalNet and verify the AlgoKit client can connect:

```bash
algokit localnet start
```

Then verify LocalNet is running:
```bash
algokit localnet status
```

Expected output includes: `algod: Running` and a port on 4001.

Create a minimal verification script at `contracts/scripts/verify-localnet.ts`:
```typescript
import algosdk from 'algosdk'

const algodClient = new algosdk.Algodv2(
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'http://localhost',
  4001
)

async function main() {
  const status = await algodClient.status().do()
  console.log('LocalNet connected. Round:', status['last-round'])
}

main().catch(console.error)
```

Run: `cd contracts && npx ts-node scripts/verify-localnet.ts`
</action>

<read_first>
- `contracts/package.json` (check if ts-node and algosdk are installed)
</read_first>

<acceptance_criteria>
- `algokit localnet status` output contains `algod: Running`
- `contracts/scripts/verify-localnet.ts` exists
- Running the script prints `LocalNet connected. Round:` followed by a number
- No connection errors in the output
</acceptance_criteria>

</task>

---

## Verification

Run after all tasks complete:
```bash
# AlgoKit project exists
test -f contracts/package.json && echo "OK: package.json"
test -f contracts/.algokit.toml && echo "OK: .algokit.toml"

# Dependencies installed
test -d contracts/node_modules && echo "OK: node_modules"

# .env.example has required vars
grep -q "SERVER_WALLET_MNEMONIC" .env.example && echo "OK: SERVER_WALLET_MNEMONIC in .env.example"
grep -q "MONGODB_URI" .env.example && echo "OK: MONGODB_URI in .env.example"

# .env is gitignored
grep -q "^.env" .gitignore && echo "OK: .env in .gitignore"

# LocalNet running
algokit localnet status | grep -q "algod: Running" && echo "OK: LocalNet running"
```
