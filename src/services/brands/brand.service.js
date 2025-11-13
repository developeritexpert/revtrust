const Brand = require('../../models/brand.model');
const Review = require('../../models/review.model');
const { ErrorHandler } = require('../../utils/error-handler');
const mongoose = require('mongoose');


const createBrand = async (data) => {
  try {
    return await Brand.create(data);
  } catch (error) {
    if (error.code === 11000) {
      throw new ErrorHandler(409, 'Brand with this name or email already exists');
    }
    throw new ErrorHandler(500, error.message);
  }
};


const getAllBrands = async (page = 1, limit = 20, filters = {}) => {
  const skip = (page - 1) * limit;

  const results = await Brand.aggregate([
    { $match: filters },

    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'brandId',
        pipeline: [
          { $match: { status: 'ACTIVE' } },
          {
            $project: {
              avgRating: {
                $avg: [
                  '$product_store_rating',
                  '$seller_rating',
                  '$product_quality_rating',
                  '$product_price_rating',
                  '$issue_handling_rating'
                ]
              }
            }
          }
        ],
        as: 'reviewStats'
      }
    },

    {
      $addFields: {
        totalReviews: { $size: '$reviewStats' },
        averageRating: {
          $cond: [
            { $gt: [{ $size: '$reviewStats' }, 0] },
            { $round: [{ $avg: '$reviewStats.avgRating' }, 1] },
            0
          ]
        }
      }
    },

    {
      $addFields: {
        ratingDistribution: {
          1: { $size: { $filter: { input: '$reviewStats', cond: { $eq: [{ $round: ['$$this.avgRating', 0] }, 1] } } } },
          2: { $size: { $filter: { input: '$reviewStats', cond: { $eq: [{ $round: ['$$this.avgRating', 0] }, 2] } } } },
          3: { $size: { $filter: { input: '$reviewStats', cond: { $eq: [{ $round: ['$$this.avgRating', 0] }, 3] } } } },
          4: { $size: { $filter: { input: '$reviewStats', cond: { $eq: [{ $round: ['$$this.avgRating', 0] }, 4] } } } },
          5: { $size: { $filter: { input: '$reviewStats', cond: { $eq: [{ $round: ['$$this.avgRating', 0] }, 5] } } } }
        }
      }
    },

    { $sort: { createdAt: -1 } },

    { $skip: skip },
    { $limit: limit },

    { $project: { reviewStats: 0 } }
  ]);

  const total = await Brand.countDocuments(filters);

  return {
    data: results,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};


const getBrandByIdWithReview = async (
  id,
  page = 1,
  limit = 10,
  filters = {},
  sortBy = 'createdAt',
  order = 'desc'
) => {
  const skip = (page - 1) * limit;

  const brand = await Brand.findById(id).lean();
  if (!brand) throw new ErrorHandler(404, 'Brand not found');

  const stats = await Review.aggregate([
    {
      $match: {
        brandId: new mongoose.Types.ObjectId(id),
        status: 'ACTIVE'
      }
    },
    {
      $project: {
        avgRating: {
          $avg: [
            '$product_store_rating',
            '$seller_rating',
            '$product_quality_rating',
            '$product_price_rating',
            '$issue_handling_rating'
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$avgRating' },
        ratingCounts: { $push: { rounded: { $round: ['$avgRating', 0] } } }
      }
    },
    {
      $project: {
        _id: 0,
        totalReviews: 1,
        averageRating: { $round: ['$averageRating', 1] },
        ratingDistribution: {
          1: { $size: { $filter: { input: '$ratingCounts', cond: { $eq: ['$$this.rounded', 1] } } } },
          2: { $size: { $filter: { input: '$ratingCounts', cond: { $eq: ['$$this.rounded', 2] } } } },
          3: { $size: { $filter: { input: '$ratingCounts', cond: { $eq: ['$$this.rounded', 3] } } } },
          4: { $size: { $filter: { input: '$ratingCounts', cond: { $eq: ['$$this.rounded', 4] } } } },
          5: { $size: { $filter: { input: '$ratingCounts', cond: { $eq: ['$$this.rounded', 5] } } } }
        }
      }
    }
  ]);

  const ratingSummary = stats[0] || {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };

  const reviewQuery = { brandId: id, status: 'ACTIVE' };

  const sort = {};
  sort[sortBy] = order === 'asc' ? 1 : -1;

  const reviews = await Review.find(reviewQuery)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalReviews = await Review.countDocuments(reviewQuery);

  return {
    ...brand,
    ratingSummary,
    reviews: {
      data: reviews,
      pagination: {
        total: totalReviews,
        page,
        limit,
        totalPages: Math.ceil(totalReviews / limit)
      }
    }
  };
};


const updateBrand = async (id, data) => {
  const brand = await Brand.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });

  if (!brand) throw new ErrorHandler(404, 'Brand not found');
  return brand;
};


const deleteBrand = async (id) => {
  const brand = await Brand.findByIdAndDelete(id);
  if (!brand) throw new ErrorHandler(404, 'Brand not found');
};

module.exports = {
  createBrand,
  getAllBrands,
  getBrandByIdWithReview,
  updateBrand,
  deleteBrand
};
