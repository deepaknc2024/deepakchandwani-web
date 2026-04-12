# Project: web.deepakchandwani.com

Portfolio site: React 19 + Express + PostgreSQL on Hostinger VPS (2.24.192.97).

## Quick Reference
- **Live:** https://web.deepakchandwani.com
- **Repo:** https://github.com/deepaknc2024/deepakchandwani-web
- **VPS SSH:** `ssh -i ~/.ssh/hostinger_vps root@2.24.192.97`
- **App dir on VPS:** /opt/deepakchandwani-web
- **PM2 process:** dc-web-server

## Structure
- `client/` — React + Vite + Tailwind CSS 4 + TypeScript
- `server/` — Express + PostgreSQL + WebSocket (TypeScript, ES modules)
- `deploy/` — setup.sh, deploy.sh, nginx.conf, PM2 config

## Key Commands
```bash
npm run dev:client    # Vite dev server (port 5173, proxies /api to 3001)
npm run dev:server    # Express dev server (port 3001)
npm run build         # Build both client and server
```

## Deploy
```bash
git push && ssh -i ~/.ssh/hostinger_vps root@2.24.192.97 "cd /opt/deepakchandwani-web && bash deploy/deploy.sh"
```

## Skills Available
- `/deploy` — Deploy to production VPS
- `/add-feature` — Guide for adding new features
- `/troubleshoot` — Diagnose and fix issues
- `/recreate-vps` — Destroy and recreate VPS from scratch
