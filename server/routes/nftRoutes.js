const express = require('express');
const router = express.Router();
const nftController = require('../controllers/nftController');

router.get('/nfts/:userAddress', nftController.getUserNfts);

module.exports = router;