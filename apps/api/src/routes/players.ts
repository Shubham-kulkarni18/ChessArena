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



app.post(
  "/api/players",
  {
    schema: {
      body: {
        type: "object",
        required: ["username", "rating"],
        additionalProperties: false,
        properties: {
          username: {
            type: "string",
            minLength: 1,
            maxLength: 20,
            pattern: ".*\\S.*"
          },
          rating: {
            type: "integer",
            minimum: 0
          }
        }
      }
    }
  },
  async (request, reply) => {
    const body = request.body as {
      username: string;
      rating: number;
    };

    const newPlayer = {
      id: Math.max(0, ...players.map((p) => p.id)) + 1,
      username: body.username.trim(),
      rating: body.rating
    };

    players.push(newPlayer);

    return reply.code(201).send(newPlayer);
  }
);



app.put("/api/players/:id", async (request, reply) => {
  // 1. Read the player ID from the URL
  const { id } = request.params as { id: string };
  const playerId = Number(id);

  // 2. Validate the ID
  if (!Number.isInteger(playerId) || playerId < 1) {
    return reply.code(400).send({
      message: "Player ID must be a positive integer"
    });
  }

  // 3. Find the existing player
  const player = players.find((p) => p.id === playerId);

  if (!player) {
    return reply.code(404).send({
      message: "Player not found"
    });
  }

  // 4. Read the request body
  const body = request.body as {
    username?: unknown;
    rating?: unknown;
  };

  // 5. Validate the username
  if (
    typeof body?.username !== "string" ||
    body.username.trim().length === 0 ||
    body.username.trim().length > 20
  ) {
    return reply.code(400).send({
      message: "Username must contain 1 to 20 characters"
    });
  }

  // 6. Validate the rating
  if (
    typeof body.rating !== "number" ||
    !Number.isInteger(body.rating) ||
    body.rating < 0
  ) {
    return reply.code(400).send({
      message: "Rating must be a non-negative integer"
    });
  }

  // 7. Update the player
  player.username = body.username.trim();
  player.rating = body.rating;

  // 8. Return the updated player
  return player;
});


app.delete("/api/players/:id", async (request, reply) => {
  // 1. Read the ID from the URL
  const { id } = request.params as { id: string };
  const playerId = Number(id);

  // 2. Validate the ID
  if (!Number.isInteger(playerId) || playerId < 1) {
    return reply.code(400).send({
      message: "Player ID must be a positive integer"
    });
  }

  // 3. Find the player's position in the array
  const playerIndex = players.findIndex(
    (p) => p.id === playerId
  );

  // 4. Check whether the player exists
  if (playerIndex === -1) {
    return reply.code(404).send({
      message: "Player not found"
    });
  }

  // 5. Remove the player
  players.splice(playerIndex, 1);

  // 6. Confirm successful deletion
  return reply.code(200).send({
    message: "Player deleted successfully"
  });
});


}           