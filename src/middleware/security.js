const sanitizeHtml = require('sanitize-html');
const mongoSanitize = require('mongo-sanitize');

function sanitizeRequest(req, res, next) {
  ['body', 'query', 'params'].forEach((type) => {
    if (req[type] && typeof req[type] === 'object') {
      for (const key in req[type]) {
        if (typeof req[type][key] === 'string') {
          req[type][key] = mongoSanitize(sanitizeHtml(req[type][key]));
        }
      }
    }
  });
  next();
}

module.exports = { sanitizeRequest };
