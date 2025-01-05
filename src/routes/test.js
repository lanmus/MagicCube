const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const uploadController = require('../controllers/uploadController');
const downloadController = require('../controllers/downloadController');

// 测试路由不需要认证中间件
router.post('/products', productController.create);
router.get('/products', productController.list);
router.get('/products/:id', productController.getDetail);
router.put('/products/:id', productController.update);
router.delete('/products/:id', productController.delete);

router.post('/modules/:id/images', uploadController.uploadImages);
router.get('/download/:id', downloadController.downloadProduct);

module.exports = router; 