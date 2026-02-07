import type { Socket } from 'socket.io'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const limits = new Map<string, RateLimitEntry>()

const MAX_EVENTS_PER_WINDOW = 50
const WINDOW_MS = 10_000 // 10 seconds

/**
 * Socket.io middleware that enforces basic rate-limiting per socket.
 * Disconnects the client if they exceed the event threshold.
 */
export function createRateLimiter() {
  return (socket: Socket, next: (err?: Error) => void) => {
    const key = socket.id

    const originalOnEvent = socket.onAny
    socket.onAny(() => {
      const now = Date.now()
      const entry = limits.get(key)

      if (!entry || now > entry.resetAt) {
        limits.set(key, { count: 1, resetAt: now + WINDOW_MS })
        return
      }

      entry.count++
      if (entry.count > MAX_EVENTS_PER_WINDOW) {
        console.warn(`[RateLimit] Socket ${key} exceeded limit, disconnecting`)
        socket.emit('error', 'Rate limit exceeded')
        socket.disconnect(true)
      }
    })

    socket.on('disconnect', () => {
      limits.delete(key)
    })

    next()
  }
}
