const express = require('express');
const productRouter = express.Router();
const productController = require('../../controllers/products/product.controller');
const ProductSchema = require('../../request-schemas/product.schema');
const { celebrate } = require('celebrate');

const API = {
  ADD_PRODUCT: '/add',
  GET_ALL_PRODUCTS: '/all',
  GET_PRODUCT: '/:id',
  UPDATE_PRODUCT: '/update/:id',
  DELETE_PRODUCT: '/delete/:id',
};

productRouter.post(API.ADD_PRODUCT, celebrate(ProductSchema.addProduct), productController.createProduct);

productRouter.get(API.GET_ALL_PRODUCTS, productController.getAllProducts);

productRouter.get(API.GET_PRODUCT, celebrate(ProductSchema.idParam), productController.getProductById);

productRouter.put(
  API.UPDATE_PRODUCT,
  celebrate({ ...ProductSchema.idParam, ...ProductSchema.updateProduct }),
  productController.updateProduct
);

productRouter.delete(API.DELETE_PRODUCT, celebrate(ProductSchema.idParam), productController.deleteProduct);

module.exports = productRouter;