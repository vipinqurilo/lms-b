const express = require('express');
const { createOrUpdatePayoutSettings,getPayoutSettings } = require('../controller/payoutSettingController');
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = express.Router();

router.get('/',authMiddleware,authorizeRoles("admin,teacher"), getPayoutSettings);
router.post('/',authMiddleware,authorizeRoles("admin,teacher"), createOrUpdatePayoutSettings);

module.exports = router;
