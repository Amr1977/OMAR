<div align="center">
  <h1>عمر — OMAR</h1>
  <p><strong>A full-featured social platform for men — marriage introductions, social networking, service marketplace, and e-commerce</strong></p>
  <p>شبكة اجتماعية متكاملة للرجال</p>
  <br>
  <img src="frontend/public/og/og-main.png" alt="OMAR Platform" width="600"/>
  <br><br>
</div>

**OMAR** is a production-grade web platform serving as a comprehensive social network for men. It spans four interconnected verticals: a marriage introduction system with guardian oversight, a general social media feed with rich content features, a service marketplace connecting providers with consumers, and an e-commerce engine for user-run storefronts. Named after **Omar ibn al-Khattab** (عمر بن الخطاب), the platform emphasizes strength, justice, and community.

The platform began as a marriage-focused application (codename *Hafsa*, after Hafsa bint Umar) and evolved into a broader social ecosystem while keeping the marriage vertical as its core differentiator.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Firebase Hosting)                   │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  React 18 + TypeScript + Vite                                  │ │
│  │  Tailwind CSS / Dark Mode / RTL / react-i18next (4 langs)      │ │
│  │  Zustand (state) / TanStack Query / react-hook-form / Zod      │ │
│  │  Socket.IO Client / Firebase Auth / FCM / Leaflet Maps         │ │
│  └──────┬──────────────────────┬──────────────────┬───────────────┘ │
│         │ HTTP/JSON            │ WebSocket         │ Firebase Auth   │
└─────────┼──────────────────────┼──────────────────┼─────────────────┘
          │                      │                  │
