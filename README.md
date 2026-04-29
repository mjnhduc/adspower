# AdsPower Portal

A web portal for managing AdsPower antidetect browser profiles — proxy health monitoring, auto-replacement, and Telegram notifications.

## Features

- **Profile Dashboard** — view all profiles with proxy status (Alive/Dead/Direct)
- **Proxy Health Check** — check all proxies at once, filter by Alive/Dead
- **Bulk Proxy Replace** — select dead profiles, paste new proxies, apply in one click
- **Auto Scheduler** — runs every 6 hours, detects dead proxies and replaces them automatically
- **Telegram Reports** — receive a summary report after every scheduled or manual run
- **Supabase Proxy Pool** — pulls fresh VN residential proxies from your Supabase database

## Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** Supabase (proxy pool)
- **Notifications:** Telegram Bot API

## Project Structure

```
adspower/
  portal/
    server/         # Express API + scheduler
    client/         # React frontend
```

## Getting Started

**1. Install dependencies**
```bash
cd portal/server && npm install
cd portal/client && npm install
```

**2. Configure environment**
```bash
cp portal/server/.env.example portal/server/.env
# Fill in your values
```

**3. Run**

**Windows (one command):**
```powershell
# Allow scripts once if needed:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
.\start.ps1
```

**Mac/Linux (one command):**
```bash
chmod +x start.sh && ./start.sh
```

**Manual:**

Terminal 1 — Backend:
```bash
cd portal/server && node index.js
```

Terminal 2 — Frontend:
```bash
cd portal/client && node_modules\.bin\vite.cmd   # Windows
cd portal/client && npx vite                      # Mac/Linux
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ADSPOWER_BASE_URL` | AdsPower local API (default: `http://local.adspower.net:50325`) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Your Telegram chat ID |
| `SCHEDULE_INTERVAL` | Cron expression (default: `0 */6 * * *`) |
| `SCHEDULE_ENABLED` | Enable/disable cron job (`true` / `false`, default: `true`) |

## Proxy Pool Rules

Proxies fetched from Supabase must satisfy:
- Country: `vn` (Vietnam)
- Category: `residential`
- Not archived
- Not already assigned to another profile

## Notes

- Profile `M01` is excluded from all automated checks — it runs without a proxy by design
- Proxy format: `host:port:username:password`
