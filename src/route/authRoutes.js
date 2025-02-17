const express = require("express");
const { registerUser, userLogin, changePassword, validateToken } = require("../controller/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authController = express.Router();



authController.post('/register',registerUser)
authController.post('/login',userLogin)
authController.post('/verify-token',authMiddleware,validateToken)
module.exports = authController;