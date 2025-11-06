const { query } = require("../database/connection");

class Item {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.created_by = data.created_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Ambil semua items
   */
  static async findAll(limit = 50, offset = 0) {
    const result = await query(
      `SELECT * FROM items ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows.map((row) => new Item(row));
  }

  /**
   * Cari item berdasarkan ID
   */
  static async findById(id) {
    const result = await query("SELECT * FROM items WHERE id = $1", [id]);
    if (result.rows.length === 0) return null;
    return new Item(result.rows[0]);
  }

  /**
   * Buat item baru
   */
  static async create(itemData) {
    const { name, description, created_by } = itemData;
    const result = await query(
      `INSERT INTO items (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, created_by]
    );
    return new Item(result.rows[0]);
  }

  /**
   * Update item
   */
  async update(updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(this.id);

    const result = await query(
      `UPDATE items SET ${fields.join(
        ", "
      )} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length > 0) {
      Object.assign(this, new Item(result.rows[0]));
    }

    return this;
  }

  /**
   * Hapus item
   */
  async delete() {
    await query("DELETE FROM items WHERE id = $1", [this.id]);
  }
}

module.exports = Item;
