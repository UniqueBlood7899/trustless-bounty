import cron from 'node-cron'
import Bounty from '../models/Bounty'
import Submission from '../models/Submission'
import { refundBountyEscrow } from './algorandService'

/**
 * refundCron — runs every hour.
 * Finds open bounties past their deadline with no winner, triggers on-chain refund,
 * then updates MongoDB status to 'refunded'.
 */
export function startRefundCron(): void {
  // Run every hour at :00
  cron.schedule('0 * * * *', async () => {
    console.log('[refundCron] Checking for expired bounties...')
    try {
      const now = new Date()
      const expired = await Bounty.find({
        status: 'open',
        deadline: { $lte: now },
      }).lean()

      if (expired.length === 0) {
        console.log('[refundCron] No expired bounties found')
        return
      }

      console.log(`[refundCron] Found ${expired.length} expired bounty/ies`)

      for (const bounty of expired) {
        try {
          // Call smart contract refund
          const { txId } = await refundBountyEscrow(bounty.appId)

          // Update bounty status and close any pending submissions
          await Promise.all([
            Bounty.findByIdAndUpdate(bounty._id, { status: 'refunded', payoutTxId: txId }),
            Submission.updateMany(
              { bountyId: bounty._id.toString(), status: 'pending' },
              { status: 'closed' }
            ),
          ])

          console.log(`[refundCron] Refunded bounty ${bounty._id} — tx: ${txId}`)
        } catch (err) {
          console.error(`[refundCron] Failed to refund bounty ${bounty._id}:`, err)
          // Mark as expired in MongoDB so it doesn't retry indefinitely on repeated errors
          await Bounty.findByIdAndUpdate(bounty._id, { status: 'expired' }).catch(() => {})
        }
      }
    } catch (err) {
      console.error('[refundCron] Cron job error:', err)
    }
  })

  console.log('[refundCron] Hourly refund cron started')
}
