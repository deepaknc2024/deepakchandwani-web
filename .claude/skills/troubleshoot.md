---
name: troubleshoot
description: Diagnose and fix issues with web.deepakchandwani.com
---

# Troubleshooting web.deepakchandwani.com

## Quick Health Check

```bash
# API status
curl -s https://web.deepakchandwani.com/api/health

# Server process
ssh -i ~/.ssh/hostinger_vps root@2.24.192.97 "pm2 status"

# Recent logs
ssh -i ~/.ssh/hostinger_vps root@2.24.192.97 "pm2 logs dc-web-server --lines 30 --nostream"

# Error logs only
ssh -i ~/.ssh/hostinger_vps root@2.24.192.97 "pm2 logs dc-web-server --err --lines 20 --nostream"
```

## Common Issues

### Site returns 502/503
- Check if PM2 process is running: `pm2 status`
- Restart: `pm2 restart dc-web-server`
- Check if port 3001 is in use: `ss -tlnp | grep 3001`

### Transcript extraction fails
- Check server logs for `[transcript]` entries
- YouTube may be rate-limiting the VPS IP — wait and retry
- Test directly: `curl 'http://localhost:3001/api/transcript?url=https://www.youtube.com/watch?v=8jPQjjsBbIc'`

### Voice chatbot disconnects immediately
- Check OpenAI API key: `grep OPENAI /opt/deepakchandwani-web/.env`
- Check logs for `[voice-relay]` entries
- Test OpenAI connection directly (see voice-relay.ts)
- Common: API key expired or quota exceeded

### Summarization says "not configured"
- Check OpenRouter key: `grep OPENROUTER /opt/deepakchandwani-web/.env`
- Restart after adding key: `pm2 restart dc-web-server`

### TTS not playing
- Check logs for `[tts]` entries
- Edge TTS needs outbound WebSocket to Microsoft servers
- Fallback chain: Edge TTS → Sarvam → Browser Speech

### SSL certificate expired
```bash
ssh -i ~/.ssh/hostinger_vps root@2.24.192.97 "certbot renew && nginx -t && systemctl reload nginx"
```

### Database connection failed
```bash
ssh -i ~/.ssh/hostinger_vps root@2.24.192.97 "systemctl status postgresql && sudo -u postgres psql -c 'SELECT 1;'"
```

### Browser shows stale content
- Hard refresh: `Ctrl + Shift + R`
- Vite uses content hashing — new builds have different filenames

## VPS Access
- **IP:** 2.24.192.97
- **SSH:** `ssh -i ~/.ssh/hostinger_vps root@2.24.192.97`
- **App:** /opt/deepakchandwani-web
- **Nginx:** /etc/nginx/sites-enabled/web.deepakchandwani.com
- **SSL:** /etc/letsencrypt/live/web.deepakchandwani.com/
- **Logs:** /var/log/dc-web/ (PM2 logs)
- **DB:** PostgreSQL, database=dcweb, user=dcweb
