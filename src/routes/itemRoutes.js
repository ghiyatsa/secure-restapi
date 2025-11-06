const express = require("express");
const { body } = require("express-validator");
const { getAllItems, createItem } = require("../controllers/itemController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");

const router = express.Router();

// Validation rules untuk create item
const createItemValidation = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Item name must be between 1 and 255 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must be less than 1000 characters"),
  handleValidationErrors,
];

// Semua routes memerlukan autentikasi
router.use(authenticateToken);

// GET /api/items - Ambil semua items (semua user terautentikasi)
router.get("/", getAllItems);

// POST /api/items - Buat item baru (hanya admin)
router.post("/", requireAdmin, createItemValidation, createItem);

module.exports = router;
