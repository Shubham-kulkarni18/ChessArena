import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";


export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return reply.code(401).send({
      error: "Authentication required",
    });
  }

  const token = authorization.slice("Bearer ".length);

  if (!config.jwtSecret) {
    request.log.error("JWT_SECRET is not configured");

    return reply.code(500).send({
      error: "Internal server error",
    });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string"
    ) {
      return reply.code(401).send({
        error: "Invalid or expired token",
      });
    }

    request.user = {
      userId: payload.sub,
      email: payload.email,
    };
  } catch {
    return reply.code(401).send({
      error: "Invalid or expired token",
    });
  }
}