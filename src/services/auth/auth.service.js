// services/auth.service.js
const { User } = require('../../models/user.model');
const { OTP } = require('../../models/otp.model');
const { ErrorHandler } = require('../../utils/error-handler');
const { generateVerificationToken } = require('../../utils/token.utils');
const TOKEN_GEN = require('../../helper/generate-token');
const mailService = require('../../mail/mails');
const authConfig = require('../../config/auth.config');

const register = async ({ name, email, password }) => {
  const normalized = email.toLowerCase();

  const exists = await User.findOne({ email: normalized });
  if (exists) throw new ErrorHandler(409, 'Email already registered');

  const user = await User.create({ name, email: normalized, password });

  // Email Verification (if enabled)
  if (authConfig.features.emailVerification) {
    user.verificationToken = generateVerificationToken();
    user.verificationTokenExpires = Date.now() + authConfig.tokens.verificationToken.expiry;
    await user.save();

    mailService
      .sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: user.verificationToken,
      })
      .catch((err) => console.error('Email send failed:', err));

    return {
      data: { user: user.toSafeObject() },
      message: 'Registration successful. Please verify your email.',
    };
  }

  // Auto-verify if feature disabled
  user.isEmailVerified = true;
  await user.save();

  return {
    data: { user: user.toSafeObject() },
    message: 'Registration successful',
  };
};

/**
 * Login with real database check
 */
const login = async (email, password, rememberMe = false) => {
  const normalized = email.toLowerCase();

  // Find user with password field
  const user = await User.findOne({ email: normalized }).select('+password');
  console.log(user);
  
  if (!user) {
    throw new ErrorHandler(401, 'Invalid credentials');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new ErrorHandler(403, 'Account deactivated. Please contact support.');
  }

  // Check email verification (if enabled)
  if (authConfig.features.emailVerification && !user.isEmailVerified) {
    throw new ErrorHandler(403, 'Please verify your email first');
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ErrorHandler(401, 'Invalid credentials');
  }

  // Generate token
  const expiry =
    authConfig.features.rememberMe && rememberMe
      ? authConfig.tokens.accessToken.long
      : authConfig.tokens.accessToken.short;

  const token = TOKEN_GEN.generateToken(user._id.toString(), user.role, expiry);

  // Return user without password
  return {
    data: {
      user: user.toSafeObject(),
      token,
      expiresIn: expiry,
    },
    message: 'Login successful',
  };
};

// ============ EMAIL VERIFICATION ============
const verifyEmail = async (token) => {
  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) throw new ErrorHandler(400, 'Invalid or expired token');

  user.isEmailVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  return true;
};

const resendVerification = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ErrorHandler(404, 'User not found');

  if (user.isEmailVerified) throw new ErrorHandler(400, 'Email already verified');

  user.verificationToken = generateVerificationToken();
  user.verificationTokenExpires = Date.now() + authConfig.tokens.verificationToken.expiry;
  await user.save();

  await mailService.sendVerificationEmail({
    to: user.email,
    name: user.name,
    token: user.verificationToken,
  });

  return true;
};

// ============ FORGOT PASSWORD (OTP) ============
const sendOTP = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ErrorHandler(404, 'User not found');

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

  await OTP.deleteMany({ email: user.email });
  await OTP.create({
    email: user.email,
    otp,
    expiresAt: Date.now() + authConfig.otp.expiryMinutes * 60 * 1000,
  });

  await mailService.sendOTPEmail({
    to: user.email,
    name: user.name,
    otp,
  });

  return true;
};

const verifyOTP = async (email, otp) => {
  const record = await OTP.findOne({
    email: email.toLowerCase(),
    otp,
    expiresAt: { $gt: Date.now() },
  });

  if (!record) throw new ErrorHandler(400, 'Invalid or expired OTP');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ErrorHandler(404, 'User not found');

  await OTP.deleteOne({ _id: record._id });

  // Generate reset token
  const resetToken = TOKEN_GEN.generateToken(
    user._id.toString(), 
    user.role, 
    '15m' // 15 minutes expiry for password reset
  );

  return {
    resetToken,
    user: user.toSafeObject(),
  };
};

const resetPassword = async (token, newPassword) => {
  try {
    // Verify reset token
    const decoded = TOKEN_GEN.verifyToken(token);
    if (!decoded) throw new ErrorHandler(400, 'Invalid or expired token');

    const user = await User.findById(decoded.id);
    if (!user) throw new ErrorHandler(404, 'User not found');

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    return true;
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      throw new ErrorHandler(400, 'Invalid or expired token');
    }
    throw error;
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  sendOTP,
  verifyOTP,
  resetPassword,
};