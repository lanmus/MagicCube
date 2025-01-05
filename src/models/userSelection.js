const { pool } = require('../config/database');

class UserSelection {
    static async findById(id) {
        const [[selection]] = await pool.query(
            'SELECT * FROM user_selections WHERE id = ?',
            [id]
        );
        return selection;
    }

    static async findByUserAndProduct(userId, productId) {
        const [[selection]] = await pool.query(
            'SELECT * FROM user_selections WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );
        return selection;
    }

    static async create(data) {
        const { userId, productId, status = 'draft' } = data;
        const [result] = await pool.query(
            'INSERT INTO user_selections (user_id, product_id, status) VALUES (?, ?, ?)',
            [userId, productId, status]
        );
        return { id: result.insertId, userId, productId, status };
    }

    static async update(id, data) {
        const { status } = data;
        const [result] = await pool.query(
            'UPDATE user_selections SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query(
            'DELETE FROM user_selections WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async addSelection(selectionId, moduleId, materialId) {
        const [result] = await pool.query(
            'INSERT INTO selection_materials (selection_id, module_id, material_id) VALUES (?, ?, ?)',
            [selectionId, moduleId, materialId]
        );
        return { id: result.insertId, selectionId, moduleId, materialId };
    }

    static async removeSelection(selectionId, moduleId) {
        const [result] = await pool.query(
            'DELETE FROM selection_materials WHERE selection_id = ? AND module_id = ?',
            [selectionId, moduleId]
        );
        return result.affectedRows > 0;
    }

    static async getSelections(selectionId) {
        const [selections] = await pool.query(
            'SELECT * FROM selection_materials WHERE selection_id = ? ORDER BY id',
            [selectionId]
        );
        return selections;
    }

    static async hasCompletedSelection(userId, productId) {
        const [[result]] = await pool.query(
            'SELECT COUNT(*) as count FROM user_selections WHERE user_id = ? AND product_id = ? AND status = ?',
            [userId, productId, 'completed']
        );
        return result.count > 0;
    }

    static async isComplete(selectionId, requiredModules) {
        const [selections] = await pool.query(
            'SELECT module_id FROM selection_materials WHERE selection_id = ?',
            [selectionId]
        );
        const selectedModules = new Set(selections.map(s => s.module_id));
        return requiredModules.every(moduleId => selectedModules.has(moduleId));
    }

    static async getMissingModules(selectionId, requiredModules) {
        const [selections] = await pool.query(
            'SELECT module_id FROM selection_materials WHERE selection_id = ?',
            [selectionId]
        );
        const selectedModules = new Set(selections.map(s => s.module_id));
        return requiredModules.filter(moduleId => !selectedModules.has(moduleId));
    }
}

module.exports = { UserSelection }; 