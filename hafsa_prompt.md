# HAFSA PLATFORM — COMPLETE IMPLEMENTATION PROMPT
# For: opencode AI agent (autonomous execution)
# Project: حفصة — Islamic Marriage Network
# Domain: hafsa.et3am.com
# Stack: Firebase Frontend + Node.js/Express Backend on VPS

---

## AGENT DIRECTIVE

You are a senior full-stack engineer building the Hafsa platform end-to-end.
Execute ALL tasks autonomously. Do NOT pause for confirmation.
Do NOT ask questions. Make the best technical decision and proceed.
If a file exists, update it. If a dependency is missing, install it.
Run every command, write every file, test every endpoint.
You are done only when `npm run build` passes and the app is accessible at hafsa.et3am.com.

---

## PROJECT OVERVIEW

Hafsa (حفصة) is an Islamic marriage network with a unique model:
- **Men create profiles** showcasing themselves and their requirements for a wife
- **Male guardians (Wali/ولي أمر)** browse profiles and initiate contact
- **Women have NO profiles** — they are represented by their guardian
- Profiles are reviewed by AI before publishing (no manual admin review needed for launch)
- The platform is a social network for men — a Wali selects a suitable man for his ward

---

## TECHNOLOGY STACK

### Frontend (Firebase Hosting)
- React 18 + TypeScript + Vite
- Tailwind CSS v3 (RTL support via `tailwindcss-rtl`)
- React Router v6
- Firebase SDK v10 (Auth, Firestore, Storage, Analytics)
- i18next (Arabic primary, English, Urdu, French — RTL/LTR auto-switch)
- Socket.io-client (real-time messaging)
- React Hook Form + Zod (validation)
- Zustand (state management)

### Backend (VPS — Node.js)
- Node.js 20 + Express + TypeScript
- PostgreSQL + Prisma ORM
- Socket.io (real-time)
- JWT authentication
- OpenAI API (profile AI review + matching algorithm)
- Cloudinary (image upload/moderation)
- Firebase Admin SDK (push notifications via FCM)
- Nodemailer + Twilio (OTP)
- Stripe + Tap Payments (subscriptions)
- Redis (sessions, rate limiting, queues)
- PM2 (process management)

### Infrastructure
- Domain: hafsa.et3am.com (subdomain on existing VPS)
- SSL: Let's Encrypt via Certbot
- Reverse proxy: Nginx
- Database: PostgreSQL on same VPS
- Firebase project: hafsa-app (create if not exists)

---

## DIRECTORY STRUCTURE

```
hafsa/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   ├── firebase-admin.ts
│   │   │   └── openai.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rateLimiter.ts
│   │   │   ├── roleGuard.ts
│   │   │   └── upload.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── profiles/
│   │   │   ├── matching/
│   │   │   ├── messaging/
│   │   │   ├── admin/
│   │   │   ├── notifications/
│   │   │   └── payments/
│   │   ├── services/
│   │   │   ├── aiReview.service.ts
│   │   │   ├── aiMatching.service.ts
│   │   │   ├── moderation.service.ts
│   │   │   └── notification.service.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── auth/
    │   │   ├── profile/
    │   │   ├── browse/
    │   │   ├── messages/
    │   │   ├── admin/
    │   │   └── settings/
    │   ├── components/
    │   │   ├── ProfileCard/
    │   │   ├── ProfileForm/
    │   │   ├── MessageThread/
    │   │   ├── FilterPanel/
    │   │   ├── VerifiedBadge/
    │   │   └── ui/
    │   ├── hooks/
    │   ├── stores/
    │   ├── i18n/
    │   │   ├── ar.json
    │   │   ├── en.json
    │   │   ├── ur.json
    │   │   └── fr.json
    │   ├── lib/
    │   │   ├── firebase.ts
    │   │   ├── api.ts
    │   │   └── socket.ts
    │   └── App.tsx
    ├── firebase.json
    ├── .firebaserc
    └── package.json
```

---

## DATABASE SCHEMA (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  GROOM        // رجل راغب في الزواج
  GUARDIAN     // ولي أمر
  BOTH         // كلاهما
  ADMIN
}

enum ProfileStatus {
  DRAFT
  PENDING_AI_REVIEW
  APPROVED
  REJECTED
  SUSPENDED
}

enum MarriageNumber {
  FIRST
  SECOND
  THIRD
  FOURTH
}

enum MadhabType {
  HANAFI
  MALIKI
  SHAFII
  HANBALI
  OTHER
}

