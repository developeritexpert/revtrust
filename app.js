const express = require('express');
const cors = require('cors');
const app = express();
require('./src/config/mongoose').connect();
const errorHandler = require('./src/utils/error-handler');
const { isJsonStr } = require('./src/utils/utils');
const { createUserApiLog } = require('./src/models/log-model');
const requestIp = require('request-ip');
const { expressLogger, expressErrorLogger, logger } = require('./src/utils/winston-logger');
const endMw = require('express-end');
const { isCelebrateError, errors } = require('celebrate');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
// Routes
const brandRoutes = require('./src/routes/brands/brand.route');
const productRoutes = require('./src/routes/products/product.route');

const config = require('./src/config/config');
const helmet = require('helmet');
// const xss = require('xss-clean');
const sanitizeHtml = require('sanitize-html');
const mongoSanitize = require('mongo-sanitize');

// const mongoSanitize = require('express-mongo-sanitize');
const compression = require('express-compression');
// const rateLimit = require('express-rate-limit');



// ---------- Swagger / OpenAPI setup ----------
const PORT = process.env.PORT || 4000;
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RevTrust API',
      version: '1.0.0',
      description: 'API documentation for RevTrust backend',
    },
    supportedSubmitMethods: [],
    servers: [
      {
        // Put base URL (adjust if your config.server.route or host differs)
        url: `${config.server.backendLink}`,
        description: `${config.server.nodeEnv} server`,
      },
    ],
  },
  apis: ['./src/routes/**/*.js', './src/controllers/**/*.js'], // paths to files with JSDoc comments
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Only expose docs in non-production (change as needed)
const swaggerUiOptions = {
  swaggerOptions: {
    supportedSubmitMethods: [], // disable POST/PUT/DELETE/PATCH etc.
  },
};

  app.use(
    `/${config.server.route}/docs`,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        supportedSubmitMethods: [], // Disable "Try it out"
        docExpansion: 'none', // optional: collapse all by default
      },
      customCss: '.swagger-ui .topbar { display: none }', // optional: hide top bar
    })
  );


// ---------- end Swagger setup ----------


// This will create folder in root dir with provided name and if exist already nothing happen
const uploadsFolder = './uploads';
if (!fs.existsSync(uploadsFolder)) {
  fs.mkdirSync(uploadsFolder);
}

// ----------------------------------Middleware Ended-------------------------------

// Order of this route matters need to place this above store log middleware as it's returning empty result and we don't need to store record of this
app.get('/', (req, res) => {
  res.json({ message: 'Hey dev your api is running...' });
});

app.get(`/${config.server.route}/`, (req, res) => {
  res.json({ message: 'Hey dev your api port is running...' });
});
app.get('/' + config.server.route + '/pingServer', (req, res) => {
  res.status(200).send('OK');
});
app.get('/health', (req, res) => {
  return res.status(200).json({ message: 'OK' });
});
// Enable trust proxy to handle rate limits correctly with 'X-Forwarded-For' header
app.set('trust proxy', true);

// Apply the rate limiting middleware to all requests
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
//     standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//     legacyHeaders: false // Disable the `X-RateLimit-*` headers
// });

// app.use(limiter);

// ----------------------------Middleware for accepting encoded & json request params
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ----------------------------------Middleware Ended-------------------------------

// ----------------------------Middleware for capturing request is actually ended even though listener is timed out
app.use(endMw);
// ----------------------------------Middleware Ended-------------------------------

// // ----------------------------Middleware for reading raw Body as text use req.body
app.use(
  express.text({
    type: 'text/plain',
    limit: '50mb',
  })
);
// ----------------------------------Middleware Ended-------------------------------

// ----------------------------Middleware for Getting a user's IP
app.use(requestIp.mw());
// ----------------------------------Middleware Ended-------------------------------

// ----------------------------Middleware for printing logs on console
app.use(expressLogger);
// ----------------------------------Middleware Ended-------------------------------------

// ----------------------------Middleware to Fix CORS Errors This Will Update The Incoming Request before sending to routes
// Allow requests from all origins
app.use(cors());

// Configure Helmet
app.use(helmet());

