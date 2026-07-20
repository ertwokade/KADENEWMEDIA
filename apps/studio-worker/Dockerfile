FROM node:22-bookworm-slim
WORKDIR /workspace
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg fontconfig curl && rm -rf /var/lib/apt/lists/* && corepack enable
COPY . .
RUN pnpm install --frozen-lockfile --filter @kade/studio-worker...
RUN pnpm --filter @kade/studio-worker build
CMD ["pnpm", "--filter", "@kade/studio-worker", "exec", "tsx", "src/index.ts"]
