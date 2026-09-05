#!/usr/bin/env bash
set -euo pipefail

migration_directory="${1:-}"
remove_source="${2:-}"
if [[ -z "$migration_directory" || ! -d "$migration_directory" ]]; then
  echo "Usage: $0 /srv/kade/migrations/supabase-TIMESTAMP [--remove-source]" >&2
  exit 2
fi

case "$migration_directory" in
  /srv/kade/migrations/supabase-*) ;;
  *)
    echo "Refusing unexpected migration path: $migration_directory" >&2
    exit 2
    ;;
esac

read_env() {
  local value
  value="$(grep "^$1=" /srv/kade/secrets/kadexai.env | head -n 1 | cut -d= -f2-)"
  value="${value#\"}"
  value="${value%\"}"
  printf '%s' "$value"
}

export KADE_BACKUP_ENCRYPTION_KEY="$(read_env KADE_TOKEN_ENCRYPTION_KEY)"
[[ -n "$KADE_BACKUP_ENCRYPTION_KEY" ]] || {
  echo "Backup encryption key is missing." >&2
  exit 1
}

backup_directory="/srv/kade/backups/platform-exports"
archive_name="platform-export-${migration_directory##*/supabase-}.tar.gz.enc"
archive_path="$backup_directory/$archive_name"
mkdir -p "$backup_directory"
chmod 700 "$backup_directory"

tar -C "$(dirname "$migration_directory")" -czf - "$(basename "$migration_directory")" |
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

if [[ "$remove_source" == "--remove-source" ]]; then
  rm -rf -- "$migration_directory"
fi

printf 'ARCHIVE=ok FILE=%s BYTES=%s SOURCE_REMOVED=%s\n' \
  "$archive_path" \
  "$(wc -c < "$archive_path" | tr -d ' ')" \
  "$([[ "$remove_source" == "--remove-source" ]] && printf yes || printf no)"
