FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.0

# Copy root configuration and dependency files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend

# Install dependencies and build backend
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @betterme/backend build

FROM node:18-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm@8.15.0

COPY --from=builder /app ./

ENV NODE_ENV=production
ENV PORT=10000

EXPOSE 10000

CMD ["pnpm", "--filter", "@betterme/backend", "start"]
