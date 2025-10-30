const cloudinary = require('./cloudinary.config');
const { ErrorHandler } = require('../utils/error-handler');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new ErrorHandler(400, 'Only image files (JPEG, PNG, GIF, WEBP) are allowed'), false);
  },
});

const cloudinaryUpload = (fieldName = 'file', folder = 'default_folder') => {
  return [
    upload.single(fieldName),
    async (req, res, next) => {
      try {
        if (!req.file) return next();

        const stream = cloudinary.uploader.upload_stream(
          { folder },
          (error, result) => {
            if (error) return next(new ErrorHandler(500, error.message));
            req.file.cloudinaryUrl = result.secure_url;
            next();
          }
        );

        stream.end(req.file.buffer);
      } catch (err) {
        next(err);
      }
    },
  ];
};

module.exports = cloudinaryUpload;
