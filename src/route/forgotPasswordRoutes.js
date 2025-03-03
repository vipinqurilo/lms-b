const express = require("express");
const {
  forgotPassword,
  resetPassword,
} = require("../controller/forgotPasswordController");
const router = express.Router();

// Route to send reset password link
router.post("/", forgotPassword);

// Route to reset the password
router.post("/:token", resetPassword);

passwordRouter = router; 

module.exports = passwordRouter;
