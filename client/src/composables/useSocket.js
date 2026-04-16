import { shallowRef, ref, readonly } from 'vue';
import { io } from 'socket.io-client';
import { API_BASE } from '@/config';
// shallowRef: Vue tracks the ref itself but does NOT deep-proxy the Socket
// object. This is critical because Socket.io mutates internal properties
// (_callbacks, _opts, etc.) and Vue's reactive proxy breaks that.
const socket = shallowRef(null);
const isConnected = ref(false);
const connectionError = ref(null);
export function useSocket() {
    function connect() {
        if (socket.value?.connected)
            return;
        const newSocket = io(API_BASE, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        newSocket.on('connect', () => {
            isConnected.value = true;
            connectionError.value = null;
            console.log('[Socket] Connected:', newSocket.id);
        });
        newSocket.on('disconnect', (reason) => {
            isConnected.value = false;
            console.log('[Socket] Disconnected:', reason);
        });
        newSocket.on('connect_error', (err) => {
            connectionError.value = err.message;
            console.error('[Socket] Connection error:', err.message);
        });
        socket.value = newSocket;
    }
    function disconnect() {
        socket.value?.disconnect();
        socket.value = null;
        isConnected.value = false;
    }
    return {
        socket,
        isConnected: readonly(isConnected),
        connectionError: readonly(connectionError),
        connect,
        disconnect,
    };
}
