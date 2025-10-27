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

/**
 * @swagger
 * tags:
 *   - name: Brand
 *     description: Brand management endpoints
 */

/**
 * @swagger
 * /api/brand/info:
 *   get:
 *     tags: [Brand]
 *     summary: API info for brand routes
 *     description: Returns available brand routes and sample bodies.
 *     responses:
 *       200:
 *         description: Info object
 */
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

/**
 * @swagger
 * /api/brand/add:
 *   post:
 *     tags: [Brand]
 *     summary: Create a new brand
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               logoUrl:
 *                 type: string
 *               websiteUrl:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               postcode:
 *                 type: string
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Brand created
 *       400:
 *         description: Validation error
 */
brandRouter.post(API.ADD_BRAND, celebrate(BrandSchema.addBrand), brandController.createBrand);

/**
 * @swagger
 * /api/brand/all:
 *   get:
 *     tags: [Brand]
 *     summary: Get all brands
 *     responses:
 *       200:
 *         description: Array of brands
 */
brandRouter.get(API.GET_ALL_BRANDS, brandController.getAllBrands);

/**
 * @swagger
 * /api/brand/{id}:
 *   get:
 *     tags: [Brand]
 *     summary: Get brand by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Brand object id
 *     responses:
 *       200:
 *         description: Brand object
 *       404:
 *         description: Not found
 */
brandRouter.get(API.GET_BRAND, celebrate(BrandSchema.idParam), brandController.getBrandById);

/**
 * @swagger
 * /api/brand/update/{id}:
 *   put:
 *     tags: [Brand]
 *     summary: Update a brand by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Brand id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Brand updated
 *       400:
 *         description: Validation error
 */
brandRouter.put(
  API.UPDATE_BRAND,
  celebrate({ ...BrandSchema.idParam, ...BrandSchema.updateBrand }),
  brandController.updateBrand
);

/**
 * @swagger
 * /api/brand/delete/{id}:
 *   delete:
 *     tags: [Brand]
 *     summary: Delete a brand by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Brand id
 *     responses:
 *       200:
 *         description: Brand deleted
 *       404:
 *         description: Not found
 */
brandRouter.delete(API.DELETE_BRAND, celebrate(BrandSchema.idParam), brandController.deleteBrand);

module.exports = brandRouter;
