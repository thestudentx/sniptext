// server/routes/configRoutes.js

const express = require("express");
const router = express.Router();
const { getConfig, updateConfig } = require("../controllers/configController");
const { authenticateToken, requireAdmin } = require("../middlewares/authMiddleware");

// (Optional) Health-check route moved from "/winston" to "/health"
router.get("/health", (req, res) => {
  res.json({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: new Date().toISOString(),
    status: "Config service is UP 🧠"
  });
});

// Public: GET the config by name (e.g. /api/config/winston)
router.get("/:name", getConfig);

// Protected: PUT /api/config/:name to upsert token + endpoints
router.put("/:name", authenticateToken, requireAdmin, updateConfig);

module.exports = router;
