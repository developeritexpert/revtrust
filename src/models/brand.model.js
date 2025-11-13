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
    // ✅ NEW: Rating distribution for brands (same as products)
    ratingDistribution: {
      type: Map,
      of: Number,
      required: false,
      default: undefined,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ PRIMARY: Virtual for average rating with 1 decimal place
brandSchema.virtual('averageRating').get(function () {
  if (!this.totalReviews || this.totalReviews === 0) return 0;
  return parseFloat((this.totalRating / this.totalReviews).toFixed(1));
});

// ✅ ALIAS: For backward compatibility
brandSchema.virtual('roundedOverall').get(function () {
  if (!this.totalReviews || this.totalReviews === 0) return 0;
  return parseFloat((this.totalRating / this.totalReviews).toFixed(1));
});

// ✅ Rounded rating (whole number)
brandSchema.virtual('roundedRating').get(function () {
  if (!this.totalReviews || this.totalReviews === 0) return 0;
  return Math.round(this.totalRating / this.totalReviews);
});

// ✅ Virtual for rating counts object
brandSchema.virtual('ratingCounts').get(function () {
  if (!this.ratingDistribution || this.ratingDistribution.size === 0) {
    return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  }
  return {
    5: this.ratingDistribution.get('5') || 0,
    4: this.ratingDistribution.get('4') || 0,
    3: this.ratingDistribution.get('3') || 0,
    2: this.ratingDistribution.get('2') || 0,
    1: this.ratingDistribution.get('1') || 0,
  };
});

// ✅ Virtual populate for reviews
brandSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'brandId',
  match: { reviewType: 'Brand' },
});

// ✅ Virtual populate for products
brandSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'brandId',
});

// ✅ Indexes
brandSchema.index({ name: 1 }, { unique: true });
brandSchema.index({ email: 1 }, { unique: true });

// ✅ CASCADE DELETE: When brand is deleted, delete all products and reviews
brandSchema.pre('findOneAndDelete', async function (next) {
  try {
    const brandId = this.getQuery()._id;
    
    if (!brandId) {
      console.log('⚠️ No brand ID found in delete query');
      return next();
    }

    const Product = mongoose.model('Product');
    const Review = mongoose.model('Review');

    // Step 1: Find all products for this brand
    const products = await Product.find({ brandId: brandId }).select('_id');
    const productIds = products.map(p => p._id);

    console.log(`🗑️ CASCADE DELETE: Found ${products.length} product(s) for brand ${brandId}`);

    // Step 2: Delete all reviews for these products (Product reviews)
    if (productIds.length > 0) {
      const productReviewsResult = await Review.deleteMany({ 
        productId: { $in: productIds },
        reviewType: 'Product'
      });
      console.log(`🗑️ CASCADE DELETE: Removed ${productReviewsResult.deletedCount} product review(s)`);
    }

    // Step 3: Delete all reviews directly for this brand (Brand reviews)
    const brandReviewsResult = await Review.deleteMany({ 
      brandId: brandId,
      reviewType: 'Brand'
    });
    console.log(`🗑️ CASCADE DELETE: Removed ${brandReviewsResult.deletedCount} brand review(s)`);

    // Step 4: Delete all products
    if (productIds.length > 0) {
      const productsResult = await Product.deleteMany({ brandId: brandId });
      console.log(`🗑️ CASCADE DELETE: Removed ${productsResult.deletedCount} product(s)`);
    }

    console.log(`✅ CASCADE DELETE COMPLETE for brand ${brandId}`);
    
    next();
  } catch (error) {
    console.error('❌ Error in brand cascade delete:', error);
    next(error);
  }
});

// ✅ CASCADE DELETE: Handle deleteOne (document method)
brandSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    const Product = mongoose.model('Product');
    const Review = mongoose.model('Review');

    const products = await Product.find({ brandId: this._id }).select('_id');
    const productIds = products.map(p => p._id);

    console.log(`🗑️ CASCADE DELETE: Found ${products.length} product(s) for brand ${this._id}`);

    if (productIds.length > 0) {
      const productReviewsResult = await Review.deleteMany({ 
        productId: { $in: productIds },
        reviewType: 'Product'
      });
      console.log(`🗑️ CASCADE DELETE: Removed ${productReviewsResult.deletedCount} product review(s)`);
    }

    const brandReviewsResult = await Review.deleteMany({ 
      brandId: this._id,
      reviewType: 'Brand'
    });
    console.log(`🗑️ CASCADE DELETE: Removed ${brandReviewsResult.deletedCount} brand review(s)`);

    if (productIds.length > 0) {
      const productsResult = await Product.deleteMany({ brandId: this._id });
      console.log(`🗑️ CASCADE DELETE: Removed ${productsResult.deletedCount} product(s)`);
    }

    console.log(`✅ CASCADE DELETE COMPLETE for brand ${this._id}`);
    
    next();
  } catch (error) {
    console.error('❌ Error in brand cascade delete:', error);
    next(error);
  }
});

// ✅ CASCADE DELETE: Handle deleteMany (bulk delete)
brandSchema.pre('deleteMany', async function (next) {
  try {
    const query = this.getQuery();
    
    const Brand = this.model;
    const brandsToDelete = await Brand.find(query).select('_id');
    const brandIds = brandsToDelete.map(b => b._id);
    
    if (brandIds.length === 0) {
      console.log('⚠️ No brands found to delete');
      return next();
    }

    console.log(`🗑️ CASCADE DELETE (BULK): Deleting ${brandIds.length} brand(s)`);

    const Product = mongoose.model('Product');
    const Review = mongoose.model('Review');

    // Find all products for these brands
    const products = await Product.find({ brandId: { $in: brandIds } }).select('_id');
    const productIds = products.map(p => p._id);

    console.log(`🗑️ CASCADE DELETE (BULK): Found ${products.length} product(s)`);

    // Delete product reviews
    if (productIds.length > 0) {
      const productReviewsResult = await Review.deleteMany({ 
        productId: { $in: productIds },
        reviewType: 'Product'
      });
      console.log(`🗑️ CASCADE DELETE (BULK): Removed ${productReviewsResult.deletedCount} product review(s)`);
    }

    // Delete brand reviews
    const brandReviewsResult = await Review.deleteMany({ 
      brandId: { $in: brandIds },
      reviewType: 'Brand'
    });
    console.log(`🗑️ CASCADE DELETE (BULK): Removed ${brandReviewsResult.deletedCount} brand review(s)`);

    // Delete products
    if (productIds.length > 0) {
      const productsResult = await Product.deleteMany({ brandId: { $in: brandIds } });
      console.log(`🗑️ CASCADE DELETE (BULK): Removed ${productsResult.deletedCount} product(s)`);
    }

    console.log(`✅ CASCADE DELETE (BULK) COMPLETE`);
    
    next();
  } catch (error) {
    console.error('❌ Error in brand cascade delete (bulk):', error);
    next(error);
  }
});

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;