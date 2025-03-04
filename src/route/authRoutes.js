const express = require("express");
const {
  registerUser,
  userLogin,
  changePassword,
  validateToken,
  generateLoginToken,
} = require("../controller/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authController = express.Router();
const authorizeRoles = require("../middleware/roleMiddleware");

authController.post("/register", registerUser);
authController.post("/login", userLogin);
authController.get(
  "/admin-usertoken",
  authMiddleware,
  authorizeRoles("admin"),
  generateLoginToken
);
authController.post("/verify-token", authMiddleware, validateToken);
module.exports = authController;
