require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');

const app = express();

// 安全配置
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdn.bootcdn.net'],
            styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdn.bootcdn.net'],
            imgSrc: ["'self'", 'data:', 'blob:', process.env.CDN_URL || ''],
            connectSrc: ["'self'", process.env.CDN_URL || ''],
            fontSrc: ["'self'", 'cdn.jsdelivr.net', 'cdn.bootcdn.net'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 响应压缩
app.use(compression());

// CORS配置
app.use(cors({
    origin: process.env.CORS_ORIGINS.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 日志
app.use(requestLogger);

// 请求超时处理
app.use((req, res, next) => {
    res.setTimeout(30000, () => {
        res.status(408).json({
            status: 'error',
            message: '请求超时'
        });
    });
    next();
});

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, '../public/static'), {
    maxAge: '1d',
    etag: true
}));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), {
    maxAge: '1d',
    etag: true
}));

// 初始化路由
const initRoutes = () => {
    // API路由 (统一使用 v1 版本)
    const authRoutes = require('./routes/auth');
    const productRoutes = require('./routes/product');
    const uploadRoutes = require('./routes/upload');
    const userRoutes = require('./routes/user');
    const statsRoutes = require('./routes/stats');
    const materialModuleRoutes = require('./routes/materialModule');
    const userSelectionRoutes = require('./routes/userSelection');
    const downloadRoutes = require('./routes/download');

    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/products', productRoutes);
    app.use('/api/v1/upload', uploadRoutes);
    app.use('/api/v1/users', userRoutes);
    app.use('/api/v1/stats', statsRoutes);
    app.use('/api/v1/material-modules', materialModuleRoutes);
    app.use('/api/v1/selections', userSelectionRoutes);
    app.use('/api/v1/downloads', downloadRoutes);
};

// 前端路由处理
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/*.html', (req, res) => {
    const page = req.path.substring(1);
    const filePath = path.join(__dirname, '../public', page);
    res.sendFile(filePath, err => {
        if (err) {
            res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
        }
    });
});

// 404错误处理
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

// 错误处理
app.use(errorHandler);

module.exports = { app, initRoutes }; 