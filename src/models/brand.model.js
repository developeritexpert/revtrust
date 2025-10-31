const mongoose = require('mongoose');
const CONSTANT_ENUM = require('../helper/constant-enums');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, 
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true, 
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    websiteUrl: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(CONSTANT_ENUM.PRODUCT_STATUS),
      default: CONSTANT_ENUM.PRODUCT_STATUS.ACTIVE,
    },
    postcode: {
      type: String,
      required: true,
      trim: true,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalRating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }

);

brandSchema.virtual('averageRating').get(function () {
  if (!this.totalReviews || this.totalReviews === 0) return 0;
  return Math.round((this.totalRating / this.totalReviews) * 10) / 10;
});

brandSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'brandId',
  match: { reviewType: 'Brand' },
});

brandSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'brandId',
});

brandSchema.index({ name: 1 }, { unique: true });
brandSchema.index({ email: 1 }, { unique: true });

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;
