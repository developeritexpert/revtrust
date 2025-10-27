const express = require('express');
const brandRouter = express.Router();
const brandController = require('../../controllers/brands/brand.controller');
const BrandSchema = require('../../request-schemas/brand.schema');
const { celebrate } = require('celebrate');

const API = {
  INFO: '/info',
  ADD_BRAND: '/add',
  GET_ALL_BRANDS: '/all',
  GET_BRAND: '/:id',
  UPDATE_BRAND: '/update/:id',
  DELETE_BRAND: '/delete/:id',
};

brandRouter.get(API.INFO, (req, res) => {
  res.json({
    BackendURL: `${process.env.BACKEND_URL || 'http://localhost:4000'}`,
    baseUrl: '/api/brand',
    routes: [
      {
        method: 'POST',
        url: API.ADD_BRAND,
        description: 'Add a new brand',
        sampleBody: {
          name: 'My Brand',
          email: 'brand@example.com',
          phoneNumber: '+1234567890',
          logoUrl: 'https://example.com/logo.png',
          websiteUrl: 'https://example.com',
          description: 'Brand description here',
          status: 'active',
          postcode: '12345',
        },
      },
      {
        method: 'GET',
        url: API.GET_ALL_BRANDS,
        description: 'Get all brands',
        sampleBody: null,
      },
      {
        method: 'GET',
        url: API.GET_BRAND,
        description: 'Get a brand by ID',
        sampleParams: { id: '68ff64022cb18485b23ea591' },
      },
      {
        method: 'PUT',
        url: API.UPDATE_BRAND,
        description: 'Update brand by ID',
        sampleParams: { id: '68ff64022cb18485b23ea591' },
        sampleBody: {
          name: 'Updated Brand',
          status: 'inactive',
        },
      },
      {
        method: 'DELETE',
        url: API.DELETE_BRAND,
        description: 'Delete brand by ID',
        sampleParams: { id: '68ff64022cb18485b23ea591' },
      },
    ],
  });
});

brandRouter.post(API.ADD_BRAND, celebrate(BrandSchema.addBrand), brandController.createBrand);
brandRouter.get(API.GET_ALL_BRANDS, brandController.getAllBrands);
brandRouter.get(API.GET_BRAND, celebrate(BrandSchema.idParam), brandController.getBrandById);
brandRouter.put(
  API.UPDATE_BRAND,
  celebrate({ ...BrandSchema.idParam, ...BrandSchema.updateBrand }),
  brandController.updateBrand
);
brandRouter.delete(API.DELETE_BRAND, celebrate(BrandSchema.idParam), brandController.deleteBrand);

module.exports = brandRouter;
