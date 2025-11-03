// --------------------------------------------------
// Load environment variables
// --------------------------------------------------
const dotenv = require('dotenv').config();
if (dotenv.error) {
  console.warn('Warning: Unable to load .env file. Using system environment variables.');
}

// --------------------------------------------------
// Core Dependencies
// --------------------------------------------------
const http = require('http');
const os = require('os');
const cluster = require('cluster');
const cron = require('node-cron');

const app = require('./app');
const config = require('./src/config/config');
const { logger } = require('./src/utils/winston-logger'); // Use your logger

// --------------------------------------------------
// Server Configuration
// --------------------------------------------------
const numCPUs = os.cpus().length;
const numClusters = parseInt(config.clusterSize || numCPUs, 1);
const port = config.server.port || 4000;

// --------------------------------------------------
// Cluster Master Setup
// --------------------------------------------------
if (cluster.isPrimary) {
  console.log(`Master ${process.pid} is starting ${numClusters} workers on port ${port}...`);

  for (let i = 0; i < numClusters; i++) cluster.fork();

  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });

  cluster.on('exit', (worker, code, signal) => {
    logger.error(
      `Worker ${worker.process.pid} exited (code: ${code}, signal: ${signal}). Restarting...`
    );
    cluster.fork();
  });

} else {
  // --------------------------------------------------
  // Worker Process Setup
  // --------------------------------------------------
  const server = http.createServer(app);

  server.listen(port, () => {
    const { address, port: boundPort } = server.address();
    console.log(
      `Worker ${cluster.worker.id} (PID: ${process.pid}) running on http://${address || 'localhost'}:${boundPort} in ${config.server.nodeEnv} mode`
    );
  });

  server.on('error', (err) => {
    logger.error(`Server error: ${err.message}`, { stack: err.stack });
    gracefulShutdown(server);
  });

  // --------------------------------------------------
  // Cron Jobs (Optional)
  // --------------------------------------------------
  if (cluster.worker.id === 1) {
    // uncomment the line to enable cron jobs on worker 1
    // setupCronJobs();
  }

  // --------------------------------------------------
  // Graceful Shutdown Handling
  // --------------------------------------------------
  process.on('SIGTERM', () => gracefulShutdown(server));
  process.on('SIGINT', () => gracefulShutdown(server));
}

// --------------------------------------------------
// Helper Functions
// --------------------------------------------------
function gracefulShutdown(server) {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed. Exiting process.');
    process.exit(0);
  });
}

function setupCronJobs() {
  cron.schedule('* * * * *', () => {
    console.log('Cron job executed (every minute)');
    // Add your scheduled job logic here
  });
  console.log(`Cron jobs initialized by worker ${cluster.worker.id}`);
}
