#!/usr/bin/env bash
set -euo pipefail

migration_directory="${1:-}"
[[ -n "$migration_directory" && -f "$migration_directory/data.compat.sql" ]] || {
  echo "Usage: $0 /srv/kade/migrations/supabase-TIMESTAMP" >&2
  exit 2
}

supabase_directory="/srv/supabase"
log_file="$migration_directory/refresh.log"
truncate_file="$migration_directory/truncate-data.sql"

python3 - "$migration_directory/data.compat.sql" "$truncate_file" <<'PY'
import re
import sys
from pathlib import Path

copy_pattern = re.compile(r'^COPY "([^"]+)"\."([^"]+)" ')
tables = set()
for line in Path(sys.argv[1]).read_text(encoding="utf-8").splitlines():
    match = copy_pattern.match(line)
    if match:
        tables.add(match.groups())

if not tables:
    raise SystemExit("No COPY tables found in compatible data dump")

quoted = [f'"{schema}"."{table}"' for schema, table in sorted(tables)]
Path(sys.argv[2]).write_text(
    "SET session_replication_role = replica;\nTRUNCATE TABLE "
    + ", ".join(quoted)
    + " CASCADE;\n",
    encoding="utf-8",
)
print(f"REFRESH_TABLES={len(tables)}")
PY

cd "$supabase_directory"
services_to_stop="$(docker compose config --services | grep -v '^db$')"
# shellcheck disable=SC2086
docker compose stop $services_to_stop >> "$log_file" 2>&1

refresh_complete=0
restart_services() {
  if [[ "$refresh_complete" -eq 0 ]]; then
    cd "$supabase_directory"
    docker compose up -d >> "$log_file" 2>&1 || true
  fi
}
trap restart_services EXIT

{
  cat "$truncate_file"
  cat "$migration_directory/data.compat.sql"
} | docker exec -i supabase-db psql \
  --username postgres \
  --dbname postgres \
  --single-transaction \
  --variable ON_ERROR_STOP=1 >> "$log_file" 2>&1

docker compose up -d --wait --wait-timeout 180 >> "$log_file" 2>&1
refresh_complete=1
trap - EXIT

auth_users="$(docker exec supabase-db psql -U postgres -d postgres -Atc 'select count(*) from auth.users;')"
public_relations="$(docker exec supabase-db psql -U postgres -d postgres -Atc "select count(*) from information_schema.tables where table_schema='public' and table_type in ('BASE TABLE','VIEW');")"
printf 'REFRESH=ok AUTH_USERS=%s PUBLIC_RELATIONS=%s\n' "$auth_users" "$public_relations"
