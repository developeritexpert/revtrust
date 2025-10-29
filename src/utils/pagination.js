function getPaginationParams(query, defaults = { page: 1, limit: 50, maxLimit: 100 }) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) page = defaults.page;
  if (isNaN(limit) || limit < 1) limit = defaults.limit;
  if (limit > defaults.maxLimit) limit = defaults.maxLimit;

  return { page, limit };
}
function getFinalPagination(query, fetchAllOverride = false) {
  if (fetchAllOverride || query.all === 'true') {
    return { page: 1, limit: 0 };
  }
  return getPaginationParams(query);
}
function extractFilters(query, allowedFilters, additionalFilters = {}) {
  const filters = {};

  allowedFilters.forEach((key) => {
    const value = query[key];
    if (value !== undefined && value !== null && value !== '') {
      filters[key] = value;
    }
  });

  // Merge additional filters like user_id for non-admins
  return Object.assign({}, filters, additionalFilters);
}

function buildBrandFilters(queryParams) {
  const filters = {};
  const textFields = ['name', 'email', 'phoneNumber', 'websiteUrl', 'postcode'];

  for (const key of textFields) {
    if (queryParams[key]) {
      filters[key] = { $regex: queryParams[key], $options: 'i' };
    }
  }
  if (queryParams.status) filters.status = queryParams.status;
  if (queryParams._id) filters._id = queryParams._id;

  return filters;
}

const buildProductFilters = (query) => {
  const filters = {};

  if (query._id) filters._id = query._id;
  if (query.handle) filters.handle = query.handle;
  if (query.brandId) filters.brandId = query.brandId;
  if (query.status) filters.status = query.status;

  if (query.name) {
    filters.name = { $regex: query.name, $options: 'i' };
  }

  if (query.minPrice || query.maxPrice) {
    filters.price = {};
    if (query.minPrice) filters.price.$gte = parseFloat(query.minPrice);
    if (query.maxPrice) filters.price.$lte = parseFloat(query.maxPrice);
  }

  if (query.inStock !== undefined) {
    const inStock = query.inStock === 'true' || query.inStock === true;
    filters.stockQuantity = inStock ? { $gt: 0 } : 0;
  }

  return filters;
};
const buildReviewFilters = (queryParams) => {
  const filters = {};

  const textFields = ['reviewTitle', 'reviewBody', 'name', 'email', 'phoneNumber'];
  for (const key of textFields) {
    if (queryParams[key]) {
      filters[key] = { $regex: queryParams[key], $options: 'i' };
    }
  }

  if (queryParams.status) filters.status = queryParams.status;
  if (queryParams._id) filters._id = queryParams._id;
  if (queryParams.reviewType) filters.reviewType = queryParams.reviewType;
  if (queryParams.productId) filters.productId = queryParams.productId;
  if (queryParams.brandId) filters.brandId = queryParams.brandId;

  if (queryParams.rating) filters.rating = Number(queryParams.rating);

  if (queryParams.minRating || queryParams.maxRating) {
    filters.rating = {};
    if (queryParams.minRating) filters.rating.$gte = Number(queryParams.minRating);
    if (queryParams.maxRating) filters.rating.$lte = Number(queryParams.maxRating);
  }

  return filters;
};

module.exports = {
  getPaginationParams,
  getFinalPagination,
  extractFilters,
  buildBrandFilters,
  buildProductFilters,
  buildReviewFilters,
};
