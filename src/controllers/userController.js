const { pool } = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserController {
    // 用户注册
    register = asyncHandler(async (req, res) => {
        const { username, email, password } = req.body;

        // 检查用户名是否已存在
        const [[existingUser]] = await pool.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            throw new AppError('用户名或邮箱已存在', 400);
        }

        // 加密密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 创建新用户
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: result.insertId,
                    username,
                    email
                }
            }
        });
    });

    // 用户登录
    login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        // 查找用户
        const [[user]] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new AppError('邮箱或密码错误', 401);
        }

        // 生成 JWT token
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // 不返回密码
        delete user.password;

        res.json({
            status: 'success',
            data: {
                token,
                user
            }
        });
    });

    // 获取当前用户信息
    getCurrentUser = asyncHandler(async (req, res) => {
        const [[user]] = await pool.query(
            'SELECT id, username, email, role, status, created_at, updated_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (!user) {
            throw new AppError('用户不存在', 404);
        }

        res.json({
            status: 'success',
            data: { user }
        });
    });

    // 更新当前用户信息
    updateCurrentUser = asyncHandler(async (req, res) => {
        const { username, email } = req.body;

        // 检查用户名和邮箱是否已被其他用户使用
        const [[existingUser]] = await pool.query(
            'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
            [username, email, req.user.id]
        );

        if (existingUser) {
            throw new AppError('用户名或邮箱已被使用', 400);
        }

        // 更新用户信息
        await pool.query(
            'UPDATE users SET username = ?, email = ? WHERE id = ?',
            [username, email, req.user.id]
        );

        res.json({
            status: 'success',
            data: {
                user: {
                    id: req.user.id,
                    username,
                    email
                }
            }
        });
    });

    // 更新密码
    updatePassword = asyncHandler(async (req, res) => {
        const { currentPassword, newPassword } = req.body;

        // 获取当前用户
        const [[user]] = await pool.query(
            'SELECT password FROM users WHERE id = ?',
            [req.user.id]
        );

        // 验证当前密码
        if (!(await bcrypt.compare(currentPassword, user.password))) {
            throw new AppError('当前密码错误', 401);
        }

        // 加密新密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 更新密码
        await pool.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, req.user.id]
        );

        res.json({
            status: 'success',
            message: '密码更新成功'
        });
    });

    // 更新头像
    updateAvatar = asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new AppError('请上传头像', 400);
        }

        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        // 更新用户头像
        await pool.query(
            'UPDATE users SET avatar = ? WHERE id = ?',
            [avatarUrl, req.user.id]
        );

        res.json({
            status: 'success',
            data: {
                avatar: avatarUrl
            }
        });
    });

    // 获取用户上传历史
    getUploads = asyncHandler(async (req, res) => {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const [[{ total }], uploads] = await Promise.all([
            pool.query('SELECT COUNT(*) as total FROM materials WHERE created_by = ?', [req.user.id]),
            pool.query(
                `SELECT m.*, p.name as product_name 
                 FROM materials m 
                 LEFT JOIN products p ON m.product_id = p.id 
                 WHERE m.created_by = ? 
                 ORDER BY m.created_at DESC 
                 LIMIT ? OFFSET ?`,
                [req.user.id, parseInt(limit), offset]
            )
        ]);

        res.json({
            status: 'success',
            data: {
                uploads: uploads[0],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    });

    // 获取用户下载历史
    getDownloads = asyncHandler(async (req, res) => {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const [[{ total }], downloads] = await Promise.all([
            pool.query('SELECT COUNT(*) as total FROM downloads WHERE user_id = ?', [req.user.id]),
            pool.query(
                `SELECT d.*, m.file_name, m.file_path, p.name as product_name 
                 FROM downloads d 
                 LEFT JOIN materials m ON d.material_id = m.id 
                 LEFT JOIN products p ON m.product_id = p.id 
                 WHERE d.user_id = ? 
                 ORDER BY d.created_at DESC 
                 LIMIT ? OFFSET ?`,
                [req.user.id, parseInt(limit), offset]
            )
        ]);

        res.json({
            status: 'success',
            data: {
                downloads: downloads[0],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    });
}

module.exports = new UserController(); 