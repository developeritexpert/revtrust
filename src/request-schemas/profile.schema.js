const { Joi, Segments } = require('celebrate');

const ProfileSchema = {
  updateProfile: {
    [Segments.BODY]: Joi.object({
      name: Joi.string().trim().min(2).max(100).optional().messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 100 characters',
      }),
      email: Joi.string().email().lowercase().trim().optional().messages({
        'string.email': 'Please provide a valid email address',
      }),
      phoneNumber: Joi.string().trim().allow('').optional().messages({
        'string.base': 'Phone number must be a string',
      }),
      avatar: Joi.string().optional(), // Added by multer/cloudinary
    }),
  },

  changePassword: {
    [Segments.BODY]: Joi.object({
      currentPassword: Joi.string().required().messages({
        'string.empty': 'Current password is required',
        'any.required': 'Current password is required',
      }),
      newPassword: Joi.string().min(6).required().messages({
        'string.empty': 'New password is required',
        'any.required': 'New password is required',
        'string.min': 'New password must be at least 6 characters',
      }),
    }),
  },
};

module.exports = ProfileSchema;