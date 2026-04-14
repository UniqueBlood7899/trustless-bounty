---
plan: 3
phase: 1
wave: 2
depends_on: [1]
type: execute
autonomous: true
files_modified:
  - backend/package.json
  - backend/src/index.ts
  - backend/src/config/db.ts
  - backend/src/models/Bounty.ts
  - backend/src/models/Submission.ts
  - backend/src/middleware/errorHandler.ts
  - backend/.env.example
---

# Plan 3 — Express.js Server + MongoDB Setup

## Goal
Stand up the Express.js backend server with MongoDB connection, define Bounty and Submission Mongoose schemas, and add essential middleware (CORS, JSON parsing, error handling). This is the data layer the frontend and AI verification will use.

## must_haves
- Express server starts on port from `.env` (default 4000) without errors
- MongoDB connects and logs confirmation on startup
- Bounty model persists a document with all required fields: title, description, category, reward, deadline, posterAddress, appId, txId, status
- Submission model persists a document with: bountyId, solverAddress, explanationText, submittedUrl, status, aiScore, aiRationale
- CORS allows requests from `http://localhost:3000` (Next.js dev server)
- Error handler returns JSON error responses (not HTML)

---

## Tasks

<task id="3.1" name="Initialize Express backend project">

<action>
Create the backend project in a `backend/` directory at the repo root:

```bash
mkdir -p backend/src/config backend/src/models backend/src/middleware backend/src/routes
```

Create `backend/package.json`:
```json
{
  "name": "bountychain-backend",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "algosdk": "^2.7.0",
    "@algorandfoundation/algokit-utils": "^5.0.0",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.0.0",
    "@types/node-cron": "^3.0.11",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0"
  }
}
```

Create `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Install dependencies:
```bash
cd backend && npm install
```
</action>

<read_first>
- (none — creating fresh)
</read_first>

<acceptance_criteria>
- `backend/package.json` exists and contains `"express"` and `"mongoose"` in dependencies
- `backend/package.json` contains `"node-cron"` in dependencies
- `backend/tsconfig.json` exists and contains `"outDir": "./dist"`
- `backend/node_modules/` directory exists (npm install succeeded)
- `backend/node_modules/express/` directory exists
</acceptance_criteria>

</task>

<task id="3.2" name="Write MongoDB connection config">

<action>
Create `backend/src/config/db.ts`:

```typescript
import mongoose from 'mongoose'

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment variables')
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      dbName: 'bountychain',
    })
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

export default connectDB
```
</action>

<read_first>
- `backend/package.json` (verify mongoose is installed)
</read_first>

<acceptance_criteria>
- `backend/src/config/db.ts` exists
- File contains `mongoose.connect(`
- File contains `process.env.MONGODB_URI`
- File exports `connectDB` as default
</acceptance_criteria>

</task>

<task id="3.3" name="Define Bounty and Submission Mongoose schemas">

<action>
Create `backend/src/models/Bounty.ts`:

```typescript
import mongoose, { Document, Schema } from 'mongoose'

export type BountyStatus = 'open' | 'won' | 'expired' | 'refunded'
export type BountyCategory = 'Frontend' | 'Backend' | 'Smart Contracts' | 'Data Tasks' | 'General'

export interface IBounty extends Document {
  title: string
  description: string
  category: BountyCategory
  rewardMicroAlgo: number        // reward in microALGO (1 ALGO = 1,000,000 microALGO)
  rewardAlgo: number             // convenience field: rewardMicroAlgo / 1_000_000
  deadline: Date
  posterAddress: string          // Algorand wallet address of poster
  appId: number                  // Algorand app ID of the escrow contract
  creationTxId: string           // tx ID of the app creation transaction
  winnerSubmissionId?: string    // MongoDB ID of the winning submission
  status: BountyStatus
  createdAt: Date
  updatedAt: Date
}

const BountySchema = new Schema<IBounty>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: {
      type: String,
      required: true,
      enum: ['Frontend', 'Backend', 'Smart Contracts', 'Data Tasks', 'General'],
    },
    rewardMicroAlgo: { type: Number, required: true, min: 1_000_000, max: 100_000_000 },
    rewardAlgo: { type: Number, required: true },
    deadline: { type: Date, required: true },
    posterAddress: { type: String, required: true },
    appId: { type: Number, required: true },
    creationTxId: { type: String, required: true },
    winnerSubmissionId: { type: String, default: null },
    status: {
      type: String,
      enum: ['open', 'won', 'expired', 'refunded'],
      default: 'open',
    },
  },
  { timestamps: true }
)

// Index for efficient queries
BountySchema.index({ status: 1, deadline: 1 })
BountySchema.index({ posterAddress: 1 })
BountySchema.index({ category: 1, status: 1 })

