const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');

router.get('/listings', marketplaceController.getActiveListings);
router.get('/transactions', marketplaceController.getTransactionHistory);

module.exports = router;