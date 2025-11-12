const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  plan:     { type: String, required: true },      // e.g. 'Standard - 1 Month', 'Premium - 1 Year'
  role:     { type: String, default: 'user' },    // 'user' or 'admin'
  accessDuration: { type: Date, required: true }, // computed based on "access" days
  modelsAccess: { type: [String], default: [] },                      // e.g. ['turnitin1', 'quillbot2']
  credits:        { type: Number, default: 0 },     // number of credits/checks assigned
  paymentInfo:  { type: String, default: '' }
});

module.exports = mongoose.model('User', userSchema);