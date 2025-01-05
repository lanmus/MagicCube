const db = require('../models/db');

class ModuleController {
    // 创建模块
    async create(req, res) {
        try {
            const { productId, moduleType, subType, name, sortOrder } = req.body;

            const [result] = await db.query(
                'INSERT INTO modules (product_id, module_type, sub_type, name, sort_order) VALUES (?, ?, ?, ?, ?)',
                [productId, moduleType, subType, name, sortOrder]
            );

            res.status(201).json({
                success: true,
                moduleId: result.insertId
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // 更新模块
    async update(req, res) {
        try {
            const moduleId = req.params.id;
            const { name, sortOrder } = req.body;

            await db.query(
                'UPDATE modules SET name = ?, sort_order = ? WHERE id = ?',
                [name, sortOrder, moduleId]
            );

            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // 删除模块
    async delete(req, res) {
        try {
            const moduleId = req.params.id;
            const connection = await db.beginTransaction();

            try {
                // 先删除模块下的所有图片
                await connection.query('DELETE FROM images WHERE module_id = ?', [moduleId]);
                // 再删除模块
                await connection.query('DELETE FROM modules WHERE id = ?', [moduleId]);

                await connection.commit();
                res.json({ success: true });
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ModuleController(); 