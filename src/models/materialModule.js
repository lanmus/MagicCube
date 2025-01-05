const { pool } = require('../config/database');

class MaterialModule {
    static async findById(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM material_modules WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByProductId(productId) {
        try {
            const [modules] = await pool.query(
                'SELECT * FROM material_modules WHERE product_id = ? ORDER BY `order`',
                [productId]
            );
            
            // 获取每个模块的材料
            for (let module of modules) {
                const [materials] = await pool.query(
                    'SELECT * FROM materials WHERE module_id = ? ORDER BY `order`',
                    [module.id]
                );
                module.materials = materials;
            }
            
            return modules;
        } catch (error) {
            throw error;
        }
    }

    static async create(moduleData) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const { product_id, type, sub_type, name, description, materials, order = 0, status = 'active' } = moduleData;

            // 创建模块
            const [result] = await conn.query(
                'INSERT INTO material_modules (product_id, type, sub_type, name, description, `order`, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [product_id, type, sub_type, name, description, order, status]
            );

            const moduleId = result.insertId;

            // 创建材料
            if (materials && materials.length > 0) {
                if (materials.length > 20) {
                    throw new Error('每个模块最多支持20个素材');
                }

                for (const material of materials) {
                    await conn.query(
                        'INSERT INTO materials (module_id, url, filename, filesize, mimetype, width, height, `order`, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [moduleId, material.url, material.filename, material.filesize, material.mimetype, 
                         material.width, material.height, material.order || 0, 
                         material.metadata ? JSON.stringify(material.metadata) : null]
                    );
                }
            }

            await conn.commit();
            return { id: moduleId, ...moduleData };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    static async update(id, updateData) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const allowedFields = ['name', 'description', 'status', 'order'];
            const updates = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key)) {
                    updates.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });

            if (updates.length > 0) {
                values.push(id);
                await conn.query(
                    `UPDATE material_modules SET ${updates.join(', ')} WHERE id = ?`,
                    values
                );
            }

            // 更新材料
            if (updateData.materials) {
                if (updateData.materials.length > 20) {
                    throw new Error('每个模块最多支持20个素材');
                }

                // 删除现有材料
                await conn.query('DELETE FROM materials WHERE module_id = ?', [id]);

                // 添加新材料
                for (const material of updateData.materials) {
                    await conn.query(
                        'INSERT INTO materials (module_id, url, filename, filesize, mimetype, width, height, `order`, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [id, material.url, material.filename, material.filesize, material.mimetype,
                         material.width, material.height, material.order || 0,
                         material.metadata ? JSON.stringify(material.metadata) : null]
                    );
                }
            }

            await conn.commit();
            return true;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    static async delete(id) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 删除相关的材料
            await conn.query('DELETE FROM materials WHERE module_id = ?', [id]);
            
            // 删除模块
            const [result] = await conn.query('DELETE FROM material_modules WHERE id = ?', [id]);
            
            await conn.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }
}

module.exports = { MaterialModule }; 