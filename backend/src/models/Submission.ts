import mongoose, { Document, Schema } from 'mongoose'

export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'closed'

export interface ISubmission extends Document {
  bountyId: mongoose.Types.ObjectId
  /** Algorand wallet address of the solver */
  solverAddress: string
  /** Solver's written explanation of their solution */
  explanationText: string
  /** Optional: GitHub repo or deployed URL */
  submittedUrl?: string | null
  status: SubmissionStatus
  /** Gemini relevance score (0–1). Set after AI verification. */
  aiScore?: number | null
  /** AI-generated explanation of the score */
  aiRationale?: string | null
  /** Algorand transaction ID if payout was sent */
  payoutTxId?: string | null
  createdAt: Date
  updatedAt: Date
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    bountyId: { type: Schema.Types.ObjectId, ref: 'Bounty', required: true },
    solverAddress: { type: String, required: true },
    explanationText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
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

// Indexes for efficient queries
SubmissionSchema.index({ bountyId: 1, status: 1 })
SubmissionSchema.index({ solverAddress: 1 })

export default mongoose.model<ISubmission>('Submission', SubmissionSchema)
