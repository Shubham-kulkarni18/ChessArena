
import type { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import { pool } from "../infrastructure/database.js";
import { authenticate } from "../middleware/authenticate.js";

export default async function gameRoutes(app: FastifyInstance) {
  app.post(
    "/",
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          error: "Authentication required",
        });
      }

      const roomCode = randomBytes(6).toString("hex").toUpperCase();
      const userId = request.user.userId;

      try {
        const result = await pool.query(
          `INSERT INTO games (room_code, white_player_id, status)
           VALUES ($1, $2, 'waiting')
           RETURNING id, room_code, white_player_id,
                     black_player_id, status, created_at, updated_at`,
          [roomCode, userId],
        );

        return reply.code(201).send({
          game: result.rows[0],
        });
      } catch (error) {
        request.log.error(error);

        return reply.code(500).send({
          error: "Could not create game",
        });
      }
    },
  );


  app.post(
    "/:roomCode/join",
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          error: "Authentication required",
        });
      }

      const { roomCode } = request.params as { roomCode: string };
      const userId = request.user.userId;
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const gameResult = await client.query(
          `SELECT id, room_code, white_player_id,
                  black_player_id, status
           FROM games
           WHERE room_code = $1
           FOR UPDATE`,
          [roomCode.toUpperCase()],
        );

        if (gameResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return reply.code(404).send({
            error: "Game not found",
          });
        }

        const game = gameResult.rows[0];

        if (game.status !== "waiting") {
          await client.query("ROLLBACK");
          return reply.code(409).send({
            error: "Game is not waiting for players",
          });
        }

        if (game.white_player_id === userId) {
          await client.query("ROLLBACK");
          return reply.code(409).send({
            error: "You cannot join your own game",
          });
        }

        if (game.black_player_id !== null) {
          await client.query("ROLLBACK");
          return reply.code(409).send({
            error: "Game is already full",
          });
        }

        const result = await client.query(
          `UPDATE games
           SET black_player_id = $1,
               status = 'active',
               updated_at = NOW()
           WHERE id = $2
           RETURNING id, room_code, white_player_id,
                     black_player_id, status, created_at, updated_at`,
          [userId, game.id],
        );

        await client.query("COMMIT");

        return reply.code(200).send({
          game: result.rows[0],
        });
      } catch (error) {
        await client.query("ROLLBACK");
        request.log.error(error);

        return reply.code(500).send({
          error: "Could not join game",
        });
      } finally {
        client.release();
      }
    },
  );


app.get(
  "/:roomCode",
  { preHandler: authenticate },
  async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({
        error: "Authentication required",
      });
    }

    const { roomCode } = request.params as { roomCode: string };

    try {
      const result = await pool.query(
        `SELECT id, room_code, white_player_id,
                black_player_id, status, created_at, updated_at
         FROM games
         WHERE room_code = $1`,
        [roomCode.toUpperCase()],
      );

      if (result.rows.length === 0) {
        return reply.code(404).send({
          error: "Game not found",
        });
      }

      return reply.code(200).send({
        game: result.rows[0],
      });
    } catch (error) {
      request.log.error(error);

      return reply.code(500).send({
        error: "Could not retrieve game",
      });
    }
  },
);

}
