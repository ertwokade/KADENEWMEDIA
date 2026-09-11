#!/usr/bin/env bash
set -euo pipefail

backup_directory="/srv/kade/backups/selfhosted-supabase"
environment_file="/srv/kade/secrets/kadexai.env"
log_file="/srv/kade/logs/backup.log"
work_directory="$(mktemp -d /srv/kade/backups/.supabase-verify-XXXXXX)"
restore_database="kade_restore_verify_$(date -u +%Y%m%d_%H%M%S)_$$"
restore_role="supabase_admin"
database_created=0

cleanup() {
  if [[ "$database_created" -eq 1 ]]; then
    docker exec supabase-db dropdb --username postgres --force "$restore_database" >/dev/null 2>&1 || true
  fi
  case "$work_directory" in
    /srv/kade/backups/.supabase-verify-*) rm -rf -- "$work_directory" ;;
  esac
}
trap cleanup EXIT

read_env() {
  local value
  value="$(grep "^$1=" "$environment_file" | head -n 1 | cut -d= -f2-)"
  value="${value#\"}"
  value="${value%\"}"
  printf '%s' "$value"
}

backup_path="${1:-}"
if [[ -z "$backup_path" ]]; then
  backup_path="$(find "$backup_directory" -maxdepth 1 -type f -name 'supabase-*.tar.gz.enc' -printf '%T@ %p\n' | sort -rn | head -n 1 | cut -d' ' -f2-)"
fi
backup_path="$(realpath -e "$backup_path")"
case "$backup_path" in
  "$backup_directory"/supabase-*.tar.gz.enc) ;;
  *) echo "Backup path is outside the approved directory." >&2; exit 2 ;;
esac

checksum_path="$backup_path.sha256"
[[ -f "$checksum_path" ]] || { echo "Backup checksum is missing." >&2; exit 1; }
(
  cd "$backup_directory"
  sha256sum --check "$(basename "$checksum_path")" >/dev/null
)

export KADE_BACKUP_ENCRYPTION_KEY="$(read_env KADE_TOKEN_ENCRYPTION_KEY)"
[[ -n "$KADE_BACKUP_ENCRYPTION_KEY" ]] || { echo "Backup encryption key is missing." >&2; exit 1; }

openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 \
  -pass env:KADE_BACKUP_ENCRYPTION_KEY \
  -in "$backup_path" |
  tar -xzf - -C "$work_directory"

[[ -s "$work_directory/database.dump" ]] || { echo "Database dump is missing from backup." >&2; exit 1; }
docker exec -i supabase-db pg_restore --list < "$work_directory/database.dump" >/dev/null

docker exec supabase-db createdb --username postgres "$restore_database"
database_created=1
docker exec -i supabase-db pg_restore \
  --username "$restore_role" \
  --dbname "$restore_database" \
  --exit-on-error \
  --no-owner \
  --no-privileges < "$work_directory/database.dump"

inventory_query="SELECT schemaname || '.' || tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') ORDER BY 1;"
source_inventory="$(docker exec supabase-db psql --username postgres --dbname postgres --tuples-only --no-align --command "$inventory_query")"
restore_inventory="$(docker exec supabase-db psql --username postgres --dbname "$restore_database" --tuples-only --no-align --command "$inventory_query")"

[[ -n "$restore_inventory" ]] || { echo "Restored database has no application tables." >&2; exit 1; }
[[ "$source_inventory" == "$restore_inventory" ]] || { echo "Restored table inventory differs from production." >&2; exit 1; }

table_count="$(printf '%s\n' "$restore_inventory" | sed '/^$/d' | wc -l | tr -d ' ')"
printf '%s backup-restore-verify=selfhosted-supabase result=ok tables=%s archive=%s\n' \
  "$(date -u +%FT%TZ)" "$table_count" "$(basename "$backup_path")" >> "$log_file"
printf 'RESTORE_VERIFY=ok TABLES=%s ARCHIVE=%s\n' "$table_count" "$(basename "$backup_path")"
