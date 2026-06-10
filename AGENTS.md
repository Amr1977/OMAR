# Project Context — HAFSA

## Stack
- Backend: Node.js/Express + Prisma/PostgreSQL (Neon), Socket.IO
- Frontend: React/Vite + Firebase Hosting
- Media: VPS local disk via multer, served at `/uploads/`
- Domain: commerce-api.et3am.com (nginx proxies `/hafsa/` -> backend port 3001)
- PM2: `hafsa-backend` running `backend/dist/server.js -p 3001`

## Recent Work (Completed June 2026)
Full social media feature set implemented across all layers:

### Schema (Phase 1)
- User: added `bio`, `tagline`, `websiteUrl`, `lastSeenAt`, `isOnline`
- Post: added `isPinned`, `viewCount`, `parentId` to PostComment
- New models: PostCommentLike, PostSave, PostView, Hashtag, PostHashtag, PostMention, PostReport, Block, Story, StoryView, StoryPrivacy enum

### Backend (Phase 2-5)
- `backend/src/config/upload.ts` — VPS disk storage with subdirs (profiles, social, stories, services, stores), size/mime limits
- `backend/src/modules/social/social.controller.ts` — Full social controller: posts CRUD, hashtags, mentions, comments+pagination+replies, comment likes, saves, report, block, user profile/search/suggested, hashtag feed/trending, pin, stories CRUD
- `backend/src/modules/social/social.routes.ts` — All new routes
- `backend/src/modules/admin/admin.controller.ts` — getPostReports, resolvePostReport
- `backend/src/modules/admin/admin.routes.ts` — Report routes
- `backend/src/services/socket.ts` — Presence (online/offline), post_created event (notify followers)

### Frontend (Phase 6-7)
- `frontend/src/pages/social/SocialFeed.tsx` — StoriesBar, bookmark/pin/report, rich text, socket listener, fixed profile links
- `frontend/src/pages/social/PostDetail.tsx` — Fixed profile links, rich text
- `frontend/src/pages/social/UserPublicProfile.tsx` — `/social/user/:userId`
- `frontend/src/pages/social/HashtagFeed.tsx` — `/social/hashtag/:tag`
- `frontend/src/pages/social/PeopleSearch.tsx` — `/social/people`
- `frontend/src/pages/social/StoriesBar.tsx` — Story upload + carousel viewer
- `frontend/src/lib/richText.tsx` — Hashtag/mention -> link renderer
- `frontend/src/lib/api.ts` — Extended social object with all endpoints
- `frontend/src/lib/socket.ts` — onNewPostInFeed, onUserOnline, onUserOffline, emitPostCreated
- `frontend/src/App.tsx` — New routes added
- `frontend/src/components/Layout.tsx` — Social nav link

### Security (Phase 8 - June 2026)
- `backend/src/modules/browse/browse.controller.ts` — Filter GROOM-only in browse, exclude self-profile, fix AI suggestions
- `frontend/src/pages/auth/Login.tsx` — Added gender confirmation modal for Google auth (Yes/No)
- `frontend/src/pages/auth/Register.tsx` — Added gender confirmation modal for Google auth, button confirmation for email
- `frontend/src/lib/api.ts` — Fixed `photoUrl` to extract origin only for uploads
- `frontend/src/lib/logger.ts` — Fixed anonymous logs endpoint (`/logs/client/public`)
- Nginx: Added `/logs/` and `/uploads/` proxy locations for hafsa backend
- Fixed inactive user visibility in `browse.controller.ts`, `social.controller.ts`, `brides.controller.ts`
- Removed duplicate `NotificationPayload` interface in `notification.service.ts`
- Added HSTS and security headers in `server.ts`
- Strengthened Socket.IO CORS (requires `FRONTEND_URL`) and enforced DB verification in `socket.ts`
- Added file path sanitization in `upload.ts`
- Added `socialLimiter` for rate limiting in `social.routes.ts`
- Created `backend/src/services/cleanup.service.ts` for story/post cleanup

## TypeScript Fixes
- `req.params` values typed as `string | string[]` — use `const x = req.params.x as string` pattern
- `UserAvatar` `size` prop only accepts `'sm' | 'md' | 'lg'` (no 'xl')
- `await` outside async function in socket handler — use IIFE

## Client Logging System

### Architecture

```
FE console.log/error/warn/info/debug
  → FrontendLogger (frontend/src/lib/logger.ts)
    → sendBeacon(raw string, text/plain)  // no CORS preflight needed
    → POST https://commerce-api.et3am.com/hafsa/api/logs/client[/public]
      → nginx /hafsa/api/logs/ → backend :3001/api/logs/
      → logs.controller.ts ingestClientLog / ingestClientLogPublic
        → Winston DailyRotateFile → backend/logs/*.log
```

### Key Files

| File | Purpose |
|------|---------|
| `frontend/src/lib/logger.ts` | Overrides `console.*` methods, queues entries, flushes via `sendBeacon` (falls back to `fetch`). Anonymous → `/client/public`, authenticated → `/client` |
| `backend/src/modules/logs/logs.controller.ts` | `ingestClientLog` (auth'd), `ingestClientLogPublic` (anon) — parse JSON body and log via Winston |
| `backend/src/modules/logs/logs.routes.ts` | Routes: `POST /client` (auth + 30/min), `POST /client/public` (anon + 5/min) |
| `backend/src/services/logger.ts` | Winston with daily rotation to `backend/logs/` |

### Important Details

- **CORS fix**: `sendBeacon` sends raw string (`text/plain`), NOT `application/json` Blob — avoids silent CORS preflight failure on cross-origin requests from Firebase → commerce-api
- **URL fix**: `LOGS_PUBLIC` uses full API URL (`${API_BASE}/logs/client/public`) not relative path — Firebase hosting has no `/logs/` proxy
- **Backend**: `express.text()` middleware and `JSON.parse` for string bodies so `text/plain` payloads are handled
- **PM2** captures stdout from Winston console transport — view via `pm2 logs hafsa-backend`

### Stored Logs

On EC2 at `/home/ec2-user/hafsa/backend/logs/`:
- `combined-YYYY-MM-DD.log` — all levels (30 days, 20MB each, zipped)
- `error-YYYY-MM-DD.log` — errors only (90 days, 20MB each, zipped)

## Build Commands (both must pass)
```
cd backend && npm run build
cd frontend && npm run build
```

## Deployment
- **Backend**: `cd backend && npm run build && pm2 restart hafsa-backend`
- **Frontend**: `cd frontend && npm run build && firebase deploy --only hosting`
- **Schema**: `cd backend && npx prisma db push && npx prisma generate`
- **Push code**: `git add . && git commit -m "msg" && git push`

## Branch
`main` (current working branch)