enum PrayerCommitment {
  ALWAYS          // يصلي دائماً
  MOSTLY          // أغلب الأحيان
  SOMETIMES       // أحياناً
  WORKING_ON_IT   // يسعى للالتزام
}

enum QuranMemorization {
  FULL            // حافظ كامل
  THREE_QUARTERS  // ثلاثة أرباع
  HALF            // نصف
  QUARTER         // ربع
  SOME_SURAHS     // سور متفرقة
  FATIHA_ONLY     // الفاتحة فقط
  NONE
}

enum MaritalStatus {
  SINGLE
  MARRIED_SEEKING_SECOND
  MARRIED_SEEKING_THIRD
  MARRIED_SEEKING_FOURTH
  DIVORCED
  WIDOWED
}

enum SubscriptionPlan {
  FREE
  PREMIUM
}

model User {
  id                String           @id @default(cuid())
  firebaseUid       String           @unique
  phone             String?          @unique
  email             String?          @unique
  role              UserRole         @default(GROOM)
  subscriptionPlan  SubscriptionPlan @default(FREE)
  subscriptionExpiry DateTime?
  isVerified        Boolean          @default(false)
  isActive          Boolean          @default(true)
  isBanned          Boolean          @default(false)
  language          String           @default("ar")
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  profile           Profile?
  sentRequests      ContactRequest[] @relation("SentRequests")
  receivedRequests  ContactRequest[] @relation("ReceivedRequests")
  sentMessages      Message[]        @relation("SentMessages")
  conversations     ConversationParticipant[]
  notifications     Notification[]
  reports           Report[]         @relation("Reporter")
  reportedIn        Report[]         @relation("Reported")
}

model Profile {
  id                    String              @id @default(cuid())
  userId                String              @unique
  user                  User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Personal Info
  displayName           String              // اسم أو كنية
  age                   Int
  nationality           String              // ISO country code
  countryOfResidence    String
  city                  String
  education             String
  occupation            String
  maritalStatus         MaritalStatus
  marriageNumber        MarriageNumber
  hasChildren           Boolean             @default(false)
  numberOfChildren      Int?

  // Islamic Profile
  madhab                MadhabType
  prayerCommitment      PrayerCommitment
  quranMemorization     QuranMemorization
  religiousDescription  String?             @db.Text // وصف الالتزام الديني

  // Self Description
  selfIntroduction      String              @db.Text // التعريف الذاتي
  additionalNotes       String?             @db.Text

  // Wife Requirements
  wifeAgeMin            Int
  wifeAgeMax            Int
  wifeNationality       String?             // null = open
  wifeCountry           String?
  wifeEducation         String?
  wifeMaritalStatus     String              // "any" | "virgin" | "divorced" | "widowed"
  wifeHasChildren       String              // "no_preference" | "no" | "yes"
  wifeReligiousLevel    String
  wifeAdditionalNotes   String?             @db.Text

  // Media
  photos                ProfilePhoto[]

  // Status
  status                ProfileStatus       @default(DRAFT)
  aiReviewScore         Float?
  aiReviewNotes         String?             @db.Text
  aiReviewedAt          DateTime?
  publishedAt           DateTime?
  viewCount             Int                 @default(0)
  requestCount          Int                 @default(0)

  createdAt             DateTime            @default(now())
  updatedAt             DateTime            @updatedAt

  contactRequests       ContactRequest[]
}

model ProfilePhoto {
  id            String   @id @default(cuid())
  profileId     String
  profile       Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  url           String
  cloudinaryId  String
  isPrimary     Boolean  @default(false)
  order         Int      @default(0)
  isApproved    Boolean  @default(false)  // AI moderated
  createdAt     DateTime @default(now())
}

model ContactRequest {
  id           String   @id @default(cuid())
  senderId     String   // Guardian's userId
  sender       User     @relation("SentRequests", fields: [senderId], references: [id])
  profileId    String   // Target man's profileId
  profile      Profile  @relation(fields: [profileId], references: [id])
  receiverId   String   // Man's userId
  receiver     User     @relation("ReceivedRequests", fields: [receiverId], references: [id])
  status       String   @default("PENDING")  // PENDING | ACCEPTED | REJECTED
  message      String?  @db.Text  // optional intro message
  conversation Conversation?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([senderId, profileId])
}

model Conversation {
  id             String   @id @default(cuid())
  requestId      String   @unique
  request        ContactRequest @relation(fields: [requestId], references: [id])
  messages       Message[]
  participants   ConversationParticipant[]
  lastMessageAt  DateTime?
  createdAt      DateTime @default(now())
}

