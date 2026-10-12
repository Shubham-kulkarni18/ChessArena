import Fastify from "fastify";
import cors from "@fastify/cors";
import playerRoutes from "./routes/players.js";
import authRoutes from "./routes/auth.js";

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
  return app;
}
