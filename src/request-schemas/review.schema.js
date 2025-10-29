const { Joi, Segments } = require('celebrate');
const mongoose = require('mongoose');

const objectIdValidation = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid ID format');
  }
  return value;
};

const addReview = {
  [Segments.BODY]: Joi.object()
    .keys({
      reviewTitle: Joi.string().trim().min(2).max(200).required().messages({
        'string.empty': 'Review title is required',
        'string.min': 'Review title must be at least 2 characters',
      }),
      reviewBody: Joi.string().trim().required().messages({
        'string.empty': 'Review body is required',
      }),
      rating: Joi.number().min(1).max(5).required().messages({
        'number.base': 'Rating must be a number',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot be more than 5',
      }),
      name: Joi.string().trim().required().messages({
        'string.empty': 'Name is required',
      }),
      email: Joi.string().trim().email().required().messages({
        'string.email': 'Email must be a valid email address',
        'string.empty': 'Email is required',
      }),
      reviewType: Joi.string().valid('Product', 'Brand').required().messages({
        'any.only': 'Review type must be either "Product" or "Brand"',
        'any.required': 'Review type is required',
      }),
      orderId: Joi.string().trim().optional().allow('', null),
      phoneNumber: Joi.string().trim().optional().allow('', null),
      productId: Joi.string()
        .custom(objectIdValidation)
        .when('reviewType', { is: 'Product', then: Joi.required().messages({ 'any.required': 'Product ID is required for product reviews' }) }),
      brandId: Joi.string()
        .custom(objectIdValidation)
        .when('reviewType', { is: 'Brand', then: Joi.required().messages({ 'any.required': 'Brand ID is required for brand reviews' }) }),
      status: Joi.string().valid('ACTIVE', 'INACTIVE').default('INACTIVE'),
    })
    .required(),
};

const updateReview = {
  [Segments.BODY]: Joi.object()
    .keys({
      reviewTitle: Joi.string().trim().min(2).max(200).optional(),
      reviewBody: Joi.string().trim().optional().allow('', null),
      rating: Joi.number().min(1).max(5).optional(),
      name: Joi.string().trim().optional(),
      email: Joi.string().trim().email().optional(),
      reviewType: Joi.string().valid('Product', 'Brand').required(),
      orderId: Joi.string().trim().optional().allow('', null),
      phoneNumber: Joi.string().trim().optional().allow('', null),
      productId: Joi.string()
        .custom(objectIdValidation)
        .when('reviewType', { is: 'Product', then: Joi.required().messages({ 'any.required': 'Product ID is required for product reviews' }) }),
      brandId: Joi.string()
        .custom(objectIdValidation)
        .when('reviewType', { is: 'Brand', then: Joi.required().messages({ 'any.required': 'Brand ID is required for brand reviews' }) }),
      status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
    })
    .required(),
};

const idParam = {
  [Segments.PARAMS]: Joi.object({
    id: Joi.string().custom(objectIdValidation).required(),
  }),
};

module.exports = {
  addReview,
  updateReview,
  idParam,
};
