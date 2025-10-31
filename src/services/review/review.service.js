const Review = require('../../models/review.model');
const { ErrorHandler } = require('../../utils/error-handler');

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
const getAllReviews = async (page, limit, filters, sortBy = 'createdAt', order = 'desc') => {
  const skip = (page - 1) * limit;

  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = {};
  sort[sortBy] = sortOrder;

  const [reviews, total] = await Promise.all([
    Review.find(filters).sort(sort).skip(skip).limit(limit),
    Review.countDocuments(filters),
  ]);

  return {
    data: reviews,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const getReviewById = async (id) => {
  const review = await Review.findById(id);
  if (!review) throw new ErrorHandler(404, 'Review not found');
  return review;
};

const updateReview = async (id, data) => {
  const review = await Review.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!review) throw new ErrorHandler(404, 'Review not found');
  return review;
};

const deleteReview = async (id) => {
  const review = await Review.findByIdAndDelete(id);
  if (!review) throw new ErrorHandler(404, 'Review not found');
};

module.exports = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
};
