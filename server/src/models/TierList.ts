import mongoose, { Schema, type Document } from 'mongoose'

// ─── Sub-schemas ────────────────────────────────────────────────────

const TierItemSubSchema = new Schema(
  {
    id: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    label: { type: String, required: true },
  },
  { _id: false, id: false },
)

const TierRowSubSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    color: { type: String, required: true },
    items: { type: [TierItemSubSchema], default: [] },
  },
  { _id: false, id: false },
)

// ─── Main schema ────────────────────────────────────────────────────

export interface TierListDocument extends Document {
  roomId: string
  title: string
  rows: {
    id: string
    label: string
    color: string
    items: { id: string; imageUrl: string; label: string }[]
  }[]
  pool: { id: string; imageUrl: string; label: string }[]
  ownerId: string
  isLocked: boolean
  isFocusMode: boolean
  isPublic: boolean
  downloads: number
  category: string
  authorId: string
  coverImage: string
  createdAt: Date
  updatedAt: Date
}

const TierListSchema = new Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, maxlength: 100 },
    rows: { type: [TierRowSubSchema], default: [] },
    pool: { type: [TierItemSubSchema], default: [] },
    ownerId: { type: String, required: true },
    isLocked: { type: Boolean, default: false },
    isFocusMode: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    downloads: { type: Number, default: 0 },
    category: { type: String, enum: ['Gaming', 'Food', 'Anime', 'Music', 'Movies', 'Sports', 'Other'], default: 'Other' },
    authorId: { type: String, default: '' },
    coverImage: { type: String, default: '' },
  },
  { timestamps: true },
)

export const TierListModel = mongoose.model<TierListDocument>('TierList', TierListSchema)
