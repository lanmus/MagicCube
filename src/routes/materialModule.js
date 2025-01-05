const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const materialModuleController = require('../controllers/materialModuleController');

// 获取材料模块列表
router.get('/', materialModuleController.getModules);

// 获取单个材料模块
router.get('/:id', materialModuleController.getModule);

// 创建材料模块 (需要登录)
router.post('/', protect, materialModuleController.createModule);

// 更新材料模块 (需要登录)
router.patch('/:id', protect, materialModuleController.updateModule);

// 删除材料模块 (需要登录)
router.delete('/:id', protect, materialModuleController.deleteModule);

// 添加素材到模块
router.post('/:id/materials', protect, materialModuleController.addMaterials);

// 删除模块中的素材
router.delete('/:id/materials/:materialId', protect, materialModuleController.deleteMaterial);

module.exports = router; 