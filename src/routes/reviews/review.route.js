const express = require('express');
const reviewRouter = express.Router();
const reviewController = require('../../controllers/reviews/review.controller');
const ReviewSchema = require('../../request-schemas/review.schema');
const { celebrate } = require('celebrate');
const multer = require('multer');

const upload = multer();

const API = {
  INFO: '/info',
  ADD_REVIEW: '/add',
  GET_ALL_REVIEWS: '/all',
  GET_REVIEW: '/:id',
  UPDATE_REVIEW: '/update/:id',
  DELETE_REVIEW: '/delete/:id',
  STATUS_REVIEW: '/:id/status',
};

reviewRouter.get(API.INFO, reviewController.getReviewApiInfo);

reviewRouter.post(
  API.ADD_REVIEW,
  upload.none(),
  celebrate(ReviewSchema.addReview),
  reviewController.createReview
);

reviewRouter.get(API.GET_ALL_REVIEWS, reviewController.getAllReviews);

reviewRouter.get(API.GET_REVIEW, celebrate(ReviewSchema.idParam), reviewController.getReviewById);
reviewRouter.put(API.STATUS_REVIEW, celebrate(ReviewSchema.updateReviewStatus), reviewController.updateStateReview);

reviewRouter.put(
  API.UPDATE_REVIEW,
  upload.none(),
  celebrate({ ...ReviewSchema.idParam, ...ReviewSchema.updateReview }),
  reviewController.updateReview
);

reviewRouter.delete(API.DELETE_REVIEW, celebrate(ReviewSchema.idParam), reviewController.deleteReview);

module.exports = reviewRouter;
