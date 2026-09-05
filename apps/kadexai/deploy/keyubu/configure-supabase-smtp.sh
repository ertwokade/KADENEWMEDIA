#!/usr/bin/env bash
set -euo pipefail

credentials_file="${1:-}"
secrets_file="/srv/kade/secrets/supabase.env"
supabase_directory="/srv/supabase"

[[ -f "$credentials_file" ]] || {
  echo "SMTP credentials file is missing." >&2
  exit 2
}

read_env() {
  local value
  value="$(grep "^$1=" "$credentials_file" | head -n 1 | cut -d= -f2-)"
  value="${value#\"}"
  value="${value%\"}"
  printf '%s' "$value"
}

smtp_host="$(read_env SMTP_HOST)"
smtp_port="$(read_env SMTP_PORT)"
smtp_user="$(read_env SMTP_USER)"
smtp_pass="$(read_env SMTP_PASS)"

[[ "$smtp_host" =~ ^[A-Za-z0-9.-]+$ ]] || { echo "Invalid SMTP host." >&2; exit 2; }
[[ "$smtp_port" =~ ^[0-9]{1,5}$ ]] || { echo "Invalid SMTP port." >&2; exit 2; }
[[ "$smtp_user" =~ ^[^[:space:]@]+@[^[:space:]@]+$ ]] || { echo "Invalid SMTP user." >&2; exit 2; }
[[ -n "$smtp_pass" && "$smtp_pass" != *$'\n'* && "$smtp_pass" != *'|'* && "$smtp_pass" != *'&'* ]] || {
  echo "SMTP password contains unsupported characters." >&2
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

set_env SMTP_ADMIN_EMAIL "$smtp_user"
set_env SMTP_HOST "$smtp_host"
set_env SMTP_PORT "$smtp_port"
set_env SMTP_USER "$smtp_user"
set_env SMTP_PASS "$smtp_pass"
set_env SMTP_SENDER_NAME "Kade New Media"
chmod 600 "$secrets_file"

cd "$supabase_directory"
docker compose config --quiet
docker compose up -d --wait auth

rm -f -- "$credentials_file"
printf 'SMTP_CONFIG=valid HOST=%s PORT=%s\n' "$smtp_host" "$smtp_port"
