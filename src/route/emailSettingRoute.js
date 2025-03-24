const express = require('express');
const { createOrUpdateEmailSettings, getEmailSettings} = require('../controller/emailSettingController');
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = express.Router();

router.get('/',authMiddleware,authorizeRoles("admin"), getEmailSettings);
router.post('/',authMiddleware,authorizeRoles("admin"), createOrUpdateEmailSettings);

module.exports = router;
