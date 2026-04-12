# Deepak Chandwani Portfolio — web.deepakchandwani.com

A modern portfolio website built with React, Node.js, and PostgreSQL. Features a landing page with live widgets, YouTube transcript extractor with AI summarization, BSE Meeting presentation with AI voice chatbot, and text-to-speech playback.

**Live site:** https://web.deepakchandwani.com

---

## Architecture

```
Browser ──► Nginx (SSL/reverse proxy)
              ├── Static files (React SPA)  →  /opt/.../client/dist/
              ├── /api/*                    →  Node.js Express (port 3001)
              └── /ws/voice                 →  WebSocket → OpenAI Realtime API
```

**Frontend:** React 19 + Vite + TypeScript + Tailwind CSS 4
**Backend:** Express + PostgreSQL 16 + WebSocket (ws)
**Deployment:** PM2 + Nginx + Let's Encrypt SSL on Ubuntu 24.04

---

## Features

### Landing Page (`/`)
- Split-screen hero with animated intro + live dashboard
- **Live widgets:** World clocks (IST/ET), USD→INR exchange rate, NYC 7-day weather, breaking news (US/India)
- About, Services (6 cards), AI in Action video, Contact form
- All widget data fetched from free APIs (Open-Meteo, ExchangeRate-API, Guardian)

### YouTube Transcript Tool (`/transcript`)
- Paste any YouTube URL → extracts captions server-side
- **Extraction engine:** ANDROID InnerTube API (primary) + watch page HTML parse (fallback)
- Supports both YouTube XML caption formats (new `<p>` and old `<text>`)
- **AI Summarization:** Click "Summarize" to get a detailed summary
  - Uses OpenAI GPT-OSS 120B (free) via OpenRouter, falls back to Gemini 2.0 Flash
  - Streams in real-time with formatted markdown
  - Shows token count and cost (USD/INR)
- **Text-to-Speech:** Click "Play Summary" to hear the summary
  - Microsoft Edge TTS (free, neural voices) → Sarvam AI (Indian languages) → Browser Speech (last resort)
- Copy, download as .txt, search with highlighting, timestamp toggle

### BSE Meeting Presentation (`/bse-meeting`, `/bse-design`)
- Password-protected (password: configured in database)
- 12-slide presentation for Bharat Skills Exchange founders meeting
- YouTube video background, keyboard/touch/autoplay navigation
- **AI Voice Chatbot:** Click "Click to Talk" floating button
  - Uses OpenAI Realtime API (gpt-4o-mini) via WebSocket relay
  - Multi-lingual: responds in whatever language you speak (Hindi, Punjabi, Tamil, etc.)
  - Interruption support: say "ruko", "stop", "bas" to interrupt
  - Server-side VAD (voice activity detection) for natural turn-taking

### Contact Form
- Submissions stored in PostgreSQL
- Fields: first name, last name, email, subject, message

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19, Vite, TypeScript | SPA framework |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Routing | React Router v7 | Client-side routing |
| Backend | Express 4, TypeScript | REST API + WebSocket |
| Database | PostgreSQL 16 | Contacts, auth tokens |
| Voice Chat | OpenAI Realtime API | Real-time voice AI |
| Summarization | OpenRouter (GPT-OSS / Gemini Flash) | Transcript summaries |
| TTS | Microsoft Edge TTS, Sarvam AI | Text-to-speech |
| News | Guardian API | Live headlines |
| Weather | Open-Meteo API | 7-day forecast |
| Forex | ExchangeRate-API, Frankfurter | USD/INR rates |
| Process Mgr | PM2 | Auto-restart, logging |
| Web Server | Nginx | Reverse proxy, SSL |
| SSL | Let's Encrypt (Certbot) | HTTPS certificates |

---

## Project Structure

