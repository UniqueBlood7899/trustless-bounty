import { Router, Request, Response, NextFunction } from 'express'
import Bounty from '../models/Bounty'
import Submission from '../models/Submission'
import { deployBountyEscrow } from '../services/algorandService'

const router = Router()

/**
 * POST /api/bounties
 *
 * Create a new bounty:
 *  1. Validate all required fields.
 *  2. Save a placeholder document to MongoDB to get _id.
 *  3. Deploy BountyEscrow Algorand contract (locks ALGO in escrow).
 *  4. Update document with real appId + txId and return.
 *
 * Request body:
 *  { title, description, category, rewardAlgo, deadline, posterAddress }
 *
 * Response (201): { success: true, data: { bountyId, appId, txId, bounty } }
 * Response (400): { success: false, error: "..." }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, category, rewardAlgo, deadline, posterAddress } = req.body

    // --- Field presence validation ---
    if (!title || !description || !category || rewardAlgo == null || !deadline || !posterAddress) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: title, description, category, rewardAlgo, deadline, posterAddress',
      })
    }

    // --- Field type/range validation ---
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
      appId: 0,          // placeholder — updated after contract deploy
      creationTxId: 'pending',  // placeholder
      status: 'open',
    })
    await bounty.save()

    // --- Step 2: Deploy Algorand escrow contract ---
    const { appId, txId } = await deployBountyEscrow(
      posterAddress,
      bounty._id.toString(),
      rewardMicroAlgo,
    )

    // --- Step 3: Update bounty with real contract data ---
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
    next(error) // passed to global errorHandler middleware
  }
})

/**
 * GET /api/bounties/my?posterAddress=XXX
 * Returns all bounties posted by a wallet address with their submissions embedded.
 * Must be declared BEFORE /:id to avoid route conflict.
 */
router.get('/my', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { posterAddress } = req.query
    if (!posterAddress || typeof posterAddress !== 'string') {
      return res.status(400).json({ success: false, error: 'posterAddress query param required' })
    }
    const bounties = await Bounty.find({ posterAddress }).sort({ createdAt: -1 }).lean()
    const bountyIds = bounties.map(b => b._id.toString())
    const submissions = await Submission.find({ bountyId: { $in: bountyIds } }).sort({ createdAt: -1 }).lean()
    const subMap: Record<string, typeof submissions> = {}
    for (const s of submissions) {
      if (!subMap[s.bountyId]) subMap[s.bountyId] = []
      subMap[s.bountyId].push(s)
    }
    const data = bounties.map(b => ({ ...b, submissions: subMap[b._id.toString()] ?? [] }))
    return res.json({ success: true, data })
  } catch (error) { next(error) }
})

/**
 * GET /api/bounties
 * List open bounties. Query params: category, sort (newest|highest_reward|ending_soon), limit, page
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, sort = 'newest', limit = '20', page = '1' } = req.query
    const filter: Record<string, unknown> = { status: 'open' }
    if (category && typeof category === 'string') {
      const valid = ['Frontend', 'Backend', 'Smart Contracts', 'Data Tasks', 'General']
      if (!valid.includes(category)) return res.status(400).json({ success: false, error: `Invalid category: ${category}` })
      filter.category = category
    }
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      highest_reward: { rewardMicroAlgo: -1 },
      ending_soon: { deadline: 1 },
    }
    const sortQuery = sortMap[sort as string] ?? sortMap.newest
    const pageNum = Math.max(1, parseInt(page as string, 10))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)))
    const skip = (pageNum - 1) * limitNum
    const [data, total] = await Promise.all([
      Bounty.find(filter).sort(sortQuery).skip(skip).limit(limitNum).lean(),
      Bounty.countDocuments(filter),
    ])
    return res.json({ success: true, data, total, page: pageNum, limit: limitNum })
  } catch (error) { next(error) }
})

/**
 * GET /api/bounties/:id
 *
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

// ============================
// Deferred routes (not in Phase 1 scope)
// ============================
// GET /api/bounties (board listing) → Phase 2 (frontend integration)
// GET /api/bounties/:id/submissions → Phase 3 (submission flow)

export default router
