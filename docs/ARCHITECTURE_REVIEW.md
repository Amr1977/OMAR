# Technical Architecture Review — HAFSA Platform

## Executive Summary

HAFSA is a comprehensive Islamic marriage platform built with a modern Node.js/Express backend and React/Vite frontend. The codebase demonstrates solid architectural patterns but has areas requiring attention for production readiness and scalability.

---

## 1. Architecture Overview

### 1.1 Stack & Deployment
- **Backend**: Node.js/Express + Prisma/PostgreSQL (Neon)
- **Frontend**: React/Vite + Firebase Hosting
- **Real-time**: Socket.IO (v4.8.1)
- **Media Storage**: VPS local disk via Multer (not cloud)
- **Deployment**: PM2 for backend, nginx proxy for `/hafsa/` → port 3001
- **Authentication**: JWT-based with Firebase integration

### 1.2 Domain Model
The application centers around matchmaking profiles with social networking features:

**Core Entities**:
- `User` - Multi-role authentication (GROOM, GUARDIAN, SOCIAL, ADMIN)
- `Profile` - Detailed profile with 70+ attributes for matchmaking criteria
- `Bride` - Guardian-managed bride profiles
- `BrideExposure` - Visibility control between grooms and brides
- `ContactRequest` - Matchmaking connection requests

**Social Features**:
- `Post`, `PostLike`, `PostComment`, `PostCommentLike`
- `PostSave`, `PostView`, `PostHashtag`, `PostMention`
- `PostReport`, `Block`, `Follow`
- `Story`, `StoryView` (24-hour ephemeral content)

**Marketplace**:
- `Store`, `Product`, `ProductCategory`, `Order`, `Cart`

**Services**:
- `Service`, `ServiceCategory`, `ServiceBooking`

---

## 2. Strengths

### 2.1 Clean Architecture
- **Modular Structure**: Well-organized modules (`/modules/*`) with separated routes/controllers
- **Middleware Pattern**: Auth, rate limiting, and request logging properly abstracted
- **Service Layer**: Notification and socket services follow single-responsibility principle

### 2.2 Type Safety
- TypeScript throughout with proper type definitions
- `AuthRequest` interface extends Express Request for auth context
- Zod for validation (referenced in package.json)

### 2.3 Privacy & Access Control
- Sophisticated post privacy model (PUBLIC, PRIVATE, CONNECTIONS, SELECTED)
- Block system prevents interaction with blocked users
- Role-based route guards (`requireGroom`, `requireGuardian`, `requireAdmin`)

### 2.4 Real-time Features
- Socket.IO integration for messaging and notifications
- Presence system (online/offline tracking)
- Automatic `post_created` event broadcasting to followers

### 2.5 Multi-language Support
- Full i18n implementation (ar, en, ur, fr)
- RTL/LTR direction handling
- Arabic UI as default language

---

## 3. Areas of Concern

### 3.1 Security Issues

**Critical Issues:**
- **Socket Authentication Bypass**: `SOCKET_VERIFY_DB` flag defaults to false, allowing token spoofing
- **No Input Validation**: Controllers lack Zod validation for request bodies (only presence checks)
- **SQL Injection Risk**: Using `array_contains` with raw strings in admin queries (line 51-52 in admin.controller.ts)
- **Missing HTTPS Enforcement**: No HSTS or secure cookie flags configured

**Medium Issues:**
- CORS allows all origins when `FRONTEND_URL` is empty (`*` fallback)
- File upload paths not sanitized against path traversal
- No rate limiting on social endpoints (only `generalLimiter` at app level)

### 3.2 Code Quality Issues

**Frontend:**
```tsx
// SocialFeed.tsx line 241 - Inefficient
const userName = (p: any) => p.user.profile?.displayName || p.user.roles?.find(...) || ''
// Should use proper TypeScript types instead of `any`
```

**Backend:**
```typescript
// social.controller.ts - Repeated IIFE pattern for async in callbacks
(async () => { ... })() // Line 175-180
```

**Duplicate Interface Definition:**
- `NotificationPayload` defined twice in notification.service.ts (lines 5-13 and 50-58)

### 3.3 Performance Concerns

- **N+1 Query Risk**: Follower counts computed dynamically in `getUserProfile` without caching
- **Missing Database Indexes**: Several composite queries lack supporting indexes
- **Story Expiration**: No cron job for expired story cleanup
- **Large File Uploads**: 100MB limit for social media (line 38 in upload.ts) may cause memory issues

---

## 4. Scalability Assessment

### 4.1 Current Architecture
- **Monolith**: Single Express server handles all concerns
- **Sessionless**: JWT-only auth enables horizontal scaling
- **Socket.IO State**: Uses Redis adapter would be needed for multi-instance

