const { Joi, Segments } = require('celebrate');
const mongoose = require('mongoose');

const objectIdValidation = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid ID format');
  }
  return value;
};

const addProduct = {
  [Segments.BODY]: Joi.object()
    .keys({
      name: Joi.string().trim().min(2).max(200).required().messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name must not exceed 200 characters',
        'any.required': 'Name is required',
      }),
      handle: Joi.string().trim().lowercase().min(2).max(200).required().messages({
        'string.base': 'Handle must be a string',
        'string.empty': 'Handle is required',
        'string.min': 'Handle must be at least 2 characters',
        'string.max': 'Handle must not exceed 200 characters',
        'any.required': 'Handle is required',
      }),
      brandId: Joi.string().custom(objectIdValidation).required().messages({
        'any.required': 'Brand ID is required',
      }),
      image: Joi.string().trim().uri().optional().allow('').messages({
        'string.uri': 'Image must be a valid URL',
      }),
      price: Joi.number().min(0).required().messages({
        'number.base': 'Price must be a number',
        'number.min': 'Price must be at least 0',
        'any.required': 'Price is required',
      }),
      stockQuantity: Joi.number().integer().min(0).required().messages({
        'number.base': 'Stock quantity must be a number',
        'number.integer': 'Stock quantity must be an integer',
        'number.min': 'Stock quantity must be at least 0',
        'any.required': 'Stock quantity is required',
      }),
      status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE').messages({
        'any.only': 'Status must be either "ACTIVE" or "INACTIVE"',
      }),
    })
    .required(),
};

const updateProduct = {
  [Segments.BODY]: Joi.object()
    .keys({
      name: Joi.string().trim().min(2).max(200).optional().messages({
        'string.base': 'Name must be a string',
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name must not exceed 200 characters',
      }),
      handle: Joi.string().trim().lowercase().min(2).max(200).optional().messages({
        'string.base': 'Handle must be a string',
        'string.min': 'Handle must be at least 2 characters',
        'string.max': 'Handle must not exceed 200 characters',
      }),
      brandId: Joi.string().custom(objectIdValidation).optional(),
      image: Joi.string().trim().uri().optional().allow('').messages({
        'string.uri': 'Image must be a valid URL',
      }),
      price: Joi.number().min(0).optional().messages({
        'number.base': 'Price must be a number',
        'number.min': 'Price must be at least 0',
      }),
      stockQuantity: Joi.number().integer().min(0).optional().messages({
        'number.base': 'Stock quantity must be a number',
        'number.integer': 'Stock quantity must be an integer',
        'number.min': 'Stock quantity must be at least 0',
      }),
      status: Joi.string().valid('ACTIVE', 'INACTIVE').optional().messages({
        'any.only': 'Status must be either "ACTIVE" or "INACTIVE"',
      }),
    })
    .min(1)
    .required()
    .messages({
      'object.min': 'At least one field must be provided for update',
    }),
};

const idParam = {
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().custom(objectIdValidation).required(),
  }),
};

module.exports = {
  addProduct,
  updateProduct,
  idParam,
};