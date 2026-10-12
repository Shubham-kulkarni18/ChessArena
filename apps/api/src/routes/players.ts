import { FastifyInstance } from "fastify";
import { pool } from "../infrastructure/database.js";
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
 
app.get("/api/players", async (request, reply) => {
  try {
    const result = await pool.query(
      "SELECT id, username, rating, created_at FROM players ORDER BY id ASC"
    );

    return result.rows;
  } catch (error) {
    request.log.error(error, "Failed to fetch players");

    return reply.code(500).send({
      message: "Failed to fetch players"
    });
  }
});





app.get("/api/players/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const playerId = Number(id);

  if (!Number.isInteger(playerId) || playerId < 1) {
    return reply.code(400).send({
      message: "Player ID must be a positive integer"
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, rating, created_at
       FROM players
       WHERE id = $1`,
      [playerId]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({
        message: "Player not found"
      });
    }

    return result.rows[0];
  } catch (error) {
    request.log.error(error, "Failed to fetch player");

    return reply.code(500).send({
      message: "Failed to fetch player"
    });
  }
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

    try {
      const result = await pool.query(
        `INSERT INTO players (username, rating)
         VALUES ($1, $2)
         RETURNING id, username, rating, created_at`,
        [body.username.trim(), body.rating]
      );

      return reply.code(201).send(result.rows[0]);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        return reply.code(409).send({
          message: "Username already exists"
        });
      }

      request.log.error(error, "Failed to create player");

      return reply.code(500).send({
        message: "Failed to create player"
      });
    }
  }
);




app.put("/api/players/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const playerId = Number(id);

  if (!Number.isInteger(playerId) || playerId < 1) {
    return reply.code(400).send({
      message: "Player ID must be a positive integer"
    });
  }

  const body = request.body as {
    username?: unknown;
    rating?: unknown;
  };

  if (
    typeof body?.username !== "string" ||
    body.username.trim().length === 0 ||
    body.username.trim().length > 20
  ) {
    return reply.code(400).send({
      message: "Username must contain 1 to 20 characters"
    });
  }

  if (
    typeof body.rating !== "number" ||
    !Number.isInteger(body.rating) ||
    body.rating < 0
  ) {
    return reply.code(400).send({
      message: "Rating must be a non-negative integer"
    });
  }

  try {
    const result = await pool.query(
      `UPDATE players
       SET username = $1, rating = $2
       WHERE id = $3
       RETURNING id, username, rating, created_at`,
      [body.username.trim(), body.rating, playerId]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({
        message: "Player not found"
      });
    }

    return result.rows[0];
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return reply.code(409).send({
        message: "Username already exists"
      });
    }

    request.log.error(error, "Failed to update player");

    return reply.code(500).send({
      message: "Failed to update player"
    });
  }
});




app.delete("/api/players/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const playerId = Number(id);

  // Validate the player ID
  if (!Number.isInteger(playerId) || playerId < 1) {
    return reply.code(400).send({
      message: "Player ID must be a positive integer"
    });
  }

  try {
    const result = await pool.query(
      `DELETE FROM players
       WHERE id = $1
       RETURNING id, username, rating`,
      [playerId]
    );

    // Check whether a player was deleted
    if (result.rows.length === 0) {
      return reply.code(404).send({
        message: "Player not found"
      });
    }

    return reply.code(200).send({
      message: "Player deleted successfully",
      player: result.rows[0]
    });
  } catch (error) {
    request.log.error(error, "Failed to delete player");

    return reply.code(500).send({
      message: "Failed to delete player"
    });
  }
});


}           