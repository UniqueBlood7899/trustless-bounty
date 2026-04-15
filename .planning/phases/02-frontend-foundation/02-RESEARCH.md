# Phase 2 Research — Frontend Foundation

## Technology Decisions (From Context)

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS v3 with custom design tokens matching UI-SPEC
- **Wallet:** `@perawallet/connect` v1.x
- **State:** React Context for wallet state; SWR for data fetching
- **HTTP:** `axios` or `fetch` (native) for backend calls
- **Backend:** Express at `http://localhost:4000` (Phase 1)

## Key Integration Points

### Pera Wallet (`@perawallet/connect`)

```typescript
import PeraWalletConnect from '@perawallet/connect'
const peraWallet = new PeraWalletConnect()

// Connect
const accounts = await peraWallet.connect()
// accounts[0] is the active address

// Disconnect
peraWallet.disconnect()

// Reconnect on refresh
peraWallet.reconnectSession().then(accounts => { ... })

// Signing (Phase 6, not now — but integration hook needed)
peraWallet.signTransaction(txGroups)
```

- Uses a QR code / deep link flow via Algorand-standard modal
- Default modal styles can be overridden with `shouldShowSignTxnToast`
- Session persists in localStorage

### Algorand JS SDK (for balance)

```typescript
import algosdk from 'algosdk'
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '')
const accountInfo = await algodClient.accountInformation(address).do()
const balanceAlgo = Number(accountInfo.amount) / 1_000_000
```

Use `algonode.cloud` for TestNet (no API key needed, rate limited at ~100req/s).

### Backend API Contracts

```
GET  /api/bounties              → { success, data: IBounty[], total, page }  [Phase 2 — needs GET / route]
POST /api/bounties              → { success, data: { bountyId, appId, txId, bounty } }
GET  /api/bounties/:id          → { success, data: IBounty }
```

**Note:** The GET `/api/bounties` (list) route is deferred in Phase 1's code.  
Phase 2 Plan 1 MUST add `GET /api/bounties` to the backend router before building the board.

### Bounty Data Shape (from Bounty.ts)

```typescript
interface IBounty {
  _id: string
  title: string                // max 200
  description: string          // max 5000
  category: 'Frontend' | 'Backend' | 'Smart Contracts' | 'Data Tasks' | 'General'
  rewardMicroAlgo: number      // 1_000_000 – 100_000_000
  rewardAlgo: number           // convenience: microAlgo / 1e6
  deadline: string             // ISO date
  posterAddress: string        // Algorand address
  appId: number                // Escrow contract app ID
  creationTxId: string         // Algorand tx ID
  status: 'open' | 'won' | 'expired' | 'refunded'
  createdAt: string
  updatedAt: string
}
```

## Next.js 14 App Router Project Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout (navbar, providers, fonts)
│   ├── page.tsx             # Bounty Board (/)
│   ├── create/
│   │   └── page.tsx         # Bounty Creation Form (/create)
│   └── bounty/
│       └── [id]/
│           └── page.tsx     # Bounty Detail (/bounty/[id])
├── components/
│   ├── Navbar.tsx
│   ├── WalletPill.tsx
│   ├── BountyCard.tsx
│   ├── BountyCardSkeleton.tsx
│   ├── BountyGrid.tsx
│   ├── FilterBar.tsx
│   ├── CreateBountyForm.tsx
│   ├── ConfirmationOverlay.tsx
│   ├── Toast.tsx
│   └── EmptyState.tsx
├── hooks/
│   ├── useWallet.ts         # Pera wallet connect/disconnect/reconnect
│   └── useBounties.ts       # SWR-based board data fetching
├── context/
│   └── WalletContext.tsx    # Global wallet state
├── lib/
│   ├── api.ts               # Backend fetch helpers
│   └── algorand.ts          # algodClient for balance
├── styles/
│   └── globals.css          # Design tokens + Tailwind base
└── public/
    └── empty-state.svg      # Empty board illustration
```

## Glassmorphism with Tailwind

Tailwind doesn't include `backdrop-blur` by default in older versions. In Tailwind v3:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'algo-teal': '#00D4BA',
        'algo-teal-dim': 'rgba(0,212,186,0.15)',
        'surface': 'rgba(255,255,255,0.05)',
        'border-glass': 'rgba(255,255,255,0.08)',
        'bg-base': '#0A0E1A',
      },
      backdropBlur: {
        glass: '12px',
      }
    }
  }
}
```

Glass card class: `bg-white/5 backdrop-blur-[12px] border border-white/8 rounded-2xl`

## Validation Architecture

**Client-side:** React controlled form with real-time validation  
**Server-side:** Backend returns 400 with error field (already implemented in Phase 1)

Test files to create:
- `frontend/src/components/__tests__/BountyCard.test.tsx` — renders card data correctly
- `frontend/src/hooks/__tests__/useWallet.test.ts` — connect/disconnect state transitions
- `frontend/src/lib/__tests__/api.test.ts` — API fetch helpers return correct data shape

## External TestNet Explorer Link Pattern

```
https://testnet.algoexplorer.io/tx/{txId}
```
or  
```
https://testnet.explorer.perawallet.app/tx/{txId}
```

Use Pera explorer for better brand alignment.

## RESEARCH COMPLETE
