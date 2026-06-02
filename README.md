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

## Status

Work in progress. Not runnable yet.

## License

MIT
