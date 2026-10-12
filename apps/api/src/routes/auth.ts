import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { pool } from "../infrastructure/database.js";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { authenticate } from "../middleware/authenticate.js";

export default async function authRoutes(app: FastifyInstance) {
  app.post(
    "/api/auth/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          additionalProperties: false,
          properties: {
            email: {
              type: "string",
              format: "email",
              maxLength: 255,
            },
            password: {
              type: "string",
              minLength: 8,
              maxLength: 72,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

      const normalizedEmail = email.trim().toLowerCase();

      // bcrypt only processes up to 72 bytes of a password.
      if (Buffer.byteLength(password, "utf8") > 72) {
        return reply.code(400).send({
          error: "Password must not exceed 72 bytes",
        });
      }

      try {
        const passwordHash = await bcrypt.hash(password, 12);

        const result = await pool.query(
          `INSERT INTO users (email, password_hash)
           VALUES ($1, $2)
           RETURNING id, email, created_at`,
          [normalizedEmail, passwordHash],
        );

        return reply.code(201).send({
          message: "User registered successfully",
          user: result.rows[0],
        });
      } catch (error: unknown) {
        const dbError = error as { code?: string };

        if (dbError.code === "23505") {
          return reply.code(409).send({
            error: "Email is already registered",
          });
        }

        request.log.error(error, "User registration failed");

        return reply.code(500).send({
          error: "Internal server error",
        });
      }
    },
  );

  app.post(
    "/api/auth/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          additionalProperties: false,
          properties: {
            email: {
              type: "string",
              format: "email",
              maxLength: 255,
            },
            password: {
              type: "string",
              minLength: 1,
              maxLength: 72,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

      if (!config.jwtSecret) {
        request.log.error("JWT_SECRET is not configured");

        return reply.code(500).send({
          error: "Internal server error",
        });
      }

      try {
        request.log.info("LOGIN DEBUG: querying user");
        const result = await pool.query(
          `SELECT id, email, password_hash
           FROM users
           WHERE email = $1`,
          [email.trim().toLowerCase()],
        );

        const user = result.rows[0];

        if (!user) {
          return reply.code(401).send({
            error: "Invalid email or password",
          });
        }

        const passwordMatches = await bcrypt.compare(
          password,
          user.password_hash,
        );

        if (!passwordMatches) {
          return reply.code(401).send({
            error: "Invalid email or password",
          });
        }

        const token = jwt.sign(
          {
            email: user.email,
          },
          config.jwtSecret,
          {
            subject: String(user.id),
            expiresIn: "1h",
          },
        );

        return reply.code(200).send({
          message: "Login successful",
          token,
          user: {
            id: user.id,
            email: user.email,
          },
        });
        } catch (error: unknown) {
    request.log.error(
        {
        error:
            error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                }
            : String(error),
        },
        "Login failed",
    );

    return reply.code(500).send({
        error: "Internal server error",
    });
    }
    },
  );
  app.get(
    "/api/auth/me",
    {
      preHandler: authenticate,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          error: "Authentication required",
        });
      }

      return {
        user: {
          id: request.user.userId,
          email: request.user.email,
        },
      };
    },
  );
}