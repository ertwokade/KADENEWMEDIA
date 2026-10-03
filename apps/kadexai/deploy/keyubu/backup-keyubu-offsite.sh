#!/usr/bin/env bash
set -Eeuo pipefail

# Keyubu tamamen kaybolsa bile geri yüklenebilecek bir afet kurtarma paketi
# üretir ve eski yönetilen Supabase projesindeki private Storage bucket'ına
# yollar. Hiçbir sır açık biçimde sunucu dışına çıkmaz.

bucket_name="keyubu-disaster-recovery"
chunk_size="40M"
retention_days=30
secrets_directory="/srv/kade/secrets"
current_env="$secrets_directory/kadexai.env"
public_key="/srv/kade/config/offsite-backup-public.pem"
backup_log="/srv/kade/logs/backup.log"
work_directory="$(mktemp -d /srv/kade/backups/.offsite-work-XXXXXX)"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"

cleanup() {
  rm -rf -- "$work_directory"
}
trap cleanup EXIT

exec 9>/run/lock/kade-offsite-backup.lock
if ! flock -n 9; then
  printf '%s backup=keyubu-offsite result=skipped reason=already-running\n' "$(date -u +%FT%TZ)" >> "$backup_log"
  exit 0
fi

umask 077
mkdir -p /srv/kade/backups /srv/kade/logs

read_env() {
  local file="$1" name="$2" value
  value="$(grep -m1 "^${name}=" "$file" 2>/dev/null | cut -d= -f2- || true)"
  value="${value#\"}"
  value="${value%\"}"
  value="${value#\'}"
  value="${value%\'}"
  printf '%s' "$value"
}

[[ -r "$current_env" ]] || { echo "runtime environment is missing" >&2; exit 1; }
[[ -r "$public_key" ]] || { echo "offsite recovery public key is missing" >&2; exit 1; }
openssl pkey -pubin -in "$public_key" -noout >/dev/null

export KADE_BACKUP_ENCRYPTION_KEY="$(read_env "$current_env" KADE_TOKEN_ENCRYPTION_KEY)"
[[ -n "$KADE_BACKUP_ENCRYPTION_KEY" ]] || { echo "backup encryption key is missing" >&2; exit 1; }

