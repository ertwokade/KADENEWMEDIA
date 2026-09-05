#!/usr/bin/env bash
set -euo pipefail

app_env="/srv/kade/secrets/kadexai.env"
supabase_env="/srv/kade/secrets/supabase.env"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_path="/srv/kade/secrets/kadexai.env.before-selfhosted-$stamp"

read_env() {
  local key="$1"
  local file="$2"
  local value
  value="$(grep "^${key}=" "$file" | head -n 1 | cut -d= -f2-)"
  value="${value#\"}"
  value="${value%\"}"
  printf '%s' "$value"
}

set_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$app_env"; then
    sed -i -e "s|^${key}=.*$|${key}=\"${value}\"|" "$app_env"
  else
    printf '%s="%s"\n' "$key" "$value" >> "$app_env"
  fi
}

anon_key="$(read_env ANON_KEY "$supabase_env")"
service_key="$(read_env SERVICE_ROLE_KEY "$supabase_env")"
[[ -n "$anon_key" && -n "$service_key" ]] || {
  echo "Self-hosted Supabase API keys are missing." >&2
  exit 2
}

install -m 600 "$app_env" "$backup_path"
set_env NEXT_PUBLIC_SUPABASE_URL "https://supabase.kadenewmedia.com"
set_env NEXT_PUBLIC_SUPABASE_ANON_KEY "$anon_key"
set_env SUPABASE_SERVICE_ROLE_KEY "$service_key"
set_env NEXT_PUBLIC_APP_URL "https://kadexai.kadenewmedia.com/kadexai"
set_env NEXT_PUBLIC_SITE_URL "https://kadenewmedia.com"
chmod 600 "$app_env"

printf 'APP_ENV=selfhosted BACKUP=%s\n' "$backup_path"
