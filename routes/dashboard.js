
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', dashboardController.getDashboardStats);
router.get('/payment-methods', dashboardController.getPaymentMethodStats);

module.exports = router;
