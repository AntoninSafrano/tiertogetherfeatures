import mongoose, { Schema, type Document } from 'mongoose'

export interface UserDocument extends Document {
  googleId?: string
  displayName: string
  avatar: string
  email: string
  passwordHash?: string
  emailVerified: boolean
  verificationToken?: string
  verificationTokenExpiresAt?: Date
  resetToken?: string
  resetTokenExpiresAt?: Date
  authProvider: 'google' | 'email'
  createdAt: Date
}

const UserSchema = new Schema(
  {
    googleId: { type: String, unique: true, sparse: true, index: true },
    displayName: { type: String, required: true },
    avatar: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiresAt: { type: Date },
    resetToken: { type: String },
    resetTokenExpiresAt: { type: Date },
    authProvider: { type: String, enum: ['google', 'email'], default: 'google' },
  },
  { timestamps: true },
)

export const UserModel = mongoose.model<UserDocument>('User', UserSchema)
