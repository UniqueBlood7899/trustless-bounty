import mongoose, { Document, Schema } from 'mongoose'

export type BountyStatus = 'open' | 'won' | 'expired' | 'refunded'
export type BountyCategory =
  | 'Frontend'
  | 'Backend'
  | 'Smart Contracts'
  | 'Data Tasks'
  | 'General'

export interface IBounty extends Document {
  title: string
  description: string
  category: BountyCategory
  /** Reward in microALGO (1 ALGO = 1,000,000 microALGO) */
  rewardMicroAlgo: number
  /** Convenience field: rewardMicroAlgo / 1_000_000 */
  rewardAlgo: number
  deadline: Date
  /** Algorand wallet address of the bounty poster */
  posterAddress: string
  /** Algorand app ID of the deployed escrow contract */
  appId: number
  /** Transaction ID of the app creation transaction */
  creationTxId: string
  /** MongoDB ID of the winning submission (set when status = 'won') */
  winnerSubmissionId?: string | null
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
    rewardMicroAlgo: {
      type: Number,
      required: true,
      min: 1_000_000,
      max: 100_000_000,
    },
    rewardAlgo: { type: Number, required: true },
    deadline: { type: Date, required: true },
    posterAddress: { type: String, required: true },
    appId: { type: Number, required: true, default: 0 },
    creationTxId: { type: String, required: true, default: '' },
    winnerSubmissionId: { type: String, default: null },
    status: {
      type: String,
      enum: ['open', 'won', 'expired', 'refunded'],
      default: 'open',
    },
  },
  { timestamps: true }
)

// Indexes for efficient queries
BountySchema.index({ status: 1, deadline: 1 })
BountySchema.index({ posterAddress: 1 })
BountySchema.index({ category: 1, status: 1 })

export default mongoose.model<IBounty>('Bounty', BountySchema)