// Add Helmet configurations
app.use(
  helmet.crossOriginResourcePolicy({
    policy: 'cross-origin',
  })
);

app.use(
  helmet.referrerPolicy({
    policy: 'no-referrer',
  })
);

// sanitize request data
// Configure xssClean middleware to whitelist all tags except <script> and allow "style" attribute
// const xssOptions = {
//     whiteList: {
//         '*': ['style'],
//         script: []
//     }
// };

// app.use(xss(xssOptions));
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key]);
      }
    }
  }
  next();
});

app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      req.body[key] = mongoSanitize(req.body[key]);
    }
  }
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      req.query[key] = mongoSanitize(req.query[key]);
    }
  }
  if (req.params && typeof req.params === 'object') {
    for (const key in req.params) {
      req.params[key] = mongoSanitize(req.params[key]);
    }
  }

  next();
});

// app.use(mongoSanitize());

// gzip compression
app.use(compression());

// --------------------------------------------------------Middleware Ended----------------------------------------------

// -----------------------------Middleware for storing API logs into DB
app.use(function (req, res, next) {
  // Do whatever you want this will execute when response is finished
  res.once('end', function () {
    createUserApiLog(req, res);
  });

  // Save Response body
  const oldSend = res.send;
  res.send = function (data) {
    res.locals.resBody = isJsonStr(data) ? JSON.parse(data) : data;
    oldSend.apply(res, arguments);
  };
  next();
});

// Routes which should handle requests
app.use(`/${config.server.route}/brand`, brandRoutes);
app.use(`/${config.server.route}/product`, productRoutes);

// ----------------------------Middleware for catching 404 and forward to error handler
app.use((req, res, next) => {
  const error = new Error(errorHandler.ERROR_404);
  error.statusCode = 404;
  next(error);
});

process.on('unhandledRejection', (error) => {
  logger.log({
    level: 'error',
    message: `Unhandled Rejection:, ${JSON.stringify({ error: error.message, stack: error.stack })}`,
  });
  // Additional logic (like sending email notifications)
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.log({
    level: 'error',
    message: `Unhandled Exception:, ${JSON.stringify({ error: error.message, stack: error.stack })}`,
  }); // Additional logic (like shutting down the server gracefully)
  process.exit(1);
});

app.use(errors());

// Error handler
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }
  const sendErrorResponse = (status, message, desc, stack) => {
    res.status(status).json({
      result: message,
      code: status,
      desc,
      stack: process.env.NODE_ENV === 'production' ? null : stack,
    });
  };
  // Celebrate validation errors
  if (isCelebrateError(error)) {
    const errorBody =
      error.details.get('body') || error.details.get('params') || error.details.get('headers');
    const {
      details: [errorDetails],
    } = errorBody;

    sendErrorResponse(422, 'Validation error', errorDetails.message, error.stack);
  }
  // MongoDB errors
  else if (error.name === 'MongoError') {
    if (error.code === 11000) {
      sendErrorResponse(409, 'Conflict', 'Duplicate key', error.stack);
    } else {
      sendErrorResponse(500, 'error', error.message || 'Internal Server Error', error.stack);
    }
  } else if (error.name === 'MongoServerError') {
    if (error.code === 11000) {
      sendErrorResponse(409, 'Conflict', 'Similar data already exists', error.stack);
    } else {
      sendErrorResponse(500, 'error', error.message || 'Internal Server Error', error.stack);
    }
  }
  // ObjectID errors
  else if (error.name === 'CastError' && error.kind === '[ObjectId]') {
    sendErrorResponse(400, 'Bad Request', 'Invalid ID', error.stack);
  } else if (error.name === 'CastError' && error.kind === 'ObjectId') {
    sendErrorResponse(400, 'Bad Request', 'Invalid ID', error.stack);
  }
  // Validation errors
  else if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((e) => e.message);
    sendErrorResponse(422, 'error', 'Validation failed', error.stack, messages);
  }
  // Other errors
  else {
    const statusCode = error.statusCode || 500;
    sendErrorResponse(statusCode, 'error', error.message || 'Internal Server Error', error.stack);
  }
});

// Best Tested place that store only uncaught errors
app.use(expressErrorLogger);

module.exports = app;
