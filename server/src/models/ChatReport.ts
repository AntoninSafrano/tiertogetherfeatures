import mongoose, { Schema, type Document } from 'mongoose'

export type ChatReportReason = 'harassment' | 'inappropriate' | 'spam' | 'other'
export type ChatReportStatus = 'pending' | 'resolved' | 'dismissed'

export interface ChatReportDocument extends Document {
  roomId: string
  messageId: string
  snapshotText: string
  snapshotUsername: string
  snapshotUserId: string
  reporterId: string
  reason: ChatReportReason
  details: string
  status: ChatReportStatus
  resolvedBy?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ChatReportSchema = new Schema(
  {
    roomId: { type: String, required: true, index: true },
    messageId: { type: String, required: true },
    snapshotText: { type: String, required: true, maxlength: 1000 },
    snapshotUsername: { type: String, required: true, maxlength: 80 },
    snapshotUserId: { type: String, required: true },
    reporterId: { type: String, required: true, index: true },
    reason: {
      type: String,
      enum: ['harassment', 'inappropriate', 'spam', 'other'],
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

ChatReportSchema.index({ reporterId: 1, messageId: 1 }, { unique: true })

export const ChatReportModel = mongoose.model<ChatReportDocument>('ChatReport', ChatReportSchema)
