#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "--preflight" ]]; then
  test -f /srv/kade/secrets/kadexai.env
  test -d "$(readlink -f /srv/kade/current)"
  docker info >/dev/null
  curl --fail --silent --show-error http://127.0.0.1:3000/kadexai/api/health >/dev/null
  echo "PREFLIGHT=ok"
  exit 0
fi

commit_sha="${1:-}"
if [[ ! "$commit_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: $0 FULL_GITHUB_COMMIT_SHA" >&2
  exit 2
fi

repository_url="https://github.com/ertwokade/KADENEWMEDIA.git"
base_directory="/srv/kade"
release_directory="$base_directory/releases/github-${commit_sha:0:12}-$(date -u +%Y%m%dT%H%M%SZ)"
staging_directory="$(mktemp -d "$base_directory/releases/.github-${commit_sha:0:12}-XXXXXX")"
current_link="$base_directory/current"
environment_file="$base_directory/secrets/kadexai.env"
previous_release="$(readlink -f "$current_link")"
compose_relative="apps/kadexai/deploy/keyubu"
rollback_tag="rollback-${commit_sha:0:12}"
deploy_started=0

[[ -f "$environment_file" ]] || {
  echo "Runtime environment file is missing." >&2
  exit 1
}
[[ -d "$previous_release" ]] || {
  echo "Current release link is invalid." >&2
  exit 1
}

cleanup_staging() {
  if [[ -d "$staging_directory" ]]; then
    rm -rf -- "$staging_directory"
  fi
}

switch_current() {
  local target="$1"
  rm -f -- "$base_directory/.current-next"
  ln -s "$target" "$base_directory/.current-next"
  mv -Tf "$base_directory/.current-next" "$current_link"
}

rollback() {
  local exit_code=$?
  trap - ERR
  set +e
  cleanup_staging
  if [[ "$deploy_started" -eq 1 ]]; then
    echo "Deployment failed; restoring previous release."
    docker image inspect "kade-production-web:$rollback_tag" >/dev/null 2>&1 \
      && docker tag "kade-production-web:$rollback_tag" kade-production-web:latest
    docker image inspect "kade-production-media:$rollback_tag" >/dev/null 2>&1 \
      && docker tag "kade-production-media:$rollback_tag" kade-production-media:latest
    switch_current "$previous_release"
    cd "$previous_release/$compose_relative"
    docker compose --env-file "$environment_file" up -d --force-recreate --wait --wait-timeout 240
  fi
  exit "$exit_code"
}
trap rollback ERR
trap cleanup_staging EXIT

git -C "$staging_directory" init --quiet
git -C "$staging_directory" remote add origin "$repository_url"
git -C "$staging_directory" fetch --quiet --depth=1 origin "$commit_sha"
git -C "$staging_directory" checkout --quiet --detach FETCH_HEAD

resolved_sha="$(git -C "$staging_directory" rev-parse HEAD)"
[[ "$resolved_sha" == "$commit_sha" ]] || {
  echo "Fetched commit does not match requested commit." >&2
  exit 1
}

for required_file in \
  package.json \
  package-lock.json \
  "$compose_relative/compose.yaml" \
  "$compose_relative/Dockerfile"; do
  [[ -f "$staging_directory/$required_file" ]] || {
    echo "Release is missing $required_file" >&2
    exit 1
  }
done

if docker image inspect kade-production-web:latest >/dev/null 2>&1; then
  docker tag kade-production-web:latest "kade-production-web:$rollback_tag"
fi
if docker image inspect kade-production-media:latest >/dev/null 2>&1; then
  docker tag kade-production-media:latest "kade-production-media:$rollback_tag"
fi

cd "$staging_directory/$compose_relative"
docker compose --env-file "$environment_file" config --quiet
docker compose --env-file "$environment_file" build web media

rm -rf -- "$release_directory"
mv "$staging_directory" "$release_directory"
staging_directory=""
switch_current "$release_directory"
deploy_started=1

cd "$release_directory/$compose_relative"
docker compose --env-file "$environment_file" up -d --wait --wait-timeout 240
curl --fail --silent --show-error \
  --retry 12 --retry-delay 5 --retry-all-errors \
  http://127.0.0.1:3000/kadexai/api/health >/dev/null

deploy_started=0
trap - ERR
docker image rm "kade-production-web:$rollback_tag" >/dev/null 2>&1 || true
docker image rm "kade-production-media:$rollback_tag" >/dev/null 2>&1 || true

mapfile -t old_releases < <(
  find "$base_directory/releases" -maxdepth 1 -mindepth 1 -type d \
    -name 'github-*' -printf '%T@ %p\n' | sort -rn | tail -n +6 | cut -d' ' -f2-
)
for old_release in "${old_releases[@]}"; do
  case "$old_release" in
    /srv/kade/releases/github-*) rm -rf -- "$old_release" ;;
  esac
done

printf 'DEPLOYMENT=ok COMMIT=%s RELEASE=%s\n' "$commit_sha" "$release_directory"
