const TeacherModel=require("../model/teacherModel");
const CalendarModel=require("../model/calenderModel");
const {defaultAvailability}=require("../utils/calendar");
exports.addTeacher=async(req,res)=>{
    try {
        const data=req.body;
        const teacherObj={
            name:{
                firstName:data.firstName,
                lastName:data.lastName
            },
            phone:{
                countryCode:data.countryCode,
                number:data.number
            },
            email:data.email,
            // bio:data.bio,
            // subjectsTaught:data.subjectsTaught,
            // languageSpeaks:data.languageSpeaks,
        }
        const newTeacher=await TeacherModel.create(teacherObj);
        const newAvailabilityCalendar=await CalendarModel.create({teacherId:newTeacher._id,availability:defaultAvailability});
        console.log(newAvailabilityCalendar,"newAvailabityCalendar");
        newTeacher.availablityCalendar=newAvailabilityCalendar._id;
        newTeacher.save();
        if(newTeacher){
            res.json({
                status:"success",
                message:"Teacher created successfully",
                data:newTutor
            })
        }else{
            res.json({
                status:"failed",
                message:"Teacher not created",
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

exports.getTeachers=async(req,res)=>{
    try {
        const tutor=await TeacherModel.find({inactive:false,deletedaAt:null})
        res.json({
            success:true,
            message:"Teachers found successfully",
            data:tutor
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
exports.getTeacherById=async(req,res)=>{
    try {
        const {id}=req.params;
        const tutor=await TeacherModel.findById(id).populate("availablityCalendar").populate("subjectsTaught").populate("languageSpeaks");
        res.json({
            success:true,
            message:"Teacher found successfully",
            data:tutor
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

