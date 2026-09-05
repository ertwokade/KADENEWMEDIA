#!/usr/bin/env bash
set -euo pipefail

backup_directory="/srv/kade/backups/selfhosted-supabase"
supabase_directory="/srv/supabase"
encryption_env="/srv/kade/secrets/kadexai.env"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
work_directory="$(mktemp -d /srv/kade/backups/.supabase-work-XXXXXX)"
archive_path="$backup_directory/supabase-$stamp.tar.gz.enc"

cleanup() {
  rm -rf "$work_directory"
}
trap cleanup EXIT

read_env() {
  local value
  value="$(grep "^$1=" "$encryption_env" | head -n 1 | cut -d= -f2-)"
  value="${value#\"}"
  value="${value%\"}"
  printf '%s' "$value"
}

export KADE_BACKUP_ENCRYPTION_KEY="$(read_env KADE_TOKEN_ENCRYPTION_KEY)"
[[ -n "$KADE_BACKUP_ENCRYPTION_KEY" ]] || {
  echo "Backup encryption key is missing." >&2
  exit 1
}

mkdir -p "$backup_directory"
chmod 700 "$backup_directory"

docker exec supabase-db pg_dump \
  --username postgres \
  --dbname postgres \
  --format custom \
  --no-owner \
  --no-privileges > "$work_directory/database.dump"

docker exec supabase-db pg_dumpall \
  --username postgres \
  --globals-only > "$work_directory/globals.sql"

install -m 600 /srv/kade/secrets/supabase.env "$work_directory/supabase.env"
install -m 600 "$supabase_directory/.supabase-version" "$work_directory/supabase-version"

tar -C "$work_directory" -czf - . |
  openssl enc -aes-256-cbc -salt -pbkdf2 -iter 250000 \
    -pass env:KADE_BACKUP_ENCRYPTION_KEY \
    -out "$archive_path"
chmod 600 "$archive_path"
sha256sum "$archive_path" > "$archive_path.sha256"
chmod 600 "$archive_path.sha256"

openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 \
  -pass env:KADE_BACKUP_ENCRYPTION_KEY \
  -in "$archive_path" |
  tar -tzf - >/dev/null
sha256sum --check "$archive_path.sha256" >/dev/null

find "$backup_directory" -maxdepth 1 -type f \
  \( -name 'supabase-*.tar.gz.enc' -o -name 'supabase-*.tar.gz.enc.sha256' \) \
  -mtime +14 -delete

printf '%s backup=selfhosted-supabase result=ok bytes=%s\n' \
  "$(date -u +%FT%TZ)" "$(wc -c < "$archive_path" | tr -d ' ')" >> /srv/kade/logs/backup.log