┌─────────┼──────────────────────┼──────────────────┼─────────────────┐
│         ▼                      ▼                  ▼                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              NGINX REVERSE PROXY (EC2)                       │   │
│  │  commerce-api.et3am.com/hafsa/* → localhost:3001             │   │
│  │  /uploads/* → filesystem · /socket.io/* → ws                │   │
│  └───────────────────────┬──────────────────────────────────────┘   │
│                          │                                          │
│  ┌───────────────────────▼──────────────────────────────────────┐   │
│  │                  EXPRESS SERVER (PM2)                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │   │
│  │  │ Auth     │ │ Profiles │ │ Social   │ │ Services     │   │   │
│  │  │ Module   │ │ Module   │ │ Module   │ │ Marketplace  │   │   │
│  │  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────────┤   │   │
│  │  │ Browse   │ │ Brides   │ │ Messages │ │ E-shops      │   │   │
│  │  │ Module   │ │ Module   │ │ Module   │ │ Module       │   │   │
│  │  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────────┤   │   │
│  │  │ Requests │ │ Search   │ │Admin/Dash│ │ Notifications│   │   │
│  │  │ Module   │ │ Module   │ │ Module   │ │ + Push (FCM) │   │   │
│  │  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────────┤   │   │
│  │  │Feedback  │ │Subscript.│ │Donations │ │ Connections  │   │   │
│  │  │ Module   │ │ Module   │ │ Module   │ │ Module       │   │   │
│  │  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────────┤   │   │
│  │  │Logs      │ │ServiceRq │ │Payments  │ │ Cleanup      │   │   │
│  │  │ Module   │ │ Module   │ │ Module   │ │ Service      │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │   │
│  │                                                              │   │
│  │  Middleware: auth · rate-limit · role-guard · subscription   │   │
│  │  · request-logger · security-headers · CORS · optional-auth  │   │
│  └──────────┬───────────────────────────────────────────────────┘   │
│             │                                                       │
│  ┌──────────▼───────────────────────────────────────────────────┐   │
│  │  Prisma ORM + PostgreSQL (Neon DB)                            │   │
│  │  40+ models · migrations · connection pooling                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  BACKEND (Node.js / EC2)                                            │
└─────────────────────────────────────────────────────────────────────┘
```

<div align="center">
  <img src="frontend/public/og/og-banner.png" alt="OMAR Architecture Overview" width="100%"/>
</div>

---

## Features

### Authentication & Role System

Authentication is handled by **Firebase Auth** with email/password and Google Sign-In. The platform defines an extended role system beyond Firebase: **GROOM** (marriage seeker), **GUARDIAN** (family representative who browses and initiates contact), **BOTH** (acting in both capacities), **SOCIAL** (general social-only accounts with no marriage profile), and **ADMIN**. Roles gate both frontend routes and backend API access through a middleware chain that checks role membership, subscription status, and rate limits on every request.

### Marriage Introduction System

The marriage vertical is the platform's original core. Grooms complete a **multi-step profile wizard** covering 40+ fields — personal characteristics, education, occupation, religious practice, family background, residence details, marital history, and partner preferences. Profiles are submitted for admin review (or AI-assisted review in premium tiers) and support photo galleries, privacy toggles, and visibility controls.

Guardians use a **dedicated browse interface** with filtering and optional AI-powered suggestions (GPT-4o, premium feature) to find suitable matches. They send, accept, or reject **contact requests**; accepted requests unlock real-time messaging. A **guardian dashboard** tracks sent requests, received responses, and matched grooms, while grooms have their own inbox and dashboard for incoming interest.

The platform also includes a **bride record system** — guardians can create and manage detailed bride profiles (40+ fields across 8 sections covering general specs, education, family, residence, religious practice, and partner criteria) with status tracking (Active / Matched / Archived). Grooms can browse exposed bride records in a read-only view.

### Social Feed & Content

The **social feed** is a full-featured social media engine. Users create posts with text and media (images/video, multi-file upload, 100MB limit) and control visibility per-post: **PUBLIC**, **CONNECTIONS** (followers only), **PRIVATE** (just the author), or **SELECTED** (explicit user list). Posts support likes, comments, threaded comment replies, comment likes, bookmarks, reposting with commentary, pinning to profile, and shareable links.

**Stories** are 24-hour ephemeral posts with image/video support, a carousel viewer with progress indicators, and privacy controls (PUBLIC or FOLLOWERS). Unviewed stories are highlighted with a gold gradient ring.

Content discovery includes **hashtag parsing** (`#tag` auto-linked to a dedicated feed with trending tracking), **user mentions** (`@username` with notification), and a **people search** page with name-based lookup and suggested users (friends-of-friends algorithm plus popular accounts).

A **block system** provides bidirectional blocking that removes the blocked user from feed, search, and suggestions. A **post reporting system** lets users flag content for admin review with optional auto-deletion on resolution. A **reputation scoring** system tracks positive contributions.

### Real-time Messaging

The **messaging system** uses Socket.IO for real-time bidirectional communication. Conversations are either initiated through accepted marriage contact requests (`REQUEST`) or started directly (`DIRECT`). Features include typing indicators, read receipts, conversation participant tracking, and push notifications via Firebase Cloud Messaging.

**Socket.IO presence** tracks user online/offline status in real-time, broadcasting state changes to followers. The WebSocket connection is authenticated via JWT with database-level user verification (no bypass flags).

### Service Marketplace

The **services module** is a full-service marketplace. Users create service listings with pricing, descriptions, categories, images, and location data (latitude/longitude for GIS-based discovery). Customers browse, filter by category, and book services. A review and rating system provides quality signals.

The **service requests** system lets users post open requests for services they need, and providers submit offers on those requests — creating a two-sided marketplace.

### E-commerce Stores

The **e-shops module** provides full e-commerce capabilities. Users create stores with branding, images, and slugs for public URLs. Products are organized under categories with pricing, images, and inventory. A **shopping cart** system supports add/remove/update operations with persistent cart storage. **Checkout** creates orders with line items, status tracking, and store-specific order management for sellers.

### Admin Dashboard

A comprehensive **admin panel** provides system-wide oversight: user management (list, search, ban, verify, delete), profile moderation (approve/reject groom profiles), post moderation (delete any post), conversation monitoring, feedback/testimonial moderation (approve/reject/delete), report management (resolve user and post reports), subscription verification (approve/decline premium plan payments), donation management, store/product moderation, and order oversight. Analytics charts (recharts PieChart and BarChart) show user distribution by role and weekly activity.

### Notifications

Every significant action generates a notification — profile views, contact requests, messages, post likes, comments, comment replies, follows, mentions, and report resolutions. Notifications are delivered in-app via Socket.IO in real-time and as **push notifications** through Firebase Cloud Messaging (FCM). A read/unread tracking system with a badge counter in the navigation bar keeps users informed.

### Subscriptions & Donations

Premium subscriptions are available in 1-month (150 EGP), 3-month (350 EGP), 6-month (600 EGP), and 12-month (1000 EGP) tiers. Payment methods include Instapay, Vodafone Cash, and USDT TRC20 (crypto with network warnings). Users upload transaction proof for admin verification. Premium users receive a gold ring and crown badge on their avatar throughout the platform.

One-time donations follow the same payment and verification flow.

### Internationalization & UI

The interface supports **4 languages** (Arabic RTL, English, French, Urdu) with full right-to-left layout via Tailwind RTL plugin. A complete **dark mode** implementation uses CSS custom properties and class-based toggling with system preference detection. The UI is mobile-first responsive with a slide-out navigation drawer.

<div align="center">
  <img src="frontend/public/og/og-square.png" alt="OMAR" width="400"/>
</div>

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| React Router v6 | Client-side routing (45+ routes) |
| Tailwind CSS 3 + tailwindcss-rtl | Styling with RTL + dark mode |
| Zustand | State management (auth, theme) |
| @tanstack/react-query | Server state & caching |
| react-hook-form + Zod | Form management & validation |
| Firebase SDK (v10) | Auth + Cloud Messaging + Analytics |
| Socket.IO Client | Real-time WebSocket communication |
| react-i18next + i18next | Internationalization (4 languages) |
| recharts | Admin dashboard charts |
| Leaflet + react-leaflet | GIS/map integration for services & stores |
| Vite | Build tool |
| Playwright | E2E testing |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + TypeScript | Runtime |
| Express.js | HTTP framework (130+ endpoints) |
| Prisma ORM | Database access + schema (40+ models) |
| PostgreSQL (Neon DB) | Database with connection pooling |
| Socket.IO | WebSocket server |
| Firebase Admin SDK | Auth verification + FCM push |
| JSON Web Tokens (JWT) | Token-based auth with refresh |
| express-rate-limit | Rate limiting (global, auth, social tiers) |
| Multer | File uploads (6 configurations) |
| Winston + Daily Rotate File | Server-side logging |
| OpenAI API | AI profile suggestions (premium) |
| Cloudinary | Media transformations (optional) |
| Nodemailer | Email notifications |
| ioredis | Redis for Socket.IO adapter |
| Zod | Input validation |
| Vitest | Unit/integration testing |

### Infrastructure

| Component | Service |
|---|---|
| Frontend hosting | Firebase Hosting |
| Backend server | EC2 (Node.js, PM2-managed) |
| Database | Neon (serverless PostgreSQL) |
| Domain + reverse proxy | commerce-api.et3am.com → nginx → :3001 |
| CI/CD | GitHub Actions (typecheck + build + release) |
| Monitoring | PM2 logs + Winston log rotation |

---

## API Overview

<details>
<summary><b>Authentication</b> — Register, login, token refresh, role management, avatar</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register with email/password or Google |
| POST | `/api/auth/verify-otp` | Verify OTP (legacy) |
| POST | `/api/auth/refresh-token` | Refresh JWT access token |
| POST | `/api/auth/logout` | Invalidate session |
| GET | `/api/auth/me` | Get authenticated user |
| PUT | `/api/auth/roles` | Update user roles |
| POST | `/api/auth/avatar` | Upload profile avatar |
| DELETE | `/api/auth/avatar` | Remove profile avatar |
</details>

<details>
<summary><b>Profiles</b> — Marriage profile CRUD, photos, visibility, submission</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/profiles/` | Create marriage profile |
| GET | `/api/profiles/my` | Get my profile |
| GET | `/api/profiles/:id` | Get profile by ID |
| PUT | `/api/profiles/:id` | Update profile |
| DELETE | `/api/profiles/:id` | Delete profile |
| POST | `/api/profiles/:id/photos` | Upload photo (base64 data URL) |
| PUT | `/api/profiles/:id/photos/:photoId/primary` | Set primary photo |
| DELETE | `/api/profiles/:id/photos/:photoId` | Delete photo |
| PUT | `/api/profiles/:id/visibility` | Toggle profile visibility |
| POST | `/api/profiles/:id/submit` | Submit for admin review |
</details>

<details>
<summary><b>Browse</b> — Guardian profile browsing and AI suggestions</summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/browse/profiles` | Browse groom profiles (guardian) |
| GET | `/api/browse/profiles/:id` | Profile detail view |
| GET | `/api/browse/ai-suggestions` | AI-powered recommendations (premium) |
</details>

<details>
<summary><b>Bride Records</b> — Guardian-managed bride profiles</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/brides/` | Create bride record |
| GET | `/api/brides/` | List my bride records |
| GET | `/api/brides/:id` | Get bride record detail |
| PUT | `/api/brides/:id` | Update bride record |
| DELETE | `/api/brides/:id` | Delete bride record |
| POST | `/api/brides/:id/expose` | Expose bride to specific groom |
| DELETE | `/api/brides/:id/expose/:groomId` | Remove groom exposure |
| GET | `/api/brides/:id/exposures` | Get exposure list |
</details>

<details>
<summary><b>Contact Requests</b> — Marriage introduction requests</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/requests/` | Send contact request |
| GET | `/api/requests/sent` | List sent requests |
| GET | `/api/requests/received` | List received requests |
| PUT | `/api/requests/:id/accept` | Accept request |
| PUT | `/api/requests/:id/reject` | Reject request |
</details>

<details>
<summary><b>Connections</b> — Social connection requests (non-marriage)</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/connections/` | Send connection request |
| POST | `/api/connections/:id/accept` | Accept connection |
| GET | `/api/connections/my` | List my connections |
| GET | `/api/connections/pending` | List pending requests |
</details>

<details>
<summary><b>Messaging</b> — Real-time conversations</summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/messages/conversations` | List conversations |
| GET | `/api/messages/conversations/:id` | Get messages in conversation |
| POST | `/api/messages/conversations/:id` | Send message |
| PUT | `/api/messages/conversations/:id/read` | Mark conversation as read |
| POST | `/api/messages/direct` | Start direct conversation (no request) |
</details>

<details>
<summary><b>Social Feed</b> — Posts, interactions, hashtags, stories, users</summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/social/feed` | Get social feed |
| GET | `/api/social/explore` | Explore trending posts |
| POST | `/api/social/posts` | Create a post |
| GET | `/api/social/posts/:id` | Get post (public — optional auth) |
| PUT | `/api/social/posts/:id` | Update post |
| DELETE | `/api/social/posts/:id` | Delete post |
| PATCH | `/api/social/posts/:id/privacy` | Update post privacy |
| POST | `/api/social/posts/media` | Upload post media (multi-file) |
| POST | `/api/social/posts/:id/like` | Toggle like |
| POST | `/api/social/posts/:id/save` | Toggle save/bookmark |
| POST | `/api/social/posts/:id/report` | Report a post |
| POST | `/api/social/posts/:id/pin` | Toggle pin to profile |
| GET | `/api/social/posts/:id/comments` | Get paginated comments |
| POST | `/api/social/posts/:id/comments` | Add comment |
| DELETE | `/api/social/posts/:id/comments/:commentId` | Delete comment |
| GET | `/api/social/posts/:id/comments/:commentId/replies` | Get reply thread |
| POST | `/api/social/posts/:id/comments/:commentId/replies` | Add reply |
| POST | `/api/social/comments/:commentId/like` | Toggle comment like |
| POST | `/api/social/posts/:id/share` | Repost with optional commentary |
| GET | `/api/social/saved` | Get saved/bookmarked posts |
| POST | `/api/social/follow/:userId` | Follow/unfollow user |
| GET | `/api/social/followers` | My followers |
| GET | `/api/social/following` | Who I follow |
| GET | `/api/social/followers/:userId` | User's followers |
| GET | `/api/social/following/:userId` | User's following |
| GET | `/api/social/reputation` | My reputation score |
| GET | `/api/social/user/:userId/posts` | User's posts |
| GET | `/api/social/user/:userId/reputation` | User's reputation |
| GET | `/api/social/user/:userId/profile` | User's public social profile |
| GET | `/api/social/users/search` | Search users by display name |
| GET | `/api/social/users/suggested` | Get suggested users |
| PUT | `/api/social/me/bio` | Update bio, tagline, website |
| POST | `/api/social/block/:userId` | Toggle block user |
| GET | `/api/social/blocked` | List blocked users |
| GET | `/api/social/hashtags/trending` | Get trending hashtags |
| POST | `/api/social/stories/media` | Upload story media |
| POST | `/api/social/stories` | Create a story |
| GET | `/api/social/stories/feed` | Get stories feed |
| POST | `/api/social/stories/:storyId/view` | Mark story as viewed |
| DELETE | `/api/social/stories/:storyId` | Delete own story |
</details>

<details>
<summary><b>Services Marketplace</b> — Service listings, bookings, reviews</summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/services/categories` | List service categories |
| GET | `/api/services` | Browse services |
| GET | `/api/services/my` | My service listings |
| GET | `/api/services/:id` | Get service detail |
| POST | `/api/services` | Create service listing |
| PUT | `/api/services/:id` | Update service |
| DELETE | `/api/services/:id` | Delete service |
| POST | `/api/services/:id/images` | Upload service image |
| DELETE | `/api/services/:id/images` | Delete service image |
| POST | `/api/services/:id/book` | Book a service |
| GET | `/api/services/bookings` | Get my bookings |
| PUT | `/api/services/bookings/:id` | Update booking status |
| POST | `/api/services/:id/reviews` | Add service review |
</details>

<details>
<summary><b>Service Requests</b> — Open request / offer marketplace</summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/service-requests` | Browse open requests |
| POST | `/api/service-requests` | Create a request |
| POST | `/api/service-requests/:id/offers` | Submit an offer |
</details>

<details>
<summary><b>E-commerce Stores</b> — Stores, products, cart, orders</summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/eshops/product-categories` | List product categories |
| GET | `/api/eshops/stores` | List stores |
| POST | `/api/eshops/stores` | Create a store |
| GET | `/api/eshops/stores/my` | Get my store |
| GET | `/api/eshops/stores/slug/:slug` | Get store by slug |
| GET | `/api/eshops/stores/:id` | Get store detail |
| PUT | `/api/eshops/stores/:id` | Update store |
| POST | `/api/eshops/stores/:id/images` | Upload store image |
| DELETE | `/api/eshops/stores/:id/images` | Delete store image |
| GET | `/api/eshops/products` | List products |
| GET | `/api/eshops/products/:id` | Get product detail |
| POST | `/api/eshops/stores/:storeId/products` | Create product |
| PUT | `/api/eshops/products/:id` | Update product |
| DELETE | `/api/eshops/products/:id` | Delete product |
| POST | `/api/eshops/products/:id/images` | Upload product image |
| DELETE | `/api/eshops/products/:id/images` | Delete product image |
| GET | `/api/eshops/cart` | Get my cart |
| POST | `/api/eshops/cart` | Add item to cart |
| PUT | `/api/eshops/cart/items/:id` | Update cart item quantity |
| DELETE | `/api/eshops/cart/items/:id` | Remove from cart |
| POST | `/api/eshops/orders` | Checkout / create order |
| GET | `/api/eshops/orders` | Get my orders |
| GET | `/api/eshops/orders/store` | Get store's orders |
| GET | `/api/eshops/orders/:id` | Get order detail |
| PUT | `/api/eshops/orders/:id/status` | Update order status |
</details>

<details>
<summary><b>Notifications</b> — In-app and push notification management</summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications/` | List my notifications |
| PUT | `/api/notifications/read-all` | Mark all as read |
| PUT | `/api/notifications/:id/read` | Mark one as read |
| POST | `/api/notifications/push-token` | Register FCM push token |
| DELETE | `/api/notifications/push-token` | Unregister FCM token |
</details>

<details>
<summary><b>Search</b> — Cross-entity global search</summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search` | Search across profiles, services, posts, service requests |
</details>

<details>
<summary><b>Feedback</b> — User feedback and public testimonials</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/feedback/` | Submit feedback or testimonial |
| GET | `/api/feedback/testimonials` | Get approved public testimonials |
</details>

<details>
<summary><b>Subscriptions</b> — Premium plan subscription</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/subscriptions/` | Create subscription with payment proof |
| GET | `/api/subscriptions/my` | Get current subscription status |
</details>

<details>
<summary><b>Donations</b> — One-time donations</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/donations/` | Create donation with payment proof |
</details>

<details>
<summary><b>Client Logs</b> — Frontend error ingestion</summary>

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/logs/client` | Ingest authenticated client logs (30/min) |
| POST | `/api/logs/client/public` | Ingest anonymous client logs (30/min) |
</details>

<details>
<summary><b>Admin</b> — System administration and moderation</summary>

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats + charts |
| GET | `/api/admin/logs` | View activity logs |
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/:id/ban` | Ban/unban user |
| PUT | `/api/admin/users/:id/verify` | Verify user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/profiles/pending` | Pending profile reviews |
| PUT | `/api/admin/profiles/:id/approve` | Approve profile |
| PUT | `/api/admin/profiles/:id/reject` | Reject profile |
| GET | `/api/admin/reports` | List user reports |
| PUT | `/api/admin/reports/:id/resolve` | Resolve report |
| GET | `/api/admin/post-reports` | List post reports |
| PUT | `/api/admin/post-reports/:id/resolve` | Resolve post report |
| GET | `/api/admin/posts` | List all posts |
| DELETE | `/api/admin/posts/:id` | Delete any post |
| GET | `/api/admin/conversations` | List all conversations |
| GET | `/api/admin/feedback` | List feedback entries |
| PUT | `/api/admin/feedback/:id/approve` | Approve feedback/testimonial |
| PUT | `/api/admin/feedback/:id/reject` | Reject feedback |
| DELETE | `/api/admin/feedback/:id` | Delete feedback |
| GET | `/api/admin/subscriptions` | List subscriptions |
| PUT | `/api/admin/subscriptions/:id/verify` | Verify subscription payment |
| PUT | `/api/admin/subscriptions/:id/decline` | Decline subscription |
| GET | `/api/admin/donations` | List donations |
| PUT | `/api/admin/donations/:id/verify` | Verify donation |
| PUT | `/api/admin/donations/:id/decline` | Decline donation |
| GET | `/api/admin/stores` | List all stores |
| PUT | `/api/admin/stores/:id/suspend` | Suspend/unsuspend store |
| GET | `/api/admin/products` | List all products |
| DELETE | `/api/admin/products/:id` | Delete any product |
| GET | `/api/admin/orders` | List all orders |
</details>

---

## Middleware & Security

| Middleware | File | Purpose |
|---|---|---|
| `generalLimiter` | `rateLimiter.ts` | 60 req/min global rate limit |
| `authLimiter` | `rateLimiter.ts` | 10 req/min for auth endpoints |
| `socialLimiter` | `rateLimiter.ts` | 30 req/min for social endpoints |
| `requireRole` | `roleGuard.ts` | Role-based access (GROOM, GUARDIAN, ADMIN, etc.) |
| `requireGuardian` | `roleGuard.ts` | Guardian-only routes |
| `requireGroom` | `roleGuard.ts` | Groom-only routes |
| `requireAdmin` | `roleGuard.ts` | Admin-only routes |
| `requirePremium` | `subscriptionGuard.ts` | Premium subscription required |
| `checkContactRequestLimit` | `subscriptionGuard.ts` | Free tier: max 3 contact requests/month |
| `optionalAuth` | `auth.ts` | Public routes with optional user context |
| `requestLogger` | `requestLogger.ts` | HTTP request logging (method, URL, status, duration) |

**Security headers** applied globally: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Strict-Transport-Security` (production, 1 year). File uploads sanitize filenames and enforce strict MIME-type and size limits per upload type.

---

## Deployment Architecture

The platform runs on a **hybrid infrastructure**:

- **Frontend**: Built with Vite and deployed to **Firebase Hosting** (`hafsa-77.web.app`, custom domain `hafsa.et3am.com`). The production build is a static SPA served globally via Firebase CDN.
- **Backend**: A Node.js/Express server running on an **EC2 instance** managed via **PM2** (process name: `hafsa-backend`). Listens on port 3001.
- **Reverse Proxy**: **nginx** on the EC2 instance proxies `/hafsa/` → `localhost:3001`, with additional locations for `/uploads/` (static files), `/socket.io/` (WebSocket), and `/logs/` (client log ingestion). The backend is accessible at `commerce-api.et3am.com/hafsa/api/`.
- **Database**: **Neon** (serverless PostgreSQL) with connection pooling. Schema managed via Prisma migrations (`db push` in development, `migrate deploy` in production).
- **Storage**: Uploaded media (profile photos, post media, story media, avatars, service/store images) is stored on the EC2 instance's local filesystem under `backend/uploads/` with per-type subdirectories, served statically by nginx.
- **CI/CD**: GitHub Actions runs type-checking and builds on every push to `main`. Successful builds trigger a GitHub Release with an auto-generated tag. Backend deployment is manual via `git pull && npm run build && pm2 restart`. Frontend deployment is `npm run build && firebase deploy --only hosting`.

### Automated Error Recovery

A **log analyzer** script (`scripts/auto-fix.sh` via cron, runs every 30 minutes) scans backend error logs for known error patterns (CORS origin mismatches, connection refused, double response headers) and applies automated fixes. Unknown errors are escalated to an AI tool (opencode/kilocode) for root-cause analysis and remediation. All fixes are auto-committed and deployed.

---

## Project Structure

```
OMAR/
├── backend/
│   ├── src/
│   │   ├── config/            # Firebase admin init, database, multer uploads
│   │   ├── middleware/        # Auth, rate limiting, role guard, subscription guard, request logger
│   │   ├── modules/
│   │   │   ├── auth/          # Registration, login, token refresh, avatar
│   │   │   ├── profiles/      # Marriage profile CRUD, photos, visibility, submission
│   │   │   ├── browse/        # Guardian browsing, filtering, AI suggestions
│   │   │   ├── requests/      # Marriage contact requests (send/accept/reject)
│   │   │   ├── connections/   # Social connection requests
│   │   │   ├── messages/      # Conversations + Socket.IO real-time chat
│   │   │   ├── social/        # Posts, stories, hashtags, mentions, likes, comments, shares, follows, block, report, reputation
│   │   │   ├── notifications/ # In-app notifications + FCM push
│   │   │   ├── services/      # Service marketplace (CRUD, categories, bookings, reviews)
│   │   │   ├── serviceRequests/ # Open request/offer system
│   │   │   ├── eshops/        # E-commerce (stores, products, cart, orders)
│   │   │   ├── search/        # Global cross-entity search
│   │   │   ├── brides/        # Guardian-managed bride records
│   │   │   ├── feedback/      # User feedback & testimonials
│   │   │   ├── subscriptions/ # Premium plan payment verification
│   │   │   ├── donations/     # One-time donation payment verification
│   │   │   ├── payments/      # Stripe integration (deprecated)
│   │   │   ├── admin/         # Dashboard, users, profiles, posts, reports, logs, stores, products, orders
│   │   │   └── logs/          # Client-side error log ingestion
│   │   ├── services/          # Logger (Winston), socket setup, notification dispatch, cleanup jobs
│   │   ├── prisma/            # Seed data
│   │   └── server.ts          # Express entry point (130+ routes, middleware chain)
│   ├── prisma/
│   │   └── schema.prisma      # 40+ models
│   ├── logs/                  # Rotating log files (error: 90 days, combined: 30 days)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Layout, UserAvatar, ImageViewer, ServiceMap
│   │   ├── i18n/              # Translations (ar, en, fr, ur)
│   │   ├── lib/               # Firebase init, API client, Socket.IO, logger, rich text renderer
│   │   ├── pages/             # 45+ route page components
│   │   │   ├── admin/         # Dashboard, Users, Profiles, Reports, Posts, Messages, Feedback, Subscriptions, Donations
│   │   │   ├── auth/          # Login, Register
│   │   │   ├── browse/        # Browse, ProfileDetail, AiSuggestions, GroomBrowseBrides
│   │   │   ├── guardian/      # BrideList, BrideForm
│   │   │   ├── messages/      # Messages, Conversation
│   │   │   ├── profile/       # ProfileSetup, MyProfile
│   │   │   ├── services/      # ServiceList, ServiceDetail, ServiceForm, MyServices, MyBookings
│   │   │   ├── serviceRequests/ # ServiceRequests, ServiceRequestForm
│   │   │   ├── settings/      # Settings, Subscription
│   │   │   ├── siyar/         # HafsaStory
│   │   │   ├── social/        # SocialFeed, PostDetail, UserPublicProfile, HashtagFeed, PeopleSearch, StoriesBar
│   │   │   ├── connections/   # ConnectionRequests
│   │   │   ├── Requests.tsx, SentRequests.tsx, GroomInbox.tsx
│   │   │   ├── GuardianDashboard.tsx, GroomDashboard.tsx
│   │   │   ├── Search.tsx, Donate.tsx, Feedback.tsx, Notifications.tsx, Landing.tsx
│   │   ├── stores/            # Zustand (auth, theme)
│   │   ├── generated/         # Auto-generated version.ts
│   │   ├── App.tsx            # Router (45+ routes)
│   │   └── main.tsx           # Entry point
│   ├── public/
│   │   ├── og/                # Open Graph images
│   │   └── firebase-messaging-sw.js
│   └── package.json
│
├── scripts/
│   ├── log-analyzer.js        # Automated error log scanning + pattern fixes + AI fallback
│   ├── auto-fix.sh            # Cron wrapper with lockfile for log analyzer
│   ├── bump.sh                # Semantic version bumper (patch/minor/major)
│   └── generate-version.sh    # Version.ts generator from VERSION + git info
├── .githooks/
│   ├── pre-commit             # Auto-bump patch version on source changes
│   ├── post-commit            # (reserved)
│   └── post-checkout          # (reserved)
├── .github/workflows/
│   └── ci.yml                 # TypeScript check + build + GitHub Release
├── docs/
│   ├── ACTIVITY_LOG.md        # Changelog
│   └── ARCHITECTURE_REVIEW.md # Architecture analysis
├── VERSION                    # Current semantic version (auto-bumped)
├── AGENTS.md                  # AI agent context (internal)
├── LICENSE
└── README.md
```

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/). The current version is stored in `VERSION` at the project root. A **pre-commit git hook** auto-increments the patch version when source files change (skipping VERSION, package.json, docs, and prompts).

- **Patch** — auto-bumped on each commit with source changes
- **Minor** — manual: `bash scripts/bump.sh minor`
- **Major** — manual: `bash scripts/bump.sh major`

The version is synced to both `package.json` files and displayed in the application footer. On pushes to `main`, GitHub Actions creates a Git tag and a GitHub Release automatically.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A PostgreSQL database (Neon recommended)
- A Firebase project (Auth + Cloud Messaging)
- Redis (recommended for Socket.IO adapter)

### Setup

```bash
git clone https://github.com/Amr1977/OMAR.git
cd OMAR

# Backend
cd backend && npm install
cp .env.example .env   # Fill in: DATABASE_URL, JWT_SECRET, Firebase credentials, etc.
npx prisma db push     # Push schema to database

# Frontend
cd ../frontend && npm install
cp .env.example .env   # Fill in: Firebase project credentials + VAPID key
```

### Run

```bash
# Terminal 1 — Backend (http://localhost:3001)
cd backend && npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend && npm run dev
```

### Enable Git Hooks

```bash
git config core.hooksPath .githooks
```

---

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for commit conventions, code style guidelines, and the PR process.

---

## License

[MIT](LICENSE) © Omar Platform
