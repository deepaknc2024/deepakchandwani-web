---
name: add-feature
description: Guide for adding new features to the portfolio site
---

# Adding Features to web.deepakchandwani.com

## Architecture Overview

**Monorepo** with npm workspaces: `client/` (React) + `server/` (Express)

### Frontend (client/)
- **Framework:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS 4 (theme in `src/globals.css` using `@theme {}`)
- **Routing:** React Router v7 (`src/router.tsx`)
- **Path alias:** `@/` → `src/`
- **Fonts:** Inter (body), Syne (headings), Space Grotesk (UI), DM Sans (BSE pages)
- **Colors:** cyan-2 `#0891b2` (primary), ink `#0f172a`, indigo `#4f46e5`

### Backend (server/)
- **Framework:** Express 4 + TypeScript (ES modules)
- **Database:** PostgreSQL via `pg` pool (`src/db.ts`)
- **Config:** All env vars in `src/config.ts`
- **Routes:** Mount under `/api` in `src/index.ts`
- **WebSocket:** Voice relay attached to HTTP server

## Adding a New Page

1. Create page component: `client/src/pages/NewPage.tsx`
2. Add route in `client/src/router.tsx`
3. Add nav link in `client/src/components/layout/Navbar.tsx`

## Adding a New API Endpoint

1. Create route file: `server/src/routes/newroute.ts`
2. Import and mount in `server/src/index.ts`:
   ```typescript
   import newRouter from './routes/newroute.js';
   app.use('/api', newRouter);
   ```
3. Add proxy rule if needed in `client/vite.config.ts` (already proxies `/api` and `/ws`)

## Adding a New Environment Variable

1. Add to `server/src/config.ts`
2. Add to `.env.example` with description
3. Set on VPS: `ssh ... "echo 'KEY=value' >> /opt/deepakchandwani-web/.env && pm2 restart dc-web-server"`

## Database Changes

1. Create new migration: `server/src/migrations/002_description.sql`
2. Run on VPS: `ssh ... "PGPASSWORD=... psql -h localhost -U dcweb -d dcweb -f .../002_description.sql"`

## Build & Deploy

After changes:
```bash
cd client && npm run build          # Check frontend builds
cd ../server && npx tsc --noEmit    # Check server types
cd .. && git add -A && git commit -m "feat: description" && git push
# Then deploy (see deploy skill)
```

## Key Files Reference

| What | Where |
|------|-------|
| React routes | `client/src/router.tsx` |
| Nav bar | `client/src/components/layout/Navbar.tsx` |
| Global CSS/theme | `client/src/globals.css` |
| Server entry | `server/src/index.ts` |
| Config/env vars | `server/src/config.ts` |
| DB connection | `server/src/db.ts` |
| DB migrations | `server/src/migrations/` |
| Voice chatbot prompt | `server/src/ws/voice-relay.ts` (SYSTEM_PROMPT) |
| Transcript extraction | `server/src/routes/transcript.ts` |
| TTS providers | `server/src/routes/tts.ts` |
| Nginx config | `deploy/nginx.conf` |
| PM2 config | `deploy/ecosystem.config.cjs` |
| VPS setup | `deploy/setup.sh` |
