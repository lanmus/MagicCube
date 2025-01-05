const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

class User {
    static async findById(id) {
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByUsername(username) {
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async create(userData) {
        try {
            const { username, email, password, role = 'user' } = userData;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const [result] = await pool.query(
                'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, role]
            );

            return { id: result.insertId, username, email, role };
        } catch (error) {
            throw error;
        }
    }

    static async update(id, updateData) {
        try {
            const allowedFields = ['username', 'email', 'role', 'status'];
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
                `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                values
            );

            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async updatePassword(id, newPassword) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            const [result] = await pool.query(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    static async delete(id) {
        try {
            const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    static async list(page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;
            const [rows] = await pool.query(
                'SELECT id, username, email, role, status, created_at, updated_at FROM users LIMIT ? OFFSET ?',
                [limit, offset]
            );
            const [total] = await pool.query('SELECT COUNT(*) as count FROM users');
            
            return {
                users: rows,
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
}

module.exports = { User }; 