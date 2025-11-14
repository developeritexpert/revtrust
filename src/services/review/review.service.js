const Review = require('../../models/review.model');
const { ErrorHandler } = require('../../utils/error-handler');
const Brand = require('../../models/brand.model');
const Product = require('../../models/product.model');
const mongoose = require('mongoose');

const createReview = async (data) => {
  try {
    const review = await Review.create(data);
    return review;
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message).join(', ');
      throw new ErrorHandler(422, messages);
    }
    throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to create review');
  }
};

// const getAllReviews = async (page, limit, filters) => {
//   const skip = (page - 1) * limit;
//   const [reviews, total] = await Promise.all([
//     Review.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
//     Review.countDocuments(filters),
//   ]);
//   return {
//     data: reviews,
//     pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
//   };
// };
// const getAllReviews = async (page, limit, filters, sortBy = 'createdAt', order = 'desc') => {
//   const skip = (page - 1) * limit;
//   const sortOrder = order === 'asc' ? 1 : -1;
//   const sort = {};
//   sort[sortBy] = sortOrder;

//   const [reviews, total] = await Promise.all([
//     Review.find(filters)
//       .sort(sort)
//       .skip(skip)
//       .limit(limit)
//       .populate({
//         path: 'productId',
//         select: 'name handle image price status',
//       })
//       .populate({
//         path: 'brandId',
//         select: 'name logo status',
//       }),
//     Review.countDocuments(filters),
//   ]);

//   return {
//     data: reviews,
//     pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
//   };
// };
const getAllReviews = async (page, limit, filters, sortBy = 'createdAt', order = 'desc') => {
  const skip = (page - 1) * limit;
  const sortOrder = order === 'asc' ? 1 : -1;

  // FIX: Convert brandId & productId to ObjectId
  if (filters.brandId) {
    filters.brandId = new mongoose.Types.ObjectId(filters.brandId);
  }
  if (filters.productId) {
    filters.productId = new mongoose.Types.ObjectId(filters.productId);
  }

  const results = await Review.aggregate([
    { $match: filters },
    { $sort: { [sortBy]: sortOrder } },
    { $skip: skip },
    { $limit: limit },

    {
      $lookup: {
        from: "reviews",
        let: { email: "$email" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$email", "$$email"] },
              status: "ACTIVE"
            }
          },
          { $count: "totalReviewsByEmail" }
        ],
        as: "emailStats"
      }
    },

    {
      $addFields: {
        totalReviewsByEmail: {
          $ifNull: [{ $arrayElemAt: ["$emailStats.totalReviewsByEmail", 0] }, 0]
        }
      }
    },

    { $project: { emailStats: 0 } }
  ]);

  const total = await Review.countDocuments(filters);

  const populatedResults = await Review.populate(results, [
    {
      path: "productId",
      select: "name handle image price status"
    },
    {
      path: "brandId",
      select: "name logo status"
    }
  ]);

  return {
    data: populatedResults,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};



// const getReviewById = async (id) => {
//   const review = await Review.findById(id);
//   if (!review) throw new ErrorHandler(404, 'Review not found');
//   return review;
// };
const getReviewById = async (id) => {
  const result = await Review.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },

    {
      $lookup: {
        from: "reviews",
        let: { email: "$email" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$email", "$$email"] },
              status: "ACTIVE"
            }
          },
          { $count: "totalReviewsByEmail" }
        ],
        as: "emailStats"
      }
    },
    {
      $addFields: {
        totalReviewsByEmail: {
          $ifNull: [{ $arrayElemAt: ["$emailStats.totalReviewsByEmail", 0] }, 0]
        }
      }
    },
    { $project: { emailStats: 0 } }
  ]);

  if (!result.length) throw new ErrorHandler(404, "Review not found");

  return result[0];
};

const updateReview = async (id, data) => {
  const review = await Review.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!review) throw new ErrorHandler(404, 'Review not found');
  return review;
};

const updateStateReview = async (id, data) => {
  const review = await Review.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!review) throw new ErrorHandler(404, 'Review not found');
  return review;
};

