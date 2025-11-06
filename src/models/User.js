const { query } = require("../database/connection");
const bcrypt = require("bcryptjs");

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.role = data.role;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Hapus password hash dari output
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  /**
   * Cari user berdasarkan email
   */
  static async findByEmail(email) {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  /**
   * Cari user berdasarkan username
   */
  static async findByUsername(username) {
    const result = await query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  /**
   * Cari user berdasarkan ID
   */
  static async findById(id) {
    const result = await query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0) return null;
    return new User(result.rows[0]);
  }

  /**
   * Buat user baru
   */
  static async create(userData) {
    const { username, email, password, role = "user" } = userData;

    // Hash password
    const password_hash = await bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_ROUNDS) || 10
    );

    const result = await query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [username, email, password_hash, role]
    );

    return new User(result.rows[0]);
  }

  /**
   * Verifikasi password
   */
  async verifyPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  /**
   * Update user
   */
  async update(updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.username) {
      fields.push(`username = $${paramCount++}`);
      values.push(updates.username);
    }
    if (updates.email) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.password) {
      const password_hash = await bcrypt.hash(
        updates.password,
        parseInt(process.env.BCRYPT_ROUNDS) || 10
      );
      fields.push(`password_hash = $${paramCount++}`);
      values.push(password_hash);
    }
    if (updates.role) {
      fields.push(`role = $${paramCount++}`);
      values.push(updates.role);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(this.id);

    const result = await query(
      `UPDATE users SET ${fields.join(
        ", "
      )} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length > 0) {
      Object.assign(this, new User(result.rows[0]));
    }

    return this;
  }
}

module.exports = User;
