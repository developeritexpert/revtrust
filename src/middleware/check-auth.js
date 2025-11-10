const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { ErrorHandler } = require('../utils/error-handler');
const { isEmpty } = require('../utils/utils');
const UserServices = require('../services/user.service');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (isEmpty(token)) {
      return next(new ErrorHandler(403, 'Token is missing'));
    }

    // ✅ Check universal admin token first
    if (token === process.env.UNIVERSAL_ADMIN_TOKEN) {
      req.user = { id: 'ADMIN_STATIC_TOKEN', role: 'ADMIN' };
      return next();
    }

    // ✅ Normal user token verification
    const decoded = jwt.verify(token, config.server.jwtSecretKey);
    console.log('Decoded:', decoded);

    const userExist = await UserServices.getUserByID(decoded.id, true);
    console.log('User Exist:', userExist);

    if (!userExist) {
      return next(
        new ErrorHandler(404, "Couldn't find your account, please create an account")
      );
    }

    req.user = userExist;
    req.userId = userExist._id;

    return next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(
        new ErrorHandler(401, "Couldn't verify your identity, please try logging in again")
      );
    }

    return next(new ErrorHandler(500, 'Authentication error'));
  }
};
