const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const userSelectionController = require('../controllers/userSelectionController');

// 获取用户选择列表
router.get('/', protect, userSelectionController.getSelections);

// 获取单个选择记录
router.get('/:id', protect, userSelectionController.getSelection);

// 创建选择记录
router.post('/', protect, userSelectionController.createSelection);

// 更新选择记录
router.patch('/:id', protect, userSelectionController.updateSelection);

// 删除选择记录
router.delete('/:id', protect, userSelectionController.deleteSelection);

// 完成选择
router.post('/:id/complete', protect, userSelectionController.completeSelection);

// 下载选择的素材
router.post('/:id/download', protect, userSelectionController.downloadSelection);

module.exports = router; 