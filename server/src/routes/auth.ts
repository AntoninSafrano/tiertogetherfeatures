import { Router } from 'express'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { Resend } from 'resend'
import type { Request, Response } from 'express'
import { UserModel } from '../models/User'
import { env } from '../config/env'

const router = Router()
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleEmail = profile.emails?.[0]?.value?.toLowerCase() || ''

        // First try to find by googleId
        let user = await UserModel.findOne({ googleId: profile.id })

        if (!user && googleEmail) {
          // Check if an email/password account exists with the same email
          user = await UserModel.findOne({ email: googleEmail })
          if (user) {
            // Link the Google account to the existing email account
            user.googleId = profile.id
            user.emailVerified = true
            user.avatar = user.avatar || profile.photos?.[0]?.value || ''
            user.verificationToken = undefined
            user.verificationTokenExpiresAt = undefined
            await user.save()
          }
        }

        if (!user) {
          user = await UserModel.create({
            googleId: profile.id,
            displayName: profile.displayName || 'User',
            avatar: profile.photos?.[0]?.value || '',
            email: googleEmail,
            emailVerified: true,
            authProvider: 'google',
          })
        }

        done(null, user)
      } catch (err) {
        done(err as Error)
      }
    },
  ),
)

function generateToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' })
}

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

// GET /auth/google
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
)

// GET /auth/google/callback
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req: Request, res: Response) => {
    const user = req.user as any
    const token = generateToken(user._id.toString())
    res.cookie('token', token, cookieOptions)
    res.redirect(env.CLIENT_URL)
  },
)

// POST /auth/register
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body

    if (!email || !password || !displayName) {
      res.status(400).json({ error: 'Email, password, and display name are required' })
      return
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' })
      return
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() })
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const verificationToken = crypto.randomInt(100000, 999999).toString()
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await UserModel.create({
      email: email.toLowerCase(),
      passwordHash,
      displayName: displayName.trim(),
      emailVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
      authProvider: 'email',
    })

    if (resend) {
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: email.toLowerCase(),
        subject: 'Verify your TierTogether account',
        html: `
          <h2>Welcome to TierTogether!</h2>
          <p>Your verification code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 8px; font-family: monospace;">${verificationToken}</h1>
          <p>This code expires in 24 hours.</p>
        `,
      })
    } else {
      console.log(`[Auth] Verification code for ${email}: ${verificationToken}`)
    }

    res.status(201).json({
      success: true,
      message: 'Account created. Check your email for the verification code.',
    })
  } catch (err) {
    console.error('[Auth] Register failed:', err)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// POST /auth/login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() })
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    if (!user.emailVerified) {
      res.status(403).json({ error: 'Email not verified', needsVerification: true })
      return
    }

    const token = generateToken(user._id.toString())
    res.cookie('token', token, cookieOptions)

    res.json({
      user: {
        id: user._id.toString(),
        displayName: user.displayName,
        avatar: user.avatar,
        email: user.email,
      },
    })
  } catch (err) {
    console.error('[Auth] Login failed:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

// POST /auth/verify-email
router.post('/auth/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body

    if (!email || !code) {
      res.status(400).json({ error: 'Email and verification code are required' })
      return
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() })
    if (!user) {
      res.status(404).json({ error: 'Account not found' })
      return
    }

    if (user.emailVerified) {
      res.status(400).json({ error: 'Email is already verified' })
      return
    }

    if (user.verificationToken !== code) {
      res.status(400).json({ error: 'Invalid verification code' })
      return
    }

    if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date()) {
      res.status(400).json({ error: 'Verification code has expired. Request a new one.' })
      return
    }

    user.emailVerified = true
    user.verificationToken = undefined
    user.verificationTokenExpiresAt = undefined
    await user.save()

    const token = generateToken(user._id.toString())
    res.cookie('token', token, cookieOptions)

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        displayName: user.displayName,
        avatar: user.avatar,
        email: user.email,
      },
    })
  } catch (err) {
    console.error('[Auth] Verify failed:', err)
    res.status(500).json({ error: 'Verification failed' })
  }
})

// POST /auth/resend-verification
router.post('/auth/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() })
    if (!user || user.emailVerified) {
      res.json({ success: true, message: 'If an account exists, a new code has been sent.' })
      return
    }

    const verificationToken = crypto.randomInt(100000, 999999).toString()
    user.verificationToken = verificationToken
    user.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await user.save()

    if (resend) {
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: email.toLowerCase(),
        subject: 'Your new TierTogether verification code',
        html: `
          <h2>New verification code</h2>
          <h1 style="font-size: 32px; letter-spacing: 8px; font-family: monospace;">${verificationToken}</h1>
          <p>This code expires in 24 hours.</p>
        `,
      })
    } else {
      console.log(`[Auth] New verification code for ${email}: ${verificationToken}`)
    }

    res.json({ success: true, message: 'If an account exists, a new code has been sent.' })
  } catch (err) {
    console.error('[Auth] Resend verification failed:', err)
    res.status(500).json({ error: 'Failed to resend verification' })
  }
})

// POST /auth/forgot-password
router.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() })
    if (!user || !user.passwordHash) {
      // Don't reveal whether account exists
      res.json({ success: true, message: 'If an account exists, a reset code has been sent.' })
      return
    }

    const resetToken = crypto.randomInt(100000, 999999).toString()
    user.resetToken = resetToken
    user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    await user.save()

    if (resend) {
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: email.toLowerCase(),
        subject: 'Reset your TierTogether password',
        html: `
          <h2>Password reset</h2>
          <p>Your reset code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 8px; font-family: monospace;">${resetToken}</h1>
          <p>This code expires in 1 hour.</p>
          <p>If you didn't request this, ignore this email.</p>
        `,
      })
    } else {
      console.log(`[Auth] Reset code for ${email}: ${resetToken}`)
    }

    res.json({ success: true, message: 'If an account exists, a reset code has been sent.' })
  } catch (err) {
    console.error('[Auth] Forgot password failed:', err)
    res.status(500).json({ error: 'Failed to send reset code' })
  }
})

// POST /auth/reset-password
router.post('/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body

    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, code, and new password are required' })
      return
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' })
      return
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() })
    if (!user) {
      res.status(404).json({ error: 'Account not found' })
      return
    }

    if (user.resetToken !== code) {
      res.status(400).json({ error: 'Invalid reset code' })
      return
    }

    if (user.resetTokenExpiresAt && user.resetTokenExpiresAt < new Date()) {
      res.status(400).json({ error: 'Reset code has expired. Request a new one.' })
      return
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12)
    user.resetToken = undefined
    user.resetTokenExpiresAt = undefined
    await user.save()

    const token = generateToken(user._id.toString())
    res.cookie('token', token, cookieOptions)

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        displayName: user.displayName,
        avatar: user.avatar,
        email: user.email,
      },
    })
  } catch (err) {
    console.error('[Auth] Reset password failed:', err)
    res.status(500).json({ error: 'Failed to reset password' })
  }
})

// GET /auth/me
router.get('/auth/me', async (req: Request, res: Response) => {
  const token = req.cookies?.token
  if (!token) {
    res.json({ user: null })
    return
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string }
    const user = await UserModel.findById(decoded.userId).select('-__v')
    if (!user) {
      res.json({ user: null })
      return
    }
    res.json({
      user: {
        id: user._id.toString(),
        displayName: user.displayName,
        avatar: user.avatar,
        email: user.email,
      },
    })
  } catch {
    res.json({ user: null })
  }
})

// POST /auth/logout
router.post('/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('token')
  res.json({ success: true })
})

export default router
