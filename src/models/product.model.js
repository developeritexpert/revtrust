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
    inStock: {
      type: Boolean,
      default: true,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalRating: {
      type: Number,
      default: 0,
    },
    ratingDistribution: {
      type: Map,
      of: Number,
      required: false,
      default: undefined,
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

// ✅ PRIMARY: Virtual for average rating with 1 decimal place (matches roundedOverall)
productSchema.virtual('averageRating').get(function () {
  if (!this.totalReviews || this.totalReviews === 0) return 0;
  return parseFloat((this.totalRating / this.totalReviews).toFixed(1));
});

// ✅ ALIAS: For backward compatibility - same as averageRating
productSchema.virtual('roundedOverall').get(function () {
  if (!this.totalReviews || this.totalReviews === 0) return 0;
  return parseFloat((this.totalRating / this.totalReviews).toFixed(1));
});

// ✅ DEPRECATED: Old rounded rating (whole number) - kept for backward compatibility
productSchema.virtual('roundedRating').get(function () {
  if (!this.totalReviews || this.totalReviews === 0) return 0;
  return Math.round(this.totalRating / this.totalReviews);
});

// ✅ Virtual for rating counts object (SAFE - handles missing data)
productSchema.virtual('ratingCounts').get(function () {
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

// ✅ Pre-save hook
productSchema.pre('save', function (next) {
  this.inStock = this.stockQuantity > 0;
  next();
});

// ✅ NEW: CASCADE DELETE - Delete all reviews when product is deleted (findOneAndDelete)
productSchema.pre('findOneAndDelete', async function (next) {
  try {
    const productId = this.getQuery()._id;
    
    if (!productId) {
      console.log('⚠️ No product ID found in delete query');
      return next();
    }

    // Delete all reviews associated with this product
    const Review = mongoose.model('Review');
    const deleteResult = await Review.deleteMany({ 
      productId: productId,
      reviewType: 'Product'
    });
    
    console.log(`🗑️ CASCADE DELETE: Removed ${deleteResult.deletedCount} review(s) for product ${productId}`);
    
    next();
  } catch (error) {
    console.error('❌ Error in cascade delete (findOneAndDelete):', error);
    next(error);
  }
});

// ✅ NEW: CASCADE DELETE - Delete all reviews when product is deleted (deleteOne - document middleware)
productSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    const Review = mongoose.model('Review');
    const deleteResult = await Review.deleteMany({ 
      productId: this._id,
      reviewType: 'Product'
    });
    
    console.log(`🗑️ CASCADE DELETE: Removed ${deleteResult.deletedCount} review(s) for product ${this._id}`);
    
    next();
  } catch (error) {
    console.error('❌ Error in cascade delete (deleteOne):', error);
    next(error);
  }
});

// ✅ NEW: CASCADE DELETE - Delete all reviews when using deleteMany
productSchema.pre('deleteMany', async function (next) {
  try {
    const query = this.getQuery();
    
    // Find all products that match the delete query
    const Product = this.model;
    const productsToDelete = await Product.find(query).select('_id');
    const productIds = productsToDelete.map(p => p._id);
    
    if (productIds.length === 0) {
      console.log('⚠️ No products found to delete');
      return next();
    }

    // Delete all reviews for these products
    const Review = mongoose.model('Review');
    const deleteResult = await Review.deleteMany({ 
      productId: { $in: productIds },
      reviewType: 'Product'
    });
    
    console.log(`🗑️ CASCADE DELETE (BULK): Removed ${deleteResult.deletedCount} review(s) for ${productIds.length} product(s)`);
    
    next();
  } catch (error) {
    console.error('❌ Error in cascade delete (deleteMany):', error);
    next(error);
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;