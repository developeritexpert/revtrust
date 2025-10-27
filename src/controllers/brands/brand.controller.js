const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const BrandServices = require('../../services/brands/brand.service');
const { ErrorHandler } = require('../../utils/error-handler');

const createBrand = wrapAsync(async (req, res) => {
  const brandData = req.body;
  const result = await BrandServices.createBrand(brandData);
  sendResponse(res, result, 'Brand has been created successfully', 201);
});

const getAllBrands = wrapAsync(async (req, res) => {
  const result = await BrandServices.getAllBrands();
  sendResponse(res, result, 'All brands fetched successfully', 200);
});

const getBrandById = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const result = await BrandServices.getBrandById(id);
  sendResponse(res, result, 'Brand fetched successfully', 200);
});

const updateBrand = wrapAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const result = await BrandServices.updateBrand(id, updateData);
  sendResponse(res, result, 'Brand updated successfully', 200);
});

const deleteBrand = wrapAsync(async (req, res) => {
  const { id } = req.params;
  await BrandServices.deleteBrand(id);
  sendResponse(res, null, 'Brand deleted successfully', 200);
});

module.exports = {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
};
