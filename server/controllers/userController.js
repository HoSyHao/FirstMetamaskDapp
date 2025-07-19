const userService = require('../services/userService');
const NFT = require('../models/nft');

async function getUser(req, res) {
  try {
    const userAddress = req.params.userAddress;
    if (!userAddress) {
      return res.status(400).json({ success: false, error: 'User address is required' });
    }
    const { page = 1, limit = 12 } = req.query;
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1) {
      return res.status(400).json({ success: false, error: 'Invalid page or limit values' });
    }

    const user = await userService.getUser(userAddress, { page: parsedPage, limit: parsedLimit });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const allTokenIds = user.nftsOwned.map(nft => nft.tokenId);
    const nftsWithMetadata = await NFT.find({ tokenId: { $in: allTokenIds } }).lean();

    const metadataMap = nftsWithMetadata.reduce((map, nft) => {
      map[nft.tokenId] = nft;
      return map;
    }, {});

    const nftsOwnedWithMetadata = user.nftsOwned.map(nft => ({
      ...nft,
      metadata: metadataMap[nft.tokenId] || { tokenId: nft.tokenId, error: 'Metadata not found' },
    }));
    const nftsListedWithMetadata = user.nftsListed.map(nft => ({
      ...nft,
      metadata: metadataMap[nft.tokenId] || { tokenId: nft.tokenId, error: 'Metadata not found' },
    }));

    res.json({
      success: true,
      data: {
        ...user,
        nftsOwned: nftsOwnedWithMetadata,
        nftsListed: nftsListedWithMetadata,
      },
      total: user.total,
    });
  } catch (error) {
    console.error('Error in getUser:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function mintMetadata(req, res) {
  try {

    let nftData = req.body.nftData;
    if (!nftData) {
      return res.status(400).json({ success: false, error: 'NFT data is required' });
    }
    try {
      nftData = JSON.parse(nftData);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid JSON format for nftData' });
    }
    if (!Array.isArray(nftData) || nftData.length === 0) {
      return res.status(400).json({ success: false, error: 'NFT data must be a non-empty array' });
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one image is required' });
    }
    if (files.length !== nftData.length) {
      return res.status(400).json({ success: false, error: 'Number of images must match number of NFTs' });
    }

    for (const nft of nftData) {
      if (!nft.tokenId || !nft.name) {
        return res.status(400).json({ success: false, error: `Missing required fields for tokenId ${nft.tokenId || 'unknown'}` });
      }
    }

    const result = await userService.processMintMetadata(nftData, files);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in mintMetadata:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateNFTMetadata(req, res) {
  try {
    const tokenId = req.params.tokenId;
    if (!tokenId) {
      return res.status(400).json({ success: false, error: 'Token ID is required' });
    }

    let updatedData = req.body;
    if (!updatedData || typeof updatedData !== 'object') {
      return res.status(400).json({ success: false, error: 'Updated data is required' });
    }

    const file = req.file; // Giả sử dùng multer để xử lý file đơn
    const result = await userService.updateNFTMetadata(tokenId, updatedData, file);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in updateNFTMetadata:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getNFTMetadata(req, res) {
  try {
    const tokenId = req.params.tokenId;
    if (!tokenId) {
      return res.status(400).json({ success: false, error: 'Token ID is required' });
    }

    const nft = await NFT.findOne({ tokenId });
    if (!nft) {
      return res.status(404).json({ success: false, error: 'NFT not found' });
    }

    res.json({ success: true, data: nft });
  } catch (error) {
    console.error('Error in getNFTMetadata:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { getUser, mintMetadata, updateNFTMetadata, getNFTMetadata };