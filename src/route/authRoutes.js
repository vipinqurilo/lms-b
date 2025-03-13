const express = require("express");
const { registerUser, userLogin, validateToken, verifyEmail, resendVerificationEmail } = require("../controller/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authController = express.Router();



authController.post('/register',registerUser)
authController.post('/resendverificationemail',resendVerificationEmail)
authController.get("/verify-email/:token", verifyEmail );
authController.post('/login',userLogin)
authController.post('/verify-token',authMiddleware,validateToken)
module.exports = authController;