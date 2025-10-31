const Product = require('../../models/product.model');
const { ErrorHandler } = require('../../utils/error-handler');

const createProduct = async (data) => {
  try {
    const product = await Product.create(data);
    return product;
  } catch (error) {
    if (error.code === 11000) {
      throw new ErrorHandler(409, 'Product with this handle already exists');
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((val) => val.message)
        .join(', ');
      throw new ErrorHandler(422, messages);
    }
    throw new ErrorHandler(error.statusCode || 500, error.message || 'Failed to create product');
  }
};

const getAllProducts = async (page, limit, filters, sortBy = 'createdAt', order = 'desc') => {
  const skip = (page - 1) * limit;
  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = {};
  sort[sortBy] = sortOrder;

  const [products, total] = await Promise.all([
    Product.find(filters)
      .populate('brandId', 'name email logoUrl')
      .sort(sort) 
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filters),
  ]);

  return {
    data: products,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

const getProductById = async (id) => {
  const product = await Product.findById(id).populate('brandId', 'name email logoUrl websiteUrl');
  if (!product) throw new ErrorHandler(404, 'Product not found');
  return product;
};

const updateProduct = async (id, data) => {
  const product = await Product.findByIdAndUpdate(id, data, { 
    new: true, 
    runValidators: true 
  }).populate('brandId', 'name email logoUrl');
  if (!product) throw new ErrorHandler(404, 'Product not found');
  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new ErrorHandler(404, 'Product not found');
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};