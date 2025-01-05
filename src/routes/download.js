const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const downloadController = require('../controllers/downloadController');

// 生成下载链接
router.post('/:selectionId/generate-link', protect, downloadController.generateDownloadLink);

// 执行下载
router.get('/:token', downloadController.downloadFiles);

// 获取下载历史
router.get('/history', protect, downloadController.getDownloadHistory);

// 获取下载统计
router.get('/stats', protect, downloadController.getDownloadStats);

module.exports = router; 