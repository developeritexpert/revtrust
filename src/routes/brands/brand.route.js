const express = require('express');
const brandRouter = express.Router();
const brandController = require('../../controllers/brands/brand.controller');
const BrandSchema = require('../../request-schemas/brand.schema');
const { celebrate } = require('celebrate');
const createUpload = require('../../config/multer.config');
const uploadBrand = createUpload('brands');

const API = {
  INFO: '/info',
  ADD_BRAND: '/add',
  GET_ALL_BRANDS: '/all',
  GET_BRAND: '/:id',
  UPDATE_BRAND: '/update/:id',
  DELETE_BRAND: '/delete/:id',
};

brandRouter.get(API.INFO, brandController.getBrandApiInfo);

brandRouter.post(
  API.ADD_BRAND,
  uploadBrand.single('logoUrl'),
  celebrate(BrandSchema.addBrand),
  brandController.createBrand
);

brandRouter.get(API.GET_ALL_BRANDS, brandController.getAllBrands);

brandRouter.get(API.GET_BRAND, celebrate(BrandSchema.idParam), brandController.getBrandById);

brandRouter.put(
  API.UPDATE_BRAND,
  uploadBrand.single('logoUrl'),
  celebrate({ ...BrandSchema.idParam, ...BrandSchema.updateBrand }),
  brandController.updateBrand
);

brandRouter.delete(API.DELETE_BRAND, celebrate(BrandSchema.idParam), brandController.deleteBrand);

module.exports = brandRouter;