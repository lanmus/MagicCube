const jwt = require('jsonwebtoken');
const { User } = require('../models/user');

const protect = async (req, res, next) => {
    try {
        // 获取token
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: '请先登录'
            });
        }

        // 验证token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 检查用户是否存在
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: '用户不存在'
            });
        }

        // 将用户信息添加到请求对象
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            status: 'error',
            message: '认证失败'
        });
    }
};

// 检查用户角色
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: '没有权限执行此操作'
            });
        }
        next();
    };
};

module.exports = {
    protect,
    restrictTo
}; 