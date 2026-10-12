import "dotenv/config";
import { buildApp } from "./app.js";
import { config } from "./config/index.js";

async function startServer() {
  const app = await buildApp();

  try {
    await app.listen({
      port: config.port,
      host: "0.0.0.0",
    });
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
    await app.close();
  }
}

startServer();