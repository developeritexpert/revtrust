const Brand = require('../../models/brand.model');
const { ErrorHandler } = require('../../utils/error-handler');

const createBrand = async (data) => {
  try {
    const brand = await Brand.create(data);
    return brand;
  } catch (error) {
    if (error.code === 11000) {
      throw new ErrorHandler(409, 'Brand with this email or website already exists');
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

const getAllBrands = async (page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;

  const query = Brand.find(filters);
  if (limit > 0) {
    query.skip(skip).limit(limit);
  }

  query.sort({ createdAt: -1 });

  const [brands, total] = await Promise.all([
    query.exec(),
    Brand.countDocuments(filters)
  ]);

  return {
    data: brands,
    pagination: {
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1
    }
  };
};

const getBrandById = async (id) => {
  const brand = await Brand.findById(id);
  if (!brand) throw new ErrorHandler(404, 'Brand not found');
  return brand;
};

const updateBrand = async (id, data) => {
  const brand = await Brand.findByIdAndUpdate(id, data, { new: true, runValidators: true });
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
  getBrandById,
  updateBrand,
  deleteBrand,
};
