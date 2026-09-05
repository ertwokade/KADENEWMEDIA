#!/usr/bin/env bash
set -euo pipefail

managed_env="/srv/kade/secrets/kadexai.env"
selfhosted_env="/srv/kade/secrets/supabase.env"
work_directory="$(mktemp -d /tmp/kadexai-compare-XXXXXX)"

cleanup() {
  rm -rf "$work_directory"
}
trap cleanup EXIT

read_env() {
  local key="$1"
  local file="$2"
  local value
  value="$(grep "^${key}=" "$file" | head -n 1 | cut -d= -f2-)"
  if [[ "$value" == \"*\" && "$value" == *\" ]]; then
    value="${value#\"}"
    value="${value%\"}"
  elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
    value="${value#\'}"
    value="${value%\'}"
  fi
  printf '%s' "$value"
}

managed_url="$(read_env NEXT_PUBLIC_SUPABASE_URL "$managed_env")"
managed_key="$(read_env SUPABASE_SERVICE_ROLE_KEY "$managed_env")"
selfhosted_url="http://127.0.0.1:8000"
selfhosted_key="$(read_env SUPABASE_SECRET_KEY "$selfhosted_env")"

fetch_openapi() {
  local url="$1"
  local key="$2"
  local output="$3"
  curl -sS --fail "$url/rest/v1/" \
    -H "apikey: $key" \
    -H "Authorization: Bearer $key" \
    -o "$output"
}

relation_count() {
  local url="$1"
  local key="$2"
  local relation="$3"
  curl -sSI "$url/rest/v1/$relation?select=*" \
    -H "apikey: $key" \
    -H "Authorization: Bearer $key" \
    -H 'Prefer: count=exact' |
    awk -F/ 'tolower($1) ~ /^content-range:/ { gsub("\r", "", $2); print $2 }' |
    tail -n 1
}

fetch_openapi "$managed_url" "$managed_key" "$work_directory/managed-openapi.json"
fetch_openapi "$selfhosted_url" "$selfhosted_key" "$work_directory/selfhosted-openapi.json"

jq -r '.definitions | keys[]' "$work_directory/managed-openapi.json" | sort -u > "$work_directory/managed-relations"
jq -r '.definitions | keys[]' "$work_directory/selfhosted-openapi.json" | sort -u > "$work_directory/selfhosted-relations"
cat "$work_directory/managed-relations" "$work_directory/selfhosted-relations" | sort -u > "$work_directory/all-relations"

mismatches=0
managed_total=0
selfhosted_total=0
while IFS= read -r relation; do
  managed_count="$(relation_count "$managed_url" "$managed_key" "$relation")"
  selfhosted_count="$(relation_count "$selfhosted_url" "$selfhosted_key" "$relation")"
  managed_count="${managed_count:-missing}"
  selfhosted_count="${selfhosted_count:-missing}"

  if [[ "$managed_count" =~ ^[0-9]+$ ]]; then
    managed_total=$((managed_total + managed_count))
  fi
  if [[ "$selfhosted_count" =~ ^[0-9]+$ ]]; then
    selfhosted_total=$((selfhosted_total + selfhosted_count))
  fi

  if [[ "$managed_count" != "$selfhosted_count" ]]; then
    printf 'MISMATCH=%s MANAGED=%s SELFHOSTED=%s\n' "$relation" "$managed_count" "$selfhosted_count"
    mismatches=$((mismatches + 1))
  fi
done < "$work_directory/all-relations"

managed_users="$(curl -sS --fail "$managed_url/auth/v1/admin/users?page=1&per_page=1000" -H "apikey: $managed_key" -H "Authorization: Bearer $managed_key" | jq '.users | length')"
selfhosted_users="$(curl -sS --fail "$selfhosted_url/auth/v1/admin/users?page=1&per_page=1000" -H "apikey: $selfhosted_key" -H "Authorization: Bearer $selfhosted_key" | jq '.users | length')"

managed_relations="$(wc -l < "$work_directory/managed-relations" | tr -d ' ')"
selfhosted_relations="$(wc -l < "$work_directory/selfhosted-relations" | tr -d ' ')"

printf 'COMPARE_MISMATCHES=%s MANAGED_RELATIONS=%s SELFHOSTED_RELATIONS=%s MANAGED_ROWS=%s SELFHOSTED_ROWS=%s MANAGED_USERS=%s SELFHOSTED_USERS=%s\n' \
  "$mismatches" "$managed_relations" "$selfhosted_relations" "$managed_total" "$selfhosted_total" "$managed_users" "$selfhosted_users"

[[ "$mismatches" -eq 0 && "$managed_users" -eq "$selfhosted_users" ]]
