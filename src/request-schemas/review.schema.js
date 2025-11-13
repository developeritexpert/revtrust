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
      product_store_rating: Joi.number().min(0).max(5).required().messages({
        'number.base': 'Store rating must be a number',
        'number.min': 'Store rating must be at least 0',
        'number.max': 'Store rating cannot be more than 5',
      }),
      seller_rating: Joi.number().min(0).max(5).required().messages({
        'number.base': 'Seller Rating must be a number',
        'number.min': 'Seller Rating must be at least 0',
        'number.max': 'Seller Rating cannot be more than 5',
      }),
      product_quality_rating: Joi.number().min(0).max(5).required().messages({
        'number.base': 'Quality Rating must be a number',
        'number.min': 'Quality Rating must be at least 0',
        'number.max': 'Quality Rating cannot be more than 5',
      }),
      product_price_rating: Joi.number().min(0).max(5).required().messages({
        'number.base': 'Price Rating must be a number',
        'number.min': 'Price Rating must be at least 0',
        'number.max': 'Price Rating cannot be more than 5',
      }),
      issue_handling_rating: Joi.number().min(0).max(5).optional().default(0).messages({
        'number.base': 'Issue handling rating must be a number',
        'number.min': 'Issue handling rating must be at least 0',
        'number.max': 'Issue handling rating cannot be more than 5',
      }),
      name: Joi.string().trim().required().messages({
        'string.empty': 'Name is required',
      }),
      email: Joi.string().trim().email().required().messages({
        'string.email': 'Email must be a valid email address',
        'string.empty': 'Email is required',
      }),
      reviewType: Joi.string()
      .trim()
      .valid('Product', 'Brand')
      .insensitive()
      .required()
      .messages({
        'any.only': 'Review type must be either "Product" or "Brand"',
        'any.required': 'Review type is required',
      }),

      privacy_policy: Joi.boolean().required(),
      term_and_condition: Joi.boolean().required(),

      orderId: Joi.string().trim().optional().allow('', null),
      phoneNumber: Joi.string().trim().optional().allow('', null),
      // ✅ NEW FIELD
      shopifyProductId: Joi.string().trim().optional().allow('', null).messages({
        'string.base': 'Shopify ID must be a string',
      }),
      productId: Joi.string()
      .custom(objectIdValidation)
      .allow('', null)
      .optional(), // ✅ changed
      brandId: Joi.string()
        .custom(objectIdValidation)
        .allow('', null)
        .when('reviewType', { 
          is: Joi.valid('Brand'), 
          then: Joi.required().messages({ 'any.required': 'Brand ID is required for brand reviews' }) 
        })
        .when('reviewType', { 
          is: 'Product', 
          then: Joi.required().messages({ 'any.required': 'Brand ID is required when selecting a product' }) 
        }),

      status: Joi.string().valid('ACTIVE', 'INACTIVE').default('INACTIVE'),
    })
    .custom((value, helpers) => {
      if (value.reviewType === 'Product') {
        const hasProductId = value.productId && value.productId.trim() !== '';
        const hasShopifyId = value.shopifyProductId && value.shopifyProductId.trim() !== '';
    
        if (!hasProductId && !hasShopifyId) {
          return helpers.message('Either productId or shopifyProductId is required');
        }
    
        if (hasProductId && hasShopifyId) {
          return helpers.message('Provide only one: either productId or shopifyProductId (not both)');
        }
    
        if (!value.brandId || value.brandId.trim() === '') {
          return helpers.message('Brand ID is required when selecting a product');
        }
      }
      return value;
    })
    
    
    
    .required(),
};

const updateReview = {
  [Segments.BODY]: Joi.object()
    .keys({
      reviewTitle: Joi.string().trim().min(2).max(200).optional(),
      reviewBody: Joi.string().trim().optional().allow('', null),
      product_store_rating: Joi.number().min(0).max(5).optional(),
      seller_rating: Joi.number().min(0).max(5).optional(),
      product_quality_rating: Joi.number().min(0).max(5).optional(),
      product_price_rating: Joi.number().min(0).max(5).optional(),
      issue_handling_rating: Joi.number().min(0).max(5).optional().default(0),
      name: Joi.string().trim().optional(),
      email: Joi.string().trim().email().optional(),
      reviewType: Joi.string().valid('Product', 'Brand').required(),
      orderId: Joi.string().trim().optional().allow('', null),
      phoneNumber: Joi.string().trim().optional().allow('', null),
      // ✅ NEW FIELD
      shopifyProductId: Joi.string().trim().optional().allow('', null).messages({
        'string.base': 'Shopify ID must be a string',
      }),
    productId: Joi.string()
    .allow('', null)
    .trim()
    .empty('')        // Treat empty string as missing
    .default(null)    // Replace it with null
    .custom(objectIdValidation)
    .optional(),

      // productId: Joi.alternatives().try(
      //   Joi.valid(null, ''), // allow empty or null
      //   Joi.string().trim().custom(objectIdValidation) // validate only if not empty
      // ).optional(),


      brandId: Joi.string()
      .custom(objectIdValidation)
      .allow('', null)
      .when('reviewType', { 
        is: Joi.valid('Brand'), 
        then: Joi.required().messages({ 'any.required': 'Brand ID is required for brand reviews' }) 
      })
      .when('reviewType', { 
        is: 'Product', 
        then: Joi.required().messages({ 'any.required': 'Brand ID is required when selecting a product' }) 
      }),

      status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
      privacy_policy: Joi.boolean().required(),
      term_and_condition: Joi.boolean().required(),

    })
    .custom((value, helpers) => {
      if (value.reviewType === 'Product') {
        const hasProductId = value.productId && value.productId.trim() !== '';
        const hasShopifyId = value.shopifyProductId && value.shopifyProductId.trim() !== '';
    
        if (!hasProductId && !hasShopifyId) {
          return helpers.message('Either productId or shopifyProductId is required');
        }
    
        if (hasProductId && hasShopifyId) {
          return helpers.message('Provide only one: either productId or shopifyProductId (not both)');
        }
    
        if (!value.brandId || value.brandId.trim() === '') {
          return helpers.message('Brand ID is required when selecting a product');
        }
      }
      return value;
    })
    
    

    .required(),
};
const updateReviewStatus = {
  [Segments.BODY]: Joi.object({
    status: Joi.string().valid('ACTIVE', 'INACTIVE').required(),
  }),
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
  updateReviewStatus,
};
