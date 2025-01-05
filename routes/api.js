const express = require('express');
const router = express.Router();

// 商品相关路由
router.post('/products', productController.create);           // 创建商品
router.get('/products', productController.list);             // 获取商品列表
router.get('/products/:id', productController.detail);       // 获取商品详情
router.put('/products/:id', productController.update);       // 更新商品
router.delete('/products/:id', productController.delete);    // 删除商品

// 模块相关路由
router.post('/modules', moduleController.create);            // 创建模块
router.put('/modules/:id', moduleController.update);         // 更新模块
router.delete('/modules/:id', moduleController.delete);      // 删除模块

// 图片上传相关路由
router.post('/upload', uploadController.upload);             // 上传图片
router.delete('/images/:id', uploadController.delete);       // 删除图片

// 搜索相关路由
router.get('/search', searchController.search);              // 搜索商品

module.exports = router; 