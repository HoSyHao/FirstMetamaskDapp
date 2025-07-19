const marketplaceService = require('../services/marketplaceService');
const NFT = require('../models/nft');

async function getMarketplaceListings(req, res) {
  try {
    const { page = 1, limit = 12, includeMetadata = 'false' } = req.query;
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const shouldIncludeMetadata = includeMetadata.toLowerCase() === 'true';
    if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1) {
      return res.status(400).json({ success: false, error: 'Invalid page or limit values' });
    }
    const listings = await marketplaceService.getActiveListings({ page: parsedPage, limit: parsedLimit });

    let result = { data: listings.data, total: listings.total };
    if (shouldIncludeMetadata) {
      const nftsWithMetadata = await Promise.all(listings.data.map(async (listing) => {
        const nft = await NFT.findOne({ tokenId: listing.tokenId });
        return {
          ...listing,
          metadata: nft ? nft.toObject() : { tokenId: listing.tokenId, error: 'Metadata not found' },
        };
      }));
      result.data = nftsWithMetadata;
    }

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in getMarketplaceListings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getTransactionHistory(req, res) {
  try {
    const { page = 1, limit = 12 } = req.query;
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1) {
      return res.status(400).json({ success: false, error: 'Invalid page or limit values' });
    }
    const transactions = await marketplaceService.getSales({ page: parsedPage, limit: parsedLimit });
    res.json({ success: true, data: transactions.data, total: transactions.total });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch transaction history' });
  }
}

module.exports = { getMarketplaceListings, getTransactionHistory };