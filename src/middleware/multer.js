const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// 配置存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 根据文件类型选择不同的存储目录
        let uploadPath = path.join(process.env.UPLOAD_DIR || 'public/uploads');
        if (file.fieldname === 'avatar') {
            uploadPath = path.join(uploadPath, 'avatars');
        } else if (file.fieldname === 'product') {
            uploadPath = path.join(uploadPath, 'products');
        } else if (file.fieldname === 'material') {
            uploadPath = path.join(uploadPath, 'materials');
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // 生成唯一文件名
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES
        ? process.env.ALLOWED_FILE_TYPES.split(',')
        : ['image/jpeg', 'image/png', 'image/gif'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'), false);
    }
};

// Multer配置
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 默认10MB
        files: 20 // 最多20个文件
    }
});

// 错误处理中间件
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: 'error',
                message: '文件大小超出限制'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                status: 'error',
                message: '文件数量超出限制'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                status: 'error',
                message: '未预期的文件字段'
            });
        }
    }
    
    if (err.message === '不支持的文件类型') {
        return res.status(400).json({
            status: 'error',
            message: err.message
        });
    }

    next(err);
};

module.exports = {
    upload,
    handleUploadError
}; 