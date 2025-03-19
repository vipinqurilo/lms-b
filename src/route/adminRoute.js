const express = require("express");
const router = express.Router();

const adminController = require("../controller/adminController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

router.get(
  "/dashboard",
  adminController.getAdminDashboard
);

module.exports = router;
