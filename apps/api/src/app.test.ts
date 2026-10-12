import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("ChessArena API", () => {
  const appPromise = buildApp();

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  it("GET /health should return 200 and the service status", async () => {
    const app = await appPromise;

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ChessArena is alive",
    });
  });

  it("GET /api/players should return 200 and an array", async () => {
    const app = await appPromise;

    const response = await app.inject({
      method: "GET",
      url: "/api/players",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(expect.any(Array));
  });

  it("GET /api/players/abc should return 400", async () => {
    const app = await appPromise;

    const response = await app.inject({
      method: "GET",
      url: "/api/players/abc",
    });

    expect(response.statusCode).toBe(400);
  });

  it("GET /api/players/999999999 should return 404 when player does not exist", async () => {
    const app = await appPromise;

    const response = await app.inject({
      method: "GET",
      url: "/api/players/999999999",
    });

    expect(response.statusCode).toBe(404);
  });

  it("POST /api/players should reject invalid player data", async () => {
    const app = await appPromise;

    const response = await app.inject({
      method: "POST",
      url: "/api/players",
      payload: {
        username: "",
        rating: -1,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("should create, read, update, and delete a player", async () => {
    const app = await appPromise;

    const username = `test_${Date.now()}`;

    // 1. Create a player
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/players",
      payload: {
        username,
        rating: 1200,
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const createdPlayer = createResponse.json();
    expect(createdPlayer.username).toBe(username);
    expect(createdPlayer.rating).toBe(1200);

    const playerId = createdPlayer.id;

    // 2. Read the player
    const readResponse = await app.inject({
      method: "GET",
      url: `/api/players/${playerId}`,
    });

    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.json().username).toBe(username);

    // 3. Update the player
    const updatedUsername = `${username}_u`;

    const updateResponse = await app.inject({
      method: "PUT",
      url: `/api/players/${playerId}`,
      payload: {
        username: updatedUsername,
        rating: 1500,
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().username).toBe(updatedUsername);
    expect(updateResponse.json().rating).toBe(1500);

    // 4. Delete the player
    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/api/players/${playerId}`,
    });

    expect(deleteResponse.statusCode).toBe(200);

    // 5. Confirm the player no longer exists
    const finalReadResponse = await app.inject({
      method: "GET",
      url: `/api/players/${playerId}`,
    });

    expect(finalReadResponse.statusCode).toBe(404);
  });

  it("POST /api/players should reject duplicate usernames", async () => {
    const app = await appPromise;
    const username = `dup_${Date.now()}`;

    // Create the first player
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/players",
      payload: {
        username,
        rating: 1200,
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const playerId = createResponse.json().id;

    try {
      // Attempt to create another player with the same username
      const duplicateResponse = await app.inject({
        method: "POST",
        url: "/api/players",
        payload: {
          username,
          rating: 1500,
        },
      });

      expect(duplicateResponse.statusCode).toBe(409);
    } finally {
      // Remove the player created by this test
      await app.inject({
        method: "DELETE",
        url: `/api/players/${playerId}`,
      });
    }
  });
});