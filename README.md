# seatly-web

Storefront and organizer admin for Seatly, an event ticketing platform with real-time
seat selection.

Catalog, event page with a live seat map, checkout and tickets; on the organizer side,
event management, a sales dashboard and ticket check-in.

## Stack

- React 19, Vite, TypeScript
- TanStack Query for server state, Zustand for client state
- `openapi-fetch` for both backends
- `react-hook-form` with zod

## API client

Generated from the `seatly-api` OpenAPI spec by `openapi-typescript`. Run `pnpm gen:api`
to regenerate; the output is committed and not hand-edited.

## Running it

Needs Node 22, pnpm, and both backends running —
[seatly-api](https://github.com/tonixhaker/seatly-api) on 8000 and
[seatly-realtime](https://github.com/tonixhaker/seatly-realtime) on 3000.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Serves on `http://localhost:5173`.

### With Docker

```bash
docker build -t seatly-web .
docker run -d -p 5173:5173 seatly-web
```

The image builds from this repository alone, serves the built bundle from nginx as the
unprivileged `nginx` user, and carries no sources, no `node_modules` and no build
toolchain. `GET /health` returns 200 and checks nothing — a static server is ready when it
is running, and this container talks to no backend.

Both backend URLs are **baked into the bundle at build time**, because a browser has no
runtime environment. They arrive as build arguments and default to the `.env.example`
values:

| Build argument | Default | Baked into |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | `import.meta.env.VITE_API_BASE_URL` |
| `VITE_REALTIME_BASE_URL` | `http://localhost:3000` | `import.meta.env.VITE_REALTIME_BASE_URL` |

```bash
docker build -t seatly-web \
  --build-arg VITE_API_BASE_URL=https://api.example.com \
  --build-arg VITE_REALTIME_BASE_URL=https://realtime.example.com .
```

These URLs are resolved by the browser, not by the container, so they must be addresses a
browser can reach — the published host ports, never internal container hostnames. Changing
one means rebuilding the image, not restarting it.

## Status

Work in progress. The application builds, serves from nginx in its own container and
answers `/health`; routing, pages and state are not implemented yet.

## License

MIT
