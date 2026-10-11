import { FastifyInstance } from "fastify";

const players = [
  {
    id: 1,
    username: "alice",
    rating: 1200
  },
  {
    id: 2,
    username: "bob",
    rating: 1450
  },
  {
    id: 3,
    username: "charlie",
    rating: 1600
  }
];

export default async function playerRoutes(
  app: FastifyInstance
) {
  app.get("/api/players", async () => {
    return players;
  }
);

app.get("/api/players/:id", async (request, reply) => {
  const { id } = request.params as { id: string };

  const playerId = Number(id);

  const player = players.find((p) => p.id === playerId);

  if (!player) {
    return reply.code(404).send({
      message: "Player not found"
    });
  }

  return player;
});

}           