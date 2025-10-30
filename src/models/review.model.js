const mongoose = require('mongoose');
const CONSTANT_ENUM = require('../helper/constant-enums');

const reviewSchema = new mongoose.Schema(
  {
    reviewTitle: {
      type: String,
      required: true,
      trim: true,
    },
    reviewBody: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    orderId: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    reviewType: {
      type: String,
      enum: ['Product', 'Brand'],
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: function () {
        return this.reviewType === 'Product';
      },
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: function () {
        return this.reviewType === 'Brand';
      },
    },
    status: {
      type: String,
      enum: Object.values(CONSTANT_ENUM.REVIEW_STATUS),
      default: CONSTANT_ENUM.REVIEW_STATUS.INACTIVE, 
    },
    product_store_rating: { type: Number, required: true, min: 0, max: 5 },
    seller_rating: { type: Number, required: true, min: 0, max: 5 },
    product_quality_rating: { type: Number, required: true, min: 0, max: 5 },
    product_price_rating: { type: Number, required: true, min: 0, max: 5 },
    issue_handling_rating: { type: Number, required: false, min: 0, max: 5 },
    privacy_policy: {
      type: Boolean,
      required: true,
      validate: {
        validator: (v) => v === true,
        message: 'Privacy policy must be accepted',
      },
    },
    term_and_condition: {
      type: Boolean,
      required: true,
      validate: {
        validator: (v) => v === true,
        message: 'Terms and conditions must be accepted',
      },
    },

  },
  {
    timestamps: true,
  }
);

/**
 * Helper: Adjust totalReviews count
 */
async function adjustReviewCount(doc, increment) {
  if (!doc) return;

  if (doc.reviewType === 'Product') {
    const Product = mongoose.model('Product');
    await Product.findByIdAndUpdate(doc.productId, {
      $inc: { totalReviews: increment },
    });
  } else if (doc.reviewType === 'Brand') {
    const Brand = mongoose.model('Brand');
    await Brand.findByIdAndUpdate(doc.brandId, {
      $inc: { totalReviews: increment },
    });
  }
}

/**
 * Post-update hook:
 * If review status changed from INACTIVE → ACTIVE, increase count.
 * If ACTIVE → INACTIVE, decrease count.
 */
reviewSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc) return;

  // Get the previous and new values of status
  const update = this.getUpdate();
  const newStatus = update.status;
  const oldStatus = doc.status;

  if (!newStatus || newStatus === oldStatus) return;

  // Status changed
  if (oldStatus === CONSTANT_ENUM.REVIEW_STATUS.INACTIVE && newStatus === CONSTANT_ENUM.REVIEW_STATUS.ACTIVE) {
    await adjustReviewCount(doc, 1);
  } else if (oldStatus === CONSTANT_ENUM.REVIEW_STATUS.ACTIVE && newStatus === CONSTANT_ENUM.REVIEW_STATUS.INACTIVE) {
    await adjustReviewCount(doc, -1);
  }
});

/**
 * Post-remove hook:
 * If review is deleted and was ACTIVE, decrement totalReviews.
 */
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc && doc.status === CONSTANT_ENUM.REVIEW_STATUS.ACTIVE) {
    await adjustReviewCount(doc, -1);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
