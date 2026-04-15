import { Router, Request, Response, NextFunction } from 'express'
import Bounty from '../models/Bounty'
import Submission from '../models/Submission'
import { verificationService } from '../services/verificationService'

const router = Router()

/**
 * POST /api/verify
 * Body: { bountyId, submissionId }
 *
 * Runs AI verification for a submission against its bounty description.
 * Returns score, rationale, and decision — does NOT write to DB (Phase 5 wires that).
 *
 * Response (200): { success: true, data: { score, rationale, decision, urlReachable } }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bountyId, submissionId } = req.body

    if (!bountyId || !submissionId) {
      return res.status(400).json({ success: false, error: 'bountyId and submissionId are required' })
    }

    const [bounty, submission] = await Promise.all([
      Bounty.findById(bountyId).lean(),
      Submission.findById(submissionId).lean(),
    ])

    if (!bounty) return res.status(404).json({ success: false, error: 'Bounty not found' })
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' })
    if (submission.bountyId !== bountyId) {
      return res.status(400).json({ success: false, error: 'Submission does not belong to this bounty' })
    }

    const result = await verificationService.verify(
      bounty.description,
      submission.text,
      submission.url ?? undefined,
    )

    return res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
})

export default router
