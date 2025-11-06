const { query } = require("../database/connection");

class RefreshToken {
  constructor(data) {
    this.id = data.id;
    this.token = data.token;
    this.user_id = data.user_id;
    this.expires_at = data.expires_at;
    this.created_at = data.created_at;
  }

  /**
   * Simpan refresh token
   */
  static async create(token, userId, expiresAt) {
    const result = await query(
      `INSERT INTO refresh_tokens (token, user_id, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [token, userId, expiresAt]
    );
    return new RefreshToken(result.rows[0]);
  }

  /**
   * Cari refresh token
   */
  static async findByToken(token) {
    const result = await query(
      `SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    if (result.rows.length === 0) return null;
    return new RefreshToken(result.rows[0]);
  }

  /**
   * Hapus refresh token
   */
  static async delete(token) {
    await query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
  }

  /**
   * Hapus semua refresh token user
   */
  static async deleteByUserId(userId) {
    await query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
  }

  /**
   * Bersihkan token yang sudah expired
   */
  static async cleanupExpired() {
    await query("DELETE FROM refresh_tokens WHERE expires_at < NOW()");
  }
}

module.exports = RefreshToken;
