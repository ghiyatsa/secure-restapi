const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middleware/auth");
const logger = require("../config/logger");

/**
 * Register user baru
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Cek apakah username sudah terdaftar
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ error: "Username already taken" });
    }

    // Buat user baru
    const user = await User.create({ username, email, password, role: "user" });

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      message: "User registered successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error("Registration error:", error);
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Cari user berdasarkan email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verifikasi password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Hitung expiry time untuk refresh token
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 hari

    // Simpan refresh token ke database
    await RefreshToken.create(refreshToken, user.id, refreshTokenExpiry);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: user.toJSON(),
    });
  } catch (error) {
    logger.error("Login error:", error);
    next(error);
  }
};

/**
 * Refresh access token
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    // Verifikasi refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token" });
    }

    // Cek apakah token ada di database
    const storedToken = await RefreshToken.findByToken(token);
    if (!storedToken) {
      return res.status(401).json({ error: "Refresh token not found" });
    }

    // Ambil user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Generate access token baru
    const accessToken = generateAccessToken(user.id);

    logger.info(`Token refreshed for user: ${user.email}`);

    res.json({
      message: "Token refreshed successfully",
      accessToken,
    });
  } catch (error) {
    logger.error("Token refresh error:", error);
    next(error);
  }
};

/**
 * Logout user
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      // Hapus refresh token dari database
      await RefreshToken.delete(token);
    }

    logger.info(`User logged out: ${req.user?.email || "unknown"}`);

    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    logger.error("Logout error:", error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
};
