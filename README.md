# NxtGen Captions

> **AI-powered automatic caption generator for videos — with multi-language support, beautiful caption templates, and seamless cloud-based rendering.**

[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Remotion](https://img.shields.io/badge/Remotion-4.x-purple)](https://www.remotion.dev/)
[![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20S3%20%7C%20SES%20%7C%20SQS-FF9900?logo=amazonaws)](https://aws.amazon.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma%20ORM-336791?logo=postgresql)](https://www.prisma.io/)

---

## 📖 Overview

**NxtGen Captions** is a full-stack SaaS platform that automatically transcribes video audio and renders stylized, animated captions back into the video. It supports **English**, **Hindi**, **Hinglish**, and **Auto-Detection** — making it accessible to a wide range of creators, especially those producing content for Indian audiences.

Users upload their video, choose a language and caption style, customize the look of their captions, and export a final rendered video — all from within the browser.

### Live Site
🌐 [https://nxtgencaptions.com](https://nxtgencaptions.com)

---

## ✨ Features

### 🎬 Core Capabilities
- **Automatic Transcription** — powered by Deepgram's AI with word-level timestamps
- **Multi-Language Support** — English, Hindi, Hinglish, and Auto-Detect
- **Caption Editor** — real-time preview with editable captions and styles
- **Cloud Rendering** — serverless video rendering via Remotion on AWS Lambda
- **Video Export** — download rendered video with baked-in captions

### 🎨 Caption Templates
| Template | Description |
|---|---|
| **Modern Caption** | Emphasized words with glow effects; configurable colors |
| **NxtGen Alpha** | Dynamic word-by-word animation, high-energy style |
| **NxtGen Gen-Z** | Trendy, pop-culture inspired caption design |
| **NxtGen Special** | Premium cinematic caption style |
| **Classic Center** | Simple centered text, clean and minimal |

### 🌐 Language Support
| Language | Code | Script | Best For |
|---|---|---|---|
| Auto Detect | `auto` | Variable | Mixed / unknown language |
| English | `en` | Latin | English content |
| Hinglish | `hinglish` | Devanagari | Romanized Hindi |
| Hindi | `hi` | Devanagari | Hindi content |

### 💳 Subscription Plans
| Plan | Transcription | Storage | Max Resolution | Audio Credits |
|---|---|---|---|---|
| **Free** | 5 min | 1 GB | 720p | 3 |
| **Editor** | Custom | Custom | 1080p | More |
| **Creator** | Custom | Custom | 1080p | More |
| **Business** | Custom | Custom | 4K | Priority |

Payments are processed via **Razorpay** (INR).

---

## 🏗️ Architecture

```
NxtGen Captions/
├── frontend/          # Next.js 15 web application
├── backend/           # Express.js REST API server
├── video-engine/      # Remotion video composition
├── infrastructure/    # AWS / SST infrastructure configs
└── sst.config.ts      # SST (Ion) deployment config
```

### Architecture Diagram

```
┌─────────────┐    Upload     ┌──────────────┐    Transcribe    ┌──────────────┐
│   Browser   │ ──────────── ▶│   Backend    │ ──────────────── ▶│   Deepgram   │
│  (Next.js)  │ ◀──────────── │  (Express)   │ ◀────────────── ─│     API      │
└─────────────┘    Captions   └──────┬───────┘                   └──────────────┘
                                     │ Store
                                     ▼
                              ┌──────────────┐   Render Job   ┌───────────────────┐
                              │  PostgreSQL  │                 │  Remotion Lambda  │
                              │   (Prisma)  │                 │  (video-engine)   │
                              └──────────────┘ ◀────────────  └───────────────────┘
                                                  S3 URL
                              ┌──────────────┐
                              │   AWS S3     │  (video storage)
                              └──────────────┘
```

---

## 🛠️ Tech Stack

### Frontend (`/frontend`)
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 15.x | App framework (App Router) |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Framer Motion | 12.x | Animations |
| GSAP | 3.x | Advanced animations |
| Lucide React | 1.x | Icon library |
| NextAuth v5 | beta | Authentication |
| Prisma | 7.x | ORM (PostgreSQL) |
| AWS SDK | 3.x | S3, SES, SQS integration |
| Razorpay | 2.x | Payment processing |
| Remotion Lambda | 4.x | Video rendering trigger |

### Backend (`/backend`)
| Technology | Version | Purpose |
|---|---|---|
| Express.js | 5.x | HTTP server |
| TypeScript | 6.x | Type safety |
| Prisma | 7.x | ORM (PostgreSQL) |
| Deepgram | via API | AI transcription |
| Fluent FFmpeg | 2.x | Audio extraction |
| Remotion | 4.x | Video render orchestration |
| Multer | 2.x | File upload handling |
| Helmet | 8.x | Security middleware |
| Razorpay | 2.x | Payment webhook handling |
| AWS SDK | 3.x | S3 storage, SQS |
| Hugging Face | 4.x | AI inference (translation) |

### Video Engine (`/video-engine`)
| Technology | Version | Purpose |
|---|---|---|
| Remotion | 4.x | Programmatic video rendering |
| React | 18.x | Component-based video |
| Remotion Lambda | 4.x | Serverless rendering on AWS |

### Infrastructure
| Service | Purpose |
|---|---|
| **AWS Lambda** | Serverless video rendering via Remotion |
| **AWS S3** | Video & asset storage |
| **AWS SES** | Transactional email |
| **AWS SQS** | Job queue for rendering |
| **AWS CloudFront** | CDN for frontend delivery |
| **SST Ion** | Infrastructure as code |
| **PostgreSQL** | Primary database |
| **AWS Amplify / Vercel** | CI/CD & deployment |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **PostgreSQL** database (local or remote)
- **AWS Account** (for S3, Lambda, SES)
- **Deepgram API Key** (for transcription)
- **Razorpay Account** (for payments)
- **SST Ion CLI** (for infrastructure)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/nxtgen-captions.git
cd nxtgen-captions
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Install Sub-package Dependencies

```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install

# Video Engine
cd ../video-engine && npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the **root** directory:

```env
# ─── Database ─────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/nxtgencaptions

# ─── AWS ──────────────────────────────────────────────────────
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-s3-bucket-name

# ─── Deepgram (Transcription) ─────────────────────────────────
DEEPGRAM_API_KEY=your_deepgram_api_key

# ─── Authentication (NextAuth) ────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# ─── Razorpay (Payments) ──────────────────────────────────────
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# ─── Email (AWS SES / Resend) ─────────────────────────────────
RESEND_API_KEY=your_resend_api_key

# ─── Remotion Lambda ──────────────────────────────────────────
REMOTION_AWS_REGION=ap-south-1
REMOTION_FUNCTION_NAME=your-remotion-lambda-function
REMOTION_BUCKET_NAME=your-remotion-s3-bucket
```

> ⚠️ **Never commit `.env.local` to version control.** It is already in `.gitignore`.

---

### 5. Setup the Database

```bash
cd frontend
npx prisma generate
npx prisma migrate deploy
```

### 6. Run the Development Servers

```bash
# From the root directory — starts frontend (port 3000) + backend (port 3001) concurrently
npm run dev:all
```

Or run them individually:

```bash
# Frontend only (Next.js on port 3000)
npm run dev:frontend

# Backend only (Express on port 3001)
npm run dev:backend
```

The app will be available at:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **API Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 📁 Project Structure

```
NxtGen Captions/
│
├── frontend/                       # Next.js 15 Application
│   ├── src/
│   │   ├── app/                    # App Router pages
│   │   │   ├── page.tsx            # Landing page
│   │   │   ├── dashboard/          # User dashboard
│   │   │   ├── editor/             # Caption editor
│   │   │   ├── export/             # Export page
│   │   │   ├── sign-in/            # Authentication
│   │   │   ├── about/              # About page
│   │   │   ├── contact/            # Contact page
│   │   │   ├── privacy/            # Privacy policy
│   │   │   ├── terms/              # Terms of service
│   │   │   └── api/                # Next.js API routes
│   │   ├── components/             # React components
│   │   │   └── Editor/             # Editor-specific components
│   │   ├── context/                # React context (CaptionContext)
│   │   ├── lib/                    # Utility libraries
│   │   ├── types/                  # TypeScript type definitions
│   │   ├── auth.ts                 # NextAuth configuration
│   │   └── middleware.ts           # Route protection middleware
│   └── prisma/
│       └── schema.prisma           # Database schema
│
├── backend/                        # Express.js REST API
│   └── src/
│       ├── server.ts               # Express app entry point
│       ├── routes/                 # API route definitions
│       │   ├── video.routes.ts     # /api/video
│       │   ├── render.routes.ts    # /api/render
│       │   ├── payment.routes.ts   # /api/payment
│       │   └── webhook.routes.ts   # /api/webhooks
│       ├── controllers/            # Request handlers
│       ├── services/               # Business logic
│       │   ├── deepgram.service.ts # AI transcription
│       │   ├── ffmpeg.service.ts   # Audio extraction
│       │   ├── remotion.service.ts # Video rendering
│       │   ├── s3.service.ts       # AWS S3 operations
│       │   ├── payment.service.ts  # Razorpay integration
│       │   ├── transcription.service.ts # Transcription orchestration
│       │   ├── translation.service.ts   # Language translation
│       │   └── subject-isolation.service.ts # Background removal
│       ├── middleware/             # Express middleware
│       └── utils/                  # Helpers & error classes
│
├── video-engine/                   # Remotion Video Compositions
│   └── src/
│       ├── Root.tsx                # Remotion root
│       ├── NxtGenAlpha.tsx         # Alpha template
│       ├── NxtGenGenZ.tsx          # Gen-Z template
│       ├── NxtgenSpecialTemplate.tsx # Special template
│       ├── CaptionVideo/           # Core caption video component
│       ├── types.ts                # Video engine types
│       └── index.ts                # Exports
│
├── infrastructure/                 # Infrastructure scripts
├── sst.config.ts                   # SST Ion deployment config
├── amplify.yml                     # AWS Amplify CI/CD config
└── package.json                    # Root workspace config
```

---

## 🔌 API Reference

### Backend (Express — port 3001)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/video/upload` | Upload video for transcription |
| `GET` | `/api/video/:id` | Get video/project details |
| `POST` | `/api/render` | Trigger Remotion Lambda render |
| `POST` | `/api/payment/create-order` | Create Razorpay payment order |
| `POST` | `/api/payment/verify` | Verify payment signature |
| `POST` | `/api/webhooks/razorpay` | Razorpay webhook handler |

### Frontend API Routes (Next.js — port 3000)

- `/api/auth/[...nextauth]` — NextAuth authentication
- `/api/projects` — CRUD for user projects
- `/api/user` — User profile management
- `/api/subscription` — Subscription management

---

## 🗄️ Database Schema

The application uses **PostgreSQL** managed via **Prisma ORM**. Key models:

| Model | Description |
|---|---|
| `User` | User account with plan type and usage tracking |
| `Account` | OAuth provider accounts (NextAuth) |
| `Session` | Active user sessions |
| `Subscription` | Plan details, limits, and billing cycle |
| `Project` | User-created caption projects |
| `Transaction` | Payment history (Razorpay) |
| `VerificationToken` | Email verification tokens |

**Subscription Plan Limits:**
```
FREE    → 5 min transcription, 1 GB storage, 720p, 3 audio credits
EDITOR  → Extended limits, 1080p export
CREATOR → Higher limits, 1080p export
BUSINESS→ Maximum limits, priority support, 4K export
```

---

## 🎞️ Video Rendering Pipeline

```
1. User uploads video
        │
2. Backend extracts audio (FFmpeg)
        │
3. Audio sent to Deepgram API
        │
4. Word-level transcript returned
        │
5. User edits captions + selects template in browser
        │
6. Render job dispatched to Remotion Lambda
        │
7. Remotion renders video with captions frame-by-frame
        │
8. Rendered video uploaded to S3
        │
9. User downloads final video
```

---

## 🌍 Multilingual Support

NxtGen Captions was purpose-built to support **Indian language content creators**:

- **Auto Detect** — Ideal for mixed-language videos; Deepgram automatically identifies the spoken language.
- **English** — Standard English transcription with Latin script.
- **Hinglish** — Hindi written in English/Roman script (using Deepgram's Whisper model with `hi` language code).
- **Hindi** — Full Devanagari script output.

All language modes maintain **precise word-level timestamps** for accurate caption synchronization.

---

## 🚢 Deployment

### Infrastructure Setup (SST Ion)

```bash
# Install SST CLI
npm install -g sst

# Deploy to production
npm run deploy
```

The `sst.config.ts` provisions:
- **Next.js frontend** on AWS (via CloudFront + Lambda@Edge)
- **ACM SSL Certificate** for `nxtgencaptions.com` and `www.nxtgencaptions.com`
- AWS Region: `ap-south-1` (Mumbai)

### Remotion Lambda Setup

```bash
cd video-engine
node deploy.mjs
```

This deploys the Remotion Lambda function and S3 bucket for serverless video rendering.

### CI/CD

The project includes an `amplify.yml` for **AWS Amplify** continuous deployment:

```bash
# Build command
cd frontend && npm install && npm run build
```

---

## 🔐 Authentication

NxtGen Captions uses **NextAuth v5** with support for:
- **Email/Password** (credentials-based with bcrypt hashing)
- **OAuth Providers** (configurable in `auth.config.ts`)
- Email verification via **AWS SES** / **Resend**
- Protected routes via Next.js `middleware.ts`

---

## 🧩 Caption Customization

Users can fully customize captions from the editor panel:

- **Font size** — Scale text up or down
- **Primary color** — Set word color
- **Emphasis color** — Set color for emphasized/highlighted words
- **Glow effect** — Enable/disable and adjust glow intensity
- **Word emphasis** — Toggle automatic word emphasis (every 3rd word or 4+ character words)
- **Text alignment** — Left, center, or right
- **Position** — X/Y placement on the video frame
- **Layout** — Switch between `center` and `modern` layouts

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please follow the existing code style and ensure TypeScript types are properly defined.

---

## 📄 License

This project is proprietary software. All rights reserved.

© 2024–2026 NxtGen Captions. Unauthorized copying, distribution, or modification is prohibited.

---

## 📬 Contact

- **Website**: [https://nxtgencaptions.com](https://nxtgencaptions.com)
- **Contact Page**: [https://nxtgencaptions.com/contact](https://nxtgencaptions.com/contact)

---

<p align="center">Built with ❤️ for Indian content creators</p>
