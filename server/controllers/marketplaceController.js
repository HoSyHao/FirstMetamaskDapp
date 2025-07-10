const marketplaceService = require('../services/marketplaceService');

async function getActiveListings(req, res) {
  try {
    const listings = await marketplaceService.getActiveListings();
    res.json({ success: true, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getTransactionHistory(req, res) {
  try {
    const transactions = await marketplaceService.getSales();
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch transaction history' });
  }
}


module.exports = { getActiveListings, getTransactionHistory };