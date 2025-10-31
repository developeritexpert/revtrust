const mongoose = require('mongoose');
const CONSTANT_ENUM = require('../helper/constant-enums');

const reviewSchema = new mongoose.Schema(
  {
    reviewTitle: { type: String, required: true, trim: true },
    reviewBody: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    orderId: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    reviewType: { type: String, enum: ['Product', 'Brand'], required: true },
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

    // Ratings
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
  { timestamps: true }
);

/**
 * Helper: Adjust totalReviews & totalRating
 * - Only counts ACTIVE reviews
 * - Uses product_store_rating as the overall rating
 */
async function adjustReviewStats(doc, increment, ratingDiff = 0) {
  if (!doc) return;

  const update = {
    $inc: {
      totalReviews: increment,
      totalRating: ratingDiff || (doc.product_store_rating || 0) * increment,
    },
  };

  if (doc.reviewType === 'Product') {
    const Product = mongoose.model('Product');
    await Product.findByIdAndUpdate(doc.productId, update);
  } else if (doc.reviewType === 'Brand') {
    const Brand = mongoose.model('Brand');
    await Brand.findByIdAndUpdate(doc.brandId, update);
  }
}

/**
 * Post-save hook:
 * If review is ACTIVE, increment stats
 */
reviewSchema.post('save', async function (doc) {
  if (!doc) return;
  if (doc.status === CONSTANT_ENUM.REVIEW_STATUS.ACTIVE) {
    await adjustReviewStats(doc, 1);
  }
});

/**
 * Pre-update hook to store old values before update
 */
reviewSchema.pre('findOneAndUpdate', async function (next) {
  // Get the document before update
  const docToUpdate = await this.model.findOne(this.getQuery());
  
  if (docToUpdate) {
    // Store old values in the query context
    this._oldDoc = {
      status: docToUpdate.status,
      product_store_rating: docToUpdate.product_store_rating,
      reviewType: docToUpdate.reviewType,
      productId: docToUpdate.productId,
      brandId: docToUpdate.brandId,
    };
  }
  next();
});

/**
 * Post-update hook:
 * Handles:
 * - Status change (ACTIVE <-> INACTIVE)
 * - Rating value change (for ACTIVE reviews)
 * - Combined status + rating changes
 */
reviewSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc || !this._oldDoc) return;

  const update = this.getUpdate();
  
  // Extract new values (use $set if present, otherwise direct update)
  const updateSet = update.$set || update;
  const newStatus = updateSet.status;
  const newRating = updateSet.product_store_rating;
  
  // Get old values
  const oldStatus = this._oldDoc.status;
  const oldRating = this._oldDoc.product_store_rating;

  // Determine final status and rating
  const finalStatus = newStatus !== undefined ? newStatus : oldStatus;
  const finalRating = newRating !== undefined ? newRating : oldRating;

  // Case 1: Status changed from INACTIVE to ACTIVE
  if (
    oldStatus === CONSTANT_ENUM.REVIEW_STATUS.INACTIVE &&
    newStatus === CONSTANT_ENUM.REVIEW_STATUS.ACTIVE
  ) {
    // Add the review with its current rating
    await adjustReviewStats(
      { ...doc, product_store_rating: finalRating },
      1
    );
  }
  // Case 2: Status changed from ACTIVE to INACTIVE
  else if (
    oldStatus === CONSTANT_ENUM.REVIEW_STATUS.ACTIVE &&
    newStatus === CONSTANT_ENUM.REVIEW_STATUS.INACTIVE
  ) {
    // Remove the review with its old rating
    await adjustReviewStats(
      { ...doc, product_store_rating: oldRating },
      -1
    );
  }
  // Case 3: Status remains ACTIVE and rating changed
  else if (
    finalStatus === CONSTANT_ENUM.REVIEW_STATUS.ACTIVE &&
    newRating !== undefined &&
    newRating !== oldRating
  ) {
    // Only adjust the rating difference (no count change)
    const ratingDiff = newRating - oldRating;
    await adjustReviewStats(doc, 0, ratingDiff);
  }
  
  // Case 4: Both status and rating changed to ACTIVE with new rating
  // This is handled by Case 1 with finalRating
});

/**
 * Pre-delete hook to store values before deletion
 */
reviewSchema.pre('findOneAndDelete', async function (next) {
  const docToDelete = await this.model.findOne(this.getQuery());
  
  if (docToDelete) {
    this._oldDoc = {
      status: docToDelete.status,
      product_store_rating: docToDelete.product_store_rating,
      reviewType: docToDelete.reviewType,
      productId: docToDelete.productId,
      brandId: docToDelete.brandId,
    };
  }
  next();
});

/**
 * Post-delete hook:
 * If deleted review was ACTIVE, decrement stats
 */
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (!doc || !this._oldDoc) return;
  
  if (this._oldDoc.status === CONSTANT_ENUM.REVIEW_STATUS.ACTIVE) {
    await adjustReviewStats(
      {
        ...this._oldDoc,
        product_store_rating: this._oldDoc.product_store_rating,
      },
      -1
    );
  }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;