const express = require("express");
const { userAdd, userLogin } = require("../controller/authController");
const authController = express.Router();



authController.post('/register',userAdd)
authController.post('/login',userLogin)

module.exports = authController;