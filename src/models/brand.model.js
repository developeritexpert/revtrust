const mongoose = require('mongoose');
const CONSTANT_ENUM = require('../helper/constant-enums');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    logoUrl: {
      type: String,
      required: false,
      trim: true,
    },
    websiteUrl: {
      type: String,
      required: false,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
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
  },
  {
    timestamps: true,
  }
);

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;
