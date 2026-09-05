#!/usr/bin/env bash
set -euo pipefail

read_env() {
  local key="$1"
  local file="$2"
  local value
  value="$(grep "^${key}=" "$file" | head -n 1 | cut -d= -f2-)"
  value="${value#\"}"
  value="${value%\"}"
  printf '%s' "$value"
}

managed_env="/srv/kade/secrets/kadexai.env"
selfhosted_env="/srv/kade/secrets/supabase.env"
managed_url="$(read_env NEXT_PUBLIC_SUPABASE_URL "$managed_env")"
managed_key="$(read_env SUPABASE_SERVICE_ROLE_KEY "$managed_env")"
selfhosted_key="$(read_env SUPABASE_SECRET_KEY "$selfhosted_env")"

safe_settings() {
  jq -c '{external, email_autoconfirm, disable_signup, mailer_autoconfirm}'
}

printf 'MANAGED_SETTINGS='
curl -sS --fail "$managed_url/auth/v1/settings" \
  -H "apikey: $managed_key" | safe_settings
printf 'SELFHOSTED_SETTINGS='
curl -sS --fail "http://127.0.0.1:8000/auth/v1/settings" \
  -H "apikey: $selfhosted_key" | safe_settings
