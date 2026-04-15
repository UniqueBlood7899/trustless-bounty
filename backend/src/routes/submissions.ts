import { Router, Request, Response, NextFunction } from 'express'
import Bounty from '../models/Bounty'
import Submission from '../models/Submission'

const router = Router({ mergeParams: true })

/**
 * POST /api/bounties/:id/submissions
 * Body: { solverAddress, text, url? }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: bountyId } = req.params
    const { solverAddress, text, url } = req.body

    if (!solverAddress || !text?.trim()) {
      return res.status(400).json({ success: false, error: 'solverAddress and text are required' })
    }
    if (text.trim().length > 10000) {
      return res.status(400).json({ success: false, error: 'text must be 10000 characters or less' })
    }
    if (url && url.trim()) {
      try { new URL(url.trim()) } catch {
        return res.status(400).json({ success: false, error: 'url must be a valid URL' })
      }
    }

    const bounty = await Bounty.findById(bountyId)
    if (!bounty) return res.status(404).json({ success: false, error: 'Bounty not found' })
    if (bounty.status !== 'open') return res.status(400).json({ success: false, error: 'Bounty is not open' })
    if (bounty.posterAddress === solverAddress) {
      return res.status(403).json({ success: false, error: 'You cannot submit to your own bounty' })
    }

    const submission = new Submission({
      bountyId,
      solverAddress,
      text: text.trim(),
      url: url?.trim() || null,
      status: 'pending',
    })
    await submission.save()

    return res.status(201).json({ success: true, data: submission })
  } catch (error) { next(error) }
})

/**
 * GET /api/bounties/:id/submissions
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const submissions = await Submission.find({ bountyId: req.params.id }).sort({ createdAt: -1 }).lean()
    return res.json({ success: true, data: submissions })
  } catch (error) { next(error) }
})

export default router

/**
 * GET /api/submissions?solverAddress=XXX  (My Submissions page)
 */
export const solverSubmissionsRouter = Router()
solverSubmissionsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { solverAddress } = req.query
    if (!solverAddress || typeof solverAddress !== 'string') {
      return res.status(400).json({ success: false, error: 'solverAddress query param required' })
    }
    const submissions = await Submission.find({ solverAddress }).sort({ createdAt: -1 }).lean()
    const bountyIds = [...new Set(submissions.map(s => s.bountyId))]
    const bounties = await Bounty.find({ _id: { $in: bountyIds } }).select('title').lean()
    const titleMap = Object.fromEntries(bounties.map(b => [b._id.toString(), b.title]))
    const enriched = submissions.map(s => ({ ...s, bountyTitle: titleMap[s.bountyId] ?? 'Unknown' }))
    return res.json({ success: true, data: enriched })
  } catch (error) { next(error) }
})
