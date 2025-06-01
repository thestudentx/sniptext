// server/utils/seedConfig.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Config = require("../models/Config");

dotenv.config(); // loads MONGO_URI from .env

const seedConfig = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const configData = {
      name: "winston",
      token: "NOCFTd4T4TdtQaRyvHqSlc3K76NEyCC91Adc929Xb34ab971",
      endpoints: {
        contentDetection: "https://api.gowinston.ai/v2/ai-content-detection",
        imageDetection: "https://api.gowinston.ai/v2/image-detection",
      },
    };

    // Upsert: update if exists, else insert
    const result = await Config.findOneAndUpdate(
      { name: configData.name },
      configData,
      { new: true, upsert: true }
    );

    console.log("✅ Winston config seeded/updated successfully:", result);

    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
};

seedConfig();
