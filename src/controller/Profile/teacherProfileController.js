const CalenderModel = require("../../model/calenderModel");
const StudentProfileModel = require("../../model/studentProfileModel");
const TeacherProfileModel = require("../../model/teacherProfileModel");
const UserModel = require("../../model/UserModel");

exports.getTeacherProfile=async(req,res)=>{
    try {
        const teacherId=req.params.teacherId
        const teacherProfile= await TeacherProfileModel.findById(teacherId).populate({path:"userId",select:"email phone firstName lastName gender country bio profilePhoto"}).populate({path:"calendar",select:"availability"}).select(" -createdAt -updatedAt -_id -__v -paymentInfo").lean();
        res.json({
            success:true,
            message:"Teacher Profile fetched successfully",
            data:teacherProfile
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


exports.editSubjects=async(req,res)=>{
    try {
        const userId=req.user.id;
        const {subjectsTaught}=req.body;
        const user=await TeacherProfileModel.findOneAndUpdate({userId},{
            subjectsTaught,
        });
        if(!user)
           return  res.status(404).json({success:false,message:"User not found"})
        res.json({
            success:true,
            message:"Subjects Updated successfully",
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
exports.editLanguages=async(req,res)=>{
    try {
        const userId=req.user.id;
        const {languagesSpoken}=req.body;
        const user=await TeacherProfileModel.findOneAndUpdate({userId},{
            languagesSpoken,
        });
        if(!user)
           return  res.status(404).json({success:false,message:"User not found"})
        res.json({
            success:true,
            message:"Languages Updated successfully",
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
exports.editExperience=async(req,res)=>{
    try {
        const userId=req.user.id;
        const {experience,}=req.body;
        const user=await TeacherProfileModel.findOneAndUpdate({userId},{
            experience
        });
        if(!user)
            res.status(404).json({success:false,message:"User not found"})
        res.json({
            success:true,
            message:"Experience Updated successfully",
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
exports.editEducation=async(req,res)=>{
    try {
        const userId=req.user.id;
        const {education}=req.body;
        const user=await TeacherProfileModel.findOneAndUpdate({userId},{
            education
        });
        if(!user)
            res.status(404).json({success:false,message:"User not found"})
        res.json({
            success:true,
            message:"Eduation Updated successfully",
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
exports.editAvailabilityCalendar=async(req,res)=>{
    try {
        const userId=req.user.id;
        const teacherProfile=await TeacherProfileModel.findOne({userId});
        if(!teacherProfile)
            return res.json({success:false,message:"Teacher Profile not found"})
        const {availability}=req.body;
        const teacherCalendar=await CalenderModel.findOneAndUpdate({userId},{availability},{new:true})
        if(!teacherCalendar){
            const newTeacherCalendar =await CalenderModel.create({userId,availability});
            teacherProfile.calendar=newTeacherCalendar._id
            await teacherProfile.save();
        }
        res.json({  
            success:true,
            message:"Availablity Calendar Updated successfully",
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

exports.editPaymentInfo=async(req,res)=>{
    try {
        const userId=req.user.id;
        const {paymentInfo}=req.body;
        const user=await TeacherProfileModel.findOneAndUpdate({userId},{
           paymentInfo
        });
        if(!user)
            res.status(404).json({success:false,message:"User not found"})
        res.json({
            success:true,
            message:"Payment Info Updated successfully",
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