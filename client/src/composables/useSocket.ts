import { shallowRef, ref, readonly } from 'vue'
import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@tiertogether/shared'
import { API_BASE } from '@/config'

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

// shallowRef: Vue tracks the ref itself but does NOT deep-proxy the Socket
// object. This is critical because Socket.io mutates internal properties
// (_callbacks, _opts, etc.) and Vue's reactive proxy breaks that.
const socket = shallowRef<TypedSocket | null>(null)
const isConnected = ref(false)
const connectionError = ref<string | null>(null)

// Callbacks that get called on reconnection
const reconnectCallbacks: (() => void)[] = []

export function useSocket() {
  function connect() {
    if (socket.value?.connected) return
    if (socket.value) return // already created, just disconnected — Socket.io will auto-reconnect

    const newSocket: TypedSocket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    })

    newSocket.on('connect', () => {
      isConnected.value = true
      connectionError.value = null
      console.log('[Socket] Connected:', newSocket.id)
    })

    newSocket.io.on('reconnect', () => {
      console.log('[Socket] Reconnected:', newSocket.id)
      reconnectCallbacks.forEach((cb) => cb())
    })

    newSocket.on('disconnect', (reason) => {
      isConnected.value = false
      console.log('[Socket] Disconnected:', reason)
    })

    newSocket.on('connect_error', (err) => {
      connectionError.value = err.message
      console.error('[Socket] Connection error:', err.message)
    })

    socket.value = newSocket
  }

  function disconnect() {
    socket.value?.disconnect()
    socket.value = null
    isConnected.value = false
  }

  function onReconnect(cb: () => void) {
    reconnectCallbacks.push(cb)
  }

  return {
    socket,
    isConnected: readonly(isConnected),
    connectionError: readonly(connectionError),
    connect,
    disconnect,
    onReconnect,
  }
}
