const Brand = require('../../models/brand.model');
const Review = require('../../models/review.model');
const { ErrorHandler } = require('../../utils/error-handler');
const mongoose = require('mongoose');

const createBrand = async (data) => {
  try {
    const brand = await Brand.create(data);
    return brand;
  } catch (error) {
    if (error.code === 11000) {
      throw new ErrorHandler(409, 'Brand with this name or email already exists');
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((val) => val.message)
        .join(', ');
      throw new ErrorHandler(422, messages);
    }
    throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to create brand');
  }
};

// const getAllBrands = async (page, limit, filters) => {
//   const skip = (page - 1) * limit;
//   const [brands, total] = await Promise.all([
//     Brand.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
//     Brand.countDocuments(filters),
//   ]);
//   return {
//     data: brands,
//     pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
//   };
// };
const getAllBrands = async (page, limit, filters, sortBy = 'createdAt', order = 'desc') => {
  const skip = (page - 1) * limit;

  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = {};
  sort[sortBy] = sortOrder;

  const [brands, total] = await Promise.all([
    Brand.find(filters).sort(sort).skip(skip).limit(limit),
    Brand.countDocuments(filters),
  ]);

  return {
    data: brands,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};


const getBrandById = async (id) => {
  const brand = await Brand.findById(id);

  if (!brand) throw new ErrorHandler(404, 'Brand not found');

  return brand;
};

const getBrandByIdWithReview = async (
  id,
  page = 1,
  limit = 10,
  filters = {},
  sortBy = 'createdAt',
  sortOrder = 'desc'
) => {
  const skip = (page - 1) * limit;

  const brand = await Brand.findById(id);
  if (!brand) throw new ErrorHandler(404, 'Brand not found');

  const reviewQuery = { brandId: id, status: 'ACTIVE' };

  if (filters.minRating)
    reviewQuery.product_store_rating = { $gte: Number(filters.minRating) };
  if (filters.maxRating)
    reviewQuery.product_store_rating = {
      ...(reviewQuery.product_store_rating || {}),
      $lte: Number(filters.maxRating),
    };
  if (filters.email) reviewQuery.email = filters.email;

  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [reviewStats, reviews, totalReviews] = await Promise.all([
    Review.aggregate([
      { $match: { brandId: new mongoose.Types.ObjectId(id), status: 'ACTIVE' } },
      {
        $group: {
          _id: '$brandId',
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$product_store_rating' },
        },
      },
    ]),
    Review.find(reviewQuery)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select(
        'reviewTitle reviewBody name email product_store_rating seller_rating product_quality_rating product_price_rating createdAt'
      ),
    Review.countDocuments(reviewQuery),
  ]);

  const reviewSummary = reviewStats[0] || { totalReviews: 0, averageRating: 0 };

  return {
    ...brand.toObject(),
    reviewSummary,
    reviews: {
      data: reviews,
      pagination: {
        total: totalReviews,
        page,
        limit,
        totalPages: Math.ceil(totalReviews / limit),
      },
    },
  };
};

const updateBrand = async (id, data) => {
  const brand = await Brand.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!brand) throw new ErrorHandler(404, 'Brand not found');
  return brand;
};

// Service
const deleteBrand = async (id) => {
  console.log('🧩 Service: attempting to delete brand with ID:', id);
  const brand = await Brand.findByIdAndDelete(id);
  if (!brand) {
    console.log('❌ Brand not found for ID:', id);
    throw new ErrorHandler(404, 'Brand not found');
  }
  console.log('✅ Brand deleted in DB:', brand._id);
};


module.exports = {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
  getBrandByIdWithReview,
};
