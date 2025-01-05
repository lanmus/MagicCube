const { pool } = require('../config/database');

class Product {
    static async findById(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findAll(page = 1, limit = 10, filters = {}) {
        try {
            let query = 'SELECT * FROM products WHERE 1=1';
            const values = [];

            if (filters.status) {
                query += ' AND status = ?';
                values.push(filters.status);
            }

            if (filters.creator_id) {
                query += ' AND creator_id = ?';
                values.push(filters.creator_id);
            }

            // 添加分页
            const offset = (page - 1) * limit;
            query += ' LIMIT ? OFFSET ?';
            values.push(limit, offset);

            const [rows] = await pool.query(query, values);
            const [total] = await pool.query('SELECT COUNT(*) as count FROM products');

            return {
                products: rows,
                pagination: {
                    page,
                    limit,
                    total: total[0].count
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static async create(productData) {
        try {
            const { name, description, spu, creator_id } = productData;
            const [result] = await pool.query(
                'INSERT INTO products (name, description, spu, creator_id) VALUES (?, ?, ?, ?)',
                [name, description, spu, creator_id]
            );
            return { id: result.insertId, ...productData };
        } catch (error) {
            throw error;
        }
    }

    static async update(id, updateData) {
        try {
            const allowedFields = ['name', 'description', 'status', 'view_count', 'download_count'];
            const updates = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key)) {
                    updates.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });

            if (updates.length === 0) return null;

            values.push(id);
            const [result] = await pool.query(
                `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
                values
            );

            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async search(keyword, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            const [rows] = await pool.query(
                'SELECT * FROM products WHERE name LIKE ? OR description LIKE ? LIMIT ? OFFSET ?',
                [`%${keyword}%`, `%${keyword}%`, limit, offset]
            );
            const [total] = await pool.query(
                'SELECT COUNT(*) as count FROM products WHERE name LIKE ? OR description LIKE ?',
                [`%${keyword}%`, `%${keyword}%`]
            );

            return {
                products: rows,
                pagination: {
                    page,
                    limit,
                    total: total[0].count
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static async incrementViewCount(id) {
        try {
            await pool.query(
                'UPDATE products SET view_count = view_count + 1 WHERE id = ?',
                [id]
            );
        } catch (error) {
            throw error;
        }
    }

    static async incrementDownloadCount(id) {
        try {
            await pool.query(
                'UPDATE products SET download_count = download_count + 1 WHERE id = ?',
                [id]
            );
        } catch (error) {
            throw error;
        }
    }
}

module.exports = { Product }; 