const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { UserSelection } = require('../models/userSelection');
const { Product } = require('../models/product');
const { MaterialModule } = require('../models/materialModule');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { cacheGet, cacheSet, cacheDelete } = require('../config/redis');
const { logger } = require('../utils/logger');

// 生成下载链接
const generateDownloadLink = asyncHandler(async (req, res) => {
    const { selectionId } = req.params;

    const selection = await UserSelection.findById(selectionId)
        .populate('productId')
        .populate({
            path: 'selections.moduleId',
            populate: {
                path: 'materials'
            }
        });

    if (!selection) {
        throw new AppError('选择记录不存在', 404);
    }

    // 检查权限
    if (selection.userId.toString() !== req.user._id.toString()) {
        throw new AppError('没有权限下载此选择', 403);
    }

    // 检查选择是否完成
    if (selection.status !== 'completed') {
        throw new AppError('选择尚未完成，无法下载', 400);
    }

    // 生成唯一的下载令牌
    const downloadToken = require('crypto').randomBytes(32).toString('hex');
    
    // 缓存下载信息（有效期30分钟）
    const downloadInfo = {
        selectionId: selection._id,
        userId: req.user._id,
        productId: selection.productId._id,
        createdAt: Date.now()
    };
    await cacheSet(`download:${downloadToken}`, JSON.stringify(downloadInfo), 1800);

    res.status(200).json({
        status: 'success',
        data: {
            downloadUrl: `/api/downloads/${downloadToken}`,
            expiresIn: 1800 // 30分钟
        }
    });
});

// 执行下载
const downloadFiles = asyncHandler(async (req, res) => {
    const { token } = req.params;

    // 获取并验证下载信息
    const downloadInfoStr = await cacheGet(`download:${token}`);
    if (!downloadInfoStr) {
        throw new AppError('下载链接已过期或无效', 400);
    }

    const downloadInfo = JSON.parse(downloadInfoStr);

    // 验证用户权限
    if (downloadInfo.userId.toString() !== req.user._id.toString()) {
        throw new AppError('无权访问此下载', 403);
    }

    // 获取选择记录
    const selection = await UserSelection.findById(downloadInfo.selectionId)
        .populate('productId')
        .populate({
            path: 'selections.moduleId',
            populate: {
                path: 'materials'
            }
        });

    if (!selection) {
        throw new AppError('选择记录不存在', 404);
    }

    // 创建ZIP文件
    const archive = archiver('zip', {
        zlib: { level: 9 } // 最大压缩级别
    });

    // 设置响应头
    res.attachment(`${selection.productId.name}-${selection._id}.zip`);
    archive.pipe(res);

    // 添加选中的文件到ZIP
    for (const moduleSelection of selection.selections) {
        const module = moduleSelection.moduleId;
        const material = module.materials.id(moduleSelection.materialId);

        if (material) {
            const filePath = path.join(process.cwd(), 'public', material.url);
            if (fs.existsSync(filePath)) {
                // 使用模块名称作为文件夹名
                const folderName = module.name.replace(/[^a-zA-Z0-9-_]/g, '_');
                archive.file(filePath, { 
                    name: `${folderName}/${material.filename}` 
                });
            }
        }
    }

    // 添加说明文档
    const readmeContent = generateReadmeContent(selection);
    archive.append(readmeContent, { name: 'README.txt' });

    // 完成打包
    await archive.finalize();

    // 清除下载令牌
    await cacheDelete(`download:${token}`);

    // 记录下载统计
    await updateDownloadStats(selection);
});

// 生成说明文档内容
const generateReadmeContent = (selection) => {
    const { productId, selections } = selection;
    let content = '';

    content += `商品名称: ${productId.name}\n`;
    content += `商品编号: ${productId.spuCode}\n`;
    content += `下载时间: ${new Date().toLocaleString()}\n\n`;
    content += '选择的素材清单:\n';

    selections.forEach(({ moduleId, materialId }) => {
        const material = moduleId.materials.id(materialId);
        content += `\n${moduleId.name}:\n`;
        content += `- 文件名: ${material.filename}\n`;
        content += `- 文件大小: ${formatFileSize(material.filesize)}\n`;
        if (material.width && material.height) {
            content += `- 尺寸: ${material.width}x${material.height}\n`;
        }
    });

    content += '\n使用须知:\n';
    content += '1. 本素材包仅供购买者个人使用\n';
    content += '2. 禁止转售或分享给他人\n';
    content += '3. 使用素材时请遵守相关法律法规\n';

    return content;
};

// 格式化文件大小
const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// 更新下载统计
const updateDownloadStats = async (selection) => {
    try {
        // 更新商品下载次数
        await Product.findByIdAndUpdate(selection.productId._id, {
            $inc: { downloadCount: 1 }
        });

        // 更新用户选择记录
        selection.downloadCount = (selection.downloadCount || 0) + 1;
        selection.lastDownloadAt = new Date();
        await selection.save();

        // 更新统计缓存
        await cacheDelete(`stats:downloads:daily`);
        await cacheDelete(`stats:downloads:monthly`);
    } catch (error) {
        logger.error('更新下载统计失败:', error);
    }
};

// 获取下载历史
const getDownloadHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const selections = await UserSelection.find({
        userId: req.user._id,
        downloadCount: { $gt: 0 }
    })
    .sort({ lastDownloadAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('productId', 'name spuCode');

    const total = await UserSelection.countDocuments({
        userId: req.user._id,
        downloadCount: { $gt: 0 }
    });

    res.status(200).json({
        status: 'success',
        data: {
            downloads: selections,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// 获取下载统计
const getDownloadStats = asyncHandler(async (req, res) => {
    const { timeRange = 'monthly' } = req.query;
    const cacheKey = `stats:downloads:${timeRange}:${req.user._id}`;

    // 尝试从缓存获取
    const cachedStats = await cacheGet(cacheKey);
    if (cachedStats) {
        return res.status(200).json(JSON.parse(cachedStats));
    }

    // 计算时间范围
    const now = new Date();
    let startDate;
    if (timeRange === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (timeRange === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
        throw new AppError('无效的时间范围', 400);
    }

    // 获取统计数据
    const stats = await UserSelection.aggregate([
        {
            $match: {
                userId: req.user._id,
                lastDownloadAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                totalDownloads: { $sum: '$downloadCount' },
                uniqueProducts: { $addToSet: '$productId' }
            }
        }
    ]);

    const result = {
        status: 'success',
        data: {
            timeRange,
            period: {
                start: startDate,
                end: now
            },
            stats: stats[0] ? {
                totalDownloads: stats[0].totalDownloads,
                uniqueProducts: stats[0].uniqueProducts.length
            } : {
                totalDownloads: 0,
                uniqueProducts: 0
            }
        }
    };

    // 缓存结果（1小时）
    await cacheSet(cacheKey, JSON.stringify(result), 3600);

    res.status(200).json(result);
});

module.exports = {
    generateDownloadLink,
    downloadFiles,
    getDownloadHistory,
    getDownloadStats
}; 