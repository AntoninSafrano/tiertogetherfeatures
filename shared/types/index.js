import { z } from 'zod';
// ─── Default Tiers ──────────────────────────────────────────────────
export const DEFAULT_TIERS = [
    { id: 'tier-s', label: 'S', color: '#FF7F7F' },
    { id: 'tier-a', label: 'A', color: '#FFBF7F' },
    { id: 'tier-b', label: 'B', color: '#FFDF7F' },
    { id: 'tier-c', label: 'C', color: '#FFFF7F' },
    { id: 'tier-d', label: 'D', color: '#7FFFFF' },
];
// ─── Zod Schemas (shared validation) ────────────────────────────────
export const tierItemSchema = z.object({
    id: z.string().min(1),
    imageUrl: z.string().default(''),
    label: z.string().min(1).max(50),
});
export const tierRowSchema = z.object({
    id: z.string().min(1),
    label: z.string().min(1).max(10),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    items: z.array(tierItemSchema),
});
export const tierListSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1).max(100),
    rows: z.array(tierRowSchema),
    pool: z.array(tierItemSchema),
    ownerId: z.string().min(1),
});
export const createRoomSchema = z.object({
    username: z.string().min(1).max(20).trim(),
    tierListName: z.string().min(1).max(100).trim(),
});
export const joinRoomSchema = z.object({
    username: z.string().min(1).max(20).trim(),
    roomId: z.string().min(1).max(50).trim(),
});
export const moveItemSchema = z.object({
    itemId: z.string().min(1),
    fromRowId: z.string().nullable(),
    toRowId: z.string().nullable(),
    toIndex: z.number().int().min(0),
});
export const createItemSchema = z.object({
    imageUrl: z.string().url(),
    label: z.string().min(1).max(50).trim(),
});
