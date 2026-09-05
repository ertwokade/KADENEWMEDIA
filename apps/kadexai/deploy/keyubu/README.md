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

The separately pinned self-hosted Supabase stack lives in `/srv/supabase`.
Its API gateway and PostgreSQL pooler bind only to WSL localhost; Windows
Caddy is the only public entry point. Daily encrypted database backups are
retained for 14 days under `/srv/kade/backups/selfhosted-supabase`.

Production endpoints:

- Main site: `https://kadenewmedia.com` (Vercel)
- KadexAI: `https://kadexai.kadenewmedia.com/kadexai` (Keyubu)
- Supabase API: `https://supabase.kadenewmedia.com` (Keyubu)

Operational checks:

```bash
/srv/kade/bin/healthcheck-supabase
/srv/kade/bin/compare-supabase-counts
/srv/kade/bin/backup-selfhosted-supabase
```

`migrate-managed-to-selfhosted` automatically performs a full restore on an
empty target and a transactional data refresh when the application schema is
already present.
