const cloudinary = require('cloudinary').v2;
require('dotenv').config(); // make sure you have CLOUDINARY_URL in .env

// Cloudinary automatically reads CLOUDINARY_URL
module.exports = cloudinary;
