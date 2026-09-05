#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: $0 <supabase-url-file> <service-role-key-file> <output-directory>" >&2
  exit 2
}

[[ $# -eq 3 ]] || usage
url_file="$1"
key_file="$2"
output_directory="$3"

[[ -f "$url_file" && -f "$key_file" ]] || usage
[[ ! -e "$output_directory" ]] || {
  echo "refusing to overwrite existing backup directory: $output_directory" >&2
  exit 1
}

supabase_url="$(< "$url_file")"
service_key="$(< "$key_file")"
page_size=1000

umask 077
mkdir -p "$output_directory/public" "$output_directory/auth" "$output_directory/storage"

curl --silent --show-error --fail \
  "$supabase_url/rest/v1/" \
  -H "apikey: $service_key" \
  -H "Authorization: Bearer $service_key" \
  -o "$output_directory/openapi.json"

jq -r '.definitions | keys[]' "$output_directory/openapi.json" | sort -u > "$output_directory/tables.txt"
printf 'table\trows\tpages\tresult\n' > "$output_directory/public-manifest.tsv"

table_total=0
table_failures=0
while IFS= read -r table_name; do
  table_directory="$output_directory/public/$table_name"
  mkdir -p "$table_directory"
  offset=0
  page=1
  row_total=0
  table_result=ok

  while true; do
    page_file="$table_directory/page-$(printf '%04d' "$page").json"
    status_code="$(curl --silent --show-error \
      --output "$page_file" \
      --write-out '%{http_code}' \
      "$supabase_url/rest/v1/$table_name?select=*" \
      -H "apikey: $service_key" \
      -H "Authorization: Bearer $service_key" \
      -H "Range: $offset-$((offset + page_size - 1))")"

    if [[ "$status_code" != 2?? ]] || ! jq -e 'type == "array"' "$page_file" >/dev/null; then
      table_result="http-$status_code"
      table_failures=$((table_failures + 1))
      break
    fi

    row_count="$(jq 'length' "$page_file")"
    row_total=$((row_total + row_count))
    if (( row_count < page_size )); then
      break
    fi

    offset=$((offset + page_size))
    page=$((page + 1))
  done

  printf '%s\t%s\t%s\t%s\n' "$table_name" "$row_total" "$page" "$table_result" >> "$output_directory/public-manifest.tsv"
  table_total=$((table_total + 1))
done < "$output_directory/tables.txt"

curl --silent --show-error --fail \
  "$supabase_url/auth/v1/admin/users?page=1&per_page=1000" \
  -H "apikey: $service_key" \
  -H "Authorization: Bearer $service_key" \
  -o "$output_directory/auth/users-page-0001.json"

curl --silent --show-error --fail \
  "$supabase_url/storage/v1/bucket" \
  -H "apikey: $service_key" \
  -H "Authorization: Bearer $service_key" \
  -o "$output_directory/storage/buckets.json"

public_rows="$(awk -F '\t' 'NR > 1 && $2 ~ /^[0-9]+$/ { total += $2 } END { print total + 0 }' "$output_directory/public-manifest.tsv")"
auth_users="$(jq '.users | length' "$output_directory/auth/users-page-0001.json")"
storage_buckets="$(jq 'length' "$output_directory/storage/buckets.json")"
generated_at="$(date -u +%FT%TZ)"

jq -n \
  --arg generated_at "$generated_at" \
  --arg supabase_url "$supabase_url" \
  --argjson public_tables "$table_total" \
  --argjson public_rows "$public_rows" \
  --argjson public_table_failures "$table_failures" \
  --argjson auth_users "$auth_users" \
  --argjson storage_buckets "$storage_buckets" \
  '{
    generated_at: $generated_at,
    source: $supabase_url,
    public_tables: $public_tables,
    public_rows: $public_rows,
    public_table_failures: $public_table_failures,
    auth_users: $auth_users,
    storage_buckets: $storage_buckets,
    format: "interim-rest-snapshot"
  }' > "$output_directory/metadata.json"

printf 'BACKUP_TABLES=%s BACKUP_ROWS=%s TABLE_FAILURES=%s AUTH_USERS=%s STORAGE_BUCKETS=%s\n' \
  "$table_total" "$public_rows" "$table_failures" "$auth_users" "$storage_buckets"
