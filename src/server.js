require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { initializeDatabase } = require("./database/connection");
const logger = require("./config/logger");

// Routes
const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Configuration
const corsOptions = {
  origin:
    process.env.CORS_ORIGIN === "*"
      ? "*"
      : process.env.CORS_ORIGIN?.split(",") || "*",
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 menit
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting khusus untuk auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // 5 requests per window untuk prevent brute force
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  skipSuccessfulRequests: true,
});

app.use(limiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Body Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Root endpoint - API Information
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Secure REST API",
    version: "1.0.0",
    description: "Secure REST API dengan Node.js, Express, dan PostgreSQL",
    status: "running",
    endpoints: {
      health: {
        method: "GET",
        path: "/health",
        description: "Health check endpoint",
      },
      auth: {
        register: {
          method: "POST",
          path: "/api/auth/register",
          description: "Register user baru",
          body: {
            username: "string (3-50 chars, alphanumeric)",
            email: "string (valid email)",
            password: "string (min 8 chars, uppercase, lowercase, number)",
          },
        },
        login: {
          method: "POST",
          path: "/api/auth/login",
          description: "Login dan dapatkan access & refresh token",
          body: {
            email: "string",
            password: "string",
          },
        },
        refresh: {
          method: "POST",
          path: "/api/auth/refresh",
          description: "Refresh access token",
          body: {
            refreshToken: "string",
          },
        },
        logout: {
          method: "POST",
          path: "/api/auth/logout",
          description: "Logout dan hapus refresh token",
          requiresAuth: true,
          body: {
            refreshToken: "string",
          },
        },
      },
      items: {
        getAll: {
          method: "GET",
          path: "/api/items",
          description: "Get semua items",
          requiresAuth: true,
          queryParams: {
            limit: "number (optional, default: 50)",
            offset: "number (optional, default: 0)",
          },
        },
        create: {
          method: "POST",
          path: "/api/items",
          description: "Create item baru (admin only)",
          requiresAuth: true,
          requiresAdmin: true,
          body: {
            name: "string (1-255 chars)",
            description: "string (optional, max 1000 chars)",
          },
        },
      },
    },
    documentation: "Lihat README.md untuk dokumentasi lengkap",
  });
});

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  logger.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Initialize Database dan Start Server
async function startServer() {
  try {
    await initializeDatabase();
    logger.info("Database initialized successfully");

    app.listen(PORT, () => {
      logger.info(
        `Server running on port ${PORT} in ${
          process.env.NODE_ENV || "development"
        } mode`
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
