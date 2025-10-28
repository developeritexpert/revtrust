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
      required: true,
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
  },
  {
    timestamps: true,
  }
);

brandSchema.index({ name: 1 }, { unique: true });
brandSchema.index({ email: 1 }, { unique: true });

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;
