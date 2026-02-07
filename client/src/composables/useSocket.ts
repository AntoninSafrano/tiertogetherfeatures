import { ref, readonly } from 'vue'
import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@tiertogether/shared'

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

const socket = ref<TypedSocket | null>(null)
const isConnected = ref(false)
const connectionError = ref<string | null>(null)

export function useSocket() {
  function connect() {
    if (socket.value?.connected) return

    const newSocket: TypedSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    newSocket.on('connect', () => {
      isConnected.value = true
      connectionError.value = null
      console.log('[Socket] Connected:', newSocket.id)
    })

    newSocket.on('disconnect', (reason) => {
      isConnected.value = false
      console.log('[Socket] Disconnected:', reason)
    })

    newSocket.on('connect_error', (err) => {
      connectionError.value = err.message
      console.error('[Socket] Connection error:', err.message)
    })

    newSocket.on('error', (message) => {
      console.error('[Socket] Server error:', message)
    })

    socket.value = newSocket
  }

  function disconnect() {
    socket.value?.disconnect()
    socket.value = null
    isConnected.value = false
  }

  return {
    socket: readonly(socket),
    isConnected: readonly(isConnected),
    connectionError: readonly(connectionError),
    connect,
    disconnect,
  }
}
