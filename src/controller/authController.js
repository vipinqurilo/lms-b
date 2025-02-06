const UserModel = require("../model/UserModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
exports.userAdd = async (req, res) => {
    try {
        const data = req.body;
        const userObj = {
            name: data.name,
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
            status:"failed",
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
            const match = await bcrypt.compare(data.password, user.password);
            if(match) {
                const token = jwt.sign({id:user._id, email: user.email, role: user.role }, process.env.JWT_SECRET);
                res.json({
                    status:"success",
                    message:"login successfully",
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