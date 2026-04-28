# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web portal for managing AdsPower antidetect browser profiles. It wraps the AdsPower Local API (`http://local.adspower.net:50325`) with a Node/Express backend and a React/Tailwind frontend.

## Dev Commands

All commands assume you're inside `portal/`.

**Backend** (port 3001):
```bash
cd server && npm run dev      # nodemon hot-reload
cd server && npm start        # production
```

**Frontend** (port 3000):
```bash
cd client && npm run dev      # Vite dev server with HMR
cd client && npm run build    # production build to client/dist/
```

Frontend proxies `/api/*` → `http://localhost:3001` via Vite config — no CORS issues in dev.

**Windows note:** On Windows, Vite must be started via its `.cmd` shim — do not invoke the bare `vite` binary:
```powershell
Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "node_modules\.bin\vite.cmd" -WorkingDirectory "D:\workspace\adspower\portal\client"
```

## Architecture

```
portal/
  server/
    index.js              # Express app entry, mounts routes
    routes/
      profiles.js         # /api/profiles — list, check proxies, replace single proxy
      proxies.js          # /api/proxies  — single check, bulk-replace
    services/
      adspower.js         # Thin wrapper over AdsPower Local API (axios)
      proxyChecker.js     # Proxy health checks via http-proxy-agent → ip-api.com
      proxyPool.js        # Supabase proxy pool — fetch VN residential proxies, mark in_use/dead
      telegram.js         # Send formatted HTML reports to Telegram bot
      scheduler.js        # node-cron every 6h — check proxies, auto-replace dead, send Telegram report
    routes/
      scheduler.js        # /api/scheduler — status, run, start, stop
    .env                  # Secrets — SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SCHEDULE_INTERVAL
  client/
    src/
      App.jsx             # React Router routes
      api/index.js        # All axios calls to /api — import from here, never fetch directly
      components/
        Sidebar.jsx       # Nav menu — add new pages by appending to the `menu` array
        Layout.jsx        # Wraps all pages with sidebar
      pages/
        Profiles.jsx      # Main dashboard — profile table, proxy status filter, bulk replace modal
        Settings.jsx      # Scheduler control — Run Now button, last run report (replaced/skipped)
```

## Key Conventions

**Adding a new page:**
1. Create `client/src/pages/NewPage.jsx`
2. Add a route in `App.jsx`
3. Add an entry to the `menu` array in `Sidebar.jsx`
4. Add a route file in `server/routes/` and mount it in `server/index.js`

**AdsPower API calls** must go through `server/services/adspower.js` — never call `local.adspower.net` from the frontend directly.

**Proxy format** throughout the system is always `host:port:username:password` (colon-separated). Parsing lives in `Profiles.jsx:parseProxyLine()`.

**Proxy health checks** use `http-proxy-agent` to route a request through the proxy to `ip-api.com`. The checker returns `{ alive, ip, country, city }` on success or `{ alive: false }` on failure. Profiles with `proxy_soft === 'no_proxy'` return `{ alive: true, direct: true }`.

**Bulk proxy replace flow:** frontend collects selected profile `user_id`s + parsed proxy lines → `POST /api/proxies/bulk-replace` → calls `adspower.updateProfile()` for each in parallel.

**Proxy status filter:** `Profiles.jsx` maintains a `filter` state (`'all' | 'alive' | 'dead'`). Filter tabs only appear after a proxy check (`proxyStatus` is populated). The `filteredProfiles` derived array drives both the table rows and the select-all checkbox. Selecting all only selects visible (filtered) rows.

**Scheduler auto-replace rules (non-negotiable):**
- Only pull proxies where `country = 'vn'` AND `category = 'residential'` from Supabase
- Never assign a proxy whose `host:port` is already in use by another profile (de-dup in `proxyPool.js:getAvailableProxies`)
- Profile `M01` is always excluded from checks and replacements — it runs direct (no proxy) by design
- If pool has fewer available proxies than dead profiles, skip the remainder and mention them in the Telegram report

**Scheduler flow:** `scheduler.js:runCheck()` → filter out M01 → `checkProxiesBatch()` → collect dead → `getAvailableProxies(count, usedHostPorts)` → `updateProfile()` per dead profile → `markProxiesInUse()` → `buildReport()` → `send()` to Telegram.

**Supabase proxy pool:** table `proxies`, relevant columns: `id, host_port (host:port:user:pass), type, country, category, status (UNKNOWN/ACTIVE/DEAD), is_archived`. Scheduler sets replaced proxies to `ACTIVE`, never touches `is_archived`.

**Telegram:** bot `@DucHermesBot`, chat ID `705372260`. Reports sent after every scheduled or manual run. Format is HTML parse mode.

## AdsPower Local API Notes

- Base URL: `http://local.adspower.net:50325` — no API key required for local installs
- Profile list: `GET /api/v1/user/list?page=1&page_size=100`
- Update profile: `POST /api/v1/user/update` with `{ user_id, user_proxy_config: { proxy_soft, proxy_type, proxy_host, proxy_port, proxy_user, proxy_password } }`
- Response code `0` = success, `-1` = failure
