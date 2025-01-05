const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const moduleController = require('../controllers/moduleController');
const uploadController = require('../controllers/uploadController');
const upload = require('../utils/uploadUtil');
const downloadController = require('../controllers/downloadController');

// 商品相关路由
router.get('/products', productController.list);             // GET /api/products
router.get('/products/search', productController.search);    // GET /api/products/search
router.get('/products/:id', productController.getDetail);    // GET /api/products/:id
router.post('/products', productController.create);          // POST /api/products
router.put('/products/:id', productController.update);       // PUT /api/products/:id
router.delete('/products/:id', productController.delete);    // DELETE /api/products/:id
router.get('/products/:id/download', downloadController.downloadMaterials);  // GET /api/products/:id/download

// 模块相关路由
router.post('/modules', moduleController.create);            // POST /api/modules
router.put('/modules/:id', moduleController.update);         // PUT /api/modules/:id
router.delete('/modules/:id', moduleController.delete);      // DELETE /api/modules/:id

// 图片上传相关路由
router.post('/modules/:moduleId/images',                     // POST /api/modules/:moduleId/images
    upload.array('images', 20),
    uploadController.uploadModuleImages
);
router.delete('/images/:imageId', uploadController.deleteImage); // DELETE /api/images/:imageId

// 测试环境专用路由
if (process.env.NODE_ENV === 'test') {
    router.use('/test', (req, res, next) => {
        req.isTest = true;
        next();
    });
    router.use('/test', require('./test')); // 测试路由
}

module.exports = router; 