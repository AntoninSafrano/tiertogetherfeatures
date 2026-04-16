import type { Room, RoomUser, TierItem, TierRow, TierList, MoveItemPayload, RoomResponse, RowUpdatePayload, RowDeletePayload, RowReorderPayload, RowAddPayload } from '@tiertogether/shared';
export declare const useRoomStore: import("pinia").StoreDefinition<"room", Pick<{
    currentRoom: import("vue").Ref<{
        id: string;
        tierList: {
            id: string;
            title: string;
            rows: {
                id: string;
                label: string;
                color: string;
                items: {
                    id: string;
                    imageUrl: string;
                    label: string;
                }[];
            }[];
            pool: {
                id: string;
                imageUrl: string;
                label: string;
            }[];
            ownerId: string;
            createdAt: string;
            updatedAt: string;
        };
        users: {
            id: string;
            username: string;
            color: string;
            avatar?: string | undefined;
            isGuest?: boolean | undefined;
        }[];
        hostId: string;
        isLocked: boolean;
        isFocusMode: boolean;
    } | null, Room | {
        id: string;
        tierList: {
            id: string;
            title: string;
            rows: {
                id: string;
                label: string;
                color: string;
                items: {
                    id: string;
                    imageUrl: string;
                    label: string;
                }[];
            }[];
            pool: {
                id: string;
                imageUrl: string;
                label: string;
            }[];
            ownerId: string;
            createdAt: string;
            updatedAt: string;
        };
        users: {
            id: string;
            username: string;
            color: string;
            avatar?: string | undefined;
            isGuest?: boolean | undefined;
        }[];
        hostId: string;
        isLocked: boolean;
        isFocusMode: boolean;
    } | null>;
    isInRoom: import("vue").ComputedRef<boolean>;
    users: import("vue").Ref<{
        id: string;
        username: string;
        color: string;
        avatar?: string | undefined;
        isGuest?: boolean | undefined;
    }[], RoomUser[] | {
        id: string;
        username: string;
        color: string;
        avatar?: string | undefined;
        isGuest?: boolean | undefined;
    }[]>;
    username: import("vue").Ref<string, string>;
    setRoom: (room: Room) => void;
    clearRoom: () => void;
    createRoom: (tierListName: string, user: string, avatar?: string, isGuest?: boolean) => Promise<RoomResponse>;
    joinRoom: (roomId: string, user: string, avatar?: string, isGuest?: boolean) => Promise<RoomResponse>;
    title: import("vue").Ref<string, string>;
    rows: import("vue").Ref<{
        id: string;
        label: string;
        color: string;
        items: {
            id: string;
            imageUrl: string;
            label: string;
        }[];
    }[], TierRow[] | {
        id: string;
        label: string;
        color: string;
        items: {
            id: string;
            imageUrl: string;
            label: string;
        }[];
    }[]>;
    pool: import("vue").Ref<{
        id: string;
        imageUrl: string;
        label: string;
    }[], TierItem[] | {
        id: string;
        imageUrl: string;
        label: string;
    }[]>;
    isHost: import("vue").ComputedRef<boolean>;
    isLocked: import("vue").Ref<boolean, boolean>;
    isFocusMode: import("vue").Ref<boolean, boolean>;
    currentFocusItem: import("vue").ComputedRef<{
        id: string;
        imageUrl: string;
        label: string;
    }>;
    moveItem: (itemId: string, fromContainerId: string | null, toContainerId: string | null, newIndex: number) => void;
    emitMove: (payload: MoveItemPayload) => void;
    resetRoom: () => void;
    toggleLock: () => void;
    toggleFocusMode: () => void;
    skipCurrentItem: () => void;
    loadTierList: (tierList: TierList) => void;
    initDemo: () => void;
    handleDragAdded: (itemId: string, toRowId: string | null, toIndex: number) => void;
    handleDragRemoved: (itemId: string, fromRowId: string | null) => void;
    updateRow: (data: RowUpdatePayload) => void;
    deleteRow: (data: RowDeletePayload) => void;
    reorderRow: (data: RowReorderPayload) => void;
    addRow: (data?: RowAddPayload) => void;
    bindEvents: () => void;
    saveRoomToHistory: (roomId: string, titleName: string) => void;
}, "title" | "rows" | "pool" | "username" | "users" | "isLocked" | "isFocusMode" | "currentRoom">, Pick<{
    currentRoom: import("vue").Ref<{
        id: string;
        tierList: {
            id: string;
            title: string;
            rows: {
                id: string;
                label: string;
                color: string;
                items: {
                    id: string;
                    imageUrl: string;
                    label: string;
                }[];
            }[];
            pool: {
                id: string;
                imageUrl: string;
                label: string;
            }[];
            ownerId: string;
            createdAt: string;
            updatedAt: string;
        };
        users: {
            id: string;
            username: string;
            color: string;
            avatar?: string | undefined;
            isGuest?: boolean | undefined;
        }[];
        hostId: string;
        isLocked: boolean;
        isFocusMode: boolean;
    } | null, Room | {
        id: string;
        tierList: {
            id: string;
            title: string;
            rows: {
                id: string;
                label: string;
                color: string;
                items: {
                    id: string;
                    imageUrl: string;
                    label: string;
                }[];
            }[];
            pool: {
                id: string;
                imageUrl: string;
                label: string;
            }[];
            ownerId: string;
            createdAt: string;
            updatedAt: string;
        };
        users: {
            id: string;
            username: string;
            color: string;
            avatar?: string | undefined;
            isGuest?: boolean | undefined;
        }[];
        hostId: string;
        isLocked: boolean;
        isFocusMode: boolean;
    } | null>;
    isInRoom: import("vue").ComputedRef<boolean>;
    users: import("vue").Ref<{
        id: string;
        username: string;
        color: string;
        avatar?: string | undefined;
        isGuest?: boolean | undefined;
    }[], RoomUser[] | {
        id: string;
        username: string;
        color: string;
        avatar?: string | undefined;
        isGuest?: boolean | undefined;
    }[]>;
    username: import("vue").Ref<string, string>;
    setRoom: (room: Room) => void;
    clearRoom: () => void;
    createRoom: (tierListName: string, user: string, avatar?: string, isGuest?: boolean) => Promise<RoomResponse>;
    joinRoom: (roomId: string, user: string, avatar?: string, isGuest?: boolean) => Promise<RoomResponse>;
    title: import("vue").Ref<string, string>;
    rows: import("vue").Ref<{
        id: string;
        label: string;
        color: string;
        items: {
            id: string;
            imageUrl: string;
            label: string;
        }[];
    }[], TierRow[] | {
        id: string;
        label: string;
        color: string;
        items: {
            id: string;
            imageUrl: string;
            label: string;
        }[];
    }[]>;
    pool: import("vue").Ref<{
        id: string;
        imageUrl: string;
        label: string;
    }[], TierItem[] | {
        id: string;
        imageUrl: string;
        label: string;
    }[]>;
    isHost: import("vue").ComputedRef<boolean>;
    isLocked: import("vue").Ref<boolean, boolean>;
    isFocusMode: import("vue").Ref<boolean, boolean>;
    currentFocusItem: import("vue").ComputedRef<{
        id: string;
        imageUrl: string;
        label: string;
    }>;
    moveItem: (itemId: string, fromContainerId: string | null, toContainerId: string | null, newIndex: number) => void;
    emitMove: (payload: MoveItemPayload) => void;
    resetRoom: () => void;
    toggleLock: () => void;
    toggleFocusMode: () => void;
    skipCurrentItem: () => void;
    loadTierList: (tierList: TierList) => void;
    initDemo: () => void;
    handleDragAdded: (itemId: string, toRowId: string | null, toIndex: number) => void;
    handleDragRemoved: (itemId: string, fromRowId: string | null) => void;
    updateRow: (data: RowUpdatePayload) => void;
    deleteRow: (data: RowDeletePayload) => void;
    reorderRow: (data: RowReorderPayload) => void;
    addRow: (data?: RowAddPayload) => void;
    bindEvents: () => void;
    saveRoomToHistory: (roomId: string, titleName: string) => void;
}, "isInRoom" | "isHost" | "currentFocusItem">, Pick<{
    currentRoom: import("vue").Ref<{
        id: string;
        tierList: {
            id: string;
            title: string;
            rows: {
                id: string;
                label: string;
                color: string;
                items: {
                    id: string;
                    imageUrl: string;
                    label: string;
                }[];
            }[];
            pool: {
                id: string;
                imageUrl: string;
                label: string;
            }[];
            ownerId: string;
            createdAt: string;
            updatedAt: string;
        };
        users: {
            id: string;
            username: string;
            color: string;
            avatar?: string | undefined;
            isGuest?: boolean | undefined;
        }[];
        hostId: string;
        isLocked: boolean;
        isFocusMode: boolean;
    } | null, Room | {
        id: string;
        tierList: {
            id: string;
            title: string;
            rows: {
                id: string;
                label: string;
                color: string;
                items: {
                    id: string;
                    imageUrl: string;
                    label: string;
                }[];
            }[];
            pool: {
                id: string;
                imageUrl: string;
                label: string;
            }[];
            ownerId: string;
            createdAt: string;
            updatedAt: string;
        };
        users: {
            id: string;
            username: string;
            color: string;
            avatar?: string | undefined;
            isGuest?: boolean | undefined;
        }[];
        hostId: string;
        isLocked: boolean;
        isFocusMode: boolean;
    } | null>;
    isInRoom: import("vue").ComputedRef<boolean>;
    users: import("vue").Ref<{
        id: string;
        username: string;
        color: string;
        avatar?: string | undefined;
        isGuest?: boolean | undefined;
    }[], RoomUser[] | {
        id: string;
        username: string;
        color: string;
        avatar?: string | undefined;
        isGuest?: boolean | undefined;
    }[]>;
    username: import("vue").Ref<string, string>;
    setRoom: (room: Room) => void;
    clearRoom: () => void;
    createRoom: (tierListName: string, user: string, avatar?: string, isGuest?: boolean) => Promise<RoomResponse>;
    joinRoom: (roomId: string, user: string, avatar?: string, isGuest?: boolean) => Promise<RoomResponse>;
    title: import("vue").Ref<string, string>;
    rows: import("vue").Ref<{
        id: string;
        label: string;
        color: string;
        items: {
            id: string;
            imageUrl: string;
            label: string;
        }[];
    }[], TierRow[] | {
        id: string;
        label: string;
        color: string;
        items: {
            id: string;
            imageUrl: string;
            label: string;
        }[];
    }[]>;
    pool: import("vue").Ref<{
        id: string;
        imageUrl: string;
        label: string;
    }[], TierItem[] | {
        id: string;
        imageUrl: string;
        label: string;
    }[]>;
    isHost: import("vue").ComputedRef<boolean>;
    isLocked: import("vue").Ref<boolean, boolean>;
    isFocusMode: import("vue").Ref<boolean, boolean>;
    currentFocusItem: import("vue").ComputedRef<{
        id: string;
        imageUrl: string;
        label: string;
    }>;
    moveItem: (itemId: string, fromContainerId: string | null, toContainerId: string | null, newIndex: number) => void;
    emitMove: (payload: MoveItemPayload) => void;
    resetRoom: () => void;
    toggleLock: () => void;
    toggleFocusMode: () => void;
    skipCurrentItem: () => void;
    loadTierList: (tierList: TierList) => void;
    initDemo: () => void;
    handleDragAdded: (itemId: string, toRowId: string | null, toIndex: number) => void;
    handleDragRemoved: (itemId: string, fromRowId: string | null) => void;
    updateRow: (data: RowUpdatePayload) => void;
    deleteRow: (data: RowDeletePayload) => void;
    reorderRow: (data: RowReorderPayload) => void;
    addRow: (data?: RowAddPayload) => void;
    bindEvents: () => void;
    saveRoomToHistory: (roomId: string, titleName: string) => void;
}, "setRoom" | "clearRoom" | "createRoom" | "joinRoom" | "moveItem" | "emitMove" | "resetRoom" | "toggleLock" | "toggleFocusMode" | "skipCurrentItem" | "loadTierList" | "initDemo" | "handleDragAdded" | "handleDragRemoved" | "updateRow" | "deleteRow" | "reorderRow" | "addRow" | "bindEvents" | "saveRoomToHistory">>;
