import Fastify from "fastify";
import cors from "@fastify/cors";
import playerRoutes from "./routes/players.js";


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

  return app;
}
