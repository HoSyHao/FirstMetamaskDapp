const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplaceController');

router.get('/listings', marketplaceController.getActiveListings);
router.get('/sales', marketplaceController.getSales);
router.get('/offers/:userAddress', marketplaceController.getUserOffers);

module.exports = router;