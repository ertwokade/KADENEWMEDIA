#!/usr/bin/env bash
set -euo pipefail

password_file="${1:-/srv/kade/secrets/managed-supabase-db-password}"
[[ -f "$password_file" ]] || {
  echo "Source database password file is missing: $password_file" >&2
  exit 2
}

source_password="$(< "$password_file")"
if [[ ! "$source_password" =~ ^[A-Za-z0-9]+$ ]]; then
  echo "Source password must be alphanumeric so it is safe in the connection URI." >&2
  exit 2
fi

source_database_url="postgresql://postgres.kkozbufsyeydowstnnes:${source_password}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"
supabase_directory="/srv/supabase"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
migration_directory="/srv/kade/migrations/supabase-$stamp"
backup_directory="/srv/kade/backups/platform-exports"
log_file="$migration_directory/migration.log"

umask 077
mkdir -p "$migration_directory" "$backup_directory"

printf '%s phase=source-connection-check\n' "$(date -u +%FT%TZ)" >> "$log_file"
docker run --rm postgres:17-alpine \
  psql "$source_database_url" --tuples-only --no-align \
  --command 'select current_database();' >/dev/null 2>> "$log_file"

printf '%s phase=dump-roles\n' "$(date -u +%FT%TZ)" >> "$log_file"
supabase db dump --db-url "$source_database_url" \
  --file "$migration_directory/roles.sql" --role-only >> "$log_file" 2>&1

printf '%s phase=dump-schema\n' "$(date -u +%FT%TZ)" >> "$log_file"
supabase db dump --db-url "$source_database_url" \
  --file "$migration_directory/schema.sql" >> "$log_file" 2>&1

printf '%s phase=dump-data\n' "$(date -u +%FT%TZ)" >> "$log_file"
supabase db dump --db-url "$source_database_url" \
  --file "$migration_directory/data.sql" --use-copy --data-only >> "$log_file" 2>&1

sha256sum \
  "$migration_directory/roles.sql" \
  "$migration_directory/schema.sql" \
  "$migration_directory/data.sql" > "$migration_directory/SHA256SUMS"

printf '%s phase=prepare-compatible-data\n' "$(date -u +%FT%TZ)" >> "$log_file"
docker exec supabase-db psql \
  --username postgres \
  --dbname postgres \
  --tuples-only \
  --no-align \
  --field-separator=$'\t' \
  --command "select table_schema, table_name, column_name from information_schema.columns where table_schema in ('auth', 'storage') order by table_schema, table_name, ordinal_position;" \
  > "$migration_directory/target-internal-columns.tsv"
/srv/kade/bin/prepare-supabase-data-compat \
  "$migration_directory/data.sql" \
  "$migration_directory/target-internal-columns.tsv" \
  "$migration_directory/data.compat.sql" >> "$log_file" 2>&1
sha256sum "$migration_directory/data.compat.sql" >> "$migration_directory/SHA256SUMS"

target_has_application_schema="$(
  docker exec supabase-db psql \
    --username postgres \
    --dbname postgres \
    --tuples-only \
    --no-align \
    --command "select to_regclass('public.ai_usage_events') is not null;"
)"

if [[ "$target_has_application_schema" == "t" ]]; then
  printf '%s phase=refresh-existing-data\n' "$(date -u +%FT%TZ)" >> "$log_file"
  /srv/kade/bin/refresh-supabase-data "$migration_directory" >> "$log_file" 2>&1
else
  printf '%s phase=restore-new-schema\n' "$(date -u +%FT%TZ)" >> "$log_file"
  /srv/kade/bin/restore-supabase-dump "$migration_directory" >> "$log_file" 2>&1
fi

auth_users="$(docker exec supabase-db psql --username postgres --dbname postgres --tuples-only --no-align --command 'select count(*) from auth.users;')"
public_tables="$(docker exec supabase-db psql --username postgres --dbname postgres --tuples-only --no-align --command "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE';")"

read_env() {
  local value
  value="$(grep "^$1=" /srv/kade/secrets/kadexai.env | head -n 1 | cut -d= -f2-)"
  value="${value#\"}"
  value="${value%\"}"
  printf '%s' "$value"
}
export KADE_BACKUP_ENCRYPTION_KEY="$(read_env KADE_TOKEN_ENCRYPTION_KEY)"

tar -C "$(dirname "$migration_directory")" -czf - "$(basename "$migration_directory")" |
  openssl enc -aes-256-cbc -salt -pbkdf2 -iter 250000 \
    -pass env:KADE_BACKUP_ENCRYPTION_KEY \
    -out "$backup_directory/platform-export-$stamp.tar.gz.enc"
chmod 600 "$backup_directory/platform-export-$stamp.tar.gz.enc"
sha256sum "$backup_directory/platform-export-$stamp.tar.gz.enc" > "$backup_directory/platform-export-$stamp.tar.gz.enc.sha256"
chmod 600 "$backup_directory/platform-export-$stamp.tar.gz.enc.sha256"

openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 \
  -pass env:KADE_BACKUP_ENCRYPTION_KEY \
  -in "$backup_directory/platform-export-$stamp.tar.gz.enc" |
  tar -tzf - >/dev/null
sha256sum --check "$backup_directory/platform-export-$stamp.tar.gz.enc.sha256" >/dev/null

printf 'MIGRATION=ok AUTH_USERS=%s PUBLIC_TABLES=%s\n' "$auth_users" "$public_tables"
