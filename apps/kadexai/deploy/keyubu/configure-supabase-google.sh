#!/usr/bin/env bash
set -euo pipefail

credentials_file="${1:-}"
secrets_file="/srv/kade/secrets/supabase.env"
supabase_directory="/srv/supabase"

[[ -f "$credentials_file" ]] || {
  echo "Google OAuth credentials file is missing." >&2
  exit 2
}

client_id="$(jq -er '.clientId' "$credentials_file")"
client_secret="$(jq -er '.clientSecret' "$credentials_file")"
[[ "$client_id" == *.apps.googleusercontent.com && ${#client_secret} -ge 20 ]] || {
  echo "Google OAuth credentials are invalid." >&2
  exit 2
}

set_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$secrets_file"; then
    sed -i -e "s|^${key}=.*$|${key}=${value}|" "$secrets_file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$secrets_file"
  fi
}

set_env GOOGLE_ENABLED true
set_env GOOGLE_CLIENT_ID "$client_id"
set_env GOOGLE_SECRET "$client_secret"
chmod 600 "$secrets_file"

cd "$supabase_directory"
docker compose config --quiet
docker compose up -d --wait auth

rm -f -- "$credentials_file"
printf 'GOOGLE_AUTH=enabled\n'
