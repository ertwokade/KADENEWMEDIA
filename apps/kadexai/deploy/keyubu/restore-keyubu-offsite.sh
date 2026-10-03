#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  echo "usage: $0 <supabase-url-file> <service-role-key-file> <snapshot|latest> <output-directory> [private-key]" >&2
  exit 2
}

[[ $# -ge 4 && $# -le 5 ]] || usage
url_file="$1"
key_file="$2"
requested_snapshot="$3"
output_directory="$4"
private_key="${5:-$HOME/.config/kade-backup/offsite-recovery-private.pem}"
bucket_name="keyubu-disaster-recovery"

[[ -r "$url_file" && -r "$key_file" && -r "$private_key" ]] || usage
[[ ! -e "$output_directory" ]] || { echo "output directory already exists" >&2; exit 1; }

supabase_url="$(< "$url_file")"
supabase_url="${supabase_url%/}"
service_key="$(< "$key_file")"
auth_headers=(-H "apikey: $service_key" -H "Authorization: Bearer $service_key")
mkdir -m 700 "$output_directory"
work_directory="$output_directory/.download"
mkdir -m 700 "$work_directory"

download_object() {
  local object_name="$1" output_path="$2"
  curl --silent --show-error --fail \
    "${auth_headers[@]}" \
    "$supabase_url/storage/v1/object/authenticated/$bucket_name/$object_name" \
    -o "$output_path"
}

if [[ "$requested_snapshot" == "latest" ]]; then
  download_object LATEST.json "$work_directory/latest.json"
  snapshot="$(jq -er '.snapshot' "$work_directory/latest.json")"
else
  snapshot="$requested_snapshot"
fi
[[ "$snapshot" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] || { echo "invalid snapshot id" >&2; exit 1; }

download_object "snapshots/$snapshot-manifest.json" "$work_directory/manifest.json"
jq -e --arg snapshot "$snapshot" '.version == 1 and .snapshot == $snapshot and (.objects | length > 0)' \
  "$work_directory/manifest.json" >/dev/null

while IFS=$'\t' read -r local_name expected_bytes expected_sha; do
  download_object "snapshots/$snapshot-$local_name" "$work_directory/$local_name"
  [[ "$(wc -c < "$work_directory/$local_name" | tr -d ' ')" == "$expected_bytes" ]]
  printf '%s  %s\n' "$expected_sha" "$work_directory/$local_name" | sha256sum --check --status
done < <(jq -r '.objects[] | [.local_name, (.bytes|tostring), .sha256] | @tsv' "$work_directory/manifest.json")

openssl pkeyutl -decrypt -inkey "$private_key" \
  -pkeyopt rsa_padding_mode:oaep \
  -pkeyopt rsa_oaep_md:sha256 \
  -in "$work_directory/recovery-key.enc" \
  -out "$work_directory/recovery-key.txt"
export KADE_BACKUP_ENCRYPTION_KEY="$(< "$work_directory/recovery-key.txt")"

for logical_name in database media secrets redis; do
  mapfile -t parts < <(jq -r --arg name "$logical_name" '.objects[] | select(.logical_name == $name) | .local_name' "$work_directory/manifest.json" | sort)
  if [[ ${#parts[@]} -eq 0 ]]; then
    continue
  fi
  archive="$work_directory/$logical_name.tar.gz.enc"
  : > "$archive"
  for part in "${parts[@]}"; do cat "$work_directory/$part" >> "$archive"; done
  mkdir -p "$output_directory/$logical_name"
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 \
    -pass env:KADE_BACKUP_ENCRYPTION_KEY \
    -in "$archive" |
    tar -xzf - -C "$output_directory/$logical_name"
done

rm -f "$work_directory/recovery-key.txt"
printf 'OFFSITE_RESTORE=ok SNAPSHOT=%s OUTPUT=%s\n' "$snapshot" "$output_directory"
