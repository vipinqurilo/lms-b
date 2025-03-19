const express = require("express");
const { registerUser, userLogin, validateToken, verifyEmail, resendVerificationEmail,changePassword,generateLoginToken } = require("../controller/authController");


const { authMiddleware } = require("../middleware/authMiddleware");
const authController = express.Router();
const authorizeRoles = require("../middleware/roleMiddleware");



authController.post('/register',registerUser)
authController.post('/resendverificationemail',resendVerificationEmail)
authController.get("/verify-email/:token", verifyEmail );
authController.post('/login',userLogin)
authController.post('/verify-token',authMiddleware,validateToken)
module.exports = authController;
authController.get(
  "/admin-usertoken",
  authMiddleware,
  authorizeRoles("admin"),
  generateLoginToken
);
module.exports = authController;
