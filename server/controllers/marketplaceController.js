const marketplaceService = require('../services/marketplaceService');

async function getActiveListings(req, res) {
  try {
    const listings = await marketplaceService.getActiveListings();
    res.json({ success: true, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getSales(req, res) {
  try {
    const sales = await marketplaceService.getSales();
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getUserOffers(req, res) {
  try {
    const userAddress = req.params.userAddress;
    const offers = await marketplaceService.getUserOffers(userAddress);
    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { getActiveListings, getSales, getUserOffers };