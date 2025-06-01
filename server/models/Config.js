// /server/models/Config.js
const mongoose = require("mongoose");

const ConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, 
    // e.g. "winston" or "paraphraseAPI" if you add more later
    token: { type: String, required: true },
    endpoints: {
      contentDetection: { type: String, required: true },
      imageDetection: { type: String, required: true },
      // You can add more fields here in the future: e.g. plagiarismEndpoint, paraphraseEndpoint, etc.
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Config", ConfigSchema);
