const StudentProfileModel = require("../../model/studentProfileModel");
const TeacherProfileModel = require("../../model/teacherProfileModel");
const UserModel = require("../../model/UserModel");

exports.getMyProfile=async(req,res)=>{
    try {
        const userId=req.user.id;
        const role=req.user.role;
        console.log(role,"role")
        let profileData;
        const personalInfo=await UserModel.findById(userId).select("-password -createdAt -updatedAt -_id -__v").lean()
        if(role=="teacher")
        {
        const teacherProfile= await TeacherProfileModel.findOne({userId}).select(" -createdAt -updatedAt -_id -__v").lean();
           profileData={...personalInfo,...teacherProfile};
        }
        else if(role=="student"){
           const studentProfile=await StudentProfileModel.findOne({userId})
           profileData={...personalInfo,...studentProfile}
        }
        res.json({
            success:true,
            message:"Profile fetched successfully",
            data:profileData
        })
    } catch (error) {
        console.log(error);
        res.json({
            success:false,
            message:"Something went wrong",
            error:error.message
        })
    }
}

exports.editPersonalInfo=async(req,res)=>{
    try {
        const userId=req.user.id;
        const data=req.body;
        const user=await UserModel.findOne({_id:userId});
        if(!user){
            return res.status(404).json({
                success:true,
                message:"User not found"
            })
        }
        const updatedUser=await UserModel.findOneAndUpdate({_id:userId},{
            userName:data.userName,
            firstName:data.firstName,
            lastName:data.lastName,
            email:data.email,
            gender:data.gender,
            country:data.country,
            phone:data.phone,
            bio:data.bio
        },{
            new:true
            }).select("-password -_id -__v -updatedAt -createdAt")
        res.json({
            success:true,
            message:"Personal info updated successfully",
            data:updatedUser
        })
    } catch (error) {
        console.log(error);
        res.json({
            success:false,
            message:"Something went wrong",
            error:error.message
        })
    }
}
exports.editSocialLinks=async(req,res)=>{
    try {
        const userId=req.user.id;
        const {socialLinks}=req.body;
        const user=await UserModel.findOne({_id:userId});
        if(!user){
            return res.status(404).json({
                success:true,
                message:"User not found"
            })
        }
        const updatedUser=await UserModel.findOneAndUpdate({_id:userId},{
           socialLinks
        },{
            new:true
            }).select("-password -_id -__v -updatedAt -createdAt")
        res.json({
            success:true,
            message:"Social Media Links updated successfully",
        })
    } catch (error) {
        console.log(error);
        res.json({
            success:false,
            message:"Something went wrong",
            error:error.message
        })
    }
}
