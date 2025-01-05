const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const productController = require('../controllers/productController');

// 获取商品列表
router.get('/', productController.getProducts);

// 获取单个商品
router.get('/:id', productController.getProduct);

// 创建商品 (需要登录)
router.post('/', protect, productController.createProduct);

// 更新商品 (需要登录)
router.patch('/:id', protect, productController.updateProduct);

// 删除商品 (需要登录)
router.delete('/:id', protect, productController.deleteProduct);

module.exports = router; 