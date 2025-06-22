const nftService = require('../services/nftService');

async function getUserNfts(req, res) {
  try {
    const userAddress = req.params.userAddress;
    const nfts = await nftService.getUserNfts(userAddress);
    res.json({ success: true, data: nfts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { getUserNfts };