export default mongoose.model<IBounty>('Bounty', BountySchema)
```

Create `backend/src/models/Submission.ts`:

```typescript
import mongoose, { Document, Schema } from 'mongoose'

export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'closed'

export interface ISubmission extends Document {
  bountyId: mongoose.Types.ObjectId
  solverAddress: string          // Algorand wallet address of solver
  explanationText: string        // The solver's written explanation
  submittedUrl?: string          // Optional: GitHub repo or deployed URL
  status: SubmissionStatus
  aiScore?: number               // Gemini relevance score (0–1)
  aiRationale?: string           // Gemini explanation of the score
  payoutTxId?: string            // Algorand tx ID if payout was sent
  createdAt: Date
  updatedAt: Date
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    bountyId: { type: Schema.Types.ObjectId, ref: 'Bounty', required: true },
    solverAddress: { type: String, required: true },
    explanationText: { type: String, required: true, trim: true, maxlength: 10000 },
    submittedUrl: { type: String, trim: true, default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'closed'],
      default: 'pending',
    },
    aiScore: { type: Number, min: 0, max: 1, default: null },
    aiRationale: { type: String, default: null },
    payoutTxId: { type: String, default: null },
  },
  { timestamps: true }
)

// Index for efficient queries  
SubmissionSchema.index({ bountyId: 1, status: 1 })
SubmissionSchema.index({ solverAddress: 1 })

export default mongoose.model<ISubmission>('Submission', SubmissionSchema)
```
</action>

<read_first>
- `backend/src/config/db.ts` (check import patterns to stay consistent)
</read_first>

<acceptance_criteria>
- `backend/src/models/Bounty.ts` exists
- Bounty schema contains fields: `title`, `description`, `category`, `rewardMicroAlgo`, `rewardAlgo`, `deadline`, `posterAddress`, `appId`, `creationTxId`, `status`
- Bounty status enum contains: `'open'`, `'won'`, `'expired'`, `'refunded'`
- `backend/src/models/Submission.ts` exists
- Submission schema contains fields: `bountyId`, `solverAddress`, `explanationText`, `submittedUrl`, `status`, `aiScore`, `aiRationale`, `payoutTxId`
- Submission status enum contains: `'pending'`, `'approved'`, `'rejected'`, `'closed'`
</acceptance_criteria>

</task>

<task id="3.4" name="Write main Express server entry point with middleware">

<action>
Create `backend/src/middleware/errorHandler.ts`:

```typescript
import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  
  console.error(`[Error] ${statusCode}: ${message}`, err.stack)
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
```

Create `backend/src/index.ts`:

```typescript
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import connectDB from './config/db'
import { errorHandler } from './middleware/errorHandler'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes (will be added in Plan 4)
// app.use('/api/bounties', bountiesRouter)

// Error handler (must be last middleware)
app.use(errorHandler)

// Start server
const start = async () => {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`BountyChain backend running on port ${PORT}`)
  })
}

start().catch(console.error)

export default app
```
</action>

<read_first>
- `backend/src/config/db.ts`
- `backend/src/middleware/errorHandler.ts` (check before creating)
</read_first>

<acceptance_criteria>
- `backend/src/index.ts` exists
- File contains `cors({` with origin configuration
- File contains `app.get('/health'`
- File contains `app.use(errorHandler)`
- File imports `connectDB`
- `backend/src/middleware/errorHandler.ts` exists and exports `errorHandler`
- Running `cd backend && npx ts-node src/index.ts` starts server and logs `BountyChain backend running on port`
- `curl http://localhost:4000/health` returns `{"status":"ok",...}`
</acceptance_criteria>

</task>

---

## Verification

```bash
# Project structure
test -f backend/package.json && echo "OK: package.json"
test -f backend/tsconfig.json && echo "OK: tsconfig.json"
test -f backend/src/index.ts && echo "OK: index.ts"
test -f backend/src/config/db.ts && echo "OK: db.ts"
test -f backend/src/models/Bounty.ts && echo "OK: Bounty.ts"
test -f backend/src/models/Submission.ts && echo "OK: Submission.ts"
test -f backend/src/middleware/errorHandler.ts && echo "OK: errorHandler.ts"

# Schema fields
grep -q "rewardMicroAlgo" backend/src/models/Bounty.ts && echo "OK: rewardMicroAlgo field"
grep -q "aiScore" backend/src/models/Submission.ts && echo "OK: aiScore field"
grep -q "payoutTxId" backend/src/models/Submission.ts && echo "OK: payoutTxId field"

# Server starts (run in background, check health, then kill)
cd backend && npx ts-node src/index.ts &
sleep 3
curl -s http://localhost:4000/health | grep -q '"status":"ok"' && echo "OK: health check"
kill %1 2>/dev/null
```
