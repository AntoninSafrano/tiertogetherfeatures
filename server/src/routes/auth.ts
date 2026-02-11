import { Router } from 'express'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import jwt from 'jsonwebtoken'
import type { Request, Response } from 'express'
import { UserModel } from '../models/User'
import { env } from '../config/env'

const router = Router()

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
        let user = await UserModel.findOne({ googleId: profile.id })
        if (!user) {
          user = await UserModel.create({
            googleId: profile.id,
            displayName: profile.displayName || 'User',
            avatar: profile.photos?.[0]?.value || '',
            email: profile.emails?.[0]?.value || '',
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

    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.redirect(env.CLIENT_URL)
  },
)

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
