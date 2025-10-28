const express = require('express');
const brandRouter = express.Router();
const brandController = require('../../controllers/brands/brand.controller');
const BrandSchema = require('../../request-schemas/brand.schema');
const { celebrate } = require('celebrate');

const API = {
  ADD_BRAND: '/add',
  GET_ALL_BRANDS: '/all',
  GET_BRAND: '/:id',
  UPDATE_BRAND: '/update/:id',
  DELETE_BRAND: '/delete/:id',
};


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
 *     summary: Get all brands with optional filters and pagination
 *     description: >
 *       Fetch a paginated list of brands. You can filter results by fields like
 *       `_id`, `status`, `name`, `email`, `phoneNumber`, `websiteUrl`, and `postcode`.
 *
 *       **Example URLs:**
 *       - `/api/brand/all` → Get all brands (default pagination)
 *       - `/api/brand/all?page=2&limit=5` → Get 5 brands per page, page 2
 *       - `/api/brand/all?name=Adidas` → Search brands by name
 *       - `/api/brand/all?email=support@nike.com` → Filter by email
 *       - `/api/brand/all?status=active` → Filter by brand status
 *       - `/api/brand/all?postcode=90210` → Filter by postcode
 *       - `/api/brand/all?name=Nike&status=active` → Combine filters
 *
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number (for pagination)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of items per page
 *       - in: query
 *         name: _id
 *         schema:
 *           type: string
 *         description: Filter by brand ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           example: active
 *         description: Filter by brand status
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *           example: Nike
 *         description: Filter by brand name
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           example: support@nike.com
 *         description: Filter by brand email
 *       - in: query
 *         name: phoneNumber
 *         schema:
 *           type: string
 *           example: +1-555-1234
 *         description: Filter by phone number
 *       - in: query
 *         name: websiteUrl
 *         schema:
 *           type: string
 *           example: https://www.nike.com
 *         description: Filter by website URL
 *       - in: query
 *         name: postcode
 *         schema:
 *           type: string
 *           example: 90210
 *         description: Filter by postcode
 *     responses:
 *       200:
 *         description: Array of brands with pagination info
 *         content:
 *           application/json:
 *             example:
 *               message: All brands fetched successfully
 *               data:
 *                 - _id: "64b9f2d1234abcd56789ef01"
 *                   name: "Nike"
 *                   email: "support@nike.com"
 *                   status: "active"
 *               pagination:
 *                 total: 42
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 5
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
 *     description: >
 *       Update specific details of an existing brand by its unique ID.
 *       You can update one or more of the brand fields such as name, email,
 *       phone number, website, description, logo URL, status, and postcode.
 *
 *       **Example URL:**
 *       - `/api/brand/update/64b9f2d1234abcd56789ef01`
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 64b9f2d1234abcd56789ef01
 *         description: Brand ID to update
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Adidas Originals"
 *               email:
 *                 type: string
 *                 example: "contact@adidas.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1-800-555-9876"
 *               logoUrl:
 *                 type: string
 *                 example: "https://cdn.adidas.com/logo.png"
 *               websiteUrl:
 *                 type: string
 *                 example: "https://www.adidas.com"
 *               description:
 *                 type: string
 *                 example: "Updated description of the Adidas brand."
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *               postcode:
 *                 type: string
 *                 example: "75001"
 *             description: >
 *               Fields you want to update. You can send one or multiple fields.
 *
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Brand updated successfully"
 *               data:
 *                 _id: "64b9f2d1234abcd56789ef01"
 *                 name: "Adidas Originals"
 *                 email: "contact@adidas.com"
 *                 phoneNumber: "+1-800-555-9876"
 *                 websiteUrl: "https://www.adidas.com"
 *                 description: "Updated description of the Adidas brand."
 *                 status: "active"
 *                 postcode: "75001"
 *                 updatedAt: "2025-10-28T10:15:30.000Z"
 *       400:
 *         description: Validation error (invalid input)
 *         content:
 *           application/json:
 *             example:
 *               message: "Validation failed: Invalid email format"
 *       404:
 *         description: Brand not found
 *         content:
 *           application/json:
 *             example:
 *               message: "Brand not found"
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
