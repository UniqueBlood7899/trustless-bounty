import mongoose, { Document, Schema } from 'mongoose'

export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'closed'

export interface ISubmission extends Document {
  bountyId: string
  solverAddress: string
  text: string
  url?: string | null
  status: SubmissionStatus
  aiScore?: number | null
  aiRationale?: string | null
  createdAt: Date
  updatedAt: Date
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    bountyId: { type: String, required: true, index: true },
    solverAddress: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 10000 },
    url: { type: String, default: null },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'closed'], default: 'pending' },
    aiScore: { type: Number, default: null },
    aiRationale: { type: String, default: null },
  },
  { timestamps: true }
)

SubmissionSchema.index({ solverAddress: 1, createdAt: -1 })
SubmissionSchema.index({ bountyId: 1, status: 1 })

export default mongoose.model<ISubmission>('Submission', SubmissionSchema)
