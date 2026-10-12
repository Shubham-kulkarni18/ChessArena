import Fastify from "fastify";
import playerRoutes from "./routes/players.js";

const app = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      removeAdditional: false
    }
  }
});

app.get("/health", async () => {
  return {
    status: "ChessArena is alive"
  };
});

app.register(playerRoutes);

// Your /api endpoint goes here

app.listen({ port: 3000 }, (error, address) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(`Server running at ${address}`);
});