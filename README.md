# ChessArena ♟️

A full-stack, real-time multiplayer chess platform built to explore backend engineering, database design, authentication, and real-time communication.

ChessArena aims to let players create game rooms, invite opponents, play chess, and eventually track match histories and ratings.

> **Development status:** Backend development is in progress. User authentication and game-room management are implemented. Legal chess moves, real-time gameplay, and the frontend are planned or under development.

## Table of Contents

- [Overview](#overview)
- [Current Features](#current-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Development Roadmap](#development-roadmap)
- [Contributing](#contributing)

## Overview

ChessArena is a learning-oriented full-stack project designed to build practical software engineering skills through a real application.

The project focuses on:

- REST API development with TypeScript and Fastify.
- User registration, password hashing, and JWT authentication.
- Relational database design with PostgreSQL.
- Game-room creation and joining.
- Automated testing and API validation.
- Future real-time communication, chess-rule validation, and deployment.

The goal is to develop the application incrementally, following practices used in production backend systems.

## Current Features

### Implemented

- **User registration:** Create an account using an email address and password.
- **User login:** Authenticate users and issue JWT access tokens.
- **Password security:** Hash passwords before storing them in the database.
- **Protected endpoints:** Verify JWTs before allowing access to authenticated routes.
- **Player API:** Existing player CRUD functionality backed by PostgreSQL.
- **Game-room creation:** Authenticated users can create a room with a unique room code.
- **Game-room joining:** A second user can join a waiting room.
- **Game-room validation:** Prevent invalid room codes, joining your own room, and joining a room that is no longer waiting.
- **Automated tests:** API tests cover authentication and game-room behavior.

### Planned

- Legal chess-move validation using `chess.js`.
- Persistent chessboard state and move history.
- Turn management, checkmate, stalemate, and draw detection.
- Real-time gameplay using WebSockets.
- Frontend chessboard and game interface.
- Redis integration for suitable caching or real-time features.
- Background jobs using BullMQ, if needed.
- Match history, player ratings, and deployment.

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| TypeScript | Type-safe application development |
| Fastify | Backend HTTP framework |
| PostgreSQL | Persistent relational database |
| JWT | Authentication |
| bcrypt | Password hashing |
| `chess.js` | Chess rules and legal-move validation |
| Vitest | Automated testing |
| Docker Compose | Local development services |
| Redis | Planned caching and real-time support |
| Next.js and React | Planned frontend |
| WebSockets | Planned real-time gameplay |
| BullMQ | Planned background job processing |

Some technologies are part of the longer-term plan and may not yet be integrated into the running application.

## Architecture

ChessArena is organized as a monorepo so the backend, frontend, shared code, and supporting services can evolve together.

```text
Client (planned Next.js/React frontend)
                  |
                  | HTTP requests / future WebSocket connection
                  v
          Fastify API Server
                  |
          +-------+-------+
          |       |       |
          v       v       v
     PostgreSQL  JWT   Chess Logic
                         (planned/
                         in progress)

      Redis and background workers
             (planned)
```

### Components

**Client**

The frontend will display the chessboard, handle player interactions, and communicate with the API. It will not connect directly to PostgreSQL.

**API server**

The Fastify server handles incoming requests, validates input, authenticates users, applies application rules, and interacts with the database.

**PostgreSQL**

Stores user accounts, player information, and game-room records. Persistent chess positions and move history will be added as the chess gameplay implementation progresses.

**Chess engine**

`chess.js` will be used to validate moves and determine game outcomes rather than relying on custom, error-prone implementations of chess rules.

**Redis and background workers**

These are planned for future requirements where caching, real-time coordination, or asynchronous processing is useful.

## Project Structure

The current repository includes the API application, database migrations, Docker Compose configuration, and root-level project configuration.

```text
chessarena/
├── apps/
│   └── api/
│       └── src/
│           ├── config/
│           ├── infrastructure/
│           ├── middleware/
│           ├── routes/
│           ├── types/
│           ├── app.ts
│           └── server.ts
├── db/
│   └── migrations/
├── docker-compose.yml
├── package.json
├── package-lock.json
├── tsconfig.base.json
├── .gitignore
└── README.md
```

The frontend, worker application, shared packages, and domain packages can be added as development progresses. The structure above describes the current project rather than assuming every planned directory already exists.

## Getting Started

### Prerequisites

Install the following:

- Node.js and npm.
- Docker and Docker Compose.
- Git.

PostgreSQL and Redis are configured as local supporting services in Docker Compose.

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd chessarena
```

Replace `<your-repository-url>` with your actual Git repository URL.

### 2. Install dependencies

From the repository root:

```bash
npm install
```

### 3. Configure environment variables

Create or update the API environment file:

```text
apps/api/.env
```

Use the variable names expected by the API configuration. At minimum, configure the database connection and JWT signing secret.

Example template:

```dotenv
DATABASE_URL=postgresql://postgres:<password>@localhost:5433/chessarena
JWT_SECRET=<your-long-random-secret>
```

Replace the placeholders with values matching your local Docker configuration.

**Important:** Never commit `.env` files, passwords, JWT secrets, or access tokens. Keep local credentials private and use separate secrets in production.

### 4. Start supporting services

From the repository root:

```bash
docker compose up -d
```

Check the running containers:

```bash
docker compose ps
```

The current local configuration uses PostgreSQL on port `5433` and Redis on port `6380`. If your `docker-compose.yml` changes, use the ports defined there.

### 5. Apply database migrations

The project currently uses SQL migration files in `db/migrations/`.

Apply migrations in order, checking which ones have already been applied. For example, if migration `003_create_games.sql` has not yet been applied:

```bash
docker exec -i chessarena-postgres \
  psql -U postgres -d chessarena \
  < db/migrations/003_create_games.sql
```

Use `sudo docker` if your system requires elevated Docker permissions.

Do not blindly rerun migrations or assume the database is empty. Check the existing schema first. A migration-tracking mechanism will make this process more reliable as the project grows.

### 6. Start the API

Open a terminal:

```bash
cd apps/api
npm run dev
```

The exact available scripts can be checked in `apps/api/package.json`.

The API's local address and port depend on the server configuration. The health endpoint is available at:

```text
GET /health
```

### 7. Run the tests

From the API directory:

```bash
cd apps/api
npm test
```

Run the TypeScript compiler check as well:

```bash
npx tsc --noEmit -p tsconfig.json
```

Run these checks before committing changes.

## Environment Variables

Keep configuration in environment variables rather than hardcoding secrets into source files.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |

The API may use additional environment variables depending on its current configuration. Check `apps/api/src/config/index.ts` and `docker-compose.yml` for the complete, authoritative list.

Use strong, randomly generated secrets for local development and separate credentials for production.

## Database Migrations

Database schema changes are stored in `db/migrations/`.

Current migration files include:

- `001_create_players.sql` — creates the players table.
- `002_create_users.sql` — creates the users table.
- `003_create_games.sql` — creates game-room records and player relationships.

Additional migrations will introduce persistent chess state and move history.

**Migration rules:**

1. Never modify an already-applied migration to change an existing database schema.
2. Create a new migration for each subsequent schema change.
3. Verify the database schema after applying a migration.
4. Keep database credentials out of migration files.
5. Avoid destructive database commands unless the consequences are understood.

## API Endpoints

The API is versioned by route prefix where appropriate. The current authentication and game-room endpoints are listed below.

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a user |
| `POST` | `/api/auth/login` | No | Log in and receive a JWT |
| `GET` | `/api/auth/me` | Yes | Get the authenticated user's identity |
| `POST` | `/api/games` | Yes | Create a game room |
| `POST` | `/api/games/:roomCode/join` | Yes | Join a waiting room |
| `GET` | `/api/games/:roomCode` | Yes | Retrieve game-room information |

The API also includes player CRUD endpoints.

### Authentication

Protected endpoints expect a bearer token in the `Authorization` header:

```http
Authorization: Bearer <your-access-token>
```

The token is obtained from the login endpoint. Do not publish real access tokens in documentation, issue trackers, screenshots, or commits.

### Example: Create a game room

```http
POST /api/games
Authorization: Bearer <your-access-token>
```

A successful request returns a newly created room, including its room code and initial status.

### Example: Join a game room

```http
POST /api/games/<room-code>/join
Authorization: Bearer <your-access-token>
```

A successful join assigns the second player and changes the room status to active.

Exact response fields and error formats should be verified against the current route implementation.

## Testing

The API uses Vitest for automated tests.

Run tests from `apps/api`:

```bash
npm test
```

Check TypeScript:

```bash
npx tsc --noEmit -p tsconfig.json
```

Tests should cover successful requests, authentication failures, invalid input, database behavior, and conflicts such as attempting to join a room that is already active.

Before pushing changes, make sure tests pass and review the staged Git diff.

## Development Roadmap

- [x] Set up the initial backend and project structure.
- [x] Implement player CRUD functionality with PostgreSQL.
- [x] Add request validation.
- [x] Implement user registration and login.
- [x] Add JWT authentication and protected routes.
- [x] Create and join multiplayer game rooms.
- [ ] Persist chessboard state and move history.
- [ ] Validate legal chess moves and enforce turns.
- [ ] Add real-time gameplay.
- [ ] Build the frontend chessboard.
- [ ] Add match history and ratings.
- [ ] Add deployment and production monitoring.

This checklist reflects the current development plan and should be updated as features are completed.

## Contributing

ChessArena is being developed incrementally as a backend-learning project.

When contributing:

1. Keep changes focused on one feature.
2. Add tests for new behavior.
3. Validate database changes with migrations.
4. Never commit secrets or local environment files.
5. Run tests and TypeScript checks before pushing.
6. Update this README when the project's setup, architecture, or supported features change.

---

**ChessArena** is a work in progress, with the goal of combining practical backend engineering with a complete multiplayer chess experience.