const deleteReview = async (id) => {
  const review = await Review.findByIdAndDelete(id);
  if (!review) throw new ErrorHandler(404, 'Review not found');
};


const recalculateAverages = async () => {
  try {
    console.log('🧮 Starting recalculation of averages...');
    
    // --- BRAND AVERAGES ---
    const brands = await Brand.find({ status: 'ACTIVE' });
    console.log(`📦 Found ${brands.length} active brands to process.`);
    let brandUpdatedCount = 0;
    let brandsWithoutReviews = 0;

    for (const brand of brands) {
      const reviews = await Review.find({ brandId: brand._id, status: 'ACTIVE' });
      if (reviews.length === 0) {
        console.log(`⚠️ Skipped brand "${brand.name}" (no active reviews).`);
        brandsWithoutReviews++;
        continue;
      }

      const averages = reviews.map(r => {
        const ratings = [
          r.product_store_rating,
          r.seller_rating,
          r.product_quality_rating,
          r.product_price_rating,
          r.issue_handling_rating,
        ].filter(v => typeof v === 'number' && v > 0);
        const sum = ratings.reduce((a, b) => a + b, 0);
        return ratings.length ? sum / ratings.length : 0;
      });

      const overallAvg = averages.reduce((a, b) => a + b, 0) / averages.length;
      const roundedOverall = Math.round(overallAvg * 10) / 10;
      const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      averages.forEach(avg => {
        const star = Math.round(avg);
        if (ratingCounts[star] !== undefined) ratingCounts[star]++;
      });

      await Brand.findByIdAndUpdate(brand._id, {
        averageRating: overallAvg,
        roundedOverall,
        ratingDistribution: ratingCounts,
      });

      console.log(`✅ Updated Brand: "${brand.name}" | New Avg: ${roundedOverall}`);
      brandUpdatedCount++;
    }

    console.log(`\n✅ Brand Summary → Updated: ${brandUpdatedCount}, Skipped (no reviews): ${brandsWithoutReviews}`);

    // --- PRODUCT AVERAGES ---
    const products = await Product.find({ status: 'ACTIVE' });
    console.log(`\n🛍️ Found ${products.length} active products to process.`);
    let productUpdatedCount = 0;
    let productsWithoutReviews = 0;

    for (const product of products) {
      const reviews = await Review.find({ productId: product._id, status: 'ACTIVE' });
      if (reviews.length === 0) {
        console.log(`⚠️ Skipped product "${product.name}" (no active reviews).`);
        productsWithoutReviews++;
        continue;
      }

      const averages = reviews.map(r => {
        const ratings = [
          r.product_store_rating,
          r.seller_rating,
          r.product_quality_rating,
          r.product_price_rating,
          r.issue_handling_rating,
        ].filter(v => typeof v === 'number' && v > 0);
        const sum = ratings.reduce((a, b) => a + b, 0);
        return ratings.length ? sum / ratings.length : 0;
      });

      const overallAvg = averages.reduce((a, b) => a + b, 0) / averages.length;
      const roundedOverall = Math.round(overallAvg * 10) / 10;
      const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      averages.forEach(avg => {
        const star = Math.round(avg);
        if (ratingCounts[star] !== undefined) ratingCounts[star]++;
      });

      await Product.findByIdAndUpdate(product._id, {
        averageRating: overallAvg,
        roundedOverall,
        ratingDistribution: ratingCounts,
      });

      console.log(`✅ Updated Product: "${product.name}" | New Avg: ${roundedOverall}`);
      productUpdatedCount++;
    }

    console.log(`\n✅ Product Summary → Updated: ${productUpdatedCount}, Skipped (no reviews): ${productsWithoutReviews}`);
    console.log('\n🎯 All recalculations completed successfully.\n');

    return {
      success: true,
      brandsUpdated: brandUpdatedCount,
      productsUpdated: productUpdatedCount,
      brandsSkipped: brandsWithoutReviews,
      productsSkipped: productsWithoutReviews,
    };
  } catch (err) {
    console.error('❌ Error during recalculation:', err);
    throw new ErrorHandler(500, 'Failed to recalculate averages');
  }
};



module.exports = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  updateStateReview,
  recalculateAverages
};
