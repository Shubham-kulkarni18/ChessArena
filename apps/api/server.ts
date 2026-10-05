import Fastify from 'fastify';

//Creating server with logs
const server = Fastify({
  logger: true 
});

// Define the route (The instructions for the receptionist)
server.get('/health', async (request, reply) => {
  return { status: 'ok', message: 'The chess server is running!' };
});

// 3. Turn the server on
server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});