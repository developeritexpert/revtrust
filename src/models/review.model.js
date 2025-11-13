const mongoose = require('mongoose');
const CONSTANT_ENUM = require('../helper/constant-enums');

const reviewSchema = new mongoose.Schema(
  {
    reviewTitle: { type: String, required: true, trim: true },
    reviewBody: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phoneNumber: { type: String, trim: true },
    orderId: { type: String, trim: true },

    reviewType: { type: String, enum: ['Product', 'Brand'], required: true },

    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },

    shopifyProductId: { type: String, default: null },

    status: {
      type: String,
      enum: Object.values(CONSTANT_ENUM.REVIEW_STATUS),
      default: CONSTANT_ENUM.REVIEW_STATUS.INACTIVE,
    },

    product_store_rating: { type: Number, min: 0, max: 5 },
    seller_rating: { type: Number, min: 0, max: 5 },
    product_quality_rating: { type: Number, min: 0, max: 5 },
    product_price_rating: { type: Number, min: 0, max: 5 },
    issue_handling_rating: { type: Number, min: 0, max: 5 },

    privacy_policy: { type: Boolean, required: true },
    term_and_condition: { type: Boolean, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
