<div align="center">
  <h1>حفصة — Hafsa</h1>
  <p><strong>An Islamic marriage platform connecting families with integrity</strong></p>
  <p>شبكة إسلامية للتعارف بقصد الزواج</p>
  <br>
</div>

**Hafsa** is a full-featured web platform designed to facilitate Islamic marriage introductions. It enables guardians (أولياء) to browse profiles of those seeking marriage, communicate securely, and manage the matchmaking process — all within an Islamic framework.

The platform is named after **Hafsa bint Umar** (حفصة بنت عمر), one of the Mothers of the Believers, reflecting the project's commitment to Islamic values.

## Features

- **Profile Management** — 8-step wizard for detailed profiles (40+ fields covering personal specs, education, work, marriage preferences, family, residence, partner criteria)
- **Photo Gallery** — Upload up to 6 photos, set primary, delete and reorder (stored as base64 data URLs in the database — no filesystem or external storage required)
- **Role-based Access** — GROOM (راغب في الزواج), GUARDIAN (ولي), BOTH, ADMIN
- **Guardian Browsing** — Guardians browse groom profiles; contact requests initiate conversations
- **Real-time Messaging** — Secure chat via Socket.IO with typing indicators
- **Social Feed** — Posts, likes, comments with real-time notifications
- **Notifications** — In-app socket notifications + FCM push for: profile views, contact requests, messages, post interactions, follows
- **AI Suggestions** — GPT-4o-powered profile suggestions (optional)
- **Admin Dashboard** — User/profile/report management
- **Premium Subscriptions** — Stripe integration for premium features
- **Multilingual** — Arabic (RTL), English, French, Urdu
- **Dark Mode** — Full dark mode support

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| React Router v6 | Routing |
| Tailwind CSS 3 | Styling (RTL-aware) |
| Zustand | State management |
| react-i18next + i18next | Internationalization (4 languages) |
| Socket.IO Client | Real-time messaging |
| Firebase Auth (phone + email) | Authentication |
| Firebase Cloud Messaging | Push notifications |
| Vite | Build tool |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + TypeScript | Runtime |
| Express.js | HTTP framework |
| Prisma ORM | Database access |
| PostgreSQL (Neon) | Database |
| Socket.IO | Real-time WebSocket server |
| Firebase Admin SDK | Auth verification & push |
| Redis | Rate limiting & socket adapter |
| JSON Web Tokens | Auth tokens |
| Zod | Input validation |
| OpenAI API | AI suggestions (optional) |
| Stripe | Payment processing |
| Cloudinary | Cloud image storage (optional — not used in primary flow) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A PostgreSQL database (Neon, AWS RDS, or local)
- A Firebase project (for Auth + Cloud Messaging)
- (Optional) Redis server

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
npx prisma migrate deploy    # Apply migrations
# or
npx prisma db push           # Push schema directly (dev)
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

## Project Structure

```
HAFSA/
├── backend/
│   ├── src/
│   │   ├── config/          # Firebase admin, Redis, etc.
│   │   ├── lib/             # Shared utilities
│   │   ├── middleware/      # Auth, validation, rate limiting
│   │   ├── modules/         # Feature modules (profiles, auth, messages, etc.)
│   │   │   ├── auth/
│   │   │   ├── profiles/
│   │   │   ├── messages/
│   │   │   ├── social/
│   │   │   ├── notifications/
│   │   │   ├── admin/
│   │   │   └── payments/
│   │   ├── prisma/          # Schema + seed
│   │   └── server.ts        # Entry point
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, ui (empty), etc.
│   │   ├── i18n/            # Translation files (ar, en, fr, ur)
│   │   ├── lib/             # Firebase, API client, helpers
│   │   ├── pages/           # All page components
│   │   ├── stores/          # Zustand stores (auth, theme)
│   │   ├── App.tsx          # Router config
│   │   └── main.tsx         # Entry point
│   ├── public/
│   │   └── firebase-messaging-sw.js
│   └── package.json
│
├── .gitignore
├── LICENSE
└── README.md
```

## API Overview

| Endpoint | Description |
|---|---|
| `POST /auth/register` | Register with phone/email |
| `POST /auth/verify-otp` | Verify OTP |
| `GET /profiles` | Browse profiles (guardian) |
| `GET /profiles/:id` | Profile detail |
| `POST /profiles` | Create profile |
| `PUT /profiles/:id` | Update profile |
| `POST /profiles/:id/photos` | Upload photo (stored as base64 data URL in DB) |
| `PUT /profiles/:id/photos/:photoId/primary` | Set primary photo |
| `DELETE /profiles/:id/photos/:photoId` | Delete photo |
| `GET /messages/conversations` | List conversations |
| `GET /messages/conversations/:id` | Get conversation messages |
| `GET /social/posts` | Social feed |
| `GET /notifications` | User notifications |

Full API documentation is available at the backend's `/api-docs` endpoint (if Swagger is configured).

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) © Hafsa Project
