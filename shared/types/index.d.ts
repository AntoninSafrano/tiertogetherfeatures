import { z } from 'zod';
export interface TierItem {
    id: string;
    imageUrl: string;
    label: string;
}
export interface TierRow {
    id: string;
    label: string;
    color: string;
    items: TierItem[];
}
export interface TierList {
    id: string;
    title: string;
    rows: TierRow[];
    pool: TierItem[];
    ownerId: string;
    createdAt: string;
    updatedAt: string;
}
export declare const DEFAULT_TIERS: Omit<TierRow, 'items'>[];
export interface RoomUser {
    id: string;
    username: string;
    color: string;
    avatar?: string;
    isGuest?: boolean;
}
export interface Room {
    id: string;
    tierList: TierList;
    users: RoomUser[];
    hostId: string;
    isLocked: boolean;
    isFocusMode: boolean;
}
/** Row management payloads */
export interface RowUpdatePayload {
    rowId: string;
    label?: string;
    color?: string;
}
export interface RowDeletePayload {
    rowId: string;
}
export interface RowReorderPayload {
    rowId: string;
    direction: 'up' | 'down';
}
export interface RowAddPayload {
    label: string;
    color: string;
}
/** Client -> Server events */
export interface ClientToServerEvents {
    'room:create': (data: CreateRoomPayload, callback: (res: RoomResponse) => void) => void;
    'room:join': (data: JoinRoomPayload, callback: (res: RoomResponse) => void) => void;
    'room:leave': () => void;
    'item:move': (data: MoveItemPayload) => void;
    'item:create': (data: CreateItemPayload) => void;
    'room:reset': () => void;
    'room:lock': () => void;
    'room:toggle-focus': () => void;
    'item:skip': () => void;
    'chat:send': (data: {
        text: string;
    }) => void;
    'row:update': (data: RowUpdatePayload) => void;
    'row:delete': (data: RowDeletePayload) => void;
    'row:reorder': (data: RowReorderPayload) => void;
    'row:add': (data: RowAddPayload) => void;
}
/** Server -> Client events */
export interface ServerToClientEvents {
    'room:state': (room: Room) => void;
    'room:user-joined': (user: RoomUser) => void;
    'room:user-left': (userId: string) => void;
    'item:moved': (data: MoveItemPayload) => void;
    'item:created': (item: TierItem) => void;
    'room:reset': (room: Room) => void;
    'room:locked': (isLocked: boolean) => void;
    'room:focus-toggled': (isFocusMode: boolean) => void;
    'item:skipped': () => void;
    'chat:message': (message: ChatMessage) => void;
    'error': (message: string) => void;
    'row:updated': (data: RowUpdatePayload & {
        rowId: string;
    }) => void;
    'row:deleted': (data: RowDeletePayload) => void;
    'row:reordered': (data: RowReorderPayload) => void;
    'row:added': (row: TierRow) => void;
}
/** Inter-server events (unused for now) */
export interface InterServerEvents {
}
/** Socket data attached to each socket */
export interface SocketData {
    userId: string;
    username: string;
    roomId: string | null;
    color: string;
}
export interface ChatMessage {
    id: string;
    userId: string;
    username: string;
    color: string;
    text: string;
    isHost: boolean;
    timestamp: number;
}
export interface CreateRoomPayload {
    username: string;
    tierListName: string;
    avatar?: string;
    isGuest?: boolean;
}
export interface JoinRoomPayload {
    username: string;
    roomId: string;
    avatar?: string;
    isGuest?: boolean;
}
export interface MoveItemPayload {
    itemId: string;
    fromRowId: string | null;
    toRowId: string | null;
    toIndex: number;
}
export interface CreateItemPayload {
    imageUrl: string;
    label: string;
}
export interface RoomResponse {
    success: boolean;
    roomId?: string;
    error?: string;
}
export declare const tierItemSchema: z.ZodObject<{
    id: z.ZodString;
    imageUrl: z.ZodDefault<z.ZodString>;
    label: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    label: string;
    imageUrl: string;
}, {
    id: string;
    label: string;
    imageUrl?: string | undefined;
}>;
export declare const tierRowSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    color: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        imageUrl: z.ZodDefault<z.ZodString>;
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        label: string;
        imageUrl: string;
    }, {
        id: string;
        label: string;
        imageUrl?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        id: string;
        label: string;
        imageUrl: string;
    }[];
    id: string;
    label: string;
    color: string;
}, {
    items: {
        id: string;
        label: string;
        imageUrl?: string | undefined;
    }[];
    id: string;
    label: string;
    color: string;
}>;
export declare const tierListSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    rows: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        color: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            imageUrl: z.ZodDefault<z.ZodString>;
            label: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            imageUrl: string;
        }, {
            id: string;
            label: string;
            imageUrl?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        items: {
            id: string;
            label: string;
            imageUrl: string;
        }[];
        id: string;
        label: string;
        color: string;
    }, {
        items: {
            id: string;
            label: string;
            imageUrl?: string | undefined;
        }[];
        id: string;
        label: string;
        color: string;
    }>, "many">;
    pool: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        imageUrl: z.ZodDefault<z.ZodString>;
        label: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        label: string;
        imageUrl: string;
    }, {
        id: string;
        label: string;
        imageUrl?: string | undefined;
    }>, "many">;
    ownerId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    rows: {
        items: {
            id: string;
            label: string;
            imageUrl: string;
        }[];
        id: string;
        label: string;
        color: string;
    }[];
    pool: {
        id: string;
        label: string;
        imageUrl: string;
    }[];
    ownerId: string;
}, {
    id: string;
    title: string;
    rows: {
        items: {
            id: string;
            label: string;
            imageUrl?: string | undefined;
        }[];
        id: string;
        label: string;
        color: string;
    }[];
    pool: {
        id: string;
        label: string;
        imageUrl?: string | undefined;
    }[];
    ownerId: string;
}>;
export declare const createRoomSchema: z.ZodObject<{
    username: z.ZodString;
    tierListName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    tierListName: string;
}, {
    username: string;
    tierListName: string;
}>;
export declare const joinRoomSchema: z.ZodObject<{
    username: z.ZodString;
    roomId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    roomId: string;
}, {
    username: string;
    roomId: string;
}>;
export declare const moveItemSchema: z.ZodObject<{
    itemId: z.ZodString;
    fromRowId: z.ZodNullable<z.ZodString>;
    toRowId: z.ZodNullable<z.ZodString>;
    toIndex: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    itemId: string;
    fromRowId: string | null;
    toRowId: string | null;
    toIndex: number;
}, {
    itemId: string;
    fromRowId: string | null;
    toRowId: string | null;
    toIndex: number;
}>;
export declare const createItemSchema: z.ZodObject<{
    imageUrl: z.ZodString;
    label: z.ZodString;
}, "strip", z.ZodTypeAny, {
    label: string;
    imageUrl: string;
}, {
    label: string;
    imageUrl: string;
}>;
