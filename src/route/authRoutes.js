const express = require("express");
const { userAdd, userLogin, changePassword } = require("../controller/authController");
const authController = express.Router();



authController.post('/register',userAdd)
authController.post('/login',userLogin)

module.exports = authController;