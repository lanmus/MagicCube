const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const uploadController = require('../controllers/uploadController');
const { upload } = require('../middleware/multer');

// 上传单个文件
router.post('/single', protect, upload.single('file'), uploadController.uploadSingle);

// 上传多个文件
router.post('/multiple', protect, upload.array('files', 10), uploadController.uploadMultiple);

// 上传商品图片
router.post('/product-image', protect, upload.single('image'), uploadController.uploadProductImage);

// 上传商品素材
router.post('/product-material', protect, upload.array('materials', 20), uploadController.uploadProductMaterial);

module.exports = router; 