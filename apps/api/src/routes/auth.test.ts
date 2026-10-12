import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../app.js";
import { pool } from "../infrastructure/database.js";

describe("Authentication API", () => {
  const appPromise = buildApp();

  afterAll(async () => {
    const app = await appPromise;
    await app.close();
  });

  it("should register a user and never expose the password hash", async () => {
    const app = await appPromise;
    const email = `register_${Date.now()}@example.com`;

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email,
          password: "SecurePass123!",
        },
      });

      expect(response.statusCode).toBe(201);

      const body = response.json();

      expect(body.user.email).toBe(email);
      expect(body.user.id).toBeDefined();
      expect(body.user.password_hash).toBeUndefined();
      expect(body.user.passwordHash).toBeUndefined();
    } finally {
      await pool.query("DELETE FROM users WHERE email = $1", [email]);
    }
  });

  it("should reject duplicate email addresses", async () => {
    const app = await appPromise;
    const email = `duplicate_${Date.now()}@example.com`;

    try {
      const firstResponse = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email,
          password: "SecurePass123!",
        },
      });

      expect(firstResponse.statusCode).toBe(201);

      const duplicateResponse = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email,
          password: "AnotherPass123!",
        },
      });

      expect(duplicateResponse.statusCode).toBe(409);
    } finally {
      await pool.query("DELETE FROM users WHERE email = $1", [email]);
    }
  });

  it("should reject an invalid registration request", async () => {
    const app = await appPromise;

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: {
        email: "not-an-email",
        password: "short",
      },
    });

    expect(response.statusCode).toBe(400);
  });

    it("should log in a user and reject an incorrect password", async () => {
    const app = await appPromise;
    const email = `login_${Date.now()}@example.com`;
    const password = "SecurePass123!";

    try {
      // Register a temporary user
      const registerResponse = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: { email, password },
      });

      expect(registerResponse.statusCode).toBe(201);

      // Log in with the correct password
      const loginResponse = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: { email, password },
      });

      expect(loginResponse.statusCode).toBe(200);

      const loginBody = loginResponse.json();

      expect(loginBody.token).toEqual(expect.any(String));
      expect(loginBody.token.length).toBeGreaterThan(0);
      expect(loginBody.user.email).toBe(email);
      expect(loginBody.user.password_hash).toBeUndefined();

      // Try logging in with the wrong password
      const wrongPasswordResponse = await app.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email,
          password: "WrongPassword123!",
        },
      });

      expect(wrongPasswordResponse.statusCode).toBe(401);
    } finally {
      // Remove the temporary test account
      await pool.query("DELETE FROM users WHERE email = $1", [email]);
    }
  });


it("should reject requests without a token", async () => {
  const app = await appPromise;

  const response = await app.inject({
    method: "GET",
    url: "/api/auth/me",
  });

  expect(response.statusCode).toBe(401);
});

it("should return the user when a valid token is provided", async () => {
  const app = await appPromise;
  const email = `me_${Date.now()}@example.com`;
  const password = "SecurePass123!";

  try {
    const registerResponse = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email, password },
    });

    expect(registerResponse.statusCode).toBe(201);

    const loginResponse = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email, password },
    });

    expect(loginResponse.statusCode).toBe(200);

    const { token } = loginResponse.json();

    const response = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().user.email).toBe(email);
    expect(response.json().user.id).toBeDefined();
  } finally {
    await pool.query("DELETE FROM users WHERE email = $1", [email]);
  }
});

});