import { type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@tiertogether/shared';
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
export declare function useSocket(): {
    socket: import("vue").ShallowRef<TypedSocket | null, TypedSocket | null>;
    isConnected: Readonly<import("vue").Ref<boolean, boolean>>;
    connectionError: Readonly<import("vue").Ref<string | null, string | null>>;
    connect: () => void;
    disconnect: () => void;
};
export {};
