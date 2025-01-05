const jwt = require('jsonwebtoken');
const { User } = require('../models/user');
const { asyncHandler } = require('../middleware/errorHandler');

// 注册
const register = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
        res.status(400).json({
            status: 'error',
            message: '该邮箱已被注册'
        });
        return;
    }

    // 创建新用户
    const user = await User.create({
        username,
        email,
        password
    });

    // 生成 token
    const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
        status: 'success',
        data: {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token
        }
    });
});

// 登录
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 检查用户是否存在
    const user = await User.findByEmail(email);
    if (!user) {
        res.status(401).json({
            status: 'error',
            message: '邮箱或密码错误'
        });
        return;
    }

    // 验证密码
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
        res.status(401).json({
            status: 'error',
            message: '邮箱或密码错误'
        });
        return;
    }

    // 生成 token
    const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
        status: 'success',
        data: {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token
        }
    });
});

// 获取当前用户信息
const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    res.json({
        status: 'success',
        data: {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        }
    });
});

module.exports = {
    register,
    login,
    getCurrentUser
}; 