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
        return this.reviewType === 'Product' && !this.shopifyProductId;
      },
    },    
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: function () {
        return this.reviewType === 'Brand';
      },
    },

    shopifyProductId: { type: String, default: null },

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
  { timestamps: true }
);

reviewSchema.virtual('reviewAverage').get(function () {
  const ratings = [
    this.product_store_rating,
    this.seller_rating,
    this.product_quality_rating,
    this.product_price_rating,
    this.issue_handling_rating
  ].filter(r => typeof r === 'number' && r > 0);

  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  return sum / ratings.length;
});

/**
 * ✅ UPDATED: Adjust totalReviews, totalRating, AND ratingDistribution
 */
async function adjustReviewStats(doc, increment, ratingDiff = 0) {
  if (!doc) return;

  const ratings = [
    doc.product_store_rating,
    doc.seller_rating,
    doc.product_quality_rating,
    doc.product_price_rating,
    doc.issue_handling_rating
  ].filter(r => typeof r === 'number' && r > 0);

  const reviewAverage = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    : 0;

  // ✅ Calculate rounded rating for distribution
  const roundedRating = Math.round(reviewAverage);

  const update = {
    $inc: {
      totalReviews: increment,
      totalRating: ratingDiff || reviewAverage * increment,
    },
  };

  // ✅ Update rating distribution
  if (increment !== 0 && roundedRating >= 1 && roundedRating <= 5) {
    const distributionKey = `ratingDistribution.${roundedRating}`;
    update.$inc[distributionKey] = increment;
  }

  if (doc.reviewType === 'Product') {
    const Product = mongoose.model('Product');
    const result = await Product.findByIdAndUpdate(doc.productId, update, { new: true });
    
    console.log('📊 Product rating updated:', {
      reviewAverage: reviewAverage.toFixed(1),
      roundedRating,
      totalRating: result?.totalRating,
      totalReviews: result?.totalReviews,
      ratingDistribution: result?.ratingDistribution
    });
  } else if (doc.reviewType === 'Brand') {
    const Brand = mongoose.model('Brand');
    await Brand.findByIdAndUpdate(doc.brandId, update);
  }
}

function calculateReviewAverage(doc) {
  const ratings = [
    doc.product_store_rating,
    doc.seller_rating,
    doc.product_quality_rating,
    doc.product_price_rating,
    doc.issue_handling_rating
  ].filter(r => typeof r === 'number' && r > 0);

  if (ratings.length === 0) return 0;
  return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
}

reviewSchema.post('save', async function (doc) {
  if (!doc) return;
  if (doc.status === CONSTANT_ENUM.REVIEW_STATUS.ACTIVE) {
    await adjustReviewStats(doc, 1);
  }
});

reviewSchema.pre('findOneAndUpdate', async function (next) {
  const docToUpdate = await this.model.findOne(this.getQuery());
  
  if (docToUpdate) {
    this._oldDoc = {
      status: docToUpdate.status,
      product_store_rating: docToUpdate.product_store_rating,
      seller_rating: docToUpdate.seller_rating,
      product_quality_rating: docToUpdate.product_quality_rating,
      product_price_rating: docToUpdate.product_price_rating,
      issue_handling_rating: docToUpdate.issue_handling_rating,
      reviewType: docToUpdate.reviewType,
      productId: docToUpdate.productId,
      brandId: docToUpdate.brandId,
    };
  }
  next();
});

reviewSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc || !this._oldDoc) return;

  const update = this.getUpdate();
  const updateSet = update.$set || update;
  const newStatus = updateSet.status;
  const oldStatus = this._oldDoc.status;

  const oldDoc = {
    reviewType: this._oldDoc.reviewType,
    productId: this._oldDoc.productId,
    brandId: this._oldDoc.brandId,
    product_store_rating: this._oldDoc.product_store_rating,
    seller_rating: this._oldDoc.seller_rating,
    product_quality_rating: this._oldDoc.product_quality_rating,
    product_price_rating: this._oldDoc.product_price_rating,
    issue_handling_rating: this._oldDoc.issue_handling_rating,
  };

  const newDoc = {
    reviewType: doc.reviewType,
    productId: doc.productId,
    brandId: doc.brandId,
    product_store_rating: doc.product_store_rating,
    seller_rating: doc.seller_rating,
    product_quality_rating: doc.product_quality_rating,
    product_price_rating: doc.product_price_rating,
    issue_handling_rating: doc.issue_handling_rating,
  };

  const finalStatus = newStatus !== undefined ? newStatus : oldStatus;

  if (
    oldStatus === CONSTANT_ENUM.REVIEW_STATUS.INACTIVE &&
    newStatus === CONSTANT_ENUM.REVIEW_STATUS.ACTIVE
  ) {
    await adjustReviewStats(newDoc, 1);
  }
  else if (
    oldStatus === CONSTANT_ENUM.REVIEW_STATUS.ACTIVE &&
    newStatus === CONSTANT_ENUM.REVIEW_STATUS.INACTIVE
  ) {
    await adjustReviewStats(oldDoc, -1);
  }
  else if (finalStatus === CONSTANT_ENUM.REVIEW_STATUS.ACTIVE) {
    const ratingsChanged = 
      doc.product_store_rating !== oldDoc.product_store_rating ||
      doc.seller_rating !== oldDoc.seller_rating ||
      doc.product_quality_rating !== oldDoc.product_quality_rating ||
      doc.product_price_rating !== oldDoc.product_price_rating ||
      doc.issue_handling_rating !== oldDoc.issue_handling_rating;

    if (ratingsChanged) {
      const oldAvg = calculateReviewAverage(oldDoc);
      const newAvg = calculateReviewAverage(newDoc);
      const ratingDiff = newAvg - oldAvg;
      
      await adjustReviewStats(newDoc, 0, ratingDiff);
    }
  }
});

reviewSchema.pre('findOneAndDelete', async function (next) {
  const docToDelete = await this.model.findOne(this.getQuery());
  
  if (docToDelete) {
    this._oldDoc = {
      status: docToDelete.status,
      product_store_rating: docToDelete.product_store_rating,
      seller_rating: docToDelete.seller_rating,
      product_quality_rating: docToDelete.product_quality_rating,
      product_price_rating: docToDelete.product_price_rating,
      issue_handling_rating: docToDelete.issue_handling_rating,
      reviewType: docToDelete.reviewType,
      productId: docToDelete.productId,
      brandId: docToDelete.brandId,
    };
  }
  next();
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (!doc || !this._oldDoc) return;
  
  if (this._oldDoc.status === CONSTANT_ENUM.REVIEW_STATUS.ACTIVE) {
    await adjustReviewStats(this._oldDoc, -1);
  }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;