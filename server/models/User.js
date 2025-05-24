const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }, // or 'admin'
  modelsAccess: [String] // e.g., ['paraphraser', 'grammar-checker']
});

module.exports = mongoose.model('User', userSchema);
