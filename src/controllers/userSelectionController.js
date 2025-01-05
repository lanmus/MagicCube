const { UserSelection } = require('../models/userSelection');
const { Product } = require('../models/product');
const { MaterialModule } = require('../models/materialModule');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { cacheGet, cacheSet, cacheDelete } = require('../config/redis');
const { logger } = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const archiver = require('archiver');

// 创建选择记录
const createSelection = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    
    // 检查商品是否存在
    const product = await Product.findById(productId)
        .populate({
            path: 'modules',
            match: { status: 'active' }
        });

    if (!product) {
        throw new AppError('商品不存在', 404);
    }

    // 检查是否已有进行中的选择
    const existingSelection = await UserSelection.findOne({
        userId: req.user._id,
        productId,
        status: 'draft'
    });

    if (existingSelection) {
        return res.status(200).json({
            status: 'success',
            data: { selection: existingSelection }
        });
    }

    // 创建新的选择记录
    const selection = await UserSelection.create({
        userId: req.user._id,
        productId,
        selections: []
    });

    res.status(201).json({
        status: 'success',
        data: { selection }
    });
});

// 获取选择记录列表
const getSelections = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    // 构建查询条件
    const query = { userId: req.user._id };
    if (status) query.status = status;

    // 缓存键
    const cacheKey = `selections:${req.user._id}:${JSON.stringify({ query, page, limit })}`;
    
    // 尝试从缓存获取
    const cachedData = await cacheGet(cacheKey);
    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    // 执行查询
    const skip = (page - 1) * limit;
    const [selections, total] = await Promise.all([
        UserSelection.find(query)
            .sort('-createdAt')
            .skip(skip)
            .limit(parseInt(limit))
            .populate('productId', 'name spuCode'),
        UserSelection.countDocuments(query)
    ]);

    const data = {
        status: 'success',
        data: {
            selections,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        }
    };

    // 设置缓存
    await cacheSet(cacheKey, JSON.stringify(data), 300);

    res.status(200).json(data);
});

// 获取选择记录详情
const getSelection = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const selection = await UserSelection.findById(id)
        .populate('productId')
        .populate('selections.moduleId');

    if (!selection) {
        throw new AppError('选择记录不存在', 404);
    }

    // 检查权限
    if (selection.userId.toString() !== req.user._id.toString()) {
        throw new AppError('没有权限查看此选择记录', 403);
    }

    res.status(200).json({
        status: 'success',
        data: { selection }
    });
});

// 更新选择
const updateSelection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { moduleId, materialId } = req.body;

    const selection = await UserSelection.findById(id);
    
    if (!selection) {
        throw new AppError('选择记录不存在', 404);
    }

    // 检查权限
    if (selection.userId.toString() !== req.user._id.toString()) {
        throw new AppError('没有权限修改此选择记录', 403);
    }

    if (selection.status === 'completed') {
        throw new AppError('已完成的选择记录不能修改', 400);
    }

    // 验证模块和素材是否存在
    const module = await MaterialModule.findById(moduleId);
    if (!module) {
        throw new AppError('模块不存在', 404);
    }

    const material = module.materials.id(materialId);
    if (!material) {
        throw new AppError('素材不存在', 404);
    }

    // 更新或添加选择
    const selectionIndex = selection.selections.findIndex(
        s => s.moduleId.toString() === moduleId
    );

    if (selectionIndex > -1) {
        selection.selections[selectionIndex].materialId = materialId;
    } else {
        selection.selections.push({ moduleId, materialId });
    }

    await selection.save();

    // 清除缓存
    await cacheDelete(`selections:${req.user._id}`);

    res.status(200).json({
        status: 'success',
        data: { selection }
    });
});

// 删除选择
const deleteSelection = asyncHandler(async (req, res) => {
    const { id, moduleId } = req.params;

    const selection = await UserSelection.findById(id);
    
    if (!selection) {
        throw new AppError('选择记录不存在', 404);
    }

    // 检查权限
    if (selection.userId.toString() !== req.user._id.toString()) {
        throw new AppError('没有权限修改此选择记录', 403);
    }

    if (selection.status === 'completed') {
        throw new AppError('已完成的选择记录不能修改', 400);
    }

    // 删除指定模块的选择
    selection.selections = selection.selections.filter(
        s => s.moduleId.toString() !== moduleId
    );

    await selection.save();

    // 清除缓存
    await cacheDelete(`selections:${req.user._id}`);

    res.status(200).json({
        status: 'success',
        data: { selection }
    });
});

// 完成选择
const completeSelection = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const selection = await UserSelection.findById(id)
        .populate({
            path: 'productId',
            populate: {
                path: 'modules',
                match: { status: 'active' }
            }
        });
    
    if (!selection) {
        throw new AppError('选择记录不存在', 404);
    }

    // 检查权限
    if (selection.userId.toString() !== req.user._id.toString()) {
        throw new AppError('没有权限修改此选择记录', 403);
    }

    if (selection.status === 'completed') {
        throw new AppError('选择记录已经完成', 400);
    }

    // 验证是否所有必需模块都已选择
    const requiredModules = selection.productId.modules;
    const selectedModules = new Set(selection.selections.map(s => s.moduleId.toString()));

    const missingModules = requiredModules.filter(
        module => !selectedModules.has(module._id.toString())
    );

    if (missingModules.length > 0) {
        throw new AppError(`以下模块尚未选择: ${missingModules.map(m => m.name).join(', ')}`, 400);
    }

    // 更新状态为已完成
    selection.status = 'completed';
    await selection.save();

    // 清除缓存
    await cacheDelete(`selections:${req.user._id}`);

    res.status(200).json({
        status: 'success',
        data: { selection }
    });
});

// 下载选择的素材
const downloadSelection = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const selection = await UserSelection.findById(id)
        .populate('productId')
        .populate('selections.moduleId');

    if (!selection) {
        throw new AppError('选择记录不存在', 404);
    }

    // 检查权限
    if (selection.userId.toString() !== req.user._id.toString()) {
        throw new AppError('没有权限下载此选择记录', 403);
    }

    if (selection.status !== 'completed') {
        throw new AppError('选择尚未完成，无法下载', 400);
    }

    // 创建临时目录
    const tempDir = path.join(process.env.UPLOAD_DIR, 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    // 创建压缩文件
    const zipFileName = `${selection.productId.spuCode}-${Date.now()}.zip`;
    const zipFilePath = path.join(tempDir, zipFileName);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    // 设置响应头
    res.attachment(zipFileName);
    archive.pipe(res);

    // 添加文件到压缩包
    for (const item of selection.selections) {
        const module = item.moduleId;
        const material = module.materials.id(item.materialId);

        if (material) {
            const filePath = path.join(process.env.UPLOAD_DIR, material.url);
            const fileExists = await fs.access(filePath).then(() => true).catch(() => false);

            if (fileExists) {
                archive.file(filePath, {
                    name: path.join(module.type, module.subType, material.filename)
                });
            }
        }
    }

    // 完成压缩
    await archive.finalize();

    // 记录下载
    await Product.incrementDownloadCount(selection.productId._id);

    // 清理临时文件
    setTimeout(async () => {
        try {
            await fs.unlink(zipFilePath);
        } catch (error) {
            logger.error('Error cleaning up temp file:', error);
        }
    }, 5 * 60 * 1000); // 5分钟后删除
});

module.exports = {
    createSelection,
    getSelections,
    getSelection,
    updateSelection,
    deleteSelection,
    completeSelection,
    downloadSelection
}; 