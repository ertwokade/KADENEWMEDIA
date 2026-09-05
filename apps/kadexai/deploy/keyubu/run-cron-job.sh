#!/usr/bin/env bash
set -euo pipefail

job_name="${1:?job name is required}"
route_path="${2:?route path is required}"
env_file="/srv/kade/secrets/kadexai.env"
log_directory="/srv/kade/logs"
response_file="/tmp/kadexai-cron-${job_name}.response"

mkdir -p "$log_directory"
exec 9>"/run/lock/kadexai-${job_name}.lock"
if ! flock -n 9; then
  printf '%s job=%s result=skipped reason=already-running\n' "$(date -u +%FT%TZ)" "$job_name" >> "$log_directory/cron.log"
  exit 0
fi

set -a
# shellcheck disable=SC1090
. "$env_file"
set +a

status_code="$({ curl --silent --show-error \
  --connect-timeout 15 \
  --max-time 1800 \
  --output "$response_file" \
  --write-out '%{http_code}' \
  --header "x-cron-secret: $CRON_SECRET" \
  "http://127.0.0.1:3000${route_path}"; } 2>> "$log_directory/cron.log")"
response_size="$(wc -c < "$response_file" | tr -d ' ')"

printf '%s job=%s status=%s bytes=%s\n' \
  "$(date -u +%FT%TZ)" "$job_name" "$status_code" "$response_size" >> "$log_directory/cron.log"

case "$status_code" in
  2??) exit 0 ;;
  *) exit 1 ;;
esac
