const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const detectionController = require('../controllers/detectionController');

// optionally attach user if token present, but don't require it
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      req.user = null;
    }
  }
  next();
}

router.post('/analyze', optionalAuth, upload.single('image'), detectionController.analyzeImage);

module.exports = router;