```
deepakchandwani-web/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/              # Navbar, Footer, Layout
│   │   │   ├── landing/             # Hero, Stats, About, Services, Video, Contact
│   │   │   ├── dashboard/           # Clocks, Currency, Weather, News widgets
│   │   │   ├── transcript/          # Input, Result, Toolbar, Search
│   │   │   ├── bse/                 # Slides, TopBar, VoiceChatbot
│   │   │   │   └── slides/          # 12 individual slide components
│   │   │   └── auth/                # Password gate
│   │   ├── hooks/                   # useClocks, useCurrency, useWeather, useNews,
│   │   │                            # useTranscript, useSlideshow, useVoiceChat, useAuth
│   │   ├── lib/                     # cors-proxy, transcript-engine, vtt-parser
│   │   ├── pages/                   # LandingPage, TranscriptPage, BseMeetingPage, NotFoundPage
│   │   └── types/                   # Shared TypeScript types
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/                          # Express backend
│   ├── src/
│   │   ├── index.ts                 # App entry, mounts routes + WebSocket
│   │   ├── config.ts                # Environment variable loader
│   │   ├── db.ts                    # PostgreSQL connection pool
│   │   ├── routes/
│   │   │   ├── health.ts            # GET /api/health
│   │   │   ├── news.ts              # GET /api/news?region=us|in
│   │   │   ├── transcript.ts        # GET /api/transcript?url=..., POST /api/summarize
│   │   │   ├── contact.ts           # POST /api/contact
│   │   │   ├── auth.ts              # POST /api/auth/verify
│   │   │   └── tts.ts               # POST /api/tts
│   │   ├── ws/
│   │   │   └── voice-relay.ts       # WebSocket relay to OpenAI Realtime API
│   │   └── migrations/
│   │       └── 001_initial.sql      # Database schema + seed data
│   └── package.json
├── deploy/
│   ├── setup.sh                     # One-command VPS provisioning
│   ├── deploy.sh                    # Git pull + rebuild + restart
│   ├── nginx.conf                   # Nginx site configuration
│   └── ecosystem.config.cjs         # PM2 process configuration
├── .env.example                     # Environment variables template
├── .gitignore
└── package.json                     # Root workspace config
```

---

## Setup from Scratch (Fresh VPS)

### Prerequisites
- Fresh Ubuntu 24.04 VPS (2+ GB RAM recommended)
- Domain pointing to VPS IP (A record for `web.deepakchandwani.com`)
- API keys (see `.env.example` for list)

### Option A: Automated Setup (Recommended)

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Clone and run setup
git clone https://github.com/deepaknc2024/deepakchandwani-web.git /opt/deepakchandwani-web
cd /opt/deepakchandwani-web
bash deploy/setup.sh
```

The setup script automatically:
1. Installs Node.js 20, PostgreSQL 16, Nginx, PM2, Certbot
2. Creates database and user (prints generated password)
3. Runs database migrations
4. Builds client (React) and server (TypeScript)
5. Configures Nginx with SSL (Let's Encrypt)
6. Starts PM2 with auto-restart on reboot

After setup completes:
```bash
# Edit .env to add your API keys
nano /opt/deepakchandwani-web/.env

# Add these keys:
# OPENAI_API_KEY=sk-...        (for voice chatbot)
# OPENROUTER_API_KEY=sk-or-... (for summarization)
# SARVAM_API_KEY=sk_...        (for Indian language TTS, optional)

# Restart to pick up new keys
pm2 restart dc-web-server
```

### Option B: Manual Setup

```bash
# 1. Install system packages
apt update && apt install -y nodejs npm postgresql nginx certbot python3-certbot-nginx

# 2. Install PM2
npm install -g pm2

# 3. Create database
sudo -u postgres psql -c "CREATE USER dcweb WITH PASSWORD 'your-password';"
sudo -u postgres psql -c "CREATE DATABASE dcweb OWNER dcweb;"

# 4. Clone repo
git clone https://github.com/deepaknc2024/deepakchandwani-web.git /opt/deepakchandwani-web
cd /opt/deepakchandwani-web

# 5. Configure environment
cp .env.example .env
nano .env  # Fill in all values

# 6. Run migrations
PGPASSWORD=your-password psql -h localhost -U dcweb -d dcweb -f server/src/migrations/001_initial.sql

