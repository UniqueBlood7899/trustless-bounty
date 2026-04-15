import express from 'express'
import cors from 'cors'
import path from 'path'
import connectDB from './config/db'
import { errorHandler } from './middleware/errorHandler'
import bountiesRouter from './routes/bounties'
import submissionsRouter, { solverSubmissionsRouter } from './routes/submissions'
import verifyRouter from './routes/verify'

// Load env vars — dotenv/config is loaded via ts-node-dev -r or npm scripts
// When running directly: export NODE_ENV=development before running

const app = express()
const PORT = process.env.PORT ?? '4000'

// ============================
// Middleware
// ============================
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// ============================
// Health check
// ============================
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ============================
// API Routes
// ============================
// Bounty creation + fetch — Phase 1 (Plan 4)
app.use('/api/bounties', bountiesRouter)
app.use('/api/bounties/:id/submissions', submissionsRouter)
app.use('/api/submissions', solverSubmissionsRouter)
app.use('/api/verify', verifyRouter)

// ============================
// Error handler (must be last middleware)
// ============================
app.use(errorHandler)

// ============================
// Start server
// ============================
const start = async (): Promise<void> => {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`BountyChain backend running on port ${PORT}`)
    console.log(`Health: http://localhost:${PORT}/health`)
  })
}

start().catch(console.error)

export default app
