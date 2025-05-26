const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plan: { type: String, required: true }, // e.g., 'free', 'premium', 'enterprise'
  role: { type: String, default: 'user' }, // or 'admin'
  accessDuration: { type: Date, required: true }, // e.g., '2024-12-31T23:59:59.999Z' 
  modelsAccess: [String] // e.g., ['paraphraser', 'grammar-checker']
}); 

module.exports = mongoose.model('User', userSchema);