# 7. Install dependencies and build
npm install --workspaces
cd client && npm run build && cd ..
cd server && npm run build && cd ..

# 8. Configure Nginx
cp deploy/nginx.conf /etc/nginx/sites-available/web.deepakchandwani.com
ln -s /etc/nginx/sites-available/web.deepakchandwani.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 9. Get SSL certificate
certbot --nginx -d web.deepakchandwani.com

# 10. Start with PM2
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## Redeployment (After Code Changes)

```bash
ssh root@your-vps-ip
cd /opt/deepakchandwani-web
bash deploy/deploy.sh
```

Or manually:
```bash
git pull
npm install --workspaces
cd client && npm run build && cd ..
cd server && npm run build && cd ..
pm2 restart dc-web-server
```

---

## Local Development

```bash
# Clone
git clone https://github.com/deepaknc2024/deepakchandwani-web.git
cd deepakchandwani-web

# Install
npm install --workspaces

# Create .env in root (copy from .env.example)
cp .env.example .env
# Edit .env with your values (PostgreSQL must be running locally)

# Run database migrations
psql -h localhost -U dcweb -d dcweb -f server/src/migrations/001_initial.sql

# Start dev servers (in two terminals)
npm run dev:server   # Express on port 3001
npm run dev:client   # Vite on port 5173 (proxies /api to 3001)
```

Open http://localhost:5173

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (`{status:"ok", db:true}`) |
| GET | `/api/news?region=us\|in` | Guardian news headlines |
| GET | `/api/transcript?url=...` | Extract YouTube transcript |
| POST | `/api/summarize` | AI-summarize transcript (SSE stream) |
| POST | `/api/tts` | Text-to-speech (Edge TTS / Sarvam) |
| POST | `/api/contact` | Submit contact form |
| POST | `/api/auth/verify` | Verify page password |
| WS | `/ws/voice` | Voice chatbot WebSocket relay |

---

## Environment Variables

See `.env.example` for the full list with descriptions. Key variables:

| Variable | Required | Free? | Purpose |
|----------|----------|-------|---------|
| `DB_PASSWORD` | Yes | - | PostgreSQL password |
| `JWT_SECRET` | Yes | - | Auth token signing |
| `GUARDIAN_API_KEY` | No | Yes | News widget (default "test" works) |
| `OPENAI_API_KEY` | For voice chat | No | Voice chatbot on BSE pages |
| `OPENROUTER_API_KEY` | For summaries | Mostly | Free model used first, paid fallback |
| `SARVAM_API_KEY` | No | No | Indian language TTS fallback |

---

## Costs

| Service | Cost | Usage |
|---------|------|-------|
| VPS (Hostinger KVM 2) | $24.49/mo | Hosting |
| Transcript extraction | Free | YouTube captions API |
| AI Summarization | Free (usually) | OpenAI GPT-OSS 120B via OpenRouter |
| Summarization fallback | ~$0.0001/summary | Gemini 2.0 Flash |
| Text-to-Speech | Free | Microsoft Edge TTS |
| TTS fallback | ~₹0.50/min | Sarvam AI |
| Voice Chatbot | ~$0.06/min | OpenAI Realtime API |
| News/Weather/Forex | Free | Public APIs |

---

## Useful Commands

```bash
# Check server status
pm2 status

# View logs
pm2 logs dc-web-server

# Restart server
pm2 restart dc-web-server

# Check API health
curl https://web.deepakchandwani.com/api/health

# Check Nginx
nginx -t && systemctl reload nginx

# Renew SSL (auto-renews, but manual if needed)
certbot renew
```

---

## Destroying and Recreating

This project is designed to be fully reproducible from GitHub:

1. **Destroy** the current VPS
2. **Create** a new Ubuntu 24.04 VPS
3. **Point DNS** to new IP
4. **Run:** `git clone ... && bash deploy/setup.sh`
5. **Add API keys** to `.env`
6. **Done** — site is live

No data is lost because:
- All code is in GitHub
- Contact form submissions are the only dynamic data (re-created on setup)
- API keys are in `.env` (keep a secure copy)
