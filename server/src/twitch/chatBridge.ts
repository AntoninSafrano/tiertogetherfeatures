/**
 * Anonymous Twitch chat reader (IRC over the official WebSocket gateway).
 *
 * Twitch allows read-only anonymous connections with a "justinfan" nick —
 * no OAuth, no API key. One bridge per room, used to turn chat messages
 * ("S", "A", "B"…) into tier votes during vote mode.
 *
 * Uses wss://irc-ws.chat.twitch.tv (the raw TLS endpoint serves edge-node
 * certificates that fail hostname verification; the WebSocket gateway is
 * the one tmi.js and the web client use).
 */

export interface TwitchBridgeHandlers {
  onMessage: (username: string, message: string) => void
  onStatus: (connected: boolean, error?: string) => void
}

const MAX_BRIDGES = 20
const IRC_WS_URL = 'wss://irc-ws.chat.twitch.tv:443'

class Bridge {
  private ws: WebSocket | null = null
  private joined = false
  private stopped = false

  constructor(
    public readonly channel: string,
    private readonly handlers: TwitchBridgeHandlers,
  ) {}

  connect(): void {
    const nick = `justinfan${Math.floor(10000 + Math.random() * 80000)}`
    let ws: WebSocket
    try {
      ws = new WebSocket(IRC_WS_URL)
    } catch (err) {
      this.handlers.onStatus(false, (err as Error).message)
      return
    }
    this.ws = ws

    const connectTimeout = setTimeout(() => {
      if (!this.joined && !this.stopped) {
        this.handlers.onStatus(false, 'Connexion à Twitch expirée')
        this.stop()
      }
    }, 15000)

    ws.onopen = () => {
      ws.send(`NICK ${nick}`)
      ws.send(`JOIN #${this.channel}`)
    }

    ws.onmessage = (event) => {
      for (const line of String(event.data).split('\r\n')) {
        if (line) this.handleLine(line)
      }
    }

    ws.onerror = () => {
      if (!this.stopped) this.handlers.onStatus(false, 'Erreur de connexion au chat Twitch')
    }

    ws.onclose = () => {
      clearTimeout(connectTimeout)
      if (!this.stopped && this.joined) this.handlers.onStatus(false)
      this.joined = false
    }
  }

  private handleLine(line: string): void {
    if (line.startsWith('PING')) {
      this.ws?.send('PONG :tmi.twitch.tv')
      return
    }
    // :nick!user@host PRIVMSG #channel :text
    const msg = line.match(/^:(\w+)!\S+ PRIVMSG #\S+ :(.*)$/)
    if (msg) {
      this.handlers.onMessage(msg[1]!.toLowerCase(), msg[2]!)
      return
    }
    // 366 = end of NAMES list → join confirmed
    if (!this.joined && / 366 /.test(line)) {
      this.joined = true
      this.handlers.onStatus(true)
    }
  }

  stop(): void {
    this.stopped = true
    try { this.ws?.close() } catch { /* already closed */ }
    this.ws = null
  }
}

const bridges = new Map<string, Bridge>() // roomId → bridge

export function connectTwitchChat(
  roomId: string,
  channel: string,
  handlers: TwitchBridgeHandlers,
): { ok: boolean; error?: string } {
  if (!/^[a-zA-Z0-9_]{2,25}$/.test(channel)) {
    return { ok: false, error: 'Nom de chaîne Twitch invalide' }
  }
  disconnectTwitchChat(roomId)
  if (bridges.size >= MAX_BRIDGES) {
    return { ok: false, error: 'Trop de connexions Twitch actives, réessayez plus tard' }
  }
  const bridge = new Bridge(channel.toLowerCase(), handlers)
  bridges.set(roomId, bridge)
  bridge.connect()
  return { ok: true }
}

export function disconnectTwitchChat(roomId: string): void {
  const bridge = bridges.get(roomId)
  if (bridge) {
    bridge.stop()
    bridges.delete(roomId)
  }
}

export function getTwitchChannel(roomId: string): string | null {
  return bridges.get(roomId)?.channel ?? null
}
