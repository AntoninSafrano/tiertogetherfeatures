# TierTogether — Project Configuration & Architecture

## Overview

Collaborative real-time tier list creator. Users create/join rooms via Socket.io, drag-and-drop items into tier rows, chat, and publish lists for the community.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Client** | Vue 3 (Composition API, `<script setup>`), Vite 6, Tailwind CSS v4, Pinia, vue-router, vuedraggable, Socket.io-client |
| **Server** | Express 4, Socket.io, Mongoose (MongoDB), Passport (Google OAuth), bcrypt, JWT (httpOnly cookies), Resend (email), Zod |
| **Shared** | TypeScript interfaces, Zod schemas, constants — consumed by both client and server |
| **Runtime** | Node.js 22+, MongoDB |

## Monorepo Structure

```
TierTogetherFeatures/
├── package.json              # npm workspaces root
├── tsconfig.base.json        # shared TS config
├── shared/                   # @tiertogether/shared
│   └── types/index.ts        # interfaces, Zod schemas, DEFAULT_TIERS
├── server/                   # @tiertogether/server
│   ├── src/
│   │   ├── index.ts          # Express + Socket.io entry
│   │   ├── config/
│   │   │   ├── env.ts        # Zod-validated env vars
│   │   │   ├── cors.ts       # CORS config
│   │   │   └── database.ts   # MongoDB connection
│   │   ├── middleware/
│   │   │   └── rateLimiter.ts # Socket.io rate limiting
│   │   ├── models/
│   │   │   ├── TierList.ts   # Mongoose TierList model
│   │   │   └── User.ts       # Mongoose User model
│   │   ├── routes/
│   │   │   ├── auth.ts       # Google OAuth + email/password auth
│   │   │   ├── tierlists.ts  # Public/featured/mine/publish/clone APIs
│   │   │   └── images.ts     # Google Custom Search image proxy
│   │   ├── sockets/
│   │   │   ├── index.ts      # Socket handler registration
│   │   │   └── roomHandlers.ts # All real-time room logic
│   │   └── scripts/
│   │       └── seedTemplates.ts # DB seed script
│   └── .env                  # Local env (gitignored)
└── client/                   # @tiertogether/client
    ├── src/
    │   ├── main.ts           # Vue app entry
    │   ├── App.vue           # Root component
    │   ├── config.ts         # API_BASE from VITE_API_URL
    │   ├── router/index.ts   # Routes: /, /create, /auth, /tierlist/:id, /room/:id, /user/:id, /stats, /legal, 404
    │   ├── stores/
    │   │   └── room.ts       # Pinia store — room state, socket bindings, drag tracking, vote state
    │   ├── composables/
    │   │   ├── useAuth.ts        # Auth state + API calls
    │   │   ├── useSocket.ts      # Socket.io singleton (shallowRef)
    │   │   ├── useAutoScroll.ts  # Auto-scroll helper (chat, etc.)
    │   │   └── useCloudinary.ts  # Cloudinary unsigned upload
    │   ├── lib/
    │   │   └── utils.ts      # cn(), category/placeholder color helpers (shared across views)
    │   ├── views/
    │   │   ├── ExploreView.vue    # "/" — browse public tier lists
    │   │   ├── CreateView.vue     # "/create" — create/join room
    │   │   ├── AuthView.vue       # "/auth" — login/register/verify/reset
    │   │   ├── TierListView.vue   # "/tierlist/:id" — view published list
    │   │   ├── RoomView.vue       # "/room/:id" — live room
    │   │   ├── ProfileView.vue    # "/user/:id" — public user profile
    │   │   ├── StatsView.vue      # "/stats" — admin stats dashboard
    │   │   ├── LegalView.vue      # "/legal" — legal notices
    │   │   └── NotFoundView.vue   # 404 catch-all
    │   ├── components/
    │   │   ├── NavBar.vue
    │   │   ├── ErrorPopup.vue
    │   │   ├── tierlist/     # TierBoard, TierRow, TierItem, TierPool, TierToolbar, FocusView, VotePanel, ImageUploader, PublishModal
    │   │   ├── chat/ChatPanel.vue
    │   │   └── room/         # RoomEntryGate, CollaboratorsPanel
    │   └── assets/main.css   # Tailwind v4 theme + custom styles
    └── vite.config.ts        # Vue + Tailwind plugins, /socket.io proxy to :3001
```

