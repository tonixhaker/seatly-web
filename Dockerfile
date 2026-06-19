FROM node:22.23.2-alpine AS builder

ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_REALTIME_BASE_URL=http://localhost:3000

RUN npm install -g pnpm@10.29.3

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM nginx:1.31.5-alpine

RUN rm /etc/nginx/conf.d/default.conf /usr/share/nginx/html/index.html /usr/share/nginx/html/50x.html

COPY docker/nginx.conf /etc/nginx/nginx.conf

COPY --from=builder /app/dist /usr/share/nginx/html

USER nginx

EXPOSE 5173

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -fsS http://127.0.0.1:5173/health || exit 1
