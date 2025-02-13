const CalenderModel = require("../../model/calenderModel");
const StudentProfileModel = require("../../model/studentProfileModel");
const TeacherProfileModel = require("../../model/teacherProfileModel");
const UserModel = require("../../model/UserModel");

exports.getTeacherProfile=async(req,res)=>{
    try {
        const teacherId=req.params.teacherId
        const teacherProfile = await TeacherProfileModel.aggregate([
            // Match the teacher by ID
            {
              $match: {
                _id: mongoose.Types.ObjectId(teacherId), // Convert teacherId to ObjectId
              },
            },
            // Lookup to populate userId
            {
              $lookup: {
                from: "users", // The collection name for the User model
                localField: "userId",
                foreignField: "_id",
                as: "userId",
              },
            },
            // Unwind the userId array (since $lookup returns an array)
            {
              $unwind: "$userId",
            },
            // Lookup to populate calendar
            {
              $lookup: {
                from: "calendars", // The collection name for the Calendar model
                localField: "calendar",
                foreignField: "_id",
                as: "calendar",
              },
            },
            // Unwind the calendar array
            {
              $unwind: "$calendar",
            },
            // Lookup to populate subjectsTaught
            {
              $lookup: {
                from: "subjects", // The collection name for the Subject model
                localField: "subjectsTaught",
                foreignField: "_id",
                as: "subjectsTaught",
              },
            },
            // Lookup to populate languagesSpoken
            {
              $lookup: {
                from: "languages", // The collection name for the Language model
                localField: "languagesSpoken",
                foreignField: "_id",
                as: "languagesSpoken",
              },
            },
            // Project the desired fields
            {
              $project: {
                createdAt: 0,
                updatedAt: 0,
                _id: 0,
                __v: 0,
                paymentInfo: 0,
                "userId._id": 0,
                "userId.__v": 0,
                "calendar._id": 0,
                "calendar.__v": 0,
                "subjectsTaught._id": 0,
                "subjectsTaught.__v": 0,
                "languagesSpoken._id": 0,
                "languagesSpoken.__v": 0,
                userId: {
                  email: 1,
                  phone: 1,
                  firstName: 1,
                  lastName: 1,
                  gender: 1,
                  country: 1,
                  bio: 1,
                  profilePhoto: 1,
                },
                calendar: {
                  availability: 1,
                },
                subjectsTaught: {
                  name: 1,
                  pricePerHour: 1,
                },
                languagesSpoken: {
                  name: 1,
                },
              },
            },
          ]);
          
          // Since aggregation returns an array, take the first element
          const result = teacherProfile[0];
        if(!teacherProfile)
            return  res.status(404).json({success:false,message:"User not found"})
        
        res.json({
            success:true,
            message:"Teacher Profile fetched successfully",
            data:result
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
exports.getAvailabilityCalendar=async(req,res)=>{
    try {
        const userId=req.user.id;
        const teacherCalendar=await CalenderModel.findOne({userId});
        if(!teacherCalendar)
            return res.json({success:false,message:"Availablity Calendar not found"})
        res.json({  
            success:true,
            message:"Availablity Calendar fetched successfully",
            data:teacherCalendar
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
        let teacherCalendar=await CalenderModel.findOneAndUpdate({userId},{availability},{new:true}).lean()
        console.log(teacherCalendar,"sdf");
        if(!teacherCalendar){
            teacherCalendar =await CalenderModel.create({userId,availability});
            teacherProfile.calendar=teacherCalendar._id
            await teacherProfile.save();
        }
        res.json({  
            success:true,
            message:"Availablity Calendar Updated successfully",
            data:teacherCalendar
      
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