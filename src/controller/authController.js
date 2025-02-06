const UserModel = require("../model/UserModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { isValidPassword, getPasswordHash } = require("../utils/password");
exports.userAdd = async (req, res) => {
    try {
        const data = req.body;
        const userObj = {
            firstName:data.firstName,
            lastName:data.lastName,
            email: data.email,
            password: data.password,
            role: data.role,
        }
        const userAdd = await UserModel.create(userObj);
        if(userAdd) {
            res.json({
                status:"success",
                message:"user added successfully",
                data:userAdd
            })
        }else{
            res.json({
                status:"failed",
                message:"user not added",
            })
        }
    } catch (error) {
        res.json({
            status:"error",
            message:"something went wrong",
            error:error.message
        })
    }
}

exports.userLogin = async (req, res) => {
    try {
        const data = req.body;
        const user = await UserModel.findOne({ email: data.email });
        if(user) {
            const match = isValidPassword(data.password, user.password);
            if(match) {
                const token = jwt.sign({ email: user.email, role: user.role,id:user._id }, process.env.JWT_SECRET);
                res.json({
                    status:"success",
                    message:"login successfully",
                    role:user.role,
                    token:token
                })
            }else{
                res.json({
                    status:"failed",
                    message:"password not matched",
                })
            }
        }else{
            res.json({
                status:"failed",
                message:"user not found",
            })
        }
    } catch (error) {
        console.log(error);
        res.json({
            status:"failed",
            message:"something went wrong",
            error:error.message
        })
    }
        }

exports.changePassword=async (req,res)=>{
    try
    {

        const userId=req.user.id;
        const {oldPassword,newPassword}=req.body;
        const user=await UserModel.findById(userId);
        if(!user)
            return res.json({success:false,messge:"User not found"})

        const isValid=isValidPassword(oldPassword,user.password);
        if(!isValid)
            return res.status(400).json({success:false,message:"Password is incorrect"})
        const hashedPassword= bcrypt.hashSync(newPassword,10);
        user.password=hashedPassword;
        await user.save();
         res.json({success:"true",message:"Password has been updated sucessfully"})
    }
    catch(e){
        console.log(e);
        res.json({success:"false",message:"Something went Wrong",error:e.message})
    }
}