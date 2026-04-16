"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createItemSchema = exports.moveItemSchema = exports.joinRoomSchema = exports.createRoomSchema = exports.tierListSchema = exports.tierRowSchema = exports.tierItemSchema = exports.DEFAULT_TIERS = void 0;
const zod_1 = require("zod");
// ─── Default Tiers ──────────────────────────────────────────────────
exports.DEFAULT_TIERS = [
    { id: 'tier-s', label: 'S', color: '#FF7F7F' },
    { id: 'tier-a', label: 'A', color: '#FFBF7F' },
    { id: 'tier-b', label: 'B', color: '#FFDF7F' },
    { id: 'tier-c', label: 'C', color: '#FFFF7F' },
    { id: 'tier-d', label: 'D', color: '#7FFFFF' },
];
// ─── Zod Schemas (shared validation) ────────────────────────────────
exports.tierItemSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    imageUrl: zod_1.z.string().default(''),
    label: zod_1.z.string().min(1).max(50),
});
exports.tierRowSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    label: zod_1.z.string().min(1).max(10),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    items: zod_1.z.array(exports.tierItemSchema),
});
exports.tierListSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1).max(100),
    rows: zod_1.z.array(exports.tierRowSchema),
    pool: zod_1.z.array(exports.tierItemSchema),
    ownerId: zod_1.z.string().min(1),
});
exports.createRoomSchema = zod_1.z.object({
    username: zod_1.z.string().min(1).max(20).trim(),
    tierListName: zod_1.z.string().min(1).max(100).trim(),
});
exports.joinRoomSchema = zod_1.z.object({
    username: zod_1.z.string().min(1).max(20).trim(),
    roomId: zod_1.z.string().min(1).max(50).trim(),
});
exports.moveItemSchema = zod_1.z.object({
    itemId: zod_1.z.string().min(1),
    fromRowId: zod_1.z.string().nullable(),
    toRowId: zod_1.z.string().nullable(),
    toIndex: zod_1.z.number().int().min(0),
});
exports.createItemSchema = zod_1.z.object({
    imageUrl: zod_1.z.string().url(),
    label: zod_1.z.string().min(1).max(50).trim(),
});