## Commands

```bash
# Install all workspaces
npm install

# Development (run both in separate terminals)
npm run dev:server        # tsx watch server/src/index.ts → http://localhost:3001
npm run dev:client        # vite → http://localhost:5173

# Build
npm run build             # builds client then server
npm run start             # production server (serves client from dist)
```

## Environment Variables

Server (`server/.env`):

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No (default: 3001) | HTTP server port |
| `MONGODB_URI` | No (default: localhost) | MongoDB connection string |
| `CLIENT_URL` | No (default: http://localhost:5173) | CORS origin for client |
| `NODE_ENV` | No (default: development) | development / production / test |
| `GOOGLE_CLIENT_ID` | Yes (prod) | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes (prod) | Google OAuth client secret |
| `JWT_SECRET` | Yes (prod) | JWT signing secret — **must be changed in production** |
| `GOOGLE_API_KEY` | No | Google Custom Search API key (image search) |
| `GOOGLE_CSE_ID` | No | Google Custom Search Engine ID |
| `RESEND_API_KEY` | No | Resend API key (email verification) |
| `RESEND_FROM_EMAIL` | No | Sender email for Resend |

Client: set `VITE_API_URL` to override API base URL (defaults to `http://localhost:3001`).

## Architecture Decisions

### Authentication
- **Google OAuth** via Passport + **email/password** with bcrypt (cost 12)
- JWT stored in **httpOnly cookie** (not localStorage) — secure by default
- Email verification via 6-digit code (Resend API, fallback to console.log)
- Password reset flow with time-limited codes

### Real-time
- Socket.io with typed events (`ClientToServerEvents` / `ServerToClientEvents` in shared)
- Server-authoritative: all moves persisted to MongoDB before broadcasting
- Rate limiting on socket events (50 events/10s window per socket)
- Chat moderation with banned word filter (FR/EN, leetspeak normalization)

### Drag & Drop
- vuedraggable fires "added" on target before "removed" on source
- `_pendingAdd` pattern in room store buffers the add, emits only when source is known

### State Management
- Pinia store (`room.ts`) holds local tier list state
- Socket events update store reactively → Vue components re-render
- `shallowRef` for Socket.io instance to avoid Vue proxy breaking internal mutations

## Coding Conventions

- **Language**: TypeScript everywhere, strict mode
- **Vue**: Composition API with `<script setup lang="ts">`, single-file components
- **Styling**: Tailwind v4 utility classes, custom theme in `main.css` `@theme` block
- **Validation**: Zod schemas for socket payloads (shared between client types and server validation)
- **Icons**: lucide-vue-next — import only used icons
- **No `.js` duplicates**: the `.vue.js` and `.js` files alongside `.ts`/`.vue` are IDE-generated artifacts, not manually maintained

## Database Models

### User
```
googleId?, displayName, avatar, email, passwordHash?,
emailVerified, verificationToken?, resetToken?,
authProvider: 'google' | 'email', timestamps
```

### TierList
```
roomId (unique, indexed), title, rows[{id, label, color, items[]}],
pool[{id, imageUrl, label}], ownerId, isLocked, isFocusMode,
isPublic, downloads, category (enum), authorId, coverImage, timestamps
```

## Routes

### REST API
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tierlists/public` | No | Browse public tier lists (search, filter, sort) |
| GET | `/api/tierlists/featured` | No | Top 6 by downloads |
| GET | `/api/tierlists/mine` | Yes | User's published lists |
| GET | `/api/tierlists/stats` | Yes | Admin stats (overview, per-category, top lists) |
| GET | `/api/tierlists/:id` | No* | Get tier list (*private lists require ownership) |
| POST | `/api/tierlists/:id/publish` | Yes | Publish with category (owner only) |
| POST | `/api/tierlists/:id/clone` | No | Clone a public list into new room |
| POST | `/api/tierlists/:id/vote` | Yes | Upvote / downvote / clear a public list |
| DELETE | `/api/tierlists/:id` | Yes | Delete a tier list (owner only) |
| GET | `/api/users/:id/profile` | No | Public profile (user info + their public lists) |
| GET | `/api/images/search` | No | Google Custom Search proxy (rate-limited) |
| POST | `/auth/register` | No | Email/password registration (rate-limited) |
| POST | `/auth/login` | No | Email/password login (rate-limited) |
| POST | `/auth/verify-email` | No | 6-digit code verification (rate-limited) |
| POST | `/auth/resend-verification` | No | Resend verification code (rate-limited) |
| POST | `/auth/forgot-password` | No | Request password reset code (rate-limited) |
| POST | `/auth/reset-password` | No | Reset password with code (rate-limited) |
| GET | `/auth/me` | Cookie | Get current user |
| POST | `/auth/logout` | Cookie | Clear auth cookie |
| DELETE | `/auth/account` | Cookie | Delete the authenticated user's account |
| GET | `/auth/google` | No | Initiate Google OAuth |
| GET | `/auth/google/callback` | No | OAuth callback |

### Socket Events
| Direction | Event | Host Only | Description |
|-----------|-------|-----------|-------------|
| C→S | `room:create` | — | Create new room |
| C→S | `room:join` | — | Join existing room |
| C→S | `room:leave` | — | Leave room |
| C→S | `item:move` | No* | Move item (*blocked if locked + not host) |
| C→S | `item:create` | No | Add item to pool |
| C→S | `item:skip` | No | Rotate pool first→last |
| C→S | `room:lock` | Yes | Toggle lock |
| C→S | `room:toggle-focus` | Yes | Toggle focus mode |
| C→S | `room:toggle-vote` | Yes | Start/stop voting mode (30s vote per pool item) |
| C→S | `vote:cast` | No | Cast a vote for a row while voting is active |
| C→S | `room:reset` | Yes | Move all items back to pool |
| C→S | `row:update` | No | Edit row label/color |
| C→S | `row:delete` | No | Delete row (items → pool) |
| C→S | `row:reorder` | No | Move row up/down |
| C→S | `row:add` | No | Add new row |
| C→S | `chat:send` | No | Send chat message |

S→C broadcasts cover the mirror state: `room:state`, `item:moved`, `item:created`, `item:skipped`, `room:locked`, `room:focus-toggled`, `room:vote-toggled`, `vote:started`, `vote:update`, `vote:result`, `room:reset`, `row:*`, `chat:message`, `room:user-left`.

## Known Limitations & Remaining TODOs

### Security (to address before production)
- **Socket identity is `socket.id`** — host reconnect gets new ID, losing host privileges
- **No CSRF tokens** — mitigated by SameSite cookies but worth adding for cross-origin defense
- **Google OAuth `callbackURL` is relative** — set full URL from env for reverse proxy compatibility
- Rate limiting is in place on `/auth/*` (`authLimiter`) and `/api/images/search` (`imageSearchLimiter`); extend to other sensitive REST routes if needed.

### Cleanup
- `getCategoryLabel()` is still duplicated across `TierListView`, `ExploreView`, `ProfileView`, `StatsView` — safe candidate for extraction to `lib/utils.ts` (same pattern as `getCategoryBadgeColor`).
- `.gitignore` covers `client/src/**/*.vue.js` / `*.vue.d.ts` / `*.d.ts` but misses sibling `*.js` for `.ts` sources (e.g. `client/src/router/index.js`, `client/src/stores/room.js`) and the `shared/types/*.{js,d.ts}` + `client/vite.config.{js,d.ts}` build artefacts — every local/CI build re-dirties these files. Broaden the ignore rules and remove the tracked artefacts once.
- `seedTemplates.ts` at `server/src/scripts/seedTemplates.ts` — only run manually; confirm it's still needed before prod seeding.
