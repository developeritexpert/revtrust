const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const ReviewServices = require('../../services/review/review.service');
const { getPaginationParams, buildReviewFilters } = require('../../utils/pagination');

const createReview = wrapAsync(async (req, res) => {
  const reviewData = req.body;
  const result = await ReviewServices.createReview(reviewData);
  sendResponse(res, result, 'Review has been added successfully', 201);
});

const getAllReviews = wrapAsync(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query);
  const filters = buildReviewFilters(req.query);

  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order || 'desc';

  const result = await ReviewServices.getAllReviews(page, limit, filters, sortBy, order);
  sendResponse(res, result, 'All reviews fetched successfully', 200);
});


const getReviewById = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ReviewServices.getReviewById(id);
  sendResponse(res, result, 'Review fetched successfully', 200);
});

const updateReview = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const result = await ReviewServices.updateReview(id, updateData);
  sendResponse(res, result, 'Review has been updated successfully', 200);
});

const updateStateReview = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const result = await ReviewServices.updateStateReview(id, updateData);
  sendResponse(res, result, 'Review has been updated successfully', 200);
});

const deleteReview = wrapAsync(async (req, res) => {
  const { id } = req.params;
  await ReviewServices.deleteReview(id);
  sendResponse(res, null, 'Review deleted successfully', 200);
});
const getReviewApiInfo = (req, res) => {
  const apiInfo = {
    addReview: {
      method: 'POST',
      path: '/add',
      body: {
        reviewTitle: { type: 'string', required: true },
        reviewBody: { type: 'string', required: true },
        rating: { type: 'number', required: true, min: 1, max: 5 },
        name: { type: 'string', required: true },
        email: { type: 'string', required: true, format: 'email' },
        orderId: { type: 'string', required: false },
        phoneNumber: { type: 'string', required: false },
        reviewType: { type: 'string', required: true, allowed: ['Product', 'Brand'] },
        productId: { type: 'string', required: false },
        brandId: { type: 'string', required: false },
      },
    },
    getAllReviews: {
      method: 'GET',
      path: '/all',
      query: {
        page: { type: 'number', required: false, default: 1 },
        limit: { type: 'number', required: false, default: 10 },
        reviewType: { type: 'string', required: false, allowed: ['Product', 'Brand'] },
        productId: { type: 'string', required: false },
        brandId: { type: 'string', required: false },
        status: { type: 'string', required: false },
      },
    },
    getReviewById: {
      method: 'GET',
      path: '/:id',
      params: {
        id: { type: 'string', required: true, format: 'ObjectId' },
      },
    },
    updateReview: {
      method: 'PUT',
      path: '/update/:id',
      params: {
        id: { type: 'string', required: true, format: 'ObjectId' },
      },
      body: {
        reviewTitle: { type: 'string', required: false },
        reviewBody: { type: 'string', required: false },
        rating: { type: 'number', required: false, min: 1, max: 5 },
        status: { type: 'string', required: false },
      },
    },
    deleteReview: {
      method: 'DELETE',
      path: '/delete/:id',
      params: {
        id: { type: 'string', required: true, format: 'ObjectId' },
      },
    },
  };

  res.status(200).json({
    success: true,
    message: 'Review API metadata',
    data: apiInfo,
  });
};

const recalculateAverages = wrapAsync(async (req, res) => {
  const result = await ReviewServices.recalculateAverages();
  sendResponse(res, result, 'All averages recalculated successfully', 200);
});


module.exports = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewApiInfo,
  updateStateReview,
  recalculateAverages,
};
