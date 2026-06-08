# SocialPilot — AI Social Media Client Management

A production-ready, local-first desktop application for social media managers and agencies to manage clients, track performance, and leverage AI insights.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Electron 28 |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + custom design system |
| Animation | Framer Motion |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (via Prisma ORM) |
| State | Zustand + TanStack Query |
| Charts | Recharts |
| AI | OpenAI GPT-4o + Vision API |
| PDF Export | PDFKit |
| File Uploads | Multer |

---

## Prerequisites

- Node.js 18+
- npm 9+
- OpenAI API key (for AI features)

---

## Setup Instructions

### 1. Clone / Download the Project

```bash
cd socialpilot
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Initialize the Database

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
cd ..
```

This creates `data/app.db` (SQLite) and all required tables.

### 5. Configure Environment

The backend `.env` is already configured:
```
DATABASE_URL="file:../data/app.db"
PORT=3001
```

Your OpenAI API key is configured inside the app via **Settings → AI Configuration**.

### 6. Create Required Directories

```bash
mkdir -p storage/clients storage/screenshots storage/reports storage/exports storage/profile-images data
```

---

## Running the App

### Development Mode (recommended during dev)

Run all three processes together:
```bash
npm run dev
```

This starts:
- **Backend** at `http://localhost:3001`
- **Frontend** (Vite) at `http://localhost:3000`
- **Electron** window (waits for frontend to be ready)

### Or run separately:

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
npm run dev:frontend

# Terminal 3 — Electron
npm run electron:dev
```

---

## Building for Production

```bash
npm run build
```

Creates an installer in `dist-electron/`.

---

## Project Structure

```
socialpilot/
├── electron/
│   ├── main.js              # Electron main process
│   └── preload.js           # Context bridge
├── src/
│   ├── components/
│   │   └── layout/          # Sidebar, Topbar
│   ├── pages/               # All app pages
│   │   ├── Dashboard.tsx
│   │   ├── Clients.tsx
│   │   ├── ClientDetail.tsx
│   │   ├── Analytics.tsx
│   │   ├── Calendar.tsx
│   │   ├── ContentLibrary.tsx
│   │   ├── AIReview.tsx
│   │   ├── Inspiration.tsx
│   │   ├── AIAssistant.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   ├── services/
│   │   └── api.ts           # All API calls
│   ├── store/
│   │   └── appStore.ts      # Zustand global state
│   └── utils/
│       └── cn.ts
├── backend/
│   ├── src/
│   │   ├── routes/          # Express routes
│   │   │   ├── clients.ts
│   │   │   ├── analytics.ts
│   │   │   ├── calendar.ts
│   │   │   ├── content.ts   # also: notifications, settings
│   │   │   ├── ai.ts
│   │   │   └── reports.ts
│   │   ├── middleware/
│   │   │   └── errorHandler.ts
│   │   ├── utils/
│   │   │   ├── database.ts
│   │   │   └── logger.ts
│   │   └── index.ts
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
├── storage/                 # Local file storage (gitignored)
├── data/                    # SQLite DB (gitignored)
└── package.json
```

---

## Features

### ✅ Client Management
- Add, edit, archive, delete clients
- Instagram + Facebook account tracking
- Auto health score calculation
- Per-client dashboard with stats

### ✅ Analytics
- Manual analytics snapshot entry
- Follower growth, engagement, reach, impressions charts
- 7/14/30/90-day period views
- Historical data stored locally

### ✅ Content Calendar
- Monthly calendar view
- Track posted / pending / no-content per day
- Screenshot upload per calendar entry
- Posting consistency alerts

### ✅ Content Library
- Store all content items
- Filter by type: post, reel, story, Facebook
- Grouped by month view

### ✅ AI Screenshot Review
- Upload any social media screenshot
- GPT-4 Vision analysis
- Scores: Overall, Design, Marketing, Content (0-100)
- Strengths, weaknesses, recommendations
- Review history stored locally

### ✅ Creative Inspiration
- AI idea generator (industry, goal, platform, type filters)
- Trending content formats with engagement benchmarks
- Competitor analysis with AI insights
- Saved ideas library

### ✅ AI Assistant
- Full RAG chat — AI accesses your local client data
- Client-contextual answers
- Quick prompt templates
- Conversation history

### ✅ Monthly Reports
- AI-generated executive summary
- Auto-calculated metrics from local data
- PDF export
- Report history

### ✅ Notifications
- Missing content alerts
- Unread badge in topbar
- Auto-consistency checks

### ✅ Settings
- OpenAI API key (encrypted, local)
- Feature status dashboard
- Storage path reference

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/clients | List all clients |
| POST | /api/clients | Create client |
| PUT | /api/clients/:id | Update client |
| DELETE | /api/clients/:id | Delete client |
| GET | /api/analytics/client/:id | Get analytics |
| POST | /api/analytics/client/:id | Add snapshot |
| GET | /api/calendar/client/:id | Get calendar entries |
| POST | /api/calendar | Create entry |
| POST | /api/ai/review-screenshot | Vision AI review |
| POST | /api/ai/chat | AI assistant |
| POST | /api/ai/content-ideas | Generate ideas |
| POST | /api/ai/report-summary | AI report summary |
| POST | /api/ai/competitor-analysis | Competitor AI |
| GET | /api/reports/client/:id | Get reports |
| POST | /api/reports | Create report |
| GET | /api/reports/:id/pdf | Download PDF |
| GET | /api/notifications | Get notifications |
| POST | /api/notifications/check-consistency | Run consistency check |

---

## Data Privacy

- **All data** stored locally in SQLite (`data/app.db`)
- **Files** stored in `storage/` directory
- **API keys** encrypted via `electron-store`
- **No cloud** database, no telemetry, no tracking
- App works **offline** except for AI API calls

---

## Extending the App

### Add a new page
1. Create `src/pages/MyPage.tsx`
2. Add route in `src/App.tsx`
3. Add nav item in `src/components/layout/Sidebar.tsx`

### Add a new backend route
1. Create `backend/src/routes/myroute.ts`
2. Register in `backend/src/index.ts`
3. Add API method in `src/services/api.ts`

### Add a new database model
1. Add model to `backend/prisma/schema.prisma`
2. Run `cd backend && npx prisma migrate dev --name my_migration`
3. Use `prisma.myModel` in routes

---

## License

MIT — Build on it, ship it, own your data.
