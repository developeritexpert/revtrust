const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const ProfileService = require('../../services/profile/profile.service');
const { ErrorHandler } = require('../../utils/error-handler');

const getImageUrl = (req) => req.file?.cloudinaryUrl || req.file?.path;

// Get current authenticated user's profile
const getProfile = wrapAsync(async (req, res) => {
  const userId = req.userId; // Set by checkAuth middleware
  console.log(userId);
  const result = await ProfileService.getProfile(userId);
  console.log(result);
  sendResponse(res, result, 'Profile fetched successfully', 200);
});

// Update current authenticated user's profile
const updateProfile = wrapAsync(async (req, res) => {
  const userId = req.userId;
  const updateData = req.body;
  
  // Add avatar URL if file was uploaded
  if (req.file) {
    updateData.avatar = getImageUrl(req);
  }
  
  const result = await ProfileService.updateProfile(userId, updateData);
  sendResponse(res, result, 'Profile updated successfully', 200);
});

// Change current authenticated user's password
const changePassword = wrapAsync(async (req, res) => {
  const userId = req.userId;
  const { currentPassword, newPassword } = req.body;
  
  await ProfileService.changePassword(userId, currentPassword, newPassword);
  sendResponse(res, null, 'Password changed successfully', 200);
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};