const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const historyController = require('../controllers/historyController');

router.get('/', verifyToken, historyController.getHistory);
router.delete('/:id', verifyToken, historyController.deleteEntry);
router.delete('/', verifyToken, historyController.clearHistory);

module.exports = router;
