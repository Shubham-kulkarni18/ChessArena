
import { config } from "../config/index.js";
import { pool } from "./database.js";

async function testDatabase() {
  try {
    const url = new URL(config.databaseUrl);

    console.log("Database host:", url.hostname);
    console.log("Database port:", url.port || "5432");
    console.log("Database name:", url.pathname.slice(1));
    console.log("Database username:", url.username);

    const result = await pool.query(
      "SELECT current_user, current_database(), NOW() AS current_time"
    );

    console.log("PostgreSQL connection successful!");
    console.log("Result:", result.rows[0]);
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testDatabase();
