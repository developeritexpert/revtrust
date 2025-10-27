const { Joi, Segments } = require('celebrate');
const mongoose = require('mongoose');

const objectIdValidation = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid ID format');
  }
  return value;
};

const addBrand = {
  [Segments.BODY]: Joi.object()
    .keys({
      name: Joi.string().trim().min(2).max(100).required().messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters',
        'any.required': 'Name is required',
      }),
      email: Joi.string().trim().email().required().messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required',
      }),
      phoneNumber: Joi.string().trim().required().messages({
        'string.empty': 'Phone number is required',
        'any.required': 'Phone number is required',
      }),
      logoUrl: Joi.string().trim().uri().optional().messages({
        'string.uri': 'Logo URL must be a valid URL',
      }),
      websiteUrl: Joi.string().trim().uri().required().messages({
        'string.uri': 'Website URL must be a valid URL',
        'any.required': 'Website URL is required',
      }),
      description: Joi.string().trim().optional(),
      status: Joi.string().valid('active', 'inactive').default('active').messages({
        'any.only': 'Status must be either "active" or "inactive"',
      }),
      postcode: Joi.string().trim().required().messages({
        'string.empty': 'Postcode is required',
        'any.required': 'Postcode is required',
      }),
    })
    .required(),
};

const updateBrand = {
  [Segments.BODY]: Joi.object()
    .keys({
      name: Joi.string().trim().min(2).max(100).optional().messages({
        'string.base': 'Name must be a string',
        'string.min': 'Name must be at least 2 characters',
      }),
      email: Joi.string().trim().email().optional().messages({
        'string.email': 'Email must be a valid email address',
      }),
      phoneNumber: Joi.string().trim().optional(),
      logoUrl: Joi.string().trim().uri().optional().messages({
        'string.uri': 'Logo URL must be a valid URL',
      }),
      websiteUrl: Joi.string().trim().uri().optional().messages({
        'string.uri': 'Website URL must be a valid URL',
      }),
      description: Joi.string().trim().optional(),
      status: Joi.string().valid('active', 'inactive').optional().messages({
        'any.only': 'Status must be either "active" or "inactive"',
      }),
      postcode: Joi.string().trim().optional(),
    })
    .required(),
};

const idParam = {
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().custom(objectIdValidation).required(),
  }),
};

module.exports = {
  addBrand,
  updateBrand,
  idParam,
};
