export const config = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/chessarena',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};
