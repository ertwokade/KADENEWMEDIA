#!/usr/bin/env bash
set -euo pipefail

project_directory="/srv/supabase"
env_file="$project_directory/.env"

read_env() {
  grep "^$1=" "$env_file" | head -n 1 | cut -d= -f2-
}

publishable_key="$(read_env SUPABASE_PUBLISHABLE_KEY)"
secret_key="$(read_env SUPABASE_SECRET_KEY)"

cd "$project_directory"
sleep 20
docker compose ps

printf 'SELFHOST_AUTH='
curl -sS -o /tmp/selfhost-auth-health -w '%{http_code}' \
  -H "apikey: $publishable_key" \
  http://127.0.0.1:8000/auth/v1/settings

printf ' SELFHOST_REST='
curl -sS -o /tmp/selfhost-rest-health -w '%{http_code}' \
  -H "apikey: $secret_key" \
  -H "Authorization: Bearer $secret_key" \
  http://127.0.0.1:8000/rest/v1/

printf ' SELFHOST_STORAGE='
curl -sS -o /tmp/selfhost-storage-health -w '%{http_code}' \
  -H "apikey: $secret_key" \
  -H "Authorization: Bearer $secret_key" \
  http://127.0.0.1:8000/storage/v1/bucket

printf ' KADEXAI='
curl -sS -o /tmp/kadexai-health-after-supabase -w '%{http_code}' \
  http://127.0.0.1:3000/kadexai/api/health

printf '\nMEMORY='
free -h | awk '/^Mem:/ { print $3 "/" $2 }'
