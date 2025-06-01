// server/routes/winstonProxy.js

const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const Config = require("../models/Config");

// Content Detect Proxy
router.post("/content-detect", async (req, res) => {
  try {
    const cfg = await Config.findOne({ name: "winston" });
    console.log(">>> Proxy: found Winston config:", cfg);

    if (!cfg || !cfg.token || !cfg.endpoints.contentDetection) {
      console.warn(">>> Proxy: Winston config missing or incomplete");
      return res.status(500).json({ message: "Winston config missing" });
    }

    console.log(">>> Proxy: forwarding to Winston endpoint with token:", cfg.token.slice(0,10) + "...");

    const wResp = await fetch(cfg.endpoints.contentDetection, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.token}`,
      },
      body: JSON.stringify(req.body),
    });

    console.log(">>> Proxy: Winston status code:", wResp.status);
    const data = await wResp.json();
    return res.status(wResp.status).json(data);

  } catch (err) {
    console.error("Proxy content-detect error:", err);
    return res.status(500).json({ message: "Proxy error" });
  }
});

router.post("/image-detect", async (req, res) => {
  try {
    const cfg = await Config.findOne({ name: "winston" });
    console.log(">>> Proxy: found Winston config (image):", cfg);

    if (!cfg || !cfg.token || !cfg.endpoints.imageDetection) {
      console.warn(">>> Proxy: Winston config missing or incomplete (image)");
      return res.status(500).json({ message: "Winston config missing" });
    }

    console.log(">>> Proxy: forwarding to Winston image endpoint with token:", cfg.token.slice(0,10) + "...");

    const wResp = await fetch(cfg.endpoints.imageDetection, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.token}`,
      },
      body: JSON.stringify(req.body),
    });

    console.log(">>> Proxy: Winston image status code:", wResp.status);
    const data = await wResp.json();
    return res.status(wResp.status).json(data);

  } catch (err) {
    console.error("Proxy image-detect error:", err);
    return res.status(500).json({ message: "Proxy error" });
  }
});

module.exports = router;
