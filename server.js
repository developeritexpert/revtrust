const dotenv = require('dotenv').config();
if (dotenv.error) {
  console.warn('Warning: Unable to load .env file. Using system environment variables.');
}


const http = require('http');
const app = require('./app');
const config = require('./src/config/config');
const { logger } = require('./src/utils/winston-logger');


const port = config.server.port || 4000;


const server = http.createServer(app);

server.listen(port, () => {
  console.log(
    `Server running on http://localhost:${port} in ${config.server.nodeEnv} mode`
  );
});

server.on('error', (err) => {
  logger.error(`Server error: ${err.message}`, { stack: err.stack });
  gracefulShutdown(server);
});


process.on('SIGTERM', () => gracefulShutdown(server));
process.on('SIGINT', () => gracefulShutdown(server));

function gracefulShutdown(server) {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed. Exiting process.');
    process.exit(0);
  });
}