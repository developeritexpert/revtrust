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

/**
 * @swagger
 * /api/product/add:
 *   post:
 *     tags: [Product]
 *     summary: Create a new product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nike Air Max 270"
 *               handle:
 *                 type: string
 *                 example: "nike-air-max-270"
 *               brandId:
 *                 type: string
 *                 example: "64b9f2d1234abcd56789ef01"
 *               image:
 *                 type: string
 *                 example: "https://cdn.shop.com/images/nike-air-max.jpg"
 *               price:
 *                 type: number
 *                 example: 150.00
 *               stockQuantity:
 *                 type: number
 *                 example: 50
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: "ACTIVE"
 *             required:
 *               - name
 *               - handle
 *               - brandId
 *               - price
 *               - stockQuantity
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Product with this handle already exists
 */
productRouter.post(API.ADD_PRODUCT, celebrate(ProductSchema.addProduct), productController.createProduct);

/**
 * @swagger
 * /api/product/all:
 *   get:
 *     tags: [Product]
 *     summary: Get all products with optional filters and pagination
 *     description: >
 *       Fetch a paginated list of products. You can filter results by fields like
 *       `_id`, `name`, `handle`, `brandId`, `status`, `minPrice`, `maxPrice`, and `inStock`.
 *
 *       **Example URLs:**
 *       - `/api/product/all` → Get all products (default pagination)
 *       - `/api/product/all?page=2&limit=5` → Get 5 products per page, page 2
 *       - `/api/product/all?name=Nike` → Search products by name
 *       - `/api/product/all?brandId=64b9f2d1234abcd56789ef01` → Filter by brand
 *       - `/api/product/all?status=ACTIVE` → Filter by status
 *       - `/api/product/all?minPrice=50&maxPrice=200` → Filter by price range
 *       - `/api/product/all?inStock=true` → Filter only in-stock products
 *       - `/api/product/all?name=Air&status=ACTIVE&minPrice=100` → Combine filters
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
 *         description: Filter by product ID
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *           example: "Nike"
 *         description: Filter by product name (partial match)
 *       - in: query
 *         name: handle
 *         schema:
 *           type: string
 *           example: "nike-air-max"
 *         description: Filter by product handle
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: string
 *           example: "64b9f2d1234abcd56789ef01"
 *         description: Filter by brand ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           example: "ACTIVE"
 *         description: Filter by product status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           example: 50
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           example: 200
 *         description: Maximum price filter
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *           example: true
 *         description: Filter by stock availability
 *     responses:
 *       200:
 *         description: Array of products with pagination info
 *         content:
 *           application/json:
 *             example:
 *               message: All products fetched successfully
 *               data:
 *                 - _id: "64b9f2d1234abcd56789ef01"
 *                   name: "Nike Air Max 270"
 *                   handle: "nike-air-max-270"
 *                   price: 150.00
 *                   stockQuantity: 50
 *                   status: "ACTIVE"
 *               pagination:
 *                 total: 42
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 5
 */
productRouter.get(API.GET_ALL_PRODUCTS, productController.getAllProducts);

/**
 * @swagger
 * /api/product/{id}:
 *   get:
 *     tags: [Product]
 *     summary: Get product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product object id
 *     responses:
 *       200:
 *         description: Product object
 *       404:
 *         description: Product not found
 */
productRouter.get(API.GET_PRODUCT, celebrate(ProductSchema.idParam), productController.getProductById);

/**
 * @swagger
 * /api/product/update/{id}:
 *   put:
 *     tags: [Product]
 *     summary: Update a product by ID
 *     description: >
 *       Update specific details of an existing product by its unique ID.
 *       You can update one or more of the product fields such as name, handle,
 *       brandId, image, price, stockQuantity, and status.
 *
 *       **Example URL:**
 *       - `/api/product/update/64b9f2d1234abcd56789ef01`
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "64b9f2d1234abcd56789ef01"
 *         description: Product ID to update
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
 *                 example: "Nike Air Max 270 React"
 *               handle:
 *                 type: string
 *                 example: "nike-air-max-270-react"
 *               brandId:
 *                 type: string
 *                 example: "64b9f2d1234abcd56789ef01"
 *               image:
 *                 type: string
 *                 example: "https://cdn.shop.com/images/nike-air-max-react.jpg"
 *               price:
 *                 type: number
 *                 example: 175.00
 *               stockQuantity:
 *                 type: number
 *                 example: 75
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 example: "ACTIVE"
 *             description: >
 *               Fields you want to update. You can send one or multiple fields.
 *
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Product updated successfully"
 *               data:
 *                 _id: "64b9f2d1234abcd56789ef01"
 *                 name: "Nike Air Max 270 React"
 *                 handle: "nike-air-max-270-react"
 *                 price: 175.00
 *                 stockQuantity: 75
 *                 status: "ACTIVE"
 *                 updatedAt: "2025-10-28T10:15:30.000Z"
 *       400:
 *         description: Validation error (invalid input)
 *       404:
 *         description: Product not found
 */
productRouter.put(
  API.UPDATE_PRODUCT,
  celebrate({ ...ProductSchema.idParam, ...ProductSchema.updateProduct }),
  productController.updateProduct
);

/**
 * @swagger
 * /api/product/delete/{id}:
 *   delete:
 *     tags: [Product]
 *     summary: Delete a product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product id
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
productRouter.delete(API.DELETE_PRODUCT, celebrate(ProductSchema.idParam), productController.deleteProduct);

module.exports = productRouter;