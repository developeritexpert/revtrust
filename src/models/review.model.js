const mongoose = require('mongoose');
const CONSTANT_ENUM = require('../helper/constant-enums');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      required: false,
    },

    // --- Polymorphic relation ---
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
      default: CONSTANT_ENUM.REVIEW_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Optional: Automatically update Product or Brand review counts
reviewSchema.post('save', async function (doc, next) {
  try {
    if (doc.reviewType === 'Product') {
      const Product = mongoose.model('Product');
      await Product.findByIdAndUpdate(doc.productId, {
        $inc: { totalReviews: 1 },
      });
    } else if (doc.reviewType === 'Brand') {
      const Brand = mongoose.model('Brand');
      // Add totalReviews to Brand if needed
      await Brand.findByIdAndUpdate(doc.brandId, {
        $inc: { totalReviews: 1 },
      });
    }
    next();
  } catch (err) {
    next(err);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