model ConversationParticipant {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  userId         String
  user           User         @relation(fields: [userId], references: [id])
  lastReadAt     DateTime?

  @@unique([conversationId, userId])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  senderId       String
  sender         User         @relation("SentMessages", fields: [senderId], references: [id])
  content        String       @db.Text
  isRead         Boolean      @default(false)
  createdAt      DateTime     @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // contact_request | request_accepted | new_message | profile_approved | profile_rejected
  titleAr   String
  titleEn   String
  bodyAr    String
  bodyEn    String
  data      Json?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Report {
  id          String   @id @default(cuid())
  reporterId  String
  reporter    User     @relation("Reporter", fields: [reporterId], references: [id])
  reportedId  String
  reported    User     @relation("Reported", fields: [reportedId], references: [id])
  reason      String
  details     String?  @db.Text
  status      String   @default("PENDING")  // PENDING | REVIEWED | RESOLVED
  createdAt   DateTime @default(now())
}

model AdminLog {
  id        String   @id @default(cuid())
  adminId   String
  action    String
  targetId  String?
  details   Json?
  createdAt DateTime @default(now())
}
```

---

## BACKEND API ENDPOINTS

### Auth Module (`/api/auth`)
```
POST /api/auth/register          - Register with phone/email + Firebase UID
POST /api/auth/verify-otp        - Verify OTP
POST /api/auth/refresh-token     - Refresh JWT
POST /api/auth/logout
GET  /api/auth/me                - Get current user
```

### Profile Module (`/api/profiles`)
```
POST   /api/profiles             - Create profile (GROOM/BOTH role)
GET    /api/profiles/:id         - Get profile by ID (guardians only)
PUT    /api/profiles/:id         - Update own profile
DELETE /api/profiles/:id         - Delete own profile
POST   /api/profiles/:id/photos  - Upload photos (max 6, Cloudinary)
DELETE /api/profiles/:id/photos/:photoId
POST   /api/profiles/:id/submit  - Submit for AI review
GET    /api/profiles/my          - Get own profile
```

### Browse Module (`/api/browse`) — Guardians only
```
GET  /api/browse/profiles        - List approved profiles with filters & pagination
GET  /api/browse/profiles/:id    - View specific profile (increments view count)
GET  /api/browse/ai-suggestions  - AI-powered profile suggestions
```

**Filter parameters:**
```
ageMin, ageMax, nationality, countryOfResidence, city,
maritalStatus, marriageNumber, madhab, prayerCommitment,
quranMemorization, education, isVerified,
page (default 1), limit (default 20), sort (newest|popular|match_score)
```

### Contact Request Module (`/api/requests`)
```
POST   /api/requests             - Send contact request (GUARDIAN role)
GET    /api/requests/sent        - My sent requests
GET    /api/requests/received    - Received requests (GROOM role)
PUT    /api/requests/:id/accept  - Accept request
PUT    /api/requests/:id/reject  - Reject request
```

**Free plan limit:** 3 requests/month. Premium: unlimited.
Check subscription before creating request.

### Messaging Module (`/api/messages`)
```
GET  /api/messages/conversations          - List all conversations
GET  /api/messages/conversations/:id      - Get conversation + messages
POST /api/messages/conversations/:id      - Send message
PUT  /api/messages/conversations/:id/read - Mark as read
```

### Notifications Module (`/api/notifications`)
```
GET  /api/notifications          - List notifications
PUT  /api/notifications/read-all - Mark all read
PUT  /api/notifications/:id/read
```

### Payments Module (`/api/payments`)
```
POST /api/payments/create-checkout  - Create Stripe/Tap session
POST /api/payments/webhook          - Stripe webhook
GET  /api/payments/plans            - Get plan details & pricing
```

### Admin Module (`/api/admin`) — Admin role only
```
GET    /api/admin/dashboard          - Stats overview
GET    /api/admin/users              - List users (filter, search, paginate)
PUT    /api/admin/users/:id/ban      - Ban user
PUT    /api/admin/users/:id/verify   - Grant verified badge
GET    /api/admin/profiles/pending   - AI-flagged profiles needing human review
PUT    /api/admin/profiles/:id/approve
PUT    /api/admin/profiles/:id/reject
GET    /api/admin/reports            - List user reports
PUT    /api/admin/reports/:id/resolve
GET    /api/admin/logs               - Admin action logs
```

---

## AI SERVICES IMPLEMENTATION

### 1. AI Profile Review (`src/services/aiReview.service.ts`)

Called automatically when user submits profile. Uses OpenAI GPT-4o.

```typescript
// Prompt for AI review:
const reviewPrompt = `
You are a content moderator for an Islamic marriage platform called Hafsa.
Review this profile submission and return a JSON response.

Profile data:
${JSON.stringify(profileData)}

Check for:
1. Inappropriate or non-Islamic content in text fields
2. Offensive language
3. Fake/spam indicators (too short, nonsensical, copied text)
4. Content that violates Islamic values
5. Photo appropriateness (if photos provided via Cloudinary moderation score)

Return ONLY valid JSON:
{
  "approved": boolean,
  "score": number (0-100, 100=perfect),
  "reason": "brief reason if rejected",
  "flags": ["list", "of", "issues"],
  "suggestions": "improvement suggestions if score < 70"
}
`;
```

Auto-approve if score >= 70. Auto-reject if score < 40. Flag for human review if 40-70.

### 2. AI Matching Algorithm (`src/services/aiMatching.service.ts`)

For guardians browsing profiles (Premium feature):

```typescript
// Matching factors (weighted):
const matchingWeights = {
  ageCompatibility: 0.20,      // Does man's wife age range match wali's ward age?
  religiousCompatibility: 0.30, // madhab, prayer, quran alignment
  locationCompatibility: 0.15,  // same country/region preference
  educationCompatibility: 0.10,
  maritalStatusMatch: 0.15,    // First marriage seeking first marriage etc.
  profileCompleteness: 0.10,   // More complete = higher score
};

// Guardian provides ward info when browsing (not stored):
// ward age, nationality, education, marital status
// These are used only for the session's matching calculation
```

---

## REAL-TIME MESSAGING (Socket.io)

```typescript
// Events:
// Client → Server:
'join_conversation'   // { conversationId }
'send_message'        // { conversationId, content }
'typing'              // { conversationId }
'stop_typing'         // { conversationId }
'mark_read'           // { conversationId }

// Server → Client:
'new_message'         // { message, conversationId }
'message_read'        // { conversationId, userId }
'user_typing'         // { conversationId, userId }
'user_stop_typing'    // { conversationId, userId }
'new_notification'    // { notification }
'request_update'      // { requestId, status }
```

Authenticate Socket connections via JWT in handshake auth header.

---

## FRONTEND PAGES & COMPONENTS

### Pages Structure

#### Public (no auth)
- `/` — Landing page (Arabic-first, Islamic design)
- `/about` — About Hafsa
- `/login` — Phone/Email login
- `/register` — Registration

#### Authenticated — Groom Mode
- `/profile/setup` — Multi-step profile creation wizard
- `/profile/my` — View/edit own profile
- `/requests` — Received contact requests
- `/messages` — Conversations list
- `/messages/:id` — Individual conversation

#### Authenticated — Guardian Mode
- `/browse` — Browse profiles with filters
- `/browse/:profileId` — View profile detail
- `/ai-suggestions` — AI-powered matches (Premium)
- `/requests/sent` — Sent requests status

#### Admin
- `/admin` — Dashboard
- `/admin/users` — User management
- `/admin/profiles` — Profile moderation queue
- `/admin/reports` — Reports management

#### Settings
- `/settings` — Account settings
- `/settings/subscription` — Upgrade to Premium
- `/settings/language` — Language preference

### Key Components

#### `<ProfileCard />`
Displays man's profile in browse grid. Shows:
- Primary photo
- Display name + age + nationality flag
- City + country
- Madhab badge + Prayer commitment indicator
- Quran memorization level
- Marriage number badge (أول/ثاني/ثالث/رابع)
- Verified badge if isVerified
- "Send Request" button (guardian mode only)

#### `<ProfileForm />` (Multi-step wizard)
Step 1: Basic Info (name, age, nationality, location, education, job)
Step 2: Marital Status (current status, marriage number, children)
Step 3: Islamic Profile (madhab, prayer, quran, religious description)
Step 4: Self Introduction (free text, min 100 chars)
Step 5: Wife Requirements (age range, nationality, education, marital status, religious level)
Step 6: Photos (up to 6, drag-and-drop upload)
Step 7: Review & Submit

#### `<FilterPanel />`
Collapsible sidebar/drawer with all filter options.
Include "Guardian Mode" toggle where guardian enters his ward's basic info
(age, nationality, marital status) to enable AI matching scores.

#### `<MessageThread />`
WhatsApp-style chat UI. RTL for Arabic messages.
Shows contact request intro message at top.

---

## PRIVACY RULES (CRITICAL — enforce in backend)

```typescript
// middleware/profileVisibility.ts

// Rule 1: Only GUARDIAN or BOTH role users can browse profiles
// Rule 2: GROOM-only users can NEVER see other men's profiles
// Rule 3: Profile photos only visible after login
// Rule 4: Full profile details only visible to verified/logged-in guardians
// Rule 5: Contact info (phone) never exposed in API — messaging only via in-app
// Rule 6: A man can see WHO sent him requests but NOT their ward's details
```

---

## INTERNATIONALIZATION

```json
// i18n/ar.json (primary)
{
  "app": {
    "name": "حفصة",
    "tagline": "شبكة إسلامية للتعارف بقصد الزواج"
  },
  "profile": {
    "marriageNumber": {
      "FIRST": "زواج أول",
      "SECOND": "زواج ثانٍ",
      "THIRD": "زواج ثالث",
      "FOURTH": "زواج رابع"
    },
    "madhab": {
      "HANAFI": "حنفي",
      "MALIKI": "مالكي",
      "SHAFII": "شافعي",
      "HANBALI": "حنبلي",
      "OTHER": "أخرى"
    },
    "prayer": {
      "ALWAYS": "ملتزم بالصلاة دائماً",
      "MOSTLY": "ملتزم في أغلب الأحيان",
      "SOMETIMES": "أحياناً",
      "WORKING_ON_IT": "أسعى للالتزام"
    },
    "quran": {
      "FULL": "حافظ للقرآن كاملاً",
      "THREE_QUARTERS": "حفظ ثلاثة أرباع القرآن",
      "HALF": "حفظ نصف القرآن",
      "QUARTER": "حفظ ربع القرآن",
      "SOME_SURAHS": "حفظ سور متفرقة",
      "FATIHA_ONLY": "الفاتحة والمعوذات",
      "NONE": "لا يحفظ"
    }
  }
}
```

---

## FIREBASE CONFIGURATION

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Config from env variables — create .env.local:
// VITE_FIREBASE_API_KEY=
// VITE_FIREBASE_AUTH_DOMAIN=
// VITE_FIREBASE_PROJECT_ID=
// VITE_FIREBASE_STORAGE_BUCKET=
// VITE_FIREBASE_MESSAGING_SENDER_ID=
// VITE_FIREBASE_APP_ID=

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);   // Used for real-time notifications only
export const storage = getStorage(app); // Profile photos backup
export const analytics = getAnalytics(app);
```

**Note:** Primary data storage is PostgreSQL on VPS. Firebase is used for:
- Authentication (phone/Google/Apple)
- Push notifications (FCM)
- Analytics
- Real-time notification feed (Firestore)

---

## NGINX CONFIGURATION

```nginx
# /etc/nginx/sites-available/hafsa
server {
    listen 80;
    server_name hafsa.et3am.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hafsa.et3am.com;

    ssl_certificate /etc/letsencrypt/live/hafsa.et3am.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hafsa.et3am.com/privkey.pem;

    # API Backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Frontend — served from Firebase Hosting CDN
    # This location handles the admin panel (served locally)
    location /admin/ {
        proxy_pass http://localhost:3001/admin/;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
```

---

## ENVIRONMENT VARIABLES

```bash
# backend/.env

# Server
NODE_ENV=production
PORT=3001
API_URL=https://hafsa.et3am.com/api
FRONTEND_URL=https://hafsa.et3am.com

# Database
DATABASE_URL=postgresql://hafsa_user:STRONG_PASSWORD@localhost:5432/hafsa_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=GENERATE_STRONG_256BIT_SECRET
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=GENERATE_ANOTHER_STRONG_SECRET

# Firebase Admin
FIREBASE_PROJECT_ID=hafsa-app
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@hafsa-app.iam.gserviceaccount.com

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...

# Tap Payments (MENA)
TAP_SECRET_KEY=sk_...

# Twilio (OTP)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Rate Limiting
MAX_REQUESTS_PER_MINUTE=60
MAX_CONTACT_REQUESTS_FREE=3
```

---

## SETUP & DEPLOYMENT COMMANDS

```bash
# 1. On VPS — setup PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib redis-server
sudo -u postgres createuser hafsa_user
sudo -u postgres createdb hafsa_db
sudo -u postgres psql -c "ALTER USER hafsa_user WITH PASSWORD 'STRONG_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hafsa_db TO hafsa_user;"

# 2. Clone and setup backend
cd /var/www
git clone <repo> hafsa
cd hafsa/backend
npm install
cp .env.example .env
# Edit .env with real values

# 3. Run Prisma migrations
npx prisma migrate deploy
npx prisma generate

# 4. Build backend
npm run build

# 5. Start with PM2
pm2 start dist/server.js --name hafsa-backend
pm2 save
pm2 startup

# 6. SSL Certificate
sudo certbot --nginx -d hafsa.et3am.com

# 7. Enable Nginx config
sudo ln -s /etc/nginx/sites-available/hafsa /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 8. Frontend — Firebase setup
cd ../frontend
npm install
# Create .env.local with Firebase config
npm run build
firebase init hosting  # select hafsa-app project
# firebase.json: public = "dist", rewrites to index.html
firebase deploy --only hosting
```

---

## FREEMIUM ENFORCEMENT

```typescript
// middleware/subscriptionGuard.ts

export const requirePremium = async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  
  if (user.subscriptionPlan === 'FREE') {
    return res.status(403).json({
      error: 'PREMIUM_REQUIRED',
      messageAr: 'هذه الميزة متاحة للمشتركين المميزين فقط',
      messageEn: 'This feature requires a Premium subscription',
      upgradeUrl: '/settings/subscription'
    });
  }
  next();
};

export const checkContactRequestLimit = async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  
  if (user.subscriptionPlan === 'FREE') {
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    
    const count = await prisma.contactRequest.count({
      where: {
        senderId: req.userId,
        createdAt: { gte: thisMonthStart }
      }
    });
    
    if (count >= 3) {
      return res.status(403).json({
        error: 'REQUEST_LIMIT_REACHED',
        messageAr: 'وصلت للحد المجاني (3 طلبات/شهر). يرجى الترقية للاشتراك المميز',
        messageEn: 'Free plan limit reached (3 requests/month). Please upgrade.',
        upgradeUrl: '/settings/subscription'
      });
    }
  }
  next();
};
```

---

## DESIGN SYSTEM

### Colors (Islamic-inspired)
```css
:root {
  --color-primary: #1B4332;      /* Deep Islamic green */
  --color-primary-light: #2D6A4F;
  --color-primary-pale: #D8F3DC;
  --color-gold: #B8860B;         /* Islamic gold accents */
  --color-gold-light: #FFD700;
  --color-bg: #FAFAF8;           /* Warm off-white */
  --color-surface: #FFFFFF;
  --color-text: #1A1A1A;
  --color-muted: #6B7280;
  --color-border: #E5E7EB;
}
```

### Typography
- Arabic: Noto Sans Arabic (Google Fonts)
- English: Inter
- Display/headings: Cairo (Google Fonts) — beautiful for Arabic
- RTL direction auto-applied when language = Arabic

### UI Principles
- Clean, trustworthy, Islamic aesthetic
- No photos of women anywhere in the UI
- Islamic geometric patterns as subtle decorative elements
- Green primary color (Islamic)
- Gold accents for premium features
- All forms support both RTL (Arabic) and LTR (English)

---

## TESTING CHECKLIST

After implementation, verify:
- [ ] User can register with phone number (OTP flow)
- [ ] Groom can create complete profile with all Islamic fields
- [ ] Profile photo upload works (max 6, Cloudinary)
- [ ] AI review triggers on profile submission
- [ ] Profile appears in browse after AI approval (score >= 70)
- [ ] Guardian cannot be seen by groom users in browse
- [ ] Contact request sends notification to groom
- [ ] Message thread opens after request acceptance
- [ ] Real-time messages work (Socket.io)
- [ ] Free plan limits enforced (3 requests/month)
- [ ] Premium upgrade flow works
- [ ] Admin can view/approve/reject flagged profiles
- [ ] Arabic RTL layout correct throughout
- [ ] Push notifications received on mobile
- [ ] hafsa.et3am.com loads over HTTPS
- [ ] API returns 401 for unauthenticated requests
- [ ] GROOM role cannot access /browse endpoints

---

## FIRST COMMAND TO RUN

```bash
cd /var/www && mkdir hafsa && cd hafsa && git init
mkdir -p backend/src frontend/src
echo "Starting Hafsa platform implementation..."
```

BEGIN IMPLEMENTATION NOW. Do not stop until all modules are complete and tested.
```
