const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const ProductServices = require('../../services/products/product.service');
const { ErrorHandler } = require('../../utils/error-handler');
const { getPaginationParams, buildProductFilters } = require('../../utils/pagination');
const getImageUrl = (req) => req.file?.cloudinaryUrl;

const createProduct = wrapAsync(async (req, res) => {
  const productData = req.body;
  productData.image = getImageUrl(req); 
  const result = await ProductServices.createProduct(productData);
  sendResponse(res, result, 'Product has been created successfully', 201);
});

const getAllProducts = wrapAsync(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query);
  const filters = buildProductFilters(req.query);
  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order || 'desc';

  const result = await ProductServices.getAllProducts(page, limit, filters, sortBy, order);
  sendResponse(res, result, 'All products fetched successfully', 200);
});

const getProductById = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ProductServices.getProductById(id);
  sendResponse(res, result, 'Product fetched successfully', 200);
});

const updateProduct = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  updateData.image = getImageUrl(req);
  const result = await ProductServices.updateProduct(id, updateData);
  sendResponse(res, result, 'Product updated successfully', 200);
});

const deleteProduct = wrapAsync(async (req, res) => {
  const { id } = req.params;
  await ProductServices.deleteProduct(id);
  sendResponse(res, null, 'Product deleted successfully', 200);
});

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};