#!/usr/bin/env bash
set -euo pipefail

migration_directory="${1:-}"
if [[ -z "$migration_directory" ]]; then
  migration_directory="$(find /srv/kade/migrations -maxdepth 1 -type d -name 'supabase-*' | sort | tail -n 1)"
fi

for required_file in roles.sql schema.sql data.compat.sql; do
  [[ -f "$migration_directory/$required_file" ]] || {
    echo "Missing restore file: $migration_directory/$required_file" >&2
    exit 2
  }
done

supabase_directory="/srv/supabase"
log_file="$migration_directory/restore.log"
cd "$supabase_directory"

services_to_stop="$(docker compose config --services | grep -v '^db$')"
# shellcheck disable=SC2086
docker compose stop $services_to_stop >> "$log_file" 2>&1

restore_complete=0
restart_services() {
  if [[ "$restore_complete" -eq 0 ]]; then
    cd "$supabase_directory"
    docker compose up -d >> "$log_file" 2>&1 || true
  fi
}
trap restart_services EXIT

{
  cat "$migration_directory/roles.sql"
  cat "$migration_directory/schema.sql"
  printf '\nSET session_replication_role = replica;\n'
  cat "$migration_directory/data.compat.sql"
} | docker exec -i supabase-db psql \
  --username postgres \
  --dbname postgres \
  --single-transaction \
  --variable ON_ERROR_STOP=1 >> "$log_file" 2>&1

docker compose up -d --wait --wait-timeout 180 >> "$log_file" 2>&1
restore_complete=1
trap - EXIT

auth_users="$(docker exec supabase-db psql -U postgres -d postgres -Atc 'select count(*) from auth.users;')"
public_relations="$(docker exec supabase-db psql -U postgres -d postgres -Atc "select count(*) from information_schema.tables where table_schema='public' and table_type in ('BASE TABLE','VIEW');")"
printf 'RESTORE=ok AUTH_USERS=%s PUBLIC_RELATIONS=%s\n' "$auth_users" "$public_relations"
