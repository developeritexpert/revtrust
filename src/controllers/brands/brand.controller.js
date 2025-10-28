const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const BrandServices = require('../../services/brands/brand.service');
const { ErrorHandler } = require('../../utils/error-handler');
const { getPaginationParams, extractFilters , buildBrandFilters } = require('../../utils/pagination');

const createBrand = wrapAsync(async (req, res) => {
  const brandData = req.body;
  const result = await BrandServices.createBrand(brandData);
  sendResponse(res, result, 'Brand has been created successfully', 201);
});

const getAllBrands = wrapAsync(async (req, res) => {
  const { page, limit } = getPaginationParams(req.query);
  // const allowedFilterKeys = ['_id', 'status', 'name','email','phoneNumber','websiteUrl','postcode'];
  // const filters = extractFilters(req.query, allowedFilterKeys);
  const filters = buildBrandFilters(req.query);

  const result = await BrandServices.getAllBrands(page, limit, filters);

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
const getBrandApiInfo = (req, res) => {
  const apiInfo = {
    addBrand: {
      method: 'POST',
      path: '/add',
      body: {
        name: { type: 'string', required: true, min: 2, max: 100 },
        email: { type: 'string', required: true, format: 'email' },
        phoneNumber: { type: 'string', required: true },
        logoUrl: { type: 'string', required: false, format: 'url' },
        websiteUrl: { type: 'string', required: true, format: 'url' },
        description: { type: 'string', required: false },
        status: { type: 'string', required: false, allowed: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
        postcode: { type: 'string', required: true },
      },
    },
    getAllBrands: {
      method: 'GET',
      path: '/all',
      query: {
        page: { type: 'number', required: false, default: 1 },
        limit: { type: 'number', required: false, default: 10 },
        _id: { type: 'string', required: false },
        name: { type: 'string', required: false },
        email: { type: 'string', required: false },
        phoneNumber: { type: 'string', required: false },
        websiteUrl: { type: 'string', required: false },
        postcode: { type: 'string', required: false },
        status: { type: 'string', required: false, allowed: ['ACTIVE', 'INACTIVE'] },
      },
    },
    getBrandById: {
      method: 'GET',
      path: '/:id',
      params: {
        id: { type: 'string', required: true, format: 'ObjectId' },
      },
    },
    updateBrand: {
      method: 'PUT',
      path: '/update/:id',
      params: {
        id: { type: 'string', required: true, format: 'ObjectId' },
      },
      body: {
        name: { type: 'string', required: false, min: 2, max: 100 },
        email: { type: 'string', required: false, format: 'email' },
        phoneNumber: { type: 'string', required: false },
        logoUrl: { type: 'string', required: false, format: 'url' },
        websiteUrl: { type: 'string', required: false, format: 'url' },
        description: { type: 'string', required: false },
        status: { type: 'string', required: false, allowed: ['ACTIVE', 'INACTIVE'] },
        postcode: { type: 'string', required: false },
      },
    },
    deleteBrand: {
      method: 'DELETE',
      path: '/delete/:id',
      params: {
        id: { type: 'string', required: true, format: 'ObjectId' },
      },
    },
  };

  res.status(200).json({
    success: true,
    message: 'Brand API metadata',
    data: apiInfo,
  });
};

module.exports = {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
  getBrandApiInfo,
};
