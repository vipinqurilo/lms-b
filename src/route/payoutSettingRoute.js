const express = require('express');
const { createOrUpdatePayoutSettings,getPayoutSettings } = require('../controller/payoutSettingController');
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = express.Router();

router.get('/',authMiddleware,authorizeRoles("admin"), getPayoutSettings);
router.post('/',authMiddleware,authorizeRoles("admin"), createOrUpdatePayoutSettings);

module.exports = router;
