const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
  tokenId: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, required: true },
  attributes: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('NFT', nftSchema);