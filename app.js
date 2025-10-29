const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const requestIp = require('request-ip');
const compression = require('compression');
const endMw = require('express-end');
const { errors, isCelebrateError } = require('celebrate');
const fs = require('fs');

const config = require('./src/config/config');
const { connect } = require('./src/config/mongoose');
const { expressLogger, expressErrorLogger, logger } = require('./src/utils/winston-logger');
const errorHandler = require('./src/utils/error-handler');
const { createUserApiLog } = require('./src/models/log-model');
const { sanitizeRequest } = require('./src/middleware/security');
const path = require('path'); 

// Routes
const brandRoutes = require('./src/routes/brands/brand.route');
const productRoutes = require('./src/routes/products/product.route');
const reviewRoutes = require('./src/routes/reviews/review.route');

const app = express();
connect();

// Ensure upload folder exists
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------------------------------------------
// Core Middleware
// --------------------------------------------------
app.set('trust proxy', true);
app.use(cors());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression({ level: 6, threshold: '10kb' }));
app.use(requestIp.mw());
app.use(expressLogger);
app.use(endMw);
app.use(sanitizeRequest); // unified sanitizer

// --------------------------------------------------
// Health Check Routes
// --------------------------------------------------
app.get('/', (req, res) => res.json({ message: 'API is running...' }));
app.get(`/${config.server.route}/`, (req, res) => res.json({ message: 'API port is alive...' }));
app.get(`/${config.server.route}/pingServer`, (req, res) => res.send('OK'));
app.get('/health', (req, res) => res.status(200).json({ message: 'OK' }));

// --------------------------------------------------
// Store API logs (async)
app.use((req, res, next) => {
  res.once('end', () => setImmediate(() => createUserApiLog(req, res)));
  const oldSend = res.send;
  res.send = function (data) {
    res.locals.resBody = data;
    oldSend.apply(res, arguments);
  };
  next();
});

// --------------------------------------------------
// Routes
app.use(`/${config.server.route}/brand`, brandRoutes);
app.use(`/${config.server.route}/product`, productRoutes);
app.use(`/${config.server.route}/review`, reviewRoutes);

// --------------------------------------------------
// 404 handler
app.use((req, res, next) => {
  const error = new Error(errorHandler.ERROR_404);
  error.statusCode = 404;
  next(error);
});

// Celebrate validation error handler
app.use(errors());

// --------------------------------------------------
// Custom error handler
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.statusCode || 500;
  const desc = err.message || 'Internal Server Error';
  const stack = process.env.NODE_ENV === 'prod' ? null : err.stack;
  res.status(status).json({ result: 'error', code: status, desc, stack });
});

// --------------------------------------------------
// Global Process Error Handling
process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled Rejection: ${error.message}`, { stack: error.stack });
  process.exit(1);
});
process.on('uncaughtException', (error) => {
  logger.error(`Unhandled Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

// --------------------------------------------------
// Error Logger
app.use(expressErrorLogger);

module.exports = app;
