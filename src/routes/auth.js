const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// 注册
router.post('/register', register);

// 登录
router.post('/login', login);

// 获取当前用户信息
router.get('/me', protect, getCurrentUser);

module.exports = router; 