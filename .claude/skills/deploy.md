---
name: deploy
description: Deploy latest code to the Hostinger VPS (web.deepakchandwani.com)
---

# Deploy to Production

Deploys the latest code from GitHub to the Hostinger VPS at web.deepakchandwani.com.

## Steps

1. Build client and server locally to check for errors:
```bash
cd c:/claude/digitalocean/deepakchandwani-web
cd client && npm run build && cd ../server && npx tsc --noEmit && cd ..
```

2. Commit and push to GitHub:
```bash
git add -A && git commit -m "description" && git push
```

3. SSH into VPS and deploy:
```bash
ssh -i ~/.ssh/hostinger_vps root@2.24.192.97 "cd /opt/deepakchandwani-web && git pull && npm install --workspaces && cd client && npm run build && cd ../server && npm run build && cd .. && pm2 restart dc-web-server"
```

4. Verify:
```bash
curl -s https://web.deepakchandwani.com/api/health
```

## Quick deploy (if no package changes):
```bash
ssh -i ~/.ssh/hostinger_vps root@2.24.192.97 "cd /opt/deepakchandwani-web && git pull && cd client && npm run build && cd ../server && npm run build && pm2 restart dc-web-server"
```

## VPS Details
- **IP:** 2.24.192.97
- **SSH Key:** ~/.ssh/hostinger_vps
- **App dir:** /opt/deepakchandwani-web
- **PM2 process:** dc-web-server
- **Logs:** `pm2 logs dc-web-server`
