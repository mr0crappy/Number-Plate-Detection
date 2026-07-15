const path = require('path');

module.exports = {
  uploadDir: path.join(__dirname, '..', 'uploads'),
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'],
};
