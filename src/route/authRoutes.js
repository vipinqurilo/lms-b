const express = require("express");
const { registerUser, userLogin, changePassword } = require("../controller/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authController = express.Router();



authController.post('/register',registerUser)
authController.post('/login',userLogin)
authController.post('/verify-token',authMiddleware,(req,res)=>{
    res.json({success:true,message:"token verified",data:req.user})
})
module.exports = authController;