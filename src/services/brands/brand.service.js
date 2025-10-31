const Brand = require('../../models/brand.model');
const { ErrorHandler } = require('../../utils/error-handler');

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
