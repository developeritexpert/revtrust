const express = require('express');
const profileRouter = express.Router();
const profileController = require('../../controllers/profile/profile.controller');
const ProfileSchema = require('../../request-schemas/profile.schema');
const { celebrate } = require('celebrate');
const cloudinaryUpload = require('../../config/cloudinaryUpload');
const checkAuth = require('../../middleware/check-auth');

const API = {
  GET_PROFILE: '/',
  UPDATE_PROFILE: '/update',
  CHANGE_PASSWORD: '/change-password',
};

// All profile routes require authentication
profileRouter.use(checkAuth);

// Get current user's profile
profileRouter.get(
  API.GET_PROFILE,
  profileController.getProfile
);

// Update current user's profile (with optional avatar upload)
profileRouter.put(
  API.UPDATE_PROFILE,
  cloudinaryUpload('avatar', 'profiles'),
  celebrate(ProfileSchema.updateProfile),
  profileController.updateProfile
);

// Change current user's password
profileRouter.put(
  API.CHANGE_PASSWORD,
  celebrate(ProfileSchema.changePassword),
  profileController.changePassword
);

module.exports = profileRouter;