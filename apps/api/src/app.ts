import Fastify from "fastify";
import cors from "@fastify/cors";
import playerRoutes from "./routes/players.js";
import authRoutes from "./routes/auth.js";
import gameRoutes from "./routes/games.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
    ajv: {
      customOptions: {
        removeAdditional: false,
      },
    },
  });

  await app.register(cors, {
    origin: true,
  });

  app.get("/health", async () => {
    return {
      status: "ChessArena is alive",
    };
  });

  await app.register(playerRoutes);
  await app.register(authRoutes);
  await app.register(gameRoutes, { prefix: "/api/games" });
  return app;
}


// A new player eamil = chessplayer2@example.com password = ChessArena2026! id = 24
// game room code = 7E61B4542239 
// login token = 
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImNoZXNzcGxheWVyMkBleGFtcGxlLmNvbSIsImlhdCI6MTc5MjI0NDcxNSwiZXhwIjoxNzkyMjQ4MzE1LCJzdWIiOiIyNCJ9.rbcWQlJkvDkcVygR5WbbPzRsY5FUNBb7aDkX_xrn45c