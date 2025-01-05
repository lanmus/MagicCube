const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const statsController = require('../controllers/statsController');

// 获取总体统计数据
router.get('/overview', protect, statsController.getOverview);

// 获取上传统计
router.get('/uploads', protect, statsController.getUploadStats);

// 获取下载统计
router.get('/downloads', protect, statsController.getDownloadStats);

// 获取性能监控数据
router.get('/performance', protect, statsController.getPerformanceStats);

module.exports = router; 