const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

// 文件存储配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // 生成唯一文件名
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        cb(null, `${Date.now()}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES.split(',');
    
    if (!allowedTypes.includes(file.mimetype)) {
        const error = new Error('Invalid file type');
        error.code = 'INVALID_FILE_TYPE';
        logger.warn(`File upload rejected: Invalid type ${file.mimetype}`);
        return cb(error, false);
    }

    cb(null, true);
};

// Multer 配置
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE),
        files: 20 // 每次最多上传20个文件
    }
});

// 错误处理中间件
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        logger.error('Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: '文件大小超出限制'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: '文件数量超出限制'
            });
        }
        return res.status(400).json({
            error: '文件上传错误'
        });
    }
    
    if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
            error: '不支持的文件类型'
        });
    }

    next(err);
};

module.exports = {
    upload,
    handleMulterError
}; 