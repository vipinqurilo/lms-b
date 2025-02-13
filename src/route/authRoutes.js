const express = require("express");
const { registerUser, userLogin, changePassword } = require("../controller/authController");
const { authMiddleware } = require("../middleware/authMiddleware");
const authController = express.Router();



authController.post('/register',registerUser)
authController.post('/login',userLogin)
authController.post('/verify-token',authMiddleware,(req,res)=>{
    res.json({success:true,message:"token verified",data:{
        _id:req.user._id,
        email:req.user.email,
        role:req.user.role,
        userStatus:req.user.userStatus
    },})
})
module.exports = authController;