FROM node:22-bookworm-slim AS build
WORKDIR /workspace
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile --filter @kade/studio-web...
RUN pnpm --filter @kade/studio-web exec next build
EXPOSE 3000
CMD ["pnpm", "--filter", "@kade/studio-web", "exec", "next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
