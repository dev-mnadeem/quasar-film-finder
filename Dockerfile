# syntax=docker/dockerfile:1

# ---------- build ----------
# Vite inlines VITE_* values at build time, so the catalogue source is chosen here
# and not at container start. Override with:
#   docker compose build --build-arg VITE_MOVIES_PROVIDER=jsonmock
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_MOVIES_PROVIDER=fixture
ARG VITE_AI_QUERY_ENDPOINT=""
ENV VITE_MOVIES_PROVIDER=$VITE_MOVIES_PROVIDER
ENV VITE_AI_QUERY_ENDPOINT=$VITE_AI_QUERY_ENDPOINT

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build-only

# ---------- serve ----------
# nginx-unprivileged runs as UID 101 and listens on 8080: no root in the final image.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:8080/ || exit 1
