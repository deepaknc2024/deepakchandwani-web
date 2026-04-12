---
name: recreate-vps
description: Destroy and recreate the VPS from scratch using GitHub repo
---

# Recreate VPS from Scratch

Use this when the VPS is destroyed or you need to move to a new server.

## Prerequisites
- New Ubuntu 24.04 VPS with SSH access
- DNS A record for `web.deepakchandwani.com` pointing to new VPS IP
- API keys (keep a secure copy of your .env)

## Steps

### 1. Update DNS (if IP changed)
Point `web.deepakchandwani.com` A record to the new VPS IP.
If using Hostinger MCP:
```
Use mcp__hostinger-mcp__DNS_updateDNSRecordsV1 for deepakchandwani.com
```
Wait for DNS propagation (check: `dig web.deepakchandwani.com`)

### 2. SSH into new VPS
```bash
ssh root@NEW_VPS_IP
```

### 3. Run automated setup
```bash
git clone https://github.com/deepaknc2024/deepakchandwani-web.git /opt/deepakchandwani-web
cd /opt/deepakchandwani-web
bash deploy/setup.sh
```

### 4. Add API keys
```bash
nano /opt/deepakchandwani-web/.env
```

Add these (get from your secure backup):
```
OPENAI_API_KEY=sk-proj-...
OPENROUTER_API_KEY=sk-or-v1-...
SARVAM_API_KEY=sk_...
```

### 5. Restart
```bash
pm2 restart dc-web-server
```

### 6. Verify
```bash
curl https://web.deepakchandwani.com/api/health
# Should return: {"status":"ok","db":true}
```

### 7. Update SSH key (if needed)
If the VPS has a new SSH key, update `~/.ssh/hostinger_vps` on your local machine.
If using Hostinger MCP, attach your existing public key:
```
Use mcp__hostinger-mcp__VPS_attachPublicKeyV1
```

## What's NOT in GitHub (you need to restore manually)
- `.env` file (API keys, DB password, JWT secret)
- Contact form submissions (in PostgreSQL — lost on VPS destroy)
- SSL certificate (Certbot re-obtains automatically in setup.sh)

## What IS in GitHub (automatically restored)
- All source code (client + server)
- Database schema and seed data (migrations)
- Nginx configuration
- PM2 configuration
- Setup and deploy scripts
