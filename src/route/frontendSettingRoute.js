const express = require('express');
const { createOrUpdateFrontendSetting, getFrontendSetting } = require('../controller/frontendSettingController');
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router = express.Router();

router.get('/',authMiddleware,authorizeRoles("admin"), getFrontendSetting);
router.post('/',authMiddleware,authorizeRoles("admin"), createOrUpdateFrontendSetting);

module.exports = router;
