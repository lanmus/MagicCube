const sharp = require('sharp');
const { MaterialModule } = require('../models/materialModule');
const { Product } = require('../models/product');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const { cacheGet, cacheSet, cacheDelete } = require('../config/redis');
const { logger } = require('../utils/logger');

// 创建素材模块
const createModule = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    
    // 检查商品是否存在
    const product = await Product.findById(productId);
    if (!product) {
        throw new AppError('商品不存在', 404);
    }

    // 检查权限
    if (product.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
        throw new AppError('没有权限添加模块', 403);
    }

    // 创建模块
    const module = await MaterialModule.create({
        ...req.body,
        productId
    });

    // 清除商品缓存
    await cacheDelete(`product:${productId}`);

    res.status(201).json({
        status: 'success',
        data: { module }
    });
});

// 获取模块列表
const getModules = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { type, status } = req.query;

    // 构建查询条件
    const query = { productId };
    if (type) query.type = type;
    if (status) query.status = status;

    // 缓存键
    const cacheKey = `modules:${productId}:${JSON.stringify(query)}`;
    
    // 尝试从缓存获取
    const cachedData = await cacheGet(cacheKey);
    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    // 获取模块列表
    const modules = await MaterialModule.find(query)
        .sort({ type: 1, subType: 1, order: 1 });

    const data = {
        status: 'success',
        data: { modules }
    };

    // 设置缓存
    await cacheSet(cacheKey, JSON.stringify(data), 300);

    res.status(200).json(data);
});

// 获取模块详情
const getModule = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const module = await MaterialModule.findById(id);
    
    if (!module) {
        throw new AppError('模块不存在', 404);
    }

    res.status(200).json({
        status: 'success',
        data: { module }
    });
});

// 更新模块
const updateModule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const module = await MaterialModule.findById(id)
        .populate('productId', 'createdBy');

    if (!module) {
        throw new AppError('模块不存在', 404);
    }

    // 检查权限
    if (module.productId.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
        throw new AppError('没有权限修改此模块', 403);
    }

    // 更新模块
    Object.assign(module, req.body);
    await module.save();

    // 清除缓存
    await cacheDelete(`modules:${module.productId}`);
    await cacheDelete(`product:${module.productId}`);

    res.status(200).json({
        status: 'success',
        data: { module }
    });
});

// 删除模块
const deleteModule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const module = await MaterialModule.findById(id)
        .populate('productId', 'createdBy');

    if (!module) {
        throw new AppError('模块不存在', 404);
    }

    // 检查权限
    if (module.productId.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
        throw new AppError('没有权限删除此模块', 403);
    }

    await module.remove();

    // 清除缓存
    await cacheDelete(`modules:${module.productId}`);
    await cacheDelete(`product:${module.productId}`);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// 添加素材到模块
const addMaterials = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const files = req.files;

    const module = await MaterialModule.findById(id)
        .populate('productId', 'createdBy');

    if (!module) {
        throw new AppError('模块不存在', 404);
    }

    // 检查权限
    if (module.productId.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
        throw new AppError('没有权限添加素材', 403);
    }

    // 检查素材数量限制
    if (module.materials.length + files.length > 20) {
        throw new AppError('超出模块素材数量限制（最多20个）', 400);
    }

    // 处理并保存素材
    const processedFiles = await Promise.all(files.map(async (file, index) => {
        // 获取图片信息
        const metadata = await sharp(file.path).metadata();
        
        // 处理图片（压缩、添加水印等）
        await sharp(file.path)
            .resize(1920, 1080, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toFile(`${file.path}_processed`);

        return {
            url: `/uploads/${file.filename}`,
            filename: file.originalname,
            filesize: file.size,
            mimetype: file.mimetype,
            width: metadata.width,
            height: metadata.height,
            order: module.materials.length + index,
            metadata: {
                originalName: file.originalname,
                processedSize: metadata.size
            }
        };
    }));

    // 添加新素材
    module.materials.push(...processedFiles);
    await module.save();

    // 清除缓存
    await cacheDelete(`modules:${module.productId}`);
    await cacheDelete(`product:${module.productId}`);

    res.status(200).json({
        status: 'success',
        data: { module }
    });
});

// 删除模块中的素材
const deleteMaterial = asyncHandler(async (req, res) => {
    const { id, materialId } = req.params;
    
    const module = await MaterialModule.findById(id)
        .populate('productId', 'createdBy');

    if (!module) {
        throw new AppError('模块不存在', 404);
    }

    // 检查权限
    if (module.productId.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
        throw new AppError('没有权限删除素材', 403);
    }

    // 删除素材
    module.materials = module.materials.filter(
        material => material._id.toString() !== materialId
    );

    // 重新排序
    module.materials.forEach((material, index) => {
        material.order = index;
    });

    await module.save();

    // 清除缓存
    await cacheDelete(`modules:${module.productId}`);
    await cacheDelete(`product:${module.productId}`);

    res.status(200).json({
        status: 'success',
        data: { module }
    });
});

// 更新素材顺序
const updateMaterialOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { materials } = req.body;  // 包含id和新的order的数组
    
    const module = await MaterialModule.findById(id)
        .populate('productId', 'createdBy');

    if (!module) {
        throw new AppError('模块不存在', 404);
    }

    // 检查权限
    if (module.productId.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
        throw new AppError('没有权限修改素材顺序', 403);
    }

    // 更新顺序
    materials.forEach(({ id, order }) => {
        const material = module.materials.id(id);
        if (material) {
            material.order = order;
        }
    });

    await module.save();

    // 清除缓存
    await cacheDelete(`modules:${module.productId}`);
    await cacheDelete(`product:${module.productId}`);

    res.status(200).json({
        status: 'success',
        data: { module }
    });
});

module.exports = {
    createModule,
    getModules,
    getModule,
    updateModule,
    deleteModule,
    addMaterials,
    deleteMaterial,
    updateMaterialOrder
}; 