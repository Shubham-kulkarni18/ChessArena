# ChessArena

A full-stack chess platform monorepo built with Next.js on the frontend, Fastify + TypeScript on the backend, PostgreSQL, Redis, WebSockets, and BullMQ for background processing.

## Tech stack

- Frontend: Next.js + React
- Backend: Node.js + TypeScript + Fastify
- Database: PostgreSQL
- Cache / realtime: Redis
- Realtime: WebSockets
- Background jobs: BullMQ
- Testing: Vitest, Supertest, Playwright
- Infrastructure: Docker, GitHub Actions

## Monorepo layout

```text
chessarena/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── modules/
│   │       ├── infrastructure/
│   │       ├── realtime/
│   │       ├── config/
│   │       ├── app.ts
│   │       └── server.ts
│   ├── web/
│   └── worker/
├── packages/
│   ├── chess-domain/
│   └── shared/
├── db/
│   └── migrations/
├── docs/
├── docker-compose.yml
├── package.json
├── tsconfig.base.json
├── .gitignore
├── .github/
└── README.md
```

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start supporting services:
   ```bash
   npm run docker:up
   ```
3. Start the API:
   ```bash
   npm run dev:api
   ```
4. Start the frontend:
   ```bash
   npm run dev:web
   ```

## Production-ready notes

- PostgreSQL and Redis are provided via Docker Compose.
- The API is built with Fastify and TypeScript.
- The frontend is built with Next.js and can be extended into a multiplayer chess experience.
- The shared packages are ready for domain logic and reusable utilities.
