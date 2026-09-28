# Keyubu Windows Server + WSL2 deployment

This stack keeps Windows Server as the host and runs the application inside
Ubuntu 24.04 on WSL2. The main site stays on Vercel. Vercel redirects only
`/kadexai` to `https://kadexai.kadenewmedia.com/kadexai`, which is served from
this Keyubu server. Self-hosted Supabase is exposed through
`https://supabase.kadenewmedia.com`.

Persistent data lives outside the source checkout:

- `/srv/kade/secrets/kadexai.env` — runtime secrets, mode `0600`
- `/srv/kade/media` — approved video/media workspace
- `/srv/kade/redis` — Redis append-only data

Run from this directory:

```bash
docker compose --env-file /srv/kade/secrets/kadexai.env build
docker compose --env-file /srv/kade/secrets/kadexai.env up -d
docker compose ps
curl --fail http://127.0.0.1:3000/kadexai/api/health
```

The web service intentionally binds only to WSL localhost. A Windows-hosted
Caddy service terminates TLS and proxies public traffic to this port. Do not
publish the media backend or Redis ports.

Windows host files are installed under `C:\Kade`. The `KadexAI-WSL` scheduled
task keeps WSL and the Docker stack alive while the Administrator session is
logged on. Caddy runs independently as the automatic Windows service `caddy`.

Scheduled application jobs are installed from `kadexai.cron` and keep Vercel's
UTC schedule. The stale `/api/reminders?action=check` entry is intentionally
excluded because that route is not present in this application tree.
Telegram saved-content summaries run at 06:00 and 09:00 UTC, corresponding to
09:00 and 12:00 in the fixed Europe/Istanbul UTC+3 time zone. Delivery slots
are persisted in Supabase so a repeated cron invocation cannot duplicate a
summary after a container restart.

Telegram access is account-based, not device-based. A second Telegram account
opens `@KadeXAiBot` and sends `/start` or `/yetkiiste`. The primary numeric
account in `TELEGRAM_CHAT_IDS` receives an approval button and can also use
`/yetkiver ID`, `/yetkial ID`, and `/yetkililer`. Delegated access is stored in
the service-role-only `telegram_bot_users` table and survives restarts; primary
owners remain controlled by the server environment and cannot be revoked from
Telegram.

The separately pinned self-hosted Supabase stack lives in `/srv/supabase`.
Its API gateway and PostgreSQL pooler bind only to WSL localhost; Windows
Caddy is the only public entry point. Daily encrypted database backups are
retained for 14 days under `/srv/kade/backups/selfhosted-supabase`.
Every Sunday the newest archive is decrypted and restored into a disposable
database in the existing PostgreSQL container. Its application table inventory
must match production; the temporary database is then force-dropped. Production
tables are never used as the restore target.

Production endpoints:

- Main site: `https://kadenewmedia.com` (Vercel)
- KadexAI: `https://kadexai.kadenewmedia.com/kadexai` (Keyubu)
- Supabase API: `https://supabase.kadenewmedia.com` (Keyubu)

Operational checks:

```bash
/srv/kade/bin/healthcheck-supabase
/srv/kade/bin/compare-supabase-counts
/srv/kade/bin/backup-selfhosted-supabase
/srv/kade/bin/verify-selfhosted-supabase-backup
```

`migrate-managed-to-selfhosted` automatically performs a full restore on an
empty target and a transactional data refresh when the application schema is
already present.
