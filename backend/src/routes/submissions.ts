import { Router, Request, Response, NextFunction } from 'express'
import Bounty from '../models/Bounty'
import Submission from '../models/Submission'
import { verificationService } from '../services/verificationService'

const router = Router({ mergeParams: true })

/**
 * Async verification + first-approved-wins logic.
 * Called after submission is saved — does not block the HTTP response.
 */
async function runVerification(submissionId: string, bountyId: string): Promise<void> {
  try {
    const [bounty, submission] = await Promise.all([
      Bounty.findById(bountyId),
      Submission.findById(submissionId),
    ])
    if (!bounty || !submission || submission.status !== 'pending') return

    const result = await verificationService.verify(bounty.description, submission.text, submission.url ?? undefined)

    submission.aiScore = result.score
    submission.aiRationale = result.rationale
    submission.status = result.decision === 'approved' ? 'approved' : 'rejected'
    await submission.save()

    // First-approved-wins: if approved and bounty still open, close it
    if (result.decision === 'approved') {
      const freshBounty = await Bounty.findById(bountyId)
      if (freshBounty && freshBounty.status === 'open') {
        freshBounty.status = 'won'
        freshBounty.winnerSubmissionId = submissionId
        await freshBounty.save()
        // Close all other pending submissions for this bounty
        await Submission.updateMany(
          { bountyId, _id: { $ne: submissionId }, status: 'pending' },
          { status: 'closed' }
        )
      }
    }
  } catch (err) {
    console.error('[verification] Error processing submission:', submissionId, err)
    // Mark as rejected on error to avoid permanently pending
    await Submission.findByIdAndUpdate(submissionId, {
      status: 'rejected',
      aiRationale: 'Verification failed due to a system error. Please try again.',
    }).catch(() => {})
  }
}

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

    // Kick off async verification — don't await, respond immediately
    setImmediate(() => runVerification(submission._id.toString(), String(bountyId)))

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
