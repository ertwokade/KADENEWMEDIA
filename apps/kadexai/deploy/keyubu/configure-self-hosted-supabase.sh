#!/usr/bin/env bash
set -euo pipefail

project_directory="/srv/supabase"
secrets_directory="/srv/kade/secrets"
secrets_file="$secrets_directory/supabase.env"

cd "$project_directory"

if [[ -L .env ]]; then
  active_env="$(readlink -f .env)"
elif [[ -f .env ]]; then
  active_env="$project_directory/.env"
else
  echo "Supabase .env is missing." >&2
  exit 1
fi

set_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$active_env"; then
    sed -i -e "s|^${key}=.*$|${key}=${value}|" "$active_env"
  else
    printf '%s=%s\n' "$key" "$value" >> "$active_env"
  fi
}

set_env SUPABASE_PUBLIC_URL "https://supabase.kadenewmedia.com"
set_env API_EXTERNAL_URL "https://supabase.kadenewmedia.com/auth/v1"
set_env SITE_URL "https://kadexai.kadenewmedia.com/kadexai"
set_env ADDITIONAL_REDIRECT_URLS "https://kadenewmedia.com/kadexai/**,https://kadexai.kadenewmedia.com/**,http://localhost:3000/**"
set_env ENABLE_PHONE_SIGNUP "false"
set_env ENABLE_PHONE_AUTOCONFIRM "false"
set_env PROXY_DOMAIN "supabase.kadenewmedia.com"
set_env CERTBOT_EMAIL "admin@kadenewmedia.com"
set_env COMPOSE_FILE "docker-compose.yml:docker-compose.local.yml"

if [[ "$(readlink -f "$active_env")" != "$(readlink -f "$secrets_file")" ]]; then
  install -m 600 "$active_env" "$secrets_file"
fi
if [[ "$active_env" == "$project_directory/.env" ]]; then
  rm -f "$project_directory/.env"
  ln -s "$secrets_file" "$project_directory/.env"
fi

docker compose config --quiet
printf 'SUPABASE_CONFIG=valid\n'