### 4.2 Bottlenecks
- `getFeed` query performs multiple joins with blocking logic
- `getSuggestedUsers` performs multiple sequential DB queries
- No pagination cursor-based strategy (uses offset)

### 4.3 Recommendations
- Implement Redis caching for trending hashtags and user suggestions
- Add read replicas for profile browsing queries
- Consider message queue for notification processing

---

## 5. Data Model Observations

### 5.1 Schema Strengths
- Proper foreign key relationships with cascade delete
- Unique constraints prevent duplicate interactions
- Indexes on frequently queried fields (status, userId)

### 5.2 Schema Issues
- **Redundant `roles` field**: Both `User.roles` (Json) and `UserRole` enum exist
- **24-hour TTL for Stories**: Manual expiration logic, no automated cleanup
- **Missing `updatedAt` on PostLike/CommentLike**: Audit trail incomplete

---

## 6. API Design

### 6.1 RESTful Patterns
- Good use of HTTP methods (GET/POST/PATCH/PUT/DELETE)
- Consistent error response format with error codes

### 6.2 Missing Features
- No API versioning
- No OpenAPI/Swagger documentation
- No request/response DTOs documented

---

## 7. Testing Coverage

**Current State**: Minimal
- Only one test file found: `tests/api-admin.test.ts`
- No unit tests for controllers
- No integration tests for critical flows

**Recommendations**:
- Add Jest tests for controller logic
- E2E tests for matchmaking workflows
- Socket.IO event testing

---

## 8. Deployment & Operations

### 8.1 Logging
- Winston with daily rotation configured
- Good structure with request logging middleware
- Missing structured correlation IDs

### 8.2 Health Checks
- `/health` endpoint exists
- `/api/stats` for monitoring

### 8.3 Missing
- No graceful shutdown timeout for DB connections
- No metrics endpoint (Prometheus/Grafana ready)
- No log aggregation service configuration

---

## 9. Recommended Action Items

### Priority 1 (Critical) - **PARTIALLY APPLIED**
1. ✅ Socket auth verification enforced (removed optional `SOCKET_VERIFY_DB` flag)
2. ⏸️ Zod validation middleware - requires infrastructure setup
3. ⏸️ Redis adapter for Socket.IO - requires infrastructure
4. ✅ File upload path sanitization added

### Priority 2 (High) - **PARTIALLY APPLIED**
1. ⏸️ Cursor-based pagination - significant refactor required
2. ⏸️ Database indexes - requires migration
3. ⏸️ Story expiration cleanup job - created service but not integrated
4. ✅ HTTPS/HSTS headers added

### Priority 3 (Medium) - **COMPLETED**
1. ✅ Removed duplicate interface in notification.service.ts
2. ⏸️ Comprehensive TypeScript types - significant refactor
3. ✅ Per-endpoint rate limiting added for social module
4. ⏸️ OpenAPI documentation - requires significant addition

### Priority 4 (Low) - **PARTIALLY APPLIED**
1. ⏸️ Rename package.json names - requires testing
2. ⏸️ Extract magic strings to constants - ongoing
3. ⏸️ Unit test coverage - requires test infrastructure

---

## 10. File Structure Summary

```
backend/
├── src/
│   ├── config/          # Database, upload, firebase, redis configs
│   ├── middleware/      # Auth, rate limiting, role guards
│   ├── modules/         # Feature modules (auth, social, admin, etc.)
│   ├── services/        # Socket, notification, logger services
│   └── server.ts        # Main entry point
├── prisma/
│   └── schema.prisma    # Database schema (1085 lines, 30+ models)
└── package.json

frontend/
├── src/
│   ├── components/      # UI components
│   ├── lib/             # API client, socket, utilities
│   ├── pages/           # Route pages by feature
│   ├── stores/          # Zustand state management
│   └── App.tsx          # Routing configuration
└── package.json
```

---

## Review Date
Generated: 2026-06-09
Branch: `fix/client-logs-anon`

## Bug Fixes Applied

### Guardian Bride Listing Bug
- **Issue**: When a user disabled their groom role, their profile still appeared in guardian's bride listings
- **Fix**: Added `isActive: true` check to all profile/visibility queries:
  - `browse.controller.ts`: `browseProfiles`, `browseGroomsForGuardian`, `getAiSuggestions`, `getProfileDetail`
  - `social.controller.ts`: `searchUsers`, `getSuggestedUsers`, `getUserProfile`, `getUserPosts`, `getStoriesFeed`
  - `brides.controller.ts`: `getVisibleBrides` + guard for inactive grooms in `exposeBride`

### Code Quality Fix
- **Duplicate Interface**: Removed duplicate `NotificationPayload` interface definition in `notification.service.ts`