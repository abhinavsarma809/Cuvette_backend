const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, unique: true },
  expiryDate: { type: Date, required: true },
  remarks: { type: String, required: false }, // New field for remarks
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visits: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  ipAddress: { type: String, required: true },
  userDevice: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('URL', urlSchema);
