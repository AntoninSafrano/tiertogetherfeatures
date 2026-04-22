import mongoose, { Schema, type Document } from 'mongoose'

export type ReportReason = 'inappropriate' | 'spam' | 'copyright' | 'duplicate' | 'other'
export type ReportStatus = 'pending' | 'resolved' | 'dismissed'

export interface ReportDocument extends Document {
  tierListId: string
  reporterId: string | null
  reason: ReportReason
  details: string
  status: ReportStatus
  resolvedBy?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ReportSchema = new Schema(
  {
    tierListId: { type: String, required: true, index: true },
    reporterId: { type: String, default: null },
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'copyright', 'duplicate', 'other'],
      required: true,
    },
    details: { type: String, default: '', maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending',
      index: true,
    },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
)

export const ReportModel = mongoose.model<ReportDocument>('Report', ReportSchema)
