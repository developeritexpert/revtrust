const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ErrorHandler } = require('../utils/error-handler');


const createUpload = (folderName) => {
  if (!folderName) throw new Error('Folder name is required');

  const uploadDir = path.join(process.cwd(), 'uploads', folderName);

  // Ensure folder exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, folderName + '-' + uniqueSuffix + path.extname(file.originalname));
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new ErrorHandler(400, 'Only image files (JPEG, PNG, GIF, WEBP) are allowed'), false);
  };

  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
};

module.exports = createUpload;
