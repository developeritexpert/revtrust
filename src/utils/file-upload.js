const fs = require('fs');
const path = require('path');


const deleteFile = (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(process.cwd(), filePath); 
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== 'ENOENT') console.error('Error deleting file:', err);
  });
};


const getFilePath = (file) => (file ? file.path.replace(/\\/g, '/') : null);


const getFileUrl = (filePath, req) => {
  if (!filePath) return null;
  const normalizedPath = filePath.replace(/^.*uploads[\\/]/, 'uploads/').replace(/\\/g, '/');
  const baseUrl = process.env.BACKEND_LINK || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/${normalizedPath}`;
};


const ensureUploadDir = (dir) => {
  const fullPath = path.join(process.cwd(), 'uploads', dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
};

module.exports = {
  deleteFile,
  getFilePath,
  getFileUrl,
  ensureUploadDir,
};
