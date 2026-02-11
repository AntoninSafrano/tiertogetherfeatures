import mongoose, { Schema, type Document } from 'mongoose'

export interface UserDocument extends Document {
  googleId: string
  displayName: string
  avatar: string
  email: string
  createdAt: Date
}

const UserSchema = new Schema(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    avatar: { type: String, default: '' },
    email: { type: String, required: true },
  },
  { timestamps: true },
)

export const UserModel = mongoose.model<UserDocument>('User', UserSchema)
