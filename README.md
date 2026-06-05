<div align="center">
  <h1>حفصة — Hafsa</h1>
  <p><strong>An Islamic marriage platform connecting families with integrity</strong></p>
  <p>شبكة إسلامية للتعارف بقصد الزواج</p>
  <br>
</div>

**Hafsa** is a full-featured web platform designed to facilitate Islamic marriage introductions. It enables guardians (أولياء) to browse profiles of those seeking marriage, communicate securely, and manage the matchmaking process — all within an Islamic framework.

The platform is named after **Hafsa bint Umar** (حفصة بنت عمر), one of the Mothers of the Believers, reflecting the project's commitment to Islamic values.

## Versioning

This project follows [Semantic Versioning](https://semver.org/). The current version is stored in `VERSION` at the project root and is auto-bumped on every commit via a `pre-commit` git hook (patch version increments when source files change).

- **Patch** — auto-bumped on each commit with source changes
- **Minor** — manual: `bash scripts/bump.sh minor`
- **Major** — manual: `bash scripts/bump.sh major`

The version is displayed in the application footer and synced to `frontend/package.json` and `backend/package.json`. On pushes to `main`, GitHub Actions creates a Git tag and a GitHub Release automatically.

## Features

### Authentication & Roles
- **Email/Password + Google Sign-In** via Firebase Auth
- **5 User Roles**: GROOM (راغب في الزواج), GUARDIAN (ولي), BOTH (الاثنان), SOCIAL (تواصل اجتماعي), ADMIN
- **Role-based Routing**: Each role sees relevant navigation and features
- **SOCIAL Role**: Men-only social media accounts — no marriage profile, instant access to social feed
- **Guardian Simplified Setup**: Guardians skip the multi-step marriage profile — redirected straight to browsing

### Profile Management (Grooms)
- **Multi-step Profile Wizard**: 40+ fields covering personal specs, education, work, marriage preferences, family, residence, partner criteria
- **Photo Gallery**: Upload up to 6 photos (stored as base64 data URLs in DB), set primary, delete
- **Privacy Controls**: Toggle profile visibility (visible/hidden)
- **Submission for Review**: Profiles submitted for admin approval workflow
- **Auto-fallback Defaults**: All optional fields default to sensible values

### Guardian Browsing & Matching
- **Profile Browser**: Guardians filter and browse groom profiles
- **Contact Requests**: Send, accept, reject requests to initiate conversations
- **Sent/Received Management**: Track all request states
- **AI Suggestions**: GPT-4o-powered profile recommendations (premium feature)

### Bride Records (Guardian-managed)
- **Multi-step Bride Form**: 8 sections, 40+ fields matching real-world marriage application forms
- **Fields**: General specs, education/work, marital status, family data, residence, religious practice, partner preferences, additional notes
- **Full CRUD**: Guardians create, edit, delete multiple bride records
- **Status Tracking**: Active / Matched / Archived states
- **Dedicated UI**: List view with quick actions, step-by-step form wizard

### Real-time Messaging
- **Secure Chat**: Socket.IO-powered real-time messaging with typing indicators
- **Conversation Management**: List, send, mark as read

### Social Feed
- **Posts with Media**: Create posts with text + photos/videos (multi-file upload, 50MB limit)
- **Post Privacy**: PUBLIC / CONNECTIONS / PRIVATE visibility
- **Likes & Comments**: Real-time notifications for interactions
- **Repost System**: Share posts with optional commentary
- **Share Links**: Copy post URLs to clipboard
- **Follow System**: Follow/unfollow, follower/following lists
- **Image Viewer**: Full-screen zoom/pan modal for post media
- **Public Posts**: Individual posts accessible without authentication
- **User Reputation**: Reputation scoring per user
- **Premium Styling**: Gold border + glow for premium users' posts
- **Role Badges**: Visual author badges (مميز premium, ولي guardian, اجتماعي social)
- **UserAvatar Component**: Centralized avatar with role-based indicators (gold crown, green shield, blue star)
- **"Load More" Pagination**: Append-style infinite scroll

### Notifications
- **In-app Notifications**: Real-time socket events for profile views, contact requests, messages, post likes/comments, follows
- **Push Notifications**: Firebase Cloud Messaging (FCM) for all notification types
- **Read/Unread Tracking**: Mark individual or all as read
- **Badge Counter**: Unread count in navbar

### Subscription & Donation System
- **Multi-plan Subscriptions**: 1mo/150, 3mo/350, 6mo/600, 12mo/1000 EGP
- **Payment Methods**: Instapay, Vodafone Cash, USDT TRC20 (crypto with network warning)
- **Payment Flow**: Select plan → choose payment method → upload transaction proof → admin verification
- **Donations**: One-time donations with same payment methods
- **Admin Verification**: Manual verify/decline with admin notes
- **Premium Badges**: Gold ring + crown icon on premium user avatars

### Feedback & Testimonials
- **Feedback Submission**: Suggestions, bug reports, feature requests, testimonials with star ratings (1-5)
- **Public Testimonials**: Approved testimonials displayed on landing page
- **Admin Moderation**: Approve/reject/delete entries

### Admin Dashboard
- **Analytics Charts**: recharts PieChart (users by role) and BarChart (weekly activity)
- **Stats Cards**: Users, profiles, posts, conversations, messages, feedback, pending profiles, premium users, pending subscriptions, pending donations
- **Quick Actions**: 6 admin action cards
- **User Management**: List, search, ban, verify, delete users
- **Profile Moderation**: Approve/reject groom profiles
- **Post Management**: Search and delete any post
- **Conversation Monitoring**: View all conversations with participants
- **Feedback Moderation**: Filter by type, approve/reject/delete
- **Subscription/Donation Management**: Verify or decline payment requests

### Internationalization (i18n)
- **4 Languages**: Arabic (RTL), English, French, Urdu
- **RTL-first Design**: Full right-to-left layout with Tailwind CSS
- **UI Language Switcher**: In Settings page

### UI/UX
- **Dark Mode**: Full dark mode with system preference detection
- **Responsive Design**: Mobile-first with slide-out navigation drawer
- **Image Viewer**: Full-screen modal with zoom, pan, mouse wheel
- **UserAvatar**: Centralized avatar component with role badges, configurable sizes (sm/md/lg)
- **Landing Page**: Brand hero, feature cards, Hafsa story link, testimonials grid, donation sections
- **Login/Register**: Polished card layout with role selector grid, Google sign-in, password toggle

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| React Router v6 | Routing (30+ routes) |
| Tailwind CSS 3 | Styling (RTL-aware, dark mode) |
| Zustand | State management (auth, theme) |
| react-i18next + i18next | Internationalization (4 languages) |
| Socket.IO Client | Real-time messaging |
| Firebase Auth (email/password + Google) | Authentication |
| Firebase Cloud Messaging | Push notifications |
| recharts | Admin dashboard charts |
| Vite | Build tool (with version injection) |
| Firebase Hosting | Deployment |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + TypeScript | Runtime |
| Express.js | HTTP framework (70+ endpoints) |
| Prisma ORM (PostgreSQL) | Database access + schema management |
| Neon DB | PostgreSQL hosting |
| Socket.IO | Real-time WebSocket server |
| Firebase Admin SDK | Auth verification & push notifications |
| JSON Web Tokens (JWT) | Auth with refresh tokens |
| Zod | Input validation |
| OpenAI API | AI suggestions (optional) |
| Multer | File uploads (post media) |
| PM2 | Process management (EC2 deployment) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A PostgreSQL database (Neon, AWS RDS, or local)
- A Firebase project (for Auth + Cloud Messaging)

### 1. Clone and Install

```bash
git clone https://github.com/Amr1977/HAFSA.git
cd HAFSA

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

**Backend** — Copy and fill in the backend environment file:

```bash
cd backend
cp .env.example .env
# Edit .env with your database URL, JWT secret, Firebase credentials, etc.
```

**Frontend** — Copy and fill in the frontend environment file:

```bash
cd frontend
cp .env.example .env
# Edit .env with your Firebase project credentials
```

Also update `frontend/public/firebase-messaging-sw.js` with your Firebase project's config values.

### 3. Database Setup

```bash
cd backend
npx prisma db push    # Push schema directly (dev)
```

### 4. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:3001`.

### 5. Enable Git Hooks

```bash
git config core.hooksPath .githooks
```

This enables auto-version-bumping on every commit.

## Project Structure

```
HAFSA/
├── backend/
│   ├── src/
│   │   ├── config/          # Firebase admin, etc.
│   │   ├── lib/             # Shared utilities
│   │   ├── middleware/      # Auth, validation, rate limiting
│   │   ├── modules/         # Feature modules
│   │   │   ├── auth/        # Register, login, token refresh
│   │   │   ├── profiles/    # Profile CRUD, photos, visibility
│   │   │   ├── browse/      # Guardian browsing + AI suggestions
│   │   │   ├── requests/    # Contact requests (send/accept/reject)
│   │   │   ├── messages/    # Conversations + real-time chat
│   │   │   ├── social/      # Posts, likes, comments, shares, follows
│   │   │   ├── notifications/ # In-app + FCM push
│   │   │   ├── feedback/    # User feedback & testimonials
│   │   │   ├── subscriptions/ # Premium plan subscription
│   │   │   ├── donations/   # One-time donations
│   │   │   ├── brides/      # Guardian-managed bride records
│   │   │   ├── payments/    # Stripe integration (deprecated)
│   │   │   └── admin/       # Dashboard, users, profiles, posts, etc.
│   │   ├── prisma/          # Schema + seed
│   │   └── server.ts        # Entry point
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, UserAvatar, ImageViewer
│   │   ├── i18n/            # Translation files (ar, en, fr, ur)
│   │   ├── lib/             # Firebase init, API client, helpers
│   │   ├── pages/           # All page components (30+ routes)
│   │   │   ├── admin/       # 8 admin pages
│   │   │   ├── auth/        # Login, Register
│   │   │   ├── browse/      # Browse, ProfileDetail, AiSuggestions
│   │   │   ├── guardian/    # BrideList, BrideForm
│   │   │   ├── messages/    # Messages, Conversation
│   │   │   ├── profile/     # ProfileSetup, MyProfile
│   │   │   ├── settings/    # Settings, Subscription
│   │   │   ├── siyar/       # HafsaStory
│   │   │   └── social/      # SocialFeed, PostDetail
│   │   ├── stores/          # Zustand stores (auth, theme)
│   │   ├── App.tsx          # Router config (30+ routes)
│   │   └── main.tsx         # Entry point
│   ├── public/
│   │   ├── og/              # Open Graph images
│   │   └── firebase-messaging-sw.js
│   └── package.json
│
├── .githooks/               # Git hooks (pre-commit, post-commit, post-checkout)
├── .github/workflows/       # GitHub Actions CI/CD
├── scripts/                 # Bump script, generate-version
├── VERSION                  # Semantic version (auto-bumped)
├── .gitignore
├── LICENSE
└── README.md
```

## API Overview

### Authentication (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register with email/password or Google |
| POST | `/api/auth/verify-otp` | Verify OTP (legacy) |
| POST | `/api/auth/refresh-token` | Refresh JWT token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Profiles (`/api/profiles`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/profiles/` | Create profile |
| GET | `/api/profiles/my` | Get my profile |
| GET | `/api/profiles/:id` | Get profile by ID |
| PUT | `/api/profiles/:id` | Update profile |
| DELETE | `/api/profiles/:id` | Delete profile |
| POST | `/api/profiles/:id/photos` | Upload photo (base64 data URL in DB) |
| PUT | `/api/profiles/:id/photos/:photoId/primary` | Set primary photo |
| DELETE | `/api/profiles/:id/photos/:photoId` | Delete photo |
| PUT | `/api/profiles/:id/visibility` | Toggle profile visibility |
| POST | `/api/profiles/:id/submit` | Submit for admin review |

### Browse (`/api/browse`) — Guardian only
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/browse/profiles` | Browse profiles |
| GET | `/api/browse/profiles/:id` | Profile detail |
| GET | `/api/browse/ai-suggestions` | AI-powered suggestions (premium) |

### Bride Records (`/api/brides`) — Guardian only
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/brides/` | Create bride record |
| GET | `/api/brides/` | List my bride records |
| GET | `/api/brides/:id` | Get bride record |
| PUT | `/api/brides/:id` | Update bride record |
| DELETE | `/api/brides/:id` | Delete bride record |

### Contact Requests (`/api/requests`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/requests/` | Send contact request |
| GET | `/api/requests/sent` | List sent requests |
| GET | `/api/requests/received` | List received requests |
| PUT | `/api/requests/:id/accept` | Accept request |
| PUT | `/api/requests/:id/reject` | Reject request |

### Messaging (`/api/messages`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/messages/conversations` | List conversations |
| GET | `/api/messages/conversations/:id` | Get messages |
| POST | `/api/messages/conversations/:id` | Send message |
| PUT | `/api/messages/conversations/:id/read` | Mark as read |

### Social Feed (`/api/social`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/social/feed` | Get social feed |
| GET | `/api/social/explore` | Explore posts |
| POST | `/api/social/posts` | Create post |
| GET | `/api/social/posts/:id` | Get post (public — optional auth) |
| PUT | `/api/social/posts/:id` | Update post |
| DELETE | `/api/social/posts/:id` | Delete post |
| POST | `/api/social/posts/media` | Upload post media |
| POST | `/api/social/posts/:id/like` | Toggle like |
| POST | `/api/social/posts/:id/share` | Repost |
| POST | `/api/social/posts/:id/comments` | Add comment |
| DELETE | `/api/social/posts/:id/comments/:commentId` | Delete comment |
| POST | `/api/social/follow/:userId` | Follow/unfollow user |
| GET | `/api/social/followers` | My followers |
| GET | `/api/social/following` | Who I follow |
| GET | `/api/social/user/:userId/posts` | User's posts |
| GET | `/api/social/user/:userId/reputation` | User's reputation |

### Notifications (`/api/notifications`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications/` | List notifications |
| PUT | `/api/notifications/read-all` | Mark all read |
| PUT | `/api/notifications/:id/read` | Mark one read |
| POST | `/api/notifications/push-token` | Register FCM token |
| DELETE | `/api/notifications/push-token` | Unregister FCM token |

### Feedback (`/api/feedback`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/feedback/` | Submit feedback/testimonial |
| GET | `/api/feedback/testimonials` | Get public testimonials |

### Subscriptions (`/api/subscriptions`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/subscriptions/` | Create subscription |
| GET | `/api/subscriptions/my` | Get my subscription |

### Donations (`/api/donations`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/donations/` | Create donation |

### Admin (`/api/admin`) — Admin only
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats + charts |
| GET | `/api/admin/users` | List users |
| PUT | `/api/admin/users/:id/ban` | Ban/unban user |
| PUT | `/api/admin/users/:id/verify` | Verify user |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/profiles/pending` | Pending profiles |
| PUT | `/api/admin/profiles/:id/approve` | Approve profile |
| PUT | `/api/admin/profiles/:id/reject` | Reject profile |
| GET | `/api/admin/posts` | List all posts |
| DELETE | `/api/admin/posts/:id` | Delete any post |
| GET | `/api/admin/conversations` | List all conversations |
| GET | `/api/admin/feedback` | List all feedback |
| PUT | `/api/admin/feedback/:id/approve` | Approve feedback |
| PUT | `/api/admin/feedback/:id/reject` | Reject feedback |
| DELETE | `/api/admin/feedback/:id` | Delete feedback |
| GET | `/api/admin/subscriptions` | List subscriptions |
| PUT | `/api/admin/subscriptions/:id/verify` | Verify subscription |
| PUT | `/api/admin/subscriptions/:id/decline` | Decline subscription |
| GET | `/api/admin/donations` | List donations |
| PUT | `/api/admin/donations/:id/verify` | Verify donation |
| PUT | `/api/admin/donations/:id/decline` | Decline donation |

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) © Hafsa Project