# Self-hosted geçişinden önceki son ortam dosyası yönetilen Supabase hedefinin
# URL ve service-role anahtarını taşır. Değerler hiçbir zaman loglanmaz.
managed_env=""
while IFS= read -r candidate; do
  candidate_url="$(read_env "$candidate" NEXT_PUBLIC_SUPABASE_URL)"
  [[ -n "$candidate_url" ]] || candidate_url="$(read_env "$candidate" SUPABASE_URL)"
  candidate_key="$(read_env "$candidate" SUPABASE_SERVICE_ROLE_KEY)"
  if [[ "$candidate_url" =~ ^https://[a-z0-9-]+\.supabase\.co/?$ && ${#candidate_key} -ge 32 ]]; then
    managed_env="$candidate"
    managed_url="${candidate_url%/}"
    managed_service_key="$candidate_key"
    break
  fi
done < <(find "$secrets_directory" -maxdepth 1 -type f -name 'kadexai.env.before-selfhosted-*' -printf '%T@ %p\n' | sort -rn | cut -d' ' -f2-)

[[ -n "$managed_env" ]] || {
  echo "managed Supabase recovery credentials were not found" >&2
  exit 1
}

auth_headers=(
  -H "apikey: $managed_service_key"
  -H "Authorization: Bearer $managed_service_key"
)

bucket_list="$work_directory/buckets.json"
curl --silent --show-error --fail \
  "${auth_headers[@]}" \
  "$managed_url/storage/v1/bucket" \
  -o "$bucket_list"

if ! jq -e --arg id "$bucket_name" 'any(.[]; .id == $id)' "$bucket_list" >/dev/null; then
  jq -n --arg id "$bucket_name" '{id:$id,name:$id,public:false}' > "$work_directory/create-bucket.json"
  curl --silent --show-error --fail \
    -X POST "${auth_headers[@]}" \
    -H 'Content-Type: application/json' \
    --data-binary "@$work_directory/create-bucket.json" \
    "$managed_url/storage/v1/bucket" >/dev/null
fi

# Her çalışmada taze ve kendi içinde doğrulanmış bir PostgreSQL yedeği üret.
/srv/kade/bin/backup-selfhosted-supabase
database_archive="$(find /srv/kade/backups/selfhosted-supabase -maxdepth 1 -type f -name 'supabase-*.tar.gz.enc' -printf '%T@ %p\n' | sort -rn | head -n1 | cut -d' ' -f2-)"
[[ -n "$database_archive" && -s "$database_archive" ]] || { echo "database backup was not created" >&2; exit 1; }
sha256sum --check "$database_archive.sha256" >/dev/null

encrypt_directory() {
  local logical_name="$1"
  local source_path="$2"
  local output_path="$work_directory/$logical_name.tar.gz.enc"
  if [[ ! -d "$source_path" ]]; then
    return 0
  fi
  tar --numeric-owner -C "$(dirname "$source_path")" -czf - "$(basename "$source_path")" |
    openssl enc -aes-256-cbc -salt -pbkdf2 -iter 250000 \
      -pass env:KADE_BACKUP_ENCRYPTION_KEY \
      -out "$output_path"
  [[ -s "$output_path" ]]
}

encrypt_directory media /srv/kade/media
encrypt_directory secrets /srv/kade/secrets

# Redis ana veri kaynağı değil (kalıcı iş durumları PostgreSQL'de) fakat kuyruk
# durumunu da mümkün olduğunca koru. SAVE ile tutarlı tek dosya üretildikten
# sonra yalnız dump kopyalanır; canlı AOF dosyasını tararken yarış oluşmaz.
redis_container="$(docker ps -q \
  --filter 'label=com.docker.compose.project=kade-production' \
  --filter 'label=com.docker.compose.service=redis' | head -n1)"
if [[ -n "$redis_container" ]]; then
  docker exec "$redis_container" redis-cli SAVE >/dev/null
  docker cp "$redis_container:/data/dump.rdb" "$work_directory/redis.rdb" >/dev/null
  tar -C "$work_directory" -czf - redis.rdb |
    openssl enc -aes-256-cbc -salt -pbkdf2 -iter 250000 \
      -pass env:KADE_BACKUP_ENCRYPTION_KEY \
      -out "$work_directory/redis.tar.gz.enc"
fi

# Sunucudaki simetrik anahtar da yalnız kurtarma public key'iyle açılabilecek
# biçimde pakete eklenir. Private key Keyubu'da bulunmaz.
printf '%s' "$KADE_BACKUP_ENCRYPTION_KEY" |
  openssl pkeyutl -encrypt -pubin -inkey "$public_key" \
    -pkeyopt rsa_padding_mode:oaep \
    -pkeyopt rsa_oaep_md:sha256 \
    -out "$work_directory/recovery-key.enc"

printf 'logical_name\tlocal_name\tbytes\tsha256\n' > "$work_directory/objects.tsv"

chunk_archive() {
  local logical_name="$1"
  local archive_path="$2"
  local part_prefix="$work_directory/${logical_name}.part"
  split -b "$chunk_size" -d -a 4 "$archive_path" "$part_prefix"
  local part
  for part in "$part_prefix"*; do
    printf '%s\t%s\t%s\t%s\n' \
      "$logical_name" "$(basename "$part")" "$(wc -c < "$part" | tr -d ' ')" "$(sha256sum "$part" | cut -d' ' -f1)" \
      >> "$work_directory/objects.tsv"
  done
}

chunk_archive database "$database_archive"
[[ ! -s "$work_directory/media.tar.gz.enc" ]] || chunk_archive media "$work_directory/media.tar.gz.enc"
[[ ! -s "$work_directory/secrets.tar.gz.enc" ]] || chunk_archive secrets "$work_directory/secrets.tar.gz.enc"
[[ ! -s "$work_directory/redis.tar.gz.enc" ]] || chunk_archive redis "$work_directory/redis.tar.gz.enc"
printf '%s\t%s\t%s\t%s\n' \
  recovery-key recovery-key.enc "$(wc -c < "$work_directory/recovery-key.enc" | tr -d ' ')" \
  "$(sha256sum "$work_directory/recovery-key.enc" | cut -d' ' -f1)" >> "$work_directory/objects.tsv"

jq -Rn \
  --arg created_at "$(date -u +%FT%TZ)" \
  --arg snapshot "$stamp" \
  --arg bucket "$bucket_name" \
  --arg source "keyubu" \
  --arg key_fingerprint "$(openssl pkey -pubin -in "$public_key" -outform DER | sha256sum | cut -d' ' -f1)" \
  '[inputs | split("\t") | select(.[0] != "logical_name") | {logical_name:.[0], local_name:.[1], bytes:(.[2]|tonumber), sha256:.[3]}] |
   {version:1, created_at:$created_at, snapshot:$snapshot, bucket:$bucket, source:$source,
    encryption:"aes-256-cbc-pbkdf2-250000+rsa-oaep-sha256", recovery_key_fingerprint:$key_fingerprint, objects:.}' \
  < "$work_directory/objects.tsv" > "$work_directory/manifest.json"

upload_object() {
  local local_path="$1" object_name="$2"
  curl --silent --show-error --fail \
    -X POST "${auth_headers[@]}" \
    -H 'Content-Type: application/octet-stream' \
    -H 'x-upsert: true' \
    --data-binary "@$local_path" \
    "$managed_url/storage/v1/object/$bucket_name/$object_name" >/dev/null
}

while IFS=$'\t' read -r logical_name local_name bytes checksum; do
  [[ "$logical_name" != "logical_name" ]] || continue
  upload_object "$work_directory/$local_name" "snapshots/$stamp-$local_name"
done < "$work_directory/objects.tsv"

# Manifest en son yüklenir; varlığı snapshot'ın tamamlandığı anlamına gelir.
upload_object "$work_directory/manifest.json" "snapshots/$stamp-manifest.json"
jq -n --arg snapshot "$stamp" --arg manifest "snapshots/$stamp-manifest.json" \
  '{snapshot:$snapshot,manifest:$manifest,completed_at:(now|todateiso8601)}' > "$work_directory/latest.json"
upload_object "$work_directory/latest.json" LATEST.json

# Uzak manifest geri indirilip byte-byte karşılaştırılır.
curl --silent --show-error --fail \
  "${auth_headers[@]}" \
  "$managed_url/storage/v1/object/authenticated/$bucket_name/snapshots/$stamp-manifest.json" \
  -o "$work_directory/remote-manifest.json"
cmp "$work_directory/manifest.json" "$work_directory/remote-manifest.json"

# 30 günden eski snapshot nesnelerini best-effort temizle. Yeni yedeğin
# doğrulanması bu adımdan önce tamamlandığı için retention hatası veri kaybına
# dönüşmez.
threshold="$(date -u -d "$retention_days days ago" +%Y%m%dT%H%M%SZ)"
jq -n '{prefix:"snapshots",limit:1000,offset:0,sortBy:{column:"name",order:"asc"}}' > "$work_directory/list.json"
if curl --silent --show-error --fail \
  -X POST "${auth_headers[@]}" -H 'Content-Type: application/json' \
  --data-binary "@$work_directory/list.json" \
  "$managed_url/storage/v1/object/list/$bucket_name" -o "$work_directory/object-list.json"; then
  jq --arg threshold "$threshold" \
    '[.[] | .name | select(test("^[0-9]{8}T[0-9]{6}Z-") and .[0:16] < $threshold) | "snapshots/" + .]' \
    "$work_directory/object-list.json" > "$work_directory/delete.json"
  if [[ "$(jq 'length' "$work_directory/delete.json")" -gt 0 ]]; then
    jq '{prefixes:.}' "$work_directory/delete.json" > "$work_directory/delete-request.json"
    curl --silent --show-error --fail \
      -X DELETE "${auth_headers[@]}" -H 'Content-Type: application/json' \
      --data-binary "@$work_directory/delete-request.json" \
      "$managed_url/storage/v1/object/$bucket_name" >/dev/null || true
  fi
fi

object_count="$(jq '.objects | length' "$work_directory/manifest.json")"
total_bytes="$(jq '[.objects[].bytes] | add // 0' "$work_directory/manifest.json")"
printf '%s backup=keyubu-offsite result=ok snapshot=%s objects=%s bytes=%s\n' \
  "$(date -u +%FT%TZ)" "$stamp" "$object_count" "$total_bytes" >> "$backup_log"
printf 'OFFSITE_BACKUP=ok SNAPSHOT=%s OBJECTS=%s BYTES=%s BUCKET=%s\n' \
  "$stamp" "$object_count" "$total_bytes" "$bucket_name"
