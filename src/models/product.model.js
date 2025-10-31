const mongoose = require('mongoose');

const CONSTANT_ENUM = require('../helper/constant-enums');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    handle: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand', 
      required: true,
    },
    image: {
      type: String,
      trim: true,
      required: false,
      // Example: "https://cdn.shop.com/images/nike-air-max.jpg"
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalRating: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(CONSTANT_ENUM.PRODUCT_STATUS),
      default: CONSTANT_ENUM.PRODUCT_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('averageRating').get(function () {
  if (!this.totalReviews || this.totalReviews === 0) return 0;
  return Math.round((this.totalRating / this.totalReviews) * 10) / 10;
});

productSchema.pre('save', function (next) {
  this.inStock = this.stockQuantity > 0;
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
