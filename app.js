const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { errors } = require('celebrate');
const fs = require('fs');
const path = require('path');

const config = require('./src/config/config');
const { connect } = require('./src/config/mongoose');
const { expressLogger, expressErrorLogger, logger } = require('./src/utils/winston-logger');
const errorHandler = require('./src/utils/error-handler');

// Routes
const brandRoutes = require('./src/routes/brands/brand.route');
const productRoutes = require('./src/routes/products/product.route');
const reviewRoutes = require('./src/routes/reviews/review.route');
const authRoutes = require('./src/routes/auth/auth.routes');
const profileRouter = require('./src/routes/profile/profile.route');

const app = express();

// Connect to database
connect();

// Ensure upload folder exists
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------------------------------------------
// Core Middleware (Simplified)
// --------------------------------------------------
app.set('trust proxy', true);
app.use(cors());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());

// Logger middleware (optional - can remove if too verbose)
app.use(expressLogger);

// --------------------------------------------------
// Health Check Routes
// --------------------------------------------------
app.get('/', (req, res) => res.json({ message: 'API is running...' }));
app.get(`/${config.server.route}/`, (req, res) => res.json({ message: 'API port is alive...' }));
app.get(`/${config.server.route}/pingServer`, (req, res) => res.send('OK'));
app.get('/health', (req, res) => res.status(200).json({ message: 'OK' }));

// --------------------------------------------------
// API Routes
// --------------------------------------------------
app.use(`/${config.server.route}/brand`, brandRoutes);
app.use(`/${config.server.route}/product`, productRoutes);
app.use(`/${config.server.route}/review`, reviewRoutes);
app.use(`/${config.server.route}/auth`, authRoutes);
app.use(`/${config.server.route}/profile`, profileRouter);

// --------------------------------------------------
// 404 Handler
// --------------------------------------------------
app.use((req, res, next) => {
  const error = new Error(errorHandler.ERROR_404 || 'Route not found');
  error.statusCode = 404;
  next(error);
});

// --------------------------------------------------
// Celebrate Validation Error Handler
// --------------------------------------------------
app.use(errors());

// --------------------------------------------------
// Custom Error Handler
// --------------------------------------------------
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  
  const status = err.statusCode || 500;
  const desc = err.message || 'Internal Server Error';
  const stack = config.server.nodeEnv === 'prod' ? null : err.stack;
  
  // Log error
  logger.error(`${status} - ${desc}`, { stack: err.stack });
  
  res.status(status).json({ 
    result: 'error', 
    code: status, 
    desc, 
    stack 
  });
});


app.use(expressErrorLogger);


process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled Rejection: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error(`UncaughtException: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

module.exports = app;