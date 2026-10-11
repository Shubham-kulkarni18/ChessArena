import { FastifyInstance } from "fastify";

const players = [
  {
    id: 1,
    username: "alice",
    rating: 1200
  },
  {
    id: 2,
    username: "bob",
    rating: 1450
  },
  {
    id: 3,
    username: "charlie",
    rating: 1600
  }
];

export default async function playerRoutes(
  app: FastifyInstance
) {
  app.get("/api/players", async () => {
    return players;
  }
);


app.get("/api/players/:id", async (request, reply) => {
  const { id } = request.params as { id: string };

  const playerId = Number(id);

  // Step 1: Validate the ID
  if (!Number.isInteger(playerId) || playerId < 1) {
    return reply.code(400).send({
      message: "Player ID must be a positive integer"
    });
  }

  // Step 2: Find the player
  const player = players.find((p) => p.id === playerId);

  // Step 3: Handle a player that doesn't exist
  if (!player) {
    return reply.code(404).send({
      message: "Player not found"
    });
  }

  // Step 4: Return the player
  return player;
});


app.post("/api/players", async (request, reply) => {
  const body = request.body as {
    username?: unknown;
    rating?: unknown;
  };

  // 1. Validate the username
  if (
    typeof body?.username !== "string" ||
    body.username.trim().length === 0 ||
    body.username.trim().length > 20
  ) {
    return reply.code(400).send({
      message: "Username must contain 1 to 20 characters"
    });
  }

  // 2. Validate the rating
  if (
    typeof body.rating !== "number" ||
    !Number.isInteger(body.rating) ||
    body.rating < 0
  ) {
    return reply.code(400).send({
      message: "Rating must be a non-negative integer"
    });
  }

  // 3. Create the new player
  const newPlayer = {
    id: Math.max(0, ...players.map((p) => p.id)) + 1,
    username: body.username.trim(),
    rating: body.rating
  };

  // 4. Add the player to the array
  players.push(newPlayer);

  // 5. Return the created player
  return reply.code(201).send(newPlayer);
});


}           