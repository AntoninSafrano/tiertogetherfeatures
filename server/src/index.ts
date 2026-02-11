import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@tiertogether/shared'
import { env } from './config/env'
import { corsOptions } from './config/cors'
import { connectDatabase } from './config/database'
import { createRateLimiter } from './middleware/rateLimiter'
import { registerSocketHandlers } from './sockets'
import authRoutes from './routes/auth'
import tierlistRoutes from './routes/tierlists'

const app = express()
const httpServer = createServer(app)

// ─── Express Middleware ─────────────────────────────────────────────
app.use(cors({ ...corsOptions, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use(passport.initialize())

// ─── Routes ─────────────────────────────────────────────────────────
app.use(authRoutes)
app.use(tierlistRoutes)

// ─── Health Check ───────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Socket.io ──────────────────────────────────────────────────────
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: corsOptions,
  pingInterval: 25000,
  pingTimeout: 20000,
})

// Apply rate limiting middleware
io.use(createRateLimiter())

// Register socket event handlers
registerSocketHandlers(io)

// ─── Start ──────────────────────────────────────────────────────────
async function start(): Promise<void> {
  await connectDatabase()

  httpServer.listen(env.PORT, () => {
    console.log(`[Server] Running on http://localhost:${env.PORT}`)
    console.log(`[Server] Environment: ${env.NODE_ENV}`)
  })
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err)
  process.exit(1)
})
