const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const userController = require('../controllers/userController');

// 获取当前用户信息
router.get('/me', protect, userController.getCurrentUser);

// 更新当前用户信息
router.patch('/me', protect, userController.updateCurrentUser);

// 更新密码
router.patch('/me/password', protect, userController.updatePassword);

// 更新头像
router.patch('/me/avatar', protect, userController.updateAvatar);

// 获取用户上传历史
router.get('/me/uploads', protect, userController.getUploads);

// 获取用户下载历史
router.get('/me/downloads', protect, userController.getDownloads);

module.exports = router; 