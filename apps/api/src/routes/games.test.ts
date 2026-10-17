
import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { pool } from "../infrastructure/database.js";

describe("Game routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let email: string;
  let userId: string;

  beforeAll(async () => {
    app = await buildApp();
    email = `game_${Date.now()}@example.com`;

    const registerResponse = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email,
        password: "SecurePass123!",
      },
    });

    expect(registerResponse.statusCode).toBe(201);
    userId = registerResponse.json().user.id;
  });

  afterAll(async () => {
    if (userId) {
      await pool.query(
        `DELETE FROM games
         WHERE white_player_id = $1 OR black_player_id = $1`,
        [userId],
      );

      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    }

    await app.close();
  });

  it("should reject game creation without authentication", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/games",
    });

    expect(response.statusCode).toBe(401);
  });

  it("should create a game for an authenticated user", async () => {
    const loginResponse = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email,
        password: "SecurePass123!",
      },
    });

    expect(loginResponse.statusCode).toBe(200);

    const { token } = loginResponse.json();

    const response = await app.inject({
      method: "POST",
      url: "/api/games",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(201);

    const { game } = response.json();

    expect(game.id).toBeDefined();
    expect(game.room_code).toMatch(/^[A-F0-9]{12}$/);
    expect(game.white_player_id).toBe(userId);
    expect(game.black_player_id).toBeNull();
    expect(game.status).toBe("waiting");
  });

it("should allow a second authenticated user to join a waiting game", async () => {
  const secondEmail = `join_${Date.now()}@example.com`;
  const password = "SecurePass123!";

  try {
    const registerResponse = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: secondEmail, password },
    });

    expect(registerResponse.statusCode).toBe(201);

    const loginResponse = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: secondEmail, password },
    });

    const { token } = loginResponse.json();

    // The existing test user creates a waiting game.
    const creatorLogin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email,
        password: "SecurePass123!",
      },
    });

    const creatorToken = creatorLogin.json().token;

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/games",
      headers: {
        authorization: `Bearer ${creatorToken}`,
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const roomCode = createResponse.json().game.room_code;

    const joinResponse = await app.inject({
      method: "POST",
      url: `/api/games/${roomCode}/join`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(joinResponse.statusCode).toBe(200);

    const { game } = joinResponse.json();

    expect(game.white_player_id).toBe(userId);
    expect(game.black_player_id).toBe(
      registerResponse.json().user.id,
    );
    expect(game.status).toBe("active");
  } finally {
    await pool.query(
      "DELETE FROM games WHERE room_code IN (SELECT room_code FROM games WHERE white_player_id = $1)",
      [userId],
    );
    await pool.query("DELETE FROM users WHERE email = $1", [secondEmail]);
  }
});


it("should reject an invalid room code", async () => {
  const loginResponse = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      email,
      password: "SecurePass123!",
    },
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/games/DOESNOTEXIST/join",
    headers: {
      authorization: `Bearer ${loginResponse.json().token}`,
    },
  });

  expect(response.statusCode).toBe(404);
});

it("should reject the creator joining their own game", async () => {
  const loginResponse = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      email,
      password: "SecurePass123!",
    },
  });

  const token = loginResponse.json().token;

  const createResponse = await app.inject({
    method: "POST",
    url: "/api/games",
    headers: { authorization: `Bearer ${token}` },
  });

  const roomCode = createResponse.json().game.room_code;

  const joinResponse = await app.inject({
    method: "POST",
    url: `/api/games/${roomCode}/join`,
    headers: { authorization: `Bearer ${token}` },
  });

  expect(joinResponse.statusCode).toBe(409);
});


it("should reject a third player joining an active game", async () => {
  const secondEmail = `second_${Date.now()}@example.com`;
  const thirdEmail = `third_${Date.now()}@example.com`;
  const password = "SecurePass123!";

  try {
    // Register the second player.
    const secondRegister = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: secondEmail, password },
    });
    expect(secondRegister.statusCode).toBe(201);

    // Register the third player.
    const thirdRegister = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email: thirdEmail, password },
    });
    expect(thirdRegister.statusCode).toBe(201);

    // Log in all three players.
    const creatorLogin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email, password },
    });

    const secondLogin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: secondEmail, password },
    });

    const thirdLogin = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: thirdEmail, password },
    });

    const creatorToken = creatorLogin.json().token;
    const secondToken = secondLogin.json().token;
    const thirdToken = thirdLogin.json().token;

    // The creator creates a game.
    const createResponse = await app.inject({
      method: "POST",
      url: "/api/games",
      headers: { authorization: `Bearer ${creatorToken}` },
    });
    expect(createResponse.statusCode).toBe(201);

    const roomCode = createResponse.json().game.room_code;

    // The second player joins. The game becomes active.
    const joinResponse = await app.inject({
      method: "POST",
      url: `/api/games/${roomCode}/join`,
      headers: { authorization: `Bearer ${secondToken}` },
    });
    expect(joinResponse.statusCode).toBe(200);
    expect(joinResponse.json().game.status).toBe("active");

    // The third player must be rejected.
    const thirdJoinResponse = await app.inject({
      method: "POST",
      url: `/api/games/${roomCode}/join`,
      headers: { authorization: `Bearer ${thirdToken}` },
    });

    expect(thirdJoinResponse.statusCode).toBe(409);
  } finally {
    await pool.query(
      `DELETE FROM games
       WHERE white_player_id IN (
         SELECT id FROM users WHERE email = ANY($1::text[])
       )
       OR black_player_id IN (
         SELECT id FROM users WHERE email = ANY($1::text[])
       )`,
      [[email, secondEmail, thirdEmail]],
    );

    await pool.query(
      "DELETE FROM users WHERE email = ANY($1::text[])",
      [[secondEmail, thirdEmail]],
    );
  }
});


it("should retrieve an existing game by room code", async () => {
  const loginResponse = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      email,
      password: "SecurePass123!",
    },
  });

  const token = loginResponse.json().token;

  const createResponse = await app.inject({
    method: "POST",
    url: "/api/games",
    headers: { authorization: `Bearer ${token}` },
  });

  const roomCode = createResponse.json().game.room_code;

  const response = await app.inject({
    method: "GET",
    url: `/api/games/${roomCode}`,
    headers: { authorization: `Bearer ${token}` },
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().game.room_code).toBe(roomCode);
  expect(response.json().game.status).toBe("waiting");
});

it("should return 404 for a nonexistent game", async () => {
  const loginResponse = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      email,
      password: "SecurePass123!",
    },
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/games/DOESNOTEXIST",
    headers: {
      authorization: `Bearer ${loginResponse.json().token}`,
    },
  });

  expect(response.statusCode).toBe(404);
});

it("should reject retrieving game details without authentication", async () => {
  const response = await app.inject({
    method: "GET",
    url: "/api/games/7E61B4542239",
  });

  expect(response.statusCode).toBe(401);
});


});
