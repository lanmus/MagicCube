const { pool } = require('../config/database');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;

class UploadController {
    // 上传单个文件
    uploadSingle = asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new AppError('没有上传文件', 400);
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        
        res.status(201).json({
            status: 'success',
            data: {
                file: {
                    filename: req.file.filename,
                    originalname: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                    url: fileUrl
                }
            }
        });
    });

    // 上传多个文件
    uploadMultiple = asyncHandler(async (req, res) => {
        if (!req.files || req.files.length === 0) {
            throw new AppError('没有上传文件', 400);
        }

        const files = req.files.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            url: `/uploads/${file.filename}`
        }));

        res.status(201).json({
            status: 'success',
            data: { files }
        });
    });

    // 上传商品图片
    uploadProductImage = asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new AppError('没有上传图片', 400);
        }

        const { productId } = req.body;
        if (!productId) {
            throw new AppError('缺少商品ID', 400);
        }

        // 处理图片
        const filename = `product-${productId}-${Date.now()}.jpg`;
        const outputPath = path.join(process.env.UPLOAD_DIR, 'products', filename);

        await sharp(req.file.path)
            .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(outputPath);

        // 删除原始文件
        await fs.unlink(req.file.path);

        // 保存到数据库
        const [result] = await pool.query(
            'INSERT INTO product_images (product_id, image_path, created_by) VALUES (?, ?, ?)',
            [productId, `/uploads/products/${filename}`, req.user.id]
        );

        res.status(201).json({
            status: 'success',
            data: {
                image: {
                    id: result.insertId,
                    url: `/uploads/products/${filename}`
                }
            }
        });
    });

    // 上传商品素材
    uploadProductMaterial = asyncHandler(async (req, res) => {
        if (!req.files || req.files.length === 0) {
            throw new AppError('没有上传素材', 400);
        }

        const { productId, moduleId } = req.body;
        if (!productId || !moduleId) {
            throw new AppError('缺少商品ID或模块ID', 400);
        }

        const materials = await Promise.all(req.files.map(async (file, index) => {
            const [result] = await pool.query(
                `INSERT INTO materials (product_id, module_id, file_name, file_path, file_size, file_type, sort_order, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    productId,
                    moduleId,
                    file.originalname,
                    `/uploads/materials/${file.filename}`,
                    file.size,
                    file.mimetype,
                    index,
                    req.user.id
                ]
            );

            return {
                id: result.insertId,
                filename: file.originalname,
                url: `/uploads/materials/${file.filename}`,
                size: file.size,
                type: file.mimetype
            };
        }));

        res.status(201).json({
            status: 'success',
            data: { materials }
        });
    });

    // 处理单个模块的多图片上传
    uploadModuleImages = asyncHandler(async (req, res) => {
        const moduleId = req.params.moduleId;
        const files = req.files;

        if (!files || files.length === 0) {
            throw new AppError('没有上传文件', 400);
        }

        const imageRecords = await Promise.all(files.map(async (file, index) => {
            const [result] = await pool.query(
                `INSERT INTO images (module_id, file_name, file_path, file_size, sort_order) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    moduleId,
                    file.originalname,
                    `/uploads/images/${file.filename}`,
                    file.size,
                    index
                ]
            );
            return {
                id: result.insertId,
                fileName: file.originalname,
                filePath: `/uploads/images/${file.filename}`,
                fileSize: file.size,
                sortOrder: index
            };
        }));

        res.status(201).json({
            status: 'success',
            data: { images: imageRecords }
        });
    });

    // 删除图片
    deleteImage = asyncHandler(async (req, res) => {
        const imageId = req.params.imageId;
        await pool.query('DELETE FROM images WHERE id = ?', [imageId]);
        
        res.status(200).json({
            status: 'success',
            data: null
        });
    });
}

module.exports = new UploadController(); 