// auth-model.js
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

class AuthModel {
  async createUser(email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id';
    const result = await pool.query(query, [email, hashedPassword]);
    return result.rows[0].id;
  }

  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  async getUserById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = new AuthModel();