#!/usr/bin/env bash
set -euo pipefail

env_file="/srv/kade/secrets/kadexai.env"

read_env() {
  local value
  value="$(grep "^$1=" "$env_file" | head -n 1 | cut -d= -f2- || true)"
  value="${value#\"}"
  value="${value%\"}"
  printf '%s' "$value"
}

for key in EMAIL_PROVIDER EMAIL_FROM RESEND_API_KEY SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS; do
  value="$(read_env "$key")"
  if [[ -n "$value" ]]; then
    printf '%s=present length=%s\n' "$key" "${#value}"
  else
    printf '%s=missing\n' "$key"
  fi
done
