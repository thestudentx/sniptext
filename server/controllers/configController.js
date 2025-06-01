// /server/controllers/configController.js
const Config = require("../models/Config");

exports.getConfig = async (req, res) => {
  console.log("📢  GET /api/config/" + req.params.name + "  called");
  try {
    const { name } = req.params;
    const config = await Config.findOne({ name });
    if (!config) {
      console.log(`📢  No document found in 'configs' for name="${name}"`);
      return res.status(404).json({ msg: "Config not found" });
    }
    console.log("📢  Found config:", config);
    return res.json({
      token: config.token,
      endpoints: config.endpoints,
    });
  } catch (err) {
    console.error("getConfig error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};


/**
 * PUT /api/config/:name
 * Updates the config (token + endpoints) for a given name. Only Admin should call this.
 * Admin panel will call this endpoint.
 */
exports.updateConfig = async (req, res) => {
  try {
    const { name } = req.params;
    const { token, endpoints } = req.body;

    const config = await Config.findOneAndUpdate(
      { name },
      { $set: { token, endpoints } },
      { new: true, upsert: true } // upsert: create if not exist
    );
    return res.json({
      msg: "Config updated",
      config: {
        token: config.token,
        endpoints: config.endpoints,
      },
    });
  } catch (err) {
    console.error("updateConfig error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
