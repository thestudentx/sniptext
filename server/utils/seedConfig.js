// server/utils/seedConfig.js

const mongoose = require("mongoose");
const dotenv  = require("dotenv");
const Config  = require("../models/Config");

dotenv.config(); // loads MONGO_URI and WINSTON_API_KEY from your .env

const seedConfig = async () => {
  try {
    // 1) Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    // 2) Read the token + endpoints from ENV instead of hard-coding
    const token = process.env.WINSTON_API_KEY;
    const contentEndpoint = process.env.WINSTON_CONTENT_ENDPOINT;
    const imageEndpoint   = process.env.WINSTON_IMAGE_ENDPOINT;

    if (!token || !contentEndpoint || !imageEndpoint) {
      console.error("❌ Missing one or more Winston ENV vars. " +
        "Please set WINSTON_API_KEY, WINSTON_CONTENT_ENDPOINT, WINSTON_IMAGE_ENDPOINT.");
      process.exit(1);
    }

    const configData = {
      name: "winston",
      token: token.trim(),
      endpoints: {
        contentDetection: contentEndpoint.trim(),
        imageDetection:   imageEndpoint.trim()
      },
    };

    // 3) Upsert into Mongo
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
