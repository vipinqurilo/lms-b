const express = require('express');
const { createOrUpdatePaymentSettings, getPaymentSettings } = require('../controller/paymentSettingController');
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = express.Router();

router.get('/',authMiddleware,authorizeRoles("admin"), getPaymentSettings);
router.post('/',authMiddleware,authorizeRoles("teacher"), createOrUpdatePaymentSettings);

module.exports = router;
