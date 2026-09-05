#!/usr/bin/env bash
set -euo pipefail

deploy_dir="/srv/kade/current/apps/kadexai/deploy/keyubu"
env_file="/srv/kade/secrets/kadexai.env"

cd "$deploy_dir"
docker compose --env-file "$env_file" up -d >/dev/null
sleep 35
docker compose --env-file "$env_file" ps

printf 'APP_HEALTH='
curl -sS -o /tmp/kadexai-app-health -w '%{http_code}' \
  http://127.0.0.1:3000/kadexai/api/health
printf ' APP_BODY='
cat /tmp/kadexai-app-health

set -a
# shellcheck disable=SC1090
. "$env_file"
set +a

printf '\nGEMINI='
curl -sS -o /tmp/kadexai-gemini-check -w '%{http_code}' \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models
printf ' GEMINI_BYTES='
wc -c < /tmp/kadexai-gemini-check
