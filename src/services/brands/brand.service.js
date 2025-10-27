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
      const messages = Object.values(error.errors).map((val) => val.message).join(', ');
      throw new ErrorHandler(422, messages);
    }
    throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to create brand');
  }
};

const getAllBrands = async () => {
  return await Brand.find();
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
