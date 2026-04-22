import express from 'express'
import path from 'path'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import helmet from 'helmet'
import crypto from 'crypto'
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
import imageRoutes from './routes/images'
import sitemapRoutes from './routes/sitemap'
import { loadIndexHtml, renderHtmlForPath } from './seo/renderHtml'

const app = express()
const httpServer = createServer(app)

// ─── Express Middleware ─────────────────────────────────────────────
app.disable('x-powered-by')
app.use(cors({ ...corsOptions, credentials: true }))
app.use(express.json({ limit: '512kb' }))
app.use(cookieParser())
app.use(passport.initialize())
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))

// ─── A04: Origin validation on state-changing requests ──────────────
app.use((req, res, next) => {
  if (['POST', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.get('origin')
    if (origin && origin !== env.CLIENT_URL) {
      res.status(403).json({ error: 'Origine non autorisée' })
      return
    }
  }
  next()
})

// ─── X-Request-ID header for request tracing ────────────────────────
app.use((req, res, next) => {
  const requestId = req.get('x-request-id') || crypto.randomUUID()
  res.setHeader('X-Request-ID', requestId)
  next()
})

// ─── Routes ─────────────────────────────────────────────────────────
app.use(authRoutes)
app.use(tierlistRoutes)
app.use(imageRoutes)
app.use(sitemapRoutes)

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
  pingInterval: 10000,
  pingTimeout: 30000,
})

// Apply rate limiting middleware
io.use(createRateLimiter())

// Register socket event handlers
registerSocketHandlers(io)

// ─── Serve client in production ─────────────────────────────────────
if (env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../../../client/dist')
  loadIndexHtml(clientDist)
  // Serve static assets but skip the root index.html so our SEO renderer handles it.
  app.use(express.static(clientDist, { index: false }))
  app.get('*', async (req, res) => {
    try {
      const html = await renderHtmlForPath(req.path)
      res.set('Content-Type', 'text/html; charset=utf-8')
      res.send(html)
    } catch (err) {
      console.error('[SEO] Render failed for', req.path, err)
      res.sendFile(path.join(clientDist, 'index.html'))
    }
  })
}

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
