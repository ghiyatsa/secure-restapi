const Item = require("../models/Item");
const logger = require("../config/logger");

/**
 * Ambil semua items
 */
const getAllItems = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const items = await Item.findAll(limit, offset);

    res.json({
      items,
      pagination: {
        limit,
        offset,
        count: items.length,
      },
    });
  } catch (error) {
    logger.error("Get items error:", error);
    next(error);
  }
};

/**
 * Buat item baru (hanya admin)
 */
const createItem = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const item = await Item.create({
      name,
      description,
      created_by: req.user.id,
    });

    logger.info(`Item created by admin: ${req.user.email}`, {
      itemId: item.id,
    });

    res.status(201).json({
      message: "Item created successfully",
      item,
    });
  } catch (error) {
    logger.error("Create item error:", error);
    next(error);
  }
};

module.exports = {
  getAllItems,
  createItem,
};
